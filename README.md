# Gatsby Source Ghosted-Mediawiki

Source plugin for pulling data into Gatsby.js from Mediawiki, using the bot mwnode. The resulting data implement a Ghost-like API.

## Install


If you want to add this source to your gatsby project, retreive the package :

`yarn add git+https://github.com/PascalNoisette/gatsby-source-ghostedmediawiki`

Then, install the plugin in your gatsby-config as a replacement for gatsby-source-ghost :
```
const mediawikiConfig = require(`./.mediawiki`)
    ...
{
   resolve: `gatsby-source-ghostedmediawiki`,
   options: mediawikiConfig,
},
```
Supply the information to connect to the mediawiki backend in a .mediawiki.json file.

| Field        | Example Value            | Description                                                                       |
|--------------|--------------------------|-----------------------------------------------------------------------------------|
| server       | your.mediawiki.com       | Domain name                                                                       |
| username     | OriginalUsername@Botname | You may generate a bot from here https://your.mediawiki.com/Special:BotPasswords  |
| password     | Botpassword              | Bot's password                                                                    |
| rootCategory | Featured                 | Bot will crawl mediawiki from the root and create page from here                 |


```
{
    "protocol" : "https",
    "server" : "localhost",
    "username": "botname",
    "password":  "botpassword",
    "path": "",
    "debug": true,
    "userAgent": "Gatsby",
    "title" : "MediaWiki meets Gatsby",
    "description" : "Mediawiki with Gatsby frontend",
    "lang":"FR",
    "timezone":"GMT+2",
    "codeinjection_head":"",
    "codeinjection_foot":"",
    "codeinjection_styles":"",
    "rootCategoryOld": "Syntax_Help",
    "rootCategory": "Featured",
    "navigation" : [
      {
        "label":"Home",
        "url":"/"
      }
  ]
}

```

## Compatibility

This source is compatible with the official starter https://github.com/TryGhost/gatsby-starter-ghost or with my blog https://github.com/PascalNoisette/gatsby-starter-ghostedmediawiki