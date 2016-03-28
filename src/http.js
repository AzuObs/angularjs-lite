(function() {
  "use strict";

  function $HttpProvider() {
    var defaults = this.defaults = {
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
      },
      transformRequest: [function(data) {
        // is object-like
        // and is not a blob, file, or form 
        if ((typeof data === "object" && data !== null) &&
          !isBlob(data) && !isFile(data) && !isFormData(data)) {
          return JSON.stringify(data);
        }
        else {
          return data;
        }
      }],
      transformResponse: [defaultHttpResponseTransform]
    };

    function isBlob(object) {
      return object.toString() === "[object Blob]";
    }

    function isFile(object) {
      return object.toString() === "[object File]";
    }

    function isFormData(object) {
      return object.toString() === "[object FormData]";
    }

    function isJsonLike(data) {
      // data starts with "{" or "["
      return data.match(/^\{/) || data.match(/^\[/);
    }

    function defaultHttpResponseTransform(data, headers) {
      if (window.debug) debugger;
      if (typeof data === "string") {
        var contentType = headers("Content-Type");
        if (contentType &&
          (contentType.indexOf("application/json") === 0) ||
          isJsonLike(data)) {
          return JSON.parse(data);
        }
      }
      return data;
    }


    this.$get = ["$httpBackend", "$q", "$rootScope",
      function $get($httpBackend, $q, $rootScope) {

        function isSuccess(status) {
          return 200 <= status && status < 300;
        }

        function executeHeaderFns(headers, config) {
          Object.keys(headers).forEach(function(key) {
            if (typeof headers[key] === "function") {
              headers[key] = headers[key](config);
              if (headers[key] === undefined || headers[key] === null) {
                delete headers[key];
              }
            }
          });

          return headers;
        }

        function mergeHeaders(reqConf) {
          var reqHeaders = Object.assign({}, reqConf.headers);
          var defHeaders = Object.assign({}, defaults.headers.common,
            defaults.headers[(reqConf.method || "get").toLowerCase()]);

          //if request header doesn't exist, assign the default value to it
          Object.keys(defHeaders).forEach(function(key) {
            //check whether the header exists
            var headerExists = Object.keys(reqHeaders).some(function(k) {
              return k.toLowerCase() === key.toLowerCase();
            });

            if (!headerExists) {
              reqHeaders[key] = defHeaders[key];
            }
          });

          return executeHeaderFns(reqHeaders, reqConf);
        }

        function parseHeaders(headers) {
          var result = {};

          if (toString.call(headers) === "[object Object]") {
            Object.keys(headers).forEach(function(k) {
              result[k.trim().toLowerCase()] = headers[k].trim();
            });

            return result;
          }

          else {
            var lines = headers.split("\n");
            lines.forEach(function(line) {
              var seperatorAt = line.indexOf(":");
              var name = line.substr(0, seperatorAt).trim().toLowerCase();
              var value = line.substr(seperatorAt + 1).trim().toLowerCase();
              if (name) {
                result[name] = value;
              }
            });
          }

          return result;
        }

        function headersGetter(headers) {
          var headersObj;
          return function(name) {
            headersObj = headersObj || parseHeaders(headers);
            return name ? headersObj[name.toLowerCase()] : headersObj;
          };
        }

        function transformData(data, headers, status, transform) {
          if (typeof transform === "function") {
            return transform(data, headers, status);
          }
          else if (toString.call(transform) === "[object Array]") {
            if (transform.length === 1) {
              return transform[0](data, headers, status);
            }

            // reduce takes an array and reduces it to one variable
            // fn1 is the "previous" element in the array and fn0 is the "current"
            return transform.reduce(function(fn1, fn0) {
              return fn0(fn1(data, headers, status));
            });
          }
          else {
            return data;
          }
        }

        function sendReq(config, reqData) {
          var deferred = $q.defer();

          function done(status, response, headersString, statusText) {
            //Math.max returns the largest number of the args passed it
            //eg Math.max(-1,0, 200, -100) returns 200
            status = Math.max(status, 0);
            deferred[isSuccess(status) ? "resolve" : "reject"]({
              status: status,
              data: response,
              headers: headersGetter(headersString),
              statusText: statusText,
              config: config
            });
            // we call $apply instead of $evalAsync/$applyAsync because we don't want 
            // to be asynchronous, we want this to resolve straight away
            if (!$rootScope.$$phase) {
              $rootScope.$apply();
            }
          }

          $httpBackend(
            config.method,
            config.url,
            reqData,
            done,
            config.headers,
            config.withCredentials
          );
          return deferred.promise;
        }

        function $http(requestConfig) {

          //assign takes the requestConfig and copies all of it's properties to 
          //{method:"GET"} object and will override if there are any conflicts
          //eg. if they both have a "method" property, it's the property of requestConfig
          //that will overite the property of the anonymous object 
          var config = Object.assign({
            method: "GET",
            transformRequest: defaults.transformRequest,
            transformResponse: defaults.transformResponse
          }, requestConfig);
          config.headers = mergeHeaders(requestConfig);

          // add the default behavior for withCredentials
          if (config.withCredentials === undefined && defaults.withCredentials !== undefined) {
            config.withCredentials = defaults.withCredentials;
          }

          var reqData = transformData(
            config.data,
            headersGetter(config.headers),
            undefined,
            config.transformRequest
          );

          // remove "Content-Type" header if there is not data to save size
          if (reqData === undefined) {
            Object.keys(config.headers).forEach(function(k) {
              if (k.toLowerCase() === "content-type") {
                delete config.headers[k];
              }
            });
          }

          function transformResponse(response) {
            if (response.data) {
              response.data = transformData(
                response.data,
                response.headers,
                response.status,
                config.transformResponse);
            }
            if (isSuccess(response.status)) {
              return response;
            }
            else {
              return $q.reject(response);
            }

            return response;
          }

          return sendReq(config, reqData)
            .then(transformResponse, transformResponse);
        }

        $http.defaults = defaults;
        return $http;
      }
    ];
  }


  window.$HttpProvider = $HttpProvider;
})();
