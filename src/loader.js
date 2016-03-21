(function() {
  "use strict";

  var createModule = function(name, requires, modules) {
    if (name === "hasOwnProperty") {
      throw "hasOwnProperty is not a valid module name!";
    }

    var invokeQueue = [];
    var invokeLater = function(method, arrayMethod) {
      return function() {
        invokeQueue[arrayMethod || "push"]([method, arguments]);

        // return module instance so that method chaining is possible
        // eg angular.module("a",[]).constant("b", 1).provider("c", fn) 
        return moduleInstance;
      };
    };

    var moduleInstance = {
      name: name,
      requires: requires,
      constant: invokeLater("constant", "unshift"),
      provider: invokeLater("provider"),
      _invokeQueue: invokeQueue
    };

    modules[name] = moduleInstance;
    return moduleInstance;
  };


  var getModule = function(name, modules) {
    if (modules.hasOwnProperty(name)) {
      return modules[name];
    }
    else {
      throw "Module " + name + " is not available!";
    }
  };


  var setupModuleLoader = function(window) {
    var ensure = function(obj, name, factory) {
      return obj[name] || (obj[name] = factory());
    };

    // create window.angular
    var angular = ensure(window, "angular", Object);

    // create angular.module
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