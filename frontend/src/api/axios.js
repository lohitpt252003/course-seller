import axios from 'axios';

// Dynamically use the current hostname for the API URL, allowing local network access
const hostname = window.location.hostname;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://${hostname}:8000/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
