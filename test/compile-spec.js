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
  });


})();
