import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Package, Search, Building2, Tag, Eye, X, ShieldCheck,
  RefreshCw, CheckCircle, ExternalLink, Layers, Info
} from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import './NppProducts.css';

export default function NppProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await api.nppGetProducts();
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Lỗi tải sản phẩm NPP:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    if (!debouncedSearch) return true;
    const term = debouncedSearch.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.sku && p.sku.toLowerCase().includes(term)) ||
      (p.category && p.category.toLowerCase().includes(term)) ||
      (p.enterpriseId?.name && p.enterpriseId.name.toLowerCase().includes(term))
    );
  });

  const totalLabels = products.reduce((sum, p) => sum + (p.totalLabelsReceived || 0), 0);
  const uniqueEnterprises = new Set(products.map(p => p.enterpriseId?.name || p.manufacturerId?.name).filter(Boolean)).size || 1;

  return (
    <div className="npp-products-container">
      {/* Page Header */}
      <div className="page-header npp-header-row">
        <div>
          <h1 className="npp-title">
            <Package size={26} className="title-icon" />
            Sản Phẩm Đã Nhận Phân Phối
          </h1>
          <p className="page-subtitle">
            Danh mục các sản phẩm bạn đã nhận và phân phối từ Nhà Sản Xuất
          </p>
        </div>
        <button className="btn btn-secondary" onClick={loadProducts} title="Làm mới">
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid npp-stats-row">
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-info">
              <span className="stat-label">Tổng loại sản phẩm</span>
              <span className="stat-value">{products.length}</span>
            </div>
            <div className="stat-icon" style={{ background: 'var(--gradient-primary)' }}>
              <Package size={22} />
            </div>
          </div>
          <div className="stat-card-bottom">
            <span className="stat-change up">
              <CheckCircle size={14} /> Danh mục ủy quyền
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-info">
              <span className="stat-label">Tổng tem đã nhận</span>
              <span className="stat-value">{totalLabels.toLocaleString('vi-VN')}</span>
            </div>
            <div className="stat-icon" style={{ background: 'var(--gradient-success)' }}>
              <Tag size={22} />
            </div>
          </div>
          <div className="stat-card-bottom">
            <span className="stat-change up">
              <ShieldCheck size={14} /> Tem QR chính hãng
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-info">
              <span className="stat-label">Nhà sản xuất đối tác</span>
              <span className="stat-value">{uniqueEnterprises}</span>
            </div>
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              <Building2 size={22} />
            </div>
          </div>
          <div className="stat-card-bottom">
            <span className="stat-change" style={{ color: 'var(--color-warning)' }}>
              <Building2 size={14} /> Đơn vị bảo trợ nguồn gốc
            </span>
          </div>
        </div>
      </div>

      {/* Filter Card */}
      <div className="card npp-filter-card">
        <div className="npp-filter-controls">
          <div className="npp-search-wrapper" style={{ maxWidth: 450 }}>
            <Search size={17} className="npp-search-icon" />
            <input
              type="text"
              className="input npp-search-input"
              placeholder="Tìm theo tên sản phẩm, mã SKU, danh mục, NSX..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="npp-clear-btn" onClick={() => setSearch('')}>
                <X size={14} />
              </button>
            )}
          </div>
          <span className="npp-filter-note">
            Hiển thị <strong>{filteredProducts.length}</strong> / {products.length} sản phẩm
          </span>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="card npp-loading-box">
          <div className="loading-spinner" style={{ width: 36, height: 36 }} />
          <p>Đang tải danh sách sản phẩm phân phối...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="card npp-empty-box">
          <Package size={48} className="npp-empty-icon" />
          <h3>Chưa có sản phẩm nào</h3>
          <p>
            {search
              ? 'Không tìm thấy sản phẩm phù hợp với từ khóa.'
              : 'Bạn chưa nhận tem hoặc sản phẩm nào từ Nhà Sản Xuất. Hãy quét tem để nhập hàng.'}
          </p>
        </div>
      ) : (
        <div className="npp-prod-grid">
          {filteredProducts.map(product => {
            const mfgName = product.enterpriseId?.name || product.manufacturerId?.name || 'Nhà sản xuất';
            const imgUrl = (product.images && product.images.length > 0 && product.images[0]) || '';

            return (
              <div key={product._id} className="npp-prod-card card">
                <div className="npp-card-media">
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={product.name}
                      onError={e => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="npp-media-fallback" style={{ display: imgUrl ? 'none' : 'flex' }}>
                    <Package size={40} />
                  </div>

                  {product.category && (
                    <span className="npp-badge-cat">{product.category}</span>
                  )}
                  {product.totalLabelsReceived > 0 && (
                    <span className="npp-badge-count">
                      <Tag size={12} /> {product.totalLabelsReceived.toLocaleString('vi-VN')} tem
                    </span>
                  )}
                </div>

                <div className="npp-card-content">
                  <h3 className="npp-card-title" title={product.name}>
                    {product.name}
                  </h3>

                  <div className="npp-card-meta-list">
                    {product.sku && (
                      <div className="npp-meta-row">
                        <span className="npp-meta-tag">SKU: {product.sku}</span>
                      </div>
                    )}
                    <div className="npp-meta-row">
                      <Building2 size={13} className="text-muted" />
                      <span className="npp-meta-mfg" title={mfgName}>{mfgName}</span>
                    </div>
                  </div>

                  {product.description && (
                    <p className="npp-card-summary">
                      {product.description}
                    </p>
                  )}
                </div>

                <div className="npp-card-footer">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <Eye size={14} /> Chi tiết
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate(`/npp/labels?productId=${product._id}`)}
                    title="Xem danh sách tem của sản phẩm này"
                  >
                    <Tag size={14} /> Xem tem ({product.totalLabelsReceived || 0})
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content npp-modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="npp-modal-title">
                <Package size={22} className="title-icon" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--color-text-primary)' }}>
                    {selectedProduct.name}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    NSX: {selectedProduct.enterpriseId?.name || selectedProduct.manufacturerId?.name || 'Doanh nghiệp'}
                  </span>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setSelectedProduct(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body npp-modal-body">
              {/* Product Gallery */}
              {selectedProduct.images && selectedProduct.images.length > 0 && (
                <div className="npp-detail-block">
                  <label className="npp-block-label">Hình ảnh sản phẩm:</label>
                  <div className="npp-modal-gallery">
                    {selectedProduct.images.filter(Boolean).map((img, i) => (
                      <a key={i} href={img} target="_blank" rel="noreferrer" className="npp-thumb-link">
                        <img src={img} alt={`Ảnh ${i + 1}`} onError={e => { e.target.style.display = 'none'; }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Specs */}
              <div className="npp-detail-specs-grid">
                <div className="npp-spec-item">
                  <span className="spec-k">Mã SKU:</span>
                  <span className="spec-v font-mono">{selectedProduct.sku || 'Chưa cập nhật'}</span>
                </div>
                <div className="npp-spec-item">
                  <span className="spec-k">Mã Vạch:</span>
                  <span className="spec-v font-mono">{selectedProduct.barcode || 'Chưa cập nhật'}</span>
                </div>
                <div className="npp-spec-item">
                  <span className="spec-k">Danh mục:</span>
                  <span className="spec-v">{selectedProduct.category || 'Mặc định'}</span>
                </div>
                <div className="npp-spec-item">
                  <span className="spec-k">Số tem đã nhận:</span>
                  <span className="spec-v highlight">
                    {selectedProduct.totalLabelsReceived?.toLocaleString('vi-VN') || 0} tem
                  </span>
                </div>
              </div>

              {/* Description */}
              {selectedProduct.description && (
                <div className="npp-detail-block">
                  <label className="npp-block-label">Mô tả sản phẩm:</label>
                  <p className="npp-desc-text">{selectedProduct.description}</p>
                </div>
              )}

              {/* Specifications map */}
              {selectedProduct.specifications && Object.keys(selectedProduct.specifications).length > 0 && (
                <div className="npp-detail-block">
                  <label className="npp-block-label">Thông số kỹ thuật:</label>
                  <div className="table-container" style={{ border: '1px solid var(--color-border)' }}>
                    <table className="table">
                      <tbody>
                        {Object.entries(selectedProduct.specifications).map(([k, v]) => (
                          <tr key={k}>
                            <td style={{ width: '35%', fontWeight: 600, color: 'var(--color-text-secondary)', background: 'var(--color-bg-tertiary)' }}>
                              {k}
                            </td>
                            <td>{v}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Verification Message */}
              {selectedProduct.verificationText && (
                <div className="npp-verify-alert">
                  <ShieldCheck size={20} className="text-success" />
                  <div>
                    <strong>Thông điệp xác thực QR:</strong>
                    <p style={{ margin: '4px 0 0', whiteSpace: 'pre-line', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                      {selectedProduct.verificationText}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-primary"
                onClick={() => {
                  const pid = selectedProduct._id;
                  setSelectedProduct(null);
                  navigate(`/npp/labels?productId=${pid}`);
                }}
              >
                <Tag size={15} /> Xem danh sách tem
              </button>
              <button className="btn btn-secondary" onClick={() => setSelectedProduct(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
