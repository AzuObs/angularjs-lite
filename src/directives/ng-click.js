(function() {
  "use strict";


  function ngClickDirective() {
    return {
      restrict: "A",
      link: function(scope, element, attrs) {
        element.on("click", function() {
          scope.$apply(attrs.ngClick);
        });
      }
    };
  }


  window.ngClickDirective = ngClickDirective;
})();
