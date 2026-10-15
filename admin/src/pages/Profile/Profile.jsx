import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { User, Lock, Mail, MapPin, Building, Key, CheckCircle, Phone, FileText } from 'lucide-react';
import './Profile.css';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text }

  const [form, setForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    address: user?.address || '',
    details: user?.details || '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        username: user.username || '',
        email: user.email || '',
        fullName: user.fullName || '',
        phone: user.phone || '',
        address: user.address || '',
        details: user.details || ''
      }));
    }
  }, [user]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password && form.password.length < 6) {
      showMessage('error', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (form.password !== form.confirmPassword) {
      showMessage('error', 'Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await api.updateProfile({
        username: form.username,
        email: form.email,
        fullName: form.fullName,
        phone: form.phone,
        address: form.address,
        details: form.details,
        password: form.password || undefined
      });

      // Update user in context/localStorage
      setUser(updatedUser);
      
      // Also update NPP scan session in localStorage if NPP
      if (updatedUser?.role === 'NPP') {
        localStorage.setItem('npp_scan_user', JSON.stringify(updatedUser));
      }
      
      showMessage('success', 'Cập nhật thông tin thành công!');
      setForm(prev => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (err) {
      showMessage('error', err.message || 'Lỗi khi cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  };

  const getPageTitle = () => {
    if (user?.role === 'NPP') return 'Thông tin Nhà Phân Phối';
    if (user?.role === 'NSX') return 'Thông tin Nhà Sản Xuất';
    return 'Thông tin Tài khoản';
  };

  const getPageSub = () => {
    if (user?.role === 'NPP') return 'Xem và cập nhật thông tin nhà phân phối / đại lý của bạn';
    if (user?.role === 'NSX') return 'Xem và cập nhật thông tin nhà sản xuất của bạn';
    return 'Xem và tùy chỉnh thông tin tài khoản của bạn';
  };

  return (
    <div className="profile-page">
      <div className="profile-header-section">
        <h2>{getPageTitle()}</h2>
        <p>{getPageSub()}</p>
      </div>

      <div className="profile-container">
        {message && (
          <div className={`profile-alert ${message.type}`}>
            {message.type === 'success' ? <CheckCircle size={18} /> : null}
            <span>{message.text}</span>
          </div>
        )}

        <div className="profile-layout-grid">
          {/* Form */}
          <form className="profile-form-card" onSubmit={handleSubmit}>
            <h3 className="card-subtitle">Chỉnh sửa thông tin</h3>
            
            <div className="form-group-row">
              <div className="input-group">
                <label>{user?.role === 'NPP' ? 'Tên Nhà phân phối / Đại lý' : user?.role === 'NSX' ? 'Tên Nhà sản xuất' : 'Họ và tên'}</label>
                <div className="input-with-icon">
                  <User size={16} className="input-icon" />
                  <input
                    className="input"
                    value={form.fullName}
                    onChange={e => setForm({ ...form, fullName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Số điện thoại liên hệ</label>
                <div className="input-with-icon">
                  <Phone size={16} className="input-icon" />
                  <input
                    className="input"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="VD: 0912345678"
                  />
                </div>
              </div>
            </div>

            <div className="form-group-row">
              <div className="input-group">
                <label>Tên đăng nhập</label>
                <div className="input-with-icon">
                  <User size={16} className="input-icon" />
                  <input
                    className="input"
                    value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Địa chỉ Email</label>
                <div className="input-with-icon">
                  <Mail size={16} className="input-icon" />
                  <input
                    className="input"
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-group-row">
              <div className="input-group" style={{ gridColumn: 'span 2' }}>
                <label>Địa chỉ kho hàng / Điểm bán</label>
                <div className="input-with-icon">
                  <MapPin size={16} className="input-icon" />
                  <input
                    className="input"
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    placeholder="Nhập địa chỉ..."
                  />
                </div>
              </div>
            </div>

            <div className="input-group" style={{ marginTop: '12px' }}>
              <label>Giới thiệu / Ghi chú đơn vị</label>
              <textarea
                className="input"
                rows={3}
                value={form.details}
                onChange={e => setForm({ ...form, details: e.target.value })}
                placeholder="Mô tả về đơn vị, chi nhánh, hotline, địa bàn hoạt động..."
                style={{ padding: '10px 14px', resize: 'vertical' }}
              />
            </div>

            <hr className="divider" />
            <h3 className="card-subtitle" style={{ marginTop: '20px' }}>Thay đổi mật khẩu</h3>
            <p className="subtitle-hint">Để trống nếu bạn không muốn thay đổi mật khẩu hiện tại</p>

            <div className="form-group-row">
              <div className="input-group">
                <label>Mật khẩu mới</label>
                <div className="input-with-icon">
                  <Key size={16} className="input-icon" />
                  <input
                    className="input"
                    type="password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Mật khẩu mới..."
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Xác nhận mật khẩu</label>
                <div className="input-with-icon">
                  <Key size={16} className="input-icon" />
                  <input
                    className="input"
                    type="password"
                    value={form.confirmPassword}
                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="Xác nhận mật khẩu mới..."
                  />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button className="btn btn-primary btn-save" type="submit" disabled={loading}>
                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>

          {/* Account Overview Sidebar Card */}
          <div className="profile-overview-card">
            <div className="overview-avatar">
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <h3 className="overview-name">{user?.fullName || user?.username}</h3>
            <span className={`role-badge ${user?.role?.toLowerCase()}`}>
              {user?.role}
            </span>

            <div className="overview-details">
              <div className="detail-item">
                <Building size={16} />
                <div>
                  <span className="detail-label">Doanh nghiệp</span>
                  <span className="detail-value">{user?.enterpriseId?.name || 'Hệ thống'}</span>
                </div>
              </div>
              {user?.phone && (
                <div className="detail-item">
                  <Phone size={16} />
                  <div>
                    <span className="detail-label">Điện thoại</span>
                    <span className="detail-value">{user.phone}</span>
                  </div>
                </div>
              )}
              <div className="detail-item">
                <Lock size={16} />
                <div>
                  <span className="detail-label">Quyền hạn</span>
                  <span className="detail-value">
                    {user?.role === 'ADMIN' ? 'Toàn quyền Admin' : user?.role === 'NSX' ? 'Nhà sản xuất' : 'Nhà phân phối'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
