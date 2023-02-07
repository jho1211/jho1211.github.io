//TODO: Fix the course creation so that it selects the course automatically when first created
//      might want to do the same for overwriting instead of refreshing page
// Work on interval implementation

// Define the days, start, and end time here
var days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
var start_time = 9 // start time in hours (e.g. 8 = 8:00 AM)
var end_time = 19  // end time in hours   (e.g. 20 = 8:00 PM)
var timeLength = 0.5; // 0.5 hour time gap

var newCalendar;
var courses = [];

// For populating the TA select menu
var curCourse;
var curTASelected;

// Data structure for an interval that is closed on both sides
class Interval{
    constructor(start, end){
        this.start = start;
        this.end = end;
    }

    // Join the two intervals together
    union(i2){
        return;
    }

    // Checks if i1 overlaps with i2
    hasOverlap(i2){
        return;
    }

    // check if i1 contains the entire i2 interval
    contains(i2){
        return;
    }

    // Check if the interval is empty
    isEmpty(){
        return this.start == null || this.end == null;
    }

    // Convert interval to JSON object (e.g. [[1,3], [2,4], [6,9]])
    jsonify(){
        return;
    }
}

// Data structure for a course, which contains the TAs, events, course name, start/end time and days for scheduling
class Course{
    constructor(name, days, start_t, end_t, interv, tas, events){
        this.name = name;
        this.days = days;
        this.start_t = start_t;
        this.end_t = end_t;
        this.interv = interv;
        this.tas = tas;
        this.events = events;
        console.log(`Created a new course called ${name} that has sessions from ${start_t} to ${end_t}`);
    }

    initialize(){
        // Repopulate the TA select menu
        this.populateTASelect();
        this.fillCourseForm();
    
        // TODO: Read the data/events.json file and populate the schedule
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

        localStorage.setItem(this.name, JSON.stringify(data));

        return;
    }

    fillCourseForm(){
        // Change the course name input
        document.getElementById("inputCourseName").value = this.name;

        // Select the days for TAs
        var day_options = document.querySelectorAll(".form-check-input");

        for (var i in day_options){
            if (this.days.includes(day_options[i].value)){
                day_options[i].checked = true;
            }
        }

        // Set the start and end hour
        document.getElementById("startHour").value = floatToStrTime(this.start_t);
        document.getElementById("endHour").value = floatToStrTime(this.end_t);
    }

    populateTASelect(){
        // Clear the select menu and then repopulate the select menu
        var select = document.getElementById("selectTAInput");
        clearSelect("selectTAInput");
        showElement("selectTAInput");
        
        for (var i in this.tas){
            var option = document.createElement("option");
            option.text = name;
            select.add(option);
        }
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

        return data;
    }

    saveCourses(){
        var data = this.courseToJson();
        localStorage.setItem(this.name, JSON.stringify(data));
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
    constructor(days, start, end){
        this.days = days;
        this.start = start;
        this.end = end;
        this.events = [];
        this.times = []
    }

    generateTimes(){
        
        var totalTimes = (this.end - this.start) / timeLength;
        var curTime = this.start;

        for (let i = 0; i < totalTimes; i++){
            this.times.push(curTime)
            curTime += timeLength
        }
    }
    
    generateRows(){
        this.generateTimes();

        var table = document.getElementById("schedule")
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

    clear(){
        var table = document.getElementById("schedule");
        table.innerHTML = "";
    }

    // Given a TA, display their availability on the calendar (highlighted in green)
    displayAvail(ta){
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
        course = new Course(data.name, data.days, data.start_t, data.end_t, data.interv, data.tas, data.events);
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
            course.initialize();
            curCourse = course;
            return;
        }
    }

    console.log("The specified course could not be found.");
}

function initializeCourse(){
    var courseSelect = document.getElementById("selectCourseInput");
    var courseForm = document.getElementById("courseForm");
    var submitBtn = document.getElementById("courseFormSubmitBtn");

    // Hide the calendar
    if (newCalendar !== undefined){
        newCalendar.clear();
    }

    // If Add New TA option is selected
    if (courseSelect.selectedIndex == 1){
        // Change the select button so that it says "Confirm Changes" instead and remove the old EventListener for the form
        courseForm.reset();
        courseForm.addEventListener("submit", createNewCourse);
        submitBtn.innerHTML = "Submit";

        // Hide the TA select and TA form if it is not hidden already
        var taSelect = document.getElementById("selectTAInput");
        taSelect.options.selectedIndex = 0;

        hideElement("selectTAInput");
        hideElement("taAccordion");
    }
    else if (courseSelect.selectedIndex >= 1){
        submitBtn.innerHTML = "Confirm Changes";
        loadCourseData(courseSelect.value);
        courseForm.removeEventListener("submit", createNewCourse);
        courseForm.addEventListener("submit", editCourse);
    }

    showElement("courseAccordion")
    

    return;
}

function createNewCourse(){
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

    if (isExistingCourse(name)){
        nameEle.classList.remove("is-valid");
        nameEle.classList.add("is-invalid");
        nameFeedback.innerHTML = "A course with that name already exists."
        return false;
    }

    nameEle.classList.remove("is-invalid");
    nameEle.classList.add("is-valid");

    var newCourse = new Course(nameEle.value, days, startHr, endHr, 0.5, [], []);
    courses.push(newCourse);
    newCourse.saveCourseData();
    populateCourseSelect();

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
        var newCourse = new Course(nameEle.value, days, startHr, endHr, 0.5, curCourse.tas, curCourse.events);

        newCourse.overwriteCourseData(curCourse);
        location.reload();
    }
    else{
        console.log("Didn't overwrite current course");
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

    // If Add New TA option is selected
    if (select.selectedIndex == 1){
        // Change the select button so that it says "Confirm Changes" instead and remove the old EventListener for the form
        taForm.reset();
        taForm.addEventListener("submit", createNewTA);
        submitBtn.innerHTML = "Submit";

    }
    else if (select.selectedIndex >= 1){
        submitBtn.innerHTML = "Confirm Changes";
        taForm.removeEventListener("submit", createNewTA);
        taForm.addEventListener("submit", editTA);
    }

    showElement("taAccordion");

    // Show Calendar
    if (newCalendar === undefined){
        newCalendar = new Calendar(curCourse.days, curCourse.start_t, curCourse.end_t);
        newCalendar.generateRows();
    }
    else{
        newCalendar.clear();
        newCalendar = new Calendar(curCourse.days, curCourse.start_t, curCourse.end_t);
        newCalendar.generateRows();
    }

    return;
}

function createNewTA(){
    parseAvailabilityFromCalendar();
    /*
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

    var newTA = TA(name, hours, consec)

    if (name == ""){
        nameEle.classList.remove("is-valid");
        nameEle.classList.add("is-invalid");
        nameFeedback.innerHTML = "The specified name is invalid."
        return false;
    }

    if (isExistingTA(name)){
        nameEle.classList.remove("is-valid");
        nameEle.classList.add("is-invalid");
        nameFeedback.innerHTML = "A TA with that name already exists."
        return false;
    }

    nameEle.classList.remove("is-invalid");
    nameEle.classList.add("is-valid");

    cur_tas.push(newTA);
    saveTAs();

    return true;
    */
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
    var parsedAvail = [];
    var time_interv;

    for (var i = 0; i < cells.length; i++){
        id = cells[i].id;
        day = id.slice(0, 3);
        start = strTimeToNumbers(id.slice(3, ));
        const time_range_str = createStrTimeRange(start, curCourse.interv);
        const interv = createTimeRange(start, curCourse.interv);
    }

    console.log(time_interv);
    return;
}

/* Utility Functions */
function createStrTimeRange(start, step){
    end_time = start + step;
    return floatToStrTime(start) + " - " + floatToStrTime(end_time);
}

function createTimeRange(start, step){
    end_time = start + step;
    return Interval(start, start+step);
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

loadCourses();