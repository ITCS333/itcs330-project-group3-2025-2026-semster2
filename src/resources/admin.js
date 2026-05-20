let resources = [];
let editId = null;

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
  resources.forEach(res => tbody.appendChild(createResourceRow(res)));
}

async function handleAddResource(event) {
  event.preventDefault();
  const title = document.getElementById('resource-title').value;
  const description = document.getElementById('resource-description').value;
  const link = document.getElementById('resource-link').value;

  if (editId) {
    // PUT (Update)
    await fetch('./api/index.php', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editId, title, description, link })
    });
    const idx = resources.findIndex(r => r.id == editId);
    resources[idx] = { id: editId, title, description, link };
    editId = null;
    document.getElementById('add-resource').textContent = "Add Resource";
  } else {
    // POST (Add)
    const res = await fetch('./api/index.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, link })
    });
    const result = await res.json();
    if (result.success) resources.push({ id: result.id, title, description, link });
  }
  document.getElementById('resource-form').reset();
  renderTable();
}

async function handleTableClick(event) {
  const id = event.target.dataset.id;
  if (event.target.classList.contains('delete-btn')) {
    await fetch(`./api/index.php?id=${id}`, { method: 'DELETE' });
    resources = resources.filter(r => r.id != id);
    renderTable();
  } else if (event.target.classList.contains('edit-btn')) {
    const r = resources.find(res => res.id == id);
    document.getElementById('resource-title').value = r.title;
    document.getElementById('resource-description').value = r.description;
    document.getElementById('resource-link').value = r.link;
    editId = id;
    document.getElementById('add-resource').textContent = "Update Resource";
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
    document.getElementById('resource-form').addEventListener('submit', handleAddResource);
    document.getElementById('resources-tbody').addEventListener('click', handleTableClick);
  } catch (error) { console.error(error); }
}

if (document.getElementById('resources-tbody')) {
  loadAndInitialize();
}