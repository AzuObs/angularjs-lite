(function() {
  "use strict";

  var setupModuleLoader = function(window) {
    var ensure = function(obj, name, factory) {
      return obj[name] || (obj[name] = factory());
    };

    var angular = ensure(window, "angular", Object);
  };


  window.setupModuleLoader = setupModuleLoader;
})();