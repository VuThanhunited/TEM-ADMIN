import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import {
  Shield, CheckCircle, AlertTriangle, XCircle, MessageSquare, Send,
  Globe, Phone, MapPin, Building, Calendar, X, Eye, Info,
  Leaf, Factory, Truck, Store, Sparkles, Activity, Package
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
  const [userCoords, setUserCoords] = useState(null);
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
      applyTheme(res.template, res.theme);

      // Request Geolocation to log precise coordinate on server
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setUserCoords({ lat: latitude, lng: longitude });
            try {
              await api.sendScanLocation(serial, { lat: latitude, lng: longitude });
              console.log('Precise GPS location logged:', latitude, longitude);
            } catch (locationErr) {
              console.error('Failed to update scan coordinates:', locationErr);
            }
          },
          (geoErr) => {
            console.warn('Geolocation denied or error:', geoErr.message);
          },
          { enableHighAccuracy: true, timeout: 6000 }
        );
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Có lỗi xảy ra khi quét tem nhãn');
    } finally {
      setLoading(false);
    }
  };

  const applyTheme = (template, themeName) => {
    const root = document.documentElement;
    if (themeName && themeName !== 'default') {
      root.style.removeProperty('--primary-color');
      root.style.removeProperty('--secondary-color');
      root.style.removeProperty('--bg-color');
      root.style.removeProperty('--text-color');
      return;
    }
    if (!template) return;
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

  const { label, product, enterprise, template, isFirstScan, firstScanTime, theme } = data;
  const lightClass = isLightTheme() ? 'light-theme' : '';
  const layoutClass = `layout-${template.layout || 'default'}`;
  const themeClass = `theme-${theme || 'default'}`;

  const getPageStyle = () => {
    if (!template?.backgroundImage) return {};
    return {
      backgroundImage: `url(${template.backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    };
  };

  const lat = userCoords?.lat || 10.7769;
  const lng = userCoords?.lng || 106.7009;
  const mapUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
  const specs = product?.specifications ? Object.entries(product.specifications) : [];

  return (
    <div className={`scan-public-page ${lightClass} ${layoutClass} ${themeClass}`} style={getPageStyle()}>
      {!template?.backgroundImage && (
        <div className="scan-bg-effects">
          <div className="bg-orb orb-1"></div>
          <div className="bg-orb orb-2"></div>
        </div>
      )}

      <div className="scan-container">
        {/* Brand Header Logo */}
        {(template?.logo || enterprise.logo) && (
          <div className="scan-brand-header animate-fade-in">
            <img src={template?.logo || enterprise.logo} alt={enterprise.name} className="brand-header-logo" />
          </div>
        )}

        {/* Dynamic Layout Based on Theme */}
        {theme === 'agriculture' && (
          <div className="scan-card theme-agri-card">
            {/* Header section inspired by screenshot */}
            <div className="theme-header-block agriculture">
              <div className="check-outer-circle">
                <CheckCircle size={40} className="check-inner-icon" />
              </div>
              <h1 className="theme-title">XÁC THỰC THÀNH CÔNG</h1>
              <p className="theme-subtitle">Sản phẩm chính hãng có nguồn gốc rõ ràng</p>
            </div>

            {/* Verification Alert Message */}
            {label.scanCount === 1 || isFirstScan ? (
              <div className="scan-alert success agri-alert">
                <Shield size={20} className="info-icon" style={{ marginTop: 2 }} />
                <div>
                  <div className="alert-title">Xác thực lần đầu tiên</div>
                  <p>Chúc mừng! Bạn đã quét tem nhãn chính hãng của <strong>{enterprise.name}</strong>. Đây là lần quét đầu tiên.</p>
                </div>
              </div>
            ) : (
              <div className="scan-alert warning agri-alert-warn">
                <AlertTriangle size={20} className="info-icon" style={{ marginTop: 2 }} />
                <div>
                  <div className="alert-title">Cảnh báo quét lặp lại!</div>
                  <p>Mã này đã quét <strong>{label.scanCount} lần</strong>. Lần đầu vào lúc: <strong>{formatDateTime(firstScanTime)}</strong>.</p>
                </div>
              </div>
            )}

            {/* Product Details Section - 2 columns layout */}
            {template.showProductInfo && product && (
              <div className="product-details-grid">
                <div className="product-image-col">
                  {product.images && product.images[0] ? (
                    <img src={product.images[0]} alt={product.name} className="agri-product-img" />
                  ) : (
                    <div className="agri-product-img placeholder">🥦</div>
                  )}
                  <div className="scan-line"></div>
                </div>
                <div className="product-info-col">
                  <span className="agri-category-badge">{product.category || 'Nông sản'}</span>
                  <h2 className="agri-product-name">{product.name}</h2>
                  
                  <div className="agri-specs-list">
                    <div className="spec-row">
                      <span className="spec-label">Mã sản phẩm:</span>
                      <span className="spec-value">{product.sku || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="spec-row">
                      <span className="spec-label">Nhà sản xuất:</span>
                      <span className="spec-value">{enterprise.name}</span>
                    </div>
                    <div className="spec-row">
                      <span className="spec-label">Ngày thu hoạch:</span>
                      <span className="spec-value">{specs.find(s => s[0] === 'Ngày thu hoạch')?.[1] || 'Đang cập nhật'}</span>
                    </div>
                    <div className="spec-row">
                      <span className="spec-label">Tiêu chuẩn:</span>
                      <span className="spec-value highlight-green">{specs.find(s => s[0] === 'Tiêu chuẩn')?.[1] || 'VietGAP'}</span>
                    </div>
                    {specs.filter(s => s[0] !== 'Ngày thu hoạch' && s[0] !== 'Tiêu chuẩn').map(([key, val], idx) => (
                      <div className="spec-row" key={idx}>
                        <span className="spec-label">{key}:</span>
                        <span className="spec-value">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Traceability Step Flow */}
            <div className="traceability-section">
              <h4 className="section-title">THÔNG TIN TRUY XUẤT NGUỒN GỐC</h4>
              <div className="trace-flow-stepper">
                <div className="trace-step completed">
                  <div className="step-icon-circle"><Leaf size={16} /></div>
                  <div className="step-label">Sản xuất</div>
                  <div className="step-desc">Gieo trồng chuẩn</div>
                </div>
                <div className="trace-line completed"></div>
                <div className="trace-step completed">
                  <div className="step-icon-circle"><Package size={16} /></div>
                  <div className="step-label">Đóng gói</div>
                  <div className="step-desc">Sơ chế vô trùng</div>
                </div>
                <div className="trace-line completed"></div>
                <div className="trace-step completed">
                  <div className="step-icon-circle"><Truck size={16} /></div>
                  <div className="step-label">Vận chuyển</div>
                  <div className="step-desc">Chuỗi lạnh khép kín</div>
                </div>
                <div className="trace-line completed"></div>
                <div className="trace-step completed">
                  <div className="step-icon-circle"><Store size={16} /></div>
                  <div className="step-label">Bán lẻ</div>
                  <div className="step-desc">{label.distributorName || 'Điểm phân phối'}</div>
                </div>
              </div>
            </div>

            {/* Enterprise Owner details */}
            <div className="agri-info-card">
              <div className="enterprise-logo-title">
                {template?.logo || enterprise.logo ? (
                  <img src={template?.logo || enterprise.logo} alt={enterprise.name} className="enterprise-logo" />
                ) : (
                  <div className="enterprise-logo text-green">NS</div>
                )}
                <div>
                  <span className="enterprise-name-styled">{enterprise.name}</span>
                  <span className="enterprise-mst">MST: {enterprise.taxCode || '—'}</span>
                </div>
              </div>
              <div className="info-body">
                <div className="info-line"><MapPin size={14} className="icon-agri" /> {enterprise.address || '—'}</div>
                {enterprise.phone && <div className="info-line"><Phone size={14} className="icon-agri" /> {enterprise.phone}</div>}
                {enterprise.website && (
                  <div className="info-line">
                    <Globe size={14} className="icon-agri" /> 
                    <a href={enterprise.website} target="_blank" rel="noopener noreferrer" className="agri-link">{enterprise.website}</a>
                  </div>
                )}
              </div>
            </div>

            {/* Map GPS Scan Section */}
            <div className="map-section">
              <h4 className="section-title">BẢN ĐỒ ĐIỂM XÁC THỰC</h4>
              <div className="map-wrapper">
                <iframe src={mapUrl} width="100%" height="220" style={{ border: 0, borderRadius: 16 }} allowFullScreen="" loading="lazy"></iframe>
              </div>
            </div>

            {/* Serial code details */}
            <div className="agri-metadata-box">
              <div className="meta-row"><span>Mã Serial:</span><strong>{label.serialNumber}</strong></div>
              {template.showScanCount && <div className="meta-row"><span>Lượt quét:</span><strong>{label.scanCount} lần</strong></div>}
              <div className="meta-row"><span>Thời gian quét:</span><span>{formatDateTime(label.lastScannedAt)}</span></div>
            </div>
          </div>
        )}

        {theme === 'functional_food' && (
          <div className="scan-card theme-med-card">
            <div className="theme-header-block medical">
              <div className="check-outer-circle medical">
                <Shield size={40} className="check-inner-icon" />
              </div>
              <h1 className="theme-title">XÁC THỰC DƯỢC PHẨM CHÍNH HÃNG</h1>
              <p className="theme-subtitle">Sản phẩm chăm sóc sức khỏe đã kiểm định</p>
            </div>

            {/* Alert */}
            <div className={`scan-alert ${label.scanCount === 1 || isFirstScan ? 'success' : 'warning'} med-alert`}>
              <Info size={20} className="info-icon" />
              <div>
                <div className="alert-title">{label.scanCount === 1 || isFirstScan ? 'Sản phẩm chính gốc' : 'Cảnh báo lặp lại'}</div>
                <p>Nhãn dược phẩm này được kiểm chứng bởi hệ thống TEM Smart Label.</p>
              </div>
            </div>

            {/* Product info 2 cols */}
            {template.showProductInfo && product && (
              <div className="product-details-grid">
                <div className="product-image-col">
                  {product.images && product.images[0] ? (
                    <img src={product.images[0]} alt={product.name} className="med-product-img" />
                  ) : (
                    <div className="med-product-img placeholder">💊</div>
                  )}
                  <div className="scan-line-blue"></div>
                </div>
                <div className="product-info-col">
                  <span className="med-category-badge">{product.category || 'Dược phẩm'}</span>
                  <h2 className="med-product-name">{product.name}</h2>
                  
                  <div className="med-specs-list">
                    <div className="spec-row">
                      <span className="spec-label">Mã vạch (Barcode):</span>
                      <span className="spec-value">{product.barcode || '—'}</span>
                    </div>
                    <div className="spec-row">
                      <span className="spec-label">Số công bố (SDK):</span>
                      <span className="spec-value highlight-blue">{specs.find(s => s[0] === 'Số công bố')?.[1] || 'Đang cập nhật'}</span>
                    </div>
                    <div className="spec-row">
                      <span className="spec-label">Thành phần chính:</span>
                      <span className="spec-value">{specs.find(s => s[0] === 'Thành phần')?.[1] || 'Xem vỏ bao bì'}</span>
                    </div>
                    <div className="spec-row">
                      <span className="spec-label">Cách dùng:</span>
                      <span className="spec-value">{specs.find(s => s[0] === 'Cách dùng')?.[1] || 'Theo chỉ định'}</span>
                    </div>
                    {specs.filter(s => s[0] !== 'Số công bố' && s[0] !== 'Thành phần' && s[0] !== 'Cách dùng').map(([key, val], idx) => (
                      <div className="spec-row" key={idx}>
                        <span className="spec-label">{key}:</span>
                        <span className="spec-value">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Traceability Flow */}
            <div className="traceability-section">
              <h4 className="section-title">QUY TRÌNH CHẤT LƯỢNG & ĐẠT CHUẨN GMP</h4>
              <div className="trace-flow-stepper blue">
                <div className="trace-step completed">
                  <div className="step-icon-circle"><Shield size={16} /></div>
                  <div className="step-label">Kiểm duyệt</div>
                  <div className="step-desc">Nguyên liệu sạch</div>
                </div>
                <div className="trace-line completed"></div>
                <div className="trace-step completed">
                  <div className="step-icon-circle"><Factory size={16} /></div>
                  <div className="step-label">Sản xuất</div>
                  <div className="step-desc">Chuẩn GMP y tế</div>
                </div>
                <div className="trace-line completed"></div>
                <div className="trace-step completed">
                  <div className="step-icon-circle"><Activity size={16} /></div>
                  <div className="step-label">Kiểm định</div>
                  <div className="step-desc">Bộ Y Tế cấp SDK</div>
                </div>
                <div className="trace-line completed"></div>
                <div className="trace-step completed">
                  <div className="step-icon-circle"><Store size={16} /></div>
                  <div className="step-label">Phân phối</div>
                  <div className="step-desc">{label.distributorName || 'Đại lý phân phối'}</div>
                </div>
              </div>
            </div>

            {/* Manufacturer details */}
            <div className="med-info-card">
              <div className="enterprise-logo-title">
                {template?.logo || enterprise.logo ? (
                  <img src={template?.logo || enterprise.logo} alt={enterprise.name} className="enterprise-logo" />
                ) : (
                  <div className="enterprise-logo text-blue">DP</div>
                )}
                <div>
                  <span className="enterprise-name-styled text-blue">{enterprise.name}</span>
                  <span className="enterprise-mst">MST: {enterprise.taxCode || '—'}</span>
                </div>
              </div>
              <div className="info-body">
                <div className="info-line"><MapPin size={14} className="icon-blue" /> {enterprise.address || '—'}</div>
                {enterprise.phone && <div className="info-line"><Phone size={14} className="icon-blue" /> {enterprise.phone}</div>}
              </div>
            </div>

            {/* Map GPS */}
            <div className="map-section">
              <h4 className="section-title">BẢN ĐỒ XÁC THỰC GPS</h4>
              <div className="map-wrapper">
                <iframe src={mapUrl} width="100%" height="220" style={{ border: 0, borderRadius: 16 }} allowFullScreen="" loading="lazy"></iframe>
              </div>
            </div>

            {/* Metadata */}
            <div className="med-metadata-box">
              <div className="meta-row"><span>Mã Serial:</span><strong>{label.serialNumber}</strong></div>
              <div className="meta-row"><span>Lượt quét:</span><strong>{label.scanCount} lần</strong></div>
              <div className="meta-row"><span>Thời gian quét:</span><span>{formatDateTime(label.lastScannedAt)}</span></div>
            </div>
          </div>
        )}

        {theme === 'cosmetics' && (
          <div className="scan-card theme-cosm-card">
            <div className="theme-header-block cosmetics">
              <div className="check-outer-circle cosmetics">
                <Sparkles size={40} className="check-inner-icon" />
              </div>
              <h1 className="theme-title-cosm">AUTHENTICITY CERTIFICATE</h1>
              <p className="theme-subtitle-cosm">Mỹ Phẩm Cao Cấp Chính Hãng</p>
            </div>

            {/* Verification Alert Message */}
            <div className={`scan-alert ${label.scanCount === 1 || isFirstScan ? 'success' : 'warning'} cosm-alert`}>
              <CheckCircle size={20} className="info-icon" />
              <div>
                <div className="alert-title">{label.scanCount === 1 || isFirstScan ? 'Chứng nhận chính hãng' : 'Cảnh báo lặp lại'}</div>
                <p>Sản phẩm đã qua kiểm định chất lượng và đóng gói niêm phong chính thức.</p>
              </div>
            </div>

            {/* Product Details - 2 columns layout */}
            {template.showProductInfo && product && (
              <div className="product-details-grid">
                <div className="product-image-col">
                  {product.images && product.images[0] ? (
                    <img src={product.images[0]} alt={product.name} className="cosm-product-img" />
                  ) : (
                    <div className="cosm-product-img placeholder">💄</div>
                  )}
                  <div className="scan-line-pink"></div>
                </div>
                <div className="product-info-col">
                  <span className="cosm-category-badge">{product.category || 'Mỹ phẩm'}</span>
                  <h2 className="cosm-product-name">{product.name}</h2>
                  
                  <div className="cosm-specs-list">
                    <div className="spec-row">
                      <span className="spec-label">Thương hiệu:</span>
                      <span className="spec-value highlight-pink">{enterprise.name}</span>
                    </div>
                    <div className="spec-row">
                      <span className="spec-label">Dung tích:</span>
                      <span className="spec-value">{specs.find(s => s[0] === 'Dung tích')?.[1] || 'Xem bao bì'}</span>
                    </div>
                    <div className="spec-row">
                      <span className="spec-label">Loại da khuyên dùng:</span>
                      <span className="spec-value">{specs.find(s => s[0] === 'Loại da')?.[1] || 'Mọi loại da'}</span>
                    </div>
                    <div className="spec-row">
                      <span className="spec-label">Hạn sử dụng:</span>
                      <span className="spec-value">{specs.find(s => s[0] === 'Hạn sử dụng')?.[1] || 'Xem đáy hộp'}</span>
                    </div>
                    {specs.filter(s => s[0] !== 'Dung tích' && s[0] !== 'Loại da' && s[0] !== 'Hạn sử dụng').map(([key, val], idx) => (
                      <div className="spec-row" key={idx}>
                        <span className="spec-label">{key}:</span>
                        <span className="spec-value">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quality Step Flow */}
            <div className="traceability-section">
              <h4 className="section-title cosm">QUY TRÌNH CHẤT LƯỢNG TIÊU CHUẨN CGMP</h4>
              <div className="trace-flow-stepper pink">
                <div className="trace-step completed">
                  <div className="step-icon-circle"><Sparkles size={16} /></div>
                  <div className="step-label">Công thức</div>
                  <div className="step-desc">Đạt chuẩn y khoa</div>
                </div>
                <div className="trace-line completed"></div>
                <div className="trace-step completed">
                  <div className="step-icon-circle"><Factory size={16} /></div>
                  <div className="step-label">Sản xuất</div>
                  <div className="step-desc">Chuẩn CGMP vô trùng</div>
                </div>
                <div className="trace-line completed"></div>
                <div className="trace-step completed">
                  <div className="step-icon-circle"><Package size={16} /></div>
                  <div className="step-label">Đóng gói</div>
                  <div className="step-desc">Seal chống giả</div>
                </div>
                <div className="trace-line completed"></div>
                <div className="trace-step completed">
                  <div className="step-icon-circle"><Store size={16} /></div>
                  <div className="step-label">Phân phối</div>
                  <div className="step-desc">{label.distributorName || 'Showroom chính hãng'}</div>
                </div>
              </div>
            </div>

            {/* Manufacturer details */}
            <div className="cosm-info-card">
              <div className="enterprise-logo-title">
                {template?.logo || enterprise.logo ? (
                  <img src={template?.logo || enterprise.logo} alt={enterprise.name} className="enterprise-logo" />
                ) : (
                  <div className="enterprise-logo text-pink">MP</div>
                )}
                <div>
                  <span className="enterprise-name-styled text-pink">{enterprise.name}</span>
                  <span className="enterprise-mst">MST: {enterprise.taxCode || '—'}</span>
                </div>
              </div>
              <div className="info-body">
                <div className="info-line"><MapPin size={14} className="icon-pink" /> {enterprise.address || '—'}</div>
                {enterprise.phone && <div className="info-line"><Phone size={14} className="icon-pink" /> {enterprise.phone}</div>}
              </div>
            </div>

            {/* Map GPS */}
            <div className="map-section">
              <h4 className="section-title cosm">BẢN ĐỒ ĐIỂM QUÉT QUỐC TẾ</h4>
              <div className="map-wrapper">
                <iframe src={mapUrl} width="100%" height="220" style={{ border: 0, borderRadius: 16 }} allowFullScreen="" loading="lazy"></iframe>
              </div>
            </div>

            {/* Metadata */}
            <div className="cosm-metadata-box">
              <div className="meta-row"><span>Serial Number:</span><strong>{label.serialNumber}</strong></div>
              <div className="meta-row"><span>Scan Count:</span><strong>{label.scanCount} times</strong></div>
              <div className="meta-row"><span>Verified At:</span><span>{formatDateTime(label.lastScannedAt)}</span></div>
            </div>
          </div>
        )}

        {(theme !== 'agriculture' && theme !== 'functional_food' && theme !== 'cosmetics') && (
          <div className="scan-card">
            <div className="verif-badge-container">
              {label.scanCount === 1 || isFirstScan ? (
                <div className="verif-badge success">
                  <Shield size={24} className="icon-shield" />
                  <span>SẢN PHẨM CHÍNH HÃNG</span>
                </div>
              ) : (
                <div className="verif-badge warning">
                  <AlertTriangle size={24} className="icon-warning" />
                  <span>CẢNH BÁO QUÉT TRÙNG</span>
                </div>
              )}
              <p className="verif-text">Hệ thống xác thực điện tử TEM Smart Label</p>
            </div>

            {/* Verification Alert Message */}
            {label.scanCount === 1 || isFirstScan ? (
              <div className="scan-alert success">
                <Shield size={20} className="info-icon" style={{ marginTop: 2 }} />
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
                  <div className="scan-image-wrapper">
                    <img src={product.images[0]} alt={product.name} className="scan-product-image" />
                    <div className="scan-line"></div>
                  </div>
                ) : (
                  <div className="scan-image-wrapper">
                    <div className="scan-product-image" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '3rem', background: 'rgba(255,255,255,0.02)', aspectRatio: 1 }}>📦</div>
                    <div className="scan-line"></div>
                  </div>
                )}
                <div>
                  <h2 className="scan-product-name">{product.name}</h2>
                  <span className="badge badge-neutral" style={{ marginTop: 6, display: 'inline-block' }}>{product.category || 'Sản phẩm'}</span>
                  <p className="scan-product-desc" style={{ marginTop: 12 }}>{product.description}</p>
                  
                  {/* Dynamic specs if any */}
                  {specs.length > 0 && (
                    <div className="generic-specs-list" style={{ marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
                      {specs.map(([key, val], idx) => (
                        <div className="serial-row" key={idx} style={{ padding: '6px 0' }}>
                          <span className="serial-label">{key}</span>
                          <span className="serial-value">{val}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Enterprise / Manufacturer Section */}
            <div className="scan-info-block">
              <h4 className="block-title">Đơn vị sở hữu & Sản xuất</h4>
              <div className="block-content">
                <div className="enterprise-logo-title">
                  {template?.logo || enterprise.logo ? (
                    <img src={template?.logo || enterprise.logo} alt={enterprise.name} className="enterprise-logo" />
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

            {/* Embedded Map for Default Theme */}
            <div className="scan-info-block" style={{ marginTop: 24 }}>
              <h4 className="block-title">Bản đồ định vị quét</h4>
              <div style={{ marginTop: 8, overflow: 'hidden', borderRadius: 12 }}>
                <iframe src={mapUrl} width="100%" height="200" style={{ border: 0 }} allowFullScreen="" loading="lazy"></iframe>
              </div>
            </div>

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
        )}
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
