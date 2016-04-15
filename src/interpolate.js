(function() {
  "use strict";

  // sometimes parse()() can return an object, null, undefined, etc in which 
  // case we don't want JS coersion, we want to transform it into a string ourselves
  function stringify(value) {
    if (value === null || value === undefined) {
      return "";
    }
    else if (typeof value === "object") {
      return JSON.stringify(value);
    }
    else {
      return value;
    }
  }


  // we sometimes need to unescape text
  // eg $interpolate("\\{\\{value\\}\\} = {{value}}")({value: "someVal"})
  // SHOULD return  "{{value}} = someVal"
  // SHOULD NOT return  "\{\{value\}\} = someVal"
  function unescapeText(text) {
    return text.replace(/\\{\\{/g, '{{')
      .replace(/\\}\\}/g, '}}');
  }


  function $InterpolateProvider() {
    this.$get = ["$parse", function($parse) {

      function $interpolate(text, mustHaveExpressions) {
        var index = 0;

        // "hello {{name}} I'm {{myName}}"
        // parts = ["hello ", parseFn, " I'm ", parseFn]
        var parts = [];
        var startIndex, endIndex, exp, expFn;
        var expressions = [];

        while (index < text.length) {
          startIndex = text.indexOf("{{", index);
          if (startIndex !== -1) {
            endIndex = text.indexOf("}}", startIndex + 2);
          }

          // if there is an expression
          if (startIndex !== -1 && endIndex !== -1) {
            if (startIndex !== index) {
              parts.push(unescapeText(text.substring(index, startIndex)));
            }

            exp = text.substring(startIndex + 2, endIndex);
            expFn = $parse(exp);
            parts.push(expFn);
            expressions.push(exp);
            index = endIndex + 2;
          }
          else {
            parts.push(unescapeText(text.substring(index)));
            break;
          }
        }


        if (expressions.length || !mustHaveExpressions) {
          // context is usually a Scope
          return Object.assign(function interpolateFn(context) {
            return parts.reduce(function(previous, part) {
              if (typeof part === "function") {
                return previous + stringify(part(context));
              }
              else {
                return previous + part;
              }
            }, "");
          }, {
            expressions: expressions
          });
        }
      }

      return $interpolate;
    }];
  }


  window.$InterpolateProvider = $InterpolateProvider;
})();
