(function() {
  "use strict";

  function $HttpBackendProvider() {
    this.$get = function() {
      return function $httpBackend(method, url, post, callback, headers) {
        var xhr = new window.XMLHttpRequest();
        xhr.open(method, url, true);

        if (headers) {
          Object.keys(headers).forEach(function(key) {
            xhr.setRequestHeader(key, headers[key]);
          });
        }


        xhr.send(post || null);

        xhr.onload = function() {
          var response = ("response" in xhr) ? xhr.response : xhr.responseText;
          var statusText = xhr.statusText || "";
          callback(
            xhr.status,
            response,
            xhr.getAllResponseHeaders(),
            statusText
          );
        };

        xhr.onerror = function() {
          callback(-1, null, "");
        };
      };
    };
  }


  window.$HttpBackendProvider = $HttpBackendProvider;
})();
