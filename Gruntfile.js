(function() {
  "use strict";

  module.exports = function(grunt) {
    grunt.initConfig({
      pkg: grunt.file.readJSON("package.json"),

      karma: {
        options: {
          configFile: "karma.conf.js"
        },
        unit: {
          autoWatch: true,
        }
      },

      browserify: {
        browserifyOptions: {
          src: "src/bootstrap.js",
          dest: "build/angularjs-lite.js"
        }
      }
    });


    grunt.loadNpmTasks("grunt-karma");
    grunt.loadNpmTasks("grunt-browserify");

    grunt.registerTask("unit-test", ["karma:unit"]);
    grunt.registerTask("build", ["browserify"]);
  };

})();
