import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import * as XLSX from 'xlsx';
import {
  Tag, Download, RefreshCw, X, CheckCircle, Clock, Eye, Package, ExternalLink, QrCode, Search, ChevronDown, Filter, RotateCcw
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

  return (
    <div className="labels-page npp-labels-page">
      {/* ── Page Header chuẩn Admin ── */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1>Tem Đã Nhận Phân Phối</h1>
          <p>Quản lý và tra cứu toàn bộ tem nhãn sản phẩm bạn đã nhận từ Nhà Sản Xuất</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn btn-primary"
            onClick={handleExportExcel}
            disabled={exporting || labels.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Xuất danh sách tem ra file Excel"
          >
            <Download size={16} />
            <span>{exporting ? 'Đang xuất Excel...' : 'Xuất Excel'}</span>
          </button>
          <button
            className="btn btn-ghost"
            onClick={loadLabels}
            style={{ border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Thống kê tóm tắt tinh tế chuẩn Admin ── */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span className="badge badge-neutral" style={{ fontSize: '0.82rem', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Tag size={13} style={{ color: 'var(--color-accent)' }} /> Tổng tem đã nhận: <strong style={{ color: 'var(--color-text-primary)' }}>{stats.totalLabels.toLocaleString('vi-VN')}</strong>
        </span>
        <span className="badge badge-success" style={{ fontSize: '0.82rem', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle size={13} /> Đang hoạt động: <strong>{stats.activeLabels.toLocaleString('vi-VN')}</strong>
        </span>
        <span className="badge badge-info" style={{ fontSize: '0.82rem', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Eye size={13} /> Đã quét tra cứu: <strong>{stats.scannedLabels.toLocaleString('vi-VN')}</strong>
        </span>
      </div>

      {/* ── Filter Toolbar chuẩn Admin (Labels.css) ── */}
      <div className="filter-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Ô tìm kiếm đồng bộ */}
          <div className="search-box" style={{ flex: '1 1 280px' }}>
            <Search size={16} className="search-icon" />
            <input
              className="input"
              placeholder="Tìm nhanh: Mã Serial, Mã kích hoạt, Mã SMS..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearch('')}
                title="Xóa tìm kiếm"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Lọc theo Sản phẩm */}
          <div className={`filter-select-wrapper ${selectedProduct ? 'is-active' : ''}`} style={{ minWidth: '220px', flex: '0 1 auto' }}>
            <Package size={16} className="filter-icon" />
            <select
              className="filter-select"
              value={selectedProduct}
              onChange={e => setSelectedProduct(e.target.value)}
              title="Lọc theo sản phẩm"
            >
              <option value="">Tất cả sản phẩm {products.length > 0 ? `(${products.length})` : ''}</option>
              {products.map(p => (
                <option key={p._id} value={p._id}>
                  {p.name} {p.totalLabelsReceived ? `(${p.totalLabelsReceived} tem)` : ''}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="filter-arrow" />
          </div>

          {/* Lọc theo Trạng thái */}
          <div className={`filter-select-wrapper ${selectedStatus ? 'is-active' : ''}`} style={{ minWidth: '180px', flex: '0 1 auto' }}>
            <Filter size={15} className="filter-icon" />
            <select
              className="filter-select"
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              title="Lọc theo trạng thái"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="SCANNED">Đã quét tra cứu</option>
              <option value="INACTIVE">Chưa kích hoạt</option>
            </select>
            <ChevronDown size={14} className="filter-arrow" />
          </div>

          {/* Nút Xóa lọc nếu có filter */}
          {(selectedProduct || selectedStatus || search) && (
            <button
              type="button"
              className="filter-reset-btn"
              onClick={() => {
                setSelectedProduct('');
                setSelectedStatus('');
                setSearch('');
              }}
              title="Đặt lại bộ lọc"
            >
              <RotateCcw size={13} />
              <span>Đặt lại</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Bảng dữ liệu Tem nhãn chuẩn Admin (card + table) ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div className="loading-spinner" style={{ width: 36, height: 36, margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Đang tải dữ liệu tem nhãn phân phối...</p>
          </div>
        ) : labels.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Tag size={44} style={{ color: 'var(--color-text-muted)', opacity: 0.6, marginBottom: 12 }} />
            <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text-primary)', margin: '0 0 6px 0' }}>Không tìm thấy tem nhãn nào</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', margin: 0 }}>
              {search || selectedProduct || selectedStatus
                ? 'Không có tem nào khớp với điều kiện tìm kiếm/bộ lọc.'
                : 'Bạn chưa có con tem nào trong kho. Hãy quét tem để nhập hàng.'}
            </p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 50, textAlign: 'center' }}>STT</th>
                    <th style={{ width: 140 }}>Mã Serial</th>
                    <th>Sản phẩm</th>
                    <th style={{ width: 130 }}>Lô tem</th>
                    <th style={{ width: 160 }}>Trạng thái</th>
                    <th style={{ width: 150 }}>Mã xác thực</th>
                    <th style={{ width: 90, textAlign: 'center' }}>Lượt quét</th>
                    <th style={{ width: 110 }}>Ngày nhận</th>
                    <th style={{ width: 80, textAlign: 'center' }}>Tra cứu</th>
                  </tr>
                </thead>
                <tbody>
                  {labels.map((item, idx) => {
                    const serialIndex = (pagination.page - 1) * pagination.limit + idx + 1;
                    const scanUrl = item.qrUrl || `/scan/${item.serialNumber}`;

                    return (
                      <tr key={item._id}>
                        <td style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                          {serialIndex}
                        </td>
                        <td>
                          <span className="batch-code">{item.serialNumber}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {item.productId?.images?.[0] ? (
                              <img
                                src={item.productId.images[0]}
                                alt=""
                                style={{ width: 34, height: 34, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--color-border)', flexShrink: 0 }}
                                onError={e => { e.target.style.display = 'none'; }}
                              />
                            ) : (
                              <div style={{ width: 34, height: 34, borderRadius: 6, background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                                <Package size={15} />
                              </div>
                            )}
                            <div>
                              <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.88rem', display: 'block' }}>
                                {item.productId?.name || 'Sản phẩm chưa gán'}
                              </strong>
                              {item.productId?.sku && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                                  SKU: {item.productId.sku}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ background: 'var(--color-bg-tertiary)', padding: '3px 8px', borderRadius: 4, fontSize: '0.78rem', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', fontWeight: 500 }}>
                            {item.batchId?.batchCode || 'N/A'}
                          </span>
                        </td>
                        <td>{getStatusBadge(item.status, item.scanCount)}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>
                            {item.activeCode && <span>Active: <code style={{ background: 'var(--color-bg-tertiary)', padding: '1px 5px', borderRadius: 3, border: '1px solid var(--color-border)' }}>{item.activeCode}</code></span>}
                            {item.smsCode && <span>SMS: <code style={{ background: 'var(--color-bg-tertiary)', padding: '1px 5px', borderRadius: 3, border: '1px solid var(--color-border)' }}>{item.smsCode}</code></span>}
                            {!item.activeCode && !item.smsCode && <span className="text-muted">—</span>}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            background: item.scanCount > 0 ? 'var(--color-info-bg)' : 'var(--color-bg-tertiary)',
                            color: item.scanCount > 0 ? 'var(--color-info)' : 'var(--color-text-muted)',
                            border: item.scanCount > 0 ? '1px solid rgba(2, 132, 199, 0.2)' : '1px solid var(--color-border)'
                          }}>
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
                            className="btn btn-icon"
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 6, border: '1px solid var(--color-border)', color: 'var(--color-accent)' }}
                            title="Mở trang tra cứu tem này"
                          >
                            <QrCode size={15} />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Phân trang */}
            {pagination.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-card)', flexWrap: 'wrap', gap: 12 }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
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
