exports.register = function() {
    this.register_hook('data_post', 'add_info');
}


exports.add_info = function(next, connection) {
    // sorry, I had to do this for tests
    if(this.DENY) {
      var DENY = this.DENY
    }
    if(!connection.transaction.header.get("X-Mailee-clientId")) {
      return next(DENY, "Your message must contain header X-Mailee-clientId")
    }
    if(!connection.transaction.header.get("X-Mailee-deliveryToken")) {
      return next(DENY, "Your message must contain header X-Mailee-deliveryToken")
    }
    connection.transaction.notes.clientId = connection.transaction.header.get("X-Mailee-clientId");
    connection.transaction.notes.deliveryToken = connection.transaction.header.get("X-Mailee-deliveryToken");
    return next();
}
