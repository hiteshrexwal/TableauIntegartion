const tableauBaseUrl = 'https://prod-apnortheast-a.online.tableau.com'
const siteName = 'wearngeardesigns'
const NodeCache = require( "node-cache" );
const myCache = new NodeCache();

exports.tableauBaseUrl = tableauBaseUrl
exports.myCache = myCache
exports.siteName = siteName
