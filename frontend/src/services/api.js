import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: automatically attaches JWT token to authenticated requests
api.interceptors.request.use(
  (config) => {
    const isAuthEndpoint =
      config.url &&
      (config.url.includes('/auth/login') || config.url.includes('/auth/register'));

    const token = localStorage.getItem('ledgerline_token');
    if (token && !isAuthEndpoint) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handles 401s and extracts standardized error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if already on login or register page
      const isAuthPage =
        window.location.pathname.includes('/login') ||
        window.location.pathname.includes('/register');

      if (!isAuthPage) {
        localStorage.removeItem('ledgerline_token');
        localStorage.removeItem('ledgerline_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
