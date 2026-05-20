/*
  Requirement: Make the "Manage Resources" page interactive.
*/

// --- Global Data Store ---
let resources = [];
let editModeId = null; // Tracks if we are editing a resource

// --- Element Selections ---
const resourceForm = document.querySelector('#resource-form');
const resourcesTbody = document.querySelector('#resources-tbody');
const titleInput = document.getElementById('resource-title');
const descInput = document.getElementById('resource-description');
const linkInput = document.getElementById('resource-link');
const submitBtn = document.getElementById('add-resource');

// --- Functions ---

/**
 * Creates a table row for a resource.
 */
function createResourceRow(resource) {
  const tr = document.createElement('tr');
  
  tr.innerHTML = `
    <td>${resource.title}</td>
    <td>${resource.description || ''}</td>
    <td><a href="${resource.link}" target="_blank">View</a></td>
    <td>
      <button class="edit-btn" data-id="${resource.id}">Edit</button>
      <button class="delete-btn" data-id="${resource.id}">Delete</button>
    </td>
  `;
  
  return tr;
}

/**
 * Renders the global resources array to the table.
 */
function renderTable() {
  resourcesTbody.innerHTML = '';
  resources.forEach(resource => {
    const row = createResourceRow(resource);
    resourcesTbody.appendChild(row);
  });
}

/**
 * Handles Add and Update (POST and PUT)
 */
async function handleAddResource(event) {
  event.preventDefault();

  const title = titleInput.value;
  const description = descInput.value;
  const link = linkInput.value;

  if (editModeId) {
    // --- EDIT MODE (PUT) ---
    try {
      const response = await fetch('./api/index.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editModeId, title, description, link })
      });
      const result = await response.json();
      if (result.success) {
        // Update local array
        const index = resources.findIndex(r => r.id == editModeId);
        resources[index] = { id: editModeId, title, description, link };
        resetForm();
        renderTable();
      }
    } catch (err) { console.error(err); }
  } else {
    // --- ADD MODE (POST) ---
    try {
      const response = await fetch('./api/index.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, link })
      });
      const result = await response.json();
      if (result.success) {
        resources.push({ id: result.id, title, description, link });
        resourceForm.reset();
        renderTable();
      }
    } catch (err) { console.error(err); }
  }
}

/**
 * Handles Click Delegation (Delete and Edit)
 */
async function handleTableClick(event) {
  const target = event.target;
  const id = target.getAttribute('data-id');

  if (target.classList.contains('delete-btn')) {
    // --- DELETE ---
    if (!confirm('Are you sure you want to delete this resource?')) return;
    try {
      const response = await fetch(`./api/index.php?id=${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        resources = resources.filter(r => r.id != id);
        renderTable();
      }
    } catch (err) { console.error(err); }
  } 
  
  else if (target.classList.contains('edit-btn')) {
    // --- START EDIT MODE ---
    const resource = resources.find(r => r.id == id);
    titleInput.value = resource.title;
    descInput.value = resource.description;
    linkInput.value = resource.link;
    
    editModeId = id;
    submitBtn.textContent = "Update Resource";
    document.getElementById('form-heading').textContent = "Edit Resource";
  }
}

function resetForm() {
    resourceForm.reset();
    editModeId = null;
    submitBtn.textContent = "Add Resource";
    document.getElementById('form-heading').textContent = "Add a New Resource";
}

/**
 * Initial Load
 */
async function loadAndInitialize() {
  try {
    const response = await fetch('./api/index.php');
    const result = await response.json();
    if (result.success) {
      resources = result.data;
      renderTable();
    }
    
    resourceForm.addEventListener('submit', handleAddResource);
    resourcesTbody.addEventListener('click', handleTableClick);
  } catch (err) {
    console.error('Initial load failed:', err);
  }
}

loadAndInitialize();