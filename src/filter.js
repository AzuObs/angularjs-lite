(function() {
  "use strict";

  var filters = {};

  var register = function(name, factory) {
    if (name && mixin.isObjectLike(name)) { // if name is an object
      return Object.keys(name).map(function(key) { // map object
        return register(key, name[key]);
      });
    }
    else { // if name is a string
      var filter = factory();
      filters[name] = filter;
      return filter;
    }
  };


  var filter = function(name) {
    return filters[name];
  };


  window.register = register;
  window.filter = filter;
})();