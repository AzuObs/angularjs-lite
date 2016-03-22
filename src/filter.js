(function() {
  "use strict";

  function $filterProvider($provide) {
    var filters = {};

    this.register = function(name, factory) {
      if (name && mixin.isObjectLike(name)) { // if name is an object
        return Object.keys(name).map(function(key) { // map object
          return this.register(key, name[key]);
        }, this);
      }
      else { // if name is a string
        var filter = factory();
        filters[name] = filter;
        return $provide.factory(name + "Filter", factory);
      }
    };


    this.$get = function() {
      return function filter(name) {
        return filters[name];
      };
    };
  }

  $filterProvider.$inject = ["$provide"];


  window.$filterProvider = $filterProvider;
})();