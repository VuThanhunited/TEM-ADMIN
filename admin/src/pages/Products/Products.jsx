import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
  Package, Plus, Search, Edit, Trash2, X, Eye, Image, XCircle
} from 'lucide-react';
import './Products.css';
import Pagination from '../../components/Pagination';

export default function Products() {
  const { isAdmin, enterpriseId } = useAuth();
  const [products, setProducts] = useState([]);
  const [enterprises, setEnterprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [form, setForm] = useState({
    name: '', description: '', category: '', sku: '', barcode: '', images: [''], distributors: [], specifications: [], enterpriseId: ''
  });

  useEffect(() => {
    loadProducts();
    if (isAdmin) {
      loadEnterprises();
    }
  }, [pagination.page, search, isAdmin]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const result = await api.getProducts({ page: pagination.page, search });
      setProducts(result.data);
      setPagination(prev => ({ ...prev, ...result.pagination }));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadEnterprises = async () => {
    try {
      const data = await api.getEnterprises();
      setEnterprises(data);
    } catch (err) {
      console.error('Lỗi tải danh nghiệp:', err);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setModalError(null);
    setForm({ name: '', description: '', category: '', sku: '', barcode: '', images: [''], distributors: [], specifications: [], enterpriseId: '' });
    setShowModal(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setModalError(null);
    const specList = product.specifications ? Object.entries(product.specifications).map(([key, value]) => ({ key, value })) : [];
    setForm({
      name: product.name, description: product.description, category: product.category,
      sku: product.sku, barcode: product.barcode,
      images: product.images?.length ? product.images : [''],
      distributors: product.distributors || [],
      specifications: specList,
      enterpriseId: product.enterpriseId?._id || product.enterpriseId || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError(null);
    if (isAdmin && !form.enterpriseId) {
      setModalError('Vui lòng chọn doanh nghiệp sở hữu sản phẩm');
      return;
    }
    try {
      const specObj = form.specifications.reduce((acc, curr) => {
        if (curr.key.trim()) {
          acc[curr.key.trim()] = curr.value;
        }
        return acc;
      }, {});

      const data = { 
        ...form, 
        enterpriseId: isAdmin ? form.enterpriseId : enterpriseId,
        specifications: specObj
      };
      if (editing) {
        await api.updateProduct(editing._id, data);
      } else {
        await api.createProduct(data);
      }
      setShowModal(false);
      loadProducts();
    } catch (err) {
      setModalError(err.message || 'Lỗi lưu sản phẩm');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    try { await api.deleteProduct(id); loadProducts(); }
    catch (err) { alert(err.message); }
  };

  const addDistributor = () => {
    setForm({...form, distributors: [...form.distributors, { name: '', address: '', phone: '' }]});
  };

  const updateDistributor = (idx, field, value) => {
    const updated = [...form.distributors];
    updated[idx][field] = value;
    setForm({...form, distributors: updated});
  };

  const removeDistributor = (idx) => {
    setForm({...form, distributors: form.distributors.filter((_, i) => i !== idx)});
  };

  const addSpecification = () => {
    setForm({...form, specifications: [...form.specifications, { key: '', value: '' }]});
  };

  const updateSpecification = (idx, field, value) => {
    const updated = [...form.specifications];
    updated[idx][field] = value;
    setForm({...form, specifications: updated});
  };

  const removeSpecification = (idx) => {
    setForm({...form, specifications: form.specifications.filter((_, i) => i !== idx)});
  };

  return (
    <div className="products-page">
      <div className="page-header">
        <div>
          <h1>Quản lý Sản phẩm</h1>
          <p>Thêm, sửa, xóa sản phẩm và quản lý thông tin điểm bán</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} /> Thêm sản phẩm
        </button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input className="input" placeholder="Tìm theo tên, mã SKU..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <span className="toolbar-count">{pagination.total} sản phẩm</span>
      </div>

      {/* Product Grid */}
      <div className="products-grid">
        {loading ? (
          <div className="loading-overlay"><div className="loading-spinner" style={{width:40,height:40}}></div></div>
        ) : products.length === 0 ? (
          <div className="empty-state"><Package size={60}/><h3>Chưa có sản phẩm nào</h3><p>Bấm "Thêm sản phẩm" để tạo mới</p></div>
        ) : (
          products.map(product => (
            <div key={product._id} className="product-card card animate-fade-in-up">
              <div className="product-image">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} />
                ) : (
                  <div className="product-image-placeholder"><Image size={32}/></div>
                )}
                <div className="product-overlay">
                  <button className="btn btn-sm btn-ghost" onClick={() => openEdit(product)} title="Sửa"><Edit size={14}/></button>
                  <button className="btn btn-sm btn-ghost" onClick={() => handleDelete(product._id)} title="Xóa"><Trash2 size={14}/></button>
                </div>
              </div>
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <span className="product-category badge badge-neutral">{product.category || 'Chung'}</span>
                {product.sku && <span className="product-sku">SKU: {product.sku}</span>}
                <p className="product-desc">{product.description?.substring(0, 80)}{product.description?.length > 80 ? '...' : ''}</p>
                {product.distributors?.length > 0 && (
                  <span className="product-dist">{product.distributors.length} điểm bán</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {pagination.totalPages > 1 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={(newPage) => setPagination(prev => ({ ...prev, page: newPage }))}
        />
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{maxWidth: 640}}>
            <div className="modal-header">
              <h3 className="modal-title">{editing ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit}>
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
                      value={form.enterpriseId}
                      onChange={e => setForm({...form, enterpriseId: e.target.value})}
                      required
                    >
                      <option value="">-- Chọn doanh nghiệp --</option>
                      {enterprises.map(ent => (
                        <option key={ent._id} value={ent._id}>{ent.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="input-group"><label>Tên sản phẩm *</label><input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
                <div className="form-row">
                  <div className="input-group"><label>Danh mục</label><input className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})} /></div>
                  <div className="input-group"><label>Mã SKU</label><input className="input" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} /></div>
                </div>
                <div className="input-group"><label>URL Hình ảnh</label><input className="input" value={form.images[0] || ''} onChange={e => setForm({...form, images: [e.target.value]})} placeholder="https://..." /></div>
                <div className="input-group"><label>Mô tả chi tiết</label><textarea className="input textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} /></div>

                {/* Specifications */}
                <div className="distributors-section" style={{ marginBottom: 20 }}>
                  <div className="section-header">
                    <label>Thông số kỹ thuật / Thuộc tính (VD: Ngày thu hoạch, Tiêu chuẩn...)</label>
                    <button type="button" className="btn btn-sm btn-ghost" onClick={addSpecification}><Plus size={14}/> Thêm thuộc tính</button>
                  </div>
                  {form.specifications?.map((spec, idx) => (
                    <div key={idx} className="distributor-row" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 10, marginBottom: 8, alignItems: 'center' }}>
                      <input className="input" placeholder="Tên thuộc tính (VD: Tiêu chuẩn)" value={spec.key} onChange={e => updateSpecification(idx, 'key', e.target.value)} />
                      <input className="input" placeholder="Giá trị (VD: VietGAP)" value={spec.value} onChange={e => updateSpecification(idx, 'value', e.target.value)} />
                      <button type="button" className="btn-icon" onClick={() => removeSpecification(idx)}><X size={16}/></button>
                    </div>
                  ))}
                </div>

                {/* Distributors */}
                <div className="distributors-section">
                  <div className="section-header">
                    <label>Điểm bán / Nhà phân phối</label>
                    <button type="button" className="btn btn-sm btn-ghost" onClick={addDistributor}><Plus size={14}/> Thêm</button>
                  </div>
                  {form.distributors.map((dist, idx) => (
                    <div key={idx} className="distributor-row">
                      <input className="input" placeholder="Tên điểm bán" value={dist.name} onChange={e => updateDistributor(idx, 'name', e.target.value)} />
                      <input className="input" placeholder="Địa chỉ" value={dist.address} onChange={e => updateDistributor(idx, 'address', e.target.value)} />
                      <input className="input" placeholder="SĐT" value={dist.phone} onChange={e => updateDistributor(idx, 'phone', e.target.value)} />
                      <button type="button" className="btn-icon" onClick={() => removeDistributor(idx)}><X size={16}/></button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Cập nhật' : 'Thêm mới'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
