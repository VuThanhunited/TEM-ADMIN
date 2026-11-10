import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Users, Plus, Search, RefreshCw, Edit, Trash2,
  X, Clock, CheckCircle, XCircle, Calendar, Award, Upload, Phone, MapPin
} from 'lucide-react';
import './Accounts.css';
import Pagination from '../../components/Pagination';
import { useDebounce } from '../../hooks/useDebounce';

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [showModal, setShowModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [renewAccount, setRenewAccount] = useState(null);
  const [renewMonths, setRenewMonths] = useState(12);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [enterprises, setEnterprises] = useState([]);
  const emptyForm = {
    username: '', email: '', password: '', fullName: '',
    phone: '', address: '', logo: '', hasGeographicalIndication: false,
    role: 'NSX', enterpriseId: '', enterpriseName: '', enterpriseType: 'NSX', subscriptionMonths: 12, isActive: true
  };
  const [form, setForm] = useState({ ...emptyForm });

  useEffect(() => {
    api.getEnterprises().then(res => {
      const list = Array.isArray(res) ? res : (res?.data || []);
      setEnterprises(list);
    }).catch(() => {});
  }, []);

  // Khi debouncedSearch thay đổi: reset về page 1
  useEffect(() => { setPagination(prev => ({ ...prev, page: 1 })); }, [debouncedSearch]);

  // Load accounts khi page hoặc debouncedSearch thay đổi
  useEffect(() => { loadAccounts(); }, [pagination.page, debouncedSearch]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const result = await api.getAccounts({ page: pagination.page, search: debouncedSearch });
      setAccounts(result.data);
      setPagination(prev => ({ ...prev, ...result.pagination }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      if (editingAccount) {
        await api.updateAccount(editingAccount._id, {
          username: form.username,
          email: form.email,
          fullName: form.fullName,
          phone: form.phone || '',
          address: form.address || '',
          logo: form.logo || '',
          hasGeographicalIndication: Boolean(form.hasGeographicalIndication),
          role: form.role,
          enterpriseId: form.enterpriseId || undefined,
          enterpriseName: form.enterpriseName || undefined,
          isActive: form.isActive,
          password: form.password || undefined
        });
        setShowModal(false);
        setEditingAccount(null);
        setForm({ ...emptyForm });
        loadAccounts();
      } else {
        await api.createAccount(form);
        setShowModal(false);
        setForm({ ...emptyForm });
        loadAccounts();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenEdit = (account) => {
    setEditingAccount(account);
    const ent = account.enterpriseId && typeof account.enterpriseId === 'object' ? account.enterpriseId : null;
    setForm({
      username: account.username || '',
      email: account.email || '',
      password: '',
      fullName: account.fullName || '',
      phone: account.phone || ent?.phone || '',
      address: account.address || ent?.address || '',
      logo: account.logo || ent?.logo || '',
      hasGeographicalIndication: Boolean(account.hasGeographicalIndication || ent?.hasGeographicalIndication),
      role: account.role || 'NSX',
      enterpriseId: ent?._id || account.enterpriseId || '',
      enterpriseName: ent?.name || '',
      enterpriseType: account.role || 'NSX',
      subscriptionMonths: 12,
      isActive: account.isActive !== false
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) return;
    try {
      await api.deleteAccount(id);
      loadAccounts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleActive = async (account) => {
    try {
      await api.updateAccount(account._id, { ...account, isActive: !account.isActive });
      loadAccounts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRenew = async () => {
    try {
      await api.renewAccount(renewAccount._id, { months: renewMonths });
      setShowRenewModal(false);
      setRenewAccount(null);
      loadAccounts();
    } catch (err) {
      alert(err.message);
    }
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const isExpired = (date) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  return (
    <div className="accounts-page">
      <div className="page-header">
        <div>
          <h1>Quản lý Tài khoản</h1>
          <p>Quản lý tài khoản NSX/NPP và gia hạn thời gian thuê</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setEditingAccount(null);
          setForm({ ...emptyForm });
          setShowModal(true);
        }}>
          <Plus size={18} /> Tạo tài khoản
        </button>
      </div>

      {/* Search */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            className="input"
            placeholder="Tìm theo tên, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="search-clear-btn" onClick={() => setSearch('')} title="Xóa tìm kiếm">
              <X size={15} />
            </button>
          )}
        </div>
        <button className="btn btn-ghost" onClick={loadAccounts}>
          <RefreshCw size={16} /> Làm mới
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Tài khoản</th>
              <th>Doanh nghiệp</th>
              <th>Loại</th>
              <th>Gói thuê</th>
              <th>Hạn sử dụng</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="loading-overlay"><div className="loading-spinner"></div></td></tr>
            ) : accounts.length === 0 ? (
              <tr><td colSpan={7} className="empty-state"><Users size={40}/><h3>Chưa có tài khoản nào</h3></td></tr>
            ) : (
              accounts.map(account => (
                <tr key={account._id}>
                  <td>
                    <div className="account-info">
                      <div className="account-avatar">{account.fullName?.charAt(0)}</div>
                      <div>
                        <div className="account-name">{account.fullName} <span style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 600 }}>({account.username})</span></div>
                        <div className="account-email">{account.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{account.enterpriseId?.name || '—'}</div>
                    {(account.address || account.enterpriseId?.address) && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        📍 {account.address || account.enterpriseId?.address}
                      </div>
                    )}
                    {(account.phone || account.enterpriseId?.phone) && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        📞 {account.phone || account.enterpriseId?.phone}
                      </div>
                    )}
                    {(account.hasGeographicalIndication || account.enterpriseId?.hasGeographicalIndication) && (
                      <div style={{ marginTop: 4 }}>
                        <span className="badge" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #f59e0b', fontSize: '0.68rem', fontWeight: 700 }}>
                          🏅 Chỉ dẫn địa lý
                        </span>
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`badge badge-dot ${
                      account.role === 'NSX' ? 'badge-success' : 
                      account.role === 'ADMIN' ? 'badge-danger' : 
                      account.role === 'NPP' ? 'badge-warning' : 'badge-info'
                    }`}>
                      {account.role === 'GUEST' ? 'Khách hàng' : account.role}
                    </span>
                  </td>
                  <td>{account.enterpriseId?.subscriptionPlan || 'BASIC'}</td>
                  <td>
                    <div className={`expiry-date ${isExpired(account.subscriptionExpiry) ? 'expired' : ''}`}>
                      <Calendar size={14} />
                      {formatDate(account.subscriptionExpiry)}
                    </div>
                  </td>
                  <td>
                    <button
                      className={`badge badge-dot ${account.isActive ? 'badge-success' : 'badge-danger'}`}
                      onClick={() => handleToggleActive(account)}
                      style={{cursor:'pointer',border:'none'}}
                    >
                      {account.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => handleOpenEdit(account)}
                        title="Chỉnh sửa"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => { setRenewAccount(account); setShowRenewModal(true); }}
                        title="Gia hạn"
                      >
                        <RefreshCw size={14} />
                      </button>
                      <button className="btn btn-sm btn-ghost" onClick={() => handleDelete(account._id)} title="Xóa">
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
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{editingAccount ? 'Cập nhật tài khoản' : 'Tạo tài khoản mới'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="input-group">
                    <label>Tên đăng nhập *</label>
                    <input className="input" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required />
                  </div>
                  <div className="input-group">
                    <label>Email *</label>
                    <input className="input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="input-group">
                    <label>Họ và tên / Tên đơn vị chủ thể *</label>
                    <input className="input" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} required />
                  </div>
                  <div className="input-group">
                    <label>Mật khẩu {editingAccount ? '(Để trống để giữ nguyên)' : '*'}</label>
                    <input className="input" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required={!editingAccount} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="input-group">
                    <label>Số điện thoại liên hệ (hiển thị trên tem)</label>
                    <input className="input" placeholder="VD: 0987.654.321" value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label>Địa chỉ đơn vị chủ thể (hiển thị trên tem)</label>
                    <input className="input" placeholder="Nhập địa chỉ sản xuất / trụ sở..." value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} />
                  </div>
                </div>
                <div className="input-group">
                  <label>Logo / Ảnh đại diện đơn vị chủ thể (hiển thị khung phải tem)</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      className="input"
                      placeholder="Dán link ảnh hoặc bấm Tải ảnh..."
                      value={form.logo || ''}
                      onChange={e => setForm({...form, logo: e.target.value})}
                      style={{ flex: 1 }}
                    />
                    <label className="btn btn-ghost" style={{ cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Upload size={15} /> Tải ảnh
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === 'string') {
                              setForm(prev => ({ ...prev, logo: reader.result }));
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  </div>
                </div>
                <div className="input-group" style={{ marginBottom: 14 }}>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '9px 14px',
                      borderRadius: 10,
                      cursor: 'pointer',
                      fontWeight: 700,
                      background: form.hasGeographicalIndication ? 'rgba(245, 158, 11, 0.16)' : 'rgba(255,255,255,0.04)',
                      border: form.hasGeographicalIndication ? '1.5px solid #f59e0b' : '1px solid rgba(255,255,255,0.12)',
                      color: form.hasGeographicalIndication ? '#fbbf24' : 'inherit'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(form.hasGeographicalIndication)}
                      onChange={e => setForm({...form, hasGeographicalIndication: e.target.checked})}
                      style={{ width: 17, height: 17, accentColor: '#f59e0b', cursor: 'pointer' }}
                    />
                    <Award size={17} />
                    <span>Sản phẩm được cấp chỉ dẫn địa lý</span>
                  </label>
                </div>
                <div className="form-row">
                  <div className="input-group">
                    <label>Loại tài khoản</label>
                    <select className="input select" value={form.role} onChange={e => setForm({...form, role: e.target.value, enterpriseType: e.target.value})}>
                      <option value="NSX">NSX - Nhà sản xuất</option>
                      <option value="NPP">NPP - Nhà phân phối</option>
                    </select>
                  </div>
                  {!editingAccount && (
                    <div className="input-group">
                      <label>Thời hạn (tháng)</label>
                      <input className="input" type="number" min={1} value={form.subscriptionMonths} onChange={e => setForm({...form, subscriptionMonths: e.target.value})} onFocus={e => e.target.select()} />
                    </div>
                  )}
                </div>
                <div className="input-group">
                  <label>Doanh nghiệp liên kết</label>
                  <select className="input select" value={form.enterpriseId || ''} onChange={e => setForm({...form, enterpriseId: e.target.value})}>
                    <option value="">-- Tạo mới hoặc chọn doanh nghiệp --</option>
                    {enterprises.map(ent => (
                      <option key={ent._id} value={ent._id}>{ent.name} ({ent.type})</option>
                    ))}
                  </select>
                </div>
                {!editingAccount && !form.enterpriseId && (
                  <div className="input-group">
                    <label>Tên doanh nghiệp mới</label>
                    <input className="input" value={form.enterpriseName} onChange={e => setForm({...form, enterpriseName: e.target.value})} placeholder="Để trống sẽ tự động tạo" />
                  </div>
                )}
                {editingAccount && (
                  <div className="input-group">
                    <label>Trạng thái hoạt động</label>
                    <select className="input select" value={form.isActive ? 'true' : 'false'} onChange={e => setForm({...form, isActive: e.target.value === 'true'})}>
                      <option value="true">Hoạt động (Active)</option>
                      <option value="false">Khóa tài khoản (Locked)</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">{editingAccount ? 'Cập nhật' : 'Tạo tài khoản'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Renew Modal */}
      {showRenewModal && renewAccount && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowRenewModal(false)}>
          <div className="modal" style={{maxWidth:420}}>
            <div className="modal-header">
              <h3 className="modal-title">Gia hạn tài khoản</h3>
              <button className="btn-icon" onClick={() => setShowRenewModal(false)}><X size={20}/></button>
            </div>
            <div className="modal-body">
              <div className="renew-info">
                <p><strong>Tài khoản:</strong> {renewAccount.fullName}</p>
                <p><strong>Hạn hiện tại:</strong> {formatDate(renewAccount.subscriptionExpiry)}</p>
              </div>
              <div className="input-group">
                <label>Gia hạn thêm (tháng)</label>
                <input className="input" type="number" min={1} value={renewMonths} onChange={e => setRenewMonths(parseInt(e.target.value) || 0)} onFocus={e => e.target.select()} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowRenewModal(false)}>Hủy</button>
              <button className="btn btn-success" onClick={handleRenew}>
                <RefreshCw size={16}/> Gia hạn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
