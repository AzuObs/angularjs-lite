(function(exports) {
  "use strict";

  exports.hello = function(var_name) {
    return _.template("Hello, <%= name %>!")({ name: var_name });
  };

})(this);
