import { useCallback, useContext, useEffect, useState } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

function MyBooks() {
  const { user } = useContext(AuthContext);
  const [activeAssignments, setActiveAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [renewingId, setRenewingId] = useState(null);

  const fetchMyBooks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/assignments/my");

      if (!Array.isArray(res.data)) {
        throw new Error("Unexpected assignments response format");
      }

      setActiveAssignments(res.data);
    } catch (err) {
      setError("Failed to fetch active assignments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "USER") {
      fetchMyBooks();
    } else {
      setLoading(false);
    }
  }, [fetchMyBooks, user?.role]);

  const handleRenewBook = async (assignmentId) => {
    try {
      setRenewingId(assignmentId);
      await api.post(`/assignments/${assignmentId}/renew`);
      setMessage("Book renewed for 7 days");
      await fetchMyBooks();
    } catch (err) {
      const backendMessage = err.response?.data?.message;
      setMessage(Array.isArray(backendMessage) ? backendMessage.join(", ") : backendMessage || "Renew failed");
    } finally {
      setRenewingId(null);
    }
  };

  if (user?.role !== "USER") {
    return <p className="notice notice-error">This page is only accessible to users</p>;
  }

  if (loading) return <p>Loading assigned books...</p>;
  if (error) return <p className="notice notice-error">{error}</p>;

  return (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <h2 className="page-title">My Assigned Books</h2>
          <p className="page-subtitle">Track active books, due dates, and renewals</p>
        </div>
      </div>

      {message && <p className="notice notice-info">{message}</p>}

      <div className="table-wrap card">
        <table className="table">
          <thead>
            <tr>
              <th>Assignment ID</th>
              <th>Book Title</th>
              <th>Book Author</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Renew Count</th>
              <th>Overdue Days</th>
              <th>Fine (₹)</th>
              <th>Renew</th>
            </tr>
          </thead>
          <tbody>
            {activeAssignments.map((assignment) => {
              const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
              const today = new Date();
              today.setHours(0, 0, 0, 0);

              const dueDateOnly = dueDate ? new Date(dueDate) : null;
              if (dueDateOnly) dueDateOnly.setHours(0, 0, 0, 0);

              const isOverdue = dueDateOnly ? dueDateOnly < today : false;
              const overdueDays = assignment.overdueDays ?? (() => {
                if (!dueDateOnly) return 0;
                const diffTime = today.getTime() - dueDateOnly.getTime();
                return diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;
              })();

              const fine = assignment.fine ?? assignment.fineAmount ?? (overdueDays * 50);
              const renewCount = assignment.renewCount ?? 0;
              const renewDisabled = isOverdue || renewCount >= 2 || renewingId === assignment.id;

              return (
                <tr className={isOverdue ? "overdue-row" : ""} key={assignment.id}>
                  <td>{assignment.id}</td>
                  <td>{assignment.book?.title || "-"}</td>
                  <td>{assignment.book?.author || "-"}</td>
                  <td>{dueDate ? dueDate.toLocaleDateString() : "-"}</td>
                  <td>
                    <span className={isOverdue ? "badge badge-danger" : "badge badge-success"}>
                      {isOverdue ? "Overdue" : "Active"}
                    </span>
                  </td>
                  <td>{renewCount}</td>
                  <td>{overdueDays}</td>
                  <td>
                    {fine > 0 ? <span className="badge badge-warning">₹{fine}</span> : <span className="badge badge-success">₹0</span>}
                  </td>
                  <td>
                    <button
                      aria-label="Renew book"
                      className="icon-btn icon-btn-renew"
                      disabled={renewDisabled}
                      onClick={() => handleRenewBook(assignment.id)}
                      title={renewingId === assignment.id ? "Renewing..." : "Renew"}
                      type="button"
                    >
                      {renewingId === assignment.id ? "…" : "⟲"}
                    </button>
                  </td>
                </tr>
              );
            })}
            {activeAssignments.length === 0 && (
              <tr>
                <td className="empty-state" colSpan={9}>No active assignments</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default MyBooks;
