let resources = [];
let editId = null;

const form = document.getElementById('resource-form');
const tbody = document.getElementById('resources-tbody');
const titleIn = document.getElementById('resource-title');
const descIn = document.getElementById('resource-description');
const linkIn = document.getElementById('resource-link');
const submitBtn = document.getElementById('add-resource');

function createResourceRow(res) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${res.title}</td>
    <td>${res.description || ''}</td>
    <td>${res.link}</td>
    <td>
      <button class="edit-btn" data-id="${res.id}">Edit</button>
      <button class="delete-btn" data-id="${res.id}">Delete</button>
    </td>
  `;
  return tr;
}

function renderTable() {
  tbody.innerHTML = '';
  resources.forEach(r => tbody.appendChild(createResourceRow(r)));
}

async function handleAddResource(event) {
  event.preventDefault();
  const payload = { title: titleIn.value, description: descIn.value, link: linkIn.value };
  
  if (editId) {
    payload.id = editId;
    const res = await fetch('./api/index.php', { method: 'PUT', body: JSON.stringify(payload) });
    if ((await res.json()).success) {
      const idx = resources.findIndex(r => r.id == editId);
      resources[idx] = payload;
      editId = null;
      submitBtn.textContent = "Add Resource";
    }
  } else {
    const res = await fetch('./api/index.php', { method: 'POST', body: JSON.stringify(payload) });
    const result = await res.json();
    if (result.success) resources.push({ id: result.id, ...payload });
  }
  form.reset();
  renderTable();
}

async function handleTableClick(event) {
  const id = event.target.dataset.id;
  if (event.target.classList.contains('delete-btn')) {
    const res = await fetch(`./api/index.php?id=${id}`, { method: 'DELETE' });
    if ((await res.json()).success) {
      resources = resources.filter(r => r.id != id);
      renderTable();
    }
  } else if (event.target.classList.contains('edit-btn')) {
    const r = resources.find(res => res.id == id);
    titleIn.value = r.title;
    descIn.value = r.description;
    linkIn.value = r.link;
    editId = id;
    submitBtn.textContent = "Update Resource";
  }
}

async function loadAndInitialize() {
  const res = await fetch('./api/index.php');
  const result = await res.json();
  if (result.success) {
    resources = result.data;
    renderTable();
  }
  form.addEventListener('submit', handleAddResource);
  tbody.addEventListener('click', handleTableClick);
}

loadAndInitialize();