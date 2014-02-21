var util = require('util');

exports.register = function() {
    this.register_hook('queue_outbound', 'processed_hook');
    this.register_hook('bounce', 'bounce_hook');
    this.register_hook('deferred', 'deferred_hook');
    this.register_hook('delivered', 'delivered_hook');
}

exports.processed_hook = function (next, hmail, params) {
    exports.write_log(next, hmail, params, 'processed')
}

exports.bounce_hook = function (next, hmail, params) {
    exports.write_log(next, hmail, params, 'bounce')
}


exports.deferred_hook = function (next, hmail, params) {
    exports.write_log(next, hmail, params, 'deferred')
}

exports.delivered_hook = function (next, hmail, params) {
    exports.write_log(next, hmail, params, 'delivered')
}

exports.write_log = function (next, hmail, params, event) {
    if (hmail.transaction) {
      var info = hmail.transaction;
    } else {
      var info = hmail.todo;
    }

    var log = {
      event: event,
      timestamp: (new Date()).toJSON(),
      delivery: info.notes.deliveryToken,
      client: info.notes.clientId,
      email: info.rcpt_to[0].original,
      host: info.rcpt_to[0].host
    };

    if (info.notes.ip) {
      log.assigned_ip = info.notes.ip
    }

    if (info.uuid) {
      log.uuid = info.uuid
    }

    if (log.uuid && info.header && info.header.get('Authentication-Results')) {
      log.message_id = '<'+log.uuid+'@'+info.header.get('Authentication-Results')+'>'
    }
    switch(event) {
      case 'bounce':
        log.err = params;
        break;
      case 'delivered':
        log.mx_ip = params[1];
        log.response = params[2];
        log.delay = params[3];
        break;
      case 'deferred':
        log.delay = params.delay;
        log.err = params.err;
        break;
    };
    this.lognotice(JSON.stringify(log));

    next()
}

