(function() {
  "use strict";

  var createInjector = function(modulesToLoad) {
    var cache = {};
    var loadedModules = {};

    var $provide = {
      constant: function(key, value) {
        if (key === "hasOwnProperty") {
          throw "hasOwnProperty is not a valid constant name!";
        }
        cache[key] = value;
      }
    };


    var invoke = function(fn) {
      var args = fn.$inject.map(function(moduleName) {
        return cache[moduleName];
      });
      return fn.apply(null, args);
    };

    // load each module
    modulesToLoad.forEach(function loadModule(moduleName) {
      if (!loadedModules.hasOwnProperty(moduleName)) {
        loadedModules[moduleName] = true;
        var module = angular.module(moduleName);

        // load each dependency
        module.requires.forEach(loadModule);

        // load each component
        module._invokeQueue.forEach(function(invokeArgs) {
          var method = invokeArgs[0];
          var args = invokeArgs[1];

          // build the components
          $provide[method].apply($provide, args);
        });
      }
    });

    return {
      has: function(key) {
        return cache.hasOwnProperty(key);
      },

      get: function(key) {
        return cache[key];
      },

      invoke: invoke
    };
  };


  window.createInjector = createInjector;
})();