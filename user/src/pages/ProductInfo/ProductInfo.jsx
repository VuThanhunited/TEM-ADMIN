import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, ShieldCheck, AlertTriangle, Package, QrCode,
  Building2, MapPin, Phone, Globe, Mail, Clock, Hash,
  Truck, Home
} from 'lucide-react';
import './ProductInfo.css';

export default function ProductInfo() {
  const navigate = useNavigate();
  const location = useLocation();

  const { scanData, serial } = location.state || {};

  useEffect(() => {
    if (!scanData) {
      navigate('/home', { replace: true });
    }
  }, []);

  if (!scanData) return null;

  const product = scanData.product;
  const enterprise = scanData.enterprise;
  const label = scanData.label;
  const isFirstScan = scanData.isFirstScan;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="product-info-page">
      {/* Header */}
      <div className="product-info-header">
        <button
          className="product-info-back"
          onClick={() => navigate(-1)}
          aria-label="Quay lại"
        >
          <ArrowLeft size={22} />
        </button>
        <span className="product-info-header-title">Thông tin truy xuất</span>
      </div>

      <div className="product-info-body">
        {/* Verification badge */}
        <div className={`product-info-verify ${label?.scanCount > 5 ? 'product-info-verify--warning' : ''}`}>
          <div className="product-info-verify-icon">
            {label?.scanCount > 5 ? (
              <AlertTriangle size={22} />
            ) : (
              <ShieldCheck size={22} />
            )}
          </div>
          <div className="product-info-verify-text">
            {label?.scanCount > 5 ? (
              <>
                <h3>Cảnh báo</h3>
                <p>Sản phẩm đã được quét {label.scanCount} lần. Vui lòng kiểm tra kỹ nguồn gốc.</p>
              </>
            ) : (
              <>
                <h3>Sản phẩm chính hãng</h3>
                <p>Thông tin truy xuất nguồn gốc đã được xác thực</p>
              </>
            )}
          </div>
        </div>

        {/* Product card */}
        <div className="product-info-card">
          <div className="product-info-image-area">
            {product?.images?.[0] ? (
              <img src={product.images[0]} alt={product.name} />
            ) : (
              <div className="product-info-image-placeholder">
                <Package size={48} />
                <span>Chưa có hình ảnh</span>
              </div>
            )}
          </div>
          <div className="product-info-details">
            <h2 className="product-info-name">{product?.name || 'Sản phẩm'}</h2>
            {product?.description && (
              <p className="product-info-desc">{product.description}</p>
            )}
            <div className="product-info-rows">
              <div className="product-info-row">
                <div className="product-info-row-icon">
                  <QrCode size={16} />
                </div>
                <span className="product-info-row-label">Mã serial</span>
                <span className="product-info-row-value">{label?.serialNumber || serial}</span>
              </div>
              {product?.category && (
                <div className="product-info-row">
                  <div className="product-info-row-icon">
                    <Hash size={16} />
                  </div>
                  <span className="product-info-row-label">Danh mục</span>
                  <span className="product-info-row-value">{product.category}</span>
                </div>
              )}
              {product?.sku && (
                <div className="product-info-row">
                  <div className="product-info-row-icon">
                    <Package size={16} />
                  </div>
                  <span className="product-info-row-label">Mã SKU</span>
                  <span className="product-info-row-value">{product.sku}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scan stats */}
        <div className="product-info-stats">
          <div className="product-info-stat">
            <span className="product-info-stat-number">{label?.scanCount || 1}</span>
            <span className="product-info-stat-label">Lần quét</span>
          </div>
          <div className="product-info-stat">
            <span className="product-info-stat-number" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              {formatDate(label?.firstScannedAt || scanData?.firstScanTime)}
            </span>
            <span className="product-info-stat-label">Quét lần đầu</span>
          </div>
        </div>

        {/* Enterprise info */}
        {enterprise && (
          <div className="product-info-enterprise">
            <div className="product-info-enterprise-title">Doanh nghiệp sản xuất</div>
            <div className="product-info-enterprise-name">{enterprise.name}</div>
            {enterprise.address && (
              <div className="product-info-enterprise-row">
                <MapPin size={14} />
                {enterprise.address}
              </div>
            )}
            {enterprise.phone && (
              <div className="product-info-enterprise-row">
                <Phone size={14} />
                {enterprise.phone}
              </div>
            )}
            {enterprise.email && (
              <div className="product-info-enterprise-row">
                <Mail size={14} />
                {enterprise.email}
              </div>
            )}
            {enterprise.website && (
              <div className="product-info-enterprise-row">
                <Globe size={14} />
                {enterprise.website}
              </div>
            )}
          </div>
        )}

        {/* Distributor info */}
        {label?.distributorName && (
          <div className="product-info-distributor">
            <div className="product-info-distributor-title">Nhà phân phối</div>
            <div className="product-info-distributor-name">
              <Truck size={14} style={{ display: 'inline', marginRight: 6 }} />
              {label.distributorName}
            </div>
            {label.distributorAddress && (
              <div className="product-info-distributor-addr">{label.distributorAddress}</div>
            )}
          </div>
        )}
      </div>

      {/* Bottom button */}
      <div className="product-info-bottom">
        <button className="product-info-home-btn" onClick={() => navigate('/home')}>
          <Home size={18} />
          Quay lại trang chủ
        </button>
      </div>
    </div>
  );
}
