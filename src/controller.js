(function() {
  "use strict";

  function $ControllerProvider() {
    var controllers = {};

    this.register = function(name, controller) {
      controllers[name] = controller;
    };


    this.$get = ["$injector", function($injector) {
      return function(ctrl, locals) {
        // if it's a string then it's in storage
        if (typeof ctrl === "string") {
          ctrl = controllers[ctrl];
        }

        return $injector.instantiate(ctrl, locals);
      };
    }];
  }


  window.$ControllerProvider = $ControllerProvider;
})();
