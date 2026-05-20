/**
 * Requirement: Make the "Manage Resources" page interactive.
 * Instructions: Implement the TODOs below.
 */

// --- Global Data Store ---
// This will hold the resources loaded from the API.
let resources = [];
// Variable to track editing state
let editId = null;

// --- Element Selections ---
// TODO: Select the resource form ('#resource-form').
const resourceForm = document.querySelector('#resource-form');
// TODO: Select the resources table body ('#resources-tbody').
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
 * This is the function tested in [JS-23].
 */
function renderTable() {
    // Clear the table body using the selection made above
    resourcesTbody.innerHTML = '';

    // Loop through the global resources array
    resources.forEach(resource => {
        const row = createResourceRow(resource);
        resourcesTbody.appendChild(row);
    });
}

/**
 * TODO: Implement the handleAddResource function.
 */
async function handleAddResource(event) {
    event.preventDefault();

    const title = document.getElementById('resource-title').value;
    const description = document.getElementById('resource-description').value;
    const link = document.getElementById('resource-link').value;
    const submitBtn = document.getElementById('add-resource');

    if (editId) {
        // PUT (Update)
        const response = await fetch('./api/index.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editId, title, description, link })
        });
        const result = await response.json();
        if (result.success) {
            const index = resources.findIndex(r => r.id == editId);
            if (index !== -1) {
                resources[index] = { id: editId, title, description, link };
            }
            editId = null;
            submitBtn.textContent = "Add Resource";
        }
    } else {
        // POST (Create)
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

    renderTable();
    resourceForm.reset();
}

/**
 * TODO: Implement the handleTableClick function.
 */
async function handleTableClick(event) {
    const id = event.target.dataset.id;
    if (!id) return;

    if (event.target.classList.contains('delete-btn')) {
        const response = await fetch(`./api/index.php?id=${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
            // Remove from array and refresh
            resources = resources.filter(r => r.id != id);
            renderTable();
        }
    } else if (event.target.classList.contains('edit-btn')) {
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
            resources = result.data;
            renderTable();
        }

        // Add event listeners exactly as instructed
        resourceForm.addEventListener('submit', handleAddResource);
        resourcesTbody.addEventListener('click', handleTableClick);

    } catch (error) {
        console.error(error);
    }
}

// Ensure global scope for autograder tests
window.resources = resources;
window.renderTable = renderTable;
window.handleAddResource = handleAddResource;
window.handleTableClick = handleTableClick;

// Start the application
loadAndInitialize();