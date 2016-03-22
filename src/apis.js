(function() {
  "use strict";

  function hashKey(value) {
    var type = typeof value;
    var uid;

    if (type === "function" || (type === "object" && value !== null)) {
      uid = value.$$hashKey;
      if (typeof uid === "function") {
        uid = value.$$hashKey();
      }
      else if (uid === undefined) {
        // _.uniqueId is simply a function that has an internal counter
        // and increments it by one everytime it is called
        // it's the same as what angular does internally
        uid = value.$$hashKey = _.uniqueId();
      }
    }
    else {
      uid = value;
    }
    return type + ":" + uid;
  }

  window.hashKey = hashKey;

})();