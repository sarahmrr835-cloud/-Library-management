let books = [];
let editMode = false;
let editBookId = null;

// Dynamic check to match correct port 3000
const API_URL = `${window.location.protocol}//${window.location.hostname}:3000/api/books`;

const bookForm = document.getElementById('book-form');
const bookTitleInput = document.getElementById('book-title');
const bookAuthorInput = document.getElementById('book-author');
const formBtn = bookForm.querySelector('button');
const formHeading = document.querySelector('.form-section h2');
const booksTableBody = document.getElementById('books-table-body');
const bookCountSpan = document.getElementById('book-count');
const searchInput = document.getElementById('search-input');
const filterStatus = document.getElementById('filter-status');
const toastContainer = document.getElementById('toast-container');

const totalBooksElem = document.getElementById('total-books');
const availableBooksElem = document.getElementById('available-books');
const borrowedBooksElem = document.getElementById('borrowed-books');
const themeToggleBtn = document.getElementById('theme-toggle');
const exportBtn = document.getElementById('export-btn');

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = message;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function formatDate(dateObj) {
    return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
}

async function fetchBooks() {
    try {
        const response = await fetch(API_URL);
        books = await response.json();
        updateUI();
    } catch (error) {
        showToast("❌ Error connecting to server", "danger");
    }
}

function updateUI() {
    booksTableBody.innerHTML = '';
    const searchTerm = searchInput.value.toLowerCase().trim();
    const filterValue = filterStatus.value;
    const now = new Date();

    const filteredBooks = books.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchTerm) || book.author.toLowerCase().includes(searchTerm);
        const matchesFilter = filterValue === 'all' ||
            (filterValue === 'available' && !book.isBorrowed) ||
            (filterValue === 'borrowed' && book.isBorrowed);
        return matchesSearch && matchesFilter;
    });

    filteredBooks.forEach(book => {
        const row = document.createElement('tr');
        let isOverdue = false;
        if (book.isBorrowed && book.dueDate) {
            const dueDateObj = new Date(book.dueDate);
            if (now > dueDateObj) isOverdue = true;
        }

        row.innerHTML = `
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>
                <span class="status-badge ${book.isBorrowed ? 'status-borrowed' : 'status-available'}">
                    ${book.isBorrowed ? (isOverdue ? 'Overdue ⚠️' : 'Borrowed') : 'Available'}
                </span>
            </td>
            <td style="font-size: 0.9rem; color: #64748b;">${book.date || '-'}</td>
            <td style="font-size: 0.9rem; font-weight: 600; color: ${isOverdue ? 'var(--danger-color)' : '#64748b'};">
                ${book.dueDate || '-'}
            </td>
            <td class="actions">
                ${book.isBorrowed ?
                `<button class="btn-return" onclick="toggleBorrow(${book.id}, true)">Return</button>` :
                `<button class="btn-borrow" onclick="toggleBorrow(${book.id}, false)">Borrow</button>`
            }
                <button class="btn-edit" onclick="startEdit(${book.id})">Edit</button>
                <button class="btn-delete" onclick="deleteBook(${book.id})">Delete</button>
            </td>
        `;
        booksTableBody.appendChild(row);
    });

    bookCountSpan.textContent = filteredBooks.length;

    const totalCount = books.length;
    const borrowedCount = books.filter(b => b.isBorrowed).length;
    availableBooksElem.textContent = totalCount - borrowedCount;
    totalBooksElem.textContent = totalCount;
    borrowedBooksElem.textContent = borrowedCount;
}

bookForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = bookTitleInput.value.trim();
    const author = bookAuthorInput.value.trim();

    try {
        if (editMode) {
            await fetch(`${API_URL}/${editBookId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, author })
            });
            resetForm();
            showToast("📝 Book details updated successfully!", "info");
        } else {
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, author })
            });
            showToast("✅ New book added successfully!", "success");
        }
        fetchBooks();
        bookForm.reset();
    } catch (error) {
        showToast("❌ Request failed", "danger");
    }
});

async function toggleBorrow(id, currentlyBorrowed) {
    const now = new Date();
    const formattedDate = currentlyBorrowed ? "" : formatDate(now);

    const dueTime = new Date();
    dueTime.setDate(now.getDate() + 7);
    const formattedDueDate = currentlyBorrowed ? "" : formatDate(dueTime);

    try {
        await fetch(`${API_URL}/${id}/toggle`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                isBorrowed: !currentlyBorrowed,
                date: formattedDate,
                dueDate: formattedDueDate
            })
        });
        showToast(currentlyBorrowed ? "↩️ You returned the book" : "📖 You borrowed the book", currentlyBorrowed ? "info" : "success");
        fetchBooks();
    } catch (error) {
        showToast("❌ Failed to update status", "danger");
    }
}

function startEdit(id) {
    const book = books.find(b => b.id === id);
    if (!book) return;
    editMode = true;
    editBookId = id;
    bookTitleInput.value = book.title;
    bookAuthorInput.value = book.author;
    formHeading.textContent = "Edit Book Details";
    formBtn.textContent = "Save Changes";
    formBtn.style.backgroundColor = "#f59e0b";
    bookTitleInput.focus();
}

function resetForm() {
    editMode = false;
    editBookId = null;
    formHeading.textContent = "Add New Book";
    formBtn.textContent = "Add to Library";
    formBtn.style.backgroundColor = "var(--primary-color)";
}

async function deleteBook(id) {
    if (!confirm('Are you sure you want to delete this book?')) return;
    try {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (editBookId === id) resetForm();
        fetchBooks();
        showToast("🗑️ Book deleted from library.", "danger");
    } catch (error) {
        showToast("❌ Delete failed", "danger");
    }
}

function exportToCSV() {
    if (books.length === 0) return alert("No data to export!");
    let csv = "ID,Title,Author,Status,Borrowed Date,Due Date\n";
    books.forEach(b => {
        csv += `${b.id},"${b.title.replace(/"/g, '""')}","${b.author.replace(/"/g, '""')}",${b.isBorrowed ? "Borrowed" : "Available"},${b.date || "N/A"},${b.dueDate || "N/A"}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "library_database.csv";
    link.click();
}

if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-theme');
    themeToggleBtn.textContent = "☀️ Light Mode";
}

themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggleBtn.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
});

searchInput.addEventListener('input', updateUI);
filterStatus.addEventListener('change', updateUI);
exportBtn.addEventListener('click', exportToCSV);

fetchBooks();
