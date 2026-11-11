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
  const [serialSearchInput, setSerialSearchInput] = useState('');
  const [serialSearchQuery, setSerialSearchQuery] = useState('');
  const [serialDateInput, setSerialDateInput] = useState(() => new Date().toISOString().slice(0, 10));
  const [serialDateFilter, setSerialDateFilter] = useState('');
  const [unassigningSerialKey, setUnassigningSerialKey] = useState('');

  // Yêu cầu 2: Modal Import Danh sách Điểm bán từ giải pháp cũ / Excel
  const [showImportStoresModal, setShowImportStoresModal] = useState(false);
  const [importStoresFile, setImportStoresFile] = useState(null);
  const [importingStores, setImportingStores] = useState(false);
  const [importStoresResult, setImportStoresResult] = useState(null);
  const [importStoresError, setImportStoresError] = useState('');

  // Yêu cầu 4: Nhập Serial cho Điểm bán bằng Bảng Excel (Mục 4 trong YEU CAU TRAO DOI.docx)
  const [showImportMatrixModal, setShowImportMatrixModal] = useState(false);
  const [showInlineMatrixPanel, setShowInlineMatrixPanel] = useState(true);
  const [importMatrixStoreId, setImportMatrixStoreId] = useState('');
  const [importMatrixFile, setImportMatrixFile] = useState(null);
  const [importMatrixDate, setImportMatrixDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [importingMatrix, setImportingMatrix] = useState(false);
  const [importMatrixResult, setImportMatrixResult] = useState(null);
  const [importMatrixError, setImportMatrixError] = useState('');
  const [exportingExcel, setExportingExcel] = useState(false);
  const [enterpriseProducts, setEnterpriseProducts] = useState([]);
  const [enterpriseBatches, setEnterpriseBatches] = useState([]);

  // Modal Nhập Serial trực tiếp cho từng Điểm bán (Chọn SP + Nhập dải/lẻ "1-10 , 15" + Chọn ngày PP)
  const [manualSerialStore, setManualSerialStore] = useState(null);
  const [manualProductId, setManualProductId] = useState('');
  const [manualSerialInput, setManualSerialInput] = useState('');
  const [manualDistributedDate, setManualDistributedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [manualDistributedTime, setManualDistributedTime] = useState(() => getCurrentTimeHHMM());
  const [submittingManualSerial, setSubmittingManualSerial] = useState(false);
  const [manualSerialError, setManualSerialError] = useState('');
  const [manualSerialResult, setManualSerialResult] = useState(null);

  useEffect(() => {
    api.getProducts({ page: 1, limit: 200 }).then((res) => {
      const list = res?.products || res?.data || [];
      if (Array.isArray(list) && list.length > 0) setEnterpriseProducts(list);
    }).catch(() => {});
  }, []);

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
      if (Array.isArray(res.products) && res.products.length > 0) {
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
    setSerialSearchInput('');
    setSerialSearchQuery('');
    setSerialDateFilter('');
    setSerialDateInput(new Date().toISOString().slice(0, 10));
    try {
      const res = await api.getRetailStoreSerials(store._id, {
        periodType: 'all'
      });
      const list = res.serials || res.data || [];
      setStoreSerials(list);
      setStoreBreakdown(res.productBreakdown || []);
      setStoreModalRevenue(res.totalRevenue || 0);
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
      await api.unassignRetailStoreSerial(serialModalStore._id, {
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

      if (type === 'matrix_prefilled' && stores.length > 0) {
        const storeHeaders = stores.slice(0, 20).map((s) => s.name);
        const prodNames = enterpriseProducts.length > 0
          ? enterpriseProducts.map((p) => p.name)
          : ['Sản phẩm 1', 'Sản phẩm 2', 'Sản phẩm 3'];
        const wsPrefilledData = [
          ['Điểm bán --------->', ...storeHeaders],
          ['Tên sản phẩm', ...storeHeaders.map(() => '')],
          ...prodNames.map((pName, idx) => [
            pName,
            ...storeHeaders.map((_, sIdx) => (idx === 0 && sIdx === 0 ? '00001-000010' : ''))
          ])
        ];
        const wsPrefilled = XLSX.utils.aoa_to_sheet(wsPrefilledData);
        wsPrefilled['!cols'] = [{ wch: 28 }, ...storeHeaders.map(() => ({ wch: 24 }))];
        XLSX.utils.book_append_sheet(wb, wsPrefilled, 'Nhap_Serial_Diem_Ban');
        XLSX.writeFile(wb, 'Mau_Nhap_Serial_Diem_Ban_Hien_Tai.xlsx');
        return;
      }

      // Chuẩn Mục 4 trong YEU CAU TRAO DOI.docx (1 Sheet duy nhất đúng cấu trúc khách gửi)
      const wsMatrixData = [
        ['Điểm bán --------->', 'Nhà A', 'Nhà B', 'Nhà C'],
        ['Tên sản phẩm', '', '', ''],
        ['Sản phẩm 1', '00001-000010', '', ''],
        ['Sản phẩm 2', '00101-001910', '', ''],
        ['Sản phẩm 3', '', '', '']
      ];
      const wsMatrix = XLSX.utils.aoa_to_sheet(wsMatrixData);
      wsMatrix['!cols'] = [{ wch: 28 }, { wch: 22 }, { wch: 22 }, { wch: 22 }];
      XLSX.utils.book_append_sheet(wb, wsMatrix, 'Nhap_Serial_Diem_Ban');

      XLSX.writeFile(wb, 'Mau_Nhap_Serial_Cho_Diem_Ban_Muc4.xlsx');
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
      setImportMatrixError('Vui lòng chọn file Excel nhập Serial cho điểm bán (.xlsx, .xls, .csv).');
      return;
    }
    setImportingMatrix(true);
    setImportMatrixError('');
    setImportMatrixResult(null);
    try {
      const fileBase64 = await readFileAsBase64(importMatrixFile);
      const parsedRows = fileBase64 ? undefined : await parseExcelFileToRows(importMatrixFile);
      const nowTime = getCurrentTimeHHMM();
      const importDateIso = importMatrixDate
        ? new Date(`${importMatrixDate}T${nowTime}:00`).toISOString()
        : new Date().toISOString();
      const res = await api.importDistributionMatrix({
        fileBase64,
        ...(parsedRows ? { rows: parsedRows } : {}),
        importDate: importDateIso,
        importTime: nowTime,
        ...(importMatrixStoreId ? { storeId: importMatrixStoreId } : {})
      });
      setImportMatrixResult(res);
      loadStores(search);
    } catch (err) {
      setImportMatrixError(err.message || 'Lỗi khi import bảng Excel nhập Serial cho điểm bán');
    } finally {
      setImportingMatrix(false);
    }
  };

  const handleOpenImportSerialForStore = (store = null) => {
    setImportMatrixFile(null);
    setImportMatrixResult(null);
    setImportMatrixError('');
    setImportMatrixDate(new Date().toISOString().slice(0, 10));
    setImportMatrixStoreId(store?._id || '');
    setShowImportMatrixModal(true);
  };

  const handleOpenManualSerialModal = (store) => {
    setManualSerialStore(store);
    setManualProductId('');
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
      return serialNorm.includes(qNorm) || prodNorm.includes(qNorm) || batchNorm.includes(qNorm);
    });
  }, [storeSerials, serialSearchQuery, serialDateFilter]);

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
      const res = await api.assignRetailStoreSerials(manualSerialStore._id, {
        productId: manualProductId,
        serialInput: manualSerialInput.trim(),
        distributedDate: manualDistributedDate,
        distributedTime: timeToUse
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
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Store size={28} style={{ color: '#4f46e5' }} />
            Quản lý Điểm bán &amp; Thống kê Doanh số
          </h1>
          <p className="page-subtitle">
            Quản lý danh sách Điểm bán, Nhập Serial cho Điểm bán bằng Excel (Mục 4) và thống kê Doanh Thu/Tháng
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn"
            onClick={() => handleOpenImportSerialForStore(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#059669',
              color: '#ffffff',
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)'
            }}
          >
            <FileSpreadsheet size={18} />
            Nhập Serial cho Điểm bán (Excel)
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setImportStoresFile(null);
              setImportStoresResult(null);
              setImportStoresError('');
              setShowImportStoresModal(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#eff6ff',
              border: '1.5px solid #2563eb',
              color: '#1d4ed8',
              fontWeight: 700
            }}
          >
            <Upload size={17} />
            Import DS Điểm bán (Excel)
          </button>
          <button
            type="button"
            className="btn"
            onClick={handleExportExcel}
            disabled={exportingExcel}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#fffbeb',
              border: '1.5px solid #d97706',
              color: '#b45309',
              fontWeight: 700
            }}
            title="Xuất toàn bộ Danh sách Điểm bán + Bảng Ma trận + Chi tiết Serial ra file Excel"
          >
            <Download size={17} />
            {exportingExcel ? 'Đang xuất Excel...' : 'Xuất Excel Điểm bán & PP'}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate('/npp/scan')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
          >
            <QrCode size={18} />
            Quét tem cho Điểm bán
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenAdd}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}
          >
            <Plus size={18} />
            Thêm Điểm bán
          </button>
        </div>
      </div>

      {/* MỤC 4: KHUNG NHẬP SERIAL CHO ĐIỂM BÁN BẰNG FILE EXCEL (HIỂN THỊ TRỰC TIẾP) */}
      <div
        className="card"
        style={{
          padding: '18px 20px',
          marginBottom: '18px',
          background: '#f0fdf4',
          border: '1.5px solid #86efac',
          borderLeft: '5px solid #059669'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#059669', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#065f46' }}>
                📥 Mục Nhập Serial cho Điểm bán bằng File Excel (Mục 4)
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#047857' }}>
                Import bảng Excel gán dải Serial cho các Điểm bán theo mẫu: <strong>Điểm bán ---------&gt; | Nhà A | Nhà B | Nhà C</strong> và <strong>Tên sản phẩm</strong> (Ngày import sẽ được tính là ngày bán / gán sản phẩm).
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleDownloadTemplate('matrix')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1.5px solid #059669',
                background: '#ffffff',
                color: '#059669',
                fontWeight: 700,
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <Download size={15} />
              Tải File Excel Mẫu (Mục 4)
            </button>
            {stores.length > 0 && (
              <button
                type="button"
                onClick={() => handleDownloadTemplate('matrix_prefilled')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid #2563eb',
                  background: '#ffffff',
                  color: '#1d4ed8',
                  fontWeight: 700,
                  fontSize: '13px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Download size={15} />
                Tải Mẫu Có Sẵn Điểm Bán Hiện Tại
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowInlineMatrixPanel((prev) => !prev)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {showInlineMatrixPanel ? 'Thu gọn ▲' : 'Mở khung nhập ▼'}
            </button>
          </div>
        </div>

        {showInlineMatrixPanel && (
          <form onSubmit={handleImportMatrixSubmit} style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #86efac' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', alignItems: 'start' }}>
              {/* Cột trái: Bảng minh họa cấu trúc các trường theo đúng file Word Mục 4 */}
              <div style={{ background: '#ffffff', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 14px' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#065f46', marginBottom: '8px' }}>
                  📋 Cấu trúc các trường trong file Excel (Đúng theo Mục 4 file Word):
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', background: '#ffffff' }}>
                    <tbody>
                      <tr style={{ background: '#ecfdf5' }}>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', fontWeight: 800, color: '#0f172a' }}>Điểm bán ---------&gt;</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', fontWeight: 800, color: '#b45309' }}>Nhà A</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', fontWeight: 800, color: '#b45309' }}>Nhà B</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', fontWeight: 800, color: '#b45309' }}>Nhà C</td>
                      </tr>
                      <tr style={{ background: '#f8fafc' }}>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', fontWeight: 800, color: '#1d4ed8' }}>Tên sản phẩm</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px' }}></td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px' }}></td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px' }}></td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', fontWeight: 600, color: '#0f172a' }}>Sản phẩm 1</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', fontFamily: 'monospace', fontWeight: 700, color: '#059669' }}>00001-000010</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px' }}></td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px' }}></td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', fontWeight: 600, color: '#0f172a' }}>Sản phẩm 2</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', fontFamily: 'monospace', fontWeight: 700, color: '#059669' }}>00101-001910</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px' }}></td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px' }}></td>
                      </tr>
                      <tr>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', fontWeight: 600, color: '#0f172a' }}>Sản phẩm 3</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px' }}></td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px' }}></td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px' }}></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cột phải: Các trường chọn Ngày import + Chọn file Excel + Nút Import */}
              <div style={{ background: '#ffffff', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                      1. Ngày Import (Ngày bán / gán SP) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="date"
                      className="input"
                      value={importMatrixDate}
                      onChange={(e) => setImportMatrixDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                      2. Áp dụng cho Điểm bán
                    </label>
                    <select
                      className="input select"
                      value={importMatrixStoreId}
                      onChange={(e) => setImportMatrixStoreId(e.target.value)}
                    >
                      <option value="">Tự động theo cột Điểm bán trong Excel (Nhà A, Nhà B...)</option>
                      {stores.map((st) => (
                        <option key={st._id} value={st._id}>
                          Chỉ gán riêng cho: {st.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                    3. Chọn file Excel Nhập Serial cho Điểm bán (.xlsx, .xls, .csv) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="input"
                      style={{ flex: 1, minWidth: '220px', padding: '8px 12px' }}
                      onChange={(e) => setImportMatrixFile(e.target.files?.[0] || null)}
                    />
                    <button
                      type="submit"
                      className="btn"
                      disabled={importingMatrix}
                      style={{
                        background: '#059669',
                        color: '#ffffff',
                        fontWeight: 800,
                        padding: '11px 20px',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      <Upload size={17} />
                      {importingMatrix ? 'Đang xử lý & Gán Serial...' : 'Import & Gán Serial Ngay'}
                    </button>
                  </div>
                </div>

                {importMatrixError && (
                  <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '13px', fontWeight: 600 }}>
                    ⚠️ {importMatrixError}
                  </div>
                )}

                {importMatrixResult && (
                  <div style={{ padding: '12px 14px', borderRadius: '8px', background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#065f46', fontSize: '13px' }}>
                    <div style={{ fontWeight: 800 }}>✅ {importMatrixResult.message}</div>
                    {Array.isArray(importMatrixResult.details) && importMatrixResult.details.length > 0 && (
                      <div style={{ maxHeight: '120px', overflowY: 'auto', marginTop: '8px', fontSize: '12.5px', color: '#047857' }}>
                        {importMatrixResult.details.map((d, idx) => (
                          <div key={idx} style={{ padding: '3px 0', borderBottom: '1px dashed #a7f3d0' }}>
                            🏪 <strong>{d.storeName}</strong> — {d.productName} ({d.range}): Đã gán <strong>{d.matchedLabels}</strong> serial {d.note ? `(${d.note})` : ''}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Bộ lọc Thống kê Doanh số theo Tháng / Quý / Năm */}
      <div
        className="card"
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
          <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={17} style={{ color: '#d97706' }} />
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
                fontWeight: 700,
                cursor: 'pointer',
                border: periodType === tab.id ? '1.5px solid #d97706' : '1px solid #cbd5e1',
                background: periodType === tab.id ? '#fffbeb' : '#f8fafc',
                color: periodType === tab.id ? '#b45309' : '#475569'
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
                className="input select"
                style={{ width: 'auto', minWidth: '120px', padding: '6px 32px 6px 12px' }}
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
                className="input select"
                style={{ width: 'auto', minWidth: '160px', padding: '6px 32px 6px 12px' }}
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
              className="input select"
              style={{ width: 'auto', minWidth: '115px', padding: '6px 32px 6px 12px' }}
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
        <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Store size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Tổng số Điểm bán</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)' }}>{stores.length}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Tag size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>SP đã PP ({periodLabel})</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#059669' }}>{totalPeriodSerials} SP</div>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', border: '1.5px solid #fcd34d' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Doanh Thu/Tháng ({periodLabel})</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#d97706' }}>{formatCurrency(totalPeriodRevenue)}</div>
          </div>
        </div>
      </div>

      {/* Thanh tìm kiếm hỗ trợ gõ không dấu */}
      <div className="card" style={{ marginBottom: '20px', padding: '14px 18px' }}>
        <div className="search-box" style={{ flex: 1, maxWidth: '520px' }}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="input"
            placeholder="Tìm điểm bán (gõ 1 từ không dấu, VD: 'thanh' sẽ ra Thành, Thánh, Thạnh...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearch('')}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Bảng quản lý Điểm bán & Doanh số */}
      <div className="table-container card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-overlay">
            <div className="loading-spinner" />
            <span style={{ marginLeft: '10px', color: 'var(--color-text-secondary)' }}>Đang tải danh sách điểm bán...</span>
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="empty-state" style={{ padding: '48px 20px', textAlign: 'center' }}>
            <Store size={48} style={{ opacity: 0.35, marginBottom: '12px' }} />
            <h3>{search ? 'Không tìm thấy Điểm bán phù hợp' : 'Chưa có Điểm bán nào'}</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '18px' }}>
              {search
                ? `Không có điểm bán nào khớp với từ khóa "${search}".`
                : 'Hãy bấm “Thêm Điểm bán” hoặc “Import DS Điểm bán (Excel)” để tạo danh sách điểm bán.'}
            </p>
            {!search && (
              <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
                <Plus size={18} /> Thêm Điểm bán đầu tiên
              </button>
            )}
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '54px' }}>STT</th>
                <th>Tên Điểm bán</th>
                <th>Địa chỉ</th>
                <th>Điện thoại</th>
                <th style={{ textAlign: 'center' }}>SP đã PP</th>
                <th style={{ textAlign: 'center' }}>Doanh Thu/Tháng</th>
                <th style={{ textAlign: 'center' }}>CHI TIẾT PP</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredStores.map((store, idx) => {
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
                      <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Store size={16} style={{ color: '#4f46e5', flexShrink: 0 }} />
                        {store.name}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: 'var(--color-text-secondary)', fontSize: '13.5px' }}>
                        <MapPin size={14} style={{ marginTop: '3px', flexShrink: 0, color: '#64748b' }} />
                        <span>{store.address || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-secondary)', fontSize: '13.5px' }}>
                        <Phone size={14} style={{ flexShrink: 0, color: '#059669' }} />
                        <span>{store.phone || '—'}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        className={`badge ${qty > 0 ? 'badge-success' : 'badge-neutral'}`}
                        style={{ fontSize: '13px', padding: '4px 10px', cursor: 'pointer' }}
                        onClick={() => handleViewSerials(store)}
                      >
                        {qty} SP
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 800, color: '#d97706', fontSize: '14.5px' }}>
                        {formatCurrency(rev)}
                      </div>
                      {breakdown.length > 0 && (
                        <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                          {breakdown.map((b, bIdx) => (
                            <div key={bIdx}>
                              {b.quantity} × {formatCurrency(b.unitPrice)}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'nowrap' }}>
                        <button
                          type="button"
                          onClick={() => handleViewSerials(store)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: '1.5px solid #4f46e5',
                            background: '#eef2ff',
                            color: '#4f46e5',
                            fontWeight: 800,
                            fontSize: '12.5px',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            whiteSpace: 'nowrap'
                          }}
                          title="Xem chi tiết phân phối (Serial & Doanh thu)"
                        >
                          CHI TIẾT
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenImportSerialForStore(store)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: '1.5px solid #059669',
                            background: '#ecfdf5',
                            color: '#059669',
                            fontWeight: 700,
                            fontSize: '12px',
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
                            border: '1.5px solid #059669',
                            background: '#ecfdf5',
                            color: '#059669',
                            fontWeight: 700,
                            fontSize: '12px',
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
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div className="action-buttons" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', flexWrap: 'nowrap' }}>
                        <button
                          type="button"
                          className="btn-icon"
                          title="Quét tem xuất cho điểm bán này"
                          onClick={() => handleScanForStore(store)}
                          style={{ color: '#059669', background: '#ecfdf5' }}
                        >
                          <QrCode size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          title="Xem Chi tiết PP & Doanh Thu"
                          onClick={() => handleViewSerials(store)}
                          style={{ color: '#2563eb', background: '#eff6ff' }}
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
                          className="btn-icon"
                          title="Xóa điểm bán"
                          onClick={() => handleDelete(store)}
                          style={{ color: '#dc2626' }}
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
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Store size={20} style={{ color: '#4f46e5' }} />
                {editingStore ? 'Cập nhật Điểm bán' : 'Thêm Điểm bán mới'}
              </h2>
              <button type="button" className="btn-icon" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {error && (
                  <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '13.5px', fontWeight: 600 }}>
                    {error}
                  </div>
                )}

                <div className="input-group">
                  <label>Tên điểm bán <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    className="input"
                    placeholder="VD: Nhà thuốc Thành Công / Điểm bán Thành Đạt..."
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

                <div className="input-group">
                  <label>Địa chỉ Điểm bán (Dùng để đối chiếu cảnh báo vị trí quét)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="VD: Số 120 Nguyễn Trãi, Thanh Xuân, Hà Nội"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label>Điện thoại liên hệ</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="VD: 0912345678"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
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
          <div className="modal" style={{ maxWidth: '840px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title" style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  Chi tiết Phân phối (Serial &amp; Doanh Thu)
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '14.5px', fontWeight: 700, color: '#0f172a' }}>
                  <CheckCircle size={17} style={{ color: '#059669', flexShrink: 0 }} />
                  <span>{serialModalStore.name}</span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  Địa chỉ: {serialModalStore.address || '—'} | SĐT: {serialModalStore.phone || '—'}
                </p>
              </div>
              <button type="button" className="btn-icon" onClick={() => setSerialModalStore(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              {loadingSerials ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  Đang tải danh sách serial và doanh thu...
                </div>
              ) : storeSerials.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  Điểm bán này chưa có serial nào được phân phối.
                </div>
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

                  {/* Thanh 2: Bộ lọc Ngày gán serial + nút XEM */}
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
                      onChange={(e) => setSerialDateInput(e.target.value)}
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

                  {/* Khung vàng: Thống kê ngày / Doanh thu */}
                  <div
                    style={{
                      background: '#fffbeb',
                      border: '1.5px solid #fcd34d',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      marginBottom: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                      <strong style={{ color: '#b45309', fontSize: '14.5px' }}>
                        📊 {serialDateFilter ? `Thống kê ngày ${formatDateOnlyVN(serialDateFilter)}` : `Thống kê Doanh Thu (${periodLabel})`}
                      </strong>
                      <span style={{ fontSize: '15.5px', fontWeight: 800, color: '#d97706' }}>
                        {filteredStoreSerials.length} serial • {formatCurrency(displayedRevenue)}
                      </span>
                    </div>
                    {displayedBreakdown.map((b, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', padding: '6px 0', borderTop: '1px dashed #fde68a', color: '#0f172a' }}>
                        <span style={{ fontWeight: 800 }}>{b.productName}</span>
                        <span>
                          <strong>{b.quantity} SP</strong> × {formatCurrency(b.unitPrice)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>STT</th>
                          <th>Serial</th>
                          <th>Sản phẩm</th>
                          <th style={{ textAlign: 'right' }}>Đơn giá</th>
                          <th>Giờ gán</th>
                          <th style={{ textAlign: 'center' }}>Huỷ bán</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStoreSerials.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-secondary)' }}>
                              {serialDateFilter
                                ? `Không có mã Serial nào được gán trong ngày ${formatDateOnlyVN(serialDateFilter)}${serialSearchQuery ? ` khớp với "${serialSearchQuery}"` : ''}.`
                                : `Không tìm thấy mã Serial nào khớp với từ khóa "${serialSearchQuery}".`}
                            </td>
                          </tr>
                        ) : (
                          filteredStoreSerials.map((item, i) => (
                            <tr key={item.serialNumber + '_' + i}>
                              <td>{i + 1}</td>
                              <td>
                                <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#059669', fontSize: '14px' }}>
                                  {item.serialNumber}
                                </span>
                              </td>
                              <td>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#0f172a' }}>
                                  <Package size={14} style={{ color: '#4f46e5' }} />
                                  {item.productName || 'Sản phẩm'}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 700, color: '#d97706' }}>
                                {formatCurrency(item.unitPrice)}
                              </td>
                              <td>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#334155', fontWeight: 600 }}>
                                  <Clock size={14} style={{ color: '#64748b' }} />
                                  {serialDateFilter
                                    ? formatTimeOnly(item.soldAt)
                                    : `${formatTimeOnly(item.soldAt)} - ${formatDateOnlyVN(toDateKeyYYYYMMDD(item.soldAt))}`}
                                </span>
                              </td>
                              <td style={{ textAlign: 'center' }}>
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
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn"
                  style={{ background: '#059669', color: '#ffffff', fontWeight: 700 }}
                  onClick={() => {
                    const target = serialModalStore;
                    setSerialModalStore(null);
                    handleOpenImportSerialForStore(target);
                  }}
                >
                  <FileSpreadsheet size={16} /> Nhập Excel
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{ background: '#1d4ed8', color: '#ffffff', fontWeight: 700 }}
                  onClick={() => {
                    const target = serialModalStore;
                    setSerialModalStore(null);
                    handleOpenManualSerialModal(target);
                  }}
                >
                  <FileSpreadsheet size={16} /> Nhập Serial
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const target = serialModalStore;
                    setSerialModalStore(null);
                    handleScanForStore(target);
                  }}
                >
                  <QrCode size={16} /> Quét Camera gán Serial
                </button>
              </div>
              <button type="button" className="btn btn-ghost" onClick={() => setSerialModalStore(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Yêu cầu 2: Modal Import Danh sách Điểm bán từ giải pháp cũ / Excel */}
      {showImportStoresModal && (
        <div className="modal-overlay" onClick={() => setShowImportStoresModal(false)}>
          <div className="modal" style={{ maxWidth: '560px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Upload size={20} style={{ color: '#2563eb' }} />
                Import Danh sách Điểm bán (Excel - Mục 2)
              </h2>
              <button type="button" className="btn-icon" onClick={() => setShowImportStoresModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleImportStoresSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: '#1e3a8a' }}>
                  <div style={{ fontWeight: 700, color: '#1d4ed8', marginBottom: '6px' }}>
                    📋 Hỗ trợ đồng bộ danh sách Điểm bán từ giải pháp cũ sang giải pháp mới:
                  </div>
                  <div>• File Excel gồm các cột: <strong>Tên điểm bán</strong>, <strong>Địa chỉ</strong>, <strong>Số điện thoại</strong>.</div>
                  <div>• Nếu tên điểm bán đã tồn tại, hệ thống sẽ tự động cập nhật Địa chỉ và SĐT mới.</div>
                  <div style={{ marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplate('stores')}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: 700, textDecoration: 'underline', fontSize: '13px' }}
                    >
                      <Download size={14} /> Tải file Excel mẫu Danh sách Điểm bán (.xlsx)
                    </button>
                  </div>
                </div>

                {importStoresError && (
                  <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '13.5px', fontWeight: 600 }}>
                    {importStoresError}
                  </div>
                )}

                {importStoresResult && (
                  <div style={{ padding: '12px 14px', borderRadius: '8px', background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#065f46', fontSize: '13.5px' }}>
                    <div style={{ fontWeight: 700 }}>{importStoresResult.message}</div>
                    <div style={{ marginTop: '4px', fontSize: '12.5px', color: '#047857' }}>
                      Thêm mới: <strong>{importStoresResult.createdCount || 0}</strong> • Cập nhật: <strong>{importStoresResult.updatedCount || 0}</strong>
                      {importStoresResult.totalAssignedLabels > 0 && (
                        <> • Đã gán Serial: <strong>{importStoresResult.totalAssignedLabels}</strong></>
                      )}
                    </div>
                  </div>
                )}

                <div className="input-group">
                  <label>Chọn file Excel danh sách Điểm bán (.xlsx, .xls, .csv) *</label>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="input"
                    onChange={(e) => setImportStoresFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowImportStoresModal(false)}>
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

      {/* Yêu cầu 4: Modal Nhập Serial cho Điểm bán bằng Bảng Excel (Mục 4 trong YEU CAU TRAO DOI.docx) */}
      {showImportMatrixModal && (
        <div className="modal-overlay" onClick={() => setShowImportMatrixModal(false)}>
          <div className="modal" style={{ maxWidth: '680px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <FileSpreadsheet size={20} style={{ color: '#059669' }} />
                Nhập Serial cho Điểm bán bằng Excel (Mục 4)
              </h2>
              <button type="button" className="btn-icon" onClick={() => setShowImportMatrixModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleImportMatrixSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: '#065f46' }}>
                  <div style={{ fontWeight: 800, color: '#047857', marginBottom: '6px' }}>
                    📊 Cấu trúc các trường trong Bảng Excel Nhập Serial (Theo đúng Mục 4 file Word):
                  </div>
                  <div style={{ overflowX: 'auto', marginBottom: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', background: '#ffffff' }}>
                      <tbody>
                        <tr style={{ background: '#d1fae5' }}>
                          <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', fontWeight: 800, color: '#0f172a' }}>Điểm bán ---------&gt;</td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', fontWeight: 800, color: '#b45309' }}>Nhà A</td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', fontWeight: 800, color: '#b45309' }}>Nhà B</td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', fontWeight: 800, color: '#b45309' }}>Nhà C</td>
                        </tr>
                        <tr style={{ background: '#f8fafc' }}>
                          <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', fontWeight: 800, color: '#1d4ed8' }}>Tên sản phẩm</td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px' }}></td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px' }}></td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px' }}></td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', fontWeight: 600, color: '#0f172a' }}>Sản phẩm 1</td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', fontFamily: 'monospace', fontWeight: 700, color: '#059669' }}>00001-000010</td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px' }}></td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px' }}></td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', fontWeight: 600, color: '#0f172a' }}>Sản phẩm 2</td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', fontFamily: 'monospace', fontWeight: 700, color: '#059669' }}>00101-001910</td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px' }}></td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px' }}></td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', fontWeight: 600, color: '#0f172a' }}>Sản phẩm 3</td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px' }}></td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px' }}></td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px' }}></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div>• Hệ thống tự động nhận diện Điểm bán (tạo mới nếu chưa có), khớp Sản phẩm và gán toàn bộ dải Serial trong ô.</div>
                  <div>• <strong>Lưu ý quan trọng:</strong> Ngày import được chọn bên dưới sẽ được ghi nhận là <strong>Ngày bán / gán sản phẩm</strong> để tính doanh thu Điểm bán.</div>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplate('matrix')}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: 800, textDecoration: 'underline', fontSize: '13px' }}
                    >
                      <Download size={14} /> Tải file Excel mẫu chuẩn Mục 4 (.xlsx)
                    </button>
                    {stores.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleDownloadTemplate('matrix_prefilled')}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#1d4ed8', fontWeight: 800, textDecoration: 'underline', fontSize: '13px' }}
                      >
                        <Download size={14} /> Tải mẫu có sẵn Điểm bán &amp; SP hiện tại (.xlsx)
                      </button>
                    )}
                  </div>
                </div>

                {importMatrixError && (
                  <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '13.5px', fontWeight: 600 }}>
                    {importMatrixError}
                  </div>
                )}

                {importMatrixResult && (
                  <div style={{ padding: '12px 14px', borderRadius: '8px', background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#065f46', fontSize: '13.5px' }}>
                    <div style={{ fontWeight: 700 }}>{importMatrixResult.message}</div>
                    {(importMatrixResult.createdCount > 0 || importMatrixResult.updatedCount > 0) && (
                      <div style={{ marginTop: '4px', fontSize: '12.5px', color: '#047857' }}>
                        Điểm bán thêm mới: <strong>{importMatrixResult.createdCount || 0}</strong> • Cập nhật: <strong>{importMatrixResult.updatedCount || 0}</strong>
                      </div>
                    )}
                    {Array.isArray(importMatrixResult.details) && importMatrixResult.details.length > 0 && (
                      <div style={{ maxHeight: '140px', overflowY: 'auto', marginTop: '8px', fontSize: '12px', color: '#047857' }}>
                        {importMatrixResult.details.map((d, idx) => (
                          <div key={idx} style={{ padding: '3px 0', borderBottom: '1px dashed #a7f3d0' }}>
                            🏪 <strong>{d.storeName}</strong> — {d.productName} ({d.range}): Đã gán <strong>{d.matchedLabels}</strong> serial
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="input-group">
                  <label>Áp dụng cho Điểm bán</label>
                  <select
                    className="input select"
                    value={importMatrixStoreId}
                    onChange={(e) => setImportMatrixStoreId(e.target.value)}
                  >
                    <option value="">Tự động nhận diện theo cột Điểm bán trong file Excel (Nhà A, Nhà B...)</option>
                    {stores.map((st) => (
                      <option key={st._id} value={st._id}>
                        Chỉ gán riêng cho Điểm bán: {st.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label>Ngày Import (Ngày bán / gán sản phẩm) *</label>
                  <input
                    type="date"
                    className="input"
                    value={importMatrixDate}
                    onChange={(e) => setImportMatrixDate(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Chọn file Excel Nhập Serial (.xlsx, .xls, .csv) *</label>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="input"
                    onChange={(e) => setImportMatrixFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowImportMatrixModal(false)}>
                  Đóng
                </button>
                <button type="submit" className="btn" style={{ background: '#059669', color: '#ffffff', fontWeight: 700 }} disabled={importingMatrix}>
                  {importingMatrix ? 'Đang xử lý & gán Serial...' : 'Import & Gán Serial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nhập Serial trực tiếp cho Điểm bán (Chọn sản phẩm + Nhập "1-10 , 15" + Chọn ngày phân phối) */}
      {manualSerialStore && (
        <div className="modal-overlay" onClick={() => setManualSerialStore(null)}>
          <div
            className="modal"
            style={{
              maxWidth: '720px',
              width: '95%',
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 20px 50px rgba(15, 23, 42, 0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="modal-header"
              style={{
                borderBottom: '1px solid #f1f5f9',
                padding: '16px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <h2 className="modal-title" style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                  Nhập Serial gán cho điểm bán: <span style={{ color: '#1d4ed8' }}>{manualSerialStore.name}</span>
                </h2>
                {manualSerialStore.address && (
                  <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
                    Địa chỉ: {manualSerialStore.address}
                  </div>
                )}
              </div>
              <button type="button" className="btn-icon" onClick={() => setManualSerialStore(null)}>
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
