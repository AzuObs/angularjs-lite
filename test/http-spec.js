(function() {
  "use strict";

  var publishExternalAPI = require("../src/angular-public.js");
  var createInjector = require("../src/injector.js");


  describe("$http", function() {
    var $http, $rootScope, $q;
    var xhr, requests;

    beforeEach(function() {
      publishExternalAPI();
      var injector = createInjector(["ng"]);
      $http = injector.get("$http");
      $rootScope = injector.get("$rootScope");
      $q = injector.get("$q");
    });

    beforeEach(function() {
      xhr = sinon.useFakeXMLHttpRequest();
      requests = [];
      xhr.onCreate = function(req) {
        requests.push(req);
      };
    });

    afterEach(function() {
      xhr.restore();
    });

    beforeEach(function() {
      jasmine.clock().install();
    });

    afterEach(function() {
      jasmine.clock().uninstall();
    });


    it("is a function", function() {
      expect($http instanceof Function).toBe(true);
    });


    it("returns a promise", function() {
      var result = $http({});
      $rootScope.$apply();
      expect(result).toBeDefined();
      expect(result.then).toBeDefined();
    });


    it("makes an XMLHttpRequest to given URL", function() {
      $http({
        method: "POST",
        url: "http://domain.com",
        data: "hello"
      });
      $rootScope.$apply();
      expect(requests.length).toBe(1);
      expect(requests[0].method).toBe("POST");
      expect(requests[0].url).toBe("http://domain.com");
      expect(requests[0].async).toBe(true);
      expect(requests[0].requestBody).toBe("hello");
    });


    it("resolves promise when XHR result received", function() {
      var requestConfig = {
        method: "GET",
        url: "http://domain.com"
      };
      var response;
      $http(requestConfig).then(function(res) {
        response = res;
      });
      $rootScope.$apply();
      requests[0].respond(200, {}, "Hello");

      expect(response).toBeDefined();
      expect(response.status).toBe(200);
      expect(response.statusText).toBe("OK");
      expect(response.data).toBe("Hello");
      expect(response.config.url).toEqual("http://domain.com");
    });


    it("rejects promise when XHR result received with error status", function() {
      var requestConfig = {
        method: "GET",
        url: "http://domain.com"
      };
      var response;
      $http(requestConfig).catch(function(res) {
        response = res;
      });
      $rootScope.$apply();
      requests[0].respond(401, {}, "Fail");

      expect(response).toBeDefined();
      expect(response.status).toBe(401);
      expect(response.statusText).toBe("Unauthorized");
      expect(response.data).toBe("Fail");
      expect(response.config.url).toEqual("http://domain.com");
    });


    it("rejects promise when XHR result errors/aborts", function() {
      var requestConfig = {
        method: "GET",
        url: "http://domain.com"
      };
      var response;
      $http(requestConfig).catch(function(r) {
        response = r;
      });
      $rootScope.$apply();
      requests[0].onerror();
      expect(response).toBeDefined();
      expect(response.status).toBe(0);
      expect(response.data).toBe(null);
      expect(response.config.url).toEqual("http://domain.com");
    });


    it("uses GET method by default", function() {
      $http({
        url: "http://domain.com"
      });
      $rootScope.$apply();
      expect(requests.length).toBe(1);
      expect(requests[0].method).toBe("GET");
    });


    it("sets headers on request", function() {
      $http({
        url: "http://domain.com",
        headers: {
          "Accept": "text/plain",
          "Cache-Control": "no-cache"
        }
      });
      $rootScope.$apply();
      expect(requests.length).toBe(1);
      expect(requests[0].requestHeaders.Accept).toBe("text/plain");
      expect(requests[0].requestHeaders["Cache-Control"]).toBe("no-cache");
    });


    it("sets default headers on request", function() {
      $http({
        url: "http://domain.com"
      });
      $rootScope.$apply();
      expect(requests.length).toBe(1);
      expect(requests[0].requestHeaders.Accept).toBe(
        "application/json, text/plain, */*");
    });


    it("sets method-specific default headers on request", function() {
      $http({
        method: "POST",
        url: "http://domain.com",
        data: "42"
      });
      $rootScope.$apply();
      expect(requests.length).toBe(1);
      expect(requests[0].requestHeaders["Content-Type"]).toBe(
        "application/json;charset=utf-8");
    });


    it("exposes default headers for overriding", function() {
      $http.defaults.headers.post["Content-Type"] = "text/plain;charset=utf-8";
      $http({
        method: "POST",
        url: "http://domain.com",
        data: "42"
      });
      $rootScope.$apply();
      expect(requests.length).toBe(1);
      expect(requests[0].requestHeaders["Content-Type"]).toBe(
        "text/plain;charset=utf-8");
    });


    it("exposes default headers through provider", function() {
      var injector = createInjector(["ng", function($httpProvider) {
        $httpProvider.defaults.headers.post["Content-Type"] =
          "text/plain;charset=utf-8";
      }]);
      $http = injector.get("$http");
      $rootScope = injector.get("$rootScope");
      $http({
        method: "POST",
        url: "http://domain.com",
        data: "42"
      });
      $rootScope.$apply();
      expect(requests.length).toBe(1);
      expect(requests[0].requestHeaders["Content-Type"]).toBe(
        "text/plain;charset=utf-8");
    });


    it("merges default headers case-insensitively", function() {
      $http({
        method: "POST",
        url: "http://domain.com",
        data: "42",
        headers: {
          "content-type": "text/plain;charset=utf-8"
        }
      });
      $rootScope.$apply();
      expect(requests.length).toBe(1);
      expect(requests[0].requestHeaders["content-type"]).toBe(
        "text/plain;charset=utf-8");
      expect(requests[0].requestHeaders["Content-Type"]).toBeUndefined();
    });


    it("does not send content-type header when no data", function() {
      $http({
        method: "POST",
        url: "http://domain.com",
        headers: {
          "Content-Type": "application/json;charset=utf-8"
        }
      });
      $rootScope.$apply();
      expect(requests.length).toBe(1);
      expect(requests[0].requestHeaders["Content-Type"]).not.toBe(
        "application/json;charset=utf-8");
    });


    it("supports functions as header values", function() {
      var contentTypeSpy = jasmine.createSpy().and.returnValue(
        "text/plain;charset=utf-8");
      $http.defaults.headers.post["Content-Type"] = contentTypeSpy;
      var request = {
        method: "POST",
        url: "http://domain.com",
        data: 42
      };
      $http(request);
      $rootScope.$apply();
      expect(contentTypeSpy).toHaveBeenCalledWith(request);
      expect(requests[0].requestHeaders["Content-Type"]).toBe(
        "text/plain;charset=utf-8");
    });

    it("ignores header function value when null/undefined", function() {
      var cacheControlSpy = jasmine.createSpy().and.returnValue(null);
      $http.defaults.headers.post["Cache-Control"] = cacheControlSpy;
      var request = {
        method: "POST",
        url: "http://domain.com",
        data: 42
      };
      $http(request);
      $rootScope.$apply();
      expect(cacheControlSpy).toHaveBeenCalledWith(request);
      expect(requests[0].requestHeaders["Cache-Control"]).toBeUndefined();
    });


    it("makes response headers available", function() {
      var response;
      $http({
        method: "POST",
        url: "http://domain.com",
        data: 42
      }).then(function(r) {
        response = r;
      });
      $rootScope.$apply();
      requests[0].respond(200, {
        "Content-Type": "text/plain"
      }, "Hello");
      expect(response.headers).toBeDefined();
      expect(response.headers instanceof Function).toBe(true);
      expect(response.headers("Content-Type")).toBe("text/plain");
      expect(response.headers("content-type")).toBe("text/plain");
    });


    it("may returns all response headers", function() {
      var response;
      $http({
        method: "POST",
        url: "http://domain.com",
        data: 42
      }).then(function(r) {
        response = r;
      });
      $rootScope.$apply();
      requests[0].respond(200, {
        "Content-Type": "text/plain"
      }, "Hello");
      expect(response.headers()).toEqual({
        "content-type": "text/plain"
      });
    });


    it("allows setting withCredentials", function() {
      $http({
        method: "POST",
        url: "http://domain.com",
        data: 42,
        withCredentials: true
      });
      $rootScope.$apply();
      expect(requests[0].withCredentials).toBe(true);
    });


    it("allows setting withCredentials from defaults", function() {
      $http.defaults.withCredentials = true;
      $http({
        method: "POST",
        url: "http://domain.com",
        data: 42
      });
      $rootScope.$apply();
      expect(requests[0].withCredentials).toBe(true);
    });


    it("allows transforming requests with functions", function() {
      $http({
        method: "POST",
        url: "http://domain.com",
        data: 42,
        transformRequest: function(data) {
          return "*" + data + "*";
        }
      });
      $rootScope.$apply();
      expect(requests[0].requestBody).toBe("*42*");
    });


    it("allows multiple request transform functions", function() {
      $http({
        method: "POST",
        url: "http://domain.info",
        data: 42,
        transformRequest: [function(data) {
          return "*" + data + "*";
        }, function(data) {
          return "-" + data + "-";
        }]
      });
      $rootScope.$apply();
      expect(requests[0].requestBody).toBe("-*42*-");
    });


    it("allows settings transforms in defaults", function() {
      $http.defaults.transformRequest = [function(data) {
        return "*" + data + "*";
      }];

      $http({
        method: "POST",
        url: "http://domain.info",
        data: 42
      });
      $rootScope.$apply();
      expect(requests[0].requestBody).toBe("*42*");
    });


    it("passes request headers getter to transforms", function() {
      $http.defaults.transformRequest = [function(data, headers) {
        if (headers("Content-Type") === "text/emphasized") {
          return "*" + data + "*";
        }
        else {
          return data;
        }
      }];

      $http({
        method: "POST",
        url: "http://domain.info",
        data: 42,
        headers: {
          "content-type": "text/emphasized"
        }
      });
      $rootScope.$apply();
      expect(requests[0].requestBody).toBe("*42*");
    });


    it("allows transforming responses with functions", function() {
      var response;
      $http({
        url: "http://domain.info",
        transformResponse: function(data) {
          return "*" + data + "*";
        }
      }).then(function(r) {
        response = r;
      });
      $rootScope.$apply();
      requests[0].respond(200, {
        "Content-Type": "text/plain"
      }, "Hello");
      expect(response.data).toEqual("*Hello*");
    });


    it("passes response headers to transform functions", function() {
      var response;
      $http({
        url: "http://domain.info",
        transformResponse: function(data, headers) {
          if (headers("content-type") === "text/decorated") {
            return "*" + data + "*";
          }
          else {
            return data;
          }
        }
      }).then(function(r) {
        response = r;
      });
      $rootScope.$apply();
      requests[0].respond(200, {
        "Content-Type": "text/decorated"
      }, "Hello");
      expect(response.data).toEqual("*Hello*");
    });


    it("allows setting default response transforms", function() {
      $http.defaults.transformResponse = [function(data) {
        return "*" + data + "*";
      }];
      var response;
      $http({
        url: "http://domain.info"
      }).then(function(r) {
        response = r;
      });
      $rootScope.$apply();
      requests[0].respond(200, {
        "Content-Type": "text/plain"
      }, "Hello");
      expect(response.data).toEqual("*Hello*");
    });


    it("passes HTTP status to response transformers", function() {
      var response;
      $http({
        url: "http://domain.info",
        transformResponse: function(data, headers, status) {
          if (status === 401) {
            return "unauthorized";
          }
          else {
            return data;
          }
        }
      }).catch(function(r) {
        response = r;
      });
      $rootScope.$apply();
      requests[0].respond(401, {
        "Content-Type": "text/plain"
      }, "Fail");
      expect(response.data).toEqual("unauthorized");
    });


    it("serializes object data to JSON for requests", function() {
      $http({
        method: "POST",
        url: "http://domain.com",
        data: {
          aKey: 42
        }
      });
      $rootScope.$apply();
      expect(requests[0].requestBody).toBe('{"aKey":42}');
    });


    it("serializes array data to JSON for requests", function() {
      $http({
        method: "POST",
        url: "http://domain.com",
        data: [1, "two", 3]
      });
      $rootScope.$apply();
      expect(requests[0].requestBody).toBe('[1,"two",3]');
    });


    it("does not serialize form data for requests", function() {
      var formData = new FormData();
      formData.append("aField", "aValue");
      $http({
        method: "POST",
        url: "http://domain.com",
        data: formData
      });
      $rootScope.$apply();
      expect(requests[0].requestBody).toBe(formData);
    });


    it("parses JSON data for JSON responses", function() {
      var response;
      $http({
        method: "GET",
        url: "http://domain.com"
      }).then(function(r) {
        response = r;
      });
      $rootScope.$apply();
      requests[0].respond(
        200, {
          "Content-Type": "application/json"
        },
        '{"message":"hello"}'
      );
      expect(_.isObject(response.data)).toBe(true);
      expect(response.data.message).toBe("hello");
    });


    it("parses a JSON object response without content type", function() {
      var response;
      $http({
        method: "GET",
        url: "http://domain.com"
      }).then(function(r) {
        response = r;
      });
      $rootScope.$apply();
      requests[0].respond(200, {}, '{"message":"hello"}');
      expect(_.isObject(response.data)).toBe(true);
      expect(response.data.message).toBe("hello");
    });


    it("parses a JSON array response without content type", function() {
      var response;
      $http({
        method: "GET",
        url: "http://domain.com"
      }).then(function(r) {
        response = r;
      });
      $rootScope.$apply();
      requests[0].respond(200, {}, "[1, 2, 3]");
      expect(_.isArray(response.data)).toBe(true);
      expect(response.data).toEqual([1, 2, 3]);
    });


    it("does not choke on response resembling JSON but not valid", function() {
      var response;
      $http({
        method: "GET",
        url: "http://domain.com"
      }).then(function(r) {
        response = r;
      });
      $rootScope.$apply();
      requests[0].respond(200, {}, "{1, 2, 3]");
      expect(response.data).toEqual("{1, 2, 3]");
    });


    it("does not try to parse interpolation expr as JSON", function() {
      var response;
      $http({
        method: "GET",
        url: "http://domain.com"
      }).then(function(r) {
        response = r;
      });
      $rootScope.$apply();
      requests[0].respond(200, {}, "{{expr}}");
      expect(response.data).toEqual("{{expr}}");
    });


    it("adds params to URL", function() {
      $http({
        url: "http://domain.com",
        params: {
          a: 42
        }
      });
      $rootScope.$apply();
      expect(requests[0].url).toBe("http://domain.com?a=42");
    });


    it("adds additional params to URL", function() {
      $http({
        url: "http://domain.com?a=42",
        params: {
          b: 42
        }
      });
      $rootScope.$apply();
      expect(requests[0].url).toBe("http://domain.com?a=42&b=42");
    });


    it("escapes url characters in params", function() {
      $http({
        url: "http://domain.com",
        params: {
          "==": "&&"
        }
      });
      $rootScope.$apply();
      expect(requests[0].url).toBe("http://domain.com?%3D%3D=%26%26");
    });


    it("does not attach null or undefined params", function() {
      $http({
        url: "http://domain.com",
        params: {
          a: null,
          b: undefined
        }
      });
      $rootScope.$apply();
      expect(requests[0].url).toBe("http://domain.com");
    });


    it("attaches multiple params from arrays", function() {
      $http({
        url: "http://domain.com",
        params: {
          a: [42, 43]
        }
      });
      $rootScope.$apply();
      expect(requests[0].url).toBe("http://domain.com?a=42&a=43");
    });


    it("serializes objects to json", function() {
      $http({
        url: "http://domain.com",
        params: {
          a: {
            b: 42
          }
        }
      });
      $rootScope.$apply();
      expect(requests[0].url).toBe("http://domain.com?a=%7B%22b%22%3A42%7D");
    });


    it("allows substituting param serializer", function() {
      $http({
        url: "http://domain.com",
        params: {
          a: 42,
          b: 43
        },
        paramSerializer: function(params) {
          return _.map(params, function(v, k) {
            return k + "=" + v + "lol";
          }).join("&");
        }
      });
      $rootScope.$apply();
      expect(requests[0].url).toEqual("http://domain.com?a=42lol&b=43lol");
    });


    it("allows substituting param serializer through DI", function() {
      var injector = createInjector(["ng", function($provide) {
        $provide.factory("mySpecialSerializer", function() {
          return function(params) {
            return _.map(params, function(v, k) {
              return k + "=" + v + "lol";
            }).join("&");
          };
        });
      }]);
      injector.invoke(function($http, $rootScope) {
        $http({
          url: "http://domain.com",
          params: {
            a: 42,
            b: 43
          },
          paramSerializer: "mySpecialSerializer"
        });
        $rootScope.$apply();
        expect(requests[0].url)
          .toEqual("http://domain.com?a=42lol&b=43lol");
      });
    });


    it("makes default param serializer available through DI", function() {
      var injector = createInjector(["ng"]);
      injector.invoke(function($httpParamSerializer) {
        var result = $httpParamSerializer({
          a: 42,
          b: 43
        });
        expect(result).toEqual("a=42&b=43");
      });
    });


    describe("JQ-like param serialization", function() {

      it("is possible", function() {
        $http({
          url: "http://domain.com",
          params: {
            a: 42,
            b: 43
          },
          paramSerializer: "$httpParamSerializerJQLike"
        });
        $rootScope.$apply();
        expect(requests[0].url).toEqual("http://domain.com?a=42&b=43");
      });


      it("uses square brackets in arrays", function() {
        $http({
          url: "http://domain.com",
          params: {
            a: [42, 43]
          },
          paramSerializer: "$httpParamSerializerJQLike"
        });
        $rootScope.$apply();
        expect(requests[0].url).toEqual("http://domain.com?a%5B%5D=42&a%5B%5D=43");
      });


      it("uses square brackets in objects", function() {
        $http({
          url: "http://domain.com",
          params: {
            a: {
              b: 42,
              c: 43
            }
          },
          paramSerializer: "$httpParamSerializerJQLike"
        });
        $rootScope.$apply();
        expect(requests[0].url).toEqual("http://domain.com?a%5Bb%5D=42&a%5Bc%5D=43");
      });


      it("supports nesting in objects", function() {
        $http({
          url: "http://domain.com",
          params: {
            a: {
              b: {
                c: 42
              }
            }
          },
          paramSerializer: "$httpParamSerializerJQLike"
        });
        $rootScope.$apply();
        expect(requests[0].url).toEqual("http://domain.com?a%5Bb%5D%5Bc%5D=42");
      });


      it("appends array indexes when items are objects", function() {
        $http({
          url: "http://domain.com",
          params: {
            a: [{
              b: 42
            }]
          },
          paramSerializer: "$httpParamSerializerJQLike"
        });
        $rootScope.$apply();
        expect(requests[0].url).toEqual("http://domain.com?a%5B0%5D%5Bb%5D=42");
      });
    });


    it("supports shorthand method for GET", function() {
      $http.get("http://domain.com", {
        params: {
          q: 42
        }
      });
      $rootScope.$apply();
      expect(requests[0].url).toBe("http://domain.com?q=42");
      expect(requests[0].method).toBe("GET");
    });


    it("supports shorthand method for HEAD", function() {
      $http.head("http://domain.com", {
        params: {
          q: 42
        }
      });
      $rootScope.$apply();
      expect(requests[0].url).toBe("http://domain.com?q=42");
      expect(requests[0].method).toBe("HEAD");
    });


    it("supports shorthand method for DELETE", function() {
      $http.delete("http://domain.com", {
        params: {
          q: 42
        }
      });
      $rootScope.$apply();
      expect(requests[0].url).toBe("http://domain.com?q=42");
      expect(requests[0].method).toBe("DELETE");
    });


    it("supports shorthand method for POST with data", function() {
      $http.post("http://domain.com", "data", {
        params: {
          q: 42
        }
      });
      $rootScope.$apply();
      expect(requests[0].url).toBe("http://domain.com?q=42");
      expect(requests[0].method).toBe("POST");
      expect(requests[0].requestBody).toBe("data");
    });


    it("supports shorthand method for PUT with data", function() {
      $http.put("http://domain.com", "data", {
        params: {
          q: 42
        }
      });
      $rootScope.$apply();
      expect(requests[0].url).toBe("http://domain.com?q=42");
      expect(requests[0].method).toBe("PUT");
      expect(requests[0].requestBody).toBe("data");
    });


    it("supports shorthand method for PATCH with data", function() {
      $http.patch("http://domain.com", "data", {
        params: {
          q: 42
        }
      });
      $rootScope.$apply();
      expect(requests[0].url).toBe("http://domain.com?q=42");
      expect(requests[0].method).toBe("PATCH");
      expect(requests[0].requestBody).toBe("data");
    });


    it("allows attaching interceptor factories", function() {
      var interceptorFactorySpy = jasmine.createSpy();
      var injector = createInjector(["ng", function($httpProvider) {
        $httpProvider.interceptors.push(interceptorFactorySpy);
      }]);
      $http = injector.get("$http");
      expect(interceptorFactorySpy).toHaveBeenCalled();
    });


    it("uses DI to instantiate interceptors", function() {
      var interceptorFactorySpy = jasmine.createSpy();
      var injector = createInjector(["ng", function($httpProvider) {
        $httpProvider.interceptors.push(["$rootScope", interceptorFactorySpy]);
      }]);
      $http = injector.get("$http");
      var $rootScope = injector.get("$rootScope");
      expect(interceptorFactorySpy).toHaveBeenCalledWith($rootScope);
    });


    it("allows referencing existing interceptor factories", function() {
      var interceptorFactorySpy = jasmine.createSpy().and.returnValue({});
      var injector = createInjector(["ng", function($provide, $httpProvider) {
        $httpProvider.interceptors.push("myInterceptor");
        $provide.factory("myInterceptor", interceptorFactorySpy);
      }]);
      $http = injector.get("$http");
      expect(interceptorFactorySpy).toHaveBeenCalled();
    });


    it("allows intercepting requests", function() {
      var injector = createInjector(["ng", function($httpProvider) {
        $httpProvider.interceptors.push(function() {
          return {
            request: function(config) {
              config.params.intercepted = true;
              return config;
            }
          };
        });
      }]);
      $http = injector.get("$http");
      $rootScope = injector.get("$rootScope");
      $http.get("http://domain.com", {
        params: {}
      });
      $rootScope.$apply();
      expect(requests[0].url).toBe("http://domain.com?intercepted=true");
    });


    it("allows intercepting responses", function() {
      var injector = createInjector(["ng", function($httpProvider) {
        $httpProvider.interceptors.push(_.constant({
          response: function(response) {
            response.intercepted = true;
            return response;
          }
        }));
      }]);
      $http = injector.get("$http");
      $rootScope = injector.get("$rootScope");
      var response;
      $http.get("http://domain.com").then(function(r) {
        response = r;
      });
      $rootScope.$apply();
      requests[0].respond(200, {}, "Hello");
      expect(response.intercepted).toBe(true);
    });


    it("allows intercepting request errors", function() {
      var requestErrorSpy = jasmine.createSpy();
      var injector = createInjector(["ng", function($httpProvider) {
        $httpProvider.interceptors.push(_.constant({
          request: function(config) {
            throw "fail";
          }
        }));
        $httpProvider.interceptors.push(_.constant({
          requestError: requestErrorSpy
        }));
      }]);
      $http = injector.get("$http");
      $rootScope = injector.get("$rootScope");
      $http.get("http://domain.com");
      $rootScope.$apply();
      expect(requests.length).toBe(0);
      expect(requestErrorSpy).toHaveBeenCalledWith("fail");
    });


    it("allows intercepting response errors", function() {
      var responseErrorSpy = jasmine.createSpy();
      var injector = createInjector(["ng", function($httpProvider) {
        $httpProvider.interceptors.push(_.constant({
          response: function() {
            throw "fail";
          }
        }));
        $httpProvider.interceptors.push(_.constant({
          responseError: responseErrorSpy
        }));
      }]);
      $http = injector.get("$http");
      $rootScope = injector.get("$rootScope");
      $http.get("http://domain.com");
      $rootScope.$apply();
      requests[0].respond(200, {}, "Hello");
      $rootScope.$apply();
      expect(responseErrorSpy).toHaveBeenCalledWith("fail");
    });


    it("allows attaching success handlers", function() {
      var data, status, headers, config;
      $http.get("http://domain.com").success(function(d, s, h, c) {
        data = d;
        status = s;
        headers = h;
        config = c;
      });
      $rootScope.$apply();
      requests[0].respond(200, {
        "Cache-Control": "no-cache"
      }, "Hello");
      $rootScope.$apply();
      expect(data).toBe("Hello");
      expect(status).toBe(200);
      expect(headers("Cache-Control")).toBe("no-cache");
      expect(config.method).toBe("GET");
    });


    it("allows attaching error handlers", function() {
      var data, status, headers, config;
      $http.get("http://domain.com").error(function(d, s, h, c) {
        data = d;
        status = s;
        headers = h;
        config = c;
      });
      $rootScope.$apply();
      requests[0].respond(401, {
        "Cache-Control": "no-cache"
      }, "Fail");
      $rootScope.$apply();
      expect(data).toBe("Fail");
      expect(status).toBe(401);
      expect(headers("Cache-Control")).toBe("no-cache");
      expect(config.method).toBe("GET");
    });


    it("allows aborting a request with a Promise", function() {
      var timeout = $q.defer();
      $http.get("http://domain.com", {
        timeout: timeout.promise
      });
      $rootScope.$apply();
      timeout.resolve();
      $rootScope.$apply();
      expect(requests[0].aborted).toBe(true);
    });


    it("allows aborting a request after a timeout", function() {
      $http.get("http://domain.com", {
        timeout: 5000
      });
      $rootScope.$apply();
      jasmine.clock().tick(5001);
      expect(requests[0].aborted).toBe(true);
    });


    describe("pending requests", function() {

      it("are in the collection while pending", function() {
        $http.get("http://domain.com");
        $rootScope.$apply();
        expect($http.pendingRequests).toBeDefined();
        expect($http.pendingRequests.length).toBe(1);
        expect($http.pendingRequests[0].url).toBe("http://domain.com");
        requests[0].respond(200, {}, "OK");
        $rootScope.$apply();
        expect($http.pendingRequests.length).toBe(0);
      });


      it("are also cleared on failure", function() {
        $http.get("http://domain.com");
        $rootScope.$apply();
        requests[0].respond(404, {}, "Not found");
        $rootScope.$apply();
        expect($http.pendingRequests.length).toBe(0);
      });
    });


    describe("useApplyAsync", function() {

      beforeEach(function() {
        var injector = createInjector(["ng", function($httpProvider) {
          $httpProvider.useApplyAsync(true);
        }]);
        $http = injector.get("$http");
        $rootScope = injector.get("$rootScope");
      });

      it("does not resolve promise immediately when enabled", function() {
        var resolvedSpy = jasmine.createSpy();
        $http.get("http://domain.com").then(resolvedSpy);
        $rootScope.$apply();
        requests[0].respond(200, {}, "OK");
        expect(resolvedSpy).not.toHaveBeenCalled();
      });


      it("resolves promise later when enabled", function() {
        var resolvedSpy = jasmine.createSpy();
        $http.get("http://domain.com").then(resolvedSpy);
        $rootScope.$apply();
        requests[0].respond(200, {}, "OK");
        jasmine.clock().tick(100);
        expect(resolvedSpy).toHaveBeenCalled();
      });
    });
  });
})();
