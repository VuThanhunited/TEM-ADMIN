import { useState, useEffect } from 'react';
import {
  Truck, Package, Building, ChevronDown, ArrowRight,
  CheckCircle, AlertCircle, QrCode, Hash, LogOut, Loader
} from 'lucide-react';
import api from '../../services/api';

export default function DistributorEntry({ scanData, nppUser, nppToken, onLogout, onBack }) {
  const { label, enterprise } = scanData;

  const [distributors, setDistributors] = useState([]);
  const [selectedDistributor, setSelectedDistributor] = useState('');
  const [customDistributor, setCustomDistributor] = useState('');
  const [serialStart, setSerialStart] = useState(label?.serialNumber || '');
  const [serialEnd, setSerialEnd] = useState(label?.serialNumber || '');
  const [loading, setLoading] = useState(false);
  const [loadingDist, setLoadingDist] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDistributors();
  }, []);

  const loadDistributors = async () => {
    setLoadingDist(true);
    try {
      if (enterprise?._id) {
        const res = await api.getPublicDistributors(enterprise._id);
        setDistributors(res.distributors || []);
      }
    } catch {
      // ignore – just use custom input
    } finally {
      setLoadingDist(false);
    }
  };

  const getDistributorName = () => {
    if (selectedDistributor === '__custom__') return customDistributor.trim();
    if (selectedDistributor) {
      const found = distributors.find(d => d._id === selectedDistributor);
      return found?.fullName || found?.username || '';
    }
    // Default to current NPP user
    return nppUser?.fullName || nppUser?.username || '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const distName = getDistributorName();

    if (!distName) {
      setError('Vui lòng chọn hoặc nhập tên nhà phân phối');
      return;
    }
    if (!serialStart.trim() || !serialEnd.trim()) {
      setError('Vui lòng nhập Serial bắt đầu và Serial kết thúc');
      return;
    }

    setLoading(true);
    setError('');

    // Temporarily set token for this request
    const originalToken = localStorage.getItem('tem_token');
    localStorage.setItem('tem_token', nppToken);

    try {
      const batchId = label?.batchId?._id || label?.batchId;
      const res = await api.submitDistributorEntry({
        batchId,
        serialStart: serialStart.trim(),
        serialEnd: serialEnd.trim(),
        distributorName: distName,
        distributorAddress: nppUser?.enterpriseId?.address || ''
      });
      setResult(res);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi lưu dữ liệu');
    } finally {
      // Restore original token
      if (originalToken) {
        localStorage.setItem('tem_token', originalToken);
      } else {
        localStorage.removeItem('tem_token');
      }
      setLoading(false);
    }
  };

  const batchCode = label?.batchId?.batchCode || label?.batchId || '—';
  const productName = scanData?.product?.name || '—';

  if (result) {
    return (
      <div className="dist-entry-page">
        <div className="dist-success-card">
          <div className="dist-success-icon">
            <CheckCircle size={56} strokeWidth={1.5} />
          </div>
          <h2 className="dist-success-title">Nhập dữ liệu thành công!</h2>
          <p className="dist-success-desc">
            Đã cập nhật <strong>{result.modifiedCount} tem nhãn</strong> cho nhà phân phối
          </p>

          <div className="dist-result-card">
            <div className="dist-result-row">
              <span className="dist-result-label">Nhà phân phối:</span>
              <span className="dist-result-value">{result.distributorName}</span>
            </div>
            <div className="dist-result-row">
              <span className="dist-result-label">Serial bắt đầu:</span>
              <span className="dist-result-value serial-highlight">{result.serialStart}</span>
            </div>
            <div className="dist-result-row">
              <span className="dist-result-label">Serial kết thúc:</span>
              <span className="dist-result-value serial-highlight">{result.serialEnd}</span>
            </div>
            <div className="dist-result-row">
              <span className="dist-result-label">Số tem cập nhật:</span>
              <span className="dist-result-value count-highlight">{result.modifiedCount}</span>
            </div>
          </div>

          <div className="dist-success-actions">
            <button className="dist-btn-primary" onClick={() => { setResult(null); setSerialStart(''); setSerialEnd(''); }}>
              Nhập thêm lô khác
            </button>
            <button className="dist-btn-secondary" onClick={onBack}>
              Xem thông tin sản phẩm
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dist-entry-page">
      {/* Header bar */}
      <div className="dist-header-bar">
        <button className="dist-back-btn" onClick={onBack}>
          ← Quay lại
        </button>
        <span className="dist-header-title">Nhập dữ liệu phân phối</span>
        <button className="dist-logout-btn" onClick={onLogout} title="Đăng xuất NPP">
          <LogOut size={16} />
        </button>
      </div>

      {/* NPP info banner */}
      <div className="dist-npp-banner">
        <div className="dist-npp-avatar">
          {(nppUser?.fullName || nppUser?.username || 'N')[0].toUpperCase()}
        </div>
        <div className="dist-npp-info">
          <span className="dist-npp-name">{nppUser?.fullName || nppUser?.username}</span>
          <span className="dist-npp-role">Nhà phân phối (NPP)</span>
        </div>
        <Truck size={20} className="dist-npp-truck-icon" />
      </div>

      <div className="dist-form-card">
        {/* Field 1: Lô tem (auto detect) */}
        <div className="dist-info-section">
          <div className="dist-section-title">
            <QrCode size={16} />
            <span>Thông tin lô tem</span>
          </div>
          <div className="dist-info-row">
            <div className="dist-info-item">
              <span className="dist-info-label">Serial quét</span>
              <span className="dist-info-value serial-red">{label?.serialNumber || '—'}</span>
            </div>
            <div className="dist-info-item">
              <span className="dist-info-label">Lô tem</span>
              <span className="dist-info-value">{batchCode}</span>
            </div>
          </div>
          <div className="dist-info-row">
            <div className="dist-info-item">
              <span className="dist-info-label">Sản phẩm</span>
              <span className="dist-info-value">{productName}</span>
            </div>
            <div className="dist-info-item">
              <span className="dist-info-label">Doanh nghiệp</span>
              <span className="dist-info-value">{enterprise?.name || '—'}</span>
            </div>
          </div>
        </div>

        <form className="dist-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="dist-error-msg">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* Field 2: Chọn nhà phân phối */}
          <div className="dist-field-group">
            <label className="dist-field-label">
              <Building size={15} />
              Chọn nhà phân phối <span className="required">*</span>
            </label>

            {loadingDist ? (
              <div className="dist-loading-dist">
                <Loader size={16} className="spin" />
                <span>Đang tải danh sách...</span>
              </div>
            ) : (
              <div className="dist-select-wrap">
                <select
                  className="dist-select"
                  value={selectedDistributor}
                  onChange={(e) => { setSelectedDistributor(e.target.value); setError(''); }}
                >
                  <option value="">— Mặc định: tài khoản đang đăng nhập —</option>
                  {distributors.map(d => (
                    <option key={d._id} value={d._id}>
                      {d.fullName || d.username}
                    </option>
                  ))}
                  <option value="__custom__">✏️ Nhập tên khác...</option>
                </select>
                <ChevronDown size={16} className="dist-select-arrow" />
              </div>
            )}

            {selectedDistributor === '__custom__' && (
              <input
                type="text"
                className="dist-input"
                placeholder="Nhập tên nhà phân phối..."
                value={customDistributor}
                onChange={(e) => { setCustomDistributor(e.target.value); setError(''); }}
              />
            )}
          </div>

          {/* Fields 3 & 4: Serial range */}
          <div className="dist-field-group">
            <label className="dist-field-label">
              <Hash size={15} />
              Khoảng Serial phân phối <span className="required">*</span>
            </label>
            <p className="dist-field-hint">
              Xác định số lượng sản phẩm bán cho nhà phân phối được chọn ở trên
            </p>
            <div className="dist-serial-range">
              <div className="dist-serial-field">
                <span className="dist-serial-label">Serial bắt đầu</span>
                <input
                  type="text"
                  className="dist-input serial-input"
                  placeholder="VD: TEM-000001"
                  value={serialStart}
                  onChange={(e) => { setSerialStart(e.target.value); setError(''); }}
                />
              </div>
              <ArrowRight size={20} className="dist-serial-arrow" />
              <div className="dist-serial-field">
                <span className="dist-serial-label">Serial kết thúc</span>
                <input
                  type="text"
                  className="dist-input serial-input"
                  placeholder="VD: TEM-000050"
                  value={serialEnd}
                  onChange={(e) => { setSerialEnd(e.target.value); setError(''); }}
                />
              </div>
            </div>

            {serialStart && serialEnd && (
              <div className="dist-range-preview">
                <Package size={13} />
                <span>
                  Từ <strong>{serialStart}</strong> đến <strong>{serialEnd}</strong>
                </span>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="dist-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <><span className="npp-btn-spinner" /> Đang lưu...</>
            ) : (
              <><CheckCircle size={18} /> Xác nhận nhập dữ liệu</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
