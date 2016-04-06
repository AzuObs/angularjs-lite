(function() {
  "use strict";

  function $ControllerProvider() {
    var controllers = {};
    var globals = false;


    this.allowGlobals = function() {
      globals = true;
    };


    this.register = function(name, controller) {
      if (toString.call(name) === "[object Object]") {
        Object.assign(controllers, name);
      }

      controllers[name] = controller;
    };


    this.$get = ["$injector", function($injector) {
      return function(ctrl, locals) {
        // if it's a string then it's in storage
        if (typeof ctrl === "string") {
          if (controllers.hasOwnProperty(ctrl)) {
            ctrl = controllers[ctrl];
          }
          else if (globals) {
            ctrl = window[ctrl];
          }
        }

        return $injector.instantiate(ctrl, locals);
      };
    }];
  }


  window.$ControllerProvider = $ControllerProvider;
})();
