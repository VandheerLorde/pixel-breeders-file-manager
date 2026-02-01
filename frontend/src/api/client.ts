// src/api/client.ts
import axios from "axios";

// 1. Create Axios Instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. Token Management Helpers
export const setTokens = (access: string, refresh: string) => {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
};

export const getAccessToken = () => localStorage.getItem("access_token");
export const getRefreshToken = () => localStorage.getItem("refresh_token");

export const clearTokens = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
};

// 3. Request Interceptor: Attach Token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 4. Response Interceptor: Handle 401 & Refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 (Unauthorized) and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) throw new Error("No refresh token");

        // Attempt refresh
        const response = await axios.post("/api/auth/token/refresh/", {
          refresh: refreshToken,
        });

        const { access } = response.data;
        // Update local storage and header
        setTokens(access, refreshToken);
        originalRequest.headers.Authorization = `Bearer ${access}`;
        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed (token expired or invalid) -> Logout
        clearTokens();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
