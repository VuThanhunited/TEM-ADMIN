import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Package, QrCode, CheckCircle, ShieldCheck, MapPin,
  User, Phone, Hash, AlertCircle, UserCheck, Store
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import userApi from '../../services/api';
import './SelectStore.css';

const PHONE_REGEX = /^(\+84|84|0)\d{9,10}$/;

/**
 * Form "Bổ sung thông tin KH sở hữu" – NPP nhập thông tin khách hàng / đại lý đã mua sản phẩm.
 * Nhận dữ liệu tem qua location.state (từ ScanChoice / ScanQR) hoặc ?code= trên URL
 * (sau khi đăng nhập / từ trang quét của admin) – không bắt NPP phải quét lại.
 */
export default function SelectStore() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();

  const codeParam = searchParams.get('code') || '';
  const { scanData: stateScanData, serial: stateSerial, isBarcode } = location.state || {};
  const serial = stateSerial || codeParam;

  const [scanData, setScanData] = useState(stateScanData || null);
  const [loading, setLoading] = useState(!stateScanData);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const detectedSerial = label?.serialNumber || serial || codeParam || '';
  const initialSerial = stateScanData?.label?.serialNumber || stateSerial || codeParam || '';
  const [form, setForm] = useState({ name: '', address: '', phone: '', serial: initialSerial });

  // Trường Mã sở hữu (NPP nhập tay theo yêu cầu khách hàng)
  const [ownerCode, setOwnerCode] = useState('');

  const product = scanData?.product;
  const label = scanData?.label;
  const ownerInfo = label?.ownerInfo;
  const isActivated = Boolean(ownerInfo?.activatedAt);
  // NPP không được ghi đè tem đã kích hoạt (backend cũng chặn)
  const isLocked = isActivated && user?.role === 'NPP';

  useEffect(() => {
    if (!stateScanData && !codeParam) {
      navigate('/scan', { replace: true });
      return;
    }
    if (!stateScanData) {
      loadScanData();
    }
  }, []);

  // Tự động sinh / gán serial chống giả dựa vào con tem đang quét
  useEffect(() => {
    const autoSerial = label?.serialNumber || serial || codeParam || '';
    if (autoSerial) {
      setForm(prev => (prev.serial === autoSerial ? prev : { ...prev, serial: autoSerial }));
    }
  }, [label?.serialNumber, serial, codeParam]);

  useEffect(() => {
    // Nếu tem đã từng có mã sở hữu trước đó, nạp làm mặc định
    if (label?.ownerCode) {
      setOwnerCode(label.ownerCode);
    }
  }, [label?.ownerCode]);

  const loadScanData = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await userApi.getPublicScan(codeParam, { noCount: '1' });
      setScanData(res);
    } catch (err) {
      setLoadError(err.message || 'Không tìm thấy thông tin tem');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setFormError('');
  };

  const validate = () => {
    if (!form.name.trim()) return 'Vui lòng nhập tên NPP hoặc cá nhân đã mua sản phẩm';
    if (!form.address.trim()) return 'Vui lòng nhập địa chỉ';
    if (!PHONE_REGEX.test(form.phone.replace(/[\s.\-]/g, ''))) return 'Số điện thoại không hợp lệ';
    const activeSerial = (form.serial || detectedSerial || '').trim();
    if (!activeSerial) return 'Không tìm thấy serial chống giả của tem';
    return '';
  };

  // Phiên đăng nhập hết hạn → đăng nhập lại rồi quay về đúng form này
  const redirectToLogin = () => {
    sessionStorage.setItem('npp_redirect_after_login', JSON.stringify({
      path: `/select-store?code=${encodeURIComponent(label?.qrCode || serial)}`
    }));
    logout();
    navigate('/login?tab=npp', { replace: true });
  };

  const goToProductInfo = (data) => {
    navigate('/product-info', { replace: true, state: { scanData: data, serial } });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      const serialNumber = label?.serialNumber || serial;
      const cleanOwnerCode = ownerCode.trim();

      await userApi.submitSingleEntry({
        serialNumber,
        ownerName: form.name.trim(),
        ownerAddress: form.address.trim(),
        ownerPhone: form.phone.trim(),
        activatedSerial: form.serial.trim() || detectedSerial,
        ownerCode: cleanOwnerCode || null
      });

      // Save to local history for History page
      try {
        const localHistory = JSON.parse(localStorage.getItem('npp_scan_history') || '[]');
        const newHistoryItem = {
          productName: product?.name || 'Sản phẩm',
          serial: serialNumber,
          storeName: form.name.trim(),
          storeAddress: form.address.trim(),
          ownerCode: cleanOwnerCode || null,
          time: new Date().toISOString(),
        };
        localStorage.setItem('npp_scan_history', JSON.stringify([newHistoryItem, ...localHistory].slice(0, 50)));
      } catch (historyErr) {
        console.error('Save scan history error:', historyErr);
      }

      // Lấy lại dữ liệu mới nhất (có khối KH sở hữu) rồi hiển thị trang thông tin sản phẩm
      let freshData = null;
      try {
        freshData = await userApi.getPublicScan(serialNumber, { noCount: '1' });
      } catch (refreshErr) {
        console.error('Refresh scan data error:', refreshErr);
      }
      goToProductInfo(freshData || scanData);
    } catch (err) {
      const msg = err.message || '';
      if (/token|đăng nhập lại|yêu cầu đăng nhập/i.test(msg)) {
        redirectToLogin();
        return;
      }
      setFormError(msg || 'Không lưu được thông tin. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="store-page">
      {/* Header */}
      <div className="store-header">
        <button className="store-header-back" onClick={() => navigate(-1)} aria-label="Quay lại">
          <ArrowLeft size={22} />
        </button>
        <span className="store-header-title">Bổ sung thông tin KH sở hữu</span>
      </div>

      {/* Loading */}
      {loading && (
        <div className="store-list-loading">
          <div className="loading-ring" />
          <span>Đang tải thông tin tem...</span>
        </div>
      )}

      {/* Load error */}
      {!loading && loadError && (
        <div className="owner-state-box">
          <AlertCircle size={36} className="owner-state-icon" />
          <p>{loadError}</p>
          <button type="button" className="store-confirm-btn" onClick={loadScanData}>Thử lại</button>
        </div>
      )}

      {!loading && !loadError && scanData && (
        <form className="owner-form" onSubmit={handleSubmit} noValidate>
          {/* Product info bar */}
          <div className="store-product-bar">
            {product?.images?.[0] ? (
              <img src={product.images[0]} alt={product.name} className="store-product-img" />
            ) : (
              <div className="store-product-img-placeholder">
                <Package size={20} />
              </div>
            )}
            <div className="store-product-info">
              <div className="store-product-name">{product?.name || 'Sản phẩm'}</div>
              <div className="store-product-serial">
                <QrCode size={12} />
                Mã tem: <strong>{label?.serialNumber || serial}</strong>
              </div>
              {user && (
                <div className="store-product-serial">
                  <Store size={12} />
                  NPP thực hiện: <strong>{user.fullName || user.username}</strong>
                </div>
              )}
            </div>
          </div>

          {isBarcode && (
            <div className="owner-alert owner-alert--warning">
              <AlertCircle size={16} />
              <span>Mã vạch không gắn với một tem cụ thể. Vui lòng quét mã QR trên tem để kích hoạt.</span>
            </div>
          )}

          {/* Tem đã được kích hoạt trước đó */}
          {isActivated && (
            <div className="owner-activated-box">
              <div className="owner-activated-title">
                <UserCheck size={16} />
                <span>Tem đã được kích hoạt KH sở hữu</span>
              </div>
              <div className="owner-activated-row"><span>Tên:</span> <strong>{ownerInfo.name}</strong></div>
              {ownerInfo.address && <div className="owner-activated-row"><span>Địa chỉ:</span> {ownerInfo.address}</div>}
              {ownerInfo.phone && <div className="owner-activated-row"><span>SĐT:</span> {ownerInfo.phone}</div>}
              <div className="owner-activated-row"><span>Serial chống giả:</span> <strong>{ownerInfo.activatedSerial || label?.serialNumber}</strong></div>
              {isLocked && (
                <>
                  <p className="owner-activated-note">
                    Nhà phân phối không thể thay đổi thông tin này. Liên hệ Nhà sản xuất nếu cần chỉnh sửa.
                  </p>
                  <button type="button" className="owner-secondary-btn" onClick={() => goToProductInfo(scanData)}>
                    Xem thông tin sản phẩm
                  </button>
                </>
              )}
            </div>
          )}

          {!isLocked && !isBarcode && (
            <>
              <div className="store-manual-section">
                <div className="store-manual-form">
                  <div className="owner-form-title">
                    <ShieldCheck size={18} />
                    <span>Bổ sung thông tin KH sở hữu</span>
                  </div>

                  <div className="store-field-group">
                    <label className="store-field-label" htmlFor="owner-name">
                      <span className="owner-field-index">1</span>
                      <User size={15} />
                      <span>Tên NPP hoặc cá nhân đã mua sản phẩm <strong className="text-danger">*</strong></span>
                    </label>
                    <input
                      id="owner-name"
                      type="text"
                      className="store-field-input"
                      placeholder="VD: Đại lý Tuấn Hưng / Nguyễn Văn A"
                      value={form.name}
                      onChange={handleChange('name')}
                      maxLength={200}
                      autoComplete="name"
                    />
                  </div>

                  <div className="store-field-group">
                    <label className="store-field-label" htmlFor="owner-address">
                      <span className="owner-field-index">2</span>
                      <MapPin size={15} />
                      <span>Địa chỉ NPP hoặc cá nhân mua <strong className="text-danger">*</strong></span>
                    </label>
                    <input
                      id="owner-address"
                      type="text"
                      className="store-field-input"
                      placeholder="VD: 123 Giải Phóng, Phương Mai, Hà Nội"
                      value={form.address}
                      onChange={handleChange('address')}
                      maxLength={500}
                      autoComplete="street-address"
                    />
                  </div>

                  <div className="store-field-group">
                    <label className="store-field-label" htmlFor="owner-phone">
                      <span className="owner-field-index">3</span>
                      <Phone size={15} />
                      <span>Số điện thoại liên hệ <strong className="text-danger">*</strong></span>
                    </label>
                    <input
                      id="owner-phone"
                      type="tel"
                      inputMode="tel"
                      className="store-field-input"
                      placeholder="VD: 0987 552 336"
                      value={form.phone}
                      onChange={handleChange('phone')}
                      maxLength={20}
                      autoComplete="tel"
                    />
                  </div>

                  <div className="store-field-group">
                    <label className="store-field-label" htmlFor="owner-serial">
                      <span className="owner-field-index">4</span>
                      <Hash size={15} />
                      <span>Serial chống giả <strong className="text-danger">*</strong></span>
                    </label>
                    <input
                      id="owner-serial"
                      type="text"
                      className="store-field-input owner-serial-input"
                      placeholder="Tự động lấy từ tem quét"
                      value={form.serial || detectedSerial}
                      onChange={handleChange('serial')}
                      readOnly={Boolean(detectedSerial)}
                      style={detectedSerial ? {
                        backgroundColor: '#F8FAFC',
                        color: '#0D1B2A',
                        fontWeight: 700,
                        cursor: 'default',
                        border: '1.5px solid #CBD5E1'
                      } : {}}
                      maxLength={50}
                      autoComplete="off"
                      autoCapitalize="characters"
                    />
                    <p className="owner-field-help">Serial chống giả được tự động trích xuất từ con tem đã quét.</p>
                  </div>
                </div>
              </div>

              {/* Trường "Mã sở hữu" (Yêu cầu quan trọng của khách hàng) */}
              <div className="store-owner-code-card">
                <div className="store-field-group">
                  <div className="store-owner-code-header">
                    <label className="store-field-label" style={{ marginBottom: 0 }}>
                      <ShieldCheck size={16} color="#059669" />
                      <span style={{ fontWeight: 800, color: '#065f46' }}>Mã sở hữu sản phẩm</span>
                    </label>
                    <span className="store-owner-badge">Không bắt buộc</span>
                  </div>
                  <p className="store-owner-help">
                    Nhập serial trên con tem vào đây
                  </p>
                  <input
                    type="text"
                    className="store-field-input store-owner-input"
                    placeholder="Nhập serial trên con tem vào đây"
                    value={ownerCode}
                    onChange={(e) => setOwnerCode(e.target.value)}
                  />
                </div>
              </div>

              {formError && (
                <div className="owner-alert owner-alert--error" role="alert">
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              {/* Confirm button */}
              <div className="store-confirm-bar">
                <button
                  id="store-confirm-btn"
                  type="submit"
                  className="store-confirm-btn"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="btn-spinner" />
                      Đang lưu thông tin...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      Xác nhận kích hoạt
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      )}
    </div>
  );
}
