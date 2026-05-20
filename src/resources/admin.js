let resources = [];
let editId = null;

// Select elements
const resourceForm = document.getElementById('resource-form');
const titleInput = document.getElementById('resource-title');
const descInput = document.getElementById('resource-description');
const linkInput = document.getElementById('resource-link');
const submitBtn = document.getElementById('add-resource');

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
  // Re-select inside function to avoid stale references in tests
  const tbody = document.getElementById('resources-tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  resources.forEach(res => {
    tbody.appendChild(createResourceRow(res));
  });
}

async function handleAddResource(event) {
  event.preventDefault();
  const title = titleInput.value;
  const description = descInput.value;
  const link = linkInput.value;

  if (editId) {
    const response = await fetch('./api/index.php', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editId, title, description, link })
    });
    const result = await response.json();
    if (result.success) {
      const idx = resources.findIndex(r => r.id == editId);
      resources[idx] = { id: editId, title, description, link };
      editId = null;
      submitBtn.textContent = "Add Resource";
    }
  } else {
    const response = await fetch('./api/index.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, link })
    });
    const result = await response.json();
    if (result.success) {
      resources.push({ id: result.id, title, description, link });
    }
  }
  resourceForm.reset();
  renderTable();
}

async function handleTableClick(event) {
  const target = event.target;
  const id = target.dataset.id;
  if (!id) return;

  if (target.classList.contains('delete-btn')) {
    const response = await fetch(`./api/index.php?id=${id}`, { method: 'DELETE' });
    const result = await response.json();
    if (result.success) {
      resources = resources.filter(r => r.id != id);
      renderTable();
    }
  } else if (target.classList.contains('edit-btn')) {
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
  } catch (err) {
    console.error(err);
  }
}

loadAndInitialize();