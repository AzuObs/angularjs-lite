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
        url: "http://foobar.com",
        data: "hello"
      });

      expect(requests.length).toBe(1);
      expect(requests[0].method).toBe("POST");
      expect(requests[0].url).toBe("http://foobar.com");
      expect(requests[0].async).toBe(true);
      expect(requests[0].requestBody).toBe("hello");
    });
  });
})();
