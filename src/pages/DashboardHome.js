import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

function DonutGraphCard({ title, items }) {
  const total = Math.max(items.reduce((sum, item) => sum + item.value, 0), 1);
  const radius = 44;
  const stroke = 16;
  const center = 60;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <article className="card graph-card">
      <p className="graph-title">{title}</p>
      <div className="graph-donut-layout">
        <svg className="donut-graph" height="120" viewBox="0 0 120 120" width="120">
          <circle
            className="donut-base-ring"
            cx={center}
            cy={center}
            fill="none"
            r={radius}
            strokeWidth={stroke}
          />
          {items.map((item) => {
            const ratio = item.value / total;
            const dashLength = ratio * circumference;
            const dashOffset = circumference - cumulative;
            cumulative += dashLength;
            return (
              <circle
                className="donut-segment"
                cx={center}
                cy={center}
                fill="none"
                key={item.label}
                r={radius}
                stroke={item.color}
                strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="butt"
                strokeWidth={stroke}
                transform={`rotate(-90 ${center} ${center})`}
              />
            );
          })}
          <text className="donut-total" textAnchor="middle" x={center} y={center}>
            {total}
          </text>
          <text className="donut-total-sub" textAnchor="middle" x={center} y={center + 14}>
            Total
          </text>
        </svg>
        <div className="kpi-stack">
          {items.map((item) => (
            <article className="kpi-mini-card" key={item.label}>
              <div className="kpi-mini-head">
                <span className="graph-legend-dot" style={{ background: item.color }} />
                <span>{item.label === "LIBRARIAN" ? "Librarians" : `${item.label} Users`}</span>
              </div>
              <strong className="kpi-mini-value">{item.value}</strong>
            </article>
          ))}
        </div>
      </div>
    </article>
  );
}

function MiniIcon({ kind }) {
  if (kind === "AVAILABLE") {
    return (
      <svg aria-hidden="true" className="mini-kpi-icon" fill="none" viewBox="0 0 24 24">
        <path d="M4 12h16M12 4v16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" className="mini-kpi-icon" fill="none" viewBox="0 0 24 24">
      <path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="2" />
      <path d="M8 10h8" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function BooksStatCard({ label, value, color }) {
  return (
    <article className="book-kpi-card">
      <div className="book-kpi-head">
        <span className="book-kpi-icon" style={{ color }}>
          <MiniIcon kind={label} />
        </span>
        <span className="book-kpi-label">
          {label === "AVAILABLE" ? "Available Books" : "Borrowed Books"}
        </span>
      </div>
      <strong className="book-kpi-value">{value}</strong>
    </article>
  );
}

function StackedGraphCard({ title, items }) {
  const total = Math.max(items.reduce((sum, item) => sum + item.value, 0), 1);
  const available = items.find((item) => item.label === "AVAILABLE");
  const borrowed = items.find((item) => item.label === "BORROWED");

  return (
    <article className="card graph-card">
      <p className="graph-title">{title}</p>
      <div className="stacked-graph-track">
        {items.map((item) => {
          const width = `${(item.value / total) * 100}%`;
          return (
            <div
              className="stacked-graph-segment"
              key={item.label}
              style={{ width, background: item.color }}
              title={`${item.label}: ${item.value}`}
            />
          );
        })}
      </div>
      <div className="book-kpi-grid">
        {available && (
          <BooksStatCard color={available.color} label="AVAILABLE" value={available.value} />
        )}
        {borrowed && (
          <BooksStatCard color={borrowed.color} label="BORROWED" value={borrowed.value} />
        )}
      </div>
    </article>
  );
}

function LineGraphCard({ title, points }) {
  const width = 340;
  const height = 170;
  const paddingX = 16;
  const chartTop = 16;
  const chartBottom = 138;
  const maxValue = Math.max(...points.map((item) => item.value), 1);
  const xStep = points.length > 1 ? (width - paddingX * 2) / (points.length - 1) : 0;

  const getX = (index) => paddingX + index * xStep;
  const getY = (value) => chartBottom - (value / maxValue) * (chartBottom - chartTop);

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${getX(index)} ${getY(point.value)}`)
    .join(" ");

  return (
    <article className="card graph-card">
      <p className="graph-title">{title}</p>
      <svg className="line-graph" viewBox={`0 0 ${width} ${height}`}>
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
          const y = chartBottom - tick * (chartBottom - chartTop);
          return <line className="line-grid" key={tick} x1={paddingX} x2={width - paddingX} y1={y} y2={y} />;
        })}
        <path className="line-path" d={linePath} />
        {points.map((point, index) => (
          <g key={point.label}>
            <circle className="line-dot" cx={getX(index)} cy={getY(point.value)} r="4" />
            <text className="line-value-label" textAnchor="middle" x={getX(index)} y={getY(point.value) - 8}>
              {point.value}
            </text>
            <text
              className="line-axis-label"
              textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"}
              x={getX(index)}
              y={height - 10}
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>
      <div className="graph-legend compact">
        {points.map((point) => (
          <div className="graph-legend-row" key={point.label}>
            <span>{point.label}</span>
            <strong>{point.value}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}

function DashboardHome() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [displayName, setDisplayName] = useState("-");
  const [libraryName, setLibraryName] = useState("");
  const [insights, setInsights] = useState(null);
  const [insightsError, setInsightsError] = useState(null);

  const roleCards = {
    ROOT: [
      "Create and manage librarians and users",
      "Maintain complete catalog and copies",
      "Review assignment lifecycle and fines",
      "Monitor overall library performance",
    ],
    LIBRARIAN: [
      "Manage users under library policy",
      "Issue books and handle assignment flow",
      "Track due dates and overdue risk",
      "Coordinate return operations efficiently",
    ],
    USER: [
      "Track active books and due dates",
      "Monitor overdue status and fine visibility",
      "Renew eligible books before due date",
      "Review complete borrow history records",
    ],
  };

  const roleActions = {
    ROOT: [
      { label: "Manage Users", to: "/dashboard/users" },
      { label: "Manage Books", to: "/dashboard/books" },
      { label: "Assignments", to: "/dashboard/assignments" },
      { label: "Audit Logs", to: "/dashboard/audit" },
    ],
    LIBRARIAN: [
      { label: "Manage Users", to: "/dashboard/users" },
      { label: "Manage Books", to: "/dashboard/books" },
      { label: "Assignments", to: "/dashboard/assignments" },
    ],
    USER: [
      { label: "My Books", to: "/dashboard/my-books" },
      { label: "Borrow History", to: "/dashboard/borrow-history" },
      { label: "Browse Books", to: "/dashboard/books" },
    ],
  };

  const cards = roleCards[user?.role] || ["Welcome"];
  const actions = roleActions[user?.role] || [{ label: "Dashboard", to: "/dashboard" }];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/users/me");
        setDisplayName(res.data?.name || "-");
        setLibraryName(res.data?.libraryName || "");
      } catch (error) {
        setDisplayName("-");
        setLibraryName("");
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/dashboard/stats");
        setStats(res.data);
      } catch (error) {
        setStats(null);
      }
    };

    if (user?.role === "ROOT") {
      fetchStats();
    }
  }, [user?.role]);

  useEffect(() => {
    const fetchInsights = async () => {
      if (user?.role !== "ROOT" && user?.role !== "LIBRARIAN") {
        setInsights(null);
        setInsightsError(null);
        return;
      }

      try {
        setInsightsError(null);
        const [usersRes, booksRes, assignmentsRes] = await Promise.all([
          api.get("/users"),
          api.get("/books"),
          api.get("/assignments/library"),
        ]);

        const usersData = Array.isArray(usersRes.data)
          ? usersRes.data
          : Array.isArray(usersRes.data?.items)
            ? usersRes.data.items
            : [];
        const booksData = Array.isArray(booksRes.data) ? booksRes.data : [];
        const assignmentsData = Array.isArray(assignmentsRes.data) ? assignmentsRes.data : [];

        const usersByRole = { ROOT: 0, LIBRARIAN: 0, USER: 0 };
        usersData.forEach((entry) => {
          const role = entry?.role;
          if (usersByRole[role] !== undefined) {
            usersByRole[role] += 1;
          }
        });

        const booksByStatus = { AVAILABLE: 0, BORROWED: 0, LOST: 0 };
        booksData.forEach((entry) => {
          const status = entry?.status || "AVAILABLE";
          if (booksByStatus[status] !== undefined) {
            booksByStatus[status] += 1;
          }
        });

        const assignmentHealth = { Active: 0, Returned: 0, Overdue: 0 };
        const now = new Date();
        assignmentsData.forEach((entry) => {
          if (entry?.returned) {
            assignmentHealth.Returned += 1;
            return;
          }

          const dueDate = entry?.dueDate ? new Date(entry.dueDate) : null;
          if (dueDate && dueDate < now) {
            assignmentHealth.Overdue += 1;
            return;
          }

          assignmentHealth.Active += 1;
        });

        setInsights({
          usersByRole,
          booksByStatus,
          assignmentHealth,
        });
      } catch (error) {
        setInsights(null);
        setInsightsError("Graphs unavailable right now.");
      }
    };

    fetchInsights();
  }, [user?.role]);

  const roleDescription = useMemo(() => {
    if (user?.role === "ROOT") {
      return "Library owner controls users, books, assignments, and operational visibility.";
    }
    if (user?.role === "LIBRARIAN") {
      return "Operations manager handles users and circulation activity within the library.";
    }
    if (user?.role === "USER") {
      return "Member workspace tracks issued books, renewals, due dates, and history.";
    }
    return "Welcome to your library workspace.";
  }, [user?.role]);

  return (
    <section className="page-shell">
      <section className="dashboard-hero card">
        <div className="dashboard-hero-header">
          <div>
            <h2 className="page-title dashboard-hero-title">Welcome back, {displayName}</h2>
            <p className="page-subtitle">
              You are logged in as <strong>{user?.role || "-"}</strong>.
            </p>
            <p className="dashboard-hero-description">{roleDescription}</p>
          </div>
          <div className="dashboard-hero-badges">
            <span className="badge badge-info">User #{user?.userId || "-"}</span>
            {user?.role === "ROOT" ? (
              <span className="badge badge-warning">
                Library: {libraryName || "-"} (ID: #{user?.libraryId || "-"})
              </span>
            ) : (
              <span className="badge badge-warning">
                Library: {libraryName || `#${user?.libraryId || "-"}`}
              </span>
            )}
            <span className="badge badge-success">Session Active</span>
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="page-header">
          <div>
            <h3 className="page-title">Quick Actions</h3>
            <p className="page-subtitle">Open the most used areas for your role.</p>
          </div>
        </div>
        <div className="quick-actions-grid">
          {actions.map((action) => (
            <Link className="quick-action-card card" key={`${action.to}-${action.label}`} to={action.to}>
              <p className="quick-action-title">{action.label}</p>
              <p className="quick-action-subtitle">Open</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="stats-grid">
        <article className="card">
          <p className="stat-label">User ID</p>
          <p className="stat-value">{user?.userId || "-"}</p>
        </article>
        <article className="card">
          <p className="stat-label">Role</p>
          <p className="stat-value">{user?.role || "-"}</p>
        </article>
        <article className="card">
          <p className="stat-label">{user?.role === "ROOT" ? "Library (Name + ID)" : "Library"}</p>
          <p className="stat-value">
            {user?.role === "ROOT"
              ? `${libraryName || "-"} (ID: #${user?.libraryId || "-"})`
              : (libraryName || `#${user?.libraryId || "-"}`)}
          </p>
        </article>
        <article className="card">
          <p className="stat-label">Session</p>
          <p className="stat-value">Active</p>
        </article>
      </div>

      {user?.role === "ROOT" && stats && (
        <section className="dashboard-section">
          <div className="page-header">
            <div>
              <h3 className="page-title">Library Snapshot</h3>
              <p className="page-subtitle">Live metrics for current library scope.</p>
            </div>
          </div>
          <div className="stats-grid">
            <article className="card">
              <p className="stat-label">Total Users</p>
              <p className="stat-value">{stats.totalUsers}</p>
            </article>
            <article className="card">
              <p className="stat-label">Total Books</p>
              <p className="stat-value">{stats.totalBooks}</p>
            </article>
            <article className="card">
              <p className="stat-label">Active Assignments</p>
              <p className="stat-value">{stats.activeAssignments}</p>
            </article>
            <article className="card">
              <p className="stat-label">Overdue Books</p>
              <p className="stat-value">{stats.overdueBooks}</p>
            </article>
          </div>
        </section>
      )}

      {(user?.role === "ROOT") && (
        <section className="dashboard-section">
          <div className="page-header">
            <div>
              <h3 className="page-title">Visual Insights</h3>
              <p className="page-subtitle">Live distribution of users, books, and assignment health.</p>
            </div>
          </div>
          {insightsError && <p className="notice notice-error">{insightsError}</p>}
          {insights && (
            <div className="charts-grid">
              <DonutGraphCard
                title="Users By Role"
                items={[
                  { label: "ROOT", value: insights.usersByRole.ROOT, color: "#ef4444" },
                  { label: "LIBRARIAN", value: insights.usersByRole.LIBRARIAN, color: "#3b82f6" },
                  { label: "USER", value: insights.usersByRole.USER, color: "#16a34a" },
                ]}
              />
              <StackedGraphCard
                title="Books By Status"
                items={[
                  { label: "AVAILABLE", value: insights.booksByStatus.AVAILABLE, color: "#16a34a" },
                  { label: "BORROWED", value: insights.booksByStatus.BORROWED, color: "#f59e0b" },
                ]}
              />
              <LineGraphCard
                title="Assignment Health"
                points={[
                  { label: "Active", value: insights.assignmentHealth.Active },
                  { label: "Returned", value: insights.assignmentHealth.Returned },
                  { label: "Overdue", value: insights.assignmentHealth.Overdue },
                ]}
              />
            </div>
          )}
        </section>
      )}

      {(user?.role === "LIBRARIAN") && (
        <section className="dashboard-section">
          <div className="page-header">
            <div>
              <h3 className="page-title">Visual Insights</h3>
              <p className="page-subtitle">Live distribution of users, books, and assignment health.</p>
            </div>
          </div>
          {insightsError && <p className="notice notice-error">{insightsError}</p>}
          {insights && (
            <div className="charts-grid">
              <DonutGraphCard
                title="Users By Role"
                items={[
                  { label: "LIBRARIAN", value: insights.usersByRole.LIBRARIAN, color: "#3b82f6" },
                  { label: "USER", value: insights.usersByRole.USER, color: "#16a34a" },
                ]}
              />
              <StackedGraphCard
                title="Books By Status"
                items={[
                  { label: "AVAILABLE", value: insights.booksByStatus.AVAILABLE, color: "#16a34a" },
                  { label: "BORROWED", value: insights.booksByStatus.BORROWED, color: "#f59e0b" },
                ]}
              />
              <LineGraphCard
                title="Assignment Health"
                points={[
                  { label: "Active", value: insights.assignmentHealth.Active },
                  { label: "Returned", value: insights.assignmentHealth.Returned },
                  { label: "Overdue", value: insights.assignmentHealth.Overdue },
                ]}
              />
            </div>
          )}
        </section>
      )}

      <section className="card">
        <h3 className="page-title">Focus Areas</h3>
        <p className="page-subtitle">Suggested priorities for your role.</p>
        <div className="stats-grid dashboard-focus-grid">
          {cards.map((card) => (
            <article className="dashboard-focus-card" key={card}>
              <p className="focus-card-title">{card}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

export default DashboardHome;
