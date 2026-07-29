import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
  Building2, Globe, MessageSquare, Save, ExternalLink, Plus, Trash2, X, ChevronDown, CheckCircle,
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Image as ImageIcon, Link as LinkIcon, Heading2, Heading3, Code, Eye
} from 'lucide-react';
import './Enterprise.css';

export default function Enterprise() {
  const { user, isAdmin, enterpriseId } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab based on route path
  let activeTab = 'info';
  if (location.pathname.endsWith('/domain')) {
    activeTab = 'domain';
  } else if (location.pathname.endsWith('/chatbot')) {
    activeTab = 'chatbot';
  }

  const [enterprises, setEnterprises] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [enterprise, setEnterprise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Forms
  const [form, setForm] = useState({});
  const [domainForm, setDomainForm] = useState({ domain: '', subdomain: '' });
  const [chatbotForm, setChatbotForm] = useState({ enabled: false, script: '', welcomeMessage: '' });

  // Rich Text Editor State for "CHI TIẾT ĐỐI TÁC"
  const [editorMode, setEditorMode] = useState('visual'); // 'visual' | 'code'
  const editorRef = useRef(null);

  // Modal Create Enterprise
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newForm, setNewForm] = useState({
    name: '',
    type: 'NSX',
    taxCode: '',
    phone: '',
    email: '',
    address: '',
    website: '',
    partnerDetails: ''
  });

  useEffect(() => {
    initLoad();
  }, [isAdmin, enterpriseId]);

  const initLoad = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const list = await api.getEnterprises();
        setEnterprises(list || []);
        if (list && list.length > 0) {
          const target = selectedId ? (list.find(e => e._id === selectedId) || list[0]) : list[0];
          setSelectedId(target._id);
          applyEnterprise(target);
        } else {
          setEnterprise(null);
        }
      } else if (enterpriseId) {
        const data = await api.getEnterprise(enterpriseId);
        setEnterprise(data);
        applyEnterprise(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyEnterprise = (data) => {
    if (!data) return;
    setEnterprise(data);
    setForm({
      name: data.name || '',
      address: data.address || '',
      phone: data.phone || '',
      email: data.email || '',
      website: data.website || '',
      taxCode: data.taxCode || '',
      partnerDetails: data.partnerDetails || ''
    });
    setDomainForm({ domain: data.domain || '', subdomain: data.subdomain || '' });
    setChatbotForm(data.chatbotConfig || { enabled: false, script: '', welcomeMessage: '', qaList: [] });

    if (editorRef.current) {
      editorRef.current.innerHTML = data.partnerDetails || '';
    }
  };

  useEffect(() => {
    if (editorRef.current && activeTab === 'info' && editorMode === 'visual') {
      editorRef.current.innerHTML = form.partnerDetails || '';
    }
  }, [editorMode, activeTab, selectedId]);

  const handleSelectEnterprise = (id) => {
    setSelectedId(id);
    const target = enterprises.find(e => e._id === id);
    if (target) {
      applyEnterprise(target);
    }
  };

  const handleCreateEnterprise = async (e) => {
    e.preventDefault();
    if (!newForm.name.trim()) {
      alert('Vui lòng nhập tên doanh nghiệp');
      return;
    }

    setCreating(true);
    try {
      const created = await api.createEnterprise(newForm);
      alert('Tạo doanh nghiệp mới thành công!');
      setShowCreateModal(false);
      setNewForm({ name: '', type: 'NSX', taxCode: '', phone: '', email: '', address: '', website: '', partnerDetails: '' });
      
      // Reload list and select new enterprise
      const updatedList = await api.getEnterprises();
      setEnterprises(updatedList || []);
      setSelectedId(created._id);
      applyEnterprise(created);
    } catch (err) {
      alert(err.message || 'Không thể tạo doanh nghiệp');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteEnterprise = async () => {
    if (!enterprise) return;
    if (!confirm(`Bạn có chắc chắn muốn xóa Doanh nghiệp "${enterprise.name}"? Thao tác này không thể hoàn tác.`)) return;

    try {
      await api.deleteEnterprise(enterprise._id);
      alert('Đã xóa doanh nghiệp!');
      const updatedList = await api.getEnterprises();
      setEnterprises(updatedList || []);
      if (updatedList && updatedList.length > 0) {
        setSelectedId(updatedList[0]._id);
        applyEnterprise(updatedList[0]);
      } else {
        setEnterprise(null);
        setSelectedId('');
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi xóa doanh nghiệp');
    }
  };

  // Rich Text Editor Commands
  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setForm(prev => ({ ...prev, partnerDetails: editorRef.current.innerHTML }));
    }
  };

  const handleInsertImage = () => {
    const url = prompt('Nhập đường dẫn URL hình ảnh (ví dụ: https://domain.com/image.jpg):');
    if (url && url.trim()) {
      formatText('insertHTML', `<img src="${url.trim()}" alt="Ảnh đối tác" style="max-width:100%; height:auto; border-radius:8px; margin:10px 0; display:block;" />`);
    }
  };

  const handleInsertLink = () => {
    const url = prompt('Nhập đường dẫn URL liên kết:');
    if (url && url.trim()) {
      formatText('createLink', url.trim());
    }
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      setForm(prev => ({ ...prev, partnerDetails: editorRef.current.innerHTML }));
    }
  };

  const addQA = () => {
    const list = chatbotForm.qaList || [];
    setChatbotForm({
      ...chatbotForm,
      qaList: [...list, { question: '', answer: '' }]
    });
  };

  const updateQA = (idx, field, val) => {
    const list = [...(chatbotForm.qaList || [])];
    list[idx] = { ...list[idx], [field]: val };
    setChatbotForm({
      ...chatbotForm,
      qaList: list
    });
  };

  const removeQA = (idx) => {
    const list = (chatbotForm.qaList || []).filter((_, i) => i !== idx);
    setChatbotForm({
      ...chatbotForm,
      qaList: list
    });
  };

  const handleSaveInfo = async () => {
    if (!enterprise?._id) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        partnerDetails: editorMode === 'visual' && editorRef.current ? editorRef.current.innerHTML : form.partnerDetails
      };
      const updated = await api.updateEnterprise(enterprise._id, payload);
      setEnterprise(updated);
      if (isAdmin) {
        setEnterprises(prev => prev.map(item => item._id === updated._id ? updated : item));
      }
      alert('Cập nhật thông tin & Chi tiết đối tác thành công!');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDomain = async () => {
    if (!enterprise?._id) return;
    setSaving(true);
    try {
      const updated = await api.updateDomain(enterprise._id, domainForm);
      setEnterprise(updated);
      if (isAdmin) {
        setEnterprises(prev => prev.map(item => item._id === updated._id ? updated : item));
      }
      alert('Cập nhật domain thành công!');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveChatbot = async () => {
    if (!enterprise?._id) return;
    setSaving(true);
    try {
      const updated = await api.updateChatbot(enterprise._id, { chatbotConfig: chatbotForm });
      setEnterprise(updated);
      if (isAdmin) {
        setEnterprises(prev => prev.map(item => item._id === updated._id ? updated : item));
      }
      alert('Cập nhật chatbot thành công!');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner" style={{ width: 40, height: 40 }}></div>
      </div>
    );
  }

  const tabs = [
    { id: 'info', label: 'Thông tin công ty', icon: Building2 },
    { id: 'domain', label: 'Cấu hình Domain', icon: Globe },
    { id: 'chatbot', label: 'Cài đặt Chatbot', icon: MessageSquare },
  ];

  return (
    <div className="enterprise-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>Cấu hình Doanh nghiệp</h1>
          <p>Quản lý thông tin công ty đối tác sở hữu tem, nội dung chi tiết đối tác, domain và chatbot</p>
        </div>

        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}
        >
          <Plus size={18} /> Thêm Doanh nghiệp Mới
        </button>
      </div>

      {/* Admin / Multi-Enterprise Selector Bar */}
      {enterprises.length > 0 && (
        <div className="card" style={{ padding: '14px 20px', background: 'var(--color-bg-secondary)', borderRadius: '12px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 280 }}>
              <Building2 size={20} style={{ color: 'var(--color-primary-light)' }} />
              <span style={{ fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap' }}>Doanh nghiệp sở hữu:</span>
              <select
                className="input"
                style={{ flex: 1, height: '40px', fontWeight: 600, cursor: 'pointer' }}
                value={selectedId}
                onChange={(e) => handleSelectEnterprise(e.target.value)}
              >
                {enterprises.map(ent => (
                  <option key={ent._id} value={ent._id}>
                    {ent.name} ({ent.type === 'NSX' ? 'Nhà sản xuất' : 'Nhà phân phối'}) {ent.taxCode ? `- MST: ${ent.taxCode}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {enterprise && isAdmin && (
              <button
                className="btn btn-outline"
                style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)', height: '40px' }}
                onClick={handleDeleteEnterprise}
                title="Xóa Doanh nghiệp này"
              >
                <Trash2 size={16} /> Xóa Doanh nghiệp
              </button>
            )}
          </div>
        </div>
      )}

      {!enterprise ? (
        <div className="card empty-state" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Building2 size={60} style={{ opacity: 0.4, marginBottom: 16 }} />
          <h3>Chưa có thông tin doanh nghiệp</h3>
          <p style={{ opacity: 0.7, marginBottom: 20 }}>
            Chưa có thông tin Doanh nghiệp nào được gán. Vui lòng bấm nút bên dưới để tạo doanh nghiệp mới.
          </p>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)} style={{ margin: '0 auto' }}>
            <Plus size={18} /> Tạo Doanh nghiệp Mới
          </button>
        </div>
      ) : (
        <>
          <div className="tabs">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button 
                  key={tab.id} 
                  className={`tab ${activeTab === tab.id ? 'active' : ''}`} 
                  onClick={() => {
                    if (tab.id === 'info') navigate('/enterprise');
                    else if (tab.id === 'domain') navigate('/enterprise/domain');
                    else if (tab.id === 'chatbot') navigate('/enterprise/chatbot');
                  }}
                >
                  <Icon size={16} /> {tab.label}
                </button>
              );
            })}
          </div>

          <div className="card animate-fade-in-up">
            {activeTab === 'info' && (
              <>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="card-title">Thông tin Doanh nghiệp</h3>
                  <span className={`badge badge-dot ${enterprise.type === 'NSX' ? 'badge-success' : 'badge-warning'}`}>
                    {enterprise.type === 'NSX' ? 'Nhà sản xuất' : 'Nhà phân phối'}
                  </span>
                </div>
                <div className="form-grid">
                  <div className="input-group">
                    <label>Tên công ty / Doanh nghiệp <span style={{ color: '#ef4444' }}>*</span></label>
                    <input className="input" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nhập tên doanh nghiệp..." />
                  </div>
                  <div className="input-group">
                    <label>Mã số thuế</label>
                    <input className="input" value={form.taxCode || ''} onChange={e => setForm({...form, taxCode: e.target.value})} placeholder="VD: 0101234567" />
                  </div>
                  <div className="input-group" style={{gridColumn:'span 2'}}>
                    <label>Địa chỉ công ty</label>
                    <input className="input" value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} placeholder="Nhập địa chỉ trụ sở/văn phòng..." />
                  </div>
                  <div className="input-group">
                    <label>Số điện thoại liên hệ</label>
                    <input className="input" value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} placeholder="VD: 0912345678" />
                  </div>
                  <div className="input-group">
                    <label>Email liên hệ</label>
                    <input className="input" type="email" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} placeholder="contact@congty.com" />
                  </div>
                  <div className="input-group" style={{gridColumn:'span 2'}}>
                    <label>Website công ty</label>
                    <input className="input" value={form.website || ''} onChange={e => setForm({...form, website: e.target.value})} placeholder="https://congty.com" />
                  </div>
                </div>

                {/* CHI TIẾT ĐỐI TÁC SECTION (RICH TEXT & IMAGE EDITOR) */}
                <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '2px dashed var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: 10 }}>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', textDecoration: 'underline', color: 'var(--color-text-primary)' }}>
                      CHI TIẾT ĐỐI TÁC:
                    </h3>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button 
                        type="button" 
                        className={`btn btn-sm ${editorMode === 'visual' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setEditorMode('visual')}
                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <Eye size={14} /> Soạn thảo trực quan
                      </button>
                      <button 
                        type="button" 
                        className={`btn btn-sm ${editorMode === 'code' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setEditorMode('code')}
                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <Code size={14} /> Mã HTML
                      </button>
                    </div>
                  </div>

                  {/* Toolbar */}
                  {editorMode === 'visual' && (
                    <div className="editor-toolbar" style={{
                      display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '8px 12px',
                      background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
                      borderBottom: 'none', borderRadius: '8px 8px 0 0', alignItems: 'center'
                    }}>
                      <button type="button" className="btn-icon btn-sm" title="Bôi đậm (Bold)" onClick={() => formatText('bold')}><Bold size={15}/></button>
                      <button type="button" className="btn-icon btn-sm" title="In nghiêng (Italic)" onClick={() => formatText('italic')}><Italic size={15}/></button>
                      <button type="button" className="btn-icon btn-sm" title="Gạch chân (Underline)" onClick={() => formatText('underline')}><Underline size={15}/></button>
                      <button type="button" className="btn-icon btn-sm" title="Gạch ngang (Strikethrough)" onClick={() => formatText('strikethrough')}><Strikethrough size={15}/></button>
                      <span style={{ height: '18px', borderLeft: '1px solid var(--color-border)', margin: '0 4px' }}></span>

                      <button type="button" className="btn-icon btn-sm" title="Căn trái" onClick={() => formatText('justifyLeft')}><AlignLeft size={15}/></button>
                      <button type="button" className="btn-icon btn-sm" title="Căn giữa" onClick={() => formatText('justifyCenter')}><AlignCenter size={15}/></button>
                      <button type="button" className="btn-icon btn-sm" title="Căn phải" onClick={() => formatText('justifyRight')}><AlignRight size={15}/></button>
                      <button type="button" className="btn-icon btn-sm" title="Căn đều 2 bên" onClick={() => formatText('justifyFull')}><AlignJustify size={15}/></button>
                      <span style={{ height: '18px', borderLeft: '1px solid var(--color-border)', margin: '0 4px' }}></span>

                      <button type="button" className="btn-icon btn-sm" title="Danh sách chấm (Bullets)" onClick={() => formatText('insertUnorderedList')}><List size={15}/></button>
                      <button type="button" className="btn-icon btn-sm" title="Danh sách số (Numbered)" onClick={() => formatText('insertOrderedList')}><ListOrdered size={15}/></button>
                      <span style={{ height: '18px', borderLeft: '1px solid var(--color-border)', margin: '0 4px' }}></span>

                      <button type="button" className="btn-icon btn-sm" title="Tiêu đề H2" onClick={() => formatText('formatBlock', '<h2>')}><Heading2 size={15}/></button>
                      <button type="button" className="btn-icon btn-sm" title="Tiêu đề H3" onClick={() => formatText('formatBlock', '<h3>')}><Heading3 size={15}/></button>
                      <span style={{ height: '18px', borderLeft: '1px solid var(--color-border)', margin: '0 4px' }}></span>

                      <button type="button" className="btn btn-sm btn-ghost" title="Chèn ảnh vào bài viết" onClick={handleInsertImage} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary-light)', fontWeight: 600 }}>
                        <ImageIcon size={15}/> <span>Chèn ảnh</span>
                      </button>
                      <button type="button" className="btn btn-sm btn-ghost" title="Chèn đường dẫn URL" onClick={handleInsertLink} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <LinkIcon size={15}/> <span>Chèn Link</span>
                      </button>
                    </div>
                  )}

                  {/* Editor Input Area */}
                  {editorMode === 'visual' ? (
                    <div
                      ref={editorRef}
                      contentEditable
                      className="rich-editor-box"
                      onInput={handleEditorInput}
                      style={{
                        minHeight: '220px',
                        padding: '16px',
                        background: '#ffffff',
                        color: '#0f172a',
                        border: '1px solid var(--color-border)',
                        borderRadius: '0 0 8px 8px',
                        outline: 'none',
                        lineHeight: '1.6',
                        fontSize: '15px'
                      }}
                    />
                  ) : (
                    <textarea
                      className="input textarea"
                      rows={10}
                      value={form.partnerDetails || ''}
                      onChange={e => setForm({ ...form, partnerDetails: e.target.value })}
                      placeholder="Nhập hoặc dán mã HTML chi tiết đối tác..."
                      style={{ fontFamily: 'monospace', fontSize: '13px', borderRadius: '8px' }}
                    />
                  )}
                </div>

                <div className="form-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" onClick={handleSaveInfo} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', fontWeight: 700 }}>
                    <Save size={18} /> {saving ? 'Đang lưu...' : 'SAVE (Lưu thông tin & Chi tiết đối tác)'}
                  </button>
                </div>
              </>
            )}

            {activeTab === 'domain' && (
              <>
                <div className="card-header">
                  <h3 className="card-title">Cấu hình Domain ({enterprise.name})</h3>
                </div>
                <div className="domain-info-box">
                  <Globe size={20} />
                  <p>Cấu hình domain/subdomain riêng cho trang hiển thị tem của doanh nghiệp <strong>{enterprise.name}</strong>.</p>
                </div>

                {/* Hướng dẫn DNS */}
                <div className="domain-dns-guide" style={{
                  margin: '0 0 20px 0',
                  padding: '16px',
                  background: 'rgba(99, 102, 241, 0.06)',
                  borderRadius: '12px',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  fontSize: '0.85rem',
                  lineHeight: '1.7'
                }}>
                  <div style={{ fontWeight: 700, marginBottom: '10px', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Globe size={15} /> Hướng dẫn trỏ DNS (CNAME)
                  </div>
                  <p style={{ margin: '0 0 10px 0', opacity: 0.85 }}>
                    Sau khi điền domain bên dưới, bạn cần vào trang quản lý DNS của nhà cung cấp tên miền và thêm bản ghi <strong>CNAME</strong>:
                  </p>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '6px 10px', background: 'rgba(99,102,241,0.1)', borderRadius: '6px 0 0 0' }}>Loại</th>
                        <th style={{ textAlign: 'left', padding: '6px 10px', background: 'rgba(99,102,241,0.1)' }}>Tên (Name)</th>
                        <th style={{ textAlign: 'left', padding: '6px 10px', background: 'rgba(99,102,241,0.1)', borderRadius: '0 6px 0 0' }}>Trỏ về (Value)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>CNAME</td>
                        <td style={{ padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px' }}>
                            {domainForm.subdomain ? domainForm.subdomain : 'tem'}
                          </code>
                        </td>
                        <td style={{ padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <code style={{ background: 'rgba(99,241,99,0.1)', color: '#4ade80', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            tem-user-page.vercel.app
                          </code>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <p style={{ margin: '10px 0 0 0', opacity: 0.7, fontSize: '0.78rem' }}>
                    ⓘ Sau khi lưu DNS, có thể mất 5–30 phút để domain hoạt động. Không cần cấu hình thêm sau đó.
                  </p>
                </div>

                <div className="form-grid">
                  <div className="input-group">
                    <label>Domain chính (VD: tem.congtya.com)</label>
                    <input className="input" value={domainForm.domain} onChange={e => setDomainForm({...domainForm, domain: e.target.value})} placeholder="vd: tem.congty.vn" />
                  </div>
                  <div className="input-group">
                    <label>Subdomain (phần trước dấu chấm)</label>
                    <input className="input" value={domainForm.subdomain} onChange={e => setDomainForm({...domainForm, subdomain: e.target.value})} placeholder="vd: tem" />
                  </div>
                </div>
                {domainForm.domain && (
                  <div className="domain-preview">
                    <ExternalLink size={14}/> <span>URL hiển thị: <strong>https://{domainForm.domain}</strong></span>
                  </div>
                )}
                <div className="form-actions">
                  <button className="btn btn-primary" onClick={handleSaveDomain} disabled={saving}>
                    <Save size={16} /> Lưu cấu hình Domain
                  </button>
                </div>
              </>
            )}

            {activeTab === 'chatbot' && (
              <>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="card-title">Cài đặt Chatbot ({enterprise.name})</h3>
                </div>
                <div className="form-grid">
                  <div className="input-group" style={{gridColumn:'span 2'}}>
                    <label className="toggle-label">
                      <input type="checkbox" checked={chatbotForm.enabled} onChange={e => setChatbotForm({...chatbotForm, enabled: e.target.checked})} />
                      <span className="toggle-switch"></span>
                      <span>Bật Chatbot trên trang hiển thị tem</span>
                    </label>
                  </div>
                  <div className="input-group" style={{gridColumn:'span 2'}}>
                    <label>Lời chào mừng</label>
                    <input className="input" value={chatbotForm.welcomeMessage || ''} onChange={e => setChatbotForm({...chatbotForm, welcomeMessage: e.target.value})} />
                  </div>
                  <div className="input-group" style={{gridColumn:'span 2'}}>
                    <label>Script Chatbot (embed code - nếu có)</label>
                    <textarea className="input textarea" value={chatbotForm.script || ''} onChange={e => setChatbotForm({...chatbotForm, script: e.target.value})} placeholder="Dán embed code chatbot tại đây..." rows={3} />
                  </div>
                </div>

                <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--primary-color)' }}>Bộ câu hỏi - trả lời (Q&A FAQ)</h4>
                    <button type="button" className="btn btn-sm btn-ghost" onClick={addQA} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Plus size={14} /> Thêm câu hỏi
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(!chatbotForm.qaList || chatbotForm.qaList.length === 0) ? (
                      <p style={{ fontSize: '0.9rem', opacity: 0.5, fontStyle: 'italic', margin: '8px 0' }}>Chưa cấu hình bộ câu hỏi nào. Chatbot sẽ sử dụng các câu trả lời mặc định.</p>
                    ) : (
                      chatbotForm.qaList.map((qa, idx) => (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'flex-start', padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <div className="input-group" style={{ margin: 0 }}>
                            <input className="input" placeholder="Câu hỏi (Ví dụ: Hạn sử dụng bao lâu?)" value={qa.question || ''} onChange={e => updateQA(idx, 'question', e.target.value)} />
                          </div>
                          <div className="input-group" style={{ margin: 0 }}>
                            <textarea className="input textarea" placeholder="Câu trả lời tương ứng..." value={qa.answer || ''} onChange={e => updateQA(idx, 'answer', e.target.value)} rows={1} style={{ minHeight: '38px', resize: 'vertical' }} />
                          </div>
                          <button type="button" className="btn-icon" onClick={() => removeQA(idx)} style={{ color: '#ef4444', height: '38px' }}><Trash2 size={16}/></button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="form-actions" style={{ marginTop: '24px' }}>
                  <button className="btn btn-primary" onClick={handleSaveChatbot} disabled={saving}>
                    <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu cấu hình Chatbot'}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Modal Thêm Doanh Nghiệp Mới */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content animate-scale-up" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={20} /> Thêm Doanh Nghiệp Mới (Đối Tác)
              </h3>
              <button className="btn-icon" onClick={() => setShowCreateModal(false)}><X size={18} /></button>
            </div>
            
            <form onSubmit={handleCreateEnterprise}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="input-group">
                  <label>Tên Doanh Nghiệp / Công ty <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    className="input"
                    required
                    placeholder="VD: Công ty Cổ phần VINSUMI (In Thương Gia)"
                    value={newForm.name}
                    onChange={e => setNewForm({ ...newForm, name: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label>Loại Doanh Nghiệp</label>
                  <select
                    className="input"
                    value={newForm.type}
                    onChange={e => setNewForm({ ...newForm, type: e.target.value })}
                  >
                    <option value="NSX">Nhà sản xuất (NSX)</option>
                    <option value="NPP">Nhà phân phối (NPP)</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="input-group">
                    <label>Mã số thuế</label>
                    <input
                      className="input"
                      placeholder="VD: 0315599888"
                      value={newForm.taxCode}
                      onChange={e => setNewForm({ ...newForm, taxCode: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label>Số điện thoại</label>
                    <input
                      className="input"
                      placeholder="VD: 0901234567"
                      value={newForm.phone}
                      onChange={e => setNewForm({ ...newForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Email liên hệ</label>
                  <input
                    className="input"
                    type="email"
                    placeholder="VD: contact@vinsumi.vn"
                    value={newForm.email}
                    onChange={e => setNewForm({ ...newForm, email: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label>Địa chỉ trụ sở</label>
                  <input
                    className="input"
                    placeholder="VD: TP. Hồ Chí Minh"
                    value={newForm.address}
                    onChange={e => setNewForm({ ...newForm, address: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label>Website</label>
                  <input
                    className="input"
                    placeholder="VD: https://icongty.com"
                    value={newForm.website}
                    onChange={e => setNewForm({ ...newForm, website: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={creating} style={{ fontWeight: 600 }}>
                  {creating ? 'Đang tạo...' : 'Tạo Doanh Nghiệp Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
