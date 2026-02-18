# API Integration

This directory handles API communication with the backend.

- **`axios.js`**: Default Axios instance configured with the base API URL.
  - Automatically attaches the JWT `Authorization` header to requests.
  - Handles response interceptors for potential error logging or token refresh logic.
