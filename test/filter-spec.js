(function() {
  "use strict";

  var publishExternalAPI = require("../src/angular-public.js");
  var createInjector = require("../src/injector.js");


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


    it("is available through injector", function() {
      var myFilter = function() {};
      angular.module("ng").config(function($filterProvider) {
        $filterProvider.register("my", function() {
          return myFilter;
        });
      });

      var injector = createInjector(["ng"]);
      expect(injector.has("myFilter")).toBe(true);
      expect(injector.get("myFilter")).toBe(myFilter);
    });


    it("may have dependencies in factory", function() {
      angular.module("ng").config(function($provide, $filterProvider) {
        $provide.constant("suffix", "!");
        $filterProvider.register("my", function(suffix) {
          return function(v) {
            return suffix + v;
          };
        });
      });

      var injector = createInjector(["ng"]);
      expect(injector.has("myFilter")).toBe(true);
    });


    it("can be registered through module API", function() {
      var myFilter = function() {};
      var module = angular.module("myModule", [])
        .filter("my", function() {
          return myFilter;
        });

      var injector = createInjector(["ng", "myModule"]);
      expect(injector.has("myFilter")).toBe(true);
      expect(injector.get("myFilter")).toBe(myFilter);
    });
  });
})();
