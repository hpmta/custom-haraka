// I know this is horrible, but it's the only way I found to test it :/
if (!process.env.TEST) var outbound = require('./outbound')


exports.register = function() {
    this.register_hook('get_mx', 'assign_ip_hook');
}

exports.assign_ip_hook = function (next, hmail, domain) {
    exports.ip_pool(function(err, ip_pool) {
        if (err) return next(902, err);
        random = Math.floor(Math.random()*100) % ip_pool.length;
        hmail.todo.notes.assigned_ip = ip_pool[random];
        exports.assign_ip(next, domain, ip_pool[random]);
    }, hmail.todo.notes.clientId);
}

exports.assign_ip = function (next, domain, ip) {
    if (process.env.TEST) var outbound = this.outbound;
    outbound.lookup_mx(domain, function (err, mxs) {
        if (err) return next(902, err);
        mxs.forEach(function (mx) {
            mx.bind = ip;
        });
        return next(900, mxs);
    });
}

exports.ip_pool = function (next, clientId) {
    var redis = this.server.notes.redis;
    redis.get('client_ip:'+ clientId, function(err, client_ip_pool){
        if (err) return next(err);
        if (client_ip_pool) {
            return next(null, JSON.parse(client_ip_pool));
        } else {
            redis.get('fallback_ip_pool', function(err, fallback_ip_pool){
                if (err) return next(err);
                if (fallback_ip_pool) {
                    return next(null, JSON.parse(fallback_ip_pool));
                } else {
                    return next('no IP address available');
                }
            })
        }
    })
}
