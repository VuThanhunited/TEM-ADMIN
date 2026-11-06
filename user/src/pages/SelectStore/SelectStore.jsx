import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Package, QrCode, CheckCircle, ShieldCheck, MapPin,
  User, Phone, AlertCircle, UserCheck, Store, Search, Camera, StopCircle,
  Clock, PlusCircle, X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import userApi from '../../services/api';
import './SelectStore.css';

const PHONE_REGEX = /^(\+84|84|0)\d{9,10}$/;

// Bỏ dấu tiếng Việt để gõ 1 từ không dấu (VD: "thanh") ra danh sách gần đúng nhất (Thành, Thánh, Thạnh...)
const removeVietnameseTones = (str = '') => {
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export default function SelectStore() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();

  const codeParam = searchParams.get('code') || '';
  const autoAssignParam = searchParams.get('autoAssign') === '1';
  const { scanData: stateScanData, serial: stateSerial, isBarcode } = location.state || {};
  const serial = stateSerial || codeParam;

  const [scanData, setScanData] = useState(stateScanData || null);
  const [loading, setLoading] = useState(!stateScanData);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const initialSerial = stateScanData?.label?.serialNumber || stateSerial || codeParam || '';
  const [form, setForm] = useState({ name: '', address: '', phone: '', serial: initialSerial });

  // Trường Mã sở hữu (NPP nhập tay hoặc tự động lấy serial)
  const [ownerCode, setOwnerCode] = useState('');

  // SERI ĐOẠN (Serial bắt đầu = serial vừa quét -> Serial cuối) dành riêng cho Thực phẩm chức năng (TPCN)
  const [endSerial, setEndSerial] = useState('');
  const [creatingStore, setCreatingStore] = useState(false);
  const [quickStoreNotice, setQuickStoreNotice] = useState('');
  const storeInputRef = useRef(null);

  // Danh sách Điểm bán (Bước 2 & Bước 3)
  const [stores, setStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [storeSearch, setStoreSearch] = useState('');
  const [selectedStore, setSelectedStore] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Phiên quét liên tiếp cho Điểm bán (Bước 4: Quét tiếp / Dừng)
  const [activeStoreSession, setActiveStoreSession] = useState(() => {
    try {
      const saved = localStorage.getItem('npp_active_store_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [assignedSuccess, setAssignedSuccess] = useState(null); // { serialNumber, serialStart, serialEnd, assignedCount, isRange, storeName, storeAddress, storePhone, soldAt }
  const [sessionStopped, setSessionStopped] = useState(false);
  const [warehouseCoords, setWarehouseCoords] = useState(null);
  const autoAssignedRef = useRef(false);

  // Ghi nhận tọa độ vị trí KHO quét khi gán Serial cho điểm bán
  useEffect(() => {
    if (navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setWarehouseCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        () => {},
        { enableHighAccuracy: false, timeout: 4000, maximumAge: 60000 }
      );
    }
  }, []);

  const product = scanData?.product;
  const label = scanData?.label;
  const enterprise = scanData?.enterprise;
  const detectedSerial = label?.serialNumber || serial || codeParam || '';
  const ownerInfo = label?.ownerInfo;
  const isActivated = Boolean(
    (ownerInfo?.activatedAt && ownerInfo?.name) ||
    label?.storeId ||
    label?.distributedAt ||
    (!label?.internalCode && label?.ownerCode && String(label.ownerCode).trim())
  );
  const isLocked = isActivated && user?.role === 'NPP';

  // Xác định tem thuộc giao diện Thực phẩm chức năng (TPCN) hay giao diện khác (Gia dụng, OCOP, Nông nghiệp...)
  const isFoodTheme = useMemo(() => {
    const normalizeTheme = (val) => (val === 'warranty' || val === 'warranty_solution' ? 'appliance' : val);
    const prodTheme = normalizeTheme(product?.theme);
    const batchTheme = normalizeTheme(label?.batchId?.theme || scanData?.theme || scanData?.template?.layout);
    const entTheme = normalizeTheme(enterprise?.displayConfig?.defaultTheme);
    const nonFood = ['appliance', 'ocop', 'agriculture', 'medical', 'cosmetics'];
    if (nonFood.includes(prodTheme) || nonFood.includes(batchTheme) || nonFood.includes(entTheme)) {
      return false;
    }
    if (['functional_food', 'food', 'staycool', 'vyphyto'].includes(prodTheme)) return true;
    if (['functional_food', 'food', 'staycool', 'vyphyto'].includes(batchTheme)) return true;
    if (['functional_food', 'food', 'staycool', 'vyphyto'].includes(entTheme)) return true;
    const text = `${product?.category || ''} ${product?.name || ''} ${enterprise?.name || ''}`.toLowerCase();
    if (text.includes('staycool') || text.includes('vyphyto') || text.includes('thực phẩm') || text.includes('tpcn') || text.includes('bảo vệ sức khỏe')) {
      return true;
    }
    return false;
  }, [product, label, enterprise, scanData]);

  // Tải danh sách Điểm bán đã tạo ở Bước 2
  useEffect(() => {
    const fetchStores = async () => {
      setLoadingStores(true);
      try {
        const res = await userApi.getRetailStores();
        const storeList = res?.stores || res?.data || [];
        setStores(storeList);
      } catch (err) {
        console.error('Lỗi tải danh sách điểm bán:', err);
      } finally {
        setLoadingStores(false);
      }
    };
    fetchStores();
  }, []);

  // Nếu đang trong phiên "Quét tiếp" cho 1 điểm bán đã chọn trước đó -> điền sẵn điểm bán đó
  useEffect(() => {
    if (activeStoreSession && activeStoreSession.name) {
      setSelectedStore(activeStoreSession);
      setStoreSearch(activeStoreSession.name);
      setForm(prev => ({
        ...prev,
        name: activeStoreSession.name || '',
        address: activeStoreSession.address || '',
        phone: activeStoreSession.phone || ''
      }));
    }
  }, [activeStoreSession]);

  useEffect(() => {
    if (!stateScanData && !codeParam) {
      navigate('/scan', { replace: true });
      return;
    }
    if (!stateScanData) {
      loadScanData();
    }
  }, []);

  useEffect(() => {
    const autoSerial = label?.serialNumber || serial || codeParam || '';
    if (autoSerial) {
      setForm(prev => ({
        ...prev,
        serial: label?.serialNumber ? label.serialNumber : (prev.serial || autoSerial)
      }));
    }
  }, [label?.serialNumber, serial, codeParam]);

  useEffect(() => {
    if (label?.internalCode || label?.ownerCode) {
      setOwnerCode(label.internalCode || label.ownerCode);
    }
  }, [label?.internalCode, label?.ownerCode]);

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

  // Bước 3: Lọc danh sách Điểm bán gần đúng nhất khi gõ 1 từ (VD: gõ "thanh" -> Thành, Thánh, Thạnh...)
  const filteredStores = useMemo(() => {
    const q = storeSearch.trim();
    if (!q) return stores;
    const qNorm = removeVietnameseTones(q);
    const qLower = q.toLowerCase();
    const tokens = qNorm.split(/\s+/).filter(Boolean);

    return stores
      .map(s => {
        const nameLower = (s.name || '').toLowerCase();
        const nameNorm = removeVietnameseTones(s.name || '');
        const addrNorm = removeVietnameseTones(s.address || '');
        const phoneNorm = (s.phone || '').toLowerCase();
        const words = nameNorm.split(/\s+/);

        let score = 0;
        if (nameLower.includes(qLower)) score += 100;
        if (nameNorm.startsWith(qNorm)) score += 80;
        if (words.some(w => w === qNorm)) score += 75;
        if (words.some(w => w.startsWith(qNorm))) score += 60;
        if (nameNorm.includes(qNorm)) score += 40;
        if (tokens.length > 1 && tokens.every(t => nameNorm.includes(t) || addrNorm.includes(t))) score += 35;
        if (addrNorm.includes(qNorm)) score += 20;
        if (phoneNorm.includes(qNorm)) score += 20;

        return { store: s, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.store);
  }, [stores, storeSearch]);

  const handleSelectStoreItem = (store) => {
    setSelectedStore(store);
    setStoreSearch(store.name);
    setForm(prev => ({
      ...prev,
      name: store.name || '',
      address: store.address || '',
      phone: store.phone || ''
    }));
    setShowDropdown(false);
    setFormError('');
  };

  const handleStoreSearchChange = (e) => {
    const val = e.target.value;
    setStoreSearch(val);
    setForm(prev => ({ ...prev, name: val }));
    if (selectedStore && selectedStore.name !== val) {
      setSelectedStore(null);
    }
    setShowDropdown(true);
    setFormError('');
  };

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setFormError('');
  };

  const validate = () => {
    const cleanPhone = (form.phone || '').trim().replace(/[\s.\-]/g, '');
    if (cleanPhone && !PHONE_REGEX.test(cleanPhone)) {
      return 'Số điện thoại không hợp lệ';
    }
    return '';
  };

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

  const handleBack = () => {
    if (scanData) {
      goToProductInfo(scanData);
    } else if (serial || codeParam) {
      navigate(`/trace/${encodeURIComponent(serial || codeParam)}`, { replace: true });
    } else {
      window.history.length > 1 ? navigate(-1) : navigate('/product-info', { replace: true });
    }
  };

  // Thêm nhanh Điểm bán ngay trên màn hình quét (theo nút [thêm mới] trong sơ đồ của khách)
  const handleQuickAddStore = async () => {
    setFormError('');
    setQuickStoreNotice('');
    // Nếu đang chọn sẵn 1 điểm bán cũ trong danh sách -> xóa trắng để nhập điểm bán mới
    if (selectedStore && storeSearch.trim().toLowerCase() === (selectedStore.name || '').trim().toLowerCase()) {
      setSelectedStore(null);
      setStoreSearch('');
      setForm(prev => ({ ...prev, name: '', address: '', phone: '' }));
      setShowDropdown(false);
      setQuickStoreNotice('Hãy nhập Tên điểm bán mới, Địa chỉ, SĐT rồi bấm "Lưu điểm bán" hoặc bấm "OK" để gán luôn.');
      setTimeout(() => storeInputRef.current?.focus(), 50);
      return;
    }

    const cleanName = (storeSearch || form.name || '').trim();
    if (!cleanName) {
      setQuickStoreNotice('Vui lòng nhập Tên điểm bán mới vào ô Điểm bán rồi bấm "Thêm mới".');
      setTimeout(() => storeInputRef.current?.focus(), 50);
      return;
    }

    setCreatingStore(true);
    try {
      const res = await userApi.createRetailStore({
        name: cleanName,
        address: (form.address || '').trim(),
        phone: (form.phone || '').trim()
      });
      const created = res?.store || res?.data || { name: cleanName, address: form.address, phone: form.phone };
      setStores(prev => [created, ...prev.filter(s => s._id !== created._id)]);
      setSelectedStore(created);
      setStoreSearch(created.name);
      setForm(prev => ({
        ...prev,
        name: created.name || cleanName,
        address: created.address || prev.address,
        phone: created.phone || prev.phone
      }));
      setShowDropdown(false);
      setQuickStoreNotice(`✅ Đã thêm mới điểm bán "${created.name}" thành công!`);
    } catch (err) {
      setFormError(err.message || 'Không thể thêm điểm bán mới');
    } finally {
      setCreatingStore(false);
    }
  };

  // Hàm thực thi gán Serial (hoặc SERI ĐOẠN) cho Điểm bán
  const executeAssignSerial = async (storeOverride = null) => {
    const targetStore = storeOverride || selectedStore;
    const storeName = (targetStore?.name || form.name || storeSearch || '').trim();
    const storeAddress = (targetStore?.address ?? form.address ?? '').trim();
    const storePhone = (targetStore?.phone ?? form.phone ?? '').trim();

    if (!storeOverride) {
      if (isFoodTheme && !storeName) {
        setFormError('Vui lòng chọn hoặc nhập tên Điểm bán trước khi bấm OK.');
        return;
      }
      const validationError = validate();
      if (validationError) {
        setFormError(validationError);
        return;
      }
    }

    setSubmitting(true);
    setFormError('');
    try {
      const serialNumber = label?.serialNumber || serial || codeParam;
      const cleanOwnerCode = ownerCode.trim() || label?.internalCode || serialNumber;
      const cleanEndSerial = isFoodTheme && !storeOverride ? endSerial.trim() : '';

      const res = await userApi.submitSingleEntry({
        serialNumber,
        endSerial: cleanEndSerial || undefined,
        storeId: targetStore?._id || null,
        distributorName: storeName,
        distributorAddress: storeAddress,
        ownerName: storeName,
        ownerAddress: storeAddress,
        ownerPhone: storePhone,
        activatedSerial: label?.serialNumber || form.serial.trim() || detectedSerial,
        ownerCode: cleanOwnerCode,
        warehouseLocation: {
          address: user?.address || storeAddress || '',
          lat: warehouseCoords?.lat ?? null,
          lng: warehouseCoords?.lng ?? null
        }
      });

      const soldAtTime = res?.distributedAt || new Date().toISOString();
      const resolvedStoreId = res?.storeId || targetStore?._id || null;
      const finalStoreName = storeName || user?.fullName || user?.username || 'Điểm bán';
      const isRangeAssigned = Boolean(res?.isRange && res?.assignedCount > 1);
      const displaySerialLabel = isRangeAssigned
        ? `${res.serialStart} → ${res.serialEnd} (${res.assignedCount} mã)`
        : (res?.serialNumber || serialNumber);

      // Cập nhật phiên Điểm bán hiện tại để phục vụ chức năng "Quét tiếp" (Bước 4)
      const prevSerials = activeStoreSession?._id === resolvedStoreId || activeStoreSession?.name === finalStoreName
        ? (activeStoreSession?.sessionSerials || [])
        : [];
      const updatedSessionSerials = [
        { serialNumber: displaySerialLabel, productName: product?.name || 'Sản phẩm', soldAt: soldAtTime },
        ...prevSerials.filter(s => s.serialNumber !== displaySerialLabel)
      ];

      const newSession = {
        _id: resolvedStoreId,
        name: finalStoreName,
        address: storeAddress,
        phone: storePhone,
        sessionSerials: updatedSessionSerials
      };
      if (isFoodTheme) {
        localStorage.setItem('npp_active_store_session', JSON.stringify(newSession));
        setActiveStoreSession(newSession);
      }
      setSessionStopped(false);

      // Lưu vào lịch sử quét trên máy
      try {
        const localHistory = JSON.parse(localStorage.getItem('npp_scan_history') || '[]');
        const newHistoryItem = {
          productName: product?.name || 'Sản phẩm',
          serial: displaySerialLabel,
          storeName: finalStoreName,
          storeAddress,
          ownerCode: cleanOwnerCode,
          time: soldAtTime,
        };
        localStorage.setItem('npp_scan_history', JSON.stringify([newHistoryItem, ...localHistory].slice(0, 50)));
      } catch (historyErr) {
        console.error('Save scan history error:', historyErr);
      }

      // Cập nhật lại scanData mới nhất
      try {
        const freshData = await userApi.getPublicScan(serialNumber, { noCount: '1' });
        if (freshData) setScanData(freshData);
      } catch {
        // ignore
      }

      setAssignedSuccess({
        serialNumber: displaySerialLabel,
        isRange: isRangeAssigned,
        serialStart: res?.serialStart || serialNumber,
        serialEnd: res?.serialEnd || serialNumber,
        assignedCount: res?.assignedCount || 1,
        storeName: finalStoreName,
        storeAddress,
        storePhone,
        soldAt: soldAtTime
      });
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

  // Tự động gán Serial ngay khi đang ở chế độ "Quét tiếp" (autoAssign=1) cho điểm bán đã chọn (Bước 4)
  useEffect(() => {
    if (
      autoAssignParam &&
      activeStoreSession?.name &&
      scanData &&
      !loading &&
      !isLocked &&
      !isBarcode &&
      !autoAssignedRef.current
    ) {
      autoAssignedRef.current = true;
      executeAssignSerial(activeStoreSession);
    }
  }, [autoAssignParam, activeStoreSession, scanData, loading, isLocked, isBarcode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await executeAssignSerial();
  };

  // Bước 4 - Hướng 1: Bấm "QUÉT TIẾP" -> Mã kế tiếp sẽ tự động thuộc về Điểm bán đã chọn
  const handleContinueScanSameStore = () => {
    navigate('/scan?continueStore=1', { replace: true });
  };

  // Bước 4 - Hướng 2: Bấm "DỪNG" -> Kết thúc phiên điểm bán hiện tại, lần quét mới sẽ chọn điểm bán mới
  const handleStopStoreSession = () => {
    localStorage.removeItem('npp_active_store_session');
    setActiveStoreSession(null);
    setSelectedStore(null);
    setStoreSearch('');
    setForm(prev => ({ ...prev, name: '', address: '', phone: '' }));
    setSessionStopped(true);
  };

  // Quét mới và chọn điểm bán tiếp sau khi đã bấm Dừng
  const handleScanNewStore = () => {
    localStorage.removeItem('npp_active_store_session');
    navigate('/scan', { replace: true });
  };

  return (
    <div className="store-page">
      {/* Header */}
      <div className="store-header">
        <button className="store-header-back" onClick={handleBack} aria-label="Quay lại">
          <ArrowLeft size={22} />
        </button>
        <span className="store-header-title">Chọn Điểm bán & Kích hoạt Serial</span>
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

      {/* MÀN HÌNH SAU KHI GÁN SERIAL CHO ĐIỂM BÁN -> 2 HƯỚNG: QUÉT TIẾP / DỪNG (Bước 4) */}
      {!loading && !loadError && scanData && assignedSuccess && (
        <div className="owner-form" style={{ paddingBottom: '32px' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
              border: '2px solid #10b981',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '16px',
              textAlign: 'center',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.15)'
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#10b981',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}
            >
              <CheckCircle size={32} />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: '1.15rem', fontWeight: 800, color: '#065f46' }}>
              Đã gán Serial cho Điểm bán thành công!
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#047857' }}>
              Dữ liệu đã được cập nhật vào Bảng Quản lý Điểm bán
            </p>

            <div
              style={{
                marginTop: '14px',
                background: '#ffffff',
                borderRadius: '12px',
                padding: '14px',
                textAlign: 'left',
                border: '1px solid #a7f3d0',
                fontSize: '0.9rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div>
                <span style={{ color: '#64748b' }}>Điểm bán: </span>
                <strong style={{ color: '#0f172a', fontSize: '1rem' }}>{assignedSuccess.storeName}</strong>
              </div>
              {assignedSuccess.storeAddress && (
                <div>
                  <span style={{ color: '#64748b' }}>Địa chỉ: </span>
                  <span style={{ color: '#334155' }}>{assignedSuccess.storeAddress}</span>
                </div>
              )}
              {assignedSuccess.storePhone && (
                <div>
                  <span style={{ color: '#64748b' }}>Điện thoại: </span>
                  <span style={{ color: '#334155' }}>{assignedSuccess.storePhone}</span>
                </div>
              )}
              <div>
                <span style={{ color: '#64748b' }}>Serial vừa bán: </span>
                <strong style={{ color: '#059669', fontFamily: 'monospace', fontSize: '1rem' }}>
                  {assignedSuccess.serialNumber}
                </strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Thời gian: </span>
                <strong style={{ color: '#334155' }}>{formatDateTime(assignedSuccess.soldAt)}</strong>
              </div>
            </div>
          </div>

          {/* 2 HƯỚNG THAO TÁC THEO BƯỚC 4: QUÉT TIẾP HOẶC DỪNG */}
          {!sessionStopped ? (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '18px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
                marginBottom: '16px'
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#1e293b', marginBottom: '6px', textAlign: 'center' }}>
                Chọn thao tác tiếp theo
              </div>
              <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '0 0 16px', textAlign: 'center' }}>
                Bấm <strong>Quét tiếp</strong> để mã kế tiếp tự động gán cho <strong>{assignedSuccess.storeName}</strong>, hoặc bấm <strong>Dừng</strong> để kết thúc điểm bán này.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  type="button"
                  onClick={handleContinueScanSameStore}
                  style={{
                    width: '100%',
                    padding: '15px 18px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    boxShadow: '0 6px 16px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <Camera size={22} />
                  <span>QUÉT TIẾP (Cho: {assignedSuccess.storeName})</span>
                </button>

                <button
                  type="button"
                  onClick={handleStopStoreSession}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    border: '2px solid #ef4444',
                    background: '#fef2f2',
                    color: '#dc2626',
                    fontWeight: 800,
                    fontSize: '0.98rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    cursor: 'pointer'
                  }}
                >
                  <StopCircle size={20} />
                  <span>DỪNG (Kết thúc điểm bán này)</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                background: '#fffbeb',
                borderRadius: '16px',
                padding: '18px',
                border: '1.5px solid #f59e0b',
                marginBottom: '16px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#b45309', marginBottom: '6px' }}>
                🛑 Đã dừng phiên quét của điểm bán: {assignedSuccess.storeName}
              </div>
              <p style={{ fontSize: '0.85rem', color: '#92400e', margin: '0 0 14px' }}>
                Khi quét mã mới tiếp theo, bạn sẽ chọn lại Điểm bán mới.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleScanNewStore}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.98rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <Camera size={20} />
                  <span>Quét mới & Chọn điểm bán tiếp theo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAssignedSuccess(null);
                    setSessionStopped(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  Đổi điểm bán khác cho mã {assignedSuccess.serialNumber}
                </button>
              </div>
            </div>
          )}

          {/* Danh sách các serial vừa quét trong phiên hiện tại của Điểm bán */}
          {activeStoreSession?.sessionSerials?.length > 0 && (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '14px',
                padding: '14px 16px',
                border: '1px solid #e2e8f0',
                marginBottom: '16px'
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#334155', marginBottom: '8px' }}>
                📋 Các Serial vừa xuất cho {activeStoreSession.name} ({activeStoreSession.sessionSerials.length} mã):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                {activeStoreSession.sessionSerials.map((item, idx) => (
                  <div
                    key={item.serialNumber + idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      background: idx === 0 ? '#f0fdf4' : '#f8fafc',
                      border: idx === 0 ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                      fontSize: '0.82rem'
                    }}
                  >
                    <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#059669' }}>
                      #{idx + 1} • {item.serialNumber}
                    </span>
                    <span style={{ color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      {formatDateTime(item.soldAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nút phụ: Xem trang thông tin sản phẩm hoặc mở Bảng Quản lý Điểm bán */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="owner-secondary-btn"
              style={{ flex: 1, marginTop: 0 }}
              onClick={() => goToProductInfo(scanData)}
            >
              Xem giao diện sản phẩm
            </button>
            <button
              type="button"
              className="owner-secondary-btn"
              style={{ flex: 1, marginTop: 0, borderColor: '#6366f1', color: '#4f46e5' }}
              onClick={() => {
                navigate('/npp/stores');
              }}
            >
              Bảng Quản lý Điểm bán
            </button>
          </div>
        </div>
      )}

      {/* FORM CHỌN ĐIỂM BÁN & KÍCH HOẠT SERIAL (Bước 3) */}
      {!loading && !loadError && scanData && !assignedSuccess && (
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
                SERIAL chống làm giả: <strong>{label?.serialNumber || serial}</strong>
              </div>
              {user && (
                <div className="store-product-serial">
                  <Store size={12} />
                  NPP thực hiện: <strong>{user.fullName || user.username}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Thông báo nếu đang trong phiên Quét tiếp cho 1 điểm bán */}
          {activeStoreSession?.name && (
            <div
              style={{
                background: '#eff6ff',
                border: '1.5px solid #3b82f6',
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px'
              }}
            >
              <div style={{ fontSize: '0.86rem', color: '#1e3a8a' }}>
                <div><strong>🏪 Phiên quét liên tiếp:</strong> {activeStoreSession.name}</div>
                <div style={{ fontSize: '0.78rem', color: '#3b82f6' }}>
                  Bấm Xác nhận bên dưới để gán mã <strong>{label?.serialNumber || serial}</strong> hoặc bấm Dừng để chọn điểm bán khác.
                </div>
              </div>
              <button
                type="button"
                onClick={handleStopStoreSession}
                style={{
                  background: '#fee2e2',
                  color: '#dc2626',
                  border: '1px solid #fca5a5',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                🛑 Dừng
              </button>
            </div>
          )}

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
                <span>Tem đã được xuất cho Điểm bán / KH sở hữu</span>
              </div>
              <div className="owner-activated-row"><span>Điểm bán / KH:</span> <strong>{ownerInfo?.name || label?.distributorName}</strong></div>
              {(ownerInfo?.address || label?.distributorAddress) && (
                <div className="owner-activated-row"><span>Địa chỉ:</span> {ownerInfo?.address || label?.distributorAddress}</div>
              )}
              {ownerInfo?.phone && <div className="owner-activated-row"><span>SĐT:</span> {ownerInfo.phone}</div>}
              <div className="owner-activated-row">
                <span>Serial đã kích hoạt:</span>{' '}
                <strong>{label?.internalCode || label?.ownerCode || ownerInfo?.activatedSerial || label?.serialNumber}</strong>
              </div>
              {isLocked && (
                <>
                  <p className="owner-activated-note">
                    Tem này đã được gán điểm bán. Bạn có thể bấm Quét tiếp mã khác hoặc Dừng phiên.
                  </p>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    {activeStoreSession?.name && (
                      <button
                        type="button"
                        className="store-confirm-btn"
                        style={{ flex: 1 }}
                        onClick={handleContinueScanSameStore}
                      >
                        <Camera size={18} /> Quét tiếp ({activeStoreSession.name})
                      </button>
                    )}
                    <button
                      type="button"
                      className="owner-secondary-btn"
                      style={{ flex: 1, marginTop: 0 }}
                      onClick={() => goToProductInfo(scanData)}
                    >
                      Xem thông tin sản phẩm
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {!isLocked && !isBarcode && isFoodTheme && (
            <>
              {/* GIAO DIỆN RIÊNG CHO THỰC PHẨM CHỨC NĂNG (TPCN): ĐIỂM BÁN + THÊM MỚI + ĐỊA CHỈ + SĐT + KHUNG SERI ĐOẠN + QUÉT TIẾP / KẾT THÚC */}
              <div className="store-manual-section" style={{ marginBottom: '14px' }}>
                <div className="store-manual-form">
                  <div className="owner-form-title" style={{ justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Store size={18} color="#059669" />
                      <span>Thông tin Điểm bán &amp; Gán Serial (TPCN)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/npp/stores')}
                      style={{ background: 'none', border: 'none', padding: 0, fontSize: '0.78rem', color: '#2563eb', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Bảng Điểm bán →
                    </button>
                  </div>

                  {/* Hàng 1: Điểm bán [ gõ vài ký tự gợi nhớ ] [ thêm mới ] */}
                  <div className="store-field-group" style={{ position: 'relative' }}>
                    <label className="store-field-label" htmlFor="store-search-input">
                      <Store size={15} color="#059669" />
                      <span style={{ fontWeight: 700 }}>Điểm bán</span>
                      <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 500 }}>
                        (Gõ vài ký tự gợi nhớ để chọn hoặc bấm Thêm mới)
                      </span>
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <input
                          ref={storeInputRef}
                          id="store-search-input"
                          type="text"
                          className="store-field-input"
                          placeholder="Gõ vài ký tự gợi nhớ (VD: thanh, minh...)"
                          value={storeSearch}
                          onFocus={() => setShowDropdown(true)}
                          onChange={handleStoreSearchChange}
                          autoComplete="off"
                          style={{
                            width: '100%',
                            paddingRight: '34px',
                            borderColor: selectedStore ? '#10b981' : '#334155',
                            borderWidth: '2px',
                            background: selectedStore ? '#f0fdf4' : '#ffffff',
                            fontWeight: selectedStore ? 700 : 600
                          }}
                        />
                        {storeSearch && (
                          <button
                            type="button"
                            onClick={() => {
                              setStoreSearch('');
                              setSelectedStore(null);
                              setForm(prev => ({ ...prev, name: '', address: '', phone: '' }));
                              setShowDropdown(true);
                            }}
                            style={{
                              position: 'absolute',
                              right: '8px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              color: '#64748b',
                              cursor: 'pointer',
                              padding: '4px'
                            }}
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleQuickAddStore}
                        disabled={creatingStore}
                        style={{
                          padding: '0 14px',
                          borderRadius: '10px',
                          border: '2px solid #0f172a',
                          background: '#f8fafc',
                          color: '#0f172a',
                          fontWeight: 800,
                          fontSize: '0.86rem',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <PlusCircle size={15} color="#059669" />
                        <span>{creatingStore ? 'Đang lưu...' : 'thêm mới'}</span>
                      </button>
                    </div>

                    {quickStoreNotice && (
                      <div style={{ marginTop: '6px', fontSize: '0.79rem', color: '#059669', fontWeight: 600 }}>
                        {quickStoreNotice}
                      </div>
                    )}

                    {/* Dropdown danh sách Điểm bán gợi ý gần đúng nhất */}
                    {showDropdown && (
                      <div
                        style={{
                          marginTop: '6px',
                          background: '#ffffff',
                          border: '1.5px solid #cbd5e1',
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px rgba(15, 23, 42, 0.12)',
                          maxHeight: '220px',
                          overflowY: 'auto',
                          zIndex: 30
                        }}
                      >
                        {loadingStores ? (
                          <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
                            Đang tải danh sách điểm bán...
                          </div>
                        ) : filteredStores.length === 0 ? (
                          <div style={{ padding: '12px 14px', fontSize: '0.84rem', color: '#475569' }}>
                            <div>Chưa có điểm bán khớp với &ldquo;<strong>{storeSearch}</strong>&rdquo;.</div>
                            <div style={{ fontSize: '0.78rem', color: '#059669', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <PlusCircle size={14} />
                              Nhập thêm Địa chỉ, SĐT bên dưới rồi bấm <strong>thêm mới</strong> hoặc bấm <strong>OK</strong> để tạo và gán luôn!
                            </div>
                          </div>
                        ) : (
                          filteredStores.map((s) => {
                            const isSelected = selectedStore?._id === s._id;
                            return (
                              <div
                                key={s._id}
                                onClick={() => handleSelectStoreItem(s)}
                                style={{
                                  padding: '10px 14px',
                                  borderBottom: '1px solid #f1f5f9',
                                  cursor: 'pointer',
                                  background: isSelected ? '#ecfdf5' : '#ffffff',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '2px'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <strong style={{ color: '#0f172a', fontSize: '0.93rem' }}>
                                    🏪 {s.name}
                                  </strong>
                                  <span
                                    style={{
                                      fontSize: '0.74rem',
                                      background: '#e0e7ff',
                                      color: '#4338ca',
                                      padding: '2px 8px',
                                      borderRadius: '99px',
                                      fontWeight: 700
                                    }}
                                  >
                                    Đã bán: {s.totalSerials || 0} mã
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                  📍 {s.address || 'Chưa cập nhật địa chỉ'} {s.phone ? `• 📞 ${s.phone}` : ''}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  {/* Hàng 2: Địa chỉ */}
                  <div className="store-field-group">
                    <label className="store-field-label" htmlFor="owner-address">
                      <MapPin size={15} color="#059669" />
                      <span style={{ fontWeight: 700 }}>Địa chỉ</span>
                    </label>
                    <input
                      id="owner-address"
                      type="text"
                      className="store-field-input"
                      placeholder="Địa chỉ điểm bán (tự động điền hoặc nhập mới)"
                      value={form.address}
                      onChange={handleChange('address')}
                      maxLength={500}
                      style={{ borderWidth: '2px', borderColor: '#334155' }}
                    />
                  </div>

                  {/* Hàng 3: SDT */}
                  <div className="store-field-group">
                    <label className="store-field-label" htmlFor="owner-phone">
                      <Phone size={15} color="#059669" />
                      <span style={{ fontWeight: 700 }}>SDT</span>
                    </label>
                    <input
                      id="owner-phone"
                      type="tel"
                      inputMode="tel"
                      className="store-field-input"
                      placeholder="Số điện thoại liên hệ điểm bán"
                      value={form.phone}
                      onChange={handleChange('phone')}
                      maxLength={20}
                      style={{ borderWidth: '2px', borderColor: '#334155' }}
                    />
                  </div>
                </div>
              </div>

              {/* KHUNG SERI ĐOẠN (Theo đúng thiết kế của Tổng Kho Vyphyto) */}
              <div
                className="store-owner-code-card"
                style={{
                  border: '2px solid #0f172a',
                  borderRadius: '14px',
                  padding: '16px',
                  background: '#ffffff',
                  marginBottom: '14px'
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    color: '#0f172a',
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>📦 SERI ĐOẠN (Gán 1 mã hoặc cả đoạn Serial)</span>
                  <span style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700, textTransform: 'none' }}>
                    Mặc định gán mã đang quét
                  </span>
                </div>

                {/* Dòng 1: Seri hiện đang quét */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    marginBottom: '12px'
                  }}
                >
                  <label style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', flex: '1 1 auto' }}>
                    Seri hiện đang quét
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={label?.serialNumber || serial}
                    style={{
                      width: '150px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '2px solid #0f172a',
                      background: '#f1f5f9',
                      color: '#0f172a',
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      fontSize: '1rem',
                      textAlign: 'center'
                    }}
                  />
                </div>

                {/* Dòng 2: serial cuối [ 0000010 ] [ ok ] */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <label
                    htmlFor="end-serial-input"
                    style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', flex: '1 1 auto' }}
                  >
                    serial cuối
                  </label>
                  <input
                    id="end-serial-input"
                    type="text"
                    placeholder={label?.serialNumber || 'VD: 00000010'}
                    value={endSerial}
                    onChange={(e) => setEndSerial(e.target.value)}
                    style={{
                      width: '130px',
                      padding: '10px 10px',
                      borderRadius: '8px',
                      border: '2px solid #0f172a',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      fontSize: '0.98rem',
                      textAlign: 'center'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      minWidth: '58px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '2px solid #0f172a',
                      background: '#059669',
                      color: '#ffffff',
                      fontWeight: 900,
                      fontSize: '0.98rem',
                      cursor: 'pointer'
                    }}
                  >
                    {submitting ? '...' : 'ok'}
                  </button>
                </div>

                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '8px', lineHeight: 1.4 }}>
                  💡 Để trống <strong>serial cuối</strong> rồi bấm <strong>ok</strong> nếu chỉ gán 1 mã <strong>{label?.serialNumber || serial}</strong>. Nếu nhập <strong>serial cuối</strong> (VD: 00000010) rồi bấm <strong>ok</strong>, hệ thống sẽ gán cả đoạn từ <strong>{label?.serialNumber || serial}</strong> đến số cuối cho Điểm bán.
                </div>
              </div>

              {formError && (
                <div className="owner-alert owner-alert--error" role="alert">
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              {/* 2 NÚT HÀNH ĐỘNG BÊN DƯỚI THEO SƠ ĐỒ: [ quét tiếp ] [ kết thúc ] */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={async () => {
                    // Nếu chưa gán mã đang quét mà đã chọn điểm bán -> gán luôn rồi chuyển sang Quét tiếp
                    const storeName = (selectedStore?.name || form.name || storeSearch || '').trim();
                    if (storeName) {
                      await executeAssignSerial();
                    }
                    navigate('/scan?continueStore=1', { replace: true });
                  }}
                  style={{
                    flex: 1,
                    padding: '14px 16px',
                    borderRadius: '10px',
                    border: '2px solid #0f172a',
                    background: '#ecfdf5',
                    color: '#065f46',
                    fontWeight: 800,
                    fontSize: '0.98rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Camera size={18} />
                  <span>quét tiếp</span>
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    handleStopStoreSession();
                    navigate(`/trace/${encodeURIComponent(label?.qrCode || label?.serialNumber || serial)}`, { replace: true });
                  }}
                  style={{
                    flex: 1,
                    padding: '14px 16px',
                    borderRadius: '10px',
                    border: '2px solid #0f172a',
                    background: '#fef2f2',
                    color: '#dc2626',
                    fontWeight: 800,
                    fontSize: '0.98rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <StopCircle size={18} />
                  <span>kết thúc</span>
                </button>
              </div>
            </>
          )}

          {/* GIAO DIỆN MẶC ĐỊNH CHO CÁC THEME KHÁC (Bảo hành Gia dụng, OCOP, Nông nghiệp...): Giữ nguyên form Bổ sung thông tin KH sở hữu */}
          {!isLocked && !isBarcode && !isFoodTheme && (
            <>
              <div className="store-manual-section" style={{ marginBottom: '14px' }}>
                <div className="store-manual-form">
                  <div className="owner-form-title">
                    <User size={18} color="#059669" />
                    <span>Bổ sung thông tin Khách hàng sở hữu</span>
                  </div>

                  <div className="store-field-group">
                    <label className="store-field-label" htmlFor="owner-name-std">
                      <span className="owner-field-index">1</span>
                      <User size={15} />
                      <span>Tên Khách hàng / Đại lý sở hữu</span>
                    </label>
                    <input
                      id="owner-name-std"
                      type="text"
                      className="store-field-input"
                      placeholder="Nhập họ tên khách hàng hoặc đại lý"
                      value={form.name}
                      onChange={handleChange('name')}
                      maxLength={200}
                    />
                  </div>

                  <div className="store-field-group">
                    <label className="store-field-label" htmlFor="owner-address-std">
                      <span className="owner-field-index">2</span>
                      <MapPin size={15} />
                      <span>Địa chỉ</span>
                    </label>
                    <input
                      id="owner-address-std"
                      type="text"
                      className="store-field-input"
                      placeholder="Nhập địa chỉ"
                      value={form.address}
                      onChange={handleChange('address')}
                      maxLength={500}
                    />
                  </div>

                  <div className="store-field-group">
                    <label className="store-field-label" htmlFor="owner-phone-std">
                      <span className="owner-field-index">3</span>
                      <Phone size={15} />
                      <span>Số điện thoại</span>
                    </label>
                    <input
                      id="owner-phone-std"
                      type="tel"
                      inputMode="tel"
                      className="store-field-input"
                      placeholder="Nhập số điện thoại"
                      value={form.phone}
                      onChange={handleChange('phone')}
                      maxLength={20}
                    />
                  </div>
                </div>
              </div>

              <div className="store-owner-code-card">
                <div className="store-field-group">
                  <div className="store-owner-code-header">
                    <label className="store-field-label" style={{ marginBottom: 0 }}>
                      <ShieldCheck size={16} color="#059669" />
                      <span style={{ fontWeight: 800, color: '#065f46' }}>Mã nội bộ / Mã sở hữu sản phẩm</span>
                    </label>
                    <span className="store-owner-badge">
                      {label?.internalCode ? `Mã nội bộ đã import: ${label.internalCode}` : 'Tự động nhận Serial nếu để trống'}
                    </span>
                  </div>
                  <input
                    type="text"
                    className="store-field-input store-owner-input"
                    placeholder={`Mặc định: ${label?.internalCode || label?.serialNumber || serial}`}
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

              <div className="store-confirm-bar">
                <button
                  id="store-confirm-btn"
                  type="submit"
                  className="store-confirm-btn"
                  disabled={submitting}
                >
                  {submitting ? 'Đang lưu thông tin...' : 'Xác nhận lưu thông tin'}
                </button>
              </div>
            </>
          )}
        </form>
      )}
    </div>
  );
}
