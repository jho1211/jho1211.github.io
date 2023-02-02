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
        newCalendar = new Calendar(this.days, this.start_t, this.end_t);
        newCalendar.generateRows();

        // Repopulate the TA select menu
        this.populateTASelect();
        this.fillCourseForm();
    
        // TODO: Read the data/events.json file and populate the schedule
    }
    
    saveCourseData(){
        if (typeof(Storage) == "undefined") {
            alert("Your web browser doesn't support web storage so data will not be saved.")
            return;
        }

        var data = {}
        data["name"] = this.name;
        data["days"] = this.days;
        data["start_t"] = this.start_t;
        data["end_t"] = this.end_t;
        data["interv"] = this.interv;
        data["tas"] = this.tas;
        data["events"] = this.events;

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

        if (select.hidden){
            select.hidden = false;
        }
        
        for (var i in this.tas){
            var option = document.createElement("option");
            option.text = name;
            select.add(option);
        }
    }

    courseToJson(){
        data = {}
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
    constructor(name, max_hrs, consec){
        this.name = name;
        this.max_hrs = max_hrs;
        this.consec = consec;
        this.avail = {}

        for (var i = 0; i < days.length; i++){
            this.avail[days[i]] = [];
        }
    }

    get_availability(){
        for (var key in this.avail){
            console.log(this.avail[key]);
        }
        return;
    }

    get_availability_str(){
        // Use .join() to concatenate with <br>
        for (var key in this.avail){
            console.log(this.avail[key]);
        }
        return;
    }

    // day needs to be a 3-char str (e.g. "Mon") time needs to be an interval
    check_availability(day, time){
        return;
    }

    // Given the TA's availability as a List[Interval], 
    set_availability(availability){

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

        for (let i = 0; i < this.times.length; i++){
            
            var newRow = tableBody.insertRow();
            // Add the XX:XX cell
            var strTime = floatToStrTime(this.times[i])
            newRow.insertCell().outerHTML = "<th> " + strTime + "</th>";

            // Add an empty cell for the rest of the cols for this ros
            for (let j = 0; j < this.days.length; j++){
                var newCell = newRow.insertCell();
                newCell.id = this.days[j] + strTime;
                newCell.classList.add("availCell");
            }
        }
    }

    clear(){
        return;
    }

    // Given a TA, display their availability on the calendar (highlighted in green)
    displayAvail(ta){
        return;
    }
}

function roundTimeObj(t){
    // Take time obj {"hrs": ..., "mins": ...} and round to nearest hour and XX min interval
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

function populateCourseSelect(){
    // Clear the select menu and then repopulate the select menu
    var select = document.getElementById("selectCourseInput");
    clearSelect("selectCourseInput");

    if (select.hidden){
        select.hidden = false;
    }
    
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
    var courseForm = document.getElementById("courseForm")
    var submitBtn = document.getElementById("courseFormSubmitBtn");

    // If Add New TA option is selected
    if (courseSelect.selectedIndex == 1){
        // Change the select button so that it says "Confirm Changes" instead and remove the old EventListener for the form
        courseForm.reset();
        courseForm.addEventListener("submit", createNewCourse);
        submitBtn.innerHTML = "Submit";

    }
    else if (courseSelect.selectedIndex >= 1){
        submitBtn.innerHTML = "Confirm Changes";
        loadCourseData(courseSelect.value);
        courseForm.removeEventListener("submit", createNewCourse);
        courseForm.addEventListener("submit", editCourse);
    }

    if (courseForm.hidden){
        courseForm.hidden = false;
    }

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

    var startHr = roundTimeObj(strTimetoNumbers(document.getElementById("startHour").value));
    var endHr = roundTimeObj(strTimetoNumbers(document.getElementById("endHour").value));

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

    var startHr = roundTimeObj(strTimetoNumbers(document.getElementById("startHour").value));
    var endHr = roundTimeObj(strTimetoNumbers(document.getElementById("endHour").value));

    if (name == ""){
        nameEle.classList.remove("is-valid");
        nameEle.classList.add("is-invalid");
        nameFeedback.innerHTML = "The specified name is invalid."
        return false;
    }

    if (isExistingCourse(name) && curCourse.name !== name){
        nameEle.classList.remove("is-valid");
        nameEle.classList.add("is-invalid");
        nameFeedback.innerHTML = "A TA with that name already exists."
        return false;
    }

    nameEle.classList.remove("is-invalid");
    nameEle.classList.add("is-valid");

    const conf = confirm("Would you like to overwrite the current course?")

    if (conf){
        courses.filter(c => c.name !== curCourse.name);

        var newCourse = new Course(nameEle.value, days, startHr, endHr, 0.5, curCourse.tas, curCourse.events);

        courses.push(newCourse);
        newCourse.saveCourseData();
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
    var taForm = document.getElementById("newTAForm")
    var submitBtn = document.getElementById("taFormSubmitBtn");

    newCalendar.clear();

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

    if (taForm.hidden){
        taForm.hidden = false;
    }

    return;
}

function createNewTA(){
    var nameEle = document.getElementById("inputName");
    var nameFeedback = document.getElementById("taNameFeedback")
    var name = nameEle.value;
    // TODO: Add a form field for max hours and max consec hours
    var newTA = TA(name, 128, 2)

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
}

function loadTAAvailability(){
    // Upon select value changing, update the calendar with the TA's availability
    var select = document.getElementById("selectTAInput");

    if (select.selectedIndex > 1){
        ta = curCourse.findTA(select.value);

        // Update the calendar with highlighted sections for the TA's availability
        newCalendar.showAvailability(ta.avail);

        // Change the "modeDisplay" so it also mentions the TA we are viewing
        document.getElementById("modeDisplay").innerHTML = "Availability for" + ta.name;

        // Update the form with the TA's info
        var nameEle = document.getElementById("inputName");
        var availInputElement = document.getElementById("inputAvailability");
        nameEle.value = ta.name;
        availInputElement.value = ta.get_availability_str();
    }
    else{
        return;
    }
}

/* Utility Functions */
function parseAvailability(s){
    // convert time which is in a large string of DDD HH:MM, DDD HH:MM to a JSON with form {"DDD": [], "DDD", []}
    const re = /[A-Z]\w\w\s\d?\d\:\d\d\-\d?\d\:\d\d/;
    var possibleDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    var words = s.split(", ");
    var good = [];
    var bad = [];
    var obj = {};
    
    // Make sure each time matches the pattern we want
    // If it doesn't, then we will store these and let the user know
    // Need to check if times are in ascending order (e.g. 2:00-4:00 rather than 4:00-2:00)
    // TODO: Need to check if times are overlapping
    for (i in words){
        if (re.test(words[i]) && isAscendingTime(words[i])){
            good.push(words[i]);
        }
        else{
            bad.push(words[i]);
        }
    }

    // Take the good strings and convert them to JSON object
    for (i in good){
        // DDD HH:MM
        let day = good[i].slice(0, 3);
        let time = good[i].slice(4)

        // If the day already exists, then we can add it to the array, otherwise
        // we need to initialize an array for the specified day
        if (day in obj && possibleDays.includes(day)){
            if (!obj[day].includes(time)){
                continue;
            }
            obj[day].push(time);
        }
        else{
            obj[day] = [time];
        }
    }

    return {"good": obj, "bad": bad};
}

function isAscendingTime(t){
    // 
    const timeSplit = t.slice(4).split("-");
    const time1 = timeSplit[0].split(":");
    const time1_hr = parseInt(time1);

    const time2 = timeSplit[1].split(":");
    const time2_hr = parseInt(time2);

    return time1_hr <= time2_hr;
}

function strTimetoNumbers(s){
    // HH:MM -> {"hrs": ..., "mins": ...}
    const timeSplit = s.split(":")
    return {"hrs": parseInt(timeSplit[0]), "mins": parseInt(timeSplit[1])}
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