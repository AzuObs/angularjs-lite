(function() {
  "use strict";

  function $HttpBackendProvider() {
    this.$get = function() {
      return function $httpBackend(method, url, post, callback, headers, timeout, withCredentials) {
        var xhr = new window.XMLHttpRequest();
        var timeoutId;

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
          // if there is a timeout planned, clear it
          if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
          }

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
          // if there is a timeout planned, clear it
          if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
          }

          callback(-1, null, "");
        };

        // if timeout exists and timeout is a promise
        if (timeout && timeout.then) {
          timeout.then(function() {
            xhr.abort();
          });
        }
        // if timeout is a number
        else if (timeout > 0) {
          timeoutId = setTimeout(function() {
            xhr.abort();
          }, timeout);
        }
      };
    };
  }


  module.exports = $HttpBackendProvider;
})();
