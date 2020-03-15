const tableauBaseUrl = 'https://prod-apnortheast-a.online.tableau.com'
const siteName = 'ibizsoftsolutions'
const NodeCache = require( "node-cache" );
const redis = require("redis");
const redisClient = redis.createClient({ detect_buffers: true });
const myCache = new NodeCache();

exports.tableauBaseUrl = tableauBaseUrl
exports.myCache = myCache
exports.siteName = siteName
exports.redisClient = redisClient