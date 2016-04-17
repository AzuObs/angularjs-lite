(function() {
  "use strict";

  var module = angular.module("sampleApp", []);

  module.controller("SampleAppCtrl", ["$scope", function($scope) {
    var self = this;
    this.counter = 0;

    this.increment = function() {
      self.counter++;
    };
    this.decrement = function() {
      self.counter--;
    };
  }]);
})();
