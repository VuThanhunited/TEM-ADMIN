import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
  Palette, Plus, X, Save, Eye, Trash2, CheckCircle, XCircle
} from 'lucide-react';
import './Templates.css';

export default function Templates() {
  const { isAdmin, enterpriseId } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [enterprises, setEnterprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [form, setForm] = useState({
    name: '', primaryColor: '#6366f1', secondaryColor: '#8b5cf6',
    backgroundColor: '#0f172a', textColor: '#f8fafc', layout: 'default',
    showVerificationBadge: true, showProductInfo: true, showDistributorInfo: true, showScanCount: false, enterpriseId: ''
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
    setForm({ name: '', primaryColor: '#6366f1', secondaryColor: '#8b5cf6', backgroundColor: '#0f172a', textColor: '#f8fafc', layout: 'default', showVerificationBadge: true, showProductInfo: true, showDistributorInfo: true, showScanCount: false, enterpriseId: '' });
    setShowModal(true);
  };

  const openEdit = (tmpl) => {
    setEditing(tmpl);
    setModalError(null);
    setForm({ name: tmpl.name, primaryColor: tmpl.primaryColor, secondaryColor: tmpl.secondaryColor, backgroundColor: tmpl.backgroundColor, textColor: tmpl.textColor, layout: tmpl.layout, showVerificationBadge: tmpl.showVerificationBadge, showProductInfo: tmpl.showProductInfo, showDistributorInfo: tmpl.showDistributorInfo, showScanCount: tmpl.showScanCount, enterpriseId: tmpl.enterpriseId?._id || tmpl.enterpriseId || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError(null);
    if (isAdmin && !form.enterpriseId) {
      setModalError('Vui lòng chọn doanh nghiệp sở hữu template');
      return;
    }
    try {
      const data = { ...form, enterpriseId: isAdmin ? form.enterpriseId : enterpriseId };
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
          <h1>Cấu hình Giao diện</h1>
          <p>Tùy chỉnh template hiển thị khi quét tem</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={18}/> Tạo Template</button>
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
                  <CheckCircle size={20}/> <span>Sản phẩm chính hãng</span>
                </div>
                <div className="preview-body">
                  <div className="preview-product-name">Tên sản phẩm</div>
                  {tmpl.showProductInfo && <div className="preview-info">Thông tin sản phẩm</div>}
                  {tmpl.showDistributorInfo && <div className="preview-info">Điểm bán</div>}
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{maxWidth: 560}}>
            <div className="modal-header">
              <h3 className="modal-title">{editing ? 'Sửa Template' : 'Tạo Template mới'}</h3>
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
                <div className="input-group"><label>Tên Template *</label><input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
                <div className="input-group">
                  <label>Layout</label>
                  <select className="input select" value={form.layout} onChange={e => setForm({...form, layout: e.target.value})}>
                    <option value="default">Default</option>
                    <option value="minimal">Minimal</option>
                    <option value="premium">Premium</option>
                    <option value="modern">Modern</option>
                  </select>
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
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary"><Save size={16}/> Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Preview Modal */}
      {previewTemplate && (
        <div className="modal-overlay" onClick={() => setPreviewTemplate(null)}>
          <div className="preview-modal animate-scale-in" style={{background: previewTemplate.backgroundColor, color: previewTemplate.textColor}}>
            <button className="preview-close btn-icon" onClick={() => setPreviewTemplate(null)}><X size={24}/></button>
            <div className="preview-full">
              {previewTemplate.showVerificationBadge && (
                <div className="preview-badge" style={{background: `linear-gradient(135deg, ${previewTemplate.primaryColor}, ${previewTemplate.secondaryColor})`}}>
                  <CheckCircle size={28}/> <span>Sản phẩm chính hãng</span>
                </div>
              )}
              <h2 style={{marginTop: 24}}>Nước mắm Việt Hương Premium</h2>
              {previewTemplate.showProductInfo && (
                <div className="preview-section">
                  <h4 style={{color: previewTemplate.primaryColor}}>Thông tin sản phẩm</h4>
                  <p>Nước mắm cá cơm truyền thống, ủ 12 tháng, 40 độ đạm.</p>
                </div>
              )}
              {previewTemplate.showDistributorInfo && (
                <div className="preview-section">
                  <h4 style={{color: previewTemplate.primaryColor}}>Điểm bán</h4>
                  <p>Siêu thị Co.opMart - Q.1, TP.HCM</p>
                </div>
              )}
              {previewTemplate.showScanCount && (
                <div className="preview-section"><p>Tem đã được quét: <strong>5 lần</strong></p></div>
              )}
              <div className="preview-footer">Serial: VH-000001</div>
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
