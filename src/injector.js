(function() {
  "use strict";

  // ascii puke from the angularJS source to detect the arguments on function "fn"
  // once fn.toString has been called
  var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
  // regex to match any whitespace at the start of end of a string
  var FN_ARG = /^\s*(\S+)\s*$/;


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
      if (Object.prototype.toString.call(fn) === "[object Array]") {
        return fn.slice(0, fn.length - 1);
      }
      else if (fn.$inject) {
        return fn.$inject;
      }
      else if (!fn.length) { //fn has no arguments
        return [];
      }
      else {
        var argDeclaration = fn.toString().match(FN_ARGS); //get arguments
        return argDeclaration[1].split(",").map(function(argName) {
          return argName.match(FN_ARG)[1]: []; //strip whitespace form args
        });
      }
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
      annotate: annotate,
      invoke: invoke,
    };
  };


  window.createInjector = createInjector;
})();