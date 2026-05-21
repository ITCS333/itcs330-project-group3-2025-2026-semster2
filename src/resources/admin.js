/**
 * Requirement: Task 2 — Resources JavaScript (Admin)
 */

// Initialize the global store that the autograder/Jest uses
window.resources = window.resources || [];
var editId = null;

/**
 * [JS-19, JS-20, JS-21] Create a table row for a resource
 */
function createResourceRow(resource) {
    const tr = document.createElement('tr');
    // Ensure the structure matches: 4 <td> elements
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
 * FIX: Re-selects tbody inside the function to ensure compatibility with Jest DOM resets.
 */
function renderTable() {
    const tbody = document.getElementById('resources-tbody');
    if (!tbody) return;

    // Clear the tbody [JS-22]
    tbody.innerHTML = '';

    // Loop through the global window.resources array [JS-23]
    // We look at window.resources directly so we see data injected by the test runner
    const data = window.resources || [];
    
    data.forEach(resource => {
        tbody.appendChild(createResourceRow(resource));
    });
}

/**
 * [JS-24, JS-25] Handle adding/updating a resource
 */
async function handleAddResource(event) {
    if (event) event.preventDefault(); // [JS-24]

    const titleInput = document.getElementById('resource-title');
    const descInput = document.getElementById('resource-description');
    const linkInput = document.getElementById('resource-link');
    const submitBtn = document.getElementById('add-resource');

    const payload = {
        title: titleInput.value,
        description: descInput.value,
        link: linkInput.value
    };

    if (editId) {
        // PUT request for update
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
            if (submitBtn) submitBtn.textContent = "Add Resource";
        }
    } else {
        // POST request for new [JS-25]
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
 * [JS-26, JS-27] Table Click Delegation (Delete/Edit)
 */
async function handleTableClick(event) {
    const target = event.target;
    if (!target) return;

    // Safely get the ID from the button's data-id attribute [JS-21]
    const id = target.getAttribute('data-id');
    if (!id) return;

    if (target.classList.contains('delete-btn')) {
        // [JS-26] DELETE logic
        const response = await fetch(`./api/index.php?id=${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
            window.resources = window.resources.filter(r => r.id != id);
            renderTable();
        }
    } else if (target.classList.contains('edit-btn')) {
        // [JS-27] EDIT logic: Populate fields
        const r = window.resources.find(res => res.id == id);
        if (r) {
            document.getElementById('resource-title').value = r.title;
            document.getElementById('resource-description').value = r.description || '';
            document.getElementById('resource-link').value = r.link;
            editId = id;
            const submitBtn = document.getElementById('add-resource');
            if (submitBtn) submitBtn.textContent = "Update Resource";
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
        
        if (result.success) {
            // Fill window.resources with the API data [JS-28]
            window.resources = result.data || [];
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

// Make functions available globally for Jest tests
window.renderTable = renderTable;
window.handleTableClick = handleTableClick;
window.handleAddResource = handleAddResource;
window.loadAndInitialize = loadAndInitialize;

// Run the application
loadAndInitialize();