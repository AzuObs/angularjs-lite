(function() {
  "use strict";

  describe("$http", function() {
    var $http, xhr;

    beforeEach(function() {
      publishExternalAPI();
      var injector = createInjector(["ng"]);
      $http = injector.get("$http");
      xhr = sinon.useFakeXMLHttpRequest();
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
  });
})();
