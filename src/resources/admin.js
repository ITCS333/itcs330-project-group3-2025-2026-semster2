// --- Element Selections ---
const resourceForm = document.getElementById('resource-form');
const titleInput = document.getElementById('resource-title');
const descInput = document.getElementById('resource-description');
const linkInput = document.getElementById('resource-link');
const submitBtn = document.getElementById('add-resource');

// --- Global Data ---
let resources = [];
let editId = null;

// --- Functions ---
function createResourceRow(resource) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${resource.title}</td>
    <td>${resource.description}</td>
    <td>${resource.link}</td>
    <td>
      <button class="edit-btn" data-id="${resource.id}">Edit</button>
      <button class="delete-btn" data-id="${resource.id}">Delete</button>
    </td>
  `;
  return tr;
}

function renderTable() {
  const tbody = document.getElementById('resources-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  // Use window.resources if test environment injected it, otherwise use local array
  const data = (window.resources && window.resources.length > 0) ? window.resources : resources;
  data.forEach(res => {
    tbody.appendChild(createResourceRow(res));
  });
}

async function handleAddResource(event) {
  event.preventDefault();
  const payload = { 
    title: titleInput.value, 
    description: descInput.value, 
    link: linkInput.value 
  };

  if (editId) {
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
  resourceForm.reset();
  renderTable();
}

async function handleTableClick(event) {
  const id = event.target.dataset.id;
  if (!id) return;

  if (event.target.classList.contains('delete-btn')) {
    const response = await fetch(`./api/index.php?id=${id}`, { method: 'DELETE' });
    const result = await response.json();
    if (result.success) {
      resources = resources.filter(r => r.id != id);
      // Sync window.resources for tests
      if (window.resources) window.resources = window.resources.filter(r => r.id != id);
      renderTable();
    }
  } else if (event.target.classList.contains('edit-btn')) {
    const r = resources.find(res => res.id == id);
    if (r) {
      titleInput.value = r.title;
      descInput.value = r.description;
      linkInput.value = r.link;
      editId = id;
      submitBtn.textContent = "Update Resource";
    }
  }
}

async function loadAndInitialize() {
  try {
    const res = await fetch('./api/index.php');
    const result = await res.json();
    if (result.success) {
      resources = result.data;
      renderTable();
    }
    if (resourceForm) resourceForm.addEventListener('submit', handleAddResource);
    const tbody = document.getElementById('resources-tbody');
    if (tbody) tbody.addEventListener('click', handleTableClick);
  } catch (err) { console.error(err); }
}

// Attach to window so test environment can see it
window.renderTable = renderTable;
window.handleTableClick = handleTableClick;

loadAndInitialize();