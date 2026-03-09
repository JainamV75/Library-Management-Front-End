import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, initializing } = useContext(AuthContext);

  if (initializing) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
