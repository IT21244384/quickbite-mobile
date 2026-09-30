import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api';
import { setAuthToken, setUnauthorizedHandler } from '../api/client';
import { getToken, removeToken, saveToken } from '../utils/tokenStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true); // true while checking for a saved token

  const logout = useCallback(async () => {
    setAuthToken(null);
    await removeToken();
    setUser(null);
  }, []);

  // On app start: if a token was saved, check it is still valid with GET /api/auth/me
  useEffect(() => {
    setUnauthorizedHandler(() => logout());

    (async () => {
      try {
        const token = await getToken();
        if (token) {
          setAuthToken(token);
          const { user: me } = await authApi.me();
          setUser(me);
        }
      } catch {
        await logout();
      } finally {
        setBooting(false);
      }
    })();
  }, [logout]);

  const startSession = async ({ token, user: loggedIn }) => {
    setAuthToken(token);
    await saveToken(token);
    setUser(loggedIn);
  };

  const login = async (email, password) => startSession(await authApi.login({ email, password }));
  const register = async (data) => startSession(await authApi.register(data));

  const value = useMemo(
    () => ({ user, booting, login, register, logout, isAdmin: !!user?.isAdmin }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, booting, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
