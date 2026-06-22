import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { authApi } from "../api/auth";
import {
  tokenStore,
  setForceLogoutHandler,
  apiErrorMessage,
} from "../api/client";
import type { Usuario, RegistroClientePayload } from "../types";

interface AuthState {
  user: Usuario | null;
  loading: boolean; // cargando sesión inicial
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  registrarCliente: (payload: RegistroClientePayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    const tokens = await tokenStore.get();
    try {
      if (tokens?.refresh) await authApi.logout(tokens.refresh);
    } catch {
      // Ignorar errores de logout en el servidor.
    }
    await tokenStore.clear();
    setUser(null);
  }, []);

  // Sesión expirada (refresh inválido) -> limpia el usuario.
  useEffect(() => {
    setForceLogoutHandler(() => setUser(null));
  }, []);

  // Auto-login al abrir la app si hay tokens válidos.
  useEffect(() => {
    (async () => {
      const tokens = await tokenStore.get();
      if (tokens?.access) {
        try {
          const { data } = await authApi.me();
          setUser(data);
        } catch {
          await tokenStore.clear();
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data } = await authApi.login(email.trim(), password);
      await tokenStore.set({ access: data.access, refresh: data.refresh });
      setUser(data.usuario);
    } catch (e) {
      throw new Error(apiErrorMessage(e, "Credenciales inválidas."));
    }
  }, []);

  const registrarCliente = useCallback(
    async (payload: RegistroClientePayload) => {
      try {
        await authApi.registroCliente(payload);
        // Tras registrar, inicia sesión automáticamente.
        await login(payload.email, payload.password);
      } catch (e) {
        throw new Error(apiErrorMessage(e, "No se pudo completar el registro."));
      }
    },
    [login]
  );

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      login,
      registrarCliente,
      logout,
    }),
    [user, loading, login, registrarCliente, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>.");
  return ctx;
}
