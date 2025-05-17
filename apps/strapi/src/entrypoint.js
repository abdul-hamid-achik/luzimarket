const serverless = require('serverless-http');
const Strapi = require('@strapi/strapi').default;
const path = require('path');

let handler;

module.exports = async (req, res) => {
    if (!handler) {
        // Initialize Strapi server once
        const strapi = await Strapi({
            dir: path.resolve(__dirname, '..'), // resolve to apps/strapi
        }).load();
        handler = serverless(strapi.server);
    }
    // Strip the /strapi prefix
    req.url = req.url.replace(/^\/strapi/, '');
    return handler(req, res);
}; 