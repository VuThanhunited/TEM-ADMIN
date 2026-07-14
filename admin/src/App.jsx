import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Accounts from './pages/Accounts/Accounts';
import Enterprise from './pages/Enterprise/Enterprise';
import Products from './pages/Products/Products';
import Labels from './pages/Labels/Labels';
import Templates from './pages/Templates/Templates';
import Analytics from './pages/Analytics/Analytics';
import Scan from './pages/Scan/Scan';
import Distributors from './pages/Distributors/Distributors';
import NppScan from './pages/NppScan/NppScan';
import NppHistory from './pages/NppHistory/NppHistory';
import Profile from './pages/Profile/Profile';
import LabelDesigns from './pages/LabelDesigns/LabelDesigns';
import './App.css';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAdmin, isNPP } = useAuth();
  if (loading) return <div className="app-loading"><div className="loading-spinner" style={{width: 48, height: 48}}></div><p>Đang tải...</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (isNPP) return <Navigate to="/npp/scan" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  return children;
}

function NppRoute({ children }) {
  const { user, loading, isNPP } = useAuth();
  if (loading) return <div className="app-loading"><div className="loading-spinner" style={{width: 48, height: 48}}></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isNPP) return <Navigate to="/" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading, isNPP } = useAuth();
  if (loading) return <div className="app-loading"><div className="loading-spinner" style={{width: 48, height: 48}}></div></div>;
  if (user) {
    if (isNPP) return <Navigate to="/npp/scan" replace />;
    return <Navigate to="/" replace />;
  }
  return children;
}

function CatchAllRoute() {
  const { user, isNPP } = useAuth();
  if (user && isNPP) return <Navigate to="/npp/scan" replace />;
  return <Navigate to="/" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
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
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
