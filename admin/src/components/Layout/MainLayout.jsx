import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './MainLayout.css';

export default function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className={`layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
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
