/*
  admin.js — Makes the "Manage Weekly Breakdown" admin page interactive.
  Handles full CRUD: Create, Read, Update, Delete for weeks.
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

function createWeekRow(week) {

  const tr = document.createElement('tr');

  const tdTitle = document.createElement('td');
  tdTitle.textContent = week.title;

  const tdDate = document.createElement('td');
  tdDate.textContent = week.start_date;

  const tdDesc = document.createElement('td');
  tdDesc.className = 'desc-cell';
  tdDesc.textContent = week.description || '—';

  const tdActions = document.createElement('td');

  const editBtn = document.createElement('button');
  editBtn.className = 'edit-btn';
  editBtn.dataset.id = week.id;
  editBtn.textContent = 'Edit';

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.dataset.id = week.id;
  deleteBtn.textContent = 'Delete';

  tdActions.appendChild(editBtn);
  tdActions.appendChild(deleteBtn);

  tr.appendChild(tdTitle);
  tr.appendChild(tdDate);
  tr.appendChild(tdDesc);
  tr.appendChild(tdActions);

  return tr;
}

function renderTable() {

  if (!weeksTbody) return;

  // Clear table first
  weeksTbody.innerHTML = '';

  // If no weeks, leave tbody empty
  if (weeks.length === 0) {
    return;
  }

  // Render rows
  weeks.forEach(week => {
    const tr = createWeekRow(week);
    weeksTbody.appendChild(tr);
  });
}

function resetForm() {

  if (!weekForm) return;

  weekForm.reset();

  if (addWeekBtn) {
    addWeekBtn.textContent = 'Add Week';
    delete addWeekBtn.dataset.editId;
  }

  if (cancelBtn) {
    cancelBtn.style.display = 'none';
  }

  if (formHeading) {
    formHeading.textContent = 'Add a New Week';
  }
}

async function handleAddWeek(event) {

  event.preventDefault();

  const title =
    document.getElementById('week-title')?.value.trim();

  const start_date =
    document.getElementById('week-start-date')?.value.trim();

  const description =
    document.getElementById('week-description')?.value.trim();

  const linksRaw =
    document.getElementById('week-links')?.value || '';

  const links = linksRaw
    .split('\n')
    .map(link => link.trim())
    .filter(link => link !== '');

  const editId = addWeekBtn?.dataset.editId;

  // EDIT MODE
  if (editId) {

    await handleUpdateWeek(
      parseInt(editId, 10),
      {
        title,
        start_date,
        description,
        links
      }
    );

    return;
  }

  // CREATE MODE
  try {

    const response = await fetch('./api/index.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        start_date,
        description,
        links
      })
    });

    const result = await response.json();

    if (result.success) {

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

      alert(
        'Failed to add week: ' +
        (result.message || 'Unknown error')
      );
    }

  } catch (error) {

    alert('Error adding week: ' + error.message);
  }
}

async function handleUpdateWeek(id, fields) {

  try {

    const response = await fetch('./api/index.php', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id,
        ...fields
      })
    });

    const result = await response.json();

    if (result.success) {

      const index = weeks.findIndex(
        week => week.id === id
      );

      if (index !== -1) {
        weeks[index] = {
          id,
          ...fields
        };
      }

      renderTable();
      resetForm();

    } else {

      alert(
        'Failed to update week: ' +
        (result.message || 'Unknown error')
      );
    }

  } catch (error) {

    alert('Error updating week: ' + error.message);
  }
}

async function handleTableClick(event) {

  const target = event.target;

  // DELETE
  if (target.classList.contains('delete-btn')) {

    const id = parseInt(target.dataset.id, 10);

    try {

      const response = await fetch(
        './api/index.php?id=' + id,
        {
          method: 'DELETE'
        }
      );

      const result = await response.json();

      if (result.success) {

        weeks = weeks.filter(
          week => week.id !== id
        );

        renderTable();

      } else {

        alert(
          'Failed to delete week: ' +
          (result.message || 'Unknown error')
        );
      }

    } catch (error) {

      alert('Error deleting week: ' + error.message);
    }
  }

  // EDIT
  if (target.classList.contains('edit-btn')) {

    const id = parseInt(target.dataset.id, 10);

    const week = weeks.find(
      week => week.id === id
    );

    if (!week) return;

    document.getElementById('week-title').value =
      week.title;

    document.getElementById('week-start-date').value =
      week.start_date;

    document.getElementById('week-description').value =
      week.description || '';

    document.getElementById('week-links').value =
      (week.links || []).join('\n');

    if (addWeekBtn) {
      addWeekBtn.textContent = 'Update Week';
      addWeekBtn.dataset.editId = id;
    }

    if (cancelBtn) {
      cancelBtn.style.display = 'inline-block';
    }

    if (formHeading) {
      formHeading.textContent = 'Edit Week';
    }

    // Prevent Jest error
    if (
      weekForm &&
      typeof weekForm.scrollIntoView === 'function'
    ) {
      weekForm.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }
}

async function loadAndInitialize() {

  try {

    const response = await fetch('./api/index.php');

    const json = await response.json();

    if (json.success) {

      weeks = json.data;

      renderTable();

    } else {

      alert(
        'Failed to load weeks: ' +
        (json.message || 'Unknown error')
      );
    }

  } catch (error) {

    alert('Error loading weeks: ' + error.message);
  }

  // Event Listeners
  if (weekForm) {
    weekForm.addEventListener(
      'submit',
      handleAddWeek
    );
  }

  if (weeksTbody) {
    weeksTbody.addEventListener(
      'click',
      handleTableClick
    );
  }

  if (cancelBtn) {
    cancelBtn.addEventListener(
      'click',
      resetForm
    );
  }
}

// --- Initial Page Load ---
loadAndInitialize();