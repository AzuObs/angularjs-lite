(function() {
  "use strict";


  var createPredicateFn = function(expression) {
    return function predicateFn(item) {
      return item === expression;
    };
  };


  var filterFilter = function(array, fn) {
    return function(array, filterExpr) {
      var predicateFn;

      if (filterExpr) {
        if (typeof filterExpr === "function") {
          predicateFn = filterExpr;
        }
        else if (typeof filterExpr === "string") {
          // debugger
          predicateFn = createPredicateFn(filterExpr);
        }
      }

      return array.filter(predicateFn);
    };
  };


  register("filter", filterFilter);
})();
