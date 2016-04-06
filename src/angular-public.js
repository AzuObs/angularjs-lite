(function() {
  "use strict";

  function publishExternalAPI() {
    setupModuleLoader(window);

    var ngModule = angular.module("ng", []);
    ngModule.provider("$parse", $ParseProvider);
    ngModule.provider("$filter", $FilterProvider);
    ngModule.provider("$rootScope", $RootScopeProvider);
    ngModule.provider("$q", $QProvider);
    ngModule.provider("$$q", $$QProvider);
    ngModule.provider("$http", $HttpProvider);
    ngModule.provider("$httpBackend", $HttpBackendProvider);
    ngModule.provider("$httpParamSerializer", $HttpParamSerializerProvider);
    ngModule.provider("$httpParamSerializerJQLike", $HttpParamSerializerJQLikeProvider);
    ngModule.provider("$compile", $CompileProvider);
    ngModule.provider("$controller", $ControllerProvider);
  }

  window.publishExternalAPI = publishExternalAPI;
})();
