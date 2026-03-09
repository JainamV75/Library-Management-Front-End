import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const RoleRoute = ({ children, allowedRoles }) => {
  const { user, initializing } = useContext(AuthContext);

  if (initializing) {
    return <p>Loading...</p>;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

export default RoleRoute;
