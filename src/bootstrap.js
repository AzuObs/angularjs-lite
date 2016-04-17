(function() {
  "use strict";

  // create global window.angular
  // angular and users can now register their modules via angular.module
  publishExternalAPI();

  window.angular.bootstrap = function(element, modules) {
    // loads all the modules
    modules = modules || [];
    modules.unshift("ng");
    var injector = createInjector(modules);

    // add data to root element
    var $element = $(element);
    $element.data("$injector", injector);

    return injector;
  };
})();
