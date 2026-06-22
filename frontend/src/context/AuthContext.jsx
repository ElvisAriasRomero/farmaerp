import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi, tokenStore } from "../services/api.js";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restaura sesión al cargar
  useEffect(() => {
    const tokens = tokenStore.get();
    if (!tokens?.access) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((res) => setUser(res.data))
      .catch(() => {
        tokenStore.clear();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login(email, password);
    tokenStore.set({ access: data.access, refresh: data.refresh });
    setUser(data.usuario);
    return data.usuario;
  }, []);

  const logout = useCallback(async () => {
    const tokens = tokenStore.get();
    try {
      if (tokens?.refresh) await authApi.logout(tokens.refresh);
    } catch {
      /* logout es del lado cliente con JWT */
    }
    tokenStore.clear();
    setUser(null);
  }, []);

  // 'administrador' | 'empleado' | 'cliente'
  const actor = (() => {
    if (!user) return null;
    if (user.is_superuser || user.is_staff) return "administrador";
    return user.tipo || null;
  })();

  return (
    <AuthContext.Provider
      value={{ user, actor, loading, login, logout, isAuth: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}
