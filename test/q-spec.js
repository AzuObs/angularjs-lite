(function() {
  "use strict";


  describe("$q", function() {
    var $q;

    beforeEach(function() {
      publishExternalAPI();
      $q = createInjector(["ng"]).get("$q");
    });

    it("can create a Deferred", function() {
      var d = $q.defer();
      expect(d).toBeDefined();
    });


    it("has a promise for each Deferred", function() {
      var d = $q.defer();
      expect(d.promise).toBeDefined();
    });


    it("can resolve a promise", function(done) {
      var deferred = $q.defer();
      var promise = deferred.promise;
      var promiseSpy = jasmine.createSpy();

      promise.then(promiseSpy);
      deferred.resolve("a-ok");

      setTimeout(function() {
        expect(promiseSpy).toHaveBeenCalledWith("a-ok");
        done();
      }, 1);
    });
  });
})();