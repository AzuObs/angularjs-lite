(function() {
  "use strict";

  describe('$compile', function() {

    beforeEach(function() {
      delete window.angular;
      publishExternalAPI();
    });

    it('allows creating directives', function() {
      var myModule = angular.module('myModule', []);
      myModule.directive('testing', function() {});
      var injector = createInjector(['ng', 'myModule']);
      expect(injector.has('testingDirective')).toBe(true);
    });


    it('allows creating many directives with the same name', function() {
      var myModule = window.angular.module('myModule', []);
      myModule.directive('testing', function() {
        return {
          d: 'one'
        };
      });
      myModule.directive('testing', function() {
        return {
          d: 'two'
        };
      });
      var injector = createInjector(['ng', 'myModule']);
      var result = injector.get('testingDirective');

      expect(result.length).toBe(2);
      expect(result[0].d).toEqual('one');
      expect(result[1].d).toEqual('two');
    });


    it('does not allow a directive called hasOwnProperty', function() {
      var myModule = window.angular.module('myModule', []);
      myModule.directive('hasOwnProperty', function() {});
      expect(function() {
        createInjector(['ng', 'myModule']);
      }).toThrow();
    });

  });
})();
