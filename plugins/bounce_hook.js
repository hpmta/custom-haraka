var util = require('util');

exports.hook_bounce = function(next, hmail, err) {
  this.logwarn(hmail.todo.notes.clientId);
  this.logwarn(hmail.todo.notes.deliveryId);

  this.logwarn(util.inspect(this));
  this.logwarn(util.inspect(hmail));

  this.logwarn(hmail.bounce_error);

  // retval != constants.cont
  // retval === constants.stop
  // try next(DENY);

  return next(901);
}

