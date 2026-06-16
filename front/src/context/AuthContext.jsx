import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch, getToken, setToken, clearToken } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Au démarrage : si un token existe, on récupère l'utilisateur.
  useEffect(() => {
    const init = async () => {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const me = await apiFetch('/user');
        setUser(me);
      } catch {
        clearToken();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = async (email, password) => {
    const { user: u, token } = await apiFetch('/login', {
      method: 'POST',
      auth: false,
      body: { email, password },
    });
    setToken(token);
    setUser(u);
    return u;
  };

  const register = async ({ name, email, password, password_confirmation }) => {
    const { user: u, token } = await apiFetch('/register', {
      method: 'POST',
      auth: false,
      body: { name, email, password, password_confirmation },
    });
    setToken(token);
    setUser(u);
    return u;
  };

  const logout = async () => {
    try {
      await apiFetch('/logout', { method: 'POST' });
    } catch {
      // on déconnecte côté client quoi qu'il arrive
    }
    clearToken();
    setUser(null);
  };

  const value = {
    user,
    setUser,
    isLoggedIn: !!user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un <AuthProvider>');
  return ctx;
};
