/*
  Requirement: Make the "Manage Assignments" page interactive.

  Instructions:
  1. This file is already linked to `admin.html` via:
         <script src="admin.js" defer></script>

  2. In `admin.html`:
     - The form has id="assignment-form".
     - The submit button has id="add-assignment".
     - The <tbody> has id="assignments-tbody".
     - Columns rendered per row:
       Title | Due Date | Description | Actions.

  3. Implement the TODOs below.

  API base URL: ./api/index.php
  All requests and responses use JSON.
  Successful list response shape: { success: true, data: [ ...assignment objects ] }
  Each assignment object shape:
    {
      id:          number,   // integer primary key from the assignments table
      title:       string,
      due_date:    string,   // "YYYY-MM-DD" — matches the SQL column name
      description: string,
      files:       string[]  // decoded array of URL strings
    }
*/

// --- Global Data Store ---
// Holds the assignments currently displayed in the table.
let assignments = [];

// --- Element Selections ---
// TODO: Select the assignment form by id 'assignment-form'.
let assignmentForm= document.getElementById("assignment-form");
// TODO: Select the assignments table body by id 'assignments-tbody'.
let assignmentsTbody= document.getElementById("assignments-tbody");
let addAssignmentButton= document.getElementById("add-assignment");

// --- Functions ---

/**
 * TODO: Implement createAssignmentRow.
 *
 * Parameters:
 *   assignment — one assignment object with shape:
 *     { id, title, due_date, description, files }
 *
 * Returns a <tr> element with four <td>s:
 *   1. title
 *   2. due_date   (the "YYYY-MM-DD" string — use due_date, not dueDate)
 *   3. description
 *   4. Actions — two buttons:
 *        <button class="edit-btn"   data-id="{id}">Edit</button>
 *        <button class="delete-btn" data-id="{id}">Delete</button>
 *      The data-id holds the integer primary key from the assignments table.
 */
function createAssignmentRow(assignment) {
  // ... your implementation here ...
  let row= document.createElement("tr");
  
  let title= document.createElement("td");
  title.textContent= assignment.title;
  let due_date= document.createElement("td");
  due_date.textContent= assignment.due_date; 
  let description= document.createElement("td");
  description.textContent= assignment.description; 

  let action_1= document.createElement("td");
  let editBtn=document.createElement("button");
  editBtn.textContent= "Edit"; 
  editBtn.className= "edit-btn";
  editBtn.dataset.id= assignment.id;
  let delBtn=document.createElement("button");
  delBtn.textContent= "Delete"; 
  delBtn.className= "delete-btn";
  delBtn.dataset.id= assignment.id;

  action_1.appendChild(editBtn);
  action_1.appendChild(delBtn);
  
  row.appendChild(title);
  row.appendChild(due_date);
  row.appendChild(description);
  row.appendChild(action_1);

  return row;
}

/**
 * TODO: Implement renderTable.
 *
 * It should:
 * 1. Clear the assignments table body (set innerHTML to "").
 * 2. Loop through the global `assignments` array.
 * 3. For each assignment, call createAssignmentRow(assignment) and
 *    append the <tr> to the table body.
 */
function renderTable() {
  // ... your implementation here ...
  assignmentsTbody.innerHTML= "";
  assignments.forEach(function(assignment){
    let row = createAssignmentRow(assignment);
    assignmentsTbody.appendChild(row);
  });
}

/**
 * TODO: Implement handleAddAssignment (async).
 *
 * This is the event handler for the form's 'submit' event.
 * It should:
 * 1. Call event.preventDefault().
 * 2. Read values from:
 *      - #assignment-title       → title (string)
 *      - #assignment-due-date    → due_date (string, "YYYY-MM-DD")
 *      - #assignment-description → description (string)
 *      - #assignment-files       → split by newlines (\n) and filter
 *                                  empty strings to produce a files array.
 * 3. Check if the submit button (#add-assignment) has a data-edit-id
 *    attribute.
 *    - If it does, call handleUpdateAssignment() with that id and the
 *      field values.
 *    - If it does not, send a POST to './api/index.php' with the body:
 *        { title, due_date, description, files }
 *      On success (result.success === true):
 *        - Add the new assignment (with the id from result.id) to the
 *          global `assignments` array.
 *        - Call renderTable().
 *        - Reset the form.
 */
async function handleAddAssignment(event) {
  // ... your implementation here ...
  event.preventDefault();
  let title= document.getElementById("assignment-title").value;
  let due_date= document.getElementById("assignment-due-date").value;
  let description= document.getElementById("assignment-description").value;
  let filesT= document.getElementById("assignment-files").value;
  let files= filesT.split("\n").map(function (file){return file.trim();}).filter(function(file){return file !=="";});

  let data_edit_id= addAssignmentButton.dataset.editId;
  if (data_edit_id){
    await handleUpdateAssignment(data_edit_id,{
      title: title, due_date: due_date, description: description, files: files
    });
    return;
  }
  let send_1 =await fetch("./api/index.php",{
    method: "POST", headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      title: title, due_date: due_date, description: description, files: files
    })
  });
  let result= await send_1.json();
  if (result.success===true){
    assignments.push({
      id: result.id, title: title, due_date: due_date, description: description, files: files
    });
    renderTable();
    assignmentForm.reset();
  }
}

/**
 * TODO: Implement handleUpdateAssignment (async).
 *
 * Parameters:
 *   id     — the integer primary key of the assignment being edited.
 *   fields — object with { title, due_date, description, files }.
 *
 * It should:
 * 1. Send a PUT to './api/index.php' with the body:
 *      { id, title, due_date, description, files }
 * 2. On success:
 *    - Update the matching entry in the global `assignments` array.
 *    - Call renderTable().
 *    - Reset the form.
 *    - Restore the submit button text to "Add Assignment" and remove
 *      its data-edit-id attribute.
 */
async function handleUpdateAssignment(id, fields) {
  // ... your implementation here ...
  let send_1 =await fetch("./api/index.php",{
    method: "PUT", headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      id: Number(id), title: fields.title, due_date: fields.due_date, description: fields.description, files: fields.files
    })
  });
  let result= await send_1.json();
  if (result.success===true){
    assignments.forEach(function(assignment){
      if(assignment.id === Number(id)){
        assignment.title= fields.title;
        assignment.due_date= fields.due_date;
        assignment.description= fields.description;
        assignment.files= fields.files;}
    });
  renderTable();
    assignmentForm.reset();

    addAssignmentButton.textContent= "Add Assignment";
    delete addAssignmentButton.dataset.editId;
  }
}
    


/**
 * TODO: Implement handleTableClick (async).
 *
 * This is a delegated click listener on the assignments table body.
 * It should:
 * 1. If event.target has class "delete-btn":
 *    a. Read the integer id from event.target.dataset.id.
 *    b. Send a DELETE to './api/index.php?id=<id>'.
 *    c. On success, remove the assignment from the global `assignments`
 *       array and call renderTable().
 *
 * 2. If event.target has class "edit-btn":
 *    a. Read the integer id from event.target.dataset.id.
 *    b. Find the matching assignment in the global `assignments` array.
 *    c. Populate the form fields:
 *         #assignment-title       ← assignment.title
 *         #assignment-due-date    ← assignment.due_date
 *         #assignment-description ← assignment.description
 *         #assignment-files       ← assignment.files joined with newlines (\n)
 *    d. Change the submit button (#add-assignment) text to
 *       "Update Assignment" and set its data-edit-id attribute to the
 *       assignment's id.
 */
async function handleTableClick(event) {
  // ... your implementation here ...
  if (event.target.classList.contains("delete-btn")){
    let id= Number(event.target.dataset.id);
    let send_1= await fetch("./api/index.php?id=" + id, {method: "DELETE"});
    let result= await send_1.json();
    if (result.success === true){
      assignments = assignments.filter(function(assignment){
        return assignment.id !== id;
      });
      renderTable();
    }
  }
  if (event.target.classList.contains("edit-btn")){
    let id= Number(event.target.dataset.id);
    let assignment= assignments.find(function(assignment){
     return assignment.id === id; 
    });
    if (!assignment){
      return;
    }
    document.getElementById("assignment-title").value = assignment.title;
    document.getElementById("assignment-due-date").value = assignment.due_date;
    document.getElementById("assignment-description").value = assignment.description;
    document.getElementById("assignment-files").value = assignment.files.join("\n");

    addAssignmentButton.textContent= "Update Assignment";
    addAssignmentButton.dataset.editId= assignment.id;
}
}

/**
 * TODO: Implement loadAndInitialize (async).
 *
 * It should:
 * 1. Send a GET to './api/index.php'.
 *    Response shape: { success: true, data: [ ...assignment objects ] }
 * 2. Store the data array in the global `assignments` variable.
 * 3. Call renderTable() to populate the table.
 * 4. Attach the 'submit' event listener to the assignment form
 *    (calls handleAddAssignment).
 * 5. Attach a 'click' event listener to the assignments table body
 *    (calls handleTableClick — event delegation for edit and delete).
 */
async function loadAndInitialize() {
  // ... your implementation here ...
  let send_1 = await fetch ("./api/index.php");
  let result = await send_1.json();
  if(result.success === true){
    assignments= result.data;
    renderTable();
  }
  assignmentForm.addEventListener("submit", handleAddAssignment);
  assignmentsTbody.addEventListener("click", handleTableClick);
}

// --- Initial Page Load ---
loadAndInitialize();
