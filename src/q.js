(function() {
  "use strict";


  function $QProvider() {
    this.$get = ["$rootScope", function($rootScope) {
      function processQueue(state) {
        var pending = state.pending;
        delete state.pending;
        pending.forEach(function(onFulfilled) {
          onFulfilled(state.value);
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

      Promise.prototype.then = function(onFulfilled) {
        this.$$state.pending = this.$$state.pending || [];
        this.$$state.pending.push(onFulfilled);

        // if deferred has already resolved
        if (this.$$state.status > 0) {
          scheduleProcessQueue(this.$$state);
        }
      };


      function Deferred() {
        this.promise = new Promise();
      }

      Deferred.prototype.resolve = function(value) {
        // if deferred has already resolved
        if (this.promise.$$state.status) {
          return;
        }
        this.promise.$$state.status = 1;
        this.promise.$$state.value = value;

        // !!this was a personal addition
        // if promise.then has any defined callbacks
        if (this.promise.$$state.pending && this.promise.$$state.pending.length) {
          scheduleProcessQueue(this.promise.$$state);
        }
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