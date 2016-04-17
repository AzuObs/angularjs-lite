(function() {
  "use strict";

  function publishExternalAPI() {
    setupModuleLoader(window);

    var ngModule = angular.module("ng", []);
    ngModule.provider("$parse", require("../src/parse.js"));
    ngModule.provider("$filter", require("../src/filter.js"));
    ngModule.provider("$rootScope", require("../src/scope.js"));
    ngModule.provider("$q", require("../src/q.js").$QProvider);
    ngModule.provider("$$q", require("../src/q.js").$$QProvider);
    ngModule.provider("$http", require("../src/http.js").$HttpProvider);
    ngModule.provider("$httpBackend", require("../src/http-backend.js"));
    ngModule.provider("$httpParamSerializer", require("../src/http.js").$HttpParamSerializerProvider);
    ngModule.provider("$httpParamSerializerJQLike", require("../src/http.js").$HttpParamSerializerJQLikeProvider);
    ngModule.provider("$compile", require("../src/compile.js"));
    ngModule.provider("$controller", require("../src/controller.js"));
    ngModule.provider("$interpolate", require("../src/interpolate.js"));
    ngModule.directive("ngController", require("../src/directives/ng-controller.js"));
    ngModule.directive("ngTransclude", require("../src/directives/ng-transclude.js"));
    ngModule.directive("ngClick", require("../src/directives/ng-click.js"));
  }

  window.publishExternalAPI = publishExternalAPI;
})();
