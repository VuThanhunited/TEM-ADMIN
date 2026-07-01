import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, ShieldCheck, AlertTriangle, Package, QrCode,
  Building2, MapPin, Phone, Globe, Mail, Clock, Hash,
  Truck, Home, MessageSquare, Send, X, Bot
} from 'lucide-react';
import './ProductInfo.css';

export default function ProductInfo() {
  const navigate = useNavigate();
  const location = useLocation();

  const { scanData, serial } = location.state || {};

  useEffect(() => {
    if (!scanData) {
      navigate('/home', { replace: true });
    }
  }, []);

  if (!scanData) return null;

  const product = scanData.product;
  const enterprise = scanData.enterprise;
  const label = scanData.label;
  const isFirstScan = scanData.isFirstScan;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // Chatbot State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatOpen && chatMessages.length === 0 && scanData) {
      const welcome = enterprise?.chatbotConfig?.welcomeMessage || 
        `Chào bạn! Cảm ơn bạn đã tin dùng sản phẩm của ${enterprise?.name || 'chúng tôi'}. Bạn có câu hỏi nào về sản phẩm "${product?.name || 'này'}" không?`;
      setChatMessages([{ sender: 'bot', text: welcome, time: new Date() }]);
    }
  }, [chatOpen, scanData]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    const newUserMsg = { sender: 'user', text: userText, time: new Date() };
    setChatMessages(prev => [...prev, newUserMsg]);
    setChatInput('');

    setTimeout(() => {
      let botResponse = '';
      const textLower = userText.toLowerCase().trim();

      const allQAs = [
        ...(product?.chatbotQA || []),
        ...(enterprise?.chatbotConfig?.qaList || [])
      ];

      let foundQA = null;
      for (const qa of allQAs) {
        if (qa.question && qa.answer) {
          const qClean = qa.question.toLowerCase().trim();
          if (textLower.includes(qClean) || qClean.includes(textLower)) {
            foundQA = qa;
            break;
          }
        }
      }

      if (foundQA) {
        botResponse = foundQA.answer;
      } else {
        if (textLower.includes('chào') || textLower.includes('hi') || textLower.includes('hello')) {
          botResponse = `Xin chào! Tôi có thể giúp gì cho bạn về sản phẩm ${product?.name || ''}?`;
        } else if (textLower.includes('hạn sử dụng') || textLower.includes('hsd') || textLower.includes('hạn')) {
          botResponse = `Sản phẩm này có thời hạn sử dụng được in trên bao bì. Hạn quét bảo hành hiển thị trên hệ thống là ${formatDate(label?.expiryDate || scanData?.label?.batchId?.expiryDate)}.`;
        } else if (textLower.includes('giá') || textLower.includes('bao nhiêu') || textLower.includes('tiền')) {
          botResponse = `Vui lòng tham khảo giá bán trực tiếp tại cửa hàng hoặc đại lý phân phối chính thức của chúng tôi.`;
        } else if (textLower.includes('địa chỉ') || textLower.includes('công ty') || textLower.includes('ở đâu')) {
          botResponse = `${enterprise?.name} có địa chỉ tại: ${enterprise?.address || 'N/A'}. Số điện thoại: ${enterprise?.phone || 'N/A'}.`;
        } else {
          botResponse = `Cảm ơn bạn đã quan tâm đến sản phẩm "${product?.name}". Bạn có thể truy cập website ${enterprise?.website || 'của chúng tôi'} để biết thêm thông tin chi tiết!`;
        }
      }

      setChatMessages(prev => [...prev, { sender: 'bot', text: botResponse, time: new Date() }]);
    }, 1000);
  };

  return (
    <div className="product-info-page">
      {/* Header */}
      <div className="product-info-header">
        <button
          className="product-info-back"
          onClick={() => navigate(-1)}
          aria-label="Quay lại"
        >
          <ArrowLeft size={22} />
        </button>
        <span className="product-info-header-title">Thông tin truy xuất</span>
      </div>

      <div className="product-info-body">
        {/* Verification badge */}
        <div className={`product-info-verify ${label?.scanCount > 5 ? 'product-info-verify--warning' : ''}`}>
          <div className="product-info-verify-icon">
            {label?.scanCount > 5 ? (
              <AlertTriangle size={22} />
            ) : (
              <ShieldCheck size={22} />
            )}
          </div>
          <div className="product-info-verify-text">
            {label?.scanCount > 5 ? (
              <>
                <h3>Cảnh báo</h3>
                <p>Sản phẩm đã được quét {label.scanCount} lần. Vui lòng kiểm tra kỹ nguồn gốc.</p>
              </>
            ) : (
              <>
                <h3>Sản phẩm chính hãng</h3>
                <p>Thông tin truy xuất nguồn gốc đã được xác thực</p>
              </>
            )}
          </div>
        </div>

        {/* Product card */}
        <div className="product-info-card">
          <div className="product-info-image-area">
            {product?.images?.[0] ? (
              <img src={product.images[0]} alt={product.name} />
            ) : (
              <div className="product-info-image-placeholder">
                <Package size={48} />
                <span>Chưa có hình ảnh</span>
              </div>
            )}
          </div>
          <div className="product-info-details">
            <h2 className="product-info-name">{product?.name || 'Sản phẩm'}</h2>
            {product?.description && (
              <p className="product-info-desc">{product.description}</p>
            )}
            <div className="product-info-rows">
              <div className="product-info-row">
                <div className="product-info-row-icon">
                  <QrCode size={16} />
                </div>
                <span className="product-info-row-label">Mã serial</span>
                <span className="product-info-row-value">{label?.serialNumber || serial}</span>
              </div>
              {product?.category && (
                <div className="product-info-row">
                  <div className="product-info-row-icon">
                    <Hash size={16} />
                  </div>
                  <span className="product-info-row-label">Danh mục</span>
                  <span className="product-info-row-value">{product.category}</span>
                </div>
              )}
              {product?.sku && (
                <div className="product-info-row">
                  <div className="product-info-row-icon">
                    <Package size={16} />
                  </div>
                  <span className="product-info-row-label">Mã SKU</span>
                  <span className="product-info-row-value">{product.sku}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scan stats */}
        <div className="product-info-stats">
          <div className="product-info-stat">
            <span className="product-info-stat-number">{label?.scanCount || 1}</span>
            <span className="product-info-stat-label">Lần quét</span>
          </div>
          <div className="product-info-stat">
            <span className="product-info-stat-number" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              {formatDate(label?.firstScannedAt || scanData?.firstScanTime)}
            </span>
            <span className="product-info-stat-label">Quét lần đầu</span>
          </div>
        </div>

        {/* Enterprise info */}
        {enterprise && (
          <div className="product-info-enterprise">
            <div className="product-info-enterprise-title">Doanh nghiệp sản xuất</div>
            <div className="product-info-enterprise-name">{enterprise.name}</div>
            {enterprise.address && (
              <div className="product-info-enterprise-row">
                <MapPin size={14} />
                {enterprise.address}
              </div>
            )}
            {enterprise.phone && (
              <div className="product-info-enterprise-row">
                <Phone size={14} />
                {enterprise.phone}
              </div>
            )}
            {enterprise.email && (
              <div className="product-info-enterprise-row">
                <Mail size={14} />
                {enterprise.email}
              </div>
            )}
            {enterprise.website && (
              <div className="product-info-enterprise-row">
                <Globe size={14} />
                {enterprise.website}
              </div>
            )}
          </div>
        )}

        {/* Distributor info */}
        {label?.distributorName && (
          <div className="product-info-distributor">
            <div className="product-info-distributor-title">Nhà phân phối</div>
            <div className="product-info-distributor-name">
              <Truck size={14} style={{ display: 'inline', marginRight: 6 }} />
              {label.distributorName}
            </div>
            {label.distributorAddress && (
              <div className="product-info-distributor-addr">{label.distributorAddress}</div>
            )}
          </div>
        )}
      </div>

      {/* Bottom button */}
      <div className="product-info-bottom">
        <button className="product-info-home-btn" onClick={() => navigate('/home')}>
          <Home size={18} />
          Quay lại trang chủ
        </button>
      </div>

      {/* Floating Chatbot Widget */}
      {enterprise?.chatbotConfig?.enabled !== false && (
        <div className="product-info-chatbot-widget">
          {!chatOpen ? (
            <button className="chatbot-toggle-btn" onClick={() => setChatOpen(true)}>
              <MessageSquare size={20} />
              <span>Trò chuyện</span>
            </button>
          ) : (
            <div className="chatbot-window">
              <div className="chatbot-header">
                <span>Trợ lý AI {enterprise?.name ? enterprise.name.split(' ').pop() : ''}</span>
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
                  <Send size={16} />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
