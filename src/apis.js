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


  function HashMap() {

  }

  HashMap.prototype = {
    put: function(key, value) {
      this[hashKey(key)] = value;
    },
    get: function(key) {
      return this[hashKey(key)];
    }
  };

  window.hashKey = hashKey;
  window.HashMap = HashMap;

})();