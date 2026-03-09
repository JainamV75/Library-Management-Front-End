import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

function Layout({ children }) {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-main">
        <Navbar />
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}

export default Layout;
