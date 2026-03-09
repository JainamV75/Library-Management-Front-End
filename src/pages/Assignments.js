import { useCallback, useContext, useEffect, useState } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import ConfirmModal from "../components/ConfirmModal";

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

function Assignments() {
  const { user } = useContext(AuthContext);
  const canMonitorLibraryAssignments = user?.role === "ROOT" || user?.role === "LIBRARIAN";
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedBook, setSelectedBook] = useState("");
  const [libraryAssignments, setLibraryAssignments] = useState([]);
  const [copyCodeSearch, setCopyCodeSearch] = useState("");
  const [appliedCopyCodeSearch, setAppliedCopyCodeSearch] = useState("");
  const [bookFilters, setBookFilters] = useState({
    query: "",
    genre: "",
  });
  const [userFilters, setUserFilters] = useState({
    query: "",
    role: "",
  });
  const [bookSearchInfo, setBookSearchInfo] = useState("Search books by title, author, or copy code.");
  const [userSearchInfo, setUserSearchInfo] = useState("Search users by name, email, or ID.");
  const [returningAssignmentId, setReturningAssignmentId] = useState(null);
  const [pendingReturnId, setPendingReturnId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const fetchData = useCallback(async (copyCodeFilter = "") => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      const [usersRes, booksRes] = await Promise.all([api.get("/users"), api.get("/books")]);

      const usersData = Array.isArray(usersRes.data)
        ? usersRes.data
        : Array.isArray(usersRes.data?.items)
          ? usersRes.data.items
          : null;
      const booksData = Array.isArray(booksRes.data) ? booksRes.data : null;

      if (!usersData || !booksData) {
        throw new Error("Unexpected API response format");
      }

      setUsers(usersData);
      setBooks(booksData);
      setUserSearchInfo(`Showing all ${usersData.length} user(s). Use filters to narrow results.`);
      setBookSearchInfo(`Showing all ${booksData.length} book(s). Use filters to narrow results.`);

      if (canMonitorLibraryAssignments) {
        try {
          const params = {};
          if (copyCodeFilter.trim()) params.copyCode = copyCodeFilter.trim();
          const libraryAssignmentsRes = await api.get("/assignments/library", { params });
          setLibraryAssignments(Array.isArray(libraryAssignmentsRes.data) ? libraryAssignmentsRes.data : []);
        } catch (err) {
          const backendMessage = err.response?.data?.message;
          setLibraryAssignments([]);
          setMessage(
            Array.isArray(backendMessage)
              ? backendMessage.join(", ")
              : backendMessage || "Could not load library assignments"
          );
        }
      } else {
        setLibraryAssignments([]);
      }
    } catch (err) {
      const backendMessage = err.response?.data?.message;
      setError(
        Array.isArray(backendMessage)
          ? backendMessage.join(", ")
          : backendMessage || "Failed to load data"
      );
    } finally {
      setLoading(false);
    }
  }, [canMonitorLibraryAssignments]);

  useEffect(() => {
    fetchData(appliedCopyCodeSearch);
  }, [fetchData, appliedCopyCodeSearch]);

  const handleLibrarySearchSubmit = (e) => {
    e.preventDefault();
    setAppliedCopyCodeSearch(copyCodeSearch);
  };

  const handleClearLibrarySearch = () => {
    setCopyCodeSearch("");
    setAppliedCopyCodeSearch("");
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!selectedUser || !selectedBook) {
      setMessage("Select both user and book");
      return;
    }

    try {
      await api.post("/assignments", {
        userId: Number(selectedUser),
        bookId: Number(selectedBook),
      });

      setSelectedUser("");
      setSelectedBook("");
      setMessage("Book assigned successfully");
      await fetchData(appliedCopyCodeSearch);
    } catch (err) {
      const backendMessage = err.response?.data?.message;
      setMessage(
        Array.isArray(backendMessage)
          ? backendMessage.join(", ")
          : backendMessage || "Assignment failed"
      );
    }
  };

  const fetchAssignableBooks = async (filters) => {
    try {
      const params = {};
      if (filters.query.trim()) params.q = filters.query.trim();
      if (filters.genre.trim()) params.genre = filters.genre.trim();

      const hasFilter = Object.keys(params).length > 0;
      if (!hasFilter) {
        const res = await api.get("/books");
        const booksData = Array.isArray(res.data) ? res.data : [];
        setBooks(booksData);
        setSelectedBook("");
        setBookSearchInfo(`Showing all ${booksData.length} book(s). Use filters to narrow results.`);
        return;
      }

      const res = await api.get("/books", { params });
      const booksData = Array.isArray(res.data) ? res.data : [];
      setBooks(booksData);
      setSelectedBook("");
      setBookSearchInfo(
        booksData.length > 0
          ? `Found ${booksData.length} matching book(s).`
          : "No books matched your search."
      );
    } catch (err) {
      setBooks([]);
      setSelectedBook("");
      const backendMessage = err.response?.data?.message;
      setBookSearchInfo(
        Array.isArray(backendMessage)
          ? backendMessage.join(", ")
          : backendMessage || "Failed to search books."
      );
    }
  };

  const fetchAssignableUsers = async (filters) => {
    try {
      const params = {};
      if (filters.query.trim()) params.q = filters.query.trim();
      if (filters.role.trim()) params.role = filters.role.trim();

      const hasFilter = Object.keys(params).length > 0;
      if (!hasFilter) {
        const res = await api.get("/users");
        const usersData = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.items)
            ? res.data.items
            : [];
        setUsers(usersData);
        setSelectedUser("");
        setUserSearchInfo(`Showing all ${usersData.length} user(s). Use filters to narrow results.`);
        return;
      }

      const res = await api.get("/users", { params });
      const usersData = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.items)
          ? res.data.items
          : [];
      setUsers(usersData);
      setSelectedUser("");
      setUserSearchInfo(
        usersData.length > 0
          ? `Found ${usersData.length} matching user(s).`
          : "No users matched your search."
      );
    } catch (err) {
      setUsers([]);
      setSelectedUser("");
      const backendMessage = err.response?.data?.message;
      setUserSearchInfo(
        Array.isArray(backendMessage)
          ? backendMessage.join(", ")
          : backendMessage || "Failed to search users."
      );
    }
  };

  const handleUserSearchSubmit = async () => {
    await fetchAssignableUsers(userFilters);
  };

  const handleClearUserSearch = async () => {
    setUserFilters({
      query: "",
      role: "",
    });
    await fetchAssignableUsers({ query: "", role: "" });
  };

  const handleBookSearchSubmit = async () => {
    await fetchAssignableBooks(bookFilters);
  };

  const handleClearBookSearch = async () => {
    setBookFilters({
      query: "",
      genre: "",
    });
    await fetchAssignableBooks({ query: "", genre: "" });
  };

  const confirmReturnAssignment = async () => {
    if (!pendingReturnId) return;
    try {
      setReturningAssignmentId(pendingReturnId);
      await api.post(`/assignments/${pendingReturnId}/return`);
      setMessage("Assignment returned successfully");
      setPendingReturnId(null);
      await fetchData(appliedCopyCodeSearch);
    } catch (err) {
      const backendMessage = err.response?.data?.message;
      setMessage(
        Array.isArray(backendMessage)
          ? backendMessage.join(", ")
          : backendMessage || "Return failed"
      );
      setPendingReturnId(null);
    } finally {
      setReturningAssignmentId(null);
    }
  };

  if (user?.role === "USER") {
    return <p className="notice notice-error">You are not authorized to assign books</p>;
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="notice notice-error">{error}</p>;

  return (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <h2 className="page-title">Assignments</h2>
          <p className="page-subtitle">Assign books and monitor assignment records</p>
        </div>
      </div>

      <form className="form-container" onSubmit={handleAssign}>
        <div className="form-field">
          <label>Find User</label>
          <div className="filter-row assignment-user-search-row">
            <input
              placeholder="Search by name, email, or user ID"
              value={userFilters.query}
              onChange={(e) => setUserFilters((prev) => ({ ...prev, query: e.target.value }))}
            />
            <select
              value={userFilters.role}
              onChange={(e) => setUserFilters((prev) => ({ ...prev, role: e.target.value }))}
            >
              <option value="">Any role</option>
              <option value="USER">USER</option>
              {user?.role === "ROOT" && <option value="LIBRARIAN">LIBRARIAN</option>}
            </select>
            <button className="btn-primary" type="button" onClick={handleUserSearchSubmit}>
              Search Users
            </button>
            <button className="btn-outline" type="button" onClick={handleClearUserSearch}>
              Clear
            </button>
          </div>
          <p className="notice notice-info">{userSearchInfo}</p>
        </div>

        <div className="form-field">
          <label>Find Book</label>
          <div className="filter-row assignment-book-search-row">
            <input
              placeholder="Search by title, author, or copy code"
              value={bookFilters.query}
              onChange={(e) => setBookFilters((prev) => ({ ...prev, query: e.target.value }))}
            />
            <select
              value={bookFilters.genre}
              onChange={(e) => setBookFilters((prev) => ({ ...prev, genre: e.target.value }))}
            >
              <option value="">Any genre</option>
              {genreOptions.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
            <button className="btn-primary" type="button" onClick={handleBookSearchSubmit}>
              Search Book
            </button>
            <button className="btn-outline" type="button" onClick={handleClearBookSearch}>
              Clear
            </button>
          </div>
          <p className="notice notice-info">{bookSearchInfo}</p>
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="assignmentUser">Select User</label>
            <select id="assignmentUser" onChange={(e) => setSelectedUser(e.target.value)} value={selectedUser}>
              <option value="">Select User</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="assignmentBook">Select Book</label>
            <select id="assignmentBook" onChange={(e) => setSelectedBook(e.target.value)} value={selectedBook}>
              <option value="">Select Book</option>
              {books.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.title} - {book.author}
                  {book.genre ? ` (${book.genre})` : ""}
                  {book.copyCode ? ` [${book.copyCode}]` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-actions">
          <button className="btn-primary" type="submit">Assign Book</button>
        </div>
        {message && <p className="notice notice-info">{message}</p>}
      </form>

      {canMonitorLibraryAssignments && (
        <section className="card">
          <div className="page-header">
            <h3>Library Assignments</h3>
            <form className="filter-row assignment-search-row" onSubmit={handleLibrarySearchSubmit}>
              <input
                placeholder="Search by Copy Code"
                value={copyCodeSearch}
                onChange={(e) => setCopyCodeSearch(e.target.value)}
              />
              <button className="btn-primary" type="submit">Search</button>
              <button className="btn-outline" onClick={handleClearLibrarySearch} type="button">Clear</button>
            </form>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Book</th>
                  <th>Copy Code</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Renew Count</th>
                  <th>Fine (₹)</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {libraryAssignments.map((assignment) => {
                  const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
                  const isOverdue = !assignment.returned && dueDate ? dueDate < new Date() : false;

                  return (
                    <tr className={isOverdue ? "overdue-row" : ""} key={assignment.id}>
                      <td>{assignment.id}</td>
                      <td>{assignment.user?.name || "-"}</td>
                      <td>{assignment.book?.title || "-"}</td>
                      <td>{assignment.book?.copyCode || "-"}</td>
                      <td>
                        {dueDate ? dueDate.toLocaleDateString() : "-"}
                        {isOverdue ? <span className="badge badge-danger badge-inline">Overdue</span> : null}
                      </td>
                      <td>
                        <span className={assignment.returned ? "badge badge-muted" : "badge badge-success"}>
                          {assignment.returned ? "Returned" : "Active"}
                        </span>
                      </td>
                      <td>{assignment.renewCount ?? 0}</td>
                      <td>{assignment.fineAmount ?? 0}</td>
                      <td>
                        {!assignment.returned ? (
                          <button
                            aria-label="Return assignment"
                            className="icon-btn icon-btn-return"
                            disabled={returningAssignmentId === assignment.id}
                            onClick={() => setPendingReturnId(assignment.id)}
                            title={returningAssignmentId === assignment.id ? "Returning..." : "Return"}
                            type="button"
                          >
                            {returningAssignmentId === assignment.id ? "…" : "↶"}
                          </button>
                        ) : (
                          <span className="badge badge-muted">Completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {libraryAssignments.length === 0 && (
                  <tr>
                    <td className="empty-state" colSpan={9}>No assignments yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <ConfirmModal
        cancelText="Cancel"
        confirmText="Return"
        message="This will mark the assignment as returned."
        onCancel={() => setPendingReturnId(null)}
        onConfirm={confirmReturnAssignment}
        open={Boolean(pendingReturnId)}
        title="Return book?"
      />
    </section>
  );
}

export default Assignments;
