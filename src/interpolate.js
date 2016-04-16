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
        var expressions = [];
        var expressionFns = [];
        var expressionPositions = [];
        var startIndex, endIndex, exp, expFn;

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
            expressions.push(exp);
            expressionFns.push(expFn);
            expressionPositions.push(parts.length);
            parts.push(expFn);
            index = endIndex + 2;
          }
          else {
            parts.push(unescapeText(text.substring(index)));
            break;
          }
        }

        function compute(values) {
          _.forEach(values, function(value, i) {
            parts[expressionPositions[i]] = stringify(value);
          });
          return parts.join('');
        }

        // if there are any expressions {{}} or if we don't need to have expressions
        if (expressions.length || !mustHaveExpressions) {
          return _.extend(function interpolationFn(context) {
            var values = _.map(expressionFns, function(expressionFn) {
              return expressionFn(context);
            });
            return compute(values);
          }, {
            expressions: expressions,
            $$watchDelegate: function(scope, listener) {
              var lastValue;
              return scope.$watchGroup(expressionFns, function(newValues, oldValues) {
                var newValue = compute(newValues);
                listener(
                  newValue,
                  (newValues === oldValues ? newValue : lastValue),
                  scope
                );
                lastValue = newValue;
              });
            }
          });
        }
      }

      return $interpolate;
    }];
  }


  window.$InterpolateProvider = $InterpolateProvider;
})();
