(function() {
  "use strict";

  function $InterpolateProvider() {
    this.$get = ["$parse", function($parse) {

      function $interpolate(text) {
        var startIndex = text.indexOf("{{");
        var endIndex = text.indexOf("}}");
        var exp, expFn;

        // if there is an expression
        if (startIndex !== -1 && endIndex !== -1) {
          exp = text.substring(startIndex + 2, endIndex);
          expFn = $parse(exp);
        }

        // context is usually a Scope
        return function interpolateFn(context) {
          if (expFn) {
            return expFn(context);
          }
          else {
            return text;
          }
        };
      }

      return $interpolate;
    }];
  }


  window.$InterpolateProvider = $InterpolateProvider;
})();
