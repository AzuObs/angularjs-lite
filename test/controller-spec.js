(function() {
  "use strict";

  describe("$controller", function() {

    beforeEach(function() {
      delete window.angular;
      publishExternalAPI();
    });

    it("instantiates controller functions", function() {
      var injector = createInjector(["ng"]);
      var $controller = injector.get("$controller");

      function MyController() {
        this.invoked = true;
      }
      var controller = $controller(MyController);
      expect(controller).toBeDefined();
      expect(controller instanceof MyController).toBe(true);
      expect(controller.invoked).toBe(true);
    });


    it('injects dependencies to controller functions', function() {
      var injector = createInjector(['ng', function($provide) {
        $provide.constant('aDep', 42);
      }]);
      var $controller = injector.get('$controller');

      function MyController(aDep) {
        this.theDep = aDep;
      }
      var controller = $controller(MyController);
      expect(controller.theDep).toBe(42);
    });
  });
})();
