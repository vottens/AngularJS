/// <reference path="../scripts/typings/jasmine/jasmine.d.ts" />

/* jshint globalstrict: true */
/* global Scope: false */

'use strict';
describe("Scope", () => {

    it("can be constructed and used as an object", () => {
        var scope: any = new Scope();
        scope.aProperty = 1;
        expect(scope.aProperty).toBe(1);
    });

    describe("digest", () => {
        var scope;
        beforeEach(() => {
            scope = new Scope();
        });

        it("calls the listener function of a watch on first $digest", () => {
            var watchFn = () => 'wat';
            var listenerFn = jasmine.createSpy('test');
            scope.$watch(watchFn, listenerFn);
            scope.$digest();
            expect(listenerFn).toHaveBeenCalled();
        });

        it("calls the watch function with the scope as the argument", () => {
            var watchFn = jasmine.createSpy('test2');
            var listenerFn = () => { };
            scope.$watch(watchFn, listenerFn);
            scope.$digest();
            expect(watchFn).toHaveBeenCalledWith(scope);
        });

        it("calls the listener function when the watched value changes", () => {
            scope.someValue = 'a';
            scope.counter = 0;

            scope.$watch(
                (scope) => {
                    return scope.someValue;
                },
                (newValue, oldValue, scope) => {
                    scope.counter++;
                }
                );

            expect(scope.counter).toBe(0);

            scope.$digest();
            expect(scope.counter).toBe(1);

            scope.$digest();
            expect(scope.counter).toBe(1);

            scope.someValue = 'b';
            expect(scope.counter).toBe(1);

            scope.$digest();
            expect(scope.counter).toBe(2);
        });

        it("calls listener when watch value is first undefined", () => {
            scope.counter = 0;
            scope.$watch(
                (scope) => { return scope.someValue; },
                (newValue, oldValue, scope) => { scope.counter++; }
                );
            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it("calls listener with new value as old value the first time", () => {
            scope.someValue = 123;
            var oldValueGiven;
            scope.$watch(
                (scope) => { return scope.someValue; },
                (newValue, oldValue, scope) => { oldValueGiven = oldValue; }
                );
            scope.$digest();
            expect(oldValueGiven).toBe(123);
        });

        it("may have watchers that omit the listener function", () => {
            var watchFn = jasmine.createSpy('something').and.returnValue('something');
            scope.$watch(watchFn);
            scope.$digest();
            expect(watchFn).toHaveBeenCalled();
        });

        it("triggers chained watchers in the same digest", () => {
            scope.name = 'Jane';

            scope.$watch(
                (scope) => { return scope.nameUpper; },
                (newValue, oldValue, scope) => {
                    if (newValue) {
                        scope.initial = newValue.substring(0, 1) + '.';
                    }
                }
                );

            scope.$watch(
                (scope) => { return scope.name; },
                (newValue, oldValue, scope) => {
                    if (newValue) {
                        scope.nameUpper = newValue.toUpperCase();
                    }
                }
                );

            scope.$digest();
            expect(scope.initial).toBe('J.');
            scope.name = 'Bob';
            scope.$digest();
            expect(scope.initial).toBe('B.');
        });

        it("gives up on the watches after 10 iterations", () => {
            scope.counterA = 0;
            scope.counterB = 0;
            scope.$watch(
                (scope) => { return scope.counterA; },
                (newValue, oldValue, scope) => {
                    scope.counterB++;
                }
                );
            scope.$watch(
                (scope) => { return scope.counterB; },
                (newValue, oldValue, scope) => {
                    scope.counterA++;
                }
                );
            expect((() => { scope.$digest(); })).toThrow();
        });

        it("ends the digest when the last watch is clean", () => {
            scope.array = _.range(100);
            var watchExecutions = 0;
            _.times(100, (i) => {
                scope.$watch(
                    (scope) => {
                        watchExecutions++;
                        return scope.array[i];
                    },
                    (newValue, oldValue, scope) => {
                    }
                    );
            });
            scope.$digest();
            expect(watchExecutions).toBe(200);
            scope.array[0] = 420;
            scope.$digest();
            expect(watchExecutions).toBe(301);
        });

        it("does not end digest so that new watches are not run", () => {
            scope.aValue = 'abc';
            scope.counter = 0;
            scope.$watch(
                (scope) => { return scope.aValue; },
                (newValue, oldValue, scope) => {
                    scope.$watch(
                        (scope) => { return scope.aValue; },
                        (newValue, oldValue, scope) => {
                            scope.counter++;
                        }
                        );
                }
                );
            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it("compares based on value if enabled", () => {
            scope.aValue = [1, 2, 3];
            scope.counter = 0;
            scope.$watch(
                (scope) => { return scope.aValue; },
                (newValue, oldValue, scope) => {
                    scope.counter++;
                },
                true
                );

            scope.$digest();
            expect(scope.counter).toBe(1);

            scope.aValue.push(4);
            scope.$digest();

            expect(scope.counter).toBe(2);
        });


        it("correctly handles NaNs", () => {
            scope.number1 = 0 / 0; // NaN
            scope.counter = 0;
            scope.$watch(
                (scope) => { return scope.number1; },
                (newValue, oldValue, scope) => {
                    scope.counter++;
                }
                );
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it("executes $eval'ed function and returns result", () => {
            scope.aValue = 42;
            var result = scope.$eval((scope) => {
                return scope.aValue;
            });
            expect(result).toBe(42);
        });

        it("passes the second $eval argument straight through", () => {
            scope.aValue = 42;
            var result = scope.$eval((scope, arg) => {
                return scope.aValue + arg;
            }, 2);
            expect(result).toBe(44);
        });

        it("executes $apply'ed function and starts the digest", () => {
            scope.aValue = 'someValue';
            scope.counter = 0;
            scope.$watch(
                (scope) => {
                    return scope.aValue;
                },
                (newValue, oldValue, scope) => {
                    scope.counter++;
                }
                );
            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.$apply((scope) => {
                scope.aValue = 'someOtherValue';
            });
            expect(scope.counter).toBe(2);
        });

    });
});