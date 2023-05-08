/*
TODO: Replace the reloading of webpage when overwriting course/TA data.
TODO: Refresh the event calendar when a TA is added/modified/assigned
TODO: For scheduling, allow there to be preset assignments and then build the schedule around it
TODO: Change alerts to dismissible alerts
TODO: Add ical/google calendar export feature for TA independent cal viewer
TODO: Separate into admin and TA portal
    TA portal will be for TAs to enter their info/availability
    Admin portal can override their info
*/


var newTACalendar;
var eventCalendar;
var courses = [];

// For populating the TA select menu
var curCourse;
var curTASelected;
var curEvent;

/*
One Time Scheduler Module
User can input the day and time that they want their event to be scheduled and the duration (in mins)
Site will return a list of TAs that are available and has no conflicts, and a list of TAs that are available but has a conflict (indicate event name that conflicts)
*/

class OneTimeScheduler {
    constructor(){
        return;
    }

    findAvailableNoConflictTAs(tas, day, start, end){
        var availNoConflictArr = []

        if (day !== null && start !== null && end !== null){
            for (let i = 0; i < tas.length; i++){
                var ta = tas[i]
                var tempEvent = new CourseEvent("Temp Event", day, start, end, "", "", 1, -1, {}, "Other", 1)
                console.log(tempEvent);
    
                if (ta.isAvailable(tempEvent)){
                    availNoConflictArr.push(ta)
                }
            }
        }

        return availNoConflictArr;
    }

    findAvailableConflictTAs(tas, day, start, end){
        var availConflictArr = []
        const interv = new Interval(start, end);

        if (day !== null && start !== null && end !== null){
            for (let i = 0; i < tas.length; i++){
                var ta = tas[i];
    
                if (ta.avail[day].contains(interv) && ta.assigned_avail[day].contains(interv)){
                    availConflictArr.push(ta)
                }
            }
        }

        return availConflictArr;
    }

    generateULElements(tas){
        const ul = document.createElement("UL");
        if (tas.length === 0){
            const li = document.createElement("LI");
            li.innerHTML = "No TAs found"
            ul.appendChild(li);
        }
        else{
            for (var i = 0; i < tas.length; i++){
                const li = document.createElement("LI");
                li.innerHTML = `${tas[i].name} - ${curCourse.allocTable.getUnallocatedHours(tas[i].name)} hrs unallocated`
                ul.appendChild(li)
            }
        }

        return ul.innerHTML;
    }
}

class AllocHoursTable {
    constructor(){
        this.table = document.getElementById("allocationHoursTable");
        this.tableArr = this.generateTotalTAHours();
        this.headers = ["Name", "Union Orientation", "Safety", "Teaching", "Assisting Instructors", "Meetings/Prep/Training", "Grading", "Admin", "OHs/Piazza", "Curriculum Dev", "Other", "Invigilation", "Vacation", "Total Hours", "Max Hours"];

        var btn = document.getElementById("allocExportCSVBtn")
        var csv = this.exportAllocToCSV();
        var blob = new Blob([csv], {"type": "text/csv;charset=utf-8;"})
        var csvURL = window.URL.createObjectURL(blob);
        btn.href = csvURL;
        btn.download = "allocation_of_hours.csv";


        if (this.table !== null && this.table.innerHTML === ""){
            this.generateTHead();
            this.generateAllocationHoursBody();

            return;
        }
        else if (this.table !== null && this.table !== undefined && this.table.innerHTML !== ""){
            this.clearTable();
            this.generateTHead();
            this.generateAllocationHoursBody();

            return;
        }

        return;
    }

    generateTHead(){
        if (this.table !== null || this.table !== undefined){
            this.table.innerHTML = `<thead class="table-primary border-dark">
            <th scope="col">TA</th>
            <th scope="col">Union Orientation</th>
            <th scope="col">Safety</th>
            <th scope="col">Teaching</th>
            <th scope="col">Assisting Instructors</th>
            <th scope="col">Meetings/Prep/Training</th>
            <th scope="col">Grading</th>
            <th scope="col">Admin</th>
            <th scope="col">OHs/Piazza</th>
            <th scope="col">Curriculum</th>
            <th scope="col">Other</th>
            <th scope="col">Invigilation</th>
            <th scope="col">Vacation</th>
            <th scope="col">Total Hours</th>
            <th scope="col">Max Hours</th>
            </thead>`

            return true;
        }
        else{
            return false;
        }
    }

    // Create the rows for the allocation of hours table
    generateAllocationHoursBody(){
        if (this.table === null || this.table === undefined){
            console.log("Alloc of Hours table not found");
            return false;
        }

        for (var i = 0; i < this.tableArr.length; i++){
            var newRow = this.table.insertRow(-1);

            for (var j = 0; j < this.headers.length; j++){
                let newTD = newRow.insertCell(-1);
                newTD.innerHTML = `${this.tableArr[i][this.headers[j]]}`;
            }
        }

        return;
    }

    // Create a list of objs for that contain the hours for each TA
    generateTotalTAHours(){
        var arr = []
        for (var i = 0; i < curCourse.tas.length; i++){
            var curTA = curCourse.tas[i];
            var obj = {"Name": curTA.name, "Union Orientation": 0.5, "Safety": 0, "Teaching": 0, "Assisting Instructors": 0, "Meetings/Prep/Training": 0, "Grading": 0, "Admin": 0, "OHs/Piazza": 0,
        "Curriculum Dev": 0, "Other": Math.round(curTA.max_hrs * 0.04 * 10) / 10, "Invigilation": 0, "Vacation": Math.round(curTA.max_hrs * 0.0417 * 10) / 10, "Total Hours": 0, "Max Hours": curTA.max_hrs};

            if (curTA.exp === "New"){
                obj["Safety"] = 2.5;
                obj["Meetings/Prep/Training"] = 5.5;
            }
            else {
                obj["Safety"] = 1;
                obj["Meetings/Prep/Training"] = 2;
            }

            // Go through all the events that a TA is assigned to
            for (var j = 0; j < curTA.assigned.length; j++){
                let evt = curCourse.findEvent(curTA.assigned[j]);

                if (evt === null){
                    continue;
                }

                let hrs = evt.getLength() * evt.numWeeks;

                if (evt.type === "Lecture"){
                    obj["Assisting Instructors"] += hrs;
                }
                else if (evt.type === "Lab" || evt.type === "Tutorial"){
                    obj["Teaching"] += hrs;
                }
                else if (evt.type === "Piazza" || evt.type === "Office Hours"){
                    obj["OHs/Piazza"] += hrs;
                }
                else if (evt.type === "Meeting"){
                    obj["Meetings/Prep/Training"] += hrs;
                }
                else if (evt.type === "Curriculum Dev"){
                    obj["Curriculum Dev"] += hrs;
                }
                else {
                    obj["Other"] += hrs;
                }
            }

            // Sum up all the hours in obj to get the total hrs
            for (let k = 1; k < Object.keys(obj).length - 2; k++){
                obj["Total Hours"] += obj[Object.keys(obj)[k]];
            }

            obj["Other"] = Math.round(obj["Other"]);
            obj["Total Hours"] = Math.round(obj["Total Hours"]);

            arr.push(obj);
        }

        return arr;
    }

    // Use Papa.unparse to generate CSV file
    exportAllocToCSV(){
        return Papa.unparse(this.tableArr);
    }

    clearTable(){
        if (this.table !== null){
            this.table.innerHTML = "";
        }
    }

    // Assumes that the TA exists already
    getUnallocatedHours(taName){
        for (let i = 0; i < this.tableArr.length; i++){
            const tr = this.tableArr[i];

            if (tr["Name"] === taName){
                return tr["Max Hours"] - tr["Total Hours"];
            }
        }

        return -1;
    }
}

class CourseEvent {
    // An event has a name, day, start and end time (in 24hr time as float), location (str), description, 
    // TAs assigned, event type (Lecture, Lab/Tutorial, Piazza, Curriculum Dev, other)
    constructor(name, day, start, end, loc, desc, needed, id, assigned, type, numWeeks){
        this.name = name;
        this.day = day;
        this.start = start; // float
        this.end = end; // float
        this.loc = loc;
        this.description = desc;
        this.tas_needed = needed;
        this.assigned = assigned;
        this.id = id;
        this.type = type;
        this.numWeeks = numWeeks;

        if (Object.keys(assigned).length === 0){
            for (let i = 0; i < this.tas_needed; i++){
                this.assigned[i] = "";
            }
        }

        if (this.type === undefined){
            this.type = "Other"
            this.numWeeks = 14;
        }

        return;
    }

    // Returns True if event is fully assigned (no empty assignments)
    isFullyAssigned(){
        var num = 0;
        for (let i = 0; i < Object.keys(this.assigned).length; i++){
            if (this.assigned[i] === ""){
                num++;
            }
        }
        return num == 0;
    }

    // Returns True if TA is assigned to the event
    isTAAssigned(ta){
        for (let i = 0; i < Object.keys(this.assigned).length; i++){
            if (this.assigned[i] === ta.id){
                return true;
            }
        }

        return false;
    }

    deleteEvent(){
        var modal = document.getElementById("event" + this.id + "modal");
        var eventBtn = document.getElementById("event" + this.id + "btn");

        // Need to hide the modal if visible when deleting it

        if (modal !== null){
            $("#" + "event" + this.id + "modal").modal("hide");
            modal.remove();
        }

        if (eventBtn !== null){
            eventBtn.remove();
        }

        return;
    }

    editEvent(name, day, start, end, loc, needed, desc, assigned, etype, numWeeks){
        const conf = "Are you sure you want to overwrite the current event?"

        if (conf === true){
            this.name = name;
            this.day = day;
            this.start = start;
            this.end = end;
            this.loc = loc;
            this.description = desc;
            this.tas_needed = needed;
            this.assigned = assigned;
            this.type = etype;
            this.numWeeks = numWeeks;

            // Delete the current modal and event button and replace with new one in the Course class
            this.newEventButton()
            this.newModal();

            return true;
        }

        return false;;
    }

    // Assigns a TA to the event
    assignTA(ta, slot){
        // If the TA is null, then we empty the specified slot instead
        if (ta === null || ta === undefined){
            this.assigned[slot] = ""
            return true;
        }

        // If TA isn't already assigned, then assign them to the event
        if (!this.isTAAssigned(ta)){
            this.assigned[slot] = ta.id;
            return true;
        }

        alert("This TA is already assigned to the event.");
        return false;
    }

    unassignTA(ta, slot){
        if (ta === null || ta === ""){
            console.log("Couldn't unassign a null TA");
            return false;
        }

        if (this.assigned[slot] === ta.id){
            this.assigned[slot] = ""
            return true;
        }
    }

    getAvailSlots(){
        var availSlots = []

        for (var i = 0; i < Object.keys(this.assigned).length; i++){
            if (this.assigned[i] !== undefined && !this.isSlotTaken(i)){
                availSlots.push(i);
            }
        }

        return availSlots;
    }

    // Returns True if slot is taken, False otherwise
    isSlotTaken(slot){
        return this.assigned[slot] !== ""
    }

    // Creates new modal or updates existing modal
    newModal(){
        var modal = document.getElementById("event" + this.id + "modal");
        // if modal already exists, then remove it and create a new one
        if (modal !== null){
            // Hide the modal if currently active
            $("#" + "event" + this.id + "modal").modal("hide");
            modal.remove();
        }

        // otherwise create new modal
        modal = document.createElement("div");
        modal.classList.add("modal", "fade")
        modal.id = "event" + this.id + "modal";
        modal.tabIndex = "-1";
        modal.innerHTML = `<div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${this.name}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p><b>Location: </b>${this.loc} <br>
              <b>Time: </b>${this.day} ${floatToStrTime(this.start)}-${floatToStrTime(this.end)} <br>
              <br>
              <b>Description: </b>
              ${this.description}
              <br>
              <b>Assigned TAs:</b>
              <div>
              ${this.generateTASelect()}
              </div>

            </p>
          </div>
          <div class="modal-footer" style="justify-content: space-between;">
                <div>
                    <button type="button" class="btn btn-warning" onClick="openEditEvent(${this.id})">Edit</button>
                    <button type="button" class="btn btn-danger" onclick="deleteEvent(${this.id})">Delete Event</button>
                </div>
                <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Save changes</button>
        </div>
      </div>`

        // Store it in a div
        const cal = document.getElementById("modalEvents");
        cal.appendChild(modal);

        const sels = cal.querySelectorAll(`[id*='${this.id}-SelectInput']`).forEach((sel) => { this.selectAssignedTA(sel) })

        modal.querySelectorAll(".ta-modal-select").forEach((sel) => {
            sel.addEventListener("change", (evt) => { assignTAToEvent(evt) })
        })

    }

    // If one of the TA select options matches the currently assigned TA, then set the selectedIndex to that TA
    selectAssignedTA(sel){
        const spl = sel.id.split("-")
        const slot = parseInt(spl[spl.length - 1]);

        for (let i = 0; i < sel.options.length; i++){
            if (sel.options[i].value == this.assigned[slot]){
                sel.selectedIndex = i;
            }
        }
    }

    generateTASelect(){
        var div = document.createElement("DIV");

        var avail_tas = this.filterAvailableTAs();
        console.log(avail_tas);

        // Generate the TA select inputs based on number of TAs needed for the course
        for (var i = 0; i < this.tas_needed; i++){
            var select = document.createElement("select");
            select.classList.add("form-select", "ta-modal-select");
            select.id = "event-" + this.id + "-SelectInput-" + i;

            // populate the select with options of TAs that are available
            // Add an empty option
            var option = document.createElement("option");
            option.text = "";
            option.value = "-1";
            select.add(option);

            select.selectedIndex = 0;

            // If TAs are already assigned, then set those TAs first
            for (var j = 0; j < avail_tas.length; j++){
                var option = document.createElement("option");
                option.text = avail_tas[j].name + ` (${avail_tas[j].totalWeeklyHoursRemaining()} hrs available)`;
                option.value = avail_tas[j].id;
                select.add(option);
            }

            div.appendChild(select);
        }

        return div.innerHTML;
    }

    getNumTAsNeededStill(){
        var needed = 0;

        for (let i = 0; i < Object.keys(this.assigned).length; i++){
            if (this.assigned[i] === ""){
                needed++;
            }
        }

        return needed;
    }

    getNumAvailableTAs(){
        return this.filterAvailableTAs().length;
    }

    filterAvailableTAs(){
        var arr = []
        for (let i = 0; i < curCourse.tas.length; i++){
            if (curCourse.tas[i].isAvailable(this) || curCourse.tas[i].isAssigned(this)){
                arr.push(curCourse.tas[i]);
            }
        }

        return arr;
    }

    hasNoAvailableTAs(){
        return this.filterAvailableTAs().length === 0;
    }

    // Creates new event button to be shown on calendar or updates existing button
    // TODO: Add a filter for events based on the TA you want to schedule
    newEventButton(){
        var eventBtn = document.getElementById("event" + this.id +"btn");

        if (eventBtn !== null){
            eventBtn.remove();
        }
        
        var eventBtn = document.createElement("button");
        eventBtn["type"] = "button";
        eventBtn.classList.add("event");
        eventBtn.id = "event" + this.id + "btn";
        eventBtn.dataset.bsToggle = "modal"
        eventBtn.dataset.bsTarget = `#event${this.id}modal`;

        if (this.isFullyAssigned()){
            eventBtn.innerHTML = `<h5>${this.name} <br/><img src="img/person-fill-check.svg" width="60px" height="30px"></h5>
        ${this.loc} <br>
        ${this.day} ${floatToStrTime(this.start)}-${floatToStrTime(this.end)}`
        }
        else if (this.hasNoAvailableTAs()){
            eventBtn.innerHTML = `<h5>${this.name} <br/><img src="img/person-fill-dash.svg" width="60px" height="30px"></h5>
        ${this.loc} <br>
        ${this.day} ${floatToStrTime(this.start)}-${floatToStrTime(this.end)}`
        }
        else{
            eventBtn.innerHTML = `<h5>${this.name} <br/><img src="img/person-fill-add.svg" width="60px" height="30px"></h5>
        ${this.loc} <br>
        ${this.day} ${floatToStrTime(this.start)}-${floatToStrTime(this.end)}`
        }

        const ecal = document.getElementById("eventCalendar")
        const td = ecal.querySelector("#" + this.day + floatToEscStrTime(this.start))
        td.appendChild(eventBtn);
        console.log(td);

        return;
    }

    getLength(){
        return this.end - this.start;
    }
}

// Data structure for an interval that is closed on both sides
class Interval{
    constructor(start, end){
        this.interval = [start, end];
        this.intervals = [[start, end]]
    }

    remove(i2){
        const s2 = i2.interval[0];
        const e2 = i2.interval[1];

        var new_intervals = []

        if (this.contains(i2)){
            for (let i = 0; i < this.intervals.length; i++){
                let s1 = this.intervals[i][0];
                let e1 = this.intervals[i][1];

                if (s1 != s2 && e1 != e2){
                    new_intervals.push([s1, e1]);
                }
            }
        }

        if (new_intervals.length == 0){
            this.interval = [null, null];
            this.intervals = [[null, null]];
        }

        this.intervals = new_intervals;
    }

    // Join the two intervals together
    union(i2){
        const s2 = i2.interval[0];
        const e2 = i2.interval[1];
        let new_interval = [];

        if (this.isEmpty()){
            this.interval = i2.interval;
            this.intervals = i2.intervals;
            return;
        }

        if (i2.isEmpty()){
            return;
        }

        if (this.hasSingleOverlap(i2) || this.isAdjacent(i2)){
            for (let i = 0; i < this.intervals.length; i++){
                let s1 = this.intervals[i][0]
                let e1 = this.intervals[i][1]
    
                if (this.checkSingleOverlap(s1, e1, s2, e2)){
                    console.log(s1, e1, s2, e2);
                    new_interval.push([Math.min(s1, s2), Math.max(e1, e2)])
                    continue;
                }

                new_interval.push([s1, e1])
            }
            this.intervals = new_interval;
        }
        else{
            this.intervals.push([s2, e2])
        }
        console.log(this.intervals);
        return;
    }

    // Checks if i1 overlaps with i2, assumes i2 is single interval
    // Assumes single overlap
    hasSingleOverlap(i2){
        const s2 = i2.interval[0]
        const e2 = i2.interval[1]

        if (this.isEmpty()){
            return false;
        }

        if (this.contains(i2)){
            return true;
        }

        for (let i = 0; i < this.intervals.length; i++){
            let s1 = this.intervals[i][0]
            let e1 = this.intervals[i][1]

            // check for left or right overlap
            // s1 = 10, e2 = 11
            // s2 = 11, e1 = 11.5
            if (((s2 <= s1 && e2 > s1) || (s2 >= s1 && e2 >= e1 && s2 <= e1)) && !this.isAdjacent(i2)){
                console.log(`Found overlap with ${s1} - ${e1} and ${s2} - ${e2}.`);
                return true;
            }
        }

        return false;
    }

    isAdjacent(i2){
        const s2 = i2.interval[0]
        const e2 = i2.interval[1]

        for (let i = 0; i < this.intervals.length; i++){
            let s1 = this.intervals[i][0]
            let e1 = this.intervals[i][1]

            // either left adjacent or right adjacent
            if ((s2 <= s1 && e2 === s1) || (s2 >= s1 && e2 >= e1 && s2 === e1)){
                console.log(`Found adjacency with ${s1} - ${e1} and ${s2} - ${e2}.`);
                return true;
            }
        }

        return false;
    }

    checkSingleOverlap(s1, e1, s2, e2){
        // 20 23 11 14
        if (s2 <= s1 && e2 <= e1 && e2 >= s1){
            //console.log("left overlap");
            return true;
        }
        else if (s2 >= s1 && e2 >= e1 && s2 <= e1){
            //console.log("right overlap");
            return true;
        }
        else if (s2 >= s1 && e2 <= e1){
            //console.log("contains overlap");
            return true;
        }
        else{
            //console.log("no overlap");
            return false;
        }
    }

    // check if i1 contains the entire i2 interval
    contains(i2){
        const s2 = i2.interval[0]
        const e2 = i2.interval[1]

        if (this.isEmpty()){
            return false;
        }

        for (let i = 0; i < this.intervals.length; i++){
            let s1 = this.intervals[i][0]
            let e1 = this.intervals[i][1]

            if (s2 >= s1 && e2 <= e1){
                return true;
            }
        }

        return false;
    }

    // Check if the interval is empty
    isEmpty(){
        return this.interval[0] == null || this.interval[1] == null;
    }

    toTimeString(){
        if (this.isEmpty()){
            return "";
        }

        let s_arr = []
        for (let i = 0; i < this.intervals.length; i++){
            const new_s = createStrTimeRange(this.intervals[i][0], this.intervals[i][1])
            s_arr.push(new_s)        
        }

        return s_arr.join(", ");
    }

    // converts [5, 7] to ["5:00", "5:30", "6:00", "6:30"]
    toTimeStrArray(interv){
        var arr = []

        if (this.isEmpty()){
            return [];
        }

        for (let i = 0; i < this.intervals.length; i++){
            const s = this.intervals[i][0]
            const e = this.intervals[i][1]
            const interv_len = (e - s) / interv

            console.log(interv_len);

            for (let j = 0; j < interv_len; j++){
                arr.push(floatToStrTime(s + (interv * j)))
            }
        }

        console.log(arr);
        return arr;
    }

    checkMaxLen(){
        var max = 0;
        for (let i = 0; i < this.intervals.length; i++){
            var length = this.intervals[i][1] - this.intervals[i][0];

            if (length > max){
                max = length;
            }
        }

        return max;
    }
}

// Data structure for a course, which contains the TAs, events, course name, start/end time and days for scheduling
class Course{
    constructor(name, days, start_t, end_t, clength, interv, tas, events, euuid, taid){
        this.name = name;
        this.days = days;
        this.start_t = start_t;
        this.end_t = end_t;
        this.interv = interv;
        this.tas = tas;
        this.events = events;
        this.euuid = euuid;
        this.numTAs = taid;
        this.clength = clength // TODO: Change this so that it is a field on the form. Used to calculate how many hrs per week on avg a TA can work
        console.log(`Created a new course called ${name} that has sessions from ${start_t} to ${end_t}`);
    }

    initialize(){
        this.populateTASelect("selectTAInput", 3);
        this.populateTASelect("indivTAScheduleSelect", 1);
        showElement("bulkAddTAsDiv");
        this.generateIndividualCal();
        this.fillCourseForm();
        this.initializeOTS();
        this.generateEvents();
        this.generateAllocTable();
    }

    getEvent(id){
        for (let i = 0; i < this.events.length; i++){
            if (this.events[i].id == id){
                return this.events[i]
            }
        }
        
        return null;
    }

    editEvent(id, name, day, start, end, loc, desc, needed, etype, numWeeks){
        for (let i = 0; i < this.events.length; i++){
            if (this.events[i].id == id){
                var res = this.events[i].editEvent(name, day, start, end, loc, desc, needed, this.events[i].assigned, etype, numWeeks);

                if (res){
                    curCourse.saveCourseData();
                    return true;
                }
            }
        }

        return false;
    }

    initializeOTS(){
        this.ots = new OneTimeScheduler();
    }

    generateAllocTable(){
        this.allocTable = new AllocHoursTable();

        return;
    }

    generateEvents(){
        var eventCalendar = new Calendar(this.days, this.start_t, this.end_t, this.interv, "eventCalendar")

        eventCalendar.clearAll();
        eventCalendar.generateEventRows();

        for (let i = 0; i < this.events.length; i++){
            this.events[i].newModal();
            this.events[i].newEventButton();
        }
    }

    generateIndividualCal(){
        this.indivCalendar = new Calendar(this.days, this.start_t, this.end_t, this.interv, "indivTACalendar");
        this.indivCalendar.clearAll();
        this.indivCalendar.generateEventRows(null);

        let indivTASelect = document.getElementById("indivTAScheduleSelect")
        
        if (indivTASelect !== null || indivTASelect !== undefined){
            indivTASelect.removeEventListener("change", (e) => showIndividualTASchedule(e));
            indivTASelect.addEventListener("change", (e) => showIndividualTASchedule(e));
        }
    }
    // {"courses": {"CPSC 213": ..., "CPSC 310": ...}}
    deleteCourseData(){
        var newArr = [];
        for (var i = 0; i < courses.length; i++){
            if (courses[i] !== this.name){
                newArr.push(courses[i]);
            }
        }

        courses = newArr;

        var dataObj = JSON.parse(localStorage.getItem("courses"));

        if (dataObj !== null && dataObj.length > 0 && Object.keys(dataObj).includes(this.name)){
            delete dataObj[this.name];
        }

        localStorage.setItem("courses", JSON.stringify(dataObj));

    }

    // Look through the current courses in the course array and replace it with the new one
    overwriteCourseData(oldCourse){
        const newData = this.courseToJson();
        var newArr = [];

        if (courses === null || courses === undefined || courses.length === 0){
            return;
        }

        for (var i = 0; i < courses.length; i++){
            const currentCourse = courses[i]
            if (oldCourse.name !== currentCourse.name){
                newArr.push(currentCourse);
            }
        }

        newArr.push(newData);
        courses = newArr;

        var dataObj = JSON.parse(localStorage.getItem("courses"));

        if (dataObj === null){
            return;
        }

        for (let i = 0; i < dataObj.length; i++){
            if (dataObj[i].name === oldCourse.name){
                dataObj[i] = newData;
            }
        }

        localStorage.setItem("courses", JSON.stringify(dataObj));

        return;
    }

    saveCourseData(){
        if (typeof(Storage) == "undefined") {
            alert("Your web browser doesn't support web storage so data will not be saved.")
            return;
        }

        var dataObj = JSON.parse(localStorage.getItem("courses"));

        if (dataObj === null){
            localStorage.setItem("courses", JSON.stringify([this.courseToJson()]));
            return;
        }
        
        // If the course already exists, then we need to overwrite it
        for (var i = 0; i < dataObj.length; i++){
            if (dataObj[i].name === this.name){
                dataObj[i] = this.courseToJson();
                localStorage.setItem("courses", JSON.stringify(dataObj));
                console.log("Overwrote the previous version of the course")
                return;
            }
        }

        // Add the course to the array and save it in localStorage since it doesn't exist yet
        dataObj.push(this.courseToJson())
        localStorage.setItem("courses", JSON.stringify(dataObj));
        return;
    }

    fillCourseForm(){
        // Change the course name input
        document.getElementById("inputCourseName").value = this.name;

        // Select the days for TAs
        var day_options = document.querySelectorAll(".form-check-input");

        for (var i = 0; i < day_options.length; i++){
            if (this.days.includes(day_options[i].value)){
                day_options[i].checked = true;
            }
            else{
                day_options[i].checked = false;
            }
        }

        // Set the start and end hour
        document.getElementById("startHour").value = floatToStrTime(this.start_t);
        document.getElementById("endHour").value = floatToStrTime(this.end_t);
    }

    addEvent(ename, eday, estart, end, eloc, needed, edesc, etype, eNumWeeks){
        var event = new CourseEvent(ename, eday, estart, end, eloc, edesc, needed, this.euuid, {}, etype, eNumWeeks);
        this.events.push(event);

        event.newModal();
        event.newEventButton()
        this.euuid += 1;

        this.saveCourseData();
        console.log("Event has been created.")
    }

    deleteEvent(id){
        var arr = [];

        for (let i = 0; i < this.events.length; i++){
            if (this.events[i].id !== id){
                arr.push(this.events[i]);
                continue;
            }
            else{
                // When deleting the event, also unassign the event from all the currently assigned TAs
                for (let j = 0; j < Object.keys(this.events[i].assigned).length; j++){
                    const ta = curCourse.findTA(this.events[i].assigned[j])

                    if (ta !== null){
                        ta.unassignEvent(this.events[i])
                    }
                }
                this.events[i].deleteEvent();
            }
        }

        // Replace current events with new list excluding the event and save the data
        this.events = arr;
        this.saveCourseData();

        return arr;
    }

    addTA(ta){
        if (this.isExistingTA(ta.name)){
            console.log("A TA with this name already exists.");
            return false;
        }
        else{
            this.tas.push(ta);
            this.numTAs += 1;
            this.saveCourseData();
        }
    }

    overwriteTA(oldTA, newTA){
        for (let i = 0; i < this.tas.length; i++){
            if (this.tas[i].name == oldTA.name){
                this.tas[i] = newTA;
                this.saveCourseData();
                location.reload();
                return true;
            }
        }

        return false;
    }

    deleteTA(ta){
        var new_arr = []

        for (let i = 0; i < this.tas.length; i++){
            if (this.tas[i].name !== ta.name){
                new_arr.push(this.tas[i]);
            }
        }

        this.tas = new_arr;
        this.saveCourseData();
        location.reload();

        return new_arr;
    }

    populateTASelect(id, offset){
        var select = document.getElementById(id);
        clearSelect(id, offset);
        showElement(id);
        
        for (var i in this.tas){
            var option = document.createElement("option");
            option.text = this.tas[i].name;
            option.value = this.tas[i].id;
            select.add(option);
        }
    }

    isExistingTA(name){
        for (let i = 0; i < this.tas.length; i++){
            if (this.tas[i].name == name){
                return true;
            }
        }
    
        return false;
    }

    courseToJson(){
        var data = {}
        data["name"] = this.name;
        data["days"] = this.days;
        data["start_t"] = this.start_t;
        data["end_t"] = this.end_t;
        data["clength"] = this.clength;
        data["interv"] = this.interv;
        data["tas"] = this.tas;
        data["events"] = this.events;
        data["euuid"] = this.euuid;
        data["numTAs"] = this.numTAs;

        console.log(data);

        return data;
    }
    
    findTA(id){
        if (id === null || id === "-1"){
            return null;
        }

        // Returns the TA info for the given name
        for (var i in this.tas){
            if (id == this.tas[i].id){
                return this.tas[i]
            }
        }
    
        return null;
    }

    findEvent(id){
        for (var i in this.events){
            if (id == this.events[i].id){
                return this.events[i]
            }
        }
    
        return null;
    }

    // Event and TA are both the IDs
    assignTAEvent(taID, eID, slot){
        const e = this.findEvent(eID);
        const ta = this.findTA(taID)

        // If the TA is null, then we are unassigning the current TA in the slot
        if (ta === null && e.isSlotTaken(slot)){
            const oldTA = this.findTA(e.assigned[slot])
            e.unassignTA(oldTA, slot);
            oldTA.unassignEvent(e);
            console.log("Unassigned " + oldTA.name);
        }
        else {
            // If slot is already filled with TA, then unassign old TA and then assign new TA
            if (e.isSlotTaken(slot)){
                const oldTA = this.findTA(e.assigned[slot])

                // If TA is already assigned, then do nothing and inform user
                if (!e.isTAAssigned(ta)){
                    e.unassignTA(oldTA, slot);
                    e.assignTA(ta, slot)
                    oldTA.unassignEvent(e);
                    ta.assignEvent(e)
                }
                else {
                    // TODO: Prevent the select from changing to the new option if this happens!
                    alert("The specified TA is already assigned to this event.")
                    return;
                }
            }

            else{
                console.log("Slot is available so assigning new TA");

                if (!e.isTAAssigned(ta)){
                    e.assignTA(ta, slot);
                    ta.assignEvent(e);
                }
            }
        }

        curCourse.saveCourseData();
    }
}

class TA {
    constructor(name, max_hrs, consec, avail, ass, ass_avail, id, days, exp){
        this.name = name;
        this.max_hrs = max_hrs;
        this.consec = consec;
        this.avail = avail;
        this.assigned = ass;
        this.assigned_avail = ass_avail;
        this.id = id;
        this.exp = exp;

        if (exp === undefined || exp === null){
            this.exp = "New";
        }

        if (Object.keys(ass_avail).length == 0){
            for (var i = 0; i < days.length; i++){
                this.assigned_avail[days[i]] = new Interval(null, null);
            }
        }
    }

    fillTAForm(){
        var nameEle = document.getElementById("inputName");
        var hours = document.getElementById("taMaxHoursInput");
        var canConsec = document.getElementById("consecSelect");
        var exp = document.getElementById("taExpSelect");

        nameEle.value = this.name;
        hours.value = this.max_hrs;
        
        if (this.consec == 2){
            canConsec.options.selectedIndex = 1;
        }
        else{
            canConsec.options.selectedIndex = 0;
        }

        if (this.exp === "New"){
            exp.options.selectedIndex = 0;
        }
        else{
            exp.options.selectedIndex = 1;
        }

        newTACalendar.loadAvail(this.avail);
    }

    // Make sure that they are available for the event and that their current assigned avail doesn't have overlap and they aren't working more than consec hours
    isAvailable(event){
        var e_interv = new Interval(event.start, event.end);
        var ta_avail_day = this.avail[event.day];
        var ta_assigned_day = intervalize(curCourse.days, JSON.parse(JSON.stringify(this.assigned_avail)))[event.day] // create a copy of the interval

        if (ta_avail_day.contains(e_interv) && !ta_assigned_day.hasSingleOverlap(e_interv)){
            ta_assigned_day.union(e_interv)

            if (ta_assigned_day.checkMaxLen() <= this.consec){
                console.log("TA is available");
                return true;
            }
            else{
                console.log("TA will work overtime");
                return false;
            }
        }

        return false;
    }

    // Returns True if event ID is found in TA's assigned array
    isAssigned(event){
        return this.assigned.includes(event.id);
    }

    // Adds event ID to the TA's assigned array if they are available and updates their assigned_avail interval
    assignEvent(event){
        if (this.isAvailable(event)){
            this.assigned.push(event.id);
            this.assigned_avail[event.day].union(new Interval(event.start, event.end))
            return true;
        }

        return false;
    }

    // Removes event ID from the TA's assigned array if they are already assigned
    unassignEvent(event){
        if (this.assigned.includes(event.id)){
            var arr = []

            for (let i = 0; i < this.assigned.length; i++){
                if (this.assigned[i] != event.id){
                    arr.push(this.assigned[i])
                }
            }

            this.assigned = arr;
            this.assigned_avail[event.day].remove(new Interval(event.start, event.end));
            curCourse.saveCourseData();
            return true;
        }
        
        return false;
    }

    // Returns the total amount of hrs assigned so far
    totalWeeklyHoursAssigned(){
        var total = 0;
        for (let i = 0; i < this.assigned.length; i++){
            const event = curCourse.findEvent(this.assigned[i]);

            if (event !== null){
                total += event.end - event.start;
            }
        }

        return total;
    }

    totalWeeklyHoursRemaining(){
        return (this.max_hrs / curCourse.clength) - this.totalWeeklyHoursAssigned();
    }
}

class Calendar {
    constructor(days, start, end, interv, id){
        this.days = days;
        this.start = start;
        this.end = end;
        this.interv = interv;
        this.events = [];
        this.times = [];
        this.id = id;

        var totalTimes = Math.ceil((this.end - this.start) / this.interv);
        var curTime = this.start;

        for (let i = 0; i < totalTimes; i++){
            this.times.push(curTime)
            curTime += curCourse.interv
        }
    }
    
    generateRows(){
        var table = document.getElementById(this.id);
        // Generate the table header with the days
        var header = table.createTHead();
        header.className += "table-primary border-dark"
        var headerRow = header.insertRow(0)
        headerRow.insertCell().outerHTML = "<th scope='col'>   </th>"
        
        for (let i = 0; i < this.days.length; i++){
            headerRow.insertCell().outerHTML = "<th scope='col'>" + this.days[i] + "</th>";
        }

        // Generate the table rows with each time
        var tableBody = table.createTBody();
        tableBody.className += "table-secondary border-dark";
        tableBody.addEventListener("click", (ele) => toggleAvailCell(ele));

        for (let i = 0; i < this.times.length; i++){
            
            var newRow = tableBody.insertRow();
            // Add the XX:XX cell
            var strTime = floatToStrTime(this.times[i])
            newRow.insertCell().outerHTML = "<th> " + strTime + "</th>";

            // Add an empty cell for the rest of the cols for this ros
            for (let j = 0; j < this.days.length; j++){
                var newCell = newRow.insertCell();
                newCell.id = this.days[j] + strTime;
                newCell.classList.add("calCell");
            }
        }
    }

    generateEventRows(){
        var table = document.getElementById(this.id);
        // Generate the table header with the days
        var header = table.createTHead();
        header.className += "table-primary border-dark"
        var headerRow = header.insertRow(0)
        headerRow.insertCell().outerHTML = "<th scope='col'>   </th>"
        
        for (let i = 0; i < this.days.length; i++){
            headerRow.insertCell().outerHTML = "<th scope='col'>" + this.days[i] + "</th>";
        }

        // Generate the table rows with each time
        var tableBody = table.createTBody();
        tableBody.className += "table-secondary border-dark";

        for (let i = 0; i < this.times.length; i++){
            
            var newRow = tableBody.insertRow();
            // Add the XX:XX cell
            var strTime = floatToStrTime(this.times[i])
            newRow.insertCell().outerHTML = "<th> " + strTime + "</th>";

            // Add an empty cell for the rest of the cols for this ros
            for (let j = 0; j < this.days.length; j++){
                var newCell = newRow.insertCell();
                newCell.id = this.days[j] + strTime;
            }
        }
    }

    clearAll(){
        var table = document.getElementById(this.id);
        table.innerHTML = "";
    }

    resetAvail(){
        var cells = document.querySelectorAll(".calCell");

        for (let i = 0; i < cells.length; i++){
            if (cells[i].classList.contains("avail")){
                cells[i].classList.remove("avail");
            }
        }

        return;
    }

    // Given a TA, display their availability on the calendar (highlighted in green)
    loadAvail(avail){
        this.resetAvail();

        for (let i = 0; i < curCourse.days.length; i++){
            const day_avail = avail[curCourse.days[i]];
            console.log(day_avail);

            if (day_avail.isEmpty()){
                continue;
            }
            else{
                day_avail.toTimeStrArray(curCourse.interv);
                this.highlightAvail(curCourse.days[i], day_avail.toTimeStrArray(curCourse.interv));
                console.log(`Loaded availability for ${curCourse.days[i]}!`)
            }
        }
        return;
    }

    // Highlight the availability for a given day and a list of times
    highlightAvail(day, times){
        for (let i = 0; i < times.length; i++){
            const id = day + times[i];
            const ele = document.getElementById(id);

            if (!ele.classList.contains("avail")){
                ele.classList.add("avail");
            }
        }

        return;
    }

    // Fills the TD with the events that a particular TA is assigned to, given the TA's ID
    fillIndividualSchedule(taID){
        this.clearAll();
        this.generateEventRows();

        let ta = curCourse.findTA(taID);
        var indivCalEle = document.getElementById(this.id);

        if (ta === null){
            console.log("Couldn't find the specified TA.");
            return;
        }

        for (let i = 0; i < ta.assigned.length; i++){
            var evt = curCourse.findEvent(ta.assigned[i]);

            if (evt !== null){
                const selector = "#" + evt.day + floatToEscStrTime(evt.start)
                var cell = indivCalEle.querySelector(selector);

                console.log(selector);
                console.log(cell);

                if (cell !== null || cell !== undefined){
                    cell.classList.add("indivAssigned")
                    cell.innerHTML = `<h5>${evt.name}</h5>
                    ${evt.loc}<br>
                    ${floatToStrTime(evt.start)} - ${floatToStrTime(evt.end)}`
                }
            }
        }
    }
}

function populateCourseSelect(){
    // Clear the select menu and then repopulate the select menu
    var select = document.getElementById("selectCourseInput");
    clearSelect("selectCourseInput", 3);
    showElement("selectCourseInput");
    
    for (var i in courses){
        var option = document.createElement("option");
        option.text = courses[i].name;
        option.value = courses[i].name;
        select.add(option);
    }
}

function loadCourses(){
    if (typeof(Storage) == "undefined") {
        alert("Your web browser doesn't support web storage so data could not be loaded.")
        return;
    }

    var courseStorage = JSON.parse(localStorage.getItem("courses"))

    if (courseStorage === null || courseStorage.length === 0){
        return;
    }

    for (var i = 0; i < Object.keys(courseStorage).length; i++){
        const data = courseStorage[Object.keys(courseStorage)[i]]
        console.log(data);
        let course = new Course(data.name, data.days, data.start_t, data.end_t, data.clength, data.interv, loadTAs(data.days, data.tas), loadEvents(data.days, data.events), data.euuid, data.numTAs);
        courses.push(course);
    }

    populateCourseSelect();
}

// TODO: Change this to read/write to the Microsoft Azure NOSQL DB
function loadCourseData(cname){
    var course;

    for (var i in courses){
        if (courses[i].name == cname){
            const course = courses[i]
            curCourse = course;
            course.initialize();
            return;
        }
    }

    console.log("The specified course could not be found.");
}

function initializeCourse(){
    var courseSelect = document.getElementById("selectCourseInput");
    var courseForm = document.getElementById("courseForm");
    var submitBtn = document.getElementById("courseFormSubmitBtn");

    /*
    if (newTACalendar !== undefined){
        newTACalendar.clearAll();
    }
    */

    // If Add New TA option is selected
    if (courseSelect.selectedIndex == 1){
        // Change the select button so that it says "Confirm Changes" instead and remove the old EventListener for the form
        courseForm.reset();
        courseForm.addEventListener("submit", createNewCourse);
        courseForm.removeEventListener("submit", editCourse);
        submitBtn.innerHTML = "Submit";

        // Hide the TA select and TA form if it is not hidden already
        var taSelect = document.getElementById("selectTAInput");
        taSelect.options.selectedIndex = 0;

        hideElement("selectTAInput");
        hideElement("taAccordion");
        hideElement("courseDeleteBtn");
        hideElement("courseNavBar");
        hideElement("navTabContent")
        hideElement("bulkAddTAsDiv")
    }
    else if (courseSelect.selectedIndex >= 1){
        submitBtn.innerHTML = "Confirm Changes";
        loadCourseData(courseSelect.value);
        courseForm.removeEventListener("submit", createNewCourse);
        courseForm.addEventListener("submit", editCourse);
        showElement("courseDeleteBtn");
        showElement("courseNavBar");
        showElement("navTabContent")
    }

    showElement("courseAccordion");

    return;
}

function createNewCourse(){
    var nameEle = document.getElementById("inputCourseName");
    var nameFeedback = document.getElementById("courseNameFeedback")
    var name = nameEle.value;
    var courseSelect = document.getElementById("selectCourseInput");

    var days = [];
    document.querySelectorAll(".form-check-input").forEach((ele) => {
        if (ele.checked){
            days.push(ele.value);
        }
    })

    var startHr = strTimeToFloat(document.getElementById("startHour").value);
    var endHr = strTimeToFloat(document.getElementById("endHour").value);
    var cLength = parseInt(document.getElementById("courseLengthInput").value);

    if (name == ""){
        nameEle.classList.remove("is-valid");
        nameEle.classList.add("is-invalid");
        nameFeedback.innerHTML = "The specified name is invalid."
        return false;
    }

    if (isExistingCourse(name)){
        nameEle.classList.remove("is-valid");
        nameEle.classList.add("is-invalid");
        nameFeedback.innerHTML = "A course with that name already exists."
        return false;
    }

    nameEle.classList.remove("is-invalid");
    nameEle.classList.add("is-valid");

    var newCourse = new Course(nameEle.value.toUpperCase(), days, startHr, endHr, cLength, 0.5, [], [], 0, 0);
    courses.push(newCourse);
    newCourse.saveCourseData();
    populateCourseSelect();
    courseSelect.selectedIndex = courseSelect.options.length - 1;
    initializeCourse();
    curCourse = newCourse;

    alert(`The new course ${newCourse.name} has been created successfully!`)

    return true;
}

function editCourse(){
    var nameEle = document.getElementById("inputCourseName");
    var nameFeedback = document.getElementById("courseNameFeedback")
    var name = nameEle.value;

    var days = [];
    document.querySelectorAll(".form-check-input").forEach((ele) => {
        if (ele.checked){
            days.push(ele.value);
        }
    })

    var startHr = strTimeToFloat(document.getElementById("startHour").value);
    var endHr = strTimeToFloat(document.getElementById("endHour").value);
    var cLength = parseInt(document.getElementById("courseLengthInput").value);

    if (name == ""){
        nameEle.classList.remove("is-valid");
        nameEle.classList.add("is-invalid");
        nameFeedback.innerHTML = "The specified name is invalid."
        return false;
    }

    if (isExistingCourse(name) && curCourse.name !== name){
        nameEle.classList.remove("is-valid");
        nameEle.classList.add("is-invalid");
        nameFeedback.innerHTML = "A course with that name already exists."
        return false;
    }

    nameEle.classList.remove("is-invalid");
    nameEle.classList.add("is-valid");

    const conf = confirm("Would you like to overwrite the current course?")

    if (conf === true){
        var newCourse = new Course(nameEle.value, days, startHr, endHr, cLength, 0.5, curCourse.tas, curCourse.events, curCourse.euuid, curCourse.numTAs);

        newCourse.overwriteCourseData(curCourse);
        location.reload();
    }
    else{
        console.log("Didn't overwrite current course");
    }
}

function deleteCourse(){
    const conf = confirm(`Are you sure you want to delete ${curCourse.name}? This action CANNOT be undone!`);

    if (conf === true){
        curCourse.deleteCourseData();
    }
    else{
        return false;
    }

}

function isExistingCourse(cname){
    for (var i in courses){
        if (courses[i].name == cname){
            return true
        }
    }

    return false;
}

function updateTAForm(){
    var select = document.getElementById("selectTAInput");
    var taForm = document.getElementById("newTAForm");
    var submitBtn = document.getElementById("taFormSubmitBtn");

    // Show Calendar
    if (newTACalendar === undefined){
        newTACalendar = new Calendar(curCourse.days, curCourse.start_t, curCourse.end_t, curCourse.interv, "taAvailCalendar");
        newTACalendar.generateRows();
    }
    else{
        newTACalendar.clearAll();
        newTACalendar = new Calendar(curCourse.days, curCourse.start_t, curCourse.end_t, curCourse.interv, "taAvailCalendar");
        newTACalendar.generateRows();
    }

    // If Add New TA option is selected
    if (select.selectedIndex == 1){
        // Change the select button so that it says "Confirm Changes" instead and remove the old EventListener for the form
        taForm.reset();
        taForm.addEventListener("submit", createNewTA);
        taForm.removeEventListener("submit", editTA);
        submitBtn.innerHTML = "Submit";
        hideElement("taDeleteBtn");

    }
    else if (select.selectedIndex >= 1){
        submitBtn.innerHTML = "Confirm Changes";
        taForm.removeEventListener("submit", createNewTA);
        taForm.addEventListener("submit", editTA);

        showElement("taDeleteBtn");

        const ta = curCourse.findTA(select.value);

        if (ta){
            ta.fillTAForm();
            curTASelected = ta;
        }
        else{
            console.log("TA couldn't be found.")
        }
    }

    showElement("taAccordion");

    return;
}

// TODO: After creating new TA, the available TAs should also update for the event modals
function createNewTA(){
    var nameEle = document.getElementById("inputName");
    var nameFeedback = document.getElementById("taNameFeedback")
    var name = nameEle.value;
    var hours = parseInt(document.getElementById("taMaxHoursInput").value);
    var canConsec = document.getElementById("consecSelect").value;
    var avail = parseAvailabilityFromCalendar();
    var select = document.getElementById("selectTAInput");
    var exp = document.getElementById("taExpSelect").value; // either "New" or "Returning"

    if (canConsec == "yes"){
        var consec = 4;
    }
    else{
        var consec = 2;
    }

    if (name == ""){
        nameEle.classList.remove("is-valid");
        nameEle.classList.add("is-invalid");
        nameFeedback.innerHTML = "The specified name is invalid."
        return false;
    }

    if (curCourse.isExistingTA(name)){
        nameEle.classList.remove("is-valid");
        nameEle.classList.add("is-invalid");
        nameFeedback.innerHTML = "A TA with that name already exists."
        return false;
    }

    nameEle.classList.remove("is-invalid");
    nameEle.classList.add("is-valid");

    const availStr = availJsonToString(avail);
    const conf = confirm("You have selected the following availability, please confirm it:\n\n" + availStr);
    
    if (conf === true){
         // TODO: Change this so that you can calculate based on contract weeks instead of constant
        var newTA = new TA(name, hours, consec, avail, [], {}, curCourse.numTAs, curCourse.days, exp);
        curCourse.addTA(newTA);
        curCourse.populateTASelect("selectTAInput", 3);
        curCourse.populateTASelect("indivTAScheduleSelect", 1)
        showElement("bulkAddTAsDiv");
        curTASelected = newTA;
        select.options.selectedIndex = select.options.length - 1;

        return true;
    }

    return false;
}

function editTA(){
    var nameEle = document.getElementById("inputName");
    var nameFeedback = document.getElementById("taNameFeedback")
    var name = nameEle.value;
    var hours = parseInt(document.getElementById("taMaxHoursInput").value);
    var canConsec = document.getElementById("consecSelect").value;
    var avail = parseAvailabilityFromCalendar();
    var exp = document.getElementById("taExpSelect").value; // either "New" or "Returning"

    if (canConsec == "yes"){
        var consec = 4;
    }
    else{
        var consec = 2;
    }

    if (name == ""){
        nameEle.classList.remove("is-valid");
        nameEle.classList.add("is-invalid");
        nameFeedback.innerHTML = "The specified name is invalid."
        return false;
    }

    if (curCourse.isExistingTA(name) && curTASelected.name !== name){
        nameEle.classList.remove("is-valid");
        nameEle.classList.add("is-invalid");
        nameFeedback.innerHTML = "A TA with that name already exists."
        return false;
    }

    nameEle.classList.remove("is-invalid");
    nameEle.classList.add("is-valid");

    const availStr = availJsonToString(avail);
    const conf = confirm("Are yo sure you want to overwrite the current TA. You have selected the following availability:\n\n" + availStr);

    if (conf === true){
        var newTA = new TA(name, hours, consec, avail, curTASelected.assigned, curTASelected.assigned_avail, curTASelected.id, curCourse.days, exp);
        curCourse.overwriteTA(curTASelected, newTA)
    }

    return;
}

function deleteTA(){
    const conf = confirm(`Are you sure you want to delete ${curTASelected.name}? This action CANNOT be undone!`);

    if (conf === true){
        curCourse.deleteTA(curTASelected);
    }
    
    return false;
}

function loadTAs(days, tas_arr){
    var arr = []
    for (let i = 0; i < tas_arr.length; i++){
        ta_obj = tas_arr[i]
        ta = new TA(ta_obj.name, ta_obj.max_hrs, ta_obj.consec, intervalize(days, ta_obj.avail), ta_obj.assigned, intervalize(days, ta_obj.assigned_avail), ta_obj.id, days, ta_obj.exp);
        arr.push(ta);
    }

    return arr;
}

function loadEvents(days, events){
    var arr = []

    for (var i = 0; i < events.length; i++){
        const e = events[i];
        var cevent = new CourseEvent(e.name, e.day, e.start, e.end, e.loc, e.description, e.tas_needed, e.id, e.assigned, e.type, e.numWeeks);
        arr.push(cevent);
    }

    return arr;
}

// Convert the TA's avail from obj to obj with intervals
function intervalize(days, avail){
    for (let i = 0; i < days.length; i++){
        var new_interv = new Interval(avail[days[i]].interval[0], avail[days[i]].interval[1])
        new_interv.intervals = avail[days[i]].intervals;

        avail[days[i]] = new_interv;
    }
    
    return avail;
}

function toggleAvailCell(e){
    var target = e.target;

    if (target.nodeName == "TD"){
        if (target.classList.contains("avail")){
            target.classList.remove("avail");
        }
        else{
            target.classList.add("avail");
        }
    }
    else{
        return;
    }
}

function parseAvailabilityFromCalendar(){
    var cells = document.querySelectorAll(".avail");
    var avail_json = {}
    
    for (var i = 0; i < curCourse.days.length; i++){
        avail_json[curCourse.days[i]] = new Interval(null, null);
    }

    for (var i = 0; i < cells.length; i++){
        id = cells[i].id;
        day = id.slice(0, 3);
        start = strTimeToFloat(id.slice(3, ));
        avail_json[day].union(new Interval(start, start + curCourse.interv));
    }

    return avail_json;
}

function availJsonToString(aj){
    var new_s = ""

    for (var i = 0; i < curCourse.days.length; i++){
        const availForDay = aj[curCourse.days[i]].toTimeString()
        if (availForDay == ""){
            new_s += curCourse.days[i] + ": Not Available\n";
        }
        else{
            new_s += curCourse.days[i] + ": " + availForDay + "\n";
        }
    }

    return new_s;
}

function newEvent(){
    var form = document.getElementById("newEventForm");
    const ename = form.elements[0].value;
    const etype = form.elements[2].value;
    const eday = form.elements[3].value;
    const estart = strTimeToFloat(form.elements[4].value);
    const edur = parseInt(form.elements[5].value) / 60;
    const eNumWeeks = parseInt(form.elements[6].value);
    const eloc = form.elements[7].value;
    const tas_needed = parseInt(form.elements[8].value);
    const edesc = form.elements[9].value;

    // Check if estart is out of range
    if (estart + edur > curCourse.end_t){
        alert("The specified start/end time for the event is out of the schedulable range. Please pick an earlier time");
        return false;
    }

    curCourse.addEvent(ename, eday, estart, estart + edur, eloc, tas_needed, edesc, etype, eNumWeeks);

    form.reset();

    // Hide the new event modal
    $("#newEventModal").modal("hide");
    
    // TODO: Create a popup to inform user that the event was successfully created or not
    console.log("Event has been created.");

    return true;
}

function deleteEvent(id){
    if (curCourse !== null || curCourse !== undefined){
        const conf = confirm("Are you sure you want to delete this event? This action cannot be undone!")

        if (conf === true){
            curCourse.deleteEvent(id);
            return true;
        }
    }

    console.log("No course selected.");
    return false;
}

function openNewEvent(){
    var form = document.getElementById("newEventForm")
    form.addEventListener("submit", newEvent);
    form.removeEventListener("submit", editEvent)
    form.reset();
}

function openEditEvent(id){
    if (curCourse !== null || curCourse !== undefined){

        var form = document.getElementById("newEventForm");

        form.removeEventListener("submit", newEvent);
        form.addEventListener("submit", editEvent, false);
        form.targetID = id;

        var e = curCourse.getEvent(id);

        if (e !== null){
            form.elements[0].value = e.name; // Event Name
            form.elements[2].value = e.type; // Event Type
            form.elements[3].value = e.day;
            form.elements[4].value = floatToStrTime(e.start); // Start Time
            form.elements[5].value = (e.end - e.start) * 60; // Duration
            form.elements[6].value = e.numWeeks
            form.elements[7].value = e.loc; // Location
            form.elements[8].value = e.tas_needed; // TAs needed
            form.elements[9].value = e.description; // Description

            $("#event" + id + "modal").modal("hide");
            $("#newEventModal").modal("show");

            return true;
        }

        console.log("Couldn't find the specified event for some reason...")
        return false;
    }

    console.log("Hello World");
}

function editEvent(evt){
    const conf = confirm("Are you sure you want to overwrite this event?");

    if (conf && (curCourse !== null || curCourse !== undefined)){
        var form = document.getElementById("newEventForm");

        const ename = form.elements[0].value;
        const etype = form.elements[2].value;
        const eday = form.elements[3].value;
        const estart = strTimeToFloat(form.elements[4].value);
        const edur = parseInt(form.elements[5].value) / 60; // converted to hours
        const numWeeks = parseInt(form.elements[6].value);
        const eloc = form.elements[7].value;
        const tas_needed = parseInt(form.elements[8].value);
        const edesc = form.elements[9].value;

        // Check if estart is out of range
        if (estart + edur > curCourse.end_t){
            alert("The specified start/end time for the event is out of the schedulable range. Please pick an earlier time");
            return false;
        }

        var res = curCourse.editEvent(evt.currentTarget.targetID, ename, eday, estart, estart + edur, eloc, tas_needed, edesc, etype, numWeeks);

        if (res){
            $("#newEventModal").modal("hide");
            return true;
        }
    }
    
    console.log("An unexpected error occurred while editing the event.");
    return false;
}

function assignTAToEvent(evt){
    var split_str = evt.target.id.split("-");
    const eventID = parseInt(split_str[1]);
    const slot = parseInt(split_str[3]);
    const ta = evt.target.value;

    curCourse.assignTAEvent(ta, eventID, slot);
}

/* Upload Bulk TAs System
Allows users to upload a CSV file with multiple TAs at once for enhanced workflow
*/

function readBulkTAs(){
    const file = document.getElementById("bulkAddTAsFileInput").files[0]

    if (file === undefined){
        return;
    }

    Papa.parse(file, {
        complete: function(results){
            parseBulkTAs(results.data);
        }
    })
}

// We need the TA name, contracted hours, max consec hours, and avail for each day (in the order listed)
function parseBulkTAs(arr){
    const header = arr[0]
    const data = arr.slice(1);
    var tas_arr = [];
    const days_needed = curCourse.days;

    if (header.length !== days_needed.length + 3){
        alert("Failed to parse uploaded CSV file, please ensure that you have the correct headers for the CSV file.");
        return;
    }

    for (let i = 0; i < data.length; i++){
        if (data[i].length !== header.length){
            continue;
        }

        const name = data[i][0];
        const exp = data[i][1]
        const hrs = parseInt(data[i][2]);
        const max_consec = parseInt(data[i][3]);
        const avail = parseAvailability(i + 2, data[i].slice(4), days_needed);

        // TODO: Overwrite the TAs instead of ignoring them
        // TODO: Create a list of TAs that are being overwritten and display it rather than having an alert for each TA
        // TODO: Create a list of TAs that were not added due to errors and display it as one alert
        if (curCourse.isExistingTA(name)){
            alert(`The TA, ${name}, couldn't be added because a TA with that name already exists.`);
            continue;
        }

        if (isNaN(hrs) || isNaN(max_consec)){
            alert(`The contracted hours and/or consec hours couldn't be parsed for row ${i + 2}. This TA will not be added at this time.`);
            continue;
        }

        var ta = new TA(name, hrs, max_consec, avail, [], {}, curCourse.numTAs + i, days_needed, exp);
        tas_arr.push(ta);
    }

    const conf = confirm("Please confirm that you would like to add the following TAs:\n\n" + stringifyBulkTAs(tas_arr, days_needed))

    if (conf){
        for (let i = 0; i < tas_arr.length; i++){
            curCourse.addTA(tas_arr[i]);
        }
        alert("The TAs were added successfully!")

        return;
    }

    return;
}

function parseAvailability(row, arr, days){
    console.log(arr);
    var avail_json = {}

    for (var i = 0; i < days.length; i++){
        avail_json[days[i]] = new Interval(null, null);
        // split based on comma and then based on dash to get the start and end time for each range
        // then convert it to interval and store it in a dict
        if (arr[i] !== ""){
            const day_avail = arr[i].split(",");

            for (var j = 0; j < day_avail.length; j++){
                const ranges = day_avail[j].split("-");
                const start = strTimeToFloat(ranges[0]);
                const end = strTimeToFloat(ranges[1]);

                if (start === null || end === null){
                    alert("There was an error parsing the availability for row " + row + "! Please check that the availability is formatted correctly on " + days[i] + ".");
                    break;
                }

                let interv = new Interval(start, end);
                avail_json[days[i]].union(interv);
            }
        }
    }

    return avail_json;
}

function stringifyBulkTAs(tas_arr, days){
    var taListStr = ""

    for (var i = 0; i < tas_arr.length; i++){
        const ta = tas_arr[i]
        var taStr = `${ta.name} - ${ta.max_hrs} hrs and can work up to ${ta.consec} hrs consecutively.\n`

        for (var j = 0; j < days.length; j++){
            const timeS = ta.avail[days[j]].toTimeString()

            if (timeS === ""){
                taStr += " " + days[j] + ": " + "Not Available" + "\n"
            }
            else {
                taStr += " " + days[j] + ": " + timeS + "\n"
            }
        }

        taListStr += taStr;
    }

    return taListStr;
}

/* Upload Bulk Events System
Allows users to upload a CSV file with multiple events at once for enhanced workflow
*/

function readBulkEvents(){
    const file = document.getElementById("bulkAddEventsFileInput").files[0]

    if (file === undefined){
        return;
    }

    Papa.parse(file, {
        complete: function(results){
            parseBulkEvents(results.data);
        }
    })
}

function parseBulkEvents(arr){
    const header = arr[0];
    const data = arr.slice(1);
    var events_arr = [];
    const valid_days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    // Check if the header length matches
    if (header.length == 9){
        for (let i = 0; i < data.length; i++){
            // skip any empty rows
            if (data[i].length !== 9){
                continue;
            }

            // Name, day, start, dur, location, desc, needed, euuid
            const name = data[i][0]
            const type =data[i][1]
            const day = data[i][2].charAt(0).toUpperCase() + data[i][2].slice(1).toLowerCase();
            const start = strTimeToFloat(data[i][3])
            const end = start + (parseInt(data[i][4]) / 60)
            const numWeeks = parseInt(data[i][5])
            const loc = data[i][6]
            const needed = parseInt(data[i][7])
            const desc = data[i][8]

            // Check that the data is valid before proceeding
            if (name === "" || !valid_days.includes(day) || start === null || isNaN(needed)){
                alert("Failed to parse the data for row " + (i+2) + "! Please check the CSV file and correct the error.");
                return;
            }

            if (end > curCourse.end_t){
                alert("The event on row " + (i+2) + ` can't be scheduled because the event ends (${floatToStrTime(end)}) outside of the schedulable time range (${floatToStrTime(curCourse.end_t)})!`);
                return;
            }

            events_arr.push({"name": name, "type": type, "day": day, "start": start, "end": end, "numWeeks": numWeeks, "loc": loc, "needed": needed, "desc": desc});
        }

        let conf = confirm("The following events will be added:\n\n" + stringifyBulkEvents(events_arr) + "\nPress [OK] to confirm or [Cancel] if you would like to make changes. This action CANNOT be undone!")

        if (conf === true){
            for (let i = 0; i < events_arr.length; i++){
                const curEvent = events_arr[i]
                curCourse.addEvent(curEvent.name, curEvent.day, curEvent.start, curEvent.end, curEvent.loc, curEvent.needed, curEvent.desc, curEvent.type, curEvent.numWeeks);
            }

            console.log("All events were added successfully!");
            return true;
        }
        else{
            console.log("Didn't add the events");
            return;
        }
    }
    else {
        alert("Failed to parse uploaded CSV file. Please make sure that you have the correct headers. The correct order is:\nEvent Name, Event Day, Start Time, Duration, Location, TAs Required, Description");
        return;
    }
}

function stringifyBulkEvents(arr){
    var eventListStr = ""
    for (let i = 0; i < arr.length; i++){
        const curEvent = arr[i]
        eventListStr += `${curEvent.name} - ${curEvent.day} ${floatToStrTime(curEvent.start)}-${floatToStrTime(curEvent.end)} @ ${curEvent.loc} (${curEvent.needed} TAs required)\n`
    }

    return eventListStr;
}

/*
Individual TA Schedule Viewer System
*/
function showIndividualTASchedule(evt){
    if (curCourse.indivCalendar !== null || curCourse.indivCalendar !== undefined){
        curCourse.indivCalendar.fillIndividualSchedule(evt.target.value);
    }

    return;
}

/* Auto Scheduling */

/* 
Given the events (with/without TAs already assigned) and the list of TAs (with/without events already assigned) and assigns TAs automatically

Algorithm:
1. Sort the events by those with the least availability
2. Iterate through the events
    a. Filter for the TAs that are available for that event
    b. Sort them based on those with most hours still available (reverse sort)
    c. Assign TAs until the event is full
        - Check that the TA is available at that time and isn't already assigned to the event
        - Then assign TA to event and assign event to TA
        - Need to get the list of numbers for empty slots
3. Return the events and TAs

Produce an overview of what events/TAs were fully assigned, partially assigned, or not assigned
Will also create a way to export the Allocation of Hours sheet

Will need to override the events and TAs afterwards to save it

*/
function autoSchedule(){
    var events = curCourse.events;
    var tas = curCourse.tas;
    var logger = [];

    if (events === null || tas === null){
        return;
    }

    // Add a confirm message to confirm the assignments
    if (!confirm("Are you sure you want to automatically assign the events and TAs? This action CANNOT be undone!!!")){
        return;
    }

    // Sort events based on availability (least -> greatest)
    events.sort((e1, e2) => {
        return e1.getNumAvailableTAs() - e2.getNumAvailableTAs();
    })

    // Iterate through all the events and assign TAs
    for (var i = 0; i < events.length; i++){
        const curEvent = events[i]
        var availSlots = curEvent.getAvailSlots();

        // Sort TAs based on most hours still available (greatest -> least)
        tas.sort((h1, h2) => {
            return h2.totalWeeklyHoursRemaining() - h1.totalWeeklyHoursRemaining()
        })

        // Iterate through TAs and find the TAs who are available and aren't already assigned
        for (var j = 0; j < tas.length; j++){
            console.log(availSlots.length);
            if (availSlots.length === 0){
                break;
            }

            const curTA = tas[j];
            console.log(curEvent, curTA);

            // TODO: Add a check to see if they are working overtime
            if (curTA.isAvailable(curEvent) && !curTA.isAssigned(curEvent) && curTA.totalWeeklyHoursRemaining() >= curEvent.getLength()){
                curEvent.assignTA(curTA, availSlots.pop());
                curTA.assignEvent(curEvent);
                console.log(`Assigned ${curTA.name} to ${curEvent.name} on ${curEvent.day} from ${floatToStrTime(curEvent.start)} - ${floatToStrTime(curEvent.end)}`)
            }
        }

        // If not enough TAs assigned, let the user know
        if (availSlots.length > 0){
            logger.push(`Couldn't find enough TAs for ${curEvent.name} on ${curEvent.day} from ${floatToStrTime(curEvent.start)} - ${floatToStrTime(curEvent.end)}. There are ${availSlots.length} TAs required still.`)
        }
    }

    displayLog(logger);
    console.log("Assigned the TAs and events successfully!");
    curCourse.saveCourseData();
    return;
}

// Unassigns all TAs from the events
function clearAssignments(){

    if (!confirm("Are you sure you want to remove all TAs from their assigned events? This action CANNOT be undone!")){
        return;
    }

    var events = curCourse.events;
    var tas = curCourse.tas;

    // Iterate through each event and find who is assigned. Unassign them from the event
    for (var i = 0; i < events.length; i++){
        var curEvent = events[i]
        for (var j = 0; j < Object.keys(curEvent.assigned).length; j++){
            let curTA = curCourse.findTA(curEvent.assigned[j])

            if (curTA !== null){
                curEvent.unassignTA(curTA, j);
            }
        }
    }

    // Iterate through all TAs and unassign all events from the TA.
    for (var k = 0; k < tas.length; k++){
        var curTA = tas[k]

        for (var l = 0; l < curTA.assigned.length; l++){
            console.log(curTA.assigned[l])
            var event = curCourse.findEvent(curTA.assigned[l])
            console.log(event)
            curTA.unassignEvent(event);
        }
    }

    curCourse.saveCourseData();

    return;
}

/*
One Time Scheduling
*/
function oneTimeSchedule(){
    const day = document.getElementById("otsDaySelect").value;
    const start = strTimeToFloat(document.getElementById("otsStartTimeInput").value);
    const end = Math.round(start + parseInt(document.getElementById("otsDurInput").value) / 60);

    if (day === null || start === null || end === null){
        return;
    }

    if (curCourse !== null || curCourse !== undefined){
        const availTAs = curCourse.ots.findAvailableNoConflictTAs(curCourse.tas, day, start, end);
        const availConflictTAs = curCourse.ots.findAvailableConflictTAs(curCourse.tas, day, start, end);        


        var ancul = document.getElementById("availNoConflictUL");
        var acul = document.getElementById("availConflictUL");

        ancul.innerHTML = curCourse.ots.generateULElements(availTAs);
        acul.innerHTML = curCourse.ots.generateULElements(availConflictTAs);

        return;
    }
}

/* Utility Functions */
function displayLog(arr){
    if (arr.length > 0){
        alert(arr.join("\n"))
    }
}

function createStrTimeRange(start, end){
    return floatToStrTime(start) + "-" + floatToStrTime(end);
}

function showElement(id){
    var ele = document.getElementById(id);

    if (ele.hidden){
        ele.hidden = false;
    }
}

function hideElement(id){
    var ele = document.getElementById(id);

    if (ele.hidden == false){
        ele.hidden = true;
    }

    return;
}

function clearSelect(id, offset){
    var select = document.getElementById(id);
    var numOptions = select.options.length - offset;

    for (var i = 0; i < numOptions; i++){
        last = select.options.length - 1
        select.options.remove(last);
    }

    return;
}

// Converts time in 24hr form to a float.
function strTimeToFloat(s){
    // HH:MM -> {"hrs": ..., "mins": ...}
    const timeSplit = s.split(":")
    const t = {"hrs": parseInt(timeSplit[0]), "mins": parseInt(timeSplit[1])}

    if (isNaN(t.hrs) || isNaN(t.mins)){
        return null;
    }

    return t.hrs + (t.mins / 60);
    // if (t.mins < 15){
    //     return t.hrs
    // }
    // else if (t.mins > 45){
    //     return t.hrs + 1
    // }
    // else{
    //     return t.hrs + 0.5
    // }
}

function floatToStrTime(x){
    // convert float to str time by flooring the number and then taking the decimal remainder and converting to minutes
    var hr = Math.floor(x);
    var mins = ((x - hr) * 60);

    if (hr < 10){
        hr = "0" + hr.toString();
    }
    else{
        hr = hr.toString()
    }

    if (mins == 0){
        mins = "00"
    }
    else{
        mins = mins.toString();
    }

    return hr + ":" + mins;
}

function floatToEscStrTime(x){
    // convert float to str time by flooring the number and then taking the decimal remainder and converting to minutes
    var hr = Math.floor(x);
    var mins = ((x - hr) * 60);

    if (hr < 10){
        hr = "0" + hr.toString();
    }
    else{
        hr = hr.toString()
    }

    if (mins == 0){
        mins = "00"
    }
    else{
        mins = mins.toString();
    }

    return hr + "\\:" + mins;
}

loadCourses();

// Activate tooltip for bootstrap
const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

// Testing for Intervals
/*
i1 = new Interval(12, 15)
i2 = new Interval(11, 14)
i3 = new Interval(13, 14)
i4 = new Interval(14, 17)
i5 = new Interval(20, 23)
i6 = new Interval(null, null)

console.log("Test for left overlap");
console.log(i1.hasOverlap(i2))
console.log(i1.contains(i2))

console.log("Test for middle overlap");
console.log(i1.hasOverlap(i3))
console.log(i1.contains(i2))

console.log("Test for right overlap");
console.log(i1.hasOverlap(i4))
console.log(i1.contains(i4));

console.log("Test for no overlap");
console.log(i1.hasOverlap(i5));
console.log(i1.contains(i5));

console.log("Test for union");
i1 = new Interval(12, 15)
i1.union(i6)

i1 = new Interval(12, 15)
i1.union(i3)

i1 = new Interval(12, 15)
i1.union(i5)
i1.union(i2)
console.log(i1.intervals);
console.log(i1.toTimeString());
*/