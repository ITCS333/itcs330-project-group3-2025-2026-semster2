/**
 * Requirement: Task 2 — Resources JavaScript (Admin)
 * 
 * Instructions:
 * Link this file to admin.html using <script src="admin.js" defer></script>.
 * This script handles the CRUD operations for the admin resource management page.
 */

// --- Global Data Store ---
// We use window.resources to ensure the Autograder/Jest can inject test data [JS-23]
window.resources = [];
// Create a local reference to the same array object
var resources = window.resources; 
var editId = null;

// --- Element Selections ---
const resourceForm = document.getElementById('resource-form');
const resourcesTbody = document.getElementById('resources-tbody');
const titleInput = document.getElementById('resource-title');
const descInput = document.getElementById('resource-description');
const linkInput = document.getElementById('resource-link');
const submitBtn = document.getElementById('add-resource');

// --- Functions ---

/**
 * TODO: Implement the createResourceRow function. [JS-19, JS-20, JS-21]
 * It takes one resource object and returns a <tr> element.
 */
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

/**
 * TODO: Implement the renderTable function. [JS-22, JS-23]
 * It clears the tbody and renders one <tr> per resource in the global array.
 */
function renderTable() {
    if (!resourcesTbody) return;

    // Clear the resources table body [JS-22]
    resourcesTbody.innerHTML = '';

    // Loop through the global resources array [JS-23]
    // We use window.resources to ensure we are looking at the array the test injected data into
    const dataToRender = window.resources || [];
    
    dataToRender.forEach(resource => {
        const row = createResourceRow(resource);
        resourcesTbody.appendChild(row);
    });
}

/**
 * TODO: Implement the handleAddResource function. [JS-24, JS-25]
 * Event handler for form submission (Handles both POST and PUT).
 */
async function handleAddResource(event) {
    if (event) event.preventDefault(); // Prevent default submission [JS-24]

    const title = titleInput.value;
    const description = descInput.value;
    const link = linkInput.value;

    const payload = { title, description, link };

    if (editId) {
        // PUT logic: Update existing resource
        const response = await fetch('./api/index.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, id: editId })
        });
        const result = await response.json();
        if (result.success) {
            // Update the item in the global array
            const idx = resources.findIndex(r => r.id == editId);
            if (idx !== -1) resources[idx] = { ...payload, id: editId };
            
            // Reset Edit Mode
            editId = null;
            submitBtn.textContent = "Add Resource";
        }
    } else {
        // POST logic: Add new resource [JS-25]
        const response = await fetch('./api/index.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (result.success) {
            // Add new resource to global array
            resources.push({ ...payload, id: result.id });
        }
    }

    resourceForm.reset();
    renderTable();
}

/**
 * TODO: Implement the handleTableClick function. [JS-26, JS-27]
 * Handles delegation for Edit and Delete buttons.
 */
async function handleTableClick(event) {
    const target = event.target;
    const id = target.dataset.id;
    if (!id) return;

    if (target.classList.contains('delete-btn')) {
        // [JS-26] Delete logic
        const response = await fetch(`./api/index.php?id=${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
            // Remove from global array by filtering (keeping reference sync)
            const idx = resources.findIndex(r => r.id == id);
            if (idx !== -1) resources.splice(idx, 1);
            renderTable();
        }
    } else if (target.classList.contains('edit-btn')) {
        // [JS-27] Edit logic: Populate form fields
        const r = resources.find(res => res.id == id);
        if (r) {
            titleInput.value = r.title;
            descInput.value = r.description;
            linkInput.value = r.link;
            editId = id;
            submitBtn.textContent = "Update Resource";
        }
    }
}

/**
 * TODO: Implement the loadAndInitialize function. [JS-28, JS-29, JS-30]
 */
async function loadAndInitialize() {
    try {
        // Fetch all resources [JS-28]
        const response = await fetch('./api/index.php');
        const result = await response.json();
        
        if (result.success) {
            // Clear and fill the array to maintain the object reference for tests
            resources.length = 0; 
            result.data.forEach(item => resources.push(item));
            renderTable(); // Populate for the first time [JS-29]
        }

        // Add event listeners [JS-30]
        if (resourceForm) {
            resourceForm.addEventListener('submit', handleAddResource);
        }
        if (resourcesTbody) {
            resourcesTbody.addEventListener('click', handleTableClick);
        }

    } catch (err) {
        console.error("Initialization failed:", err);
    }
}

// Export functions to window for Jest testing environment visibility
window.renderTable = renderTable;
window.handleTableClick = handleTableClick;
window.handleAddResource = handleAddResource;

// Start the application
loadAndInitialize();