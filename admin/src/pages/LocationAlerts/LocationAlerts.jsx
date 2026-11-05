import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import {
  AlertTriangle, MapPin, CheckCircle2, RefreshCw, Search,
  BellOff, BellRing, Trash2, ShieldAlert, Zap
} from 'lucide-react';
import './LocationAlerts.css';

export default function LocationAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [undismissedCount, setUndismissedCount] = useState(0);
  const [totalAll, setTotalAll] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [simulating, setSimulating] = useState(false);

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getLocationAlerts({
        status: statusFilter,
        search: search.trim(),
        limit: 100
      });
      setAlerts(res?.alerts || []);
      setUndismissedCount(res?.undismissedCount || 0);
      setTotalAll(res?.totalAll || 0);
    } catch (err) {
      console.error('Load location alerts error:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    loadAlerts();
    const onUpdated = () => loadAlerts();
    window.addEventListener('location-alerts-updated', onUpdated);
    return () => window.removeEventListener('location-alerts-updated', onUpdated);
  }, [loadAlerts]);

  const handleToggleDismiss = async (item) => {
    try {
      await api.dismissLocationAlert(item._id, { undismiss: item.isDismissed });
      window.dispatchEvent(new Event('location-alerts-updated'));
      await loadAlerts();
    } catch (err) {
      alert('Lỗi cập nhật cảnh báo: ' + err.message);
    }
  };

  const handleDismissAll = async () => {
    if (!window.confirm('Bạn có chắc muốn tắt toàn bộ cảnh báo nhắc nhở hiện tại?')) return;
    try {
      await api.dismissAllLocationAlerts();
      window.dispatchEvent(new Event('location-alerts-updated'));
      await loadAlerts();
    } catch (err) {
      alert('Lỗi tắt cảnh báo: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa bản ghi cảnh báo này khỏi bảng?')) return;
    try {
      await api.deleteLocationAlert(id);
      window.dispatchEvent(new Event('location-alerts-updated'));
      await loadAlerts();
    } catch (err) {
      alert('Lỗi xóa cảnh báo: ' + err.message);
    }
  };

  const handleSimulateMismatch = async () => {
    try {
      setSimulating(true);
      const res = await api.simulateLocationAlert({
        scanCity: 'Đà Nẵng',
        scanAddress: 'Quận Hải Châu, Đà Nẵng (Quét kiểm tra lệch vùng)'
      });
      window.dispatchEvent(new Event('location-alerts-updated'));
      await loadAlerts();
      alert(res?.message || 'Đã tạo cảnh báo kiểm tra thành công!');
    } catch (err) {
      alert('Không thể tạo cảnh báo thử nghiệm: ' + err.message);
    } finally {
      setSimulating(false);
    }
  };

  const formatDateTime = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="location-alerts-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <ShieldAlert size={26} style={{ color: '#ef4444', marginRight: 8, verticalAlign: 'middle' }} />
            Bảng Cảnh Báo Lệch Vị Trí Quét Tem
          </h1>
          <p className="page-subtitle">
            Theo dõi các mã Serial đã gán cho Điểm bán nhưng phát hiện quét ở vị trí khác với địa chỉ Điểm bán khai báo & Kho xuất.
            Nếu không bấm <strong>Tắt nhắc nhở</strong>, hệ thống sẽ tự động nhắc nhở hàng ngày khi đăng nhập.
          </p>
        </div>
        <div className="loc-header-actions">
          <button
            className="btn btn-secondary"
            onClick={handleSimulateMismatch}
            disabled={simulating}
            title="Giả lập 1 lượt quét khác tỉnh/thành với địa chỉ Điểm bán để kiểm tra chuông báo"
          >
            <Zap size={16} />
            <span>{simulating ? 'Đang kiểm tra...' : 'Test Cảnh Báo Sai Vị Trí'}</span>
          </button>
          {undismissedCount > 0 && (
            <button className="btn btn-primary" onClick={handleDismissAll}>
              <BellOff size={16} />
              <span>Tắt tất cả nhắc nhở ({undismissedCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Thẻ tổng quan */}
      <div className="loc-stats-grid">
        <div className="loc-stat-card danger">
          <div className="loc-stat-icon"><AlertTriangle size={24} /></div>
          <div>
            <span className="loc-stat-label">Cảnh báo chưa tắt (Đang nhắc nhở hàng ngày)</span>
            <h3 className="loc-stat-value">{undismissedCount}</h3>
          </div>
        </div>
        <div className="loc-stat-card success">
          <div className="loc-stat-icon"><CheckCircle2 size={24} /></div>
          <div>
            <span className="loc-stat-label">Đã xác nhận / Đã tắt nhắc nhở</span>
            <h3 className="loc-stat-value">{Math.max(0, totalAll - undismissedCount)}</h3>
          </div>
        </div>
        <div className="loc-stat-card info">
          <div className="loc-stat-icon"><MapPin size={24} /></div>
          <div>
            <span className="loc-stat-label">Tổng số cảnh báo ghi nhận</span>
            <h3 className="loc-stat-value">{totalAll}</h3>
          </div>
        </div>
      </div>

      {/* Bộ lọc & Tìm kiếm */}
      <div className="loc-toolbar">
        <div className="loc-tabs">
          <button
            className={`loc-tab ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            Tất cả ({totalAll})
          </button>
          <button
            className={`loc-tab ${statusFilter === 'undismissed' ? 'active' : ''}`}
            onClick={() => setStatusFilter('undismissed')}
          >
            🔴 Chưa tắt nhắc nhở ({undismissedCount})
          </button>
          <button
            className={`loc-tab ${statusFilter === 'dismissed' ? 'active' : ''}`}
            onClick={() => setStatusFilter('dismissed')}
          >
            🟢 Đã tắt ({Math.max(0, totalAll - undismissedCount)})
          </button>
        </div>

        <div className="loc-search-group">
          <div className="loc-search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Tìm theo Serial, Điểm bán, Sản phẩm, Vị trí..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary" onClick={loadAlerts}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Bảng dữ liệu cảnh báo riêng */}
      <div className="loc-table-card">
        {loading ? (
          <div className="loc-empty-state">Đang tải danh sách cảnh báo vị trí...</div>
        ) : alerts.length === 0 ? (
          <div className="loc-empty-state">
            <CheckCircle2 size={42} style={{ color: '#10b981', marginBottom: 8 }} />
            <h3>Không có cảnh báo lệch vị trí nào</h3>
            <p>Khi tem đã gán cho Điểm bán bị quét ở địa phương khác với địa chỉ khai báo, cảnh báo sẽ xuất hiện tại đây.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="loc-table">
              <thead>
                <tr>
                  <th>Mã Serial</th>
                  <th>Sản phẩm</th>
                  <th>Điểm bán đã gán</th>
                  <th>Địa chỉ Điểm bán & Vị trí Kho</th>
                  <th>Vị trí quét phát hiện</th>
                  <th>Thời gian quét</th>
                  <th>Trạng thái nhắc nhở</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((item) => (
                  <tr key={item._id} className={item.isDismissed ? 'row-dismissed' : 'row-active-alert'}>
                    <td>
                      <span className="loc-serial-badge">{item.serialNumber}</span>
                    </td>
                    <td>
                      <strong>{item.productName || 'Sản phẩm'}</strong>
                    </td>
                    <td>
                      <div className="loc-store-name">{item.storeName || 'Điểm bán'}</div>
                    </td>
                    <td>
                      <div className="loc-addr-expected">
                        📍 <strong>Điểm bán:</strong> {item.expectedAddress || 'Chưa khai báo'}
                      </div>
                      {item.warehouseAddress && (
                        <div className="loc-addr-warehouse">
                          🏭 <strong>Kho quét gán:</strong> {item.warehouseAddress}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="loc-addr-actual">
                        ⚠️ {item.actualLocation?.address || item.actualLocation?.city || 'Khác khu vực'}
                      </div>
                      {item.actualLocation?.ipAddress && (
                        <div className="loc-ip-sub">IP: {item.actualLocation.ipAddress} ({item.actualLocation.deviceType || 'mobile'})</div>
                      )}
                    </td>
                    <td>{formatDateTime(item.scannedAt)}</td>
                    <td>
                      {item.isDismissed ? (
                        <span className="loc-status-pill dismissed">Đã tắt nhắc nhở</span>
                      ) : (
                        <span className="loc-status-pill active">🔔 Nhắc nhở hàng ngày</span>
                      )}
                    </td>
                    <td>
                      <div className="loc-row-actions">
                        <button
                          className={`loc-action-btn ${item.isDismissed ? 'undismiss' : 'dismiss'}`}
                          onClick={() => handleToggleDismiss(item)}
                          title={item.isDismissed ? 'Bật lại nhắc nhở hàng ngày' : 'Tắt cảnh báo nhắc nhở'}
                        >
                          {item.isDismissed ? (
                            <>
                              <BellRing size={14} />
                              <span>Bật lại</span>
                            </>
                          ) : (
                            <>
                              <BellOff size={14} />
                              <span>Tắt cảnh báo</span>
                            </>
                          )}
                        </button>
                        <button
                          className="loc-action-btn delete"
                          onClick={() => handleDelete(item._id)}
                          title="Xóa bản ghi"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

