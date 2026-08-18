import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { clearTokens, getAccessToken, setTokens } from '../api/tokenStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  const loadUser = useCallback(async () => {
    if (!getAccessToken()) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get('/api/accounts/me/');
      setUser(data);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    loadUser();
    window.addEventListener('auth:logout', logout);
    return () => window.removeEventListener('auth:logout', logout);
  }, [loadUser, logout]);

  const login = async ({ email, password }) => {
    const { data } = await api.post('/api/accounts/login/', { email, password });
    const authUser = data.user
      ? {
          ...data.user,
          role: data.user.role ?? data.role,
          has_profile: data.user.has_profile ?? data.has_profile,
        }
      : {
          ...data,
          role: data.role,
          has_profile: data.has_profile,
        };

    setTokens({ access: data.access, refresh: data.refresh });
    setUser(authUser);
    return authUser;
  };

  const register = async (payload) => {
    const { data } = await api.post('/api/accounts/register/', payload);
    return data;
  };

  const value = useMemo(
    () => ({ user, loading, isAuthenticated: Boolean(user), login, logout, register, loadUser }),
    [user, loading, logout, loadUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
