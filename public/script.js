/**
 * Smart Student Task Manager
 * Handles data via API calls strictly (Full-Stack Mode)
 */

const API_BASE_URL = '/api/tasks';

// ----------------------------------------------------
// Data Management (Fetch API to Express server)
// ----------------------------------------------------

/**
 * Retrieves all tasks asynchronously via GET API
 */
async function getTasks() {
  try {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) throw new Error('API Response was not OK');
    return await response.json();
  } catch (error) {
    console.error('Error fetching tasks:', error);
    alert('Failed to connect to backend server wrapper to load tasks.');
    return [];
  }
}

/**
 * Adds a new task asynchronously via POST API
 */
async function addTask(taskData) {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    if (!response.ok) throw new Error('Failed to create task on backend');
    return await response.json();
  } catch (error) {
    console.error('Error adding task:', error);
    alert('Failed to save task to SQLite database.');
    throw error;
  }
}

/**
 * Updates a specific task asynchronously via PUT API
 */
async function updateTask(id, updatedFields) {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedFields)
    });
    if (!response.ok) {
      if (response.status === 404) throw new Error('Task not found in DB (404).');
      throw new Error('Failed to update task');
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating task:', error);
    alert('Failed to update task metadata on SQLite: ' + error.message);
    throw error;
  }
}

/**
 * Deletes a task by ID asynchronously via DELETE API
 */
async function deleteTask(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      if (response.status === 404) throw new Error('Task not found in DB (404).');
      throw new Error('Failed to delete task');
    }
    return await response.json();
  } catch (error) {
    console.error('Error deleting task:', error);
    alert('Failed to delete task from SQLite: ' + error.message);
    throw error;
  }
}

// ----------------------------------------------------
// UI Logic - Helper Functions
// ----------------------------------------------------

function isOverdue(dueDateStr, status) {
  if (!dueDateStr || status === 'Completed') return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(dueDateStr);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate < today;
}

// ----------------------------------------------------
// Page Specific Initializers
// ----------------------------------------------------


document.addEventListener('DOMContentLoaded', async () => {

  const pathname = window.location.pathname;

  if (pathname.endsWith('add-task.html')) {
    initAddTask();
  } else if (pathname.endsWith('tasks.html')) {
    initManageTasks();
  } else {
    initDashboard(); // index.html
  }

});

/**
 * Initialize Dashboard logic (index.html) [ASYNC REFACTOR]
 */
async function initDashboard() {
  const tasks = await getTasks();

  const totalSteps = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const pendingTasks = tasks.filter(t => t.status !== 'Completed').length;
  const highPriority = tasks.filter(t => t.priority === 'High' && t.status !== 'Completed').length;

  const totalEl = document.getElementById('stat-total');
  const completedEl = document.getElementById('stat-completed');
  const pendingEl = document.getElementById('stat-pending');
  const highPriorityEl = document.getElementById('stat-high');

  if (totalEl) totalEl.textContent = totalSteps;
  if (completedEl) completedEl.textContent = completedTasks;
  if (pendingEl) pendingEl.textContent = pendingTasks;
  if (highPriorityEl) highPriorityEl.textContent = highPriority;
}

/**
 * Initialize Add / Edit Task page (add-task.html) [ASYNC REFACTOR]
 */
async function initAddTask() {
  const form = document.getElementById('add-task-form');
  const pageTitle = document.getElementById('page-title');
  const submitBtn = document.getElementById('submit-btn');

  if (!form) return;

  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('edit');

  if (editId) {
    pageTitle.textContent = 'Edit Task';
    submitBtn.textContent = 'Update Task';

    // Asynchronously pre-fetch data for editing
    try {
      const fetchRes = await fetch(`${API_BASE_URL}/${editId}`);
      if (fetchRes.ok) {
        const task = await fetchRes.json();
        document.getElementById('title').value = task.title;
        document.getElementById('description').value = task.description;
        document.getElementById('category').value = task.category;
        document.getElementById('priority').value = task.priority;
        document.getElementById('status').value = task.status;
        document.getElementById('dueDate').value = task.dueDate;
      } else {
        alert('Requested task to edit was not found on SQLite server.');
        window.location.href = 'tasks.html';
      }
    } catch (err) {
      console.error('Error retrieving task item:', err);
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const titleEl = document.getElementById('title');
    const categoryEl = document.getElementById('category');
    const priorityEl = document.getElementById('priority');
    const statusEl = document.getElementById('status');
    const dueDateEl = document.getElementById('dueDate');

    // Prevent submission validation missing elements explicitly
    if (!titleEl.value.trim() || !categoryEl.value || !priorityEl.value || !statusEl.value || !dueDateEl.value) {
      alert("Validation error: You must provide a valid task Title and set required dropdown bounds.");
      return;
    }

    // UX improvements
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving directly to database...';

    const taskData = {
      title: titleEl.value.trim(),
      description: document.getElementById('description').value.trim(),
      category: categoryEl.value,
      priority: priorityEl.value,
      status: statusEl.value,
      dueDate: dueDateEl.value
    };

    try {
      if (editId) {
        await updateTask(editId, taskData);
        alert('Task successfully updated inside SQLite Database!');
      } else {
        await addTask(taskData);
        alert('Task successfully committed to SQLite Database!');
      }
      window.location.href = 'tasks.html';
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.textContent = editId ? 'Update Task' : 'Save Task';
    }
  });
}

/**
 * Initialize Manage Tasks page (tasks.html) [ASYNC REFACTOR]
 */
async function initManageTasks() {
  const tasksContainer = document.getElementById('tasks-container');
  const searchInput = document.getElementById('search-input');
  const filterSelect = document.getElementById('filter-select');


  if (!tasksContainer) return;

  // Local state to prevent overloading SQLite with rapid GET calls over inputs
  let allTasksCache = [];

  async function initialRender() {
    tasksContainer.innerHTML = '<p style="text-align: center; width: 100%;">Fetching Tasks from Express SQLite server...</p>';
    allTasksCache = await getTasks();
    applyFiltersAndDraw();
  }

  function applyFiltersAndDraw() {
    const searchTerm = searchInput.value.toLowerCase();
    const filterTerm = filterSelect.value;

    tasksContainer.innerHTML = '';

    let filteredTasks = allTasksCache.filter(task => {
      const titleMatch = task.title.toLowerCase().includes(searchTerm);
      const descMatch = (task.description || '').toLowerCase().includes(searchTerm);
      const matchesSearch = titleMatch || descMatch;

      let matchesFilter = true;
      if (filterTerm === 'Completed') {
        matchesFilter = task.status === 'Completed';
      } else if (filterTerm === 'Pending') {
        matchesFilter = task.status !== 'Completed';
      } else if (filterTerm === 'High Priority') {
        matchesFilter = task.priority === 'High';
      }

      return matchesSearch && matchesFilter;
    });

    if (filteredTasks.length === 0) {
      tasksContainer.innerHTML = `
        <div id="no-tasks">
          <p>Database shows no tasks assigned. You're up to date!</p>
          <button class="btn btn-primary" onclick="window.location.href='add-task.html'">Add a New Task</button>
        </div>`;
      return;
    }

    filteredTasks.sort((a, b) => {
      if (a.status === 'Completed' && b.status !== 'Completed') return 1;
      if (a.status !== 'Completed' && b.status === 'Completed') return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

    filteredTasks.forEach(task => {
      const isCompleted = task.status === 'Completed';
      const isTaskOverdue = isOverdue(task.dueDate, task.status);

      const card = document.createElement('div');
      card.className = `task-card ${isCompleted ? 'completed' : ''} ${isTaskOverdue ? 'overdue' : ''}`;

      card.innerHTML = `
        <div class="task-header">
          <h3 class="task-title">${task.title}</h3>
          <span class="badge badge-priority-${task.priority.toLowerCase()}">${task.priority}</span>
        </div>
        <div class="task-body">
          <p class="task-desc">${task.description || 'No description provided.'}</p>
          <div class="task-meta">
            <span><strong>Category:</strong> ${task.category}</span>
            <span><strong>Status:</strong> ${task.status}</span>
            <span class="task-date"><strong>Due:</strong> ${task.dueDate || 'No date'} ${isTaskOverdue ? '(Overdue)' : ''}</span>
          </div>
        </div>
        <div class="task-actions">
          ${!isCompleted ? `<button class="btn btn-sm btn-success" onclick="markComplete('${task.id}')">Complete</button>` : ''}
          <button class="btn btn-sm btn-outline" onclick="editTask('${task.id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="removeTask('${task.id}')">Delete</button>
        </div>
      `;

      tasksContainer.appendChild(card);
    });
  }

  searchInput.addEventListener('input', applyFiltersAndDraw);
  filterSelect.addEventListener('change', applyFiltersAndDraw);

  initialRender();

  window.markComplete = async function (id) {
    try {
      await updateTask(id, { status: 'Completed' });
      await initialRender(); // Synchronize UI with updated Database state
    } catch (err) {
      console.error(err);
    }
  };

  window.editTask = function (id) {
    window.location.href = `add-task.html?edit=${id}`;
  };

  window.removeTask = async function (id) {
    if (confirm('Are you strictly positive you want to delete this SQL entry forever?')) {
      try {
        await deleteTask(id);
        await initialRender(); // Refresh array from database
      } catch (err) {
        console.log(err);
      }
    }
  };
}

document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.clickable-card');

  cards.forEach(card => {
    card.addEventListener('click', () => {
      window.location.href = 'tasks.html';
    });
  });
});