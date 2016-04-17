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
      else {
        controllers[name] = controller;
      }
    };


    this.$get = ["$injector", function($injector) {

      return function(ctrl, locals, later, identifier) {
        // if it's a string then it's in storage
        if (typeof ctrl === "string") {
          // if syntax used is "MyCtrl as myCtrl"
          var match = ctrl.match(/^(\S+)(\s+as\s+(\w+))?/);
          ctrl = match[1];
          identifier = identifier || match[3];
          if (controllers.hasOwnProperty(ctrl)) {
            ctrl = controllers[ctrl];
          }
          else {
            // allow lookup on scope object or on window object
            ctrl = (locals && locals.$scope && locals.$scope[ctrl]) ||
              (globals && window[ctrl]);
          }
        }

        var instance;
        if (later) {
          var ctrlConstructor = _.isArray(ctrl) ? _.last(ctrl) : ctrl;
          instance = Object.create(ctrlConstructor.prototype);

          if (identifier) {
            addToScope(locals, identifier, instance);
          }

          return _.extend(function() {
            $injector.invoke(ctrl, instance, locals);
            return instance;
          }, {
            instance: instance
          });
        }
        else {
          instance = $injector.instantiate(ctrl, locals);
          if (identifier) {
            addToScope(locals, identifier, instance);
          }
        }

        return instance;
      };
    }];
  }


  module.exports = $ControllerProvider;
})();
