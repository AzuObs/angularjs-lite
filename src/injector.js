(function() {
  "use strict";

  var createInjector = function(modulesToLoad) {
    // holds copies of the already built module components
    var cache = {};
    // keeps track of the loaded modules to avoid conflicts if two modules reference
    // each other
    var loadedModules = {};


    // builds the module components (constant, value, service, factory, controller, directive)
    var $provide = {
      constant: function(key, value) {
        if (key === "hasOwnProperty") {
          throw "hasOwnProperty is not a valid constant name!";
        }
        cache[key] = value;
      }
    };


    // will call fn and pass it as its own arguments the elements held in fn.$inject
    var invoke = function(fn, self, locals) {
      var args = fn.$inject.map(function(token) {
        if (typeof token === "string") {
          return locals && locals.hasOwnProperty(token) ?
            locals[token] : cache[token];
        }
        else {
          throw "Incorrect injection token! Expected a string, got " + token;
        }
      });
      return fn.apply(self, args);
    };


    var annotate = function(fn) {
      return fn.$inject;
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

      invoke: invoke,

      annotate: annotate
    };
  };


  window.createInjector = createInjector;
})();