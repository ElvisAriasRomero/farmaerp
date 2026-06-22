import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config";
import type { AuthTokens } from "../types";

const TOKENS_KEY = "farmaerp_tokens";

/**
 * Almacenamiento de tokens según plataforma:
 *  - Nativo (celular): expo-secure-store (cifrado en keychain/keystore).
 *  - Web: AsyncStorage (localStorage); SecureStore no existe en web.
 */
const isWeb = Platform.OS === "web";

const storage = {
  getItem: (k: string) =>
    isWeb ? AsyncStorage.getItem(k) : SecureStore.getItemAsync(k),
  setItem: (k: string, v: string) =>
    isWeb ? AsyncStorage.setItem(k, v) : SecureStore.setItemAsync(k, v),
  removeItem: (k: string) =>
    isWeb ? AsyncStorage.removeItem(k) : SecureStore.deleteItemAsync(k),
};

export const tokenStore = {
  async get(): Promise<AuthTokens | null> {
    try {
      const raw = await storage.getItem(TOKENS_KEY);
      return raw ? (JSON.parse(raw) as AuthTokens) : null;
    } catch {
      return null;
    }
  },
  async set(tokens: AuthTokens): Promise<void> {
    await storage.setItem(TOKENS_KEY, JSON.stringify(tokens));
  },
  async clear(): Promise<void> {
    await storage.removeItem(TOKENS_KEY);
  },
};

/** Callback que la app registra para reaccionar a una sesión expirada. */
let onForceLogout: (() => void) | null = null;
export function setForceLogoutHandler(fn: () => void) {
  onForceLogout = fn;
}

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// --- Request: inyecta Authorization Bearer ---
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const tokens = await tokenStore.get();
    if (tokens?.access) {
      config.headers.Authorization = `Bearer ${tokens.access}`;
    }
    return config;
  }
);

// --- Response: refresh automático en 401 (igual que api.js web) ---
let refreshing: Promise<{ data: { access: string } }> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const status = error.response?.status;

    if (
      status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes("/auth/")
    ) {
      const tokens = await tokenStore.get();
      if (!tokens?.refresh) {
        await forceLogout();
        return Promise.reject(error);
      }
      original._retry = true;
      try {
        refreshing =
          refreshing ||
          axios.post(`${API_URL}/auth/refresh/`, { refresh: tokens.refresh });
        const { data } = await refreshing;
        refreshing = null;

        const next: AuthTokens = { ...tokens, access: data.access };
        await tokenStore.set(next);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch (e) {
        refreshing = null;
        await forceLogout();
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);

async function forceLogout() {
  await tokenStore.clear();
  onForceLogout?.();
}

/** Extrae un mensaje de error legible de una respuesta de DRF. */
export function apiErrorMessage(error: unknown, fallback = "Ocurrió un error."): string {
  const e = error as AxiosError<any>;
  const data = e?.response?.data;
  if (!data) return e?.message || fallback;
  if (typeof data === "string") return data;
  if (data.detail) return String(data.detail);
  // Errores de validación por campo: toma el primero.
  const firstKey = Object.keys(data)[0];
  if (firstKey) {
    const val = data[firstKey];
    return Array.isArray(val) ? String(val[0]) : String(val);
  }
  return fallback;
}
