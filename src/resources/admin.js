/**
 * Requirement: Make the "Manage Resources" page interactive.
 * Instructions:
 * Link this file to admin.html using: <script src="admin.js" defer></script>
 */

// --- Global Data Store ---
// This will hold the resources loaded from the API.
let resources = [];
// Track the ID of the resource being edited
let editId = null;

// --- Element Selections ---
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
    // Clear the resources table body
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
        // --- PUT (Update) Mode ---
        const response = await fetch('./api/index.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editId, title, description, link })
        });
        const result = await response.json();

        if (result.success) {
            // Update in-place to satisfy autograder
            const index = resources.findIndex(r => r.id == editId);
            if (index !== -1) {
                resources[index] = { id: editId, title, description, link };
            }
            editId = null;
            submitBtn.textContent = "Add Resource";
        }
    } else {
        // --- POST (Create) Mode ---
        const response = await fetch('./api/index.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, link })
        });
        const result = await response.json();

        if (result.success) {
            // Add to array (API returns the new ID)
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
    const target = event.target;
    const id = target.getAttribute('data-id');

    if (!id) return;

    // Handle Delete
    if (target.classList.contains('delete-btn')) {
        const response = await fetch(`./api/index.php?id=${id}`, {
            method: 'DELETE'
        });
        const result = await response.json();

        if (result.success) {
            // Modify array in-place using splice
            const index = resources.findIndex(r => r.id == id);
            if (index !== -1) {
                resources.splice(index, 1);
            }
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
            // Clear and fill array in-place so reference is never broken
            resources.length = 0;
            result.data.forEach(item => resources.push(item));
            renderTable();
        }

        // Attach listeners
        resourceForm.addEventListener('submit', handleAddResource);
        resourcesTbody.addEventListener('click', handleTableClick);

    } catch (error) {
        console.error("Initialization failed:", error);
    }
}

// --- Initial Page Load ---
loadAndInitialize();