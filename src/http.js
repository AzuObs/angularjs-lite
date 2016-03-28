(function() {
  "use strict";

  function $HttpProvider() {
    this.$get = ["$httpBackend", "$q", "$rootScope",
      function($httpBackend, $q, $rootScope) {

        function isSuccess(status) {
          return 200 <= status && status < 300;
        }

        function mergeHeaders(reqConf) {
          var defaults = {
            headers: {
              common: {
                Accept: "application/json, text/plain, */*"
              },
              post: {
                "Content-Type": "application/json;charset=utf-8"
              },
              put: {
                "Content-Type": "application/json;charset=utf-8"
              },
              patch: {
                "Content-Type": "application/json;charset=utf-8"
              }
            }
          };

          return Object.assign({},
            defaults.headers.common,
            defaults.headers[(reqConf.method || "get").toLowerCase()],
            reqConf.headers
          );
        }


        return function $http(requestConfig) {
          var deferred = $q.defer();

          //assign takes the requestConfig and copies all of it's properties to 
          //{method:"GET"} object and will override if there are any conflicts
          //eg. if they both have a "method" property, it's the property of requestConfig
          //that will overite the property of the anonymous object 
          var config = Object.assign({
            method: "GET"
          }, requestConfig);
          config.headers = mergeHeaders(requestConfig);

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

          $httpBackend(config.method, config.url, config.data, done, config.headers);
          return deferred.promise;
        };
      }
    ];
  }


  window.$HttpProvider = $HttpProvider;
})();
