(function() {
  "use strict";

  var $ = require("jquery");
  var publishExternalAPI = require("../src/angular-public.js");
  var createInjector = require("../src/injector.js");

  // create global window.angular
  // angular and users can now register their modules via angular.module
  publishExternalAPI();

  // can be called manually
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
        $compile($element)($rootScope);
      });
    }]);

    return injector;
  };

  // automatic loading of angular
  // look for "ng-app"
  var ngAttrPrefixes = ["data-ng-", "ng-", "ng:", "x-ng-"];
  $(document).ready(function() {
    var foundAppElement, foundModule;

    ngAttrPrefixes.forEach(function(prefix) {
      var attrName = prefix + "app";
      var selector = "[" + attrName.replace(":", "\\:") + "]";
      var element;
      if (!foundAppElement && (element = document.querySelector(selector))) {
        foundAppElement = element;
        foundModule = element.getAttribute(attrName);
      }
    });

    if (foundAppElement) {
      var strictDi = ngAttrPrefixes.some(function(prefix) {
        var attrName = prefix + "strict-di";
        return foundAppElement.hasAttribute(attrName);
      });
      window.angular.bootstrap(foundAppElement, foundModule ? [foundModule] : [], strictDi);
    }
  });


})();
