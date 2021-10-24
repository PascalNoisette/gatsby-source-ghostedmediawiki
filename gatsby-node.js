/****
 * gatsby-node.js
 *
 * Generate Gatsby nodes based on a custom schema derived from Mediawiki.
 */

const Promise = require('bluebird');
const Bot = require('nodemw');
const util = require('util');

const {
    PostNode,
    PageNode,
    TagNode,
    AuthorNode,
    SettingsNode
} = require('../gatsby-source-ghost/ghost-nodes');
const _ = require(`lodash`);
const cheerio = require(`cheerio`);

/**
 * Import all custom ghost types.
 */
const ghostTypes = require('../gatsby-source-ghost/ghost-schema');

/**
 * Extract specific tags from html and return them in a new object.
 *
 * Only style tags are extracted at present.
 */
const parseCodeinjection = (html) => {
    let $ = null;

    /**
     * Attempt to load the HTML into cheerio. Do not escape the HTML.
     */
    try {
        $ = cheerio.load(html, {decodeEntities: false});
    } catch (e) {
        return {};
    }

    /**
     * Extract all style tags from the markup.
     */
    const $parsedStyles = $(`style`);
    const codeInjObj = {};

    /**
     * For each extracted tag, add or append the tag's HTML to the new object.
     */
    $parsedStyles.each((i, style) => {
        if (i === 0) {
            codeInjObj.styles = $(style).html();
        } else {
            codeInjObj.styles += $(style).html();
        }
    });

    return codeInjObj;
};

/**
 * Extracts specific tags from the code injection header and footer and
 * transforms posts to include extracted tags as a new key and value in the post object.
 *
 * Only the `codeinjection_styles` key is added at present.
 */
const transformCodeinjection = (post) => {
    post.url = post.pageid;
    post.id = post.pageid;
    post.uuid = post.pageid;
    post.name = post.title;
    
    post.visibility = "public";
    post.feature_image = "";
    post.featured=false;
    post.excerpt =  "";
    post.created_at = "2021-10-10";
    
    const allCodeinjections = [
        post.codeinjection_head,
        post.codeinjection_foot
    ].join('');

    if (!allCodeinjections) {
        return post;
    }

    const headInjection = parseCodeinjection(allCodeinjections);

    if (_.isEmpty(post.codeinjection_styles)) {
        post.codeinjection_styles = headInjection.styles;
    } else {
        post.codeinjection_styles += headInjection.styles;
    }

    return post;
};


 
/**
 * Create Live Ghost Nodes
 * Uses the Ghost Content API to fetch all posts, pages, tags, authors and settings
 * Creates nodes for each record, so that they are all available to Gatsby
 */
exports.sourceNodes = ({actions, createNodeId}, configOptions) => {
    const {createNode} = actions;

    const api = new Bot(configOptions);

    const ignoreNotFoundElseRethrow = (err) => {
        //if (err && err.response && err.response.status !== 404) {
            throw err;
        //}
    };

    const login = configOptions.username ? util.promisify(api.logIn).bind(api) : Promise.resolve;
    Object.getOwnPropertyNames(Object.getPrototypeOf(api))
          .filter(item => typeof api[item] === 'function')
          .map(method => {
            try {api[`${method}Async`] = util.promisify(api[method])
        } catch(e) {}
        }
    );


    const knownCategorySlug = [];
    const knownAuthors = [];
    const fetchPosts = login()
        .then(()=>api.getPagesInCategoryAsync(configOptions.rootCategory))
        .then((posts) => Promise.all(posts.map(async post=>{
            const revisions = await api.getArticleRevisionsAsync(post.title);
            revisions.map((revision)=>{
                const author = {
                    slug:revision.user,
                    id:revision.user,
                    name: revision.user,
                    url: `/author/${revision.user}`,
                    count: {post:1},
                    postCount: 1
                };
                if (!knownAuthors.includes(author.slug)) {
                    createNode(AuthorNode(author));
                    knownAuthors.push(author.slug);
                }
                post.primary_author = author;
                post.authors = author;
            })
            return post;
        })))
        .then((posts) => Promise.all(posts.map(async post=>{
            post.html = await api.parseAsync(await api.getArticleAsync(post.title), post.title)
            if (post.title.match(/Category/) && !knownCategorySlug.includes(post.slug)) {
                post.title = post.title.replace(/Category:/,"");
                post.slug = `${post.title}`;
                createNode(TagNode(transformCodeinjection(post)))
                configOptions.navigation.push({
                    "label":post.title,
                    "url":`/tag/${post.slug}`
                  })
                knownCategorySlug.push(post.slug)
            }
            return post;
        })))
        .then((posts) => Promise.all(posts.map(async post=>{
            if (!knownCategorySlug.includes(post.slug)) {
                const category = await api.getArticleCategoriesAsync(post.title);
                post.slug = `post/${post.title}`;
                post.tags = category
                    .map(c=>c.replace(/Category:/,""))
                    .filter(c=>c!=configOptions.rootCategory)
                    .filter(c=>knownCategorySlug.includes(c))
                    .map(c=>{return {slug:c}});
                    
                createNode(PostNode(transformCodeinjection(post)))
            }
            return post;
        })))
        .then(()=>{
            delete configOptions.username;
            delete configOptions.password;
            createNode(SettingsNode(configOptions))
        })
        .catch(ignoreNotFoundElseRethrow);

    

    return Promise.all([
       fetchPosts
    ]);
};

/**
 * Creates custom types based on the Ghost V3 API.
 *
 * This creates a fully custom schema, removing the need for dummy content or fake nodes.
 */
exports.createSchemaCustomization = ({actions}) => {
    const {createTypes} = actions;
    createTypes(ghostTypes);
};
