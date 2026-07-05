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
  BookOpen, Gift, BadgeCheck, Star, ShieldCheck, Bot
} from 'lucide-react';
import NPPLogin from './NPPLogin';
import DistributorEntry from './DistributorEntry';
import './Scan.css';

const getEffectiveTheme = (themeName, category) => {
  if (themeName === 'agriculture' || themeName === 'functional_food' || themeName === 'food' || themeName === 'medical' || themeName === 'cosmetics') {
    return themeName;
  }
  const cat = (category || '').toLowerCase().trim();
  
  const agriKeywords = [
    'nông nghiệp', 'nông sản', 'trồng trọt', 'chăn nuôi', 'thủy sản', 
    'hải sản', 'lâm sản', 'trái cây', 'rau củ', 'hoa quả', 'gạo', 
    'sâm', 'chè', 'agri'
  ];
  
  const foodKeywords = [
    'thực phẩm', 'gia vị', 'dầu ăn', 'nước uống', 'nước ngọt', 
    'nước đóng chai', 'nước ép', 'nước khoáng', 'bia', 'rượu', 
    'bánh kẹo', 'bánh', 'kẹo', 'sữa', 'ăn uống', 'dinh dưỡng', 
    'trà', 'cà phê', 'mật ong', 'yến sào', 'mật', 'mứt', 'food', 
    'beverage', 'snack', 'candy', 'milk'
  ];

  const isAgri = agriKeywords.some(keyword => cat.includes(keyword));
  const isFood = foodKeywords.some(keyword => cat.includes(keyword));

  if (isAgri) {
    return 'agriculture';
  } else if (isFood) {
    return 'food';
  }
  return themeName || 'default';
};

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
   const [activeCertDoc, setActiveCertDoc] = useState(null);
   const chatEndRef = useRef(null);
 
   // Choice screen & NPP states
   const [scanMode, setScanMode] = useState('choice'); // 'choice' | 'info' | 'distributor'
   const [showNPPLogin, setShowNPPLogin] = useState(false);
   const [nppUser, setNppUser] = useState(null);
   const [nppToken, setNppToken] = useState(null);
 
   // Images carousel auto-transition
   useEffect(() => {
     const imgs = data?.product?.images?.filter(Boolean) || [];
     if (imgs.length <= 1) return;
     const interval = setInterval(() => {
       setSliderIndex(prev => (prev + 1) % imgs.length);
     }, 3000);
     return () => clearInterval(interval);
   }, [data]);

   useEffect(() => {
     loadScanData();
     // Restore NPP session if exists
     const savedToken = localStorage.getItem('npp_scan_token');
     const savedUser = localStorage.getItem('npp_scan_user');
     if (savedToken && savedUser) {
       try {
         setNppToken(savedToken);
         setNppUser(JSON.parse(savedUser));
       } catch { /* ignore */ }
     }
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
    setScanMode('choice');
    try {
      let res;
      try {
        res = await api.getPublicScan(serial);
      } catch (err) {
        // Fallback to barcode lookup
        res = await api.getPublicBarcode(serial);
      }
      setData(res);
      const effTheme = getEffectiveTheme(res.theme, res.product?.category);
      applyTheme(res.template, effTheme);

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

  const handleChooseInfo = () => setScanMode('info');

  const handleChooseDistributor = () => {
    const savedToken = localStorage.getItem('npp_scan_token');
    const savedUser = localStorage.getItem('npp_scan_user');
    if (savedToken && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setNppToken(savedToken);
        setNppUser(user);
        setScanMode('distributor');
        return;
      } catch { /* ignore */ }
    }
    setShowNPPLogin(true);
  };

  const handleNPPLoginSuccess = (user, token) => {
    setNppUser(user);
    setNppToken(token);
    setShowNPPLogin(false);
    setScanMode('distributor');
  };

  const handleNPPLogout = () => {
    localStorage.removeItem('npp_scan_token');
    localStorage.removeItem('npp_scan_user');
    setNppUser(null);
    setNppToken(null);
    setScanMode('choice');
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

    // Bot response matching Q&A pairs
    setTimeout(() => {
      let botResponse = '';
      const textLower = userText.toLowerCase().trim();

      // Gather all Q&As from product and enterprise
      const allQAs = [
        ...(data?.product?.chatbotQA || []),
        ...(data?.enterprise?.chatbotConfig?.qaList || [])
      ];

      let foundQA = null;
      for (const qa of allQAs) {
        if (qa.question && qa.answer) {
          const qClean = qa.question.toLowerCase().trim();
          // Check for substring match in either direction
          if (textLower.includes(qClean) || qClean.includes(textLower)) {
            foundQA = qa;
            break;
          }
        }
      }

      if (foundQA) {
        botResponse = foundQA.answer;
      } else {
        // Fallback hardcoded matching
        if (textLower.includes('chào') || textLower.includes('hi') || textLower.includes('hello')) {
          botResponse = `Xin chào! Tôi có thể giúp gì cho bạn về sản phẩm ${data?.product?.name}?`;
        } else if (textLower.includes('hạn sử dụng') || textLower.includes('hsd') || textLower.includes('hạn')) {
          botResponse = `Sản phẩm này thuộc lô tem ${data?.label?.batchId?.batchCode || 'mới'}. Hạn hiển thị của lô tem bảo hành đến ngày ${formatDateTime(data?.label?.batchId?.expiryDate || new Date(Date.now() + 365*24*60*60*1000))}.`;
        } else if (textLower.includes('giá') || textLower.includes('bao nhiêu') || textLower.includes('tiền')) {
          botResponse = `Để biết giá bán lẻ chính xác của sản phẩm "${data?.product?.name}", vui lòng tham khảo trực tiếp tại các điểm phân phối hoặc website chính thức ${data?.enterprise?.website || ''}.`;
        } else if (textLower.includes('địa chỉ') || textLower.includes('công ty') || textLower.includes('ở đâu') || textLower.includes('liên hệ')) {
          botResponse = `Bạn có thể liên hệ ${data?.enterprise?.name} tại địa chỉ: ${data?.enterprise?.address || 'N/A'}. Số điện thoại: ${data?.enterprise?.phone || 'N/A'}.`;
        } else {
          botResponse = `Cảm ơn bạn đã hỏi. Sản phẩm "${data?.product?.name}" được sản xuất theo quy trình nghiêm ngặt và phân phối chính hãng. Bạn có thể ghé thăm website ${data?.enterprise?.website || 'của chúng tôi'} để biết thêm chi tiết!`;
        }
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

  // ─── CHOICE SCREEN ───
  if (scanMode === 'choice' && data) {
    const { enterprise: ent, product: prod, label: lbl } = data;
    const isNPPLoggedIn = !!nppToken;
    return (
      <div className="scan-choice-page">
        <div className="scan-choice-bg">
          <div className="choice-bg-orb orb-a" />
          <div className="choice-bg-orb orb-b" />
          <div className="choice-bg-orb orb-c" />
        </div>

        {showNPPLogin && (
          <NPPLogin
            onSuccess={handleNPPLoginSuccess}
            onClose={() => setShowNPPLogin(false)}
            scanSerial={serial}
          />
        )}

        <div className="scan-choice-content">
          <div className="choice-brand-header">
            {ent?.logo ? (
              <img src={ent.logo} alt={ent.name} className="choice-brand-logo" />
            ) : (
              <div className="choice-brand-avatar">
                {(ent?.name || 'T')[0].toUpperCase()}
              </div>
            )}
            <div className="choice-brand-info">
              <h1 className="choice-brand-name">{ent?.name || 'Thương hiệu'}</h1>
              <p className="choice-brand-slogan">Chất lượng tạo niềm tin</p>
            </div>
          </div>

          <div className="choice-verified-badge">
            <ShieldCheck size={20} strokeWidth={2.5} />
            <span>Tem đã được xác thực</span>
          </div>

          <div className="choice-product-card">
            {prod?.images?.[0] ? (
              <img src={prod.images[0]} alt={prod.name} className="choice-product-img" />
            ) : (
              <div className="choice-product-img-placeholder">
                <Package size={36} />
              </div>
            )}
            <div className="choice-product-details">
              <h2 className="choice-product-name">{prod?.name || 'Sản phẩm'}</h2>
              <p className="choice-product-serial">
                <QrCode size={13} /> Serial: <strong>{lbl?.serialNumber}</strong>
              </p>
              <p className="choice-product-cat">{prod?.category || 'Sản phẩm chính hãng'}</p>
            </div>
          </div>

          <div className="choice-prompt">
            <p>Bạn muốn làm gì với tem này?</p>
          </div>

          <div className="choice-buttons">
            <button
              id="scan-choice-view-info"
              className="choice-btn choice-btn-info"
              onClick={handleChooseInfo}
            >
              <div className="choice-btn-icon-wrap info">
                <Eye size={30} strokeWidth={1.8} />
              </div>
              <div className="choice-btn-text">
                <span className="choice-btn-title">Xem thông tin chi tiết</span>
                <span className="choice-btn-desc">Kiểm tra nguồn gốc, chứng nhận, nhà sản xuất</span>
              </div>
              <div className="choice-btn-arrow">›</div>
            </button>

            <button
              id="scan-choice-distributor"
              className="choice-btn choice-btn-dist"
              onClick={handleChooseDistributor}
            >
              <div className="choice-btn-icon-wrap dist">
                <Truck size={30} strokeWidth={1.8} />
              </div>
              <div className="choice-btn-text">
                <span className="choice-btn-title">Nhập dữ liệu phân phối</span>
                <span className="choice-btn-desc">
                  {isNPPLoggedIn
                    ? `Đã đăng nhập: ${nppUser?.fullName || nppUser?.username}`
                    : 'Dành cho Nhà phân phối (NPP) – Yêu cầu đăng nhập'}
                </span>
              </div>
              <div className="choice-btn-arrow">›</div>
            </button>
          </div>

          {isNPPLoggedIn && (
            <div className="choice-npp-status">
              <Truck size={13} />
              <span><strong>{nppUser?.fullName || nppUser?.username || 'Nhà phân phối'}</strong></span>
              <button className="choice-npp-logout" onClick={handleNPPLogout}>Đăng xuất</button>
            </div>
          )}

          <p className="choice-footer-note">
            🔓 Guest có thể xem thông tin miễn phí.<br/>
            NPP đăng nhập để nhập dữ liệu phân phối.
          </p>
        </div>
      </div>
    );
  }

  // ─── DISTRIBUTOR ENTRY SCREEN ───
  if (scanMode === 'distributor' && data && nppUser && nppToken) {
    return (
      <DistributorEntry
        scanData={data}
        nppUser={nppUser}
        nppToken={nppToken}
        onLogout={handleNPPLogout}
        onBack={() => setScanMode('choice')}
      />
    );
  }

  // Guard: only show scan info if scanMode === 'info'
  if (!data || scanMode !== 'info') return null;

  const { label, product, enterprise, template, isFirstScan, firstScanTime, theme } = data;
  const effectiveTheme = getEffectiveTheme(theme, product?.category);
  const lightClass = isLightTheme() ? 'light-theme' : '';
  const layoutClass = `layout-${template.layout || 'default'}`;
  const themeClass = `theme-${effectiveTheme || 'default'}`;

  const getCertList = () => {
    const list = [];
    const certLabels = {
      iso: { name: 'Chứng nhận ISO 22000', class: 'iso', badgeText: 'ISO' },
      vetinhATTP: { name: 'Vệ sinh An toàn Thực phẩm (ATTP)', class: 'attp', badgeText: 'ATTP' },
      gmp: { name: 'Tiêu chuẩn GMP', class: 'gmp', badgeText: 'GMP' },
      cgmp: { name: 'Tiêu chuẩn CGMP', class: 'cgmp', badgeText: 'CGMP' },
      vietgap: { name: 'Tiêu chuẩn VietGAP', class: 'vietgap', badgeText: 'VietGAP' },
      organic: { name: 'Chứng nhận Hữu cơ (Organic)', class: 'organic', badgeText: 'ORGANIC' }
    };
    Object.entries(product?.certifications || {}).forEach(([key, val]) => {
      if (val && val.checked) {
        list.push({
          key,
          label: certLabels[key]?.name || key.toUpperCase(),
          badgeClass: certLabels[key]?.class || 'default',
          badgeText: certLabels[key]?.badgeText || 'CERT',
          certNo: val.certNo || 'N/A',
          image: val.image
        });
      }
    });
    return list;
  };
  const certList = getCertList();


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

  const splitBrandName = (name) => {
    if (!name) return { top: '', bottom: '' };
    const words = name.trim().split(/\s+/);
    if (words.length <= 2) return { top: words[0] || '', bottom: words.slice(1).join(' ') || '' };
    const mid = Math.ceil(words.length / 2);
    return { top: words.slice(0, mid).join(' '), bottom: words.slice(mid).join(' ') };
  };

  const getGalleryImages = () => {
    const imgs = product?.images?.filter(Boolean) || [];
    if (imgs.length >= 3) return imgs.slice(0, 3);
    if (imgs.length === 2) return [imgs[0], imgs[1], imgs[0]];
    if (imgs.length === 1) return [imgs[0], imgs[0], imgs[0]];
    return [];
  };

  const isHubTheme = effectiveTheme === 'agriculture' || effectiveTheme === 'functional_food' || effectiveTheme === 'food' || effectiveTheme === 'medical';
  const hubVariant = effectiveTheme === 'agriculture' ? 'agri' : (effectiveTheme === 'medical' ? 'med' : 'food');
  const brandLines = splitBrandName(enterprise.name);
  const galleryImages = getGalleryImages();

  const hubGridItems = [
    { id: 'product', icon: Package, label: 'THÔNG TIN\nSẢN PHẨM' },
    { id: 'manufacturer', icon: Factory, label: 'THÔNG TIN\nNHÀ SẢN XUẤT' },
    { id: 'distributor', icon: Truck, label: 'THÔNG TIN\nNHÀ PHÂN PHỐI' },
    { id: 'label', icon: QrCode, label: 'THÔNG TIN\nTEM SẢN PHẨM' },
    { id: 'history', icon: History, label: 'LỊCH SỬ\nSCAN' },
    { id: 'cert', icon: BadgeCheck, label: 'CHỨNG\nNHẬN' },
    { id: 'guide', icon: BookOpen, label: 'HƯỚNG DẪN\nSỬ DỤNG' },
    { id: 'points', icon: Gift, label: 'TÍCH\nĐIỂM' },
  ];

  const renderHubExpandSection = () => {
    if (!activeSection) return null;

    const cardClass = 'expand-section-card agri';
    const headerClass = 'expand-section-header agri';

    if (activeSection === 'product' && template.showProductInfo && product) {
      return (
        <div className={cardClass}>
          <div className={headerClass}><Package size={16} /> <span>Thông tin sản phẩm</span></div>
          <div className="expand-section-body">
            <div className="spec-row-new"><span className="spec-label-new">Tên sản phẩm:</span><span className="spec-value-new">{product.name}</span></div>
            <div className="spec-row-new"><span className="spec-label-new">Danh mục:</span><span className="spec-value-new">{product.category || (hubVariant === 'agri' ? 'Nông sản' : 'Thực phẩm chức năng')}</span></div>
            {product.sku && <div className="spec-row-new"><span className="spec-label-new">Mã SKU:</span><span className="spec-value-new">{product.sku}</span></div>}
            {product.description && <div className="spec-row-new"><span className="spec-label-new">Mô tả:</span><span className="spec-value-new text-left">{product.description}</span></div>}
            {specs.map(([key, val], idx) => (
              <div className="spec-row-new" key={idx}><span className="spec-label-new">{key}:</span><span className="spec-value-new">{val}</span></div>
            ))}
          </div>
        </div>
      );
    }

    if (activeSection === 'manufacturer') {
      return (
        <div className={cardClass}>
          <div className={headerClass}><Factory size={16} /> <span>Thông tin nhà sản xuất</span></div>
          <div className="expand-section-body">
            <div className="spec-row-new"><span className="spec-label-new">Tên đơn vị:</span><span className="spec-value-new">{enterprise.name}</span></div>
            <div className="spec-row-new"><span className="spec-label-new">Địa chỉ:</span><span className="spec-value-new text-left">{enterprise.address || '—'}</span></div>
            {enterprise.phone && <div className="spec-row-new"><span className="spec-label-new">Điện thoại:</span><span className="spec-value-new">{enterprise.phone}</span></div>}
            {enterprise.taxCode && <div className="spec-row-new"><span className="spec-label-new">Mã số thuế:</span><span className="spec-value-new">{enterprise.taxCode}</span></div>}
            {enterprise.website && <div className="spec-row-new"><span className="spec-label-new">Website:</span><span className="spec-value-new text-left">{enterprise.website.replace(/^https?:\/\//, '')}</span></div>}
          </div>
        </div>
      );
    }

    if (activeSection === 'distributor') {
      return (
        <div className={cardClass}>
          <div className={headerClass}><Truck size={16} /> <span>Thông tin nhà phân phối</span></div>
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
      );
    }

    if (activeSection === 'label') {
      return (
        <div className={cardClass}>
          <div className={headerClass}><QrCode size={16} /> <span>Thông tin tem sản phẩm</span></div>
          <div className="expand-section-body">
            <div className="spec-row-new"><span className="spec-label-new">Mã Serial:</span><span className="spec-value-new highlight-green">{label.serialNumber}</span></div>
            <div className="spec-row-new"><span className="spec-label-new">Lô tem:</span><span className="spec-value-new">{label.batchId?.batchCode || '—'}</span></div>
            <div className="spec-row-new"><span className="spec-label-new">Trạng thái:</span><span className="spec-value-new">{label.status === 'ACTIVE' ? 'Hoạt động' : label.status}</span></div>
            <div className="spec-row-new"><span className="spec-label-new">Lần quét đầu:</span><span className="spec-value-new">{formatDateTime(firstScanTime) || '—'}</span></div>
            <div className="spec-row-new"><span className="spec-label-new">Tổng lượt quét:</span><span className="spec-value-new">{label.scanCount || 0}</span></div>
          </div>
        </div>
      );
    }

    if (activeSection === 'history') {
      return (
        <div className={cardClass}>
          <div className={headerClass}><History size={16} /> <span>Lịch sử scan</span></div>
          <div className="expand-section-body">
            <div className="spec-row-new"><span className="spec-label-new">Tổng lần quét:</span><span className="spec-value-new">{label.scanCount || 0}</span></div>
            <div className="spec-row-new"><span className="spec-label-new">Lần quét đầu tiên:</span><span className="spec-value-new">{formatDateTime(firstScanTime) || '—'}</span></div>
            <div className="spec-row-new"><span className="spec-label-new">Lần quét gần nhất:</span><span className="spec-value-new">{formatDateTime(label.lastScannedAt) || '—'}</span></div>
          </div>
        </div>
      );
    }

    if (activeSection === 'cert') {
      return (
        <div className={cardClass}>
          <div className={headerClass}><BadgeCheck size={16} /> <span>Chứng nhận</span></div>
          {hubVariant === 'agri' ? (
            <div className="certifications-grid hub-cert-grid">
              <div className="cert-item">
                <div className="cert-badge-wrapper vietgap"><div className="vietgap-badge-design"><span className="vgap-main-text">Viet</span><span className="vgap-sub-text">GAP</span></div></div>
                <span className="cert-name-label">VietGAP</span>
                <span className="cert-number-label">Số: {specs.find(s => s[0].includes('VietGAP'))?.[1] || 'VietGAP-TT-13-23-45'}</span>
              </div>
              <div className="cert-item">
                <div className="cert-badge-wrapper organic"><div className="organic-badge-design"><span className="org-text-top">HỮU CƠ</span><span className="org-text-bottom">ORGANIC</span></div></div>
                <span className="cert-name-label">Hữu cơ Việt Nam</span>
                <span className="cert-number-label">Số: {specs.find(s => s[0].includes('Hữu cơ'))?.[1] || 'HC-23-1087'}</span>
              </div>
              <div className="cert-item">
                <div className="cert-badge-wrapper iso"><div className="iso-badge-design"><span className="iso-quacert">QUACERT</span><span className="iso-number">ISO 22000</span></div></div>
                <span className="cert-name-label">ISO 22000:2018</span>
                <span className="cert-number-label">Số: {specs.find(s => s[0].includes('ISO'))?.[1] || '22000-23-01'}</span>
              </div>
            </div>
          ) : (
            <div className="certifications-grid hub-cert-grid">
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
                <div className="cert-badge-wrapper iso"><div className="iso-badge-design"><span className="iso-quacert">QUACERT</span><span className="iso-number">ISO 22000</span></div></div>
                <span className="cert-name-label">ISO 22000:2018</span>
                <span className="cert-number-label">Số: {specs.find(s => s[0].includes('ISO'))?.[1] || '22000-24-02'}</span>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (activeSection === 'guide') {
      return (
        <div className={cardClass}>
          <div className={headerClass}><BookOpen size={16} /> <span>Hướng dẫn sử dụng</span></div>
          <div className="expand-section-body">
            <p className="expand-guide-text">
              {product?.description || (hubVariant === 'agri'
                ? `Sản phẩm ${product?.name || ''} được sản xuất theo quy trình nông nghiệp sạch. Bảo quản nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp.`
                : `Sản phẩm ${product?.name || ''} là thực phẩm chức năng theo tiêu chuẩn GMP. Dùng theo hướng dẫn nhà sản xuất hoặc chuyên gia y tế.`)}
            </p>
          </div>
        </div>
      );
    }

    if (activeSection === 'points') {
      return (
        <div className={cardClass}>
          <div className={headerClass}><Gift size={16} /> <span>Tích điểm</span></div>
          <div className="expand-section-body">
            <div className="points-info-box agri">
              <Star size={32} className="points-star" />
              <p>Mỗi lần quét tem, bạn nhận được <strong>10 điểm</strong> thưởng tích lũy.</p>
              <p>Liên hệ {enterprise.name} để đổi quà hấp dẫn!</p>
              {enterprise.phone && <p>📞 {enterprise.phone}</p>}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

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
        {isHubTheme && (
          <div className="hub-page-shell">
            {/* Header bar */}
            <div className="def-header-bar" style={{ backgroundColor: 'var(--primary-color, #2e7d32)', borderBottom: 'none' }}>
              <button className="header-back-btn" onClick={() => window.history.back()} style={{ color: 'white' }}><ArrowLeft size={20} /></button>
              <span className="header-title" style={{ color: 'white' }}>Kết quả truy xuất</span>
              <button className="header-more-btn" style={{ color: 'white' }}><MoreVertical size={20} /></button>
            </div>

            {/* Verification Block */}
            <div className="def-verification-block" style={{ backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '12px', padding: '16px', marginTop: '12px', display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div className="def-success-circle" style={{ backgroundColor: '#2e7d32', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', flexShrink: 0 }}>
                <svg className="check-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" style={{ width: '24px', height: '24px' }}>
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="def-verif-text-col" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {(() => {
                  const verifText = product?.verificationText || 'XÁC THỰC THÀNH CÔNG\nSản phẩm chính hãng';
                  const lines = verifText.split('\n');
                  return (
                    <>
                      <h2 className="def-verif-title" style={{ color: '#2e7d32', fontWeight: 800, fontSize: '1.05rem', margin: 0 }}>{lines[0] || 'SẢN PHẨM ĐÃ MINH BẠCH THÔNG TIN'}</h2>
                      {lines[1] && <h3 className="def-verif-subtitle" style={{ color: '#374151', fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>{lines[1]}</h3>}
                      {lines[2] && <p className="def-verif-desc" style={{ color: '#6b7280', fontSize: '0.8rem', margin: 0 }}>{lines[2]}</p>}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Product summary card with sliding image carousel */}
            <div className="product-summary-card" style={{ display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)', backgroundColor: 'white', marginTop: '16px' }}>
              {galleryImages.length > 0 ? (
                <div style={{ position: 'relative', width: '100%', height: '220px' }}>
                  <img src={galleryImages[sliderIndex]} alt={product?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: '12px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '6px' }}>
                    {galleryImages.map((_, idx) => (
                      <span
                        key={idx}
                        className={`slider-dot ${sliderIndex === idx ? 'active' : ''}`}
                        onClick={() => setSliderIndex(idx)}
                        style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: sliderIndex === idx ? '#2e7d32' : 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="product-slider-placeholder agri" style={{ height: '150px', backgroundColor: '#f3f4f6', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  <Package size={48} style={{ opacity: 0.5 }} />
                  <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>Chưa có hình ảnh sản phẩm</span>
                </div>
              )}

              <div style={{ padding: '16px' }}>
                <h2 className="psc-product-name" style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 12px 0', color: '#111827' }}>{product?.name?.toUpperCase()}</h2>
                
                <div className="specs-list-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="spec-row-new" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '6px', fontSize: '0.85rem' }}>
                    <span className="spec-label-new" style={{ color: '#6b7280' }}>Mã lô hàng:</span>
                    <span className="spec-value-new" style={{ fontWeight: 600, color: '#111827' }}>{label?.batchId?.batchCode || specs.find(s => s[0] === 'Mã lô hàng')?.[1] || 'VL-2026-001'}</span>
                  </div>
                  {label?.batchId?.expiryDate && (
                    <div className="spec-row-new" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '6px', fontSize: '0.85rem' }}>
                      <span className="spec-label-new" style={{ color: '#6b7280' }}>Hạn sử dụng:</span>
                      <span className="spec-value-new" style={{ fontWeight: 600, color: '#111827' }}>{formatDateTime(label.batchId.expiryDate).split(' ')[0]}</span>
                    </div>
                  )}
                  {specs.filter(s => !['Mã lô hàng'].includes(s[0])).map(([key, val], idx) => (
                    <div className="spec-row-new" key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '6px', fontSize: '0.85rem' }}>
                      <span className="spec-label-new" style={{ color: '#6b7280' }}>{key}:</span>
                      <span className="spec-value-new" style={{ fontWeight: 600, color: '#111827' }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Farm / Manufacturer Information */}
            <div className="expand-section-card agri" style={{ marginTop: '16px', display: 'block', backgroundColor: 'white', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <div className="expand-section-header agri" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                <Building size={16} style={{ color: '#2e7d32' }} />
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#374151' }}>{effectiveTheme === 'agriculture' ? 'THÔNG TIN TRANG TRẠI' : 'THÔNG TIN NHÀ SẢN XUẤT'}</span>
              </div>
              <div className="expand-section-body" style={{ padding: '16px' }}>
                {product?.producerInfo ? (
                  <p style={{ fontSize: '0.85rem', color: '#4b5563', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}>{product.producerInfo}</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="spec-row-new" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}><span style={{ color: '#6b7280' }}>Tên đơn vị:</span><span style={{ fontWeight: 600 }}>{enterprise.name}</span></div>
                    <div className="spec-row-new" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}><span style={{ color: '#6b7280' }}>Địa chỉ:</span><span style={{ fontWeight: 600 }}>{enterprise.address || '—'}</span></div>
                    {enterprise.phone && <div className="spec-row-new" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}><span style={{ color: '#6b7280' }}>Điện thoại:</span><span style={{ fontWeight: 600 }}>{enterprise.phone}</span></div>}
                  </div>
                )}
              </div>
            </div>

            {/* Production Process Stepper */}
            <div className="expand-section-card agri" style={{ marginTop: '16px', display: 'block', backgroundColor: 'white', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <div className="expand-section-header agri" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                <Activity size={16} style={{ color: '#2e7d32' }} />
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#374151' }}>QUY TRÌNH SẢN XUẤT</span>
              </div>
              <div className="expand-section-body" style={{ padding: '16px' }}>
                {product?.productionProcess?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {product.productionProcess.map((step, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e8f5e9', border: '2px solid #2e7d32', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.75rem', fontWeight: 800, color: '#2e7d32', zIndex: 2 }}>
                            {idx + 1}
                          </div>
                          {idx < product.productionProcess.length - 1 && (
                            <div style={{ width: '2px', flexGrow: 1, backgroundColor: '#e5e7eb', marginTop: '4px', marginBottom: '4px' }}></div>
                          )}
                        </div>
                        <div style={{ paddingBottom: '8px' }}>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 700, color: '#1f2937' }}>{step.title}</h4>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: '#4b5563', lineHeight: 1.4 }}>{step.description}</p>
                          {step.image && (
                            <img src={step.image} alt={step.title} style={{ marginTop: '8px', maxWidth: '100%', maxHeight: '120px', borderRadius: '6px', objectFit: 'cover' }} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="production-process-stepper agri" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '8px 0' }}>
                    <div className="process-step-box">
                      <div className="step-square agri"><Leaf size={22} className="step-square-icon" /></div>
                      <span className="step-square-label">Gieo trồng</span>
                    </div>
                    <div className="process-arrow agri">→</div>
                    <div className="process-step-box">
                      <div className="step-square agri"><Activity size={22} className="step-square-icon" /></div>
                      <span className="step-square-label">Chăm sóc</span>
                    </div>
                    <div className="process-arrow agri">→</div>
                    <div className="process-step-box">
                      <div className="step-square agri"><Package size={22} className="step-square-icon" /></div>
                      <span className="step-square-label">Thu hoạch</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Certifications Block */}
            <div className="expand-section-card agri" style={{ marginTop: '16px', display: 'block', backgroundColor: 'white', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <div className="expand-section-header agri" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                <Award size={16} style={{ color: '#2e7d32' }} />
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#374151' }}>CHỨNG NHẬN ĐẠT ĐƯỢC</span>
              </div>
              <div className="expand-section-body" style={{ padding: '16px' }}>
                {certList.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {certList.map((cert) => (
                      <div key={cert.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.01)', border: '1px solid rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className={`cert-badge-wrapper ${cert.badgeClass}`} style={{ width: '40px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 900, color: 'white', backgroundColor: '#2e7d32' }}>
                            {cert.badgeText}
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#1f2937' }}>{cert.label}</h4>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>Số: {cert.certNo}</p>
                          </div>
                        </div>
                        {cert.image && (
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            onClick={() => setActiveCertDoc(cert.image)}
                            style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2e7d32', border: '1px solid #2e7d32', borderRadius: '6px', padding: '4px 10px' }}
                          >
                            Chi tiết
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="certifications-grid hub-cert-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                    <div className="cert-item">
                      <div className="cert-badge-wrapper vietgap"><div className="vietgap-badge-design"><span className="vgap-main-text">Viet</span><span className="vgap-sub-text">GAP</span></div></div>
                      <span className="cert-name-label">VietGAP</span>
                      <span className="cert-number-label">Số: VietGAP-TT-13-23</span>
                    </div>
                    <div className="cert-item">
                      <div className="cert-badge-wrapper organic"><div className="organic-badge-design"><span className="org-text-top">HỮU CƠ</span><span className="org-text-bottom">ORGANIC</span></div></div>
                      <span className="cert-name-label">Hữu cơ VN</span>
                      <span className="cert-number-label">Số: HC-23-1087</span>
                    </div>
                    <div className="cert-item">
                      <div className="cert-badge-wrapper iso"><div className="iso-badge-design"><span className="iso-quacert">QUACERT</span><span className="iso-number">ISO 22000</span></div></div>
                      <span className="cert-name-label">ISO 22000</span>
                      <span className="cert-number-label">Số: 22000-23-01</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Farm / Factory Location Map */}
            <div className="expand-section-card agri" style={{ marginTop: '16px', display: 'block', backgroundColor: 'white', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <div className="expand-section-header agri" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={16} style={{ color: '#2e7d32' }} />
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#374151' }}>{effectiveTheme === 'agriculture' ? 'VỊ TRÍ TRANG TRẠI' : 'VỊ TRÍ TRANG TRẠI / XƯỞNG'}</span>
                </div>
                <a href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: '#2e7d32', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Xem trên bản đồ <ChevronRight size={14} />
                </a>
              </div>
              <div className="expand-section-body" style={{ padding: '16px' }}>
                <div className="map-wrapper-new" style={{ borderRadius: '8px', overflow: 'hidden' }}>
                  <iframe src={mapUrl} width="100%" height="200" style={{ border: 0 }} allowFullScreen="" loading="lazy"></iframe>
                </div>
              </div>
            </div>

            {/* Distributor / Store Information */}
            <div className="expand-section-card agri" style={{ marginTop: '16px', display: 'block', backgroundColor: 'white', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <div className="expand-section-header agri" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                <Truck size={16} style={{ color: '#2e7d32' }} />
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#374151' }}>THÔNG TIN NHÀ PHÂN PHỐI / ĐIỂM BÁN</span>
              </div>
              <div className="expand-section-body" style={{ padding: '16px' }}>
                {product?.distributorInfo ? (
                  <p style={{ fontSize: '0.85rem', color: '#4b5563', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}>{product.distributorInfo}</p>
                ) : label?.distributorName ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="spec-row-new" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}><span style={{ color: '#6b7280' }}>Đại lý / Cửa hàng:</span><span style={{ fontWeight: 600 }}>{label.distributorName}</span></div>
                    {label.distributorAddress && <div className="spec-row-new" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}><span style={{ color: '#6b7280' }}>Địa chỉ:</span><span style={{ fontWeight: 600 }}>{label.distributorAddress}</span></div>}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>Chưa có thông tin điểm bán cụ thể cho tem này.</p>
                )}
              </div>
            </div>

            {/* Action buttons row */}
            <div className="agri-action-buttons-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '20px' }}>
              <button className="action-footer-btn agri" onClick={() => alert('Đang tải chứng nhận...')}>
                <Download size={16} className="btn-footer-icon" /> Tải chứng nhận
              </button>
              <button className="action-footer-btn agri" onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Đã sao chép link liên kết để chia sẻ!'); }}>
                <Share2 size={16} className="btn-footer-icon" /> Chia sẻ
              </button>
              <button className="action-footer-btn report" onClick={() => alert('Đã gửi phản hồi / báo cáo vi phạm sản phẩm này!')}>
                <AlertTriangle size={16} className="btn-footer-icon" /> Báo cáo
              </button>
            </div>

            {/* Last updated information */}
            <div className="agri-last-updated" style={{ textAlign: 'center', fontSize: '0.75rem', opacity: 0.6, margin: '24px 0 16px 0' }}>
              Dữ liệu được cập nhật lần cuối: {formatDateTime(label?.lastScannedAt || new Date()).split(' ')[0]}
            </div>
          </div>
        )}

        {effectiveTheme === 'cosmetics' && (
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

        {(effectiveTheme !== 'agriculture' && effectiveTheme !== 'functional_food' && effectiveTheme !== 'cosmetics') && (
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

      {/* Dynamic Chatbot Widget - Always show for hub themes, or when enterprise enables it */}
      {(isHubTheme || enterprise.chatbotConfig?.enabled !== false) && (
        <div className="scan-chatbot-widget animate-fade-in">
          {!chatOpen ? (
            <button className="chatbot-toggle-btn" onClick={() => setChatOpen(true)}>
              {isHubTheme ? (
                <div className="chatbot-toggle-label">
                  <div className="chatbot-toggle-icon-wrap">
                    <Bot size={22} />
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

      {/* Certificate details modal popup */}
      {activeCertDoc && (
        <div className="modal-overlay" onClick={() => setActiveCertDoc(null)} style={{ zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.85)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <button className="btn-icon" onClick={() => setActiveCertDoc(null)} style={{ position: 'absolute', top: '-40px', right: 0, color: 'white', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '6px', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
            <img src={activeCertDoc} alt="Giấy chứng nhận" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '8px', border: '3px solid white' }} />
          </div>
        </div>
      )}
    </div>
  );
}
