// TODO: Replace the reloading of webpage when overwriting course/TA data.
// TODO: Add the events system
// TODO: For scheduling, allow there to be preset assignments and then build the schedule around it

var newCalendar;
var eventCalendar;
var courses = [];

// For populating the TA select menu
var curCourse;
var curTASelected;
var curEvent;

class CourseEvent {
    // An event has a name, day, start time (in 24hr time as float), length (in hrs), location (str), description, and TAs assigned
    constructor(name, day, start, end, loc, desc, needed, id){
        this.name = name;
        this.day = day;
        this.start = start;
        this.end = end;
        this.loc = loc;
        this.description = desc;
        this.tas_needed = needed;
        this.assigned = []
        this.id = id;

        return;
    }

    // Checks if event is fully assigned yet
    isFullyAssigned(){
        return this.assigned.length == this.tas_needed;
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

    // TODO: Updates the event with new info
    editEvent(name, day, start, end, loc, needed, desc, assigned){
        const conf = "Are you sure you want to overwrite the current event?"

        if (conf){
            this.name = name;
            this.day = day;
            this.start = start;
            this.end = end;
            this.loc = loc;
            this.description = desc;
            this.tas_needed = needed;
            this.assigned = assigned;

            // Delete the current modal and event button and replace with new one in the Course class
            this.newEventButton()
            this.newModal();

            return true;
        }

        return false;;
    }

    // Assigns a TA to the event
    assignTA(ta){
        if (!this.isFullyAssigned()){
            this.assigned.push(ta);
            this.updateEvent(this.name, this.day, this.start, this.dur, this.loc, this.desc, this.needed, this.assigned);
            curCourse.saveCourseData();
        }
        return;
    }

    // Creates new modal or updates existing modal
    // TODO: Add a toggle edit button and a delete button
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

    }

    // Creates new event button to be shown on calendar or updates existing button
    // TODO: Add TA assignment text to the modal
    // TODO: Change button class based on the TA selected's availability
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
            eventBtn.innerHTML = `<h5>${this.name} <img src="img/person-fill-check.svg" width="60px" height="30px"></h5>
        ${this.loc} <br>
        ${this.day} ${floatToStrTime(this.start)}-${floatToStrTime(this.end)}`
        }
        else{
            eventBtn.innerHTML = `<h5>${this.name}</h5>
        ${this.loc} <br>
        ${this.day} ${floatToStrTime(this.start)}-${floatToStrTime(this.end)}`
        }

        const ecal = document.getElementById("eventCalendar")
        // TODO: need to escape the : in the string to query select it
        const td = ecal.querySelector("#" + this.day + floatToEscStrTime(this.start))
        td.appendChild(eventBtn);
        console.log(td);

        return;
    }
}

// Data structure for an interval that is closed on both sides
class Interval{
    constructor(start, end){
        this.interval = [start, end];
        this.intervals = [[start, end]]
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

        if (this.hasOverlap(i2)){
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
    hasOverlap(i2){
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
            if ((s2 <= s1 && e2 >= s2) || (s2 >= s1 && e2 >= e1 && s2 <= e1)){
                console.log(`Found overlap with ${s1} - ${e1} and ${s2} - ${e2}.`);
                return true;
            }
        }

        return false;
    }

    checkSingleOverlap(s1, e1, s2, e2){
        // 20 23 11 14
        if (s2 <= s1 && e2 <= e1 && e2 >= s1){
            console.log("left overlap");
            return true;
        }
        else if (s2 >= s1 && e2 >= e1 && s2 <= e1){
            console.log("right overlap");
            return true;
        }
        else if (s2 >= s1 && e2 <= e1){
            console.log("contains overlap");
            return true;
        }
        else{
            console.log("no overlap");
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
}

// Data structure for a course, which contains the TAs, events, course name, start/end time and days for scheduling
class Course{
    constructor(name, days, start_t, end_t, interv, tas, events, euuid){
        this.name = name;
        this.days = days;
        this.start_t = start_t;
        this.end_t = end_t;
        this.interv = interv;
        this.tas = tas;
        this.events = events;
        this.euuid = euuid;
        console.log(`Created a new course called ${name} that has sessions from ${start_t} to ${end_t}`);
    }

    initialize(){
        this.populateTASelect();
        this.fillCourseForm();
        this.generateEvents();
    }

    getEvent(id){
        for (let i = 0; i < this.events.length; i++){
            if (this.events[i].id == id){
                return this.events[i]
            }
        }
        
        return null;
    }

    editEvent(id, name, day, start, end, loc, desc, needed){
        for (let i = 0; i < this.events.length; i++){
            if (this.events[i].id == id){
                var res = this.events[i].editEvent(name, day, start, end, loc, desc, needed, this.events[i].assigned);

                if (res){
                    curCourse.saveCourseData();
                    return true;
                }
            }
        }

        return false;
    }

    generateEvents(){
        eventCalendar = new Calendar(this.days, this.start_t, this.end_t, this.interv, "eventCalendar")

        eventCalendar.clear();
        eventCalendar.generateEventRows();

        for (let i = 0; i < this.events.length; i++){
            this.events[i].newModal();
            this.events[i].newEventButton();
        }
    }
    
    deleteCourseData(){
        for (var i = 0; i < localStorage.length; i++){
            const key = localStorage.key(i)
            if (key == this.name){
                localStorage.removeItem(key);
                console.log(`Deleted ${this.name} from the system.`);
                location.reload();
            }
        }

        return false;
    }

    overwriteCourseData(oldCourse){
        const newData = this.courseToJson();

        for (var i = 0; i < localStorage.length; i++){
            const key = localStorage.key(i)
            if (key == oldCourse.name){
                localStorage.removeItem(key);
                localStorage.setItem(this.name, JSON.stringify(newData));
            }
        }
    }

    saveCourseData(){
        if (typeof(Storage) == "undefined") {
            alert("Your web browser doesn't support web storage so data will not be saved.")
            return;
        }

        const data = this.courseToJson();
        console.log(data);

        localStorage.setItem(this.name, JSON.stringify(data));

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

    addEvent(ename, eday, estart, end, eloc, needed, edesc){
        var event = new CourseEvent(ename, eday, estart, end, eloc, edesc, needed, this.euuid);
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
            if (this.events[i].id != id){
                arr.push(this.events[i]);
                continue;
            }
            else{
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

    populateTASelect(){
        // Clear the select menu and then repopulate the select menu
        var select = document.getElementById("selectTAInput");
        clearSelect("selectTAInput");
        showElement("selectTAInput");
        
        for (var i in this.tas){
            var option = document.createElement("option");
            option.text = this.tas[i].name;
            option.value = this.tas[i].name;
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
        data["interv"] = this.interv;
        data["tas"] = this.tas;
        data["events"] = this.events;
        data["euuid"] = this.euuid;

        return data;
    }
    
    findTA(name){
        // Returns the TA info for the given name
        for (var i in this.tas){
            if (name == this.tas[i].name){
                return this.tas[i]
            }
        }
    
        return null;
    }
}

class TA {
    constructor(name, max_hrs, consec, avail){
        this.name = name;
        this.max_hrs = max_hrs;
        this.consec = consec;
        this.avail = avail;
        this.assigned = [];
        this.assigned_avail = {};
    }

    fillTAForm(){
        var nameEle = document.getElementById("inputName");
        var hours = document.getElementById("taMaxHoursInput");
        var canConsec = document.getElementById("consecSelect");

        nameEle.value = this.name;
        hours.value = this.max_hrs;
        
        if (this.consec == 2){
            canConsec.options.selectedIndex = 1;
        }
        else{
            canConsec.options.selectedIndex = 0;
        }

        newCalendar.loadAvail(this.avail);
    }

    checkAvailability(event){
        return;
    }

    assignEvent(event){
        return;
    }

    removeAssignment(event){
        return;
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
    }

    generateTimes(){
        
        var totalTimes = Math.ceil((this.end - this.start) / this.interv);
        var curTime = this.start;

        for (let i = 0; i < totalTimes; i++){
            this.times.push(curTime)
            curTime += curCourse.interv
        }
    }
    
    generateRows(){
        this.generateTimes();

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
        this.generateTimes();

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
            }
        }
    }

    clear(){
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
}

function populateCourseSelect(){
    // Clear the select menu and then repopulate the select menu
    var select = document.getElementById("selectCourseInput");
    clearSelect("selectCourseInput");
    showElement("selectCourseInput");
    
    for (var i in courses){
        var option = document.createElement("option");
        option.text = courses[i].name;
        option.value = courses[i].name;
        select.add(option);
    }
}

function clearSelect(id){
    var select = document.getElementById(id);
    var numOptions = select.options.length - 3;

    for (var i = 0; i < numOptions; i++){
        last = select.options.length - 1
        select.options.remove(last);
    }

    return;
}

function loadCourses(){
    if (typeof(Storage) == "undefined") {
        alert("Your web browser doesn't support web storage so data could not be loaded.")
        return;
    }

    for (var i = 0; i < localStorage.length; i++){
        const data = JSON.parse(localStorage.getItem(localStorage.key(i)))
        let course = new Course(data.name, data.days, data.start_t, data.end_t, data.interv, loadTAs(data.days, data.tas), loadEvents(data.days, data.events), data.euuid);
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
    if (newCalendar !== undefined){
        newCalendar.clear();
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
        hideElement("eventsDiv");
    }
    else if (courseSelect.selectedIndex >= 1){
        submitBtn.innerHTML = "Confirm Changes";
        loadCourseData(courseSelect.value);
        courseForm.removeEventListener("submit", createNewCourse);
        courseForm.addEventListener("submit", editCourse);
        showElement("courseDeleteBtn");
        showElement("eventsDiv");
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

    var startHr = strTimeToNumbers(document.getElementById("startHour").value);
    var endHr = strTimeToNumbers(document.getElementById("endHour").value);

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

    var newCourse = new Course(nameEle.value.toUpperCase(), days, startHr, endHr, 0.5, [], [], 0);
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

    var startHr = strTimeToNumbers(document.getElementById("startHour").value);
    var endHr = strTimeToNumbers(document.getElementById("endHour").value);

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

    if (conf){
        var newCourse = new Course(nameEle.value, days, startHr, endHr, 0.5, curCourse.tas, curCourse.events, curCourse.euuid);

        newCourse.overwriteCourseData(curCourse);
        location.reload();
    }
    else{
        console.log("Didn't overwrite current course");
    }
}

function deleteCourse(){
    const conf = confirm(`Are you sure you want to delete ${curCourse.name}? This action CANNOT be undone!`);

    if (conf){
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
    if (newCalendar === undefined){
        newCalendar = new Calendar(curCourse.days, curCourse.start_t, curCourse.end_t, curCourse.interv, "taAvailCalendar");
        newCalendar.generateRows();
    }
    else{
        newCalendar.clear();
        newCalendar = new Calendar(curCourse.days, curCourse.start_t, curCourse.end_t, curCourse.interv, "taAvailCalendar");
        newCalendar.generateRows();
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

function createNewTA(){
    var nameEle = document.getElementById("inputName");
    var nameFeedback = document.getElementById("taNameFeedback")
    var name = nameEle.value;
    var hours = parseInt(document.getElementById("taMaxHoursInput").value);
    var canConsec = document.getElementById("consecSelect").value;
    var avail = parseAvailabilityFromCalendar();
    var select = document.getElementById("selectTAInput");

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
    
    if (conf){
        var newTA = new TA(name, hours, consec, avail);
        curCourse.addTA(newTA);
        curCourse.populateTASelect();
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

    if (conf){
        var newTA = new TA(name, hours, consec, avail);
        curCourse.overwriteTA(curTASelected, newTA)
    }

    return;
}

function deleteTA(){
    const conf = confirm(`Are you sure you want to delete ${curTASelected.name}? This action CANNOT be undone!`);

    if (conf){
        curCourse.deleteTA(curTASelected);
    }
    
    return false;
}

function loadTAs(days, tas_arr){
    arr = []
    for (let i = 0; i < tas_arr.length; i++){
        ta_obj = tas_arr[i]
        ta = new TA(ta_obj.name, ta_obj.max_hrs, ta_obj.consec, intervalize(days, ta_obj.avail))
        arr.push(ta);
    }

    return arr;
}

function loadEvents(days, events){
    var arr = []

    for (var i = 0; i < events.length; i++){
        const e = events[i];
        var cevent = new CourseEvent(e.name, e.day, e.start, e.end, e.loc, e.description, e.tas_needed, e.id);

        cevent.assigned = loadTAs(days, e.assigned);
        arr.push(cevent);
    }

    return arr;
}

// TODO: Store the events that all TAs are assigned to. Will need to do this in a separate function after loading the events.
function loadTAEvents(){
    return;
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
    target = e.target;

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
    cells = document.querySelectorAll(".avail");
    avail_json = {}
    
    for (var i = 0; i < curCourse.days.length; i++){
        avail_json[curCourse.days[i]] = new Interval(null, null);
    }

    for (var i = 0; i < cells.length; i++){
        id = cells[i].id;
        day = id.slice(0, 3);
        start = strTimeToNumbers(id.slice(3, ));
        avail_json[day].union(new Interval(start, start + curCourse.interv));
    }

    return avail_json;
}

function availJsonToString(aj){
    new_s = ""

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
    const eday = form.elements[2].value;
    const estart = strTimeToNumbers(form.elements[3].value);
    const edur = parseInt(form.elements[4].value) / 60;
    const eloc = form.elements[5].value;
    const tas_needed = parseInt(form.elements[6].value);
    const edesc = form.elements[7].value;

    curCourse.addEvent(ename, eday, estart, estart + edur, eloc, tas_needed, edesc);

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

        if (conf){
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
            form.elements[2].value = e.day; // Day
            form.elements[3].value = floatToStrTime(e.start); // Start Time
            form.elements[4].value = (e.end - e.start) * 60; // Duration
            form.elements[5].value = e.loc; // Location
            form.elements[6].value = e.tas_needed; // TAs needed
            form.elements[7].value = e.description; // Description

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
        // TODO: After editing the event, need to set the add event form back to normal
        var form = document.getElementById("newEventForm");

        const ename = form.elements[0].value;
        const eday = form.elements[2].value;
        const estart = strTimeToNumbers(form.elements[3].value);
        const edur = parseInt(form.elements[4].value) / 60; // converted to hours
        const eloc = form.elements[5].value;
        const tas_needed = parseInt(form.elements[6].value);
        const edesc = form.elements[7].value;

        var res = curCourse.editEvent(evt.currentTarget.targetID, ename, eday, estart, estart + edur, eloc, tas_needed, edesc);

        if (res){
            $("#newEventModal").modal("hide");
            return true;
        }
    }
    
    console.log("An unexpected error occurred while editing the event.");
    return false;
}

/* Utility Functions */
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

function strTimeToNumbers(s){
    // HH:MM -> {"hrs": ..., "mins": ...}
    const timeSplit = s.split(":")
    const t = {"hrs": parseInt(timeSplit[0]), "mins": parseInt(timeSplit[1])}

    if (t.mins < 15){
        return t.hrs
    }
    else if (t.mins > 45){
        return t.hrs + 1
    }
    else{
        return t.hrs + 0.5
    }
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