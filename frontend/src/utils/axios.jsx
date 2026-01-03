import axios from "axios";

// ----------------------------------------------------------------------

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080",
  withCredentials: true, // cookie
});

axiosInstance.interceptors.request.use(
  (config) => {
    // For FormData, let browser set Content-Type with boundary
    // Otherwise, set to application/json
    if (!(config.data instanceof FormData)) {
      config.headers = {
        "Content-Type": "application/json",
      };
    } else {
      // For FormData, don't set Content-Type - browser will set it with boundary
      config.headers = config.headers || {};
    }

    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip refresh for auth endpoints to avoid infinite loop
      if (originalRequest.url?.includes('/api/auth/refresh') || 
          originalRequest.url?.includes('/api/auth/login') ||
          originalRequest.url?.includes('/api/auth/register')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh token
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        if (response.data.accessToken) {
          const newToken = response.data.accessToken;
          localStorage.setItem("accessToken", newToken);
          
          // Update authorization header
          axiosInstance.defaults.headers.common.Authorization = `Bearer ${newToken}`;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          // Process queued requests
          processQueue(null, newToken);

          // Retry original request
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - clear auth and redirect to login
        processQueue(refreshError, null);
        localStorage.removeItem("accessToken");
        
        // Only redirect if we're not already on login page
        if (!window.location.pathname.includes('/auth/login')) {
          window.location.href = '/auth/login';
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
