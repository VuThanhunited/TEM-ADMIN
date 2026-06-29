import { useState, useEffect } from 'react';
import { Store, User, Mail, Lock, Eye, EyeOff, MapPin, Building2, ChevronDown, AlertCircle, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import userApi from '../../services/api';
import './NppRegister.css';

export default function NppRegister() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [enterpriseId, setEnterpriseId] = useState('');
  const [enterprises, setEnterprises] = useState([]);

  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch enterprises list & auto-detect scanned enterprise
  useEffect(() => {
    const initPage = async () => {
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
          } catch { /* ignore parse error */ }
        }
      } catch (err) {
        console.error('Failed to load enterprises:', err);
        setError('Không thể tải danh sách doanh nghiệp liên kết');
      } finally {
        setFetchLoading(false);
      }
    };
    initPage();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim()) { setError('Vui lòng nhập tên đăng nhập'); return; }
    if (username.trim().length < 3) { setError('Tên đăng nhập phải có ít nhất 3 ký tự'); return; }
    if (!email.trim()) { setError('Vui lòng nhập email'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) { setError('Email không hợp lệ'); return; }
    if (!password) { setError('Vui lòng nhập mật khẩu'); return; }
    if (password.length < 6) { setError('Mật khẩu phải có ít nhất 6 ký tự'); return; }
    if (!fullName.trim()) { setError('Vui lòng nhập tên nhà phân phối'); return; }
    if (!enterpriseId) { setError('Vui lòng chọn doanh nghiệp sản xuất liên kết'); return; }

    setLoading(true);
    setError('');

    try {
      const result = await userApi.nppRegister({
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
      navigate('/scan', { replace: true });
    } catch (err) {
      setError(err.message || 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-bg-top" />

      <div className="register-card">
        {/* Logo */}
        <div className="register-logo-wrap">
          <Store size={36} className="register-logo-icon" strokeWidth={1.6} />
        </div>

        <h1 className="register-brand-name">ĐĂNG KÝ NPP</h1>
        <p className="register-brand-sub">Dành cho Nhà phân phối & Điểm bán</p>

        {/* Form */}
        <form className="register-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="register-error">
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Username */}
          <div className="register-input-wrap">
            <User size={16} className="register-input-icon" />
            <input
              id="npp-reg-username"
              type="text"
              className="register-input"
              placeholder="Tên đăng nhập (viết liền không dấu)*"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              autoComplete="username"
              autoCapitalize="none"
              disabled={loading || fetchLoading}
            />
          </div>

          {/* Email */}
          <div className="register-input-wrap">
            <Mail size={16} className="register-input-icon" />
            <input
              id="npp-reg-email"
              type="email"
              className="register-input"
              placeholder="Địa chỉ Email*"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              autoComplete="email"
              disabled={loading || fetchLoading}
            />
          </div>

          {/* Password */}
          <div className="register-input-wrap">
            <Lock size={16} className="register-input-icon" />
            <input
              id="npp-reg-password"
              type={showPw ? 'text' : 'password'}
              className="register-input"
              placeholder="Mật khẩu (tối thiểu 6 ký tự)*"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              autoComplete="new-password"
              disabled={loading || fetchLoading}
            />
            <button
              type="button"
              className="register-pw-toggle"
              onClick={() => setShowPw(!showPw)}
              tabIndex={-1}
              aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* NPP Full Name */}
          <div className="register-input-wrap">
            <Store size={16} className="register-input-icon" />
            <input
              id="npp-reg-fullname"
              type="text"
              className="register-input"
              placeholder="Tên Điểm bán / Nhà phân phối*"
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); setError(''); }}
              disabled={loading || fetchLoading}
            />
          </div>

          {/* Address */}
          <div className="register-input-wrap">
            <MapPin size={16} className="register-input-icon" />
            <input
              id="npp-reg-address"
              type="text"
              className="register-input"
              placeholder="Địa chỉ hoạt động"
              value={address}
              onChange={(e) => { setAddress(e.target.value); setError(''); }}
              disabled={loading || fetchLoading}
            />
          </div>

          {/* Enterprise Selection */}
          <div className="register-input-wrap">
            <Building2 size={16} className="register-input-icon" />
            <select
              id="npp-reg-enterprise"
              className="register-select"
              value={enterpriseId}
              onChange={(e) => { setEnterpriseId(e.target.value); setError(''); }}
              disabled={loading || fetchLoading}
            >
              <option value="">Chọn doanh nghiệp sản xuất liên kết*</option>
              {enterprises.map((ent) => (
                <option key={ent._id} value={ent._id}>
                  {ent.name}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="register-select-arrow" />
          </div>

          {/* Submit */}
          <button
            type="submit"
            id="npp-register-submit"
            className="register-submit-btn"
            disabled={loading || fetchLoading}
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

        <p className="register-footer-text">
          Đã có tài khoản?{' '}
          <span className="register-link-login" onClick={() => navigate('/npp/login')}>
            Đăng nhập ngay
          </span>
        </p>
      </div>

      <p className="register-footer">Phiên bản 1.0.0</p>
    </div>
  );
}
