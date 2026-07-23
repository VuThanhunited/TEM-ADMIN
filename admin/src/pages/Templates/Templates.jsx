import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
  Palette, Plus, X, Save, Eye, Trash2, CheckCircle, XCircle, FileText, Settings, Layers, ShieldCheck
} from 'lucide-react';
import './Templates.css';

const defaultContentConfig = {
  headerTitle1: 'GIẢI PHÁP QRcode',
  headerTitle2: 'TEM BẢO HÀNH SẢN PHẨM',
  transparencyLine1: 'SẢN PHẨM ĐÃ ĐƯỢC NHÀ CUNG CẤP',
  transparencyLine2: 'CAM KẾT MINH BẠCH THÔNG TIN',
  spec1Label: 'Dung tích',
  spec1Value: '1.8L',
  spec2Label: 'Công suất',
  spec2Value: '1200W',
  spec3Label: 'Lòng nồi',
  spec3Value: 'Inox 304',
  spec4Label: 'Bảo hành',
  spec4Value: '24 tháng',
  benefit1Title: 'ĐẢM BẢO CHÍNH HÃNG',
  benefit1Desc: 'Xác thực nguồn gốc, nói không với hàng giả',
  benefit2Title: 'BẢO HÀNH ĐIỆN TỬ',
  benefit2Desc: 'Kích hoạt và tra cứu bảo hành nhanh chóng',
  benefit3Title: 'HỖ TRỢ NHANH CHÓNG',
  benefit3Desc: 'Tiếp nhận yêu cầu và hỗ trợ kịp thời',
  benefit4Title: 'ƯU ĐÃI ĐẶC QUYỀN',
  benefit4Desc: 'Nhận thông tin khuyến mãi, ưu đãi hấp dẫn',
  benefit5Title: 'BẢO VỆ QUYỀN LỢI',
  benefit5Desc: 'An tâm sử dụng, bảo vệ quyền lợi người tiêu dùng',
  manufacturerNote: 'HOMEPLUS là thương hiệu uy tín chuyên cung cấp các sản phẩm gia dụng, thiết bị nhà bếp và thiết bị vệ sinh chất lượng cao, đáp ứng tiêu chuẩn quốc tế, đem lại tiện nghi và an toàn cho mọi gia đình.'
};

export default function Templates() {
  const { isAdmin, enterpriseId } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [enterprises, setEnterprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState('basic'); // 'basic' or 'content'
  const [editing, setEditing] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [form, setForm] = useState({
    name: '', primaryColor: '#0d47a1', secondaryColor: '#1565c0',
    backgroundColor: '#f0f4f8', textColor: '#0f172a', layout: 'warranty_solution',
    showVerificationBadge: true, showProductInfo: true, showDistributorInfo: true, showScanCount: false, enterpriseId: '',
    logo: '', backgroundImage: '',
    contentConfig: { ...defaultContentConfig }
  });

  useEffect(() => {
    loadTemplates();
    if (isAdmin) {
      loadEnterprises();
    }
  }, [isAdmin]);

  const loadTemplates = async () => {
    try { const data = await api.getTemplates(); setTemplates(data); }
    catch (e) {} finally { setLoading(false); }
  };

  const loadEnterprises = async () => {
    try {
      const data = await api.getEnterprises();
      setEnterprises(data);
    } catch (e) {}
  };

  const openCreate = () => {
    setEditing(null);
    setModalError(null);
    setModalTab('basic');
    setForm({
      name: '', primaryColor: '#0d47a1', secondaryColor: '#1565c0', backgroundColor: '#f0f4f8', textColor: '#0f172a', layout: 'warranty_solution', showVerificationBadge: true, showProductInfo: true, showDistributorInfo: true, showScanCount: false, enterpriseId: '', logo: '', backgroundImage: '',
      contentConfig: { ...defaultContentConfig }
    });
    setShowModal(true);
  };

  const openEdit = (tmpl) => {
    setEditing(tmpl);
    setModalError(null);
    setModalTab('basic');

    const cfg = tmpl.contentConfig || {};
    const b = cfg.benefits || [];

    setForm({
      name: tmpl.name,
      primaryColor: tmpl.primaryColor || '#0d47a1',
      secondaryColor: tmpl.secondaryColor || '#1565c0',
      backgroundColor: tmpl.backgroundColor || '#f0f4f8',
      textColor: tmpl.textColor || '#0f172a',
      layout: tmpl.layout || 'warranty_solution',
      showVerificationBadge: tmpl.showVerificationBadge ?? true,
      showProductInfo: tmpl.showProductInfo ?? true,
      showDistributorInfo: tmpl.showDistributorInfo ?? true,
      showScanCount: tmpl.showScanCount ?? false,
      enterpriseId: tmpl.enterpriseId?._id || tmpl.enterpriseId || '',
      logo: tmpl.logo || '',
      backgroundImage: tmpl.backgroundImage || '',
      contentConfig: {
        headerTitle1: cfg.headerTitle1 || defaultContentConfig.headerTitle1,
        headerTitle2: cfg.headerTitle2 || defaultContentConfig.headerTitle2,
        transparencyLine1: cfg.transparencyLine1 || defaultContentConfig.transparencyLine1,
        transparencyLine2: cfg.transparencyLine2 || defaultContentConfig.transparencyLine2,
        spec1Label: cfg.spec1Label || defaultContentConfig.spec1Label,
        spec1Value: cfg.spec1Value || defaultContentConfig.spec1Value,
        spec2Label: cfg.spec2Label || defaultContentConfig.spec2Label,
        spec2Value: cfg.spec2Value || defaultContentConfig.spec2Value,
        spec3Label: cfg.spec3Label || defaultContentConfig.spec3Label,
        spec3Value: cfg.spec3Value || defaultContentConfig.spec3Value,
        spec4Label: cfg.spec4Label || defaultContentConfig.spec4Label,
        spec4Value: cfg.spec4Value || defaultContentConfig.spec4Value,
        benefit1Title: b[0]?.title || defaultContentConfig.benefit1Title,
        benefit1Desc: b[0]?.desc || defaultContentConfig.benefit1Desc,
        benefit2Title: b[1]?.title || defaultContentConfig.benefit2Title,
        benefit2Desc: b[1]?.desc || defaultContentConfig.benefit2Desc,
        benefit3Title: b[2]?.title || defaultContentConfig.benefit3Title,
        benefit3Desc: b[2]?.desc || defaultContentConfig.benefit3Desc,
        benefit4Title: b[3]?.title || defaultContentConfig.benefit4Title,
        benefit4Desc: b[3]?.desc || defaultContentConfig.benefit4Desc,
        benefit5Title: b[4]?.title || defaultContentConfig.benefit5Title,
        benefit5Desc: b[4]?.desc || defaultContentConfig.benefit5Desc,
        manufacturerNote: cfg.manufacturerNote || defaultContentConfig.manufacturerNote
      }
    });
    setShowModal(true);
  };

  const updateContentField = (field, val) => {
    setForm(prev => ({
      ...prev,
      contentConfig: {
        ...prev.contentConfig,
        [field]: val
      }
    }));
  };

  const applyPreset = (presetType) => {
    if (!presetType) return;
    let presetName = '';
    if (presetType === 'duoc') {
      presetName = 'Giao diện Dược phẩm';
      setForm(prev => ({
        ...prev,
        name: prev.name || presetName,
        primaryColor: '#0d9488',
        secondaryColor: '#0ea5e9',
        backgroundColor: '#ffffff',
        textColor: '#1e293b',
        layout: 'modern',
        logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="20" fill="%23f0fdfa"/><path d="M50 20v60M30 50h40" stroke="%230d9488" stroke-width="12" stroke-linecap="round"/><circle cx="50" cy="50" r="10" fill="%230ea5e9"/></svg>'
      }));
    } else if (presetType === 'mypham') {
      presetName = 'Giao diện Mỹ phẩm';
      setForm(prev => ({
        ...prev,
        name: prev.name || presetName,
        primaryColor: '#c5a880',
        secondaryColor: '#db2777',
        backgroundColor: '#0f0f15',
        textColor: '#ffffff',
        layout: 'premium',
        logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="20" fill="%230f0f15"/><path d="M50 15c0 0-10 15-10 25s10 10 10 10 10 0 10-10-10-25-10-25zM50 85c0 0 10-15 10-25s-10-10-10-10-10 0-10 10 10 25 10 25zM15 50c0 0 15 10 25 10s10-10 10-10-0-10-10-10-25 10-25 10zM85 50c0 0-15-10-25-10s-10 10-10 10 0 10 10 10 25-10 25-10z" fill="%23c5a880"/><circle cx="50" cy="50" r="8" fill="%23db2777"/></svg>'
      }));
    } else if (presetType === 'nongnghiep') {
      presetName = 'Giao diện Nông nghiệp';
      setForm(prev => ({
        ...prev,
        name: prev.name || presetName,
        primaryColor: '#16a34a',
        secondaryColor: '#84cc16',
        backgroundColor: '#f0fdf4',
        textColor: '#1f2937',
        layout: 'minimal',
        logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="20" fill="%23f0fdf4"/><path d="M50 80V40M50 40c0-10-15-15-25-5 0 0 5 15 25 5zm0 15c0-8 15-12 25-2 0 0-5 12-25 2z" stroke="%2316a34a" stroke-width="8" stroke-linecap="round" fill="none"/><circle cx="50" cy="30" r="6" fill="%2384cc16"/></svg>'
      }));
    } else if (presetType === 'baohanh') {
      presetName = 'Giao diện Tem Bảo Hành (PDF Standard)';
      setForm(prev => ({
        ...prev,
        name: prev.name || presetName,
        primaryColor: '#0d47a1',
        secondaryColor: '#1565c0',
        backgroundColor: '#f0f4f8',
        textColor: '#0f172a',
        layout: 'warranty_solution',
        logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="20" fill="%230d47a1"/><path d="M50 20L75 35V60L50 80L25 60V35L50 20Z" stroke="%23ffffff" stroke-width="6" fill="none"/><path d="M40 50L47 57L62 42" stroke="%234ade80" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError(null);
    if (isAdmin && !form.enterpriseId) {
      setModalError('Vui lòng chọn doanh nghiệp sở hữu template');
      return;
    }

    const c = form.contentConfig;
    const formattedContentConfig = {
      headerTitle1: c.headerTitle1,
      headerTitle2: c.headerTitle2,
      transparencyLine1: c.transparencyLine1,
      transparencyLine2: c.transparencyLine2,
      spec1Label: c.spec1Label,
      spec1Value: c.spec1Value,
      spec2Label: c.spec2Label,
      spec2Value: c.spec2Value,
      spec3Label: c.spec3Label,
      spec3Value: c.spec3Value,
      spec4Label: c.spec4Label,
      spec4Value: c.spec4Value,
      benefits: [
        { title: c.benefit1Title, desc: c.benefit1Desc },
        { title: c.benefit2Title, desc: c.benefit2Desc },
        { title: c.benefit3Title, desc: c.benefit3Desc },
        { title: c.benefit4Title, desc: c.benefit4Desc },
        { title: c.benefit5Title, desc: c.benefit5Desc }
      ],
      manufacturerNote: c.manufacturerNote
    };

    try {
      const data = {
        ...form,
        contentConfig: formattedContentConfig,
        enterpriseId: isAdmin ? form.enterpriseId : enterpriseId
      };
      if (editing) await api.updateTemplate(editing._id, data);
      else await api.createTemplate(data);
      setShowModal(false);
      loadTemplates();
    } catch (err) { setModalError(err.message || 'Lỗi lưu template'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Xóa template này?')) return;
    try { await api.deleteTemplate(id); loadTemplates(); }
    catch (err) { alert(err.message); }
  };

  if (loading) return <div className="loading-overlay"><div className="loading-spinner" style={{width:40,height:40}}></div></div>;

  return (
    <div className="templates-page">
      <div className="page-header">
        <div>
          <h1>Cấu hình Giao diện Tem</h1>
          <p>Tùy chỉnh màu sắc, logo và nội dung hiển thị khi quét tem</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={18}/> Tạo Template Mới</button>
      </div>

      <div className="templates-grid">
        {templates.length === 0 ? (
          <div className="empty-state"><Palette size={60}/><h3>Chưa có template nào</h3></div>
        ) : (
          templates.map(tmpl => (
            <div key={tmpl._id} className="template-card card animate-fade-in-up">
              {/* Preview */}
              <div className="template-preview" style={{background: tmpl.backgroundColor, color: tmpl.textColor}}>
                <div className="preview-header" style={{background: `linear-gradient(135deg, ${tmpl.primaryColor}, ${tmpl.secondaryColor})`}}>
                  <CheckCircle size={20}/> <span>{tmpl.contentConfig?.headerTitle2 || 'TEM BẢO HÀNH SẢN PHẨM'}</span>
                </div>
                <div className="preview-body">
                  <div className="preview-product-name">{tmpl.contentConfig?.headerTitle1 || 'GIẢI PHÁP QRcode'}</div>
                  {tmpl.showProductInfo && <div className="preview-info">Sản phẩm & Thông số</div>}
                  {tmpl.showDistributorInfo && <div className="preview-info">Điểm bán & NSX</div>}
                  {tmpl.showScanCount && <div className="preview-scan">Đã quét: 5 lần</div>}
                </div>
              </div>
              <div className="template-info">
                <h3>{tmpl.name}</h3>
                <div className="template-meta">
                  <span className="badge badge-neutral">{tmpl.layout}</span>
                  {tmpl.isDefault && <span className="badge badge-success">Mặc định</span>}
                </div>
                <div className="template-colors">
                  <span className="color-dot" style={{background: tmpl.primaryColor}} title="Primary"></span>
                  <span className="color-dot" style={{background: tmpl.secondaryColor}} title="Secondary"></span>
                  <span className="color-dot" style={{background: tmpl.backgroundColor}} title="Background"></span>
                </div>
                <div className="template-actions">
                  <button className="btn btn-sm btn-ghost" onClick={() => openEdit(tmpl)}><Edit size={14}/> Sửa</button>
                  <button className="btn btn-sm btn-ghost" onClick={() => setPreviewTemplate(tmpl)}><Eye size={14}/> Xem</button>
                  <button className="btn btn-sm btn-ghost" onClick={() => handleDelete(tmpl._id)}><Trash2 size={14}/></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal with Content Editor Tabs */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{maxWidth: 680}}>
            <div className="modal-header">
              <h3 className="modal-title">{editing ? 'Sửa Template Tem' : 'Tạo Template Tem mới'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>

            {/* Modal Tabs Header */}
            <div className="modal-tabs">
              <button
                type="button"
                className={`tab-btn ${modalTab === 'basic' ? 'active' : ''}`}
                onClick={() => setModalTab('basic')}
              >
                <Settings size={16} /> Cấu hình Cơ bản & Màu sắc
              </button>
              <button
                type="button"
                className={`tab-btn ${modalTab === 'content' ? 'active' : ''}`}
                onClick={() => setModalTab('content')}
              >
                <FileText size={16} /> Tùy chỉnh Nội dung Tem
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                {modalError && (
                  <div className="modal-error animate-fade-in" style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: 12, marginBottom: 16,
                    borderRadius: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)'
                  }}>
                    <XCircle size={18} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.9rem' }}>{modalError}</span>
                  </div>
                )}

                {modalTab === 'basic' ? (
                  <>
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
                    <div className="input-group">
                      <label>Áp dụng nhanh Ngành Hàng mẫu</label>
                      <select
                        className="input select"
                        defaultValue=""
                        onChange={e => applyPreset(e.target.value)}
                      >
                        <option value="">-- Tùy chọn thiết kế mẫu --</option>
                        <option value="baohanh">Tem Bảo Hành Sản Phẩm (PDF Standard - Blue/Emerald)</option>
                        <option value="duoc">Dược phẩm & Y tế (Xanh Teal, Modern, Light mode)</option>
                        <option value="mypham">Mỹ phẩm & Làm đẹp (Gold/Rose, Premium, Dark mode)</option>
                        <option value="nongnghiep">Nông nghiệp & Thực phẩm (Xanh lá, Minimal, Nature)</option>
                      </select>
                    </div>
                    <div className="input-group"><label>Tên Template *</label><input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
                    <div className="input-group">
                      <label>Layout</label>
                      <select className="input select" value={form.layout} onChange={e => setForm({...form, layout: e.target.value})}>
                        <option value="warranty_solution">Tem Bảo Hành PDF (Warranty Solution)</option>
                        <option value="default">Default</option>
                        <option value="minimal">Minimal</option>
                        <option value="premium">Premium</option>
                        <option value="modern">Modern</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label>Logo của Template (URL hoặc SVG Data URI)</label>
                      <input
                        className="input"
                        value={form.logo || ''}
                        onChange={e => setForm({...form, logo: e.target.value})}
                        placeholder="Để trống sẽ dùng logo doanh nghiệp"
                      />
                    </div>
                    {form.logo && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0', padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Logo hiện tại:</span>
                        <img src={form.logo} alt="Logo preview" style={{ height: 32, maxWidth: 120, objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
                      </div>
                    )}
                    <div className="input-group">
                      <label>Hình nền Template (URL tùy chọn)</label>
                      <input
                        className="input"
                        value={form.backgroundImage || ''}
                        onChange={e => setForm({...form, backgroundImage: e.target.value})}
                        placeholder="URL ảnh nền cho trang quét tem"
                      />
                    </div>
                    <div className="color-grid">
                      <div className="input-group">
                        <label>Màu chính</label>
                        <div className="color-input"><input type="color" value={form.primaryColor} onChange={e => setForm({...form, primaryColor: e.target.value})} /><span>{form.primaryColor}</span></div>
                      </div>
                      <div className="input-group">
                        <label>Màu phụ</label>
                        <div className="color-input"><input type="color" value={form.secondaryColor} onChange={e => setForm({...form, secondaryColor: e.target.value})} /><span>{form.secondaryColor}</span></div>
                      </div>
                      <div className="input-group">
                        <label>Nền</label>
                        <div className="color-input"><input type="color" value={form.backgroundColor} onChange={e => setForm({...form, backgroundColor: e.target.value})} /><span>{form.backgroundColor}</span></div>
                      </div>
                      <div className="input-group">
                        <label>Chữ</label>
                        <div className="color-input"><input type="color" value={form.textColor} onChange={e => setForm({...form, textColor: e.target.value})} /><span>{form.textColor}</span></div>
                      </div>
                    </div>
                    <div className="toggle-group">
                      <label className="toggle-label"><input type="checkbox" checked={form.showVerificationBadge} onChange={e => setForm({...form, showVerificationBadge: e.target.checked})} /><span className="toggle-switch"></span><span>Hiển thị badge xác thực</span></label>
                      <label className="toggle-label"><input type="checkbox" checked={form.showProductInfo} onChange={e => setForm({...form, showProductInfo: e.target.checked})} /><span className="toggle-switch"></span><span>Hiển thị thông tin SP</span></label>
                      <label className="toggle-label"><input type="checkbox" checked={form.showDistributorInfo} onChange={e => setForm({...form, showDistributorInfo: e.target.checked})} /><span className="toggle-switch"></span><span>Hiển thị điểm bán</span></label>
                      <label className="toggle-label"><input type="checkbox" checked={form.showScanCount} onChange={e => setForm({...form, showScanCount: e.target.checked})} /><span className="toggle-switch"></span><span>Hiển thị lượt quét</span></label>
                    </div>
                  </>
                ) : (
                  /* TAB 2: CONTENT EDITOR - TÙY CHỈNH NỘI DUNG TEM */
                  <div className="content-editor-section">
                    <div className="editor-group-title">1. Tiêu Đề Đầu Trang</div>
                    <div className="input-group-row">
                      <div className="input-group">
                        <label>Dòng tiêu đề 1</label>
                        <input
                          className="input"
                          value={form.contentConfig.headerTitle1}
                          onChange={e => updateContentField('headerTitle1', e.target.value)}
                          placeholder="VD: GIẢI PHÁP QRcode"
                        />
                      </div>
                      <div className="input-group">
                        <label>Dòng tiêu đề 2 (In hoa lớn)</label>
                        <input
                          className="input"
                          value={form.contentConfig.headerTitle2}
                          onChange={e => updateContentField('headerTitle2', e.target.value)}
                          placeholder="VD: TEM BẢO HÀNH SẢN PHẨM"
                        />
                      </div>
                    </div>

                    <div className="editor-group-title" style={{ marginTop: 16 }}>2. Khung Cam Kết Minh Bạch (Nền Xanh Lá)</div>
                    <div className="input-group-row">
                      <div className="input-group">
                        <label>Cam kết Dòng 1</label>
                        <input
                          className="input"
                          value={form.contentConfig.transparencyLine1}
                          onChange={e => updateContentField('transparencyLine1', e.target.value)}
                          placeholder="VD: SẢN PHẨM ĐÃ ĐƯỢC NHÀ CUNG CẤP"
                        />
                      </div>
                      <div className="input-group">
                        <label>Cam kết Dòng 2</label>
                        <input
                          className="input"
                          value={form.contentConfig.transparencyLine2}
                          onChange={e => updateContentField('transparencyLine2', e.target.value)}
                          placeholder="VD: CAM KẾT MINH BẠCH THÔNG TIN"
                        />
                      </div>
                    </div>

                    <div className="editor-group-title" style={{ marginTop: 16 }}>3. Bộ 4 Icon Thông Số Kỹ Thuật</div>
                    <div className="specs-editor-grid">
                      <div className="spec-item-group">
                        <label className="spec-lbl">Ô 1 (Nhãn & Giá trị)</label>
                        <input className="input sm" value={form.contentConfig.spec1Label} onChange={e => updateContentField('spec1Label', e.target.value)} placeholder="Nhãn: Dung tích" />
                        <input className="input sm" value={form.contentConfig.spec1Value} onChange={e => updateContentField('spec1Value', e.target.value)} placeholder="Giá trị: 1.8L" />
                      </div>
                      <div className="spec-item-group">
                        <label className="spec-lbl">Ô 2 (Nhãn & Giá trị)</label>
                        <input className="input sm" value={form.contentConfig.spec2Label} onChange={e => updateContentField('spec2Label', e.target.value)} placeholder="Nhãn: Công suất" />
                        <input className="input sm" value={form.contentConfig.spec2Value} onChange={e => updateContentField('spec2Value', e.target.value)} placeholder="Giá trị: 1200W" />
                      </div>
                      <div className="spec-item-group">
                        <label className="spec-lbl">Ô 3 (Nhãn & Giá trị)</label>
                        <input className="input sm" value={form.contentConfig.spec3Label} onChange={e => updateContentField('spec3Label', e.target.value)} placeholder="Nhãn: Lòng nồi/Vật liệu" />
                        <input className="input sm" value={form.contentConfig.spec3Value} onChange={e => updateContentField('spec3Value', e.target.value)} placeholder="Giá trị: Inox 304" />
                      </div>
                      <div className="spec-item-group">
                        <label className="spec-lbl">Ô 4 (Nhãn & Giá trị)</label>
                        <input className="input sm" value={form.contentConfig.spec4Label} onChange={e => updateContentField('spec4Label', e.target.value)} placeholder="Nhãn: Bảo hành" />
                        <input className="input sm" value={form.contentConfig.spec4Value} onChange={e => updateContentField('spec4Value', e.target.value)} placeholder="Giá trị: 24 tháng" />
                      </div>
                    </div>

                    <div className="editor-group-title" style={{ marginTop: 16 }}>4. 5 Thẻ Lợi Ích Ở Chân Trang</div>
                    <div className="benefits-editor-list">
                      <div className="benefit-edit-row">
                        <span className="benefit-idx">#1</span>
                        <input className="input sm" value={form.contentConfig.benefit1Title} onChange={e => updateContentField('benefit1Title', e.target.value)} placeholder="Tiêu đề: ĐẢM BẢO CHÍNH HÃNG" />
                        <input className="input sm wide" value={form.contentConfig.benefit1Desc} onChange={e => updateContentField('benefit1Desc', e.target.value)} placeholder="Mô tả: Xác thực nguồn gốc..." />
                      </div>

                      <div className="benefit-edit-row">
                        <span className="benefit-idx">#2</span>
                        <input className="input sm" value={form.contentConfig.benefit2Title} onChange={e => updateContentField('benefit2Title', e.target.value)} placeholder="Tiêu đề: BẢO HÀNH ĐIỆN TỬ" />
                        <input className="input sm wide" value={form.contentConfig.benefit2Desc} onChange={e => updateContentField('benefit2Desc', e.target.value)} placeholder="Mô tả: Kích hoạt nhanh..." />
                      </div>

                      <div className="benefit-edit-row">
                        <span className="benefit-idx">#3</span>
                        <input className="input sm" value={form.contentConfig.benefit3Title} onChange={e => updateContentField('benefit3Title', e.target.value)} placeholder="Tiêu đề: HỖ TRỢ NHANH CHÓNG" />
                        <input className="input sm wide" value={form.contentConfig.benefit3Desc} onChange={e => updateContentField('benefit3Desc', e.target.value)} placeholder="Mô tả: Tiếp nhận hỗ trợ..." />
                      </div>

                      <div className="benefit-edit-row">
                        <span className="benefit-idx">#4</span>
                        <input className="input sm" value={form.contentConfig.benefit4Title} onChange={e => updateContentField('benefit4Title', e.target.value)} placeholder="Tiêu đề: ƯU ĐÃI ĐẶC QUYỀN" />
                        <input className="input sm wide" value={form.contentConfig.benefit4Desc} onChange={e => updateContentField('benefit4Desc', e.target.value)} placeholder="Mô tả: Nhận thông tin km..." />
                      </div>

                      <div className="benefit-edit-row">
                        <span className="benefit-idx">#5</span>
                        <input className="input sm" value={form.contentConfig.benefit5Title} onChange={e => updateContentField('benefit5Title', e.target.value)} placeholder="Tiêu đề: BẢO VỆ QUYỀN LỢI" />
                        <input className="input sm wide" value={form.contentConfig.benefit5Desc} onChange={e => updateContentField('benefit5Desc', e.target.value)} placeholder="Mô tả: An tâm sử dụng..." />
                      </div>
                    </div>

                    <div className="editor-group-title" style={{ marginTop: 16 }}>5. Ghi Chú Nhà Sản Xuất</div>
                    <div className="input-group">
                      <label>Đoạn văn bản giới thiệu ở khối Nhà Sản Xuất</label>
                      <textarea
                        className="input textarea"
                        rows={3}
                        value={form.contentConfig.manufacturerNote}
                        onChange={e => updateContentField('manufacturerNote', e.target.value)}
                        placeholder="Nhập đoạn văn bản giới thiệu uy tín thương hiệu..."
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary"><Save size={16}/> Lưu Thay Đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Preview Modal */}
      {previewTemplate && (
        <div className="modal-overlay" onClick={() => setPreviewTemplate(null)}>
          <div className="preview-modal animate-scale-in" style={{
            background: previewTemplate.backgroundColor || '#f0f4f8', 
            color: previewTemplate.textColor || '#0f172a',
            backgroundImage: previewTemplate.backgroundImage ? `url(${previewTemplate.backgroundImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            maxWidth: 640
          }}>
            <button className="preview-close btn-icon" onClick={() => setPreviewTemplate(null)}><X size={24}/></button>
            <div className="preview-full">
              <h3 style={{ color: '#0d47a1', textAlign: 'center', marginBottom: 4, fontWeight: 900 }}>
                {previewTemplate.contentConfig?.headerTitle1 || 'GIẢI PHÁP QRcode'}
              </h3>
              <h2 style={{ color: '#0d47a1', textAlign: 'center', marginTop: 0, fontWeight: 900 }}>
                {previewTemplate.contentConfig?.headerTitle2 || 'TEM BẢO HÀNH SẢN PHẨM'}
              </h2>

              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: 12, textAlign: 'center', margin: '16px 0' }}>
                <div style={{ color: '#15803d', fontWeight: 800, fontSize: '0.9rem' }}>
                  {previewTemplate.contentConfig?.transparencyLine1 || 'SẢN PHẨM ĐÃ ĐƯỢC NHÀ CUNG CẤP'}
                </div>
                <div style={{ color: '#166534', fontWeight: 900, fontSize: '1rem' }}>
                  {previewTemplate.contentConfig?.transparencyLine2 || 'CAM KẾT MINH BẠCH THÔNG TIN'}
                </div>
              </div>

              <div style={{ background: '#ffffff', borderRadius: 10, padding: 14, border: '1px solid #e2e8f0', margin: '16px 0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{previewTemplate.contentConfig?.spec1Label || 'Dung tích'}</div>
                    <div style={{ fontWeight: 800, color: '#0d47a1', fontSize: '0.85rem' }}>{previewTemplate.contentConfig?.spec1Value || '1.8L'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{previewTemplate.contentConfig?.spec2Label || 'Công suất'}</div>
                    <div style={{ fontWeight: 800, color: '#0d47a1', fontSize: '0.85rem' }}>{previewTemplate.contentConfig?.spec2Value || '1200W'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{previewTemplate.contentConfig?.spec3Label || 'Lòng nồi'}</div>
                    <div style={{ fontWeight: 800, color: '#0d47a1', fontSize: '0.85rem' }}>{previewTemplate.contentConfig?.spec3Value || 'Inox 304'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{previewTemplate.contentConfig?.spec4Label || 'Bảo hành'}</div>
                    <div style={{ fontWeight: 800, color: '#0d47a1', fontSize: '0.85rem' }}>{previewTemplate.contentConfig?.spec4Value || '24 tháng'}</div>
                  </div>
                </div>
              </div>

              <div className="preview-footer" style={{ marginTop: 20 }}>Template: {previewTemplate.name}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Edit({ size }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>;
}
