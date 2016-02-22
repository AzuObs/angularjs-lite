(function() {
  "use strict";

  describe("Scope", function() {
    it("can be constucted and used as an object", function() {
      var $scope = new Scope();
      $scope.aProperty = 1;
      expect($scope.aProperty).toBe(1);
    });


    describe("$digest", function() {
      var scope;

      beforeEach(function() {
        scope = new Scope();
      });


      it("calls the listener function of a watch on the first $digest", function() {
        var watchFn = function() {
          return "foobar";
        };
        var listenerFn = jasmine.createSpy();
        scope.$watch(watchFn, listenerFn);

        scope.$digest();

        expect(listenerFn).toHaveBeenCalled();
      });


      it("calls the watch function with the scope as the argument", function() {
        var watchFn = jasmine.createSpy();
        var listenerFn = function() {};

        scope.$watch(watchFn, listenerFn);
        scope.$digest();

        expect(watchFn).toHaveBeenCalledWith(scope);
      });


      it("calls the listener fn after the watch value changes", function() {
        scope.someValue = "a";
        scope.counter = 0;

        var watchFn = function(scope) {
          return scope.someValue;
        };

        var listenerFn = function(n, o, scope) {
          scope.counter++;
        };

        scope.$watch(watchFn, listenerFn);

        expect(scope.counter).toBe(0);

        scope.$digest();
        expect(scope.counter).toBe(1);

        scope.someValue = "b";
        expect(scope.counter).toBe(1);

        scope.$digest();
        expect(scope.counter).toBe(2);
      });


      it("calls the listenerFn with new value as old value the first time", function() {
        scope.someValue = 123;
        var oldValueGiven;

        var watchFn = function(scope) {
          return scope.someValue;
        };
        var listenFn = function(n, o, scope) {
          oldValueGiven = o;
        };

        scope.$watch(watchFn, listenFn);
        scope.$digest();

        expect(oldValueGiven).toBe(123);
      });


      it("may have watchers that omit the listener function", function() {
        var watchFn = jasmine.createSpy();

        scope.$watch(watchFn);
        scope.$digest();

        expect(watchFn).toHaveBeenCalled();
      });


      it("triggers chained watchers in the same digest", function() {
        scope.name = "Jane";

        var watchFn = function(scope) {
          return scope.upperName;
        };
        var listenerFn = function(n, o, scope) {
          if (n) {
            scope.initial = n.slice(0, 1) + ".";
          }
        };
        scope.$watch(watchFn, listenerFn);

        watchFn = function(scope) {
          return scope.name;
        };
        listenerFn = function(n, o, scope) {
          if (n) {
            scope.upperName = n.toUpperCase();
          }
        };
        scope.$watch(watchFn, listenerFn);

        scope.$digest();
        expect(scope.initial).toBe("J.");

        scope.name = "Bob";
        scope.$digest();
        expect(scope.initial).toBe("B.");
      });


      it("gives up on $watches after 10 iterations", function() {
        scope.counterA = 0;
        scope.counterB = 0;

        var watchFn = function(scope) {
          return scope.counterA;
        };
        var listenFn = function(n, o, scope) {
          scope.counterB++;
        };
        scope.$watch(watchFn, listenFn);

        watchFn = function(scope) {
          return scope.counterB;
        };
        listenFn = function(n, o, scope) {
          scope.counterA++;
        };
        scope.$watch(watchFn, listenFn);

        expect(function() {
          scope.$digest();
        }).toThrow();
        expect(scope.counterA).toBeGreaterThan(10);
        expect(scope.counterB).toBeGreaterThan(10);
      });


      it("stops the digest loop once it has gone a full loop since" +
        "last time it came to the $$lastDirtyWatch",
        function() {
          scope.array = _.range(100);
          var iterations = 0;

          _.times(100, function(i) {
            scope.$watch(function(scope) {
              iterations++;
              return scope.array[i];
            });
          });

          scope.$digest();
          expect(iterations).toEqual(200);

          scope.array[0] = "a";
          scope.$digest();
          expect(iterations).toEqual(301);
        });


      it("resets $$lastDirtyWatch during each scope.$watch so that the $digest loop will not stop " +
        "prematurely if a watcher is created during one of the listener functions triggered during" +
        " the $digest loop",
        function() {
          scope.aValue = "abc";
          scope.counter = 0;

          scope.$watch(function(scope) {
            return scope.aValue;
          }, function(n, o, scope) {
            scope.$watch(function(scope) {
              return scope.aValue;
            }, function(n, o, scope) {
              scope.counter++;
            });
          });

          scope.$digest();
          expect(scope.counter).toBe(1);
        });


      it("compares based on value if enabled", function() {
        scope.aValue = _.range(3);
        scope.counter = 0;

        scope.$watch(function(scope) {
          return scope.aValue;
        }, function(n, o, scope) {
          scope.counter++;
        }, true);

        scope.$digest();
        expect(scope.counter).toBe(1);

        scope.aValue[1] = 999;
        scope.$digest();
        expect(scope.counter).toBe(2);
      });


      it("correctly handles NaN", function() {
        scope.number = 0 / 0; //NaN
        scope.counter = 0;

        scope.$watch(function(scope) {
          return scope.number;
        }, function(n, o, scope) {
          scope.counter++;
        });

        scope.$digest();
        expect(scope.counter).toBe(1);


        scope.$digest();
        expect(scope.counter).toBe(1);
      });


      it("executes the first argument and return the result", function() {
        scope.aValue = 40;

        scope.$eval(function(scope) {
          return scope.aValue;
        });

        expect(scope.aValue).toBe(40);
      });


      it("passes the second $eval argument straight through", function() {
        scope.aValue = 40;

        var result = scope.$eval(function(scope, arg) {
          return scope.aValue + arg;
        }, 10);

        expect(result).toBe(50);
      });

      it("executes the $apply'ed function and starts the $digest loop", function() {
        scope.aValue = "someValue";
        scope.counter = 0;

        scope.$watch(function(scope) {
          return scope.aValue;
        }, function(n, o, scope) {
          scope.counter++;
        });

        scope.$digest();
        expect(scope.counter).toBe(1);


        scope.$apply(function() {
          scope.aValue = "someOtherValue";
        });
        expect(scope.counter).toBe(2);
      });


      it("evaluates $evalAsync function later in the same $digest cycle", function() {
        scope.aValue = "someValue";
        scope.asyncEvaluated = false;
        scope.asyncEvaluatedImmediately = false;

        scope.$watch(function(scope) {
          return scope.aValue;
        }, function(n, o, scope) {
          scope.$evalAsync(function(scope) {
            scope.asyncEvaluated = true;
          });

          scope.asyncEvaluatedImmediately = scope.asyncEvaluated;
        });

        scope.$digest();
        expect(scope.asyncEvaluated).toBe(true);
        expect(scope.asyncEvaluatedImmediately).toBe(false);
      });


      it("executes $evalAsync'ed functions added by watch functions", function() {
        scope.aValue = [1, 2, 3];
        scope.asyncEvaluated = false;
        scope.$watch(
          function(scope) {
            if (!scope.asyncEvaluated) {
              scope.$evalAsync(function(scope) {
                scope.asyncEvaluated = true;
              });
            }
            return scope.aValue;
          },
          function(newValue, oldValue, scope) {}
        );
        scope.$digest();
        expect(scope.asyncEvaluated).toBe(true);
      });


      it("executes $evalAsync'ed functions even when not dirty", function() {
        scope.aValue = [1, 2, 3];
        scope.asyncEvaluatedTimes = 0;
        scope.$watch(
          function(scope) {
            if (scope.asyncEvaluatedTimes < 2) {
              scope.$evalAsync(function(scope) {
                scope.asyncEvaluatedTimes++;
              });
            }
            return scope.aValue;
          },
          function(newValue, oldValue, scope) {}
        );

        scope.$digest();
        expect(scope.asyncEvaluatedTimes).toBe(2);
      });


      it("eventually halts $evalAsyncs added by watchers", function() {
        scope.aValue = "someValue";

        scope.$watch(function(scope) {
          scope.$evalAsync(function() {

          });
          return scope.aValue;
        });

        expect(function() {
          scope.$digest();
        }).toThrow();
      });


      it("it has a value value equal to the phase of the $digest phase", function() {
        scope.aValue = "someValue";
        scope.phaseInWatchFn = undefined;
        scope.phaseInApplyFn = undefined;
        scope.phaseInListenerFn = undefined;

        scope.$watch(function(scope) {
          scope.phaseInWatchFn = scope.$$phase;
          return scope.aValue;
        }, function(n, o, scope) {
          scope.phaseInListenerFn = scope.$$phase;
        });

        scope.$apply(function() {
          scope.phaseInApplyFn = scope.$$phase;
        });

        expect(scope.phaseInWatchFn).toBe("$digest");
        expect(scope.phaseInListenerFn).toBe("$digest");
        expect(scope.phaseInApplyFn).toBe("$apply");
      });


      it("schedules a $digest in $evalAsync", function(done) {
        scope.aValue = "abc";
        scope.counter = 0;

        scope.$watch(function(scope) {
            return scope.aValue;
          },
          function(newValue, oldValue, scope) {
            scope.counter++;
          });

        scope.$evalAsync(function(scope) {});
        expect(scope.counter).toBe(0);
        setTimeout(function() {
          expect(scope.counter).toBe(1);
          done();
        }, 0);
      });
    });
  });
})();
