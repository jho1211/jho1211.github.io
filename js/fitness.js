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
var presetsData = {"Push Day": [["Weightlifting", "Bench Press", "100", "4", "12"], ["Weightlifting", "Bench Press", "100", "4", "12"]], 
"Pull Day": [["Weightlifting", "Bench Press", "100", "4", "12"], ["Weightlifting", "Bench Press", "100", "4", "12"]]}
var fitnessData = {}

async function loadPresetsList(){
	if (typeof(Storage) !== "undefined") {
	  console.log("Browser supports local storage");
	} else {
	  alert("Your browser doesn't support local storage. Presets can't be saved. Please consider upgrading your browser or using a different one.");
	  return;
	}

	var presets = localStorage.getItem("presets");

	// Fetch the presets from localStorage and convert it to JSON if not null
	if (presets !== null){
		presetsData = JSON.parse(localStorage.getItem("presets"));
	}
	else{
		presetsData = {}
	}

	var presetSelect = document.getElementById("presetSelect");
	clearCurrentPresets();
	
	for (const pset in presetsData){
		var newOption = document.createElement("option");
		newOption.text = pset;
		newOption.value = pset
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
			var newInputField = createSelectElement(options, "Select an activity type", row_data[i]);
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

function createSelectElement(options, alabel, def){
	var newSelectField = document.createElement("SELECT");
	newSelectField.setAttribute("class", "form-select");
	newSelectField.setAttribute("aria-label", alabel);
	for (var i = 0; i < options.length; i++){
		var newOption = document.createElement("option");
		newOption.text = options[i];
		newSelectField.add(newOption);
	}
	newSelectField.value = def;
	return newSelectField
}

function createInputElement(value){
	var newInputField = document.createElement("INPUT");
	newInputField.setAttribute("type", "text");
	newInputField.setAttribute("class", "form-control");

	if (value != "0" && value != "Activtiy"){
		newInputField.setAttribute("value", value);
	}
	else{
		newInputField.setAttribute("placeholder", value);
	}

	return newInputField
}

function clearCurrentRows(id){
	var table = document.getElementById(id);
	var rows = table.rows
	var numRows = table.rows.length // ignore the first row which is thead

	for (var i = 0; i < numRows - 1; i++){
		table.deleteRow(-1);
	}
	return;
}

function loadPreset(){
	var preset = document.getElementById("presetSelect");
	var presetSelected = preset.value;
	var saveBtn = document.getElementById("savePresetBtn");

	if (presetSelected in presetsData == false){
		saveBtn.innerHTML = "Save as New Preset";
		return;
	}

	var presetRows = presetsData[presetSelected];

	// Clear the current rows when preset is selected
	clearCurrentRows("fitnessTable");
	for (var i = 0; i < presetRows.length; i++){
		// Add the rows from the preset
		addNewRow(presetRows[i]);
	}

	saveBtn.innerHTML = "Overwrite Preset";
}

function savePreset(){
	var table = document.getElementById("fitnessTable");
	var rows = table.rows;
	var newArr = [];

	// Start index at 1 to ignore the thead row
	for (var i = 1; i < rows.length; i++){
		var rowArr = []
		cells = rows[i].cells;

		for (var j = 0; j < cells.length; j++){
			rowArr.push(cells[j].childNodes[0].value);
		}

		newArr.push(rowArr);
	}

	var preset = document.getElementById("presetSelect");
	var presetSelected = preset.value;
	if (presetSelected in presetsData){
		presetsData[presetSelected] = newArr
		localStorage.setItem('presets', JSON.stringify(presetsData))
		return;
	}
	else {
		var newPsetName = prompt("What would you like to name the new preset?");
		if (newPsetName !== null && !(newPsetName in presetsData)){
			presetsData[newPsetName] = newArr;
			localStorage.setItem('presets', JSON.stringify(presetsData))
			loadPresetsList();

			// Set the preset select value to the new preset
			var preset = document.getElementById("presetSelect");
			var newNumOptions = preset.options.length;
			preset.value = preset.options[newNumOptions - 1].value;
			return;
		}
		else if (newPsetName in presetsData){
			alert("The chosen preset name already exists, please choose another one.");
		}
		else{
			return;
		}
	}
}

function deletePreset(){
	var preset = document.getElementById("presetSelect");
	var presetSelected = preset.value;

	if (presetSelected in presetsData){
		delete presetsData[presetSelected]
		localStorage.setItem('presets', JSON.stringify(presetsData))
		loadPresetsList();
		preset.value = preset.options[0].value;
		return;
	}
	else{
		alert("This is not a valid preset to delete.")
		return;
	}
}

function clearCurrentPresets(){
	var presetSelect = document.getElementById("presetSelect");
	var curNumOptions = presetSelect.options.length;

	for (var i = 0; i < curNumOptions - 1; i++){
		presetSelect.remove(presetSelect.options.length - 1);
	}
}

function deleteLastRow(){
	var table = document.getElementById("fitnessTable");
	var rows = table.rows
	var numRows = table.rows.length

	if (numRows == 1){
		console.log("There are no more rows to delete.")
		return;
	}
	else {
		table.deleteRow(-1);
		return;
	}
}

function submitForm(){
	var actDate = document.getElementById("activityDate").value;

	if (actDate !== ""){
		var splitDate = actDate.split("-") // yyyy-mm-dd

		let year = parseInt(splitDate[0])
		let month = parseInt(splitDate[1]) - 1
		let day = parseInt(splitDate[2])

		var table = document.getElementById("fitnessTable");
		var rows = table.rows;
		var newArr = [];

		// Start index at 1 to ignore the thead row
		for (var i = 1; i < rows.length; i++){
			var rowArr = []
			cells = rows[i].cells;

			for (var j = 0; j < cells.length; j++){
				rowArr.push(cells[j].childNodes[0].value);
			}

			newArr.push(rowArr);
		}

		generateFitnessJSON(year, month, day);

		if (day in fitnessData[year][month]){
			var overwrite = confirm("You have already submitted an activity for this date. Do you want to overwrite the current activity?")
			if (overwrite){
				fitnessData[year][month][day] = newArr;

				localStorage.setItem("fitnessData", JSON.stringify(fitnessData));
				alert("The fitness activity was successfully saved!")
				return;
			}
			else{
				return;
			}
		}
		else{
			fitnessData[year][month][day] = newArr;
			localStorage.setItem("fitnessData", JSON.stringify(fitnessData));
			alert("The fitness activity was successfully saved!")
			return;
		}
	}
	else{
		alert("Invalid date submitted, please choose a valid date.");
		return;
	}

	
}

function generateFitnessJSON(year, month, day){
	if (!(year in fitnessData)){
		fitnessData[year] = {}
		const totalMonths = 12
		for (var i = 0; i < totalMonths; i++){
			fitnessData[year][i] = {}
		}
	}

	return;
}

function loadFitnessData(){
	if (typeof(Storage) !== "undefined") {
		fitnessData = localStorage.getItem("fitnessData")

		if (fitnessData !== null){
			fitnessData = JSON.parse(fitnessData)
		}
		else{
			fitnessData = {}
		}

		console.log(fitnessData);
	} 
	else {
	  alert("Your browser doesn't support local storage. Presets can't be saved. Please consider upgrading your browser or using a different one.");
	  return;
	}
}