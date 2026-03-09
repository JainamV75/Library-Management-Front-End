import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import ConfirmModal from "../components/ConfirmModal";

const statusBadgeClass = {
  AVAILABLE: "badge badge-success",
  BORROWED: "badge badge-warning",
  LOST: "badge badge-danger",
};

const genreOptions = [
  "Adventure",
  "Art",
  "Biography",
  "Business",
  "Children",
  "Comics",
  "Cooking",
  "Drama",
  "Economics",
  "Education",
  "Engineering",
  "Environment",
  "Fantasy",
  "Fiction",
  "Health",
  "History",
  "Horror",
  "Law",
  "Mathematics",
  "Medicine",
  "Music",
  "Mystery",
  "Non-Fiction",
  "Philosophy",
  "Poetry",
  "Politics",
  "Psychology",
  "Religion",
  "Romance",
  "Science",
  "Self-Help",
  "Spirituality",
  "Sports",
  "Technology",
  "Thriller",
  "Travel",
  "Young Adult",
];

const getGenreBadgeStyle = (genre) => {
  const genreIndex = genreOptions.indexOf(genre);
  if (genreIndex === -1) {
    return { background: "#e5e7eb", color: "#374151" };
  }

  // Unique hue per listed genre to keep every genre visually distinct.
  const hue = (genreIndex * 37) % 360;
  return {
    background: `hsl(${hue} 85% 92%)`,
    color: `hsl(${hue} 70% 28%)`,
  };
};

function Books() {
  const emptyBookForm = { title: "", author: "", genre: "", bookCoverUrl: "" };
  const { user } = useContext(AuthContext);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBookId, setEditingBookId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [search, setSearch] = useState({ title: "", author: "", copyCode: "" });
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filters, setFilters] = useState({ genre: "", status: "" });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [viewMode, setViewMode] = useState("list");
  const [formData, setFormData] = useState(emptyBookForm);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  const canManageBook = user?.role === "ROOT" || user?.role === "LIBRARIAN";
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const genreMatch = filters.genre ? (book.genre || "") === filters.genre : true;
      const statusMatch = filters.status ? (book.status || "AVAILABLE") === filters.status : true;
      return genreMatch && statusMatch;
    });
  }, [books, filters.genre, filters.status]);
  const displayedBooks = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) {
      return filteredBooks;
    }

    const sorted = [...filteredBooks];
    sorted.sort((a, b) => {
      const valueMap = {
        id: [(a.id ?? 0), (b.id ?? 0)],
        title: [(a.title || "").toLowerCase(), (b.title || "").toLowerCase()],
        author: [(a.author || "").toLowerCase(), (b.author || "").toLowerCase()],
        genre: [(a.genre || "").toLowerCase(), (b.genre || "").toLowerCase()],
        copyCode: [(a.copyCode || "").toLowerCase(), (b.copyCode || "").toLowerCase()],
        status: [((a.status || "AVAILABLE").toLowerCase()), ((b.status || "AVAILABLE").toLowerCase())],
      };

      const [valueA, valueB] = valueMap[sortConfig.key] || ["", ""];
      if (valueA < valueB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valueA > valueB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredBooks, sortConfig.direction, sortConfig.key]);

  const getNextDirection = (key) => {
    if (sortConfig.key !== key) return "asc";
    if (sortConfig.direction === "asc") return "desc";
    if (sortConfig.direction === "desc") return null;
    return "asc";
  };

  const handleSort = (key) => {
    const nextDirection = getNextDirection(key);
    setSortConfig({
      key: nextDirection ? key : null,
      direction: nextDirection,
    });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key || !sortConfig.direction) return "↕";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  const fetchBooks = useCallback(async (
    searchParams = { title: "", author: "", copyCode: "" },
    options = { showLoader: true },
  ) => {
    try {
      if (options.showLoader) {
        setLoading(true);
      }
      setError(null);
      const params = {};
      if (searchParams.title.trim()) params.title = searchParams.title.trim();
      if (searchParams.author.trim()) params.author = searchParams.author.trim();
      if (searchParams.copyCode.trim()) params.copyCode = searchParams.copyCode.trim();
      const res = await api.get("/books", { params });
      if (!Array.isArray(res.data)) {
        throw new Error("Unexpected books response format");
      }
      setBooks(res.data);
    } catch (err) {
      setError("Failed to fetch books");
    } finally {
      if (options.showLoader) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchBooks(undefined, { showLoader: true });
  }, [fetchBooks]);

  const handleCreateBook = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!formData.title.trim() || !formData.author.trim() || !formData.genre.trim()) {
      setFormError("Please fill all fields.");
      return;
    }

    try {
      if (editingBookId) {
        await api.put(`/books/${editingBookId}`, {
          title: formData.title.trim(),
          author: formData.author.trim(),
          genre: formData.genre.trim(),
          bookCoverUrl: formData.bookCoverUrl || null,
        });
      } else {
        await api.post("/books", {
          title: formData.title.trim(),
          author: formData.author.trim(),
          genre: formData.genre.trim(),
          bookCoverUrl: formData.bookCoverUrl || null,
        });
      }
      setShowForm(false);
      setShowEditModal(false);
      setEditingBookId(null);
      setFormData(emptyBookForm);
      await fetchBooks(search, { showLoader: false });
      setFormSuccess(editingBookId ? "Book updated successfully." : "Book created successfully.");
    } catch (err) {
      const message = err.response?.data?.message;
      setFormError(Array.isArray(message) ? message.join(", ") : message || "Error saving book");
    }
  };

  const handleStartEdit = (book) => {
    setShowForm(false);
    setShowEditModal(true);
    setEditingBookId(book.id);
    setFormData({
      title: book.title || "",
      author: book.author || "",
      genre: book.genre || "",
      bookCoverUrl: book.bookCoverUrl || "",
    });
    setFormError(null);
    setFormSuccess(null);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingBookId(null);
    setFormData(emptyBookForm);
    setFormError(null);
  };

  const handleCoverFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Please upload a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, bookCoverUrl: String(reader.result || "") }));
      setFormError(null);
    };
    reader.onerror = () => {
      setFormError("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  const confirmDeleteBook = async () => {
    if (!pendingDeleteId) return;
    try {
      await api.delete(`/books/${pendingDeleteId}`);
      setPendingDeleteId(null);
      await fetchBooks(search, { showLoader: false });
    } catch (err) {
      const message = err.response?.data?.message;
      setFormError(Array.isArray(message) ? message.join(", ") : message || "Delete failed");
      setPendingDeleteId(null);
    }
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    await fetchBooks(search, { showLoader: false });
  };

  const handleClearSearch = async () => {
    const next = { title: "", author: "", copyCode: "" };
    setSearch(next);
    await fetchBooks(next, { showLoader: false });
  };

  const handleClearFilters = () => {
    setFilters({ genre: "", status: "" });
  };

  if (loading) return <p>Loading books...</p>;
  if (error) return <p className="notice notice-error">{error}</p>;

  return (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <h2 className="page-title">Books</h2>
          <p className="page-subtitle">View, create, update, and search library books</p>
        </div>
        {canManageBook && (
          <button
            className={showForm ? "btn-secondary" : "btn-primary"}
            onClick={() => {
              const next = !showForm;
              setShowForm(next);
              setShowEditModal(false);
              setEditingBookId(null);
              setFormData(emptyBookForm);
              setFormError(null);
              setFormSuccess(null);
            }}
            type="button"
          >
            {showForm ? "Cancel" : "Add Book"}
          </button>
        )}
      </div>

      <form className="card filter-row" onSubmit={handleSearchSubmit}>
        <input
          placeholder="Search by title"
          value={search.title}
          onChange={(e) => setSearch((prev) => ({ ...prev, title: e.target.value }))}
        />
        <input
          placeholder="Search by author"
          value={search.author}
          onChange={(e) => setSearch((prev) => ({ ...prev, author: e.target.value }))}
        />
        <input
          placeholder="Search by copy code"
          value={search.copyCode}
          onChange={(e) => setSearch((prev) => ({ ...prev, copyCode: e.target.value }))}
        />
        <button className="btn-primary" type="submit">Search</button>
        <button className="btn-outline" type="button" onClick={handleClearSearch}>Clear</button>
        <div className="filter-menu-wrap">
          <button
            aria-label="Open filters"
            className="icon-btn icon-btn-filter"
            onClick={() => setShowFilterMenu((prev) => !prev)}
            title="Filters"
            type="button"
          >
            <svg
              aria-hidden="true"
              fill="none"
              height="16"
              viewBox="0 0 24 24"
              width="16"
            >
              <path
                d="M4 6h16M7 12h10M10 18h4"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
              />
            </svg>
          </button>
          {showFilterMenu && (
            <div className="filter-menu-popover">
              <div className="form-field">
                <label htmlFor="bookFilterGenre">Genre</label>
                <select
                  id="bookFilterGenre"
                  onChange={(e) => setFilters((prev) => ({ ...prev, genre: e.target.value }))}
                  value={filters.genre}
                >
                  <option value="">All genres</option>
                  {genreOptions.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="bookFilterStatus">Status</label>
                <select
                  id="bookFilterStatus"
                  onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                  value={filters.status}
                >
                  <option value="">All status</option>
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="BORROWED">BORROWED</option>
                </select>
              </div>
              <div className="form-actions">
                <button className="btn-outline" onClick={handleClearFilters} type="button">
                  Reset
                </button>
                <button className="btn-secondary" onClick={() => setShowFilterMenu(false)} type="button">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </form>

      {formSuccess && <p className="notice notice-success">{formSuccess}</p>}
      {formError && <p className="notice notice-error">{formError}</p>}

      {canManageBook && showForm && (
        <form className="form-container" onSubmit={handleCreateBook}>
          <div className="form-grid books-form-grid">
            <div className="form-field">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                name="title"
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                required
                value={formData.title}
              />
            </div>
            <div className="form-field">
              <label htmlFor="author">Author</label>
              <input
                id="author"
                name="author"
                onChange={(e) => setFormData((prev) => ({ ...prev, author: e.target.value }))}
                required
                value={formData.author}
              />
            </div>
            <div className="form-field">
              <label htmlFor="genre">Genre</label>
              <select
                id="genre"
                name="genre"
                onChange={(e) => setFormData((prev) => ({ ...prev, genre: e.target.value }))}
                required
                value={formData.genre}
              >
                <option value="">Select genre</option>
                {genreOptions.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
                {formData.genre && !genreOptions.includes(formData.genre) && (
                  <option value={formData.genre}>{formData.genre}</option>
                )}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="bookCover">Book Cover</label>
              <input
                accept="image/*"
                id="bookCover"
                onChange={handleCoverFileChange}
                type="file"
              />
              {formData.bookCoverUrl ? (
                <div className="book-cover-preview-wrap">
                  <img alt="Book cover preview" className="book-cover-preview" src={formData.bookCoverUrl} />
                  <button
                    className="btn-outline"
                    onClick={() => setFormData((prev) => ({ ...prev, bookCoverUrl: "" }))}
                    type="button"
                  >
                    Remove cover
                  </button>
                </div>
              ) : (
                <p className="notice notice-info">No cover selected</p>
              )}
            </div>
          </div>
          <div className="form-actions">
            <button className="btn-primary" type="submit">Submit</button>
          </div>
        </form>
      )}

      <div className="books-view-toggle-row">
        <button
          aria-label={viewMode === "list" ? "Switch to grid view" : "Switch to list view"}
          className="icon-btn icon-btn-view"
          onClick={() => setViewMode((prev) => (prev === "list" ? "grid" : "list"))}
          title={viewMode === "list" ? "Grid view" : "List view"}
          type="button"
        >
          {viewMode === "list" ? (
            <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
              <rect height="7" rx="1.5" stroke="currentColor" strokeWidth="2" width="7" x="3" y="3" />
              <rect height="7" rx="1.5" stroke="currentColor" strokeWidth="2" width="7" x="14" y="3" />
              <rect height="7" rx="1.5" stroke="currentColor" strokeWidth="2" width="7" x="3" y="14" />
              <rect height="7" rx="1.5" stroke="currentColor" strokeWidth="2" width="7" x="14" y="14" />
            </svg>
          ) : (
            <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
            </svg>
          )}
        </button>
      </div>

      {viewMode === "list" ? (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr>
                <th>
                  <button className="table-sort-btn" onClick={() => handleSort("id")} type="button">
                    ID <span>{getSortIndicator("id")}</span>
                  </button>
                </th>
                <th>Cover</th>
                <th>
                  <button className="table-sort-btn" onClick={() => handleSort("title")} type="button">
                    Title <span>{getSortIndicator("title")}</span>
                  </button>
                </th>
                <th>
                  <button className="table-sort-btn" onClick={() => handleSort("author")} type="button">
                    Author <span>{getSortIndicator("author")}</span>
                  </button>
                </th>
                <th>
                  <button className="table-sort-btn" onClick={() => handleSort("genre")} type="button">
                    Genre <span>{getSortIndicator("genre")}</span>
                  </button>
                </th>
                <th>
                  <button className="table-sort-btn" onClick={() => handleSort("copyCode")} type="button">
                    Copy Code <span>{getSortIndicator("copyCode")}</span>
                  </button>
                </th>
                <th>
                  <button className="table-sort-btn" onClick={() => handleSort("status")} type="button">
                    Status <span>{getSortIndicator("status")}</span>
                  </button>
                </th>
                {canManageBook && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {displayedBooks.map((book) => (
                <tr key={book.id}>
                  <td>{book.id}</td>
                  <td>
                    {book.bookCoverUrl ? (
                      <img alt={`${book.title} cover`} className="book-cover-thumb" src={book.bookCoverUrl} />
                    ) : (
                      <span className="badge badge-muted">No cover</span>
                    )}
                  </td>
                  <td>{book.title}</td>
                  <td>{book.author}</td>
                  <td>
                    {book.genre ? (
                      <span className="badge" style={getGenreBadgeStyle(book.genre)}>
                        {book.genre}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>{book.copyCode || "-"}</td>
                  <td>
                    <span className={statusBadgeClass[book.status] || "badge badge-muted"}>
                      {book.status || "AVAILABLE"}
                    </span>
                  </td>
                  {canManageBook && (
                    <td>
                      <div className="inline-actions">
                        <button
                          aria-label="Edit book"
                          className="icon-btn icon-btn-edit"
                          onClick={() => handleStartEdit(book)}
                          title="Edit"
                          type="button"
                        >
                          ✎
                        </button>
                        {canManageBook && (
                          <button
                            aria-label="Delete book"
                            className="icon-btn icon-btn-delete"
                            onClick={() => setPendingDeleteId(book.id)}
                            title="Delete"
                            type="button"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {displayedBooks.length === 0 && (
                <tr>
                  <td className="empty-state" colSpan={canManageBook ? 8 : 7}>
                    No books available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="books-grid">
          {displayedBooks.map((book) => (
            <article className="book-grid-card card" key={book.id}>
              <div className="book-grid-cover-wrap">
                {book.bookCoverUrl ? (
                  <img alt={`${book.title} cover`} className="book-grid-cover" src={book.bookCoverUrl} />
                ) : (
                  <div className="book-grid-cover book-grid-cover-placeholder">
                    <span className="badge badge-muted">No cover</span>
                  </div>
                )}
              </div>
              <div className="book-grid-meta">
                <p className="book-grid-title">{book.title}</p>
                <p className="book-grid-author">{book.author}</p>
                <p className="book-grid-copy">#{book.id} • {book.copyCode || "No copy code"}</p>
                <div className="book-grid-tags">
                  {book.genre ? (
                    <span className="badge" style={getGenreBadgeStyle(book.genre)}>
                      {book.genre}
                    </span>
                  ) : (
                    <span className="badge badge-muted">No genre</span>
                  )}
                  <span className={statusBadgeClass[book.status] || "badge badge-muted"}>
                    {book.status || "AVAILABLE"}
                  </span>
                </div>
              </div>
              {canManageBook && (
                <div className="inline-actions">
                  <button
                    aria-label="Edit book"
                    className="icon-btn icon-btn-edit"
                    onClick={() => handleStartEdit(book)}
                    title="Edit"
                    type="button"
                  >
                    ✎
                  </button>
                  <button
                    aria-label="Delete book"
                    className="icon-btn icon-btn-delete"
                    onClick={() => setPendingDeleteId(book.id)}
                    title="Delete"
                    type="button"
                  >
                    ×
                  </button>
                </div>
              )}
            </article>
          ))}
          {displayedBooks.length === 0 && (
            <div className="card empty-state">No books available</div>
          )}
        </div>
      )}

      <ConfirmModal
        cancelText="Cancel"
        confirmText="Delete"
        message="This book will be removed permanently."
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={confirmDeleteBook}
        open={Boolean(pendingDeleteId)}
        title="Delete book?"
      />

      {showEditModal && (
        <div className="modal-backdrop" onClick={handleCloseEditModal}>
          <div className="modal-card book-edit-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Edit Book</h3>
            <form className="form-container" onSubmit={handleCreateBook}>
              <div className="form-grid books-form-grid">
                <div className="form-field">
                  <label htmlFor="editTitle">Title</label>
                  <input
                    id="editTitle"
                    name="title"
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    required
                    value={formData.title}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="editAuthor">Author</label>
                  <input
                    id="editAuthor"
                    name="author"
                    onChange={(e) => setFormData((prev) => ({ ...prev, author: e.target.value }))}
                    required
                    value={formData.author}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="editGenre">Genre</label>
                  <select
                    id="editGenre"
                    name="genre"
                    onChange={(e) => setFormData((prev) => ({ ...prev, genre: e.target.value }))}
                    required
                    value={formData.genre}
                  >
                    <option value="">Select genre</option>
                    {genreOptions.map((genre) => (
                      <option key={genre} value={genre}>
                        {genre}
                      </option>
                    ))}
                    {formData.genre && !genreOptions.includes(formData.genre) && (
                      <option value={formData.genre}>{formData.genre}</option>
                    )}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="editBookCover">Book Cover</label>
                  <input
                    accept="image/*"
                    id="editBookCover"
                    onChange={handleCoverFileChange}
                    type="file"
                  />
                  {formData.bookCoverUrl ? (
                    <div className="book-cover-preview-wrap">
                      <img alt="Book cover preview" className="book-cover-preview" src={formData.bookCoverUrl} />
                      <button
                        className="btn-outline"
                        onClick={() => setFormData((prev) => ({ ...prev, bookCoverUrl: "" }))}
                        type="button"
                      >
                        Remove cover
                      </button>
                    </div>
                  ) : (
                    <p className="notice notice-info">No cover selected</p>
                  )}
                </div>
              </div>
              {formError && <p className="notice notice-error">{formError}</p>}
              <div className="modal-actions">
                <button className="btn-outline" onClick={handleCloseEditModal} type="button">Cancel</button>
                <button className="btn-primary" type="submit">Update Book</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default Books;
