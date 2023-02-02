var MathInterval;
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "Interval": () => (/* reexport */ Interval)
});

;// CONCATENATED MODULE: ./src/util/Util.ts
var Util = /** @class */ (function () {
    function Util() {
    }
    Util.isNull = function (arg) {
        return undefined === arg || null === arg;
    };
    return Util;
}());


;// CONCATENATED MODULE: ./src/interval-util/IntervalEmpty.ts

var IntervalEmpty = /** @class */ (function () {
    function IntervalEmpty() {
    }
    IntervalEmpty.isHandledAsEmpty = function (start, end, includeStart, includeEnd) {
        if (Util.isNull(start) || Util.isNull(end) || isNaN(start) || isNaN(end)) {
            return true;
        }
        start = Number(start);
        end = Number(end);
        if (start > end || (start === end && (!includeStart || !includeEnd))) {
            return true;
        }
    };
    return IntervalEmpty;
}());


;// CONCATENATED MODULE: ./src/interval-util/IntervalMatch.ts
var IntervalMatch = /** @class */ (function () {
    function IntervalMatch() {
    }
    IntervalMatch.isOverlapping = function (interval1, interval2) {
        if (!this.isIntervalComparable(interval1, interval2)) {
            return false;
        }
        if (interval1.start === interval2.end) {
            return (interval1.includeStart || interval2.includeEnd);
        }
        if (interval1.end === interval2.start) {
            return interval1.includeEnd || interval2.includeStart;
        }
        return (interval1.start <= interval2.start && interval2.start <= interval1.end) ||
            (interval1.start <= interval2.end && interval2.end <= interval1.end) ||
            (interval2.start <= interval1.start && interval1.start <= interval2.end) ||
            (interval2.start <= interval1.end && interval1.end <= interval2.end);
    };
    IntervalMatch.contains = function (interval, intervalToCheck) {
        if (!this.isIntervalComparable(interval, intervalToCheck)) {
            return false;
        }
        var startIsEqual = (interval.start === intervalToCheck.start && (interval.includeStart || !intervalToCheck.includeStart));
        var endIsEqual = (interval.end === intervalToCheck.end && (interval.includeEnd || !intervalToCheck.includeEnd));
        return ((interval.start < intervalToCheck.start || startIsEqual) &&
            (intervalToCheck.end < interval.end || endIsEqual));
    };
    IntervalMatch.isIntervalComparable = function (interval1, interval2) {
        return interval1 && interval2 && !interval1.isEmpty() && !interval2.isEmpty();
    };
    return IntervalMatch;
}());


;// CONCATENATED MODULE: ./src/interval-util/IntervalSort.ts
var IntervalSort = /** @class */ (function () {
    function IntervalSort() {
    }
    IntervalSort.sort = function (intervals) {
        var intervalsCopy = intervals.map(function (obj) { return (obj.copy()); });
        intervalsCopy.sort(function (a, b) {
            if (a.start < b.start) {
                return -1;
            }
            else if (a.start > b.start) {
                return 1;
            }
            if (a.includeStart && !b.includeStart) {
                return -1;
            }
            else if (!a.includeStart && b.includeStart) {
                return 1;
            }
            if (a.end < b.end) {
                return -1;
            }
            else if (a.end > b.end) {
                return 1;
            }
            if (a.includeEnd && !b.includeEnd) {
                return 1;
            }
            else if (!a.includeEnd && b.includeEnd) {
                return -1;
            }
            return 0;
        });
        return intervalsCopy;
    };
    return IntervalSort;
}());


;// CONCATENATED MODULE: ./src/interval-util/IntervalUnion.ts



var IntervalUnion = /** @class */ (function () {
    function IntervalUnion() {
    }
    IntervalUnion.union = function (intervals) {
        if (!intervals || intervals.length <= 0) {
            return [];
        }
        var relevantIntervals = intervals.filter(function (interval) { return !Util.isNull(interval) && !interval.isEmpty(); });
        if (relevantIntervals.length === 0) {
            return [];
        }
        relevantIntervals = IntervalSort.sort(relevantIntervals);
        var current = relevantIntervals[0];
        var result = [];
        for (var i = 1; i < relevantIntervals.length; ++i) {
            var next = relevantIntervals[i];
            if (current.isOverlapping(next)) {
                var unionStart = current.start;
                var unionEnd = current.end;
                var unionIncludeStart = current.includeStart;
                var unionIncludeEnd = current.includeEnd;
                // not needed because of presorting (next.start < current.start)
                if (next.end > current.end) {
                    unionEnd = next.end;
                    unionIncludeEnd = next.includeEnd;
                }
                if (next.start === current.start && (next.includeStart || current.includeStart)) {
                    unionIncludeStart = true;
                }
                if (next.end === current.end && (next.includeEnd || current.includeEnd)) {
                    unionIncludeEnd = true;
                }
                current = new Interval(unionStart, unionEnd, unionIncludeStart, unionIncludeEnd);
            }
            else {
                result.push(current);
                current = next;
            }
        }
        result.push(current);
        return result;
    };
    return IntervalUnion;
}());


;// CONCATENATED MODULE: ./src/interval-util/IntervalFrom.ts

var IntervalFrom = /** @class */ (function () {
    function IntervalFrom() {
    }
    IntervalFrom.from = function (intervalNotation) {
        if (null === intervalNotation || !(typeof intervalNotation === "string")) {
            throw new Error("Invalid interval definition");
        }
        var regex = new RegExp(/^{}|{\s*([^\s\t\n\r,]+)\s*}|([(\[\]])\s*([^\s\t\n\r,]+)\s*,\s*([^\s\t\n\r,]+)\s*([)\]\[])$/);
        var matches = regex.exec(intervalNotation);
        if (matches && matches.length === 6) {
            if (matches[1] !== undefined) {
                var start = Number(matches[1]);
                var end = Number(matches[1]);
                var includeStart = true;
                var includeEnd = true;
                return new Interval(start, end, includeStart, includeEnd);
            }
            else {
                var start = Number(matches[3]);
                var end = Number(matches[4]);
                var includeStart = (matches[2] === "[");
                var includeEnd = (matches[5] === "]");
                return new Interval(start, end, includeStart, includeEnd);
            }
        }
        throw new Error("Invalid interval definition ".concat(intervalNotation));
    };
    return IntervalFrom;
}());


;// CONCATENATED MODULE: ./src/interval-util/index.ts






;// CONCATENATED MODULE: ./src/Interval.ts


var Interval = /** @class */ (function () {
    function Interval(start, end, includeStart, includeEnd) {
        if (Util.isNull(includeStart)) {
            includeStart = true;
        }
        else {
            includeStart = Boolean(includeStart);
        }
        if (Util.isNull(includeEnd)) {
            includeEnd = true;
        }
        else {
            includeEnd = Boolean(includeEnd);
        }
        if (IntervalEmpty.isHandledAsEmpty(start, end, includeStart, includeEnd)) {
            this.start = null;
            this.end = null;
            this.includeStart = null;
            this.includeEnd = null;
        }
        else {
            this.start = Number(start);
            this.end = Number(end);
            this.includeStart = includeStart;
            this.includeEnd = includeEnd;
        }
    }
    Interval.prototype.isEmpty = function () {
        return null === this.start &&
            null === this.end &&
            null === this.includeStart &&
            null === this.includeEnd;
    };
    Interval.prototype.isOverlapping = function (interval) {
        return IntervalMatch.isOverlapping(this, interval);
    };
    Interval.prototype.contains = function (numberOrInterval) {
        var interval = new Interval(null, null);
        if (numberOrInterval && numberOrInterval instanceof Interval) {
            interval = numberOrInterval;
        }
        else if (numberOrInterval && typeof numberOrInterval === "number") {
            var number = Number(numberOrInterval);
            interval = new Interval(number, number, true, true);
        }
        return IntervalMatch.contains(this, interval);
    };
    Interval.prototype.copy = function () {
        return Object.assign(new Interval(null, null), this);
    };
    Interval.prototype.isEqual = function (interval) {
        if (!interval) {
            return false;
        }
        return this.start === interval.start &&
            this.end === interval.end &&
            this.includeStart === interval.includeStart &&
            this.includeEnd === interval.includeEnd;
    };
    Interval.sort = function () {
        var intervals = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            intervals[_i] = arguments[_i];
        }
        return IntervalSort.sort(intervals);
    };
    Interval.union = function () {
        var intervals = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            intervals[_i] = arguments[_i];
        }
        return IntervalUnion.union(intervals);
    };
    Interval.from = function (intervalNotation) {
        return IntervalFrom.from(intervalNotation);
    };
    return Interval;
}());


;// CONCATENATED MODULE: ./src/index.ts


MathInterval = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=math-interval.js.map