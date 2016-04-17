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


      it("loads other specified modules into the injector", function() {
        var element = $("<div></div>");
        window.angular.module("myModule", []).constant("aValue", 42);
        window.angular.module("mySecondModule", []).constant("aSecondValue", 43);
        window.angular.bootstrap(element, ["myModule", "mySecondModule"]);
        var injector = element.data("$injector");
        expect(injector.get("aValue")).toBe(42);
        expect(injector.get("aSecondValue")).toBe(43);
      });

    }); //describe("manual")
  }); //describe("bootstrap")
})();
