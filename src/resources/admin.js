// Fix for [JS-23]: Use window scope so the autograder can inject test data
window.resources = [];
let editId = null;

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
  const tbody = document.getElementById('resources-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  // Use window.resources so tests can provide data
  const dataToRender = window.resources || [];
  dataToRender.forEach(res => {
    tbody.appendChild(createResourceRow(res));
  });
}

async function handleAddResource(event) {
  event.preventDefault();
  const payload = { title: titleInput.value, description: descInput.value, link: linkInput.value };

  if (editId) {
    const response = await fetch('./api/index.php', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, id: editId })
    });
    const result = await response.json();
    if (result.success) {
      const idx = window.resources.findIndex(r => r.id == editId);
      window.resources[idx] = { ...payload, id: editId };
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
      window.resources.push({ ...payload, id: result.id });
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
    if ((await response.json()).success) {
      window.resources = window.resources.filter(r => r.id != id);
      renderTable();
    }
  } else if (event.target.classList.contains('edit-btn')) {
    const r = window.resources.find(res => res.id == id);
    if (r) {
      titleInput.value = r.title; descInput.value = r.description; linkInput.value = r.link;
      editId = id; submitBtn.textContent = "Update Resource";
    }
  }
}

async function loadAndInitialize() {
  const res = await fetch('./api/index.php');
  const result = await res.json();
  if (result.success) {
    window.resources = result.data;
    renderTable();
  }
  if (resourceForm) resourceForm.addEventListener('submit', handleAddResource);
  const tbody = document.getElementById('resources-tbody');
  if (tbody) tbody.addEventListener('click', handleTableClick);
}

loadAndInitialize();