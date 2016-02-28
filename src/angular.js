(function() {
  "use strict";

  window.mixin = {
    isArrayLike: function(obj) {
      if (obj === null || obj === undefined) {
        return false;
      }
      var length = obj.length;
      return Number.isInteger(length);
    }
  };

})();
