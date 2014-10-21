/* jshint globalstrict: true */
'use strict';

interface IWatch {
    watchFn: Function;
    listenerFn: Function;
    last: any;
    valueEq: boolean;
}

interface IScope {
    $apply: Function;
    $eval: Function;
    $watch: Function;
    $digest: Function;
    $$digestOnce: Function;
}


class Scope implements IScope {

    private $$watchers: IWatch[];
    private $$lastDirtyWatch = null;

    constructor() {
        this.$$watchers = [];
    }

    initWatchVal() {

    }

    private $$areEqual(newValue, oldValue, valueEq) {
        if (valueEq) {
            return _.isEqual(newValue, oldValue);
        } else {
            return newValue === oldValue ||
                (typeof newValue === 'number' &&
                typeof oldValue === 'number' &&
                isNaN(newValue) &&
                isNaN(oldValue));
        }
    }

    $apply(expr) {
        try {
            return this.$eval(expr);
        } finally {
            this.$digest();
        }
    }

    $eval(expr, locals) {
        return expr(this, locals);
    }

    $watch(watchFn: Function, listenerFn: Function, valueEq: boolean) {
        var watcher: IWatch = {
            watchFn: watchFn,
            listenerFn: listenerFn || (() => { }),
            last: this.initWatchVal,
            valueEq: !!valueEq,
        };
        this.$$watchers.push(watcher);
        this.$$lastDirtyWatch = null;
    }

    $digest() {
        var ttl = 10;
        var dirty;
        this.$$lastDirtyWatch = null;
        do {
            dirty = this.$$digestOnce();
            if (dirty && !(ttl--)) {
                throw "10 digest iterations reached";
            }
        } while (dirty);
    }

    $$digestOnce() {
        var newValue, oldValue, dirty;
        _.forEach(this.$$watchers, (watcher: IWatch) => {
            newValue = watcher.watchFn(this);
            oldValue = watcher.last;
            if (!this.$$areEqual(newValue, oldValue, watcher.valueEq)) {
                this.$$lastDirtyWatch = watcher;
                watcher.last = (watcher.valueEq ? _.cloneDeep(newValue) : newValue);
                watcher.listenerFn(newValue, (oldValue === this.initWatchVal ? newValue : oldValue), this);
                dirty = true;
            }
            else if (this.$$lastDirtyWatch === watcher) {
                return false;
            }
        });
        return dirty;
    }
}

