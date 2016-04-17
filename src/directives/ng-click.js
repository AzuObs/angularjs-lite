(function() {
  "use strict";


  function ngClickDirective($parse) {
    return {
      restrict: "A",
      compile: function(element, attrs) {
        var parsedFn = $parse(attrs.ngClick);

        return function link(scope, element, attrs) {
          element.on("click", function(evt) {
            scope.$apply(function() {
              parsedFn(scope, {
                $event: evt
              });
            });
          });
        };
      }
    };
  }
  ngClickDirective.$inject = ["$parse"];

  window.ngClickDirective = ngClickDirective;
})();
