(function() {
  "use strict";

  describe("Scope", function() {
    it("can be constucted and used as an object", function() {
      var $scope = new Scope();
      $scope.aProperty = 1;
      expect($scope.aProperty).toBe(1);
    });


    describe("digest", function() {
      var scope;

      beforeEach(function() {
        scope = new Scope();
      });

      it("calls the listener function of a watch on the first $digest", function() {
        var watchFn = function() {
          return "foobar";
        };
        var listenerFn = jasmine.createSpy();
        scope.$watch(watchFn, listenerFn);

        scope.$digest();

        expect(listenerFn).toHaveBeenCalled();
      });

      it("calls the watch function with the scope as the argument", function() {
        var watchFn = jasmine.createSpy();
        var listenerFn = function() {};

        scope.$watch(watchFn, listenerFn);
        scope.$digest();

        expect(watchFn).toHaveBeenCalledWith(scope);
      });

      it("calls the listener fn after the watch value changes", function() {
        scope.someValue = "a";
        scope.counter = 0;

        var watchFn = function(scope) {
          return scope.someValue;
        };

        var listenerFn = function(n, o, scope) {
          scope.counter++;
        };

        scope.$watch(watchFn, listenerFn);

        expect(scope.counter).toBe(0);

        scope.$digest();
        expect(scope.counter).toBe(1);

        scope.someValue = "b";
        expect(scope.counter).toBe(1);

        scope.$digest();
        expect(scope.counter).toBe(2);
      });


      it("calls the listenerFn with new value as old value the first time", function() {
        scope.someValue = 123;
        var oldValueGiven;

        var watchFn = function(scope) {
          return scope.someValue;
        };
        var listenFn = function(n, o, scope) {
          oldValueGiven = o;
        };

        scope.$watch(watchFn, listenFn);
        scope.$digest();

        expect(oldValueGiven).toBe(123);
      });

      it("may have watchers that omit the listener function", function() {
        var watchFn = jasmine.createSpy().and.returnValue("something");

        scope.$watch(watchFn);
        scope.$digest();

        expect(watchFn).toHaveBeenCalled();
      });
    });

  });


})();
