/*
  admin.js — Makes the "Manage Weekly Breakdown" admin page interactive.
  Handles full CRUD: Create, Read, Update, Delete for weeks.
  Linked to admin.html via <script src="admin.js" defer></script>
*/

// --- Global Data Store ---
let weeks = [];

// --- Element Selections ---
const weekForm    = document.getElementById('week-form');
const weeksTbody  = document.getElementById('weeks-tbody');
const addWeekBtn  = document.getElementById('add-week');
const cancelBtn   = document.getElementById('cancel-edit');
const formHeading = document.querySelector('section.form-section h2');

// --- Functions ---

/**
 * createWeekRow
 * Builds and returns a <tr> element for one week.
 *
 * @param {Object} week - { id, title, start_date, description, links }
 * @returns {HTMLElement} tr
 */
function createWeekRow(week) {
  const tr = document.createElement('tr');

  const tdTitle = document.createElement('td');
  tdTitle.textContent = week.title;

  const tdDate = document.createElement('td');
  tdDate.textContent = week.start_date;

  const tdDesc = document.createElement('td');
  tdDesc.className   = 'desc-cell';
  tdDesc.textContent = week.description || '—';

  const tdActions = document.createElement('td');

  const editBtn = document.createElement('button');
  editBtn.className    = 'edit-btn';
  editBtn.dataset.id   = week.id;
  editBtn.textContent  = 'Edit';

  const deleteBtn = document.createElement('button');
  deleteBtn.className   = 'delete-btn';
  deleteBtn.dataset.id  = week.id;
  deleteBtn.textContent = 'Delete';

  tdActions.appendChild(editBtn);
  tdActions.appendChild(deleteBtn);

  tr.appendChild(tdTitle);
  tr.appendChild(tdDate);
  tr.appendChild(tdDesc);
  tr.appendChild(tdActions);

  return tr;
}

/**
 * renderTable
 * Clears the table body and re-renders all rows from the global weeks array.
 */
function renderTable() {
  weeksTbody.innerHTML = '';

  if (weeks.length === 0) {
    const tr = document.createElement('tr');
    tr.className = 'empty-row';
    tr.innerHTML = '<td colspan="4">No weeks found. Add one above.</td>';
    weeksTbody.appendChild(tr);
    return;
  }

  weeks.forEach(week => {
    const tr = createWeekRow(week);
    weeksTbody.appendChild(tr);
  });
}

/**
 * resetForm
 * Clears all form inputs and restores the form to "Add" mode.
 */
function resetForm() {
  weekForm.reset();
  addWeekBtn.textContent = 'Add Week';
  delete addWeekBtn.dataset.editId;
  cancelBtn.style.display = 'none';
  if (formHeading) formHeading.textContent = 'Add a New Week';
}

/**
 * handleAddWeek
 * Handles the form submit event for both creating and updating weeks.
 *
 * @param {Event} event
 */
async function handleAddWeek(event) {
  event.preventDefault();

  const title       = document.getElementById('week-title').value.trim();
  const start_date  = document.getElementById('week-start-date').value.trim();
  const description = document.getElementById('week-description').value.trim();
  const linksRaw    = document.getElementById('week-links').value;

  // Split links textarea on newlines, remove empty lines
  const links = linksRaw
    .split('\n')
    .map(l => l.trim())
    .filter(l => l !== '');

  // Check if we are in edit mode
  const editId = addWeekBtn.dataset.editId;
  if (editId) {
    await handleUpdateWeek(parseInt(editId, 10), { title, start_date, description, links });
    return;
  }

  // --- Create new week ---
  try {
    const response = await fetch('./api/index.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, start_date, description, links })
    });

    const result = await response.json();

    if (result.success) {
      // Add new week to global array and re-render
      weeks.push({
        id: result.id,
        title,
        start_date,
        description,
        links
      });
      renderTable();
      resetForm();
    } else {
      alert('Failed to add week: ' + (result.message || 'Unknown error'));
    }
  } catch (error) {
    alert('Error adding week: ' + error.message);
  }
}

/**
 * handleUpdateWeek
 * Sends a PUT request to update an existing week.
 *
 * @param {number} id     - Primary key of the week to update.
 * @param {Object} fields - { title, start_date, description, links }
 */
async function handleUpdateWeek(id, fields) {
  try {
    const response = await fetch('./api/index.php', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...fields })
    });

    const result = await response.json();

    if (result.success) {
      // Update matching entry in global array
      const index = weeks.findIndex(w => w.id === id);
      if (index !== -1) {
        weeks[index] = { id, ...fields };
      }
      renderTable();
      resetForm();
    } else {
      alert('Failed to update week: ' + (result.message || 'Unknown error'));
    }
  } catch (error) {
    alert('Error updating week: ' + error.message);
  }
}

/**
 * handleTableClick
 * Delegated click handler for the weeks table body.
 * Handles both Edit and Delete button clicks.
 *
 * @param {Event} event
 */
async function handleTableClick(event) {
  const target = event.target;

  // --- DELETE ---
  if (target.classList.contains('delete-btn')) {
    const id = parseInt(target.dataset.id, 10);

    if (!confirm('Are you sure you want to delete this week?')) return;

    try {
      const response = await fetch('./api/index.php?id=' + id, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        weeks = weeks.filter(w => w.id !== id);
        renderTable();
      } else {
        alert('Failed to delete week: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      alert('Error deleting week: ' + error.message);
    }
  }

  // --- EDIT ---
  if (target.classList.contains('edit-btn')) {
    const id   = parseInt(target.dataset.id, 10);
    const week = weeks.find(w => w.id === id);
    if (!week) return;

    // Populate form fields with existing data
    document.getElementById('week-title').value       = week.title;
    document.getElementById('week-start-date').value  = week.start_date;
    document.getElementById('week-description').value = week.description || '';
    document.getElementById('week-links').value       = (week.links || []).join('\n');

    // Switch form to edit mode
    addWeekBtn.textContent      = 'Update Week';
    addWeekBtn.dataset.editId   = id;
    cancelBtn.style.display     = 'inline-block';
    if (formHeading) formHeading.textContent = 'Edit Week';

    // Scroll form into view
    weekForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * loadAndInitialize
 * Fetches all weeks from the API, renders the table, and attaches event listeners.
 */
async function loadAndInitialize() {
  try {
    const response = await fetch('./api/index.php');
    const json     = await response.json();

    if (json.success) {
      weeks = json.data;
      renderTable();
    } else {
      alert('Failed to load weeks: ' + (json.message || 'Unknown error'));
    }
  } catch (error) {
    alert('Error loading weeks: ' + error.message);
  }

  // Attach event listeners
  weekForm.addEventListener('submit', handleAddWeek);
  weeksTbody.addEventListener('click', handleTableClick);

  // Cancel edit mode
  cancelBtn.addEventListener('click', resetForm);
}

// --- Initial Page Load ---
loadAndInitialize();