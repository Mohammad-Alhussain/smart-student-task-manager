const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'tasks.db');

// Create or open the database file
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
});

const createTableSql = `
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    priority TEXT NOT NULL,
    status TEXT NOT NULL,
    dueDate TEXT NOT NULL
  )
`;

db.serialize(() => {
  db.run(createTableSql, (err) => {
    if (err) {
      console.error('Error creating table:', err.message);
    } else {
      console.log('Table "tasks" created successfully.');
    }
  });
});

db.close((err) => {
  if (err) {
    console.error('Error closing database format', err.message);
  } else {
    console.log('Database initialization complete.');
  }
});
