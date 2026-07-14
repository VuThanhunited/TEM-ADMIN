import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
  FileText, Plus, Trash2, Edit, Download, Upload, X, Image, Info, ShieldAlert
} from 'lucide-react';
import './LabelDesigns.css';

export default function LabelDesigns() {
  const { user, isAdmin, isNSX, enterpriseId } = useAuth();
  const [designs, setDesigns] = useState([]);
  const [enterprises, setEnterprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  
  const [form, setForm] = useState({
    name: '',
    image: '',
    fileData: '',
    fileName: '',
    size: '',
    enterpriseId: ''
  });

  useEffect(() => {
    loadDesigns();
    if (isAdmin) {
      loadEnterprises();
    }
  }, [isAdmin]);

  const loadDesigns = async () => {
    try {
      setLoading(true);
      const data = await api.getLabelDesigns();
      setDesigns(data);
    } catch (e) {
      console.error('Error loading designs:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadEnterprises = async () => {
    try {
      const data = await api.getEnterprises();
      setEnterprises(data);
    } catch (e) {
      console.error('Error loading enterprises:', e);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setModalError(null);
    setImagePreview(null);
    setSelectedFile(null);
    setForm({
      name: '',
      image: '',
      fileData: '',
      fileName: '',
      size: '',
      enterpriseId: isAdmin ? '' : (enterpriseId || '')
    });
    setShowModal(true);
  };

  const openEdit = (design) => {
    setEditing(design);
    setModalError(null);
    setImagePreview(design.image);
    setSelectedFile(design.fileName ? { name: design.fileName } : null);
    setForm({
      name: design.name,
      image: design.image,
      fileData: design.fileData || '',
      fileName: design.fileName || '',
      size: design.size,
      enterpriseId: design.enterpriseId?._id || design.enterpriseId || ''
    });
    setShowModal(true);
  };

  // Convert image to Base64
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chỉ chọn tệp hình ảnh (png, jpg, jpeg, webp)');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setForm(prev => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // Convert download file to Base64
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Limit file size to 8MB
    if (file.size > 8 * 1024 * 1024) {
      alert('Kích thước tệp đính kèm tối đa là 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedFile(file);
      setForm(prev => ({ 
        ...prev, 
        fileData: reader.result,
        fileName: file.name
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError(null);

    if (isAdmin && !form.enterpriseId) {
      setModalError('Vui lòng chọn doanh nghiệp sở hữu mẫu tem');
      return;
    }

    if (!form.image) {
      setModalError('Vui lòng tải lên hình ảnh mô tả thiết kế');
      return;
    }

    try {
      const payload = { ...form };
      
      if (editing) {
        await api.updateLabelDesign(editing._id, payload);
      } else {
        await api.createLabelDesign(payload);
      }
      
      setShowModal(false);
      loadDesigns();
    } catch (err) {
      setModalError(err.message || 'Lỗi khi lưu mẫu tem thiết kế');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mẫu tem này khỏi hệ thống?')) return;
    try {
      await api.deleteLabelDesign(id);
      loadDesigns();
    } catch (err) {
      alert(err.message || 'Không thể xóa mẫu tem');
    }
  };

  const downloadFile = (design) => {
    if (!design.fileData) {
      alert('Không có tệp đính kèm tải xuống cho mẫu tem này.');
      return;
    }
    
    const link = document.createElement('a');
    link.href = design.fileData;
    link.download = design.fileName || `mau-tem-${design.name.toLowerCase().replace(/\s+/g, '-')}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner" style={{ width: 40, height: 40 }}></div>
      </div>
    );
  }

  // Only allow NSX and ADMIN
  if (!isNSX && !isAdmin) {
    return (
      <div className="forbidden-container card animate-scale-in" style={{ padding: '60px 40px', textAlign: 'center', margin: '40px auto', maxWidth: 500 }}>
        <ShieldAlert size={60} style={{ color: 'var(--color-danger)', marginBottom: '20px' }} />
        <h2>Quyền truy cập bị từ chối</h2>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '10px' }}>Chức năng Quản lý mẫu tem chỉ dành cho tài khoản Nhà sản xuất (NSX) hoặc Quản trị viên hệ thống.</p>
      </div>
    );
  }

  return (
    <div className="label-designs-page">
      <div className="page-header">
        <div>
          <h1>Quản lý Mẫu Tem</h1>
          <p>Lưu trữ, xem kích thước và tải xuống các mẫu thiết kế tem nhãn sản phẩm</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} /> Tạo Mẫu Mới
        </button>
      </div>

      {designs.length === 0 ? (
        <div className="empty-state">
          <FileText size={60} />
          <h3>Chưa có mẫu tem thiết kế nào</h3>
          <p>Nhấp vào nút "Tạo Mẫu Mới" ở trên để đăng tải mẫu thiết kế đầu tiên.</p>
        </div>
      ) : (
        <div className="designs-grid">
          {designs.map(design => (
            <div key={design._id} className="design-card card animate-fade-in-up">
              <div className="design-img-wrap">
                <img src={design.image} alt={design.name} className="design-img" />
              </div>
              
              <div className="design-info-wrap">
                <h3 className="design-name">{design.name}</h3>
                
                <div className="design-meta-list">
                  <div className="design-meta-item">
                    <span className="meta-label">Kích thước:</span>
                    <span className="meta-value size-badge">{design.size}</span>
                  </div>
                  
                  {isAdmin && (
                    <div className="design-meta-item">
                      <span className="meta-label">Doanh nghiệp:</span>
                      <span className="meta-value">{design.enterpriseId?.name || 'Chưa liên kết'}</span>
                    </div>
                  )}
                </div>

                <div className="design-actions">
                  {design.fileData && (
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => downloadFile(design)}
                      title={`Tải file: ${design.fileName || 'Mẫu thiết kế'}`}
                    >
                      <Download size={14} /> Tải file thiết kế
                    </button>
                  )}
                  
                  <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                    <button 
                      className="btn-icon" 
                      onClick={() => openEdit(design)}
                      title="Sửa thông tin"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      className="btn-icon text-danger" 
                      onClick={() => handleDelete(design._id)}
                      title="Xóa mẫu"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-container card animate-scale-in" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>{editing ? 'Cập nhật Mẫu Tem' : 'Tạo Mẫu Tem Thiết Kế Mới'}</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {modalError && (
                  <div className="login-error animate-fade-in" style={{ marginBottom: '20px' }}>
                    <AlertCircle size={16} />
                    <span>{modalError}</span>
                  </div>
                )}

                <div className="input-group">
                  <label htmlFor="design-name">Tên mẫu tem <span className="text-danger">*</span></label>
                  <input
                    id="design-name"
                    type="text"
                    className="input"
                    placeholder="Mẫu tem bảo mật xanh 2026..."
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label htmlFor="design-size">Kích thước tem <span className="text-danger">*</span></label>
                    <input
                      id="design-size"
                      type="text"
                      className="input"
                      placeholder="VD: 30x15 mm, Tròn 25mm..."
                      value={form.size}
                      onChange={e => setForm({ ...form, size: e.target.value })}
                      required
                    />
                  </div>

                  {isAdmin && (
                    <div className="input-group">
                      <label htmlFor="design-enterprise">Doanh nghiệp sở hữu <span className="text-danger">*</span></label>
                      <select
                        id="design-enterprise"
                        className="input"
                        value={form.enterpriseId}
                        onChange={e => setForm({ ...form, enterpriseId: e.target.value })}
                        required
                      >
                        <option value="">-- Chọn doanh nghiệp --</option>
                        {enterprises.map(ent => (
                          <option key={ent._id} value={ent._id}>{ent.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Upload Image Description */}
                <div className="input-group">
                  <label>Hình ảnh thiết kế mô tả <span className="text-danger">*</span></label>
                  <div className="upload-box-container">
                    <div className="file-upload-wrapper">
                      <input
                        type="file"
                        id="image-uploader"
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="image-uploader" className="file-upload-label">
                        <Upload size={18} />
                        <span>Chọn hình ảnh mẫu</span>
                      </label>
                    </div>
                    {imagePreview && (
                      <div className="image-upload-preview">
                        <img src={imagePreview} alt="Mẫu thử" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload Downloadable File (Vector/PDF/ZIP) */}
                <div className="input-group" style={{ marginTop: '10px' }}>
                  <label>Tệp mẫu thiết kế tải xuống (Vector/PDF/ZIP/PNG - Tối đa 8MB)</label>
                  <div className="file-upload-wrapper">
                    <input
                      type="file"
                      id="file-uploader"
                      accept=".pdf,.png,.zip,.ai,.cdr,.eps,.jpg,.jpeg"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="file-uploader" className="file-upload-label" style={{ background: 'var(--color-bg-tertiary)' }}>
                      <FileText size={18} />
                      <span>{selectedFile ? `Đã chọn: ${selectedFile.name}` : 'Tải lên tệp gốc thiết kế'}</span>
                    </label>
                  </div>
                  <p className="help-text" style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Tệp đính kèm này sẽ hiển thị nút tải xuống cho nhân viên hoặc đối tác khi họ xem mẫu tem này.
                  </p>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary">
                  {editing ? 'Lưu cập nhật' : 'Tạo mới mẫu tem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
