(function() {
  "use strict";

  function publishExternalAPI() {
    setupModuleLoader(window);

    var ngModule = angular.module("ng", []);
    ngModule.provider("$filter", $FilterProvider);
    ngModule.provider("$parse", $ParseProvider);
    ngModule.provider("$rootScope", $RootScopeProvider);
  }

  window.publishExternalAPI = publishExternalAPI;
})();