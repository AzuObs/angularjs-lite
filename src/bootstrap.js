(function() {
  "use strict";

  // launch Angular
  publishExternalAPI();


  window.angular.bootstrap = function() {
    var injector = createInjector();
    return injector;
  };
})();
