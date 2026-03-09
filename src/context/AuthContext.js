import { createContext, useCallback, useEffect, useState } from "react";
import api from "../api/axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const decodeJwtPayload = useCallback((token) => {
    const base64Url = token.split(".")[1] || "";
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return JSON.parse(atob(padded));
  }, []);

  const setSessionFromToken = useCallback((token) => {
    sessionStorage.setItem("token", token);
    localStorage.removeItem("token");
    const payload = decodeJwtPayload(token);
    setUser(payload);
  }, [decodeJwtPayload]);

  useEffect(() => {
    const token =
      sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!token) {
      setInitializing(false);
      return;
    }

    try {
      setSessionFromToken(token);
    } catch (error) {
      sessionStorage.removeItem("token");
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setInitializing(false);
    }
  }, [setSessionFromToken]);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    setSessionFromToken(res.data.access_token);
  };

  const registerRoot = async (payload) => {
    const res = await api.post("/auth/register-root", payload);
    setSessionFromToken(res.data.access_token);
  };

  const logout = () => {
    sessionStorage.removeItem("token");
    localStorage.removeItem("token");
    localStorage.removeItem("profile_photo_url");
    localStorage.removeItem("profile_photo_user_id");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, initializing, login, registerRoot, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
