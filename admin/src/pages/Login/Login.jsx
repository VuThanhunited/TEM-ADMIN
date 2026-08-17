import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Shield } from 'lucide-react';
import './Login.css';

// Trang này chỉ nhận adminToken từ URL (SSO callback).
// Form đăng nhập thực sự ở: https://tem-user-page.vercel.app/login
export default function Login() {
  const { user, loadUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [statusText, setStatusText] = useState('Đang xác thực...');

  useEffect(() => {
    const adminToken = searchParams.get('adminToken');

    if (adminToken) {
      setStatusText('Đang xác thực tài khoản...');
      // AuthContext.loadUser() đã xử lý adminToken từ URL trong AuthContext
      // Chỉ cần navigate sau khi user được set
      const checkUser = setInterval(() => {
        const token = localStorage.getItem('tem_token');
        if (token) {
          clearInterval(checkUser);
          navigate('/dashboard', { replace: true });
        }
      }, 100);

      // Timeout 5 giây
      setTimeout(() => {
        clearInterval(checkUser);
        navigate('/dashboard', { replace: true });
      }, 5000);

      return () => clearInterval(checkUser);
    }

    // Đã đăng nhập sẵn → vào dashboard
    if (user) {
      if (user.role === 'NPP') {
        navigate('/npp/scan', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
      return;
    }

    // Không có token → redirect sang trang đăng nhập user
    window.location.href = 'https://tem-user-page.vercel.app/login';
  }, [searchParams, user]);

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
