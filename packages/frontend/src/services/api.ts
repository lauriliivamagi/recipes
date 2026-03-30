import axios from "axios";

/**
 * Axios client configured for the backend API.
 * In development, Vite proxies /api to the backend.
 * In production, Caddy handles the reverse proxy.
 */
export const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized (e.g., redirect to login)
    }
    return Promise.reject(error);
  }
);
