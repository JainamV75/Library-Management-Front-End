import { useEffect, useState } from "react";
import api from "../api/axios";

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get("/audit/logs?limit=200");
        setLogs(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        const msg = err.response?.data?.message;
        setError(Array.isArray(msg) ? msg.join(", ") : msg || "Failed to load logs");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  if (loading) return <p>Loading audit logs...</p>;
  if (error) return <p className="notice notice-error">{error}</p>;

  return (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <h2 className="page-title">Audit Logs</h2>
          <p className="page-subtitle">Recent activity across users, books, and assignments</p>
        </div>
      </div>

      <div className="table-wrap card">
        <table className="table">
          <thead>
            <tr>
              <th>When</th>
              <th>Action</th>
              <th>Actor</th>
              <th>Entity</th>
              <th>Entity ID</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.createdAt).toLocaleString()}</td>
                <td>{log.action}</td>
                <td>{log.actorRole || "-"} #{log.actorId || "-"}</td>
                <td>{log.entityType}</td>
                <td>{log.entityId || "-"}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td className="empty-state" colSpan={5}>No logs found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AuditLogs;
