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
    $evalAsync: Function;
    $watch: Function;
    $digest: Function;
    $$digestOnce: Function;
    $$beginPhase: Function;
    $$clearPhase: Function;
}


class Scope implements IScope {

    private $$watchers: IWatch[] = [];
    private $$lastDirtyWatch = null;
    private $$asyncQueue = [];
    private $$phase: string = null;

    constructor() {
    }

    initWatchVal() {

    }

    $$beginPhase(phase) {
        if (this.$$phase) {
            throw this.$$phase + ' already in progress.';
        }
        this.$$phase = phase;
    }

    $$clearPhase() {
        this.$$phase = null;
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
            this.$$beginPhase("$apply");
            return this.$eval(expr);
        } finally {
            this.$$clearPhase();
            this.$digest();
        }
    }

    $evalAsync(expr: any) {
        var self = this;
        if (!self.$$phase && !self.$$asyncQueue.length) {
            setTimeout(() => {
                if (self.$$asyncQueue.length) {
                    self.$digest();
                }
            }, 0);
        }
        this.$$asyncQueue.push({ scope: this, expression: expr });
    }

    $eval(expr: any, locals?: any) {
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
        this.$$beginPhase("$digest");
        do {
            while (this.$$asyncQueue.length) {
                var asyncTask = this.$$asyncQueue.shift();
                asyncTask.scope.$eval(asyncTask.expression);
            }
            dirty = this.$$digestOnce();
            if ((dirty || this.$$asyncQueue.length) && !(ttl--)) {
                this.$$clearPhase();
                throw "10 digest iterations reached";
            }
        } while (dirty || this.$$asyncQueue.length);
        this.$$clearPhase();
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
