/*
Fitness Tracker Functions
- Fetch + load presets
	- Fetch from JSON files
	Default Presets: 
- Save preset
- Load preset

- View previous days

- Calendar display
- Statistics
	- Total days gone to the gym in current year
*/

const options = ["Select an activity type", "Weightlifting", "Running", "Other"]
var presetsData = {}

async function loadPresets(){
	let file = await fetch("data/presets.json");
	presetsData = await file.json();
	console.log(presetsData);
}

function addNewRow(){
	var table = document.getElementById("fitnessTable");
	var new_row = table.insertRow(-1);
	const numRows = 5

	for (var i=0; i < numRows; i++){
		var cell = new_row.insertCell(i);
		if (i==0){
			var newInputField = createSelectElement();
			cell.appendChild(newInputField);
		}
		else if (i == 1) {
			var newInputField = createInputElement("Activity");
			cell.appendChild(newInputField);
		}
		else{
			var newInputField = createInputElement("0");
			cell.appendChild(newInputField);
		}
		// <input type="text" class="form-control" placeholder="0" aria-label="Number of reps" aria-describedby="inputReps">
	}
}

function createSelectElement(){
	var newSelectField = document.createElement("SELECT");
	newSelectField.setAttribute("class", "form-select");
	newSelectField.setAttribute("aria-label", "Select your activity");
			for (var i = 0; i < options.length; i++){
				var newOption = document.createElement("option");
				newOption.text = options[i];
				newSelectField.add(newOption);
			}
	return newSelectField
}

function createInputElement(ph){
	var newInputField = document.createElement("INPUT");
	newInputField.setAttribute("type", "text");
	newInputField.setAttribute("class", "form-control");
	newInputField.setAttribute("placeholder", ph);
	return newInputField
}

async function loadPreset(){
	var preset = document.getElementById("presetSelect");
	var presetSelected = preset.value;
	await fetch
}