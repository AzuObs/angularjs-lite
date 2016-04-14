(function() {
  "use strict";

  function $InterpolateProvider() {
    this.$get = ["$parse", function($parse) {

      function $interpolate(text) {
        var index = 0;

        // "hello {{name}} I'm {{myName}}"
        // parts = ["hello ", parseFn, " I'm ", parseFn]
        var parts = [];
        var startIndex, endIndex, exp, expFn;

        while (index < text.length) {
          startIndex = text.indexOf("{{", index);
          endIndex = text.indexOf("}}", index);

          // if there is an expression
          if (startIndex !== -1 && endIndex !== -1) {
            if (startIndex !== index) {
              parts.push(text.substring(index, startIndex));
            }

            exp = text.substring(startIndex + 2, endIndex);
            expFn = $parse(exp);
            parts.push(expFn);
            index = endIndex + 2;
          }
          else {
            parts.push(text.substring(index));
            break;
          }
        }


        // context is usually a Scope
        return function interpolateFn(context) {
          return parts.reduce(function(previous, part) {
            if (typeof part === "function") {
              return previous + part(context);
            }
            else {
              return previous + part;
            }
          }, "");
        };
      }

      return $interpolate;
    }];
  }


  window.$InterpolateProvider = $InterpolateProvider;
})();
