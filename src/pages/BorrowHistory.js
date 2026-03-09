import { useCallback, useContext, useEffect, useState } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

function BorrowHistory() {
  const { user } = useContext(AuthContext);
  const [historyAssignments, setHistoryAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/assignments/history");
      if (!Array.isArray(res.data)) {
        throw new Error("Unexpected assignment history response format");
      }
      setHistoryAssignments(res.data);
    } catch (err) {
      setError("Failed to fetch borrow history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "USER") {
      fetchHistory();
    } else {
      setLoading(false);
    }
  }, [fetchHistory, user?.role]);

  if (user?.role !== "USER") {
    return <p className="notice notice-error">This page is only accessible to users</p>;
  }

  if (loading) return <p>Loading borrow history...</p>;
  if (error) return <p className="notice notice-error">{error}</p>;

  return (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <h2 className="page-title">Borrow History</h2>
          <p className="page-subtitle">View all issued and returned books with fine details</p>
        </div>
      </div>

      <section className="card">
        <p className="page-subtitle">
          Fine payment status is not tracked yet. Displayed amount is the fine charged on return.
        </p>
      </section>

      <div className="table-wrap card">
        <table className="table">
          <thead>
            <tr>
              <th>Assignment ID</th>
              <th>Book</th>
              <th>Genre</th>
              <th>Copy Code</th>
              <th>Issued On</th>
              <th>Due Date</th>
              <th>Returned On</th>
              <th>Status</th>
              <th>Renew Count</th>
              <th>Fine Charged (₹)</th>
            </tr>
          </thead>
          <tbody>
            {historyAssignments.map((assignment) => {
              const isReturned = Boolean(assignment.returned);
              const assignedAt = assignment.assignedAt ? new Date(assignment.assignedAt) : null;
              const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
              const returnedAt = assignment.returnedAt ? new Date(assignment.returnedAt) : null;
              const isOverdueActive = !isReturned && dueDate ? dueDate < new Date() : false;

              return (
                <tr className={isOverdueActive ? "overdue-row" : ""} key={`history-${assignment.id}`}>
                  <td>{assignment.id}</td>
                  <td>{assignment.book?.title || "-"}</td>
                  <td>{assignment.book?.genre || "-"}</td>
                  <td>{assignment.book?.copyCode || "-"}</td>
                  <td>{assignedAt ? assignedAt.toLocaleDateString() : "-"}</td>
                  <td>{dueDate ? dueDate.toLocaleDateString() : "-"}</td>
                  <td>{returnedAt ? returnedAt.toLocaleDateString() : "-"}</td>
                  <td>
                    <span
                      className={
                        isReturned
                          ? "badge badge-muted"
                          : isOverdueActive
                            ? "badge badge-danger"
                            : "badge badge-success"
                      }
                    >
                      {isReturned ? "Returned" : isOverdueActive ? "Overdue" : "Active"}
                    </span>
                  </td>
                  <td>{assignment.renewCount ?? 0}</td>
                  <td>{assignment.fineAmount ?? 0}</td>
                </tr>
              );
            })}
            {historyAssignments.length === 0 && (
              <tr>
                <td className="empty-state" colSpan={10}>No borrow history yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default BorrowHistory;
