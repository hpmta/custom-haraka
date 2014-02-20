exports.register = function() {
    this.register_hook('data_post', 'add_info');
}


exports.add_info = function(next, connection) {
    if(!connection.transaction.header.get("X-Mailee-clientId")) {
      return next(902, "Your message must contain header X-Mailee-clientId");
    }
    if(!connection.transaction.header.get("X-Mailee-deliveryToken")) {
      return next(902, "Your message must contain header X-Mailee-deliveryToken");
    }
    connection.transaction.notes.clientId = connection.transaction.header.get("X-Mailee-clientId").replace("\n","");
    connection.transaction.notes.deliveryToken = connection.transaction.header.get("X-Mailee-deliveryToken").replace("\n","");
    return next();
}
