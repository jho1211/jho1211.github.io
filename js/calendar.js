// Define the days, start, and end time here
var days = ["Mon", "Tue", "Wed", "Thu", "Fri"]
var start_time = 8 // start time in hours (e.g. 8 = 8:00 AM)
var end_time = 18  // end time in hours   (e.g. 20 = 8:00 PM)
var timeLength = 0.5; // 0.5 hour time gap

var newCalendar;

var mode = "view";
var hoverEffect = false;
var startEvent;
var startEventDay;

var selectedTimes = [];

// For populating the TA select menu
var cur_tas = [];

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
        header.className += "table-primary"
        var headerRow = header.insertRow(0)
        headerRow.insertCell().outerHTML = "<th scope='col'>   </th>"
        
        for (let i = 0; i < this.days.length; i++){
            headerRow.insertCell().outerHTML = "<th scope='col'>" + this.days[i] + "</th>";
        }

        // Generate the table rows with each time
        var tableBody = table.createTBody();
        tableBody.addEventListener("mouseover", hoverHighlight);
        tableBody.className += "table-secondary table-group-divider";

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

    showAvailability(avail){
        // times -> {"DDD": [], "DDD": []}
        for (const d in avail){
            const timesAvail = avail[d]

            for (const t in timesAvail){
                // Need to round the start range and end range to the nearest interval
                // e.g. 2:59-11:23 => 3:00-11:00
                const timeSplit = timesAvail[t].split("-")
                const time1 = strTimetoNumbers(timeSplit[0])
                const time2 = strTimetoNumbers(timeSplit[1])

                const newTime1 = roundTimeObj(time1); // float
                const newTime2 = roundTimeObj(time2); // float

                const times = (newTime2 - newTime1) / timeLength;
                let curTime = newTime1;

                for (var i = 0; i < times; i++){
                    if (curTime <= start_time || curTime >= end_time || !days.includes(d)){
                        continue
                    }

                    document.getElementById(d + floatToStrTime(curTime)).classList.add("table-success");
                    curTime += timeLength;
                }

                // Set the class of the cells from newTime1 to newTime2
                //document.getElementById(avail[d] + newTime1).classList.add("table-success")
            }
        }
    }

    clear(){
        const tds = document.getElementsByClassName("availCell");

        for (var i = 0; i < tds.length; i++){
            const td = tds[i];
            if (td.classList.contains("table-success")){
                td.classList.remove("table-success")
            }
        }
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

function initialize(){
    console.log("hello world");
    newCalendar = new Calendar(days, start_time, end_time);
    newCalendar.generateRows();

    if (typeof(Storage) == "undefined") {
        alert("Your web browser doesn't support web storage so data will not be saved.")
        return;
    }

    // Read the tas data and populate the select menu
    if (localStorage.getItem("ubc_cs_tas") === null){
        localStorage.setItem("ubc_cs_tas", "[]")
    }
    else{
        cur_tas = JSON.parse(localStorage.getItem("ubc_cs_tas"));

        // Populate the select menu
        for (i in cur_tas){
            addTASelect(cur_tas[i].name);
        }
    }

    console.log(cur_tas);

    // TODO: Read the data/events.json file and populate the schedule
}

function toggleEdit(obj){
    var modeText = document.getElementById("modeDisplay");

    // If in edit mode, change to view mode
    if (mode == "edit"){
        mode = "view";
        modeText.innerHTML = "View Mode"

        obj.className = "btn btn-warning"
        obj.innerHTML = "<img src='img/pencil-square.svg'> Edit Sessions"
    }
    // If in view mode, change to edit mode
    else{
        mode = "edit";
        modeText.innerHTML = "Edit Mode";

        obj.className = "btn btn-primary"
        obj.innerHTML = "<img src='img/eye-fill.svg'> View Sessions"
    }

    // If switching to view/edit mode, remove any existing highlights
    if (selectedTimes.length > 0){
        for (i in selectedTimes){
            selectedTimes[i].className = "";
        }

        selectedTimes = [];
    }
}

function recordStartSession(e){
    target = e.target;

    if (mode == "edit"){
        // If LMB pressed then add new time
        if (e.button == 0){
            if (typeof startEvent == "undefined"){
                startEvent = target.id;
                startEventDay = startEvent.slice(0, 3);
            }
    
            hoverEffect = true;
            console.log(target.id);
            var desiredDay = target.id.slice(0, 3);
            
            // If not already included in selectedTimes list and same day, then highlight and add to list
            if (!selectedTimes.includes(target)){
                if (startEventDay == desiredDay){
                    target.className = "table-warning";
                    selectedTimes.push(target);
                }
            }
        }
        // If RMB pressed then remove time
        else if (e.button == 2){
            var idx = getArrayIndex(target, selectedTimes);
            // Removes the selected time if already existing
            if (selectedTimes != -1){
                target.className = "";
                selectedTimes.splice(idx, 1);
            }
            e.preventDefault();
        }

        console.log(selectedTimes);
    }
}

function newEvent(e){
    // If in edit mode, display the add session button
    // On button click, the selected times will be converted to an Event object
    if (mode == "edit"){
        var target = e.target.id;
        hoverEffect = false;
        
        // Remove highlighting from all selected times
        for (ele in selectedTimes){
            selectedTimes[ele].className = "";
        }

        // Reset the list to empty
        selectedTimes = [];
    }
}

function stopHover(){
    if (hoverEffect){
        hoverEffect = false;
    }
}

function hoverHighlight(e){
    if (hoverEffect){
        var target = e.target;
        desiredDay = target.id.slice(0, 3)

        // If not already selected, add to the list
        if (!selectedTimes.includes(target)){
            // If same day, then add to list
            if (startEventDay == desiredDay){
                target.className = "table-warning";
                selectedTimes.push(target);
            }
        }
    }
}

function getArrayIndex(ele, arr){
    // Returns the index of the desired element in the arr, otherwise return -1 if not found
    for (let i = 0; i < arr.length; i++){
        if (ele == arr[i]){
            return i;
        }
    }

    return -1
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
    var availInputElement = document.getElementById("inputAvailability");
    var availFeedback = document.getElementById("availFeedback")
    var name = nameEle.value;
    var avail = parseAvailability(availInputElement.value);
    var newTA = {"name": name, "avail": avail.good, "availStr": availInputElement.value};

    console.log(avail);

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

    // TODO: Create a warning popup to let the user know that there was an error parsing one or more of the times
    // Use the is-invalid and availFeedback to let the user know
    if (Object.keys(avail.good).length == 0){
        availInputElement.classList.add("is-invalid");
        availFeedback.innerHTML = "The availability is missing or is not formatted properly."
        return false;
    }
    else if (avail.bad.length > 0){
        availInputElement.classList.add("is-invalid");
        availFeedback.innerHTML = "The following times failed to parse: " + avail.bad.join(", ");
        return false;
    }

    nameEle.classList.remove("is-invalid");
    nameEle.classList.add("is-valid");
    availInputElement.classList.remove("is-invalid");
    availInputElement.classList.add("is-valid");

    cur_tas.push(newTA);
    saveTAs();

    return true;
}

function editTA(){
    // TODO: Need to create a new edit button when an existing TA is selected from select menu
}

function addTASelect(name){
    var select = document.getElementById("selectTAInput");
    var option = document.createElement("option");
    option.text = name;

    select.add(option);
}

function isExistingTA(name){
    for (ta in cur_tas){
        if (name == cur_tas[ta].name){
            return true;
        }
    }
    
    return false;
}

function saveTAs(){
    localStorage.setItem("ubc_cs_tas", JSON.stringify(cur_tas));
}

function findTA(name){
    // Returns the TA info for the given name
    for (i in cur_tas){
        if (name == cur_tas[i].name){
            return cur_tas[i]
        }
    }

    return null;
}

function loadTAAvailability(){
    // Upon select value changing, update the calendar with the TA's availability
    var select = document.getElementById("selectTAInput");

    if (select.selectedIndex > 1){
        ta = findTA(select.value);

        // Update the calendar with highlighted sections for the TA's availability
        newCalendar.showAvailability(ta.avail);

        // Change the "modeDisplay" so it also mentions the TA we are viewing
        document.getElementById("modeDisplay").innerHTML = "View Mode<br> Availability for " + ta.name;

        // Update the form with the TA's info
        var nameEle = document.getElementById("inputName");
        var availInputElement = document.getElementById("inputAvailability");
        nameEle.value = ta.name;
        availInputElement.value = ta.availStr;
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