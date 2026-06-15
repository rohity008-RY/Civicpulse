import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.civicspulse.in';

const api = axios.create({ baseURL: API_URL, timeout: 30000 });

export async function postMultipart(path, formData) {
  const language = useLanguageStore.getState().language || 'en';
  if (Platform.OS === 'web') {
    const token = await SecureStore.getItemAsync('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const separator = path.includes('?') ? '&' : '?';
    const response = await fetch(`${API_URL}${path}${separator}lang=${encodeURIComponent(language)}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    if (!response.ok) {
      const err = new Error(data.error || `Request failed with status ${response.status}`);
      err.response = { status: response.status, data };
      throw err;
    }
    return { data, status: response.status };
  }

  return api.post(path, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
}

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const language = useLanguageStore.getState().language || 'en';
  config.params = { lang: language, ...(config.params || {}) };
  return config;
});

api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      await useAuthStore.getState().logout();
    }
    return Promise.reject(err);
  }
);

export default api;
