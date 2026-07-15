const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connect to SQLite Database
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) console.error(err.message);
    console.log('Connected to the SQLite database.');
});

// Create Table with accurate schema
db.run(`CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    isBorrowed INTEGER DEFAULT 0,
    date TEXT,
    dueDate TEXT
)`);

// GET: Fetch all books
app.get('/api/books', (req, res) => {
    db.all("SELECT * FROM books", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const formattedRows = rows.map(row => ({ ...row, isBorrowed: !!row.isBorrowed }));
        res.json(formattedRows);
    });
});

// POST: Add a new book
app.post('/api/books', (req, res) => {
    const { title, author } = req.body;
    db.run("INSERT INTO books (title, author, isBorrowed, date, dueDate) VALUES (?, ?, 0, '', '')",
        [title, author], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, title, author, isBorrowed: false, date: "", dueDate: "" });
        });
});

// PUT: Update book info
app.put('/api/books/:id', (req, res) => {
    const { title, author } = req.body;
    db.run("UPDATE books SET title = ?, author = ? WHERE id = ?", [title, author, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Updated successfully" });
    });
});

// PATCH: Toggle borrow/return and stamp dates
app.patch('/api/books/:id/toggle', (req, res) => {
    const { isBorrowed, date, dueDate } = req.body;
    db.run("UPDATE books SET isBorrowed = ?, date = ?, dueDate = ? WHERE id = ?",
        [isBorrowed ? 1 : 0, date, dueDate, req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Status toggled successfully" });
        });
});

// DELETE: Remove book completely
app.delete('/api/books/:id', (req, res) => {
    db.run("DELETE FROM books WHERE id = ?", req.params.id, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Deleted successfully" });
    });
});

// Run server on 0.0.0.0 to fix browser security blockages
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
