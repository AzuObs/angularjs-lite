(function() {
  "use strict";

  function $CompileProvider($provide) {
    var hasDirectives = {};

    this.directive = function(name, directiveFactory) {
      if (typeof name === "string") {
        if (name === "hasOwnProperty") {
          throw "hasOwnProperty is not a valid directive name";
        }
        if (!hasDirectives.hasOwnProperty(name)) {
          hasDirectives[name] = [];

          // this allows one directive name to hold several directive declarations
          // and it will return the directives, not that directives are hence never held in the providers,
          // instead it is this "providing" function that is
          $provide.factory(name + "Directive", ["$injector", function($injector) {
            var factories = hasDirectives[name];

            return factories.map(function(factory) {
              return $injector.invoke(factory);
            });
          }]);
        }
        hasDirectives[name].push(directiveFactory);
      }

      // support the unusual way of creating directives by object
      else {
        Object.keys(name).forEach(function(k) {
          // (name, directiveFn)
          this.directive(k, name[k]);
        }, this);
      }
    };

    this.$get = function() {
      return "";
    };
  }
  $CompileProvider.$inject = ["$provide"];


  window.$CompileProvider = $CompileProvider;
})();
