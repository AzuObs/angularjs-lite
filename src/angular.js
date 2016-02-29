(function(exports) {
  "use strict";

  var myMixin = {
    isArrayLike: function(obj) {
      if (obj === null || obj === undefined) {
        return false;
      }
      var length = obj.length;

      return length === 0 || (Number.isInteger(length) && length > 0 && (length - 1) in obj);
    },

    isObjectLike: function(obj) {
      return obj !== null && typeof obj === "object";
    }
  };

  exports.mixin = myMixin;

})(this);
