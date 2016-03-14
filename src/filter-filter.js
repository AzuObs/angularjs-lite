(function() {
  "use strict";

  var deepCompare = function(actual, expected, comparator) {
    if (mixin.isObjectLike(actual)) {
      return Object.keys(actual).some(function(key) {
        return deepCompare(actual[key], expected, comparator);
      });
    }
    else {
      return comparator(actual, expected);
    }
  };


  var createPredicateFn = function(expression) {
    var comparator = function(actual, expected) {
      actual = ("" + actual).toLowerCase();
      expected = ("" + expression).toLowerCase();
      return actual.indexOf(expected) !== -1;
    };

    return function(item) {
      return deepCompare(item, expression, comparator);
    };
  };


  var filterFilter = function(array, fn) {
    return function(array, filterExpr) {
      var predicateFn;

      if (filterExpr) {
        if (
          typeof filterExpr === "function"
        ) {
          predicateFn = filterExpr;
        }
        else if (
          typeof filterExpr === "string" ||
          typeof filterExpr === "number" ||
          typeof filterExpr === "boolean"
        ) {
          predicateFn = createPredicateFn(filterExpr);
        }
      }

      return array.filter(predicateFn);
    };
  };


  register("filter", filterFilter);
})();
