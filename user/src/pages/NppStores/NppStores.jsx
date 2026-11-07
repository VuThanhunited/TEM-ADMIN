import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import userApi from '../../services/api';
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
  Package,
  ArrowLeft,
  Upload,
  Download,
  FileSpreadsheet
} from 'lucide-react';

const readFileAsBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });

const removeVietnameseTones = (str = '') =>
  String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();

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

  const [showModal, setShowModal] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [form, setForm] = useState({ name: '', address: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [serialModalStore, setSerialModalStore] = useState(null);
  const [storeSerials, setStoreSerials] = useState([]);
  const [storeSerialStats, setStoreSerialStats] = useState(null);
  const [loadingSerials, setLoadingSerials] = useState(false);

  // Yêu cầu 2: Modal Import Danh sách Điểm bán (Excel)
  const [showImportStoresModal, setShowImportStoresModal] = useState(false);
  const [importStoresFile, setImportStoresFile] = useState(null);
  const [importingStores, setImportingStores] = useState(false);
  const [importStoresResult, setImportStoresResult] = useState(null);
  const [importStoresError, setImportStoresError] = useState('');

  // Yêu cầu 4: Modal Import Bảng Excel Phân phối Ma trận
  const [showImportMatrixModal, setShowImportMatrixModal] = useState(false);
  const [importMatrixFile, setImportMatrixFile] = useState(null);
  const [importMatrixDate, setImportMatrixDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [importingMatrix, setImportingMatrix] = useState(false);
  const [importMatrixResult, setImportMatrixResult] = useState(null);
  const [importMatrixError, setImportMatrixError] = useState('');
  const [exportingExcel, setExportingExcel] = useState(false);

  // Bộ lọc thống kê doanh số Điểm bán theo Tháng / Quý / Năm
  const nowDate = new Date();
  const [periodType, setPeriodType] = useState('all'); // 'all' | 'month' | 'quarter' | 'year'
  const [selectedYear, setSelectedYear] = useState(nowDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(nowDate.getMonth() + 1);
  const [selectedQuarter, setSelectedQuarter] = useState(Math.floor(nowDate.getMonth() / 3) + 1);
  const [summaryData, setSummaryData] = useState(null);

  const loadStores = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        periodType,
        year: selectedYear,
        month: selectedMonth,
        quarter: selectedQuarter
      };
      const res = await userApi.getRetailStores(params);
      setStores(res.stores || res.data || []);
      setSummaryData(res.summary || null);
    } catch (err) {
      console.error('Lỗi tải danh sách điểm bán:', err);
    } finally {
      setLoading(false);
    }
  }, [periodType, selectedYear, selectedMonth, selectedQuarter]);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  const filteredStores = useMemo(() => {
    const q = removeVietnameseTones(search);
    if (!q) return stores;
    return stores.filter((s) => {
      const nameNorm = removeVietnameseTones(s.name || '');
      const addrNorm = removeVietnameseTones(s.address || '');
      const phoneNorm = removeVietnameseTones(s.phone || '');
      return nameNorm.includes(q) || addrNorm.includes(q) || phoneNorm.includes(q);
    });
  }, [stores, search]);

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
        await userApi.updateRetailStore(editingStore._id, {
          name: form.name.trim(),
          address: form.address.trim(),
          phone: form.phone.trim()
        });
      } else {
        await userApi.createRetailStore({
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
      await userApi.deleteRetailStore(store._id);
      loadStores(search);
    } catch (err) {
      alert(err.message || 'Lỗi khi xóa điểm bán');
    }
  };

  const handleViewSerials = async (store) => {
    setSerialModalStore(store);
    setLoadingSerials(true);
    setStoreSerials([]);
    setStoreSerialStats(null);
    try {
      const res = await userApi.getRetailStoreSerials(store._id, {
        periodType,
        year: selectedYear,
        month: selectedMonth,
        quarter: selectedQuarter
      });
      setStoreSerials(res.serials || res.data || []);
      setStoreSerialStats(res);
    } catch (err) {
      console.error('Lỗi tải danh sách serial của điểm bán:', err);
    } finally {
      setLoadingSerials(false);
    }
  };

  const handleScanForStore = (store) => {
    localStorage.setItem('npp_active_store_session', JSON.stringify({
      _id: store._id,
      name: store.name,
      address: store.address || '',
      phone: store.phone || ''
    }));
    navigate('/scan?continueStore=1');
  };

  const handleImportStoresSubmit = async (e) => {
    e.preventDefault();
    if (!importStoresFile) {
      setImportStoresError('Vui lòng chọn file Excel (.xlsx, .xls, .csv) danh sách điểm bán.');
      return;
    }
    setImportingStores(true);
    setImportStoresError('');
    setImportStoresResult(null);
    try {
      const fileBase64 = await readFileAsBase64(importStoresFile);
      const res = await userApi.importRetailStores({ fileBase64 });
      setImportStoresResult(res);
      loadStores(search);
    } catch (err) {
      setImportStoresError(err.message || 'Lỗi khi import danh sách điểm bán');
    } finally {
      setImportingStores(false);
    }
  };

  const handleImportMatrixSubmit = async (e) => {
    e.preventDefault();
    if (!importMatrixFile) {
      setImportMatrixError('Vui lòng chọn file Excel bảng phân phối (Điểm bán × Sản phẩm × Dải Serial).');
      return;
    }
    setImportingMatrix(true);
    setImportMatrixError('');
    setImportMatrixResult(null);
    try {
      const fileBase64 = await readFileAsBase64(importMatrixFile);
      const res = await userApi.importDistributionMatrix({
        fileBase64,
        importDate: importMatrixDate ? new Date(`${importMatrixDate}T12:00:00`).toISOString() : new Date().toISOString()
      });
      setImportMatrixResult(res);
      loadStores(search);
    } catch (err) {
      setImportMatrixError(err.message || 'Lỗi khi import bảng Excel phân phối');
    } finally {
      setImportingMatrix(false);
    }
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      const res = await userApi.exportRetailStoresData();
      if (!res?.fileBase64) {
        throw new Error('Không nhận được dữ liệu file Excel từ máy chủ');
      }
      const binaryStr = window.atob(res.fileBase64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.fileName || `Diem_Ban_Phan_Phoi_TPCN_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Lỗi khi xuất file Excel Điểm bán & Phân phối: ' + (err.message || err));
    } finally {
      setExportingExcel(false);
    }
  };

  const totalSerialsAllStores = summaryData?.totalSerialsInPeriod !== undefined
    ? summaryData.totalSerialsInPeriod
    : stores.reduce((sum, s) => sum + (s.periodSerials ?? s.totalSerials ?? 0), 0);
  const totalRevenueAllStores = summaryData?.totalRevenueInPeriod !== undefined
    ? summaryData.totalRevenueInPeriod
    : stores.reduce((sum, s) => sum + (s.periodRevenue ?? s.totalRevenue ?? 0), 0);

  const formatCurrency = (val) => `${Number(val || 0).toLocaleString('vi-VN')} đ`;
  const periodLabel = periodType === 'month'
    ? `Tháng ${selectedMonth}/${selectedYear}`
    : periodType === 'quarter'
      ? `Quý ${selectedQuarter}/${selectedYear}`
      : periodType === 'year'
        ? `Năm ${selectedYear}`
        : 'Tất cả thời gian';

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f8fafc', padding: '16px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#e2e8f0',
                borderRadius: '10px',
                padding: '8px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Store size={24} color="#818cf8" />
                Bảng Quản lý Điểm bán
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#94a3b8' }}>
                Quản lý danh sách Điểm bán và theo dõi Serial + thời gian vừa bán
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={exportingExcel}
              style={{
                background: '#1e293b',
                border: '1px solid #f59e0b',
                color: '#fbbf24',
                borderRadius: '10px',
                padding: '10px 14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              title="Xuất toàn bộ Danh sách Điểm bán + Bảng Ma trận + Chi tiết Serial ra file Excel"
            >
              <Download size={17} />
              {exportingExcel ? 'Đang xuất...' : 'Xuất Excel Điểm bán'}
            </button>
            <button
              type="button"
              onClick={() => {
                setImportStoresFile(null);
                setImportStoresResult(null);
                setImportStoresError('');
                setShowImportStoresModal(true);
              }}
              style={{
                background: '#1e293b',
                border: '1px solid #3b82f6',
                color: '#93c5fd',
                borderRadius: '10px',
                padding: '10px 14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Upload size={17} />
              Import DS Điểm bán
            </button>
            <button
              type="button"
              onClick={() => {
                setImportMatrixFile(null);
                setImportMatrixResult(null);
                setImportMatrixError('');
                setImportMatrixDate(new Date().toISOString().slice(0, 10));
                setShowImportMatrixModal(true);
              }}
              style={{
                background: '#1e293b',
                border: '1px solid #10b981',
                color: '#34d399',
                borderRadius: '10px',
                padding: '10px 14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FileSpreadsheet size={17} />
              Import Excel Phân phối
            </button>
            <button
              type="button"
              onClick={() => navigate('/scan')}
              style={{
                background: '#1e293b',
                border: '1px solid #475569',
                color: '#f8fafc',
                borderRadius: '10px',
                padding: '10px 14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <QrCode size={18} />
              Quét tem
            </button>
            <button
              type="button"
              onClick={handleOpenAdd}
              style={{
                background: '#4f46e5',
                border: 'none',
                color: '#ffffff',
                borderRadius: '10px',
                padding: '10px 16px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Plus size={18} />
              Thêm Điểm bán
            </button>
          </div>
        </div>

        {/* Bộ lọc Thống kê Doanh số Điểm bán theo Tháng / Quý / Năm */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '12px 16px', marginBottom: '14px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>
            📊 Thống kê Doanh số Điểm bán theo kỳ ({periodLabel}):
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'month', label: 'Theo Tháng' },
              { id: 'quarter', label: 'Theo Quý' },
              { id: 'year', label: 'Theo Năm' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPeriodType(tab.id)}
                style={{
                  background: periodType === tab.id ? '#4f46e5' : '#0f172a',
                  color: periodType === tab.id ? '#fff' : '#cbd5e1',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            ))}

            {periodType === 'month' && (
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(Number(e.target.value))}
                style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: '8px', padding: '6px 10px', fontSize: '0.82rem' }}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>Tháng {m}</option>
                ))}
              </select>
            )}

            {periodType === 'quarter' && (
              <select
                value={selectedQuarter}
                onChange={e => setSelectedQuarter(Number(e.target.value))}
                style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: '8px', padding: '6px 10px', fontSize: '0.82rem' }}
              >
                {[1, 2, 3, 4].map(q => (
                  <option key={q} value={q}>Quý {q}</option>
                ))}
              </select>
            )}

            {periodType !== 'all' && (
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                style={{ background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: '8px', padding: '6px 10px', fontSize: '0.82rem' }}
              >
                {[nowDate.getFullYear() - 2, nowDate.getFullYear() - 1, nowDate.getFullYear(), nowDate.getFullYear() + 1].map(y => (
                  <option key={y} value={y}>Năm {y}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Thống kê */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(99,102,241,0.18)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Tổng số Điểm bán</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>{stores.length}</div>
            </div>
          </div>

          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16,185,129,0.18)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Tag size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>SL sản phẩm đã gán ({periodLabel})</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#34d399' }}>{totalSerialsAllStores}</div>
            </div>
          </div>

          <div style={{ background: '#1e293b', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245,158,11,0.18)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
              ₫
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Doanh số ({periodLabel})</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24' }}>{formatCurrency(totalRevenueAllStores)}</div>
            </div>
          </div>
        </div>

        {/* Tìm kiếm */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            placeholder="Tìm điểm bán (VD: gõ 'thanh' sẽ ra Thành, Thánh, Thạnh...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, background: 'transparent', border: 'none', color: '#f8fafc', fontSize: '0.92rem', outline: 'none' }}
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Bảng Điểm bán */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Đang tải danh sách điểm bán...</div>
          ) : filteredStores.length === 0 ? (
            <div style={{ padding: '44px 20px', textAlign: 'center' }}>
              <Store size={42} style={{ opacity: 0.4, marginBottom: '10px' }} />
              <h3 style={{ margin: '0 0 8px' }}>{search ? 'Không tìm thấy Điểm bán phù hợp' : 'Chưa có Điểm bán nào'}</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '16px' }}>
                {search
                  ? `Không có điểm bán nào khớp với từ khóa "${search}".`
                  : 'Bấm “Thêm Điểm bán” để thêm Tên điểm bán, Địa chỉ và Điện thoại liên hệ.'}
              </p>
              {!search && (
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }}
                >
                  + Thêm Điểm bán đầu tiên
                </button>
              )}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#0f172a', color: '#94a3b8', textAlign: 'left' }}>
                  <th style={{ padding: '12px 14px' }}>STT</th>
                  <th style={{ padding: '12px 14px' }}>Tên Điểm bán</th>
                  <th style={{ padding: '12px 14px' }}>Địa chỉ</th>
                  <th style={{ padding: '12px 14px' }}>Điện thoại</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>SL đã gán</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Doanh số (SL × Giá SP)</th>
                  <th style={{ padding: '12px 14px' }}>Serial vừa bán + Thời gian</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredStores.map((store, idx) => {
                  const recent = store.recentSales || [];
                  const qty = store.periodSerials ?? store.totalSerials ?? 0;
                  const rev = store.periodRevenue ?? store.totalRevenue ?? 0;
                  return (
                    <tr key={store._id} style={{ borderTop: '1px solid #334155' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#818cf8' }}>#{idx + 1}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 700 }}>{store.name}</td>
                      <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>{store.address || '—'}</td>
                      <td style={{ padding: '12px 14px', color: '#34d399' }}>{store.phone || '—'}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span
                          onClick={() => (store.totalSerials || 0) > 0 && handleViewSerials(store)}
                          style={{
                            background: qty > 0 ? 'rgba(16,185,129,0.18)' : '#334155',
                            color: qty > 0 ? '#34d399' : '#94a3b8',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: (store.totalSerials || 0) > 0 ? 'pointer' : 'default'
                          }}
                        >
                          {qty} SP
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: rev > 0 ? '#fbbf24' : '#64748b' }}>
                        {formatCurrency(rev)}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {recent.length === 0 ? (
                          <span style={{ color: '#64748b', fontStyle: 'italic' }}>Chưa có serial</span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {recent.slice(0, 3).map((item, rIdx) => (
                              <div key={item.serialNumber + rIdx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#34d399' }}>{item.serialNumber}</span>
                                <span style={{ color: '#64748b' }}>•</span>
                                <span style={{ color: '#cbd5e1' }}>{formatDateTime(item.soldAt)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            title="Quét tem cho điểm bán này"
                            onClick={() => handleScanForStore(store)}
                            style={{ background: 'rgba(16,185,129,0.18)', color: '#34d399', border: 'none', borderRadius: '8px', padding: '7px', cursor: 'pointer' }}
                          >
                            <QrCode size={16} />
                          </button>
                          <button
                            type="button"
                            title="Xem lịch sử Serial"
                            onClick={() => handleViewSerials(store)}
                            style={{ background: 'rgba(59,130,246,0.18)', color: '#60a5fa', border: 'none', borderRadius: '8px', padding: '7px', cursor: 'pointer' }}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            title="Sửa điểm bán"
                            onClick={() => handleOpenEdit(store)}
                            style={{ background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: '8px', padding: '7px', cursor: 'pointer' }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            title="Xóa điểm bán"
                            onClick={() => handleDelete(store)}
                            style={{ background: 'rgba(239,68,68,0.18)', color: '#f87171', border: 'none', borderRadius: '8px', padding: '7px', cursor: 'pointer' }}
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
      </div>

      {/* Modal Thêm / Sửa Điểm bán */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 1000 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '20px', width: '100%', maxWidth: '460px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>{editingStore ? 'Cập nhật Điểm bán' : 'Thêm Điểm bán mới'}</h3>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {error && (
                <div style={{ background: 'rgba(239,68,68,0.18)', color: '#f87171', padding: '10px', borderRadius: '8px', fontSize: '0.85rem' }}>
                  {error}
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', marginBottom: '6px', color: '#cbd5e1' }}>Tên điểm bán *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="VD: Nhà thuốc Thành Công"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', marginBottom: '6px', color: '#cbd5e1' }}>Địa chỉ</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="VD: 120 Nguyễn Trãi, Thanh Xuân, Hà Nội"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', marginBottom: '6px', color: '#cbd5e1' }}>Điện thoại liên hệ</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="VD: 0912345678"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ background: '#334155', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 16px', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }}
                >
                  {saving ? 'Đang lưu...' : 'Lưu Điểm bán'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xem danh sách Serial của Điểm bán */}
      {serialModalStore && (
        <div
          onClick={() => setSerialModalStore(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 1000 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '20px', width: '100%', maxWidth: '640px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={18} color="#34d399" />
                  Serial đã bán — {serialModalStore.name}
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                  Địa chỉ: {serialModalStore.address || '—'} | SĐT: {serialModalStore.phone || '—'}
                </div>
              </div>
              <button type="button" onClick={() => setSerialModalStore(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loadingSerials ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>Đang tải danh sách serial...</div>
              ) : storeSerials.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>Chưa có serial nào được quét.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                  <thead>
                    <tr style={{ background: '#0f172a', color: '#94a3b8', textAlign: 'left' }}>
                      <th style={{ padding: '10px' }}>STT</th>
                      <th style={{ padding: '10px' }}>Mã Serial</th>
                      <th style={{ padding: '10px' }}>Sản phẩm</th>
                      <th style={{ padding: '10px' }}>Thời gian bán</th>
                    </tr>
                  </thead>
                  <tbody>
                    {storeSerials.map((item, i) => (
                      <tr key={item.serialNumber + i} style={{ borderTop: '1px solid #334155' }}>
                        <td style={{ padding: '10px' }}>{i + 1}</td>
                        <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 700, color: '#34d399' }}>{item.serialNumber}</td>
                        <td style={{ padding: '10px' }}>{item.productName || 'Sản phẩm'}</td>
                        <td style={{ padding: '10px', color: '#cbd5e1' }}>{formatDateTime(item.soldAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Yêu cầu 2: Modal Import Danh sách Điểm bán (Excel) */}
      {showImportStoresModal && (
        <div
          onClick={() => setShowImportStoresModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 1000 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '20px', width: '100%', maxWidth: '520px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={18} color="#60a5fa" />
                Import Danh sách Điểm bán (Excel)
              </h3>
              <button type="button" onClick={() => setShowImportStoresModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleImportStoresSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '10px', padding: '12px', fontSize: '0.84rem', color: '#cbd5e1' }}>
                <div>• File Excel gồm các cột: <strong>Tên điểm bán</strong>, <strong>Địa chỉ</strong>, <strong>Số điện thoại</strong>.</div>
                <div style={{ marginTop: '6px' }}>
                  <a
                    href={userApi.getRetailStoreTemplateUrl('stores')}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#34d399', fontWeight: 700, textDecoration: 'underline' }}
                  >
                    <Download size={14} /> Tải file Excel mẫu Danh sách Điểm bán
                  </a>
                </div>
              </div>

              {importStoresError && (
                <div style={{ background: 'rgba(239,68,68,0.18)', color: '#f87171', padding: '10px', borderRadius: '8px', fontSize: '0.85rem' }}>
                  {importStoresError}
                </div>
              )}

              {importStoresResult && (
                <div style={{ background: 'rgba(16,185,129,0.18)', color: '#34d399', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700 }}>
                  {importStoresResult.message}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', marginBottom: '6px', color: '#cbd5e1' }}>Chọn file Excel (.xlsx, .xls, .csv) *</label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setImportStoresFile(e.target.files?.[0] || null)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowImportStoresModal(false)}
                  style={{ background: '#334155', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 16px', cursor: 'pointer' }}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={importingStores}
                  style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }}
                >
                  {importingStores ? 'Đang import...' : 'Thực hiện Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Yêu cầu 4: Modal Import Bảng Excel Phân phối Ma trận */}
      {showImportMatrixModal && (
        <div
          onClick={() => setShowImportMatrixModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 1000 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '20px', width: '100%', maxWidth: '620px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileSpreadsheet size={18} color="#34d399" />
                Import Bảng Excel Phân phối (Ma trận)
              </h3>
              <button type="button" onClick={() => setShowImportMatrixModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleImportMatrixSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', padding: '12px', fontSize: '0.84rem', color: '#cbd5e1' }}>
                <div>• Dòng 1: <strong>Điểm bán ---------&gt;</strong> | <strong>Nhà A</strong> | <strong>Nhà B</strong> | <strong>Nhà C</strong> ...</div>
                <div>• Dòng 2: <strong>Tên sản phẩm</strong></div>
                <div>• Dòng 3+: <strong>Sản phẩm 1</strong> | <code>00001-000010</code> | <code>000011-000020</code> ...</div>
                <div>• <strong>Ngày import</strong> bên dưới sẽ là <strong>Ngày bán / gán sản phẩm</strong>.</div>
                <div style={{ marginTop: '6px' }}>
                  <a
                    href={userApi.getRetailStoreTemplateUrl('matrix')}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#34d399', fontWeight: 700, textDecoration: 'underline' }}
                  >
                    <Download size={14} /> Tải file Excel mẫu Bảng Ma trận Phân phối
                  </a>
                </div>
              </div>

              {importMatrixError && (
                <div style={{ background: 'rgba(239,68,68,0.18)', color: '#f87171', padding: '10px', borderRadius: '8px', fontSize: '0.85rem' }}>
                  {importMatrixError}
                </div>
              )}

              {importMatrixResult && (
                <div style={{ background: 'rgba(16,185,129,0.18)', color: '#34d399', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700 }}>
                  {importMatrixResult.message}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', marginBottom: '6px', color: '#cbd5e1' }}>Ngày Import (Ngày bán / gán sản phẩm) *</label>
                <input
                  type="date"
                  required
                  value={importMatrixDate}
                  onChange={(e) => setImportMatrixDate(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', marginBottom: '6px', color: '#cbd5e1' }}>Chọn file Excel Bảng phân phối (.xlsx, .xls, .csv) *</label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setImportMatrixFile(e.target.files?.[0] || null)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowImportMatrixModal(false)}
                  style={{ background: '#334155', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 16px', cursor: 'pointer' }}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={importingMatrix}
                  style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }}
                >
                  {importingMatrix ? 'Đang xử lý...' : 'Import & Gán Serial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

