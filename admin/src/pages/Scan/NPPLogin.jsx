import { useState } from 'react';
import { X, LogIn, Eye, EyeOff, Truck, AlertCircle, Lock } from 'lucide-react';
import api from '../../services/api';

export default function NPPLogin({ onSuccess, onClose, scanSerial }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await api.nppLogin({ username: username.trim(), password });
      // Store token under a separate key to not conflict with admin session
      localStorage.setItem('npp_scan_token', result.token);
      localStorage.setItem('npp_scan_user', JSON.stringify(result.user));
      onSuccess(result.user, result.token);
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="npp-login-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="npp-login-modal">
        {/* Header */}
        <div className="npp-login-header">
          <div className="npp-login-icon-wrap">
            <Truck size={28} strokeWidth={2} />
          </div>
          <div className="npp-login-header-text">
            <h2>Đăng nhập NPP</h2>
            <p>Nhà phân phối – nhập dữ liệu phân phối</p>
          </div>
          <button className="npp-login-close" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* Serial context */}
        <div className="npp-login-context">
          <Lock size={13} />
          <span>Bạn đang xử lý tem: <strong>{scanSerial}</strong></span>
        </div>

        {/* Form */}
        <form className="npp-login-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="npp-login-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="npp-login-field">
            <label htmlFor="npp-username">Tên đăng nhập NPP</label>
            <input
              id="npp-username"
              type="text"
              placeholder="Nhập tên đăng nhập..."
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              autoComplete="username"
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="npp-login-field">
            <label htmlFor="npp-password">Mật khẩu</label>
            <div className="npp-pw-wrap">
              <input
                id="npp-password"
                type={showPw ? 'text' : 'password'}
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="npp-pw-toggle"
                onClick={() => setShowPw(!showPw)}
                tabIndex={-1}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="npp-login-submit"
            disabled={loading}
          >
            {loading ? (
              <span className="npp-btn-spinner" />
            ) : (
              <LogIn size={18} />
            )}
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập NPP'}
          </button>
        </form>

        <p className="npp-login-note">
          Chỉ tài khoản NPP mới có thể nhập dữ liệu phân phối.<br />
          Liên hệ quản trị viên nếu bạn chưa có tài khoản.
        </p>
      </div>
    </div>
  );
}
