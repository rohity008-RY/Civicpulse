import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api.civicspulse.in',
  timeout: 30000
});

// Attach JWT to every request
api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const language = useLanguageStore.getState().language;
  if (language) config.params = { lang: language, ...(config.params || {}) };
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
