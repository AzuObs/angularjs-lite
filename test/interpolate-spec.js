(function() {
  "use strict";

  describe("$interpolate", function() {

    beforeEach(function() {
      delete window.angular;
      publishExternalAPI();
    });

    it("should exist", function() {
      var injector = createInjector(["ng"]);
      expect(injector.has("$interpolate")).toBe(true);
    });


    it('produces an identity function for static content', function() {
      var injector = createInjector(['ng']);
      var $interpolate = injector.get('$interpolate');
      var interp = $interpolate('hello');
      expect(interp instanceof Function).toBe(true);
      expect(interp()).toEqual('hello');
    });

  }); // describe("$interpolate")
})();
