const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware configuration
app.use(express.json()); // Parses incoming JSON requests
app.use(express.static(path.join(__dirname, 'public'))); // Serve HTML/CSS/JS statically

// Database setup
const dbPath = path.join(__dirname, 'tasks.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to SQLite Database.');
  }
});

// ----------------------------------------------------------------
// API Endpoints
// ----------------------------------------------------------------

// GET /api/tasks -> return all tasks
app.get('/api/tasks', (req, res) => {
  const sql = `SELECT * FROM tasks`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    // Map tasks properly (frontend expects string IDs)
    const tasks = rows.map(row => ({
      id: row.id.toString(),
      title: row.title,
      description: row.description,
      category: row.category,
      priority: row.priority,
      status: row.status,
      dueDate: row.dueDate
    }));
    res.json(tasks);
  });
});

// GET /api/tasks/:id -> return a single task
app.get('/api/tasks/:id', (req, res) => {
  const sql = `SELECT * FROM tasks WHERE id = ?`;
  db.get(sql, [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: "Task not found." });
    }
    res.json({
      id: row.id.toString(),
      ...row
    });
  });
});

// POST /api/tasks -> create a new task
app.post('/api/tasks', (req, res) => {
  const { title, description, category, priority, status, dueDate } = req.body;
  
  if (!title || !category || !priority || !status || !dueDate) {
    return res.status(400).json({ error: 'Missing required configuration fields.' });
  }

  const sql = `INSERT INTO tasks (title, description, category, priority, status, dueDate) VALUES (?, ?, ?, ?, ?, ?)`;
  const params = [title, description, category, priority, status, dueDate];
  
  db.run(sql, params, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ 
      id: this.lastID.toString(),
      title, description, category, priority, status, dueDate 
    });
  });
});

// PUT /api/tasks/:id -> update a task
app.put('/api/tasks/:id', (req, res) => {
  const { title, description, category, priority, status, dueDate } = req.body;
  
  const sql = `UPDATE tasks SET 
    title = COALESCE(?, title),
    description = COALESCE(?, description),
    category = COALESCE(?, category),
    priority = COALESCE(?, priority),
    status = COALESCE(?, status),
    dueDate = COALESCE(?, dueDate)
    WHERE id = ?`;
    
  const params = [title, description, category, priority, status, dueDate, req.params.id];
  
  db.run(sql, params, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }
    res.json({ message: "Task successfully updated.", changes: this.changes });
  });
});

// DELETE /api/tasks/:id -> delete a task
app.delete('/api/tasks/:id', (req, res) => {
  const sql = `DELETE FROM tasks WHERE id = ?`;
  db.run(sql, req.params.id, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }
    res.json({ message: "Task successfully deleted." });
  });
});

app.listen(PORT, () => {
  console.log(`Express Server is running efficiently on http://localhost:${PORT}`);
});
