import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import * as XLSX from 'xlsx';
import {
  Tag, Plus, Search, RefreshCw, ArrowRight, Link2, Upload, Clock, CheckCircle, XCircle, X, ToggleLeft, ToggleRight, Package, MapPin, Calendar, ExternalLink, Download, Trash2, ShieldCheck, Edit, Filter, RotateCcw, Printer, ChevronDown, Building2, UserCheck, FileSpreadsheet
} from 'lucide-react';
import './Labels.css';
import Pagination from '../../components/Pagination';

export default function Labels() {
  const { isAdmin, enterpriseId } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab based on route path
  let activeTab = 'batches';
  if (location.pathname.endsWith('/activate')) {
    activeTab = 'activate';
  } else if (location.pathname.endsWith('/migrate')) {
    activeTab = 'migrate';
  } else if (location.pathname.endsWith('/renew')) {
    activeTab = 'renew';
  }
  const [batches, setBatches] = useState([]);
  const [labels, setLabels] = useState([]);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [enterprises, setEnterprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  // Quick Filter States
  const [filterProduct, setFilterProduct] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterEnterprise, setFilterEnterprise] = useState('');
  const [allBatchesForFilter, setAllBatchesForFilter] = useState([]);
  const [showCreateBatch, setShowCreateBatch] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showMigrateModal, setShowMigrateModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedLabel, setSelectedLabel] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [batchPagination, setBatchPagination] = useState({ page: 1, totalPages: 1 });
  const [labelPagination, setLabelPagination] = useState({ page: 1, totalPages: 1 });
  const [templates, setTemplates] = useState([]);
  const [exportingBatchId, setExportingBatchId] = useState(null);
  const [exportingDistBatchId, setExportingDistBatchId] = useState(null);
  const [exportingLabels, setExportingLabels] = useState(false);
  const [showBulkMapModal, setShowBulkMapModal] = useState(false);
  const [bulkForm, setBulkForm] = useState({ batchId: '', serialStart: '', serialEnd: '', productId: '', distributorIdx: '', distributorName: '', distributorAddress: '', ownerCode: '' });
  const [createSuccessToast, setCreateSuccessToast] = useState(null); // { batchCode, totalLabels }

  // States quản lý Chỉnh sửa thông số sở hữu tem (Quyền Admin)
  const [showOwnerModal, setShowOwnerModal] = useState(false);
  const [ownerTargetLabel, setOwnerTargetLabel] = useState(null);
  const [ownerForm, setOwnerForm] = useState({ ownerName: '', ownerAddress: '', ownerPhone: '', activatedSerial: '', ownerCode: '', internalCode: '' });
  const [savingOwner, setSavingOwner] = useState(false);
  const [ownerModalError, setOwnerModalError] = useState('');

  // States quản lý Import Mã nội bộ cho Lô tem (Cột 1: Serial, Cột 2: Mã nội bộ, Cột 3: Sản phẩm)
  const [showInternalCodeModal, setShowInternalCodeModal] = useState(false);
  const [internalCodeBatchId, setInternalCodeBatchId] = useState('');
  const [internalCodeRows, setInternalCodeRows] = useState([]);
  const [internalCodeFileName, setInternalCodeFileName] = useState('');
  const [importingInternalCodes, setImportingInternalCodes] = useState(false);
  const [downloadingInternalTemplate, setDownloadingInternalTemplate] = useState(false);
  const [internalImportResult, setInternalImportResult] = useState(null);
  const [internalImportError, setInternalImportError] = useState('');

  const [batchForm, setBatchForm] = useState({ batchCode: '', totalLabels: 100, prefix: '', serialType: 'GLOBAL_SEQUENTIAL', productId: '', templateId: '', theme: 'default', expiryDate: '', notes: '', enterpriseId: '' });
  const [nextSerialInfo, setNextSerialInfo] = useState(null);
  const [renewMonths, setRenewMonths] = useState(12);
  const [renewMode, setRenewMode] = useState('months'); // 'months' | 'date'
  const [renewNewDate, setRenewNewDate] = useState('');
  const [renewFilterMode, setRenewFilterMode] = useState('expired'); // 'expired' | 'expiringSoon' | 'all'
  const [expiredCount, setExpiredCount] = useState(0);
  const [expiringSoonCount, setExpiringSoonCount] = useState(0);
  const [migrateForm, setMigrateForm] = useState({ batchCode: '', migrationSource: '', migrationOldLink: '', productId: '', templateId: '', theme: 'default', labelsText: '', enterpriseId: '' });
  const [mapForm, setMapForm] = useState({ 
    productId: '', 
    theme: 'default', 
    distributorIdx: '',
    distributorName: '', 
    distributorAddress: '', 
    customDomain: '',
    serialStart: '',
    serialEnd: ''
  });

  // ── Khi mount + khi tab thay đổi: load dữ liệu ──────────────────────────
  useEffect(() => {
    loadProducts();
    loadTemplates();
    loadBatchOptions();
    if (isAdmin) loadEnterprises();
  }, [isAdmin]);

  // Dùng ref để track search và page hiện tại (tránh stale closure)
  const curSearch = useRef(search);
  const curBatchPage = useRef(batchPagination.page);
  const curLabelPage = useRef(labelPagination.page);
  const tabMounted = useRef(false);

  // Load khi tab thay đổi (và lần đầu mount)
  useEffect(() => {
    tabMounted.current = true;
    if (activeTab === 'batches') loadBatches(1, curSearch.current);
    else if (activeTab === 'activate') loadLabels(1, curSearch.current);
    else if (activeTab === 'migrate') {
      loadBatches(1, curSearch.current);
      loadBatchOptions();
    } else if (activeTab === 'renew') {
      loadBatches(1, curSearch.current, { expired: 'true' });
      loadRenewStats();
    }
  }, [activeTab]);

  // Khi search thay đổi: reset về page 1 và load
  useEffect(() => {
    if (!tabMounted.current) return;
    curSearch.current = search;
    setBatchPagination(p => ({ ...p, page: 1 }));
    setLabelPagination(p => ({ ...p, page: 1 }));
    curBatchPage.current = 1;
    curLabelPage.current = 1;
    if (activeTab === 'batches') loadBatches(1, search);
    else if (activeTab === 'activate') loadLabels(1, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Khi bộ lọc dropdown thay đổi: reset về page 1 và load lại
  useEffect(() => {
    if (!tabMounted.current) return;
    setBatchPagination(p => ({ ...p, page: 1 }));
    setLabelPagination(p => ({ ...p, page: 1 }));
    curBatchPage.current = 1;
    curLabelPage.current = 1;
    if (activeTab === 'batches') loadBatches(1, curSearch.current);
    else if (activeTab === 'activate') loadLabels(1, curSearch.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterProduct, filterBatch, filterStatus, filterEnterprise]);

  // Khi page thay đổi: load trang mới (bỏ qua nếu page không thực sự đổi)
  useEffect(() => {
    if (!tabMounted.current) return;
    const p = batchPagination.page;
    if (curBatchPage.current === p) return;
    curBatchPage.current = p;
    if (activeTab === 'batches') loadBatches(p, curSearch.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchPagination.page]);

  useEffect(() => {
    if (!tabMounted.current) return;
    const p = labelPagination.page;
    if (curLabelPage.current === p) return;
    curLabelPage.current = p;
    if (activeTab === 'activate') loadLabels(p, curSearch.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labelPagination.page]);

  // ── Helper / utility functions ─────────────────────────────────────────
  const loadProducts = async (targetEntId = null) => {
    try {
      setProductsLoading(true);
      const params = { limit: 1000, simple: 'true' };
      if (targetEntId) {
        params.enterpriseId = targetEntId;
      }
      const r = await api.getProducts(params);
      if (r && Array.isArray(r.data)) {
        if (targetEntId) {
          setProducts(prev => {
            const others = prev.filter(p => getEntIdStr(p.enterpriseId) !== getEntIdStr(targetEntId));
            return [...others, ...r.data];
          });
        } else {
          setProducts(r.data);
        }
      }
    } catch (e) {
      console.error('[loadProducts] Lỗi tải sản phẩm:', e);
    } finally {
      setProductsLoading(false);
    }
  };

  const loadBatchOptions = async () => {
    try {
      const r = await api.getBatches({ limit: 1000 });
      if (r && r.data) setAllBatchesForFilter(r.data);
    } catch (e) {}
  };

  const loadTemplates = async () => {
    try {
      const r = await api.getTemplates();
      setTemplates(Array.isArray(r) ? r : r.data || []);
    } catch (e) {}
  };

  const loadEnterprises = async () => {
    try {
      const r = await api.getEnterprises();
      setEnterprises(r || []);
    } catch (e) {}
  };

  const getThemeLabel = (themeKey) => {
    switch (themeKey) {
      case 'ocop': return '🏆 OCOP';
      case 'functional_food': return '🌿 TPCN';
      case 'agriculture': return '🍃 Nông nghiệp';
      case 'appliance': return '⚡ Gia dụng';
      case 'food': return '🍲 Thực phẩm';
      case 'medical': return '💊 Y tế/Dược';
      case 'cosmetics': return '💄 Mỹ phẩm';
      default: return '📋 Mặc định';
    }
  };

  const getEntIdStr = (obj) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    if (obj._id) return String(obj._id);
    return String(obj);
  };

  const getFilteredProducts = (targetEntId) => {
    if (!targetEntId) return products;
    const entIdStr = getEntIdStr(targetEntId);
    return products.filter(p => getEntIdStr(p.enterpriseId) === entIdStr);
  };

  const getFilteredTemplates = (targetEntId) => {
    if (!targetEntId) return templates;
    const entIdStr = getEntIdStr(targetEntId);
    return templates.filter(t => getEntIdStr(t.enterpriseId) === entIdStr);
  };

  // ── Load functions: nhận tường minh page + searchTerm + filters ─────────────────
  const loadBatches = async (page = 1, searchTerm = curSearch.current, customFilters = {}) => {
    try {
      setLoading(true);
      const prodId = customFilters.productId !== undefined ? customFilters.productId : filterProduct;
      const stat = customFilters.status !== undefined ? customFilters.status : filterStatus;
      const entId = customFilters.enterpriseId !== undefined ? customFilters.enterpriseId : filterEnterprise;
      // Các param gia hạn
      const expired = customFilters.expired !== undefined ? customFilters.expired : '';
      const expiringSoon = customFilters.expiringSoon !== undefined ? customFilters.expiringSoon : '';
      const r = await api.getBatches({ page, search: searchTerm, productId: prodId, status: stat, enterpriseId: entId, expired, expiringSoon });
      if (r && r.data) {
        setBatches(r.data);
        setBatchPagination(prev => ({ ...prev, ...r.pagination, page: r.pagination?.page ?? page }));
        curBatchPage.current = r.pagination?.page ?? page;
      }
    } catch (e) { console.error('[loadBatches]', e.message); } finally { setLoading(false); }
  };

  // Load thống kê số lô hết hạn / sắp hết hạn cho tab Gia hạn
  const loadRenewStats = async () => {
    try {
      const [rExpired, rSoon] = await Promise.all([
        api.getBatches({ limit: 1, page: 1, expired: 'true' }),
        api.getBatches({ limit: 1, page: 1, expiringSoon: '30' })
      ]);
      setExpiredCount(rExpired?.pagination?.total ?? 0);
      setExpiringSoonCount(rSoon?.pagination?.total ?? 0);
    } catch (e) {}
  };

  const loadLabels = async (page = 1, searchTerm = curSearch.current, customFilters = {}) => {
    try {
      setLoading(true);
      const prodId = customFilters.productId !== undefined ? customFilters.productId : filterProduct;
      const batId = customFilters.batchId !== undefined ? customFilters.batchId : filterBatch;
      const stat = customFilters.status !== undefined ? customFilters.status : filterStatus;
      const entId = customFilters.enterpriseId !== undefined ? customFilters.enterpriseId : filterEnterprise;
      const r = await api.getLabels({ page, search: searchTerm, productId: prodId, batchId: batId, status: stat, enterpriseId: entId, limit: 30 });
      if (r && r.data) {
        setLabels(r.data);
        setLabelPagination(prev => ({ ...prev, ...r.pagination, page: r.pagination?.page ?? page }));
        curLabelPage.current = r.pagination?.page ?? page;
      }
    } catch (e) { console.error('[loadLabels]', e.message); } finally { setLoading(false); }
  };

  const handleResetFilters = () => {
    setSearch('');
    setFilterProduct('');
    setFilterBatch('');
    setFilterStatus('');
    setFilterEnterprise('');
    curSearch.current = '';
    setBatchPagination(p => ({ ...p, page: 1 }));
    setLabelPagination(p => ({ ...p, page: 1 }));
    curBatchPage.current = 1;
    curLabelPage.current = 1;
    if (activeTab === 'batches') loadBatches(1, '', { productId: '', status: '', enterpriseId: '' });
    else if (activeTab === 'activate') loadLabels(1, '', { productId: '', batchId: '', status: '', enterpriseId: '' });
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    setModalError(null);
    if (isAdmin && !batchForm.enterpriseId) {
      setModalError('Vui lòng chọn doanh nghiệp sở hữu lô tem');
      return;
    }
    try {
      const createdCode = batchForm.batchCode;
      const createdCount = batchForm.totalLabels;

      let result;
      let retried = false;
      try {
        result = await api.createBatch({ ...batchForm, enterpriseId: isAdmin ? batchForm.enterpriseId : enterpriseId });
      } catch (firstErr) {
        // Nếu lỗi 409 (race condition serial/batchCode) → tự động thử lại 1 lần sau 800ms
        // 409 = server đã rollback, an toàn để retry
        if (firstErr.message && (
          firstErr.message.includes('xung đột') ||
          firstErr.message.includes('thử lại')
        )) {
          retried = true;
          await new Promise(r => setTimeout(r, 800));
          result = await api.createBatch({ ...batchForm, enterpriseId: isAdmin ? batchForm.enterpriseId : enterpriseId });
        } else {
          throw firstErr;
        }
      }

      // 1. Đóng modal, reset form
      setShowCreateBatch(false);
      setBatchForm({ batchCode: '', totalLabels: 100, prefix: '', serialType: 'GLOBAL_SEQUENTIAL', productId: '', templateId: '', theme: 'default', expiryDate: '', notes: '', enterpriseId: '' });

      // 2. Hiện toast NGAY LẬP TỨC
      setCreateSuccessToast({ batchCode: createdCode, totalLabels: createdCount });

      // 3. Xóa search, reset về trang 1, load lại (await để list hiện ngay)
      curSearch.current = '';
      curBatchPage.current = 1;
      setSearch('');
      setBatchPagination(p => ({ ...p, page: 1 }));
      await loadBatches(1, '');  // Await → list cập nhật ngay, lô mới xuất hiện đầu tiên

      // 4. Sau 3s: chỉ ẩn toast — KHÔNG tự mở modal (tránh khách nhầm và F5 mất data)
      setTimeout(() => {
        setCreateSuccessToast(null);
      }, 3000);

    } catch (err) { setModalError(err.message || 'Lỗi tạo lô tem'); }
  };

  const openCreateBatchModal = async () => {
    setModalError(null);
    const initialEntId = isAdmin ? '' : (enterpriseId || '');
    setBatchForm({ batchCode: '', totalLabels: 100, prefix: '', serialType: 'GLOBAL_SEQUENTIAL', productId: '', templateId: '', theme: 'default', expiryDate: '', notes: '', enterpriseId: initialEntId });
    loadProducts(initialEntId);
    loadTemplates();
    try {
      const res = await api.getNextSerial();
      setNextSerialInfo(res);
    } catch (e) {}
    setShowCreateBatch(true);
  };

  const handleClearAllLabels = async () => {
    const confirmText = prompt("⚠️ CẢNH BÁO NGUY HIỂM!\n\nThao tác này sẽ XÓA SẠCH toàn bộ Lô tem, Tem nhãn và Lịch sử quét trên toàn hệ thống.\n\nDải mã Serial sẽ được RESET quay về 00000001.\n\nNhập chữ 'RESET' vào ô bên dưới để xác nhận:");
    if (confirmText !== 'RESET') {
      if (confirmText !== null) alert("Mã xác nhận không khớp. Đã hủy thao tác xóa!");
      return;
    }
    try {
      const res = await api.clearAllLabels();
      alert(res.message || 'Đã xóa toàn bộ dữ liệu tem thành công!');
      loadBatches();
    } catch (err) {
      alert(err.message || 'Lỗi khi xóa dữ liệu');
    }
  };

  // Dọn sạch orphan labels (labels không thuộc lô tem nào) — sửa lỗi "tạo báo trùng nhưng không tìm thấy"
  const handleCleanupOrphans = async () => {
    if (!window.confirm('Dọn sạch tem nhãn orphan (không thuộc lô tem nào)?\n\nHành động này an toàn và giúp khắc phục lỗi serial bị trùng khi tạo lô tem mới.')) return;
    try {
      const res = await api.cleanupOrphanLabels();
      alert(res.message || 'Đã dọn sạch tem nhãn orphan!');
      loadBatches();
    } catch (err) {
      alert(err.message || 'Lỗi khi dọn orphan labels');
    }
  };

  const handleDeleteBatch = async (batch) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa lô tem "${batch.batchCode}" và toàn bộ tem nhãn thuộc lô này không?`)) {
      return;
    }
    try {
      await api.deleteBatch(batch._id);
      // Nếu đang ở trang cuối và xóa hết → load lại page 1
      const newTotal = batchPagination.total - 1;
      const newTotalPages = Math.ceil(newTotal / 20);
      const targetPage = curBatchPage.current > newTotalPages ? Math.max(1, newTotalPages) : curBatchPage.current;
      curBatchPage.current = targetPage;
      setBatchPagination(p => ({ ...p, page: targetPage }));
      loadBatches(targetPage, curSearch.current);
      alert(`Đã xóa thành công lô tem "${batch.batchCode}"!`);
    } catch (err) {
      alert(err.message || 'Lỗi xóa lô tem');
    }
  };

  const handleToggleStatus = async (batch) => {
    const newStatus = batch.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.updateBatchStatus(batch._id, { status: newStatus });
      loadBatches(curBatchPage.current, curSearch.current);
    }
    catch (err) { alert(err.message); }
  };

  const handleMapProduct = async () => {
    try {
      // 1. Cập nhật Lô tem (productId, theme, customDomain)
      await api.mapBatchProduct(selectedBatch._id, { 
        productId: mapForm.productId, 
        theme: mapForm.theme,
        customDomain: mapForm.customDomain 
      });

      // 2. Gắn kết dải Serial cho sản phẩm và điểm bán lẻ nếu có
      if (mapForm.serialStart && mapForm.serialEnd) {
        await api.bulkMapLabels({
          batchId: selectedBatch._id,
          serialStart: mapForm.serialStart,
          serialEnd: mapForm.serialEnd,
          productId: mapForm.productId || null,
          distributorName: mapForm.distributorName || null,
          distributorAddress: mapForm.distributorAddress || null
        });
      }

      setShowMapModal(false);
      loadBatches(curBatchPage.current, curSearch.current);
      alert('Cấu hình lô tem và phân phối điểm bán thành công!');
    } catch (err) { alert(err.message || 'Lỗi cấu hình lô tem'); }
  };

  const handleRenew = async () => {
    try {
      let body;
      if (renewMode === 'date' && renewNewDate) {
        // Tính số tháng từ ngày hết hạn hiện tại đến ngày mới
        const currentExpiry = selectedBatch.expiryDate && new Date(selectedBatch.expiryDate) > new Date()
          ? new Date(selectedBatch.expiryDate) : new Date();
        const targetDate = new Date(renewNewDate);
        const diffMs = targetDate - currentExpiry;
        const diffMonths = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24 * 30)));
        body = { months: diffMonths };
      } else {
        body = { months: renewMonths };
      }
      await api.renewBatch(selectedBatch._id, body);
      setShowRenewModal(false);
      // Reload với filter hiện tại của tab renew
      const filterMap = {
        expired: { expired: 'true' },
        expiringSoon: { expiringSoon: '30' },
        all: {}
      };
      loadBatches(curBatchPage.current, curSearch.current, filterMap[renewFilterMode] || { expired: 'true' });
      loadRenewStats();
    } catch (err) { alert(err.message || 'Lỗi gia hạn lô tem'); }
  };

  // Tính ngày hết hạn mới dự kiến
  const calcNewExpiryDate = () => {
    if (!selectedBatch) return null;
    if (renewMode === 'date' && renewNewDate) return new Date(renewNewDate);
    const base = selectedBatch.expiryDate && new Date(selectedBatch.expiryDate) > new Date()
      ? new Date(selectedBatch.expiryDate) : new Date();
    const d = new Date(base);
    d.setMonth(d.getMonth() + (parseInt(renewMonths) || 0));
    return d;
  };

  const handleFixEncryption = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn quét và mã hóa lại tất cả các link QR của tem bị lộ Serial không?')) return;
    try {
      const res = await api.fixEncryption();
      alert(res.message || 'Đã sửa lỗi và mã hóa bảo mật toàn bộ đuôi link QR thành công!');
      loadBatches();
    } catch (err) {
      alert('Lỗi mã hóa đuôi tem: ' + (err.message || err));
    }
  };

  const handleDownloadBatch = async (batch) => {
    try {
      setExportingBatchId(batch._id);
      // Tải toàn bộ tem qua pagination (mỗi page 5000 records) để tránh timeout / JSON parse lỗi
      const labels = await api.exportBatchLabels(batch._id);

      if (!labels || labels.length === 0) {
        const doRepair = window.confirm(
          `Lô tem "${batch.batchCode}" chưa có dữ liệu tem nhãn!\n\n` +
          `Nguyên nhân có thể do server bị ngắt kết nối trong lúc tạo lô.\n\n` +
          `Bạn có muốn KHÔI PHỤC lại ${batch.totalLabels} tem cho lô này không?\n` +
          `(Hệ thống sẽ tự động khôi phục và tải về ngay sau khi hoàn tất)`
        );
        if (doRepair) {
          await handleRepairBatch(batch);
        }
        return;
      }

      const exportData = labels.map((label, index) => ({
        'STT': index + 1,
        'Mã lô': batch.batchCode,
        'Sản phẩm': label.productId?.name || batch.productId?.name || 'Chưa gắn',
        'Mã Serial': label.serialNumber,
        'Mã nội bộ': label.internalCode || label.ownerCode || '',
        'Link quét': label.qrUrl,
        'Mã SMS': label.smsCode || '',
        'Mã Kích hoạt': label.activeCode || '',
        'Link QR gốc (Di trú)': label.legacyQrCode || '',
        'Link TEMQR gốc (Di trú)': label.legacyTemQr || '',
        'Trạng thái': getStatusLabel(label.status),
        'Số lượt quét': label.scanCount || 0
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách tem');

      worksheet['!cols'] = [
        { wch: 6 },
        { wch: 15 },
        { wch: 25 },
        { wch: 18 },
        { wch: 45 },
        { wch: 12 },
        { wch: 12 },
        { wch: 25 },
        { wch: 25 },
        { wch: 15 },
        { wch: 12 }
      ];

      XLSX.writeFile(workbook, `Danh_sach_tem_lo_${batch.batchCode}.xlsx`);
      // Tự động cập nhật trạng thái đã in trên giao diện
      setBatches(prev => prev.map(b => b._id === batch._id ? { ...b, isPrinted: true, printedCount: batch.totalLabels } : b));
    } catch (err) {
      alert('Lỗi xuất Excel lô tem: ' + err.message);
    } finally {
      setExportingBatchId(null);
    }
  };

  // Yêu cầu 3 (Chỉ áp dụng cho giao diện Thực phẩm chức năng): Xuất dữ liệu phân phối (Điểm bán / Serial / Sản phẩm)
  const handleExportDistributionBatch = async (batch) => {
    try {
      setExportingDistBatchId(batch._id);
      const batchLabels = await api.exportBatchLabels(batch._id);
      if (!batchLabels || batchLabels.length === 0) {
        alert(`Lô tem "${batch.batchCode}" chưa có dữ liệu tem nhãn để xuất!`);
        return;
      }

      // Sheet 1: Chi tiết phân phối Điểm bán / Serial / Sản phẩm
      const detailRows = batchLabels.map((label, idx) => {
        const storeName = label.distributorName || label.ownerInfo?.name || '';
        const storeAddr = label.distributorAddress || label.ownerInfo?.address || '';
        const storePhone = label.ownerInfo?.phone || '';
        const prodName = label.productId?.name || batch.productId?.name || 'Chưa gắn sản phẩm';
        const soldDateRaw = label.distributedAt || label.ownerInfo?.activatedAt;
        const soldDateStr = soldDateRaw ? new Date(soldDateRaw).toLocaleString('vi-VN') : '';
        return {
          'STT': idx + 1,
          'Mã lô': batch.batchCode,
          'Tên sản phẩm': prodName,
          'Mã Serial': label.serialNumber,
          'Điểm bán': storeName || 'Chưa gán điểm bán',
          'Địa chỉ điểm bán': storeAddr,
          'SĐT điểm bán': storePhone,
          'Ngày bán / gán': soldDateStr,
          'Trạng thái': getStatusLabel(label.status),
          'Số lượt quét': label.scanCount || 0
        };
      });

      const wb = XLSX.utils.book_new();
      const wsDetail = XLSX.utils.json_to_sheet(detailRows);
      wsDetail['!cols'] = [
        { wch: 6 },
        { wch: 15 },
        { wch: 28 },
        { wch: 16 },
        { wch: 26 },
        { wch: 32 },
        { wch: 16 },
        { wch: 22 },
        { wch: 16 },
        { wch: 12 }
      ];
      XLSX.utils.book_append_sheet(wb, wsDetail, 'Chi tiết phân phối');

      // Sheet 2: Bảng Ma trận Điểm bán × Sản phẩm × Dải Serial (theo mẫu vyphyto_req_image2.png)
      const storeSet = new Set();
      const productSet = new Set();
      const cellSerialsMap = new Map(); // `${prodName}|||${storeName}` -> [serials]

      batchLabels.forEach((label) => {
        const storeName = (label.distributorName || label.ownerInfo?.name || '').trim();
        const prodName = (label.productId?.name || batch.productId?.name || 'Sản phẩm').trim();
        productSet.add(prodName);
        if (storeName) {
          storeSet.add(storeName);
          const key = `${prodName}|||${storeName}`;
          if (!cellSerialsMap.has(key)) cellSerialsMap.set(key, []);
          cellSerialsMap.get(key).push(String(label.serialNumber).trim());
        }
      });

      const storeList = Array.from(storeSet);
      const productList = Array.from(productSet);

      const compressSerialRanges = (serialArr = []) => {
        if (!serialArr.length) return '';
        const sorted = [...serialArr].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        const ranges = [];
        let rangeStart = sorted[0];
        let prev = sorted[0];

        const isNextConsecutive = (s1, s2) => {
          const m1 = s1.match(/^(.*?)(\d+)$/);
          const m2 = s2.match(/^(.*?)(\d+)$/);
          if (!m1 || !m2) return false;
          if (m1[1] !== m2[1]) return false;
          return parseInt(m2[2], 10) - parseInt(m1[2], 10) === 1;
        };

        for (let i = 1; i < sorted.length; i++) {
          const cur = sorted[i];
          if (isNextConsecutive(prev, cur)) {
            prev = cur;
          } else {
            ranges.push(rangeStart === prev ? rangeStart : `${rangeStart}-${prev}`);
            rangeStart = cur;
            prev = cur;
          }
        }
        ranges.push(rangeStart === prev ? rangeStart : `${rangeStart}-${prev}`);
        return ranges.join('; ');
      };

      const matrixHeaderRow1 = ['Điểm bán --------->', ...(storeList.length > 0 ? storeList : ['Chưa có điểm bán được gán'])];
      const matrixHeaderRow2 = ['Tên sản phẩm', ...(storeList.length > 0 ? storeList.map(() => '') : [''])];
      const matrixBodyRows = productList.map((prodName) => {
        if (storeList.length === 0) return [prodName, ''];
        return [
          prodName,
          ...storeList.map((stName) => {
            const serials = cellSerialsMap.get(`${prodName}|||${stName}`) || [];
            return compressSerialRanges(serials);
          })
        ];
      });

      const wsMatrix = XLSX.utils.aoa_to_sheet([matrixHeaderRow1, matrixHeaderRow2, ...matrixBodyRows]);
      wsMatrix['!cols'] = [{ wch: 28 }, ...(storeList.length > 0 ? storeList.map(() => ({ wch: 24 })) : [{ wch: 28 }])];
      XLSX.utils.book_append_sheet(wb, wsMatrix, 'Bảng Ma trận Điểm bán');

      XLSX.writeFile(wb, `Phan_phoi_DiemBan_Serial_SP_${batch.batchCode}.xlsx`);
    } catch (err) {
      alert('Lỗi xuất dữ liệu phân phối: ' + (err.message || err));
    } finally {
      setExportingDistBatchId(null);
    }
  };

  // Khôi phục labels bị mất cho batch (do server restart trong lúc background insert)
  const handleRepairBatch = async (batch) => {
    try {
      setExportingBatchId(batch._id);
      const result = await api.repairBatch(batch._id);
      alert(`✅ ${result.message}\n\nBạn có thể tải lô tem ngay bây giờ.`);
      // Sau khi repair xong, tự động tải luôn
      await handleDownloadBatch(batch);
    } catch (err) {
      alert('Lỗi khôi phục lô tem: ' + (err.response?.data?.error || err.message));
    } finally {
      setExportingBatchId(null);
    }
  };

  const handleTogglePrinted = async (batch) => {
    try {

      const nextStatus = !batch.isPrinted;
      const updated = await api.markBatchPrinted(batch._id, { isPrinted: nextStatus, printedCount: nextStatus ? batch.totalLabels : 0 });
      setBatches(prev => prev.map(b => b._id === batch._id ? { ...b, isPrinted: updated.isPrinted, printedCount: updated.printedCount, printedAt: updated.printedAt } : b));
    } catch (err) {
      alert('Lỗi cập nhật trạng thái in: ' + (err.message || err));
    }
  };

  const handleDownloadFilteredLabels = async () => {
    try {
      setExportingLabels(true);
      // Use dedicated streaming export API (single request, no pagination overhead)
      const labels = await api.exportFilteredLabels({
        search,
        productId: filterProduct,
        batchId: filterBatch,
        status: filterStatus,
        enterpriseId: filterEnterprise
      });
      if (!labels || labels.length === 0) {
        alert('Không tìm thấy dữ liệu tem nhãn nào phù hợp với bộ lọc!');
        return;
      }

      const exportData = labels.map((label, index) => ({
        'STT': index + 1,
        'Mã lô': label.batchId?.batchCode || '—',
        'Sản phẩm': label.productId?.name || 'Chưa gắn',
        'Mã Serial': label.serialNumber,
        'Mã nội bộ': label.internalCode || '',
        'Link quét': label.qrUrl,
        'Mã SMS': label.smsCode || '',
        'Mã Kích hoạt': label.activeCode || '',
        'Điểm bán': label.distributorName || '—',
        'Địa chỉ điểm bán': label.distributorAddress || '—',
        'Mã sở hữu': label.internalCode || label.ownerCode || '—',
        'Trạng thái': getStatusLabel(label.status),
        'Số lượt quét': label.scanCount || 0
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Kết quả tìm kiếm');

      worksheet['!cols'] = [
        { wch: 6 },
        { wch: 15 },
        { wch: 25 },
        { wch: 18 },
        { wch: 45 },
        { wch: 12 },
        { wch: 12 },
        { wch: 20 },
        { wch: 25 },
        { wch: 15 },
        { wch: 12 }
      ];

      XLSX.writeFile(workbook, `Danh_sach_tem_loc.xlsx`);
    } catch (err) {
      alert('Lỗi xuất Excel danh sách lọc: ' + err.message);
    } finally {
      setExportingLabels(false);
    }
  };

  const handleBulkFormBatchChange = (batchId) => {
    const selected = batches.find(b => b._id === batchId);
    if (selected) {
      setBulkForm(prev => ({
        ...prev,
        batchId,
        serialStart: selected.serialStart,
        serialEnd: selected.serialEnd,
        productId: selected.productId?._id || selected.productId || ''
      }));
    } else {
      setBulkForm(prev => ({
        ...prev,
        batchId: '',
        serialStart: '',
        serialEnd: '',
        productId: ''
      }));
    }
  };

  const handleBulkMapSubmit = async (e) => {
    e.preventDefault();
    setModalError(null);
    if (!bulkForm.batchId || !bulkForm.serialStart || !bulkForm.serialEnd) {
      setModalError('Vui lòng chọn Lô tem và nhập đầy đủ dải Serial!');
      return;
    }

    try {
      const res = await api.bulkMapLabels({
        batchId: bulkForm.batchId,
        serialStart: bulkForm.serialStart,
        serialEnd: bulkForm.serialEnd,
        productId: bulkForm.productId || null,
        distributorName: bulkForm.distributorName || null,
        distributorAddress: bulkForm.distributorAddress || null,
        ownerCode: bulkForm.ownerCode || null
      });

      setShowBulkMapModal(false);
      setBulkForm({ batchId: '', serialStart: '', serialEnd: '', productId: '', distributorIdx: '', distributorName: '', distributorAddress: '', ownerCode: '' });
      
      // Reload lists
      if (activeTab === 'batches') loadBatches();
      else if (activeTab === 'activate') loadLabels();

      alert(res.message || 'Cập nhật dải tem nhãn thành công!');
    } catch (err) {
      setModalError(err.message || 'Lỗi cập nhật dải tem nhãn');
    }
  };



  const handleMigrate = async (e) => {
    e.preventDefault();
    setModalError(null);
    if (isAdmin && !migrateForm.enterpriseId) {
      setModalError('Vui lòng chọn doanh nghiệp sở hữu lô tem');
      return;
    }
    try {
      const lines = migrateForm.labelsText.split('\n').filter(l => l.trim());
      if (lines.length === 0) {
        setModalError('Vui lòng nhập dữ liệu tem nhãn!');
        return;
      }

      // Check if the first line is a header
      const isHeaderLine = (line) => {
        const norm = line.toUpperCase();
        return norm.includes('STT') || norm.includes('ID') || norm.includes('QRCODE') || norm.includes('TEMQR') || norm.includes('ACTIVE CODE') || norm.includes('SMS CODE');
      };

      let idIdx = -1, qrcodeIdx = -1, smsCodeIdx = -1, temqrIdx = -1, activeCodeIdx = -1;
      let hasHeader = false;

      if (isHeaderLine(lines[0])) {
        hasHeader = true;
        const separator = lines[0].includes('\t') ? '\t' : ',';
        const headers = lines[0].split(separator).map(h => h.toUpperCase().trim());
        idIdx = headers.indexOf('ID');
        if (idIdx === -1) idIdx = headers.indexOf('SERIAL');
        qrcodeIdx = headers.indexOf('QRCODE');
        smsCodeIdx = headers.indexOf('SMS CODE');
        if (smsCodeIdx === -1) smsCodeIdx = headers.indexOf('SMSCODE');
        temqrIdx = headers.indexOf('TEMQR');
        activeCodeIdx = headers.indexOf('ACTIVE CODE');
        if (activeCodeIdx === -1) activeCodeIdx = headers.indexOf('ACTIVECODE');
      }

      const dataLines = hasHeader ? lines.slice(1) : lines;
      const labels = dataLines.map(line => {
        const separator = line.includes('\t') ? '\t' : ',';
        const parts = line.split(separator).map(s => s.trim());
        
        if (hasHeader) {
          return {
            serial: idIdx !== -1 ? parts[idIdx] : parts[0],
            qrcode: qrcodeIdx !== -1 ? parts[qrcodeIdx] : '',
            smsCode: smsCodeIdx !== -1 ? parts[smsCodeIdx] : '',
            temqr: temqrIdx !== -1 ? parts[temqrIdx] : '',
            activeCode: activeCodeIdx !== -1 ? parts[activeCodeIdx] : ''
          };
        } else {
          if (separator === '\t') {
            if (parts.length >= 6) {
              // Format: STT, ID, QRCODE, SMS CODE, TEMQR, ACTIVE CODE
              return {
                serial: parts[1],
                qrcode: parts[2] || '',
                smsCode: parts[3] || '',
                temqr: parts[4] || '',
                activeCode: parts[5] || ''
              };
            } else if (parts.length === 5) {
              // Format: ID, QRCODE, SMS CODE, TEMQR, ACTIVE CODE
              return {
                serial: parts[0],
                qrcode: parts[1] || '',
                smsCode: parts[2] || '',
                temqr: parts[3] || '',
                activeCode: parts[4] || ''
              };
            } else if (parts.length === 4) {
              // Old Format: ID, QRCODE, TEMQR, ACTIVE CODE
              return {
                serial: parts[0],
                qrcode: parts[1] || '',
                smsCode: '',
                temqr: parts[2] || '',
                activeCode: parts[3] || ''
              };
            } else {
              return {
                serial: parts[0],
                qrcode: parts[1] || '',
                smsCode: '',
                temqr: '',
                activeCode: ''
              };
            }
          } else {
            // Comma separated fallback
            return {
              serial: parts[0],
              qrcode: parts[1] || '',
              smsCode: '',
              temqr: '',
              activeCode: ''
            };
          }
        }
      }).filter(item => item.serial && item.serial.trim() !== '');

      if (labels.length === 0) {
        setModalError('Không tìm thấy dòng dữ liệu tem nhãn hợp lệ nào (mã Serial/ID bị thiếu)!');
        return;
      }

      await api.migrateLabels({
        batchCode: migrateForm.batchCode,
        migrationSource: migrateForm.migrationSource,
        migrationOldLink: migrateForm.migrationOldLink,
        productId: migrateForm.productId || null,
        templateId: migrateForm.templateId || null,
        labels,
        enterpriseId: isAdmin ? migrateForm.enterpriseId : enterpriseId
      });
      setShowMigrateModal(false);
      setMigrateForm({ batchCode: '', migrationSource: '', migrationOldLink: '', productId: '', templateId: '', theme: 'default', labelsText: '', enterpriseId: '' });
      loadBatches();
      alert(`Đồng bộ dữ liệu thành công ${labels.length} tem nhãn!`);
    } catch (err) { setModalError(err.message || 'Lỗi đồng bộ tem nhãn'); }
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2) {
          alert('File Excel không có dữ liệu hoặc sai định dạng!');
          return;
        }

        const headers = jsonData[0].map(h => String(h || '').toUpperCase().trim());
        
        const idIdx = headers.indexOf('ID');
        const qrcodeIdx = headers.indexOf('QRCODE');
        const smsCodeIdx = headers.indexOf('SMS CODE');
        const temqrIdx = headers.indexOf('TEMQR');
        const activeCodeIdx = headers.indexOf('ACTIVE CODE');

        if (idIdx === -1) {
          alert('Không tìm thấy cột "ID" bắt buộc trong file Excel!');
          return;
        }

        const parsedRows = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row[idIdx] === undefined || row[idIdx] === null || String(row[idIdx]).trim() === '') continue;

          parsedRows.push({
            id: String(row[idIdx]).trim(),
            qrcode: qrcodeIdx !== -1 && row[qrcodeIdx] ? String(row[qrcodeIdx]).trim() : '',
            smsCode: smsCodeIdx !== -1 && row[smsCodeIdx] ? String(row[smsCodeIdx]).trim() : '',
            temqr: temqrIdx !== -1 && row[temqrIdx] ? String(row[temqrIdx]).trim() : '',
            activeCode: activeCodeIdx !== -1 && row[activeCodeIdx] ? String(row[activeCodeIdx]).trim() : ''
          });
        }

        if (parsedRows.length === 0) {
          alert('Không tìm thấy dòng dữ liệu tem nhãn hợp lệ nào!');
          return;
        }

        const formattedText = parsedRows.map(item => 
          `${item.id}\t${item.qrcode}\t${item.smsCode}\t${item.temqr}\t${item.activeCode}`
        ).join('\n');

        setMigrateForm(prev => ({
          ...prev,
          labelsText: formattedText,
          migrationSource: file.name
        }));

        alert(`Đọc thành công ${parsedRows.length} tem nhãn từ file Excel!`);
      } catch (err) {
        alert('Lỗi đọc file Excel: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleMapLabel = async () => {
    try {
      await api.mapLabel(selectedLabel._id, mapForm);
      setShowMapModal(false);
      loadLabels();
    } catch (err) { alert(err.message); }
  };

  // ── Mở modal Import Mã nội bộ cho Lô tem ──
  const handleOpenInternalCodeModal = (batch = null) => {
    setInternalImportError('');
    setInternalImportResult(null);
    setInternalCodeRows([]);
    setInternalCodeFileName('');
    setInternalCodeBatchId(batch?._id || '');
    setShowInternalCodeModal(true);
  };

  // ── Tải file Excel mẫu 3 cột (Cột 1: Serial, Cột 2: Mã nội bộ, Cột 3: Sản phẩm) ──
  const handleDownloadInternalCodeTemplate = async (targetBatchId) => {
    try {
      setDownloadingInternalTemplate(true);
      const batchObj = allBatchesForFilter.find(b => b._id === targetBatchId) || batches.find(b => b._id === targetBatchId);
      let templateRows = [];

      if (targetBatchId) {
        const batchLabels = await api.exportBatchLabels(targetBatchId);
        if (batchLabels && batchLabels.length > 0) {
          templateRows = batchLabels.map(lbl => ({
            'Serial': lbl.serialNumber,
            'Mã nội bộ': lbl.internalCode || lbl.ownerCode || '',
            'Sản phẩm': lbl.productId?.name || batchObj?.productId?.name || ''
          }));
        }
      }

      if (templateRows.length === 0) {
        templateRows = [
          { 'Serial': batchObj?.serialStart || '00306916', 'Mã nội bộ': '00066', 'Sản phẩm': batchObj?.productId?.name || 'Tên sản phẩm' },
          { 'Serial': batchObj?.serialEnd || '00306917', 'Mã nội bộ': '00067', 'Sản phẩm': batchObj?.productId?.name || 'Tên sản phẩm' }
        ];
      }

      const ws = XLSX.utils.json_to_sheet(templateRows);
      ws['!cols'] = [{ wch: 20 }, { wch: 22 }, { wch: 35 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Ma_Noi_Bo');
      const fileSuffix = batchObj?.batchCode ? `_lo_${batchObj.batchCode}` : '';
      XLSX.writeFile(wb, `Mau_Import_Ma_Noi_Bo${fileSuffix}.xlsx`);
    } catch (err) {
      alert('Lỗi tải file mẫu Mã nội bộ: ' + (err.message || err));
    } finally {
      setDownloadingInternalTemplate(false);
    }
  };

  // ── Đọc file Excel 3 cột (Cột 1: Serial, Cột 2: Mã nội bộ, Cột 3: Sản phẩm) ──
  const handleInternalCodeExcelUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInternalImportError('');
    setInternalImportResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });

        if (!jsonData || jsonData.length === 0) {
          setInternalImportError('File Excel không có dữ liệu!');
          return;
        }

        // Kiểm tra dòng đầu tiên là tiêu đề hay dữ liệu trực tiếp
        const firstRow = (jsonData[0] || []).map(cell => String(cell || '').trim());
        const firstRowUpper = firstRow.map(c => c.toUpperCase());
        const isHeaderRow = firstRowUpper.some(c =>
          c === 'STT' ||
          c.includes('SERIAL') ||
          c.includes('MÃ CHỐNG GIẢ') ||
          c.includes('MA CHONG GIA') ||
          c.includes('MÃ NỘI BỘ') ||
          c.includes('MA NOI BO') ||
          c.includes('SẢN PHẨM') ||
          c.includes('SAN PHAM') ||
          c.includes('CỘT 1') ||
          c.includes('COT 1')
        );

        let serialCol = 0;
        let internalCol = 1;
        let productCol = 2;
        let startIdx = 0;

        if (isHeaderRow) {
          startIdx = 1;
          // Nếu cột 0 là STT và không có header rõ ràng thì dịch sang cột 1, 2, 3
          if (firstRowUpper[0] === 'STT' && firstRow.length >= 4) {
            serialCol = 1;
            internalCol = 2;
            productCol = 3;
          }
          const foundSerialIdx = firstRowUpper.findIndex(c => c.includes('SERIAL') || c.includes('CHỐNG GIẢ') || c.includes('CHONG GIA') || c === 'CỘT 1' || c === 'COT 1');
          const foundInternalIdx = firstRowUpper.findIndex(c => c.includes('NỘI BỘ') || c.includes('NOI BO') || c.includes('SỞ HỮU') || c.includes('XÁC THỰC') || c === 'CỘT 2' || c === 'COT 2');
          const foundProductIdx = firstRowUpper.findIndex(c => c.includes('SẢN PHẨM') || c.includes('SAN PHAM') || c.includes('TÊN SP') || c === 'CỘT 3' || c === 'COT 3');

          if (foundSerialIdx !== -1) serialCol = foundSerialIdx;
          if (foundInternalIdx !== -1) internalCol = foundInternalIdx;
          else if (foundSerialIdx !== -1) internalCol = foundSerialIdx + 1;

          if (foundProductIdx !== -1) productCol = foundProductIdx;
          else if (foundInternalIdx !== -1) productCol = foundInternalIdx + 1;
        }

        const parsed = [];
        for (let i = startIdx; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;
          const serialVal = String(row[serialCol] ?? '').trim();
          const internalVal = String(row[internalCol] ?? '').trim();
          const productVal = String(row[productCol] ?? '').trim();
          if (!serialVal && !internalVal) continue;
          if (!serialVal) continue;
          parsed.push({
            serial: serialVal,
            internalCode: internalVal,
            productName: productVal
          });
        }

        if (parsed.length === 0) {
          setInternalImportError('Không tìm thấy dòng dữ liệu hợp lệ nào trong file Excel! Vui lòng kiểm tra Cột 1 (Serial), Cột 2 (Mã nội bộ), Cột 3 (Sản phẩm).');
          return;
        }

        setInternalCodeRows(parsed);
        setInternalCodeFileName(file.name);
      } catch (err) {
        setInternalImportError('Lỗi đọc file Excel: ' + (err.message || err));
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  // ── Gửi dữ liệu Import Mã nội bộ lên Server ──
  const handleSubmitInternalCodes = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setInternalImportError('');
    setInternalImportResult(null);

    if (!internalCodeBatchId) {
      setInternalImportError('Vui lòng chọn Lô tem cần import mã nội bộ!');
      return;
    }
    if (!internalCodeRows || internalCodeRows.length === 0) {
      setInternalImportError('Vui lòng chọn file Excel chứa dữ liệu Mã nội bộ (Cột 1: Serial, Cột 2: Mã nội bộ, Cột 3: Sản phẩm)!');
      return;
    }

    try {
      setImportingInternalCodes(true);
      const res = await api.importBatchInternalCodes(internalCodeBatchId, internalCodeRows);
      setInternalImportResult(res);
      loadBatches(curBatchPage.current, curSearch.current);
      if (activeTab === 'activate') loadLabels(curLabelPage.current, curSearch.current);
    } catch (err) {
      setInternalImportError(err.message || 'Lỗi khi import mã nội bộ cho lô tem');
    } finally {
      setImportingInternalCodes(false);
    }
  };

  // Mở modal Edit thông số sở hữu bằng quyền Admin
  const handleOpenEditOwner = (label) => {
    setOwnerTargetLabel(label);
    setOwnerModalError('');
    setOwnerForm({
      ownerName: label.ownerInfo?.name || '',
      ownerAddress: label.ownerInfo?.address || '',
      ownerPhone: label.ownerInfo?.phone || '',
      activatedSerial: label.ownerInfo?.activatedSerial || label.serialNumber || '',
      ownerCode: label.ownerCode || label.internalCode || '',
      internalCode: label.internalCode || label.ownerCode || ''
    });
    setShowOwnerModal(true);
  };

  // Lưu thông số sở hữu tem (Admin)
  const handleSaveOwner = async (clear = false) => {
    if (!ownerTargetLabel) return;
    setSavingOwner(true);
    setOwnerModalError('');
    try {
      if (clear) {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa toàn bộ thông tin sở hữu của tem ${ownerTargetLabel.serialNumber} không?`)) {
          setSavingOwner(false);
          return;
        }
        await api.updateLabelOwner(ownerTargetLabel._id, { clearOwnerInfo: true });
      } else {
        await api.updateLabelOwner(ownerTargetLabel._id, {
          ownerName: ownerForm.ownerName,
          ownerAddress: ownerForm.ownerAddress,
          ownerPhone: ownerForm.ownerPhone,
          activatedSerial: ownerForm.activatedSerial,
          ownerCode: ownerForm.ownerCode || ownerForm.internalCode,
          internalCode: ownerForm.internalCode || ownerForm.ownerCode
        });
      }
      setShowOwnerModal(false);
      loadLabels();
    } catch (err) {
      setOwnerModalError(err.message || 'Lỗi cập nhật thông số sở hữu');
    } finally {
      setSavingOwner(false);
    }
  };

  const handleLabelStatusToggle = async (label) => {
    const newStatus = label.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try { await api.updateLabelStatus(label._id, { status: newStatus }); loadLabels(); }
    catch (err) { alert(err.message); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

  const getStatusBadge = (status) => {
    switch(status) {
      case 'ACTIVE': return 'badge-success';
      case 'INACTIVE': return 'badge-neutral';
      case 'SCANNED': return 'badge-info';
      case 'EXPIRED': return 'badge-danger';
      default: return 'badge-neutral';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'ACTIVE': return 'Hoạt động';
      case 'INACTIVE': return 'Chưa kích hoạt';
      case 'SCANNED': return 'Đã quét';
      case 'EXPIRED': return 'Hết hạn';
      default: return status;
    }
  };

  const tabs = [
    { id: 'batches', label: 'Quản lý Lô tem', icon: Tag },
    { id: 'activate', label: 'Kích hoạt & Gắn Serial', icon: Link2 },
    { id: 'migrate', label: 'Mã nội bộ', icon: Upload },
    { id: 'renew', label: 'Gia hạn lô tem', icon: Clock },
  ];

  const selectedProduct = products.find(p => p._id === bulkForm.productId);
  const productDistributors = selectedProduct?.distributors || [];

  return (
    <div className="labels-page">

      {/* ── Toast thành công sau khi tạo lô tem ── */}
      {createSuccessToast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: '#fff', borderRadius: '12px', padding: '16px 22px',
          boxShadow: '0 8px 32px rgba(16,185,129,0.4)',
          display: 'flex', alignItems: 'center', gap: '12px',
          animation: 'slideInRight 0.3s ease',
          minWidth: '300px', maxWidth: '400px'
        }}>
          <CheckCircle size={22} style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
              ✅ Tạo lô tem thành công!
            </div>
            <div style={{ fontSize: '0.82rem', opacity: 0.9, marginTop: '3px' }}>
              Mã lô: <strong>{createSuccessToast.batchCode}</strong> — {createSuccessToast.totalLabels} tem
            </div>
            <div style={{ fontSize: '0.78rem', opacity: 0.75, marginTop: '2px' }}>
              Lô tem đã xuất hiện đầu danh sách bên dưới ✓
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1>Quản lý Tem nhãn</h1>
          <p>Khởi tạo, theo dõi và quản lý lô tem - serial</p>
        </div>
        {(activeTab === 'batches' || activeTab === 'activate') && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {activeTab === 'batches' && batches.some(b => b.theme === 'functional_food' || b.theme === 'food') && (
              <button
                className="btn btn-ghost"
                onClick={() => {
                  const tpcnBatch = batches.find(b => b.theme === 'functional_food' || b.theme === 'food');
                  if (tpcnBatch) handleExportDistributionBatch(tpcnBatch);
                }}
                disabled={Boolean(exportingDistBatchId)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(245, 158, 11, 0.45)', color: '#fbbf24' }}
                title="Xuất dữ liệu phân phối Điểm bán / Serial / Sản phẩm (Thực phẩm chức năng)"
              >
                <FileSpreadsheet size={16} />
                {exportingDistBatchId ? 'Đang xuất phân phối...' : 'Xuất dữ liệu Điểm bán / Serial / SP'}
              </button>
            )}
            <button className="btn btn-ghost" onClick={() => handleOpenInternalCodeModal(null)} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(16, 185, 129, 0.45)', color: '#10b981' }} title="Import file Excel 3 cột: Serial | Mã nội bộ | Sản phẩm cho lô tem">
              <Upload size={16} /> Import mã nội bộ
            </button>
            <button className="btn btn-ghost" onClick={() => { setModalError(null); setBulkForm({ batchId: '', serialStart: '', serialEnd: '', productId: '', distributorIdx: '', distributorName: '', distributorAddress: '' }); setShowBulkMapModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <Link2 size={16} /> Gắn kết hàng loạt
            </button>
            {activeTab === 'batches' && isAdmin && (
              <>
                <button className="btn btn-ghost" onClick={handleFixEncryption} style={{ border: '1px solid rgba(99, 102, 241, 0.3)', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '6px' }} title="Khắc phục mã hóa đuôi scan cho toàn bộ tem">
                  <ShieldCheck size={16}/> Khắc phục mã hóa QR
                </button>
                <button className="btn btn-ghost" onClick={handleCleanupOrphans} style={{ border: '1px solid rgba(234, 179, 8, 0.3)', color: '#eab308', display: 'flex', alignItems: 'center', gap: '6px' }} title="Dọn sạch tem nhãn orphan không thuộc lô nào — khắc phục lỗi serial trùng">
                  <RefreshCw size={16}/> Dọn orphan serial
                </button>
                <button className="btn btn-ghost" onClick={handleClearAllLabels} style={{ border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }} title="Reset dữ liệu tem về 0">
                  <Trash2 size={16}/> Reset/Clear toàn bộ tem
                </button>
              </>
            )}
            {activeTab === 'batches' && (
              <button className="btn btn-primary" onClick={openCreateBatchModal}>
                <Plus size={18}/> Tạo lô tem mới
              </button>
            )}
          </div>
        )}
        {activeTab === 'migrate' && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn btn-ghost" onClick={() => { setModalError(null); setMigrateForm({ batchCode: '', migrationSource: '', migrationOldLink: '', productId: '', templateId: '', theme: 'default', labelsText: '', enterpriseId: isAdmin ? '' : (enterpriseId || '') }); setShowMigrateModal(true); }} style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
              <Upload size={16}/> Đồng bộ tem hệ thống cũ
            </button>
            <button className="btn btn-primary" onClick={() => handleOpenInternalCodeModal(null)}>
              <FileSpreadsheet size={18}/> Import mã nội bộ theo Lô tem
            </button>
          </div>
        )}
      </div>

      <div className="tabs">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button 
              key={tab.id} 
              className={`tab ${activeTab === tab.id ? 'active' : ''}`} 
              onClick={() => {
                setSearch('');
                if (tab.id === 'batches') navigate('/labels');
                else if (tab.id === 'activate') navigate('/labels/activate');
                else if (tab.id === 'migrate') navigate('/labels/migrate');
                else if (tab.id === 'renew') navigate('/labels/renew');
              }}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="filter-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          {/* Universal Search Input */}
          <div className="search-box" style={{ flex: '1 1 300px', minWidth: '240px' }}>
            <Search size={18} className="search-icon" />
            <input
              className="input"
              placeholder={activeTab === 'batches' ? 'Tìm nhanh: Mã lô, Tên sản phẩm, Serial, Ghi chú...' : 'Tìm nhanh: Mã Serial, Mã lô, Tên sản phẩm, Điểm bán...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button type="button" className="search-clear-btn" onClick={() => setSearch('')} title="Xóa tìm kiếm">
                <X size={15} />
              </button>
            )}
          </div>

          {/* Quick Dropdown Filters */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', flex: '2 1 auto' }}>
            {/* Lọc theo Sản phẩm */}
            <div className={`filter-select-wrapper ${filterProduct ? 'is-active' : ''}`} style={{ minWidth: '180px' }}>
              <Package size={16} className="filter-icon" />
              <select
                className="filter-select"
                value={filterProduct}
                onChange={e => setFilterProduct(e.target.value)}
                title="Lọc theo sản phẩm"
              >
                <option value="">Tất cả sản phẩm</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="filter-arrow" />
            </div>

            {/* Lọc theo Lô tem (chỉ hiện trong tab activate) */}
            {activeTab === 'activate' && (
              <div className={`filter-select-wrapper ${filterBatch ? 'is-active' : ''}`} style={{ minWidth: '160px' }}>
                <Tag size={15} className="filter-icon" />
                <select
                  className="filter-select"
                  value={filterBatch}
                  onChange={e => setFilterBatch(e.target.value)}
                  title="Lọc theo lô tem"
                >
                  <option value="">Tất cả lô tem</option>
                  {allBatchesForFilter.map(b => (
                    <option key={b._id} value={b._id}>
                      {b.batchCode}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="filter-arrow" />
              </div>
            )}

            {/* Lọc theo Trạng thái */}
            <div className={`filter-select-wrapper ${filterStatus ? 'is-active' : ''}`} style={{ minWidth: '160px' }}>
              <Filter size={15} className="filter-icon" />
              <select
                className="filter-select"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                title="Lọc theo trạng thái"
              >
                <option value="">Tất cả trạng thái</option>
                {activeTab === 'batches' ? (
                  <>
                    <option value="ACTIVE">Đang hoạt động</option>
                    <option value="INACTIVE">Tạm dừng</option>
                    <option value="EXPIRED">Đã hết hạn</option>
                  </>
                ) : (
                  <>
                    <option value="SCANNED">Đã quét</option>
                    <option value="ACTIVE">Hoạt động / Chưa quét</option>
                    <option value="INACTIVE">Chưa kích hoạt</option>
                  </>
                )}
              </select>
              <ChevronDown size={14} className="filter-arrow" />
            </div>

            {/* Lọc theo Doanh nghiệp (cho ADMIN) */}
            {isAdmin && enterprises.length > 0 && (
              <div className={`filter-select-wrapper ${filterEnterprise ? 'is-active' : ''}`} style={{ minWidth: '180px' }}>
                <Building2 size={15} className="filter-icon" />
                <select
                  className="filter-select"
                  value={filterEnterprise}
                  onChange={e => setFilterEnterprise(e.target.value)}
                  title="Lọc theo doanh nghiệp"
                >
                  <option value="">Tất cả doanh nghiệp</option>
                  {enterprises.map(ent => (
                    <option key={ent._id} value={ent._id}>
                      {ent.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="filter-arrow" />
              </div>
            )}

            {/* Nút Xóa lọc nếu đang có bất kỳ điều kiện lọc nào */}
            {(search || filterProduct || filterBatch || filterStatus || filterEnterprise) && (
              <button
                type="button"
                className="filter-reset-btn"
                onClick={handleResetFilters}
                title="Đặt lại toàn bộ bộ lọc"
              >
                <RotateCcw size={13} />
                <span>Đặt lại</span>
              </button>
            )}
          </div>

          {/* Action: Xuất Excel (tab activate) */}
          {activeTab === 'activate' && (
            <button
              className="btn btn-primary"
              onClick={handleDownloadFilteredLabels}
              disabled={exportingLabels}
              style={{ height: '40px', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
            >
              {exportingLabels ? (
                <>
                  <div className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div>
                  Đang xuất...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Xuất Excel
                </>
              )}
            </button>
          )}
        </div>

        {/* Thanh trạng thái bộ lọc & tổng kết quả */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '0.82rem', color: 'var(--color-text-secondary)', borderTop: '1px solid var(--color-border)', paddingTop: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {activeTab === 'batches'
                ? `📊 Tổng: ${batchPagination.total || batches.length} lô tem`
                : `📊 Tổng: ${labelPagination.total || labels.length} tem nhãn`}
            </span>
            {(search || filterProduct || filterBatch || filterStatus || filterEnterprise) && (
              <>
                <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>• Đang lọc theo:</span>
                {search && (
                  <span className="filter-badge-pill">
                    Từ khóa: "{search}"
                    <span className="close-icon" onClick={() => setSearch('')} title="Bỏ lọc từ khóa"><X size={12} /></span>
                  </span>
                )}
                {filterProduct && (
                  <span className="filter-badge-pill">
                    Sản phẩm: {products.find(p => p._id === filterProduct)?.name || filterProduct}
                    <span className="close-icon" onClick={() => setFilterProduct('')} title="Bỏ lọc sản phẩm"><X size={12} /></span>
                  </span>
                )}
                {filterBatch && (
                  <span className="filter-badge-pill">
                    Lô: {allBatchesForFilter.find(b => b._id === filterBatch)?.batchCode || filterBatch}
                    <span className="close-icon" onClick={() => setFilterBatch('')} title="Bỏ lọc lô tem"><X size={12} /></span>
                  </span>
                )}
                {filterStatus && (
                  <span className="filter-badge-pill">
                    Trạng thái: {getStatusLabel(filterStatus)}
                    <span className="close-icon" onClick={() => setFilterStatus('')} title="Bỏ lọc trạng thái"><X size={12} /></span>
                  </span>
                )}
                {filterEnterprise && (
                  <span className="filter-badge-pill">
                    Doanh nghiệp: {enterprises.find(e => e._id === filterEnterprise)?.name || filterEnterprise}
                    <span className="close-icon" onClick={() => setFilterEnterprise('')} title="Bỏ lọc doanh nghiệp"><X size={12} /></span>
                  </span>
                )}
              </>
            )}
          </div>
          <span style={{ fontStyle: 'italic', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            💡 Hỗ trợ tìm kiếm thông minh đa trường: Serial, Mã lô, Tên sản phẩm, Điểm bán
          </span>
        </div>
      </div>

      {/* ── Renew Tab: Banner thống kê & bộ lọc ── */}
      {activeTab === 'renew' && (
        <div style={{ marginBottom: '20px' }}>
          {/* Banner tổng quan */}
          <div style={{
            display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px'
          }}>
            <div style={{
              flex: '1', minWidth: '180px',
              background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))',
              border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: '14px'
            }}>
              <div style={{ fontSize: '2rem' }}>⚠️</div>
              <div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444', lineHeight: 1 }}>{expiredCount}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '3px' }}>Lô đã hết hạn</div>
              </div>
            </div>
            <div style={{
              flex: '1', minWidth: '180px',
              background: 'linear-gradient(135deg, rgba(234,179,8,0.15), rgba(234,179,8,0.05))',
              border: '1px solid rgba(234,179,8,0.3)', borderRadius: '12px', padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: '14px'
            }}>
              <div style={{ fontSize: '2rem' }}>⏰</div>
              <div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#eab308', lineHeight: 1 }}>{expiringSoonCount}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '3px' }}>Sắp hết hạn (30 ngày)</div>
              </div>
            </div>
            <div style={{
              flex: '2', minWidth: '240px',
              background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: '12px', padding: '14px 20px',
              display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--color-text-muted)'
            }}>
              <span style={{ fontSize: '1.4rem' }}>💡</span>
              <span>Chọn lô tem hết hạn và nhấn nút <strong style={{ color: 'var(--color-primary)' }}>Gia hạn</strong> để gia hạn thêm thời gian. Lô tem sẽ tự động chuyển về trạng thái <strong>Hoạt động</strong>.</span>
            </div>
          </div>
          {/* Bộ lọc tab renew */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[['expired', '🔴 Đã hết hạn'], ['expiringSoon', '🟡 Sắp hết hạn (30 ngày)'], ['all', '📋 Tất cả lô tem']].map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => {
                  setRenewFilterMode(mode);
                  const filterMap = { expired: { expired: 'true' }, expiringSoon: { expiringSoon: '30' }, all: {} };
                  loadBatches(1, curSearch.current, filterMap[mode] || {});
                }}
                style={{
                  padding: '7px 16px', borderRadius: '8px', fontSize: '0.83rem', fontWeight: 600, cursor: 'pointer',
                  border: renewFilterMode === mode ? '2px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.1)',
                  background: renewFilterMode === mode ? 'rgba(99,102,241,0.18)' : 'transparent',
                  color: renewFilterMode === mode ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  transition: 'all 0.2s'
                }}
              >{label}</button>
            ))}
          </div>
        </div>
      )}

      {/* Batches Tab */}
      {(activeTab === 'batches' || activeTab === 'renew') && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Mã lô</th>
                <th>Sản phẩm</th>
                {activeTab !== 'renew' && <th>Giao diện (Theme)</th>}
                <th>Số lượng</th>
                {activeTab !== 'renew' && <th>Tem đã in</th>}
                <th>Serial</th>
                {activeTab !== 'renew' && <th>Ngày tạo</th>}
                <th>Hết hạn</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={activeTab !== 'renew' ? 10 : 9}><div className="loading-overlay"><div className="loading-spinner"></div></div></td></tr>
              ) : batches.length === 0 ? (
                <tr><td colSpan={activeTab !== 'renew' ? 10 : 9}><div className="empty-state"><Tag size={40}/><h3>Chưa có lô tem nào</h3></div></td></tr>
              ) : (
                batches.map(batch => (
                  <tr key={batch._id}>
                    <td><span className="batch-code">{batch.batchCode}</span></td>
                    <td>{batch.productId?.name || <span className="text-muted">Chưa gắn</span>}</td>
                    {activeTab !== 'renew' && (
                      <td>
                        <span className="badge badge-info" style={{ fontWeight: 600, fontSize: '0.75rem', padding: '4px 8px' }}>
                          {getThemeLabel(batch.theme)}
                        </span>
                      </td>
                    )}
                    <td><strong>{batch.totalLabels}</strong></td>
                    {activeTab !== 'renew' && (
                      <td>
                        {batch.isPrinted ? (
                          <span className="badge badge-success" style={{ fontWeight: 600, fontSize: '0.75rem', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle size={12} /> Đã in ({batch.printedCount || batch.totalLabels})
                          </span>
                        ) : (
                          <span className="badge" style={{ background: 'rgba(148,163,184,0.15)', color: '#94a3b8', fontSize: '0.75rem', padding: '4px 8px' }}>
                            Chưa in
                          </span>
                        )}
                      </td>
                    )}
                    <td><span className="serial-range">{batch.serialStart} → {batch.serialEnd}</span></td>
                    {activeTab !== 'renew' && <td>{formatDate(batch.createdDate || batch.createdAt)}</td>}
                    <td className={new Date(batch.expiryDate) < new Date() ? 'text-danger' : ''}>{formatDate(batch.expiryDate)}</td>
                    <td>
                      <span className={`badge badge-dot ${getStatusBadge(batch.status)}`}>{getStatusLabel(batch.status)}</span>
                      {batch.isMigrated && <span className="badge badge-info" style={{ marginLeft: 4 }}>Di trú</span>}
                    </td>
                    <td>
                      <div className="action-buttons">
                        {activeTab !== 'renew' && (
                          <>
                            <button className="btn btn-sm btn-ghost" onClick={() => handleToggleStatus(batch)} title={batch.status === 'ACTIVE' ? 'Tắt' : 'Bật'}>
                              {batch.status === 'ACTIVE' ? <ToggleRight size={18} className="text-success"/> : <ToggleLeft size={18}/>}
                            </button>
                            <button
                              className="btn btn-sm btn-ghost"
                              onClick={() => handleTogglePrinted(batch)}
                              title={batch.isPrinted ? "Đã in (Bấm để hủy đánh dấu)" : "Bấm để đánh dấu đã in ấn"}
                              style={{ color: batch.isPrinted ? '#10b981' : '#94a3b8' }}
                            >
                              <Printer size={15} />
                            </button>
                            <button className="btn btn-sm btn-ghost" onClick={() => {
                              const targetEntId = batch.enterpriseId?._id || batch.enterpriseId;
                              if (targetEntId) loadProducts(targetEntId);
                              setSelectedBatch(batch);
                              setMapForm({
                                productId: batch.productId?._id || batch.productId || '',
                                theme: batch.theme || 'default',
                                distributorIdx: '',
                                distributorName: '',
                                distributorAddress: '',
                                customDomain: batch.customDomain || '',
                                serialStart: batch.serialStart || '',
                                serialEnd: batch.serialEnd || ''
                              });
                              setShowMapModal(true);
                            }} title="Chỉnh sửa giao diện (Theme) & Gắn sản phẩm">
                              <Edit size={14} className="text-primary"/>
                            </button>
                            {(batch.theme === 'functional_food' || batch.theme === 'food') && (
                              <>
                                <button className="btn btn-sm btn-ghost" onClick={() => {
                                  setModalError(null);
                                  const targetEntId = batch.enterpriseId?._id || batch.enterpriseId;
                                  if (targetEntId) loadProducts(targetEntId);
                                  setBulkForm({
                                    batchId: batch._id,
                                    serialStart: batch.serialStart,
                                    serialEnd: batch.serialEnd,
                                    productId: batch.productId?._id || batch.productId || '',
                                    distributorIdx: '',
                                    distributorName: '',
                                    distributorAddress: ''
                                  });
                                  setShowBulkMapModal(true);
                                }} title="Gắn Serial cho Điểm bán (Thực phẩm chức năng)">
                                  <MapPin size={14} className="text-primary"/>
                                </button>
                                <button
                                  className="btn btn-sm btn-ghost"
                                  onClick={() => handleExportDistributionBatch(batch)}
                                  title="Xuất dữ liệu phân phối (Điểm bán / Serial / Sản phẩm)"
                                  disabled={exportingDistBatchId === batch._id}
                                  style={{ color: '#f59e0b' }}
                                >
                                  {exportingDistBatchId === batch._id ? (
                                    <div className="loading-spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></div>
                                  ) : (
                                    <FileSpreadsheet size={14} />
                                  )}
                                </button>
                              </>
                            )}
                            <button
                              className="btn btn-sm btn-ghost"
                              onClick={() => handleOpenInternalCodeModal(batch)}
                              title={`Import mã nội bộ cho lô "${batch.batchCode}" (Excel 3 cột: Serial | Mã nội bộ | Sản phẩm)`}
                              style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid rgba(16, 185, 129, 0.3)', padding: '3px 7px', borderRadius: 6, fontSize: '0.73rem', fontWeight: 600 }}
                            >
                              <Upload size={13} />
                              <span>Mã nội bộ</span>
                            </button>
                            <button className="btn btn-sm btn-ghost" onClick={() => handleDownloadBatch(batch)} title="Tải dữ liệu tem (Excel)" disabled={exportingBatchId === batch._id}>
                              {exportingBatchId === batch._id ? (
                                <div className="loading-spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></div>
                              ) : (
                                <Download size={14} className="text-success" />
                              )}
                            </button>
                            {isAdmin && (
                              <button className="btn btn-sm btn-ghost" onClick={() => handleDeleteBatch(batch)} title="Xóa lô tem">
                                <Trash2 size={14} style={{ color: '#ef4444' }} />
                              </button>
                            )}
                          </>
                        )}
                        {activeTab === 'renew' && (
                          <button
                            className="btn btn-sm"
                            onClick={() => {
                              setSelectedBatch(batch);
                              setRenewMode('months');
                              setRenewMonths(12);
                              setRenewNewDate('');
                              setShowRenewModal(true);
                            }}
                            title="Gia hạn lô tem này"
                            style={{
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              color: '#fff', border: 'none', borderRadius: '7px',
                              padding: '5px 14px', fontSize: '0.82rem', fontWeight: 700,
                              display: 'flex', alignItems: 'center', gap: '5px',
                              cursor: 'pointer', whiteSpace: 'nowrap'
                            }}
                          >
                            <RefreshCw size={13}/> Gia hạn
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}


      {/* Activate Tab - Individual Labels */}
      {activeTab === 'activate' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Serial</th>
                <th>Lô tem</th>
                <th>Sản phẩm</th>
                <th>Điểm bán</th>
                <th>Mã sở hữu</th>
                <th>Trạng thái</th>
                <th>Lượt quét</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8}><div className="loading-overlay"><div className="loading-spinner"></div></div></td></tr>
              ) : labels.length === 0 ? (
                <tr><td colSpan={8}><div className="empty-state"><Tag size={40}/><h3>Chưa có tem nào</h3></div></td></tr>
              ) : (
                labels.map(label => (
                  <tr key={label._id}>
                    <td><span className="serial-number">{label.serialNumber}</span></td>
                    <td>{label.batchId?.batchCode || '—'}</td>
                    <td>{label.productId?.name || <span className="text-muted">Chưa gắn</span>}</td>
                    <td>
                      {label.ownerInfo?.name || label.distributorName ? (
                        <div>
                          <div style={{ fontWeight: 600 }}>{label.ownerInfo?.name || label.distributorName}</div>
                          {(label.ownerInfo?.address || label.distributorAddress) && (
                            <div style={{ fontSize: '0.73rem', color: 'var(--color-text-muted)' }}>
                              {label.ownerInfo?.address || label.distributorAddress}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      {label.internalCode || label.ownerCode ? (
                        <div>
                          <strong style={{ color: '#059669', fontSize: '0.86rem' }}>{label.internalCode || label.ownerCode}</strong>
                          {label.internalCode && (
                            <span className="badge badge-info" style={{ marginLeft: 6, fontSize: '0.68rem', padding: '1px 5px' }}>Mã nội bộ</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                      {label.ownerInfo?.name && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <span style={{ color: 'var(--color-accent)' }}>👤</span>
                          <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={`${label.ownerInfo.name} - ${label.ownerInfo.phone || ''}`}>
                            {label.ownerInfo.name}
                          </span>
                        </div>
                      )}
                    </td>
                    <td><span className={`badge badge-dot ${getStatusBadge(label.status)}`}>{getStatusLabel(label.status)}</span></td>
                    <td>{label.scanCount || 0}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn btn-sm btn-ghost" onClick={() => handleLabelStatusToggle(label)} title="Bật/Tắt">
                          {label.status === 'ACTIVE' ? <ToggleRight size={18} className="text-success"/> : <ToggleLeft size={18}/>}
                        </button>
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => handleOpenEditOwner(label)}
                          title="Edit thông số sở hữu (Quyền Admin)"
                          style={{ color: label.ownerInfo?.name || label.ownerCode ? '#059669' : 'inherit' }}
                        >
                          <UserCheck size={16} />
                        </button>
                        <button className="btn btn-sm btn-ghost" onClick={() => {
                          setModalError(null);
                          setBulkForm({
                            batchId: label.batchId?._id || label.batchId || '',
                            serialStart: label.serialNumber,
                            serialEnd: label.serialNumber,
                            productId: label.productId?._id || label.productId || '',
                            distributorIdx: '',
                            distributorName: label.distributorName || '',
                            distributorAddress: label.distributorAddress || '',
                            ownerCode: label.ownerCode || ''
                          });
                          setShowBulkMapModal(true);
                        }} title="Gắn SP/Điểm bán/Mã sở hữu">
                          <Link2 size={14}/>
                        </button>
                        <a href={`/scan/${label.serialNumber}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-ghost" title="Mở link quét">
                          <ExternalLink size={14}/>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Mã nội bộ Tab */}
      {activeTab === 'migrate' && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSpreadsheet size={20} style={{ color: '#10b981' }} />
              Import Mã nội bộ cho Lô tem (Giao diện Bảo hành)
            </h3>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => handleDownloadInternalCodeTemplate(internalCodeBatchId)}
              disabled={downloadingInternalTemplate}
              style={{ border: '1px solid rgba(16, 185, 129, 0.4)', color: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Download size={15} />
              {downloadingInternalTemplate ? 'Đang tạo file mẫu...' : 'Tải file Excel mẫu 3 cột theo Lô'}
            </button>
          </div>

          <div className="migrate-guide">
            <p style={{ marginBottom: 14 }}>
              Chức năng <strong>Import mã nội bộ</strong> dùng để gắn <strong>Mã nội bộ (Mã sở hữu sản phẩm)</strong> và <strong>Sản phẩm</strong> vào từng con tem đã tạo trong Lô tem theo đúng cấu trúc 3 cột Excel:
            </p>
            <div className="guide-steps" style={{ marginBottom: 20 }}>
              <div className="guide-step">
                <span className="step-num">1</span>
                <span><strong>Cột 1 (Serial / Mã chống giả)</strong>: Trùng với mã Serial trong data lô tem đã tải về để in (VD: <code>00306916</code>).</span>
              </div>
              <div className="guide-step">
                <span className="step-num">2</span>
                <span><strong>Cột 2 (Mã nội bộ)</strong>: Mã xác thực / mã sở hữu sản phẩm nội bộ của khách hàng cùng hàng với Cột 1 (VD: <code>00066</code>).</span>
              </div>
              <div className="guide-step">
                <span className="step-num">3</span>
                <span><strong>Cột 3 (Sản phẩm)</strong>: Tên sản phẩm (hoặc mã SKU) tương ứng để gắn tự động vào con tem.</span>
              </div>
            </div>

            {internalImportError && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: 12, marginBottom: 16,
                borderRadius: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.25)'
              }}>
                <XCircle size={18} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.9rem' }}>{internalImportError}</span>
              </div>
            )}

            {internalImportResult && (
              <div style={{
                padding: '14px 16px', marginBottom: 16, borderRadius: 10,
                backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#10b981'
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={18} />
                  <span>{internalImportResult.message || 'Import mã nội bộ thành công!'}</span>
                </div>
                {internalImportResult.data && (
                  <div style={{ fontSize: '0.84rem', marginTop: 6, color: 'var(--color-text-secondary)' }}>
                    • Đã khớp và cập nhật: <strong>{internalImportResult.data.updatedCount}</strong> / {internalImportResult.data.totalRows} dòng
                    {' | '}Đã gắn sản phẩm (Cột 3): <strong>{internalImportResult.data.productMatchedCount || 0}</strong> tem
                    {internalImportResult.data.unmatchedSerialsCount > 0 && (
                      <div style={{ color: '#fbbf24', marginTop: 4 }}>
                        ⚠️ Có {internalImportResult.data.unmatchedSerialsCount} serial không nằm trong lô tem này: {internalImportResult.data.unmatchedSerials?.slice(0, 10).join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', alignItems: 'end', marginBottom: '16px' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>1. Chọn Lô tem cần Import Mã nội bộ *</label>
                <select
                  className="input select"
                  value={internalCodeBatchId}
                  onChange={e => {
                    setInternalCodeBatchId(e.target.value);
                    setInternalImportResult(null);
                  }}
                >
                  <option value="">-- Chọn lô tem --</option>
                  {(allBatchesForFilter.length > 0 ? allBatchesForFilter : batches).map(b => (
                    <option key={b._id} value={b._id}>
                      {b.batchCode} ({b.totalLabels} tem: {b.serialStart} → {b.serialEnd}) {b.productId?.name ? `- ${b.productId.name}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>2. Tải lên File Excel 3 cột (.xlsx, .xls, .csv) *</label>
                <label style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '10px 14px', borderRadius: 8, border: '1.5px dashed rgba(16, 185, 129, 0.5)',
                  backgroundColor: 'rgba(16, 185, 129, 0.06)', color: '#10b981', fontWeight: 600,
                  cursor: 'pointer', fontSize: '0.88rem'
                }}>
                  <Upload size={16} />
                  <span>{internalCodeFileName ? `Đã chọn: ${internalCodeFileName} (${internalCodeRows.length} dòng)` : 'Chọn file Excel (Serial | Mã nội bộ | Sản phẩm)'}</span>
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={handleInternalCodeExcelUpload} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            {internalCodeRows.length > 0 && (
              <div style={{ marginTop: 14, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text-primary)' }}>
                    📋 Xem trước dữ liệu đọc từ Excel ({internalCodeRows.length} dòng):
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => { setInternalCodeRows([]); setInternalCodeFileName(''); }}
                    style={{ color: '#f87171', fontSize: '0.78rem' }}
                  >
                    Xóa file đã chọn
                  </button>
                </div>
                <div className="table-container" style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 8 }}>
                  <table className="table" style={{ fontSize: '0.84rem' }}>
                    <thead>
                      <tr>
                        <th style={{ width: 60 }}>#</th>
                        <th>Cột 1: Serial (Mã chống giả)</th>
                        <th>Cột 2: Mã nội bộ (Mã sở hữu SP)</th>
                        <th>Cột 3: Sản phẩm</th>
                      </tr>
                    </thead>
                    <tbody>
                      {internalCodeRows.slice(0, 50).map((r, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td><span className="serial-number">{r.serial}</span></td>
                          <td><strong style={{ color: '#10b981' }}>{r.internalCode || '—'}</strong></td>
                          <td>{r.productName || <span className="text-muted">Giữ nguyên theo lô</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {internalCodeRows.length > 50 && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                    ... Đang hiển thị 50 dòng đầu tiên trên tổng số {internalCodeRows.length} dòng.
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmitInternalCodes}
                disabled={importingInternalCodes || !internalCodeBatchId || internalCodeRows.length === 0}
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
              >
                <Upload size={16} />
                {importingInternalCodes ? 'Đang Import Mã nội bộ...' : `Thực hiện Import Mã nội bộ (${internalCodeRows.length} tem)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {activeTab === 'batches' && batchPagination.totalPages > 1 && (
        <Pagination
          page={batchPagination.page}
          totalPages={batchPagination.totalPages}
          onPageChange={(newPage) => setBatchPagination(prev => ({ ...prev, page: newPage }))}
        />
      )}
      {activeTab === 'activate' && labelPagination.totalPages > 1 && (
        <Pagination
          page={labelPagination.page}
          totalPages={labelPagination.totalPages}
          onPageChange={(newPage) => setLabelPagination(prev => ({ ...prev, page: newPage }))}
        />
      )}

      {/* Create Batch Modal */}
      {showCreateBatch && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCreateBatch(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Tạo lô tem mới</h3>
              <button className="btn-icon" onClick={() => setShowCreateBatch(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateBatch}>
              <div className="modal-body">
                {modalError && (
                  <div className="modal-error animate-fade-in" style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: 12, marginBottom: 16,
                    borderRadius: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)'
                  }}>
                    <XCircle size={18} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.9rem' }}>{modalError}</span>
                  </div>
                )}
                {isAdmin && (
                  <div className="input-group">
                    <label>Doanh nghiệp sở hữu *</label>
                    <select
                      className="input select"
                      value={batchForm.enterpriseId}
                      onChange={e => {
                        const newEntId = e.target.value;
                        setBatchForm({...batchForm, enterpriseId: newEntId, productId: '', templateId: ''});
                        if (newEntId) {
                          loadProducts(newEntId);
                        }
                      }}
                      required
                    >
                      <option value="">-- Chọn doanh nghiệp --</option>
                      {enterprises.map(ent => (
                        <option key={ent._id} value={ent._id}>{ent.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="form-row">
                  <div className="input-group"><label>Mã lô *</label><input className="input" value={batchForm.batchCode} onChange={e => setBatchForm({...batchForm, batchCode: e.target.value})} required placeholder="VD: VH-2024-003" /></div>
                  <div className="input-group"><label>Prefix Serial (Tùy chọn)</label><input className="input" value={batchForm.prefix} onChange={e => setBatchForm({...batchForm, prefix: e.target.value.trim()})} placeholder="Để trống hoặc gõ Prefix nếu cần" /></div>
                </div>
                <div className="input-group" style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)', marginBottom: '16px' }}>
                  <label style={{ fontWeight: 600, color: '#4f46e5', marginBottom: '8px', display: 'block' }}>Quy tắc sinh mã Serial</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input 
                        type="radio" 
                        name="serialType" 
                        value="GLOBAL_SEQUENTIAL" 
                        checked={batchForm.serialType === 'GLOBAL_SEQUENTIAL'} 
                        onChange={e => setBatchForm({...batchForm, serialType: e.target.value})} 
                      />
                      <span><strong>🔢 Số nhảy nối tiếp liên tục toàn hệ thống (Khuyên dùng)</strong> - Không phân biệt NSX/lô tem</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input 
                        type="radio" 
                        name="serialType" 
                        value="RANDOM_ALPHANUMERIC" 
                        checked={batchForm.serialType === 'RANDOM_ALPHANUMERIC'} 
                        onChange={e => setBatchForm({...batchForm, serialType: e.target.value})} 
                      />
                      <span><strong>🛡️ Mã ngẫu nhiên Chữ + Số bảo mật</strong> - Mã hóa bảo mật độc bản</span>
                    </label>
                  </div>
                  {batchForm.serialType === 'GLOBAL_SEQUENTIAL' && (
                    <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed rgba(99, 102, 241, 0.2)', fontSize: '0.85rem', color: '#6366f1' }}>
                      ✨ Dải Serial nối tiếp dự kiến: <strong>{batchForm.prefix}{nextSerialInfo?.nextSerial || '00000001'}</strong> ➔ <strong>{batchForm.prefix}{String((nextSerialInfo?.nextStartNum || 1) + (batchForm.totalLabels || 0) - 1).padStart(8, '0')}</strong>
                    </div>
                  )}
                </div>
                <div className="form-row">
                  <div className="input-group"><label>Số lượng tem (Tối đa 500,000) *</label><input className="input" type="number" min={1} max={500000} value={batchForm.totalLabels} onChange={e => setBatchForm({...batchForm, totalLabels: parseInt(e.target.value) || 0})} onFocus={e => e.target.select()} required /></div>
                  <div className="input-group"><label>Ngày hết hạn</label><input className="input" type="date" value={batchForm.expiryDate} onChange={e => setBatchForm({...batchForm, expiryDate: e.target.value})} /></div>
                </div>
                <div className="form-row">
                  <div className="input-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <label style={{ margin: 0 }}>Gắn với Sản phẩm</label>
                      <button
                        type="button"
                        onClick={() => {
                          const entId = isAdmin ? batchForm.enterpriseId : enterpriseId;
                          loadProducts(entId);
                        }}
                        disabled={productsLoading}
                        style={{
                          background: 'none', border: 'none', color: 'var(--primary-color, #6366f1)',
                          cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4, padding: 0
                        }}
                        title="Tải lại danh sách sản phẩm mới nhất"
                      >
                        <RefreshCw size={12} className={productsLoading ? 'animate-spin' : ''} />
                        {productsLoading ? 'Đang tải...' : 'Làm mới'}
                      </button>
                    </div>
                    <select 
                      className="input select" 
                      value={batchForm.productId} 
                      onChange={e => setBatchForm({...batchForm, productId: e.target.value})}
                      disabled={productsLoading || (isAdmin && !batchForm.enterpriseId)}
                    >
                      <option value="">
                        {productsLoading 
                          ? '🔄 Đang tải sản phẩm...' 
                          : (!batchForm.enterpriseId && isAdmin 
                              ? '-- Vui lòng chọn doanh nghiệp trước --' 
                              : '-- Chọn sản phẩm --')}
                      </option>
                      {(() => {
                        if (productsLoading) return null;
                        const availableProducts = isAdmin && batchForm.enterpriseId
                          ? getFilteredProducts(batchForm.enterpriseId)
                          : (!isAdmin ? products : []);
                        
                        if (availableProducts.length === 0 && (isAdmin ? batchForm.enterpriseId : true)) {
                          return <option value="" disabled>⚠️ Doanh nghiệp này chưa có sản phẩm nào</option>;
                        }

                        return availableProducts.map(p => (
                          <option key={p._id} value={p._id}>
                            {p.name}{p.sku ? ` (${p.sku})` : ''}
                          </option>
                        ));
                      })()}
                    </select>
                    {isAdmin && batchForm.enterpriseId && !productsLoading && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        {(() => {
                          const count = getFilteredProducts(batchForm.enterpriseId).length;
                          return count > 0 
                            ? `✓ Có ${count} sản phẩm sẵn sàng`
                            : '⚠️ Doanh nghiệp này chưa có sản phẩm. Bạn có thể tạo lô tem trước và gán sản phẩm sau (ở nút Quản lý lô tem), hoặc thêm sản phẩm trong menu "Sản phẩm".';
                        })()}
                      </div>
                    )}
                  </div>
                  <div className="input-group">
                    <label>Giao diện hiển thị (Template)</label>
                    <select className="input select" value={batchForm.templateId} onChange={e => setBatchForm({...batchForm, templateId: e.target.value})}>
                      <option value="">-- Mặc định doanh nghiệp --</option>
                      {(isAdmin && batchForm.enterpriseId
                        ? getFilteredTemplates(batchForm.enterpriseId)
                        : templates).map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Chủ đề giao diện (Theme) *</label>
                    <select className="input select" value={batchForm.theme} onChange={e => setBatchForm({...batchForm, theme: e.target.value})} required>
                      <option value="default">Mặc định (Hiển thị chung)</option>
                      <option value="honey">🍯 Mật ong Hoa Bạc Hà / Đặc sản vùng cao (3 ngôn ngữ)</option>
                      <option value="agriculture">Nông nghiệp (Lá xanh)</option>
                      <option value="appliance">Điện gia dụng / Thiết bị nhà bếp (Xanh tech)</option>
                      <option value="food">Thực phẩm</option>
                      <option value="functional_food">Thực phẩm chức năng</option>
                      <option value="medical">Y tế / Dược phẩm (Sạch & Tin cậy)</option>
                      <option value="cosmetics">Mỹ phẩm (Hồng thanh lịch)</option>
                      <option value="ocop">OCOP (Đặc sản địa phương)</option>
                    </select>
                  </div>
                </div>
                <div className="input-group"><label>Ghi chú</label><textarea className="input textarea" value={batchForm.notes} onChange={e => setBatchForm({...batchForm, notes: e.target.value})} rows={2} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreateBatch(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary"><Plus size={16}/> Tạo lô tem</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Map Product/Distributor Modal */}
      {showMapModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowMapModal(false)}>
          <div className="modal" style={{maxWidth: 460}}>
            <div className="modal-header">
              <h3 className="modal-title">{selectedLabel ? 'Gắn Serial với SP/Điểm bán' : 'Sửa Cấu hình Giao diện (Theme) & Sản phẩm Lô tem'}</h3>
              <button className="btn-icon" onClick={() => setShowMapModal(false)}><X size={20}/></button>
            </div>
            <div className="modal-body">
              {!selectedLabel && (
                <>
                  <div className="input-group">
                    <label>Chủ đề giao diện (Theme) - Có thể chỉnh sửa</label>
                    <select className="input select" value={mapForm.theme || 'default'} onChange={e => setMapForm({...mapForm, theme: e.target.value})}>
                      <option value="default">Mặc định (Hiển thị chung)</option>
                      <option value="honey">🍯 Mật ong Hoa Bạc Hà / Đặc sản vùng cao (3 ngôn ngữ)</option>
                      <option value="agriculture">Nông nghiệp (Lá xanh)</option>
                      <option value="appliance">Điện gia dụng / Thiết bị (Xanh tech)</option>
                      <option value="food">Thực phẩm</option>
                      <option value="functional_food">Thực phẩm chức năng (TPCN)</option>
                      <option value="medical">Y tế / Dược phẩm (Sạch & Tin cậy)</option>
                      <option value="cosmetics">Mỹ phẩm (Hồng thanh lịch)</option>
                      <option value="ocop">OCOP (Đặc sản địa phương)</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label>Domain riêng cho lô tem (Tùy chọn)</label>
                    <input 
                      className="input" 
                      type="text" 
                      placeholder="VD: sanphamdocquyen.vn" 
                      value={mapForm.customDomain || ''} 
                      onChange={e => setMapForm({...mapForm, customDomain: e.target.value})} 
                    />
                  </div>
                  
                  <div className="input-group">
                    <label>Sản phẩm (Đã tự động lọc theo Doanh nghiệp sở hữu lô tem)</label>
                    <select className="input select" value={mapForm.productId} onChange={e => {
                      setMapForm({
                        ...mapForm, 
                        productId: e.target.value, 
                        distributorIdx: '',
                        distributorName: '',
                        distributorAddress: ''
                      });
                    }}>
                      <option value="">-- Chọn sản phẩm --</option>
                      {getFilteredProducts(selectedBatch?.enterpriseId?._id || selectedBatch?.enterpriseId).map(p => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <label>Chọn Điểm bán lẻ từ sản phẩm</label>
                    <select
                      className="input select"
                      value={mapForm.distributorIdx}
                      onChange={e => {
                        const idx = e.target.value;
                        const selectedProduct = products.find(p => p._id === mapForm.productId);
                        const dists = selectedProduct?.distributors || [];
                        if (idx === '') {
                          setMapForm(prev => ({ ...prev, distributorIdx: '', distributorName: '', distributorAddress: '' }));
                        } else {
                          const dist = dists[idx];
                          setMapForm(prev => ({ ...prev, distributorIdx: idx, distributorName: dist.name, distributorAddress: dist.address }));
                        }
                      }}
                      disabled={!mapForm.productId}
                    >
                      <option value="">-- Chọn từ danh sách đại lý của sản phẩm --</option>
                      {(() => {
                        const selProd = products.find(p => p._id === mapForm.productId);
                        const dists = selProd?.distributors || [];
                        return dists.map((d, index) => (
                          <option key={index} value={index}>{d.name} ({d.address})</option>
                        ));
                      })()}
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="input-group">
                      <label>Tên điểm bán</label>
                      <input 
                        className="input" 
                        placeholder="Tên điểm bán..."
                        value={mapForm.distributorName || ''} 
                        onChange={e => setMapForm({...mapForm, distributorName: e.target.value, distributorIdx: ''})} 
                      />
                    </div>
                    <div className="input-group">
                      <label>Địa chỉ điểm bán</label>
                      <input 
                        className="input" 
                        placeholder="Địa chỉ..."
                        value={mapForm.distributorAddress || ''} 
                        onChange={e => setMapForm({...mapForm, distributorAddress: e.target.value, distributorIdx: ''})} 
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="input-group">
                      <label>Từ số Serial *</label>
                      <input
                        className="input"
                        value={mapForm.serialStart}
                        onChange={e => setMapForm({ ...mapForm, serialStart: e.target.value })}
                        required
                        placeholder="VD: TEM-000001"
                      />
                    </div>
                    <div className="input-group">
                      <label>Đến số Serial *</label>
                      <input
                        className="input"
                        value={mapForm.serialEnd}
                        onChange={e => setMapForm({ ...mapForm, serialEnd: e.target.value })}
                        required
                        placeholder="VD: TEM-000020"
                      />
                    </div>
                  </div>
                </>
              )}
              {selectedLabel && (
                <>
                  <div className="input-group">
                    <label>Số Serial</label>
                    <input className="input" value={selectedLabel.serialNumber} disabled style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--color-text-muted)', cursor: 'not-allowed' }} />
                  </div>
                  <div className="input-group">
                    <label>Sản phẩm (Đã lọc theo Doanh nghiệp)</label>
                    <select className="input select" value={mapForm.productId} onChange={e => setMapForm({...mapForm, productId: e.target.value})}>
                      <option value="">-- Chọn sản phẩm --</option>
                      {getFilteredProducts(selectedLabel?.batchId?.enterpriseId?._id || selectedLabel?.batchId?.enterpriseId || selectedLabel?.enterpriseId).map(p => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group"><label>Tên điểm bán</label><input className="input" value={mapForm.distributorName} onChange={e => setMapForm({...mapForm, distributorName: e.target.value})} /></div>
                  <div className="input-group"><label>Địa chỉ điểm bán</label><input className="input" value={mapForm.distributorAddress} onChange={e => setMapForm({...mapForm, distributorAddress: e.target.value})} /></div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowMapModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={selectedLabel ? handleMapLabel : handleMapProduct}>
                <Link2 size={16}/> Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Renew Modal */}
      {showRenewModal && selectedBatch && (() => {
        const newExpiry = calcNewExpiryDate();
        const isExpired = selectedBatch.expiryDate && new Date(selectedBatch.expiryDate) < new Date();
        const todayStr = new Date().toISOString().split('T')[0];
        return (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowRenewModal(false)}>
            <div className="modal" style={{ maxWidth: 480 }}>
              <div className="modal-header">
                <h3 className="modal-title">🔄 Gia hạn lô tem</h3>
                <button className="btn-icon" onClick={() => setShowRenewModal(false)}><X size={20}/></button>
              </div>
              <div className="modal-body">
                {/* Thông tin lô tem */}
                <div style={{
                  background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)',
                  borderRadius: '10px', padding: '14px 16px', marginBottom: '20px'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.875rem' }}>
                    <div><span style={{ color: 'var(--color-text-muted)' }}>Mã lô: </span><strong>{selectedBatch.batchCode}</strong></div>
                    <div><span style={{ color: 'var(--color-text-muted)' }}>Số lượng: </span><strong>{selectedBatch.totalLabels} tem</strong></div>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)' }}>Hạn hiện tại: </span>
                      <strong style={{ color: isExpired ? '#ef4444' : 'inherit' }}>
                        {formatDate(selectedBatch.expiryDate)} {isExpired ? '⚠️ Đã hết hạn' : ''}
                      </strong>
                    </div>
                    <div><span style={{ color: 'var(--color-text-muted)' }}>Sản phẩm: </span><strong>{selectedBatch.productId?.name || '—'}</strong></div>
                  </div>
                </div>

                {/* Chọn kiểu gia hạn */}
                <div className="input-group" style={{ marginBottom: '16px' }}>
                  <label>Hình thức gia hạn</label>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setRenewMode('months')}
                      style={{
                        flex: 1, padding: '9px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600,
                        border: renewMode === 'months' ? '2px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.1)',
                        background: renewMode === 'months' ? 'rgba(99,102,241,0.15)' : 'transparent',
                        color: renewMode === 'months' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        cursor: 'pointer'
                      }}
                    >📅 Theo tháng</button>
                    <button
                      type="button"
                      onClick={() => setRenewMode('date')}
                      style={{
                        flex: 1, padding: '9px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600,
                        border: renewMode === 'date' ? '2px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.1)',
                        background: renewMode === 'date' ? 'rgba(99,102,241,0.15)' : 'transparent',
                        color: renewMode === 'date' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        cursor: 'pointer'
                      }}
                    >🗓️ Chọn ngày cụ thể</button>
                  </div>
                </div>

                {/* Input theo tháng hoặc ngày */}
                {renewMode === 'months' ? (
                  <div className="input-group">
                    <label>Gia hạn thêm (tháng)</label>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                      {[3, 6, 12, 24].map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setRenewMonths(m)}
                          style={{
                            padding: '6px 14px', borderRadius: '7px', fontSize: '0.82rem', fontWeight: 700,
                            border: renewMonths === m ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                            background: renewMonths === m ? 'rgba(16,185,129,0.15)' : 'transparent',
                            color: renewMonths === m ? '#10b981' : 'var(--color-text-muted)', cursor: 'pointer'
                          }}
                        >{m} tháng</button>
                      ))}
                      <input
                        className="input"
                        type="number" min={1} max={120}
                        value={renewMonths}
                        onChange={e => setRenewMonths(parseInt(e.target.value) || 1)}
                        onFocus={e => e.target.select()}
                        style={{ width: '90px', textAlign: 'center' }}
                        placeholder="Tháng"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="input-group">
                    <label>Ngày hết hạn mới</label>
                    <input
                      className="input"
                      type="date"
                      min={todayStr}
                      value={renewNewDate}
                      onChange={e => setRenewNewDate(e.target.value)}
                      style={{ marginTop: '6px' }}
                    />
                  </div>
                )}

                {/* Preview ngày hết hạn mới */}
                {newExpiry && (
                  <div style={{
                    marginTop: '16px', padding: '12px 16px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.05))',
                    border: '1px solid rgba(16,185,129,0.25)',
                    display: 'flex', alignItems: 'center', gap: '10px'
                  }}>
                    <span style={{ fontSize: '1.3rem' }}>✅</span>
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Ngày hết hạn mới (dự kiến)</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#10b981' }}>
                        {newExpiry.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setShowRenewModal(false)}>Hủy</button>
                <button
                  className="btn btn-success"
                  onClick={handleRenew}
                  disabled={renewMode === 'date' && !renewNewDate}
                >
                  <RefreshCw size={16}/> Xác nhận gia hạn
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Migrate Modal */}
      {showMigrateModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowMigrateModal(false)}>
          <div className="modal" style={{maxWidth: 580}}>
            <div className="modal-header">
              <h3 className="modal-title">Import tem từ hệ thống cũ / Excel</h3>
              <button className="btn-icon" onClick={() => setShowMigrateModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleMigrate}>
              <div className="modal-body">
                {modalError && (
                  <div className="modal-error animate-fade-in" style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: 12, marginBottom: 16,
                    borderRadius: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)'
                  }}>
                    <XCircle size={18} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.9rem' }}>{modalError}</span>
                  </div>
                )}
                {isAdmin && (
                  <div className="input-group">
                    <label>Doanh nghiệp sở hữu *</label>
                    <select
                      className="input select"
                      value={migrateForm.enterpriseId}
                      onChange={e => {
                        const newEntId = e.target.value;
                        setMigrateForm({...migrateForm, enterpriseId: newEntId, productId: '', templateId: ''});
                        if (newEntId) {
                          loadProducts(newEntId);
                        }
                      }}
                      required
                    >
                      <option value="">-- Chọn doanh nghiệp --</option>
                      {enterprises.map(ent => (
                        <option key={ent._id} value={ent._id}>{ent.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="form-row">
                  <div className="input-group"><label>Mã lô mới *</label><input className="input" value={migrateForm.batchCode} onChange={e => setMigrateForm({...migrateForm, batchCode: e.target.value})} required placeholder="VD: LO-EXCEL-01" /></div>
                  <div className="input-group"><label>Nguồn di trú</label><input className="input" value={migrateForm.migrationSource} onChange={e => setMigrateForm({...migrateForm, migrationSource: e.target.value})} placeholder="VD: Excel Khách Hàng" /></div>
                </div>
                <div className="form-row">
                  <div className="input-group">
                    <label>Gắn với sản phẩm</label>
                    <select className="input select" value={migrateForm.productId} onChange={e => setMigrateForm({...migrateForm, productId: e.target.value})}>
                      <option value="">-- Không gắn --</option>
                      {(isAdmin && migrateForm.enterpriseId
                        ? getFilteredProducts(migrateForm.enterpriseId)
                        : products).map(p => <option key={p._id} value={p._id}>{p.name}{p.sku ? ` (${p.sku})` : ''}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Giao diện hiển thị (Template)</label>
                    <select className="input select" value={migrateForm.templateId} onChange={e => setMigrateForm({...migrateForm, templateId: e.target.value})}>
                      <option value="">-- Mặc định doanh nghiệp --</option>
                      {(isAdmin && migrateForm.enterpriseId
                        ? getFilteredTemplates(migrateForm.enterpriseId)
                        : templates).map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Chủ đề giao diện (Theme)</label>
                    <select className="input select" value={migrateForm.theme} onChange={e => setMigrateForm({...migrateForm, theme: e.target.value})}>
                      <option value="default">Mặc định (Hiển thị chung)</option>
                      <option value="honey">🍯 Mật ong Hoa Bạc Hà / Đặc sản vùng cao (3 ngôn ngữ)</option>
                      <option value="agriculture">Nông nghiệp (Lá xanh)</option>
                      <option value="appliance">Điện gia dụng / Thiết bị nhà bếp (Xanh tech)</option>
                      <option value="food">Thực phẩm</option>
                      <option value="functional_food">Thực phẩm chức năng</option>
                      <option value="medical">Y tế / Dược phẩm (Sạch & Tin cậy)</option>
                      <option value="cosmetics">Mỹ phẩm (Hồng thanh lịch)</option>
                      <option value="ocop">OCOP (Đặc sản địa phương)</option>
                    </select>
                  </div>
                </div>
                
                <div className="input-group" style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 12, border: '1px dashed rgba(255,255,255,0.1)', marginTop: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 600, color: 'var(--primary-color)' }}>
                    <Upload size={16} /> Chọn File Excel (.xls, .xlsx, .csv) hoặc kéo thả vào đây
                    <input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelUpload} style={{ display: 'none' }} />
                  </label>
                  <p style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: 4, lineHeight: 1.4 }}>
                    Hệ thống sẽ tự động nhận diện các cột: <strong>ID</strong> (Serial), <strong>QRCODE</strong> (Link quét), <strong>TEMQR</strong> (Link tem phụ), <strong>ACTIVE CODE</strong> (Mã kích hoạt).
                  </p>
                </div>

                <div className="input-group">
                  <label>Dữ liệu tem đã nhận dạng (hoặc dán tay định dạng: ID [Tab] QRCODE [Tab] TEMQR [Tab] ACTIVE CODE)</label>
                  <textarea className="input textarea" value={migrateForm.labelsText} onChange={e => setMigrateForm({...migrateForm, labelsText: e.target.value})}
                    placeholder={"3366345\thttp://...\thttps://...\t2nXHDOeT\n3366344\thttp://...\thttps://...\tE0PHF36V"} rows={8} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowMigrateModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary"><Upload size={16}/> Bắt đầu Import</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Bulk Map Product/Distributor Modal */}
      {showBulkMapModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowBulkMapModal(false)}>
          <div className="modal" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3 className="modal-title">Gắn Serial với SP/Điểm bán</h3>
              <button className="btn-icon" onClick={() => setShowBulkMapModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleBulkMapSubmit}>
              <div className="modal-body">
                {modalError && (
                  <div className="modal-error animate-fade-in" style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: 12, marginBottom: 16,
                    borderRadius: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)'
                  }}>
                    <XCircle size={18} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.9rem' }}>{modalError}</span>
                  </div>
                )}

                <div className="input-group">
                  <label>Chọn Lô tem *</label>
                  <select
                    className="input select"
                    value={bulkForm.batchId}
                    onChange={e => handleBulkFormBatchChange(e.target.value)}
                    required
                  >
                    <option value="">-- Chọn lô tem --</option>
                    {batches.map(b => (
                      <option key={b._id} value={b._id}>{b.batchCode} ({b.totalLabels} tem: {b.serialStart} → {b.serialEnd})</option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label>Từ số Serial *</label>
                    <input
                      className="input"
                      value={bulkForm.serialStart}
                      onChange={e => setBulkForm({ ...bulkForm, serialStart: e.target.value })}
                      required
                      placeholder="VD: TEM-000001"
                    />
                  </div>
                  <div className="input-group">
                    <label>Đến số Serial *</label>
                    <input
                      className="input"
                      value={bulkForm.serialEnd}
                      onChange={e => setBulkForm({ ...bulkForm, serialEnd: e.target.value })}
                      required
                      placeholder="VD: TEM-000020"
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Gắn với Sản phẩm (Đã tự động lọc theo Doanh nghiệp sở hữu lô tem)</label>
                  <select
                    className="input select"
                    value={bulkForm.productId}
                    onChange={e => setBulkForm({ ...bulkForm, productId: e.target.value, distributorIdx: '', distributorName: '', distributorAddress: '' })}
                    disabled={!bulkForm.batchId}
                  >
                    {!bulkForm.batchId ? (
                      <option value="">-- Vui lòng chọn lô tem trước --</option>
                    ) : (
                      <>
                        <option value="">-- Chọn sản phẩm --</option>
                        {(() => {
                          const bulkBatch = batches.find(b => b._id === bulkForm.batchId);
                          const targetEntId = bulkBatch?.enterpriseId?._id || bulkBatch?.enterpriseId;
                          return getFilteredProducts(targetEntId).map(p => (
                            <option key={p._id} value={p._id}>{p.name}</option>
                          ));
                        })()}
                      </>
                    )}
                  </select>
                </div>

                <div className="input-group">
                  <label>Chọn Điểm bán lẻ từ sản phẩm</label>
                  <select
                    className="input select"
                    value={bulkForm.distributorIdx}
                    onChange={e => {
                      const idx = e.target.value;
                      if (idx === '') {
                        setBulkForm(prev => ({ ...prev, distributorIdx: '', distributorName: '', distributorAddress: '' }));
                      } else {
                        const dist = productDistributors[idx];
                        setBulkForm(prev => ({ ...prev, distributorIdx: idx, distributorName: dist.name, distributorAddress: dist.address }));
                      }
                    }}
                    disabled={!bulkForm.productId}
                  >
                    <option value="">-- Chọn từ danh sách đại lý của sản phẩm --</option>
                    {productDistributors.map((d, index) => (
                      <option key={index} value={index}>{d.name} ({d.address})</option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label>Tên điểm bán lẻ (Tùy chọn)</label>
                    <input
                      className="input"
                      value={bulkForm.distributorName}
                      onChange={e => setBulkForm({ ...bulkForm, distributorName: e.target.value, distributorIdx: '' })}
                      placeholder="VD: Đại lý Sao Mai"
                    />
                  </div>
                  <div className="input-group">
                    <label>Địa chỉ điểm bán lẻ (Tùy chọn)</label>
                    <input
                      className="input"
                      value={bulkForm.distributorAddress}
                      onChange={e => setBulkForm({ ...bulkForm, distributorAddress: e.target.value, distributorIdx: '' })}
                      placeholder="VD: Quận 1, TP.HCM"
                    />
                  </div>
                </div>

                <div className="input-group" style={{ marginTop: '12px' }}>
                  <label style={{ fontWeight: 600, color: '#059669' }}>Mã sở hữu sản phẩm (Tùy chọn)</label>
                  <input
                    className="input"
                    value={bulkForm.ownerCode || ''}
                    onChange={e => setBulkForm({ ...bulkForm, ownerCode: e.target.value })}
                    placeholder="VD: MSH-992, CUST-8839"
                    style={{ borderColor: '#6ee7b7' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowBulkMapModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary"><Link2 size={16}/> Thực hiện Gắn kết</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chỉnh sửa thông số sở hữu (Quyền Admin) */}
      {showOwnerModal && ownerTargetLabel && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && !savingOwner && setShowOwnerModal(false)}>
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-primary)' }}>
                  <ShieldCheck size={20} color="var(--color-accent)" />
                  Chỉnh sửa thông số sở hữu
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                  Serial tem: <strong style={{ color: 'var(--color-accent)' }}>{ownerTargetLabel.serialNumber}</strong> | Lô: {ownerTargetLabel.batchId?.batchCode || '—'}
                </p>
              </div>
              <button className="btn-icon" onClick={() => !savingOwner && setShowOwnerModal(false)}><X size={20} /></button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {ownerModalError && (
                <div className="modal-error animate-fade-in" style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: 12,
                  borderRadius: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                  <XCircle size={18} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '0.88rem' }}>{ownerModalError}</span>
                </div>
              )}

              <div className="input-group">
                <label>1. Tên NPP hoặc cá nhân đã mua sản phẩm *</label>
                <input
                  className="input"
                  placeholder="VD: Nhà pum / Đại lý Tuấn Hưng / Nguyễn Văn A"
                  value={ownerForm.ownerName}
                  onChange={e => setOwnerForm({ ...ownerForm, ownerName: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>2. Địa chỉ NPP hoặc cá nhân mua *</label>
                <input
                  className="input"
                  placeholder="VD: 123 Giải Phóng, Phương Mai, Hà Nội"
                  value={ownerForm.ownerAddress}
                  onChange={e => setOwnerForm({ ...ownerForm, ownerAddress: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>3. Số điện thoại liên hệ *</label>
                <input
                  className="input"
                  placeholder="VD: 0984848894"
                  value={ownerForm.ownerPhone}
                  onChange={e => setOwnerForm({ ...ownerForm, ownerPhone: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>4. Serial chống giả</label>
                <input
                  className="input"
                  placeholder="VD: 307362"
                  value={ownerForm.activatedSerial}
                  onChange={e => setOwnerForm({ ...ownerForm, activatedSerial: e.target.value })}
                />
                <p style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
                  Serial chống giả trích xuất từ con tem đã quét.
                </p>
              </div>

              <div className="input-group" style={{ background: 'rgba(16, 185, 129, 0.06)', padding: '12px', borderRadius: 8, border: '1.5px solid rgba(16, 185, 129, 0.3)' }}>
                <label style={{ color: '#047857', fontWeight: 700 }}>5. Mã nội bộ / Mã sở hữu sản phẩm (Cột 2)</label>
                <input
                  className="input"
                  placeholder="VD: 00066"
                  value={ownerForm.internalCode || ownerForm.ownerCode}
                  onChange={e => setOwnerForm({ ...ownerForm, internalCode: e.target.value, ownerCode: e.target.value })}
                  style={{ fontWeight: 700, color: '#065f46', borderColor: '#86efac' }}
                />
                <p style={{ fontSize: '0.75rem', color: '#059669', margin: '4px 0 0' }}>
                  Giá trị này sẽ hiển thị ở mục "Mã sở hữu sản phẩm" và dòng "Serial đã được kích hoạt" trên trang tra cứu Bảo hành.
                </p>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {(ownerTargetLabel.ownerInfo?.name || ownerTargetLabel.ownerCode || ownerTargetLabel.internalCode) && (
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => handleSaveOwner(true)}
                    disabled={savingOwner}
                    style={{ color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                    title="Xóa thông tin sở hữu để tem về trạng thái chưa kích hoạt"
                  >
                    <Trash2 size={14} /> Xóa thông số sở hữu
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowOwnerModal(false)} disabled={savingOwner}>Hủy</button>
                <button type="button" className="btn btn-primary" onClick={() => handleSaveOwner(false)} disabled={savingOwner}>
                  <CheckCircle size={16} /> {savingOwner ? 'Đang lưu...' : 'Lưu thông số sở hữu'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Import Mã nội bộ cho Lô tem (Mở trực tiếp từ dòng Lô tem hoặc nút Header) */}
      {showInternalCodeModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && !importingInternalCodes && setShowInternalCodeModal(false)}>
          <div className="modal" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileSpreadsheet size={20} color="#10b981" />
                  Import Mã nội bộ cho Lô tem
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                  Cấu trúc file Excel 3 cột: <strong>Cột 1: Serial</strong> | <strong>Cột 2: Mã nội bộ</strong> | <strong>Cột 3: Sản phẩm</strong>
                </p>
              </div>
              <button className="btn-icon" onClick={() => !importingInternalCodes && setShowInternalCodeModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmitInternalCodes}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {internalImportError && (
                  <div className="modal-error animate-fade-in" style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: 12,
                    borderRadius: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.25)'
                  }}>
                    <XCircle size={18} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.88rem' }}>{internalImportError}</span>
                  </div>
                )}

                {internalImportResult && (
                  <div style={{
                    padding: '12px 14px', borderRadius: 10,
                    backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#10b981'
                  }}>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle size={18} />
                      <span>{internalImportResult.message || 'Import mã nội bộ thành công!'}</span>
                    </div>
                    {internalImportResult.data && (
                      <div style={{ fontSize: '0.82rem', marginTop: 6, color: 'var(--color-text-secondary)' }}>
                        • Đã khớp và cập nhật: <strong>{internalImportResult.data.updatedCount}</strong> / {internalImportResult.data.totalRows} dòng
                        {' | '}Đã gắn sản phẩm (Cột 3): <strong>{internalImportResult.data.productMatchedCount || 0}</strong> tem
                        {internalImportResult.data.unmatchedSerialsCount > 0 && (
                          <div style={{ color: '#fbbf24', marginTop: 4 }}>
                            ⚠️ Không tìm thấy {internalImportResult.data.unmatchedSerialsCount} serial trong lô này: {internalImportResult.data.unmatchedSerials?.slice(0, 8).join(', ')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label style={{ margin: 0 }}>1. Lô tem cần Import *</label>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => handleDownloadInternalCodeTemplate(internalCodeBatchId)}
                      disabled={downloadingInternalTemplate}
                      style={{ color: '#10b981', fontSize: '0.78rem', padding: '2px 8px', border: '1px solid rgba(16,185,129,0.35)' }}
                    >
                      <Download size={13} /> {downloadingInternalTemplate ? 'Đang tạo...' : 'Tải file Excel mẫu của lô này'}
                    </button>
                  </div>
                  <select
                    className="input select"
                    value={internalCodeBatchId}
                    onChange={e => {
                      setInternalCodeBatchId(e.target.value);
                      setInternalImportResult(null);
                    }}
                    required
                  >
                    <option value="">-- Chọn lô tem --</option>
                    {(allBatchesForFilter.length > 0 ? allBatchesForFilter : batches).map(b => (
                      <option key={b._id} value={b._id}>
                        {b.batchCode} ({b.totalLabels} tem: {b.serialStart} → {b.serialEnd}) {b.productId?.name ? `- ${b.productId.name}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label>2. Chọn File Excel 3 cột (.xlsx, .xls, .csv) *</label>
                  <label style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '14px', borderRadius: 10, border: '1.5px dashed rgba(16, 185, 129, 0.5)',
                    backgroundColor: 'rgba(16, 185, 129, 0.05)', color: '#10b981', fontWeight: 600,
                    cursor: 'pointer', fontSize: '0.9rem'
                  }}>
                    <Upload size={18} />
                    <span>{internalCodeFileName ? `Đã đọc: ${internalCodeFileName} (${internalCodeRows.length} dòng)` : 'Nhấn để chọn file Excel (Cột 1: Serial | Cột 2: Mã nội bộ | Cột 3: Sản phẩm)'}</span>
                    <input type="file" accept=".xlsx,.xls,.csv" onChange={handleInternalCodeExcelUpload} style={{ display: 'none' }} />
                  </label>
                </div>

                {internalCodeRows.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>
                        Xem trước ({internalCodeRows.length} dòng):
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={() => { setInternalCodeRows([]); setInternalCodeFileName(''); }}
                        style={{ color: '#f87171', fontSize: '0.76rem', padding: '2px 6px' }}
                      >
                        Xóa file
                      </button>
                    </div>
                    <div className="table-container" style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 8 }}>
                      <table className="table" style={{ fontSize: '0.82rem' }}>
                        <thead>
                          <tr>
                            <th style={{ width: 45 }}>#</th>
                            <th>Cột 1: Serial</th>
                            <th>Cột 2: Mã nội bộ</th>
                            <th>Cột 3: Sản phẩm</th>
                          </tr>
                        </thead>
                        <tbody>
                          {internalCodeRows.slice(0, 30).map((r, idx) => (
                            <tr key={idx}>
                              <td>{idx + 1}</td>
                              <td><span className="serial-number">{r.serial}</span></td>
                              <td><strong style={{ color: '#10b981' }}>{r.internalCode || '—'}</strong></td>
                              <td>{r.productName || <span className="text-muted">Theo lô</span>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowInternalCodeModal(false)} disabled={importingInternalCodes}>Đóng</button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={importingInternalCodes || !internalCodeBatchId || internalCodeRows.length === 0}
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
                >
                  <Upload size={16} />
                  {importingInternalCodes ? 'Đang Import...' : `Import Mã nội bộ (${internalCodeRows.length} tem)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
