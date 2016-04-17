(function() {
  "use strict";

  function ngControllerDirective() {
    return {
      restrict: "A",
      scope: true,
      controller: "@"
    };
  }


  module.exports = ngControllerDirective;
})();
