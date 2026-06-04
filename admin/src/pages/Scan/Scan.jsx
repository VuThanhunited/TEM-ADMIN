import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import {
  Shield, CheckCircle, AlertTriangle, XCircle, MessageSquare, Send,
  Globe, Phone, MapPin, Building, Calendar, X, Eye, Info
} from 'lucide-react';
import './Scan.css';

export default function Scan() {
  const { serial } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    loadScanData();
  }, [serial]);

  useEffect(() => {
    if (chatOpen && chatMessages.length === 0 && data) {
      // Set initial chatbot welcome message
      const welcome = data.enterprise.chatbotConfig?.welcomeMessage || 
        `Chào bạn! Cảm ơn bạn đã tin dùng sản phẩm của ${data.enterprise.name}. Bạn có câu hỏi nào về sản phẩm "${data.product?.name}" không?`;
      setChatMessages([{ sender: 'bot', text: welcome, time: new Date() }]);
    }
  }, [chatOpen, data]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadScanData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getPublicScan(serial);
      setData(res);
      applyTheme(res.template);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Có lỗi xảy ra khi quét tem nhãn');
    } finally {
      setLoading(false);
    }
  };

  const applyTheme = (template) => {
    if (!template) return;
    const root = document.documentElement;
    root.style.setProperty('--primary-color', template.primaryColor || '#6366f1');
    root.style.setProperty('--secondary-color', template.secondaryColor || '#4f46e5');
    root.style.setProperty('--bg-color', template.backgroundColor || '#0f172a');
    root.style.setProperty('--text-color', template.textColor || '#f8fafc');
  };

  // Helper to determine if custom background is light colored
  const isLightTheme = () => {
    if (!data?.template?.backgroundColor) return false;
    const hex = data.template.backgroundColor.replace('#', '');
    if (hex.length === 3) {
      const r = parseInt(hex[0], 16);
      return r > 11;
    } else if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      // Brightness formula
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 180;
    }
    return false;
  };

  const formatDateTime = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    const newUserMsg = { sender: 'user', text: userText, time: new Date() };
    setChatMessages(prev => [...prev, newUserMsg]);
    setChatInput('');

    // Simulate bot response
    setTimeout(() => {
      let botResponse = '';
      const textLower = userText.toLowerCase();

      if (textLower.includes('chào') || textLower.includes('hi') || textLower.includes('hello')) {
        botResponse = `Xin chào! Tôi có thể giúp gì cho bạn về sản phẩm ${data.product?.name}?`;
      } else if (textLower.includes('hạn sử dụng') || textLower.includes('hsd') || textLower.includes('hạn')) {
        botResponse = `Sản phẩm này thuộc lô tem ${data.label?.batchId ? 'VH-2024-001' : 'mới'}. Hạn hiển thị của lô tem bảo hành đến ngày ${formatDateTime(data.label?.batchId?.expiryDate || new Date(Date.now() + 365*24*60*60*1000))}.`;
      } else if (textLower.includes('giá') || textLower.includes('bao nhiêu') || textLower.includes('tiền')) {
        botResponse = `Để biết giá bán lẻ chính xác của sản phẩm "${data.product?.name}", vui lòng tham khảo trực tiếp tại các điểm phân phối hoặc website chính thức ${data.enterprise?.website || ''}.`;
      } else if (textLower.includes('địa chỉ') || textLower.includes('công ty') || textLower.includes('ở đâu') || textLower.includes('liên hệ')) {
        botResponse = `Bạn có thể liên hệ ${data.enterprise?.name} tại địa chỉ: ${data.enterprise?.address || 'N/A'}. Số điện thoại: ${data.enterprise?.phone || 'N/A'}.`;
      } else {
        botResponse = `Cảm ơn bạn đã hỏi. Sản phẩm "${data.product?.name}" được sản xuất theo quy trình nghiêm ngặt và phân phối chính hãng. Bạn có thể ghé thăm website ${data.enterprise?.website || 'của chúng tôi'} để biết thêm chi tiết!`;
      }

      setChatMessages(prev => [...prev, { sender: 'bot', text: botResponse, time: new Date() }]);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="app-loading" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div className="loading-spinner" style={{ width: 50, height: 50, borderWidth: 3 }}></div>
        <p style={{ marginTop: 16, fontSize: '0.95rem', opacity: 0.8 }}>Đang xác thực tem nhãn thông minh...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="scan-public-page">
        <div className="scan-container">
          <div className="scan-card" style={{ borderTop: '4px solid #ef4444' }}>
            <div className="verif-badge-container">
              <div className="verif-badge error">
                <XCircle size={24} />
                <span>CẢNH BÁO LỖI</span>
              </div>
              <h2 style={{ marginTop: 20, fontSize: '1.2rem', fontWeight: 800 }}>Xác thực không thành công!</h2>
            </div>
            <div className="scan-alert error">
              <Info size={20} className="info-icon" />
              <div>
                <div className="alert-title">Không thể xác thực mã QR</div>
                <p>{error}</p>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', opacity: 0.6, textAlign: 'center', marginTop: 24, lineHeight: 1.4 }}>
              Nếu bạn nghi ngờ đây là sản phẩm giả mạo hoặc tem nhãn bị làm giả, vui lòng liên hệ với cơ quan chức năng hoặc ban quản trị hệ thống để phản ánh.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { label, product, enterprise, template, isFirstScan, firstScanTime } = data;
  const lightClass = isLightTheme() ? 'light-theme' : '';
  const layoutClass = `layout-${template.layout || 'default'}`;

  return (
    <div className={`scan-public-page ${lightClass} ${layoutClass}`}>
      <div className="scan-bg-effects">
        <div className="bg-orb orb-1"></div>
        <div className="bg-orb orb-2"></div>
      </div>

      <div className="scan-container">
        {/* Verification Status */}
        <div className="scan-card">
          <div className="verif-badge-container">
            {label.scanCount === 1 || isFirstScan ? (
              <div className="verif-badge success">
                <CheckCircle size={24} />
                <span>SẢN PHẨM CHÍNH HÃNG</span>
              </div>
            ) : (
              <div className="verif-badge warning">
                <AlertTriangle size={24} />
                <span>CẢNH BÁO QUÉT TRÙNG</span>
              </div>
            )}
            <p className="verif-text">Hệ thống xác thực điện tử TEM Smart Label</p>
          </div>

          {/* Verification Alert Message */}
          {label.scanCount === 1 || isFirstScan ? (
            <div className="scan-alert success">
              <CheckCircle size={20} className="info-icon" style={{ marginTop: 2 }} />
              <div>
                <div className="alert-title">Xác thực thành công (Lần quét đầu tiên)</div>
                <p>Đây là lần đầu tiên tem nhãn này được quét xác thực. Sản phẩm được cam kết chính hãng bởi <strong>{enterprise.name}</strong>.</p>
              </div>
            </div>
          ) : (
            <div className="scan-alert warning">
              <AlertTriangle size={20} className="info-icon" style={{ marginTop: 2 }} />
              <div>
                <div className="alert-title">Cảnh báo quét lặp lại!</div>
                <p>Mã QR này đã được quét <strong>{label.scanCount} lần</strong>.</p>
                <p style={{ marginTop: 4, fontSize: '0.85rem' }}>
                  Lần quét đầu tiên: <strong style={{ textDecoration: 'underline' }}>{formatDateTime(firstScanTime)}</strong>.
                </p>
                <p style={{ marginTop: 6, fontSize: '0.8rem', opacity: 0.9 }}>
                  ⚠️ Nếu bạn vừa mới mua sản phẩm này và mở hộp lần đầu, vui lòng kiểm tra lại chất lượng hoặc liên hệ nhà sản xuất vì nhãn này có thể đã bị sao chép!
                </p>
              </div>
            </div>
          )}

          {/* Product Details Section */}
          {template.showProductInfo && product && (
            <div className="scan-product-section animate-fade-in">
              {product.images && product.images[0] ? (
                <img src={product.images[0]} alt={product.name} className="scan-product-image" />
              ) : (
                <div className="scan-product-image" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '3rem' }}>📦</div>
              )}
              <div>
                <h2 className="scan-product-name">{product.name}</h2>
                <span className="badge badge-neutral" style={{ marginTop: 6, display: 'inline-block' }}>{product.category || 'Sản phẩm'}</span>
                <p className="scan-product-desc" style={{ marginTop: 12 }}>{product.description}</p>
              </div>
            </div>
          )}

          {/* Enterprise / Manufacturer Section */}
          <div className="scan-info-block">
            <h4 className="block-title">Đơn vị sở hữu & Sản xuất</h4>
            <div className="block-content">
              <div className="enterprise-logo-title">
                {enterprise.logo ? (
                  <img src={enterprise.logo} alt={enterprise.name} className="enterprise-logo" />
                ) : (
                  <div className="enterprise-logo" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '0.8rem', color: '#1e293b' }}>MS</div>
                )}
                <span className="enterprise-name">{enterprise.name}</span>
              </div>
              <div className="info-item">
                <Building size={14} className="info-icon" />
                <span>Mã số thuế: {enterprise.taxCode || '—'}</span>
              </div>
              <div className="info-item">
                <MapPin size={14} className="info-icon" />
                <span>Địa chỉ: {enterprise.address || '—'}</span>
              </div>
              {enterprise.phone && (
                <div className="info-item">
                  <Phone size={14} className="info-icon" />
                  <span>Điện thoại: {enterprise.phone}</span>
                </div>
              )}
              {enterprise.website && (
                <div className="info-item">
                  <Globe size={14} className="info-icon" />
                  <a href={enterprise.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>
                    {enterprise.website.replace('https://', '').replace('http://', '')}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Distributor / Retail Point Section */}
          {template.showDistributorInfo && label.distributorName && (
            <div className="scan-info-block" style={{ marginTop: 24 }}>
              <h4 className="block-title">Điểm phân phối / Điểm bán lẻ</h4>
              <div className="block-content">
                <div className="info-item">
                  <MapPin size={16} className="info-icon" style={{ color: '#10b981' }} />
                  <div>
                    <strong style={{ fontSize: '1rem', display: 'block', color: 'var(--text-color)' }}>{label.distributorName}</strong>
                    {label.distributorAddress && <span style={{ fontSize: '0.85rem', opacity: 0.8, display: 'block', marginTop: 4 }}>{label.distributorAddress}</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Legacy Information Block */}
          {(label.legacyQrCode || label.legacyTemQr || label.activeCode || label.smsCode) && (
            <div className="scan-info-block legacy-info-block">
              <h4 className="block-title">Dữ liệu liên kết tem cũ (Đồng bộ)</h4>
              <div className="block-content legacy-content">
                {label.legacyQrCode && (
                  <div className="info-item" style={{ alignItems: 'flex-start' }}>
                    <Globe size={14} className="info-icon" style={{ color: 'var(--primary-color)', marginTop: 3 }} />
                    <span style={{ wordBreak: 'break-all', fontSize: '0.85rem' }}>
                      QR Code gốc: <a href={label.legacyQrCode} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>
                        {label.legacyQrCode}
                      </a>
                    </span>
                  </div>
                )}
                {label.legacyTemQr && (
                  <div className="info-item" style={{ alignItems: 'flex-start' }}>
                    <Globe size={14} className="info-icon" style={{ color: 'var(--primary-color)', marginTop: 3 }} />
                    <span style={{ wordBreak: 'break-all', fontSize: '0.85rem' }}>
                      Liên kết TEMQR: <a href={label.legacyTemQr} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>
                        {label.legacyTemQr}
                      </a>
                    </span>
                  </div>
                )}
                {label.smsCode && (
                  <div className="info-item">
                    <Info size={14} className="info-icon" style={{ color: 'var(--primary-color)', marginTop: 3 }} />
                    <span style={{ fontSize: '0.85rem' }}>Mã SMS: <strong style={{ color: 'var(--text-color)' }}>{label.smsCode}</strong></span>
                  </div>
                )}
                {label.activeCode && (
                  <div className="info-item">
                    <Info size={14} className="info-icon" style={{ color: 'var(--primary-color)', marginTop: 3 }} />
                    <span style={{ fontSize: '0.85rem' }}>Mã Kích Hoạt (Active Code): <strong style={{ color: 'var(--text-color)' }}>{label.activeCode}</strong></span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Scan metadata table */}
          <div className="scan-serial-box">
            <div className="serial-row">
              <span className="serial-label">Mã Serial sản phẩm</span>
              <span className="serial-value highlight">{label.serialNumber}</span>
            </div>
            {template.showScanCount && (
              <div className="serial-row">
                <span className="serial-label">Tổng số lượt quét</span>
                <span className="serial-value">{label.scanCount} lần</span>
              </div>
            )}
            <div className="serial-row">
              <span className="serial-label">Thời gian xác thực</span>
              <span className="serial-value">{formatDateTime(label.lastScannedAt)}</span>
            </div>
            {enterprise.domain && (
              <div className="serial-row">
                <span className="serial-label">Tên miền xác thực</span>
                <span className="serial-value">{enterprise.domain}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Chatbot Widget */}
      {enterprise.chatbotConfig?.enabled !== false && (
        <div className="scan-chatbot-widget animate-fade-in">
          {!chatOpen ? (
            <button className="chatbot-toggle-btn" onClick={() => setChatOpen(true)}>
              <MessageSquare size={24} />
            </button>
          ) : (
            <div className="chatbot-window">
              <div className="chatbot-header">
                <span>Trợ lý {enterprise.name.split(' ').pop()}</span>
                <button className="chatbot-close-btn" onClick={() => setChatOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="chatbot-messages">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`chat-msg ${msg.sender}`}>
                    {msg.text}
                  </div>
                ))}
                <div ref={chatEndRef}></div>
              </div>
              <form onSubmit={handleSendMessage} className="chatbot-input-area">
                <input
                  type="text"
                  className="chatbot-input"
                  placeholder="Hỏi đáp về sản phẩm..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                />
                <button type="submit" className="chatbot-send-btn">
                  <Send size={18} />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
