import React, { Component, lazy, Suspense } from 'react';

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

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import MainLayout from './components/Layout/MainLayout';
import './App.css';

const Login = lazy(() => import('./pages/Login/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const Accounts = lazy(() => import('./pages/Accounts/Accounts'));
const Enterprise = lazy(() => import('./pages/Enterprise/Enterprise'));
const Products = lazy(() => import('./pages/Products/Products'));
const Labels = lazy(() => import('./pages/Labels/Labels'));
const Templates = lazy(() => import('./pages/Templates/Templates'));
const Analytics = lazy(() => import('./pages/Analytics/Analytics'));
const Scan = lazy(() => import('./pages/Scan/Scan'));
const Distributors = lazy(() => import('./pages/Distributors/Distributors'));
const NppScan = lazy(() => import('./pages/NppScan/NppScan'));
const NppHistory = lazy(() => import('./pages/NppHistory/NppHistory'));
const Profile = lazy(() => import('./pages/Profile/Profile'));
const LabelDesigns = lazy(() => import('./pages/LabelDesigns/LabelDesigns'));

const AppLoader = () => (
  <div className="app-loading">
    <div className="loading-spinner" style={{width: 48, height: 48}}></div>
    <p>Đang tải...</p>
  </div>
);

const USER_LOGIN_URL = '/login';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAdmin, isNPP } = useAuth();
  if (loading) return <div className="app-loading"><div className="loading-spinner" style={{width: 48, height: 48}}></div><p>Đang tải...</p></div>;
  // Chưa đăng nhập → chuyển hướng sang trang đăng nhập duy nhất
  if (!user) {
    window.location.href = USER_LOGIN_URL;
    return null;
  }
  if (isNPP) return <Navigate to="/npp/scan" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

function NppRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loading"><div className="loading-spinner" style={{width: 48, height: 48}}></div></div>;
  if (!user) {
    window.location.href = USER_LOGIN_URL + '?tab=npp';
    return null;
  }
  return children;
}

function PublicRoute({ children }) {
  const { user, loading, isNPP } = useAuth();
  if (loading) return <div className="app-loading"><div className="loading-spinner" style={{width: 48, height: 48}}></div></div>;
  if (user) {
    if (isNPP) return <Navigate to="/npp/scan" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function CatchAllRoute() {
  const { user, isNPP } = useAuth();
  if (user && isNPP) return <Navigate to="/npp/scan" replace />;
  if (user) return <Navigate to="/dashboard" replace />;
  window.location.href = USER_LOGIN_URL;
  return null;
}

function AppRoutes() {
  return (
    <Suspense fallback={<AppLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/scan/:serial" element={<Scan />} />
        <Route path="/qrcode/:serial" element={<Scan />} />
        <Route path="/temqr/:serial" element={<Scan />} />
        <Route path="/npp/scan" element={<NppRoute><MainLayout /></NppRoute>}>
          <Route index element={<NppScan />} />
        </Route>
        <Route path="/npp/history" element={<NppRoute><MainLayout /></NppRoute>}>
          <Route index element={<NppHistory />} />
        </Route>
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="accounts" element={<ProtectedRoute adminOnly><Accounts /></ProtectedRoute>} />
          <Route path="enterprise" element={<Enterprise />} />
          <Route path="enterprise/domain" element={<Enterprise />} />
          <Route path="enterprise/chatbot" element={<Enterprise />} />
          <Route path="products" element={<Products />} />
          <Route path="distributors" element={<Distributors />} />
          <Route path="labels" element={<Labels />} />
          <Route path="labels/activate" element={<Labels />} />
          <Route path="labels/migrate" element={<Labels />} />
          <Route path="labels/renew" element={<Labels />} />
          <Route path="templates" element={<Templates />} />
          <Route path="label-designs" element={<ProtectedRoute><LabelDesigns /></ProtectedRoute>} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="analytics/map" element={<Analytics />} />
          <Route path="analytics/demo" element={<Analytics />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<CatchAllRoute />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
        <AppRoutes />
      </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
