import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: automatically attaches JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ledgerline_token');
    if (token) {
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
      // Don't auto-redirect if already on login page or failed login attempt
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('ledgerline_token');
        localStorage.removeItem('ledgerline_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
