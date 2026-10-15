import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import * as XLSX from 'xlsx';
import {
  Tag, Search, Filter, RefreshCw, Download, ExternalLink,
  CheckCircle, Clock, Eye, Package, X, QrCode, ShieldCheck, Activity
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

  const getStatusBadge = (status, scanCount = 0) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="badge badge-success"><CheckCircle size={12} /> Đang hoạt động</span>;
      case 'SCANNED':
        return <span className="badge badge-info"><Eye size={12} /> Đã quét ({scanCount})</span>;
      case 'INACTIVE':
      default:
        return <span className="badge badge-neutral"><Clock size={12} /> Chưa kích hoạt</span>;
    }
  };

  const activePercent = stats.totalLabels > 0 ? Math.round((stats.activeLabels / stats.totalLabels) * 100) : 0;
  const scannedPercent = stats.totalLabels > 0 ? Math.round((stats.scannedLabels / stats.totalLabels) * 100) : 0;

  return (
    <div className="npp-labels-container">
      {/* Page Header */}
      <div className="page-header npp-header-row">
        <div>
          <h1 className="npp-title">
            <Tag size={26} className="title-icon" />
            Tem Đã Nhận Phân Phối
          </h1>
          <p className="page-subtitle">
            Quản lý và tra cứu toàn bộ tem nhãn sản phẩm bạn đã nhận từ Nhà Sản Xuất
          </p>
        </div>

        <div className="npp-actions-group">
          <button
            className="btn btn-primary"
            onClick={handleExportExcel}
            disabled={exporting || labels.length === 0}
            title="Xuất toàn bộ danh sách tem ra file Excel"
          >
            <Download size={16} />
            <span>{exporting ? 'Đang xuất Excel...' : 'Xuất Excel'}</span>
          </button>
          <button className="btn btn-secondary" onClick={loadLabels} title="Làm mới dữ liệu">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid npp-stats-row">
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-info">
              <span className="stat-label">Tổng tem đã nhận</span>
              <span className="stat-value">{stats.totalLabels.toLocaleString('vi-VN')}</span>
            </div>
            <div className="stat-icon" style={{ background: 'var(--gradient-primary)' }}>
              <Tag size={22} />
            </div>
          </div>
          <div className="stat-card-bottom">
            <span className="stat-change up">
              <ShieldCheck size={14} /> Phân phối chính hãng
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-info">
              <span className="stat-label">Tem đang hoạt động</span>
              <span className="stat-value">{stats.activeLabels.toLocaleString('vi-VN')}</span>
            </div>
            <div className="stat-icon" style={{ background: 'var(--gradient-success)' }}>
              <CheckCircle size={22} />
            </div>
          </div>
          <div className="stat-card-bottom">
            <span className="stat-change up">
              <Activity size={14} /> {activePercent}% trên tổng số tem
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-info">
              <span className="stat-label">Tem đã được quét tra cứu</span>
              <span className="stat-value">{stats.scannedLabels.toLocaleString('vi-VN')}</span>
            </div>
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #0284c7, #38bdf8)' }}>
              <Eye size={22} />
            </div>
          </div>
          <div className="stat-card-bottom">
            <span className="stat-change" style={{ color: 'var(--color-info)' }}>
              <Eye size={14} /> {scannedPercent}% người dùng đã quét
            </span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card npp-filter-card">
        <div className="npp-filter-controls">
          {/* Search box */}
          <div className="npp-search-wrapper">
            <Search size={17} className="npp-search-icon" />
            <input
              type="text"
              className="input npp-search-input"
              placeholder="Tìm theo Serial, mã kích hoạt, mã SMS..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="npp-clear-btn" onClick={() => setSearch('')}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Product dropdown */}
          <div className="npp-select-wrapper">
            <Package size={16} className="npp-select-icon" />
            <select
              className="select npp-custom-select"
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

          {/* Filter Status dropdown */}
          <div className="npp-select-wrapper">
            <Filter size={16} className="npp-select-icon" />
            <select
              className="select npp-custom-select"
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
              className="btn btn-outline btn-sm npp-reset-btn"
              onClick={() => {
                setSelectedProduct('');
                setSelectedStatus('');
                setSearch('');
              }}
            >
              <X size={14} /> Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Table Card */}
      <div className="card npp-table-card">
        {loading ? (
          <div className="npp-loading-box">
            <div className="loading-spinner" style={{ width: 36, height: 36 }} />
            <p>Đang tải dữ liệu tem nhãn phân phối...</p>
          </div>
        ) : labels.length === 0 ? (
          <div className="npp-empty-box">
            <Tag size={44} className="npp-empty-icon" />
            <h3>Không tìm thấy tem nhãn nào</h3>
            <p>
              {search || selectedProduct || selectedStatus
                ? 'Không có tem nào khớp với điều kiện tìm kiếm/bộ lọc.'
                : 'Bạn chưa có con tem nào trong kho. Hãy quét tem để nhập hàng.'}
            </p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="table npp-data-table">
                <thead>
                  <tr>
                    <th style={{ width: 55, textAlign: 'center' }}>STT</th>
                    <th style={{ width: 140 }}>Mã Serial</th>
                    <th>Sản phẩm</th>
                    <th style={{ width: 130 }}>Lô tem</th>
                    <th style={{ width: 160 }}>Trạng thái</th>
                    <th style={{ width: 150 }}>Mã xác thực</th>
                    <th style={{ width: 90, textAlign: 'center' }}>Lượt quét</th>
                    <th style={{ width: 120 }}>Ngày nhận</th>
                    <th style={{ width: 80, textAlign: 'center' }}>Tra cứu</th>
                  </tr>
                </thead>
                <tbody>
                  {labels.map((item, idx) => {
                    const serialIndex = (pagination.page - 1) * pagination.limit + idx + 1;
                    const scanUrl = item.qrUrl || `/scan/${item.serialNumber}`;

                    return (
                      <tr key={item._id}>
                        <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                          {serialIndex}
                        </td>
                        <td>
                          <span className="npp-serial-tag">{item.serialNumber}</span>
                        </td>
                        <td>
                          <div className="npp-prod-cell">
                            {item.productId?.images?.[0] ? (
                              <img
                                src={item.productId.images[0]}
                                alt=""
                                className="npp-prod-thumb"
                                onError={e => { e.target.style.display = 'none'; }}
                              />
                            ) : (
                              <div className="npp-prod-thumb-empty">
                                <Package size={16} />
                              </div>
                            )}
                            <div>
                              <strong className="npp-prod-name">
                                {item.productId?.name || 'Sản phẩm chưa gán'}
                              </strong>
                              {item.productId?.sku && (
                                <span className="npp-prod-sku">SKU: {item.productId.sku}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="npp-batch-pill">
                            {item.batchId?.batchCode || 'N/A'}
                          </span>
                        </td>
                        <td>{getStatusBadge(item.status, item.scanCount)}</td>
                        <td>
                          <div className="npp-auth-codes">
                            {item.activeCode && <span>Active: <code>{item.activeCode}</code></span>}
                            {item.smsCode && <span>SMS: <code>{item.smsCode}</code></span>}
                            {!item.activeCode && !item.smsCode && <span className="text-muted">—</span>}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`npp-scan-pill ${item.scanCount > 0 ? 'scanned' : ''}`}>
                            {item.scanCount || 0}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                          {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('vi-VN') : '—'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <a
                            href={scanUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="npp-qr-btn"
                            title="Mở trang tra cứu tem này"
                          >
                            <QrCode size={15} />
                            <ExternalLink size={11} />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="npp-pagination-bar">
                <span className="npp-page-info">
                  Hiển thị {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} / <strong>{pagination.total}</strong> tem
                </span>
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={page => setPagination(prev => ({ ...prev, page }))}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
