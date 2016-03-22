(function() {
  "use strict";

  describe("apis", function() {

    describe("hashKey", function() {

      it("is undefined:undefined for undefined", function() {
        expect(hashKey(undefined)).toEqual("undefined:undefined");
      });


      it("is object:null for null", function() {
        expect(hashKey(null)).toEqual("object:null");
      });


      it("is boolean:true for true", function() {
        expect(hashKey(true)).toEqual("boolean:true");
      });


      it("is boolean:false for false", function() {
        expect(hashKey(false)).toEqual("boolean:false");
      });


      it("is number:42 for 42", function() {
        expect(hashKey(42)).toEqual("number:42");
      });


      it("is string:42 for '42'", function() {
        expect(hashKey("42")).toEqual("string:42");
      });
    });
  });
})();