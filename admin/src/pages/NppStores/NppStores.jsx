import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Store,
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  QrCode,
  Clock,
  Tag,
  Eye,
  X,
  CheckCircle,
  Package
} from 'lucide-react';
import '../Distributors/Distributors.css';

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export default function NppStores() {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal Thêm / Sửa Điểm bán
  const [showModal, setShowModal] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Modal Xem danh sách Serial đã bán của Điểm bán (Bước 5)
  const [serialModalStore, setSerialModalStore] = useState(null);
  const [storeSerials, setStoreSerials] = useState([]);
  const [loadingSerials, setLoadingSerials] = useState(false);

  const loadStores = useCallback(async (searchQuery = search) => {
    setLoading(true);
    try {
      const res = await api.getRetailStores(searchQuery ? { search: searchQuery } : {});
      setStores(res.stores || res.data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách điểm bán:', err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadStores(search);
    }, 200);
    return () => clearTimeout(timer);
  }, [search, loadStores]);

  const handleOpenAdd = () => {
    setEditingStore(null);
    setForm({ name: '', address: '', phone: '' });
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (store) => {
    setEditingStore(store);
    setForm({
      name: store.name || '',
      address: store.address || '',
      phone: store.phone || ''
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Vui lòng nhập tên điểm bán');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingStore) {
        await api.updateRetailStore(editingStore._id, {
          name: form.name.trim(),
          address: form.address.trim(),
          phone: form.phone.trim()
        });
      } else {
        await api.createRetailStore({
          name: form.name.trim(),
          address: form.address.trim(),
          phone: form.phone.trim()
        });
      }
      setShowModal(false);
      loadStores(search);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi lưu điểm bán');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (store) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa điểm bán "${store.name}"?`)) return;
    try {
      await api.deleteRetailStore(store._id);
      loadStores(search);
    } catch (err) {
      alert(err.message || 'Lỗi khi xóa điểm bán');
    }
  };

  const handleViewSerials = async (store) => {
    setSerialModalStore(store);
    setLoadingSerials(true);
    setStoreSerials([]);
    try {
      const res = await api.getRetailStoreSerials(store._id);
      setStoreSerials(res.serials || res.data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách serial của điểm bán:', err);
    } finally {
      setLoadingSerials(false);
    }
  };

  const handleScanForStore = (store) => {
    // Lưu sẵn điểm bán đang chọn vào session để trang Quét tự động nhận
    localStorage.setItem('npp_active_store_session', JSON.stringify({
      _id: store._id,
      name: store.name,
      address: store.address || '',
      phone: store.phone || ''
    }));
    navigate(`/npp/scan?storeId=${store._id}`);
  };

  const totalSerialsAllStores = stores.reduce((sum, s) => sum + (s.totalSerials || 0), 0);

  return (
    <div className="distributors-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Store size={28} />
            Quản lý Điểm bán
          </h1>
          <p className="page-subtitle">
            Quản lý danh sách các điểm bán trực thuộc Nhà phân phối và theo dõi Serial + thời gian vừa xuất bán
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/npp/scan')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <QrCode size={18} />
            Quét tem cho Điểm bán
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenAdd}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} />
            Thêm Điểm bán
          </button>
        </div>
      </div>

      {/* Thống kê nhanh */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div className="glass-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Store size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Tổng số Điểm bán</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{stores.length}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Tag size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Tổng Serial đã xuất cho Điểm bán</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#34d399' }}>{totalSerialsAllStores}</div>
          </div>
        </div>
      </div>

      {/* Thanh tìm kiếm hỗ trợ gõ không dấu (ví dụ gõ "thanh" -> Thành, Thánh, Thạnh) */}
      <div className="filters-bar glass-card" style={{ marginBottom: '20px', padding: '14px 18px' }}>
        <div className="search-box" style={{ flex: 1, maxWidth: '520px' }}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Tìm điểm bán (gõ 1 từ không dấu, VD: 'thanh' sẽ ra Thành, Thánh, Thạnh...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Bảng quản lý Điểm bán (Bước 2 & Bước 5) */}
      <div className="table-container glass-card">
        {loading ? (
          <div className="table-loading">
            <div className="spinner" />
            <span>Đang tải danh sách điểm bán...</span>
          </div>
        ) : stores.length === 0 ? (
          <div className="empty-state" style={{ padding: '48px 20px', textAlign: 'center' }}>
            <Store size={48} style={{ opacity: 0.35, marginBottom: '12px' }} />
            <h3>Chưa có Điểm bán nào</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Hãy bấm &ldquo;Thêm Điểm bán&rdquo; để tạo danh sách điểm bán (Tên điểm bán, Địa chỉ, Điện thoại liên hệ).
            </p>
            <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
              <Plus size={18} /> Thêm Điểm bán đầu tiên
            </button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>STT</th>
                <th>Tên Điểm bán</th>
                <th>Địa chỉ</th>
                <th>Điện thoại liên hệ</th>
                <th style={{ textAlign: 'center' }}>Số lượng tem</th>
                <th>Serial vừa bán + Thời gian</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store, idx) => {
                const recent = store.recentSales || [];
                return (
                  <tr key={store._id}>
                    <td>
                      <span className="badge badge-info" style={{ fontWeight: 700 }}>
                        #{idx + 1}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Store size={16} style={{ color: '#6366f1', flexShrink: 0 }} />
                        {store.name}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: 'var(--text-secondary)', fontSize: '13.5px' }}>
                        <MapPin size={14} style={{ marginTop: '3px', flexShrink: 0, color: '#94a3b8' }} />
                        <span>{store.address || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '13.5px' }}>
                        <Phone size={14} style={{ flexShrink: 0, color: '#10b981' }} />
                        <span>{store.phone || '—'}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        className={`badge ${(store.totalSerials || 0) > 0 ? 'badge-success' : 'badge-secondary'}`}
                        style={{ fontSize: '13px', padding: '4px 10px', cursor: (store.totalSerials || 0) > 0 ? 'pointer' : 'default' }}
                        onClick={() => (store.totalSerials || 0) > 0 && handleViewSerials(store)}
                      >
                        {store.totalSerials || 0} serial
                      </span>
                    </td>
                    <td>
                      {recent.length === 0 ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
                          Chưa có serial nào được quét
                        </span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {recent.slice(0, 3).map((item, rIdx) => (
                            <div
                              key={item.serialNumber + rIdx}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: rIdx === 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                                border: rIdx === 0 ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '8px',
                                padding: '5px 10px',
                                fontSize: '12.5px'
                              }}
                            >
                              <span style={{ fontWeight: 700, fontFamily: 'monospace', color: rIdx === 0 ? '#34d399' : 'var(--text-primary)' }}>
                                {item.serialNumber}
                              </span>
                              <span style={{ color: 'var(--text-muted)' }}>•</span>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                                <Clock size={12} />
                                {formatDateTime(item.soldAt)}
                              </span>
                            </div>
                          ))}
                          {(store.totalSerials || 0) > 3 && (
                            <button
                              type="button"
                              onClick={() => handleViewSerials(store)}
                              style={{
                                alignSelf: 'flex-start',
                                background: 'none',
                                border: 'none',
                                color: '#818cf8',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                padding: '2px 0'
                              }}
                            >
                              + Xem toàn bộ {store.totalSerials} serial đã bán...
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons" style={{ justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn-icon"
                          title="Quét tem xuất cho điểm bán này"
                          onClick={() => handleScanForStore(store)}
                          style={{ color: '#34d399', background: 'rgba(16, 185, 129, 0.12)' }}
                        >
                          <QrCode size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          title="Xem danh sách Serial & Thời gian bán"
                          onClick={() => handleViewSerials(store)}
                          style={{ color: '#60a5fa', background: 'rgba(59, 130, 246, 0.12)' }}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          title="Chỉnh sửa điểm bán"
                          onClick={() => handleOpenEdit(store)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon btn-danger-icon"
                          title="Xóa điểm bán"
                          onClick={() => handleDelete(store)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Thêm / Sửa Điểm bán */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content glass-card" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <Store size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                {editingStore ? 'Cập nhật Điểm bán' : 'Thêm Điểm bán mới'}
              </h2>
              <button type="button" className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {error && (
                  <div className="alert alert-error" style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontSize: '13.5px' }}>
                    {error}
                  </div>
                )}

                <div className="form-group">
                  <label>Tên điểm bán <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="VD: Nhà thuốc Thành Công / Điểm bán Thành Đạt..."
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label>Địa chỉ</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="VD: Số 120 Nguyễn Trãi, Thanh Xuân, Hà Nội"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Điện thoại liên hệ</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="VD: 0912345678"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Đang lưu...' : editingStore ? 'Lưu thay đổi' : 'Thêm Điểm bán'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xem chi tiết toàn bộ Serial + Thời gian bán của Điểm bán (Bước 5) */}
      {serialModalStore && (
        <div className="modal-overlay" onClick={() => setSerialModalStore(null)}>
          <div className="modal-content glass-card" style={{ maxWidth: '720px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <CheckCircle size={20} style={{ color: '#34d399' }} />
                  Lịch sử Serial đã xuất — {serialModalStore.name}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Địa chỉ: {serialModalStore.address || '—'} | SĐT: {serialModalStore.phone || '—'}
                </p>
              </div>
              <button type="button" className="modal-close" onClick={() => setSerialModalStore(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto', marginTop: '12px' }}>
              {loadingSerials ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Đang tải danh sách serial...
                </div>
              ) : storeSerials.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Điểm bán này chưa có serial nào được quét.
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Mã Serial</th>
                      <th>Sản phẩm</th>
                      <th>Thời gian xuất bán</th>
                    </tr>
                  </thead>
                  <tbody>
                    {storeSerials.map((item, i) => (
                      <tr key={item.serialNumber + i}>
                        <td>{i + 1}</td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#34d399', fontSize: '14px' }}>
                            {item.serialNumber}
                          </span>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Package size={14} style={{ color: '#818cf8' }} />
                            {item.productName || 'Sản phẩm'}
                          </span>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                            <Clock size={14} />
                            {formatDateTime(item.soldAt)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const target = serialModalStore;
                  setSerialModalStore(null);
                  handleScanForStore(target);
                }}
              >
                <QrCode size={16} /> Quét thêm Serial cho Điểm bán này
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setSerialModalStore(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

