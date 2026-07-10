import { useState, useEffect, useCallback } from 'react';
import { registerUser, loginUser, fetchCurrentUser } from './authApi';

const TOKEN_STORAGE_KEY = 'violet_auth_token';

export function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    if (!token) {
      setIsAuthReady(true);
      return;
    }
    fetchCurrentUser(token)
      .then((currentUser) => setUser(currentUser))
      .catch(() => {
        // token expirado/inválido: limpa a sessão local
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => setIsAuthReady(true));
  }, [token]);

  const login = useCallback(async (email, password, sessionId) => {
    const data = await loginUser(email, password, sessionId);
    localStorage.setItem(TOKEN_STORAGE_KEY, data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (name, email, password, sessionId) => {
    const data = await registerUser(name, email, password, sessionId);
    localStorage.setItem(TOKEN_STORAGE_KEY, data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return { user, token, isAuthReady, isAuthenticated: Boolean(user), login, register, logout };
}