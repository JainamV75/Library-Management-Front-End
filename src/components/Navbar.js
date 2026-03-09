import { useContext, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axios";

const roleClassName = {
  ROOT: "badge badge-danger",
  LIBRARIAN: "badge badge-info",
  USER: "badge badge-success",
};

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const [photoUrl, setPhotoUrl] = useState("");
  const [displayName, setDisplayName] = useState("-");
  const [libraryName, setLibraryName] = useState("");
  const location = useLocation();

  useEffect(() => {
    const storedPhoto = localStorage.getItem("profile_photo_url") || "";
    const storedUserId = localStorage.getItem("profile_photo_user_id");

    if (storedUserId && storedUserId === String(user?.userId)) {
      setPhotoUrl(storedPhoto);
    } else {
      setPhotoUrl("");
    }
  }, [user?.userId]);

  useEffect(() => {
    if (!user?.userId) return;

    const fetchProfilePhoto = async () => {
      try {
        const res = await api.get("/users/me");
        const nextPhoto = res.data?.photoUrl || "";
        setPhotoUrl(nextPhoto);
        setDisplayName(res.data?.name || "-");
        setLibraryName(res.data?.libraryName || "");
        localStorage.setItem("profile_photo_url", nextPhoto);
        localStorage.setItem("profile_photo_user_id", String(user.userId));
      } catch (error) {
        setPhotoUrl("");
        setDisplayName("-");
        setLibraryName("");
      }
    };

    fetchProfilePhoto();
  }, [location.pathname, user?.userId]);

  useEffect(() => {
    const handleProfileUpdate = (event) => {
      if (String(event.detail?.userId) !== String(user?.userId)) return;
      const nextPhoto = event.detail?.photoUrl || "";
      setPhotoUrl(nextPhoto);
      if (event.detail?.name) {
        setDisplayName(event.detail.name);
      }
      localStorage.setItem("profile_photo_url", nextPhoto);
      localStorage.setItem("profile_photo_user_id", String(user?.userId));
    };

    window.addEventListener("profile-updated", handleProfileUpdate);
    return () => window.removeEventListener("profile-updated", handleProfileUpdate);
  }, [user?.userId]);

  return (
    <header className="dashboard-navbar">
      <div className="navbar-meta">
        <span className="navbar-user-name">{displayName}</span>
        <span className={roleClassName[user?.role] || "badge badge-muted"}>{user?.role || "-"}</span>
        {user?.role === "ROOT" ? (
          <span className="badge badge-warning">
            Library: {libraryName || "-"} (ID: #{user?.libraryId || "-"})
          </span>
        ) : (
          <span className="badge badge-warning">
            Library: {libraryName || `#${user?.libraryId || "-"}`}
          </span>
        )}
      </div>
      <div className="navbar-actions">
        <Link className="profile-link" to="/dashboard/profile">
          {photoUrl ? (
            <img alt="Profile" className="profile-avatar" src={photoUrl} />
          ) : (
            <span className="profile-avatar profile-avatar-placeholder" title="Profile">
              <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
                <circle cx="12" cy="8" r="4" fill="#6b7280" />
                <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" fill="#6b7280" />
              </svg>
            </span>
          )}
        </Link>
        <button className="btn-secondary" onClick={logout} type="button">
          Logout
        </button>
      </div>
    </header>
  );
}

export default Navbar;
