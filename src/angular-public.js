(function() {
  "use strict";

  function publishExternalAPI() {
    setupModuleLoader(window);

    var ngModule = angular.module("ng", []);
  }

  window.publishExternalAPI = publishExternalAPI;
})();