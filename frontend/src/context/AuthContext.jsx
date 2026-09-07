import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { authApi } from "../lib/api";

const TOKEN_KEY = "secure-document-system.token";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const signOut = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    authApi.me(token).then(setUser).catch(signOut).finally(() => setLoading(false));
  }, [token]);

  const value = useMemo(() => ({
    token,
    user,
    loading,
    signIn: async (credentials) => {
      const result = await authApi.login(credentials);
      sessionStorage.setItem(TOKEN_KEY, result.access_token);
      setToken(result.access_token);
      const profile = await authApi.me(result.access_token);
      setUser(profile);
      return profile;
    },
    signOut,
  }), [token, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
