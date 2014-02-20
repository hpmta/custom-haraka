var util = require('util');

//exports.register = function () {
    //this.register_hook('deferred, 'deferred_hook');
//};

exports.hook_deferred = function (next, hmail, params) {
    this.loginfo("RUNNING DEFERRED HOOK! ZOMG!")
    //this.loginfo(util.inspect(this));
    //this.loginfo(util.inspect(hmail));
    //this.loginfo(util.inspect(params));
    return next();

}



