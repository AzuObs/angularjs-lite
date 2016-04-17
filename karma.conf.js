(function() {
  "use strict";

  module.exports = function(config) {
    config.set({
      autoWatch: true,
      files: [
        "src/**/*",
        "test/**/*"
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
