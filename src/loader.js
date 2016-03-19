(function() {
  "use strict";

  var setupModuleLoader = function(window) {
    var ensure = function(obj, name, factory) {
      return obj[name] || (obj[name] = factory());
    };

    var angular = ensure(window, "angular", Object);

    ensure(angular, "module", function() {
      return function() {

      };
    });
  };


  window.setupModuleLoader = setupModuleLoader;
})();