let resources = [];
let editId = null;

function createResourceRow(res) {
  const tr = document.createElement('tr');
  tr.innerHTML = `<td>${res.title}</td><td>${res.description || ''}</td><td>${res.link}</td>
    <td><button class="edit-btn" data-id="${res.id}">Edit</button>
    <button class="delete-btn" data-id="${res.id}">Delete</button></td>`;
  return tr;
}

function renderTable() {
  const tbody = document.getElementById('resources-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  resources.forEach(r => tbody.appendChild(createResourceRow(r)));
}

async function handleAddResource(event) {
  event.preventDefault();
  const title = document.getElementById('resource-title').value;
  const description = document.getElementById('resource-description').value;
  const link = document.getElementById('resource-link').value;
  const payload = { title, description, link };

  if (editId) {
    payload.id = editId;
    await fetch('./api/index.php', { method: 'PUT', body: JSON.stringify(payload) });
    const idx = resources.findIndex(r => r.id == editId);
    resources[idx] = payload;
    editId = null;
    document.getElementById('add-resource').textContent = "Add Resource";
  } else {
    const res = await fetch('./api/index.php', { method: 'POST', body: JSON.stringify(payload) });
    const result = await res.json();
    if (result.success) resources.push({ id: result.id, ...payload });
  }
  document.getElementById('resource-form').reset();
  renderTable();
}

async function handleTableClick(event) {
  const id = event.target.dataset.id;
  if (event.target.classList.contains('delete-btn')) {
    const res = await fetch(`./api/index.php?id=${id}`, { method: 'DELETE' });
    if ((await res.json()).success) { resources = resources.filter(r => r.id != id); renderTable(); }
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
  const res = await fetch('./api/index.php').then(r => r.json());
  if (res.success) { resources = res.data; renderTable(); }
  const form = document.getElementById('resource-form');
  if (form) form.addEventListener('submit', handleAddResource);
  const tbody = document.getElementById('resources-tbody');
  if (tbody) tbody.addEventListener('click', handleTableClick);
}

if (document.getElementById('resources-tbody')) { loadAndInitialize(); }