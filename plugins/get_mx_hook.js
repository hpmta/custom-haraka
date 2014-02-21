var outbound = require('./outbound');
var util = require('util');


var i = 0;
var ips = ['127.0.0.1', '127.0.0.2', '127.0.0.3'];

exports.hook_get_mx = function (next, hmail, domain) {
    hmail.todo.notes.ip = '127.0.0.1';
    this.lognotice("notes: " + hmail.todo.notes.clientId);
    this.lognotice("notes: " + util.inspect(hmail.todo.notes));

    outbound.lookup_mx(domain, function (err, mxs) {
        if (err) return next(DENY, err);
        // TODO: decide which outbound IP to use. For argument I'll use round-robin here.
        mxs.forEach(function (mx) {
            mx.bind = ips[i];
            i++;
            if (i == ips.length) i = 0;
        });
        // add IP to hmail.todo.notes.ip
        next(OK, mxs);
    })
}
