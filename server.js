const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database Initialization
const db = new sqlite3.Database('./library.db', (err) => {
    if (err) console.error(err.message);
    console.log('Connected to SQLite database.');
});

// Create Tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        category TEXT,
        year INTEGER,
        isbn TEXT UNIQUE,
        cover_url TEXT,
        status TEXT DEFAULT 'Available'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS borrowers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS loans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER,
        borrower_id INTEGER,
        loan_date TEXT,
        return_date TEXT,
        actual_return_date TEXT,
        FOREIGN KEY(book_id) REFERENCES books(id),
        FOREIGN KEY(borrower_id) REFERENCES borrowers(id)
    )`);
});

// --- DASHBOARD ENDPOINT ---
app.get('/api/dashboard', (req, res) => {
    const stats = {};
    db.get("SELECT COUNT(*) as total FROM books", [], (err, row) => {
        stats.totalBooks = row.total;
        db.get("SELECT COUNT(*) as total FROM books WHERE status='Available'", [], (err, row) => {
            stats.availableBooks = row.total;
            db.get("SELECT COUNT(*) as total FROM books WHERE status='Borrowed'", [], (err, row) => {
                stats.borrowedBooks = row.total;
                db.get("SELECT COUNT(*) as total FROM borrowers", [], (err, row) => {
                    stats.totalBorrowers = row.total;
                    db.all("SELECT * FROM books ORDER BY id DESC LIMIT 5", [], (err, rows) => {
                        stats.recentBooks = rows;
                        res.json(stats);
                    });
                });
            });
        });
    });
});

// --- BOOKS CRUD & FILTERS ---
app.get('/api/books', (req, res) => {
    let { search, category, status, sortBy } = req.query;
    let query = "SELECT * FROM books WHERE 1=1";
    let params = [];

    if (search) {
        query += " AND (title LIKE ? OR author LIKE ?)";
        params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
        query += " AND category = ?";
        params.push(category);
    }
    if (status) {
        query += " AND status = ?";
        params.push(status);
    }
    if (sortBy === 'author') {
        query += " ORDER BY author ASC";
    } else {
        query += " ORDER BY title ASC";
    }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/books', (req, res) => {
    const { title, author, category, year, isbn, cover_url } = req.body;
    if (!title || !author || !isbn) return res.status(400).json({ error: "Missing required fields" });

    db.run(`INSERT INTO books (title, author, category, year, isbn, cover_url) VALUES (?, ?, ?, ?, ?, ?)`,
        [title, author, category, year, isbn, cover_url],
        function (err) {
            if (err) {
                if (err.message.includes('UNIQUE')) return res.status(400).json({ error: "ISBN already exists" });
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: this.lastID, message: "Book added successfully!" });
        }
    );
});

app.put('/api/books/:id', (req, res) => {
    const { title, author, category, year, isbn, cover_url } = req.body;
    db.run(`UPDATE books SET title=?, author=?, category=?, year=?, isbn=?, cover_url=? WHERE id=?`,
        [title, author, category, year, isbn, cover_url, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Book updated successfully" });
        }
    );
});

app.delete('/api/books/:id', (req, res) => {
    db.run(`DELETE FROM books WHERE id = ?`, req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Book deleted successfully" });
    });
});

// --- BORROWERS & LOANS ---
app.post('/api/borrowers', (req, res) => {
    const { name, email } = req.body;
    db.run(`INSERT INTO borrowers (name, email) VALUES (?, ?)`, [name, email], function (err) {
        if (err) return res.status(400).json({ error: "Email already registered" });
        res.json({ id: this.lastID, message: "Borrower added" });
    });
});

app.get('/api/borrowers', (req, res) => {
    db.all("SELECT * FROM borrowers", [], (err, rows) => res.json(rows));
});

app.post('/api/loans', (req, res) => {
    const { book_id, borrower_id, loan_date, return_date } = req.body;

    db.get("SELECT status FROM books WHERE id = ?", [book_id], (err, book) => {
        if (!book || book.status === 'Borrowed') return res.status(400).json({ error: "Book is already borrowed" });

        db.run(`INSERT INTO loans (book_id, borrower_id, loan_date, return_date) VALUES (?, ?, ?, ?)`,
            [book_id, borrower_id, loan_date, return_date],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                db.run("UPDATE books SET status = 'Borrowed' WHERE id = ?", [book_id]);
                res.json({ message: "Book issued successfully!" });
            }
        );
    });
});

app.post('/api/loans/return', (req, res) => {
    const { book_id, actual_return_date } = req.body;
    db.run(`UPDATE loans SET actual_return_date = ? WHERE book_id = ? AND actual_return_date IS NULL`,
        [actual_return_date, book_id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            db.run("UPDATE books SET status = 'Available' WHERE id = ?", [book_id]);
            res.json({ message: "Book returned successfully" });
        }
    );
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
