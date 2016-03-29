(function() {
  "use strict";

  function $HttpBackendProvider() {
    this.$get = function() {
      return function $httpBackend(method, url, post, callback, headers, timeout, withCredentials) {
        var xhr = new window.XMLHttpRequest();
        xhr.open(method, url, true);

        if (headers) {
          Object.keys(headers).forEach(function(key) {
            xhr.setRequestHeader(key, headers[key]);
          });
        }

        if (withCredentials) {
          xhr.withCredentials = true;
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

        if (timeout) {
          timeout.then(function() {
            xhr.abort();
          });
        }
      };
    };
  }


  window.$HttpBackendProvider = $HttpBackendProvider;
})();
