/**
 * Requirement: Task 2 — Resources JavaScript (Admin)
 */

// 1. Global Data Store
// We initialize window.resources immediately so Jest can see it and seed it.
window.resources = window.resources || [];
// Create a local reference that points to the SAME array object
var resources = window.resources; 
var editId = null;

/**
 * [JS-19, JS-20, JS-21] Create Resource Row
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
 * [JS-22, JS-23] Render Table
 * CRITICAL FIX: We select 'resources-tbody' INSIDE the function. 
 * This prevents the "Detached Element" bug in Jest tests.
 */
function renderTable() {
    const tbody = document.getElementById('resources-tbody');
    if (!tbody) return;

    // [JS-22] Clear existing content
    tbody.innerHTML = '';

    // [JS-23] Render one <tr> per resource
    // Use window.resources to ensure we see the data the test runner injected
    const data = window.resources || [];
    
    data.forEach(item => {
        tbody.appendChild(createResourceRow(item));
    });
}

/**
 * [JS-24, JS-25] Add/Update Resource
 */
async function handleAddResource(event) {
    if (event) event.preventDefault();

    const title = document.getElementById('resource-title').value;
    const description = document.getElementById('resource-description').value;
    const link = document.getElementById('resource-link').value;

    const payload = { title, description, link };

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
            document.getElementById('add-resource').textContent = "Add Resource";
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

    document.getElementById('resource-form').reset();
    renderTable();
}

/**
 * [JS-26, JS-27] handleTableClick
 */
async function handleTableClick(event) {
    const target = event.target;
    const id = target.dataset.id;
    if (!id) return;

    if (target.classList.contains('delete-btn')) {
        // [JS-26]
        const response = await fetch(`./api/index.php?id=${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
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
 * [JS-28, JS-29, JS-30] loadAndInitialize
 */
async function loadAndInitialize() {
    try {
        const res = await fetch('./api/index.php');
        const result = await res.json();
        
        if (result.success && result.data) {
            // We use push to keep the array object reference stable for Jest [JS-28]
            // Only add if not already present (to avoid double-loading in tests)
            result.data.forEach(item => {
                if (!resources.some(r => r.id == item.id)) {
                    resources.push(item);
                }
            });
            renderTable(); // [JS-29]
        }

        const form = document.getElementById('resource-form');
        if (form) form.addEventListener('submit', handleAddResource);
        
        const tbody = document.getElementById('resources-tbody');
        if (tbody) tbody.addEventListener('click', handleTableClick);

    } catch (err) {
        console.error(err);
    }
}

// 5. Explicitly export all functions to the window so Jest can call them via 'ctx'
window.renderTable = renderTable;
window.handleTableClick = handleTableClick;
window.handleAddResource = handleAddResource;
window.createResourceRow = createResourceRow;
window.loadAndInitialize = loadAndInitialize;

// 6. Start the app
loadAndInitialize();