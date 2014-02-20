var util = require('util');
var redis = require('redis');

exports.register = function() {
    this.register_hook('init_master', 'connect_redis');
}

exports.connect_redis = function (next, server) {
  var config = this.config.get('redis.ini').main;
  server.notes.redis = redis.createClient(config.port, config.host);
  if (config.password) {
    server.notes.redis.auth(config.password);
  }
  this.loginfo("Redis connection established");
  next()
}
