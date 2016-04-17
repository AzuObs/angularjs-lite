(function() {
  "use strict";


  describe("bootstrap", function() {

    describe("manual", function() {

      it("is available", function() {
        expect(window.angular.bootstrap).toBeDefined();
      });


      it("creates and returns an injector", function() {
        var element = $("<div></div>");
        var injector = window.angular.bootstrap(element);
        expect(injector).toBeDefined();
        expect(injector.invoke).toBeDefined();
      });


      it("attaches the injector to the bootstrapped element", function() {
        var element = $("<div></div>");
        var injector = window.angular.bootstrap(element);
        expect(element.data("$injector")).toBe(injector);
      });


      it("loads built-ins into the injector", function() {
        var element = $("<div></div>");
        var injector = window.angular.bootstrap(element);
        expect(injector.has("$compile")).toBe(true);
        expect(injector.has("$rootScope")).toBe(true);
      });

    }); //describe("manual")
  }); //describe("bootstrap")
})();
