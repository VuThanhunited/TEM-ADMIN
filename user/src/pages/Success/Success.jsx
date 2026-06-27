import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Package, ScanLine, Store, LogOut, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Success.css';

// Simple confetti dots
const CONFETTI_COLORS = ['#1565C0', '#2E7D32', '#F57C00', '#7B1FA2', '#C62828', '#00838F'];

function Confetti() {
  const dots = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * 360;
    const distance = 44 + Math.random() * 20;
    const rad = (angle * Math.PI) / 180;
    const x = Math.cos(rad) * distance;
    const y = Math.sin(rad) * distance;
    return { id: i, x, y, color: CONFETTI_COLORS[i % CONFETTI_COLORS.length] };
  });

  return (
    <div className="confetti-wrap">
      <div className="success-check-circle">
        <CheckCircle size={42} color="#2E7D32" strokeWidth={2} />
      </div>
      {dots.map(d => (
        <div
          key={d.id}
          className="confetti-dot"
          style={{
            backgroundColor: d.color,
            left: `calc(50% + ${d.x}px)`,
            top: `calc(50% + ${d.y}px)`,
            animationDelay: `${d.id * 0.04}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function Success() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const { scanData, serial, storeName, storeAddress, scanTime, totalForStore } = location.state || {};
  const product = scanData?.product;
  const label = scanData?.label;

  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    if (!scanData) {
      navigate('/scan', { replace: true });
      return;
    }
    // Hide confetti after animation
    const t = setTimeout(() => setShowConfetti(false), 2000);
    return () => clearTimeout(t);
  }, []);

  const formatDateTime = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  // For now, total count is stored in scanData or label, or from API response
  const totalCount = totalForStore !== undefined ? totalForStore : ((label?.scanCount || 0) + 1);

  return (
    <div className="success-page">
      {/* Header */}
      <div className="success-header">
        <button className="success-header-back" onClick={() => navigate('/scan')} aria-label="Quay lại">
          <ArrowLeft size={22} />
        </button>
        <span className="success-header-title">Nhập hàng thành công</span>
      </div>

      <div className="success-body">
        {/* Check icon with confetti */}
        <div className="success-check-wrap">
          {showConfetti ? (
            <Confetti />
          ) : (
            <div className="success-check-circle">
              <CheckCircle size={42} color="#2E7D32" strokeWidth={2} />
            </div>
          )}
          <p className="success-title">
            Đã nhập thêm 1 sản phẩm<br />cho điểm bán
          </p>
          <p className="success-store-name">{storeName}</p>
        </div>

        {/* Product card */}
        {product && (
          <div className="success-product-card">
            {product.images?.[0] ? (
              <img src={product.images[0]} alt={product.name} className="success-product-img" />
            ) : (
              <div className="success-product-img-placeholder">
                <Package size={22} />
              </div>
            )}
            <div className="success-product-info">
              <div className="success-product-name">{product.name}</div>
              <div className="success-product-code">
                Mã hàng: <span>{product.sku || label?.serialNumber || serial}</span>
              </div>
            </div>
          </div>
        )}

        {/* Scan time */}
        <div className="success-meta-row">
          <Clock size={16} color="#546E7A" />
          <span className="success-meta-label">Thời gian</span>
          <span className="success-meta-value">{formatDateTime(scanTime)}</span>
        </div>

        {/* Total count */}
        <div className="success-count-card">
          <span className="success-count-label">Tổng số sản phẩm đã nhập<br />cho điểm bán này</span>
          <span className="success-count-number">{totalCount}</span>
        </div>

        {/* Action buttons */}
        <div className="success-actions">
          <button
            id="success-scan-more"
            className="success-btn-scan"
            onClick={() => navigate('/scan')}
          >
            <ScanLine size={18} />
            Quét tiếp
          </button>

          <button
            id="success-change-store"
            className="success-btn-store"
            onClick={() =>
              navigate('/select-store', { state: { scanData, serial } })
            }
          >
            <Store size={18} />
            Chọn điểm bán khác
          </button>

          <button
            id="success-finish"
            className="success-btn-end"
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
          >
            <LogOut size={18} />
            KẾT THÚC
          </button>
        </div>
      </div>
    </div>
  );
}
