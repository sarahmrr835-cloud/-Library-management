const API_URL = 'http://localhost:3000/api';

// Loading Control
function toggleLoader(show) {
    document.getElementById('loadingSpinner').classList.toggle('hidden', !show);
}

// Toast Notifications
function showToast(message) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Dark Mode Toggle
document.getElementById('themeToggle').addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme');
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', nextTheme);
});

// Fetch Dashboard Stats
async function loadDashboard() {
    try {
        const res = await fetch(`${API_URL}/dashboard`);
        const data = await res.json();
        document.getElementById('statTotalBooks').innerText = data.totalBooks;
        document.getElementById('statAvailable').innerText = data.availableBooks;
        document.getElementById('statBorrowed').innerText = data.borrowedBooks;
        document.getElementById('statBorrowers').innerText = data.totalBorrowers;
    } catch (err) {
        showToast("Error loading statistics");
    }
}

// Fetch and Render Books
async function loadBooks() {
    toggleLoader(true);
    const search = document.getElementById('searchBar').value;
    const category = document.getElementById('filterCategory').value;
    const status = document.getElementById('filterStatus').value;
    const sortBy = document.getElementById('sortBy').value;

    const url = new URL(`${API_URL}/books`);
    if (search) url.searchParams.append('search', search);
    if (category) url.searchParams.append('category', category);
    if (status) url.searchParams.append('status', status);
    if (sortBy) url.searchParams.append('sortBy', sortBy);

    try {
        const res = await fetch(url);
        const books = await res.json();
        const grid = document.getElementById('booksGrid');
        const noBooks = document.getElementById('noBooksMessage');

        grid.innerHTML = '';
        if (books.length === 0) {
            noBooks.classList.remove('hidden');
        } else {
            noBooks.classList.add('hidden');
            books.forEach(book => {
                const card = document.createElement('div');
                card.className = 'book-card';
                card.innerHTML = `
                    <img src="${book.cover_url || 'https://placeholder.com'}" alt="Cover">
                    <h3>${book.title}</h3>
                    <p>By: ${book.author}</p>
                    <p>ISBN: ${book.isbn}</p>
                    <p>Status: <strong>${book.status}</strong></p>
                    <button onclick="deleteBook(${book.id})">Delete</button>
                `;
                grid.appendChild(card);
            });
        }
    } catch (err) {
        showToast("Error filtering data");
    } finally {
        toggleLoader(false);
    }
}

// Add Book Listener
document.getElementById('bookForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        title: document.getElementById('bookTitle').value,
        author: document.getElementById('bookAuthor').value,
        category: document.getElementById('bookCategory').value,
        year: document.getElementById('bookYear').value,
        isbn: document.getElementById('bookIsbn').value,
        cover_url: document.getElementById('bookCover').value,
    };

    const res = await fetch(`${API_URL}/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
        showToast(data.message);
        document.getElementById('bookForm').reset();
        loadBooks();
        loadDashboard();
    } else {
        showToast(`Error: ${data.error}`);
    }
});

// Delete Book Function
async function deleteBook(id) {
    if (!confirm("Are you sure?")) return;
    const res = await fetch(`${API_URL}/books/${id}`, { method: 'DELETE' });
    if (res.ok) {
        showToast("Book deleted successfully");
        loadBooks();
        loadDashboard();
    }
}

// Issue Book Loan Listener
document.getElementById('loanForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        book_id: document.getElementById('loanBookId').value,
        borrower_id: document.getElementById('loanBorrowerId').value,
        loan_date: document.getElementById('loanDate').value,
        return_date: document.getElementById('returnDate').value,
    };

    const res = await fetch(`${API_URL}/loans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
        showToast(data.message);
        document.getElementById('loanForm').reset();
        loadBooks();
        loadDashboard();
    } else {
        showToast(`Error: ${data.error}`);
    }
});

// Event Listeners for Filters
document.getElementById('searchBar').addEventListener('input', loadBooks);
document.getElementById('filterCategory').addEventListener('change', loadBooks);
document.getElementById('filterStatus').addEventListener('change', loadBooks);
document.getElementById('sortBy').addEventListener('change', loadBooks);

// Init Load
loadDashboard();
loadBooks();
