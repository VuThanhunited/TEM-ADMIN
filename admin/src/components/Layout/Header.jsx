import { useAuth } from '../../contexts/AuthContext';
import { Bell, Search, Menu } from 'lucide-react';
import './Header.css';

export default function Header({ onMenuToggle }) {
  const { user, isAdmin } = useAuth();

  const getRoleBadge = (role) => {
    switch(role) {
      case 'ADMIN': return { label: 'ADMIN', class: 'badge-danger' };
      case 'NSX': return { label: 'NSX', class: 'badge-success' };
      case 'NPP': return { label: user?.fullName || 'NPP', class: 'badge-warning' };
      default: return { label: role, class: 'badge-neutral' };
    }
  };

  const roleBadge = getRoleBadge(user?.role);

  const formatDate = () => {
    return new Date().toLocaleDateString('vi-VN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  return (
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
        <button className="btn-icon notification-btn">
          <Bell size={20} />
          <span className="notification-dot"></span>
        </button>
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
  );
}
