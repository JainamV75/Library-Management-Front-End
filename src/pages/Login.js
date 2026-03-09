import { useContext, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function Login() {
  const { user, login, initializing } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const trimmedEmail = email.trim();
  const isFormValid = useMemo(
    () => trimmedEmail.length > 0 && password.length > 0,
    [trimmedEmail, password]
  );

  useEffect(() => {
    setError("");
  }, [email, password]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!isFormValid || submitting) {
      return;
    }

    try {
      setSubmitting(true);
      await login(trimmedEmail, password);
      navigate("/dashboard");
    } catch (err) {
      const backendMessage = err.response?.data?.message;
      setError(
        Array.isArray(backendMessage)
          ? backendMessage.join(", ")
          : backendMessage || "Invalid credentials"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (initializing) {
    return <p>Loading...</p>;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div style={pageStyle}>
      <form onSubmit={handleLogin} style={cardStyle}>
        <h2 style={titleStyle}>Library Login</h2>
        <p style={subtitleStyle}>Sign in to continue</p>

        <label style={labelStyle}>
          Email
          <input
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={inputStyle}
            type="email"
            value={email}
          />
        </label>

        <label style={labelStyle}>
          Password
          <div style={passwordWrapStyle}>
            <input
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              style={passwordInputStyle}
              type={showPassword ? "text" : "password"}
              value={password}
            />
            <button
              onClick={() => setShowPassword((prev) => !prev)}
              style={textButtonStyle}
              type="button"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        {error && <p style={errorStyle}>{error}</p>}

        <button disabled={!isFormValid || submitting} style={submitStyle} type="submit">
          {submitting ? "Logging in..." : "Login"}
        </button>
        <p style={footerTextStyle}>
          New library owner? <Link to="/signup">Create a new account</Link>
        </p>

      </form>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(120deg, #f8fafc 0%, #eef2ff 100%)",
  padding: "20px",
};

const cardStyle = {
  width: "100%",
  maxWidth: "400px",
  display: "grid",
  gap: "12px",
  border: "1px solid #d1d5db",
  borderRadius: "12px",
  background: "#ffffff",
  padding: "20px",
  boxShadow: "0 10px 30px rgba(17, 24, 39, 0.08)",
};

const titleStyle = {
  margin: 0,
  fontSize: "24px",
  color: "#111827",
};

const subtitleStyle = {
  margin: 0,
  color: "#4b5563",
  fontSize: "14px",
};

const labelStyle = {
  display: "grid",
  gap: "6px",
  color: "#111827",
  fontSize: "14px",
};

const inputStyle = {
  height: "40px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  padding: "0 12px",
  fontSize: "14px",
};

const passwordWrapStyle = {
  display: "flex",
  alignItems: "center",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  paddingRight: "8px",
};

const passwordInputStyle = {
  flex: 1,
  height: "38px",
  border: "none",
  outline: "none",
  padding: "0 12px",
  fontSize: "14px",
  borderRadius: "8px",
};

const textButtonStyle = {
  border: "none",
  background: "transparent",
  color: "#2563eb",
  cursor: "pointer",
  fontSize: "13px",
};

const submitStyle = {
  height: "42px",
  borderRadius: "8px",
  border: "none",
  background: "#2563eb",
  color: "#ffffff",
  fontWeight: 600,
  cursor: "pointer",
};

const errorStyle = {
  margin: 0,
  color: "#b91c1c",
  fontSize: "13px",
};

const footerTextStyle = {
  margin: 0,
  fontSize: "14px",
  color: "#4b5563",
};

export default Login;
