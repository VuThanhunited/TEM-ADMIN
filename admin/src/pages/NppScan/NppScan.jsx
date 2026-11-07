import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Zap, ZapOff, CheckCircle, Camera, AlertCircle, Store, Search,
  StopCircle, Clock, X, PlusCircle
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import './NppScan.css';

const SCAN_FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.CODE_128
];

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

export default function NppScan() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const html5QrcodeRef = useRef(null);
  const lastScanRef = useRef({ text: null, time: 0 });

  const [cameraStatus, setCameraStatus] = useState('loading'); // 'loading' | 'active' | 'denied' | 'error'
  const [flashOn, setFlashOn] = useState(false);
  const [detected, setDetected] = useState(false);
  const [detectedSerial, setDetectedSerial] = useState('');
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState({ totalPrinted: 0, totalImported: 0 });

  // Danh sách Điểm bán (Bước 2 & Bước 3)
  const [stores, setStores] = useState([]);
  const [storeSearch, setStoreSearch] = useState('');
  const [selectedStore, setSelectedStore] = useState(() => {
    try {
      const saved = localStorage.getItem('npp_active_store_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);

  // Trạng thái xử lý sau khi quét 1 mã QR (Bước 3 & Bước 4 + SERI ĐOẠN theo yêu cầu Vyphyto)
  // 'scanning' | 'choose_store' | 'assigned_action'
  const [scanStep, setScanStep] = useState('scanning');
  const [pendingSerial, setPendingSerial] = useState('');
  const [endSerial, setEndSerial] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [addingStore, setAddingStore] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [lastAssigned, setLastAssigned] = useState(null); // { serialNumber, endSerial, assignedCount, storeName, storeAddress, soldAt }
  const [sessionSerials, setSessionSerials] = useState([]);
  const [warehouseCoords, setWarehouseCoords] = useState(null);
  const selectedStoreRef = useRef(selectedStore);

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

  useEffect(() => {
    selectedStoreRef.current = selectedStore;
    if (selectedStore?.name) {
      setStoreSearch(selectedStore.name);
      setStoreAddress(selectedStore.address || '');
      setStorePhone(selectedStore.phone || '');
    }
  }, [selectedStore]);

  // Tải danh sách Điểm bán và lịch sử
  useEffect(() => {
    api.nppGetHistory().then(res => {
      setStats({
        totalPrinted: res.totalPrinted || 0,
        totalImported: res.totalImported !== undefined ? res.totalImported : (res.history?.length || 0)
      });
    }).catch(() => {});

    api.getRetailStores({ includeStats: '0' }).then(res => {
      const list = res.stores || res.data || [];
      setStores(list);
      const queryStoreId = searchParams.get('storeId');
      if (queryStoreId) {
        const found = list.find(s => String(s._id) === String(queryStoreId));
        if (found) {
          setSelectedStore(found);
          setStoreSearch(found.name);
          localStorage.setItem('npp_active_store_session', JSON.stringify(found));
        }
      }
    }).catch(() => {});
  }, [searchParams]);

  // Lọc Điểm bán gần đúng nhất khi gõ 1 từ (VD: gõ "thanh" -> Thành, Thánh, Thạnh...)
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

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const applyMobileOptimizations = async () => {
    try {
      const track = html5QrcodeRef.current?.getRunningTrack?.();
      if (!track || typeof track.getCapabilities !== 'function') return;
      const caps = track.getCapabilities();
      const advanced = {};
      if (Array.isArray(caps.focusMode) && caps.focusMode.includes('continuous')) {
        advanced.focusMode = 'continuous';
      }
      if (Object.keys(advanced).length > 0) {
        await track.applyConstraints({ advanced: [advanced] });
      }
    } catch {
      // ignore
    }
  };

  const stopCamera = useCallback(async () => {
    if (html5QrcodeRef.current?.isScanning) {
      try {
        await html5QrcodeRef.current.stop();
      } catch (err) {
        console.error('Failed to stop camera:', err);
      }
    }
  }, []);

  const handleQuickAddStore = async () => {
    const cleanName = storeSearch.trim();
    if (!cleanName) {
      showToast('error', '⚠️ Vui lòng nhập tên Điểm bán trước khi bấm Thêm mới.');
      return;
    }
    setAddingStore(true);
    try {
      const res = await api.createRetailStore({
        name: cleanName,
        address: storeAddress.trim(),
        phone: storePhone.trim()
      });
      const created = res.store || res.data || {
        name: cleanName,
        address: storeAddress.trim(),
        phone: storePhone.trim()
      };
      setStores(prev => {
        const exists = prev.some(s => String(s._id) === String(created._id));
        return exists ? prev.map(s => (String(s._id) === String(created._id) ? created : s)) : [created, ...prev];
      });
      setSelectedStore(created);
      setStoreSearch(created.name);
      setStoreAddress(created.address || '');
      setStorePhone(created.phone || '');
      localStorage.setItem('npp_active_store_session', JSON.stringify(created));
      setShowStoreDropdown(false);
      showToast('success', `✅ Đã thêm mới điểm bán: ${created.name}`);
    } catch (err) {
      showToast('error', `❌ ${err.message || 'Không thể thêm điểm bán mới'}`);
    } finally {
      setAddingStore(false);
    }
  };

  const assignSerialToStore = async (serialNumber, storeObj, customEndSerial = endSerial) => {
    const targetName = (storeObj?.name || storeSearch || '').trim();
    const targetAddress = (storeObj?.address !== undefined ? storeObj.address : storeAddress).trim();
    const targetPhone = (storeObj?.phone !== undefined ? storeObj.phone : storePhone).trim();
    if (!serialNumber || !targetName) {
      showToast('error', '⚠️ Vui lòng chọn hoặc nhập tên Điểm bán.');
      return false;
    }
    setAssigning(true);
    try {
      const cleanEnd = String(customEndSerial || '').trim();
      const res = await api.nppScanSerial({
        serialNumber,
        endSerial: cleanEnd || undefined,
        storeId: storeObj?._id || null,
        distributorName: targetName,
        distributorAddress: targetAddress,
        ownerName: targetName,
        ownerAddress: targetAddress,
        ownerPhone: targetPhone,
        activatedSerial: serialNumber,
        ownerCode: serialNumber,
        warehouseLocation: {
          address: user?.address || targetAddress || '',
          lat: warehouseCoords?.lat ?? null,
          lng: warehouseCoords?.lng ?? null
        }
      });

      const soldAt = res.distributedAt || new Date().toISOString();
      const assignedCount = res.assignedCount || 1;
      const resolvedEnd = res.endSerial || cleanEnd || serialNumber;
      const serialDisplay = assignedCount > 1 || (cleanEnd && cleanEnd !== serialNumber)
        ? `${serialNumber} → ${resolvedEnd} (${assignedCount} tem)`
        : serialNumber;

      const resolvedStore = {
        _id: res.storeId || storeObj?._id || null,
        name: targetName,
        address: targetAddress,
        phone: targetPhone
      };

      setSelectedStore(resolvedStore);
      localStorage.setItem('npp_active_store_session', JSON.stringify(resolvedStore));

      setLastAssigned({
        serialNumber: serialDisplay,
        rawStartSerial: serialNumber,
        rawEndSerial: resolvedEnd,
        assignedCount,
        storeName: resolvedStore.name,
        storeAddress: resolvedStore.address,
        storePhone: resolvedStore.phone,
        soldAt
      });
      setSessionSerials(prev => [
        { serialNumber: serialDisplay, soldAt },
        ...prev.filter(item => item.serialNumber !== serialDisplay)
      ]);
      setStats(prev => ({ ...prev, totalImported: prev.totalImported + assignedCount }));
      setScanStep('assigned_action');
      showToast('success', res.message || `✅ Đã gán Serial ${serialDisplay} cho điểm bán: ${resolvedStore.name}`);
      return true;
    } catch (err) {
      showToast('error', `❌ ${err.message || 'Lỗi khi gán serial cho điểm bán'}`);
      setScanStep('choose_store');
      return false;
    } finally {
      setAssigning(false);
    }
  };

  const startCamera = useCallback(async () => {
    setCameraStatus('loading');
    try {
      if (!html5QrcodeRef.current) {
        html5QrcodeRef.current = new Html5Qrcode('npp-reader', {
          formatsToSupport: SCAN_FORMATS,
          useBarCodeDetectorIfSupported: true,
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
          verbose: false
        });
      }

      if (html5QrcodeRef.current.isScanning) {
        setCameraStatus('active');
        return;
      }

      const mobileScanConfig = {
        fps: 12,
        disableFlip: true
      };

      const onSuccess = (decodedText, decodedResult) => handleScanSuccess(decodedText, decodedResult);
      const onFailure = () => {};

      try {
        await html5QrcodeRef.current.start(
          { facingMode: 'environment' },
          mobileScanConfig,
          onSuccess,
          onFailure
        );
      } catch (envErr) {
        const envErrStr = String(envErr);
        if (envErrStr.includes('NotAllowedError') || envErrStr.includes('PermissionDeniedError')) {
          throw envErr;
        }

        try {
          const cameras = await Html5Qrcode.getCameras();
          if (cameras && cameras.length > 0) {
            const backCam = cameras.find(c => {
              const label = (c.label || '').toLowerCase();
              return (label.includes('back') || label.includes('rear') || label.includes('sau') || label.includes('environment')) &&
                !label.includes('ultra') && !label.includes('macro');
            }) || cameras[0];

            await html5QrcodeRef.current.start(
              backCam.id,
              mobileScanConfig,
              onSuccess,
              onFailure
            );
          } else {
            throw envErr;
          }
        } catch {
          await html5QrcodeRef.current.start(
            { facingMode: 'user' },
            mobileScanConfig,
            onSuccess,
            onFailure
          );
        }
      }

      setCameraStatus('active');
      applyMobileOptimizations();
    } catch (err) {
      console.error('Camera start error:', err);
      const errStr = String(err);
      if (errStr.includes('NotAllowedError') || errStr.includes('PermissionDeniedError')) {
        setCameraStatus('denied');
      } else {
        setCameraStatus('error');
      }
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => { stopCamera(); };
  }, [startCamera, stopCamera]);

  const handleScanSuccess = async (decodedText) => {
    const now = Date.now();
    if (lastScanRef.current.text === decodedText && (now - lastScanRef.current.time) < 2500) return;
    lastScanRef.current = { text: decodedText, time: now };

    let serial = decodedText.trim();
    try {
      const url = new URL(decodedText);
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length >= 1) serial = parts[parts.length - 1];
    } catch {
      // not a URL
    }

    setDetected(true);
    setDetectedSerial(serial);
    setPendingSerial(serial);
    setEndSerial('');
    await stopCamera();

    const activeStore = selectedStoreRef.current;
    if (activeStore && activeStore.name) {
      setStoreSearch(activeStore.name);
      setStoreAddress(activeStore.address || '');
      setStorePhone(activeStore.phone || '');
    }
    setScanStep('choose_store');
  };

  // Bước 4 - Hướng 1: Bấm "Quét tiếp" -> giữ nguyên Điểm bán đã chọn và bật lại camera quét mã kế tiếp
  const handleContinueSameStore = async () => {
    setDetected(false);
    setDetectedSerial('');
    setPendingSerial('');
    setEndSerial('');
    setScanStep('scanning');
    await startCamera();
  };

  // Bước 4 - Hướng 2: Bấm "Dừng / Kết thúc" -> xóa Điểm bán đang chọn để lần quét mới chọn Điểm bán khác
  const handleStopStoreSession = async () => {
    localStorage.removeItem('npp_active_store_session');
    setSelectedStore(null);
    setStoreSearch('');
    setStoreAddress('');
    setStorePhone('');
    setSessionSerials([]);
    setLastAssigned(null);
    setDetected(false);
    setDetectedSerial('');
    setPendingSerial('');
    setEndSerial('');
    setScanStep('scanning');
    showToast('success', '🛑 Đã kết thúc phiên điểm bán hiện tại. Hãy chọn điểm bán mới cho lần quét tiếp theo.');
    await startCamera();
  };

  const toggleFlash = async () => {
    if (!html5QrcodeRef.current?.isScanning) return;
    try {
      const track = html5QrcodeRef.current.getRunningTrack();
      const caps = track.getCapabilities?.() || {};
      if (caps.torch) {
        await track.applyConstraints({ advanced: [{ torch: !flashOn }] });
        setFlashOn(!flashOn);
      }
    } catch { /* flash not supported */ }
  };

  return (
    <div className="npp-scan-page">
      {/* Toast notification */}
      {toast && (
        <div className={`npp-scan-toast ${toast.type}`}>
          {toast.type === 'success'
            ? <CheckCircle size={18} />
            : <AlertCircle size={18} />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="npp-scan-header">
        <div className="npp-scan-header-info">
          <span className="npp-scan-title">Quét Tem Xuất Cho Điểm Bán</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
            <span className="npp-scan-sub">{user?.fullName || user?.username}</span>
            <span style={{ fontSize: '0.75rem', background: 'rgba(34, 197, 94, 0.12)', color: '#16a34a', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
              📦 Đã xuất: {stats.totalImported.toLocaleString('vi-VN')} serial
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            onClick={() => navigate('/npp/stores')}
          >
            <Store size={15} /> Bảng Điểm bán
          </button>
          <button
            className="npp-flash-btn"
            onClick={toggleFlash}
            title={flashOn ? 'Tắt đèn flash' : 'Bật đèn flash'}
          >
            {flashOn ? <ZapOff size={20} /> : <Zap size={20} />}
          </button>
        </div>
      </div>

      {/* Thanh chọn Điểm bán trực tiếp (Bước 3: Gõ 1 từ ra list gần đúng nhất: thanh -> Thành, Thánh, Thạnh...) */}
      <div
        style={{
          padding: '10px 16px',
          background: '#1e293b',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          position: 'relative',
          zIndex: 25
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Store size={15} color="#34d399" />
            <span>
              {selectedStore?.name
                ? `Đang chọn Điểm bán: ${selectedStore.name}`
                : 'Chọn Điểm bán trước hoặc sau khi quét (gõ 1 từ không dấu, VD: thanh → Thành, Thánh, Thạnh...)'}
            </span>
          </label>
          {selectedStore?.name && (
            <button
              type="button"
              onClick={handleStopStoreSession}
              style={{
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '3px 10px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🛑 Dừng / Đổi điểm bán
            </button>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Nhập 1 từ để tìm Điểm bán (VD: thanh -> Thành, Thánh, Thạnh...)"
            value={storeSearch}
            onFocus={() => setShowStoreDropdown(true)}
            onChange={(e) => {
              const val = e.target.value;
              setStoreSearch(val);
              if (selectedStore && selectedStore.name !== val) {
                setSelectedStore(null);
              }
              setShowStoreDropdown(true);
            }}
            style={{
              width: '100%',
              padding: '9px 34px 9px 12px',
              borderRadius: '10px',
              border: selectedStore ? '2px solid #10b981' : '1px solid #475569',
              background: '#0f172a',
              color: '#ffffff',
              fontSize: '0.9rem'
            }}
          />
          {storeSearch && (
            <button
              type="button"
              onClick={() => {
                setStoreSearch('');
                setSelectedStore(null);
                localStorage.removeItem('npp_active_store_session');
                setShowStoreDropdown(true);
              }}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          )}

          {showStoreDropdown && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 'calc(100% + 4px)',
                background: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '10px',
                maxHeight: '220px',
                overflowY: 'auto',
                boxShadow: '0 12px 28px rgba(0,0,0,0.45)',
                zIndex: 50
              }}
            >
              {filteredStores.length === 0 ? (
                <div style={{ padding: '12px', fontSize: '0.84rem', color: '#cbd5e1' }}>
                  Không có điểm bán khớp &ldquo;<strong>{storeSearch}</strong>&rdquo;.
                  {storeSearch.trim() && (
                    <div
                      onClick={() => {
                        const customStore = { name: storeSearch.trim(), address: '', phone: '' };
                        setSelectedStore(customStore);
                        localStorage.setItem('npp_active_store_session', JSON.stringify(customStore));
                        setShowStoreDropdown(false);
                      }}
                      style={{
                        marginTop: '6px',
                        padding: '8px 10px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        borderRadius: '8px',
                        color: '#34d399',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <PlusCircle size={15} />
                      <span>Dùng & tự động tạo điểm bán mới: &ldquo;{storeSearch.trim()}&rdquo;</span>
                    </div>
                  )}
                </div>
              ) : (
                filteredStores.map((s) => (
                  <div
                    key={s._id}
                    onClick={() => {
                      setSelectedStore(s);
                      setStoreSearch(s.name);
                      localStorage.setItem('npp_active_store_session', JSON.stringify(s));
                      setShowStoreDropdown(false);
                    }}
                    style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      cursor: 'pointer',
                      background: selectedStore?._id === s._id ? 'rgba(16, 185, 129, 0.18)' : 'transparent',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.9rem' }}>🏪 {s.name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        📍 {s.address || '—'} {s.phone ? `• 📞 ${s.phone}` : ''}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        background: 'rgba(99, 102, 241, 0.2)',
                        color: '#a5b4fc',
                        padding: '2px 8px',
                        borderRadius: '99px',
                        fontWeight: 700
                      }}
                    >
                      {s.totalSerials || 0} serial
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Camera area & Modal Bước 3 / Bước 4 */}
      <div className="npp-scan-camera-area" style={{ position: 'relative' }} onClick={() => setShowStoreDropdown(false)}>
        <div id="npp-reader" style={{ width: '100%', height: '100%', overflow: 'hidden' }} />

        {cameraStatus === 'loading' && scanStep === 'scanning' && (
          <div className="npp-scan-camera-loading" style={{ position: 'absolute', inset: 0, zIndex: 5, background: 'var(--color-bg-secondary, #ffffff)' }}>
            <div className="loading-spinner" style={{ width: 48, height: 48 }} />
            <p>Đang khởi động camera...</p>
          </div>
        )}

        {cameraStatus === 'denied' && (
          <div className="npp-scan-no-camera" style={{ position: 'absolute', inset: 0, zIndex: 5, background: 'var(--color-bg-secondary, #ffffff)' }}>
            <Camera size={60} opacity={0.4} />
            <h3>Không thể truy cập camera</h3>
            <p>Vui lòng cho phép trình duyệt sử dụng camera và thử lại.</p>
            <button className="btn btn-primary" onClick={startCamera}>
              Thử lại
            </button>
          </div>
        )}

        {/* Bước 3 & SERI ĐOẠN (Theo mẫu vyphyto_req_image1.png): Điểm bán + [ thêm mới ], Địa chỉ, SDT, SERI ĐOẠN (Seri hiện đang quét + serial cuối + [ ok ]), [ quét tiếp ] / [ kết thúc ] */}
        {scanStep === 'choose_store' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 30,
              background: 'rgba(15, 23, 42, 0.96)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              overflowY: 'auto'
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '480px',
                background: '#1e293b',
                border: '1.5px solid #475569',
                borderRadius: '16px',
                padding: '18px',
                color: '#f8fafc',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Gán Điểm bán &amp; Seri Đoạn</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399', fontFamily: 'monospace' }}>
                  Seri quét: {pendingSerial}
                </div>
              </div>

              {/* Dòng 1: Điểm bán + [ thêm mới ] */}
              <div style={{ marginBottom: '10px', position: 'relative' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '86px 1fr auto', gap: '8px', alignItems: 'center' }}>
                  <label style={{ fontWeight: 700, fontSize: '0.88rem', color: '#e2e8f0' }}>Điểm bán</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="gõ vài ký tự gợi nhớ..."
                      value={storeSearch}
                      onFocus={() => setShowStoreDropdown(true)}
                      onChange={(e) => {
                        setStoreSearch(e.target.value);
                        if (selectedStore && selectedStore.name !== e.target.value) {
                          setSelectedStore(null);
                        }
                        setShowStoreDropdown(true);
                      }}
                      style={{
                        width: '100%',
                        padding: '9px 10px',
                        borderRadius: '8px',
                        border: selectedStore ? '1.5px solid #10b981' : '1px solid #475569',
                        background: '#0f172a',
                        color: '#ffffff',
                        fontSize: '0.88rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickAddStore}
                    disabled={addingStore}
                    style={{
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #60a5fa',
                      background: 'rgba(37, 99, 235, 0.2)',
                      color: '#93c5fd',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {addingStore ? 'Đang thêm...' : 'thêm mới'}
                  </button>
                </div>

                {/* Gợi ý Điểm bán khi gõ */}
                {showStoreDropdown && filteredStores.length > 0 && (
                  <div
                    style={{
                      marginTop: '6px',
                      maxHeight: '140px',
                      overflowY: 'auto',
                      background: '#0f172a',
                      border: '1px solid #475569',
                      borderRadius: '8px'
                    }}
                  >
                    {filteredStores.map((s) => (
                      <div
                        key={s._id}
                        onClick={() => {
                          setSelectedStore(s);
                          setStoreSearch(s.name);
                          setStoreAddress(s.address || '');
                          setStorePhone(s.phone || '');
                          localStorage.setItem('npp_active_store_session', JSON.stringify(s));
                          setShowStoreDropdown(false);
                        }}
                        style={{
                          padding: '8px 12px',
                          borderBottom: '1px solid rgba(255,255,255,0.06)',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: selectedStore?._id === s._id ? 'rgba(16, 185, 129, 0.2)' : 'transparent'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#f8fafc' }}>🏪 {s.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            {s.address || '—'} {s.phone ? `• ${s.phone}` : ''}
                          </div>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>Chọn</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dòng 2: Địa chỉ */}
              <div style={{ display: 'grid', gridTemplateColumns: '86px 1fr', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontWeight: 700, fontSize: '0.88rem', color: '#e2e8f0' }}>Địa chỉ</label>
                <input
                  type="text"
                  placeholder="Địa chỉ điểm bán..."
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 10px',
                    borderRadius: '8px',
                    border: '1px solid #475569',
                    background: '#0f172a',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Dòng 3: SDT */}
              <div style={{ display: 'grid', gridTemplateColumns: '86px 1fr', gap: '8px', alignItems: 'center', marginBottom: '14px' }}>
                <label style={{ fontWeight: 700, fontSize: '0.88rem', color: '#e2e8f0' }}>SDT</label>
                <input
                  type="text"
                  placeholder="Số điện thoại..."
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 10px',
                    borderRadius: '8px',
                    border: '1px solid #475569',
                    background: '#0f172a',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Khung SERI ĐOẠN */}
              <div
                style={{
                  border: '2px solid #60a5fa',
                  borderRadius: '10px',
                  padding: '12px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  marginBottom: '14px'
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#93c5fd', marginBottom: '10px', letterSpacing: '0.5px' }}>
                  SERI ĐOẠN
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '132px 1fr', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.83rem', fontWeight: 700, color: '#cbd5e1' }}>Seri hiện đang quét</label>
                  <input
                    type="text"
                    value={pendingSerial}
                    onChange={(e) => setPendingSerial(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #3b82f6',
                      background: '#1e293b',
                      color: '#34d399',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '132px 1fr auto', gap: '8px', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.83rem', fontWeight: 700, color: '#cbd5e1' }}>serial cuối</label>
                  <input
                    type="text"
                    placeholder={`VD: ${pendingSerial || '00000010'} (để trống nếu 1 tem)`}
                    value={endSerial}
                    onChange={(e) => setEndSerial(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #475569',
                      background: '#0f172a',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      fontSize: '0.92rem',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    disabled={assigning}
                    onClick={() => assignSerialToStore(pendingSerial, selectedStore || { name: storeSearch, address: storeAddress, phone: storePhone }, endSerial)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#2563eb',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      cursor: 'pointer'
                    }}
                  >
                    {assigning ? '...' : 'ok'}
                  </button>
                </div>
              </div>

              {/* 2 Nút thao tác dưới cùng: [ quét tiếp ] và [ kết thúc ] */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  disabled={assigning}
                  onClick={async () => {
                    const ok = await assignSerialToStore(
                      pendingSerial,
                      selectedStore || { name: storeSearch, address: storeAddress, phone: storePhone },
                      endSerial
                    );
                    if (ok) {
                      await handleContinueSameStore();
                    }
                  }}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: '2px solid #10b981',
                    background: 'rgba(16, 185, 129, 0.18)',
                    color: '#34d399',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    cursor: 'pointer'
                  }}
                >
                  quét tiếp
                </button>
                <button
                  type="button"
                  disabled={assigning}
                  onClick={async () => {
                    if (storeSearch.trim()) {
                      const ok = await assignSerialToStore(
                        pendingSerial,
                        selectedStore || { name: storeSearch, address: storeAddress, phone: storePhone },
                        endSerial
                      );
                      if (!ok) return;
                    }
                    await handleStopStoreSession();
                  }}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: '2px solid #ef4444',
                    background: 'rgba(239, 68, 68, 0.16)',
                    color: '#f87171',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    cursor: 'pointer'
                  }}
                >
                  kết thúc
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bước 4: Sau khi gán Serial vào Điểm bán -> Hiển thị 2 nút: QUÉT TIẾP và DỪNG */}
        {scanStep === 'assigned_action' && lastAssigned && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 30,
              background: 'rgba(15, 23, 42, 0.95)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              overflowY: 'auto'
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '440px',
                background: '#1e293b',
                border: '2px solid #10b981',
                borderRadius: '18px',
                padding: '22px',
                color: '#f8fafc',
                textAlign: 'center'
              }}
            >
              <CheckCircle size={44} color="#10b981" style={{ marginBottom: '8px' }} />
              <h3 style={{ margin: '0 0 6px', fontSize: '1.15rem', color: '#34d399' }}>
                Đã gán Serial cho Điểm bán!
              </h3>
              <div
                style={{
                  background: '#0f172a',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  textAlign: 'left',
                  marginBottom: '16px',
                  fontSize: '0.88rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px'
                }}
              >
                <div><span style={{ color: '#94a3b8' }}>Điểm bán:</span> <strong>{lastAssigned.storeName}</strong></div>
                <div>
                  <span style={{ color: '#94a3b8' }}>Serial vừa bán:</span>{' '}
                  <strong style={{ color: '#34d399', fontFamily: 'monospace', fontSize: '1rem' }}>{lastAssigned.serialNumber}</strong>
                </div>
                <div>
                  <span style={{ color: '#94a3b8' }}>Thời gian:</span>{' '}
                  <span>{formatDateTime(lastAssigned.soldAt)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                <button
                  type="button"
                  onClick={handleContinueSameStore}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Camera size={20} />
                  <span>QUÉT TIẾP (Cho: {lastAssigned.storeName})</span>
                </button>

                <button
                  type="button"
                  onClick={handleStopStoreSession}
                  style={{
                    width: '100%',
                    padding: '13px 16px',
                    borderRadius: '12px',
                    border: '2px solid #ef4444',
                    background: 'rgba(239, 68, 68, 0.12)',
                    color: '#f87171',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <StopCircle size={20} />
                  <span>DỪNG (Kết thúc & Chọn điểm bán khác)</span>
                </button>
              </div>

              {sessionSerials.length > 0 && (
                <div style={{ textAlign: 'left', borderTop: '1px solid #334155', paddingTop: '10px' }}>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '6px' }}>
                    Đã quét trong phiên này ({sessionSerials.length} mã):
                  </div>
                  <div style={{ maxHeight: '100px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {sessionSerials.map((item, i) => (
                      <div key={item.serialNumber + i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#cbd5e1' }}>
                        <span style={{ fontFamily: 'monospace', color: '#34d399', fontWeight: 700 }}>{item.serialNumber}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#94a3b8' }}>
                          <Clock size={11} />
                          {formatDateTime(item.soldAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {(cameraStatus === 'active' || cameraStatus === 'error') && scanStep === 'scanning' && (
          <>
            {!detected && (
              <div className="npp-scan-overlay">
                <div className="npp-scan-mask-top" />
                <div className="npp-scan-mask-middle">
                  <div className="npp-scan-mask-side" />
                  <div className="npp-scan-frame">
                    <div className="npp-scan-corner tl" />
                    <div className="npp-scan-corner tr" />
                    <div className="npp-scan-corner bl" />
                    <div className="npp-scan-corner br" />
                    <div className="npp-scan-line" />
                  </div>
                  <div className="npp-scan-mask-side" />
                </div>
                <div className="npp-scan-mask-bottom" />
              </div>
            )}

            {!detected && (
              <div className="npp-scan-hint">
                {selectedStore?.name
                  ? `Đang quét cho điểm bán: ${selectedStore.name}`
                  : 'Đưa mã QR trên tem vào khung quét'}
              </div>
            )}

            {detected && (
              <div className="npp-scan-detected">
                <CheckCircle size={32} color="#4CAF50" />
                <span>Đã nhận diện: <strong>{detectedSerial}</strong></span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom tip */}
      <div className="npp-scan-footer">
        <p>
          {selectedStore?.name
            ? `Các mã quét tiếp theo sẽ tự động gán vào điểm bán "${selectedStore.name}" cho đến khi bạn bấm Dừng.`
            : 'Chọn Điểm bán ở thanh trên hoặc quét mã QR để chọn Điểm bán'}
        </p>
        <button
          className="btn btn-ghost"
          onClick={() => navigate('/npp/stores')}
        >
          Xem Bảng Quản lý Điểm bán →
        </button>
      </div>
    </div>
  );
}
