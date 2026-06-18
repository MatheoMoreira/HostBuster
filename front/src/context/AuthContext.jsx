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

  // `login` peut être un email ou un nom d'utilisateur.
  const login = async (loginId, password) => {
    const { user: u, token } = await apiFetch('/login', {
      method: 'POST',
      auth: false,
      body: { login: loginId, password },
    });
    setToken(token);
    setUser(u);
    return u;
  };

  const register = async ({ username, first_name, last_name, email, password, password_confirmation }) => {
    const { user: u, token } = await apiFetch('/register', {
      method: 'POST',
      auth: false,
      body: { username, first_name, last_name, email, password, password_confirmation },
    });
    setToken(token);
    setUser(u);
    return u;
  };

  // Recharge l'utilisateur depuis l'API (ex: après vérification d'email).
  const refreshUser = async () => {
    if (!getToken()) return null;
    const me = await apiFetch('/user');
    setUser(me);
    return me;
  };

  const resendVerification = () => apiFetch('/email/resend', { method: 'POST' });

  const forgotPassword = (email) =>
    apiFetch('/forgot-password', { method: 'POST', auth: false, body: { email } });

  const resetPassword = (payload) =>
    apiFetch('/reset-password', { method: 'POST', auth: false, body: payload });

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
    refreshUser,
    resendVerification,
    forgotPassword,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un <AuthProvider>');
  return ctx;
};
