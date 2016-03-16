(function() {
  "use strict";

  var deepCompare = function(actual, expected, comparator, matchAnyProperty, inWildcard) {
    if (typeof expected === "string" && expected.charAt(0) === "!") {
      return !deepCompare(actual, expected.substring(1), comparator, matchAnyProperty);
    }

    if (Object.prototype.toString.call(actual) === "[object Array]") {
      return actual.some(function(actualItem) {
        return deepCompare(actualItem, expected, comparator, matchAnyProperty);
      });
    }

    if (Object.prototype.toString.call(actual) === "[object Object]") {
      if (mixin.isObjectLike(expected) && !inWildcard) {
        return Object.keys(_.toPlainObject(expected)).every(function(key) {
          if (expected[key] === undefined) {
            return true;
          }

          var isWildcard = (key === "$");
          var actualVal = isWildcard ? actual : actual[key];
          return deepCompare(actualVal, expected[key], comparator, isWildcard, isWildcard);
        });
      }
      else if (matchAnyProperty) {
        return Object.keys(actual).some(function(key) {
          return deepCompare(actual[key], expected, comparator, matchAnyProperty);
        });
      }
      else {
        return comparator(actual, expected);
      }
    }
    else {
      return comparator(actual, expected);
    }
  };


  var createPredicateFn = function(expression, comparator) {
    var shouldMatchPrimitives = mixin.isObjectLike(expression) && ('$' in expression);

    if (typeof comparator !== "function") {
      comparator = function(actual, expected) {
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
    }

    return function(item) {
      if (shouldMatchPrimitives && !mixin.isObjectLike(item)) {
        return deepCompare(item, expression.$, comparator);
      }
      return deepCompare(item, expression, comparator, true);
    };
  };


  var filterFilter = function() {
    return function(array, filterExpr, comparator) {
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
        predicateFn = createPredicateFn(filterExpr, comparator);
      }

      return array.filter(predicateFn);
    };
  };


  register("filter", filterFilter);
})();
