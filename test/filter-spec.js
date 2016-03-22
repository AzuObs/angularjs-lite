(function() {
  "use strict";

  describe("filter", function() {

    beforeEach(function() {
      publishExternalAPI();
    });


    it("can be registered and obtained", function() {
      var myFilter = function() {};
      var myFilterFactory = function() {
        return myFilter;
      };

      // configurate the $filterProvider during the config phase
      angular.module("ng").config(function($filterProvider) {
        $filterProvider.register("my", myFilterFactory);
      });
      var injector = createInjector(["ng"]);
      var $filter = injector.get("$filter");

      expect($filter("my")).toBe(myFilter);
    });


    it("allows registering multiple filters with an object", function() {
      var myFilter = function() {};
      var myOtherFilter = function() {};

      angular.module("ng").config(function($filterProvider) {
        $filterProvider.register({
          my: function() {
            return myFilter;
          },
          myOther: function() {
            return myOtherFilter;
          }
        });
      });
      var injector = createInjector(["ng"]);
      var $filter = injector.get("$filter");

      expect($filter("my")).toBe(myFilter);
      expect($filter("myOther")).toBe(myOtherFilter);
    });
  });
})();