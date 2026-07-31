import React, { Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DomainProvider } from './contexts/DomainContext';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
// Unified Login and Register views replace separate NPP auth pages
import ScanQR from './pages/Scan/ScanQR';
import SelectStore from './pages/SelectStore/SelectStore';
import Success from './pages/Success/Success';
import History from './pages/History/History';
import ScanChoice from './pages/ScanChoice/ScanChoice';
import ProductInfo from './pages/ProductInfo/ProductInfo';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Uncaught Error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          color: '#ffffff',
          padding: '24px',
          textAlign: 'center',
          fontFamily: 'sans-serif'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px', color: '#ef4444' }}>
            Đã xảy ra sự cố hiển thị trang
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', maxWidth: '480px', marginBottom: '24px' }}>
            Hệ thống vừa phát hiện sự cố gián đoạn nhỏ. Vui lòng nhấn nút bên dưới để tải lại trang.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              background: '#6366f1',
              color: '#ffffff',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer'
            }}
          >
            🔄 Tải lại trang ngay
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}


function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-ring" />
        <p style={{ color: '#546E7A', fontSize: '0.9rem' }}>Đang tải...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function NppProtectedRoute({ children }) {
  const { isLoggedIn, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-ring" />
        <p style={{ color: '#546E7A', fontSize: '0.9rem' }}>Đang tải...</p>
      </div>
    );
  }

  // Cho phép NPP, NSX và ADMIN (khi impersonating với role NPP)
  const allowedRoles = ['NPP', 'NSX'];
  if (!isLoggedIn || !allowedRoles.includes(user?.role)) {
    return <Navigate to="/login?tab=npp" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { isLoggedIn, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-ring" />
      </div>
    );
  }

  if (isLoggedIn) {
    if (user?.role === 'NPP' || user?.role === 'NSX') {
      return <Navigate to="/scan" replace />;
    }
    return <Navigate to="/home" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/home" element={<Home />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route path="/npp/login" element={<Navigate to="/login?tab=npp" replace />} />
      <Route path="/npp/register" element={<Navigate to="/register?tab=npp" replace />} />
      <Route
        path="/scan"
        element={
          <NppProtectedRoute>
            <ScanQR />
          </NppProtectedRoute>
        }
      />
      <Route
        path="/select-store"
        element={
          <NppProtectedRoute>
            <SelectStore />
          </NppProtectedRoute>
        }
      />
      <Route
        path="/success"
        element={
          <NppProtectedRoute>
            <Success />
          </NppProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <NppProtectedRoute>
            <History />
          </NppProtectedRoute>
        }
      />
      <Route path="/trace/:code" element={<ScanChoice />} />
      {/* Alias routes – tương thích URL format cũ và custom domain */}
      <Route path="/scan/:code" element={<ScanChoice />} />
      <Route path="/qrcode/:code" element={<ScanChoice />} />
      <Route path="/temqr/:code" element={<ScanChoice />} />
      <Route path="/product-info" element={<ProductInfo />} />
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

function AppShell() {
  const location = useLocation();
  const isFullWidth = location.pathname === '/home' || 
    location.pathname === '/product-info' || 
    location.pathname.startsWith('/trace') || 
    location.pathname.startsWith('/scan') || 
    location.pathname.startsWith('/qrcode') || 
    location.pathname.startsWith('/temqr');

  return (
    <div className={isFullWidth ? 'app-shell app-shell--fullwidth' : 'app-shell'}>
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
    </div>
  );
}

export default function App() {
  return (
    <DomainProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </BrowserRouter>
    </DomainProvider>
  );
}

// Fixed Vercel build trigger
