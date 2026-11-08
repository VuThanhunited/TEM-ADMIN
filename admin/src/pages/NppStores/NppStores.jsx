import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
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
  Package,
  DollarSign,
  Calendar,
  Upload,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import '../Distributors/Distributors.css';

const readFileAsBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });

const parseExcelFileToRows = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames?.[0];
    if (!firstSheetName) return [];
    const worksheet = workbook.Sheets[firstSheetName];
    return XLSX.utils.sheet_to_json(worksheet, { defval: '' }) || [];
  } catch (err) {
    console.warn('Không thể parse Excel trực tiếp trên trình duyệt, chuyển sang gửi fileBase64:', err);
    return [];
  }
};

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

const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return `${num.toLocaleString('vi-VN')} đ`;
};

export default function NppStores() {
  const navigate = useNavigate();
  const now = new Date();
  const [stores, setStores] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Bộ lọc thống kê doanh số theo Tháng / Quý / Năm
  const [periodType, setPeriodType] = useState('all'); // 'all' | 'month' | 'quarter' | 'year'
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedQuarter, setSelectedQuarter] = useState(Math.floor(now.getMonth() / 3) + 1);

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

  // Modal Xem danh sách Serial & Doanh số đã bán của Điểm bán
  const [serialModalStore, setSerialModalStore] = useState(null);
  const [storeSerials, setStoreSerials] = useState([]);
  const [storeBreakdown, setStoreBreakdown] = useState([]);
  const [storeModalRevenue, setStoreModalRevenue] = useState(0);
  const [loadingSerials, setLoadingSerials] = useState(false);

  // Yêu cầu 2: Modal Import Danh sách Điểm bán từ giải pháp cũ / Excel
  const [showImportStoresModal, setShowImportStoresModal] = useState(false);
  const [importStoresFile, setImportStoresFile] = useState(null);
  const [importingStores, setImportingStores] = useState(false);
  const [importStoresResult, setImportStoresResult] = useState(null);
  const [importStoresError, setImportStoresError] = useState('');

  // Yêu cầu 4: Modal Import Bảng Excel Phân phối Ma trận (Điểm bán × Sản phẩm × Dải Serial)
  const [showImportMatrixModal, setShowImportMatrixModal] = useState(false);
  const [importMatrixFile, setImportMatrixFile] = useState(null);
  const [importMatrixDate, setImportMatrixDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [importingMatrix, setImportingMatrix] = useState(false);
  const [importMatrixResult, setImportMatrixResult] = useState(null);
  const [importMatrixError, setImportMatrixError] = useState('');
  const [exportingExcel, setExportingExcel] = useState(false);

  const loadStores = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        periodType,
        year: selectedYear,
        month: selectedMonth,
        quarter: selectedQuarter
      };
      const res = await api.getRetailStores(params);
      setStores(res.stores || res.data || []);
      setSummary(res.summary || null);
    } catch (err) {
      console.error('Lỗi tải danh sách điểm bán:', err);
    } finally {
      setLoading(false);
    }
  }, [periodType, selectedYear, selectedMonth, selectedQuarter]);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  // Lọc điểm bán tức thì trên client hỗ trợ gõ không dấu (tránh gửi request liên tục lên server)
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
    setStoreBreakdown([]);
    setStoreModalRevenue(0);
    try {
      const res = await api.getRetailStoreSerials(store._id, {
        periodType,
        year: selectedYear,
        month: selectedMonth,
        quarter: selectedQuarter
      });
      setStoreSerials(res.serials || res.data || []);
      setStoreBreakdown(res.productBreakdown || []);
      setStoreModalRevenue(res.totalRevenue || 0);
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
    navigate(`/npp/scan?storeId=${store._id}`);
  };

  const handleDownloadTemplate = (type = 'stores') => {
    try {
      const wb = XLSX.utils.book_new();
      if (type === 'stores') {
        const wsData = [
          ['STT', 'Tên điểm bán', 'Địa chỉ', 'Số điện thoại'],
          [1, 'Nhà Thuốc Thành Công', '120 Nguyễn Trãi, Thanh Xuân, Hà Nội', '0912345678'],
          [2, 'Nhà Thuốc Minh Châu', '45 Hai Bà Trưng, Quận 1, TP.HCM', '0987654321'],
          [3, 'Quầy Thuốc An Khang', '88 Trần Phú, Hải Châu, Đà Nẵng', '0905112233']
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [{ wch: 6 }, { wch: 32 }, { wch: 42 }, { wch: 18 }];
        XLSX.utils.book_append_sheet(wb, ws, 'Danh_sach_diem_ban');
        XLSX.writeFile(wb, 'Mau_Import_Danh_Sach_Diem_Ban.xlsx');
        return;
      }

      const wsMatrixData = [
        ['Điểm bán --------->', 'Nhà A', 'Nhà B', 'Nhà C'],
        ['Tên sản phẩm', '', '', ''],
        ['Sản phẩm 1', '00001-000010', '00011-000020', ''],
        ['Sản phẩm 2', '00101-000110', '', ''],
        ['Sản phẩm 3', '', '', '']
      ];
      const wsMatrix = XLSX.utils.aoa_to_sheet(wsMatrixData);
      wsMatrix['!cols'] = [{ wch: 28 }, { wch: 22 }, { wch: 22 }, { wch: 22 }];
      XLSX.utils.book_append_sheet(wb, wsMatrix, 'Bang_Ma_Tran_Diem_Ban');

      const wsDetailData = [
        ['STT', 'Tên sản phẩm', 'Mã Serial', 'Điểm bán', 'Địa chỉ điểm bán', 'SĐT điểm bán'],
        [1, 'Sản phẩm 1', '00001-000010', 'Nhà A', '120 Nguyễn Trãi, Hà Nội', '0912345678'],
        [2, 'Sản phẩm 1', '00011-000020', 'Nhà B', '45 Hai Bà Trưng, TP.HCM', '0987654321']
      ];
      const wsDetail = XLSX.utils.aoa_to_sheet(wsDetailData);
      wsDetail['!cols'] = [{ wch: 6 }, { wch: 24 }, { wch: 20 }, { wch: 28 }, { wch: 36 }, { wch: 16 }];
      XLSX.utils.book_append_sheet(wb, wsDetail, 'Chi_tiet_phan_phoi');

      XLSX.writeFile(wb, 'Mau_Import_Ma_Tran_Diem_Ban_Serial.xlsx');
    } catch (err) {
      window.open(api.getRetailStoreTemplateUrl(type), '_blank');
    }
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
      const parsedRows = fileBase64 ? undefined : await parseExcelFileToRows(importStoresFile);
      const res = await api.importRetailStores({
        fileBase64,
        ...(parsedRows ? { stores: parsedRows } : {})
      });
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
      const parsedRows = fileBase64 ? undefined : await parseExcelFileToRows(importMatrixFile);
      const importDateIso = importMatrixDate ? new Date(`${importMatrixDate}T12:00:00`).toISOString() : new Date().toISOString();
      const res = await api.importDistributionMatrix({
        fileBase64,
        ...(parsedRows ? { rows: parsedRows } : {}),
        importDate: importDateIso
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
      const res = await api.exportRetailStoresData();
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

  const totalPeriodSerials = summary?.totalPeriodSerials ?? stores.reduce((sum, s) => sum + (s.periodSerialsCount ?? s.totalSerials ?? 0), 0);
  const totalPeriodRevenue = summary?.totalPeriodRevenue ?? stores.reduce((sum, s) => sum + (s.periodRevenue ?? s.totalRevenue ?? 0), 0);
  const periodLabel = summary?.period?.label || 'Tất cả thời gian';

  return (
    <div className="distributors-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Store size={28} />
            Quản lý Điểm bán &amp; Thống kê Doanh số
          </h1>
          <p className="page-subtitle">
            Quản lý các điểm bán địa phương của doanh nghiệp, danh sách Serial đã gán và thống kê Doanh số (Số lượng SP đã gán × Giá 1 sản phẩm) theo Tháng / Quý / Năm
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportExcel}
            disabled={exportingExcel}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', borderColor: '#f59e0b', color: '#fbbf24' }}
            title="Xuất toàn bộ Danh sách Điểm bán + Bảng Ma trận + Chi tiết Serial ra file Excel"
          >
            <Download size={17} />
            {exportingExcel ? 'Đang xuất Excel...' : 'Xuất Excel Điểm bán & Phân phối'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setImportStoresFile(null);
              setImportStoresResult(null);
              setImportStoresError('');
              setShowImportStoresModal(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', borderColor: '#3b82f6', color: '#60a5fa' }}
          >
            <Upload size={17} />
            Import DS Điểm bán (Excel)
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setImportMatrixFile(null);
              setImportMatrixResult(null);
              setImportMatrixError('');
              setImportMatrixDate(new Date().toISOString().slice(0, 10));
              setShowImportMatrixModal(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', borderColor: '#10b981', color: '#34d399' }}
          >
            <FileSpreadsheet size={17} />
            Import Excel Phân phối (Ma trận)
          </button>
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

      {/* Bộ lọc Thống kê Doanh số theo Tháng / Quý / Năm */}
      <div
        className="glass-card"
        style={{
          padding: '14px 18px',
          marginBottom: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          borderLeft: '4px solid #f59e0b'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={17} style={{ color: '#f59e0b' }} />
            Kỳ thống kê doanh số:
          </span>
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'month', label: 'Theo Tháng' },
            { id: 'quarter', label: 'Theo Quý' },
            { id: 'year', label: 'Theo Năm' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPeriodType(tab.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                border: periodType === tab.id ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.12)',
                background: periodType === tab.id ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.04)',
                color: periodType === tab.id ? '#fbbf24' : 'var(--text-secondary)'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {periodType !== 'all' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {periodType === 'month' && (
              <select
                className="form-control"
                style={{ width: 'auto', minWidth: '120px', padding: '6px 12px' }}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>Tháng {m}</option>
                ))}
              </select>
            )}

            {periodType === 'quarter' && (
              <select
                className="form-control"
                style={{ width: 'auto', minWidth: '140px', padding: '6px 12px' }}
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(Number(e.target.value))}
              >
                <option value={1}>Quý 1 (Tháng 1 - 3)</option>
                <option value={2}>Quý 2 (Tháng 4 - 6)</option>
                <option value={3}>Quý 3 (Tháng 7 - 9)</option>
                <option value={4}>Quý 4 (Tháng 10 - 12)</option>
              </select>
            )}

            <select
              className="form-control"
              style={{ width: 'auto', minWidth: '110px', padding: '6px 12px' }}
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>Năm {y}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Thống kê nhanh */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div className="glass-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Store size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Tổng số Điểm bán của mình</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{stores.length}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Tag size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Số lượng SP đã gán ({periodLabel})</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#34d399' }}>{totalPeriodSerials} SP</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', border: '1px solid rgba(245, 158, 11, 0.35)' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.18)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Tổng Doanh số Điểm bán ({periodLabel})</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#fbbf24' }}>{formatCurrency(totalPeriodRevenue)}</div>
          </div>
        </div>
      </div>

      {/* Thanh tìm kiếm hỗ trợ gõ không dấu */}
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

      {/* Bảng quản lý Điểm bán & Doanh số */}
      <div className="table-container glass-card">
        {loading ? (
          <div className="table-loading">
            <div className="spinner" />
            <span>Đang tải danh sách điểm bán...</span>
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="empty-state" style={{ padding: '48px 20px', textAlign: 'center' }}>
            <Store size={48} style={{ opacity: 0.35, marginBottom: '12px' }} />
            <h3>{search ? 'Không tìm thấy Điểm bán phù hợp' : 'Chưa có Điểm bán nào'}</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '18px' }}>
              {search
                ? `Không có điểm bán nào khớp với từ khóa "${search}".`
                : 'Hãy bấm “Thêm Điểm bán” để tạo danh sách điểm bán (Tên điểm bán, Địa chỉ, Điện thoại liên hệ).'}
            </p>
            {!search && (
              <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
                <Plus size={18} /> Thêm Điểm bán đầu tiên
              </button>
            )}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '54px' }}>STT</th>
                <th>Tên Điểm bán</th>
                <th>Địa chỉ khai báo</th>
                <th>Điện thoại</th>
                <th style={{ textAlign: 'center' }}>SL đã gán ({periodLabel})</th>
                <th style={{ textAlign: 'right' }}>Doanh số (SL × Giá SP)</th>
                <th>Serial vừa bán + Thời gian</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredStores.map((store, idx) => {
                const recent = store.recentSales || [];
                const qty = store.periodSerialsCount ?? store.totalSerials ?? 0;
                const rev = store.periodRevenue ?? store.totalRevenue ?? 0;
                const breakdown = store.productBreakdown || [];
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
                        className={`badge ${qty > 0 ? 'badge-success' : 'badge-secondary'}`}
                        style={{ fontSize: '13px', padding: '4px 10px', cursor: (store.totalSerials || 0) > 0 ? 'pointer' : 'default' }}
                        onClick={() => (store.totalSerials || 0) > 0 && handleViewSerials(store)}
                      >
                        {qty} SP
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: '#fbbf24', fontSize: '14.5px' }}>
                        {formatCurrency(rev)}
                      </div>
                      {breakdown.length > 0 && (
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {breakdown.map((b, bIdx) => (
                            <div key={bIdx}>
                              {b.quantity} × {formatCurrency(b.unitPrice)}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      {recent.length === 0 ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
                          Chưa có serial nào trong kỳ
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
                          {qty > 3 && (
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
                              + Xem toàn bộ {qty} serial &amp; doanh số...
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
                          title="Xem danh sách Serial & Doanh số"
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
                  <label>Địa chỉ Điểm bán (Dùng để đối chiếu cảnh báo vị trí quét)</label>
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

      {/* Modal Xem chi tiết toàn bộ Serial + Doanh số của Điểm bán */}
      {serialModalStore && (
        <div className="modal-overlay" onClick={() => setSerialModalStore(null)}>
          <div className="modal-content glass-card" style={{ maxWidth: '820px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <CheckCircle size={20} style={{ color: '#34d399' }} />
                  Chi tiết Serial &amp; Doanh số — {serialModalStore.name} ({periodLabel})
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Địa chỉ: {serialModalStore.address || '—'} | SĐT: {serialModalStore.phone || '—'}
                </p>
              </div>
              <button type="button" className="modal-close" onClick={() => setSerialModalStore(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '68vh', overflowY: 'auto', marginTop: '12px' }}>
              {loadingSerials ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Đang tải danh sách serial và doanh số...
                </div>
              ) : storeSerials.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Điểm bán này chưa có serial nào được gán trong kỳ ({periodLabel}).
                </div>
              ) : (
                <>
                  {/* Tổng hợp doanh số theo sản phẩm */}
                  <div
                    style={{
                      background: 'rgba(245, 158, 11, 0.08)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      marginBottom: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ color: '#fbbf24' }}>📊 Thống kê Doanh số ({periodLabel})</strong>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: '#fbbf24' }}>
                        Tổng: {storeSerials.length} SP = {formatCurrency(storeModalRevenue)}
                      </span>
                    </div>
                    {storeBreakdown.map((b, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '4px 0', borderTop: '1px dashed rgba(255,255,255,0.08)' }}>
                        <span>{b.productName}</span>
                        <span>
                          <strong>{b.quantity} SP</strong> × {formatCurrency(b.unitPrice)} = <strong style={{ color: '#34d399' }}>{formatCurrency(b.revenue)}</strong>
                        </span>
                      </div>
                    ))}
                  </div>

                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>STT</th>
                        <th>Mã Serial</th>
                        <th>Sản phẩm</th>
                        <th style={{ textAlign: 'right' }}>Giá 1 SP</th>
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
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#fbbf24' }}>
                            {formatCurrency(item.unitPrice)}
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
                </>
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

      {/* Yêu cầu 2: Modal Import Danh sách Điểm bán từ giải pháp cũ / Excel */}
      {showImportStoresModal && (
        <div className="modal-overlay" onClick={() => setShowImportStoresModal(false)}>
          <div className="modal-content glass-card" style={{ maxWidth: '560px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Upload size={20} style={{ color: '#60a5fa' }} />
                Import Danh sách Điểm bán (Excel)
              </h2>
              <button type="button" className="modal-close" onClick={() => setShowImportStoresModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleImportStoresSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <div style={{ fontWeight: 700, color: '#93c5fd', marginBottom: '6px' }}>
                    📋 Hỗ trợ đồng bộ danh sách Điểm bán từ giải pháp cũ sang giải pháp mới:
                  </div>
                  <div>• File Excel gồm các cột: <strong>Tên điểm bán</strong>, <strong>Địa chỉ</strong>, <strong>Số điện thoại</strong>.</div>
                  <div>• Nếu tên điểm bán đã tồn tại, hệ thống sẽ tự động cập nhật Địa chỉ và SĐT mới.</div>
                  <div style={{ marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplate('stores')}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#34d399', fontWeight: 700, textDecoration: 'underline', fontSize: '13px' }}
                    >
                      <Download size={14} /> Tải file Excel mẫu Danh sách Điểm bán (.xlsx)
                    </button>
                  </div>
                </div>

                {importStoresError && (
                  <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontSize: '13.5px' }}>
                    {importStoresError}
                  </div>
                )}

                {importStoresResult && (
                  <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', fontSize: '13.5px' }}>
                    <div style={{ fontWeight: 700 }}>{importStoresResult.message}</div>
                    <div style={{ marginTop: '4px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      Thêm mới: <strong>{importStoresResult.createdCount || 0}</strong> • Cập nhật: <strong>{importStoresResult.updatedCount || 0}</strong>
                      {importStoresResult.totalAssignedLabels > 0 && (
                        <> • Đã gán Serial: <strong style={{ color: '#34d399' }}>{importStoresResult.totalAssignedLabels}</strong></>
                      )}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Chọn file Excel danh sách Điểm bán (.xlsx, .xls, .csv) *</label>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="form-control"
                    onChange={(e) => setImportStoresFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowImportStoresModal(false)}>
                  Đóng
                </button>
                <button type="submit" className="btn btn-primary" disabled={importingStores}>
                  {importingStores ? 'Đang import...' : 'Thực hiện Import Điểm bán'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Yêu cầu 4: Modal Import Bảng Excel Phân phối Ma trận (Điểm bán × Sản phẩm × Dải Serial) */}
      {showImportMatrixModal && (
        <div className="modal-overlay" onClick={() => setShowImportMatrixModal(false)}>
          <div className="modal-content glass-card" style={{ maxWidth: '680px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <FileSpreadsheet size={20} style={{ color: '#34d399' }} />
                Import Bảng Excel Phân phối (Điểm bán × Sản phẩm × Serial)
              </h2>
              <button type="button" className="modal-close" onClick={() => setShowImportMatrixModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleImportMatrixSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <div style={{ fontWeight: 700, color: '#34d399', marginBottom: '6px' }}>
                    📊 Định dạng Bảng Excel Ma trận Phân phối (Theo mẫu Tổng Kho Vyphyto):
                  </div>
                  <div style={{ overflowX: 'auto', marginBottom: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', background: 'rgba(15,23,42,0.6)' }}>
                      <tbody>
                        <tr>
                          <td style={{ border: '1px solid #334155', padding: '5px 8px', fontWeight: 700, color: '#f8fafc' }}>Điểm bán ---------&gt;</td>
                          <td style={{ border: '1px solid #334155', padding: '5px 8px', fontWeight: 700, color: '#fbbf24' }}>Nhà A</td>
                          <td style={{ border: '1px solid #334155', padding: '5px 8px', fontWeight: 700, color: '#fbbf24' }}>Nhà B</td>
                          <td style={{ border: '1px solid #334155', padding: '5px 8px', fontWeight: 700, color: '#fbbf24' }}>Nhà C</td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #334155', padding: '5px 8px', fontWeight: 700, color: '#93c5fd' }}>Tên sản phẩm</td>
                          <td style={{ border: '1px solid #334155', padding: '5px 8px' }}></td>
                          <td style={{ border: '1px solid #334155', padding: '5px 8px' }}></td>
                          <td style={{ border: '1px solid #334155', padding: '5px 8px' }}></td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #334155', padding: '5px 8px', fontWeight: 600 }}>Sản phẩm 1</td>
                          <td style={{ border: '1px solid #334155', padding: '5px 8px', fontFamily: 'monospace', color: '#34d399' }}>00001-000010</td>
                          <td style={{ border: '1px solid #334155', padding: '5px 8px', fontFamily: 'monospace', color: '#34d399' }}>000011-000020</td>
                          <td style={{ border: '1px solid #334155', padding: '5px 8px' }}>...</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div>• Hệ thống tự động nhận diện Điểm bán (tạo mới nếu chưa có), khớp Sản phẩm và gán toàn bộ dải Serial trong ô.</div>
                  <div>• <strong>Lưu ý quan trọng:</strong> Ngày import được chọn bên dưới sẽ được ghi nhận là <strong>Ngày bán / gán sản phẩm</strong> để tính doanh số Điểm bán.</div>
                  <div style={{ marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplate('matrix')}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#34d399', fontWeight: 700, textDecoration: 'underline', fontSize: '13px' }}
                    >
                      <Download size={14} /> Tải file Excel mẫu Bảng Ma trận &amp; Chi tiết Phân phối (.xlsx)
                    </button>
                  </div>
                </div>

                {importMatrixError && (
                  <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontSize: '13.5px' }}>
                    {importMatrixError}
                  </div>
                )}

                {importMatrixResult && (
                  <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', fontSize: '13.5px' }}>
                    <div style={{ fontWeight: 700 }}>{importMatrixResult.message}</div>
                    {(importMatrixResult.createdCount > 0 || importMatrixResult.updatedCount > 0) && (
                      <div style={{ marginTop: '4px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                        Điểm bán thêm mới: <strong>{importMatrixResult.createdCount || 0}</strong> • Cập nhật: <strong>{importMatrixResult.updatedCount || 0}</strong>
                      </div>
                    )}
                    {Array.isArray(importMatrixResult.details) && importMatrixResult.details.length > 0 && (
                      <div style={{ maxHeight: '140px', overflowY: 'auto', marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {importMatrixResult.details.map((d, idx) => (
                          <div key={idx} style={{ padding: '3px 0', borderBottom: '1px dashed rgba(255,255,255,0.08)' }}>
                            🏪 <strong>{d.storeName}</strong> — {d.productName} ({d.range}): Đã gán <strong style={{ color: '#34d399' }}>{d.matchedLabels}</strong> serial
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <label>Ngày Import (Ngày bán / gán sản phẩm) *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={importMatrixDate}
                    onChange={(e) => setImportMatrixDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Chọn file Excel Bảng phân phối (.xlsx, .xls, .csv) *</label>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="form-control"
                    onChange={(e) => setImportMatrixFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowImportMatrixModal(false)}>
                  Đóng
                </button>
                <button type="submit" className="btn btn-primary" disabled={importingMatrix}>
                  {importingMatrix ? 'Đang xử lý & gán Serial...' : 'Import & Gán Serial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
