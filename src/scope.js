(function(exports) {
  "use strict";


  function initWatchVal() {}


  var Scope = function() {
    this.$$applyAsyncQueue = [];
    this.$$applyAsyncId = null;
    this.$$asyncQueue = [];
    this.$$children = [];
    this.$$lastDirtyWatch = null;
    this.$$phase = null;
    this.$$postDigestQueue = [];
    this.$$watchers = [];
    this.$root = this;
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
      var dirty;
      var continueLoop = true;
      var self = this;

      this.$$everyScope(function(scope) {
        var newValue, oldValue;

        var length = scope.$$watchers.length;
        traverseWatchersLoop:
          while (length--) {
            try {
              var watcher = scope.$$watchers[length];
              if (watcher) {
                newValue = watcher.watchFn(self);
                oldValue = watcher.last;

                if (!scope.$$areEqual(newValue, oldValue, watcher.valueEq)) {
                  dirty = true;
                  self.$root.$$lastDirtyWatch = watcher;

                  watcher.last = (watcher.valueEq ? _.cloneDeep(newValue) : newValue);
                  watcher.listenerFn(newValue, (oldValue === initWatchVal ? newValue : oldValue), scope);
                }
                else if (self.$root.$$lastDirtyWatch === watcher) {
                  continueLoop = false;
                  return false;
                }
              }
            }
            catch (e) {
              console.error(e);
            }
          }

        return continueLoop;
      });
      return dirty;
    },


    $$everyScope: function(fn) {
      if (fn(this)) {
        return this.$$children.every(function(child) {
          return child.$$everyScope(fn);
        });
      }
      else {
        return false;
      }
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
        this.$root.$digest();
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
      this.$root.$$lastDirtyWatch = null;

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
            self.$root.$digest();
          }
        }, 0);
      }

      this.$$asyncQueue.push({
        scope: this,
        expression: expr
      });
    },


    $new: function() {
      var ChildScope = function() {};
      ChildScope.prototype = this;

      var child = new ChildScope();
      this.$$children.push(child);

      child.$$watchers = [];
      child.$$children = [];
      return child;
    },


    $watch: function(watchFn, listenerFn, valueEq) {
      var self = this;

      var watcher = {
        watchFn: watchFn,
        listenerFn: listenerFn || function() {},
        valueEq: !!valueEq, //compare by value (e.i. deep comparisson vs reference comparisson)
        last: initWatchVal
      };

      this.$$watchers.unshift(watcher);
      this.$root.$$lastDirtyWatch = null;

      return function() {
        var index = self.$$watchers.indexOf(watcher);
        if (index >= 0) {
          self.$$watchers.splice(index, 1);
          self.$root.$$lastDirtyWatch = null;
        }
      };
    },


    $watchGroup: function(watchFns, listenerFn) {
      var self = this;
      var newValues = new Array(watchFns.length);
      var oldValues = new Array(watchFns.length);
      var firstRun = true;
      var changeReactionScheduled = false;

      if (watchFns.length === 0) {
        var shouldCall = true;

        self.$evalAsync(function() {
          if (shouldCall) {
            listenerFn(newValues, newValues, self);
          }
        });

        return function() {
          shouldCall = false;
        };
      }

      function watchGroupListener() {
        if (firstRun) {
          firstRun = false;
          listenerFn(newValues, newValues, self);
        }
        else {
          listenerFn(newValues, oldValues, self);
        }
        changeReactionScheduled = false;
      }

      var destroyFunctions = watchFns.map(function(watchFn, i, arr) {
        return self.$watch(watchFn, function(newValue, oldValue) {
          newValues[i] = newValue;
          oldValues[i] = oldValue;

          if (!changeReactionScheduled) {
            changeReactionScheduled = true;
            self.$evalAsync(watchGroupListener);
          }
        });
      });

      return function() {
        for (var i = 0; i < destroyFunctions.length; i++) {
          destroyFunctions[i]();
        }
      };

    }
  };


  exports.Scope = Scope;
})(this);

//p77
