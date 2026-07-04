import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ZapOff, CheckCircle, Camera, AlertCircle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import './NppScan.css';

export default function NppScan() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const html5QrcodeRef = useRef(null);
  const lastScanRef = useRef({ text: null, time: 0 });

  const [cameraStatus, setCameraStatus] = useState('loading'); // 'loading' | 'active' | 'denied' | 'error'
  const [flashOn, setFlashOn] = useState(false);
  const [detected, setDetected] = useState(false);
  const [detectedSerial, setDetectedSerial] = useState('');
  const [toast, setToast] = useState(null); // { type: 'success'|'error', msg }

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // Start camera
  const startCamera = useCallback(async () => {
    setCameraStatus('loading');
    try {
      if (!html5QrcodeRef.current) {
        html5QrcodeRef.current = new Html5Qrcode('npp-reader');
      }

      let cameras = [];
      try {
        cameras = await Html5Qrcode.getCameras();
      } catch (e) {
        console.warn('Failed to get cameras list, using constraints fallback', e);
      }

      const scanConfig = {
        fps: 10,
        qrbox: (width, height) => {
          const size = Math.min(width, height) * 0.65;
          return { width: size, height: size };
        }
      };

      if (cameras && cameras.length > 0) {
        // Prefer back/rear camera on mobile
        const backCamera = cameras.find(c => 
          c.label.toLowerCase().includes('back') || 
          c.label.toLowerCase().includes('rear') || 
          c.label.toLowerCase().includes('sau') ||
          c.label.toLowerCase().includes('environment')
        );
        const cameraId = backCamera ? backCamera.id : cameras[0].id;
        await html5QrcodeRef.current.start(
          cameraId,
          scanConfig,
          (decodedText, decodedResult) => handleScanSuccess(decodedText, decodedResult),
          () => { /* ignore scan failures */ }
        );
      } else {
        // Fallback to constraints
        try {
          await html5QrcodeRef.current.start(
            { facingMode: 'environment' },
            scanConfig,
            (decodedText, decodedResult) => handleScanSuccess(decodedText, decodedResult),
            () => { /* ignore scan failures */ }
          );
        } catch {
          // If environment camera fails (e.g. on laptop), try front camera
          await html5QrcodeRef.current.start(
            { facingMode: 'user' },
            scanConfig,
            (decodedText, decodedResult) => handleScanSuccess(decodedText, decodedResult),
            () => { /* ignore scan failures */ }
          );
        }
      }
      setCameraStatus('active');
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

  // Stop camera
  const stopCamera = useCallback(async () => {
    if (html5QrcodeRef.current?.isScanning) {
      try {
        await html5QrcodeRef.current.stop();
      } catch (err) {
        console.error('Failed to stop camera:', err);
      }
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => { stopCamera(); };
  }, [startCamera, stopCamera]);

  const handleScanSuccess = async (decodedText, decodedResult) => {
    const now = Date.now();
    // Debounce: 3 giây không quét lại cùng 1 code
    if (lastScanRef.current.text === decodedText && (now - lastScanRef.current.time) < 3000) return;
    lastScanRef.current = { text: decodedText, time: now };

    const format = decodedResult?.result?.format?.formatName || '';
    const isBarcode = format && !['QR_CODE', 'DATA_MATRIX', 'AZTEC', 'PDF_417'].includes(format);

    setDetected(true);
    setDetectedSerial(decodedText);
    await stopCamera();

    let serial = decodedText.trim();
    if (!isBarcode) {
      // Extract serial from QR URL
      try {
        const url = new URL(decodedText);
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length >= 1) serial = parts[parts.length - 1];
      } catch { /* not a URL */ }
    }

    try {
      await api.nppScanSerial({
        serialNumber: serial,
        distributorName: user?.fullName || user?.username,
        distributorAddress: user?.address || '',
      });
      showToast('success', `✅ Đã nhập hàng thành công: ${serial}`);
    } catch (err) {
      showToast('error', `❌ ${err.message || 'Lỗi khi nhập hàng'}`);
    }

    // Reset sau 2s để quét tiếp
    setTimeout(async () => {
      setDetected(false);
      setDetectedSerial('');
      await startCamera();
    }, 2000);
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
          <span className="npp-scan-title">Quét Tem Phân Phối</span>
          <span className="npp-scan-sub">{user?.fullName || user?.username}</span>
        </div>
        <button
          className="npp-flash-btn"
          onClick={toggleFlash}
          title={flashOn ? 'Tắt đèn flash' : 'Bật đèn flash'}
        >
          {flashOn ? <ZapOff size={20} /> : <Zap size={20} />}
        </button>
      </div>

      {/* Camera area */}
      <div className="npp-scan-camera-area" style={{ position: 'relative' }}>
        <div id="npp-reader" style={{ width: '100%', height: '100%', overflow: 'hidden' }} />

        {cameraStatus === 'loading' && (
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

        {(cameraStatus === 'active' || cameraStatus === 'error') && (
          <>
            {/* Scan overlay frame */}
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

            {/* Hint */}
            {!detected && (
              <div className="npp-scan-hint">
                Đưa mã QR hoặc mã vạch vào khung quét
              </div>
            )}

            {/* Detected state */}
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
        <p>Mỗi lần quét sẽ tự động ghi nhận thông tin phân phối của bạn</p>
        <button
          className="btn btn-ghost"
          onClick={() => navigate('/npp/history')}
        >
          Xem lịch sử phân phối →
        </button>
      </div>
    </div>
  );
}
