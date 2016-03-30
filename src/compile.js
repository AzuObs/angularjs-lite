(function() {
  "use strict";

  function $CompileProvider($provide) {
    this.directive = function(name, directiveFactory) {
      $provide.factory(name + "Directive", directiveFactory);
    };

    this.$get = function() {
      return "";
    };
  }
  $CompileProvider.$inject = ["$provide"];


  window.$CompileProvider = $CompileProvider;
})();
