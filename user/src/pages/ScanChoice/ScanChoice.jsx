import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Eye, Package, ChevronRight, AlertCircle, Store
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import userApi from '../../services/api';
import './ScanChoice.css';

export default function ScanChoice() {
  const navigate = useNavigate();
  const { code } = useParams();
  const { isLoggedIn, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scanData, setScanData] = useState(null);

  useEffect(() => {
    if (!code) {
      navigate('/home', { replace: true });
      return;
    }
    fetchScanData();
  }, [code]);

  const fetchScanData = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await userApi.getPublicScan(code);
      setScanData(result);
    } catch (err) {
      setError(err.message || 'Không tìm thấy thông tin sản phẩm cho mã này');
    } finally {
      setLoading(false);
    }
  };

  const handleViewInfo = () => {
    // Guest: navigate to product info page (no login needed)
    navigate('/product-info', {
      state: { scanData, serial: code }
    });
  };

  const handleNppEntry = () => {
    if (!isLoggedIn || user?.role !== 'NPP') {
      // Save intended destination and redirect to login
      sessionStorage.setItem('npp_redirect_after_login', JSON.stringify({
        path: '/select-store',
        state: { scanData, serial: code }
      }));
      navigate('/npp/login');
    } else {
      // Already logged in, go to select store
      navigate('/select-store', {
        state: { scanData, serial: code }
      });
    }
  };

  const product = scanData?.product;
  const enterprise = scanData?.enterprise;
  const label = scanData?.label;

  return (
    <div className="scan-choice-page">
      {/* Header */}
      <div className="scan-choice-header">
        <button className="scan-choice-back" onClick={() => navigate('/home')} aria-label="Quay lại">
          <ArrowLeft size={22} />
        </button>
        <span className="scan-choice-header-title">Kết quả quét mã</span>
      </div>

      <div className="scan-choice-body">
        {/* Loading */}
        {loading && (
          <div className="scan-choice-loading">
            <div className="loading-ring" />
            <p>Đang tra cứu mã <strong>{code}</strong>...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="scan-choice-error">
            <div className="scan-choice-error-icon">
              <AlertCircle size={28} />
            </div>
            <h3>Không tìm thấy</h3>
            <p>{error}</p>
            <button className="scan-choice-retry-btn" onClick={() => navigate('/home')}>
              Quay lại trang chủ
            </button>
          </div>
        )}

        {/* Success – show product + 2 choices */}
        {!loading && !error && scanData && (
          <>
            {/* Product preview */}
            <div className="scan-choice-product">
              {product?.images?.[0] ? (
                <img src={product.images[0]} alt={product.name} className="scan-choice-product-img" />
              ) : (
                <div className="scan-choice-product-placeholder">
                  <Package size={24} />
                </div>
              )}
              <div className="scan-choice-product-info">
                <div className="scan-choice-product-name">
                  {product?.name || 'Sản phẩm'}
                </div>
                <div className="scan-choice-product-serial">
                  Mã: {label?.serialNumber || code}
                </div>
                {enterprise?.name && (
                  <div className="scan-choice-product-enterprise">
                    {enterprise.name}
                  </div>
                )}
              </div>
            </div>

            {/* Choice prompt */}
            <div className="scan-choice-prompt">
              <h2>Bạn muốn làm gì?</h2>
              <p>Chọn một trong hai hành động bên dưới</p>
            </div>

            {/* 2 Options */}
            <div className="scan-choice-options">
              {/* Option 1: View info (Guest) */}
              <div className="scan-choice-card" onClick={handleViewInfo}>
                <div className="scan-choice-card-icon scan-choice-card-icon--info">
                  <Eye size={24} />
                </div>
                <div className="scan-choice-card-body">
                  <div className="scan-choice-card-title">Xem thông tin chi tiết</div>
                  <div className="scan-choice-card-desc">
                    Xem nguồn gốc, quy trình sản xuất và thông tin truy xuất sản phẩm
                  </div>
                  <span className="scan-choice-card-badge scan-choice-card-badge--guest">
                    Không cần đăng nhập
                  </span>
                </div>
                <ChevronRight size={20} className="scan-choice-card-arrow" />
              </div>

              {/* Option 2: NPP distribution entry */}
              <div className="scan-choice-card" onClick={handleNppEntry}>
                <div className="scan-choice-card-icon scan-choice-card-icon--npp">
                  <Store size={24} />
                </div>
                <div className="scan-choice-card-body">
                  <div className="scan-choice-card-title">Nhập hàng (Nhà phân phối)</div>
                  <div className="scan-choice-card-desc">
                    Ghi nhận sản phẩm nhập vào điểm bán hàng của bạn
                  </div>
                  <span className="scan-choice-card-badge scan-choice-card-badge--npp">
                    Yêu cầu đăng nhập NPP
                  </span>
                </div>
                <ChevronRight size={20} className="scan-choice-card-arrow" />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
