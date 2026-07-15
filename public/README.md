# 📚 Full-Stack Library Management System

A sleek, modern, and production-ready Full-Stack web application designed to manage library books, track real-time borrowings, and calculate return deadlines automatically. Built using native web technologies for the frontend and backed by a solid Node.js server with a persistent database.

## ✨ Features

* **Complete CRUD Operations**: Dynamically Add, View, Edit, and Delete books.
* **Persistent Database**: Powered by **SQLite**, ensuring all data is securely saved on the server.
* **Smart Borrowing System**: Tracks real-time borrowing and automatically calculates a **7-day return deadline (Due Date)**.
* **Overdue Warnings**: Automatically flags overdue books with a visual badge (`Overdue ⚠️`) and shifts the text color to red.
* **Real-time Search & Filtering**: Instant fuzzy search by book title or author, with dropdown filtering by status (All, Available, Borrowed).
* **Live Statistics Panel**: Top summary cards showing real-time counters for Total Books, Available Books, and Borrowed Books.
* **Persistent Dark Mode**: Comfort-focused theme switching that remembers the user's preference locally.
* **Custom Toast Notifications**: Smooth, non-blocking visual feedback for all system events instead of outdated browser alerts.
* **Data Exporting**: Instant download of the entire library catalogue to an Excel-compatible `.csv` file.

## 📁 Project Structure

```text
library-management-system/
│── public/
│   │── index.html       # Structural layout
│   │── style.css        # Adaptive styling & animations
│   └── script.js        # Frontend logic & API handlers
│── server.js            # Node.js Express server & RESTful APIs
│── database.sqlite      # SQLite database file (auto-generated)
└── package.json         # Project manifests and dependency scripts
```

## 🚀 Quick Start & Installation

Ensure you have [Node.js](https://nodejs.org) installed on your machine.

### 1. Clone or Create the Files
Set up the project directories and paste the provided code chunks into their respective files (`public/index.html`, `public/style.css`, `public/script.js`, and `server.js`).

### 2. Install Dependencies
Open your **Terminal** in the project's root folder and initialize npm, then install the package requirements:
```bash
npm init -y
npm install express sqlite3 cors
npm install --save-dev nodemon
```

### 3. Run the Development Server
Launch the server using **Nodemon** so it auto-reloads whenever you save structural or script edits:
```bash
npm run dev
```

### 4. Open the App
Go to your favorite web browser and open:
👉 **[http://localhost:3000](http://localhost:3000)**

## 🔌 API Endpoints

The server exposes the following unified RESTful endpoints:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/books` | Retrieves all stored books from the database |
| **POST** | `/api/books` | Commits a new book record |
| **PUT** | `/api/books/:id` | Modifies existing book text attributes |
| **PATCH** | `/api/books/:id/toggle` | Toggles borrowing status and stamps dates |
| **DELETE** | `/api/books/:id` | Erases a book completely |
