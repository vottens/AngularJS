/* jshint globalstrict: true */
'use strict';
var Scope = (function () {
    function Scope() {
        this.$$lastDirtyWatch = null;
        this.$$watchers = [];
    }
    Scope.prototype.initWatchVal = function () {
    };

    Scope.prototype.$$areEqual = function (newValue, oldValue, valueEq) {
        if (valueEq) {
            return _.isEqual(newValue, oldValue);
        } else {
            return newValue === oldValue || (typeof newValue === 'number' && typeof oldValue === 'number' && isNaN(newValue) && isNaN(oldValue));
        }
    };

    Scope.prototype.$apply = function (expr) {
        try  {
            return this.$eval(expr);
        } finally {
            this.$digest();
        }
    };

    Scope.prototype.$eval = function (expr, locals) {
        return expr(this, locals);
    };

    Scope.prototype.$watch = function (watchFn, listenerFn, valueEq) {
        var watcher = {
            watchFn: watchFn,
            listenerFn: listenerFn || (function () {
            }),
            last: this.initWatchVal,
            valueEq: !!valueEq
        };
        this.$$watchers.push(watcher);
        this.$$lastDirtyWatch = null;
    };

    Scope.prototype.$digest = function () {
        var ttl = 10;
        var dirty;
        this.$$lastDirtyWatch = null;
        do {
            dirty = this.$$digestOnce();
            if (dirty && !(ttl--)) {
                throw "10 digest iterations reached";
            }
        } while(dirty);
    };

    Scope.prototype.$$digestOnce = function () {
        var _this = this;
        var newValue, oldValue, dirty;
        _.forEach(this.$$watchers, function (watcher) {
            newValue = watcher.watchFn(_this);
            oldValue = watcher.last;
            if (!_this.$$areEqual(newValue, oldValue, watcher.valueEq)) {
                _this.$$lastDirtyWatch = watcher;
                watcher.last = (watcher.valueEq ? _.cloneDeep(newValue) : newValue);
                watcher.listenerFn(newValue, (oldValue === _this.initWatchVal ? newValue : oldValue), _this);
                dirty = true;
            } else if (_this.$$lastDirtyWatch === watcher) {
                return false;
            }
        });
        return dirty;
    };
    return Scope;
})();
//# sourceMappingURL=scope.js.map
