import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Leaf, Store, User, Lock, Eye, EyeOff, AlertCircle, LogIn, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import userApi from '../../services/api';
import './Login.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Determine initial tab from query parameter (?tab=npp)
  const queryTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(queryTab === 'npp' ? 'npp' : 'guest');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Xử lý tự động đăng nhập khi truy cập với adminToken
  useEffect(() => {
    const adminToken = searchParams.get('adminToken');
    if (!adminToken) return;

    // Decode token để lấy thông tin user tạm thời
    try {
      const payload = JSON.parse(atob(adminToken.split('.')[1]));
      const adminAppUrl = import.meta.env.VITE_ADMIN_URL ||
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? 'http://localhost:5173'
          : 'https://www.giaiphapqrcode.vn');

      if (payload.role === 'ADMIN' || payload.role === 'NSX') {
        window.location.href = `${adminAppUrl}/dashboard?adminToken=${encodeURIComponent(adminToken)}`;
        return;
      }
      const userData = {
        _id: payload.userId,
        role: payload.role || 'NPP',
        fullName: 'Admin (Đang xem)',
        username: 'admin',
        isAdminImpersonating: true
      };
      login(userData, adminToken);
      navigate('/scan', { replace: true });
    } catch {
      setError('Token không hợp lệ');
    }
  }, []);

  // Clear inputs and error when switching tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setUsername('');
    setPassword('');
    setError('');
    setSearchParams({ tab });
  };

  // Sync tab state with URL query parameters
  useEffect(() => {
    if (queryTab === 'npp' && activeTab !== 'npp') {
      setActiveTab('npp');
    } else if (queryTab !== 'npp' && activeTab !== 'guest') {
      setActiveTab('guest');
    }
  }, [queryTab]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError(activeTab === 'npp' ? 'Vui lòng nhập tên đăng nhập NPP' : 'Vui lòng nhập tên đăng nhập hoặc email');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let result;
      if (activeTab === 'npp') {
        result = await userApi.nppLogin({ username: username.trim(), password });
      } else {
        result = await userApi.guestLogin({ username: username.trim(), password });
      }

      // Sync local storage in user app
      localStorage.setItem('tem_token', result.token);
      localStorage.setItem('npp_scan_token', result.token);
      localStorage.setItem('npp_scan_user', JSON.stringify(result.user));
      login(result.user, result.token);

      const role = result.user?.role;
      const adminAppUrl = import.meta.env.VITE_ADMIN_URL ||
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? 'http://localhost:5173'
          : 'https://www.giaiphapqrcode.vn');

      // Check if user came from a specific scan/store redirect
      const redirectAfter = sessionStorage.getItem('npp_redirect_after_login');
      if (redirectAfter && role === 'NPP') {
        try {
          const parsed = JSON.parse(redirectAfter);
          sessionStorage.removeItem('npp_redirect_after_login');
          navigate(parsed.path, { state: parsed.state, replace: true });
          return;
        } catch {}
      }

      if (role === 'ADMIN' || role === 'NSX') {
        window.location.href = `${adminAppUrl}/dashboard?adminToken=${encodeURIComponent(result.token)}`;
        return;
      } else if (role === 'NPP') {
        window.location.href = `${adminAppUrl}/npp/scan?adminToken=${encodeURIComponent(result.token)}`;
        return;
      } else {
        navigate('/scan', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Tên đăng nhập hoặc mật khẩu không đúng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`login-page ${activeTab === 'npp' ? 'npp-mode' : ''}`}>
      <div className="login-bg-top" />

      <div className="login-card">
        {/* Role Tabs */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${activeTab === 'guest' ? 'active' : ''}`}
            onClick={() => handleTabChange('guest')}
          >
            <ShieldAlert size={15} />
            ADMIN
          </button>
          <button
            type="button"
            className={`auth-tab ${activeTab === 'npp' ? 'active' : ''}`}
            onClick={() => handleTabChange('npp')}
          >
            <Store size={15} />
            NSX / NPP
          </button>
        </div>

        {/* Dynamic Logo/Branding */}
        <div className="login-logo-wrap">
          {activeTab === 'npp' ? (
            <Store size={42} className="login-logo-icon" strokeWidth={1.6} />
          ) : (
            <ShieldAlert size={42} className="login-logo-icon" strokeWidth={1.6} />
          )}
        </div>

        <h1 className="login-brand-name">
          {activeTab === 'npp' ? 'NHÀ SẢN XUẤT / NPP' : 'HỆ THỐNG ADMIN'}
        </h1>
        <p className="login-brand-sub">
          {activeTab === 'npp' ? 'NSX, NPP & Admin quản lý quét sản phẩm' : 'Đăng nhập dành cho Quản trị viên'}
        </p>

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
              id="auth-username"
              type="text"
              className="login-input"
              placeholder={activeTab === 'npp' ? 'Tên đăng nhập NSX / NPP / Admin' : 'Tên đăng nhập Admin'}
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
              id="auth-password"
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
            <button type="button" className="login-forgot">Quên mật khẩu?</button>
          </div>

          <button
            type="submit"
            id="auth-login-submit"
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

        {activeTab === 'npp' && (
          <p className="login-register-text" style={{ fontSize: '0.85rem', color: '#546E7A', marginTop: '18px', textAlign: 'center' }}>
            Chưa có tài khoản?{' '}
            <span
              className="login-register-link"
              style={{ color: 'var(--primary-color)', fontWeight: '600', cursor: 'pointer' }}
              onClick={() => navigate(`/register?tab=${activeTab}`)}
            >
              Đăng ký ngay
            </span>
          </p>
        )}
      </div>

      <p className="login-footer">Phiên bản 1.0.0</p>
    </div>
  );
}
