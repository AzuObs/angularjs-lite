(function() {
  "use strict";

  module.exports = function(config) {
    config.set({
      autoWatch: true,
      files: [
        "bower_components/lodash/dist/lodash.js",
        "bower_components/jquery/dist/jquery.js",
        "src/apis.js",
        "src/loader.js",
        "src/injector.js",
        "src/angular.js",
        "src/filter.js",
        "src/filter-filter.js",
        "src/parse.js",
        "src/scope.js",
        "test/filter-spec.js",
        "test/filter-filter-spec.js",
        "test/parse-spec.js",
        "test/scope-spec.js",
        "test/loader-spec.js",
        "test/injector-spec.js",
        "test/apis-spec.js"
      ],
      frameworks: ["jasmine"],
      // browsers: ["PhantomJS"],
      plugins: [
        "karma-jasmine"
        // "karma-phantomjs-launcher"
      ],
      port: 9876
    });
  };
})();