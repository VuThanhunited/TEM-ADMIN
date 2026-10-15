import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  Store,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  Phone,
  FileText,
  AlertCircle,
  UserPlus,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import userApi from '../../services/api';
import '../Login/Login.css'; // Shared Login & Register styles

export default function Register() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Determine initial tab from query parameter (?tab=npp or ?tab=nsx)
  const queryTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(queryTab === 'npp' ? 'npp' : 'nsx');

  // Shared account fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // NSX specific fields
  const [enterpriseName, setEnterpriseName] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [representativeName, setRepresentativeName] = useState(''); // Họ tên người đại diện NSX

  // NPP specific fields
  const [nppName, setNppName] = useState(''); // Tên nhà phân phối / Đại lý
  const [contactPerson, setContactPerson] = useState(''); // Người phụ trách kho / liên hệ
  const [enterpriseId, setEnterpriseId] = useState(''); // NSX liên kết
  const [enterprises, setEnterprises] = useState([]);

  // UI States
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  // Clear inputs and error when switching tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setPhone('');
    setAddress('');
    setEnterpriseName('');
    setTaxCode('');
    setRepresentativeName('');
    setNppName('');
    setContactPerson('');
    setEnterpriseId('');
    setError('');
    setSuccessData(null);
    setSearchParams({ tab });
  };

  // Fetch enterprises if active tab is NPP
  useEffect(() => {
    if (activeTab === 'npp') {
      const loadEnterprises = async () => {
        setFetchLoading(true);
        try {
          const list = await userApi.getPublicEnterprises();
          setEnterprises(Array.isArray(list) ? list : []);

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
          setError('Không thể tải danh sách nhà sản xuất liên kết');
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
    } else if (queryTab === 'nsx' && activeTab !== 'nsx') {
      setActiveTab('nsx');
    }
  }, [queryTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // --- Validation logic ---
    if (activeTab === 'nsx') {
      if (!enterpriseName.trim()) {
        setError('Vui lòng nhập tên doanh nghiệp / nhà sản xuất');
        return;
      }
      if (!representativeName.trim()) {
        setError('Vui lòng nhập họ và tên người đại diện');
        return;
      }
    } else {
      if (!enterpriseId) {
        setError('Vui lòng chọn doanh nghiệp sản xuất liên kết');
        return;
      }
      if (!nppName.trim()) {
        setError('Vui lòng nhập tên nhà phân phối / đại lý');
        return;
      }
    }

    if (!phone.trim()) {
      setError('Vui lòng nhập số điện thoại liên hệ');
      return;
    }
    const cleanPhone = phone.replace(/[\s.-]/g, '');
    if (!/^[0-9]{8,15}$/.test(cleanPhone)) {
      setError('Số điện thoại không hợp lệ (từ 8 đến 15 chữ số)');
      return;
    }

    if (!email.trim()) {
      setError('Vui lòng nhập địa chỉ email');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Địa chỉ email không đúng định dạng');
      return;
    }

    if (!username.trim()) {
      setError('Vui lòng nhập tên đăng nhập');
      return;
    }
    if (username.trim().length < 3) {
      setError('Tên đăng nhập phải có ít nhất 3 ký tự');
      return;
    }
    if (/\s/.test(username.trim())) {
      setError('Tên đăng nhập không được chứa khoảng trắng');
      return;
    }

    if (!password) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);

    try {
      if (activeTab === 'nsx') {
        const result = await userApi.nsxRegister({
          username: username.trim(),
          email: email.trim(),
          password,
          fullName: representativeName.trim(),
          enterpriseName: enterpriseName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          taxCode: taxCode.trim()
        });

        setSuccessData({
          role: 'NSX',
          roleTitle: 'Nhà sản xuất',
          name: enterpriseName.trim(),
          username: username.trim(),
          email: email.trim(),
          token: result?.token
        });
      } else {
        const result = await userApi.nppRegister({
          username: username.trim(),
          email: email.trim(),
          password,
          fullName: nppName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          enterpriseId,
          contactPerson: contactPerson.trim()
        });

        // Pre-check for scan redirect
        const savedRedirect = sessionStorage.getItem('npp_redirect_after_login');
        if (savedRedirect) {
          try {
            const { path, state } = JSON.parse(savedRedirect);
            sessionStorage.removeItem('npp_redirect_after_login');
            navigate(`/login?tab=npp&redirect=${encodeURIComponent(path)}`, { state, replace: true });
            return;
          } catch { /* ignore parse error */ }
        }

        setSuccessData({
          role: 'NPP',
          roleTitle: 'Nhà phân phối',
          name: nppName.trim(),
          username: username.trim(),
          email: email.trim(),
          token: result?.token
        });
      }
    } catch (err) {
      setError(err.message || 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigate('/login?tab=npp', { replace: true });
  };

  return (
    <div className={`login-page ${activeTab === 'npp' ? 'npp-mode' : 'nsx-mode'}`}>
      <div className="login-bg-top" />

      <div className="login-card register-card">
        {/* Success Screen */}
        {successData ? (
          <div className="register-success-box">
            <div className="register-success-icon-wrap">
              <CheckCircle2 size={40} strokeWidth={2.2} />
            </div>

            <h2 className="register-success-title">Đăng ký thành công!</h2>
            <p className="register-success-desc">
              Tài khoản <strong>{successData.roleTitle}</strong> đã được khởi tạo thành công trên hệ thống.
            </p>

            <div className="register-success-details">
              <div className="register-detail-row">
                <span className="label">Loại tài khoản:</span>
                <span className={`register-badge-role ${successData.role.toLowerCase()}`}>
                  {successData.roleTitle}
                </span>
              </div>
              <div className="register-detail-row">
                <span className="label">Đơn vị:</span>
                <span className="value">{successData.name}</span>
              </div>
              <div className="register-detail-row">
                <span className="label">Tên đăng nhập:</span>
                <span className="value">{successData.username}</span>
              </div>
              <div className="register-detail-row">
                <span className="label">Email:</span>
                <span className="value">{successData.email}</span>
              </div>
            </div>

            <button
              type="button"
              className="login-submit-btn"
              onClick={handleGoToLogin}
            >
              Đăng nhập ngay
              <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <>
            {/* Role Tabs */}
            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab ${activeTab === 'nsx' ? 'active' : ''}`}
                onClick={() => handleTabChange('nsx')}
              >
                <Building2 size={16} />
                Nhà sản xuất
              </button>
              <button
                type="button"
                className={`auth-tab ${activeTab === 'npp' ? 'active' : ''}`}
                onClick={() => handleTabChange('npp')}
              >
                <Store size={16} />
                Nhà phân phối
              </button>
            </div>

            {/* Dynamic Logo/Branding */}
            <div className="login-logo-wrap">
              {activeTab === 'nsx' ? (
                <Building2 size={40} className="login-logo-icon" strokeWidth={1.6} />
              ) : (
                <Store size={40} className="login-logo-icon" strokeWidth={1.6} />
              )}
            </div>

            <h1 className="login-brand-name">
              {activeTab === 'nsx' ? 'ĐĂNG KÝ NHÀ SẢN XUẤT' : 'ĐĂNG KÝ NHÀ PHÂN PHỐI'}
            </h1>
            <p className="login-brand-sub">
              {activeTab === 'nsx'
                ? 'Dành cho Doanh nghiệp & Cơ sở sản xuất sản phẩm'
                : 'Dành cho Đại lý & Nhà phân phối liên kết chuỗi cung ứng'}
            </p>

            {/* Form */}
            <form className="login-form" onSubmit={handleSubmit} noValidate>
              {error && (
                <div className="login-error">
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              {/* ---------------- SECTION 1: THÔNG TIN ĐƠN VỊ ---------------- */}
              <div className="register-section-divider">
                <span>
                  {activeTab === 'nsx' ? 'Thông tin doanh nghiệp sản xuất' : 'Thông tin nhà phân phối & liên kết'}
                </span>
              </div>

              {activeTab === 'nsx' ? (
                <>
                  {/* Tên doanh nghiệp */}
                  <div className="register-input-group">
                    <label className="register-input-label">
                      Tên doanh nghiệp / Cơ sở sản xuất <span className="required-star">*</span>
                    </label>
                    <div className="login-input-wrap">
                      <Building2 size={16} className="login-input-icon" />
                      <input
                        id="auth-reg-enterprise-name"
                        type="text"
                        className="login-input"
                        placeholder="Tên doanh nghiệp / cơ sở sản xuất"
                        value={enterpriseName}
                        onChange={(e) => { setEnterpriseName(e.target.value); setError(''); }}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Họ tên người đại diện */}
                  <div className="register-input-group">
                    <label className="register-input-label">
                      Người đại diện / Người liên hệ <span className="required-star">*</span>
                    </label>
                    <div className="login-input-wrap">
                      <User size={16} className="login-input-icon" />
                      <input
                        id="auth-reg-rep-name"
                        type="text"
                        className="login-input"
                        placeholder="Họ và tên người đại diện"
                        value={representativeName}
                        onChange={(e) => { setRepresentativeName(e.target.value); setError(''); }}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* 2 cột: Mã số thuế & Địa chỉ trụ sở */}
                  <div className="form-row-2col">
                    <div className="register-input-group">
                      <label className="register-input-label">
                        Mã số thuế <span className="optional-tag">(tùy chọn)</span>
                      </label>
                      <div className="login-input-wrap">
                        <FileText size={16} className="login-input-icon" />
                        <input
                          id="auth-reg-taxcode"
                          type="text"
                          className="login-input"
                          placeholder="Mã số thuế / GPKD"
                          value={taxCode}
                          onChange={(e) => { setTaxCode(e.target.value); setError(''); }}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="register-input-group">
                      <label className="register-input-label">
                        Địa chỉ trụ sở / Xưởng <span className="optional-tag">(tùy chọn)</span>
                      </label>
                      <div className="login-input-wrap">
                        <MapPin size={16} className="login-input-icon" />
                        <input
                          id="auth-reg-address-nsx"
                          type="text"
                          className="login-input"
                          placeholder="Địa chỉ trụ sở hoặc xưởng"
                          value={address}
                          onChange={(e) => { setAddress(e.target.value); setError(''); }}
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Doanh nghiệp sản xuất liên kết (Bắt buộc cho NPP) */}
                  <div className="register-input-group">
                    <label className="register-input-label">
                      Doanh nghiệp sản xuất liên kết <span className="required-star">*</span>
                    </label>
                    <div className="login-input-wrap">
                      <Building2 size={16} className="login-input-icon" />
                      <select
                        id="auth-reg-enterprise"
                        className="login-select"
                        value={enterpriseId}
                        onChange={(e) => { setEnterpriseId(e.target.value); setError(''); }}
                        disabled={loading || fetchLoading}
                      >
                        <option value="">-- Chọn doanh nghiệp sản xuất liên kết --</option>
                        {enterprises.map((ent) => (
                          <option key={ent._id} value={ent._id}>
                            {ent.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Tên nhà phân phối / Đại lý */}
                  <div className="register-input-group">
                    <label className="register-input-label">
                      Tên Nhà phân phối / Đại lý <span className="required-star">*</span>
                    </label>
                    <div className="login-input-wrap">
                      <Store size={16} className="login-input-icon" />
                      <input
                        id="auth-reg-npp-name"
                        type="text"
                        className="login-input"
                        placeholder="Tên Nhà phân phối / Đại lý"
                        value={nppName}
                        onChange={(e) => { setNppName(e.target.value); setError(''); }}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* 2 cột: Người phụ trách & Địa chỉ kho hàng */}
                  <div className="form-row-2col">
                    <div className="register-input-group">
                      <label className="register-input-label">
                        Người phụ trách <span className="optional-tag">(tùy chọn)</span>
                      </label>
                      <div className="login-input-wrap">
                        <User size={16} className="login-input-icon" />
                        <input
                          id="auth-reg-contact-person"
                          type="text"
                          className="login-input"
                          placeholder="Người liên hệ / kho"
                          value={contactPerson}
                          onChange={(e) => { setContactPerson(e.target.value); setError(''); }}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="register-input-group">
                      <label className="register-input-label">
                        Địa chỉ kho hàng <span className="optional-tag">(tùy chọn)</span>
                      </label>
                      <div className="login-input-wrap">
                        <MapPin size={16} className="login-input-icon" />
                        <input
                          id="auth-reg-address-npp"
                          type="text"
                          className="login-input"
                          placeholder="Địa chỉ kho / đại lý"
                          value={address}
                          onChange={(e) => { setAddress(e.target.value); setError(''); }}
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ---------------- SECTION 2: TÀI KHOẢN ĐĂNG NHẬP ---------------- */}
              <div className="register-section-divider">
                <span>Thông tin tài khoản đăng nhập</span>
              </div>

              {/* 2 cột: Số điện thoại & Email */}
              <div className="form-row-2col">
                <div className="register-input-group">
                  <label className="register-input-label">
                    Số điện thoại liên hệ <span className="required-star">*</span>
                  </label>
                  <div className="login-input-wrap">
                    <Phone size={16} className="login-input-icon" />
                    <input
                      id="auth-reg-phone"
                      type="tel"
                      className="login-input"
                      placeholder="VD: 0901234567"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setError(''); }}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="register-input-group">
                  <label className="register-input-label">
                    Địa chỉ Email <span className="required-star">*</span>
                  </label>
                  <div className="login-input-wrap">
                    <Mail size={16} className="login-input-icon" />
                    <input
                      id="auth-reg-email"
                      type="email"
                      className="login-input"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      autoComplete="email"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Tên đăng nhập */}
              <div className="register-input-group">
                <label className="register-input-label">
                  Tên đăng nhập <span className="required-star">*</span>
                </label>
                <div className="login-input-wrap">
                  <User size={16} className="login-input-icon" />
                  <input
                    id="auth-reg-username"
                    type="text"
                    className="login-input"
                    placeholder="Tên đăng nhập (viết liền không dấu)"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(''); }}
                    autoComplete="username"
                    autoCapitalize="none"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* 2 cột: Mật khẩu & Nhập lại mật khẩu */}
              <div className="form-row-2col">
                <div className="register-input-group">
                  <label className="register-input-label">
                    Mật khẩu <span className="required-star">*</span>
                  </label>
                  <div className="login-input-wrap">
                    <Lock size={16} className="login-input-icon" />
                    <input
                      id="auth-reg-password"
                      type={showPw ? 'text' : 'password'}
                      className="login-input"
                      placeholder="Mật khẩu (≥ 6 ký tự)"
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
                </div>

                <div className="register-input-group">
                  <label className="register-input-label">
                    Xác nhận mật khẩu <span className="required-star">*</span>
                  </label>
                  <div className="login-input-wrap">
                    <Lock size={16} className="login-input-icon" />
                    <input
                      id="auth-reg-confirm-password"
                      type={showConfirmPw ? 'text' : 'password'}
                      className="login-input"
                      placeholder="Nhập lại mật khẩu"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                      autoComplete="new-password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="login-pw-toggle"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      tabIndex={-1}
                      aria-label={showConfirmPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
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
                    <UserPlus size={18} />
                    {activeTab === 'nsx' ? 'Đăng ký Nhà sản xuất' : 'Đăng ký Nhà phân phối'}
                  </>
                )}
              </button>
            </form>

            <p
              className="login-register-text"
              style={{ fontSize: '0.85rem', color: '#546E7A', marginTop: '18px', textAlign: 'center' }}
            >
              Đã có tài khoản?{' '}
              <span
                className="login-register-link"
                style={{ color: 'var(--primary-color)', fontWeight: '600', cursor: 'pointer' }}
                onClick={handleGoToLogin}
              >
                Đăng nhập ngay
              </span>
            </p>
          </>
        )}
      </div>

      <p className="login-footer">Hệ thống Tem Thông Minh © Phiên bản 1.0.0</p>
    </div>
  );
}
