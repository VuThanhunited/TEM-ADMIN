import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('tem_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const userData = await api.getMe();
      setUser(userData);
    } catch (err) {
      localStorage.removeItem('tem_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (username, password) => {
    try {
      setError(null);
      const result = await api.login({ username, password });
      localStorage.setItem('tem_token', result.token);
      setUser(result.user);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('tem_token');
    setUser(null);
  };

  const isAdmin = user?.role === 'ADMIN';
  const isNSX = user?.role === 'NSX';
  const isNPP = user?.role === 'NPP';
  const isEnterprise = isNSX || isNPP;
  const enterpriseId = user?.enterpriseId?._id || user?.enterpriseId;

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAdmin,
    isNSX,
    isNPP,
    isEnterprise,
    enterpriseId,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export default AuthContext;
