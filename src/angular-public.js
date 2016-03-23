(function() {
  "use strict";

  function publishExternalAPI() {
    setupModuleLoader(window);

    var ngModule = angular.module("ng", []);
    ngModule.provider("$filter", $FilterProvider);
    ngModule.provider("$parse", $ParseProvider);
  }

  window.publishExternalAPI = publishExternalAPI;
})();