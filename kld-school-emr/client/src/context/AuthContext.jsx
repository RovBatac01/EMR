import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, ensureCsrf } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      await ensureCsrf();
      const { data } = await api.get('/auth/me');
      setUser(data.data.user);
      setPermissions(data.data.permissions || []);
      return data.data.user;
    } catch (error) {
      if (error.status !== 503) { setUser(null); setPermissions([]); }
      return null;
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  const login = useCallback(async (credentials) => {
    await ensureCsrf();
    const { data } = await api.post('/auth/login', credentials);
    setUser(data.data.user);
    await refreshUser();
    return data.data.user;
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } finally { setUser(null); setPermissions([]); }
  }, []);

  const can = useCallback((permission) => user?.role === 'SUPER_ADMIN' || permissions.includes(permission), [permissions, user]);
  const value = useMemo(() => ({ user, permissions, loading, login, logout, refreshUser, can }), [user, permissions, loading, login, logout, refreshUser, can]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
