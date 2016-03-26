(function() {
  "use strict";

  describe("$http", function() {
    var $http;

    beforeEach(function() {
      publishExternalAPI();
      var injector = createInjector(["ng"]);
      $http = injector.get("$http");
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
