import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  Users, Plus, Search, RefreshCw, Edit, Trash2,
  X, MapPin, Building2, Store, Filter,
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Heading2, Heading3, Code, Eye,
  Image as ImageIcon, Link2 as LinkIcon, FileText, Upload
} from 'lucide-react';
import './Distributors.css';
import Pagination from '../../components/Pagination';

export default function Distributors() {
  const { isAdmin } = useAuth();
  const [distributors, setDistributors] = useState([]);
  const [enterprises, setEnterprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all', 'NSX', 'NPP'
  const [showModal, setShowModal] = useState(false);
  const [editingDistributor, setEditingDistributor] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  // Form state: name, address, details, role + enterpriseId (for ADMIN)
  const [form, setForm] = useState({
    fullName: '', address: '', details: '', role: 'NPP', enterpriseId: ''
  });

  // Rich Text Editor
  const [editorMode, setEditorMode] = useState('visual'); // 'visual' | 'code'
  const editorRef = useRef(null);
  const savedRangeRef = useRef(null);

  // Image & Link sub-modals
  const [showImgModal, setShowImgModal] = useState(false);
  const [imgUrlInput, setImgUrlInput] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrlInput, setLinkUrlInput] = useState('');
  const [linkTextInput, setLinkTextInput] = useState('');
  const [linkNewTab, setLinkNewTab] = useState(true);

  useEffect(() => { loadDistributors(); }, [pagination.page, search, roleFilter]);
  useEffect(() => { if (isAdmin) loadEnterprises(); }, [isAdmin]);

  const loadEnterprises = async () => {
    try {
      const data = await api.getEnterprises();
      setEnterprises(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Lỗi tải doanh nghiệp:', err);
    }
  };

  const loadDistributors = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        search,
        ...(roleFilter !== 'all' ? { role: roleFilter } : {})
      };
      const result = await api.getDistributors(params);
      setDistributors(result.data);
      setPagination(prev => ({ ...prev, ...result.pagination }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingDistributor(null);
    setForm({ fullName: '', address: '', details: '', role: 'NPP', enterpriseId: '' });
    setEditorMode('visual');
    setShowModal(true);
    setTimeout(() => {
      if (editorRef.current) editorRef.current.innerHTML = '';
    }, 100);
  };

  const handleOpenEdit = (dist) => {
    setEditingDistributor(dist);
    setForm({
      fullName: dist.fullName || '',
      address: dist.address || '',
      details: dist.details || '',
      role: dist.role || 'NPP'
    });
    setEditorMode('visual');
    setShowModal(true);
    setTimeout(() => {
      if (editorRef.current) editorRef.current.innerHTML = dist.details || '';
    }, 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        fullName: form.fullName,
        address: form.address,
        details: form.details,
        role: form.role,
        isActive: editingDistributor ? editingDistributor.isActive : true,
        ...(isAdmin && form.enterpriseId ? { enterpriseId: form.enterpriseId } : {})
      };
      if (editingDistributor) {
        await api.updateDistributor(editingDistributor._id, payload);
      } else {
        await api.createDistributor(payload);
      }
      setShowModal(false);
      loadDistributors();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa đơn vị này?')) return;
    try {
      await api.deleteDistributor(id);
      loadDistributors();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleActive = async (dist) => {
    try {
      await api.updateDistributor(dist._id, { ...dist, isActive: !dist.isActive });
      loadDistributors();
    } catch (err) {
      alert(err.message);
    }
  };

  // ─── Rich Text Editor Helpers ───────────────────────────────────────────────
  const execCmd = (command, value = null) => {
    if (editorMode !== 'visual') return;
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setForm(prev => ({ ...prev, details: editorRef.current.innerHTML }));
    }
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    if (savedRangeRef.current && editorRef.current) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  };

  const insertHtmlAtCursorOrEnd = (html) => {
    if (editorMode === 'visual' && editorRef.current) {
      editorRef.current.focus();
      restoreSelection();
      let success = false;
      try { success = document.execCommand('insertHTML', false, html); } catch (e) {}
      if (!success) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        while (tempDiv.firstChild) editorRef.current.appendChild(tempDiv.firstChild);
      }
      setForm(prev => ({ ...prev, details: editorRef.current.innerHTML }));
    } else {
      setForm(prev => ({ ...prev, details: (prev.details || '') + html }));
    }
  };

  const handleOpenImgModal = () => { saveSelection(); setImgUrlInput(''); setShowImgModal(true); };
  const handleOpenLinkModal = () => { saveSelection(); setLinkUrlInput(''); setLinkTextInput(''); setLinkNewTab(true); setShowLinkModal(true); };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Dung lượng ảnh quá lớn! Vui lòng chọn file nhỏ hơn 5MB.'); return; }
    const reader = new FileReader();
    reader.onload = (event) => setImgUrlInput(event.target.result);
    reader.readAsDataURL(file);
  };

  const applyInsertImage = () => {
    if (!imgUrlInput || !imgUrlInput.trim()) { alert('Vui lòng chọn ảnh hoặc nhập URL ảnh!'); return; }
    const imgHtml = `<p style="text-align:center;margin:12px 0;"><img src="${imgUrlInput.trim()}" alt="Hình ảnh" style="max-width:100%;height:auto;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);" /></p><p><br></p>`;
    insertHtmlAtCursorOrEnd(imgHtml);
    setShowImgModal(false);
    setImgUrlInput('');
  };

  const applyInsertLink = () => {
    if (!linkUrlInput || !linkUrlInput.trim()) { alert('Vui lòng nhập đường dẫn URL!'); return; }
    const text = linkTextInput.trim() || linkUrlInput.trim();
    const targetAttr = linkNewTab ? ' target="_blank" rel="noreferrer"' : '';
    const linkHtml = `<a href="${linkUrlInput.trim()}"${targetAttr} style="color:#6366f1;text-decoration:underline;font-weight:600;">${text}</a> `;
    insertHtmlAtCursorOrEnd(linkHtml);
    setShowLinkModal(false);
    setLinkUrlInput('');
    setLinkTextInput('');
  };

  const handleEditorInput = () => {
    if (editorRef.current) setForm(prev => ({ ...prev, details: editorRef.current.innerHTML }));
  };

  const handleCodeChange = (e) => {
    const val = e.target.value;
    setForm(prev => ({ ...prev, details: val }));
    if (editorRef.current) editorRef.current.innerHTML = val;
  };
  // ────────────────────────────────────────────────────────────────────────────

  return (
    <div className="distributors-page">
      <div className="page-header">
        <div>
          <h1>Quản lý NSX / Nhà phân phối / Điểm bán</h1>
          <p>Tạo và quản lý NSX, nhà phân phối, đại lý và các điểm bán sản phẩm</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={18} /> Thêm đơn vị mới
        </button>
      </div>

      {/* Toolbar */}
      <div className="toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 280, alignItems: 'center' }}>
          <div className="search-box" style={{ flex: 1 }}>
            <Search size={18} className="search-icon" />
            <input
              className="input"
              placeholder="Tìm theo tên đơn vị, địa chỉ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Role Filter Tabs */}
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', padding: 3, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
            <button type="button" onClick={() => setRoleFilter('all')} style={{ padding: '5px 12px', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer', border: 'none', background: roleFilter === 'all' ? 'var(--primary-color)' : 'transparent', color: roleFilter === 'all' ? '#fff' : 'var(--text-muted)' }}>Tất cả</button>
            <button type="button" onClick={() => setRoleFilter('NSX')} style={{ padding: '5px 12px', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer', border: 'none', background: roleFilter === 'NSX' ? 'var(--primary-color)' : 'transparent', color: roleFilter === 'NSX' ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Building2 size={13} /> NSX
            </button>
            <button type="button" onClick={() => setRoleFilter('NPP')} style={{ padding: '5px 12px', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer', border: 'none', background: roleFilter === 'NPP' ? 'var(--primary-color)' : 'transparent', color: roleFilter === 'NPP' ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Store size={13} /> NPP / Điểm bán
            </button>
          </div>
        </div>

        <button className="btn btn-ghost" onClick={loadDistributors}>
          <RefreshCw size={16} /> Làm mới
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Đơn vị / Cửa hàng</th>
              <th>Loại đối tác</th>
              <th>Địa chỉ</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="loading-overlay"><div className="loading-spinner"></div></td></tr>
            ) : distributors.length === 0 ? (
              <tr><td colSpan={5} className="empty-state"><Users size={40}/><h3>Chưa có đơn vị nào</h3></td></tr>
            ) : (
              distributors.map(dist => (
                <tr key={dist._id}>
                  <td>
                    <div className="dist-info">
                      <div className="dist-avatar" style={{
                        background: dist.role === 'NSX' ? 'rgba(99,102,241,0.2)' : 'rgba(16,185,129,0.2)',
                        color: dist.role === 'NSX' ? '#818cf8' : '#34d399'
                      }}>
                        {dist.role === 'NSX' ? <Building2 size={16} /> : (dist.fullName?.charAt(0) || <Store size={16} />)}
                      </div>
                      <div>
                        <div className="dist-name">{dist.fullName}</div>
                        {dist.details && (
                          <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: 2 }}>
                            <FileText size={11} style={{ display: 'inline', marginRight: 3 }} />
                            Có thông tin chi tiết
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    {dist.role === 'NSX' ? (
                      <span className="badge" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Building2 size={11} /> Nhà sản xuất
                      </span>
                    ) : (
                      <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Store size={11} /> NPP / Điểm bán
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="dist-address-cell" title={dist.address}>
                      <MapPin size={14} className="dist-icon" />
                      <span>{dist.address || 'Chưa cập nhật'}</span>
                    </div>
                  </td>
                  <td>
                    <button
                      className={`badge badge-dot ${dist.isActive ? 'badge-success' : 'badge-danger'}`}
                      onClick={() => handleToggleActive(dist)}
                      style={{ cursor: 'pointer', border: 'none' }}
                      title="Bật/Tắt hoạt động"
                    >
                      {dist.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                    </button>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn-sm btn-ghost" onClick={() => handleOpenEdit(dist)} title="Chỉnh sửa">
                        <Edit size={14} />
                      </button>
                      <button className="btn btn-sm btn-ghost" onClick={() => handleDelete(dist._id)} title="Xóa">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={(newPage) => setPagination(prev => ({ ...prev, page: newPage }))}
        />
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 760 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingDistributor ? 'Chỉnh sửa đơn vị' : 'Thêm đơn vị mới'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                {/* Doanh nghiệp sở hữu — chỉ ADMIN mới thấy */}
                {isAdmin && (
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label>Doanh nghiệp sở hữu *</label>
                    <select
                      className="input select"
                      value={form.enterpriseId}
                      onChange={e => setForm({ ...form, enterpriseId: e.target.value })}
                      required={!editingDistributor}
                    >
                      <option value="">-- Chọn doanh nghiệp --</option>
                      {enterprises.map(ent => (
                        <option key={ent._id} value={ent._id}>{ent.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Loại đơn vị */}
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Loại đối tác *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <button type="button" onClick={() => setForm({ ...form, role: 'NPP' })} style={{ padding: '10px 14px', borderRadius: 8, cursor: 'pointer', border: '1px solid', borderColor: form.role === 'NPP' ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)', background: form.role === 'NPP' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.02)', color: form.role === 'NPP' ? 'var(--primary-color)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: form.role === 'NPP' ? 600 : 400 }}>
                      <Store size={16} /> Nhà phân phối / Điểm bán
                    </button>
                    <button type="button" onClick={() => setForm({ ...form, role: 'NSX' })} style={{ padding: '10px 14px', borderRadius: 8, cursor: 'pointer', border: '1px solid', borderColor: form.role === 'NSX' ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)', background: form.role === 'NSX' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.02)', color: form.role === 'NSX' ? 'var(--primary-color)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: form.role === 'NSX' ? 600 : 400 }}>
                      <Building2 size={16} /> Nhà sản xuất (NSX)
                    </button>
                  </div>
                </div>

                {/* Tên */}
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>{form.role === 'NSX' ? 'Tên Nhà sản xuất / Doanh nghiệp *' : 'Tên Điểm bán / Nhà phân phối *'}</label>
                  <input
                    className="input"
                    value={form.fullName}
                    onChange={e => setForm({ ...form, fullName: e.target.value })}
                    placeholder={form.role === 'NSX' ? 'Ví dụ: CÔNG TY CỔ PHẦN DƯỢC PHẨM ABC' : 'Ví dụ: ĐIỂM BÁN 01 – TẠP HÓA ANH TUẤN'}
                    required
                  />
                </div>

                {/* Địa chỉ */}
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Địa chỉ</label>
                  <input
                    className="input"
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    placeholder={form.role === 'NSX' ? 'Ví dụ: KCN Thăng Long, Đông Anh, Hà Nội' : 'Ví dụ: 12 Đường số 5, P. Hiệp Bình, TP. Thủ Đức'}
                  />
                </div>

                {/* Thông tin chi tiết — Rich Text Editor */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label className="label" style={{ marginBottom: 0 }}>Thông tin chi tiết (Soạn thảo văn bản & Chèn ảnh):</label>
                    {/* Mode Toggle */}
                    <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', padding: 3, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
                      <button type="button" onClick={() => setEditorMode('visual')} style={{ height: 28, fontSize: '0.8rem', padding: '0 10px', borderRadius: 6, cursor: 'pointer', border: 'none', background: editorMode === 'visual' ? 'var(--primary-color)' : 'transparent', color: editorMode === 'visual' ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Eye size={13} /> Soạn thảo
                      </button>
                      <button type="button" onClick={() => setEditorMode('code')} style={{ height: 28, fontSize: '0.8rem', padding: '0 10px', borderRadius: 6, cursor: 'pointer', border: 'none', background: editorMode === 'code' ? 'var(--primary-color)' : 'transparent', color: editorMode === 'code' ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Code size={13} /> HTML
                      </button>
                    </div>
                  </div>

                  {/* Toolbar */}
                  {editorMode === 'visual' && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px 8px 0 0' }}>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => execCmd('bold')} title="Bôi đậm"><Bold size={14} /></button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => execCmd('italic')} title="In nghiêng"><Italic size={14} /></button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => execCmd('underline')} title="Gạch chân"><Underline size={14} /></button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => execCmd('strikeThrough')} title="Gạch ngang"><Strikethrough size={14} /></button>
                      <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => execCmd('justifyLeft')} title="Căn trái"><AlignLeft size={14} /></button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => execCmd('justifyCenter')} title="Căn giữa"><AlignCenter size={14} /></button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => execCmd('justifyRight')} title="Căn phải"><AlignRight size={14} /></button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => execCmd('justifyFull')} title="Căn đều"><AlignJustify size={14} /></button>
                      <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => execCmd('insertUnorderedList')} title="Danh sách chấm"><List size={14} /></button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => execCmd('insertOrderedList')} title="Danh sách số"><ListOrdered size={14} /></button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => execCmd('formatBlock', '<h2>')} title="Tiêu đề 2"><Heading2 size={14} /></button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => execCmd('formatBlock', '<h3>')} title="Tiêu đề 3"><Heading3 size={14} /></button>
                      <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
                      <button type="button" className="btn btn-primary btn-sm" onClick={handleOpenImgModal} style={{ fontSize: '0.8rem', gap: 4, fontWeight: 600 }}>
                        <ImageIcon size={14} /> Chèn ảnh
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={handleOpenLinkModal} style={{ fontSize: '0.8rem', gap: 4 }}>
                        <LinkIcon size={14} /> Chèn Link
                      </button>
                    </div>
                  )}

                  {/* Editor content area */}
                  {editorMode === 'visual' ? (
                    <div
                      ref={editorRef}
                      contentEditable
                      onInput={handleEditorInput}
                      style={{
                        minHeight: 200,
                        maxHeight: 320,
                        overflowY: 'auto',
                        padding: 14,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '0 0 8px 8px',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        lineHeight: 1.6
                      }}
                    />
                  ) : (
                    <textarea
                      className="input"
                      style={{ minHeight: 200, fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.5, borderRadius: 8 }}
                      value={form.details}
                      onChange={handleCodeChange}
                      placeholder="<p>Nhập mã HTML thông tin chi tiết...</p>"
                    />
                  )}
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">{editingDistributor ? 'Lưu thay đổi' : 'Tạo đơn vị'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-modal: Chèn ảnh */}
      {showImgModal && (
        <div className="modal-overlay" style={{ zIndex: 2000 }} onClick={(e) => e.target === e.currentTarget && setShowImgModal(false)}>
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3 className="modal-title"><ImageIcon size={18} /> Chèn ảnh</h3>
              <button className="btn-icon" onClick={() => setShowImgModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label" style={{ marginBottom: 8, display: 'block' }}>Tải ảnh từ máy tính:</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8, border: '1px dashed rgba(255,255,255,0.2)', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', fontSize: '0.88rem' }}>
                  <Upload size={16} /> Chọn file ảnh (tối đa 5MB)
                  <input type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
                </label>
              </div>
              {imgUrlInput && imgUrlInput.length < 300 && (
                <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>URL: {imgUrlInput}</div>
              )}
              {imgUrlInput && (
                <img src={imgUrlInput} alt="Preview" style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }} />
              )}
              <div>
                <label className="label" style={{ marginBottom: 8, display: 'block' }}>Hoặc nhập URL ảnh:</label>
                <input className="input" type="text" placeholder="https://..." value={imgUrlInput} onChange={(e) => setImgUrlInput(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setShowImgModal(false)}>Hủy</button>
              <button type="button" className="btn btn-primary" onClick={applyInsertImage}><ImageIcon size={15} /> Chèn ảnh</button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-modal: Chèn Link */}
      {showLinkModal && (
        <div className="modal-overlay" style={{ zIndex: 2000 }} onClick={(e) => e.target === e.currentTarget && setShowLinkModal(false)}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3 className="modal-title"><LinkIcon size={18} /> Chèn liên kết</h3>
              <button className="btn-icon" onClick={() => setShowLinkModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>URL liên kết *</label>
                <input className="input" type="text" placeholder="https://..." value={linkUrlInput} onChange={(e) => setLinkUrlInput(e.target.value)} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Văn bản hiển thị (để trống = dùng URL)</label>
                <input className="input" type="text" placeholder="Ví dụ: Xem thêm thông tin..." value={linkTextInput} onChange={(e) => setLinkTextInput(e.target.value)} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.88rem' }}>
                <input type="checkbox" checked={linkNewTab} onChange={(e) => setLinkNewTab(e.target.checked)} />
                Mở liên kết trong tab mới
              </label>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setShowLinkModal(false)}>Hủy</button>
              <button type="button" className="btn btn-primary" onClick={applyInsertLink}><LinkIcon size={15} /> Chèn Link</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
