(function() {
  "use strict";

  module.exports = function(grunt) {
    grunt.initConfig({
      pkg: grunt.file.readJSON("package.json"),

      testem: {
        unit: {
          options: {
            framework: "jasmine2",
            launch_in_dev: ["PhantomJS"],
            serve_files: [
              "node_modules/sinon/pkg/sinon.js",
              "src/**/*.js",
              "test/**/*.js"
            ]
          },
          watch_files: [
            "src/**/*.js",
            "test/**/*.js"
          ]
        }
      }
    });


    grunt.loadNpmTasks("grunt-contrib-testem");


    grunt.registerTask("test", [""]);


  };

})();
