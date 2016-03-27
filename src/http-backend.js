(function() {
  "use strict";

  function $HttpBackendProvider() {
    this.$get = function() {
      return function $httpBackend(method, url, post) {
        var xhr = new window.XMLHttpRequest();
        xhr.open(method, url, true);
        xhr.send(post || null);
      };
    };
  }


  window.$HttpBackendProvider = $HttpBackendProvider;
})();
