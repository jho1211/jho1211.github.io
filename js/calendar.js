// Define the days, start, and end time here
var days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
var start_time = 8 // start time in hours (e.g. 8 = 8:00 AM)
var end_time = 20  // end time in hours   (e.g. 20 = 8:00 PM)
var timeLength = 0.5; // 0.5 hour time gap

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
            var strTime = parseTime(this.times[i])
            newRow.insertCell().innerHTML = strTime;

            // Add an empty cell for the rest of the cols for this ros
            for (let j = 0; j < this.days.length; j++){
                var newCell = newRow.insertCell();
                newCell.id = this.days[j] + strTime
            }
        }
    }
}

class Event {
    constructor(name, day, start, end){
        this.name = name;
        this.day = day;
        this.start = start;
        this.end = end;
    }
}

function initialize(){
    console.log("hello world");
    var newCalendar = new Calendar(days, start_time, end_time);
    newCalendar.generateRows();

    if (typeof(Storage) == "undefined") {
        alert("Your web browser doesn't support web storage so data will not be saved.")
        return;
    }

    console.log(localStorage);

    // Read the tas data and populate the select menu
    if (localStorage.getItem("ubc_cs_tas") === null){
        localStorage.setItem("ubc_cs_tas", "[]")
    }
    else{
        cur_tas = JSON.parse(localStorage.getItem("ubc_cs_tas"));
        var select = document.getElementById("selectTAInput");

        // Populate the select menu
        for (i in cur_tas){
            addTASelect(cur_tas[i].name);
        }
    }

    // TODO: Read the data/events.json file and populate the schedule
}

function parseTime(x){
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
    hoverEffect = false;
    console.log(selectedTimes);
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

function toggleTAForm(){
    var select = document.getElementById("selectTAInput");
    var taForm = document.getElementById("newTAForm")
    if (select.selectedIndex == 1){
        taForm.hidden = false;
    }
    else{
        if (!taForm.hidden){
            taForm.hidden = true;
        }
    }
}

function createNewTA(){
    console.log("New TA created!")
    var name = document.getElementById("inputName").value;
    var avail = document.getElementById("inputAvailability").value;
    var newTA = {"name": name, "avail": avail};

    if (isExistingTA(name)){
        alert("The specified TA already exists, please select a different name.");
        return false;
    }
    else{
        cur_tas.push(newTA);
        saveTAs();
        return true;
    }
}

function editTA(){
    // Need to create a new edit button when an existing TA is selected from select menu
}

function addTASelect(name){
    var select = document.getElementById("selectTAInput");
    var option = document.createElement("option");
    option.text = name;

    select.add(option);
    console.log(select);
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