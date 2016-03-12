(function() {
  "use strict";

  var filterFilter = function(array, fn) {
    return function(array, filterExpr) {
      return array.filter(filterExpr);
    };
  };

  register("filter", filterFilter);
})();
