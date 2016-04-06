(function() {
  "use strict";

  function $ControllerProvider() {
    this.$get = ["$injector", function($injector) {
      return function(ctrl) {
        return $injector.instantiate(ctrl);
      };
    }];
  }


  window.$ControllerProvider = $ControllerProvider;
})();
