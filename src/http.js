(function() {
  "use strict";

  function $HttpProvider() {
    this.$get = ["$httpBackend", "$q", "$rootScope", function($httpBackend, $q, $rootScope) {
      return function $http(config) {
        var deferred = $q.defer();

        function done(status, response, statusText) {
          deferred.resolve({
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
    }];
  }


  window.$HttpProvider = $HttpProvider;
})();
