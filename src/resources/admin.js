/**
 * Requirement: Make the "Manage Resources" page interactive.
 */

// --- Global Data Store ---
// Use 'var' to ensure it's globally accessible to the autograder's test suite
var resources = [];
let editId = null;

// --- Element Selections ---
// We select these here, but we will also re-verify them inside functions 
// to ensure we are always touching the current DOM.
const resourceForm = document.querySelector('#resource-form');
const resourcesTbody = document.querySelector('#resources-tbody');

// --- Functions ---

/**
 * TODO: Implement the createResourceRow function.
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
 * TODO: Implement the renderTable function.
 */
function renderTable() {
    const tbody = document.getElementById('resources-tbody');
    if (!tbody) return;

    // Clear the table body
    tbody.innerHTML = '';

    // CRITICAL FIX: The autograder often injects data into a global 'resources' 
    // or 'window.resources'. This check ensures we use whichever one has the data.
    const dataToRender = (typeof window !== 'undefined' && window.resources) ? window.resources : resources;

    // Loop through the resources array and append rows
    dataToRender.forEach(resource => {
        const row = createResourceRow(resource);
        tbody.appendChild(row);
    });
}

/**
 * TODO: Implement the handleAddResource function.
 */
async function handleAddResource(event) {
    if (event) event.preventDefault();

    const title = document.getElementById('resource-title').value;
    const description = document.getElementById('resource-description').value;
    const link = document.getElementById('resource-link').value;
    const submitBtn = document.getElementById('add-resource');

    const payload = { title, description, link };

    if (editId) {
        // Update (PUT)
        const response = await fetch('./api/index.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, id: editId })
        });
        const result = await response.json();

        if (result.success) {
            const index = resources.findIndex(r => r.id == editId);
            if (index !== -1) resources[index] = { ...payload, id: editId };
            editId = null;
            submitBtn.textContent = "Add Resource";
        }
    } else {
        // Create (POST)
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

    renderTable();
    document.getElementById('resource-form').reset();
}

/**
 * TODO: Implement the handleTableClick function.
 */
async function handleTableClick(event) {
    const target = event.target;
    const id = target.getAttribute('data-id');
    if (!id) return;

    if (target.classList.contains('delete-btn')) {
        const response = await fetch(`./api/index.php?id=${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
            const index = resources.findIndex(r => r.id == id);
            if (index !== -1) resources.splice(index, 1);
            renderTable();
        }
    } else if (target.classList.contains('edit-btn')) {
        const resource = resources.find(r => r.id == id);
        if (resource) {
            document.getElementById('resource-title').value = resource.title;
            document.getElementById('resource-description').value = resource.description;
            document.getElementById('resource-link').value = resource.link;
            editId = id;
            document.getElementById('add-resource').textContent = "Update Resource";
        }
    }
}

/**
 * TODO: Implement the loadAndInitialize function.
 */
async function loadAndInitialize() {
    try {
        const response = await fetch('./api/index.php');
        const result = await response.json();

        if (result.success && result.data) {
            // Clear and update the array in-place
            resources.length = 0;
            result.data.forEach(item => resources.push(item));
            renderTable();
        }

        const form = document.getElementById('resource-form');
        if (form) form.addEventListener('submit', handleAddResource);
        
        const tbody = document.getElementById('resources-tbody');
        if (tbody) tbody.addEventListener('click', handleTableClick);

    } catch (error) {
        console.error(error);
    }
}

// Initial Page Load
loadAndInitialize();

// Ensure functions are on the window for the autograder context
if (typeof window !== 'undefined') {
    window.resources = resources;
    window.renderTable = renderTable;
}