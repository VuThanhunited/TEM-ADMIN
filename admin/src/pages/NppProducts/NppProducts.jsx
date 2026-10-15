import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Package, Search, Building2, Tag, Eye, X, ShieldCheck,
  FileText, ExternalLink, RefreshCw, Layers, CheckCircle2, AlertCircle
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

  return (
    <div className="npp-products-page">
      {/* Header */}
      <div className="npp-page-header">
        <div>
          <h1 className="npp-page-title">
            <Package className="text-primary" size={26} />
            Sản Phẩm Phân Phối
          </h1>
          <p className="npp-page-subtitle">
            Danh mục các sản phẩm bạn đã nhận và phân phối từ Nhà Sản Xuất
          </p>
        </div>
        <button className="btn btn-secondary" onClick={loadProducts} title="Làm mới">
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="npp-stats-grid">
        <div className="npp-stat-card">
          <div className="npp-stat-icon bg-indigo">
            <Package size={22} />
          </div>
          <div className="npp-stat-info">
            <span className="npp-stat-label">Tổng loại sản phẩm</span>
            <span className="npp-stat-value">{products.length}</span>
          </div>
        </div>

        <div className="npp-stat-card">
          <div className="npp-stat-icon bg-emerald">
            <Tag size={22} />
          </div>
          <div className="npp-stat-info">
            <span className="npp-stat-label">Tổng tem đã nhận</span>
            <span className="npp-stat-value">{totalLabels.toLocaleString()}</span>
          </div>
        </div>

        <div className="npp-stat-card">
          <div className="npp-stat-icon bg-amber">
            <Building2 size={22} />
          </div>
          <div className="npp-stat-info">
            <span className="npp-stat-label">Nhà sản xuất đối tác</span>
            <span className="npp-stat-value">
              {new Set(products.map(p => p.enterpriseId?.name || p.manufacturerId?.name).filter(Boolean)).size || 1}
            </span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="npp-toolbar">
        <div className="npp-search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="input search-input"
            placeholder="Tìm theo tên sản phẩm, mã SKU, danh mục, NSX..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search" onClick={() => setSearch('')}>
              <X size={15} />
            </button>
          )}
        </div>
        <span className="npp-results-count">
          Hiển thị <strong>{filteredProducts.length}</strong> / {products.length} sản phẩm
        </span>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="npp-loading-state">
          <div className="loading-spinner" style={{ width: 36, height: 36 }} />
          <p>Đang tải danh sách sản phẩm phân phối...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="npp-empty-state">
          <Package size={56} className="empty-icon" />
          <h3>Chưa có sản phẩm nào</h3>
          <p>
            {search
              ? 'Không tìm thấy sản phẩm phù hợp với từ khóa.'
              : 'Bạn chưa nhận tem hoặc sản phẩm nào từ Nhà Sản Xuất. Hãy quét tem để nhập hàng.'}
          </p>
        </div>
      ) : (
        <div className="npp-cards-grid">
          {filteredProducts.map(product => {
            const mfgName = product.enterpriseId?.name || product.manufacturerId?.name || 'Nhà sản xuất';
            const imgUrl = (product.images && product.images.length > 0 && product.images[0]) || '/placeholder-product.png';

            return (
              <div key={product._id} className="npp-product-card">
                <div className="npp-card-thumb">
                  <img
                    src={imgUrl}
                    alt={product.name}
                    onError={e => { e.target.src = 'https://placehold.co/400x300/1e293b/94a3b8?text=TEM+QR'; }}
                  />
                  {product.category && (
                    <span className="npp-card-category">{product.category}</span>
                  )}
                  {product.totalLabelsReceived > 0 && (
                    <span className="npp-card-label-badge">
                      <Tag size={12} /> {product.totalLabelsReceived.toLocaleString()} tem
                    </span>
                  )}
                </div>

                <div className="npp-card-body">
                  <h3 className="npp-card-name" title={product.name}>
                    {product.name}
                  </h3>

                  <div className="npp-card-meta">
                    {product.sku && (
                      <div className="npp-meta-item">
                        <span className="meta-label">SKU:</span>
                        <code className="meta-code">{product.sku}</code>
                      </div>
                    )}
                    <div className="npp-meta-item">
                      <Building2 size={13} className="meta-icon" />
                      <span className="meta-mfg" title={mfgName}>{mfgName}</span>
                    </div>
                  </div>

                  {product.description && (
                    <p className="npp-card-desc">
                      {product.description}
                    </p>
                  )}
                </div>

                <div className="npp-card-actions">
                  <button
                    className="btn btn-secondary btn-sm"
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
          <div className="modal-content npp-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <Package size={22} className="text-primary" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>{selectedProduct.name}</h3>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    NSX: {selectedProduct.enterpriseId?.name || selectedProduct.manufacturerId?.name || 'Doanh nghiệp'}
                  </span>
                </div>
              </div>
              <button className="btn-close" onClick={() => setSelectedProduct(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body npp-detail-body">
              {/* Product Gallery */}
              {selectedProduct.images && selectedProduct.images.length > 0 && (
                <div className="npp-gallery-section">
                  <label className="section-label">Hình ảnh sản phẩm:</label>
                  <div className="npp-gallery-row">
                    {selectedProduct.images.filter(Boolean).map((img, i) => (
                      <a key={i} href={img} target="_blank" rel="noreferrer" className="gallery-thumb">
                        <img src={img} alt={`Ảnh ${i + 1}`} onError={e => { e.target.style.display = 'none'; }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Specs */}
              <div className="npp-specs-grid">
                <div className="spec-card">
                  <span className="spec-label">Mã SKU:</span>
                  <span className="spec-value">{selectedProduct.sku || 'Chưa cập nhật'}</span>
                </div>
                <div className="spec-card">
                  <span className="spec-label">Mã Vạch / Barcode:</span>
                  <span className="spec-value">{selectedProduct.barcode || 'Chưa cập nhật'}</span>
                </div>
                <div className="spec-card">
                  <span className="spec-label">Danh mục:</span>
                  <span className="spec-value">{selectedProduct.category || 'Mặc định'}</span>
                </div>
                <div className="spec-card">
                  <span className="spec-label">Số tem đã nhận:</span>
                  <span className="spec-value highlight text-primary">
                    {selectedProduct.totalLabelsReceived?.toLocaleString() || 0} tem
                  </span>
                </div>
              </div>

              {/* Description */}
              {selectedProduct.description && (
                <div className="npp-detail-section">
                  <label className="section-label">Mô tả sản phẩm:</label>
                  <p className="detail-text">{selectedProduct.description}</p>
                </div>
              )}

              {/* Specifications map */}
              {selectedProduct.specifications && Object.keys(selectedProduct.specifications).length > 0 && (
                <div className="npp-detail-section">
                  <label className="section-label">Thông số kỹ thuật:</label>
                  <div className="specs-table-wrapper">
                    <table className="specs-table">
                      <tbody>
                        {Object.entries(selectedProduct.specifications).map(([k, v]) => (
                          <tr key={k}>
                            <td className="spec-k">{k}</td>
                            <td className="spec-v">{v}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Verification Message */}
              {selectedProduct.verificationText && (
                <div className="npp-verification-box">
                  <ShieldCheck size={20} className="text-emerald" />
                  <div>
                    <strong>Nội dung xác thực khi người dùng quét QR:</strong>
                    <p style={{ margin: '4px 0 0', whiteSpace: 'pre-line', color: 'var(--text-muted)' }}>
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
                <Tag size={15} /> Xem danh sách tem của sản phẩm
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
