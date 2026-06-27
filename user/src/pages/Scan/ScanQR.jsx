import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, ZapOff, Clock, CheckCircle, Camera } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import userApi from '../../services/api';
import './ScanQR.css';

export default function ScanQR() {
  const navigate = useNavigate();
  const { nppUser, logout } = useAuth();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastScanRef = useRef(null);

  const [cameraStatus, setCameraStatus] = useState('loading'); // 'loading' | 'active' | 'denied' | 'error'
  const [flashOn, setFlashOn] = useState(false);
  const [detected, setDetected] = useState(false);
  const [detectedSerial, setDetectedSerial] = useState('');

  // Start camera
  const startCamera = useCallback(async () => {
    setCameraStatus('loading');
    try {
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraStatus('active');
        startScanLoop();
      }
    } catch (err) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraStatus('denied');
      } else {
        setCameraStatus('error');
      }
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // QR scan loop using jsQR (loaded dynamically)
  const startScanLoop = () => {
    const scan = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== 4) {
        animFrameRef.current = requestAnimationFrame(scan);
        return;
      }

      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        // Dynamic import jsQR
        const jsQR = (await import('jsqr')).default;
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        });

        if (code && code.data) {
          const now = Date.now();
          // Debounce: don't re-scan same code within 3 seconds
          if (lastScanRef.current !== code.data || (now - (lastScanRef._time || 0)) > 3000) {
            lastScanRef.current = code.data;
            lastScanRef._time = now;
            handleQRDetected(code.data);
            return; // stop loop
          }
        }
      } catch {
        // jsQR load error or decode error – continue
      }

      animFrameRef.current = requestAnimationFrame(scan);
    };

    animFrameRef.current = requestAnimationFrame(scan);
  };

  const handleQRDetected = async (qrData) => {
    // Extract serial from QR URL or use as-is
    let serial = qrData;

    // Try to parse URL patterns like /scan/XXXX or /qrcode/XXXX or /temqr/XXXX
    try {
      const url = new URL(qrData);
      const parts = url.pathname.split('/').filter(Boolean);
      // Last segment is the serial
      if (parts.length >= 1) {
        serial = parts[parts.length - 1];
      }
    } catch {
      // Not a URL, use raw value
      serial = qrData.trim();
    }

    if (!serial) return;

    setDetected(true);
    setDetectedSerial(serial);
    stopCamera();

    // Fetch scan data from server
    try {
      const scanData = await userApi.getPublicScan(serial);
      // Navigate to select-store with scan data
      navigate('/select-store', {
        state: { scanData, serial }
      });
    } catch (err) {
      // Serial not found – show error and restart
      alert(`Không tìm thấy tem: ${serial}\n${err.message}`);
      setDetected(false);
      setDetectedSerial('');
      await startCamera();
    }
  };

  const toggleFlash = async () => {
    if (!streamRef.current) return;
    try {
      const track = streamRef.current.getVideoTracks()[0];
      const caps = track.getCapabilities?.() || {};
      if (caps.torch) {
        await track.applyConstraints({ advanced: [{ torch: !flashOn }] });
        setFlashOn(!flashOn);
      }
    } catch {
      // Flash not supported
    }
  };

  return (
    <div className="scan-qr-page">
      {/* Header */}
      <div className="scan-header">
        <button className="scan-header-btn" onClick={() => navigate('/scan')} aria-label="Quay lại">
          <ArrowLeft size={20} />
        </button>
        <span className="scan-header-title">Quét QR Code</span>
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
      <div className="scan-camera-area">
        {cameraStatus === 'loading' && (
          <div className="scan-camera-loading">
            <div className="loading-ring" style={{ borderTopColor: '#4CAF50' }} />
            <p>Đang khởi động camera...</p>
          </div>
        )}

        {cameraStatus === 'denied' && (
          <div className="scan-no-camera">
            <Camera size={56} color="rgba(255,255,255,0.4)" />
            <h3>Không thể truy cập camera</h3>
            <p>Vui lòng cho phép ứng dụng sử dụng camera trong cài đặt trình duyệt để quét QR Code.</p>
            <button className="scan-retry-btn" onClick={startCamera}>Thử lại</button>
          </div>
        )}

        {(cameraStatus === 'active' || cameraStatus === 'error') && (
          <>
            <video
              ref={videoRef}
              className="scan-camera-video"
              muted
              playsInline
              autoPlay
            />
            <canvas ref={canvasRef} id="qr-canvas" />

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
                <span className="scan-hint-text">Đưa mã QR vào khung để quét</span>
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
