(function() {
  "use strict";

  describe("injector", function() {

    beforeEach(function() {
      delete window.angular;
      setupModuleLoader(window);
    });

    it("can be created", function() {
      var injector = createInjector([]);
      expect(injector).toBeDefined();
    });


  });
})();