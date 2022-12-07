// Define the days, start, and end time here
var days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
var start_time = 8 // start time in hours (e.g. 8 = 8:00 AM)
var end_time = 20  // end time in hours   (e.g. 20 = 8:00 PM)
var timeLength = 0.5; // 0.5 hour time gap

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
        tableBody.className += "table-secondary table-group-divider";

        for (let i = 0; i < this.times.length; i++){
            
            var newRow = tableBody.insertRow();
            // Add the XX:XX cell
            newRow.insertCell().innerHTML = parseTime(this.times[i]);

            // Add an empty cell for the rest of the cols for this ros
            for (let j = 0; j < this.days.length; j++){
                newRow.insertCell();
            }
        }
    }
}

function initialize(){
    console.log("hello world");
    newCalendar = new Calendar(days, start_time, end_time);
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