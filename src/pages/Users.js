import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import ConfirmModal from "../components/ConfirmModal";

const roleBadgeClass = {
  ROOT: "badge badge-danger",
  LIBRARIAN: "badge badge-info",
  USER: "badge badge-success",
};

function Users() {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER",
  });
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  const canCreateUser = user?.role === "ROOT" || user?.role === "LIBRARIAN";
  const canDeleteUser = user?.role === "ROOT" || user?.role === "LIBRARIAN";
  const availableRoles = user?.role === "ROOT" ? ["USER", "LIBRARIAN"] : ["USER"];
  const displayedUsers = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) {
      return users;
    }

    const sorted = [...users];
    sorted.sort((a, b) => {
      let valueA;
      let valueB;

      if (sortConfig.key === "id") {
        valueA = a.id ?? 0;
        valueB = b.id ?? 0;
      } else if (sortConfig.key === "name") {
        valueA = (a.name || "").toLowerCase();
        valueB = (b.name || "").toLowerCase();
      } else {
        valueA = (a.email || "").toLowerCase();
        valueB = (b.email || "").toLowerCase();
      }

      if (valueA < valueB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valueA > valueB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [sortConfig.direction, sortConfig.key, users]);

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

  const fetchUsers = useCallback(async (query = "") => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (query.trim()) {
        params.q = query.trim();
      }
      const res = await api.get("/users", { params });
      if (!Array.isArray(res.data)) {
        throw new Error("Unexpected users response format");
      }
      setUsers(res.data);
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(appliedSearchQuery);
  }, [fetchUsers, appliedSearchQuery]);

  useEffect(() => {
    if (user?.role === "LIBRARIAN" && formData.role !== "USER") {
      setFormData((prev) => ({ ...prev, role: "USER" }));
    }
  }, [formData.role, user?.role]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError(null);
    setFormSuccess(null);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setFormError("Please fill all fields.");
      return;
    }

    try {
      await api.post("/users/create-user", {
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim(),
      });

      setShowForm(false);
      setFormData({ name: "", email: "", password: "", role: "USER" });
      await fetchUsers(appliedSearchQuery);
      setFormSuccess("User created successfully.");
    } catch (err) {
      setFormError(getErrorMessage(err) || "Error creating user");
    }
  };

  const confirmDeleteUser = async () => {
    if (!pendingDeleteId) return;
    try {
      await api.delete(`/users/${pendingDeleteId}`);
      setPendingDeleteId(null);
      await fetchUsers(appliedSearchQuery);
    } catch (err) {
      setFormError(getErrorMessage(err) || "Delete failed");
      setPendingDeleteId(null);
    }
  };

  if (loading) {
    return <p>Loading users...</p>;
  }

  if (error) {
    return <p className="notice notice-error">Error: {error}</p>;
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setAppliedSearchQuery(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setAppliedSearchQuery("");
  };

  return (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <h2 className="page-title">Users</h2>
          <p className="page-subtitle">Manage users under your role permissions</p>
        </div>
        {canCreateUser && (
          <button
            className={showForm ? "btn-secondary" : "btn-primary"}
            onClick={() => {
              setShowForm((prev) => !prev);
              setFormError(null);
              setFormSuccess(null);
            }}
            type="button"
          >
            {showForm ? "Cancel" : "Create User"}
          </button>
        )}
      </div>

      {formSuccess && <p className="notice notice-success">{formSuccess}</p>}
      {formError && <p className="notice notice-error">{formError}</p>}

      <form className="card filter-row assignment-search-row" onSubmit={handleSearchSubmit}>
        <input
          placeholder="Search by ID, name, or email"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button className="btn-primary" type="submit">Search</button>
        <button className="btn-outline" onClick={handleClearSearch} type="button">Clear</button>
      </form>

      {canCreateUser && showForm && (
        <form className="form-container" onSubmit={handleCreateUser}>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="name">Name</label>
              <input id="name" name="name" onChange={handleInputChange} required value={formData.name} />
            </div>
            <div className="form-field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" onChange={handleInputChange} required type="email" value={formData.email} />
            </div>
            <div className="form-field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" onChange={handleInputChange} required type="password" value={formData.password} />
            </div>
            <div className="form-field">
              <label htmlFor="role">Role</label>
              <select id="role" name="role" onChange={handleInputChange} required value={formData.role}>
                {availableRoles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn-primary" type="submit">Submit</button>
          </div>
        </form>
      )}

      <div className="table-wrap card">
        <table className="table">
          <thead>
            <tr>
              <th>
                <button className="table-sort-btn" onClick={() => handleSort("id")} type="button">
                  ID <span>{getSortIndicator("id")}</span>
                </button>
              </th>
              <th>
                <button className="table-sort-btn" onClick={() => handleSort("name")} type="button">
                  Name <span>{getSortIndicator("name")}</span>
                </button>
              </th>
              <th>
                <button className="table-sort-btn" onClick={() => handleSort("email")} type="button">
                  Email <span>{getSortIndicator("email")}</span>
                </button>
              </th>
              <th>Role</th>
              <th>Parent ID</th>
              {canDeleteUser && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {displayedUsers.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span className={roleBadgeClass[u.role] || "badge badge-muted"}>{u.role}</span>
                </td>
                <td>{u.parent?.id ?? "-"}</td>
                {canDeleteUser && (
                  <td>
                    {u.role !== "ROOT" && u.id !== user?.userId ? (
                      <button
                        aria-label="Delete user"
                        className="icon-btn icon-btn-delete"
                        onClick={() => setPendingDeleteId(u.id)}
                        title="Delete"
                        type="button"
                      >
                        ×
                      </button>
                    ) : (
                      <span className="badge badge-muted">Protected</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {displayedUsers.length === 0 && (
              <tr>
                <td className="empty-state" colSpan={canDeleteUser ? 6 : 5}>
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        cancelText="Cancel"
        confirmText="Delete"
        message="This user will be removed permanently."
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={confirmDeleteUser}
        open={Boolean(pendingDeleteId)}
        title="Delete user?"
      />
    </section>
  );
}

const getErrorMessage = (err) => {
  const message = err?.response?.data?.message;
  if (Array.isArray(message)) {
    return message.join(", ");
  }
  return message || err?.message;
};

export default Users;
