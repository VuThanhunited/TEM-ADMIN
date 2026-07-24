import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, AlertCircle, Eye, EyeOff, LogIn } from 'lucide-react';
import './Login.css';

export default function Login() {
  const { login, error, setError, loadUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [autoLoggingIn, setAutoLoggingIn] = useState(false);
  const [statusText, setStatusText] = useState('');

  useEffect(() => {
    const adminToken = searchParams.get('adminToken');
    if (adminToken) {
      setAutoLoggingIn(true);
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
          setError('Đăng nhập tự động thất bại hoặc phiên làm việc không hợp lệ.');
          setAutoLoggingIn(false);
        });
    }
  }, [searchParams, loadUser, navigate, setError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Vui lòng nhập tên đăng nhập');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await login(username.trim(), password);
      if (result?.user?.role === 'NPP') {
        navigate('/npp/scan', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      // Error handled by AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-effects">
        <div className="bg-orb orb-1"></div>
        <div className="bg-orb orb-2"></div>
        <div className="bg-orb orb-3"></div>
        <div className="bg-grid"></div>
      </div>

      <div className="login-container animate-scale-in">
        <div className="login-card glass-strong">
          {/* Header */}
          <div className="login-header">
            <div className="login-logo">
              <Shield size={32} />
            </div>
            <h1>TEM Portal</h1>
            <p>Hệ thống Quản lý Tem nhãn Thông minh</p>
          </div>

          {autoLoggingIn ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '20px 0' }}>
              <div className="loading-spinner" style={{ width: 36, height: 36, borderWidth: 3 }}></div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>{statusText}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="login-form">
              {error && (
                <div className="login-error animate-fade-in">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="input-group">
                <label htmlFor="login-username">Tên đăng nhập / Email</label>
                <input
                  id="login-username"
                  type="text"
                  className="input"
                  placeholder="Nhập tên đăng nhập hoặc email"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(null); }}
                  disabled={loading}
                  autoFocus
                />
              </div>

              <div className="input-group">
                <label htmlFor="login-password">Mật khẩu</label>
                <div className="password-wrapper">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className="input"
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
                {loading ? (
                  <>
                    <div className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div>
                    <span>Đang đăng nhập...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    <span>Đăng nhập</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
