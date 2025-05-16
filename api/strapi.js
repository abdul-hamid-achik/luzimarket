const serverless = require('serverless-http');
const Strapi = require('@strapi/strapi').default;
const path = require('path');

let handler;

module.exports = async function (req, res) {
    if (!handler) {
        const strapi = await Strapi({
            dir: path.resolve(__dirname, '../apps/strapi'),
        }).load();
        handler = serverless(strapi.server);
    }
    // strip /strapi prefix so Strapi sees correct paths
    req.url = req.url.replace(/^\/strapi/, '');
    return handler(req, res);
}; 