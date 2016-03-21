(function() {
  "use strict";

  // ascii puke from the angularJS source to detect the arguments on function "fn"
  // once fn.toString has been called
  var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
  // regex to match any whitespace at the start of end of a string
  var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
  //removes comments form a string
  var STRIP_COMMENTS = /(\/\/.*$)|(\/\*.*?\*\/)/mg;
  // placeholder to keep tracked of components being instantiated to avoid circular references
  var INSTANTIATING = {};


  var createInjector = function(modulesToLoad, strictDi) {
    // holds copies of the already built module components
    var instanceCache = {};
    // hold copies of the provider definition - used for lazy-loading. aka just-on-time loading
    var providerCache = {};
    // keeps track of the loaded modules to avoid circular referencing of modules
    var loadedModules = {};
    // the stack of components that we are traversing
    var path = [];
    strictDi = !!strictDi;

    // builds the module components (constant, value, service, factory, controller, directive)
    // $provide is called during module instantiation
    var $provide = {
      constant: function(key, value) {
        if (key === "hasOwnProperty") {
          throw "hasOwnProperty is not a valid constant name!";
        }
        instanceCache[key] = value;
      },
      provider: function(key, provider) {
        if (typeof provider === "function") {
          provider = instantiate(provider);
        }
        providerCache[key + "Provider"] = provider;
      }
    };


    var getService = function(name) {
      if (instanceCache.hasOwnProperty(name)) {
        if (instanceCache[name] === INSTANTIATING) {
          throw new Error("Circular dependency found: " + name + " <- " + path.join(" <- "));
        }
        return instanceCache[name];
      }
      else if (providerCache.hasOwnProperty(name + "Provider")) {
        path.unshift(name);
        instanceCache[name] = INSTANTIATING;
        try {
          var provider = providerCache[name + "Provider"];
          var instance = instanceCache[name] = invoke(provider.$get);
          return instance;
        }
        finally {
          path.shift();
          // if instantitation failed, then delete the placeholder "INSTANTIATING"
          if (instanceCache[name] === INSTANTIATING) {
            delete instanceCache[name];
          }
        }
      }
    };


    // returns an array containing the fn dependencies. eg ["$scope", "$log"] 
    // annotate is called during component invokation
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
        if (strictDi) {
          throw "fn is not using explicit annotation and cannot be invoked in strict mode";
        }
        var source = fn.toString().replace(STRIP_COMMENTS, "");
        var argDeclaration = source.match(FN_ARGS); //get arguments
        return argDeclaration[1].split(",").map(function(argName) {
          return argName.match(FN_ARG)[2]; //strip whitespace and _arg_ (underscores) form args
        });
      }
    };

    // will call fn and will inject the arguments/arguments
    // invoke is called during instantiation
    var invoke = function(fn, self, locals) {
      var args = annotate(fn).map(function(token) {
        if (typeof token === "string") {
          return locals && locals.hasOwnProperty(token) ?
            locals[token] : getService(token);
        }
        else {
          throw "Incorrect injection token! Expected a string, got " + token;
        }
      });

      //if fn was annotate eg ['a','b', function(a,b){...}]
      if (Object.prototype.toString.call(fn) === "[object Array]") {
        fn = fn[fn.length - 1];
      }

      return fn.apply(self, args);
    };


    var instantiate = function(Type, locals) {
      var UnwrappedType = Object.prototype.toString.call(Type) === "[object Array]" ?
        Type[Type.length - 1] : Type;
      var instance = Object.create(UnwrappedType.prototype);

      invoke(Type, instance, locals);
      return instance;
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
        return instanceCache.hasOwnProperty(key) ||
          providerCache.hasOwnProperty(key + "Provider");
      },
      get: function(key) {
        return getService(key);
      },
      annotate: annotate,
      invoke: invoke,
      instantiate: instantiate
    };
  };


  window.createInjector = createInjector;
})();