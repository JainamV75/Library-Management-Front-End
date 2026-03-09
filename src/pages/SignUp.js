import { useContext, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function SignUp() {
  const { user, initializing, registerRoot } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    libraryName: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const canSubmit = useMemo(() => {
    return (
      formData.libraryName.trim().length > 0 &&
      formData.name.trim().length > 0 &&
      formData.email.trim().length > 0 &&
      formData.password.length > 0 &&
      formData.confirmPassword.length > 0
    );
  }, [formData]);

  useEffect(() => {
    setError("");
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    if (formData.password !== formData.confirmPassword) {
      setError("Password and Confirm Password must match");
      return;
    }

    try {
      setSubmitting(true);
      await registerRoot({
        libraryName: formData.libraryName.trim(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });
      navigate("/dashboard");
    } catch (err) {
      const backendMessage = err.response?.data?.message;
      setError(
        Array.isArray(backendMessage)
          ? backendMessage.join(", ")
          : backendMessage || "Failed to create root account"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (initializing) return <p>Loading...</p>;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div style={pageStyle}>
      <form onSubmit={handleSubmit} style={cardStyle}>
        <h2 style={titleStyle}>Create Library Account</h2>
        <p style={subtitleStyle}>Register as a ROOT user for a new library</p>

        <label style={labelStyle}>
          Library Name
          <input
            name="libraryName"
            onChange={handleChange}
            placeholder="Your Library Name"
            style={inputStyle}
            value={formData.libraryName}
          />
        </label>

        <label style={labelStyle}>
          Your Name
          <input
            name="name"
            onChange={handleChange}
            placeholder="Root Admin Name"
            style={inputStyle}
            value={formData.name}
          />
        </label>

        <label style={labelStyle}>
          Email
          <input
            name="email"
            onChange={handleChange}
            placeholder="you@example.com"
            style={inputStyle}
            type="email"
            value={formData.email}
          />
        </label>

        <label style={labelStyle}>
          Password
          <div style={passwordWrapStyle}>
            <input
              name="password"
              onChange={handleChange}
              placeholder="Create password"
              style={passwordInputStyle}
              type={showPassword ? "text" : "password"}
              value={formData.password}
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

        <label style={labelStyle}>
          Confirm Password
          <div style={passwordWrapStyle}>
            <input
              name="confirmPassword"
              onChange={handleChange}
              placeholder="Confirm password"
              style={passwordInputStyle}
              type={showPassword ? "text" : "password"}
              value={formData.confirmPassword}
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

        <button disabled={!canSubmit || submitting} style={submitStyle} type="submit">
          {submitting ? "Creating Account..." : "Sign Up"}
        </button>

        <p style={footerTextStyle}>
          Already have an account? <Link to="/login">Login</Link>
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
  maxWidth: "420px",
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

export default SignUp;
