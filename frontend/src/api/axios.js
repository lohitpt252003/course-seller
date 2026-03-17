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

// Handle 401/403 responses globally (expired or missing token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    
    // Handle expired/invalid/missing token
    if (status === 401 || status === 403) {
      console.warn('Authentication failed. Clearing credentials and redirecting to login...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Show a message to the user (optional, can be enhanced with a toast)
      const message = status === 401 
        ? 'Your session has expired. Please login again.' 
        : 'You do not have permission to access this resource.';
      sessionStorage.setItem('authMessage', message);
      
      // Redirect to login page
      window.location.href = '/login';
      
      // Return early to prevent further processing
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);

export default api;
