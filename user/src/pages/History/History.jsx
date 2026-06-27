import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Package, QrCode } from 'lucide-react';
import './History.css';

export default function History() {
  const navigate = useNavigate();

  // In a real implementation, fetch from API
  const history = JSON.parse(localStorage.getItem('npp_scan_history') || '[]');

  const formatDateTime = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="history-page">
      {/* Header */}
      <div className="history-header">
        <button className="history-back-btn" onClick={() => navigate('/scan')} aria-label="Quay lại">
          <ArrowLeft size={22} />
        </button>
        <span className="history-header-title">Lịch sử quét</span>
      </div>

      <div className="history-body">
        {history.length === 0 ? (
          <div className="history-empty">
            <Clock size={52} color="#B0BEC5" />
            <p>Chưa có lịch sử quét</p>
            <span>Các lần quét QR Code sẽ được lưu tại đây</span>
            <button className="history-scan-btn" onClick={() => navigate('/scan')}>
              Quét ngay
            </button>
          </div>
        ) : (
          <div className="history-list">
            {history.map((item, idx) => (
              <div key={idx} className="history-item">
                <div className="history-item-icon">
                  <QrCode size={20} color="#1565C0" />
                </div>
                <div className="history-item-info">
                  <div className="history-item-name">{item.productName || 'Sản phẩm'}</div>
                  <div className="history-item-serial">Serial: {item.serial}</div>
                  <div className="history-item-store">{item.storeName}</div>
                  <div className="history-item-time">{formatDateTime(item.time)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
