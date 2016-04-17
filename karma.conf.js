(function() {
  "use strict";

  module.exports = function(config) {
    config.set({
      autoWatch: true,
      files: [
        "bower_components/lodash/dist/lodash.js",
        "bower_components/jquery/dist/jquery.js",
        "src/angular-public.js",
        "src/q.js",
        "src/apis.js",
        "src/loader.js",
        "src/injector.js",
        "src/angular.js",
        "src/filter.js",
        "src/filter-filter.js",
        "src/parse.js",
        "src/scope.js",
        "src/http.js",
        "src/http-backend.js",
        "src/compile.js",
        "src/controller.js",
        "src/interpolate.js",
        "src/directives/ng-controller.js",
        "src/directives/ng-transclude.js",
        "src/directives/ng-click.js",
        "src/bootstrap.js",
        "test/bootstrap-spec.js",
        "test/directives/ng-click-spec.js",
        "test/interpolate-spec.js",
        "test/directives/ng-controller-spec.js",
        "test/controller-spec.js",
        "test/compile-spec.js",
        "test/filter-spec.js",
        "test/filter-filter-spec.js",
        "test/parse-spec.js",
        "test/scope-spec.js",
        "test/loader-spec.js",
        "test/apis-spec.js",
        "test/injector-spec.js",
        "test/angular-public-spec.js",
        "test/q-spec.js",
        "test/http-spec.js",
        "test/directives/ng-transclude-spec.js",
      ],
      frameworks: ["jasmine", "sinon", "browserify"],
      preprocessors: {
        "src/**/*": ["browserify"],
        "test/**/*": ["browserify"]
      },
      browserify: {
        debug: true
      },
      plugins: [
        "karma-jasmine",
        "karma-sinon",
        "karma-browserify"
      ],
      port: 9876
    });
  };
})();
