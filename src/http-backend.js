(function() {
  "use strict";

  function $HttpBackendProvider() {
    this.$get = function() {
      return function $httpBackend(method, url, post, callback) {
        var xhr = new window.XMLHttpRequest();
        xhr.open(method, url, true);
        xhr.send(post || null);
        xhr.onload = function() {
          var response = ("response" in xhr) ? xhr.response : xhr.responseText;
          var statusText = xhr.statusText || "";
          callback(xhr.status, response, statusText);
        };
      };
    };
  }


  window.$HttpBackendProvider = $HttpBackendProvider;
})();