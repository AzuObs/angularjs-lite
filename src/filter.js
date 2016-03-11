(function() {
  "use strict";

  var filters = {};

  window.register = function(name, factory) {
    var filter = factory();
    filters[name] = filter;
    return filter;
  };

  window.filter = function(name) {
    return filters[name];
  };

})();
