(function(exports) {
  "use strict";


  function initWatchVal() {}


  exports.Scope = function() {
    this.$$watchers = [];
    this.$$lastDirtyWatch = null;
  };


  Scope.prototype = {

    $watch: function(watchFn, listenerFn) {
      var watcher = {
        watchFn: watchFn,
        listenerFn: listenerFn || function() {},
        last: initWatchVal
      };

      this.$$watchers.push(watcher);
      this.$$lastDirtyWatch = null;
    },


    $digest: function() {
      var dirty = false;
      var ttl = 10;
      this.$$lastDirtyWatch = null;

      do {
        dirty = this.$$digestOnce();
        if (dirty && !(ttl--)) {
          throw "" + ttl + " digest iterations reached";
        }
      }
      while (dirty);
    },


    $$digestOnce: function() {
      var self = this;
      var newValue, oldValue, dirty;

      _.forEach(this.$$watchers, function(watcher) {
        newValue = watcher.watchFn(self);
        oldValue = watcher.last;

        if (newValue !== oldValue) {
          self.$$lastDirtyWatch = watcher;
          watcher.last = newValue;
          watcher.listenerFn(newValue, (oldValue === initWatchVal ? newValue : oldValue), self);
          dirty = true;

        } else if (self.$$lastDirtyWatch === watcher) {
          return false;
        }
      });

      return dirty;
    }
  };

})(this);

//p21
