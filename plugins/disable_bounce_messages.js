exports.register = function() {
    this.register_hook('bounce', 'disable_bounce_message');
}

exports.disable_bounce_message = function (next) {
  next(DENY);
}

