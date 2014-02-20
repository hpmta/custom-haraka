// Auth against a flat file
var net_utils = require('./net_utils');
var logger = require('./logger');

var crypto = require('crypto');
var AUTH_COMMAND = 'AUTH';
var AUTH_METHOD_CRAM_MD5 = 'CRAM-MD5';
var AUTH_METHOD_PLAIN = 'PLAIN';
var AUTH_METHOD_LOGIN = 'LOGIN';
var LOGIN_STRING1 = 'VXNlcm5hbWU6'; //UserLogin: base64 coded
var LOGIN_STRING2 = 'UGFzc3dvcmQ6'; //Password: base64 coded

exports.register = function () {
    this.inherits('auth/auth_base');
}

exports.hook_capabilities = function (next, connection) {
    logger.logwarn("HOOK CAPABILITIES!")
    // don't allow AUTH unless private IP or encrypted
    if (!net_utils.is_rfc1918(connection.remote_ip) && !connection.using_tls) return next();
    logger.logwarn("PASS TLS E IP")
    var config = this.config.get('auth_flat_file.ini');
    var methods = (config.core && config.core.methods ) ? config.core.methods.split(',') : null;
    logger.logwarn(methods)
    if(methods && methods.length > 0) {
        connection.capabilities.push('AUTH ' + methods.join(' '));
        connection.notes.allowed_auth_methods = methods;
    }
    next();
};

exports.hook_unrecognized_command = function (next, connection, params) {
    logger.logwarn("HOOK UNREC");
    logger.logwarn(params);

    if(params[0].toUpperCase() === AUTH_COMMAND && params[1]) {
        return this.select_auth_method(next, connection, params.slice(1).join(' '));
    }
    else if (connection.notes.authenticating &&
             connection.notes.auth_method === AUTH_METHOD_CRAM_MD5 &&
             connection.notes.auth_ticket)
    {
        return this.auth_cram_md5(next, connection, params);
    }
    else if (connection.notes.authenticating &&
             connection.notes.auth_method === AUTH_METHOD_LOGIN)
    {
        return this.auth_login(next, connection, params);
    }
    else if (connection.notes.authenticating &&
             connection.notes.auth_method === AUTH_METHOD_PLAIN)
    {
        return this.auth_plain(next, connection, params);
    }
    return next();
}

exports.select_auth_method = function(next, connection, method) {
    var split = method.split(/\s+/);
    method = split.shift().toUpperCase();
    logger.logwarn(method);
    var params = split;
    if(connection.notes.allowed_auth_methods &&
       connection.notes.allowed_auth_methods.indexOf(method) !== -1)
    {
        connection.notes.authenticating = true;
        connection.notes.auth_method = method;
        if(method === AUTH_METHOD_PLAIN) {
            return this.auth_plain(next, connection, params);
        }
        else if(method === AUTH_METHOD_LOGIN) {
            return this.auth_login(next, connection, params);
        }
        else if( method === AUTH_METHOD_CRAM_MD5) {
            return this.auth_cram_md5(next, connection);
        }
    }
    return next();
}
exports.auth_login = function(next, connection, params) {
    logger.logwarn("AUTH LOGIN METHOD")
    logger.logwarn(connection.notes)
    logger.logwarn(params)
    if ((!connection.notes.auth_login_asked_login && params[0]) ||
        (connection.notes.auth_login_asked_login && !connection.notes.auth_login_userlogin))
    {
        var login = unbase64(params[0]);
        connection.respond(334, LOGIN_STRING2, function () {
            connection.notes.auth_login_userlogin = login;
            connection.notes.auth_login_asked_login = true;
            return next(OK);
        });
        return;
    }
    else if (connection.notes.auth_login_userlogin) {
        var credentials = [
		        connection.notes.auth_login_userlogin,
		        unbase64(params[0])
	        ];
        return this.check_user(next, connection, credentials, AUTH_METHOD_LOGIN);
    }

    connection.respond(334, LOGIN_STRING1, function () {
        connection.notes.auth_login_asked_login = true;
        return next(OK);
    });
}
exports.get_plain_passwd = function (user, cb) {
    logger.logwarn("THIS AINT RUNNIN");
    var config = this.config.get('auth_flat_file.ini');
    if (config.users[user]) {
        return cb(config.users[user]);
    }
    return cb();
}
