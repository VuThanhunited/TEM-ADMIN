import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
  Building2, Globe, MessageSquare, Save, Plus, Trash2, Edit3, Search, Filter, X, Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Image as ImageIcon, Link2 as LinkIcon, Heading2, Heading3, Code, Eye, RefreshCw, Phone, Mail, MapPin, FileText, CheckCircle, ExternalLink, Upload
} from 'lucide-react';
import './Enterprise.css';

// Helper upload ảnh cho Doanh nghiệp
function EnterpriseImageField({ label, value, onChange, placeholder, helpText, isBanner = false }) {
  const [mode, setMode] = useState('upload'); // 'upload' | 'url'
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const hasValue = Boolean(value && typeof value === 'string' && value.trim());

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    setUploading(true);

    try {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Dung lượng ảnh tối đa 5MB');
      }

      // Thử upload qua API backend trước
      let uploadedUrl = null;
      try {
        const res = await api.uploadImage(file);
        if (res && res.url) {
          uploadedUrl = res.url;
        }
      } catch (err) {
        console.warn('Upload API không khả dụng, sử dụng bộ đọc ảnh trực tiếp:', err);
      }

      if (uploadedUrl) {
        onChange(uploadedUrl);
      } else {
        const reader = new FileReader();
        reader.onload = (ev) => {
          onChange(ev.target.result);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi tải ảnh');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label className="label" style={{ marginBottom: 0, fontWeight: 600 }}>{label}</label>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            onClick={() => setMode('upload')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.76rem',
              color: mode === 'upload' ? 'var(--color-primary-light, #818cf8)' : 'var(--color-text-muted)',
              fontWeight: mode === 'upload' ? 700 : 400, textDecoration: mode === 'upload' ? 'underline' : 'none'
            }}
          >
            Tải từ máy
          </button>
          <span style={{ fontSize: '0.75rem', opacity: 0.4 }}>|</span>
          <button
            type="button"
            onClick={() => setMode('url')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.76rem',
              color: mode === 'url' ? 'var(--color-primary-light, #818cf8)' : 'var(--color-text-muted)',
              fontWeight: mode === 'url' ? 700 : 400, textDecoration: mode === 'url' ? 'underline' : 'none'
            }}
          >
            Nhập URL
          </button>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {mode === 'url' ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            className="input"
            style={{ flex: 1 }}
            placeholder={placeholder || 'https://...'}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
          {hasValue && (
            <img
              src={value}
              alt={label}
              style={{
                width: isBanner ? 80 : 44,
                height: 44,
                objectFit: isBanner ? 'cover' : 'contain',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.2)',
                background: '#fff'
              }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
          {hasValue && (
            <button
              type="button"
              onClick={() => onChange('')}
              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
              title="Xóa ảnh"
            >
              <X size={16} />
            </button>
          )}
        </div>
      ) : (
        <div>
          {hasValue ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 12px',
              borderRadius: 8,
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.25)'
            }}>
              <img
                src={value}
                alt={label}
                style={{
                  width: isBanner ? 100 : 48,
                  height: isBanner ? 46 : 48,
                  objectFit: isBanner ? 'cover' : 'contain',
                  borderRadius: 6,
                  background: '#ffffff',
                  border: '1px solid rgba(0,0,0,0.1)'
                }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle size={13} color="#22c55e" /> Ảnh đã lưu
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {value.startsWith('data:') ? 'Ảnh đã mã hóa từ thiết bị' : value}
                </div>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="btn btn-outline btn-sm"
                style={{ height: 28, fontSize: '0.75rem', padding: '0 8px', gap: 4 }}
              >
                <Upload size={12} /> {uploading ? 'Đang tải...' : 'Đổi ảnh'}
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
                title="Xóa ảnh"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                width: '100%',
                padding: isBanner ? '14px 12px' : '10px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                border: '1px dashed rgba(99,102,241,0.4)',
                background: 'rgba(99,102,241,0.04)',
                color: 'var(--color-primary-light, #818cf8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: '0.84rem',
                fontWeight: 500
              }}
            >
              <Upload size={15} />
              {uploading ? 'Đang xử lý ảnh...' : (isBanner ? 'Tải ảnh Banner đầu trang (Khuyên dùng tỉ lệ 16:9 hoặc 3:1)' : 'Tải Logo Doanh Nghiệp (PNG trong suốt hoặc JPG)')}
            </button>
          )}
        </div>
      )}

      {helpText && <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', lineHeight: 1.3 }}>{helpText}</span>}
      {errorMsg && <span style={{ fontSize: '0.76rem', color: '#ef4444' }}>{errorMsg}</span>}
    </div>
  );
}

export default function Enterprise() {
  const { user, isAdmin, enterpriseId } = useAuth();
  const location = useLocation();

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

  // Quick On/Off Toggle State & Notification Toast
  const [toastMessage, setToastMessage] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // Modal Form Data
  const defaultFormData = {
    name: '',
    type: 'NSX',
    taxCode: '',
    phone: '',
    email: '',
    address: '',
    website: '',
    logo: '',
    bannerImage: '',
    partnerDetails: '',
    domain: '',
    subdomain: '',
    brandConfig: { primaryColor: '#6366f1', secondaryColor: '#4f46e5' },
    chatbotConfig: { enabled: false, script: '', welcomeMessage: '', qaList: [] },
    displayConfig: { showRelatedProducts: true, defaultTheme: 'default', distributionBannerText: '', bannerImage: '' }
  };

  const [formData, setFormData] = useState({ ...defaultFormData });

  // Rich Text Editor State inside Modal
  const [editorMode, setEditorMode] = useState('visual'); // 'visual' | 'code'
  const editorRef = useRef(null);

  // Image & Link Dialog Sub-Modals
  const [showImgModal, setShowImgModal] = useState(false);
  const [imgUrlInput, setImgUrlInput] = useState('');

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrlInput, setLinkUrlInput] = useState('');
  const [linkTextInput, setLinkTextInput] = useState('');
  const [linkNewTab, setLinkNewTab] = useState(true);

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
    setFormData({ ...defaultFormData });
    setEditorMode('visual');
    setIsModalOpen(true);

    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    }, 100);
  };

  // Open Edit Modal
  const handleOpenEditModal = (ent, initialTab = 'info') => {
    setModalMode('EDIT');
    setEditingId(ent._id);
    setActiveModalTab(initialTab);
    setFormData({
      name: ent.name || '',
      type: ent.type || 'NSX',
      taxCode: ent.taxCode || '',
      phone: ent.phone || '',
      email: ent.email || '',
      address: ent.address || '',
      website: ent.website || '',
      logo: ent.logo || '',
      bannerImage: ent.bannerImage || ent.displayConfig?.bannerImage || '',
      partnerDetails: ent.partnerDetails || '',
      domain: ent.domain || '',
      subdomain: ent.subdomain || '',
      brandConfig: {
        primaryColor: ent.brandConfig?.primaryColor || '#6366f1',
        secondaryColor: ent.brandConfig?.secondaryColor || '#4f46e5'
      },
      chatbotConfig: {
        enabled: ent.chatbotConfig?.enabled || false,
        script: ent.chatbotConfig?.script || '',
        welcomeMessage: ent.chatbotConfig?.welcomeMessage || '',
        qaList: Array.isArray(ent.chatbotConfig?.qaList) ? ent.chatbotConfig.qaList : []
      },
      displayConfig: {
        showRelatedProducts: ent.displayConfig?.showRelatedProducts !== false,
        defaultTheme: ent.displayConfig?.defaultTheme || 'default',
        distributionBannerText: ent.displayConfig?.distributionBannerText || '',
        bannerImage: ent.displayConfig?.bannerImage || ent.bannerImage || ''
      }
    });
    setEditorMode('visual');
    setIsModalOpen(true);

    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = ent.partnerDetails || '';
      }
    }, 100);
  };

  useEffect(() => {
    if (!loading && enterprises.length > 0) {
      if (location.pathname.endsWith('/chatbot') || location.pathname.endsWith('/domain')) {
        handleOpenEditModal(enterprises[0], 'domainChatbot');
      }
    }
  }, [location.pathname, loading, enterprises.length]);

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

  // Selection Range saving for Rich Text Editor
  const savedRangeRef = useRef(null);

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

  // Open Sub-Modals for Image & Link
  const handleOpenImgModal = () => {
    saveSelection();
    setImgUrlInput('');
    setShowImgModal(true);
  };

  const handleOpenLinkModal = () => {
    saveSelection();
    setLinkUrlInput('');
    setLinkTextInput('');
    setLinkNewTab(true);
    setShowLinkModal(true);
  };

  // Helper for reliable HTML insertion into Editor
  const insertHtmlAtCursorOrEnd = (html) => {
    if (editorMode === 'visual' && editorRef.current) {
      editorRef.current.focus();
      restoreSelection();
      let success = false;
      try {
        success = document.execCommand('insertHTML', false, html);
      } catch (e) {}

      if (!success) {
        // Fallback: create temporary container and append nodes
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        while (tempDiv.firstChild) {
          editorRef.current.appendChild(tempDiv.firstChild);
        }
      }
      setFormData(prev => ({ ...prev, partnerDetails: editorRef.current.innerHTML }));
    } else {
      setFormData(prev => ({ ...prev, partnerDetails: (prev.partnerDetails || '') + html }));
    }
  };

  // Apply Insert Image
  const applyInsertImage = () => {
    if (!imgUrlInput || !imgUrlInput.trim()) {
      alert('Vui lòng chọn ảnh từ máy tính hoặc nhập đường dẫn URL ảnh!');
      return;
    }
    const imgHtml = `<p style="text-align: center; margin: 12px 0;"><img src="${imgUrlInput.trim()}" alt="Hình ảnh đối tác" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" /></p><p><br></p>`;
    
    insertHtmlAtCursorOrEnd(imgHtml);
    setShowImgModal(false);
    setImgUrlInput('');
  };

  // Handle local image file upload
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Dung lượng ảnh quá lớn! Vui lòng chọn file ảnh nhỏ hơn 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setImgUrlInput(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Apply Insert Link
  const applyInsertLink = () => {
    if (!linkUrlInput || !linkUrlInput.trim()) {
      alert('Vui lòng nhập đường dẫn URL liên kết!');
      return;
    }
    const text = linkTextInput.trim() || linkUrlInput.trim();
    const targetAttr = linkNewTab ? ' target="_blank" rel="noreferrer"' : '';
    const linkHtml = `<a href="${linkUrlInput.trim()}"${targetAttr} style="color: #6366f1; text-decoration: underline; font-weight: 600;">${text}</a> `;

    insertHtmlAtCursorOrEnd(linkHtml);
    setShowLinkModal(false);
    setLinkUrlInput('');
    setLinkTextInput('');
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
      const payload = {
        ...formData,
        displayConfig: {
          ...formData.displayConfig,
          bannerImage: formData.bannerImage || formData.displayConfig?.bannerImage || ''
        }
      };

      if (modalMode === 'CREATE') {
        const created = await api.createEnterprise(payload);
        alert('Tạo doanh nghiệp mới thành công!');
        setIsModalOpen(false);
        setEnterprises(prev => [...prev, created]);
      } else {
        const updated = await api.updateEnterprise(editingId, payload);
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

  // Quick On/Off Toggle for Related Products
  const handleToggleRelatedProducts = async (ent) => {
    const currentVal = ent.displayConfig?.showRelatedProducts !== false;
    const nextVal = !currentVal;
    setTogglingId(ent._id);

    // Optimistic local state update
    setEnterprises(prev => prev.map(item => {
      if (item._id === ent._id) {
        return {
          ...item,
          displayConfig: {
            ...(item.displayConfig || {}),
            showRelatedProducts: nextVal
          }
        };
      }
      return item;
    }));

    try {
      await api.toggleRelatedProducts(ent._id, nextVal);
      setToastMessage({
        type: 'success',
        text: `Đã ${nextVal ? 'BẬT' : 'TẮT'} hiển thị Sản phẩm liên quan cho "${ent.name}"`
      });
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      // Revert on failure
      setEnterprises(prev => prev.map(item => {
        if (item._id === ent._id) {
          return {
            ...item,
            displayConfig: {
              ...(item.displayConfig || {}),
              showRelatedProducts: currentVal
            }
          };
        }
        return item;
      }));
      alert(err.message || 'Lỗi khi cập nhật cấu hình sản phẩm liên quan');
    } finally {
      setTogglingId(null);
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

        {isAdmin ? (
          <button 
            className="btn btn-primary"
            onClick={handleOpenCreateModal}
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, padding: '10px 20px', borderRadius: '10px' }}
          >
            <Plus size={18} /> Thêm Doanh nghiệp Mới
          </button>
        ) : enterprises.length > 0 && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="btn btn-outline"
              onClick={() => handleOpenEditModal(enterprises[0], 'domainChatbot')}
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, padding: '10px 18px', borderRadius: '10px', borderColor: '#f59e0b', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.08)' }}
            >
              <MessageSquare size={17} /> Cài đặt Chatbot (Mục nâng cao)
            </button>
            <button
              className="btn btn-primary"
              onClick={() => handleOpenEditModal(enterprises[0], 'info')}
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, padding: '10px 18px', borderRadius: '10px' }}
            >
              <Edit3 size={17} /> Chỉnh sửa Thông tin Doanh nghiệp
            </button>
          </div>
        )}
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
                style={{ paddingLeft: 38, paddingRight: 36, height: 42 }}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  title="Xóa tìm kiếm"
                >
                  <X size={15} />
                </button>
              )}
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

      {/* Result count */}
      {(searchQuery || filterType !== 'ALL') && (
        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: -8 }}>
          Tìm thấy <strong style={{ color: 'var(--color-text-primary)' }}>{filteredEnterprises.length}</strong> / {enterprises.length} doanh nghiệp
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setFilterType('ALL'); }}
              style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-accent-light)', fontSize: '0.82rem', textDecoration: 'underline' }}
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      )}

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
                <th style={{ width: 140, textAlign: 'center' }}>SP Liên Quan</th>
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
                    <button
                      type="button"
                      className={`enterprise-toggle-switch ${ent.displayConfig?.showRelatedProducts !== false ? 'active' : 'inactive'}`}
                      disabled={togglingId === ent._id}
                      onClick={() => handleToggleRelatedProducts(ent)}
                      title={`Bấm để ${ent.displayConfig?.showRelatedProducts !== false ? 'TẮT' : 'BẬT'} hiển thị sản phẩm liên quan`}
                    >
                      <span className="toggle-slider"></span>
                      <span className="toggle-text">
                        {ent.displayConfig?.showRelatedProducts !== false ? 'BẬT' : 'TẮT'}
                      </span>
                    </button>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <button 
                        className="btn btn-outline" 
                        onClick={() => handleOpenEditModal(ent, 'info')}
                        title="Chỉnh sửa thông tin doanh nghiệp"
                        style={{ height: 34, padding: '0 10px', color: 'var(--color-primary-light)', borderColor: 'rgba(99, 102, 241, 0.4)' }}
                      >
                        <Edit3 size={15} /> Sửa
                      </button>

                      <button 
                        className="btn btn-outline" 
                        onClick={() => handleOpenEditModal(ent, 'domainChatbot')}
                        title="Cài đặt Chatbot tư vấn (Bộ câu hỏi tự chọn)"
                        style={{ height: 34, padding: '0 10px', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                      >
                        <MessageSquare size={15} /> Chatbot
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

      {/* MAIN POPUP MODAL (Thêm Mới & Chỉnh Sửa Doanh Nghiệp) */}
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
                type="button"
                className={`modal-tab-btn ${activeModalTab === 'info' ? 'active' : ''}`}
                onClick={() => setActiveModalTab('info')}
              >
                <Building2 size={16} /> Thông tin Doanh nghiệp
              </button>

              <button 
                type="button"
                className={`modal-tab-btn ${activeModalTab === 'partnerDetails' ? 'active' : ''}`}
                onClick={() => setActiveModalTab('partnerDetails')}
              >
                <FileText size={16} /> Chi tiết đối tác (Soạn thảo & Ảnh)
              </button>

              <button 
                type="button"
                className={`modal-tab-btn ${activeModalTab === 'domainChatbot' ? 'active' : ''}`}
                onClick={() => setActiveModalTab('domainChatbot')}
              >
                <Globe size={16} /> Domain, Chatbot & Giao diện
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

                    {/* Khối Hình ảnh Thương hiệu & Nhận diện trên Client */}
                    <div style={{ gridColumn: 'span 2', marginTop: 10, padding: '16px 18px', background: 'rgba(99, 102, 241, 0.04)', borderRadius: 12, border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '0.92rem', color: 'var(--color-primary-light, #818cf8)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ImageIcon size={16} /> Hình Ảnh Nhận Diện Thương Hiệu trên Trang Quét Tem (Client)
                      </h4>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                        <EnterpriseImageField
                          label="Logo Doanh Nghiệp"
                          value={formData.logo}
                          onChange={(url) => setFormData(prev => ({ ...prev, logo: url }))}
                          placeholder="https://.../logo.png"
                          helpText="Hiển thị trên Header của trang quét mã tem, namecard và giấy chứng nhận."
                          isBanner={false}
                        />

                        <EnterpriseImageField
                          label="Banner Mặc Định của Doanh Nghiệp"
                          value={formData.bannerImage}
                          onChange={(url) => setFormData(prev => ({
                            ...prev,
                            bannerImage: url,
                            displayConfig: { ...prev.displayConfig, bannerImage: url }
                          }))}
                          placeholder="https://.../banner-hero.jpg"
                          helpText="Hero Banner lớn hiển thị đầu trang khi quét tem (nếu sản phẩm chưa cài banner riêng)."
                          isBanner={true}
                        />
                      </div>
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

                        {/* Interactive Image & Link Buttons */}
                        <button 
                          type="button" 
                          className="btn btn-primary btn-sm" 
                          onClick={handleOpenImgModal} 
                          style={{ fontSize: '0.8rem', gap: 4, fontWeight: 600 }}
                        >
                          <ImageIcon size={14} /> Chèn ảnh
                        </button>

                        <button 
                          type="button" 
                          className="btn btn-outline btn-sm" 
                          onClick={handleOpenLinkModal} 
                          style={{ fontSize: '0.8rem', gap: 4, fontWeight: 600 }}
                        >
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

                {/* TAB 3: CẤU HÌNH DOMAIN, CHATBOT & GIAO DIỆN CLIENT */}
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
                    <div style={{ background: 'var(--color-bg-primary)', padding: 18, borderRadius: 12, border: '1px solid rgba(245, 158, 11, 0.35)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                        <div>
                          <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f59e0b', margin: 0 }}>
                            <MessageSquare size={18} /> Cài đặt Chatbot Tư vấn (Mục nâng cao — Bộ câu hỏi tự chọn)
                          </h4>
                          <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                            Khi khách hàng quét tem xem thông tin sản phẩm và bấm vào <strong>"Tư vấn"</strong>, bộ câu hỏi tự chọn bên dưới sẽ hiển thị để khách bấm gửi Chatbot nhận câu trả lời ngay lập tức.
                          </p>
                        </div>

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
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: formData.chatbotConfig?.enabled ? '#22c55e' : 'inherit' }}>
                            {formData.chatbotConfig?.enabled ? 'Đang BẬT Chatbot' : 'Kích hoạt Chatbot'}
                          </span>
                        </label>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
                        <div>
                          <label className="label">Lời chào tự động của Chatbot khi khách bấm "Tư vấn"</label>
                          <input
                            type="text"
                            className="input"
                            placeholder="VD: Xin chào! Bạn muốn tìm hiểu thông tin gì về sản phẩm? Hãy chọn câu hỏi bên dưới nhé!"
                            value={formData.chatbotConfig?.welcomeMessage || ''}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              chatbotConfig: { ...prev.chatbotConfig, enabled: true, welcomeMessage: e.target.value }
                            }))}
                          />
                        </div>

                        {/* Preset Q&A Builder */}
                        <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: 10, padding: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                            <label className="label" style={{ margin: 0, fontWeight: 700, color: '#fbbf24' }}>
                              💬 Bộ câu hỏi tự chọn gửi Chatbot ({(formData.chatbotConfig?.qaList || []).length} câu hỏi)
                            </label>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                style={{ fontSize: '0.76rem', height: 30, padding: '0 10px' }}
                                onClick={() => {
                                  const sampleQuestions = [
                                    { question: 'Cách sử dụng và liều dùng sản phẩm như thế nào?', answer: 'Quý khách vui lòng sử dụng theo đúng hướng dẫn in trên bao bì hoặc tham khảo mục Hướng dẫn sử dụng trên trang thông tin sản phẩm. Liên hệ Hotline doanh nghiệp nếu cần tư vấn chuyên sâu.' },
                                    { question: 'Làm sao để kiểm tra sản phẩm chính hãng?', answer: 'Sản phẩm chính hãng có tem QR xác thực điện tử. Khi quét mã QR hiện thông báo Xác thực chính hãng màu xanh và đầy đủ thông tin nhà sản xuất / phân phối.' },
                                    { question: 'Chính sách bảo hành / đổi trả sản phẩm ra sao?', answer: 'Chúng tôi hỗ trợ đổi trả nếu sản phẩm có lỗi từ nhà sản xuất và bảo hành đầy đủ theo quy định của công ty. Vui lòng giữ nguyên tem QR trên sản phẩm.' },
                                    { question: 'Tôi muốn liên hệ đặt mua sỉ / làm đại lý điểm bán?', answer: 'Quý đối tác vui lòng liên hệ trực tiếp số Hotline hoặc Email của doanh nghiệp hiển thị trên trang để được bộ phận kinh doanh tư vấn chiết khấu đại lý.' }
                                  ];
                                  setFormData(prev => ({
                                    ...prev,
                                    chatbotConfig: {
                                      ...prev.chatbotConfig,
                                      enabled: true,
                                      qaList: [...(prev.chatbotConfig?.qaList || []), ...sampleQuestions]
                                    }
                                  }));
                                }}
                              >
                                ⚡ Nạp bộ câu hỏi mẫu
                              </button>
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                style={{ fontSize: '0.76rem', height: 30, padding: '0 12px' }}
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    chatbotConfig: {
                                      ...prev.chatbotConfig,
                                      enabled: true,
                                      qaList: [...(prev.chatbotConfig?.qaList || []), { question: '', answer: '' }]
                                    }
                                  }));
                                }}
                              >
                                <Plus size={14} /> Thêm câu hỏi tự chọn
                              </button>
                            </div>
                          </div>

                          {(!formData.chatbotConfig?.qaList || formData.chatbotConfig.qaList.length === 0) ? (
                            <div style={{ textAlign: 'center', padding: '16px', fontSize: '0.82rem', color: 'var(--color-text-muted)', border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 8 }}>
                              Chưa có câu hỏi tự chọn riêng. Bạn có thể bấm <strong>"⚡ Nạp bộ câu hỏi mẫu"</strong> hoặc <strong>"+ Thêm câu hỏi tự chọn"</strong> để thiết lập kịch bản tư vấn tự động cho khách quét tem.
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
                              {formData.chatbotConfig.qaList.map((qa, idx) => (
                                <div key={idx} style={{ background: 'var(--color-bg-secondary)', padding: 12, borderRadius: 8, border: '1px solid var(--color-border)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0, marginTop: 4 }}>
                                    {idx + 1}
                                  </div>
                                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <input
                                      type="text"
                                      className="input"
                                      placeholder={`Câu hỏi tự chọn #${idx + 1} (VD: Sản phẩm này dùng cho độ tuổi nào?)`}
                                      value={qa.question || ''}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setFormData(prev => {
                                          const list = [...(prev.chatbotConfig?.qaList || [])];
                                          list[idx] = { ...list[idx], question: val };
                                          return { ...prev, chatbotConfig: { ...prev.chatbotConfig, qaList: list } };
                                        });
                                      }}
                                      style={{ height: 36, fontSize: '0.85rem', fontWeight: 600 }}
                                    />
                                    <textarea
                                      className="input"
                                      rows={2}
                                      placeholder="Câu trả lời tự động của Chatbot khi khách chọn câu hỏi này..."
                                      value={qa.answer || ''}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setFormData(prev => {
                                          const list = [...(prev.chatbotConfig?.qaList || [])];
                                          list[idx] = { ...list[idx], answer: val };
                                          return { ...prev, chatbotConfig: { ...prev.chatbotConfig, qaList: list } };
                                        });
                                      }}
                                      style={{ fontSize: '0.83rem' }}
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormData(prev => {
                                        const list = (prev.chatbotConfig?.qaList || []).filter((_, i) => i !== idx);
                                        return { ...prev, chatbotConfig: { ...prev.chatbotConfig, qaList: list } };
                                      });
                                    }}
                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
                                    title="Xóa câu hỏi này"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="label">Mã nhúng Script Chatbot bên thứ 3 (Tùy chọn: Tawk.to / Tidio / Zalo)</label>
                          <textarea
                            className="input"
                            rows={2}
                            placeholder="<script src='https://embed.tawk.to/...'></script>"
                            value={formData.chatbotConfig?.script || ''}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              chatbotConfig: { ...prev.chatbotConfig, script: e.target.value }
                            }))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Display & Theme Config Box */}
                    <div style={{ background: 'var(--color-bg-primary)', padding: 18, borderRadius: 12, border: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-primary-light)' }}>
                          <Eye size={18} /> Cài đặt Hiển thị & Giao diện Tem Client
                        </h4>
                      </div>

                      {/* On/Off Related Products */}
                      <label className="toggle-label" style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData.displayConfig?.showRelatedProducts ?? true}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            displayConfig: { ...prev.displayConfig, showRelatedProducts: e.target.checked }
                          }))}
                        />
                        <span className="toggle-switch"></span>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>Hiển thị phần "Sản phẩm Liên Quan" trên trang tem</span>
                            <span className={`badge ${formData.displayConfig?.showRelatedProducts ?? true ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                              {formData.displayConfig?.showRelatedProducts ?? true ? 'ĐANG BẬT' : 'ĐANG TẮT'}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.78rem', opacity: 0.7 }}>
                            {formData.displayConfig?.showRelatedProducts ?? true 
                              ? 'Hiển thị khối "Sản phẩm liên quan / phân phối" khi người dùng quét tem' 
                              : 'Ẩn hoàn toàn khối sản phẩm liên quan trên toàn bộ tem của doanh nghiệp'}
                          </span>
                        </div>
                      </label>

                      {/* Default Theme Selector */}
                      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
                        <label className="label" style={{ marginBottom: 6, fontWeight: 700 }}>
                          🎨 Giao diện Tem Mặc định (Default Theme Cho Toàn Bộ Sản Phẩm)
                        </label>
                        <select
                          className="input"
                          value={formData.displayConfig?.defaultTheme || 'default'}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            displayConfig: { ...prev.displayConfig, defaultTheme: e.target.value }
                          }))}
                        >
                          <option value="default">🔲 Tự động nhận diện theo danh mục sản phẩm</option>
                          <option value="honey">🍯 Mật ong Hoa Bạc Hà / Đặc sản vùng cao (3 ngôn ngữ)</option>
                          <option value="appliance">🔧 Điện gia dụng & Bảo hành điện tử (Navy & Vàng)</option>
                          <option value="medical">⚕️ Dược phẩm & Y tế chuẩn GMP-WHO (Xanh Teal)</option>
                          <option value="functional_food">🌿 Thực phẩm chức năng & Dinh dưỡng (Xanh lá thiên nhiên)</option>
                          <option value="ocop">🏅 OCOP & Nông đặc sản vùng miền (Vàng đồng & Nâu xanh)</option>
                          <option value="staycool">🇫🇷 StayCool / VYPHYTO France (Giao diện Cam chuyên biệt)</option>
                          <option value="agriculture">🌾 Nông sản & Hợp tác xã VietGAP (Xanh đậm)</option>
                          <option value="cosmetics">💄 Mỹ phẩm & Chăm sóc sắc đẹp (Hồng tím & Gold)</option>
                        </select>
                        <p style={{ marginTop: 6, fontSize: '0.78rem', opacity: 0.55, lineHeight: 1.5 }}>
                          Khi chọn một theme cụ thể, tất cả mã tem của doanh nghiệp này sẽ mặc định hiển thị giao diện này (trừ khi sản phẩm được gán theme riêng).
                        </p>
                      </div>

                      {/* Default Distribution Banner Slogan */}
                      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
                        <label className="label" style={{ marginBottom: 6, fontWeight: 700 }}>
                          🏷️ Tiêu Đề Banner Slogan Mặc Định (Thanh thông báo trên tem)
                        </label>
                        <input
                          type="text"
                          className="input"
                          placeholder="VD: SẢN PHẨM CỦA VINSUMI NHẬP KHẨU VÀ PHÂN PHỐI CHÍNH HÃNG"
                          value={formData.displayConfig?.distributionBannerText || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            displayConfig: { ...prev.displayConfig, distributionBannerText: e.target.value }
                          }))}
                        />
                        <span style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', marginTop: 4, display: 'block' }}>
                          Nếu để trống, hệ thống sẽ tự động ghép tên công ty: <em>SẢN PHẨM CỦA [TÊN DOANH NGHIỆP] NHẬP KHẨU VÀ PHÂN PHỐI</em>.
                        </span>
                      </div>

                      {/* Brand Colors */}
                      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
                        <label className="label" style={{ marginBottom: 10, fontWeight: 700 }}>
                          🎨 Màu Sắc Nhận Diện Thương Hiệu (Brand Colors)
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                          <div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Màu chủ đạo (Primary Color)</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <input
                                type="color"
                                value={formData.brandConfig?.primaryColor || '#6366f1'}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  brandConfig: { ...prev.brandConfig, primaryColor: e.target.value }
                                }))}
                                style={{ width: 44, height: 38, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'transparent' }}
                              />
                              <input
                                type="text"
                                className="input"
                                value={formData.brandConfig?.primaryColor || '#6366f1'}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  brandConfig: { ...prev.brandConfig, primaryColor: e.target.value }
                                }))}
                                style={{ fontFamily: 'monospace', width: 110, fontSize: '0.85rem' }}
                              />
                            </div>
                          </div>

                          <div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Màu phụ (Secondary Color)</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <input
                                type="color"
                                value={formData.brandConfig?.secondaryColor || '#4f46e5'}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  brandConfig: { ...prev.brandConfig, secondaryColor: e.target.value }
                                }))}
                                style={{ width: 44, height: 38, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'transparent' }}
                              />
                              <input
                                type="text"
                                className="input"
                                value={formData.brandConfig?.secondaryColor || '#4f46e5'}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  brandConfig: { ...prev.brandConfig, secondaryColor: e.target.value }
                                }))}
                                style={{ fontFamily: 'monospace', width: 110, fontSize: '0.85rem' }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
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

      {/* SUB-MODAL CHÈN ẢNH (IMAGE INSERT DIALOG) */}
      {showImgModal && (
        <div className="modal-backdrop" style={{ zIndex: 10000 }}>
          <div className="modal-container" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div className="modal-title" style={{ fontSize: '1.05rem' }}>
                <ImageIcon style={{ color: 'var(--color-primary-light)' }} /> Chèn Hình Ảnh Vào Bài Viết
              </div>
              <button className="modal-close-btn" onClick={() => setShowImgModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Option 1: File Upload */}
              <div style={{ background: 'var(--color-bg-primary)', padding: 14, borderRadius: 10, border: '1px solid var(--color-border)' }}>
                <label className="label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Upload size={16} /> Tải ảnh lên từ Máy tính / Thiết bị
                </label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileSelect}
                  style={{ fontSize: '0.85rem', width: '100%', cursor: 'pointer' }} 
                />
              </div>

              <div style={{ textAlign: 'center', fontSize: '0.8rem', opacity: 0.6, fontWeight: 600 }}>--- HOẶC ---</div>

              {/* Option 2: Image URL */}
              <div>
                <label className="label" style={{ fontWeight: 600 }}>Nhập đường dẫn URL Hình ảnh trực tiếp</label>
                <input
                  type="text"
                  className="input"
                  placeholder="https://domain.com/hinhanh.jpg"
                  value={imgUrlInput}
                  onChange={(e) => setImgUrlInput(e.target.value)}
                />
              </div>

              {/* Image Preview if available */}
              {imgUrlInput && (
                <div style={{ textAlign: 'center', background: '#000', padding: 8, borderRadius: 8 }}>
                  <span style={{ fontSize: '0.75rem', opacity: 0.7, display: 'block', marginBottom: 4, color: '#fff' }}>Xem trước ảnh:</span>
                  <img src={imgUrlInput} alt="Preview" style={{ maxHeight: 150, maxWidth: '100%', borderRadius: 6 }} />
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setShowImgModal(false)}>
                Hủy
              </button>
              <button type="button" className="btn btn-primary" onClick={applyInsertImage} style={{ fontWeight: 600 }}>
                <ImageIcon size={16} style={{ marginRight: 6 }} /> Chèn Ảnh Vào Bài Viết
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL CHÈN LINK (LINK INSERT DIALOG) */}
      {showLinkModal && (
        <div className="modal-backdrop" style={{ zIndex: 10000 }}>
          <div className="modal-container" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div className="modal-title" style={{ fontSize: '1.05rem' }}>
                <LinkIcon style={{ color: 'var(--color-primary-light)' }} /> Chèn Liên Kết (Link URL)
              </div>
              <button className="modal-close-btn" onClick={() => setShowLinkModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label" style={{ fontWeight: 600 }}>Đường dẫn URL liên kết <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  className="input"
                  placeholder="https://website.com/gioi-thieu"
                  value={linkUrlInput}
                  onChange={(e) => setLinkUrlInput(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label" style={{ fontWeight: 600 }}>Văn bản hiển thị (Tùy chọn)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="VD: Bấm vào đây để xem chi tiết"
                  value={linkTextInput}
                  onChange={(e) => setLinkTextInput(e.target.value)}
                />
              </div>

              <label className="toggle-label" style={{ marginTop: 4 }}>
                <input
                  type="checkbox"
                  checked={linkNewTab}
                  onChange={(e) => setLinkNewTab(e.target.checked)}
                />
                <span className="toggle-switch"></span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Mở trang liên kết trong Tab mới</span>
              </label>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setShowLinkModal(false)}>
                Hủy
              </button>
              <button type="button" className="btn btn-primary" onClick={applyInsertLink} style={{ fontWeight: 600 }}>
                <LinkIcon size={16} style={{ marginRight: 6 }} /> Chèn Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="toast-notification animate-fade-in" style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid #22c55e',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: 10,
          boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          backdropFilter: 'blur(8px)',
          fontSize: '0.9rem',
          fontWeight: 600
        }}>
          <CheckCircle size={18} style={{ color: '#22c55e', flexShrink: 0 }} />
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
