import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Bell, Search, Menu, AlertTriangle, MapPin, CheckCircle2, ExternalLink, X } from 'lucide-react';
import './Header.css';

export default function Header({ onMenuToggle }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [undismissedCount, setUndismissedCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchAlerts = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.getLocationAlerts({ status: 'undismissed', limit: 15 });
      const list = res?.alerts || [];
      const count = res?.undismissedCount ?? list.length;
      setAlerts(list);
      setUndismissedCount(count);

      // Nhắc nhở khi đăng nhập vào tài khoản / hàng ngày nếu còn cảnh báo chưa tắt
      if (count > 0) {
        const todayKey = new Date().toISOString().slice(0, 10);
        const sessionKey = `loc_alert_reminded_${user._id}_${todayKey}`;
        if (!sessionStorage.getItem(sessionKey)) {
          setReminderModalOpen(true);
          sessionStorage.setItem(sessionKey, '1');
        }
      }
    } catch (err) {
      // ignore background polling errors
    }
  }, [user]);

  useEffect(() => {
    fetchAlerts();
    const timer = setInterval(fetchAlerts, 25000);
    const onRefresh = () => fetchAlerts();
    window.addEventListener('location-alerts-updated', onRefresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener('location-alerts-updated', onRefresh);
    };
  }, [fetchAlerts]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDismissOne = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.dismissLocationAlert(id);
      await fetchAlerts();
      window.dispatchEvent(new Event('location-alerts-updated'));
    } catch (err) {
      alert('Lỗi tắt cảnh báo: ' + err.message);
    }
  };

  const handleDismissAll = async () => {
    try {
      await api.dismissAllLocationAlerts();
      setReminderModalOpen(false);
      await fetchAlerts();
      window.dispatchEvent(new Event('location-alerts-updated'));
    } catch (err) {
      alert('Lỗi tắt tất cả cảnh báo: ' + err.message);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN': return { label: 'ADMIN', class: 'badge-danger' };
      case 'NSX': return { label: 'TK KHÁCH (NSX)', class: 'badge-success' };
      case 'NPP': return { label: 'TK KHÁCH (NPP)', class: 'badge-warning' };
      default: return { label: role, class: 'badge-neutral' };
    }
  };

  const roleBadge = getRoleBadge(user?.role);

  const formatDate = () => {
    return new Date().toLocaleDateString('vi-VN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const formatTime = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleString('vi-VN', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  return (
    <>
      <header className="header">
        <div className="header-left">
          <button className="btn-icon mobile-menu-btn" onClick={onMenuToggle}>
            <Menu size={22} />
          </button>
          <div className="header-greeting">
            <h2>Xin chào, {user?.fullName || 'User'} 👋</h2>
            <p>{formatDate()}</p>
          </div>
        </div>
        <div className="header-right">
          <div className="header-search">
            <Search size={18} />
            <input type="text" placeholder="Tìm kiếm..." />
          </div>

          {/* Icon Thông báo Cảnh báo Vị trí Quét */}
          <div className="notification-wrapper" ref={dropdownRef}>
            <button
              className={`btn-icon notification-btn ${undismissedCount > 0 ? 'has-alerts' : ''}`}
              onClick={() => setDropdownOpen((v) => !v)}
              title="Thông báo cảnh báo vị trí quét tem"
            >
              <Bell size={20} />
              {undismissedCount > 0 && (
                <span className="notification-badge">
                  {undismissedCount > 99 ? '99+' : undismissedCount}
                </span>
              )}
            </button>

            {dropdownOpen && (
              <div className="notification-dropdown">
                <div className="notification-dropdown-header">
                  <div>
                    <h4>🔔 Cảnh báo Vị trí Quét Tem</h4>
                    <span>
                      {undismissedCount > 0
                        ? `Có ${undismissedCount} cảnh báo lệch vị trí chưa tắt`
                        : 'Tất cả vị trí quét đều hợp lệ'}
                    </span>
                  </div>
                  {undismissedCount > 0 && (
                    <button className="notif-dismiss-all-btn" onClick={handleDismissAll}>
                      Tắt tất cả
                    </button>
                  )}
                </div>

                <div className="notification-dropdown-body">
                  {alerts.length === 0 ? (
                    <div className="notification-empty">
                      <CheckCircle2 size={32} />
                      <p>Không có cảnh báo sai vị trí nào chưa xử lý.</p>
                    </div>
                  ) : (
                    alerts.map((item) => (
                      <div key={item._id} className="notification-item">
                        <div className="notification-item-icon">
                          <AlertTriangle size={18} />
                        </div>
                        <div className="notification-item-content">
                          <div className="notification-item-title">
                            <strong>Serial: {item.serialNumber}</strong>
                            <span className="notification-time">{formatTime(item.scannedAt)}</span>
                          </div>
                          <div className="notification-item-sub">
                            SP: <strong>{item.productName || 'Sản phẩm'}</strong> — Điểm bán: <strong>{item.storeName}</strong>
                          </div>
                          <div className="notification-item-locations">
                            <span className="loc-expected">📍 Điểm bán khai báo: {item.expectedAddress}</span>
                            <span className="loc-actual">⚠️ Vị trí quét thực tế: {item.actualLocation?.address || item.actualLocation?.city}</span>
                          </div>
                          <div className="notification-item-actions">
                            <button
                              className="notif-btn-dismiss"
                              onClick={(e) => handleDismissOne(item._id, e)}
                            >
                              ✓ Tắt cảnh báo này
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="notification-dropdown-footer">
                  <button
                    className="notif-view-table-btn"
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/location-alerts');
                    }}
                  >
                    <ExternalLink size={15} />
                    <span>Mở Bảng Cảnh Báo Vị Trí Riêng</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="header-user">
            <div className="header-avatar">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <span className={`badge badge-dot ${roleBadge.class}`}>
              {roleBadge.label}
            </span>
          </div>
        </div>
      </header>

      {/* Modal Nhắc Nhở Hàng Ngày Khi Đăng Nhập Nếu Chưa Tắt Cảnh Báo */}
      {reminderModalOpen && undismissedCount > 0 && (
        <div className="loc-reminder-backdrop">
          <div className="loc-reminder-modal">
            <div className="loc-reminder-header">
              <div className="loc-reminder-title">
                <AlertTriangle size={24} className="loc-reminder-icon" />
                <div>
                  <h3>Cảnh Báo Quét Tem Sai Vị Trí Điểm Bán ({undismissedCount})</h3>
                  <p>Nhắc nhở tự động khi đăng nhập: Các cảnh báo dưới đây sẽ tiếp tục nhắc nhở hàng ngày cho đến khi bạn bấm tắt.</p>
                </div>
              </div>
              <button className="loc-reminder-close" onClick={() => setReminderModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="loc-reminder-list">
              {alerts.slice(0, 6).map((item) => (
                <div key={item._id} className="loc-reminder-card">
                  <div className="loc-reminder-card-info">
                    <div className="loc-reminder-serial">
                      <span className="serial-tag">Serial: {item.serialNumber}</span>
                      <strong>{item.productName || 'Sản phẩm'}</strong>
                      <span className="loc-time">{formatTime(item.scannedAt)}</span>
                    </div>
                    <div className="loc-reminder-detail">
                      <span><MapPin size={14} /> Điểm bán đã gán: <strong>{item.storeName}</strong> ({item.expectedAddress})</span>
                      <span className="loc-mismatch-text">⚠️ Quét phát hiện tại: <strong>{item.actualLocation?.address || item.actualLocation?.city}</strong></span>
                    </div>
                  </div>
                  <button
                    className="loc-reminder-dismiss-one"
                    onClick={() => handleDismissOne(item._id)}
                  >
                    Tắt nhắc nhở
                  </button>
                </div>
              ))}
            </div>

            <div className="loc-reminder-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setReminderModalOpen(false)}
              >
                Để sau (Vẫn nhắc vào ngày mai / lần đăng nhập tới)
              </button>
              <button
                className="btn btn-warning"
                onClick={handleDismissAll}
              >
                ✓ Tắt tất cả cảnh báo ({undismissedCount})
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setReminderModalOpen(false);
                  navigate('/location-alerts');
                }}
              >
                Xem Bảng Cảnh Báo Riêng →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
