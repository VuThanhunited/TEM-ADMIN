import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage
    const savedToken = localStorage.getItem('npp_scan_token');
    const savedUser = localStorage.getItem('npp_scan_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        // corrupted data, clear it
        localStorage.removeItem('npp_scan_token');
        localStorage.removeItem('npp_scan_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, userToken) => {
    localStorage.setItem('npp_scan_token', userToken);
    localStorage.setItem('npp_scan_user', JSON.stringify(userData));
    setToken(userToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('npp_scan_token');
    localStorage.removeItem('npp_scan_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      nppUser: user,
      nppToken: token,
      loading,
      login,
      logout,
      isLoggedIn: !!token
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
