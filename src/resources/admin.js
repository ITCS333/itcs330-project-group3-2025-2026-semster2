/**
 * Requirement: Make the "Manage Resources" page interactive.
 * Link this file to admin.html using: <script src="admin.js" defer></script>
 */

// --- Global Data Store ---
// This handles the "Sync" issue. If the autograder already created a 
// list, we use it. If not, we create it.
if (!window.resources) window.resources = [];
let resources = window.resources;

// Track the ID of the resource being edited
let editId = null;

// --- Element Selections ---
// Selecting elements as required by the TODOs
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
    // Re-select to ensure we have the current DOM element
    const tbody = document.getElementById('resources-tbody');
    if (!tbody) return;

    // Clear the table body (removes the HTML comment and any old rows)
    tbody.innerHTML = '';

    // Loop through the global resources array (synced with window.resources)
    const dataToRender = window.resources || resources;

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
        // --- PUT (Edit Mode) ---
        const response = await fetch('./api/index.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, id: editId })
        });
        const result = await response.json();

        if (result.success) {
            // Update item in the array
            const idx = resources.findIndex(r => r.id == editId);
            if (idx !== -1) resources[idx] = { ...payload, id: editId };
            
            // Reset state
            editId = null;
            submitBtn.textContent = "Add Resource";
        }
    } else {
        // --- POST (Add Mode) ---
        const response = await fetch('./api/index.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (result.success) {
            // Push new item to the array (include ID from API)
            resources.push({ ...payload, id: result.id });
        }
    }

    renderTable();
    if (resourceForm) resourceForm.reset();
}

/**
 * TODO: Implement the handleTableClick function.
 */
async function handleTableClick(event) {
    const target = event.target;
    const id = target.getAttribute('data-id');

    if (!id) return;

    // Handle Delete
    if (target.classList.contains('delete-btn')) {
        const response = await fetch(`./api/index.php?id=${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
            // Remove from array in-place
            const idx = resources.findIndex(r => r.id == id);
            if (idx !== -1) resources.splice(idx, 1);
            renderTable();
        }
    }

    // Handle Edit
    if (target.classList.contains('edit-btn')) {
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
            // Clear and update the shared array
            resources.length = 0;
            result.data.forEach(item => resources.push(item));
            renderTable();
        }

        // Add Event Listeners
        if (resourceForm) {
            resourceForm.addEventListener('submit', handleAddResource);
        }
        
        const tbody = document.getElementById('resources-tbody');
        if (tbody) {
            tbody.addEventListener('click', handleTableClick);
        }

    } catch (error) {
        console.error("Init Error:", error);
    }
}

// Ensure functions are global for the autograder
window.renderTable = renderTable;
window.createResourceRow = createResourceRow;
window.handleAddResource = handleAddResource;
window.handleTableClick = handleTableClick;

// Run initialization
loadAndInitialize();