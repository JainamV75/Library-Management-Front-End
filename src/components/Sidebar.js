import { useContext } from "react";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function Sidebar() {
  const { user } = useContext(AuthContext);
  const role = user?.role;

  const menuByRole = {
    ROOT: [
      { label: "Dashboard", to: "/dashboard", icon: "" },
      { label: "Users", to: "/dashboard/users", icon: "" },
      { label: "Books", to: "/dashboard/books", icon: "" },
      { label: "Assignments", to: "/dashboard/assignments", icon: "" },
      { label: "Audit Logs", to: "/dashboard/audit", icon: "" },
    ],
    LIBRARIAN: [
      { label: "Dashboard", to: "/dashboard", icon: "" },
      { label: "Users", to: "/dashboard/users", icon: "" },
      { label: "Books", to: "/dashboard/books", icon: "" },
      { label: "Assignments", to: "/dashboard/assignments", icon: "" },
    ],
    USER: [
      { label: "Dashboard", to: "/dashboard", icon: "" },
      { label: "My Books", to: "/dashboard/my-books", icon: "" },
      { label: "Browse Books", to: "/dashboard/books", icon: "" },
      { label: "Borrow History", to: "/dashboard/borrow-history", icon: "" },
    ],
  };

  const menuItems = menuByRole[role] || [{ label: "Dashboard", to: "/dashboard", icon: "" }];

  return (
    <aside className="dashboard-sidebar">
      <h2 className="sidebar-title">Library Panel</h2>
      <nav className="sidebar-nav">
        {menuItems.map((item, index) => (
          <NavLink
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
            }
            end={item.to === "/dashboard"}
            key={`${item.to}-${item.label}-${index}`}
            to={item.to}
          >
            <span>{item.icon} </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
