import { useEffect, useState } from 'react';
import { Clock, QrCode, Package, RefreshCw, Printer } from 'lucide-react';
import api from '../../services/api';
import './NppHistory.css';

export default function NppHistory() {
  const [history, setHistory] = useState([]);
  const [totalPrinted, setTotalPrinted] = useState(0);
  const [totalImported, setTotalImported] = useState(0);
  const [enterpriseName, setEnterpriseName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.nppGetHistory();
      setHistory(res.history || []);
      setTotalPrinted(res.totalPrinted || 0);
      setTotalImported(res.totalImported !== undefined ? res.totalImported : (res.history?.length || 0));
      if (res.enterpriseName) setEnterpriseName(res.enterpriseName);
    } catch (err) {
      setError(err.message || 'Không thể tải lịch sử');
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
    <div className="npp-history-page">
      {/* Page header */}
      <div className="npp-history-top">
        <div>
          <h2 className="npp-history-title">Lịch Sử Phân Phối</h2>
          <p className="npp-history-sub">
            Danh sách tem đã quét và ghi nhận phân phối {enterpriseName ? `• NSX: ${enterpriseName}` : ''}
          </p>
        </div>
        <button className="btn btn-ghost npp-refresh-btn" onClick={fetchHistory} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          Làm mới
        </button>
      </div>

      {/* Stats */}
      <div className="npp-history-stats">
        <div className="npp-stat-card">
          <div className="npp-stat-value">{totalImported.toLocaleString('vi-VN')}</div>
          <div className="npp-stat-label">Tổng tem đã nhập kho</div>
        </div>
        <div className="npp-stat-card" style={{ borderColor: 'rgba(59, 130, 246, 0.3)' }}>
          <div className="npp-stat-value" style={{ color: '#2563eb', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Printer size={24} />
            {totalPrinted.toLocaleString('vi-VN')}
          </div>
          <div className="npp-stat-label">Số lượng tem đã in (NSX)</div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="npp-history-loading">
          <div className="loading-spinner" style={{ width: 40, height: 40 }} />
          <p>Đang tải lịch sử...</p>
        </div>
      ) : error ? (
        <div className="npp-history-error">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchHistory}>Thử lại</button>
        </div>
      ) : history.length === 0 ? (
        <div className="npp-history-empty">
          <Clock size={56} opacity={0.3} />
          <h3>Chưa có lịch sử</h3>
          <p>Hãy quét tem để ghi nhận thông tin phân phối</p>
        </div>
      ) : (
        <div className="npp-history-list">
          {history.map((item, idx) => (
            <div key={idx} className="npp-history-item">
              <div className="npp-history-item-icon">
                <QrCode size={20} />
              </div>
              <div className="npp-history-item-info">
                <div className="npp-history-product">
                  <Package size={13} />
                  {item.productName || 'Sản phẩm'}
                </div>
                <div className="npp-history-serial">Serial: <strong>{item.serial}</strong></div>
                {item.storeName && (
                  <div className="npp-history-store">Điểm: {item.storeName}</div>
                )}
              </div>
              <div className="npp-history-item-time">
                <Clock size={12} />
                {formatDateTime(item.time)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
