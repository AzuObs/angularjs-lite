(function() {
  "use strict";

  function $filterProvider() {
    var filters = {};

    this.register = function(name, factory) {
      var self = this;
      if (name && mixin.isObjectLike(name)) { // if name is an object
        return Object.keys(name).map(function(key) { // map object
          return self.register(key, name[key]);
        });
      }
      else { // if name is a string
        var filter = factory();
        filters[name] = filter;
        return filter;
      }
    };


    this.$get = function() {
      return function filter(name) {
        return filters[name];
      };
    };
  }

  window.$filterProvider = $filterProvider;
})();