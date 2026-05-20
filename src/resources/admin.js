/**
 * Requirement: Task 2 — Resources JavaScript (Admin)
 * Instructor Note: CRUD operations for course resources.
 */

// We use window.resources to ensure the autograder can inject test data
window.resources = window.resources || [];
var editId = null;

/**
 * [JS-19, JS-20, JS-21] Create a table row for a resource
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
 * [JS-22, JS-23] Render the table
 * FIX: Dynamically selects tbody inside the function so it is never null in tests.
 */
function renderTable() {
    const tbody = document.getElementById('resources-tbody');
    if (!tbody) return; // Safety check

    // Clear existing content [JS-22]
    tbody.innerHTML = '';

    // Loop through global array [JS-23]
    const dataToRender = window.resources || [];
    
    dataToRender.forEach(resource => {
        tbody.appendChild(createResourceRow(resource));
    });
}

/**
 * [JS-24, JS-25] Handle adding/updating a resource
 */
async function handleAddResource(event) {
    if (event && event.preventDefault) event.preventDefault();

    const title = document.getElementById('resource-title').value.trim();
    const description = document.getElementById('resource-description').value.trim();
    const link = document.getElementById('resource-link').value.trim();

    if (!title || !link) return;

    const payload = { title, description, link };

    if (editId) {
        const response = await fetch('./api/index.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, id: editId })
        });
        const result = await response.json();
        if (result.success) {
            const idx = window.resources.findIndex(r => r.id == editId);
            if (idx !== -1) window.resources[idx] = { ...payload, id: editId };
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
            window.resources.push({ ...payload, id: result.id });
        }
    }

    document.getElementById('resource-form').reset();
    renderTable();
}

/**
 * [JS-26, JS-27] Table Actions (Edit/Delete)
 */
async function handleTableClick(event) {
    const target = event.target;
    // Delegation: Find the closest button to handle clicks on icons/text inside buttons
    const btn = target.closest('button');
    if (!btn) return;
    
    const id = btn.getAttribute('data-id') || btn.dataset.id;
    if (!id) return;

    if (btn.classList.contains('delete-btn')) {
        // [JS-26] DELETE logic
        const response = await fetch(`./api/index.php?id=${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
            window.resources = window.resources.filter(r => r.id != id);
            renderTable();
        }
    } else if (btn.classList.contains('edit-btn')) {
        // [JS-27] EDIT logic: Populate fields
        const r = window.resources.find(res => res.id == id);
        if (r) {
            document.getElementById('resource-title').value = r.title;
            document.getElementById('resource-description').value = r.description || '';
            document.getElementById('resource-link').value = r.link;
            editId = id;
            document.getElementById('add-resource').textContent = "Update Resource";
        }
    }
}

/**
 * [JS-28, JS-29, JS-30] Initialization
 */
async function loadAndInitialize() {
    try {
        const response = await fetch('./api/index.php');
        const result = await response.json();
        
        if (result.success && result.data) {
            window.resources = result.data;
            renderTable(); // [JS-29]
        }

        // Attach listeners [JS-30]
        const form = document.getElementById('resource-form');
        if (form) form.addEventListener('submit', handleAddResource);
        
        const tbody = document.getElementById('resources-tbody');
        if (tbody) tbody.addEventListener('click', handleTableClick);

    } catch (err) {
        console.error("Initialization failed:", err);
    }
}

// Make functions globally available for the autograder tests
window.renderTable = renderTable;
window.handleTableClick = handleTableClick;
window.handleAddResource = handleAddResource;

// Start the app
loadAndInitialize();