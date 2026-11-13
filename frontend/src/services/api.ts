import axios from 'axios';

const resolveApiBaseUrl = (): string => {
  const configured = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
  if (configured) {
    return configured.endsWith('/api') ? configured : `${configured}/api`;
  }
  return import.meta.env.DEV ? 'http://localhost:8000/api' : '/api';
};

const API_BASE_URL = resolveApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests if available and ensure FormData sets its own boundary
api.interceptors.request.use((config) => {
  if (config.data instanceof FormData && config.headers) {
    delete config.headers['Content-Type'];
  }
  const token = localStorage.getItem('tm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response interceptor for 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't auto-redirect on login or register check
      const isAuthUrl = error.config.url?.includes('/auth/login') || error.config.url?.includes('/auth/register');
      if (!isAuthUrl) {
        localStorage.removeItem('tm_token');
        localStorage.removeItem('tm_user');
      }
    }
    return Promise.reject(error);
  }
);
