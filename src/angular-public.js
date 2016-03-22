(function() {
  "use strict";

  function publishExternalAPI() {
    setupModuleLoader(window);

    var ngModule = angular.module("ng", []);
    ngModule.provider("$filter", $filterProvider);
  }

  window.publishExternalAPI = publishExternalAPI;
})();