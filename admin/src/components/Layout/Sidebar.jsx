import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, Users, Building2, Package, Tag,
  Palette, BarChart3, ChevronLeft, ChevronDown, ChevronRight,
  Shield, LogOut, Settings
} from 'lucide-react';
import './Sidebar.css';

const menuItems = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/',
  },
  {
    label: 'Quản lý Tài khoản',
    icon: Users,
    path: '/accounts',
    adminOnly: true,
  },
  {
    label: 'Cấu hình Doanh nghiệp',
    icon: Building2,
    path: '/enterprise',
    enterpriseOnly: true,
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
  },
  {
    label: 'Quản lý Tem nhãn',
    icon: Tag,
    path: '/labels',
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
  },
  {
    label: 'Báo cáo & Thống kê',
    icon: BarChart3,
    path: '/analytics',
    children: [
      { label: 'Lịch sử quét tem', path: '/analytics' },
      { label: 'Bản đồ vị trí quét', path: '/analytics/map' },
      { label: 'Xem Demo hiển thị', path: '/analytics/demo' },
    ]
  },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onCloseMobile }) {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleSubmenu = (label) => {
    setExpandedMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const isPathActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const filteredItems = menuItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.enterpriseOnly && isAdmin) return false;
    return true;
  });

  const getRoleLabel = (role) => {
    switch(role) {
      case 'ADMIN': return 'Quản trị viên';
      case 'NSX': return 'Nhà sản xuất';
      case 'NPP': return 'Nhà phân phối';
      default: return role;
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
            <span className="brand-sub">Smart Label CMS</span>
          </div>
        )}
        <button className="sidebar-toggle" onClick={onToggle}>
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">{!collapsed && 'MENU CHÍNH'}</div>
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
            <div className="user-avatar">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.fullName || 'User'}</span>
              <span className="user-role">{getRoleLabel(user?.role)}</span>
            </div>
            <button className="btn-icon logout-btn" onClick={logout} title="Đăng xuất">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      )}
    </aside>
    </>
  );
}
