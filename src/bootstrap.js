(function() {
  "use strict";

  // create global window.angular
  // angular and users can now register their modules via angular.module
  publishExternalAPI();

  window.angular.bootstrap = function(element) {
    // loads all the modules
    var injector = createInjector();

    var $element = $(element);
    $element.data("$injector", injector);

    return injector;
  };
})();
