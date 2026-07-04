import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, Eye, EyeOff, LogIn, AlertCircle, Store, Settings } from 'lucide-react';
import './Login.css';

export default function Login() {
  const { login, error, setError } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    setLoading(true);
    try {
      const result = await login(username, password);
      // Redirect theo role sau khi đăng nhập thành công
      if (result?.user?.role === 'NPP') {
        navigate('/npp/scan', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      // Error is set in context
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
            <h1>TEM Admin</h1>
            <p>Hệ thống Quản lý Tem nhãn Thông minh</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="login-error animate-fade-in">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="input-group">
              <label htmlFor="username">Tên đăng nhập</label>
              <input
                id="username"
                type="text"
                className="input"
                placeholder="Nhập tên đăng nhập..."
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(null); }}
                autoFocus
                autoComplete="username"
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Mật khẩu</label>
              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  placeholder="Nhập mật khẩu..."
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg login-btn"
              disabled={loading}
            >
              {loading ? (
                <div className="loading-spinner" style={{width:20,height:20,borderWidth:2}}></div>
              ) : (
                <>
                  <LogIn size={20} />
                  Đăng nhập
                </>
              )}
            </button>
          </form>

          {/* Role Info */}
          <div className="login-demo">
            <p className="demo-title">Phân quyền đăng nhập</p>
            <div className="demo-accounts">
              <div className="demo-account" style={{ cursor: 'default' }}>
                <span className="badge badge-dot badge-danger">
                  <Settings size={10} style={{ marginRight: 3 }} />Admin / NSX
                </span>
                <span className="demo-cred">Quản lý toàn hệ thống</span>
              </div>
              <div className="demo-account" style={{ cursor: 'default' }}>
                <span className="badge badge-dot badge-warning">
                  <Store size={10} style={{ marginRight: 3 }} />NPP
                </span>
                <span className="demo-cred">Quét tem &amp; Lịch sử phân phối</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
