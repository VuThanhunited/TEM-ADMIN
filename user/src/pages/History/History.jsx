import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, QrCode } from 'lucide-react';
import userApi from '../../services/api';
import './History.css';

export default function History() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [totalPrinted, setTotalPrinted] = useState(0);
  const [totalImported, setTotalImported] = useState(0);
  const [enterpriseName, setEnterpriseName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await userApi.getNppScanHistory();
      setHistory(res.history || []);
      setTotalPrinted(res.totalPrinted || 0);
      setTotalImported(res.totalImported !== undefined ? res.totalImported : (res.history?.length || 0));
      if (res.enterpriseName) setEnterpriseName(res.enterpriseName);
    } catch (err) {
      console.error('Fetch scan history error:', err);
      // Fallback to local storage if API fails
      const localHistory = JSON.parse(localStorage.getItem('npp_scan_history') || '[]');
      setHistory(localHistory);
    } finally {
      setLoading(false);
    }
  };

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
        <span className="history-header-title">Lịch sử phân phối tem</span>
      </div>

      <div className="history-body">
        {/* Quick Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Tem đã in (NSX)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563EB', marginTop: 2 }}>{totalPrinted.toLocaleString('vi-VN')}</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Đã nhập kho</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16A34A', marginTop: 2 }}>{totalImported.toLocaleString('vi-VN')}</div>
          </div>
        </div>
        {loading ? (
          <div className="history-empty">
            <div className="loading-ring" />
            <p>Đang tải lịch sử...</p>
          </div>
        ) : history.length === 0 ? (
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
                  {item.ownerCode && (
                    <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700, marginTop: 2 }}>
                      Mã sở hữu: {item.ownerCode}
                    </div>
                  )}
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

