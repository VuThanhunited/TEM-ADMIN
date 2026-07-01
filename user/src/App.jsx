import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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

  if (!isLoggedIn || user?.role !== 'NPP') {
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
    if (user?.role === 'NPP') {
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
      <Route path="/product-info" element={<ProductInfo />} />
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

function AppShell() {
  const location = useLocation();
  const isFullWidth = location.pathname === '/home';

  return (
    <div className={isFullWidth ? 'app-shell app-shell--fullwidth' : 'app-shell'}>
      <AppRoutes />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );

// Trigger Vercel rebuild
