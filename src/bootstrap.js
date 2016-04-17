(function() {
  "use strict";

  // create global window.angular
  // angular and users can now register their modules via angular.module
  publishExternalAPI();

  window.angular.bootstrap = function(element, modules, config) {
    var $element = $(element);

    // loads all the modules
    modules = modules || [];
    config = config || {};

    modules.unshift(["$provide", function($provide) {
      $provide.value("$rootElement", $element);
    }]);
    modules.unshift("ng");
    var injector = createInjector(modules, config.strictDi);

    // add data to root element
    $element.data("$injector", injector);

    // compile element
    injector.invoke(["$compile", "$rootScope", function($compile, $rootScope) {
      $rootScope.$apply(function() {
        $compile($element, $rootScope);
      });
    }]);


    return injector;
  };
})();
