import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [nppUser, setNppUser] = useState(null);
  const [nppToken, setNppToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage
    const savedToken = localStorage.getItem('npp_scan_token');
    const savedUser = localStorage.getItem('npp_scan_user');
    if (savedToken && savedUser) {
      try {
        setNppToken(savedToken);
        setNppUser(JSON.parse(savedUser));
      } catch {
        // corrupted data, clear it
        localStorage.removeItem('npp_scan_token');
        localStorage.removeItem('npp_scan_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (user, token) => {
    localStorage.setItem('npp_scan_token', token);
    localStorage.setItem('npp_scan_user', JSON.stringify(user));
    setNppToken(token);
    setNppUser(user);
  };

  const logout = () => {
    localStorage.removeItem('npp_scan_token');
    localStorage.removeItem('npp_scan_user');
    setNppToken(null);
    setNppUser(null);
  };

  return (
    <AuthContext.Provider value={{ nppUser, nppToken, loading, login, logout, isLoggedIn: !!nppToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
