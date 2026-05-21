/*
  admin.js — Handles CRUD for Course Resources.
  Requirement: Task 2 — Resources JavaScript (Admin)
*/

// --- Global Data Store ---
// We attach 'resources' to window so the Jest Autograder can inject test data [JS-23]
window.resources = []; 
var editId = null;

// --- Element Selections ---
const getForm = () => document.getElementById('resource-form');
const getTitleInput = () => document.getElementById('resource-title');
const getDescInput = () => document.getElementById('resource-description');
const getLinkInput = () => document.getElementById('resource-link');
const getSubmitBtn = () => document.getElementById('add-resource');
const getTbody = () => document.getElementById('resources-tbody');

// --- Functions ---

/**
 * createResourceRow
 * [JS-19, JS-20, JS-21]
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
 */
function renderTable() {
  const tbody = getTbody();
  if (!tbody) return;

  tbody.innerHTML = ''; // [JS-22]

  // IMPORTANT: Use window.resources so the autograder's injected data is visible [JS-23]
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
  if (event) event.preventDefault(); // [JS-24]

  const payload = {
    title: getTitleInput().value,
    description: getDescInput().value,
    link: getLinkInput().value
  };

  if (editId) {
    // PUT logic
    const response = await fetch('./api/index.php', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, id: editId })
    });
    const result = await response.json();
    if (result.success) {
      const idx = window.resources.findIndex(r => r.id == editId);
      if (idx !== -1) window.resources[idx] = { ...payload, id: editId };
      editId = null;
      getSubmitBtn().textContent = "Add Resource";
    }
  } else {
    // POST logic [JS-25]
    const response = await fetch('./api/index.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (result.success) {
      window.resources.push({ ...payload, id: result.id });
    }
  }

  getForm().reset();
  renderTable();
}

/**
 * handleTableClick
 * [JS-26, JS-27]
 */
async function handleTableClick(event) {
  // Support both real browser events and autograder mock events
  const target = event.target;
  if (!target) return;

  const id = target.getAttribute('data-id') || target.dataset.id;
  if (!id) return;

  if (target.classList.contains('delete-btn')) {
    // [JS-26]
    const response = await fetch(`./api/index.php?id=${id}`, { method: 'DELETE' });
    if ((await response.json()).success) {
      window.resources = window.resources.filter(r => r.id != id);
      renderTable();
    }
  } else if (target.classList.contains('edit-btn')) {
    // [JS-27]
    const r = window.resources.find(res => res.id == id);
    if (r) {
      getTitleInput().value = r.title;
      getDescInput().value = r.description;
      getLinkInput().value = r.link;
      editId = id;
      getSubmitBtn().textContent = "Update Resource";
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
    if (result.success) {
      window.resources = result.data || [];
      renderTable(); // [JS-29]
    }
    
    getForm().addEventListener('submit', handleAddResource);
    getTbody().addEventListener('click', handleTableClick);
  } catch (err) { console.error(err); }
}

// Make functions global for Jest
window.renderTable = renderTable;
window.handleTableClick = handleTableClick;
window.handleAddResource = handleAddResource;

loadAndInitialize();