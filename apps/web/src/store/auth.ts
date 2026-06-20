'use client';

import { create } from 'zustand';
import { apiFetch, setToken } from '@/lib/api';
import type { AuthResponse, User } from '@/lib/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: 'CUSTOMER' | 'RESTAURANT_OWNER';
  }) => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,

  hydrate: async () => {
    try {
      const me = await apiFetch<User>('/auth/me');
      set({ user: me, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  login: async (email, password) => {
    const res = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      auth: false,
      body: { email, password },
    });
    setToken(res.accessToken);
    set({ user: res.user });
  },

  register: async (input) => {
    const res = await apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      auth: false,
      body: input,
    });
    setToken(res.accessToken);
    set({ user: res.user });
  },

  logout: () => {
    setToken(null);
    set({ user: null });
  },
}));
