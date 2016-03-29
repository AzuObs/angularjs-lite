(function() {
  "use strict";

  function $HttpProvider() {
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
      // data starts with "{" but not "{{"
      if (data.match(/^\{(?!\{)/)) {
        // if data ends with "}"
        return data.match(/\}$/);
      }
      // data starts with "["
      if (data.match(/^\[/)) {
        // end with ]
        return data.match(/\]$/);
      }
    }

    function defaultHttpResponseTransform(data, headers) {
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

    function buildUrl(url, serializedParams) {
      if (serializedParams.length) {
        url += (url.indexOf("?") === -1) ? "?" : "&";
        url += serializedParams;
      }
      return url;
    }


    ///////////////////////
    // this.incerceptors //
    ///////////////////////
    var interceptorFactories = this.interceptors = [];


    ///////////////////
    // this.defaults //
    ///////////////////
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
      transformResponse: [defaultHttpResponseTransform],
      paramSerializer: "$httpParamSerializer"
    };


    ///////////////
    // this.$get //
    ///////////////
    this.$get = ["$httpBackend", "$q", "$rootScope", "$injector",
      function $get($httpBackend, $q, $rootScope, $injector) {

        function serverRequest(config) {
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
          }

          return sendReq(config, reqData)
            .then(transformResponse, transformResponse);
        } //end serverRequest


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
          } //end done

          var url = buildUrl(config.url, config.paramSerializer(config.params));

          $httpBackend(
            config.method,
            url,
            reqData,
            done,
            config.headers,
            config.withCredentials
          );

          return deferred.promise;
        } // end sendReq


        function $http(requestConfig) {
          //assign takes the requestConfig and copies all of it's properties to 
          //{method:"GET"} object and will override if there are any conflicts
          //eg. if they both have a "method" property, it's the property of requestConfig
          //that will overite the property of the anonymous object 
          var config = Object.assign({
            method: "GET",
            transformRequest: defaults.transformRequest,
            transformResponse: defaults.transformResponse,
            paramSerializer: defaults.paramSerializer
          }, requestConfig);

          config.headers = mergeHeaders(requestConfig);

          //DI paramSerializer if it's the name of an instance
          if (typeof config.paramSerializer === "string") {
            config.paramSerializer = $injector.get(config.paramSerializer);
          }

          // pass "config" object to next .then
          var promise = $q.resolve(config);

          // for each interceptor, apply the request method
          interceptors.forEach(function(interceptor) {
            promise = promise.then(interceptor.request);
          });

          // send request
          promise = promise.then(serverRequest);

          // for each interceptor, apply the response method
          interceptors.forEach(function(interceptor) {
            promise = promise.then(interceptor.response);
          });

          return promise;
        } //end $http


        // create instances
        var interceptors = interceptorFactories.map(function(fn) {
          // allow for dependency injection
          return (typeof fn === "string" ? $injector.get(fn) : $injector.invoke(fn));
        });

        // access to defaults
        $http.defaults = defaults;
        // access to shorthand $http.get, $http.head, $http.delete methods
        ["get", "head", "delete"].forEach(function(method) {
          $http[method] = function(url, config) {
            return $http(Object.assign(config || {}, {
              method: method.toUpperCase(),
              url: url
            }));
          };
        });
        // access to shorthand $http.post, $http.put, $http.patch methods
        ["post", "put", "patch"].forEach(function(method) {
          $http[method] = function(url, data, config) {
            return $http(Object.assign(config || {}, {
              method: method.toUpperCase(),
              url: url,
              data: data
            }));
          };
        });
        return $http;
      }
    ];
  }


  function $HttpParamSerializerProvider() {
    this.$get = function() {
      return function serializeParams(params) {
        var parts = [];
        if (params) {
          Object.keys(params).forEach(function(k) {
            if (params[k] === null || params[k] === undefined) {
              return;
            }
            if (toString.call(params[k]) !== "[object Array]") {
              params[k] = [params[k]];
            }
            params[k].forEach(function(value) {
              if (toString.call(value) === "[object Object]") {
                value = JSON.stringify(value);
              }
              parts.push(encodeURIComponent(k) + "=" + encodeURIComponent(value));
            });
          });
        }
        return parts.join("&");
      };
    };
  }


  function $HttpParamSerializerJQLikeProvider() {
    this.$get = function() {
      return function serializeParams(params) {
        var parts = [];

        function serialize(value, prefix, topLevel) {
          // undefined || null
          if (value === null || value === undefined) {
            return;
          }

          // []
          if (toString.call(value) === "[object Array]") {
            value.forEach(function(v, i) {
              serialize(
                v,
                prefix + "[" +
                (_.isObject(v) ? i : "") +
                "]"
              );
            });
          }

          // {} && !Date
          else if (toString.call(value) === "[object Object]" &&
            toString.call(value) !== "[object Date]"
          ) {
            Object.keys(value).forEach(function(k) {
              serialize(
                value[k],
                prefix +
                (topLevel ? "" : "[") + k +
                (topLevel ? "" : "]")
              );
            });
          }
          else {
            parts.push(encodeURIComponent(prefix) + '=' + encodeURIComponent(value));
          }
        }

        serialize(params, "", true);

        return parts.join("&");
      };
    };
  }


  window.$HttpParamSerializerJQLikeProvider = $HttpParamSerializerJQLikeProvider;
  window.$HttpParamSerializerProvider = $HttpParamSerializerProvider;
  window.$HttpProvider = $HttpProvider;
})();
