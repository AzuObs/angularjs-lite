(function() {
  "use strict";


  function $QProvider() {
    this.$get = ["$rootScope", function($rootScope) {

      function processQueue(state) {
        var pending = state.pending;
        delete state.pending;
        pending.forEach(function(handlers) {
          // handlers looks like [null, onFulfilledCallback, onRejectCallback]
          // state.status is either 1 (resolved) or 2 (rejected)
          var fn = handlers[state.status];
          fn(state.value);
        });
      }

      function scheduleProcessQueue(state) {
        $rootScope.$evalAsync(function() {
          processQueue(state);
        });
      }


      function Promise() {
        this.$$state = {};
      }

      Promise.prototype.then = function(onFulfilled, onRejected) {
        this.$$state.pending = this.$$state.pending || [];
        this.$$state.pending.push([null, onFulfilled, onRejected]);

        // if deferred has already resolved
        if (this.$$state.status > 0) {
          scheduleProcessQueue(this.$$state);
        }
      };


      function Deferred() {
        this.promise = new Promise();
      }

      Deferred.prototype.reject = function(reason) {
        if (this.promise.$$state.status) {
          return;
        }
        this.promise.$$state.status = 2;
        this.promise.$$state.value = reason;
        scheduleProcessQueue(this.promise.$$state);
      };

      Deferred.prototype.resolve = function(value) {
        // if deferred has already resolved
        if (this.promise.$$state.status) {
          return;
        }
        this.promise.$$state.status = 1;
        this.promise.$$state.value = value;
        scheduleProcessQueue(this.promise.$$state);
      };


      function defer() {
        return new Deferred();
      }

      return {
        defer: defer
      };
    }];
  }

  window.$QProvider = $QProvider;
})();