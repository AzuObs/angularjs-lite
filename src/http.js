(function() {
  "use strict";

  function $HttpProvider() {
    this.$get = ["$httpBackend", function($httpBackend) {

    }];
  }


  window.$HttpProvider = $HttpProvider;
})();
