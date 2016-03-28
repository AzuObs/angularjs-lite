(function() {
  "use strict";

  describe("$http", function() {
    var $http;
    var xhr, requests;

    beforeEach(function() {
      publishExternalAPI();
      var injector = createInjector(["ng"]);
      $http = injector.get("$http");
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


    it("is a function", function() {
      expect($http instanceof Function).toBe(true);
    });


    it("returns a promise", function() {
      var result = $http({});
      expect(result).toBeDefined();
      expect(result.then).toBeDefined();
    });


    it("makes an XMLHttpRequest to given URL", function() {
      $http({
        method: "POST",
        url: "http://domain.com",
        data: "hello"
      });

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

      expect(requests.length).toBe(1);
      expect(requests[0].requestHeaders.Accept).toBe("text/plain");
      expect(requests[0].requestHeaders["Cache-Control"]).toBe("no-cache");
    });
  });
})();
