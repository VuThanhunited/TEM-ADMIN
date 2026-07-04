import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, ZapOff, Clock, CheckCircle, Camera } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '../../contexts/AuthContext';
import userApi from '../../services/api';
import './ScanQR.css';

export default function ScanQR() {
  const navigate = useNavigate();
  const { nppUser, logout } = useAuth();

  const html5QrcodeRef = useRef(null);
  const lastScanRef = useRef(null);

  const [cameraStatus, setCameraStatus] = useState('loading'); // 'loading' | 'active' | 'denied' | 'error'
  const [flashOn, setFlashOn] = useState(false);
  const [detected, setDetected] = useState(false);
  const [detectedSerial, setDetectedSerial] = useState('');

  // Start camera
  const startCamera = useCallback(async () => {
    setCameraStatus('loading');
    try {
      if (!html5QrcodeRef.current) {
        html5QrcodeRef.current = new Html5Qrcode("reader");
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
          const size = Math.min(width, height) * 0.7;
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
      console.error('Camera error:', err);
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
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      try {
        await html5QrcodeRef.current.stop();
      } catch (err) {
        console.error('Failed to stop html5-qrcode:', err);
      }
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const handleScanSuccess = async (decodedText, decodedResult) => {
    const now = Date.now();
    // Debounce: don't re-scan same code within 3 seconds
    if (lastScanRef.current === decodedText && (now - (lastScanRef.current_time || 0)) < 3000) {
      return;
    }
    lastScanRef.current = decodedText;
    lastScanRef.current_time = now;

    const format = decodedResult?.result?.format?.formatName || '';
    const isBarcode = format && format !== 'QR_CODE' && format !== 'DATA_MATRIX' && format !== 'AZTEC' && format !== 'PDF_417';

    setDetected(true);
    setDetectedSerial(decodedText);
    await stopCamera();

    if (isBarcode) {
      const barcode = decodedText.trim();
      try {
        const scanData = await userApi.getPublicBarcode(barcode);
        // Navigate to select-store with scan data
        navigate('/select-store', {
          state: { scanData, serial: barcode, isBarcode: true }
        });
      } catch (err) {
        alert(`Không tìm thấy sản phẩm có mã vạch: ${barcode}\n${err.message}`);
        setDetected(false);
        setDetectedSerial('');
        await startCamera();
      }
    } else {
      // Extract serial from QR URL or use as-is
      let serial = decodedText.trim();
      try {
        const url = new URL(decodedText);
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length >= 1) {
          serial = parts[parts.length - 1];
        }
      } catch {
        // Not a URL, use raw value
      }

      if (!serial) return;

      try {
        const scanData = await userApi.getPublicScan(serial);
        navigate('/select-store', {
          state: { scanData, serial }
        });
      } catch (err) {
        alert(`Không tìm thấy tem: ${serial}\n${err.message}`);
        setDetected(false);
        setDetectedSerial('');
        await startCamera();
      }
    }
  };

  const toggleFlash = async () => {
    if (!html5QrcodeRef.current || !html5QrcodeRef.current.isScanning) return;
    try {
      const track = html5QrcodeRef.current.getRunningTrack();
      const caps = track.getCapabilities?.() || {};
      if (caps.torch) {
        await track.applyConstraints({ advanced: [{ torch: !flashOn }] });
        setFlashOn(!flashOn);
      }
    } catch {
      // Flash/torch not supported
    }
  };

  return (
    <div className="scan-qr-page">
      {/* Header */}
      <div className="scan-header">
        <button className="scan-header-btn" onClick={() => navigate('/scan')} aria-label="Quay lại">
          <ArrowLeft size={20} />
        </button>
        <span className="scan-header-title">Quét QR Code / Mã vạch</span>
        <button
          className="scan-header-btn"
          onClick={toggleFlash}
          aria-label={flashOn ? 'Tắt đèn' : 'Bật đèn'}
          title={flashOn ? 'Tắt đèn flash' : 'Bật đèn flash'}
        >
          {flashOn ? <ZapOff size={20} /> : <Zap size={20} />}
        </button>
      </div>

      {/* Camera area */}
      <div className="scan-camera-area" style={{ position: 'relative' }}>
        <div id="reader" style={{ width: '100%', height: '100%', overflow: 'hidden' }}></div>

        {cameraStatus === 'loading' && (
          <div className="scan-camera-loading" style={{ position: 'absolute', inset: 0, zIndex: 5, background: '#121212' }}>
            <div className="loading-ring" style={{ borderTopColor: '#4CAF50' }} />
            <p>Đang khởi động camera...</p>
          </div>
        )}

        {cameraStatus === 'denied' && (
          <div className="scan-no-camera" style={{ position: 'absolute', inset: 0, zIndex: 5, background: '#121212' }}>
            <Camera size={56} color="rgba(255,255,255,0.4)" />
            <h3>Không thể truy cập camera</h3>
            <p>Vui lòng cho phép ứng dụng sử dụng camera trong cài đặt trình duyệt để quét.</p>
            <button className="scan-retry-btn" onClick={startCamera}>Thử lại</button>
          </div>
        )}

        {(cameraStatus === 'active' || cameraStatus === 'error') && (
          <>
            {/* Overlay with frame */}
            {!detected && (
              <div className="scan-overlay">
                <div className="scan-mask-top" />
                <div className="scan-mask-middle">
                  <div className="scan-mask-side" />
                  <div className="scan-frame">
                    <div className="scan-frame-corner tl" />
                    <div className="scan-frame-corner tr" />
                    <div className="scan-frame-corner bl" />
                    <div className="scan-frame-corner br" />
                    <div className="scan-line" />
                  </div>
                  <div className="scan-mask-side" />
                </div>
                <div className="scan-mask-bottom" />
              </div>
            )}

            {/* Hint */}
            {!detected && (
              <div className="scan-hint-box">
                <span className="scan-hint-text">Đưa mã QR hoặc mã vạch vào khung quét</span>
              </div>
            )}

            {/* Detected overlay */}
            {detected && (
              <div className="scan-detected">
                <div className="scan-detected-badge">
                  <CheckCircle size={20} />
                  Đã nhận diện: {detectedSerial}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom bar */}
      <div className="scan-bottom-bar">
        {nppUser && (
          <div className="scan-npp-chip">
            <span className="scan-npp-chip-name">
              {nppUser.fullName || nppUser.username}
            </span>
            <button className="scan-npp-logout" onClick={() => { logout(); navigate('/login', { replace: true }); }}>
              Đăng xuất
            </button>
          </div>
        )}

        <button
          className="scan-history-btn"
          onClick={() => navigate('/history')}
          aria-label="Lịch sử quét"
        >
          <div className="scan-history-icon">
            <Clock size={22} />
          </div>
          <span className="scan-history-label">Lịch sử quét</span>
        </button>
      </div>
    </div>
  );
}
