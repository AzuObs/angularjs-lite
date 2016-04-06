(function() {
  "use strict";

  function addToScope(locals, identifier, instance) {
    if (locals && _.isObject(locals.$scope)) {
      locals.$scope[identifier] = instance;
    }
    else {
      throw "Cannot export controller as " + identifier + "! No scope object provided via locals";
    }
  }


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

      return function(ctrl, locals, identifier) {
        // if it's a string then it's in storage
        if (typeof ctrl === "string") {
          if (controllers.hasOwnProperty(ctrl)) {
            ctrl = controllers[ctrl];
          }
          else if (globals) {
            ctrl = window[ctrl];
          }
        }
        var instance = $injector.instantiate(ctrl, locals);
        if (identifier) {
          addToScope(locals, identifier, instance);
        }

        return instance;
      };
    }];
  }


  window.$ControllerProvider = $ControllerProvider;
})();
