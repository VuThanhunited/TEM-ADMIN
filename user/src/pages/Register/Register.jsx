import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Leaf, Store, User, Mail, Lock, Eye, EyeOff, MapPin, Building2, AlertCircle, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import userApi from '../../services/api';
import '../Login/Login.css'; // Reuse Login styles

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Determine initial tab from query parameter (?tab=npp)
  const queryTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(queryTab === 'npp' ? 'npp' : 'guest');

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [enterpriseId, setEnterpriseId] = useState('');
  const [enterprises, setEnterprises] = useState([]);

  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState('');

  // Clear inputs and error when switching tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setUsername('');
    setEmail('');
    setPassword('');
    setFullName('');
    setAddress('');
    setEnterpriseId('');
    setError('');
    setSearchParams({ tab });
  };

  // Fetch enterprises if active tab is NPP
  useEffect(() => {
    if (activeTab === 'npp') {
      const loadEnterprises = async () => {
        setFetchLoading(true);
        try {
          const list = await userApi.getPublicEnterprises();
          setEnterprises(list);

          // Pre-select enterprise if coming from a QR scan redirect
          const savedRedirect = sessionStorage.getItem('npp_redirect_after_login');
          if (savedRedirect) {
            try {
              const { state } = JSON.parse(savedRedirect);
              const scannedEnterpriseId = state?.scanData?.enterprise?._id;
              if (scannedEnterpriseId) {
                setEnterpriseId(scannedEnterpriseId);
              }
            } catch { /* ignore */ }
          }
        } catch (err) {
          console.error('Failed to load enterprises:', err);
          setError('Không thể tải danh sách doanh nghiệp liên kết');
        } finally {
          setFetchLoading(false);
        }
      };
      loadEnterprises();
    }
  }, [activeTab]);

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

    if (!username.trim()) { setError('Vui lòng nhập tên đăng nhập'); return; }
    if (username.trim().length < 3) { setError('Tên đăng nhập phải có ít nhất 3 ký tự'); return; }
    if (!email.trim()) { setError('Vui lòng nhập email'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) { setError('Email không hợp lệ'); return; }
    if (!password) { setError('Vui lòng nhập mật khẩu'); return; }
    if (password.length < 6) { setError('Mật khẩu phải có ít nhất 6 ký tự'); return; }
    if (!fullName.trim()) {
      setError(activeTab === 'npp' ? 'Vui lòng nhập tên nhà phân phối' : 'Vui lòng nhập họ và tên');
      return;
    }
    if (activeTab === 'npp' && !enterpriseId) {
      setError('Vui lòng chọn doanh nghiệp sản xuất liên kết');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let result;
      if (activeTab === 'npp') {
        result = await userApi.nppRegister({
          username: username.trim(),
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          address: address.trim(),
          enterpriseId
        });
        login(result.user, result.token);

        // Redirect after registration
        const savedRedirect = sessionStorage.getItem('npp_redirect_after_login');
        if (savedRedirect) {
          try {
            const { path, state } = JSON.parse(savedRedirect);
            sessionStorage.removeItem('npp_redirect_after_login');
            navigate(path, { state, replace: true });
            return;
          } catch { /* ignore parse error */ }
        }
        navigate('/login?tab=npp', { replace: true });
      } else {
        result = await userApi.guestRegister({
          username: username.trim(),
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          address: address.trim()
        });
        login(result.user, result.token);

        // Redirect after registration
        const savedRedirect = sessionStorage.getItem('guest_redirect_after_login');
        if (savedRedirect) {
          try {
            const { path, state } = JSON.parse(savedRedirect);
            sessionStorage.removeItem('guest_redirect_after_login');
            navigate(path, { state, replace: true });
            return;
          } catch { /* ignore parse error */ }
        }
        navigate('/home', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.');
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
            <User size={15} />
            Khách hàng
          </button>
          <button
            type="button"
            className={`auth-tab ${activeTab === 'npp' ? 'active' : ''}`}
            onClick={() => handleTabChange('npp')}
          >
            <Store size={15} />
            Nhà phân phối
          </button>
        </div>

        {/* Dynamic Logo/Branding */}
        <div className="login-logo-wrap">
          {activeTab === 'npp' ? (
            <Store size={42} className="login-logo-icon" strokeWidth={1.6} />
          ) : (
            <Leaf size={42} className="login-logo-icon" strokeWidth={1.6} />
          )}
        </div>

        <h1 className="login-brand-name">
          {activeTab === 'npp' ? 'ĐĂNG KÝ NPP' : 'ĐĂNG KÝ THÀNH VIÊN'}
        </h1>
        <p className="login-brand-sub">
          {activeTab === 'npp' ? 'Nhà phân phối liên kết hệ thống' : 'Đồng hành cùng sản phẩm chính hãng'}
        </p>

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="login-error">
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Username */}
          <div className="login-input-wrap">
            <User size={16} className="login-input-icon" />
            <input
              id="auth-reg-username"
              type="text"
              className="login-input"
              placeholder="Tên đăng nhập (viết liền không dấu)*"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              autoComplete="username"
              autoCapitalize="none"
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div className="login-input-wrap">
            <Mail size={16} className="login-input-icon" />
            <input
              id="auth-reg-email"
              type="email"
              className="login-input"
              placeholder="Địa chỉ Email*"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              autoComplete="email"
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div className="login-input-wrap">
            <Lock size={16} className="login-input-icon" />
            <input
              id="auth-reg-password"
              type={showPw ? 'text' : 'password'}
              className="login-input"
              placeholder="Mật khẩu (tối thiểu 6 ký tự)*"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              autoComplete="new-password"
              disabled={loading}
            />
            <button
              type="button"
              className="login-pw-toggle"
              onClick={() => setShowPw(!showPw)}
              tabIndex={-1}
              aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Full Name */}
          <div className="login-input-wrap">
            <User size={16} className="login-input-icon" />
            <input
              id="auth-reg-fullname"
              type="text"
              className="login-input"
              placeholder={activeTab === 'npp' ? 'Tên nhà phân phối*' : 'Họ và tên của bạn*'}
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); setError(''); }}
              disabled={loading}
            />
          </div>

          {/* Enterprise Dropdown (NPP only) */}
          {activeTab === 'npp' && (
            <div className="login-input-wrap">
              <Building2 size={16} className="login-input-icon" />
              <select
                id="auth-reg-enterprise"
                className="login-select"
                value={enterpriseId}
                onChange={(e) => { setEnterpriseId(e.target.value); setError(''); }}
                disabled={loading || fetchLoading}
              >
                <option value="">-- Chọn doanh nghiệp liên kết * --</option>
                {enterprises.map((ent) => (
                  <option key={ent._id} value={ent._id}>
                    {ent.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Address */}
          <div className="login-input-wrap">
            <MapPin size={16} className="login-input-icon" />
            <input
              id="auth-reg-address"
              type="text"
              className="login-input"
              placeholder="Địa chỉ liên hệ"
              value={address}
              onChange={(e) => { setAddress(e.target.value); setError(''); }}
              disabled={loading}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            id="auth-register-submit"
            className="login-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="btn-spinner" />
                Đang xử lý đăng ký...
              </>
            ) : (
              <>
                <UserPlus size={17} />
                Đăng ký tài khoản
              </>
            )}
          </button>
        </form>

        <p className="login-register-text" style={{ fontSize: '0.85rem', color: '#546E7A', marginTop: '18px', textAlign: 'center' }}>
          Đã có tài khoản?{' '}
          <span
            className="login-register-link"
            style={{ color: 'var(--primary-color)', fontWeight: '600', cursor: 'pointer' }}
            onClick={() => navigate(`/login?tab=${activeTab}`)}
          >
            Đăng nhập ngay
          </span>
        </p>
      </div>

      <p className="login-footer">Phiên bản 1.0.0</p>
    </div>
  );
}
