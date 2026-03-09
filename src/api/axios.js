import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3001",
});

api.interceptors.request.use((config) => {
  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem("token");
      localStorage.removeItem("token");
      localStorage.removeItem("profile_photo_url");
      localStorage.removeItem("profile_photo_user_id");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
