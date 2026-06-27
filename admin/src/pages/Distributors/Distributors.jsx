import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Users, Plus, Search, RefreshCw, Edit, Trash2,
  X, CheckCircle, XCircle, MapPin, Mail, Key
} from 'lucide-react';
import './Distributors.css';

export default function Distributors() {
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingDistributor, setEditingDistributor] = useState(null);
  const [passwordDistributor, setPasswordDistributor] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [form, setForm] = useState({
    username: '', email: '', password: '', fullName: '', address: ''
  });

  useEffect(() => { loadDistributors(); }, [pagination.page, search]);

  const loadDistributors = async () => {
    try {
      setLoading(true);
      const result = await api.getDistributors({ page: pagination.page, search });
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
    setForm({ username: '', email: '', password: '', fullName: '', address: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (dist) => {
    setEditingDistributor(dist);
    setForm({
      username: dist.username,
      email: dist.email,
      password: '',
      fullName: dist.fullName,
      address: dist.address || ''
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
    if (!confirm('Bạn có chắc chắn muốn xóa nhà phân phối này?')) return;
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
          <h1>Quản lý Nhà phân phối / Điểm bán</h1>
          <p>Tạo và quản lý tài khoản NPP, cửa hàng phân phối sản phẩm</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={18} /> Thêm nhà phân phối
        </button>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            className="input"
            placeholder="Tìm theo tên cửa hàng, tài khoản, địa chỉ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
              <th>Cửa hàng / Nhà phân phối</th>
              <th>Tài khoản</th>
              <th>Địa chỉ</th>
              <th>Liên hệ</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="loading-overlay"><div className="loading-spinner"></div></td></tr>
            ) : distributors.length === 0 ? (
              <tr><td colSpan={6} className="empty-state"><Users size={40}/><h3>Chưa có nhà phân phối nào</h3></td></tr>
            ) : (
              distributors.map(dist => (
                <tr key={dist._id}>
                  <td>
                    <div className="dist-info">
                      <div className="dist-avatar">{dist.fullName?.charAt(0)}</div>
                      <div>
                        <div className="dist-name">{dist.fullName}</div>
                      </div>
                    </div>
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
        <div className="pagination">
          <button className="pagination-btn" disabled={pagination.page <= 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}>‹</button>
          {Array.from({ length: pagination.totalPages }, (_, i) => (
            <button key={i + 1} className={`pagination-btn ${pagination.page === i + 1 ? 'active' : ''}`}
              onClick={() => setPagination(p => ({ ...p, page: i + 1 }))}>{i + 1}</button>
          ))}
          <button className="pagination-btn" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}>›</button>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{editingDistributor ? 'Chỉnh sửa nhà phân phối' : 'Thêm nhà phân phối mới'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
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
                  <label>Tên điểm bán / Cửa hàng *</label>
                  <input
                    className="input"
                    value={form.fullName}
                    onChange={e => setForm({ ...form, fullName: e.target.value })}
                    placeholder="Ví dụ: ĐIỂM BÁN 01 – TẠP HÓA ANH TUẤN"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Địa chỉ cửa hàng</label>
                  <input
                    className="input"
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    placeholder="Ví dụ: 12 Đường số 5, P. Hiệp Bình, TP. Thủ Đức"
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
              <h3 className="modal-title">Đổi mật khẩu nhà phân phối</h3>
              <button className="btn-icon" onClick={() => setShowPasswordModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleChangePassword}>
              <div className="modal-body">
                <div style={{ marginBottom: 16, fontSize: '0.88rem' }}>
                  <p>Đang đổi mật khẩu cho: <strong>{passwordDistributor.fullName}</strong></p>
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
