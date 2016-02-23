(function(exports) {
  "use strict";


  function initWatchVal() {}


  exports.Scope = function() {
    this.$$applyAsyncQueue = [];
    this.$$applyAsyncId = null;
    this.$$asyncQueue = [];
    this.$$lastDirtyWatch = null;
    this.$$phase = null;
    this.$$postDigestQueue = [];
    this.$$watchers = [];
  };


  Scope.prototype = {

    $$areEqual: function(newValue, oldValue, valueEq) {
      if (valueEq) {
        return _.isEqual(newValue, oldValue);
      }
      else {
        return (newValue === oldValue) ||
          (typeof newValue === "number" && typeof oldValue === "number" && isNaN(newValue) && isNaN(oldValue));
      }
    },


    $$digestOnce: function() {
      var self = this;
      var newValue, oldValue, dirty;

      eachWatchLoop:
        for (var i = 0; i < self.$$watchers.length; i++) {
          try {
            var watcher = self.$$watchers[i];
            newValue = watcher.watchFn(self);
            oldValue = watcher.last;

            if (!self.$$areEqual(newValue, oldValue, watcher.valueEq)) {
              dirty = true;
              self.$$lastDirtyWatch = watcher;

              watcher.last = (watcher.valueEq ? _.cloneDeep(newValue) : newValue);
              watcher.listenerFn(newValue, (oldValue === initWatchVal ? newValue : oldValue), self);
            }
            else if (self.$$lastDirtyWatch === watcher) {
              return false;
            }
          }
          catch (e) {
            console.error(e);
          }
        }

      return dirty;
    },


    $$postDigest: function(fn) {
      this.$$postDigestQueue.push(fn);
    },


    $$flushApplyAsync: function() {
      while (this.$$applyAsyncQueue.length) {
        try {
          this.$$applyAsyncQueue.shift()();
        }
        catch (e) {
          console.error(e);
        }
      }

      this.$$applyAsyncId = null;
    },


    $apply: function(expr) {
      try {
        this.$beginPhase("$apply");
        return this.$eval(expr);
      }
      finally {
        this.$clearPhase();
        this.$digest();
      }
    },


    $applyAsync: function(expr) {
      var self = this;

      self.$$applyAsyncQueue.push(function() {
        self.$eval(expr);
      });

      if (self.$$applyAsyncId === null) {
        self.$$applyAsyncId = setTimeout(function() {
          self.$apply(self.$$flushApplyAsync.bind(self));
        }, 0);
      }
    },


    $beginPhase: function(phase) {
      if (this.$$phase) {
        throw "phase already in progress";
      }

      this.$$phase = phase;
    },


    $clearPhase: function() {
      if (!this.$$phase) {
        throw "phase was already cleared";
      }

      this.$$phase = null;
    },


    $digest: function() {
      this.$beginPhase("$digest");

      var dirty = false;
      var ttl = 10;
      this.$$lastDirtyWatch = null;

      if (this.$$applyAsyncId) {
        clearTimeout(this.$$applyAsyncId);
        this.$$flushApplyAsync();
      }

      traverseScopesLoop:
        do {
          while (this.$$asyncQueue.length) {
            try {
              var asyncTask = this.$$asyncQueue.shift();
              asyncTask.scope.$eval(asyncTask.expression);
            }
            catch (e) {
              console.error(e);
            }
          }

          dirty = this.$$digestOnce();

          if ((dirty || this.$$asyncQueue.length) && !(ttl--)) {
            this.$clearPhase();
            throw "10 digest iterations reached";
          }
        }
        while (dirty || this.$$asyncQueue.length);

      this.$clearPhase();

      while (this.$$postDigestQueue.length) {
        try {
          this.$$postDigestQueue.shift()();
        }
        catch (e) {
          console.error(e);
        }
      }

    },


    $eval: function(expr, locals) {
      return expr(this, locals);
    },


    $evalAsync: function(expr) {
      var self = this;

      if (!self.$$phase && !self.$$asyncQueue.length) {
        setTimeout(function() {
          if (self.$$asyncQueue.length) {
            self.$digest();
          }
        }, 0);
      }

      this.$$asyncQueue.push({
        scope: this,
        expression: expr
      });
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
    }
  };

})(this);

//p44-45
