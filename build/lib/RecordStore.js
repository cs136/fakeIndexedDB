"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var FDBKeyRange_1 = require("../FDBKeyRange");
var cmp_1 = require("./cmp");
var RecordStore = (function () {
    function RecordStore() {
        this.records = [];
    }
    RecordStore.prototype.get = function (key) {
        if (key instanceof FDBKeyRange_1.default) {
            return this.records.find(function (record) {
                return key.includes(record.key);
            });
        }
        return this.records.find(function (record) {
            return cmp_1.default(record.key, key) === 0;
        });
    };
    RecordStore.prototype.add = function (newRecord) {
        // Find where to put it so it's sorted by key
        var i;
        if (this.records.length === 0) {
            i = 0;
        }
        else {
            i = this.records.findIndex(function (record) {
                // cmp will only return 0 for an index. For an object store, any matching key has already been deleted,
                // but we still need to look for cmp = 1 to find where to insert.
                return cmp_1.default(record.key, newRecord.key) >= 0;
            });
            if (i === -1) {
                // If no matching key, add to end
                i = this.records.length;
            }
            else {
                // If matching key, advance to appropriate position based on value (used in indexes)
                while (i < this.records.length && cmp_1.default(this.records[i].key, newRecord.key) === 0) {
                    if (cmp_1.default(this.records[i].value, newRecord.value) !== -1) {
                        // Record value >= newRecord value, so insert here
                        break;
                    }
                    i += 1; // Look at next record
                }
            }
        }
        this.records.splice(i, 0, newRecord);
    };
    RecordStore.prototype.delete = function (key) {
        var range = key instanceof FDBKeyRange_1.default ? key : FDBKeyRange_1.default.only(key);
        var deletedRecords = [];
        this.records = this.records.filter(function (record) {
            var shouldDelete = range.includes(record.key);
            if (shouldDelete) {
                deletedRecords.push(record);
            }
            return !shouldDelete;
        });
        return deletedRecords;
    };
    RecordStore.prototype.deleteByValue = function (key) {
        var range = key instanceof FDBKeyRange_1.default ? key : FDBKeyRange_1.default.only(key);
        var deletedRecords = [];
        this.records = this.records.filter(function (record) {
            var shouldDelete = range.includes(record.value);
            if (shouldDelete) {
                deletedRecords.push(record);
            }
            return !shouldDelete;
        });
        return deletedRecords;
    };
    RecordStore.prototype.clear = function () {
        var deletedRecords = this.records.slice();
        this.records = [];
        return deletedRecords;
    };
    RecordStore.prototype.values = function (range, direction) {
        var _this = this;
        if (direction === void 0) { direction = "next"; }
        return _a = {},
            _a[Symbol.iterator] = function () {
                var i;
                if (direction === "next") {
                    i = 0;
                    if (range !== undefined && range.lower !== undefined) {
                        while (_this.records[i] !== undefined) {
                            var cmpResult = cmp_1.default(_this.records[i].key, range.lower);
                            if (cmpResult === 1 || (cmpResult === 0 && !range.lowerOpen)) {
                                break;
                            }
                            i += 1;
                        }
                    }
                }
                else {
                    i = _this.records.length - 1;
                    if (range !== undefined && range.upper !== undefined) {
                        while (_this.records[i] !== undefined) {
                            var cmpResult = cmp_1.default(_this.records[i].key, range.upper);
                            if (cmpResult === -1 || (cmpResult === 0 && !range.upperOpen)) {
                                break;
                            }
                            i -= 1;
                        }
                    }
                }
                return {
                    next: function () {
                        var done;
                        var value;
                        if (direction === "next") {
                            value = _this.records[i];
                            done = i >= _this.records.length;
                            i += 1;
                            if (!done && range !== undefined && range.upper !== undefined) {
                                var cmpResult = cmp_1.default(value.key, range.upper);
                                done = cmpResult === 1 || (cmpResult === 0 && range.upperOpen);
                                if (done) {
                                    value = undefined;
                                }
                            }
                        }
                        else {
                            value = _this.records[i];
                            done = i < 0;
                            i -= 1;
                            if (!done && range !== undefined && range.lower !== undefined) {
                                var cmpResult = cmp_1.default(value.key, range.lower);
                                done = cmpResult === -1 || (cmpResult === 0 && range.lowerOpen);
                                if (done) {
                                    value = undefined;
                                }
                            }
                        }
                        // The weird "as IteratorResult<Record>" is needed because of
                        // https://github.com/Microsoft/TypeScript/issues/11375 and
                        // https://github.com/Microsoft/TypeScript/issues/2983
                        // tslint:disable-next-line no-object-literal-type-assertion
                        return {
                            done: done,
                            value: value,
                        };
                    },
                };
            },
            _a;
        var _a;
    };
    return RecordStore;
}());
exports.default = RecordStore;
