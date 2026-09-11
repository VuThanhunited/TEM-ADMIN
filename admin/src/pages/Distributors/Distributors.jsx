import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Users, Plus, Search, RefreshCw, Edit, Trash2,
  X, CheckCircle, XCircle, MapPin, Mail, Key, Building2, Store, Filter
} from 'lucide-react';
import './Distributors.css';
import Pagination from '../../components/Pagination';

export default function Distributors() {
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all', 'NSX', 'NPP'
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingDistributor, setEditingDistributor] = useState(null);
  const [passwordDistributor, setPasswordDistributor] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [form, setForm] = useState({
    username: '', email: '', password: '', fullName: '', address: '', role: 'NPP'
  });

  useEffect(() => { loadDistributors(); }, [pagination.page, search, roleFilter]);

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
    setForm({ username: '', email: '', password: '', fullName: '', address: '', role: 'NPP' });
    setShowModal(true);
  };

  const handleOpenEdit = (dist) => {
    setEditingDistributor(dist);
    setForm({
      username: dist.username,
      email: dist.email,
      password: '',
      fullName: dist.fullName,
      address: dist.address || '',
      role: dist.role || 'NPP'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDistributor) {
        await api.updateDistributor(editingDistributor._id, {
          fullName: form.fullName,
          email: form.email,
          address: form.address,
          role: form.role,
          isActive: editingDistributor.isActive
        });
      } else {
        await api.createDistributor(form);
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

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert('Mật khẩu phải chứa ít nhất 6 ký tự');
      return;
    }
    try {
      await api.updateDistributor(passwordDistributor._id, { password: newPassword });
      setShowPasswordModal(false);
      setPasswordDistributor(null);
      setNewPassword('');
      alert('Đã đổi mật khẩu thành công');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="distributors-page">
      <div className="page-header">
        <div>
          <h1>Quản lý NSX / Nhà phân phối / Điểm bán</h1>
          <p>Tạo và quản lý tài khoản NSX, nhà phân phối, đại lý và các điểm bán sản phẩm</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={18} /> Thêm đơn vị (NSX / NPP)
        </button>
      </div>

      {/* Toolbar */}
      <div className="toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 280, alignItems: 'center' }}>
          <div className="search-box" style={{ flex: 1 }}>
            <Search size={18} className="search-icon" />
            <input
              className="input"
              placeholder="Tìm theo tên đơn vị, tài khoản, địa chỉ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Role Filter Tabs */}
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', padding: 3, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              type="button"
              onClick={() => setRoleFilter('all')}
              style={{
                padding: '5px 12px', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer', border: 'none',
                background: roleFilter === 'all' ? 'var(--primary-color)' : 'transparent',
                color: roleFilter === 'all' ? '#fff' : 'var(--text-muted)'
              }}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('NSX')}
              style={{
                padding: '5px 12px', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer', border: 'none',
                background: roleFilter === 'NSX' ? 'var(--primary-color)' : 'transparent',
                color: roleFilter === 'NSX' ? '#fff' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', gap: 4
              }}
            >
              <Building2 size={13} /> NSX
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('NPP')}
              style={{
                padding: '5px 12px', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer', border: 'none',
                background: roleFilter === 'NPP' ? 'var(--primary-color)' : 'transparent',
                color: roleFilter === 'NPP' ? '#fff' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', gap: 4
              }}
            >
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
              <th>Tài khoản</th>
              <th>Địa chỉ</th>
              <th>Liên hệ</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="loading-overlay"><div className="loading-spinner"></div></td></tr>
            ) : distributors.length === 0 ? (
              <tr><td colSpan={7} className="empty-state"><Users size={40}/><h3>Chưa có đơn vị nào</h3></td></tr>
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
                  <td><code>{dist.username}</code></td>
                  <td>
                    <div className="dist-address-cell" title={dist.address}>
                      <MapPin size={14} className="dist-icon" />
                      <span>{dist.address || 'Chưa cập nhật'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="dist-email-cell">
                      <Mail size={14} className="dist-icon" />
                      <span>{dist.email}</span>
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
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => handleOpenEdit(dist)}
                        title="Chỉnh sửa"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => { setPasswordDistributor(dist); setShowPasswordModal(true); }}
                        title="Đổi mật khẩu"
                      >
                        <Key size={14} />
                      </button>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => handleDelete(dist._id)}
                        title="Xóa"
                      >
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
              <h3 className="modal-title">{editingDistributor ? 'Chỉnh sửa đơn vị' : 'Thêm đơn vị mới'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Loại đơn vị: NSX hoặc NPP */}
                <div className="input-group" style={{ marginBottom: 16 }}>
                  <label>Loại đối tác *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, role: 'NPP' })}
                      style={{
                        padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                        border: '1px solid',
                        borderColor: form.role === 'NPP' ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)',
                        background: form.role === 'NPP' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.02)',
                        color: form.role === 'NPP' ? 'var(--primary-color)' : 'var(--text-muted)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        fontWeight: form.role === 'NPP' ? 600 : 400
                      }}
                    >
                      <Store size={16} /> Nhà phân phối / Điểm bán
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, role: 'NSX' })}
                      style={{
                        padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                        border: '1px solid',
                        borderColor: form.role === 'NSX' ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)',
                        background: form.role === 'NSX' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.02)',
                        color: form.role === 'NSX' ? 'var(--primary-color)' : 'var(--text-muted)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        fontWeight: form.role === 'NSX' ? 600 : 400
                      }}
                    >
                      <Building2 size={16} /> Nhà sản xuất (NSX)
                    </button>
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label>Tên đăng nhập *</label>
                    <input
                      className="input"
                      value={form.username}
                      onChange={e => setForm({ ...form, username: e.target.value })}
                      disabled={!!editingDistributor}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Email liên hệ *</label>
                    <input
                      className="input"
                      type="email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {!editingDistributor && (
                  <div className="input-group">
                    <label>Mật khẩu khởi tạo *</label>
                    <input
                      className="input"
                      type="password"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      required
                    />
                  </div>
                )}

                <div className="input-group">
                  <label>{form.role === 'NSX' ? 'Tên Nhà sản xuất / Doanh nghiệp *' : 'Tên Điểm bán / Nhà phân phối *'}</label>
                  <input
                    className="input"
                    value={form.fullName}
                    onChange={e => setForm({ ...form, fullName: e.target.value })}
                    placeholder={form.role === 'NSX' ? 'Ví dụ: CÔNG TY CỔ PHẦN DƯỢC PHẨM ABC' : 'Ví dụ: ĐIỂM BÁN 01 – TẠP HÓA ANH TUẤN'}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Địa chỉ</label>
                  <input
                    className="input"
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    placeholder={form.role === 'NSX' ? 'Ví dụ: KCN Thăng Long, Đông Anh, Hà Nội' : 'Ví dụ: 12 Đường số 5, P. Hiệp Bình, TP. Thủ Đức'}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">{editingDistributor ? 'Lưu thay đổi' : 'Tạo tài khoản'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && passwordDistributor && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowPasswordModal(false)}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3 className="modal-title">Đổi mật khẩu tài khoản</h3>
              <button className="btn-icon" onClick={() => setShowPasswordModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleChangePassword}>
              <div className="modal-body">
                <div style={{ marginBottom: 16, fontSize: '0.88rem' }}>
                  <p>Đang đổi mật khẩu cho: <strong>{passwordDistributor.fullName}</strong> ({passwordDistributor.role === 'NSX' ? 'Nhà sản xuất' : 'Nhà phân phối'})</p>
                </div>
                <div className="input-group">
                  <label>Mật khẩu mới *</label>
                  <input
                    className="input"
                    type="password"
                    placeholder="Nhập ít nhất 6 ký tự"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowPasswordModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-success">Đổi mật khẩu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
