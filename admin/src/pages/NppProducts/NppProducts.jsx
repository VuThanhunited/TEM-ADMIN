import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Package, Search, Building2, Tag, Eye, X, ShieldCheck,
  RefreshCw, CheckCircle, Image as ImageIcon
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
    <div className="products-page npp-products-page">
      {/* ── Page Header chuẩn Admin ── */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1>Sản Phẩm Đã Nhận Phân Phối</h1>
          <p>Danh mục các sản phẩm bạn đã nhận và phân phối từ Nhà Sản Xuất</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="badge badge-neutral" style={{ fontSize: '0.82rem', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Package size={13} style={{ color: 'var(--color-accent)' }} /> <strong>{products.length}</strong> loại sản phẩm
          </span>
          <span className="badge badge-success" style={{ fontSize: '0.82rem', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Tag size={13} /> <strong>{totalLabels.toLocaleString('vi-VN')}</strong> tem đã nhận
          </span>
          <button
            className="btn btn-ghost"
            onClick={loadProducts}
            style={{ border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Làm mới"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Thanh lọc Filter Toolbar chuẩn Admin ── */}
      <div className="filter-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div className="search-box" style={{ flex: '1 1 300px' }}>
            <Search size={16} className="search-icon" />
            <input
              className="input"
              placeholder="Tìm nhanh: Tên sản phẩm, mã SKU, danh mục, NSX..."
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
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
            Hiển thị <strong>{filteredProducts.length}</strong> / {products.length} sản phẩm
          </span>
        </div>
      </div>

      {/* ── Danh sách sản phẩm dạng Products-grid chuẩn Admin ── */}
      {loading ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div className="loading-spinner" style={{ width: 36, height: 36, margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Đang tải danh sách sản phẩm phân phối...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Package size={48} style={{ color: 'var(--color-text-muted)', opacity: 0.6, marginBottom: 12 }} />
          <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text-primary)', margin: '0 0 6px 0' }}>Chưa có sản phẩm nào</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', margin: 0 }}>
            {search
              ? 'Không tìm thấy sản phẩm phù hợp với từ khóa.'
              : 'Bạn chưa nhận tem hoặc sản phẩm nào từ Nhà Sản Xuất. Hãy quét tem để nhập hàng.'}
          </p>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map(product => {
            const mfgName = product.enterpriseId?.name || product.manufacturerId?.name || 'Nhà sản xuất';
            const imgUrl = (product.images && product.images.length > 0 && product.images[0]) || '';

            return (
              <div key={product._id} className="product-card card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="product-image">
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={product.name}
                      onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    />
                  ) : null}
                  <div className="product-image-placeholder" style={{ display: imgUrl ? 'none' : 'flex' }}>
                    <ImageIcon size={36} />
                  </div>

                  {product.category && (
                    <span className="badge badge-neutral" style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)', color: 'var(--color-text-primary)' }}>
                      {product.category}
                    </span>
                  )}

                  {product.totalLabelsReceived > 0 && (
                    <span style={{
                      position: 'absolute', bottom: 8, right: 8,
                      background: 'var(--gradient-success)', color: '#fff',
                      fontSize: '0.74rem', fontWeight: 700, padding: '3px 8px',
                      borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4,
                      boxShadow: '0 2px 6px rgba(16,185,129,0.35)'
                    }}>
                      <Tag size={11} /> {product.totalLabelsReceived.toLocaleString('vi-VN')} tem
                    </span>
                  )}
                </div>

                <div className="product-info" style={{ flex: 1 }}>
                  <h3 className="product-name" title={product.name}>
                    {product.name}
                  </h3>

                  {product.sku && (
                    <span className="product-sku">SKU: {product.sku}</span>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                    <Building2 size={12} style={{ flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={mfgName}>
                      {mfgName}
                    </span>
                  </div>

                  {product.description && (
                    <p className="product-desc">
                      {product.description}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, padding: '12px var(--spacing-lg)', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-tertiary)' }}>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => setSelectedProduct(product)}
                    style={{ flex: 1, border: '1px solid var(--color-border)', justifyContent: 'center' }}
                  >
                    <Eye size={14} /> Chi tiết
                  </button>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => navigate(`/npp/labels?productId=${product._id}`)}
                    style={{ flex: 1, justifyContent: 'center' }}
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

      {/* ── Modal chi tiết sản phẩm chuẩn Admin ── */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelectedProduct(null)}>
          <div className="modal" style={{ maxWidth: 660 }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Package size={20} className="text-primary" />
                {selectedProduct.name}
              </h3>
              <button className="btn-icon" onClick={() => setSelectedProduct(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Ảnh gallery */}
              {selectedProduct.images && selectedProduct.images.length > 0 && (
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>
                    Hình ảnh sản phẩm:
                  </label>
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                    {selectedProduct.images.filter(Boolean).map((img, i) => (
                      <a key={i} href={img} target="_blank" rel="noreferrer" style={{ width: 72, height: 72, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--color-border)', flexShrink: 0 }}>
                        <img src={img} alt={`Ảnh ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Thông tin nhanh */}
              <div className="form-row" style={{ gap: 10 }}>
                <div style={{ background: 'var(--color-bg-tertiary)', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Mã SKU</span>
                  <strong style={{ fontSize: '0.88rem', fontFamily: 'monospace', color: 'var(--color-text-primary)' }}>{selectedProduct.sku || 'Chưa cập nhật'}</strong>
                </div>
                <div style={{ background: 'var(--color-bg-tertiary)', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Mã Vạch Barcode</span>
                  <strong style={{ fontSize: '0.88rem', fontFamily: 'monospace', color: 'var(--color-text-primary)' }}>{selectedProduct.barcode || 'Chưa cập nhật'}</strong>
                </div>
                <div style={{ background: 'var(--color-bg-tertiary)', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Danh mục</span>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--color-text-primary)' }}>{selectedProduct.category || 'Mặc định'}</strong>
                </div>
                <div style={{ background: 'var(--color-bg-tertiary)', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Tem đã nhận</span>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--color-accent)' }}>{selectedProduct.totalLabelsReceived?.toLocaleString('vi-VN') || 0} tem</strong>
                </div>
              </div>

              {/* Mô tả */}
              {selectedProduct.description && (
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
                    Mô tả sản phẩm:
                  </label>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                    {selectedProduct.description}
                  </p>
                </div>
              )}

              {/* Thông số kỹ thuật */}
              {selectedProduct.specifications && Object.keys(selectedProduct.specifications).length > 0 && (
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
                    Thông số kỹ thuật:
                  </label>
                  <div className="table-container" style={{ border: '1px solid var(--color-border)', borderRadius: 6 }}>
                    <table className="table">
                      <tbody>
                        {Object.entries(selectedProduct.specifications).map(([k, v]) => (
                          <tr key={k}>
                            <td style={{ width: '35%', fontWeight: 600, color: 'var(--color-text-secondary)', background: 'var(--color-bg-tertiary)', padding: '8px 12px', fontSize: '0.82rem' }}>
                              {k}
                            </td>
                            <td style={{ padding: '8px 12px', fontSize: '0.85rem' }}>{v}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Thông điệp xác thực */}
              {selectedProduct.verificationText && (
                <div style={{ background: 'var(--color-success-bg)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 8, padding: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <ShieldCheck size={18} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong style={{ fontSize: '0.82rem', color: 'var(--color-success)' }}>Thông điệp xác thực QR:</strong>
                    <p style={{ margin: '3px 0 0', whiteSpace: 'pre-line', color: 'var(--color-text-secondary)', fontSize: '0.82rem', lineHeight: 1.5 }}>
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
