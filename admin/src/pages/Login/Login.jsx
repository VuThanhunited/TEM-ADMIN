import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, AlertCircle } from 'lucide-react';
import './Login.css';

export default function Login() {
  const { error, setError, loadUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState('Đang khởi tạo kết nối...');

  useEffect(() => {
    const adminToken = searchParams.get('adminToken');
    if (adminToken) {
      setStatusText('Đang xác thực tài khoản...');
      localStorage.setItem('tem_token', adminToken);
      loadUser()
        .then(() => {
          setStatusText('Đăng nhập thành công! Đang chuyển hướng...');
          navigate('/dashboard', { replace: true });
        })
        .catch(() => {
          setError('Đăng nhập tự động thất bại hoặc phiên làm việc không hợp lệ.');
          setLoading(false);
        });
    } else {
      setStatusText('Chưa đăng nhập. Đang chuyển hướng sang cổng đăng nhập tập trung...');
      // Tự động redirect sang trang đăng nhập của User App
      const userSiteBase = import.meta.env.VITE_USER_URL ||
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? 'http://localhost:5174'
          : 'https://tem-user-page.vercel.app');
      
      setTimeout(() => {
        window.location.href = `${userSiteBase}/login?tab=npp`;
      }, 1000);
    }
  }, [searchParams, loadUser, navigate, setError]);

  return (
    <div className="login-page">
      <div className="login-bg-effects">
        <div className="bg-orb orb-1"></div>
        <div className="bg-orb orb-2"></div>
        <div className="bg-orb orb-3"></div>
        <div className="bg-grid"></div>
      </div>

      <div className="login-container animate-scale-in">
        <div className="login-card glass-strong" style={{ textAlign: 'center', padding: '50px 40px' }}>
          {/* Header */}
          <div className="login-header" style={{ marginBottom: '30px' }}>
            <div className="login-logo" style={{ margin: '0 auto 20px' }}>
              <Shield size={32} />
            </div>
            <h1>TEM Portal</h1>
            <p>Hệ thống Quản lý Tem nhãn Thông minh</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            {loading ? (
              <div className="loading-spinner" style={{ width: 36, height: 36, borderWidth: 3, margin: '10px auto' }}></div>
            ) : (
              error && (
                <div className="login-error animate-fade-in" style={{ width: '100%' }}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )
            )}
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>{statusText}</p>
            
            {error && (
              <button 
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  const userSiteBase = import.meta.env.VITE_USER_URL ||
                    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                      ? 'http://localhost:5174'
                      : 'https://tem-user-page.vercel.app');
                  window.location.href = `${userSiteBase}/login?tab=npp`;
                }} 
                className="btn btn-primary"
                style={{ marginTop: '10px' }}
              >
                Quay lại trang Đăng nhập
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
