import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Giải mã JWT để lấy role tạm thời (không cần verify, chỉ đọc payload)
  const parseJwtPayload = (token) => {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  };

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('tem_token');
    if (!token) {
      setLoading(false);
      return;
    }

    // Kiểm tra JWT hết hạn client-side trước
    const payload = parseJwtPayload(token);
    if (payload?.exp && Date.now() / 1000 > payload.exp) {
      localStorage.removeItem('tem_token');
      localStorage.removeItem('npp_scan_token');
      localStorage.removeItem('npp_scan_user');
      setUser(null);
      setLoading(false);
      return;
    }

    // Dùng user đã cache trong localStorage (nếu có) để hiện sidebar ngay lập tức
    const cachedUser = localStorage.getItem('tem_user');
    if (cachedUser) {
      try { setUser(JSON.parse(cachedUser)); } catch {}
    }

    try {
      const userData = await api.getMe();
      setUser(userData);
      localStorage.setItem('tem_user', JSON.stringify(userData));
      
      // Sync scan session if NPP
      if (userData?.role === 'NPP') {
        localStorage.setItem('npp_scan_token', token);
        localStorage.setItem('npp_scan_user', JSON.stringify(userData));
      }
    } catch (err) {
      // Chỉ xóa auth khi server xác nhận token không hợp lệ (401/403)
      // Không xóa khi lỗi mạng / server đang cold start (timeout, network error)
      const isAuthError = err.message?.includes('đăng nhập') || 
                          err.message?.includes('Token') || 
                          err.message?.includes('hết hạn') ||
                          err.message?.includes('không tồn tại') ||
                          err.message?.includes('vô hiệu hóa');
      if (isAuthError) {
        localStorage.removeItem('tem_token');
        localStorage.removeItem('tem_user');
        localStorage.removeItem('npp_scan_token');
        localStorage.removeItem('npp_scan_user');
        setUser(null);
      }
      // Nếu là lỗi mạng → giữ user từ cache, server sẽ được retry sau
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();

    // Heartbeat check (mỗi 15 giây) để phát hiện ngay phiên đăng nhập trùng từ máy khác
    const interval = setInterval(() => {
      const token = localStorage.getItem('tem_token');
      if (token) {
        api.getMe().catch(() => {});
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [loadUser]);

  const login = async (username, password) => {
    try {
      setError(null);
      const result = await api.login({ username, password });
      localStorage.setItem('tem_token', result.token);
      localStorage.setItem('tem_user', JSON.stringify(result.user));
      setUser(result.user);
      
      // Sync scan session if NPP
      if (result.user?.role === 'NPP') {
        localStorage.setItem('npp_scan_token', result.token);
        localStorage.setItem('npp_scan_user', JSON.stringify(result.user));
      }
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('tem_token');
    localStorage.removeItem('tem_user');
    localStorage.removeItem('npp_scan_token');
    localStorage.removeItem('npp_scan_user');
    setUser(null);
  };

  const isAdmin = user?.role === 'ADMIN';
  const isNSX = user?.role === 'NSX';
  const isNPP = user?.role === 'NPP';
  const isEnterprise = isNSX || isNPP;
  const enterpriseId = user?.enterpriseId?._id || user?.enterpriseId;

  const value = {
    user,
    setUser,
    loading,
    error,
    login,
    logout,
    isAdmin,
    isNSX,
    isNPP,
    isEnterprise,
    enterpriseId,
    setError,
    loadUser
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
