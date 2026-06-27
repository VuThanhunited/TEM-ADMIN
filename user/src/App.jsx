import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
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

function PublicRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-ring" />
      </div>
    );
  }

  if (isLoggedIn) {
    return <Navigate to="/scan" replace />;
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
        path="/scan"
        element={
          <ProtectedRoute>
            <ScanQR />
          </ProtectedRoute>
        }
      />
      <Route
        path="/select-store"
        element={
          <ProtectedRoute>
            <SelectStore />
          </ProtectedRoute>
        }
      />
      <Route
        path="/success"
        element={
          <ProtectedRoute>
            <Success />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <History />
          </ProtectedRoute>
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
}
