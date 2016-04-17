(function() {
  "use strict";

  var $ = require("jquery");


  // ascii puke from the angularJS source to detect the arguments on function "fn"
  // once fn.toString has been called
  var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
  // regex to match any whitespace at the start of end of a string
  var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
  //removes comments form a string
  var STRIP_COMMENTS = /(\/\/.*$)|(\/\*.*?\*\/)/mg;
  // placeholder to keep tracked of components being instantiated to avoid circular references
  var INSTANTIATING = {};


  function createInjector(modulesToLoad, strictDi) {
    var providerCache = {};
    // will allow users to acces providerInjector from their providers
    var providerInjector = providerCache.$injector =
      createInternalInjector(providerCache, function() {
        throw "Unknown provider: " + path.join(" <- ");
      });

    var instanceCache = {};
    // will allow users to access instanceInjector from their instances
    var instanceInjector = instanceCache.$injector =
      createInternalInjector(instanceCache, function(name) {
        var provider = providerInjector.get(name + "Provider");
        return instanceInjector.invoke(provider.$get, provider);
      });

    var loadedModules = new HashMap();
    var path = [];
    strictDi = !!strictDi;


    function enforceReturnValue(factoryFn) {
      return function() {
        var value = instanceInjector.invoke(factoryFn);
        if (value === undefined) {
          throw "factory must return a value";
        }
        return value;
      };
    }


    // builds the module components (constant, value, service, factory, controller, directive)
    // $provide is called during module instantiation
    providerCache.$provide = {
      constant: function(key, value) {
        if (key === "hasOwnProperty") {
          throw "hasOwnProperty is not a valid constant name!";
        }
        providerCache[key] = value;
        instanceCache[key] = value;
      },
      provider: function(key, provider) {
        if (typeof provider === "function") {
          provider = providerInjector.instantiate(provider);
        }
        providerCache[key + "Provider"] = provider;
      },
      factory: function(key, factoryFn, enforce) {
        this.provider(key, {
          $get: enforce === false ? factoryFn : enforceReturnValue(factoryFn)
        });
      },
      value: function(key, value) {
        this.factory(key, function() {
          return value;
        }, false);
      },
      service: function(key, Constructor) {
        this.factory(key, function() {
          return instanceInjector.instantiate(Constructor);
        });
      },
      decorator: function(serviceName, decoratorFn) {
        var provider = providerInjector.get(serviceName + "Provider");
        var original$get = provider.$get;
        provider.$get = function() {
          var instance = instanceInjector.invoke(original$get, provider);
          instanceInjector.invoke(decoratorFn, null, {
            $delegate: instance
          });
          return instance;
        };
      }
    };


    // returns an array containing the fn dependencies. eg ["$scope", "$log"] 
    // annotate is called during component invokation
    function annotate(fn) {
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
    }


    function createInternalInjector(cache, factoryFn) {
      //returns the the cached service
      var getService = function(name) {
        if (cache.hasOwnProperty(name)) {
          if (cache[name] === INSTANTIATING) {
            throw new Error("Circular dependency found: " + name + " <- " + path.join(" <- "));
          }
          return cache[name];
        }
        else {
          path.unshift(name);
          cache[name] = INSTANTIATING;
          try {
            return (cache[name] = factoryFn(name));
          }
          finally {
            path.shift();
            // if instantitation failed, then delete the placeholder "INSTANTIATING"
            if (cache[name] === INSTANTIATING) {
              delete cache[name];
            }
          }
        }
      };

      // will call fn and will inject the arguments/arguments
      // invoke is called during instantiation
      var invoke = function(fn, self, locals) {
        var args = annotate(fn).map(function(token) {
          // "function(a, b){..}"
          if (typeof token === "string") {
            return locals && locals.hasOwnProperty(token) ?
              locals[token] : getService(token);
          }
          else {
            throw "Incorrect injection token! Expected a string, got " + token;
          }
        });
        //if fn was annotate eg ["a","b", function(a,b){...}]
        if (Object.prototype.toString.call(fn) === "[object Array]") {
          fn = fn[fn.length - 1];
        }
        return fn.apply(self, args);
      };

      // for constructors you must use instantiate
      var instantiate = function(Type, locals) {
        var UnwrappedType = toString.call(Type) === "[object Array]" ?
          Type[Type.length - 1] : Type;
        var instance = Object.create(UnwrappedType.prototype);
        invoke(Type, instance, locals);
        return instance;
      };


      return {
        has: function(name) {
          return cache.hasOwnProperty(name) ||
            providerCache.hasOwnProperty(name + "Provider");
        },
        get: getService,
        annotate: annotate,
        invoke: invoke,
        instantiate: instantiate
      };
    }


    function runInvokeQueue(queue) {
      queue.forEach(function(invokeArgs) {
        var service = providerInjector.get(invokeArgs[0]);
        var method = invokeArgs[1];
        var args = invokeArgs[2];
        service[method].apply(service, args);
      });
    }


    // load each module
    var runBlocks = [];
    _.forEach(modulesToLoad, function loadModule(module) {
      if (!loadedModules.get(module)) {
        loadedModules.put(module, true);

        if (typeof module === "string") {
          module = angular.module(module);

          // load each dependency
          module.requires.forEach(loadModule);

          // load each component
          runInvokeQueue(module._invokeQueue);
          // config blocks are run after invokables because we want to have access to the invokableProvider
          runInvokeQueue(module._configBlocks);

          //we want to run the runBlocks after every module in the app has loaded
          runBlocks = runBlocks.concat(module._runBlocks);
        }

        // in rare cases users might want to declare modules requirements as function
        // these are considered config functions
        else if (typeof module === "function" || Object.prototype.toString.call(module) === "[object Array]") {
          // push the result of the invokation onto the run block, because the configFns are allowed
          // to return a function, and when this is the case the function is considered a run block
          runBlocks.push(providerInjector.invoke(module));
        }
      }
    });

    runBlocks = runBlocks.filter(function(runBlock) {
      //we want to filter out anything that is falsy
      return !!runBlock;
    });
    runBlocks.forEach(function(runBlock) {
      instanceInjector.invoke(runBlock);
    });


    return instanceInjector;
  }


  window.createInjector = createInjector;
})();
