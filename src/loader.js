(function() {
  "use strict";

  var createModule = function(name, requires, modules) {
    var moduleInstance = {
      name: name,
      requires: requires
    };
    modules[name] = moduleInstance;
    return moduleInstance;
  };

  var getModule = function(name, modules) {
    return modules[name];
  };


  var setupModuleLoader = function(window) {
    var ensure = function(obj, name, factory) {
      return obj[name] || (obj[name] = factory());
    };

    var angular = ensure(window, "angular", Object);


    ensure(angular, "module", function() {
      var modules = {};

      return function(name, requires) {
        if (requires) {

          return createModule(name, requires, modules);
        }
        else {
          return getModule(name, modules);
        }
      };
    });
  };


  window.setupModuleLoader = setupModuleLoader;
})();