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

export default axiosInstance;
