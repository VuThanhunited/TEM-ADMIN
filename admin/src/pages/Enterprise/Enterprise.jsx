import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
  Building2, Globe, MessageSquare, Save, Plus, Trash2, Edit3, Search, Filter, X,
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Image as ImageIcon, Link as LinkIcon, Heading2, Heading3, Code, Eye, RefreshCw,
  Phone, Mail, MapPin, FileText, CheckCircle, ExternalLink
} from 'lucide-react';
import './Enterprise.css';

export default function Enterprise() {
  const { user, isAdmin, enterpriseId } = useAuth();

  const [enterprises, setEnterprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  // Modal State for Create & Edit Enterprise
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE'); // 'CREATE' | 'EDIT'
  const [editingId, setEditingId] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState('info'); // 'info' | 'partnerDetails' | 'domainChatbot'

  // Modal Form Data
  const [formData, setFormData] = useState({
    name: '',
    type: 'NSX',
    taxCode: '',
    phone: '',
    email: '',
    address: '',
    website: '',
    partnerDetails: '',
    domain: '',
    subdomain: '',
    chatbotConfig: { enabled: false, script: '', welcomeMessage: '' }
  });

  // Rich Text Editor State inside Modal
  const [editorMode, setEditorMode] = useState('visual'); // 'visual' | 'code'
  const editorRef = useRef(null);

  useEffect(() => {
    loadData();
  }, [isAdmin, enterpriseId]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const list = await api.getEnterprises();
        setEnterprises(list || []);
      } else if (enterpriseId) {
        const ent = await api.getEnterprise(enterpriseId);
        setEnterprises(ent ? [ent] : []);
      }
    } catch (err) {
      console.error('Error loading enterprises:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered enterprises list
  const filteredEnterprises = enterprises.filter(item => {
    const matchesType = filterType === 'ALL' || item.type === filterType;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.taxCode && item.taxCode.toLowerCase().includes(q)) ||
      (item.phone && item.phone.includes(q)) ||
      (item.email && item.email.toLowerCase().includes(q)) ||
      (item.address && item.address.toLowerCase().includes(q))
    );
    return matchesType && matchesSearch;
  });

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setModalMode('CREATE');
    setEditingId(null);
    setActiveModalTab('info');
    setFormData({
      name: '',
      type: 'NSX',
      taxCode: '',
      phone: '',
      email: '',
      address: '',
      website: '',
      partnerDetails: '',
      domain: '',
      subdomain: '',
      chatbotConfig: { enabled: false, script: '', welcomeMessage: '' }
    });
    setEditorMode('visual');
    setIsModalOpen(true);

    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    }, 100);
  };

  // Open Edit Modal
  const handleOpenEditModal = (ent) => {
    setModalMode('EDIT');
    setEditingId(ent._id);
    setActiveModalTab('info');
    setFormData({
      name: ent.name || '',
      type: ent.type || 'NSX',
      taxCode: ent.taxCode || '',
      phone: ent.phone || '',
      email: ent.email || '',
      address: ent.address || '',
      website: ent.website || '',
      partnerDetails: ent.partnerDetails || '',
      domain: ent.domain || '',
      subdomain: ent.subdomain || '',
      chatbotConfig: ent.chatbotConfig || { enabled: false, script: '', welcomeMessage: '' }
    });
    setEditorMode('visual');
    setIsModalOpen(true);

    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = ent.partnerDetails || '';
      }
    }, 100);
  };

  // Close Modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Rich Text Editor Commands
  const execCmd = (command, value = null) => {
    if (editorMode !== 'visual') return;
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setFormData(prev => ({ ...prev, partnerDetails: editorRef.current.innerHTML }));
    }
  };

  const handleInsertImage = () => {
    const url = prompt('Nhập đường dẫn URL hình ảnh:');
    if (url) {
      execCmd('insertImage', url);
    }
  };

  const handleInsertLink = () => {
    const url = prompt('Nhập đường dẫn liên kết URL:');
    if (url) {
      execCmd('createLink', url);
    }
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      setFormData(prev => ({ ...prev, partnerDetails: editorRef.current.innerHTML }));
    }
  };

  const handleCodeChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, partnerDetails: val }));
    if (editorRef.current) {
      editorRef.current.innerHTML = val;
    }
  };

  // Save Enterprise (Submit Modal)
  const handleSaveEnterprise = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.name.trim()) {
      alert('Vui lòng nhập Tên doanh nghiệp / Công ty!');
      return;
    }

    setSaving(true);
    try {
      if (modalMode === 'CREATE') {
        const created = await api.createEnterprise(formData);
        alert('Tạo doanh nghiệp mới thành công!');
        setIsModalOpen(false);
        loadData();
      } else {
        const updated = await api.updateEnterprise(editingId, formData);
        alert('Cập nhật thông tin doanh nghiệp thành công!');
        setIsModalOpen(false);
        setEnterprises(prev => prev.map(item => item._id === updated._id ? updated : item));
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi lưu doanh nghiệp');
    } finally {
      setSaving(false);
    }
  };

  // Delete Enterprise
  const handleDeleteEnterprise = async (ent) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa doanh nghiệp "${ent.name}" khỏi hệ thống không? Hành động này không thể hoàn tác!`)) {
      return;
    }

    try {
      await api.deleteEnterprise(ent._id);
      alert('Đã xóa doanh nghiệp thành công!');
      setEnterprises(prev => prev.filter(item => item._id !== ent._id));
    } catch (err) {
      alert(err.message || 'Lỗi khi xóa doanh nghiệp');
    }
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner" style={{ width: 40, height: 40 }}></div>
      </div>
    );
  }

  const nsxCount = enterprises.filter(e => e.type === 'NSX').length;
  const nppCount = enterprises.filter(e => e.type === 'NPP').length;

  return (
    <div className="enterprise-page animate-fade-in">
      {/* Top Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Building2 style={{ color: 'var(--color-primary-light)' }} /> Quản lý Doanh nghiệp
          </h1>
          <p>Quản lý danh sách đối tác sở hữu tem, chi tiết đối tác, domain tùy chỉnh và cấu hình Chatbot</p>
        </div>

        <button 
          className="btn btn-primary"
          onClick={handleOpenCreateModal}
          style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, padding: '10px 20px', borderRadius: '10px' }}
        >
          <Plus size={18} /> Thêm Doanh nghiệp Mới
        </button>
      </div>

      {/* Stats Summary Bar */}
      <div className="enterprise-stats">
        <div className="enterprise-stat-card">
          <div className="enterprise-stat-icon"><Building2 size={22} /></div>
          <div className="enterprise-stat-info">
            <span className="enterprise-stat-val">{enterprises.length}</span>
            <span className="enterprise-stat-lbl">Tổng doanh nghiệp</span>
          </div>
        </div>

        <div className="enterprise-stat-card">
          <div className="enterprise-stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
            <Building2 size={22} />
          </div>
          <div className="enterprise-stat-info">
            <span className="enterprise-stat-val">{nsxCount}</span>
            <span className="enterprise-stat-lbl">Nhà sản xuất (NSX)</span>
          </div>
        </div>

        <div className="enterprise-stat-card">
          <div className="enterprise-stat-icon" style={{ background: 'rgba(249, 115, 22, 0.1)', color: '#f97316' }}>
            <Building2 size={22} />
          </div>
          <div className="enterprise-stat-info">
            <span className="enterprise-stat-val">{nppCount}</span>
            <span className="enterprise-stat-lbl">Nhà phân phối (NPP)</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="card" style={{ padding: '16px 20px', background: 'var(--color-bg-secondary)', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 280 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
              <input
                type="text"
                className="input"
                placeholder="Tìm kiếm theo tên công ty, MST, SĐT, Email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 38, height: 42 }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Filter size={16} style={{ opacity: 0.6 }} />
            <select
              className="input"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ height: 42, width: 200, cursor: 'pointer', fontWeight: 500 }}
            >
              <option value="ALL">Tất cả loại (NSX & NPP)</option>
              <option value="NSX">Nhà sản xuất (NSX)</option>
              <option value="NPP">Nhà phân phối (NPP)</option>
            </select>

            <button 
              className="btn btn-outline"
              onClick={loadData}
              title="Tải lại danh sách"
              style={{ height: 42, padding: '0 14px' }}
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Enterprise Management Table */}
      <div className="enterprise-table-container">
        {filteredEnterprises.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', opacity: 0.7 }}>
            <Building2 size={48} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p style={{ fontSize: '1rem', fontWeight: 500 }}>Không tìm thấy doanh nghiệp nào phù hợp</p>
            <button className="btn btn-primary" onClick={handleOpenCreateModal} style={{ marginTop: 12 }}>
              <Plus size={16} /> Thêm Doanh Nghiệp Mới
            </button>
          </div>
        ) : (
          <table className="enterprise-table">
            <thead>
              <tr>
                <th style={{ width: 60, textAlign: 'center' }}>STT</th>
                <th>Tên Doanh Nghiệp</th>
                <th>Loại</th>
                <th>Mã số thuế</th>
                <th>Liên hệ (SĐT / Email)</th>
                <th>Địa chỉ</th>
                <th>Domain / Subdomain</th>
                <th style={{ width: 140, textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnterprises.map((ent, idx) => (
                <tr key={ent._id}>
                  <td style={{ textAlign: 'center', fontWeight: 600, opacity: 0.6 }}>{idx + 1}</td>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>
                      {ent.name}
                    </div>
                    {ent.website && (
                      <a 
                        href={ent.website.startsWith('http') ? ent.website : `https://${ent.website}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{ fontSize: '0.8rem', color: 'var(--color-primary-light)', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2 }}
                      >
                        {ent.website} <ExternalLink size={11} />
                      </a>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${ent.type === 'NSX' ? 'badge-success' : 'badge-warning'}`}>
                      {ent.type === 'NSX' ? 'Nhà sản xuất' : 'Nhà phân phối'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{ent.taxCode || '---'}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: '0.85rem' }}>
                      {ent.phone && <span><Phone size={12} style={{ display: 'inline', marginRight: 4, opacity: 0.6 }} />{ent.phone}</span>}
                      {ent.email && <span><Mail size={12} style={{ display: 'inline', marginRight: 4, opacity: 0.6 }} />{ent.email}</span>}
                      {!ent.phone && !ent.email && <span style={{ opacity: 0.4 }}>---</span>}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      {ent.address || '---'}
                    </span>
                  </td>
                  <td>
                    {ent.domain ? (
                      <span className="badge badge-info" style={{ fontFamily: 'monospace' }}>
                        <Globe size={12} style={{ marginRight: 4 }} /> {ent.domain}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.8rem', opacity: 0.4 }}>Chưa gán</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <button 
                        className="btn btn-outline" 
                        onClick={() => handleOpenEditModal(ent)}
                        title="Chỉnh sửa thông tin doanh nghiệp"
                        style={{ height: 34, padding: '0 10px', color: 'var(--color-primary-light)', borderColor: 'rgba(99, 102, 241, 0.4)' }}
                      >
                        <Edit3 size={15} /> Sửa
                      </button>
                      
                      {isAdmin && (
                        <button 
                          className="btn btn-outline" 
                          onClick={() => handleDeleteEnterprise(ent)}
                          title="Xóa doanh nghiệp"
                          style={{ height: 34, padding: '0 8px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* POPUP MODAL (Thêm Mới & Chỉnh Sửa Doanh Nghiệp) */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target.className === 'modal-backdrop') handleCloseModal(); }}>
          <div className="modal-container">
            {/* Modal Header */}
            <div className="modal-header">
              <div className="modal-title">
                {modalMode === 'CREATE' ? (
                  <>
                    <Plus style={{ color: 'var(--color-primary-light)' }} /> Thêm Doanh Nghiệp Mới
                  </>
                ) : (
                  <>
                    <Edit3 style={{ color: 'var(--color-primary-light)' }} /> Chỉnh Sửa Thông Tin Doanh Nghiệp
                  </>
                )}
              </div>

              <button className="modal-close-btn" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="modal-tabs">
              <button 
                className={`modal-tab-btn ${activeModalTab === 'info' ? 'active' : ''}`}
                onClick={() => setActiveModalTab('info')}
              >
                <Building2 size={16} /> Thông tin Doanh nghiệp
              </button>

              <button 
                className={`modal-tab-btn ${activeModalTab === 'partnerDetails' ? 'active' : ''}`}
                onClick={() => setActiveModalTab('partnerDetails')}
              >
                <FileText size={16} /> Chi tiết đối tác (Soạn thảo & Ảnh)
              </button>

              <button 
                className={`modal-tab-btn ${activeModalTab === 'domainChatbot' ? 'active' : ''}`}
                onClick={() => setActiveModalTab('domainChatbot')}
              >
                <Globe size={16} /> Cấu hình Domain & Chatbot
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveEnterprise} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body">
                {/* TAB 1: THÔNG TIN DOANH NGHIỆP */}
                {activeModalTab === 'info' && (
                  <div className="form-grid-2">
                    <div style={{ gridColumn: 'span 2' }}>
                      <label className="label">Tên Doanh nghiệp / Công ty <span style={{ color: '#ef4444' }}>*</span></label>
                      <input
                        type="text"
                        className="input"
                        placeholder="VD: Công ty Cổ phần VINSUMI (In Thương Gia)"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <label className="label">Loại Doanh nghiệp</label>
                      <select
                        className="input"
                        value={formData.type}
                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                      >
                        <option value="NSX">Nhà sản xuất (NSX)</option>
                        <option value="NPP">Nhà phân phối (NPP)</option>
                      </select>
                    </div>

                    <div>
                      <label className="label">Mã số thuế (MST)</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="VD: 0315599888"
                        value={formData.taxCode}
                        onChange={(e) => setFormData(prev => ({ ...prev, taxCode: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="label">Số điện thoại liên hệ</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="VD: 0901234567"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="label">Email liên hệ</label>
                      <input
                        type="email"
                        className="input"
                        placeholder="VD: contact@vinsumi.vn"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <label className="label">Địa chỉ trụ sở / văn phòng</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="VD: 123 Đường Nguyễn Trãi, Thanh Xuân, Hà Nội"
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <label className="label">Website công ty</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="VD: https://vinsumi.vn"
                        value={formData.website}
                        onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                {/* TAB 2: CHI TIẾT ĐỐI TÁC (RICH TEXT EDITOR & CHÈN ẢNH) */}
                {activeModalTab === 'partnerDetails' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label className="label" style={{ marginBottom: 0 }}>CHI TIẾT ĐỐI TÁC (Soạn thảo văn bản & Chèn ảnh):</label>

                      {/* Mode Toggle */}
                      <div style={{ display: 'flex', gap: 4, background: 'var(--color-bg-primary)', padding: 3, borderRadius: 8, border: '1px solid var(--color-border)' }}>
                        <button
                          type="button"
                          className={`btn btn-sm ${editorMode === 'visual' ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => setEditorMode('visual')}
                          style={{ height: 28, fontSize: '0.8rem', padding: '0 10px' }}
                        >
                          <Eye size={13} /> Soạn thảo trực quan
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${editorMode === 'code' ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => setEditorMode('code')}
                          style={{ height: 28, fontSize: '0.8rem', padding: '0 10px' }}
                        >
                          <Code size={13} /> Mã HTML
                        </button>
                      </div>
                    </div>

                    {/* Toolbar */}
                    {editorMode === 'visual' && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: 8, background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', borderRadius: '8px 8px 0 0' }}>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => execCmd('bold')} title="Bôi đậm (Bold)"><Bold size={14} /></button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => execCmd('italic')} title="In nghiêng (Italic)"><Italic size={14} /></button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => execCmd('underline')} title="Gạch chân (Underline)"><Underline size={14} /></button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => execCmd('strikeThrough')} title="Gạch ngang (Strikethrough)"><Strikethrough size={14} /></button>

                        <div style={{ width: 1, height: 20, background: 'var(--color-border)', margin: '0 4px' }} />

                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => execCmd('justifyLeft')} title="Căn trái"><AlignLeft size={14} /></button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => execCmd('justifyCenter')} title="Căn giữa"><AlignCenter size={14} /></button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => execCmd('justifyRight')} title="Căn phải"><AlignRight size={14} /></button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => execCmd('justifyFull')} title="Căn đều"><AlignJustify size={14} /></button>

                        <div style={{ width: 1, height: 20, background: 'var(--color-border)', margin: '0 4px' }} />

                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => execCmd('insertUnorderedList')} title="Danh sách chấm"><List size={14} /></button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => execCmd('insertOrderedList')} title="Danh sách số"><ListOrdered size={14} /></button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => execCmd('formatBlock', '<h2>')} title="Tiêu đề 2"><Heading2 size={14} /></button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => execCmd('formatBlock', '<h3>')} title="Tiêu đề 3"><Heading3 size={14} /></button>

                        <div style={{ width: 1, height: 20, background: 'var(--color-border)', margin: '0 4px' }} />

                        <button type="button" className="btn btn-outline btn-sm" onClick={handleInsertImage} style={{ fontSize: '0.8rem', gap: 4 }}>
                          <ImageIcon size={14} /> Chèn ảnh
                        </button>
                        <button type="button" className="btn btn-outline btn-sm" onClick={handleInsertLink} style={{ fontSize: '0.8rem', gap: 4 }}>
                          <LinkIcon size={14} /> Chèn Link
                        </button>
                      </div>
                    )}

                    {/* Editor Content Area */}
                    {editorMode === 'visual' ? (
                      <div
                        ref={editorRef}
                        contentEditable
                        onInput={handleEditorInput}
                        style={{
                          minHeight: 220,
                          maxHeight: 350,
                          overflowY: 'auto',
                          padding: 14,
                          background: 'var(--color-bg-primary)',
                          border: '1px solid var(--color-border)',
                          borderRadius: editorMode === 'visual' ? '0 0 8px 8px' : '8px',
                          color: 'var(--color-text-primary)',
                          outline: 'none'
                        }}
                      />
                    ) : (
                      <textarea
                        className="input"
                        style={{ minHeight: 220, fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.5 }}
                        value={formData.partnerDetails}
                        onChange={handleCodeChange}
                        placeholder="<p>Nhập mã HTML chi tiết đối tác...</p>"
                      />
                    )}
                  </div>
                )}

                {/* TAB 3: CẤU HÌNH DOMAIN & CHATBOT */}
                {activeModalTab === 'domainChatbot' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Domain Box */}
                    <div style={{ background: 'var(--color-bg-primary)', padding: 18, borderRadius: 12, border: '1px solid var(--color-border)' }}>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--color-primary-light)' }}>
                        <Globe size={18} /> Cấu hình Tên miền tùy chỉnh (Custom Domain)
                      </h4>

                      <div className="form-grid-2">
                        <div>
                          <label className="label">Tên miền thương hiệu (Custom Domain)</label>
                          <input
                            type="text"
                            className="input"
                            placeholder="VD: tem.dongy.vn"
                            value={formData.domain}
                            onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                          />
                        </div>

                        <div>
                          <label className="label">Subdomain hệ thống</label>
                          <input
                            type="text"
                            className="input"
                            placeholder="VD: vinsumi"
                            value={formData.subdomain}
                            onChange={(e) => setFormData(prev => ({ ...prev, subdomain: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Chatbot Box */}
                    <div style={{ background: 'var(--color-bg-primary)', padding: 18, borderRadius: 12, border: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-primary-light)' }}>
                          <MessageSquare size={18} /> Cài đặt Chatbot Tư vấn Trực tuyến
                        </h4>

                        <label className="toggle-label">
                          <input
                            type="checkbox"
                            checked={formData.chatbotConfig?.enabled || false}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              chatbotConfig: { ...prev.chatbotConfig, enabled: e.target.checked }
                            }))}
                          />
                          <span className="toggle-switch"></span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Kích hoạt Chatbot</span>
                        </label>
                      </div>

                      {formData.chatbotConfig?.enabled && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                          <div>
                            <label className="label">Lời chào tự động của Chatbot</label>
                            <input
                              type="text"
                              className="input"
                              placeholder="VD: Xin chào! Tôi là trợ lý AI của VINSUMI. Bạn cần hỗ trợ gì?"
                              value={formData.chatbotConfig?.welcomeMessage || ''}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                chatbotConfig: { ...prev.chatbotConfig, welcomeMessage: e.target.value }
                              }))}
                            />
                          </div>

                          <div>
                            <label className="label">Mã nhúng Script Chatbot (Tawkt.to / Tidio / Zalo / Fanpage)</label>
                            <textarea
                              className="input"
                              rows={3}
                              placeholder="<script src='https://embed.tawk.to/...'></script>"
                              value={formData.chatbotConfig?.script || ''}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                chatbotConfig: { ...prev.chatbotConfig, script: e.target.value }
                              }))}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Buttons */}
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>
                  Hủy
                </button>

                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, padding: '10px 24px' }}
                >
                  <Save size={16} /> {saving ? 'Đang lưu...' : (modalMode === 'CREATE' ? 'Tạo Doanh Nghiệp Mới' : 'Lưu Thay Đổi Doanh Nghiệp')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
