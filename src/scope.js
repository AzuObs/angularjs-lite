(function(exports) {
  "use strict";


  function initWatchVal() {}


  exports.Scope = function() {
    this.$$watchers = [];
    this.$$lastDirtyWatch = null;
  };


  Scope.prototype = {

    $digest: function() {
      var dirty = false;
      var ttl = 10;
      this.$$lastDirtyWatch = null;

      do {
        dirty = this.$$digestOnce();
        if (dirty && !(ttl--)) {
          throw "10 digest iterations reached";
        }
      }
      while (dirty);
    },


    $eval: function(expr, locals) {
      return expr(this, locals);
    },


    $watch: function(watchFn, listenerFn, valueEq) {
      var watcher = {
        watchFn: watchFn,
        listenerFn: listenerFn || function() {},
        valueEq: !!valueEq, //compare by value (e.i. deep comparisson vs reference comparisson)
        last: initWatchVal
      };

      this.$$watchers.push(watcher);
      this.$$lastDirtyWatch = null;
    },


    $$areEqual: function(newValue, oldValue, valueEq) {
      if (valueEq) {
        return _.isEqual(newValue, oldValue);
      } else {
        return (newValue === oldValue) ||
          (typeof newValue === "number" && typeof oldValue === "number" && isNaN(newValue) && isNaN(oldValue));
      }
    },

    $$digestOnce: function() {
      var self = this;
      var newValue, oldValue, dirty;

      _.forEach(this.$$watchers, function(watcher) {
        newValue = watcher.watchFn(self);
        oldValue = watcher.last;

        if (!self.$$areEqual(newValue, oldValue, watcher.valueEq)) {
          dirty = true;
          self.$$lastDirtyWatch = watcher;

          watcher.last = (watcher.valueEq ? _.cloneDeep(newValue) : newValue);
          watcher.listenerFn(newValue, (oldValue === initWatchVal ? newValue : oldValue), self);

        } else if (self.$$lastDirtyWatch === watcher) {
          return false;
        }
      });

      return dirty;
    }


  };

})(this);

//p21
