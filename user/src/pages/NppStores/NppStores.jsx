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
  FileSpreadsheet,
  Calendar
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

const formatTimeOnly = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

const toDateKeyYYYYMMDD = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatDateOnlyVN = (ymdStr) => {
  if (!ymdStr) return '';
  const parts = String(ymdStr).split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return ymdStr;
};

const getCurrentTimeHHMM = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export default function NppStores() {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [form, setForm] = useState({ customerCode: '', name: '', address: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [serialModalStore, setSerialModalStore] = useState(null);
  const [storeSerials, setStoreSerials] = useState([]);
  const [storeSerialStats, setStoreSerialStats] = useState(null);
  const [loadingSerials, setLoadingSerials] = useState(false);
  const [serialSearchInput, setSerialSearchInput] = useState('');
  const [serialSearchQuery, setSerialSearchQuery] = useState('');
  const [mkhSearchInput, setMkhSearchInput] = useState('');
  const [mkhSearchQuery, setMkhSearchQuery] = useState('');
  const [serialDateInput, setSerialDateInput] = useState(() => new Date().toISOString().slice(0, 10));
  const [serialDateFilter, setSerialDateFilter] = useState('');
  const [unassigningSerialKey, setUnassigningSerialKey] = useState('');

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
  const [enterpriseProducts, setEnterpriseProducts] = useState([]);
  const [enterpriseBatches, setEnterpriseBatches] = useState([]);

  // Modal Nhập Serial trực tiếp cho từng Điểm bán (Chọn SP + Nhập "1-10 , 15" + Chọn ngày PP)
  const [manualSerialStore, setManualSerialStore] = useState(null);
  const [manualProductId, setManualProductId] = useState('');
  const [manualCustomerCode, setManualCustomerCode] = useState('');
  const [manualSerialInput, setManualSerialInput] = useState('');
  const [manualDistributedDate, setManualDistributedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [manualDistributedTime, setManualDistributedTime] = useState(() => getCurrentTimeHHMM());
  const [submittingManualSerial, setSubmittingManualSerial] = useState(false);
  const [manualSerialError, setManualSerialError] = useState('');
  const [manualSerialResult, setManualSerialResult] = useState(null);

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
      if (Array.isArray(res.products)) {
        setEnterpriseProducts(res.products);
      }
      if (Array.isArray(res.batches)) {
        setEnterpriseBatches(res.batches);
      }
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
      const codeNorm = removeVietnameseTones(s.customerCode || '');
      const nameNorm = removeVietnameseTones(s.name || '');
      const addrNorm = removeVietnameseTones(s.address || '');
      const phoneNorm = removeVietnameseTones(s.phone || '');
      const hasMatchedSaleCode = Array.isArray(s.recentSales) && s.recentSales.some((rs) => removeVietnameseTones(rs.customerCode || '').includes(q));
      return codeNorm.includes(q) || nameNorm.includes(q) || addrNorm.includes(q) || phoneNorm.includes(q) || hasMatchedSaleCode;
    });
  }, [stores, search]);

  const handleOpenAdd = () => {
    setEditingStore(null);
    setForm({ customerCode: '', name: '', address: '', phone: '' });
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (store) => {
    setEditingStore(store);
    setForm({
      customerCode: store.customerCode || '',
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
          customerCode: (form.customerCode || '').trim(),
          name: form.name.trim(),
          address: form.address.trim(),
          phone: form.phone.trim()
        });
      } else {
        await userApi.createRetailStore({
          customerCode: (form.customerCode || '').trim(),
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
    setSerialSearchInput('');
    setSerialSearchQuery('');
    setMkhSearchInput('');
    setMkhSearchQuery('');
    setSerialDateFilter('');
    setSerialDateInput(new Date().toISOString().slice(0, 10));
    try {
      const res = await userApi.getRetailStoreSerials(store._id, {
        periodType: 'all'
      });
      const list = res.serials || res.data || [];
      setStoreSerials(list);
      setStoreSerialStats(res);
      if (list.length > 0 && list[0].soldAt) {
        const latestYmd = toDateKeyYYYYMMDD(list[0].soldAt);
        if (latestYmd) setSerialDateInput(latestYmd);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách serial của điểm bán:', err);
    } finally {
      setLoadingSerials(false);
    }
  };

  const handleUnassignSerial = async (item) => {
    if (!serialModalStore?._id || !item?.serialNumber) return;
    if (!window.confirm(`Bạn có chắc chắn muốn huỷ bán (huỷ gán) mã Serial "${item.serialNumber}" khỏi điểm bán "${serialModalStore.name}" không?`)) {
      return;
    }
    setUnassigningSerialKey(item.serialNumber);
    try {
      await userApi.unassignRetailStoreSerial(serialModalStore._id, {
        serialNumber: item.serialNumber,
        labelId: item._id
      });
      setStoreSerials((prev) => prev.filter((s) => s.serialNumber !== item.serialNumber));
      loadStores();
    } catch (err) {
      alert(err.message || 'Lỗi khi huỷ gán mã Serial khỏi điểm bán');
    } finally {
      setUnassigningSerialKey('');
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
      const nowTime = getCurrentTimeHHMM();
      const res = await userApi.importDistributionMatrix({
        fileBase64,
        importDate: importMatrixDate ? new Date(`${importMatrixDate}T${nowTime}:00`).toISOString() : new Date().toISOString(),
        importTime: nowTime
      });
      setImportMatrixResult(res);
      loadStores(search);
    } catch (err) {
      setImportMatrixError(err.message || 'Lỗi khi import bảng Excel phân phối');
    } finally {
      setImportingMatrix(false);
    }
  };

  const handleOpenManualSerialModal = (store) => {
    setManualSerialStore(store);
    setManualProductId('');
    setManualCustomerCode(store?.customerCode || '');
    setManualSerialInput('');
    setManualDistributedDate(new Date().toISOString().slice(0, 10));
    setManualDistributedTime(getCurrentTimeHHMM());
    setManualSerialError('');
    setManualSerialResult(null);
  };

  const productsForManualStore = useMemo(() => {
    if (!manualSerialStore?.enterpriseId) return enterpriseProducts;
    const storeEntId = String(manualSerialStore.enterpriseId?._id || manualSerialStore.enterpriseId);
    const matched = enterpriseProducts.filter(
      (p) => String(p.enterpriseId?._id || p.enterpriseId || '') === storeEntId
    );
    return matched.length > 0 ? matched : enterpriseProducts;
  }, [enterpriseProducts, manualSerialStore]);

  const batchesForSelectedManualProduct = useMemo(() => {
    if (!manualProductId) return [];
    return enterpriseBatches.filter(
      (b) => String(b.productId?._id || b.productId || '') === String(manualProductId)
    );
  }, [enterpriseBatches, manualProductId]);

  const filteredStoreSerials = useMemo(() => {
    let baseList = storeSerials.map((item, idx) => ({ ...item, _origIndex: idx + 1 }));
    if (serialDateFilter) {
      baseList = baseList.filter((item) => toDateKeyYYYYMMDD(item.soldAt) === serialDateFilter);
    }
    const mkhRaw = String(mkhSearchQuery || '').trim();
    if (mkhRaw) {
      const mkhNorm = removeVietnameseTones(mkhRaw);
      baseList = baseList.filter((item) => {
        const itemMkh = removeVietnameseTones(item.customerCode || serialModalStore?.customerCode || '');
        return itemMkh.includes(mkhNorm);
      });
    }
    const qRaw = String(serialSearchQuery || '').trim();
    if (!qRaw) return baseList;
    const qNorm = removeVietnameseTones(qRaw);
    const rangeMatch = qRaw.match(/^(\D*?)(\d+)\s*-\s*(\D*?)(\d+)$/);
    if (rangeMatch && rangeMatch[1].toLowerCase() === rangeMatch[3].toLowerCase()) {
      const pref = rangeMatch[1].toLowerCase();
      const n1 = parseInt(rangeMatch[2], 10);
      const n2 = parseInt(rangeMatch[4], 10);
      const minN = Math.min(n1, n2);
      const maxN = Math.max(n1, n2);
      return baseList.filter((item) => {
        const sm = String(item.serialNumber || '').trim().match(/^(\D*?)(\d+)$/);
        if (!sm || sm[1].toLowerCase() !== pref) return false;
        const val = parseInt(sm[2], 10);
        return val >= minN && val <= maxN;
      });
    }
    return baseList.filter((item) => {
      const serialNorm = removeVietnameseTones(item.serialNumber || '');
      const prodNorm = removeVietnameseTones(item.productName || '');
      const batchNorm = removeVietnameseTones(item.batchCode || '');
      const codeNorm = removeVietnameseTones(item.customerCode || serialModalStore?.customerCode || '');
      return serialNorm.includes(qNorm) || prodNorm.includes(qNorm) || batchNorm.includes(qNorm) || codeNorm.includes(qNorm);
    });
  }, [storeSerials, serialSearchQuery, mkhSearchQuery, serialDateFilter, serialModalStore]);

  const { displayedBreakdown, displayedRevenue } = useMemo(() => {
    const map = new Map();
    let rev = 0;
    for (const item of filteredStoreSerials) {
      const pName = item.productName || 'Sản phẩm';
      const uPrice = Number(item.unitPrice) || 0;
      const key = `${pName}|||${uPrice}`;
      if (!map.has(key)) {
        map.set(key, {
          productName: pName,
          unitPrice: uPrice,
          quantity: 0,
          revenue: 0
        });
      }
      const b = map.get(key);
      b.quantity += 1;
      b.revenue += uPrice;
      rev += uPrice;
    }
    return {
      displayedBreakdown: Array.from(map.values()),
      displayedRevenue: rev
    };
  }, [filteredStoreSerials]);

  const handleManualSerialSubmit = async (e) => {
    e.preventDefault();
    if (!manualSerialStore?._id) return;
    if (!manualProductId) {
      setManualSerialError('Vui lòng chọn sản phẩm muốn gán cho điểm bán!');
      return;
    }
    if (!manualSerialInput.trim()) {
      setManualSerialError('Vui lòng nhập serial gán cho điểm bán này (VD: 1-10 , 15)!');
      return;
    }
    if (!manualDistributedDate) {
      setManualSerialError('Vui lòng chọn ngày phân phối sản phẩm này!');
      return;
    }
    setSubmittingManualSerial(true);
    setManualSerialError('');
    setManualSerialResult(null);
    try {
      const timeToUse = manualDistributedTime || getCurrentTimeHHMM();
      const res = await userApi.assignRetailStoreSerials(manualSerialStore._id, {
        productId: manualProductId,
        serialInput: manualSerialInput.trim(),
        distributedDate: manualDistributedDate,
        distributedTime: timeToUse,
        customerCode: manualCustomerCode.trim()
      });
      setManualSerialResult(res);
      setManualSerialInput('');
      loadStores();
    } catch (err) {
      setManualSerialError(err.message || 'Có lỗi xảy ra khi gán Serial cho điểm bán');
    } finally {
      setSubmittingManualSerial(false);
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
                background: '#059669',
                border: '1px solid #10b981',
                color: '#ffffff',
                borderRadius: '10px',
                padding: '10px 14px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FileSpreadsheet size={17} />
              Nhập Serial cho Điểm bán (Excel)
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
            placeholder="Tìm theo mã khách hàng (VD: KH0001), tên điểm bán, địa chỉ, SĐT..."
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
                  : 'Bấm “Thêm Điểm bán” để thêm Mã khách hàng, Tên điểm bán, Địa chỉ và Điện thoại liên hệ.'}
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
                  <th style={{ padding: '12px 14px' }}>Mã KH</th>
                  <th style={{ padding: '12px 14px' }}>Tên Điểm bán</th>
                  <th style={{ padding: '12px 14px' }}>Địa chỉ</th>
                  <th style={{ padding: '12px 14px' }}>Điện thoại</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>SP đã PP</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Doanh Thu/Tháng</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>CHI TIẾT PP</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredStores.map((store, idx) => {
                  const qty = store.periodSerials ?? store.totalSerials ?? 0;
                  const rev = store.periodRevenue ?? store.totalRevenue ?? 0;
                  return (
                    <tr key={store._id} style={{ borderTop: '1px solid #334155' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#818cf8' }}>#{idx + 1}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#e2e8f0' }}>{store.customerCode || '—'}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 700 }}>{store.name}</td>
                      <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>{store.address || '—'}</td>
                      <td style={{ padding: '12px 14px', color: '#34d399' }}>{store.phone || '—'}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span
                          onClick={() => handleViewSerials(store)}
                          style={{
                            background: qty > 0 ? 'rgba(16,185,129,0.18)' : '#334155',
                            color: qty > 0 ? '#34d399' : '#94a3b8',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          {qty} SP
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 800, color: rev > 0 ? '#fbbf24' : '#64748b' }}>
                        {formatCurrency(rev)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'nowrap' }}>
                          <button
                            type="button"
                            onClick={() => handleViewSerials(store)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: '1px solid #6366f1',
                              background: 'rgba(99, 102, 241, 0.18)',
                              color: '#a5b4fc',
                              fontWeight: 800,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              textDecoration: 'underline',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            CHI TIẾT
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
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              border: '1px solid #10b981',
                              background: 'rgba(16, 185, 129, 0.18)',
                              color: '#34d399',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                            title="Nhập Excel phân phối cho điểm bán này"
                          >
                            <FileSpreadsheet size={13} />
                            Nhập Excel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenManualSerialModal(store)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              border: '1px solid #10b981',
                              background: 'rgba(16, 185, 129, 0.18)',
                              color: '#34d399',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                            title="Nhập Serial trực tiếp (dải serial / mã lẻ) cho điểm bán này"
                          >
                            <FileSpreadsheet size={13} />
                            Nhập Serial
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'nowrap' }}>
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
                <label style={{ display: 'block', fontSize: '0.84rem', marginBottom: '6px', color: '#cbd5e1' }}>Mã khách hàng (MKH)</label>
                <input
                  type="text"
                  value={form.customerCode || ''}
                  onChange={(e) => setForm({ ...form, customerCode: e.target.value })}
                  placeholder="VD: KH0001"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: '#fff', boxSizing: 'border-box' }}
                />
              </div>
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
          style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 1000 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px 22px', width: '100%', maxWidth: '820px', maxHeight: '86vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,0,0,0.35)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  Chi tiết Phân phối (Serial &amp; Doanh Thu)
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '14.5px', fontWeight: 700, color: '#0f172a' }}>
                  <CheckCircle size={17} color="#059669" />
                  <span>{serialModalStore.name}</span>
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                  {serialModalStore.customerCode ? <>Mã KH: <strong style={{ color: '#0f172a' }}>{serialModalStore.customerCode}</strong> | </> : null}
                  Địa chỉ: {serialModalStore.address || '—'} | SĐT: {serialModalStore.phone || '—'}
                </div>
              </div>
              <button type="button" onClick={() => setSerialModalStore(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loadingSerials ? (
                <div style={{ padding: '28px', textAlign: 'center', color: '#64748b' }}>Đang tải danh sách serial và doanh thu...</div>
              ) : storeSerials.length === 0 ? (
                <div style={{ padding: '28px', textAlign: 'center', color: '#64748b' }}>Điểm bán này chưa có serial nào được phân phối.</div>
              ) : (
                <>
                  {/* Thanh 1: Tìm kiếm Serial */}
                  <div
                    style={{
                      background: '#eff6ff',
                      border: '1.5px solid #bfdbfe',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: 800,
                        color: '#1e40af',
                        fontSize: '13.5px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Search size={15} style={{ color: '#2563eb' }} />
                      Tìm kiếm Serial:
                    </span>
                    <input
                      type="text"
                      value={serialSearchInput}
                      onChange={(e) => {
                        setSerialSearchInput(e.target.value);
                        setSerialSearchQuery(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          setSerialSearchQuery(serialSearchInput);
                        }
                      }}
                      placeholder="Nhập mã Serial cần tìm..."
                      style={{
                        flex: 1,
                        minWidth: '180px',
                        padding: '7px 12px',
                        borderRadius: '7px',
                        border: '1px solid #93c5fd',
                        background: '#ffffff',
                        color: '#0f172a',
                        fontSize: '13.5px',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setSerialSearchQuery(serialSearchInput)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '7px',
                        padding: '7px 14px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Search size={14} /> Tìm kiếm
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSerialSearchInput('');
                        setSerialSearchQuery('');
                        setMkhSearchInput('');
                        setMkhSearchQuery('');
                        setSerialDateFilter('');
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: '#ffffff',
                        color: '#475569',
                        border: '1px solid #cbd5e1',
                        borderRadius: '7px',
                        padding: '7px 12px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      ↺ Đặt lại
                    </button>
                  </div>

                  {/* Thanh 2: Tìm theo mã khách hàng + nút Tìm MKH */}
                  <div
                    style={{
                      background: '#eff6ff',
                      border: '1.5px solid #bfdbfe',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: 800,
                        color: '#1e40af',
                        fontSize: '13.5px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Search size={15} style={{ color: '#2563eb' }} />
                      Tìm theo mã khách hàng:
                    </span>
                    <input
                      type="text"
                      value={mkhSearchInput}
                      onChange={(e) => {
                        setMkhSearchInput(e.target.value);
                        setMkhSearchQuery(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          setMkhSearchQuery(mkhSearchInput);
                        }
                      }}
                      placeholder="Nhập mã khách hàng"
                      style={{
                        flex: 1,
                        minWidth: '180px',
                        padding: '7px 12px',
                        borderRadius: '7px',
                        border: '1px solid #93c5fd',
                        background: '#ffffff',
                        color: '#0f172a',
                        fontSize: '13.5px',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setMkhSearchQuery(mkhSearchInput)}
                      style={{
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '7px',
                        padding: '7px 18px',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Tìm MKH
                    </button>
                  </div>

                  {/* Thanh 3: Bộ lọc Ngày gán serial + nút XEM */}
                  <div
                    style={{
                      background: '#eff6ff',
                      border: '1.5px solid #bfdbfe',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: 800,
                        color: '#1e40af',
                        fontSize: '13.5px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Calendar size={15} style={{ color: '#2563eb' }} />
                      Ngày gán serial:
                    </span>
                    <input
                      type="date"
                      value={serialDateInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSerialDateInput(val);
                        setSerialDateFilter(val);
                      }}
                      style={{
                        minWidth: '175px',
                        padding: '6px 12px',
                        borderRadius: '7px',
                        border: '1px solid #93c5fd',
                        background: '#ffffff',
                        color: '#0f172a',
                        fontSize: '13.5px',
                        fontWeight: 600,
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setSerialDateFilter(serialDateInput)}
                      style={{
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '7px',
                        padding: '7px 20px',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        letterSpacing: '0.4px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      XEM
                    </button>
                    {serialDateFilter && (
                      <button
                        type="button"
                        onClick={() => setSerialDateFilter('')}
                        style={{
                          background: '#ffffff',
                          color: '#1e40af',
                          border: '1px solid #93c5fd',
                          borderRadius: '7px',
                          padding: '6px 12px',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Tất cả ngày ({storeSerials.length} serial)
                      </button>
                    )}
                  </div>

                  {/* Khung vàng: Thống kê ngày / Tổng doanh số theo ngày */}
                  <div
                    style={{
                      background: '#fffbeb',
                      border: '1.5px solid #fcd34d',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      marginBottom: '12px',
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: '16px',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ marginBottom: '6px' }}>
                        <strong style={{ color: '#b45309', fontSize: '15px' }}>
                          📊 {serialDateFilter ? `Thống kê ngày ${formatDateOnlyVN(serialDateFilter)}` : `Thống kê Doanh Thu (${periodLabel})`}
                        </strong>
                      </div>
                      {displayedBreakdown.length === 0 ? (
                        <div style={{ fontSize: '13.5px', color: '#92400e', paddingTop: '4px', borderTop: '1px dashed #fde68a' }}>
                          Chưa có sản phẩm trong bộ lọc này
                        </div>
                      ) : (
                        displayedBreakdown.map((b, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', padding: '6px 0 2px', borderTop: '1px dashed #fde68a', color: '#0f172a', gap: '12px' }}>
                            <span style={{ fontWeight: 800 }}>{b.productName}</span>
                            <span style={{ whiteSpace: 'nowrap' }}>
                              <strong>{b.quantity} SP</strong> × {formatCurrency(b.unitPrice)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                    <div
                      style={{
                        borderLeft: '1.5px solid #fcd34d',
                        paddingLeft: '20px',
                        textAlign: 'center',
                        minWidth: '185px'
                      }}
                    >
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#b45309', marginBottom: '4px' }}>
                        {serialDateFilter ? 'Tổng doanh số theo ngày' : 'Tổng doanh số'}
                      </div>
                      <div style={{ fontSize: '21px', fontWeight: 900, color: '#0f172a', letterSpacing: '0.2px' }}>
                        {formatCurrency(displayedRevenue)}
                      </div>
                    </div>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ background: '#eff6ff', color: '#1e3a8a', textAlign: 'left', borderBottom: '1.5px solid #bfdbfe' }}>
                        <th style={{ padding: '10px 12px', fontWeight: 800 }}>STT</th>
                        <th style={{ padding: '10px 12px', fontWeight: 800 }}>Serial</th>
                        <th style={{ padding: '10px 12px', fontWeight: 800 }}>MKH</th>
                        <th style={{ padding: '10px 12px', fontWeight: 800 }}>Sản phẩm</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800 }}>Đơn giá</th>
                        <th style={{ padding: '10px 12px', fontWeight: 800 }}>Giờ gán</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800 }}>Huỷ bán</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStoreSerials.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                            {serialDateFilter
                              ? `Không có mã Serial nào được gán trong ngày ${formatDateOnlyVN(serialDateFilter)}${serialSearchQuery ? ` khớp với "${serialSearchQuery}"` : ''}${mkhSearchQuery ? ` (MKH: "${mkhSearchQuery}")` : ''}.`
                              : `Không tìm thấy mã Serial nào khớp với bộ lọc hiện tại.`}
                          </td>
                        </tr>
                      ) : (
                        filteredStoreSerials.map((item, i) => (
                          <tr key={item.serialNumber + '_' + i} style={{ borderTop: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>{i + 1}</td>
                            <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 800, color: '#059669', fontSize: '14px' }}>{item.serialNumber}</td>
                            <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>
                              {item.customerCode || serialModalStore?.customerCode || '—'}
                            </td>
                            <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <Package size={14} color="#4f46e5" />
                                {item.productName || 'Sản phẩm'}
                              </span>
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#d97706' }}>{formatCurrency(item.unitPrice)}</td>
                            <td style={{ padding: '10px 12px', color: '#334155', fontWeight: 600 }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                <Clock size={14} color="#64748b" />
                                {serialDateFilter
                                  ? formatTimeOnly(item.soldAt)
                                  : `${formatTimeOnly(item.soldAt)} - ${formatDateOnlyVN(toDateKeyYYYYMMDD(item.soldAt))}`}
                              </span>
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleUnassignSerial(item)}
                                disabled={unassigningSerialKey === item.serialNumber}
                                title={`Huỷ bán / Xoá gán mã Serial ${item.serialNumber} khỏi điểm bán`}
                                style={{
                                  width: '28px',
                                  height: '26px',
                                  borderRadius: '6px',
                                  border: '1.5px solid #ef4444',
                                  background: '#ffffff',
                                  color: '#dc2626',
                                  fontWeight: 800,
                                  fontSize: '13px',
                                  cursor: unassigningSerialKey === item.serialNumber ? 'wait' : 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: 0
                                }}
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </>
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
                <div>• File Excel gồm các cột: <strong>Mã khách hàng</strong>, <strong>Tên điểm bán</strong>, <strong>Địa chỉ</strong>, <strong>Số điện thoại</strong>.</div>
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
                <div style={{ background: 'rgba(16,185,129,0.18)', color: '#34d399', padding: '10px 12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 700 }}>{importStoresResult.message}</div>
                  <div style={{ marginTop: '4px', fontSize: '0.78rem', color: '#cbd5e1' }}>
                    Thêm mới: <strong>{importStoresResult.createdCount || 0}</strong> • Cập nhật: <strong>{importStoresResult.updatedCount || 0}</strong>
                    {importStoresResult.totalAssignedLabels > 0 && (
                      <> • Đã gán Serial: <strong style={{ color: '#34d399' }}>{importStoresResult.totalAssignedLabels}</strong></>
                    )}
                  </div>
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
                <div style={{ background: 'rgba(16,185,129,0.18)', color: '#34d399', padding: '10px 12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 700 }}>{importMatrixResult.message}</div>
                  {(importMatrixResult.createdCount > 0 || importMatrixResult.updatedCount > 0) && (
                    <div style={{ marginTop: '4px', fontSize: '0.78rem', color: '#cbd5e1' }}>
                      Điểm bán thêm mới: <strong>{importMatrixResult.createdCount || 0}</strong> • Cập nhật: <strong>{importMatrixResult.updatedCount || 0}</strong>
                    </div>
                  )}
                  {Array.isArray(importMatrixResult.details) && importMatrixResult.details.length > 0 && (
                    <div style={{ maxHeight: '130px', overflowY: 'auto', marginTop: '6px', fontSize: '0.78rem', color: '#cbd5e1' }}>
                      {importMatrixResult.details.map((d, idx) => (
                        <div key={idx} style={{ padding: '2px 0', borderBottom: '1px dashed rgba(255,255,255,0.08)' }}>
                          🏪 <strong>{d.storeName}</strong> — {d.productName} ({d.range}): Đã gán <strong style={{ color: '#34d399' }}>{d.matchedLabels}</strong> serial
                        </div>
                      ))}
                    </div>
                  )}
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

      {/* Modal Nhập Serial trực tiếp cho Điểm bán (Chọn sản phẩm + Nhập "1-10 , 15" + Chọn ngày phân phối) */}
      {manualSerialStore && (
        <div
          onClick={() => setManualSerialStore(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.72)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 1100
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              color: '#0f172a',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 20px 50px rgba(15, 23, 42, 0.35)',
              width: '100%',
              maxWidth: '720px'
            }}
          >
            <div
              style={{
                borderBottom: '1px solid #f1f5f9',
                padding: '16px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                  Nhập Serial gán cho điểm bán: <span style={{ color: '#1d4ed8' }}>{manualSerialStore.name}</span>
                </h3>
                {manualSerialStore.address && (
                  <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
                    Địa chỉ: {manualSerialStore.address}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setManualSerialStore(null)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleManualSerialSubmit}>
              <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                    Vui lòng chọn sản phẩm muốn gán cho điểm bán
                  </label>
                  <select
                    value={manualProductId}
                    onChange={(e) => setManualProductId(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Chọn sản phẩm</option>
                    {productsForManualStore.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {manualProductId && batchesForSelectedManualProduct.length > 0 && (
                    <div
                      style={{
                        marginTop: '8px',
                        padding: '8px 12px',
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '6px',
                        fontSize: '12.5px',
                        color: '#1e40af'
                      }}
                    >
                      <strong>📦 Lô tem thuộc sản phẩm này:</strong>{' '}
                      {batchesForSelectedManualProduct
                        .map((b) => `${b.batchCode} (${b.serialStart || '?'} - ${b.serialEnd || '?'})`)
                        .join(' • ')}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                    Mã khách hàng (MKH)
                  </label>
                  <input
                    type="text"
                    value={manualCustomerCode}
                    onChange={(e) => setManualCustomerCode(e.target.value)}
                    placeholder="VD: KH0001 (có thể nhập tay hoặc để mặc định theo điểm bán)"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                    Serial gán cho điểm bán này
                  </label>
                  <textarea
                    rows={3}
                    value={manualSerialInput}
                    onChange={(e) => setManualSerialInput(e.target.value)}
                    placeholder="Vui lòng nhập serial bé - serial lớn, trong đó DẤU TRỪ '-' là số lượng serial gán cho, dấu ',' là mã lẻ cách nhau bởi DẤU PHẨY"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontSize: '14px',
                      resize: 'vertical',
                      outline: 'none',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                      Vui lòng chọn ngày phân phối sản phẩm này
                    </label>
                    <input
                      type="date"
                      value={manualDistributedDate}
                      onChange={(e) => setManualDistributedDate(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#0f172a',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                      Giờ gán sản phẩm
                    </label>
                    <input
                      type="time"
                      value={manualDistributedTime}
                      onChange={(e) => setManualDistributedTime(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#0f172a',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {manualSerialError && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#dc2626',
                      fontSize: '13.5px',
                      fontWeight: 600
                    }}
                  >
                    ⚠️ {manualSerialError}
                  </div>
                )}

                {manualSerialResult && (
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      background: '#ecfdf5',
                      border: '1px solid #6ee7b7',
                      color: '#065f46',
                      fontSize: '13.5px',
                      fontWeight: 700
                    }}
                  >
                    ✅ {manualSerialResult.message}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
                  <button
                    type="submit"
                    disabled={submittingManualSerial}
                    style={{
                      background: '#1d4ed8',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '10px 48px',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: submittingManualSerial ? 'not-allowed' : 'pointer',
                      opacity: submittingManualSerial ? 0.75 : 1,
                      letterSpacing: '0.3px'
                    }}
                  >
                    {submittingManualSerial ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

