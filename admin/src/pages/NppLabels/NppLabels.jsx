import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import * as XLSX from 'xlsx';
import {
  Tag, Search, Filter, RefreshCw, Download, ExternalLink,
  CheckCircle, Clock, AlertCircle, Eye, Package, X, QrCode
} from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import Pagination from '../../components/Pagination';
import './NppLabels.css';

export default function NppLabels() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialProductId = searchParams.get('productId') || '';

  const [labels, setLabels] = useState([]);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ totalLabels: 0, activeLabels: 0, scannedLabels: 0 });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [selectedProduct, setSelectedProduct] = useState(initialProductId);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  // Load products list for dropdown filter
  useEffect(() => {
    api.nppGetProducts().then(res => {
      setProducts(Array.isArray(res.data) ? res.data : []);
    }).catch(err => console.error('Lỗi tải ds sản phẩm:', err));
  }, []);

  // Update query param if selectedProduct changes
  useEffect(() => {
    if (selectedProduct) {
      setSearchParams({ productId: selectedProduct });
    } else {
      setSearchParams({});
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [selectedProduct]);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [debouncedSearch, selectedStatus]);

  // Load labels whenever page or filters change
  useEffect(() => {
    loadLabels();
  }, [pagination.page, debouncedSearch, selectedProduct, selectedStatus]);

  const loadLabels = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch,
        productId: selectedProduct,
        status: selectedStatus
      };
      const res = await api.nppGetLabels(params);
      setLabels(Array.isArray(res.data) ? res.data : []);
      if (res.pagination) {
        setPagination(prev => ({ ...prev, ...res.pagination }));
      }
      if (res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách tem NPP:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      // Lấy toàn bộ tem với limit lớn (hoặc qua export API)
      const res = await api.nppGetLabels({
        page: 1,
        limit: 10000,
        search: debouncedSearch,
        productId: selectedProduct,
        status: selectedStatus
      });

      const exportData = (res.data || []).map((l, index) => ({
        'STT': index + 1,
        'Mã Serial': l.serialNumber || '',
        'Tên Sản Phẩm': l.productId?.name || 'Chưa gán',
        'Mã SKU': l.productId?.sku || '',
        'Mã Lô Tem': l.batchId?.batchCode || '',
        'Trạng Thái': l.status === 'ACTIVE' ? 'Đang hoạt động' : (l.status === 'SCANNED' ? 'Đã quét' : 'Chưa kích hoạt'),
        'Mã Kích Hoạt': l.activeCode || '',
        'Mã SMS': l.smsCode || '',
        'Số Lần Quét': l.scanCount || 0,
        'Ngày Nhận / Cập Nhật': l.updatedAt ? new Date(l.updatedAt).toLocaleString('vi-VN') : '',
        'Link Tra Cứu QR': l.qrUrl || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Tem_Da_Nhan_Phan_Phoi');
      XLSX.writeFile(workbook, `Tem_NPP_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      alert('Không thể xuất file Excel: ' + (err.message || err));
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="status-badge badge-active"><CheckCircle size={12} /> Đang hoạt động</span>;
      case 'SCANNED':
        return <span className="status-badge badge-scanned"><Eye size={12} /> Đã quét ({labels.find(l => l.status === 'SCANNED')?.scanCount || 1})</span>;
      case 'INACTIVE':
      default:
        return <span className="status-badge badge-inactive"><Clock size={12} /> Chưa kích hoạt</span>;
    }
  };

  return (
    <div className="npp-labels-page">
      {/* Page Header */}
      <div className="npp-page-header">
        <div>
          <h1 className="npp-page-title">
            <Tag className="text-primary" size={26} />
            Tem Đã Nhận Phân Phối
          </h1>
          <p className="npp-page-subtitle">
            Quản lý và tra cứu toàn bộ tem nhãn sản phẩm bạn đã nhận từ Nhà Sản Xuất
          </p>
        </div>

        <div className="npp-header-actions">
          <button
            className="btn btn-secondary"
            onClick={handleExportExcel}
            disabled={exporting || labels.length === 0}
            title="Xuất danh sách tem ra file Excel"
          >
            <Download size={16} />
            <span>{exporting ? 'Đang xuất...' : 'Xuất Excel'}</span>
          </button>
          <button className="btn btn-secondary" onClick={loadLabels} title="Làm mới">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="npp-stats-grid">
        <div className="npp-stat-card">
          <div className="npp-stat-icon bg-indigo">
            <Tag size={22} />
          </div>
          <div className="npp-stat-info">
            <span className="npp-stat-label">Tổng tem đã nhận</span>
            <span className="npp-stat-value">{stats.totalLabels.toLocaleString()}</span>
          </div>
        </div>

        <div className="npp-stat-card">
          <div className="npp-stat-icon bg-emerald">
            <CheckCircle size={22} />
          </div>
          <div className="npp-stat-info">
            <span className="npp-stat-label">Tem đang hoạt động</span>
            <span className="npp-stat-value">{stats.activeLabels.toLocaleString()}</span>
          </div>
        </div>

        <div className="npp-stat-card">
          <div className="npp-stat-icon bg-amber">
            <Eye size={22} />
          </div>
          <div className="npp-stat-info">
            <span className="npp-stat-label">Tem đã được quét tra cứu</span>
            <span className="npp-stat-value">{stats.scannedLabels.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="npp-filter-bar">
        {/* Search */}
        <div className="npp-search-box">
          <Search size={17} className="search-icon" />
          <input
            type="text"
            className="input search-input"
            placeholder="Tìm theo Serial, mã kích hoạt, mã SMS..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search" onClick={() => setSearch('')}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Product */}
        <div className="filter-select-wrapper">
          <Package size={16} className="filter-icon" />
          <select
            className="select"
            value={selectedProduct}
            onChange={e => setSelectedProduct(e.target.value)}
          >
            <option value="">Tất cả sản phẩm ({products.length})</option>
            {products.map(p => (
              <option key={p._id} value={p._id}>
                {p.name} {p.totalLabelsReceived ? `(${p.totalLabelsReceived} tem)` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Status */}
        <div className="filter-select-wrapper">
          <Filter size={16} className="filter-icon" />
          <select
            className="select"
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="SCANNED">Đã quét tra cứu</option>
            <option value="INACTIVE">Chưa kích hoạt</option>
          </select>
        </div>

        {(selectedProduct || selectedStatus || search) && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSelectedProduct('');
              setSelectedStatus('');
              setSearch('');
            }}
          >
            <X size={14} /> Bỏ lọc
          </button>
        )}
      </div>

      {/* Table of Labels */}
      <div className="npp-table-card">
        {loading ? (
          <div className="npp-loading-state">
            <div className="loading-spinner" style={{ width: 36, height: 36 }} />
            <p>Đang tải danh sách tem phân phối...</p>
          </div>
        ) : labels.length === 0 ? (
          <div className="npp-empty-state">
            <Tag size={48} className="empty-icon" />
            <h3>Không có tem nào</h3>
            <p>
              {search || selectedProduct || selectedStatus
                ? 'Không tìm thấy tem nào phù hợp với bộ lọc hiện tại.'
                : 'Bạn chưa có tem nhãn nào trong kho. Hãy quét tem để nhập hàng.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table npp-labels-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>STT</th>
                  <th>Mã Serial</th>
                  <th>Sản phẩm</th>
                  <th>Lô tem</th>
                  <th>Trạng thái</th>
                  <th>Mã xác thực</th>
                  <th>Lượt quét</th>
                  <th>Ngày nhận</th>
                  <th style={{ textAlign: 'right' }}>Tra cứu QR</th>
                </tr>
              </thead>
              <tbody>
                {labels.map((item, idx) => {
                  const serialIndex = (pagination.page - 1) * pagination.limit + idx + 1;
                  const scanUrl = item.qrUrl || `/scan/${item.serialNumber}`;

                  return (
                    <tr key={item._id}>
                      <td className="text-muted">{serialIndex}</td>
                      <td>
                        <code className="serial-badge">{item.serialNumber}</code>
                      </td>
                      <td>
                        <div className="table-product-cell">
                          {item.productId?.images?.[0] && (
                            <img
                              src={item.productId.images[0]}
                              alt=""
                              className="product-mini-thumb"
                              onError={e => { e.target.style.display = 'none'; }}
                            />
                          )}
                          <div>
                            <strong className="product-title-cell">
                              {item.productId?.name || 'Chưa gán'}
                            </strong>
                            {item.productId?.sku && (
                              <div className="product-sku-cell">SKU: {item.productId.sku}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="batch-code-tag">
                          {item.batchId?.batchCode || 'N/A'}
                        </span>
                      </td>
                      <td>{getStatusBadge(item.status)}</td>
                      <td>
                        <div className="auth-codes-cell">
                          {item.activeCode && <span title="Mã cào / Kích hoạt">Active: <code>{item.activeCode}</code></span>}
                          {item.smsCode && <span title="Mã SMS">SMS: <code>{item.smsCode}</code></span>}
                          {!item.activeCode && !item.smsCode && <span className="text-muted">—</span>}
                        </div>
                      </td>
                      <td>
                        <span className={`scan-count-badge ${item.scanCount > 0 ? 'has-scans' : ''}`}>
                          {item.scanCount || 0}
                        </span>
                      </td>
                      <td className="text-muted" style={{ fontSize: '0.82rem' }}>
                        {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <a
                          href={scanUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-qr-link"
                          title="Mở trang tra cứu tem này"
                        >
                          <QrCode size={15} />
                          <ExternalLink size={12} />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="npp-pagination-wrapper">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={page => setPagination(prev => ({ ...prev, page }))}
            />
          </div>
        )}
      </div>
    </div>
  );
}
