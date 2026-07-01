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
  const initialForm = {
    name: '', description: '', category: '', sku: '', barcode: '',
    images: ['', '', ''], distributors: [], specifications: [], enterpriseId: '',
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
    chatbotQA: []
  };

  const [form, setForm] = useState({ ...initialForm });

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
    setForm({ ...initialForm });
    setShowModal(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setModalError(null);
    const specList = product.specifications ? Object.entries(product.specifications).map(([key, value]) => ({ key, value })) : [];
    
    let imgList = [...(product.images || [])];
    while (imgList.length < 3) {
      imgList.push('');
    }

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
      chatbotQA: product.chatbotQA || []
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

      const cleanedImages = form.images.filter(img => img.trim() !== '');

      const data = { 
        ...form, 
        enterpriseId: isAdmin ? form.enterpriseId : enterpriseId,
        images: cleanedImages,
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

  const addProductionStep = () => {
    setForm({
      ...form,
      productionProcess: [...form.productionProcess, { title: '', description: '', image: '' }]
    });
  };

  const updateProductionStep = (idx, field, value) => {
    const steps = [...form.productionProcess];
    steps[idx][field] = value;
    setForm({ ...form, productionProcess: steps });
  };

  const removeProductionStep = (idx) => {
    setForm({
      ...form,
      productionProcess: form.productionProcess.filter((_, i) => i !== idx)
    });
  };

  const addProductQA = () => {
    setForm({
      ...form,
      chatbotQA: [...form.chatbotQA, { question: '', answer: '' }]
    });
  };

  const updateProductQA = (idx, field, value) => {
    const qas = [...form.chatbotQA];
    qas[idx][field] = value;
    setForm({ ...form, chatbotQA: qas });
  };

  const removeProductQA = (idx) => {
    setForm({
      ...form,
      chatbotQA: form.chatbotQA.filter((_, i) => i !== idx)
    });
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
                <div className="form-row">
                  <div className="input-group"><label>Mã vạch (Barcode EAN/UPC)</label><input className="input" value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})} placeholder="VD: 8931234567890" /></div>
                  <div className="input-group"><label>Dòng thông tin xác thực tùy chỉnh (CMS)</label><input className="input" value={form.verificationText} onChange={e => setForm({...form, verificationText: e.target.value})} placeholder="VD: XÁC THỰC THÀNH CÔNG\nSản phẩm chính hãng" /></div>
                </div>
                <div className="input-group">
                  <label>Hình ảnh sản phẩm (Tối đa 3 hình ảnh làm banner tự chuyển động)</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input className="input" placeholder="Ảnh banner 1 URL..." value={form.images[0] || ''} onChange={e => {
                      const imgs = [...form.images];
                      imgs[0] = e.target.value;
                      setForm({...form, images: imgs});
                    }} />
                    <input className="input" placeholder="Ảnh banner 2 URL (Tùy chọn)..." value={form.images[1] || ''} onChange={e => {
                      const imgs = [...form.images];
                      imgs[1] = e.target.value;
                      setForm({...form, images: imgs});
                    }} />
                    <input className="input" placeholder="Ảnh banner 3 URL (Tùy chọn)..." value={form.images[2] || ''} onChange={e => {
                      const imgs = [...form.images];
                      imgs[2] = e.target.value;
                      setForm({...form, images: imgs});
                    }} />
                  </div>
                </div>
                <div className="input-group"><label>Mô tả chi tiết</label><textarea className="input textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} /></div>

                {/* Certifications checklist */}
                <div className="distributors-section" style={{ marginBottom: 20 }}>
                  <label style={{ fontWeight: 600, fontSize: '0.9rem', display: 'block', marginBottom: '8px', color: 'var(--primary-color)' }}>Chứng nhận đạt được</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {Object.keys(form.certifications || {}).map((key) => {
                      const certLabels = {
                        iso: 'Chứng nhận ISO',
                        vetinhATTP: 'Vệ sinh An toàn Thực phẩm',
                        gmp: 'Tiêu chuẩn GMP',
                        cgmp: 'Tiêu chuẩn CGMP',
                        vietgap: 'Tiêu chuẩn VietGAP',
                        organic: 'Chứng nhận Hữu cơ (Organic)'
                      };
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

                {/* Production process */}
                <div className="distributors-section" style={{ marginBottom: 20 }}>
                  <div className="section-header">
                    <label>Quy trình sản xuất (Từng bước thực hiện)</label>
                    <button type="button" className="btn btn-sm btn-ghost" onClick={addProductionStep}><Plus size={14}/> Thêm bước</button>
                  </div>
                  {form.productionProcess?.map((step, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 10, marginBottom: 8, alignItems: 'center' }}>
                      <input className="input" placeholder="Tên bước (VD: Gieo trồng)" value={step.title || ''} onChange={e => updateProductionStep(idx, 'title', e.target.value)} />
                      <input className="input" placeholder="Mô tả công việc của bước..." value={step.description || ''} onChange={e => updateProductionStep(idx, 'description', e.target.value)} />
                      <button type="button" className="btn-icon" onClick={() => removeProductionStep(idx)}><X size={16}/></button>
                    </div>
                  ))}
                </div>

                {/* Dynamic Specifications */}
                <div className="distributors-section" style={{ marginBottom: 20 }}>
                  <div className="section-header">
                    <label>Thông số kỹ thuật / Thuộc tính chung (VD: Trọng lượng, Hạn sử dụng...)</label>
                    <button type="button" className="btn btn-sm btn-ghost" onClick={addSpecification}><Plus size={14}/> Thêm thuộc tính</button>
                  </div>
                  {form.specifications?.map((spec, idx) => (
                    <div key={idx} className="distributor-row" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 10, marginBottom: 8, alignItems: 'center' }}>
                      <input className="input" placeholder="Tên thuộc tính (VD: Trọng lượng)" value={spec.key || ''} onChange={e => updateSpecification(idx, 'key', e.target.value)} />
                      <input className="input" placeholder="Giá trị (VD: 300g)" value={spec.value || ''} onChange={e => updateSpecification(idx, 'value', e.target.value)} />
                      <button type="button" className="btn-icon" onClick={() => removeSpecification(idx)}><X size={16}/></button>
                    </div>
                  ))}
                </div>

                {/* Chatbot QA */}
                <div className="distributors-section" style={{ marginBottom: 20 }}>
                  <div className="section-header">
                    <label>Hỏi - Đáp Chatbot sản phẩm (FAQ 1 câu hỏi - 1 câu trả lời)</label>
                    <button type="button" className="btn btn-sm btn-ghost" onClick={addProductQA}><Plus size={14}/> Thêm Q&A</button>
                  </div>
                  {form.chatbotQA?.map((qa, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr auto', gap: 10, marginBottom: 8, alignItems: 'center' }}>
                      <input className="input" placeholder="Câu hỏi của khách..." value={qa.question || ''} onChange={e => updateProductQA(idx, 'question', e.target.value)} />
                      <input className="input" placeholder="Câu trả lời của bot..." value={qa.answer || ''} onChange={e => updateProductQA(idx, 'answer', e.target.value)} />
                      <button type="button" className="btn-icon" onClick={() => removeProductQA(idx)}><X size={16}/></button>
                    </div>
                  ))}
                </div>

                <div className="form-row" style={{ marginBottom: 20 }}>
                  <div className="input-group"><label>Giới thiệu Nhà sản xuất</label><textarea className="input textarea" value={form.producerInfo || ''} onChange={e => setForm({...form, producerInfo: e.target.value})} rows={2} placeholder="Nhập giới thiệu nhà sản xuất..." /></div>
                  <div className="input-group"><label>Giới thiệu Nhà phân phối</label><textarea className="input textarea" value={form.distributorInfo || ''} onChange={e => setForm({...form, distributorInfo: e.target.value})} rows={2} placeholder="Nhập giới thiệu nhà phân phối..." /></div>
                </div>

                {/* Distributors */}
                <div className="distributors-section">
                  <div className="section-header">
                    <label>Điểm bán / Nhà phân phối liên kết trực tiếp</label>
                    <button type="button" className="btn btn-sm btn-ghost" onClick={addDistributor}><Plus size={14}/> Thêm điểm bán</button>
                  </div>
                  {form.distributors.map((dist, idx) => (
                    <div key={idx} className="distributor-row">
                      <input className="input" placeholder="Tên điểm bán" value={dist.name || ''} onChange={e => updateDistributor(idx, 'name', e.target.value)} />
                      <input className="input" placeholder="Địa chỉ" value={dist.address || ''} onChange={e => updateDistributor(idx, 'address', e.target.value)} />
                      <input className="input" placeholder="SĐT" value={dist.phone || ''} onChange={e => updateDistributor(idx, 'phone', e.target.value)} />
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
