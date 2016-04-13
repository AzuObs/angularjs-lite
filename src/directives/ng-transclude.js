(function() {
  "use strict";


  function ngTranscludeDirective() {
    return {
      restrict: "AEC",
      link: function(scope, el, attrs, controller, trans) {
        trans(function(clone, scope) {
          el.empty();
          el.append(clone);
        });
      }
    };
  }


  window.ngTranscludeDirective = ngTranscludeDirective;
})();
