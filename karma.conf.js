(function() {
  "use strict";

  module.exports = function(config) {
    config.set({
      autoWatch: true,
      files: [
        "bower_components/lodash/dist/lodash.js",
        "bower_components/jquery/dist/jquery.js",
        "src/**/*.js",
        "test/**/*.js"
      ],
      frameworks: ["jasmine"],
      plugins: [
        'karma-jasmine'
      ],
      port: 9876
    });
  };
})();
