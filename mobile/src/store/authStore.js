import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: async (user, token) => {
    await SecureStore.setItemAsync('token', token);
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  init: async () => {
    const token = await SecureStore.getItemAsync('token');
    const userStr = await SecureStore.getItemAsync('user');
    if (token && userStr) {
      try {
        set({ user: JSON.parse(userStr), token, isAuthenticated: true });
      } catch {
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('user');
        set({ user: null, token: null, isAuthenticated: false });
      }
    }
  },

  updateUser: async (updates) => {
    const current = get().user || {};
    const next = { ...current, ...updates };
    await SecureStore.setItemAsync('user', JSON.stringify(next));
    set({ user: next, isAuthenticated: !!get().token });
  }
}));
