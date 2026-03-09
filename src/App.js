import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import Users from "./pages/Users";
import Books from "./pages/Books";
import Assignments from "./pages/Assignments";
import MyBooks from "./pages/MyBooks";
import BorrowHistory from "./pages/BorrowHistory";
import DashboardHome from "./pages/DashboardHome";
import Profile from "./pages/Profile";
import AuditLogs from "./pages/AuditLogs";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route
            path="users"
            element={
              <RoleRoute allowedRoles={["ROOT", "LIBRARIAN"]}>
                <Users />
              </RoleRoute>
            }
          />
          <Route
            path="books"
            element={
              <RoleRoute allowedRoles={["ROOT", "LIBRARIAN", "USER"]}>
                <Books />
              </RoleRoute>
            }
          />
          <Route
            path="assignments"
            element={
              <RoleRoute allowedRoles={["ROOT", "LIBRARIAN"]}>
                <Assignments />
              </RoleRoute>
            }
          />
          <Route
            path="my-books"
            element={
              <RoleRoute allowedRoles={["USER"]}>
                <MyBooks />
              </RoleRoute>
            }
          />
          <Route
            path="borrow-history"
            element={
              <RoleRoute allowedRoles={["USER"]}>
                <BorrowHistory />
              </RoleRoute>
            }
          />
          <Route
            path="audit"
            element={
              <RoleRoute allowedRoles={["ROOT"]}>
                <AuditLogs />
              </RoleRoute>
            }
          />
          <Route path="profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
