import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Shield } from 'lucide-react';
import './Login.css';

export default function Login() {
  const { user, loadUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [statusText, setStatusText] = useState('Đang kết nối hệ thống...');

  useEffect(() => {
    const adminToken = searchParams.get('adminToken');
    if (adminToken) {
      setStatusText('Đang xác thực tài khoản...');
      localStorage.setItem('tem_token', adminToken);
      loadUser()
        .then((userData) => {
          setStatusText('Đăng nhập thành công! Đang chuyển hướng...');
          if (userData?.role === 'NPP') {
            navigate('/npp/scan', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        })
        .catch(() => {
          // Token không hợp lệ -> Chuyển về trang đăng nhập user
          window.location.href = '/login';
        });
      return;
    }

    // Nếu đã đăng nhập sẵn
    if (user) {
      if (user.role === 'NPP') {
        navigate('/npp/scan', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
      return;
    }

    // Không có token và chưa đăng nhập -> Chuyển ngay sang trang Đăng nhập duy nhất ở user app
    window.location.href = '/login';
  }, [searchParams, user, loadUser, navigate]);

  return (
    <div className="login-page">
      <div className="login-bg-effects">
        <div className="bg-orb orb-1"></div>
        <div className="bg-orb orb-2"></div>
        <div className="bg-grid"></div>
      </div>

      <div className="login-container animate-scale-in">
        <div className="login-card glass-strong" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div className="login-logo" style={{ margin: '0 auto 16px' }}>
            <Shield size={36} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: 'var(--color-text-primary)' }}>
            Hệ thống Quản lý TEM
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
            <div className="loading-spinner" style={{ width: 36, height: 36, borderWidth: 3 }}></div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{statusText}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
