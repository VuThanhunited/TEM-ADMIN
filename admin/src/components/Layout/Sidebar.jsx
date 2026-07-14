import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
  LayoutDashboard, Users, Building2, Package, Tag,
  Palette, BarChart3, ChevronLeft, ChevronDown,
  Shield, LogOut, ScanLine, History, Store, ExternalLink
} from 'lucide-react';
import './Sidebar.css';

// Menu cho ADMIN và NSX
const adminMenuItems = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/',
    roles: ['ADMIN', 'NSX'],
  },
  {
    label: 'Quản lý Tài khoản',
    icon: Users,
    path: '/accounts',
    roles: ['ADMIN'],
  },
  {
    label: 'Cấu hình Doanh nghiệp',
    icon: Building2,
    path: '/enterprise',
    roles: ['ADMIN', 'NSX'],
    children: [
      { label: 'Thông tin công ty', path: '/enterprise' },
      { label: 'Cấu hình Domain', path: '/enterprise/domain' },
      { label: 'Cài đặt Chatbot', path: '/enterprise/chatbot' },
    ]
  },
  {
    label: 'Quản lý Sản phẩm',
    icon: Package,
    path: '/products',
    roles: ['ADMIN', 'NSX'],
  },
  {
    label: 'Quản lý NPP / Cửa hàng',
    icon: Store,
    path: '/distributors',
    roles: ['ADMIN', 'NSX'],
  },
  {
    label: 'Quản lý Tem nhãn',
    icon: Tag,
    path: '/labels',
    roles: ['ADMIN', 'NSX'],
    children: [
      { label: 'Quản lý Lô tem', path: '/labels' },
      { label: 'Kích hoạt & Gắn Serial', path: '/labels/activate' },
      { label: 'Đồng bộ tem cũ', path: '/labels/migrate' },
      { label: 'Gia hạn lô tem', path: '/labels/renew' },
    ]
  },
  {
    label: 'Cấu hình Giao diện',
    icon: Palette,
    path: '/templates',
    roles: ['ADMIN', 'NSX'],
  },
  {
    label: 'Báo cáo & Thống kê',
    icon: BarChart3,
    path: '/analytics',
    roles: ['ADMIN', 'NSX'],
    children: [
      { label: 'Lịch sử quét tem', path: '/analytics' },
      { label: 'Bản đồ vị trí quét', path: '/analytics/map' },
      { label: 'Xem Demo hiển thị', path: '/analytics/demo' },
    ]
  },
];

// Menu riêng cho NPP
const nppMenuItems = [
  {
    label: 'Quét Tem',
    icon: ScanLine,
    path: '/npp/scan',
    roles: ['NPP'],
  },
  {
    label: 'Lịch Sử Phân Phối',
    icon: History,
    path: '/npp/history',
    roles: ['NPP'],
  },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onCloseMobile }) {
  const { user, isAdmin, isNPP, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedMenus, setExpandedMenus] = useState({});
  const [impersonating, setImpersonating] = useState(false);

  const handleAccessUserSite = async () => {
    if (impersonating) return;
    try {
      setImpersonating(true);
      const result = await api.adminLoginAs();
      // Xây dựng URL trang user với token
      const userSiteBase = import.meta.env.VITE_USER_URL ||
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? 'http://localhost:5174'
          : 'https://tem-user.vercel.app');
      const url = `${userSiteBase}/login?tab=npp&adminToken=${encodeURIComponent(result.token)}`;
      window.open(url, '_blank');
    } catch (err) {
      alert('Không thể truy cập trang người dùng: ' + err.message);
    } finally {
      setImpersonating(false);
    }
  };

  const toggleSubmenu = (label) => {
    setExpandedMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const isPathActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Chọn menu theo role
  const allItems = isNPP ? nppMenuItems : adminMenuItems;
  const filteredItems = allItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role);
  });

  const getRoleLabel = (role) => {
    switch(role) {
      case 'ADMIN': return 'Quản trị viên';
      case 'NSX': return 'Nhà sản xuất';
      case 'NPP': return 'Nhà phân phối';
      case 'GUEST': return 'Khách hàng';
      default: return role;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'ADMIN': return '#ef4444';
      case 'NSX': return '#22c55e';
      case 'NPP': return '#f59e0b';
      case 'GUEST': return '#06b6d4';
      default: return '#6366f1';
    }
  };

  return (
    <>
      {mobileOpen && (
        <div className="sidebar-mobile-overlay" onClick={onCloseMobile} />
      )}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-logo">
          <Shield size={28} />
        </div>
        {!collapsed && (
          <div className="brand-text">
            <span className="brand-name">TEM Admin</span>
            <span className="brand-sub">{isNPP ? 'Nhà Phân Phối' : 'Smart Label CMS'}</span>
          </div>
        )}
        <button className="sidebar-toggle" onClick={onToggle}>
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">
          {!collapsed && (isNPP ? 'CHỨC NĂNG NPP' : 'MENU CHÍNH')}
        </div>
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = item.children && item.children.length > 0;
          const isActive = isPathActive(item.path);
          const isExpanded = expandedMenus[item.label] || isActive;

          return (
            <div key={item.label} className="nav-item-wrapper">
              {hasChildren ? (
                <>
                  <button
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => !collapsed && toggleSubmenu(item.label)}
                    title={collapsed ? item.label : undefined}
                  >
                    <div className="nav-item-left">
                      <Icon size={20} />
                      {!collapsed && <span>{item.label}</span>}
                    </div>
                    {!collapsed && (
                      <ChevronDown
                        size={16}
                        className={`nav-chevron ${isExpanded ? 'rotated' : ''}`}
                      />
                    )}
                  </button>
                  {!collapsed && isExpanded && (
                    <div className="nav-submenu">
                      {item.children.map(child => (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          end={child.path === item.path}
                          className={({ isActive: a }) => `nav-subitem ${a ? 'active' : ''}`}
                          onClick={onCloseMobile}
                        >
                          <span className="subitem-dot" />
                          <span>{child.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive: a }) => `nav-item ${a ? 'active' : ''}`}
                  title={collapsed ? item.label : undefined}
                  onClick={onCloseMobile}
                >
                  <div className="nav-item-left">
                    <Icon size={20} />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                </NavLink>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Info */}
      {!collapsed && (
        <div className="sidebar-footer">
          <div className="user-card">
            <div 
              className="user-clickable" 
              onClick={() => {
                onCloseMobile?.();
                navigate('/profile');
              }} 
              style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0, cursor: 'pointer' }}
              title="Xem & sửa thông tin tài khoản"
            >
              <div
                className="user-avatar"
                style={{ background: getRoleBadgeColor(user?.role) }}
              >
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="user-info">
                <span className="user-name">{user?.fullName || 'User'}</span>
                <span className="user-role">{getRoleLabel(user?.role)}</span>
              </div>
            </div>
            <button className="btn-icon logout-btn" onClick={logout} title="Đăng xuất">
              <LogOut size={18} />
            </button>
          </div>
          {isAdmin && (
            <button
              className="access-user-site-btn"
              onClick={handleAccessUserSite}
              disabled={impersonating}
              title="Mở trang khách hàng với quyền Admin"
            >
              <ExternalLink size={15} />
              <span>{impersonating ? 'Đang mở...' : 'Truy cập trang Người dùng'}</span>
            </button>
          )}
        </div>
      )}
    </aside>
    </>
  );
}
