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

class Calendar {
    constructor(days, start, end){
        this.days = days;
        this.start = start;
        this.end = end;
        this.sessions = [];
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