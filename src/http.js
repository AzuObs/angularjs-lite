(function() {
  "use strict";

  function $HttpProvider() {
    this.$get = ["$httpBackend", "$q", "$rootScope",
      function($httpBackend, $q, $rootScope) {

        return function $http(config) {
          var deferred = $q.defer();

          function isSuccess(status) {
            return 200 <= status && status < 300;
          }

          function done(status, response, statusText) {
            //Math.max returns the largest number of the args passed it
            //eg Math.max(-1,0, 200, -100) returns 200
            status = Math.max(status, 0);
            deferred[isSuccess(status) ? "resolve" : "reject"]({
              status: status,
              data: response,
              statusText: statusText,
              config: config
            });
            // we call $apply instead of $evalAsync/$applyAsync because we don't want 
            // to be asynchronous, we want this to resolve straight away
            if (!$rootScope.$$phase) {
              $rootScope.$apply();
            }
          }

          $httpBackend(config.method, config.url, config.data, done);
          return deferred.promise;
        };
      }
    ];
  }


  window.$HttpProvider = $HttpProvider;
})();
