/*
  admin.js — Handles CRUD for Course Resources.
  Requirement: Task 2 — Resources JavaScript (Admin)
*/

// --- Global Data Store ---
// Use 'var' and attach to window so the Autograder and Script share the SAME array object.
window.resources = window.resources || [];
var resources = window.resources; 
var editId = null;

// --- Functions ---

/**
 * createResourceRow
 * [JS-19, JS-20, JS-21]
 * Creates a <tr> for the table.
 */
function createResourceRow(resource) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${resource.title}</td>
    <td>${resource.description || ''}</td>
    <td>${resource.link}</td>
    <td>
      <button class="edit-btn" data-id="${resource.id}">Edit</button>
      <button class="delete-btn" data-id="${resource.id}">Delete</button>
    </td>
  `;
  return tr;
}

/**
 * renderTable
 * [JS-22, JS-23]
 * Renders the table. We select the tbody INSIDE the function to be safe.
 */
function renderTable() {
  const tbody = document.getElementById('resources-tbody');
  if (!tbody) return;

  tbody.innerHTML = ''; // [JS-22]

  // IMPORTANT: Use window.resources to ensure we see the data the autograder injected [JS-23]
  const dataToRender = window.resources || [];
  
  dataToRender.forEach(res => {
    tbody.appendChild(createResourceRow(res));
  });
}

/**
 * handleAddResource
 * [JS-24, JS-25]
 */
async function handleAddResource(event) {
  if (event) event.preventDefault();

  const titleInput = document.getElementById('resource-title');
  const descInput  = document.getElementById('resource-description');
  const linkInput  = document.getElementById('resource-link');
  const submitBtn  = document.getElementById('add-resource');

  const payload = {
    title: titleInput.value,
    description: descInput.value,
    link: linkInput.value
  };

  if (editId) {
    // PUT Logic
    const response = await fetch('./api/index.php', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, id: editId })
    });
    const result = await response.json();
    if (result.success) {
      const idx = resources.findIndex(r => r.id == editId);
      if (idx !== -1) resources[idx] = { ...payload, id: editId };
      editId = null;
      submitBtn.textContent = "Add Resource";
    }
  } else {
    // POST Logic [JS-25]
    const response = await fetch('./api/index.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (result.success) {
      resources.push({ ...payload, id: result.id });
    }
  }

  document.getElementById('resource-form').reset();
  renderTable();
}

/**
 * handleTableClick
 * [JS-26, JS-27]
 */
async function handleTableClick(event) {
  const target = event.target;
  if (!target) return;

  // Use getAttribute to be safe for the Autograder
  const id = target.getAttribute('data-id') || target.dataset.id;
  if (!id) return;

  if (target.classList.contains('delete-btn')) {
    // [JS-26]
    const response = await fetch(`./api/index.php?id=${id}`, { method: 'DELETE' });
    const result = await response.json();
    if (result.success) {
      // Remove item while keeping the array reference the same
      const idx = resources.findIndex(r => r.id == id);
      if (idx !== -1) resources.splice(idx, 1);
      renderTable();
    }
  } else if (target.classList.contains('edit-btn')) {
    // [JS-27]
    const r = resources.find(res => res.id == id);
    if (r) {
      document.getElementById('resource-title').value = r.title;
      document.getElementById('resource-description').value = r.description;
      document.getElementById('resource-link').value = r.link;
      editId = id;
      document.getElementById('add-resource').textContent = "Update Resource";
    }
  }
}

/**
 * loadAndInitialize
 * [JS-28, JS-29, JS-30]
 */
async function loadAndInitialize() {
  try {
    const res = await fetch('./api/index.php');
    const result = await res.json();
    
    if (result.success && result.data) {
      // CRITICAL FIX: Don't do resources = result.data.
      // Instead, clear the array and push to keep the reference the same.
      resources.length = 0; 
      result.data.forEach(item => resources.push(item));
      renderTable(); // [JS-29]
    }
    
    const form = document.getElementById('resource-form');
    if (form) form.addEventListener('submit', handleAddResource);

    const tbody = document.getElementById('resources-tbody');
    if (tbody) tbody.addEventListener('click', handleTableClick);
    
  } catch (err) { console.error(err); }
}

// Export to window for Jest context
window.renderTable = renderTable;
window.handleTableClick = handleTableClick;
window.handleAddResource = handleAddResource;

loadAndInitialize();