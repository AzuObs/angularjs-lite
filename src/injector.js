(function() {
  "use strict";

  var createInjector = function(modulesToLoad) {
    var cache = {};

    var $provide = {
      constant: function(key, value) {
        if (key === "hasOwnProperty") {
          throw "hasOwnProperty is not a valid constant name!";
        }
        cache[key] = value;
      }
    };

    // cycle through each module
    modulesToLoad.forEach(function(moduleName) {
      var module = angular.module(moduleName);

      // cycle through each module components
      module._invokeQueue.forEach(function(invokeArgs) {
        var method = invokeArgs[0];
        var args = invokeArgs[1];

        // build the components
        $provide[method].apply($provide, args);
      });
    });

    return {
      has: function(key) {
        return cache.hasOwnProperty(key);
      }
    };
  };


  window.createInjector = createInjector;
})();