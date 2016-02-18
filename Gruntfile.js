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
      }
    });


    grunt.loadNpmTasks("grunt-karma");

    grunt.registerTask("unit-test", ["karma:unit"]);
  };

})();
