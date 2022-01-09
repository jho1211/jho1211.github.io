const monthValues = {0: "January", 1: "February", 2: "March", 3: "April", 4: "May", 5: "June", 6: "July", 7: "August", 8: "September", 9: "October", 10: "November", 11: "December"};
const monthCode = {"January": 0, "February": 3, "March": 3, "April": 6, "May": 1, "June": 4, "July": 6, "August": 2, "September": 5, "October": 0, "November": 3, "December": 5};
const centuryCode = 6
const daysPerMonth = {0: 31, 1: 28, 2: 31, 3: 30, 4: 31, 5: 30, 6: 31, 7: 31, 8: 30, 9: 31, 10: 30, 11: 31};

var curYear = 0;
var curMonth = 0;
var curDay = 0;

var actualYear = 0;
var actualMonth = 0;
var actualDay = 0;

function loadCalendar(){
	const d = new Date();
	actualYear, curYear = d.getFullYear();
	actualMonth, curMonth = d.getMonth();
	actualDay, curDay = d.getDate();

	var calMonthLabel = document.getElementById("calendarMonthLabel");
	calMonthLabel.innerHTML = monthValues[curMonth] + " " + curYear.toString();
	generateCalendarRows(curMonth, curYear);
}

function generateCalendarRows(month, year){
	var calendarTable = document.getElementById('calendar');
	const numRows = 6
	const numCols = 7

	const startDay = calculateMonthStartDay(month, year);
	var curNum = -startDay + 1;
	var numDays = daysPerMonth[month]

	clearCurrentRows("calendar");
	clearModals("modalDiv");

	// If February, check if leap year. If leap year, add 1 to number of days in month
	if (month == 1){
		numDays += leapYearCode(year);
	}
	

	for (var i = 0; i < numRows; i++){
		var row = calendarTable.insertRow(-1);

		for (var j = 0; j < numCols; j++){
			var cell = row.insertCell(-1);

			if (curNum > 0 && curNum < numDays + 1){
				cell.innerHTML = curNum;
				// if curNum exists in the fitnessData[year][month], then create a modal toggle button, modal goes outside of calendar
				if (!(year in fitnessData)){
				}
				else{
					if (curNum in fitnessData[year][month]){
					createModal(year, month, curNum, cell);
					}

					if (curNum == curDay && actualMonth == month){
						cell.style.backgroundColor = "#C4A000";
						cell.style.opacity = 1;
					}
				}
			}
			
			curNum++;

			cell.style.height = "100px";
			cell.style.width = "100px";
			cell.style.verticalAlign = "top";
			cell.style.textAlign = "right";
		}
	}
	return;
}

function calculateMonthStartDay(month, year){
	const YY = year % 100
	const yearCode = (YY + Math.floor(YY / 4)) % 7

	// Assumes 2000s century code
	return (yearCode + monthCode[monthValues[month]] + 6 + 1 - leapYearCode(year)) % 7;
}

function leapYearCode(year){
	if (year % 400 == 0){
		return 1
	}
	else{
		if (year % 4 == 0){
			if (year % 100 == 0){
				return 0
			}
			else{
				return 1
			}
		}
		else{
			return 0
		}
	}
}

function calendarPrevMonth(){
	if (curMonth == 0){
		curMonth = 11;
		curYear -= 1;
	}
	else{
		curMonth -= 1;
	}

	var calMonthLabel = document.getElementById("calendarMonthLabel");
	calMonthLabel.innerHTML = monthValues[curMonth] + " " + curYear.toString();

	generateCalendarRows(curMonth, curYear);
	return;
}

function calendarNextMonth(){
	if (curMonth == 11){
		curMonth = 0;
		curYear += 1;
	}
	else{
		curMonth += 1;
	}

	var calMonthLabel = document.getElementById("calendarMonthLabel");
	calMonthLabel.innerHTML = monthValues[curMonth] + " " + curYear.toString();

	generateCalendarRows(curMonth, curYear);
	return;
}

function createModal(year, month, day, cell){
	var modalID = `modal-${day}`
	var title = `${monthValues[month]} ${day} - ${fitnessData[year][month][day]["title"]}`

	var activities = fitnessData[year][month][day]["data"];
	var modalBodyUL = document.createElement("UL");
	modalBodyUL.className = "list-group list-group-flush"

	for (var i = 0; i < activities.length; i++){
		let act = activities[i];
		var newLI = document.createElement("LI");
		newLI.innerHTML = `${act[3]}x${act[4]} ${act[1]} (${act[2]} lbs)`
		newLI.className = "list-group-item"
		modalBodyUL.appendChild(newLI);
	}

	// Creating the modal element for each day with an activity
	var fadeDiv = document.createElement("div");
	fadeDiv.innerHTML = `<div class="modal fade" id="${modalID}" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
	  <div class="modal-dialog">
	    <div class="modal-content">
	      <div class="modal-header">
	        <h5 class="modal-title" id="${modalID}">${title}</h5>
	        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
	      </div>
	      <div class="modal-body">
	        ${modalBodyUL.outerHTML}
	      </div>
	      <div class="modal-footer">
	        <button type="button" class="btn btn-warning disabled">Edit</button>
	        <button type="button" class="btn btn-danger" data-bs-dismiss="modal" onclick="deleteActivity(${year}, ${month}, ${day})">Delete Activity</button>
	      </div>
	    </div>
	  </div>
	</div>`
	var modalDiv = document.getElementById("modalDiv");
	modalDiv.appendChild(fadeDiv);

	// Creating the modal toggle button for each day with an activity
	var newDiv = document.createElement("div");
	newDiv.innerHTML = `<button type="button" class="btn btn-info" data-bs-toggle="modal" data-bs-target="#${modalID}">
  	${fitnessData[year][month][day]["title"]}
	</button>`

	cell.appendChild(newDiv);	
}

function clearModals(id){
	var modalDiv = document.getElementById(id);
	modalDiv.innerHTML = ""
}