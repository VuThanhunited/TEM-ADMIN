import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import {
  Shield, CheckCircle, AlertTriangle, XCircle, MessageSquare, Send,
  Globe, Phone, MapPin, Building, Calendar, X, Eye, Info,
  Leaf, Factory, Truck, Store, Sparkles, Activity, Package,
  ArrowLeft, MoreVertical, Download, Share2, Sprout, Droplet,
  ClipboardCheck, FlaskConical, Beaker, Award, Link2,
  ChevronLeft, ChevronRight, QrCode, FileText, ScanLine, History,
  BookOpen, Gift, BadgeCheck, Star
} from 'lucide-react';
import './Scan.css';

export default function Scan() {
  const { serial } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sliderIndex, setSliderIndex] = useState(0);
  const [activeSection, setActiveSection] = useState(null);
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
        {/* Dynamic Layout Based on Theme */}
        {theme === 'agriculture' && (
          <>
            {/* Brand Top Header */}
            <div className="brand-top-header agri">
              <div className="brand-header-left">
                <div className="brand-logo-circle agri">
                  {enterprise.logo ? (
                    <img src={enterprise.logo} alt={enterprise.name} className="brand-logo-img" />
                  ) : (
                    <Leaf size={22} className="brand-logo-icon" />
                  )}
                </div>
                <div className="brand-name-col">
                  <span className="brand-name-top">{enterprise.name?.split(' ').slice(-2).join(' ') || enterprise.name}</span>
                  <span className="brand-name-bottom">{enterprise.name?.split(' ').slice(0, -2).join(' ') || ''}</span>
                </div>
              </div>
              <div className="brand-divider-v"></div>
              <span className="brand-slogan">{enterprise.description || 'Chất lượng tạo niềm tin'}</span>
            </div>

            {/* Product Image Slider */}
            {template.showProductInfo && product && product.images && product.images.length > 0 && (
              <div className="product-slider-wrapper">
                <div className="slider-track" style={{ transform: `translateX(-${sliderIndex * 100}%)` }}>
                  {product.images.map((img, idx) => (
                    <div className="slide-item" key={idx}>
                      <img src={img} alt={`${product.name} ${idx + 1}`} className="slide-img" />
                    </div>
                  ))}
                  {product.images.length === 1 && [
                    <div className="slide-item" key="dup1"><img src={product.images[0]} alt={product.name} className="slide-img" /></div>,
                    <div className="slide-item" key="dup2"><img src={product.images[0]} alt={product.name} className="slide-img" /></div>
                  ]}
                </div>
                {product.images.length > 1 && (
                  <>
                    <button className="slider-btn prev" onClick={() => setSliderIndex(i => Math.max(0, i - 1))}><ChevronLeft size={20}/></button>
                    <button className="slider-btn next" onClick={() => setSliderIndex(i => Math.min(product.images.length - 1, i + 1))}><ChevronRight size={20}/></button>
                  </>
                )}
                <div className="slider-dots">
                  {(product.images.length > 1 ? product.images : [1,2,3]).map((_, idx) => (
                    <span key={idx} className={`slider-dot ${sliderIndex === idx ? 'active' : ''}`} onClick={() => setSliderIndex(idx)} />
                  ))}
                </div>
              </div>
            )}
            {!(template.showProductInfo && product && product.images && product.images.length > 0) && (
              <div className="product-slider-placeholder agri">
                <Leaf size={48} />
                <span>Sản phẩm nông nghiệp</span>
              </div>
            )}

            {/* Verification Banner */}
            <div className="verify-banner-new agri">
              <div className="verify-banner-icon agri">
                <Shield size={32} />
              </div>
              <div className="verify-banner-text">
                <h3 className="verify-banner-title">SẢN PHẨM ĐÃ ĐƯỢC XÁC THỰC</h3>
                <p className="verify-banner-desc">Nguồn gốc sản phẩm được xác nhận<br/>trực tiếp từ nhà sản xuất.</p>
              </div>
              <div className="verify-banner-bg-icon"><Shield size={64} /></div>
            </div>

            {/* Product Summary Card */}
            {template.showProductInfo && product && (
              <div className="product-summary-card">
                <div className="psc-image-col">
                  {product.images && product.images[0] ? (
                    <img src={product.images[0]} alt={product.name} className="psc-product-img" />
                  ) : (
                    <div className="psc-product-img placeholder">🌿</div>
                  )}
                </div>
                <div className="psc-info-col">
                  <h2 className="psc-product-name">{product.name.toUpperCase()}</h2>
                  <p className="psc-manufacturer">Đơn vị sản xuất:</p>
                  <p className="psc-manufacturer-name">{enterprise.name.toUpperCase()}</p>
                  <div className="psc-origin">
                    <MapPin size={13} className="psc-origin-icon" />
                    <span>Xuất xứ: {specs.find(s => s[0] === 'Xuất xứ')?.[1] || specs.find(s => s[0] === 'Nguồn gốc')?.[1] || 'Việt Nam'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 8-Button Action Grid */}
            <div className="action-grid-8">
              <button className="action-grid-btn" onClick={() => setActiveSection(activeSection === 'product' ? null : 'product')}>
                <div className="agb-icon-circle agri"><Package size={22} /></div>
                <span>THÔNG TIN<br/>SẢN PHẨM</span>
              </button>
              <button className="action-grid-btn" onClick={() => setActiveSection(activeSection === 'manufacturer' ? null : 'manufacturer')}>
                <div className="agb-icon-circle agri"><Factory size={22} /></div>
                <span>THÔNG TIN<br/>NHÀ SẢN XUẤT</span>
              </button>
              <button className="action-grid-btn" onClick={() => setActiveSection(activeSection === 'distributor' ? null : 'distributor')}>
                <div className="agb-icon-circle agri"><Truck size={22} /></div>
                <span>THÔNG TIN<br/>NHÀ PHÂN PHỐI</span>
              </button>
              <button className="action-grid-btn" onClick={() => setActiveSection(activeSection === 'label' ? null : 'label')}>
                <div className="agb-icon-circle agri"><QrCode size={22} /></div>
                <span>THÔNG TIN<br/>TEM SẢN PHẨM</span>
              </button>
              <button className="action-grid-btn" onClick={() => setActiveSection(activeSection === 'history' ? null : 'history')}>
                <div className="agb-icon-circle agri"><History size={22} /></div>
                <span>LỊCH SỬ<br/>SCAN</span>
              </button>
              <button className="action-grid-btn" onClick={() => setActiveSection(activeSection === 'cert' ? null : 'cert')}>
                <div className="agb-icon-circle agri"><BadgeCheck size={22} /></div>
                <span>CHỨNG<br/>NHẬN</span>
              </button>
              <button className="action-grid-btn" onClick={() => setActiveSection(activeSection === 'guide' ? null : 'guide')}>
                <div className="agb-icon-circle agri"><BookOpen size={22} /></div>
                <span>HƯỚNG DẪN<br/>SỬ DỤNG</span>
              </button>
              <button className="action-grid-btn" onClick={() => setActiveSection(activeSection === 'points' ? null : 'points')}>
                <div className="agb-icon-circle agri"><Gift size={22} /></div>
                <span>TÍCH<br/>ĐIỂM</span>
              </button>
            </div>

            {/* Expandable Sections */}
            {activeSection === 'product' && template.showProductInfo && product && (
              <div className="expand-section-card agri">
                <div className="expand-section-header agri">
                  <Package size={16} /> <span>Thông tin sản phẩm</span>
                </div>
                <div className="expand-section-body">
                  <div className="spec-row-new">
                    <span className="spec-label-new">Tên sản phẩm:</span>
                    <span className="spec-value-new">{product.name}</span>
                  </div>
                  <div className="spec-row-new">
                    <span className="spec-label-new">Danh mục:</span>
                    <span className="spec-value-new">{product.category || 'Nông sản'}</span>
                  </div>
                  {specs.map(([key, val], idx) => (
                    <div className="spec-row-new" key={idx}>
                      <span className="spec-label-new">{key}:</span>
                      <span className="spec-value-new">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'manufacturer' && (
              <div className="expand-section-card agri">
                <div className="expand-section-header agri">
                  <Factory size={16} /> <span>Thông tin nhà sản xuất</span>
                </div>
                <div className="expand-section-body">
                  <div className="spec-row-new">
                    <span className="spec-label-new">Tên đơn vị:</span>
                    <span className="spec-value-new">{enterprise.name}</span>
                  </div>
                  <div className="spec-row-new">
                    <span className="spec-label-new">Địa chỉ:</span>
                    <span className="spec-value-new text-left">{enterprise.address || '—'}</span>
                  </div>
                  {enterprise.phone && <div className="spec-row-new"><span className="spec-label-new">Điện thoại:</span><span className="spec-value-new">{enterprise.phone}</span></div>}
                  {enterprise.taxCode && <div className="spec-row-new"><span className="spec-label-new">Mã số thuế:</span><span className="spec-value-new">{enterprise.taxCode}</span></div>}
                </div>
              </div>
            )}

            {activeSection === 'distributor' && (
              <div className="expand-section-card agri">
                <div className="expand-section-header agri">
                  <Truck size={16} /> <span>Thông tin nhà phân phối</span>
                </div>
                <div className="expand-section-body">
                  {label.distributorName ? (
                    <>
                      <div className="spec-row-new"><span className="spec-label-new">Tên điểm bán:</span><span className="spec-value-new">{label.distributorName}</span></div>
                      {label.distributorAddress && <div className="spec-row-new"><span className="spec-label-new">Địa chỉ:</span><span className="spec-value-new text-left">{label.distributorAddress}</span></div>}
                    </>
                  ) : (
                    <p className="expand-empty">Chưa có thông tin nhà phân phối.</p>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'label' && (
              <div className="expand-section-card agri">
                <div className="expand-section-header agri">
                  <QrCode size={16} /> <span>Thông tin tem sản phẩm</span>
                </div>
                <div className="expand-section-body">
                  <div className="spec-row-new"><span className="spec-label-new">Mã Serial:</span><span className="spec-value-new highlight-green">{label.serialNumber}</span></div>
                  <div className="spec-row-new"><span className="spec-label-new">Lô tem:</span><span className="spec-value-new">{label.batchId?.batchCode || '—'}</span></div>
                  <div className="spec-row-new"><span className="spec-label-new">Trạng thái:</span><span className="spec-value-new">{label.status === 'ACTIVE' ? 'Hoạt động' : label.status}</span></div>
                  <div className="spec-row-new"><span className="spec-label-new">Lần quét đầu:</span><span className="spec-value-new">{formatDateTime(firstScanTime) || '—'}</span></div>
                  <div className="spec-row-new"><span className="spec-label-new">Tổng lượt quét:</span><span className="spec-value-new">{label.scanCount || 0}</span></div>
                </div>
              </div>
            )}

            {activeSection === 'history' && (
              <div className="expand-section-card agri">
                <div className="expand-section-header agri">
                  <History size={16} /> <span>Lịch sử scan</span>
                </div>
                <div className="expand-section-body">
                  <div className="spec-row-new"><span className="spec-label-new">Tổng lần quét:</span><span className="spec-value-new">{label.scanCount || 0}</span></div>
                  <div className="spec-row-new"><span className="spec-label-new">Lần quét đầu tiên:</span><span className="spec-value-new">{formatDateTime(firstScanTime) || '—'}</span></div>
                  <div className="spec-row-new"><span className="spec-label-new">Lần quét gần nhất:</span><span className="spec-value-new">{formatDateTime(label.lastScannedAt) || '—'}</span></div>
                </div>
              </div>
            )}

            {activeSection === 'cert' && (
              <div className="expand-section-card agri">
                <div className="expand-section-header agri">
                  <BadgeCheck size={16} /> <span>Chứng nhận</span>
                </div>
                <div className="certifications-grid" style={{marginTop: 0}}>
                  <div className="cert-item">
                    <div className="cert-badge-wrapper vietgap">
                      <div className="vietgap-badge-design"><span className="vgap-main-text">Viet</span><span className="vgap-sub-text">GAP</span></div>
                    </div>
                    <span className="cert-name-label">VietGAP</span>
                    <span className="cert-number-label">Số: {specs.find(s => s[0].includes('VietGAP'))?.[1] || 'VietGAP-TT-13-23-45'}</span>
                  </div>
                  <div className="cert-item">
                    <div className="cert-badge-wrapper organic">
                      <div className="organic-badge-design"><span className="org-text-top">HỮU CƠ</span><span className="org-text-bottom">ORGANIC</span></div>
                    </div>
                    <span className="cert-name-label">Hữu cơ Việt Nam</span>
                    <span className="cert-number-label">Số: {specs.find(s => s[0].includes('Hữu cơ'))?.[1] || 'HC-23-1087'}</span>
                  </div>
                  <div className="cert-item">
                    <div className="cert-badge-wrapper iso">
                      <div className="iso-badge-design"><span className="iso-quacert">QUACERT</span><span className="iso-number">ISO 22000</span></div>
                    </div>
                    <span className="cert-name-label">ISO 22000:2018</span>
                    <span className="cert-number-label">Số: {specs.find(s => s[0].includes('ISO'))?.[1] || '22000-23-01'}</span>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'guide' && (
              <div className="expand-section-card agri">
                <div className="expand-section-header agri">
                  <BookOpen size={16} /> <span>Hướng dẫn sử dụng</span>
                </div>
                <div className="expand-section-body">
                  <p className="expand-guide-text">
                    {product?.description || `Sản phẩm ${product?.name || ''} được sản xuất theo quy trình nông nghiệp sạch, đảm bảo chất lượng. Bảo quản nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp.`}
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'points' && (
              <div className="expand-section-card agri">
                <div className="expand-section-header agri">
                  <Gift size={16} /> <span>Tích điểm</span>
                </div>
                <div className="expand-section-body">
                  <div className="points-info-box agri">
                    <Star size={32} className="points-star" />
                    <p>Mỗi lần quét tem, bạn nhận được <strong>10 điểm</strong> thưởng tích lũy.</p>
                    <p>Liên hệ {enterprise.name} để đổi quà hấp dẫn!</p>
                    {enterprise.phone && <p>📞 {enterprise.phone}</p>}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        {theme === 'functional_food' && (
          <>
            {/* Brand Top Header */}
            <div className="brand-top-header food">
              <div className="brand-header-left">
                <div className="brand-logo-circle food">
                  {enterprise.logo ? (
                    <img src={enterprise.logo} alt={enterprise.name} className="brand-logo-img" />
                  ) : (
                    <FlaskConical size={22} className="brand-logo-icon" />
                  )}
                </div>
                <div className="brand-name-col">
                  <span className="brand-name-top">{enterprise.name?.split(' ').slice(-2).join(' ') || enterprise.name}</span>
                  <span className="brand-name-bottom">{enterprise.name?.split(' ').slice(0, -2).join(' ') || ''}</span>
                </div>
              </div>
              <div className="brand-divider-v"></div>
              <span className="brand-slogan">{enterprise.description || 'Chất lượng tạo niềm tin'}</span>
            </div>

            {/* Product Image Slider */}
            {template.showProductInfo && product && product.images && product.images.length > 0 && (
              <div className="product-slider-wrapper">
                <div className="slider-track" style={{ transform: `translateX(-${sliderIndex * 100}%)` }}>
                  {product.images.map((img, idx) => (
                    <div className="slide-item" key={idx}>
                      <img src={img} alt={`${product.name} ${idx + 1}`} className="slide-img" />
                    </div>
                  ))}
                  {product.images.length === 1 && [
                    <div className="slide-item" key="dup1"><img src={product.images[0]} alt={product.name} className="slide-img" /></div>,
                    <div className="slide-item" key="dup2"><img src={product.images[0]} alt={product.name} className="slide-img" /></div>
                  ]}
                </div>
                {product.images.length > 1 && (
                  <>
                    <button className="slider-btn prev" onClick={() => setSliderIndex(i => Math.max(0, i - 1))}><ChevronLeft size={20}/></button>
                    <button className="slider-btn next" onClick={() => setSliderIndex(i => Math.min(product.images.length - 1, i + 1))}><ChevronRight size={20}/></button>
                  </>
                )}
                <div className="slider-dots">
                  {(product.images.length > 1 ? product.images : [1,2,3]).map((_, idx) => (
                    <span key={idx} className={`slider-dot ${sliderIndex === idx ? 'active food' : ''}`} onClick={() => setSliderIndex(idx)} />
                  ))}
                </div>
              </div>
            )}
            {!(template.showProductInfo && product && product.images && product.images.length > 0) && (
              <div className="product-slider-placeholder food">
                <FlaskConical size={48} />
                <span>Thực phẩm chức năng</span>
              </div>
            )}

            {/* Verification Banner */}
            <div className="verify-banner-new food">
              <div className="verify-banner-icon food">
                <Shield size={32} />
              </div>
              <div className="verify-banner-text">
                <h3 className="verify-banner-title">SẢN PHẨM ĐÃ ĐƯỢC XÁC THỰC</h3>
                <p className="verify-banner-desc">Nguồn gốc sản phẩm được xác nhận<br/>trực tiếp từ nhà sản xuất.</p>
              </div>
              <div className="verify-banner-bg-icon"><Shield size={64} /></div>
            </div>

            {/* Product Summary Card */}
            {template.showProductInfo && product && (
              <div className="product-summary-card">
                <div className="psc-image-col">
                  {product.images && product.images[0] ? (
                    <img src={product.images[0]} alt={product.name} className="psc-product-img" />
                  ) : (
                    <div className="psc-product-img placeholder">💊</div>
                  )}
                </div>
                <div className="psc-info-col">
                  <h2 className="psc-product-name">{product.name.toUpperCase()}</h2>
                  <p className="psc-manufacturer">Đơn vị sản xuất:</p>
                  <p className="psc-manufacturer-name">{enterprise.name.toUpperCase()}</p>
                  <div className="psc-origin">
                    <MapPin size={13} className="psc-origin-icon" />
                    <span>Xuất xứ: {specs.find(s => s[0] === 'Xuất xứ')?.[1] || specs.find(s => s[0] === 'Nguồn gốc')?.[1] || 'Việt Nam'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 8-Button Action Grid */}
            <div className="action-grid-8">
              <button className="action-grid-btn" onClick={() => setActiveSection(activeSection === 'product' ? null : 'product')}>
                <div className="agb-icon-circle food"><Package size={22} /></div>
                <span>THÔNG TIN<br/>SẢN PHẨM</span>
              </button>
              <button className="action-grid-btn" onClick={() => setActiveSection(activeSection === 'manufacturer' ? null : 'manufacturer')}>
                <div className="agb-icon-circle food"><Factory size={22} /></div>
                <span>THÔNG TIN<br/>NHÀ SẢN XUẤT</span>
              </button>
              <button className="action-grid-btn" onClick={() => setActiveSection(activeSection === 'distributor' ? null : 'distributor')}>
                <div className="agb-icon-circle food"><Truck size={22} /></div>
                <span>THÔNG TIN<br/>NHÀ PHÂN PHỐI</span>
              </button>
              <button className="action-grid-btn" onClick={() => setActiveSection(activeSection === 'label' ? null : 'label')}>
                <div className="agb-icon-circle food"><QrCode size={22} /></div>
                <span>THÔNG TIN<br/>TEM SẢN PHẨM</span>
              </button>
              <button className="action-grid-btn" onClick={() => setActiveSection(activeSection === 'history' ? null : 'history')}>
                <div className="agb-icon-circle food"><History size={22} /></div>
                <span>LỊCH SỬ<br/>SCAN</span>
              </button>
              <button className="action-grid-btn" onClick={() => setActiveSection(activeSection === 'cert' ? null : 'cert')}>
                <div className="agb-icon-circle food"><BadgeCheck size={22} /></div>
                <span>CHỨNG<br/>NHẬN</span>
              </button>
              <button className="action-grid-btn" onClick={() => setActiveSection(activeSection === 'guide' ? null : 'guide')}>
                <div className="agb-icon-circle food"><BookOpen size={22} /></div>
                <span>HƯỚNG DẪN<br/>SỬ DỤNG</span>
              </button>
              <button className="action-grid-btn" onClick={() => setActiveSection(activeSection === 'points' ? null : 'points')}>
                <div className="agb-icon-circle food"><Gift size={22} /></div>
                <span>TÍCH<br/>ĐIỂM</span>
              </button>
            </div>

            {/* Expandable Sections */}
            {activeSection === 'product' && template.showProductInfo && product && (
              <div className="expand-section-card food">
                <div className="expand-section-header food">
                  <Package size={16} /> <span>Thông tin sản phẩm</span>
                </div>
                <div className="expand-section-body">
                  <div className="spec-row-new">
                    <span className="spec-label-new">Tên sản phẩm:</span>
                    <span className="spec-value-new">{product.name}</span>
                  </div>
                  <div className="spec-row-new">
                    <span className="spec-label-new">Danh mục:</span>
                    <span className="spec-value-new">{product.category || 'Thực phẩm chức năng'}</span>
                  </div>
                  {specs.map(([key, val], idx) => (
                    <div className="spec-row-new" key={idx}>
                      <span className="spec-label-new">{key}:</span>
                      <span className="spec-value-new">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'manufacturer' && (
              <div className="expand-section-card food">
                <div className="expand-section-header food">
                  <Factory size={16} /> <span>Thông tin nhà sản xuất</span>
                </div>
                <div className="expand-section-body">
                  <div className="spec-row-new">
                    <span className="spec-label-new">Tên đơn vị:</span>
                    <span className="spec-value-new">{enterprise.name}</span>
                  </div>
                  <div className="spec-row-new">
                    <span className="spec-label-new">Địa chỉ:</span>
                    <span className="spec-value-new text-left">{enterprise.address || '—'}</span>
                  </div>
                  {enterprise.phone && <div className="spec-row-new"><span className="spec-label-new">Điện thoại:</span><span className="spec-value-new">{enterprise.phone}</span></div>}
                  {enterprise.taxCode && <div className="spec-row-new"><span className="spec-label-new">Mã số thuế:</span><span className="spec-value-new">{enterprise.taxCode}</span></div>}
                </div>
              </div>
            )}

            {activeSection === 'distributor' && (
              <div className="expand-section-card food">
                <div className="expand-section-header food">
                  <Truck size={16} /> <span>Thông tin nhà phân phối</span>
                </div>
                <div className="expand-section-body">
                  {label.distributorName ? (
                    <>
                      <div className="spec-row-new"><span className="spec-label-new">Tên điểm bán:</span><span className="spec-value-new">{label.distributorName}</span></div>
                      {label.distributorAddress && <div className="spec-row-new"><span className="spec-label-new">Địa chỉ:</span><span className="spec-value-new text-left">{label.distributorAddress}</span></div>}
                    </>
                  ) : (
                    <p className="expand-empty">Chưa có thông tin nhà phân phối.</p>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'label' && (
              <div className="expand-section-card food">
                <div className="expand-section-header food">
                  <QrCode size={16} /> <span>Thông tin tem sản phẩm</span>
                </div>
                <div className="expand-section-body">
                  <div className="spec-row-new"><span className="spec-label-new">Mã Serial:</span><span className="spec-value-new highlight-blue">{label.serialNumber}</span></div>
                  <div className="spec-row-new"><span className="spec-label-new">Lô tem:</span><span className="spec-value-new">{label.batchId?.batchCode || '—'}</span></div>
                  <div className="spec-row-new"><span className="spec-label-new">Trạng thái:</span><span className="spec-value-new">{label.status === 'ACTIVE' ? 'Hoạt động' : label.status}</span></div>
                  <div className="spec-row-new"><span className="spec-label-new">Lần quét đầu:</span><span className="spec-value-new">{formatDateTime(firstScanTime) || '—'}</span></div>
                  <div className="spec-row-new"><span className="spec-label-new">Tổng lượt quét:</span><span className="spec-value-new">{label.scanCount || 0}</span></div>
                </div>
              </div>
            )}

            {activeSection === 'history' && (
              <div className="expand-section-card food">
                <div className="expand-section-header food">
                  <History size={16} /> <span>Lịch sử scan</span>
                </div>
                <div className="expand-section-body">
                  <div className="spec-row-new"><span className="spec-label-new">Tổng lần quét:</span><span className="spec-value-new">{label.scanCount || 0}</span></div>
                  <div className="spec-row-new"><span className="spec-label-new">Lần quét đầu tiên:</span><span className="spec-value-new">{formatDateTime(firstScanTime) || '—'}</span></div>
                  <div className="spec-row-new"><span className="spec-label-new">Lần quét gần nhất:</span><span className="spec-value-new">{formatDateTime(label.lastScannedAt) || '—'}</span></div>
                </div>
              </div>
            )}

            {activeSection === 'cert' && (
              <div className="expand-section-card food">
                <div className="expand-section-header food">
                  <BadgeCheck size={16} /> <span>Chứng nhận</span>
                </div>
                <div className="certifications-grid med" style={{marginTop: 0}}>
                  <div className="cert-item">
                    <div className="cert-badge-wrapper sdk"><div className="sdk-badge-design"><span className="sdk-main-text">SDK</span><span className="sdk-sub-text">BỘ Y TẾ</span></div></div>
                    <span className="cert-name-label">Công bố sản phẩm</span>
                    <span className="cert-number-label">Số: {specs.find(s => s[0].includes('SDK') || s[0].includes('công bố'))?.[1] || 'SDK-2024-0589'}</span>
                  </div>
                  <div className="cert-item">
                    <div className="cert-badge-wrapper gmp"><div className="gmp-badge-design"><span className="gmp-text-top">GMP</span><span className="gmp-text-bottom">WHO</span></div></div>
                    <span className="cert-name-label">Tiêu chuẩn GMP</span>
                    <span className="cert-number-label">Số: {specs.find(s => s[0].includes('GMP'))?.[1] || 'GMP-VN-2023-12'}</span>
                  </div>
                  <div className="cert-item">
                    <div className="cert-badge-wrapper iso-med"><div className="iso-badge-design"><span className="iso-quacert">QUACERT</span><span className="iso-number">ISO 22000</span></div></div>
                    <span className="cert-name-label">ISO 22000:2018</span>
                    <span className="cert-number-label">Số: {specs.find(s => s[0].includes('ISO'))?.[1] || '22000-24-02'}</span>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'guide' && (
              <div className="expand-section-card food">
                <div className="expand-section-header food">
                  <BookOpen size={16} /> <span>Hướng dẫn sử dụng</span>
                </div>
                <div className="expand-section-body">
                  <p className="expand-guide-text">
                    {product?.description || `Sản phẩm ${product?.name || ''} là thực phẩm chức năng được sản xuất theo tiêu chuẩn GMP. Dùng theo hướng dẫn của nhà sản xuất hoặc chuyên gia y tế. Bảo quản nơi khô ráo, thoáng mát.`}
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'points' && (
              <div className="expand-section-card food">
                <div className="expand-section-header food">
                  <Gift size={16} /> <span>Tích điểm</span>
                </div>
                <div className="expand-section-body">
                  <div className="points-info-box food">
                    <Star size={32} className="points-star food" />
                    <p>Mỗi lần quét tem, bạn nhận được <strong>10 điểm</strong> thưởng tích lũy.</p>
                    <p>Liên hệ {enterprise.name} để đổi quà hấp dẫn!</p>
                    {enterprise.phone && <p>📞 {enterprise.phone}</p>}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        {theme === 'cosmetics' && (
          <>
            <div className="cosm-header-bar">
              <button className="header-back-btn" onClick={() => window.history.back()}><ArrowLeft size={20} /></button>
              <span className="header-title">Kết quả truy xuất</span>
              <button className="header-more-btn"><MoreVertical size={20} /></button>
            </div>

            <div className="scan-card theme-cosm-card">
              <div className="cosm-verification-block">
                <div className="cosm-success-circle">
                  <svg className="check-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="cosm-verif-text-col">
                  <h2 className="cosm-verif-title">XÁC THỰC THÀNH CÔNG</h2>
                  <h3 className="cosm-verif-subtitle">Mỹ phẩm chính hãng</h3>
                  <p className="cosm-verif-desc">Cảm ơn bạn đã tin tưởng sản phẩm làm đẹp Việt Nam</p>
                </div>
              </div>

              {template.showProductInfo && product && (
                <div className="product-details-grid-cosm">
                  <div className="product-image-col-cosm">
                    {product.images && product.images[0] ? (
                      <img src={product.images[0]} alt={product.name} className="cosm-product-img" />
                    ) : (
                      <div className="cosm-product-img placeholder">💄</div>
                    )}
                    <div className="scan-line-pink"></div>
                  </div>
                  <div className="product-info-col-cosm">
                    <h2 className="cosm-product-title-bold">{product.name.toUpperCase()}</h2>
                    <div className="cosm-specs-list-new">
                      <div className="spec-row-new">
                        <span className="spec-label-new">Mã lô hàng:</span>
                        <span className="spec-value-new highlight-pink">{label.batchId?.batchCode || specs.find(s => s[0] === 'Mã lô hàng')?.[1] || 'HS-2024-001'}</span>
                      </div>
                      <div className="spec-row-new">
                        <span className="spec-label-new">Thương hiệu:</span>
                        <span className="spec-value-new">{enterprise.name || 'Hoa Sen Beauty'}</span>
                      </div>
                      <div className="spec-row-new">
                        <span className="spec-label-new">Dung tích:</span>
                        <span className="spec-value-new">{specs.find(s => s[0] === 'Dung tích')?.[1] || '50ml'}</span>
                      </div>
                      <div className="spec-row-new">
                        <span className="spec-label-new">Loại da khuyên dùng:</span>
                        <span className="spec-value-new">{specs.find(s => s[0] === 'Loại da')?.[1] || 'Mọi loại da'}</span>
                      </div>
                      <div className="spec-row-new">
                        <span className="spec-label-new">Hạn sử dụng:</span>
                        <span className="spec-value-new">{specs.find(s => s[0] === 'Hạn sử dụng')?.[1] || '36 tháng kể từ ngày SX'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="cosm-card-section">
                <div className="section-header-styled">
                  <div className="header-icon-circle-pink"><Building size={16} /></div>
                  <span className="section-title-bold">THÔNG TIN THƯƠNG HIỆU</span>
                </div>
                <div className="section-body-specs cosm">
                  <div className="spec-row-new">
                    <span className="spec-label-new">Tên thương hiệu:</span>
                    <span className="spec-value-new">{enterprise.name || 'Công ty Mỹ phẩm Hoa Sen'}</span>
                  </div>
                  <div className="spec-row-new">
                    <span className="spec-label-new">Địa chỉ:</span>
                    <span className="spec-value-new text-left">{enterprise.address || 'KCN VSIP, Thuận An, Bình Dương'}</span>
                  </div>
                  <div className="spec-row-new">
                    <span className="spec-label-new">Mã số thuế:</span>
                    <span className="spec-value-new">{enterprise.taxCode || '0987654321'}</span>
                  </div>
                </div>
              </div>

              <div className="cosm-card-section">
                <div className="section-header-styled">
                  <div className="header-icon-circle-pink"><Sparkles size={16} /></div>
                  <span className="section-title-bold">QUY TRÌNH SẢN XUẤT</span>
                </div>
                <div className="production-process-stepper cosm">
                  <div className="process-step-box">
                    <div className="step-square cosm">
                      <Beaker size={22} className="step-square-icon" />
                    </div>
                    <span className="step-square-label">Công thức</span>
                  </div>
                  <div className="process-arrow cosm">→</div>
                  <div className="process-step-box">
                    <div className="step-square cosm">
                      <Factory size={22} className="step-square-icon" />
                    </div>
                    <span className="step-square-label">Sản xuất CGMP</span>
                  </div>
                  <div className="process-arrow cosm">→</div>
                  <div className="process-step-box">
                    <div className="step-square cosm">
                      <Package size={22} className="step-square-icon" />
                    </div>
                    <span className="step-square-label">Đóng gói</span>
                  </div>
                  <div className="process-arrow cosm">→</div>
                  <div className="process-step-box">
                    <div className="step-square cosm">
                      <Store size={22} className="step-square-icon" />
                    </div>
                    <span className="step-square-label">Phân phối</span>
                  </div>
                </div>
              </div>

              <div className="cosm-card-section">
                <div className="section-header-styled">
                  <div className="header-icon-circle-pink"><Award size={16} /></div>
                  <span className="section-title-bold">CHỨNG NHẬN ĐẠT ĐƯỢC</span>
                </div>
                <div className="certifications-grid cosm">
                  <div className="cert-item">
                    <div className="cert-badge-wrapper cgmp">
                      <div className="cgmp-badge-design">
                        <span className="cgmp-text-top">CGMP</span>
                        <span className="cgmp-text-bottom">ASEAN</span>
                      </div>
                    </div>
                    <span className="cert-name-label">Tiêu chuẩn CGMP</span>
                    <span className="cert-number-label">Số: {specs.find(s => s[0].includes('CGMP'))?.[1] || 'CGMP-24-015'}</span>
                  </div>
                  <div className="cert-item">
                    <div className="cert-badge-wrapper iso-cosm">
                      <div className="iso-cosm-badge-design">
                        <span className="iso-cosm-text">ISO</span>
                        <span className="iso-cosm-number">22716</span>
                      </div>
                    </div>
                    <span className="cert-name-label">ISO 22716:2007</span>
                    <span className="cert-number-label">Số: {specs.find(s => s[0].includes('ISO'))?.[1] || '22716-24-08'}</span>
                  </div>
                  <div className="cert-item">
                    <div className="cert-badge-wrapper halal">
                      <div className="halal-badge-design">
                        <span className="halal-text-top">HALAL</span>
                        <span className="halal-text-bottom">CERTIFIED</span>
                      </div>
                    </div>
                    <span className="cert-name-label">Chứng nhận Halal</span>
                    <span className="cert-number-label">Số: {specs.find(s => s[0].includes('Halal'))?.[1] || 'HL-24-0321'}</span>
                  </div>
                </div>
              </div>

              <div className="cosm-card-section">
                <div className="section-header-styled map-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="header-icon-circle-pink"><MapPin size={16} /></div>
                    <span className="section-title-bold">VỊ TRÍ XƯỞNG SẢN XUẤT</span>
                  </div>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`} target="_blank" rel="noopener noreferrer" className="view-map-link cosm">
                    Xem trên bản đồ <span className="arrow-right-icon">→</span>
                  </a>
                </div>
                <div className="map-wrapper-new">
                  <iframe src={mapUrl} width="100%" height="200" style={{ border: 0 }} allowFullScreen="" loading="lazy"></iframe>
                  <div className="map-location-label cosm">
                    <MapPin size={14} className="icon-map-label" />
                    <span>{enterprise.name || 'Xưởng sản xuất Hoa Sen'}</span>
                  </div>
                </div>
              </div>

              <div className="cosm-action-buttons-row">
                <button className="action-footer-btn cosm" onClick={() => alert('Đang tải chứng nhận...')}>
                  <Download size={16} className="btn-footer-icon" /> Tải chứng nhận
                </button>
                <button className="action-footer-btn cosm" onClick={() => alert('Sao chép link để chia sẻ!')}>
                  <Share2 size={16} className="btn-footer-icon" /> Chia sẻ
                </button>
                <button className="action-footer-btn report" onClick={() => alert('Gửi báo cáo vi phạm thành công!')}>
                  <AlertTriangle size={16} className="btn-footer-icon" /> Báo cáo
                </button>
              </div>

              <div className="cosm-last-updated">
                Dữ liệu được cập nhật lần cuối: {specs.find(s => s[0] === 'Cập nhật')?.[1] || formatDateTime(label.lastScannedAt) || '18/05/2024 08:30'}
              </div>
            </div>
          </>
        )}

        {(theme !== 'agriculture' && theme !== 'functional_food' && theme !== 'cosmetics') && (
          <>
            <div className="def-header-bar">
              <button className="header-back-btn" onClick={() => window.history.back()}><ArrowLeft size={20} /></button>
              <span className="header-title">Kết quả truy xuất</span>
              <button className="header-more-btn"><MoreVertical size={20} /></button>
            </div>

            <div className="scan-card theme-def-card">
              <div className="def-verification-block">
                {label.scanCount === 1 || isFirstScan ? (
                  <div className="def-success-circle">
                    <svg className="check-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                ) : (
                  <div className="def-warning-circle">
                    <AlertTriangle size={28} />
                  </div>
                )}
                <div className="def-verif-text-col">
                  <h2 className="def-verif-title">
                    {label.scanCount === 1 || isFirstScan ? 'XÁC THỰC THÀNH CÔNG' : 'CẢNH BÁO QUÉT LẶP LẠI'}
                  </h2>
                  <h3 className="def-verif-subtitle">
                    {label.scanCount === 1 || isFirstScan ? 'Sản phẩm chính hãng' : `Đã quét ${label.scanCount} lần`}
                  </h3>
                  <p className="def-verif-desc">
                    {label.scanCount === 1 || isFirstScan
                      ? `Cảm ơn bạn đã tin tưởng sản phẩm của ${enterprise.name}`
                      : `Lần quét đầu tiên: ${formatDateTime(firstScanTime)}. Vui lòng kiểm tra nếu vừa mua mới.`}
                  </p>
                </div>
              </div>

              {template.showProductInfo && product && (
                <div className="product-details-grid-def">
                  <div className="product-image-col-def">
                    {product.images && product.images[0] ? (
                      <img src={product.images[0]} alt={product.name} className="def-product-img" />
                    ) : (
                      <div className="def-product-img placeholder">📦</div>
                    )}
                    <div className="scan-line-def"></div>
                  </div>
                  <div className="product-info-col-def">
                    <h2 className="def-product-title-bold">{product.name.toUpperCase()}</h2>
                    <div className="def-specs-list-new">
                      <div className="spec-row-new">
                        <span className="spec-label-new">Mã serial:</span>
                        <span className="spec-value-new highlight-default">{label.serialNumber}</span>
                      </div>
                      <div className="spec-row-new">
                        <span className="spec-label-new">Danh mục:</span>
                        <span className="spec-value-new">{product.category || 'Sản phẩm'}</span>
                      </div>
                      {product.sku && (
                        <div className="spec-row-new">
                          <span className="spec-label-new">Mã SKU:</span>
                          <span className="spec-value-new">{product.sku}</span>
                        </div>
                      )}
                      <div className="spec-row-new">
                        <span className="spec-label-new">Mã lô hàng:</span>
                        <span className="spec-value-new">{specs.find(s => s[0] === 'Mã lô hàng')?.[1] || label.batchId?.batchCode || '—'}</span>
                      </div>
                      {specs.filter(s => !['Mã lô hàng'].includes(s[0])).slice(0, 2).map(([key, val], idx) => (
                        <div className="spec-row-new" key={idx}>
                          <span className="spec-label-new">{key}:</span>
                          <span className="spec-value-new">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="def-card-section">
                <div className="section-header-styled">
                  <div className="header-icon-circle-def"><Building size={16} /></div>
                  <span className="section-title-bold">THÔNG TIN DOANH NGHIỆP</span>
                </div>
                <div className="section-body-specs def">
                  <div className="spec-row-new">
                    <span className="spec-label-new">Tên doanh nghiệp:</span>
                    <span className="spec-value-new">{enterprise.name}</span>
                  </div>
                  <div className="spec-row-new">
                    <span className="spec-label-new">Địa chỉ:</span>
                    <span className="spec-value-new text-left">{enterprise.address || '—'}</span>
                  </div>
                  <div className="spec-row-new">
                    <span className="spec-label-new">Mã số thuế:</span>
                    <span className="spec-value-new">{enterprise.taxCode || '—'}</span>
                  </div>
                  {enterprise.phone && (
                    <div className="spec-row-new">
                      <span className="spec-label-new">Điện thoại:</span>
                      <span className="spec-value-new">{enterprise.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {template.showDistributorInfo && label.distributorName && (
                <div className="def-card-section">
                  <div className="section-header-styled">
                    <div className="header-icon-circle-def"><Store size={16} /></div>
                    <span className="section-title-bold">ĐIỂM PHÂN PHỐI</span>
                  </div>
                  <div className="section-body-specs def">
                    <div className="spec-row-new">
                      <span className="spec-label-new">Tên điểm bán:</span>
                      <span className="spec-value-new">{label.distributorName}</span>
                    </div>
                    {label.distributorAddress && (
                      <div className="spec-row-new">
                        <span className="spec-label-new">Địa chỉ:</span>
                        <span className="spec-value-new text-left">{label.distributorAddress}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="def-card-section">
                <div className="section-header-styled">
                  <div className="header-icon-circle-def"><Shield size={16} /></div>
                  <span className="section-title-bold">QUY TRÌNH SẢN XUẤT</span>
                </div>
                <div className="production-process-stepper def">
                  <div className="process-step-box">
                    <div className="step-square def">
                      <Package size={22} className="step-square-icon" />
                    </div>
                    <span className="step-square-label">Nguyên liệu</span>
                  </div>
                  <div className="process-arrow def">→</div>
                  <div className="process-step-box">
                    <div className="step-square def">
                      <Factory size={22} className="step-square-icon" />
                    </div>
                    <span className="step-square-label">Sản xuất</span>
                  </div>
                  <div className="process-arrow def">→</div>
                  <div className="process-step-box">
                    <div className="step-square def">
                      <ClipboardCheck size={22} className="step-square-icon" />
                    </div>
                    <span className="step-square-label">Kiểm tra</span>
                  </div>
                  <div className="process-arrow def">→</div>
                  <div className="process-step-box">
                    <div className="step-square def">
                      <Truck size={22} className="step-square-icon" />
                    </div>
                    <span className="step-square-label">Phân phối</span>
                  </div>
                </div>
              </div>

              <div className="def-card-section">
                <div className="section-header-styled">
                  <div className="header-icon-circle-def"><Award size={16} /></div>
                  <span className="section-title-bold">CHỨNG NHẬN ĐẠT ĐƯỢC</span>
                </div>
                <div className="certifications-grid def">
                  <div className="cert-item">
                    <div className="cert-badge-wrapper haccp">
                      <div className="haccp-badge-design">
                        <span className="haccp-text-top">HACCP</span>
                        <span className="haccp-text-bottom">FOOD</span>
                      </div>
                    </div>
                    <span className="cert-name-label">An toàn thực phẩm</span>
                    <span className="cert-number-label">Số: {specs.find(s => s[0].includes('HACCP'))?.[1] || 'HACCP-24-001'}</span>
                  </div>
                  <div className="cert-item">
                    <div className="cert-badge-wrapper iso-def">
                      <div className="iso-def-badge-design">
                        <span className="iso-def-text">ISO</span>
                        <span className="iso-def-number">9001</span>
                      </div>
                    </div>
                    <span className="cert-name-label">ISO 9001:2015</span>
                    <span className="cert-number-label">Số: {specs.find(s => s[0].includes('ISO'))?.[1] || '9001-24-05'}</span>
                  </div>
                  <div className="cert-item">
                    <div className="cert-badge-wrapper tem">
                      <div className="tem-badge-design">
                        <span className="tem-text-top">TEM</span>
                        <span className="tem-text-bottom">SMART</span>
                      </div>
                    </div>
                    <span className="cert-name-label">Xác thực TEM</span>
                    <span className="cert-number-label">Số: {label.serialNumber}</span>
                  </div>
                </div>
              </div>

              <div className="def-card-section">
                <div className="section-header-styled map-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="header-icon-circle-def"><MapPin size={16} /></div>
                    <span className="section-title-bold">VỊ TRÍ QUÉT XÁC THỰC</span>
                  </div>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`} target="_blank" rel="noopener noreferrer" className="view-map-link def">
                    Xem trên bản đồ <span className="arrow-right-icon">→</span>
                  </a>
                </div>
                <div className="map-wrapper-new">
                  <iframe src={mapUrl} width="100%" height="200" style={{ border: 0 }} allowFullScreen="" loading="lazy"></iframe>
                  <div className="map-location-label def">
                    <MapPin size={14} className="icon-map-label" />
                    <span>{enterprise.name}</span>
                  </div>
                </div>
              </div>

              {(label.legacyQrCode || label.legacyTemQr || label.activeCode || label.smsCode) && (
                <div className="def-card-section">
                  <div className="section-header-styled">
                    <div className="header-icon-circle-def"><Link2 size={16} /></div>
                    <span className="section-title-bold">DỮ LIỆU TEM CŨ</span>
                  </div>
                  <div className="section-body-specs def">
                    {label.smsCode && (
                      <div className="spec-row-new">
                        <span className="spec-label-new">Mã SMS:</span>
                        <span className="spec-value-new">{label.smsCode}</span>
                      </div>
                    )}
                    {label.activeCode && (
                      <div className="spec-row-new">
                        <span className="spec-label-new">Mã kích hoạt:</span>
                        <span className="spec-value-new">{label.activeCode}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="def-action-buttons-row">
                <button className="action-footer-btn def" onClick={() => alert('Đang tải chứng nhận...')}>
                  <Download size={16} className="btn-footer-icon" /> Tải chứng nhận
                </button>
                <button className="action-footer-btn def" onClick={() => alert('Sao chép link để chia sẻ!')}>
                  <Share2 size={16} className="btn-footer-icon" /> Chia sẻ
                </button>
                <button className="action-footer-btn report" onClick={() => alert('Gửi báo cáo vi phạm thành công!')}>
                  <AlertTriangle size={16} className="btn-footer-icon" /> Báo cáo
                </button>
              </div>

              <div className="def-last-updated">
                Dữ liệu được cập nhật lần cuối: {formatDateTime(label.lastScannedAt) || '—'}
                {template.showScanCount && ` · Lượt quét: ${label.scanCount}`}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Dynamic Chatbot Widget */}
      {enterprise.chatbotConfig?.enabled !== false && (
        <div className="scan-chatbot-widget animate-fade-in">
          {!chatOpen ? (
            <button className="chatbot-toggle-btn" onClick={() => setChatOpen(true)}>
              {(theme === 'agriculture' || theme === 'functional_food') ? (
                <div className="chatbot-toggle-label">
                  <div className="chatbot-toggle-icon-wrap">
                    <MessageSquare size={20} />
                  </div>
                  <span className="chatbot-toggle-text"><strong>CHAT BOT</strong><br/>Hỏi và Đáp</span>
                </div>
              ) : (
                <MessageSquare size={24} />
              )}
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
