// Data structure for an interval, assuming both bounds are closed
class Interval {
    // start and end are both floats in 24hr time
    constructor(start, end){
        this.start = start;
        this.end = end;
    }

    // Given an overlapping interval, merge them into one interval
    // Five possible scenarios:
    // 1. i2 starts before i1 and ends before i1 => produce (i2.start, i1.end)
    // 2. i2 starts before i1 and ends after i1 => produce (i2.start, i2.end)
    // 3. i1 starts bfore i2 and ends before i2 => produce (i1.start, i2.end)
    // 4. i1 starts before i2 and ends after i2 => produce (i1.start)
    // 5. Otherwise, produce -1 (no union occurs)
    union(i2){
        return;
    }

    // Return True if i1 is within the same interval
    within_interv(interv){
        return (this.start >= interv.start && this.end <= interv.end);
    }

    // Return True if i2 is overlapping, otherwise False

    is_overlapping(i2){
        i1_arr = []
        i2_arr = []

        for (var i = 0; i < (this.end - this.start); i += 0.5){
            i1_arr.push(i);
        }

        for (var j = 0; j < (i2.end - i2.start); j += 0.5){
            i2_arr.push(i);
        }

        console.log(i1_arr);
        console.log(i2_arr);
    }
}

new_interv = new Interval(6, 9)
new_interv1 = new Interval(7, 11)

new_interv.is_overlapping(new_interv1);