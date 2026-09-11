import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
  Package, Plus, Search, Edit, Trash2, X, Eye, Image, XCircle, Upload, Link, Building2
} from 'lucide-react';
import './Products.css';
import Pagination from '../../components/Pagination';

// ── ImageInput: slot ảnh hỗ trợ cả URL lẫn upload từ thiết bị ──────────────
function ImageInput({ value, onChange, placeholder, index }) {
  // mode = 'upload' chỉ khi value là base64 data URL thực sự
  // Nếu value là URL thông thường hoặc rỗng → luôn dùng mode 'url'
  const isBase64 = value?.startsWith('data:');
  const [mode, setMode] = useState(isBase64 ? 'upload' : 'url');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef();

  // Sync mode nếu value thay đổi từ bên ngoài (VD: clear ảnh)
  // Đảm bảo không hiển thị slot trống khi value là URL bình thường
  const effectiveMode = value?.startsWith('data:') ? 'upload' : (value ? 'url' : mode);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const result = await api.uploadImage(file);
      onChange(result.url);
      setMode('upload');
    } catch (err) {
      setUploadError(err.message || 'Lỗi tải ảnh');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleClear = () => {
    onChange('');
    setUploadError('');
    setMode('url');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          type="button"
          onClick={() => setMode('url')}
          style={{
            padding: '3px 10px', borderRadius: 6, fontSize: '0.78rem', cursor: 'pointer',
            border: '1px solid',
            borderColor: mode === 'url' ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)',
            background: mode === 'url' ? 'rgba(99,102,241,0.15)' : 'transparent',
            color: mode === 'url' ? 'var(--primary-color)' : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: 4
          }}
        >
          <Link size={11} /> Nhập URL
        </button>
        <button
          type="button"
          onClick={() => { setMode('upload'); fileRef.current?.click(); }}
          style={{
            padding: '3px 10px', borderRadius: 6, fontSize: '0.78rem', cursor: 'pointer',
            border: '1px solid',
            borderColor: mode === 'upload' ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)',
            background: mode === 'upload' ? 'rgba(99,102,241,0.15)' : 'transparent',
            color: mode === 'upload' ? 'var(--primary-color)' : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: 4
          }}
        >
          <Upload size={11} /> Tải từ thiết bị
        </button>
        <input
          type="file"
          ref={fileRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      {effectiveMode === 'url' ? (
        <input
          className="input"
          placeholder={placeholder}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
        />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {value?.startsWith('data:') ? (
            <>
              <img
                src={value}
                alt={'Ảnh ' + (index + 1)}
                style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <div style={{ flex: 1, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ảnh đã chọn</div>
              <button type="button" onClick={handleClear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={14} />
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: '0.78rem', cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)',
                  color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4
                }}
              >
                <Upload size={11} /> Đổi ảnh
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{
                flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer',
                border: '1px dashed rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.05)',
                color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontSize: '0.85rem'
              }}
            >
              {uploading ? (
                <><div className="loading-spinner" style={{ width: 14, height: 14 }} /> Đang tải...</>
              ) : (
                <><Upload size={14} /> Chọn ảnh từ thiết bị (tối đa 2MB)</>
              )}
            </button>
          )}
        </div>
      )}

      {uploadError && (
        <span style={{ fontSize: '0.78rem', color: '#f87171' }}>{uploadError}</span>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Products() {
  const { isAdmin, enterpriseId } = useAuth();
  const [products, setProducts] = useState([]);
  const [enterprises, setEnterprises] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const MAX_IMAGES = 6;

  const initialForm = {
    name: '', description: '', category: '', sku: '', barcode: '',
    images: ['', '', '', '', '', ''], distributors: [], specifications: [], enterpriseId: '',
    verificationText: 'XÁC THỰC THÀNH CÔNG\nSản phẩm chính hãng',
    productionProcess: [],
    certifications: {
      iso: { checked: false, certNo: '', image: '' },
      vetinhATTP: { checked: false, certNo: '', image: '' },
      gmp: { checked: false, certNo: '', image: '' },
      cgmp: { checked: false, certNo: '', image: '' },
      vietgap: { checked: false, certNo: '', image: '' },
      organic: { checked: false, certNo: '', image: '' }
    },
    producerInfo: '',
    distributorInfo: '',
    chatbotQA: [],
    manufacturerId: '',
    manufacturerInfo: ''
  };

  const [form, setForm] = useState({ ...initialForm });

  useEffect(() => {
    loadProducts();
    if (isAdmin) loadEnterprises();
    loadManufacturers();
  }, [pagination.page, search, isAdmin]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const result = await api.getProducts({ page: pagination.page, search });
      setProducts(result.data);
      setPagination(prev => ({ ...prev, ...result.pagination }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadEnterprises = async () => {
    try {
      const data = await api.getEnterprises();
      setEnterprises(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Lỗi tải doanh nghiệp:', err);
    }
  };

  const loadManufacturers = async () => {
    try {
      // Ưu tiên endpoint getManufacturers() lấy tất cả Enterprise có type NSX
      const data = await api.getManufacturers();
      const entList = Array.isArray(data) ? data : [];

      // Fallback: nếu Enterprise NSX rỗng, lấy thêm từ Distributor accounts (User role=NSX)
      // vì user thường tạo NSX từ trang Quản lý NSX/NPP (lưu vào User table, không phải Enterprise)
      if (entList.length === 0) {
        try {
          const distResult = await api.getDistributors({ role: 'NSX', limit: 200 });
          const distList = Array.isArray(distResult?.data) ? distResult.data : [];
          // Chuẩn hóa field để tương thích với dropdown (dùng _id và name)
          const normalized = distList.map(d => ({
            _id: d._id,
            name: d.fullName || d.name || '',
            address: d.address || '',
            phone: d.phone || '',
            email: d.email || '',
            isEnterprise: false // Đây là User record, không phải Enterprise
          }));
          setManufacturers(normalized);
          return;
        } catch (distErr) {
          console.warn('Fallback getDistributors NSX lỗi:', distErr);
        }
      }

      // Tag là Enterprise để phân biệt với User NSX
      setManufacturers(entList.map(e => ({ ...e, isEnterprise: true })));
    } catch (err) {
      // Fallback sang getEnterprises filter
      try {
        const data = await api.getEnterprises();
        const filtered = Array.isArray(data) ? data.filter(e => e.type === 'NSX') : [];
        if (filtered.length > 0) {
          setManufacturers(filtered.map(e => ({ ...e, isEnterprise: true })));
          return;
        }
        // Cuối cùng thử lấy từ distributors
        const distResult = await api.getDistributors({ role: 'NSX', limit: 200 });
        const distList = Array.isArray(distResult?.data) ? distResult.data : [];
        setManufacturers(distList.map(d => ({
          _id: d._id,
          name: d.fullName || d.name || '',
          address: d.address || '',
          phone: d.phone || '',
          email: d.email || '',
          isEnterprise: false // Đây là User record, không phải Enterprise
        })));
      } catch (fallbackErr) {
        console.error('Lỗi tải NSX:', fallbackErr);
      }
    }
  };

  const openCreate = () => {
    setEditing(null);
    setModalError(null);
    setForm({ ...initialForm });
    setShowModal(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setModalError(null);
    const specList = product.specifications
      ? Object.entries(product.specifications).map(([key, value]) => ({ key, value }))
      : [];

    let imgList = [...(product.images || [])];
    while (imgList.length < MAX_IMAGES) imgList.push('');

    const certs = {
      iso: { checked: false, certNo: '', image: '', ...(product.certifications?.iso || {}) },
      vetinhATTP: { checked: false, certNo: '', image: '', ...(product.certifications?.vetinhATTP || {}) },
      gmp: { checked: false, certNo: '', image: '', ...(product.certifications?.gmp || {}) },
      cgmp: { checked: false, certNo: '', image: '', ...(product.certifications?.cgmp || {}) },
      vietgap: { checked: false, certNo: '', image: '', ...(product.certifications?.vietgap || {}) },
      organic: { checked: false, certNo: '', image: '', ...(product.certifications?.organic || {}) }
    };

    setForm({
      name: product.name || '',
      description: product.description || '',
      category: product.category || '',
      sku: product.sku || '',
      barcode: product.barcode || '',
      images: imgList,
      distributors: product.distributors || [],
      specifications: specList,
      enterpriseId: product.enterpriseId?._id || product.enterpriseId || '',
      verificationText: product.verificationText || 'XÁC THỰC THÀNH CÔNG\nSản phẩm chính hãng',
      productionProcess: product.productionProcess || [],
      certifications: certs,
      producerInfo: product.producerInfo || '',
      distributorInfo: product.distributorInfo || '',
      chatbotQA: product.chatbotQA || [],
      manufacturerId: product.manufacturerId?._id || product.manufacturerId || '',
      manufacturerInfo: product.manufacturerInfo || ''
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
        if (curr.key.trim()) acc[curr.key.trim()] = curr.value;
        return acc;
      }, {});

      // Chỉ lấy ảnh hợp lệ: URL thực (http/https) hoặc data URL
      // Cảnh báo và từ chối ảnh base64 quá lớn (>500KB) để tránh MongoDB document overflow
      const MAX_BASE64_SIZE = 500 * 1024; // 500KB encoded ~375KB file
      const cleanedImages = form.images.filter(img => {
        if (!img || !img.trim()) return false;
        if (img.startsWith('data:')) {
          // Kiểm tra kích thước base64
          if (img.length > MAX_BASE64_SIZE) {
            return false; // Bỏ qua ảnh base64 quá lớn
          }
        }
        return true;
      });

      // Kiểm tra xem có ảnh base64 quá lớn bị loại bỏ không
      const oversizedImages = form.images.filter(img => img?.startsWith('data:') && img.length > MAX_BASE64_SIZE);
      if (oversizedImages.length > 0) {
        setModalError(`⚠️ ${oversizedImages.length} ảnh bị loại do kích thước vượt quá 500KB. Vui lòng chọn ảnh nhỏ hơn hoặc dùng URL ảnh.`);
        return;
      }

      const data = {
        ...form,
        enterpriseId: isAdmin ? form.enterpriseId : enterpriseId,
        images: cleanedImages,
        specifications: specObj,
        manufacturerId: form.manufacturerId || null,
        manufacturerInfo: form.manufacturerInfo || ''
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
    try {
      await api.deleteProduct(id);
      loadProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const addSpecification = () => setForm({ ...form, specifications: [...form.specifications, { key: '', value: '' }] });
  const updateSpecification = (idx, field, value) => {
    const updated = [...form.specifications];
    updated[idx][field] = value;
    setForm({ ...form, specifications: updated });
  };
  const removeSpecification = (idx) => setForm({ ...form, specifications: form.specifications.filter((_, i) => i !== idx) });

  const addProductionStep = () => setForm({ ...form, productionProcess: [...form.productionProcess, { title: '', description: '', image: '' }] });
  const updateProductionStep = (idx, field, value) => {
    const steps = [...form.productionProcess];
    steps[idx][field] = value;
    setForm({ ...form, productionProcess: steps });
  };
  const removeProductionStep = (idx) => setForm({ ...form, productionProcess: form.productionProcess.filter((_, i) => i !== idx) });

  const addProductQA = () => setForm({ ...form, chatbotQA: [...form.chatbotQA, { question: '', answer: '' }] });
  const updateProductQA = (idx, field, value) => {
    const qas = [...form.chatbotQA];
    qas[idx][field] = value;
    setForm({ ...form, chatbotQA: qas });
  };
  const removeProductQA = (idx) => setForm({ ...form, chatbotQA: form.chatbotQA.filter((_, i) => i !== idx) });

  const selectedManufacturer = manufacturers.find(m => m._id === form.manufacturerId);

  const handleManufacturerSelect = (id) => {
    const nsx = manufacturers.find(m => m._id === id);
    let autoInfo = '';
    if (nsx) {
      const parts = [];
      if (nsx.name) parts.push(nsx.name);
      if (nsx.address) parts.push('Địa chỉ: ' + nsx.address);
      if (nsx.phone) parts.push('ĐT: ' + nsx.phone);
      if (nsx.email) parts.push('Email: ' + nsx.email);
      autoInfo = parts.join('\n');
    }
    setForm({
      ...form,
      // Chỉ set manufacturerId khi NSX là Enterprise record (mới có thể populate).
      // Nếu là User record (isEnterprise=false), chỉ tự điền text, không set ID để tránh populate fail.
      manufacturerId: (nsx?.isEnterprise !== false) ? id : '',
      manufacturerInfo: form.manufacturerInfo.trim() ? form.manufacturerInfo : autoInfo
    });
  };

  const certLabels = {
    iso: 'Chứng nhận ISO',
    vetinhATTP: 'Vệ sinh An toàn Thực phẩm',
    gmp: 'Tiêu chuẩn GMP',
    cgmp: 'Tiêu chuẩn CGMP',
    vietgap: 'Tiêu chuẩn VietGAP',
    organic: 'Chứng nhận Hữu cơ (Organic)'
  };

  return (
    <div className="products-page">
      <div className="page-header">
        <div>
          <h1>Quản lý Sản phẩm</h1>
          <p>Thêm, sửa, xóa sản phẩm và quản lý thông tin nhà sản xuất, điểm bán</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} /> Thêm sản phẩm
        </button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            className="input"
            placeholder="Tìm theo tên sản phẩm, mã SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <span className="toolbar-count">{pagination.total} sản phẩm</span>
      </div>

      <div className="products-grid">
        {loading ? (
          <div className="loading-overlay"><div className="loading-spinner" style={{ width: 40, height: 40 }}></div></div>
        ) : products.length === 0 ? (
          <div className="empty-state"><Package size={60} /><h3>Chưa có sản phẩm nào</h3><p>Bấm "Thêm sản phẩm" để tạo mới</p></div>
        ) : (
          products.map(product => (
            <div key={product._id} className="product-card card animate-fade-in-up">
              <div className="product-image">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} />
                ) : (
                  <div className="product-image-placeholder"><Image size={32} /></div>
                )}
                <div className="product-overlay">
                  <button className="btn btn-sm btn-ghost" onClick={() => openEdit(product)} title="Sửa"><Edit size={14} /></button>
                  <button className="btn btn-sm btn-ghost" onClick={() => handleDelete(product._id)} title="Xóa"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <span className="product-category badge badge-neutral">{product.category || 'Chung'}</span>
                {product.sku && <span className="product-sku">SKU: {product.sku}</span>}
                <p className="product-desc">{product.description?.substring(0, 80)}{product.description?.length > 80 ? '...' : ''}</p>
                {product.manufacturerId && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Building2 size={11} /> NSX: {product.manufacturerId?.name || ''}
                  </span>
                )}
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

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editing ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
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
                    <select className="input select" value={form.enterpriseId} onChange={e => setForm({ ...form, enterpriseId: e.target.value })} required>
                      <option value="">-- Chọn doanh nghiệp --</option>
                      {enterprises.map(ent => <option key={ent._id} value={ent._id}>{ent.name}</option>)}
                    </select>
                  </div>
                )}

                <div className="input-group">
                  <label>Tên sản phẩm *</label>
                  <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-row">
                  <div className="input-group">
                    <label>Danh mục</label>
                    <input className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="VD: Nông sản, Thực phẩm, Dược phẩm..." />
                  </div>
                  <div className="input-group">
                    <label>Mã SKU</label>
                    <input className="input" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="VD: SP-001" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="input-group">
                    <label>Mã vạch (Barcode EAN/UPC)</label>
                    <input className="input" value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} placeholder="VD: 8931234567890" />
                  </div>
                  <div className="input-group">
                    <label>Dòng thông tin xác thực (CMS)</label>
                    <input className="input" value={form.verificationText} onChange={e => setForm({ ...form, verificationText: e.target.value })} />
                  </div>
                </div>

                {/* Phần upload ảnh: Hỗ trợ URL và upload từ thiết bị */}
                <div className="input-group">
                  <label>Hình ảnh sản phẩm (Tối đa {MAX_IMAGES} ảnh — nhập URL hoặc tải từ thiết bị)</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {Array.from({ length: MAX_IMAGES }, (_, i) => i).map(i => (
                      <div key={i}>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                          Ảnh {i + 1}{i === 0 ? ' (Chính — bắt buộc)' : ' (Tùy chọn)'}
                        </div>
                        <ImageInput
                          index={i}
                          value={form.images[i] || ''}
                          placeholder={'Ảnh ' + (i + 1) + ' URL...'}
                          onChange={url => {
                            const imgs = [...form.images];
                            imgs[i] = url;
                            setForm({ ...form, images: imgs });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <label>Mô tả chi tiết sản phẩm</label>
                  <textarea className="input textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Mô tả công dụng, thành phần, đặc điểm nổi bật..." />
                </div>

                {/* NSX Section - Theo yêu cầu khách hàng: chọn NSX và bổ sung thông tin */}
                <div className="distributors-section" style={{ marginBottom: 20 }}>
                  <label style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6, marginBottom: '10px', color: 'var(--primary-color)' }}>
                    <Building2 size={16} /> Nhà Sản Xuất (NSX)
                  </label>

                  <div className="input-group" style={{ marginBottom: 10 }}>
                    <label>Chọn Nhà Sản Xuất</label>
                    <select className="input select" value={form.manufacturerId || ''} onChange={e => handleManufacturerSelect(e.target.value)}>
                      <option value="">-- Không chọn / Nhập thủ công bên dưới --</option>
                      {manufacturers.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                    </select>
                    {manufacturers.length === 0 && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                        Chưa có Nhà Sản Xuất trong danh sách. Bạn có thể nhập thông tin trực tiếp bên dưới hoặc thêm NSX trong menu "Quản lý NSX / NPP".
                      </span>
                    )}
                    {selectedManufacturer && (
                      <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        Địa chỉ: {selectedManufacturer.address || 'Chưa cập nhật'} | ĐT: {selectedManufacturer.phone || 'Chưa cập nhật'}
                      </div>
                    )}
                  </div>

                  <div className="input-group">
                    <label>Thông tin bổ sung Nhà Sản Xuất (hiển thị trên trang quét QR)</label>
                    <textarea
                      className="input textarea"
                      rows={3}
                      placeholder={'VD: Công ty TNHH Sản Xuất Thực Phẩm ABC\nĐịa chỉ: Lô B2-3, KCN Thăng Long, Đông Anh, Hà Nội\nĐT: 024 6688 1234'}
                      value={form.manufacturerInfo || ''}
                      onChange={e => setForm({ ...form, manufacturerInfo: e.target.value })}
                    />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2, display: 'block' }}>
                      Thông tin này sẽ được hiển thị khi người tiêu dùng xem mục "Nhà sản xuất" trên trang quét mã QR.
                    </span>
                  </div>
                </div>

                {/* Chứng nhận đạt được */}
                <div className="distributors-section" style={{ marginBottom: 20 }}>
                  <label style={{ fontWeight: 600, fontSize: '0.9rem', display: 'block', marginBottom: '8px', color: 'var(--primary-color)' }}>
                    Chứng nhận đạt được
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {Object.keys(form.certifications || {}).map((key) => {
                      const cert = form.certifications[key] || { checked: false, certNo: '', image: '' };
                      return (
                        <div key={key} style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                            <input type="checkbox" checked={cert.checked} onChange={e => {
                              const certs = { ...form.certifications };
                              certs[key] = { ...certs[key], checked: e.target.checked };
                              setForm({ ...form, certifications: certs });
                            }} />
                            <span style={{ fontSize: '0.85rem' }}>{certLabels[key]}</span>
                          </label>
                          {cert.checked && (
                            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <input className="input" style={{ fontSize: '0.8rem', padding: '4px 8px' }} placeholder="Số chứng nhận..." value={cert.certNo || ''} onChange={e => {
                                const certs = { ...form.certifications };
                                certs[key] = { ...certs[key], certNo: e.target.value };
                                setForm({ ...form, certifications: certs });
                              }} />
                              <input className="input" style={{ fontSize: '0.8rem', padding: '4px 8px' }} placeholder="URL ảnh giấy chứng nhận..." value={cert.image || ''} onChange={e => {
                                const certs = { ...form.certifications };
                                certs[key] = { ...certs[key], image: e.target.value };
                                setForm({ ...form, certifications: certs });
                              }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quy trình sản xuất */}
                <div className="distributors-section" style={{ marginBottom: 20 }}>
                  <div className="section-header">
                    <label>Quy trình sản xuất (Từng bước thực hiện)</label>
                    <button type="button" className="btn btn-sm btn-ghost" onClick={addProductionStep}><Plus size={14} /> Thêm bước</button>
                  </div>
                  {form.productionProcess?.map((step, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 10, marginBottom: 8, alignItems: 'center' }}>
                      <input className="input" placeholder="Tên bước (VD: Gieo trồng)" value={step.title || ''} onChange={e => updateProductionStep(idx, 'title', e.target.value)} />
                      <input className="input" placeholder="Mô tả công việc của bước..." value={step.description || ''} onChange={e => updateProductionStep(idx, 'description', e.target.value)} />
                      <button type="button" className="btn-icon" onClick={() => removeProductionStep(idx)}><X size={16} /></button>
                    </div>
                  ))}
                </div>

                {/* Thông số kỹ thuật */}
                <div className="distributors-section" style={{ marginBottom: 20 }}>
                  <div className="section-header">
                    <label>Thông số kỹ thuật / Thuộc tính chung (VD: Trọng lượng, Hạn sử dụng...)</label>
                    <button type="button" className="btn btn-sm btn-ghost" onClick={addSpecification}><Plus size={14} /> Thêm thuộc tính</button>
                  </div>
                  {form.specifications?.map((spec, idx) => (
                    <div key={idx} className="distributor-row" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 10, marginBottom: 8, alignItems: 'center' }}>
                      <input className="input" placeholder="Tên thuộc tính (VD: Trọng lượng)" value={spec.key || ''} onChange={e => updateSpecification(idx, 'key', e.target.value)} />
                      <input className="input" placeholder="Giá trị (VD: 300g)" value={spec.value || ''} onChange={e => updateSpecification(idx, 'value', e.target.value)} />
                      <button type="button" className="btn-icon" onClick={() => removeSpecification(idx)}><X size={16} /></button>
                    </div>
                  ))}
                </div>

                {/* Chatbot Q&A */}
                <div className="distributors-section" style={{ marginBottom: 20 }}>
                  <div className="section-header">
                    <label>Hỏi - Đáp Chatbot sản phẩm (FAQ 1 câu hỏi - 1 câu trả lời)</label>
                    <button type="button" className="btn btn-sm btn-ghost" onClick={addProductQA}><Plus size={14} /> Thêm Q&A</button>
                  </div>
                  {form.chatbotQA?.map((qa, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr auto', gap: 10, marginBottom: 8, alignItems: 'center' }}>
                      <input className="input" placeholder="Câu hỏi của khách..." value={qa.question || ''} onChange={e => updateProductQA(idx, 'question', e.target.value)} />
                      <input className="input" placeholder="Câu trả lời của bot..." value={qa.answer || ''} onChange={e => updateProductQA(idx, 'answer', e.target.value)} />
                      <button type="button" className="btn-icon" onClick={() => removeProductQA(idx)}><X size={16} /></button>
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
