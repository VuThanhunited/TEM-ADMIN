import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import * as XLSX from 'xlsx';
import {
  Tag, Plus, Search, RefreshCw, ArrowRight, Link2, Upload,
  Clock, CheckCircle, XCircle, X, ToggleLeft, ToggleRight,
  Package, MapPin, Calendar, ExternalLink, Download
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
  const [enterprises, setEnterprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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
  const [exportingLabels, setExportingLabels] = useState(false);
  const [showBulkMapModal, setShowBulkMapModal] = useState(false);
  const [bulkForm, setBulkForm] = useState({ batchId: '', serialStart: '', serialEnd: '', productId: '', distributorIdx: '', distributorName: '', distributorAddress: '' });

  const [batchForm, setBatchForm] = useState({ batchCode: '', totalLabels: 100, prefix: '100', productId: '', templateId: '', theme: 'default', expiryDate: '', notes: '', enterpriseId: '' });
  const [renewMonths, setRenewMonths] = useState(12);
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

  useEffect(() => {
    loadProducts();
    loadTemplates();
    if (isAdmin) {
      loadEnterprises();
    }
  }, [isAdmin]);
  useEffect(() => {
    if (activeTab === 'batches') loadBatches();
    else if (activeTab === 'activate') loadLabels();
  }, [activeTab, batchPagination.page, labelPagination.page, search]);

  const loadProducts = async () => {
    try { const r = await api.getProducts({ limit: 100 }); setProducts(r.data); } catch (e) {}
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
      setEnterprises(r);
    } catch (e) {}
  };

  const loadBatches = async () => {
    try {
      setLoading(true);
      const r = await api.getBatches({ page: batchPagination.page, search });
      setBatches(r.data);
      setBatchPagination(p => ({ ...p, ...r.pagination }));
    } catch (e) {} finally { setLoading(false); }
  };

  const loadLabels = async () => {
    try {
      setLoading(true);
      const r = await api.getLabels({ page: labelPagination.page, search, limit: 30 });
      setLabels(r.data);
      setLabelPagination(p => ({ ...p, ...r.pagination }));
    } catch (e) {} finally { setLoading(false); }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    setModalError(null);
    if (isAdmin && !batchForm.enterpriseId) {
      setModalError('Vui lòng chọn doanh nghiệp sở hữu lô tem');
      return;
    }
    try {
      await api.createBatch({ ...batchForm, enterpriseId: isAdmin ? batchForm.enterpriseId : enterpriseId });
      setShowCreateBatch(false);
      setBatchForm({ batchCode: '', totalLabels: 100, prefix: 'TEM', productId: '', templateId: '', theme: 'default', expiryDate: '', notes: '', enterpriseId: '' });
      loadBatches();
    } catch (err) { setModalError(err.message || 'Lỗi tạo lô tem'); }
  };

  const handleToggleStatus = async (batch) => {
    const newStatus = batch.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try { await api.updateBatchStatus(batch._id, { status: newStatus }); loadBatches(); }
    catch (err) { alert(err.message); }
  };

  const handleMapProduct = async () => {
    try {
      // 1. Cập nhật Lô tem (productId, customDomain)
      await api.mapBatchProduct(selectedBatch._id, { 
        productId: mapForm.productId, 
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
      loadBatches();
      alert('Cấu hình lô tem và phân phối điểm bán thành công!');
    } catch (err) { alert(err.message || 'Lỗi cấu hình lô tem'); }
  };

  const handleRenew = async () => {
    try {
      await api.renewBatch(selectedBatch._id, { months: renewMonths });
      setShowRenewModal(false);
      loadBatches();
    } catch (err) { alert(err.message); }
  };

  const handleDownloadBatch = async (batch) => {
    try {
      setExportingBatchId(batch._id);
      // Fetch all labels for the specific batch (high limit to fetch all)
      const res = await api.getLabels({ batchId: batch._id, limit: 100000 });
      if (!res.data || res.data.length === 0) {
        alert('Lô tem này không có dữ liệu tem nhãn nào để tải về!');
        return;
      }

      // Format data for Excel export
      const exportData = res.data.map((label, index) => ({
        'STT': index + 1,
        'Mã lô': batch.batchCode,
        'Sản phẩm': batch.productId?.name || 'Chưa gắn',
        'Mã Serial': label.serialNumber,
        'Link quét': label.qrUrl,
        'Mã SMS': label.smsCode || '',
        'Mã Kích hoạt': label.activeCode || '',
        'Link QR gốc (Di trú)': label.legacyQrCode || '',
        'Link TEMQR gốc (Di trú)': label.legacyTemQr || '',
        'Trạng thái': getStatusLabel(label.status),
        'Số lượt quét': label.scanCount || 0
      }));

      // Generate Workbook
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách tem');

      // Autofit columns roughly
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
    } catch (err) {
      alert('Lỗi xuất Excel lô tem: ' + err.message);
    } finally {
      setExportingBatchId(null);
    }
  };

  const handleDownloadFilteredLabels = async () => {
    try {
      setExportingLabels(true);
      // Fetch all labels matching currently active search filter (high limit to fetch all matching)
      const res = await api.getLabels({ search, limit: 100000 });
      if (!res.data || res.data.length === 0) {
        alert('Không tìm thấy dữ liệu tem nhãn nào phù hợp với bộ lọc!');
        return;
      }

      // Format data
      const exportData = res.data.map((label, index) => ({
        'STT': index + 1,
        'Mã lô': label.batchId?.batchCode || '—',
        'Sản phẩm': label.productId?.name || 'Chưa gắn',
        'Mã Serial': label.serialNumber,
        'Link quét': label.qrUrl,
        'Mã SMS': label.smsCode || '',
        'Mã Kích hoạt': label.activeCode || '',
        'Điểm bán': label.distributorName || '—',
        'Địa chỉ điểm bán': label.distributorAddress || '—',
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
        distributorAddress: bulkForm.distributorAddress || null
      });

      setShowBulkMapModal(false);
      setBulkForm({ batchId: '', serialStart: '', serialEnd: '', productId: '', distributorIdx: '', distributorName: '', distributorAddress: '' });
      
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
    { id: 'migrate', label: 'Đồng bộ tem cũ', icon: Upload },
    { id: 'renew', label: 'Gia hạn lô tem', icon: Clock },
  ];

  const selectedProduct = products.find(p => p._id === bulkForm.productId);
  const productDistributors = selectedProduct?.distributors || [];

  return (
    <div className="labels-page">
      <div className="page-header">
        <div>
          <h1>Quản lý Tem nhãn</h1>
          <p>Khởi tạo, theo dõi và quản lý lô tem - serial</p>
        </div>
        {(activeTab === 'batches' || activeTab === 'activate') && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-ghost" onClick={() => { setModalError(null); setBulkForm({ batchId: '', serialStart: '', serialEnd: '', productId: '', distributorIdx: '', distributorName: '', distributorAddress: '' }); setShowBulkMapModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <Link2 size={16} /> Gắn kết hàng loạt
            </button>
            {activeTab === 'batches' && isAdmin && (
              <button className="btn btn-primary" onClick={() => { setModalError(null); setBatchForm({ batchCode: '', totalLabels: 100, prefix: '100', productId: '', templateId: '', theme: 'default', expiryDate: '', notes: '', enterpriseId: '' }); setShowCreateBatch(true); }}>
                <Plus size={18}/> Tạo lô tem mới
              </button>
            )}
          </div>
        )}
        {activeTab === 'migrate' && isAdmin && (
          <button className="btn btn-primary" onClick={() => { setModalError(null); setMigrateForm({ batchCode: '', migrationSource: '', migrationOldLink: '', productId: '', templateId: '', theme: 'default', labelsText: '', enterpriseId: '' }); setShowMigrateModal(true); }}>
            <Upload size={18}/> Import tem cũ
          </button>
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

      {/* Search & Export Actions */}
      <div className="toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input className="input" placeholder={activeTab === 'batches' ? 'Tìm mã lô...' : 'Tìm serial...'} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {activeTab === 'activate' && (
          <button className="btn btn-primary" onClick={handleDownloadFilteredLabels} disabled={exportingLabels} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

      {/* Batches Tab */}
      {(activeTab === 'batches' || activeTab === 'renew') && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Mã lô</th>
                <th>Sản phẩm</th>
                <th>Số lượng</th>
                <th>Serial</th>
                <th>Ngày tạo</th>
                <th>Hết hạn</th>
                <th>Di trú</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9}><div className="loading-overlay"><div className="loading-spinner"></div></div></td></tr>
              ) : batches.length === 0 ? (
                <tr><td colSpan={9}><div className="empty-state"><Tag size={40}/><h3>Chưa có lô tem nào</h3></div></td></tr>
              ) : (
                batches.map(batch => (
                  <tr key={batch._id}>
                    <td><span className="batch-code">{batch.batchCode}</span></td>
                    <td>{batch.productId?.name || <span className="text-muted">Chưa gắn</span>}</td>
                    <td><strong>{batch.totalLabels}</strong></td>
                    <td><span className="serial-range">{batch.serialStart} → {batch.serialEnd}</span></td>
                    <td>{formatDate(batch.createdDate || batch.createdAt)}</td>
                    <td className={new Date(batch.expiryDate) < new Date() ? 'text-danger' : ''}>{formatDate(batch.expiryDate)}</td>
                    <td>{batch.isMigrated ? <span className="badge badge-info">Di trú</span> : '—'}</td>
                    <td><span className={`badge badge-dot ${getStatusBadge(batch.status)}`}>{getStatusLabel(batch.status)}</span></td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn btn-sm btn-ghost" onClick={() => handleToggleStatus(batch)} title={batch.status === 'ACTIVE' ? 'Tắt' : 'Bật'}>
                          {batch.status === 'ACTIVE' ? <ToggleRight size={18} className="text-success"/> : <ToggleLeft size={18}/>}
                        </button>
                        <button className="btn btn-sm btn-ghost" onClick={() => { 
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
                        }} title="Gắn sản phẩm & Cấu hình">
                          <Link2 size={14}/>
                        </button>
                        <button className="btn btn-sm btn-ghost" onClick={() => {
                          setModalError(null);
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
                        }} title="Gắn Serial cho Điểm bán">
                          <MapPin size={14} className="text-primary"/>
                        </button>
                        <button className="btn btn-sm btn-ghost" onClick={() => handleDownloadBatch(batch)} title="Tải dữ liệu tem (Excel)" disabled={exportingBatchId === batch._id}>
                          {exportingBatchId === batch._id ? (
                            <div className="loading-spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></div>
                          ) : (
                            <Download size={14} className="text-success" />
                          )}
                        </button>
                        {activeTab === 'renew' && (
                          <button className="btn btn-sm btn-ghost" onClick={() => { setSelectedBatch(batch); setShowRenewModal(true); }} title="Gia hạn">
                            <RefreshCw size={14}/>
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
                <th>Trạng thái</th>
                <th>Lượt quét</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><div className="loading-overlay"><div className="loading-spinner"></div></div></td></tr>
              ) : labels.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><Tag size={40}/><h3>Chưa có tem nào</h3></div></td></tr>
              ) : (
                labels.map(label => (
                  <tr key={label._id}>
                    <td><span className="serial-number">{label.serialNumber}</span></td>
                    <td>{label.batchId?.batchCode || '—'}</td>
                    <td>{label.productId?.name || <span className="text-muted">Chưa gắn</span>}</td>
                    <td>{label.distributorName || <span className="text-muted">—</span>}</td>
                    <td><span className={`badge badge-dot ${getStatusBadge(label.status)}`}>{getStatusLabel(label.status)}</span></td>
                    <td>{label.scanCount || 0}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn btn-sm btn-ghost" onClick={() => handleLabelStatusToggle(label)} title="Bật/Tắt">
                          {label.status === 'ACTIVE' ? <ToggleRight size={18} className="text-success"/> : <ToggleLeft size={18}/>}
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
                            distributorAddress: label.distributorAddress || ''
                          });
                          setShowBulkMapModal(true);
                        }} title="Gắn SP/Điểm bán">
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

      {/* Migrate Tab */}
      {activeTab === 'migrate' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><Upload size={20}/> Hướng dẫn Import tem cũ</h3>
          </div>
          <div className="migrate-guide">
            <p>Di trú dữ liệu từ hệ thống tem cũ sang hệ thống mới. Các serial cũ và link cũ sẽ được giữ nguyên nhưng hiển thị theo giao diện mới.</p>
            <div className="guide-steps">
              <div className="guide-step"><span className="step-num">1</span><span>Chuẩn bị danh sách serial cũ (định dạng CSV: serial,link_cũ)</span></div>
              <div className="guide-step"><span className="step-num">2</span><span>Điền thông tin nguồn gốc và mã lô mới</span></div>
              <div className="guide-step"><span className="step-num">3</span><span>Bấm "Import tem cũ" và dán dữ liệu</span></div>
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
                      onChange={e => setBatchForm({...batchForm, enterpriseId: e.target.value, productId: '', templateId: ''})}
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
                  <div className="input-group"><label>Prefix Serial (Chỉ nhập số) *</label><input className="input" value={batchForm.prefix} onChange={e => setBatchForm({...batchForm, prefix: e.target.value.replace(/\D/g, '')})} required placeholder="VD: 100" /></div>
                </div>
                <div className="form-row">
                  <div className="input-group"><label>Số lượng tem *</label><input className="input" type="number" min={1} max={10000} value={batchForm.totalLabels} onChange={e => setBatchForm({...batchForm, totalLabels: parseInt(e.target.value) || 0})} onFocus={e => e.target.select()} required /></div>
                  <div className="input-group"><label>Ngày hết hạn</label><input className="input" type="date" value={batchForm.expiryDate} onChange={e => setBatchForm({...batchForm, expiryDate: e.target.value})} /></div>
                </div>
                <div className="form-row">
                  <div className="input-group">
                    <label>Gắn với Sản phẩm</label>
                    <select className="input select" value={batchForm.productId} onChange={e => setBatchForm({...batchForm, productId: e.target.value})}>
                      <option value="">-- Chọn sản phẩm --</option>
                      {(isAdmin && batchForm.enterpriseId
                        ? products.filter(p => (p.enterpriseId?._id || p.enterpriseId) === batchForm.enterpriseId)
                        : products).map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Giao diện hiển thị (Template)</label>
                    <select className="input select" value={batchForm.templateId} onChange={e => setBatchForm({...batchForm, templateId: e.target.value})}>
                      <option value="">-- Mặc định doanh nghiệp --</option>
                      {(isAdmin && batchForm.enterpriseId
                        ? templates.filter(t => (t.enterpriseId?._id || t.enterpriseId) === batchForm.enterpriseId)
                        : templates).map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Chủ đề giao diện (Theme) *</label>
                    <select className="input select" value={batchForm.theme} onChange={e => setBatchForm({...batchForm, theme: e.target.value})} required>
                      <option value="default">Mặc định (Hiển thị chung)</option>
                      <option value="agriculture">Nông nghiệp (Lá xanh)</option>
                      <option value="appliance">Điện gia dụng / Thiết bị nhà bếp (Xanh tech)</option>
                      <option value="food">Thực phẩm</option>
                      <option value="functional_food">Thực phẩm chức năng</option>
                      <option value="medical">Y tế / Dược phẩm (Sạch & Tin cậy)</option>
                      <option value="cosmetics">Mỹ phẩm (Hồng thanh lịch)</option>
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
              <h3 className="modal-title">{selectedLabel ? 'Gắn Serial với SP/Điểm bán' : 'Cấu hình Lô tem (SP & Chủ đề)'}</h3>
              <button className="btn-icon" onClick={() => setShowMapModal(false)}><X size={20}/></button>
            </div>
            <div className="modal-body">
              {!selectedLabel && (
                <>
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
                    <label>Sản phẩm</label>
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
                      {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
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
                    <label>Sản phẩm</label>
                    <select className="input select" value={mapForm.productId} onChange={e => setMapForm({...mapForm, productId: e.target.value})}>
                      <option value="">-- Chọn sản phẩm --</option>
                      {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
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
      {showRenewModal && selectedBatch && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowRenewModal(false)}>
          <div className="modal" style={{maxWidth: 420}}>
            <div className="modal-header">
              <h3 className="modal-title">Gia hạn lô tem</h3>
              <button className="btn-icon" onClick={() => setShowRenewModal(false)}><X size={20}/></button>
            </div>
            <div className="modal-body">
              <div className="renew-info">
                <p><strong>Lô tem:</strong> {selectedBatch.batchCode}</p>
                <p><strong>Hạn hiện tại:</strong> {formatDate(selectedBatch.expiryDate)}</p>
                <p><strong>Số lượng:</strong> {selectedBatch.totalLabels} tem</p>
              </div>
              <div className="input-group"><label>Gia hạn thêm (tháng)</label><input className="input" type="number" min={1} value={renewMonths} onChange={e => setRenewMonths(parseInt(e.target.value) || 0)} onFocus={e => e.target.select()} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowRenewModal(false)}>Hủy</button>
              <button className="btn btn-success" onClick={handleRenew}><RefreshCw size={16}/> Gia hạn</button>
            </div>
          </div>
        </div>
      )}

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
                      onChange={e => setMigrateForm({...migrateForm, enterpriseId: e.target.value, productId: '', templateId: ''})}
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
                        ? products.filter(p => (p.enterpriseId?._id || p.enterpriseId) === migrateForm.enterpriseId)
                        : products).map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Giao diện hiển thị (Template)</label>
                    <select className="input select" value={migrateForm.templateId} onChange={e => setMigrateForm({...migrateForm, templateId: e.target.value})}>
                      <option value="">-- Mặc định doanh nghiệp --</option>
                      {(isAdmin && migrateForm.enterpriseId
                        ? templates.filter(t => (t.enterpriseId?._id || t.enterpriseId) === migrateForm.enterpriseId)
                        : templates).map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Chủ đề giao diện (Theme)</label>
                    <select className="input select" value={migrateForm.theme} onChange={e => setMigrateForm({...migrateForm, theme: e.target.value})}>
                      <option value="default">Mặc định (Hiển thị chung)</option>
                      <option value="agriculture">Nông nghiệp (Lá xanh)</option>
                      <option value="appliance">Điện gia dụng / Thiết bị nhà bếp (Xanh tech)</option>
                      <option value="food">Thực phẩm</option>
                      <option value="functional_food">Thực phẩm chức năng</option>
                      <option value="medical">Y tế / Dược phẩm (Sạch & Tin cậy)</option>
                      <option value="cosmetics">Mỹ phẩm (Hồng thanh lịch)</option>
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
                  <label>Gắn với Sản phẩm</label>
                  <select
                    className="input select"
                    value={bulkForm.productId}
                    onChange={e => setBulkForm({ ...bulkForm, productId: e.target.value, distributorIdx: '', distributorName: '', distributorAddress: '' })}
                  >
                    <option value="">-- Chọn sản phẩm --</option>
                    {products.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
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
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowBulkMapModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary"><Link2 size={16}/> Thực hiện Gắn kết</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
