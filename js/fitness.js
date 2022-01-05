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
var presetsData = {}

async function loadPresetsList(){
	let file = await fetch("data/presets.json");
	presetsData = await file.json();
	var presetSelect = document.getElementById("presetSelect");
	
	for (const pset in presetsData){
		var newOption = document.createElement("option");
		newOption.text = pset;
		presetSelect.add(newOption);
	}
}

function addNewRow(row_data){
	var table = document.getElementById("fitnessTable");
	var new_row = table.insertRow(-1);
	const options = ["Select an activity type", "Weightlifting", "Running", "Other"]
	const numRows = 5

	for (var i = 0; i < numRows; i++){
		var cell = new_row.insertCell(i);

		if (i == 0){
			var newInputField = createSelectElement(options, "Select your activity type");
			cell.appendChild(newInputField);
		}
		else if (i == 1) {
			var newInputField = createInputElement(row_data[i]);
			cell.appendChild(newInputField);
		}
		else{
			var newInputField = createInputElement(row_data[i]);
			cell.appendChild(newInputField);
		}
	}
}

function createSelectElement(options, alabel){
	var newSelectField = document.createElement("SELECT");
	newSelectField.setAttribute("class", "form-select");
	newSelectField.setAttribute("aria-label", alabel);
			for (var i = 0; i < options.length; i++){
				var newOption = document.createElement("option");
				newOption.text = options[i];
				newSelectField.add(newOption);
			}
	return newSelectField
}

function createInputElement(value){
	var newInputField = document.createElement("INPUT");
	newInputField.setAttribute("type", "text");
	newInputField.setAttribute("class", "form-control");

	if (value != "0"){
		newInputField.setAttribute("value", value);
	}
	else{
		newInputField.setAttribute("placeholder", value);
	}

	return newInputField
}

async function loadPreset(){
	var preset = document.getElementById("presetSelect");
	var presetSelected = preset.value;
	console.log(presetsData);
}