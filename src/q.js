(function() {
  "use strict";


  function qFactory(callLater) {

    function processQueue(state) {
      var pending = state.pending;
      delete state.pending;

      if (pending !== undefined) {
        pending.forEach(function(handlers) {
          // deferred is the deferred object that may be used to chain
          // a .then after the promise has resolved
          var deferred = handlers[0];

          // handlers looks like [null, onFulfilledCallback, onRejectCallback]
          // state.status is either 1 (resolved) or 2 (rejected)
          var fn = handlers[state.status];

          try {
            // we check whether fn is a function
            // because sometimes only one of two handler functions
            // was defined and the other was undefined
            if (typeof fn === "function") {
              deferred.resolve(fn(state.value));
            }

            // if handler[state.status] is undefined it means that
            // if we must be in a .catch and we need to schedule a then
            else if (state.status === 1) {
              deferred.resolve(state.value);
            }
            // and vice versa
            else {
              deferred.reject(state.value);
            }
          }

          catch (e) {
            deferred.reject(e);
          }
        });
      }
    }

    function scheduleProcessQueue(state) {
      callLater(function() {
        processQueue(state);
      });
    }


    function Promise() {
      this.$$state = {};
    }

    Promise.prototype.then = function(onFulfilled, onRejected, onProgress) {
      var result = new Deferred();

      this.$$state.pending = this.$$state.pending || [];
      this.$$state.pending.push([result, onFulfilled, onRejected, onProgress]);

      // if deferred has already resolved
      if (this.$$state.status > 0) {
        scheduleProcessQueue(this.$$state);
      }

      return result.promise;
    };

    Promise.prototype.catch = function(onRejected) {
      return this.then(null, onRejected);
    };


    function makePromise(value, resolved) {
      var d = new Deferred();
      if (resolved) {
        d.resolve(value);
      }
      else {
        d.reject(value);
      }

      return d.promise;
    }

    function handleFinallyCallback(callback, value, resolved) {
      var callBackValue = callback();
      if (callBackValue && callBackValue.then) {
        return callBackValue.then(function() {
          return makePromise(value, resolved);
        });
      }
      else {
        return makePromise(value, resolved);
      }
    }

    Promise.prototype.finally = function(callback, progressBack) {
      return this.then(function(value) {
          return handleFinallyCallback(callback, value, true);
        }, function(rejection) {
          return handleFinallyCallback(callback, rejection, false);
        },
        progressBack);
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

      // if value is a promise, WHEN that promise resolves call this resolve, this reject, this notify
      if (value && typeof value.then === "function") {
        value.then(this.resolve.bind(this), this.reject.bind(this), this.notify.bind(this));
      }
      else {
        this.promise.$$state.status = 1;
        this.promise.$$state.value = value;
        scheduleProcessQueue(this.promise.$$state);
      }
    };

    Deferred.prototype.notify = function(progress) {
      var pending = this.promise.$$state.pending;
      if (pending && pending.length && !this.promise.$$state.status) {
        callLater(function() {
          pending.forEach(function(handlers) {
            var deferred = handlers[0];
            var progressBack = handlers[3];
            try {
              deferred.notify(typeof progressBack === "function" ? progressBack(progress) : progress);
            }
            catch (e) {
              console.error(e);
            }
          });
        });
      }
    };


    function defer() {
      return new Deferred();
    }

    function reject(reason) {
      var d = defer();
      d.reject(reason);
      return d.promise;
    }

    function when(value, callback, errback, progressback) {
      var d = defer();
      d.resolve(value);
      return d.promise.then(callback, errback, progressback);
    }

    function all(promises) {
      var results = toString.call(promises) === "[object Array]" ? [] : {};
      var counter = 0;
      var d = defer();

      Object.keys(promises).forEach(function(key) {
        var promise = promises[key];
        counter++;
        when(promise).then(function(value) {
          results[key] = value;
          counter--;
          if (!counter) {
            d.resolve(results);
          }
        }, function(rejection) {
          d.reject(rejection);
        });
      });

      // if empty array or empty object
      if (!counter) {
        d.resolve(results);
      }

      return d.promise;
    }

    return {
      defer: defer,
      reject: reject,
      when: when,
      resolve: when,
      all: all
    };
  }


  function $QProvider() {
    this.$get = ['$rootScope', function($rootScope) {
      return qFactory(function(callback) {
        $rootScope.$evalAsync(callback);
      });
    }];
  }


  function $$QProvider() {
    this.$get = ['$rootScope', function($rootScope) {
      return qFactory(function(callback) {
        setTimeout(callback, 0);
      });
    }];
  }

  window.$QProvider = $QProvider;
  window.$$QProvider = $$QProvider;
})();
