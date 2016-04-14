(function() {
  "use strict";

  function $InterpolateProvider() {
    this.$get = function() {

      function $interpolate(text) {
        return function interpolateFn() {
          return text;
        };
      }

      return $interpolate;
    };
  }


  window.$InterpolateProvider = $InterpolateProvider;
})();
