import { create } from "zustand";
import { User } from "@/types";
import { clearTokens, saveTokens } from "@/lib/auth";
import api from "@/lib/api";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    const response = await api.post("/api/v1/auth/login", { email, password });
    saveTokens(response.data);
    const me = await api.get("/api/v1/auth/me");
    set({ user: me.data, loading: false });
  },

  logout: () => {
    clearTokens();
    set({ user: null });
  },

  fetchMe: async () => {
    try {
      const response = await api.get("/api/v1/auth/me");
      set({ user: response.data });
    } catch {
      set({ user: null });
    }
  },
}));
