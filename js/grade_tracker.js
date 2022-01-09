gradeData = {}

function newRow(){
	var aList = document.getElementById("assignmentList");
	var newAssign = document.createElement("DIV");
	newAssign.className = "row"
	newAssign.innerHTML = `<div class="col-4 text-light mb-2">
              <input type="text" class="form-control" id="courseName" placeholder="Assignment Name" required>
            </div>
            <div class="col-4 text-light mb-2">
              <input type="text" class="form-control" id="courseName" placeholder="0%" required>
            </div>
            <div class="col-4 text-light mb-2">
              <input type="text" class="form-control" id="courseName" placeholder="0%" required>
            </div>`
    aList.appendChild(newAssign);
}

function deleteRow(){
	var aList = document.getElementById("assignmentList");

	if (aList.lastChild == null){
		console.log("There are no more rows to remove!");
		return;
	}
	else{
		aList.removeChild(aList.lastChild);
	}
}

function submitGrades(){
	console.log("Submitted grades");
	cName = document.getElementById("cName").value;
	var aList = document.getElementById("assignmentList");
	console.log(aList.childNodes);

	gradeData[cName] = [];
}