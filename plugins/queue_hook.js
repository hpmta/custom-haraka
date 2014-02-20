exports.hook_data_post = function(next, connection) {
  connection.transaction.notes.clientId = connection.transaction.header.get("X-Mailee-clientId");
  connection.transaction.notes.deliveryId = connection.transaction.header.get("X-Mailee-deliveryId");
  return next(OK);
}
