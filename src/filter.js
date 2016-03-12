(function() {
  "use strict";

  var filters = {};

  window.register = function(name, factory) {
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


  window.filter = function(name) {
    return filters[name];
  };
})();
