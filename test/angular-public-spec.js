(function() {
  "use strict";

  describe("angularPublic", function() {

    it("sets up the angular object and the module loader", function() {
      publishExternalAPI();
      expect(window.angular).toBeDefined();
      expect(window.angular.module).toBeDefined();
    });


    it("sets up the ng module", function() {
      publishExternalAPI();
      expect(createInjector(["ng"])).toBeDefined();
    });
  });

})();