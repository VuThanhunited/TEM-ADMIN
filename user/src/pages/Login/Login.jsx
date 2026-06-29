import { useState } from 'react';
import { Store, User, Lock, Eye, EyeOff, AlertCircle, LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import userApi from '../../services/api';
import './Login.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) { setError('Vui lòng nhập tên đăng nhập'); return; }
    if (!password) { setError('Vui lòng nhập mật khẩu'); return; }

    setLoading(true);
    setError('');

    try {
      const result = await userApi.nppLogin({ username: username.trim(), password });
      login(result.user, result.token);

      // Check if there's a redirect from ScanChoice (NPP chose "Nhập hàng" before login)
      const savedRedirect = sessionStorage.getItem('npp_redirect_after_login');
      if (savedRedirect) {
        try {
          const { path, state } = JSON.parse(savedRedirect);
          sessionStorage.removeItem('npp_redirect_after_login');
          navigate(path, { state, replace: true });
          return;
        } catch { /* ignore parse error */ }
      }
      navigate('/scan', { replace: true });
    } catch (err) {
      setError(err.message || 'Tên đăng nhập hoặc mật khẩu không đúng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-top" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo-wrap">
          <Store size={42} className="login-logo-icon" strokeWidth={1.6} />
        </div>

        <h1 className="login-brand-name">NHÀ PHÂN PHỐI</h1>
        <p className="login-brand-sub">Quản lý nhập hàng</p>

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="login-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Username */}
          <div className="login-input-wrap">
            <User size={17} className="login-input-icon" />
            <input
              id="npp-username"
              type="text"
              className="login-input"
              placeholder="Tên đăng nhập"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              autoComplete="username"
              autoCapitalize="none"
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div className="login-input-wrap">
            <Lock size={17} className="login-input-icon" />
            <input
              id="npp-password"
              type={showPw ? 'text' : 'password'}
              className="login-input"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              autoComplete="current-password"
              disabled={loading}
            />
            <button
              type="button"
              className="login-pw-toggle"
              onClick={() => setShowPw(!showPw)}
              tabIndex={-1}
              aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>

          {/* Remember + Forgot */}
          <div className="login-options-row">
            <label className="login-remember">
              <input
                type="checkbox"
                className="login-remember-check"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span className="login-remember-label">Ghi nhớ đăng nhập</span>
            </label>
            <button type="button" className="login-forgot">Quên mật khẩu.</button>
          </div>

          <button
            type="submit"
            id="npp-login-submit"
            className="login-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="btn-spinner" />
                Đang đăng nhập...
              </>
            ) : (
              <>
                <LogIn size={18} />
                Đăng nhập
              </>
            )}
          </button>
        </form>

        <p className="login-register-text" style={{ fontSize: '0.85rem', color: '#546E7A', marginTop: '18px', textAlign: 'center' }}>
          Chưa có tài khoản?{' '}
          <span 
            className="login-register-link" 
            style={{ color: '#1565C0', fontWeight: '600', cursor: 'pointer' }}
            onClick={() => navigate('/register')}
          >
            Đăng ký NPP ngay
          </span>
        </p>
      </div>

      <p className="login-footer">Phiên bản 1.0.0</p>
    </div>
  );
}
