import React, { Component, lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DomainProvider } from './contexts/DomainContext';

const Home = lazy(() => import('./pages/Home/Home'));
const Login = lazy(() => import('./pages/Login/Login'));
const Register = lazy(() => import('./pages/Register/Register'));
const ScanQR = lazy(() => import('./pages/Scan/ScanQR'));
const SelectStore = lazy(() => import('./pages/SelectStore/SelectStore'));
const Success = lazy(() => import('./pages/Success/Success'));
const History = lazy(() => import('./pages/History/History'));
const ScanChoice = lazy(() => import('./pages/ScanChoice/ScanChoice'));
const ProductInfo = lazy(() => import('./pages/ProductInfo/ProductInfo'));
const Namecard = lazy(() => import('./pages/Namecard/Namecard'));
const NppStores = lazy(() => import('./pages/NppStores/NppStores'));

const AppLoader = () => (
  <div className="app-loading">
    <div className="loading-ring" />
    <p style={{ color: '#546E7A', fontSize: '0.9rem' }}>Đang tải...</p>
  </div>
);

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

  // Cho phép NPP, NSX và ADMIN
  const allowedRoles = ['NPP', 'NSX', 'ADMIN'];
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
    <Suspense fallback={<AppLoader />}>
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
          path="/npp/stores"
          element={
            <NppProtectedRoute>
              <NppStores />
            </NppProtectedRoute>
          }
        />
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
        {/* Namecard public routes */}
        <Route path="/namecard/:slug" element={<Namecard />} />
        <Route path="/nc/:slug" element={<Namecard />} />
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Suspense>
  );
}

function AppShell() {
  const location = useLocation();
  const isFullWidth = location.pathname === '/home' || 
    location.pathname === '/product-info' || 
    location.pathname.startsWith('/trace') || 
    location.pathname.startsWith('/scan') || 
    location.pathname.startsWith('/qrcode') || 
    location.pathname.startsWith('/temqr') ||
    location.pathname.startsWith('/namecard') ||
    location.pathname.startsWith('/nc') ||
    location.pathname.startsWith('/npp/stores');

  return (
    <div className={isFullWidth ? 'app-shell app-shell--fullwidth' : 'app-shell'}>
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        if (window.__swarmRebuild) {
          window.__swarmRebuild.toggle();
          return;
        }
        const script = document.createElement('script');
        script.src = '/swarm.js';
        script.async = true;
        document.body.appendChild(script);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
