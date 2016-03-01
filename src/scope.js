(function(exports) {
  "use strict";


  function initWatchVal() {}


  var Scope = function() {
    this.$$applyAsyncQueue = [];
    this.$$applyAsyncId = null;
    this.$$asyncQueue = [];
    this.$$children = [];
    this.$$lastDirtyWatch = null;
    this.$$listeners = {};
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
                newValue = watcher.watchFn(scope);
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


    $$fireEventOnScope: function(eventName, additionalArgs) {
      var event = {
        name: eventName
      };
      var listeners = this.$$listeners[eventName] || [];
      var listenerArgs = [event].concat(additionalArgs);

      for (var i = 0; i < listeners.length; i++) {
        var listener = listeners[i];

        listener.apply(null, listenerArgs);
      }

      return event;
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

      this.$root.$$applyAsyncId = null;
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

      if (self.$root.$$applyAsyncId === null) {
        self.$root.$$applyAsyncId = setTimeout(function() {
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


    $broadcast: function(eventName) {
      var additionalArgs = Array.prototype.splice.call(arguments, 1, arguments.length - 1);
      return this.$$fireEventOnScope(eventName, additionalArgs);
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

      if (this.$root.$$applyAsyncId) {
        clearTimeout(this.$root.$$applyAsyncId);
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


    $destroy: function() {
      if (this.$parent) {
        var siblings = this.$parent.$$children;
        var indexOfThis = siblings.indexOf(this);

        if (indexOfThis >= 0) {
          siblings.splice(indexOfThis, 1);
        }
      }

      this.$$watchers = null;
    },


    $emit: function(eventName) {
      // _.rest(arguments)
      var additionalArgs = Array.prototype.splice.call(arguments, 1, arguments.length - 1);
      return this.$$fireEventOnScope(eventName, additionalArgs);
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


    $new: function(isolated, parent) {
      var child;
      parent = parent || this;

      if (isolated) {
        child = new Scope();
        child.$root = parent.$root;
        child.$$asyncQueue = parent.$$asyncQueue;
        child.$$postDigestQueue = parent.$$postDigestQueue;
        child.$$applyAsyncQueue = parent.$$applyAsyncQueue;
      }
      else {
        var ChildScope = function() {};
        ChildScope.prototype = this;
        child = new ChildScope();
      }

      parent.$$children.push(child);
      child.$$watchers = [];
      child.$$children = [];
      child.$$listeners = {};
      child.$parent = parent;
      return child;
    },


    $on: function(eventName, listener) {
      var listeners = this.$$listeners[eventName];
      if (!listeners) {
        this.$$listeners[eventName] = listeners = [];
      }

      listeners.push(listener);

      return function() {
        var indexOf = listeners.indexOf(listener);
        if (indexOf >= 0) {
          listeners.splice(indexOf, 1);
        }
      };
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


    $watchCollection: function(watchFn, listenerFn) {
      var self = this;
      var newValue;
      var oldValue;
      var oldLength;
      var veryOldValue;
      //only track if the listenerFn needs (newValue, oldValue, ...);
      var trackVeryOldValue = listenerFn.length > 1;
      var changeCount = 0;
      var firstRun = true;

      var internalWatchFn = function(scope) {
        var newLength;
        newValue = watchFn(scope);

        if (mixin.isObjectLike(newValue)) {
          if (mixin.isArrayLike(newValue)) {
            if (!Array.isArray(oldValue)) {
              changeCount++;
              oldValue = [];
            }
            if (newValue.length !== oldValue.length) {
              changeCount++;
              oldValue.length = newValue.length;
            }
            for (var i = 0; i < newValue.length; i++) {
              var bothNaN = isNaN(newValue[i]) && isNaN(oldValue[i]);

              if (!bothNaN && newValue[i] !== oldValue[i]) {
                oldValue[i] = newValue[i];
                changeCount++;
              }
            }
          }
          else {
            if (!mixin.isObjectLike(oldValue) || mixin.isArrayLike(oldValue)) {
              changeCount++;
              oldValue = {};
              oldLength = 0;
            }

            newLength = 0;
            for (var key in newValue) {
              newLength++;
              if (oldValue.hasOwnProperty(key)) {
                var areBothNaN = isNaN(newValue[key]) && isNaN(oldValue[key]);
                if (!areBothNaN && newValue[key] !== oldValue[key]) {
                  oldValue[key] = newValue[key];
                  changeCount++;
                }
              }
              else {
                changeCount++;
                oldLength++;
                oldValue[key] = newValue[key];
              }
            }

            if (oldLength > newLength) {
              changeCount++;
              for (key in oldValue) {
                if (!newValue.hasOwnProperty(key)) {
                  oldLength--;
                  delete oldValue[key];
                }
              }
            }
          }
        }

        else { //newValue is not object like
          if (!self.$$areEqual(newValue, oldValue, false)) {
            changeCount++;
          }

          oldValue = newValue;
        }

        return changeCount;
      };

      var internalListenerFn = function(scope) {
        if (firstRun) {
          listenerFn(newValue, newValue, self);
          firstRun = false;
        }
        else {
          listenerFn(newValue, veryOldValue, self);
        }

        if (trackVeryOldValue) {
          veryOldValue = _.clone(newValue);
        }
      };

      return this.$watch(internalWatchFn, internalListenerFn);
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

//p136
