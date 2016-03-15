(function() {
  "use strict";

  var deepCompare = function(actual, expected, comparator) {
    if (typeof expected === "string" && expected.charAt(0) === "!") {
      return !deepCompare(actual, expected.substring(1), comparator);
    }

    if (_.isArray(actual)) {
      return actual.some(function(actualItem) {
        return deepCompare(actualItem, expected, comparator);
      });
    }

    if (mixin.isObjectLike(actual)) {
      if (mixin.isObjectLike(expected)) {
        return Object.keys(_.toPlainObject(expected)).every(function(key) {
          if (expected[key] === undefined) {
            return true;
          }
          return deepCompare(actual[key], expected[key], comparator);
        });

      }
      else {
        return Object.keys(actual).some(function(key) {
          return deepCompare(actual[key], expected, comparator);
        });
      }
    }
    else {
      return comparator(actual, expected);
    }
  };


  var createPredicateFn = function(expression) {
    var comparator = function(actual, expected) {
      if (actual === undefined) {
        return false;
      }

      if (actual === null || expected === null) {
        return actual === expected;
      }

      actual = ("" + actual).toLowerCase();
      expected = ("" + expected).toLowerCase();
      return actual.indexOf(expected) !== -1;
    };

    return function(item) {
      return deepCompare(item, expression, comparator);
    };
  };


  var filterFilter = function(array, fn) {
    return function(array, filterExpr) {
      var predicateFn;

      if (
        typeof filterExpr === "function"
      ) {
        predicateFn = filterExpr;
      }
      else if (
        typeof filterExpr === "string" ||
        typeof filterExpr === "number" ||
        typeof filterExpr === "boolean" ||
        mixin.isObjectLike(filterExpr) ||
        filterExpr === null
      ) {
        predicateFn = createPredicateFn(filterExpr);
      }

      return array.filter(predicateFn);
    };
  };


  register("filter", filterFilter);
})();
