import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
  CreditCard, Plus, Search, Edit, Trash2, X, Eye, ToggleLeft, ToggleRight,
  Mail, Phone, Globe, MapPin, Copy, Check, ExternalLink, Upload, Link,
  MessageCircle
} from 'lucide-react';
import './Namecards.css';
import Pagination from '../../components/Pagination';
import { useDebounce } from '../../hooks/useDebounce';

// ── Preset theme colors ─────────────────────────────────────────────────────
const THEME_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];

// ── ImageInput (tái sử dụng pattern từ Products) ────────────────────────────
function ImageInput({ value, onChange, placeholder }) {
  const [mode, setMode] = useState(value?.startsWith('data:') ? 'upload' : 'url');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef();

  const effectiveMode = value?.startsWith('data:') ? 'upload' : (value ? 'url' : mode);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const result = await api.uploadImage(file);
      onChange(result.url);
    } catch (err) {
      setUploadError(err.message || 'Lỗi tải ảnh');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <button type="button" onClick={() => setMode('url')} style={{
          padding: '3px 10px', borderRadius: 6, fontSize: '0.78rem', cursor: 'pointer',
          border: '1px solid', borderColor: mode === 'url' ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)',
          background: mode === 'url' ? 'rgba(99,102,241,0.15)' : 'transparent',
          color: mode === 'url' ? 'var(--primary-color)' : 'var(--text-muted)',
          display: 'flex', alignItems: 'center', gap: 4
        }}>
          <Link size={11} /> Nhập URL
        </button>
        <button type="button" onClick={() => { setMode('upload'); fileRef.current?.click(); }} style={{
          padding: '3px 10px', borderRadius: 6, fontSize: '0.78rem', cursor: 'pointer',
          border: '1px solid', borderColor: mode === 'upload' ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)',
          background: mode === 'upload' ? 'rgba(99,102,241,0.15)' : 'transparent',
          color: mode === 'upload' ? 'var(--primary-color)' : 'var(--text-muted)',
          display: 'flex', alignItems: 'center', gap: 4
        }}>
          <Upload size={11} /> Tải từ thiết bị
        </button>
        <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
      </div>
      {effectiveMode === 'url' ? (
        <input className="input" placeholder={placeholder} value={value || ''} onChange={e => onChange(e.target.value)} />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {value && !uploading ? (
            <>
              <img src={value} alt="preview" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)' }} />
              <button type="button" onClick={() => onChange('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} /></button>
            </>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} style={{
              flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer',
              border: '1px dashed rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.05)',
              color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.85rem'
            }}>
              {uploading ? <><div className="loading-spinner" style={{ width: 14, height: 14 }} /> Đang tải...</> : <><Upload size={14} /> Chọn ảnh</>}
            </button>
          )}
        </div>
      )}
      {uploadError && <span style={{ fontSize: '0.78rem', color: '#f87171' }}>{uploadError}</span>}
    </div>
  );
}

// ── Slug helper ─────────────────────────────────────────────────────────────
function toSlug(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function Namecards() {
  const { isAdmin, enterpriseId } = useAuth();
  const [namecards, setNamecards] = useState([]);
  const [enterprises, setEnterprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [filterActive, setFilterActive] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [modalError, setModalError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [copiedId, setCopiedId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [showPreview, setShowPreview] = useState(null);

  const initialForm = {
    enterpriseId: '', name: '', title: '', company: '', bio: '',
    email: '', phone: '', phone2: '', website: '', address: '',
    avatar: '', coverImage: '',
    slug: '',
    themeColor: '#6366f1',
    isActive: true,
    socialLinks: { facebook: '', linkedin: '', zalo: '', instagram: '', youtube: '', tiktok: '', twitter: '' },
  };
  const [form, setForm] = useState({ ...initialForm });

  useEffect(() => {
    if (isAdmin) loadEnterprises();
  }, [isAdmin]);

  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [debouncedSearch, filterActive]);

  useEffect(() => {
    loadNamecards();
  }, [pagination.page, debouncedSearch, filterActive]);

  const loadNamecards = async () => {
    try {
      setLoading(true);
      const result = await api.getNamecards({ page: pagination.page, search: debouncedSearch, isActive: filterActive });
      setNamecards(result.data);
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
    } catch (err) { console.error(err); }
  };

  const openCreate = () => {
    setEditing(null);
    setModalError(null);
    setActiveTab('info');
    setForm({ ...initialForm, enterpriseId: isAdmin ? '' : (enterpriseId || '') });
    setShowModal(true);
  };

  const openEdit = (card) => {
    setEditing(card);
    setModalError(null);
    setActiveTab('info');
    setForm({
      enterpriseId: card.enterpriseId?._id || card.enterpriseId || '',
      name: card.name || '',
      title: card.title || '',
      company: card.company || '',
      bio: card.bio || '',
      email: card.email || '',
      phone: card.phone || '',
      phone2: card.phone2 || '',
      website: card.website || '',
      address: card.address || '',
      avatar: card.avatar || '',
      coverImage: card.coverImage || '',
      slug: card.slug || '',
      themeColor: card.themeColor || '#6366f1',
      isActive: card.isActive !== false,
      socialLinks: {
        facebook: card.socialLinks?.facebook || '',
        linkedin: card.socialLinks?.linkedin || '',
        zalo: card.socialLinks?.zalo || '',
        instagram: card.socialLinks?.instagram || '',
        youtube: card.socialLinks?.youtube || '',
        tiktok: card.socialLinks?.tiktok || '',
        twitter: card.socialLinks?.twitter || '',
      },
    });
    setShowModal(true);
  };

  const handleNameChange = (name) => {
    // Auto-gen slug nếu chưa custom
    const autoSlug = toSlug(name);
    setForm(prev => ({
      ...prev,
      name,
      slug: editing ? prev.slug : autoSlug,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError(null);
    if (isAdmin && !form.enterpriseId) {
      setModalError('Vui lòng chọn doanh nghiệp');
      return;
    }
    try {
      const payload = {
        ...form,
        enterpriseId: isAdmin ? form.enterpriseId : enterpriseId,
      };
      if (editing) {
        await api.updateNamecard(editing._id, payload);
      } else {
        await api.createNamecard(payload);
      }
      setShowModal(false);
      loadNamecards();
    } catch (err) {
      setModalError(err.message || 'Lỗi lưu namecard');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa namecard này?')) return;
    try {
      await api.deleteNamecard(id);
      loadNamecards();
    } catch (err) { alert(err.message); }
  };

  const handleToggle = async (id) => {
    setTogglingId(id);
    try {
      const result = await api.toggleNamecard(id);
      setNamecards(prev => prev.map(c => c._id === id ? { ...c, isActive: result.isActive } : c));
    } catch (err) { alert(err.message); }
    finally { setTogglingId(null); }
  };

  const handleCopyLink = async (card) => {
    const url = getPublicUrl(card);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(card._id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { alert('Không thể copy: ' + url); }
  };

  const getPublicUrl = (card) => {
    const base = import.meta.env.VITE_USER_URL ||
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5174'
        : window.location.origin);
    return `${base}/namecard/${card.slug}`;
  };

  const getInitial = (name) => name?.charAt(0)?.toUpperCase() || '?';

  const setSocial = (key, val) => setForm(prev => ({
    ...prev,
    socialLinks: { ...prev.socialLinks, [key]: val }
  }));

  const tabs = [
    { key: 'info', label: '👤 Thông tin' },
    { key: 'social', label: '🌐 Mạng xã hội' },
    { key: 'images', label: '🖼️ Hình ảnh' },
    { key: 'settings', label: '⚙️ Cài đặt' },
  ];

  return (
    <div className="namecards-page">
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h1>Quản lý Namecard</h1>
          <p>Tạo và quản lý danh thiếp kỹ thuật số — chia sẻ qua QR Code</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} /> Thêm Namecard
        </button>
      </div>

      {/* ── Toolbar ── */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            className="input"
            placeholder="Tìm theo tên, công ty, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="search-clear-btn" onClick={() => setSearch('')} title="Xóa">
              <X size={15} />
            </button>
          )}
        </div>
        <div className="tabs" style={{ gap: 6 }}>
          {[{ v: '', l: 'Tất cả' }, { v: 'true', l: '✅ Hoạt động' }, { v: 'false', l: '⏸️ Tắt' }].map(f => (
            <button
              key={f.v}
              className={`tab btn btn-sm ${filterActive === f.v ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilterActive(f.v)}
            >
              {f.l}
            </button>
          ))}
        </div>
        <span className="toolbar-count">{pagination.total} namecard</span>
      </div>

      {/* ── Grid ── */}
      <div className="namecards-grid">
        {loading ? (
          <div className="loading-overlay"><div className="loading-spinner" style={{ width: 40, height: 40 }} /></div>
        ) : namecards.length === 0 ? (
          <div className="empty-state">
            <CreditCard size={60} />
            <h3>Chưa có Namecard nào</h3>
            <p>Bấm "Thêm Namecard" để tạo danh thiếp kỹ thuật số đầu tiên</p>
          </div>
        ) : (
          namecards.map(card => (
            <div key={card._id} className={`namecard-card card animate-fade-in-up ${!card.isActive ? 'inactive' : ''}`}>
              {/* Status badge */}
              <span className={`namecard-status ${card.isActive ? 'status-active' : 'status-inactive'}`}>
                {card.isActive ? 'Hoạt động' : 'Tắt'}
              </span>

              {/* Cover */}
              <div className="namecard-cover">
                {card.coverImage
                  ? <img src={card.coverImage} alt="cover" />
                  : <div className="namecard-cover-placeholder" style={{ background: `linear-gradient(135deg, ${card.themeColor}cc, ${card.themeColor}55)` }} />}
              </div>

              {/* Avatar */}
              <div className="namecard-avatar-wrap">
                {card.avatar
                  ? <img src={card.avatar} alt={card.name} className="namecard-avatar" />
                  : (
                    <div className="namecard-avatar-placeholder" style={{ background: card.themeColor }}>
                      {getInitial(card.name)}
                    </div>
                  )}
              </div>

              {/* Info */}
              <div className="namecard-body">
                <h3 className="namecard-name">{card.name}</h3>
                {card.title && <span className="namecard-title">{card.title}</span>}
                {card.company && <span className="namecard-company">{card.company}</span>}

                {/* Contact icons */}
                <div className="namecard-contact">
                  {card.email && <a href={`mailto:${card.email}`} title={card.email}><Mail size={14} /></a>}
                  {card.phone && <a href={`tel:${card.phone}`} title={card.phone}><Phone size={14} /></a>}
                  {card.website && <a href={card.website} target="_blank" rel="noopener noreferrer" title={card.website}><Globe size={14} /></a>}
                  {card.address && <span title={card.address} style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}><MapPin size={14} /></span>}
                </div>

                {/* Social */}
                {Object.values(card.socialLinks || {}).some(v => v) && (
                  <div className="namecard-socials">
                    {card.socialLinks?.facebook && <a href={card.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="namecard-social-link" title="Facebook"><Facebook size={12} /></a>}
                    {card.socialLinks?.linkedin && <a href={card.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="namecard-social-link" title="LinkedIn"><Linkedin size={12} /></a>}
                    {card.socialLinks?.instagram && <a href={card.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="namecard-social-link" title="Instagram"><Instagram size={12} /></a>}
                    {card.socialLinks?.youtube && <a href={card.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="namecard-social-link" title="YouTube"><Youtube size={12} /></a>}
                    {card.socialLinks?.zalo && <a href={`https://zalo.me/${card.socialLinks.zalo}`} target="_blank" rel="noopener noreferrer" className="namecard-social-link" title="Zalo"><MessageCircle size={12} /></a>}
                  </div>
                )}

                {/* Slug */}
                <span className="namecard-slug">/{card.slug}</span>
              </div>

              {/* Action bar */}
              <div className="namecard-actions">
                <button
                  className="btn btn-sm btn-ghost"
                  title={card.isActive ? 'Tắt namecard' : 'Bật namecard'}
                  disabled={togglingId === card._id}
                  onClick={() => handleToggle(card._id)}
                >
                  {card.isActive ? <ToggleRight size={15} style={{ color: '#4ade80' }} /> : <ToggleLeft size={15} />}
                </button>
                <button className="btn btn-sm btn-ghost" title="Chỉnh sửa" onClick={() => openEdit(card)}>
                  <Edit size={14} />
                </button>
                <button
                  className="btn btn-sm btn-ghost"
                  title={copiedId === card._id ? 'Đã copy!' : 'Copy link'}
                  onClick={() => handleCopyLink(card)}
                >
                  {copiedId === card._id ? <Check size={14} style={{ color: '#4ade80' }} /> : <Copy size={14} />}
                </button>
                <button
                  className="btn btn-sm btn-ghost"
                  title="Xem trang public"
                  onClick={() => window.open(getPublicUrl(card), '_blank')}
                >
                  <ExternalLink size={14} />
                </button>
                <button className="btn btn-sm btn-ghost" title="Xóa" onClick={() => handleDelete(card._id)}>
                  <Trash2 size={14} style={{ color: '#f87171' }} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Pagination ── */}
      {pagination.totalPages > 1 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))}
        />
      )}

      {/* ── Modal Tạo / Sửa ── */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3 className="modal-title">
                <CreditCard size={20} style={{ marginRight: 8 }} />
                {editing ? 'Chỉnh sửa Namecard' : 'Tạo Namecard mới'}
              </h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Error */}
                {modalError && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: 12, marginBottom: 16,
                    borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)'
                  }}>
                    <X size={16} /><span style={{ fontSize: '0.9rem' }}>{modalError}</span>
                  </div>
                )}

                {/* Enterprise selector (admin only) */}
                {isAdmin && (
                  <div className="input-group">
                    <label>Doanh nghiệp *</label>
                    <select className="input select" value={form.enterpriseId} onChange={e => setForm({ ...form, enterpriseId: e.target.value })} required>
                      <option value="">-- Chọn doanh nghiệp --</option>
                      {enterprises.map(ent => <option key={ent._id} value={ent._id}>{ent.name}</option>)}
                    </select>
                  </div>
                )}

                {/* Tabs */}
                <div className="modal-tabs">
                  {tabs.map(t => (
                    <button key={t.key} type="button" className={`modal-tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* ── Tab: Thông tin cơ bản ── */}
                {activeTab === 'info' && (
                  <>
                    <div className="input-group">
                      <label>Tên đầy đủ *</label>
                      <input className="input" value={form.name} onChange={e => handleNameChange(e.target.value)} required placeholder="VD: Nguyễn Văn A" />
                    </div>
                    <div className="form-row-2">
                      <div className="input-group">
                        <label>Chức danh</label>
                        <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="VD: Giám đốc, CEO, Trưởng phòng..." />
                      </div>
                      <div className="input-group">
                        <label>Công ty / Tổ chức</label>
                        <input className="input" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="VD: Công ty TNHH ABC" />
                      </div>
                    </div>
                    <div className="form-row-2">
                      <div className="input-group">
                        <label>Email</label>
                        <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
                      </div>
                      <div className="input-group">
                        <label>Điện thoại</label>
                        <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="0901 234 567" />
                      </div>
                    </div>
                    <div className="form-row-2">
                      <div className="input-group">
                        <label>Điện thoại 2 (tùy chọn)</label>
                        <input className="input" value={form.phone2} onChange={e => setForm({ ...form, phone2: e.target.value })} placeholder="0901 234 568" />
                      </div>
                      <div className="input-group">
                        <label>Website</label>
                        <input className="input" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://example.com" />
                      </div>
                    </div>
                    <div className="input-group">
                      <label>Địa chỉ</label>
                      <input className="input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Số nhà, đường, quận/huyện, tỉnh/thành phố" />
                    </div>
                    <div className="input-group">
                      <label>Giới thiệu ngắn (Bio)</label>
                      <textarea className="input textarea" rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Vài dòng giới thiệu bản thân hoặc doanh nghiệp..." />
                    </div>
                  </>
                )}

                {/* ── Tab: Mạng xã hội ── */}
                {activeTab === 'social' && (
                  <>
                    {[
                      { key: 'facebook', label: 'Facebook', icon: '📘', ph: 'https://facebook.com/your-page' },
                      { key: 'linkedin', label: 'LinkedIn', icon: '💼', ph: 'https://linkedin.com/in/your-profile' },
                      { key: 'instagram', label: 'Instagram', icon: '📸', ph: 'https://instagram.com/your-account' },
                      { key: 'youtube', label: 'YouTube', icon: '▶️', ph: 'https://youtube.com/@channel' },
                      { key: 'tiktok', label: 'TikTok', icon: '🎵', ph: 'https://tiktok.com/@your-account' },
                      { key: 'zalo', label: 'Zalo', icon: '💬', ph: 'Số Zalo hoặc link zalo.me/...' },
                      { key: 'twitter', label: 'X (Twitter)', icon: '🐦', ph: 'https://x.com/your-handle' },
                    ].map(s => (
                      <div className="input-group" key={s.key}>
                        <label>{s.icon} {s.label}</label>
                        <input
                          className="input"
                          value={form.socialLinks[s.key] || ''}
                          onChange={e => setSocial(s.key, e.target.value)}
                          placeholder={s.ph}
                        />
                      </div>
                    ))}
                  </>
                )}

                {/* ── Tab: Hình ảnh ── */}
                {activeTab === 'images' && (
                  <>
                    <div className="input-group">
                      <label>Ảnh đại diện (Avatar)</label>
                      <ImageInput value={form.avatar} onChange={url => setForm({ ...form, avatar: url })} placeholder="URL ảnh đại diện..." />
                    </div>
                    <div className="input-group">
                      <label>Ảnh bìa / Banner nền</label>
                      <ImageInput value={form.coverImage} onChange={url => setForm({ ...form, coverImage: url })} placeholder="URL ảnh bìa..." />
                    </div>
                  </>
                )}

                {/* ── Tab: Cài đặt ── */}
                {activeTab === 'settings' && (
                  <>
                    <div className="input-group">
                      <label>Slug (URL định danh) — dùng trong link QR</label>
                      <input
                        className="input"
                        value={form.slug}
                        onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                        placeholder="vd: nguyen-van-a"
                      />
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 4, display: 'block' }}>
                        Link công khai: /namecard/<strong>{form.slug || 'slug-cua-ban'}</strong>
                      </span>
                    </div>

                    <div className="input-group">
                      <label>Màu chủ đạo</label>
                      <div className="color-row">
                        {THEME_COLORS.map(c => (
                          <div
                            key={c}
                            className={`color-swatch ${form.themeColor === c ? 'selected' : ''}`}
                            style={{ background: c }}
                            onClick={() => setForm({ ...form, themeColor: c })}
                            title={c}
                          />
                        ))}
                        <input
                          type="color"
                          value={form.themeColor}
                          onChange={e => setForm({ ...form, themeColor: e.target.value })}
                          style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer', background: 'none' }}
                          title="Chọn màu tùy chỉnh"
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span>Trạng thái</span>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, isActive: !form.isActive })}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                        >
                          {form.isActive
                            ? <ToggleRight size={28} style={{ color: '#4ade80' }} />
                            : <ToggleLeft size={28} style={{ color: 'var(--color-text-muted)' }} />}
                        </button>
                        <span style={{ fontSize: '0.85rem', color: form.isActive ? '#4ade80' : 'var(--color-text-muted)' }}>
                          {form.isActive ? 'Namecard đang hoạt động' : 'Namecard bị tắt (không hiển thị)'}
                        </span>
                      </label>
                    </div>
                  </>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">
                  {editing ? 'Cập nhật' : 'Tạo Namecard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
