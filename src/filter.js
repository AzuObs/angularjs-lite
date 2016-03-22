(function() {
  "use strict";

  function $filterProvider($provide) {

    this.register = function(name, factory) {
      if (name && mixin.isObjectLike(name)) { // if name is an object
        return Object.keys(name).map(function(key) { // map object
          return this.register(key, name[key]);
        }, this);
      }
      else { // if name is a string
        return $provide.factory(name + "Filter", factory);
      }
    };


    this.$get = ["$injector", function($injector) {
      return function filter(name) {
        return $injector.get(name + "Filter");
      };
    }];
  }

  $filterProvider.$inject = ["$provide"];


  window.$filterProvider = $filterProvider;
})();