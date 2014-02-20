var logger      = require('./logger');
var net_utils = require('./net_utils');

var AUTH_COMMAND = 'AUTH';
var AUTH_METHOD_CRAM_MD5 = 'CRAM-MD5';
var AUTH_METHOD_PLAIN = 'PLAIN';
var AUTH_METHOD_LOGIN = 'LOGIN';
// Auth against a flat file

exports.register = function () {
    this.inherits('auth/auth_base');
    this.register_hook('capabilities','capabilities_tls');
    this.register_hook('capabilities','capabilities_auth');
    this.register_hook('unrecognized_command','unrecognized_command_tls');
    this.register_hook('unrecognized_command','unrecognized_command_auth');
};

exports.capabilities_tls = function (next, connection) {
    logger.logdebug("HOOK CAPABILITIES TLS");
    /* Caution: We cannot advertise STARTTLS if the upgrade has already been done. */
    if (connection.notes.tls_enabled !== 1) {
        connection.capabilities.push('STARTTLS');
        connection.notes.tls_enabled = 1;
    }
    /* Let the plugin chain continue. */
    next();
};

exports.capabilities_auth = function (next, connection) {
    logger.logdebug("HOOK CAPABILITIES AUTH");
    // don't allow AUTH unless private IP or encrypted
    if (!net_utils.is_rfc1918(connection.remote_ip) && !connection.using_tls) return next();
    if (connection.using_tls) {
        var methods = [ 'PLAIN', 'LOGIN', 'CRAM-MD5' ];
        connection.capabilities.push('AUTH ' + methods.join(' '));
        connection.notes.allowed_auth_methods = methods;
    }
    next();
};

exports.unrecognized_command_tls = function (next, connection, params) {
    logger.logdebug("THIS AINT WORKING!");
    /* Watch for STARTTLS directive from client. */
    if (params[0] === 'STARTTLS') {
      logger.logwarn("UNRECOGNIZED COMMAND TLS");
        var key = this.config.get('tls_key.pem', 'data').join("\n");
        var cert = this.config.get('tls_cert.pem', 'data').join("\n");
        var options = { key: key, cert: cert, requestCert: true };

        /* Respond to STARTTLS command. */
        connection.respond(220, "Go ahead.");
        /* Upgrade the connection to TLS. */
        var self = this;
        connection.client.upgrade(options, function (authorized, verifyError, cert, cipher) {
            connection.reset_transaction();
            connection.hello_host = undefined;
            connection.using_tls = true;
            connection.notes.tls = {
                authorized: authorized,
                authorizationError: verifyError,
                peerCertificate: cert,
                cipher: cipher
            };
            connection.loginfo(self, 'secured:' +
                ((cipher) ? ' cipher=' + cipher.name + ' version=' + cipher.version : '') +
                ' verified=' + authorized +
                ((verifyError) ? ' error="' + verifyError + '"' : '' ) +
                ((cert && cert.subject) ? ' cn="' + cert.subject.CN + '"' +
                ' organization="' + cert.subject.O + '"' : '') +
                ((cert && cert.issuer) ? ' issuer="' + cert.issuer.O + '"' : '') +
                ((cert && cert.valid_to) ? ' expires="' + cert.valid_to + '"' : '') +
                ((cert && cert.fingerprint) ? ' fingerprint=' + cert.fingerprint : ''));
            return next();  // Return OK as we responded to the client
        });
    }
    else {
        return next();
    }
};

exports.unrecognized_command_auth = function (next, connection, params) {
    logger.logdebug("UNRECOGNIZED COMMAND AUTH");
    logger.logdebug(params);
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
