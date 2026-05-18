// --- Global Data Store ---
let users = [];

// --- Element Selections ---
const userTableBody     = document.getElementById('user-table-body');
const addUserForm       = document.getElementById('add-user-form');
const changePasswordForm = document.getElementById('password-form');
const searchInput       = document.getElementById('search-input');
const tableHeaders      = document.querySelectorAll('#user-table thead th');

// --- Functions ---

function createUserRow(user) {
  const tr = document.createElement('tr');

  const nameTd    = document.createElement('td');
  nameTd.textContent = user.name;

  const emailTd   = document.createElement('td');
  emailTd.textContent = user.email;

  const adminTd   = document.createElement('td');
  const badge     = document.createElement('span');
  badge.textContent = user.is_admin === 1 ? 'Yes' : 'No';
  badge.className   = user.is_admin === 1 ? 'badge badge-admin' : 'badge badge-student';
  adminTd.appendChild(badge);

  const actionsTd  = document.createElement('td');

  const editBtn    = document.createElement('button');
  editBtn.textContent   = 'Edit';
  editBtn.className     = 'edit-btn';
  editBtn.dataset.id    = user.id;

  const deleteBtn  = document.createElement('button');
  deleteBtn.textContent = 'Delete';
  deleteBtn.className   = 'delete-btn';
  deleteBtn.dataset.id  = user.id;

  actionsTd.appendChild(editBtn);
  actionsTd.appendChild(deleteBtn);

  tr.appendChild(nameTd);
  tr.appendChild(emailTd);
  tr.appendChild(adminTd);
  tr.appendChild(actionsTd);

  return tr;
}

function renderTable(userArray) {
  userTableBody.innerHTML = '';
  userArray.forEach(user => {
    const row = createUserRow(user);
    userTableBody.appendChild(row);
  });
}

async function handleChangePassword(event) {
  event.preventDefault();

  const currentPassword = document.getElementById('current-password').value;
  const newPassword     = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  if (newPassword !== confirmPassword) {
    alert('Passwords do not match.');
    return;
  }

  if (newPassword.length < 8) {
    alert('Password must be at least 8 characters.');
    return;
  }

  // Get logged-in user id from session (fallback to 1 for testing)
  const userId = 1;

  try {
    const res  = await fetch('../api/index.php?action=change_password', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        id:               userId,
        current_password: currentPassword,
        new_password:     newPassword,
      }),
    });

    const data = await res.json();

    if (data.success) {
      alert('Password updated successfully!');
      document.getElementById('current-password').value = '';
      document.getElementById('new-password').value     = '';
      document.getElementById('confirm-password').value = '';
    } else {
      alert(data.message || 'Failed to update password.');
    }
  } catch (err) {
    alert('Network error. Please try again.');
  }
}

async function handleAddUser(event) {
  event.preventDefault();

  const name     = document.getElementById('user-name').value.trim();
  const email    = document.getElementById('user-email').value.trim();
  const password = document.getElementById('default-password').value.trim();
  const is_admin = parseInt(document.getElementById('is-admin').value);

  if (!name || !email || !password) {
    alert('Please fill out all required fields.');
    return;
  }

  if (password.length < 8) {
    alert('Password must be at least 8 characters.');
    return;
  }

  try {
    const res  = await fetch('../api/index.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, email, password, is_admin }),
    });

    const data = await res.json();

    if (res.status === 201 && data.success) {
      await loadUsersAndInitialize();
      document.getElementById('user-name').value      = '';
      document.getElementById('user-email').value     = '';
      document.getElementById('default-password').value = '';
      document.getElementById('is-admin').value       = '0';
    } else {
      alert(data.message || 'Failed to add user.');
    }
  } catch (err) {
    alert('Network error. Please try again.');
  }
}

async function handleTableClick(event) {
  const target = event.target;

  if (target.classList.contains('delete-btn')) {
    const id = target.dataset.id;
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const res  = await fetch('../api/index.php?id=' + id, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        users = users.filter(u => u.id !== parseInt(id));
        renderTable(users);
      } else {
        alert(data.message || 'Failed to delete user.');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    }
  }

  if (target.classList.contains('edit-btn')) {
    const id   = target.dataset.id;
    const user = users.find(u => u.id === parseInt(id));
    if (!user) return;

    const newName  = prompt('Edit name:', user.name);
    if (newName === null) return;

    const newEmail = prompt('Edit email:', user.email);
    if (newEmail === null) return;

    const newAdmin = prompt('Is admin? (0 = No, 1 = Yes):', user.is_admin);
    if (newAdmin === null) return;

    try {
      const res  = await fetch('../api/index.php', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          id:       parseInt(id),
          name:     newName,
          email:    newEmail,
          is_admin: parseInt(newAdmin),
        }),
      });

      const data = await res.json();

      if (data.success) {
        await loadUsersAndInitialize();
      } else {
        alert(data.message || 'Failed to update user.');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    }
  }
}

function handleSearch(event) {
  const term = searchInput.value.toLowerCase().trim();

  if (!term) {
    renderTable(users);
    return;
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(term) ||
    u.email.toLowerCase().includes(term)
  );

  renderTable(filtered);
}

function handleSort(event) {
  const th    = event.currentTarget;
  const index = th.cellIndex;

  const columnMap = { 0: 'name', 1: 'email', 2: 'is_admin' };
  const key       = columnMap[index];
  if (!key) return;

  const currentDir = th.dataset.sortDir || 'asc';
  const newDir      = currentDir === 'asc' ? 'desc' : 'asc';
  th.dataset.sortDir = newDir;

  users.sort((a, b) => {
    if (key === 'is_admin') {
      return newDir === 'asc' ? a[key] - b[key] : b[key] - a[key];
    }
    const cmp = a[key].localeCompare(b[key]);
    return newDir === 'asc' ? cmp : -cmp;
  });

  renderTable(users);
}

async function loadUsersAndInitialize() {
  try {
    const res = await fetch('../api/index.php');

    if (!res.ok) {
      console.error('Failed to fetch users.');
      alert('Could not load users from the server.');
      return;
    }

    const data = await res.json();
    users = data.data;
    renderTable(users);

    // Attach event listeners
    changePasswordForm.addEventListener('submit', handleChangePassword);
    addUserForm.addEventListener('submit', handleAddUser);
    userTableBody.addEventListener('click', handleTableClick);
    searchInput.addEventListener('input', handleSearch);
    tableHeaders.forEach(th => th.addEventListener('click', handleSort));

  } catch (err) {
    console.error('Error loading users:', err);
  }
}

// --- Initial Page Load ---
loadUsersAndInitialize();