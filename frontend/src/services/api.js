import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 20000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("entreskill_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED") {
      return Promise.reject(
        new Error(
          "The server is taking too long to respond. On Render free tier, first request can be slow. Please retry."
        )
      );
    }

    if (!error.response) {
      return Promise.reject(
        new Error("Unable to reach server. Check backend deployment URL and CORS settings.")
      );
    }

    return Promise.reject(error);
  }
);

export default api;
