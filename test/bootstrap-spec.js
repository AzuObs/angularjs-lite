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

    }); //describe("manual")
  }); //describe("bootstrap")
})();
