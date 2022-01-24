var gradeData = {};
var totalRows = 0;

function newRow(){
	var aList = document.getElementById("assignmentList");
	var newAssign = document.createElement("DIV");
	newAssign.className = "row"
	newAssign.innerHTML = `<div class="col-4 text-light mb-2">
              <input type="text" class="form-control" id="aname-${totalRows}" placeholder="Assignment Name" required>
            </div>
            <div class="col-4 text-light mb-2">
              <input type="text" class="form-control" id="weight-${totalRows}" placeholder="0%" required>
            </div>
            <div class="col-4 text-light mb-2">
              <input type="text" class="form-control" id="grade-${totalRows}" placeholder="0%" required>
            </div>`
    aList.appendChild(newAssign);
    totalRows += 1;
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
	cName = document.getElementById("courseName").value;

	var newArr = []
	var numAssigns = document.getElementById("assignmentList").getElementsByTagName("input").length / 3;
	var curGrade = 0;
	var totalWeight = 0;
	var totalGrade = 0;

	for (var i = 0; i < numAssigns; i++){
		let aname = document.getElementById("aname-" + i).value;
		let weight = document.getElementById("weight-" + i).value;
		let grade = document.getElementById("grade-" + i).value;

		if (weight.endsWith("%")){
			weight = parseFloat(weight.slice(0, -1)) / 100
		}
		else{
			weight = parseFloat(weight)
		}

		if (grade.endsWith("%")){
			grade = parseFloat(grade.slice(0, -1))
		}
		else{
			grade = parseFloat(grade) * 100
		}

		if (isNaN(weight) || isNaN(grade)){
			alert(`The weight or grade for assignment ${i+1} is incorrectly formatted, please check it again.`);
			return;
		}

		curGrade += weight * grade
		totalWeight += weight
		totalGrade += weight * 100

		newArr.push([aname, weight, grade]);
	}

	let actualGrade = (curGrade / totalGrade * 100).toFixed(2);

	gradeData[cName] = newArr;
	alert("Your current grade in the course is " + actualGrade + "%")
	// Need to add a new element that shows the grade and assignments for each course saved
}