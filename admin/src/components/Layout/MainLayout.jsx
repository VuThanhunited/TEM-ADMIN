import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './MainLayout.css';

export default function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Keep-alive ping mỗi 8 phút để máy chủ backend Render không bị ngủ đông khi admin đang mở tab làm việc
    const pingInterval = setInterval(() => {
      fetch('/api/ping').catch(() => {});
    }, 8 * 60 * 1000);
    return () => clearInterval(pingInterval);
  }, []);

  return (
    <div className={`layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />
      <Header onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
      <main className="main-content">
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
