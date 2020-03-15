const redis = require("redis");
const client = redis.createClient({ detect_buffers: true });
 
// client.set("foo_rand000000000000", "OK");
 
// This will return a JavaScript String
client.get("foo_rand000000000000", function(err, reply) {
  console.log(reply.toString()); // Will print `OK`
});