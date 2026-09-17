import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, ShieldCheck, AlertTriangle, Package, QrCode,
  Building2, MapPin, Phone, Globe, Mail, Clock, Hash,
  Truck, Home, MessageSquare, Send, X, Bot, Zap,
  Award, CheckCircle2, Layers, Cpu, Sparkles, ChevronLeft, ChevronRight,
  Headphones, Gift, Lock, LayoutGrid, Check, Activity, Shield, Flame, Eye,
  Wrench, FileText, Scan, Handshake, ShoppingBag, Ribbon,
  Pill, Stethoscope, ShieldAlert, FileCheck, Sprout, Utensils, Heart, Sparkle,
  BookOpen, AlertCircle
} from 'lucide-react';
import { useDomain } from '../../contexts/DomainContext';
import './ProductInfo.css';

// 1. Trust Badge cho Tem Đồ gia dụng
const TrustShieldBadge = () => (
  <svg width="56" height="56" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 4L7 11V22C7 32.5 14.2 41.8 24 44C33.8 41.8 41 32.5 41 22V11L24 4Z" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
    <path d="M24 6.8L10 12.6V22C10 30.7 16 38.4 24 40.5C32 38.4 38 30.7 38 22V12.6L24 6.8Z" fill="#0A369D" />
    <path d="M19 22.5L22.5 26L29 17.5" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="7" y="32" width="34" height="10" rx="3" fill="#002244" stroke="#F59E0B" strokeWidth="1" />
    <text x="24" y="39.5" fill="#FBBF24" fontSize="7" fontWeight="900" textAnchor="middle" letterSpacing="0.8">TRUST</text>
  </svg>
);

// 2. Medical Badge cho Tem Dược phẩm & Y tế
const MedicalTrustBadge = () => (
  <svg width="46" height="46" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="22" fill="#00897B" stroke="#004D40" strokeWidth="1.5" />
    <circle cx="24" cy="24" r="18" fill="#00796B" />
    <path d="M24 12V36M12 24H36" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" />
    <path d="M16 16L32 32M32 16L16 32" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
    <rect x="9" y="32" width="30" height="10" rx="3" fill="#004D40" stroke="#80CBC4" strokeWidth="1" />
    <text x="24" y="39.5" fill="#E0F2F1" fontSize="6.5" fontWeight="900" textAnchor="middle" letterSpacing="0.8">PHARMA</text>
  </svg>
);

// 3. Food Badge cho Tem Thực phẩm & TPCN
const FoodSafetyBadge = () => (
  <svg width="46" height="46" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 4L42 14V34L24 44L6 34V14L24 4Z" fill="#16A34A" stroke="#15803D" strokeWidth="1.5" />
    <path d="M24 8L38 16V32L24 40L10 32V16L24 8Z" fill="#15803D" />
    <path d="M18 24C18 20 21 17 25 17C29 17 31 19 31 22C31 26 27 27 25 29C23.5 30.5 23.5 32 23.5 33" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" />
    <circle cx="24" cy="24" r="8" fill="#FACC15" />
    <path d="M20 24L23 27L28 20" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <text x="24" y="42" fill="#FFFFFF" fontSize="6" fontWeight="800" textAnchor="middle">ATTP</text>
  </svg>
);

// 4. Agri Badge cho Tem Nông sản
const AgriTrustBadge = () => (
  <svg width="46" height="46" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="22" fill="#15803D" stroke="#166534" strokeWidth="1.5" />
    <path d="M24 10C24 10 32 16 32 24C32 28.4 28.4 32 24 32C19.6 32 16 28.4 16 24C16 16 24 10 24 10Z" fill="#22C55E" />
    <path d="M24 14V28M24 20L28 17M24 24L20 21" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    <text x="24" y="40" fill="#FEF08A" fontSize="6.5" fontWeight="900" textAnchor="middle">VIETGAP</text>
  </svg>
);

// 5. Cosmetics Badge cho Tem Mỹ phẩm
const CosmeticsTrustBadge = () => (
  <svg width="46" height="46" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 4L40 12V24C40 33.5 33.2 41.8 24 44C14.8 41.8 8 33.5 8 24V12L24 4Z" fill="#BE185D" stroke="#9D174D" strokeWidth="1.5" />
    <path d="M24 14L27 21H34L28.5 25.5L30.5 32.5L24 28L17.5 32.5L19.5 25.5L14 21H21L24 14Z" fill="#F472B6" />
    <text x="24" y="41" fill="#FCE7F3" fontSize="6" fontWeight="900" textAnchor="middle">BEAUTY</text>
  </svg>
);

export default function ProductInfo() {
  const navigate = useNavigate();
  const location = useLocation();
  const { customEnterprise, isCustomDomain } = useDomain();

  const defaultMockScanData = {
    theme: 'appliance',
    product: {
      name: 'VINSUMI',
      category: 'Điện gia dụng / Tem Bảo Hành',
      description: 'VINSUMI cam kết mang đến những sản phẩm chất lượng cao, an toàn và bền bỉ – đồng hành cùng gia đình bạn trong cuộc sống hiện đại.',
      images: ['/pdf_assets/hero_banner_appliance.png']
    },
    enterprise: {
      name: 'CÔNG TY TNHH VINSUMI VIỆT NAM',
      address: 'Lô B2-3, KCN Thăng Long, Đông Anh, Hà Nội',
      phone: '024 6688 1234',
      email: 'contact@vinsumi.vn',
      website: 'www.vinsumi.vn'
    },
    label: {
      serialNumber: 'VSM-88392100',
      qrCode: 'vinsumi_secret_qr_992',
      status: 'ACTIVE',
      scanCount: 1,
      expiryDate: new Date('2028-12-31')
    }
  };

  const scanData = location.state?.scanData || defaultMockScanData;
  const serial = location.state?.serial || scanData.label.serialNumber;

  // Dynamic Automatic Theme Detection based on Batch Theme, Product, & Enterprise Info
  const getInitialTheme = () => {
    const searchParams = new URLSearchParams(location.search);
    const paramTheme = searchParams.get('theme');
    if (paramTheme) return paramTheme;

    // Ưu tiên theme mặc định từ cấu hình doanh nghiệp (override tất cả auto-detect)
    const enterpriseDefaultTheme = scanData?.enterprise?.displayConfig?.defaultTheme;
    if (enterpriseDefaultTheme && enterpriseDefaultTheme !== 'default') {
      return enterpriseDefaultTheme;
    }

    // Tự động nhận diện doanh nghiệp StayCool / Vyphyto
    const entName = (scanData?.enterprise?.name || '').toLowerCase();
    if (entName.includes('staycool') || entName.includes('vyphyto')) {
      return 'staycool';
    }

    // Ưu tiên theme từ API scan response (đã xử lý ở server)
    let t = scanData?.theme || scanData?.label?.batchId?.theme || scanData?.template?.layout;
    if (t && t !== 'default' && t !== 'warranty') {
      return t;
    }

    // Comprehensive automatic detection based on scanned product & enterprise data
    const cat = (scanData?.product?.category || '').toLowerCase();
    const pName = (scanData?.product?.name || '').toLowerCase();
    const desc = (scanData?.product?.description || '').toLowerCase();

    const textToMatch = `${cat} ${pName} ${desc} ${entName}`;

    // 1. Dược phẩm & Y tế
    const medicalKeywords = [
      'dược', 'dược phẩm', 'thuốc', 'y tế', 'vắc xin', 'vaccine',
      'đông y', 'thuốc nam', 'thuốc bắc', 'bệnh viện', 'pharma',
      'pharmaceutical', 'medical', 'kháng sinh', 'sức khỏe', 'viên nén',
      'siro', 'sát khuẩn', 'y khoa', 'phano', 'dược trung ương'
    ];
    if (medicalKeywords.some(kw => textToMatch.includes(kw))) {
      return 'medical';
    }

    // 2. Bảo hành đồ gia dụng / Điện máy
    const applianceKeywords = [
      'gia dụng', 'thiết bị điện', 'bếp', 'máy giặt', 'tủ lạnh', 'điều hòa',
      'máy lạnh', 'lò vi sóng', 'máy hút bụi', 'nồi cơm', 'nồi áp suất',
      'máy xay', 'máy ép', 'bình nóng lạnh', 'quạt', 'bảo hành', 'vinsumi',
      'homeplus', 'điện tử', 'appliance'
    ];
    if (applianceKeywords.some(kw => textToMatch.includes(kw))) {
      return 'appliance';
    }

    // 3. Nông sản & Nông nghiệp
    const agriKeywords = [
      'nông nghiệp', 'nông sản', 'trồng trọt', 'chăn nuôi', 'thủy sản',
      'hải sản', 'trái cây', 'rau củ', 'hoa quả', 'gạo', 'sâm', 'chè',
      'agri', 'vietgap', 'globalgap', 'hợp tác xã', 'htx'
    ];
    if (agriKeywords.some(kw => textToMatch.includes(kw))) {
      return 'agriculture';
    }

    // 4. Mỹ phẩm & Làm đẹp
    const cosmeticsKeywords = [
      'mỹ phẩm', 'chăm sóc da', 'kem', 'serum', 'son', 'trang điểm',
      'tắm', 'gội', 'nước hoa', 'cosmetic', 'beauty', 'skin', 'skincare'
    ];
    if (cosmeticsKeywords.some(kw => textToMatch.includes(kw))) {
      return 'cosmetics';
    }

    // 5. Thực phẩm & Thực phẩm chức năng
    const foodKeywords = [
      'thực phẩm', 'dinh dưỡng', 'gia vị', 'dầu ăn', 'nước uống',
      'bánh', 'kẹo', 'sữa', 'trà', 'cà phê', 'mật ong', 'yến sào',
      'food', 'snack', 'beverage', 'tpcn', 'thực phẩm chức năng'
    ];
    if (foodKeywords.some(kw => textToMatch.includes(kw))) {
      return 'functional_food';
    }

    // 0. OCOP - Ưu tiên nhận diện trước (trước khi khớp nông sản)
    const ocopKeywords = ['ocop', 'đặc sản', 'long nhãn', 'lục sơn', 'nhãn lồng', 'bưởi da xanh', 'chứng nhận ocop'];
    if (ocopKeywords.some(kw => textToMatch.includes(kw))) {
      return 'ocop';
    }

    return 'default';
  };

  const [activeTheme, setActiveTheme] = useState(getInitialTheme);
  const [descExpanded, setDescExpanded] = useState(false);

  // === TẤT CẢ HOOKS phải khai báo TRƯỚC mọi early return (Rules of Hooks) ===
  const [chatOpen, setChatOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [rewardPhone, setRewardPhone] = useState('');
  const [rewardSuccess, setRewardSuccess] = useState(false);
  const [activateName, setActivateName] = useState('');
  const [activatePhone, setActivatePhone] = useState('');
  const [activateSuccess, setActivateSuccess] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const chatEndRef = useRef(null);

  // Computed values (không phải hooks, an toàn để đặt đây)
  const product = scanData?.product;
  const enterprise = scanData?.enterprise;
  const label = scanData?.label;
  const relatedProducts = scanData?.relatedProducts || scanData?.enterpriseProducts || [];
  const currentProductId = product?._id || product?.id;
  const filteredRelated = relatedProducts.filter(p => (p._id || p.id) !== currentProductId);
  const showRelated = (scanData?.showRelated !== undefined)
    ? scanData.showRelated
    : (scanData?.template?.showRelatedProducts !== undefined
        ? scanData.template.showRelatedProducts
        : (enterprise?.displayConfig?.showRelatedProducts !== false));


  // useEffect cũng phải TRƯỚC early return
  useEffect(() => {
    if (!scanData) {
      navigate('/home', { replace: true });
    }
  }, []);

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

  // Early return sau tất cả hooks
  if (!scanData) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };


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



  // =========================================================================
  // 1. TEM DƯỢC PHẨM & Y TẾ (Medical Theme)
  // =========================================================================
  const renderMedicalView = () => (
    <div className="medical-canvas-outer">
      <div className="medical-poster-card">
        {/* 1. Header Medical Trust Banner */}
        <div className="medical-trust-banner">
          <div className="medical-trust-logo-box">
            <MedicalTrustBadge />
          </div>
          <div className="medical-trust-title-wrap">
            <h2 className="medical-trust-title">BỘ Y TẾ XÁC THỰC : TEM DƯỢC PHẨM CHÍNH HÃNG</h2>
            <p className="medical-trust-subtitle">Nguồn gốc chuẩn Y Khoa & Đạt tiêu chuẩn GMP-WHO</p>
          </div>
          <div className="medical-trust-watermark">
            <Stethoscope size={72} color="rgba(0, 137, 123, 0.08)" />
          </div>
        </div>

        {/* 2. Medical Hero Card */}
        <div className="medical-hero-card">
          <div className="medical-rx-badge-row">
            <span className="medical-rx-badge">
              <Pill size={14} /> THUỐC KÊ ĐƠN / DƯỢC PHẨM CHÍNH HÃNG
            </span>
            <span className="medical-gmp-tag">ĐẠT CHUẨN GMP-WHO</span>
          </div>

          <div className="medical-hero-body">
            <div className="medical-hero-img-wrap">
              <img 
                src={product?.images?.[0] || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60'} 
                alt={product?.name || 'Dược phẩm chính hãng'} 
                className="medical-hero-img"
              />
            </div>
            <div className="medical-hero-info">
              <h3 className="medical-product-name">{product?.name || 'Thuốc Paracetamol 500mg (Dược Phẩm)'}</h3>
              <p className="medical-enterprise-sub">Đơn vị sản xuất: <strong>{enterprise?.name || 'CÔNG TY DƯỢC PHẨM TRUNG ƯƠNG'}</strong></p>
              
              {/* Crucial Pharma Specs Grid */}
              <div className="medical-specs-grid">
                <div className="medical-spec-item">
                  <span className="spec-lbl">Số đăng ký (SĐK):</span>
                  <strong className="spec-val highlight">{product?.sku || 'VD-35281-21'}</strong>
                </div>
                <div className="medical-spec-item">
                  <span className="spec-lbl">Dạng bào chế:</span>
                  <strong className="spec-val">Viên nén bao phim</strong>
                </div>
                <div className="medical-spec-item">
                  <span className="spec-lbl">Quy cách đóng gói:</span>
                  <strong className="spec-val">Hộp 3 vỉ x 10 viên</strong>
                </div>
                <div className="medical-spec-item">
                  <span className="spec-lbl">Số lô & HSD:</span>
                  <strong className="spec-val">Lô: 240812 | HSD: 12/08/2027</strong>
                </div>
              </div>
            </div>
          </div>

          <button className="medical-details-btn" onClick={() => setActiveModal('product_detail')}>
            Chi tiết thành phần & liều dùng <ChevronRight size={14} />
          </button>
        </div>

        {/* 3. Medical Safety & Prescription Warning Banner */}
        <div className="medical-warning-banner">
          <div className="medical-warning-icon">
            <AlertTriangle size={24} color="#C2410C" />
          </div>
          <div className="medical-warning-text">
            <h4>LƯU Ý QUAN TRỌNG KHI SỬ DỤNG THUỐC & DƯỢC PHẨM</h4>
            <p>Đọc kỹ hướng dẫn sử dụng trước khi dùng. Thuốc dùng theo đơn hoặc chỉ định từ Bác sĩ/Dược sĩ chuyên khoa. Để xa tầm tay trẻ em.</p>
          </div>
        </div>

        {/* 4. 8 Interactive Quick Info Grid Cards (4 x 2 Layout) */}
        <div className="medical-grid-actions">
          <div className="medical-action-card" onClick={() => setActiveModal('tem')}>
            <div className="medical-action-icon"><ShieldCheck size={26} color="#00897B" /></div>
            <span className="medical-action-label">Mã tem & QR</span>
          </div>
          <div className="medical-action-card" onClick={() => setActiveModal('scan')}>
            <div className="medical-action-icon"><Scan size={26} color="#00897B" /></div>
            <span className="medical-action-label">Lịch sử quét</span>
          </div>
          <div className="medical-action-card" onClick={() => setActiveModal('mfg')}>
            <div className="medical-action-icon"><Building2 size={26} color="#00897B" /></div>
            <span className="medical-action-label">Nhà sản xuất GMP</span>
          </div>
          <div className="medical-action-card" onClick={() => setActiveModal('distributor')}>
            <div className="medical-action-icon"><Handshake size={26} color="#00897B" /></div>
            <span className="medical-action-label">Hệ thống nhà thuốc</span>
          </div>
          <div className="medical-action-card" onClick={() => setActiveModal('ingredients')}>
            <div className="medical-action-icon"><FileCheck size={26} color="#00897B" /></div>
            <span className="medical-action-label">Thành phần dược chất</span>
          </div>
          <div className="medical-action-card" onClick={() => setActiveModal('dosage')}>
            <div className="medical-action-icon"><Pill size={26} color="#00897B" /></div>
            <span className="medical-action-label">Chỉ định & Liều dùng</span>
          </div>
          <div className="medical-action-card" onClick={() => setActiveModal('cert')}>
            <div className="medical-action-icon"><Award size={26} color="#00897B" /></div>
            <span className="medical-action-label">Chứng nhận GMP/Bộ Y Tế</span>
          </div>
          <div className="medical-action-card" onClick={() => setActiveModal('caution')}>
            <div className="medical-action-icon"><ShieldAlert size={26} color="#00897B" /></div>
            <span className="medical-action-label">Thận trọng & Bảo quản</span>
          </div>
        </div>

        {/* 5. Active Batch & Storage Details Card */}
        <div className="medical-storage-box">
          <div className="medical-storage-header">
            <FileText size={18} color="#00695C" />
            <span>THÔNG TIN SẢN XUẤT & BẢO QUẢN DƯỢC PHẨM</span>
          </div>
          <div className="medical-storage-grid">
            <div className="medical-storage-col">
              <span className="storage-lbl">Nhiệt độ bảo quản:</span>
              <strong className="storage-val">Nơi khô ráo, dưới 30°C</strong>
            </div>
            <div className="medical-storage-col">
              <span className="storage-lbl">Ánh sáng:</span>
              <strong className="storage-val">Tránh ánh nắng trực tiếp</strong>
            </div>
            <div className="medical-storage-col">
              <span className="storage-lbl">Hạn sử dụng tem:</span>
              <strong className="storage-val">{formatDate(label?.expiryDate || scanData?.label?.batchId?.expiryDate)}</strong>
            </div>
            <div className="medical-storage-col">
              <span className="storage-lbl">Tiêu chuẩn áp dụng:</span>
              <strong className="storage-val">Dược điển Việt Nam V</strong>
            </div>
          </div>
        </div>

        {/* 6. Medical Related Products - dùng data thật từ API */}
        {showRelated && filteredRelated.length > 0 && (
          <div className="medical-related-section">
            <div className="medical-related-header">
              <h3 className="medical-related-title">
                <ShoppingBag size={18} color="#00695C" style={{ marginRight: 8 }} />
                SẢN PHẨM LIÊN QUAN
              </h3>
            </div>
            <div className="medical-related-grid">
              {filteredRelated.map((p, idx) => (
                <div key={p._id || idx} className="medical-related-card">
                  <div className="medical-related-img">
                    {p.images?.[0]
                      ? <img src={p.images[0]} alt={p.name} style={{ width: 48, height: 48, objectFit: 'contain' }} />
                      : <Pill size={32} color="#00897B" />}
                  </div>
                  <div className="medical-related-name">{p.name}</div>
                  {p.category && <div className="medical-related-sub">{p.category}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // =========================================================================
  // 2. TEM BẢO HÀNH ĐỒ GIA DỤNG (Appliance Theme) - Giữ nguyên khớp chuẩn 100%
  // =========================================================================
  const renderApplianceView = () => (
    <div className="appliance-canvas-outer">
      <div className="appliance-poster-card">
        {/* 1. Header Trust Banner */}
        <div className="appliance-trust-banner">
          <div className="appliance-trust-logo-box">
            <TrustShieldBadge />
          </div>
          <div className="appliance-trust-title-wrap">
            <h2 className="appliance-trust-title">TRUST : SẢN PHẨM CHÍNH HÃNG</h2>
            <p className="appliance-trust-subtitle">Sản phẩm đã được minh bạch thông tin</p>
          </div>
          <div className="appliance-trust-watermark">
            <ShieldCheck size={72} color="rgba(0, 51, 102, 0.07)" />
          </div>
        </div>

        {/* 2. Hero Appliance Banner Showcase */}
        <div className="appliance-hero-card">
          <div className="appliance-hero-image-wrap">
            <img 
              src="/pdf_assets/hero_banner_appliance.png" 
              alt="Dụng cụ & Thiết bị gia dụng VINSUMI" 
              className="appliance-hero-img" 
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/pdf_assets/hero_banner.png';
              }}
            />
          </div>
          <div className="appliance-hero-body-row">
            <div className="appliance-hero-info">
              <h3 className="appliance-hero-brand">
                Sản phẩm : <span className="appliance-hero-brand-name">{product?.name || 'VINSUMI'}</span>
              </h3>
              <p className="appliance-hero-desc">
                {product?.description || 'VINSUMI cam kết mang đến những sản phẩm chất lượng cao, an toàn và bền bỉ – đồng hành cùng gia đình bạn trong cuộc sống hiện đại.'}
              </p>
            </div>
            <button className="appliance-hero-more-btn" onClick={() => setActiveModal('product_detail')}>
              Xem thêm <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* 3. 8 Interactive Quick Info Grid Cards (4 x 2 Layout) */}
        <div className="appliance-grid-actions">
          <div className="appliance-action-card" onClick={() => setActiveModal('tem')}>
            <div className="appliance-action-icon"><ShieldCheck size={34} color="#003366" strokeWidth={1.75} /></div>
            <span className="appliance-action-label">Thông tin tem</span>
          </div>
          <div className="appliance-action-card" onClick={() => setActiveModal('scan')}>
            <div className="appliance-action-icon"><Scan size={34} color="#003366" strokeWidth={1.75} /></div>
            <span className="appliance-action-label">Thông tin quét</span>
          </div>
          <div className="appliance-action-card" onClick={() => setActiveModal('mfg')}>
            <div className="appliance-action-icon"><Building2 size={34} color="#003366" strokeWidth={1.75} /></div>
            <span className="appliance-action-label">Nhà sản xuất</span>
          </div>
          <div className="appliance-action-card" onClick={() => setActiveModal('distributor')}>
            <div className="appliance-action-icon"><Handshake size={34} color="#003366" strokeWidth={1.75} /></div>
            <span className="appliance-action-label">Nhà phân phối</span>
          </div>
          <div className="appliance-action-card" onClick={() => setActiveModal('cert')}>
            <div className="appliance-action-icon"><Award size={34} color="#003366" strokeWidth={1.75} /></div>
            <span className="appliance-action-label">Chứng nhận</span>
          </div>
          <div className="appliance-action-card" onClick={() => setActiveModal('brand')}>
            <div className="appliance-action-icon"><Sparkles size={34} color="#003366" strokeWidth={1.75} /></div>
            <span className="appliance-action-label">Thương hiệu</span>
          </div>
          <div className="appliance-action-card" onClick={() => setActiveModal('export')}>
            <div className="appliance-action-icon"><Globe size={34} color="#003366" strokeWidth={1.75} /></div>
            <span className="appliance-action-label">Thông tin XK</span>
          </div>
          <div className="appliance-action-card" onClick={() => setActiveModal('reward')}>
            <div className="appliance-action-icon"><Gift size={34} color="#003366" strokeWidth={1.75} /></div>
            <span className="appliance-action-label">Tích điểm</span>
          </div>
        </div>

        {/* 4. Related Products Section - dùng data thật từ API */}
        {showRelated && filteredRelated.length > 0 && (
          <div className="appliance-related-section">
            <div className="appliance-related-header">
              <h3 className="appliance-related-title">
                <ShoppingBag size={22} color="#003366" style={{ marginRight: 10 }} />
                SẢN PHẨM LIÊN QUAN
              </h3>
            </div>
            <div className="appliance-related-grid">
              {filteredRelated.map((p, idx) => (
                <div key={p._id || idx} className="appliance-related-card">
                  <div className="appliance-related-img-box">
                    {p.images?.[0]
                      ? <img src={p.images[0]} alt={p.name} />
                      : <Package size={32} color="#003366" />}
                  </div>
                  <div className="appliance-related-name">{p.name}</div>
                  {p.category && <div className="appliance-related-sub">{p.category}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Appliance Warranty Information Card */}
        <div className="appliance-warranty-box">
          <div className="appliance-warranty-header-bar">
            <ShieldCheck size={24} color="#003366" />
            <span>THÔNG TIN BẢO HÀNH</span>
          </div>
          <div className="appliance-warranty-content">
            <div className="appliance-warranty-grid4">
              <div className="appliance-warranty-col">
                <div className="appliance-warranty-icon-box"><ShieldCheck size={28} color="#003366" /></div>
                <div className="appliance-warranty-label">Thời gian bảo hành</div>
                <div className="appliance-warranty-val">24 tháng</div>
              </div>
              <div className="appliance-warranty-col">
                <div className="appliance-warranty-icon-box"><Wrench size={28} color="#003366" /></div>
                <div className="appliance-warranty-label">Hình thức bảo hành</div>
                <div className="appliance-warranty-val">Toàn quốc</div>
              </div>
              <div className="appliance-warranty-col">
                <div className="appliance-warranty-icon-box"><FileText size={28} color="#003366" /></div>
                <div className="appliance-warranty-label">Điều kiện bảo hành</div>
                <div className="appliance-warranty-val subtext">Sản phẩm còn nguyên tem, không rách, không tẩy xóa</div>
              </div>
              <div className="appliance-warranty-col">
                <div className="appliance-warranty-icon-box"><Phone size={28} color="#003366" /></div>
                <div className="appliance-warranty-label">Hotline hỗ trợ</div>
                <div className="appliance-warranty-val hotline">1900 1234</div>
              </div>
            </div>
            <p className="appliance-warranty-footer-note">
              Vui lòng liên hệ trung tâm bảo hành của VINSUMI gần nhất để được hỗ trợ nhanh chóng.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // =========================================================================
  // 3. TEM THỰC PHẨM CHỨC NĂNG - TPCN (Exact Match with Reference Image)
  // =========================================================================
  const renderFoodView = () => {
    const isMock = !product?.name || product?.name === 'VINSUMI';
    const productName = isMock ? 'NATURAL SPIRULINA 500MG' : product.name;
    const makerName = isMock ? 'Công Ty Cổ Phần Tập Đoàn Nam Dược Tân Viên Sơn' : (enterprise?.name || 'Công Ty Cổ Phần Tập Đoàn Nam Dược Tân Viên Sơn');
    const heroImage = (product?.images?.[0] && !product.images[0].includes('hero_banner') && !product.images[0].includes('vinsumi'))
      ? product.images[0]
      : '/images/tpcn_spirulina_hero.png';

    return (
      <div className="exact-tpcn-container">
        {/* 1. Header trên cùng: Logo khiên + Tiêu đề */}
        <div className="exact-tpcn-header">
          <div className="exact-tpcn-shield-icon">
            <ShieldCheck size={28} color="#16a34a" />
          </div>
          <div className="exact-tpcn-header-text">
            <h2>SẢN PHẨM CHÍNH HÃNG</h2>
            <p>Nguồn gốc minh bạch – An tâm sử dụng</p>
          </div>
        </div>

        {/* 2. Banner Xác thực thành công */}
        <div className="exact-tpcn-verify-banner">
          <div className="exact-tpcn-banner-icon">
            <CheckCircle2 size={24} color="#16a34a" />
          </div>
          <div className="exact-tpcn-banner-text">
            <h3>Xác thực thành công</h3>
            <p>Sản phẩm đã được nhà cung cấp cam kết minh bạch thông tin</p>
          </div>
          <div className="exact-tpcn-leaf-bg">🌿</div>
        </div>

        {/* 3. Card Sản phẩm chi tiết với ảnh thật Spirulina 500mg */}
        <div className="exact-tpcn-product-card">
          <div className="exact-tpcn-product-img-box">
            <img
              src={heroImage}
              alt={productName}
              onError={(e) => { e.target.src = '/images/tpcn_spirulina_hero.png'; }}
            />
          </div>
          <div className="exact-tpcn-product-details">
            <div className="exact-tpcn-category-tag">THỰC PHẨM CHỨC NĂNG</div>
            <h1 className="exact-tpcn-title">{productName}</h1>
            <div className="exact-tpcn-divider"></div>
            {/* Chỉ hiển thị 3 dòng đầu, bấm "Chi tiết" để xem thêm */}
            <div className="exact-tpcn-desc-wrap">
              <p
                className="exact-tpcn-desc"
                style={!descExpanded ? {
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                } : {}}
              >
                {product?.description && !isMock ? product.description : 'Sản phẩm hỗ trợ tăng cường sức đề kháng, bổ sung dưỡng chất từ tảo xoắn thiên nhiên.'}
              </p>
              <button
                className="exact-tpcn-desc-toggle"
                onClick={() => setActiveModal('product_detail')}
                style={{ background: 'none', border: 'none', color: '#16a34a', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', padding: '2px 0', textDecoration: 'underline' }}
              >
                Xem chi tiết sản phẩm →
              </button>
            </div>
            <div className="exact-tpcn-maker-row">
              <Building2 size={16} color="#16a34a" />
              <span>Nhà sản xuất: <strong>{makerName}</strong></span>
            </div>
          </div>
        </div>

        {/* 4. Grid 8 Icon Chức Năng */}
        <div className="exact-tpcn-grid-card">
          <div className="exact-tpcn-grid-8">
            <div className="exact-tpcn-grid-item" onClick={() => setActiveModal('mfg')}>
              <div className="exact-tpcn-icon-circle"><Building2 size={22} color="#16a34a" /></div>
              <span>Nhà Sản Xuất</span>
            </div>
            <div className="exact-tpcn-grid-item" onClick={() => setActiveModal('distributor')}>
              <div className="exact-tpcn-icon-circle"><Truck size={22} color="#16a34a" /></div>
              <span>Nhà Phân Phối</span>
            </div>
            <div className="exact-tpcn-grid-item" onClick={() => setActiveModal('tem')}>
              <div className="exact-tpcn-icon-circle"><ShieldCheck size={22} color="#16a34a" /></div>
              <span>Thông tin tem</span>
            </div>
            <div className="exact-tpcn-grid-item" onClick={() => setActiveModal('product_detail')}>
              <div className="exact-tpcn-icon-circle"><FileText size={22} color="#16a34a" /></div>
              <span>Thông tin sản phẩm</span>
            </div>
            <div className="exact-tpcn-grid-item" onClick={() => setActiveModal('cert')}>
              <div className="exact-tpcn-icon-circle"><FileCheck size={22} color="#16a34a" /></div>
              <span>Công Bố</span>
            </div>
            {showRelated && (
            <div className="exact-tpcn-grid-item" onClick={() => setActiveModal('all_products')}>
              <div className="exact-tpcn-icon-circle"><BookOpen size={22} color="#16a34a" /></div>
              <span>Thư Viện sản phẩm</span>
            </div>
            )}
            <div className="exact-tpcn-grid-item" onClick={() => setActiveModal('brand')}>
              <div className="exact-tpcn-icon-circle"><Package size={22} color="#16a34a" /></div>
              <span>Bao bì</span>
            </div>
            <div className="exact-tpcn-grid-item" onClick={() => setActiveModal('reward')}>
              <div className="exact-tpcn-icon-circle"><Gift size={22} color="#16a34a" /></div>
              <span>Tích điểm</span>
            </div>
          </div>
        </div>

        {/* 5. Sản Phẩm Liên Quan - dùng data thật từ API */}
        {showRelated && filteredRelated.length > 0 && (
          <div className="exact-tpcn-related-card">
            <div className="exact-tpcn-related-header">
              <h3>SẢN PHẨM LIÊN QUAN</h3>
            </div>
            <div className="exact-tpcn-related-grid">
              {filteredRelated.map((p, idx) => (
                <div key={p._id || idx} className="exact-tpcn-related-item">
                  {p.images?.[0]
                    ? <img src={p.images[0]} alt={p.name} />
                    : <div style={{ width: 64, height: 64, background: '#f0fdf4', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={32} color="#16a34a" /></div>}
                  <h4>{p.name}</h4>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. Banner Tư vấn & Hỗ trợ */}
        <div className="exact-tpcn-support-banner">
          <div className="exact-tpcn-support-left">
            <Headphones size={26} color="#16a34a" />
            <div>
              <h4>TƯ VẤN &amp; HỖ TRỢ</h4>
              <p>Nếu bạn cần hỗ trợ thêm thông tin về sản phẩm, vui lòng liên hệ</p>
            </div>
          </div>
          <button className="exact-tpcn-support-btn" onClick={() => setChatOpen(true)}>
            Liên hệ ngay
          </button>
        </div>

        {/* 7. Footer xanh lá đậm */}
        <div className="exact-tpcn-footer">
          <div className="exact-tpcn-footer-content">
            <ShieldCheck size={16} color="#4ade80" />
            <span>Cảm ơn bạn đã tin tưởng sử dụng sản phẩm chính hãng!</span>
          </div>
          <div className="exact-tpcn-copyright">
            &copy; {new Date().getFullYear()} {enterprise?.name || 'Nhà sản xuất'}. All rights reserved
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // OCOP. TEM OCOP - LONG NHÃN LỤC SƠN (Exact Match with Reference Image)
  // =========================================================================
  const renderOcopView = () => {
    const isMock = !product?.name || product?.name === 'VINSUMI';
    const productName = isMock ? 'LONG NHÃN LỤC SƠN' : product.name;
    const ownerName = isMock ? 'Hợp tác xã Nông nghiệp Lục Sơn' : (enterprise?.name || 'Hợp tác xã Nông nghiệp Lục Sơn');
    const heroImage = (product?.images?.[0] && !product.images[0].includes('hero_banner') && !product.images[0].includes('vinsumi'))
      ? product.images[0]
      : '/images/ocop_hero_product.png';

    return (
      <div className="exact-ocop-container">
        {/* 1. Top Nature Landscape Banner từ mẫu gốc 100% */}
        <div className="exact-ocop-top-landscape">
          <img src="/images/ocop_top_landscape.png" alt="SẢN PHẨM OCOP - SẢN PHẨM ĐÃ ĐƯỢC CẤP CHỨNG NHẬN OCOP" className="exact-ocop-top-img" />
        </div>

        {/* 2. Hero Banner Hình ảnh Long Nhãn Lục Sơn hũ nhãn sấy khô thật */}
        <div className="exact-ocop-hero-card">
          <img
            src={heroImage}
            alt={productName}
            className="exact-ocop-hero-img"
            onError={(e) => { e.target.src = '/images/ocop_hero_product.png'; }}
          />
        </div>

        {/* 3. Khối Thông Tin Sản Phẩm & Chứng Nhận OCOP 4 Sao */}
        <div className="exact-ocop-cert-card">
          <div className="exact-ocop-cert-left">
            <h1 className="exact-ocop-title">{productName}</h1>
            
            <div className="exact-ocop-cert-row">
              <div className="exact-ocop-check-icon">
                <CheckCircle2 size={18} color="#15803d" />
              </div>
              <div>
                <span className="exact-ocop-sublabel">Sản phẩm đã được cấp:</span>
                <div className="exact-ocop-red-cert">CHỨNG NHẬN OCOP 4 SAO</div>
              </div>
            </div>

            <div className="exact-ocop-cert-row" style={{ marginTop: 10 }}>
              <div className="exact-ocop-owner-icon">
                <Building2 size={18} color="#15803d" />
              </div>
              <div>
                <span className="exact-ocop-sublabel">Đơn vị sở hữu:</span>
                <div className="exact-ocop-owner-name">{ownerName}</div>
              </div>
            </div>
          </div>

          <div className="exact-ocop-cert-right">
            {/* Official OCOP Badge Image from reference */}
            <img src="/images/ocop_official_badge.png" alt="OCOP 4 SAO" style={{ width: 145, height: 'auto', objectFit: 'contain' }} />
          </div>
        </div>

        {/* 4. Khối Thông Tin Chủ Thể với logo HTX Lục Sơn */}
        <div className="exact-ocop-owner-box" onClick={() => setActiveModal('mfg')}>
          <div className="exact-ocop-owner-left-icon">
            <img src="/images/ocop_owner_logo.png" alt={ownerName} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
          <div className="exact-ocop-owner-details">
            <h3>THÔNG TIN CHỦ THỂ</h3>
            <p className="exact-ocop-owner-name-bold">{ownerName}</p>
            <p className="exact-ocop-owner-addr">Địa chỉ: {enterprise?.address && !isMock ? enterprise.address : 'Thôn Lục Sơn, Xã Minh Hòa, Huyện Lục Ngạn, Tỉnh Bắc Giang'}</p>
            <p className="exact-ocop-owner-phone">Điện thoại: {enterprise?.phone && !isMock ? enterprise.phone : '0987 854 321'}</p>
          </div>
          <div className="exact-ocop-owner-arrow">&gt;</div>
        </div>

        {/* 5. Lưới 8 Icon Chức Năng Vòng Tròn Xanh */}
        <div className="exact-ocop-grid-card">
          <div className="exact-ocop-grid-8">
            <div className="exact-ocop-grid-item" onClick={() => setActiveModal('product_detail')}>
              <div className="exact-ocop-icon-circle"><FileText size={22} color="#15803d" /></div>
              <span>Thông tin sản phẩm</span>
            </div>
            <div className="exact-ocop-grid-item" onClick={() => setActiveModal('mfg')}>
              <div className="exact-ocop-icon-circle"><Building2 size={22} color="#15803d" /></div>
              <span>Thông tin chủ thể</span>
            </div>
            <div className="exact-ocop-grid-item" onClick={() => setActiveModal('cert')}>
              <div className="exact-ocop-icon-circle"><Award size={22} color="#15803d" /></div>
              <span>Chứng nhận</span>
            </div>
            <div className="exact-ocop-grid-item" onClick={() => setActiveModal('brand')}>
              <div className="exact-ocop-icon-circle"><Ribbon size={22} color="#15803d" /></div>
              <span>Nhận Diện Thương Hiệu</span>
            </div>
            <div className="exact-ocop-grid-item" onClick={() => setActiveModal('distributor')}>
              <div className="exact-ocop-icon-circle"><ShoppingBag size={22} color="#15803d" /></div>
              <span>Hệ thống phân phối</span>
            </div>
            <div className="exact-ocop-grid-item" onClick={() => setActiveModal('reward')}>
              <div className="exact-ocop-icon-circle"><Gift size={22} color="#15803d" /></div>
              <span>Tích điểm</span>
            </div>
            <div className="exact-ocop-grid-item" onClick={() => setActiveModal('scan')}>
              <div className="exact-ocop-icon-circle"><Cpu size={22} color="#15803d" /></div>
              <span>Quy trình sản xuất</span>
            </div>
            <div className="exact-ocop-grid-item" onClick={() => setActiveModal('tem')}>
              <div className="exact-ocop-icon-circle"><MapPin size={22} color="#15803d" /></div>
              <span>Nguồn gốc xuất xứ</span>
            </div>
          </div>
        </div>

        {/* 6. Sản Phẩm Liên Quan OCOP - dùng data thật từ API */}
        {showRelated && filteredRelated.length > 0 && (
          <div className="exact-ocop-related-card">
            <div className="exact-ocop-related-header">
              <h3>SẢN PHẨM LIÊN QUAN</h3>
            </div>
            <div className="exact-ocop-related-grid">
              {filteredRelated.map((p, idx) => (
                <div key={p._id || idx} className="exact-ocop-related-item">
                  {p.images?.[0]
                    ? <img src={p.images[0]} alt={p.name} />
                    : <div style={{ width: 64, height: 64, background: '#f0fdf4', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sprout size={28} color="#15803d" /></div>}
                  <h4>{p.name}</h4>
                  {p.category && <div className="exact-ocop-star-tag">{p.category}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. Footer Cam Kết Từ Chủ Thể & Báo Cáo Vi Phạm */}
        <div className="exact-ocop-footer-section">
          <div className="exact-ocop-footer-left">
            <ShieldCheck size={26} color="#15803d" />
            <div>
              <h4>CAM KẾT TỪ CHỦ THỂ</h4>
              <p>Chúng tôi cam kết sản phẩm đạt chuẩn OCOP, đảm bảo chất lượng, nguồn gốc rõ ràng và an toàn cho người tiêu dùng.</p>
            </div>
          </div>
          <button className="exact-ocop-report-btn">
            <AlertCircle size={16} color="#fff" /> BÁO CÁO VI PHẠM
          </button>
        </div>
      </div>
    );
  };

  // =========================================================================
  // 3B. STAYCOOL / VYPHYTO FRANCE THEME (Exact Match with Reference Graphic)
  // =========================================================================
  const renderStayCoolView = () => {
    const isMock = !product?.name || product?.name === 'VINSUMI';
    const productName = isMock ? 'VYPHYTOZINC' : product.name;
    const heroImage = (product?.images?.[0] && !product.images[0].includes('hero_banner') && !product.images[0].includes('vinsumi'))
      ? product.images[0]
      : '/images/vyphyto_full_design.jpg';

    const distributorName = label?.distributorName || label?.distributorId?.fullName || product?.distributors?.[0]?.name;
    const entName = enterprise?.name || 'VYPHYTO';
    const defaultBanner = `SẢN PHẨM CỦA ${(distributorName || entName).toUpperCase()} NHẬP KHẨU VÀ PHÂN PHỐI`;
    const bannerText = product?.distributionBannerText?.trim()
      || enterprise?.displayConfig?.distributionBannerText?.trim()
      || defaultBanner;

    return (
      <div className="exact-vyphyto-container">
        {/* 1. Header trên cùng: Quốc kỳ Pháp + Logo Vyphyto + Slogan Tinh Hoa Pháp */}
        <div className="vyphyto-header-banner">
          <img
            src="/images/vyphyto_header_clean.png"
            alt="VYPHYTO LABORATORIES - Tinh Hoa Pháp, Sức Khỏe Bạn"
            className="vyphyto-header-img"
          />
        </div>

        {/* 2. Banner Cam Capsule 1: SẢN PHẨM CHÍNH HÃNG - TRUY XUẤT MINH BẠCH */}
        <div className="vyphyto-pill-banner">
          <span>SẢN PHẨM CHÍNH HÃNG - TRUY XUẤT MINH BẠCH</span>
        </div>

        {/* 3. Khối Ảnh Sản Phẩm với khung viền cam đôi & bóng đổ */}
        <div className="vyphyto-hero-card">
          <div className="vyphyto-hero-img-box">
            <img
              src={heroImage}
              alt={productName}
              className="vyphyto-hero-img"
              onError={(e) => { e.target.src = '/images/vyphyto_full_design.jpg'; }}
            />
          </div>
          <div className="vyphyto-hero-info">
            <h3 className="vyphyto-product-title">{productName}</h3>
            {product?.category && <div className="vyphyto-product-cat">{product.category}</div>}
            <div className="vyphyto-sku-serial">
              <span>Mã serial: <strong>{label?.serialNumber || serial}</strong></span>
              {product?.sku && <span>SKU: <strong>{product.sku}</strong></span>}
            </div>
          </div>
        </div>

        {/* 4. 3 Nút Hành Động Trắng Bo Tròn: Kích hoạt | Kiểm tra | Tích điểm */}
        <div className="vyphyto-actions-3">
          <div className="vyphyto-action-pill" onClick={() => setActiveModal('activate')}>
            <div className="vyphyto-action-icon">
              <img src="/images/vyphyto_icon_activate.png" alt="Kích hoạt" />
            </div>
            <span>Kích hoạt</span>
          </div>

          <div className="vyphyto-action-pill" onClick={() => setActiveModal('scan')}>
            <div className="vyphyto-action-icon">
              <img src="/images/vyphyto_icon_verify.png" alt="Kiểm tra" />
            </div>
            <span>Kiểm tra</span>
          </div>

          <div className="vyphyto-action-pill" onClick={() => setActiveModal('reward')}>
            <div className="vyphyto-action-icon">
              <img src="/images/vyphyto_icon_reward.png" alt="Tích điểm" />
            </div>
            <span>Tích điểm</span>
          </div>
        </div>

        {/* 5. Banner Cam Capsule 2: SẢN PHẨM CỦA ... NHẬP KHẨU VÀ PHÂN PHỐI */}
        <div className="vyphyto-pill-banner vyphyto-pill-banner-2">
          <span>{bannerText}</span>
        </div>

        {/* 6. Lưới 4 Nút 2x2: Nhà sản xuất | Độc quyền P.Phối | Thông tin tem | Thông tin sản phẩm */}
        <div className="vyphyto-grid-4">
          <div className="vyphyto-grid-item" onClick={() => setActiveModal('mfg')}>
            <div className="vyphyto-grid-icon">
              <img src="/images/vyphyto_icon_mfg.png" alt="Nhà sản xuất" />
            </div>
            <span className="vyphyto-grid-label">Nhà sản xuất</span>
          </div>

          <div className="vyphyto-grid-item" onClick={() => setActiveModal('distributor')}>
            <div className="vyphyto-grid-icon">
              <img src="/images/vyphyto_icon_dist.png" alt="Độc quyền P.Phối" />
            </div>
            <span className="vyphyto-grid-label">Độc quyền P.Phối</span>
          </div>

          <div className="vyphyto-grid-item" onClick={() => setActiveModal('tem')}>
            <div className="vyphyto-grid-icon">
              <img src="/images/vyphyto_icon_tem.png" alt="Thông tin tem" />
            </div>
            <span className="vyphyto-grid-label">Thông tin tem</span>
          </div>

          <div className="vyphyto-grid-item" onClick={() => setActiveModal('product_detail')}>
            <div className="vyphyto-grid-icon">
              <img src="/images/vyphyto_icon_product.png" alt="Thông tin sản phẩm" />
            </div>
            <span className="vyphyto-grid-label">Thông tin sản phẩm</span>
          </div>
        </div>

        {/* 7. Sản Phẩm Cùng Doanh Nghiệp (nếu có) */}
        {showRelated && filteredRelated.length > 0 && (
          <div className="vyphyto-related-card">
            <div className="vyphyto-related-header">
              <h3>SẢN PHẨM {(distributorName || entName).toUpperCase()} PHÂN PHỐI</h3>
            </div>
            <div className="vyphyto-related-grid">
              {filteredRelated.map((p, idx) => (
                <div key={p._id || idx} className="vyphyto-related-item">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.name} />
                  ) : (
                    <div className="vyphyto-related-placeholder">
                      <Package size={26} color="#ea580c" />
                    </div>
                  )}
                  <h4>{p.name}</h4>
                  {p.category && <div className="vyphyto-related-cat">{p.category}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. Bottom Wave Landscape & Footer */}
        <div className="vyphyto-bottom-landscape">
          <img src="/images/vyphyto_bottom_wave.png" alt="Vyphyto" className="vyphyto-bottom-wave-img" />
          <div className="vyphyto-footer-text">
            <p>&copy; {new Date().getFullYear()} {enterprise?.name || 'StayCool / VYPHYTO'}. All rights reserved.</p>
            <p className="vyphyto-subnote">Giải Pháp Truy Xuất Nguồn Gốc Thông Minh</p>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // 4. TEM NÔNG SẢN & NÔNG NGHIỆP (Agriculture Theme)
  // =========================================================================
  const renderAgricultureView = () => (
    <div className="agri-canvas-outer">
      <div className="agri-poster-card">
        <div className="agri-trust-banner">
          <AgriTrustBadge />
          <div className="agri-trust-title-wrap">
            <h2>NÔNG SẢN VIỆT CHÍNH HÃNG - TRUY XUẤT NGUỒN GỐC</h2>
            <p>Đạt chuẩn VietGAP / GlobalGAP - Nông nghiệp xanh</p>
          </div>
        </div>

        <div className="agri-hero-card">
          <img src={product?.images?.[0] || 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500&auto=format&fit=crop&q=60'} alt={product?.name} className="agri-hero-img" />
          <div className="agri-hero-info">
            <h3>{product?.name || 'Nông sản sạch VietGAP'}</h3>
            <div className="agri-tags-grid">
              <span className="agri-tag">Mã vùng trồng: <strong>PUC-VN-882</strong></span>
              <span className="agri-tag">Ngày thu hoạch: <strong>Gần nhất</strong></span>
              <span className="agri-tag">Hợp tác xã: <strong>{enterprise?.name || 'HTX Nông Nghiệp Xanh'}</strong></span>
            </div>
          </div>
        </div>

        <div className="agri-grid-actions">
          <div className="agri-action-card" onClick={() => setActiveModal('tem')}><ShieldCheck size={26} color="#15803D" /><span>Thông tin tem</span></div>
          <div className="agri-action-card" onClick={() => setActiveModal('scan')}><Scan size={26} color="#15803D" /><span>Nhật ký quét</span></div>
          <div className="agri-action-card" onClick={() => setActiveModal('mfg')}><Sprout size={26} color="#15803D" /><span>Vùng trồng/HTX</span></div>
          <div className="agri-action-card" onClick={() => setActiveModal('cert')}><Award size={26} color="#15803D" /><span>Chứng nhận VietGAP</span></div>
        </div>

        {/* Related Products - Agriculture */}
        {showRelated && filteredRelated.length > 0 && (
          <div className="agri-related-section">
            <div className="agri-related-header">
              <h3><ShoppingBag size={20} color="#15803D" style={{ marginRight: 8 }} />SẢN PHẨM LIÊN QUAN</h3>
            </div>
            <div className="agri-related-grid">
              {filteredRelated.map((p, idx) => (
                <div key={p._id || idx} className="agri-related-card">
                  <div className="agri-related-img">
                    {p.images?.[0] ? <img src={p.images[0]} alt={p.name} style={{ width: 56, height: 56, objectFit: "contain" }} /> : <Sprout size={32} color="#15803D" />}
                  </div>
                  <div className="agri-related-name">{p.name}</div>
                  {p.category && <div className="agri-related-sub">{p.category}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // =========================================================================
  // 5. TEM MỸ PHẨM & LÀM ĐẸP (Cosmetics Theme)
  // =========================================================================
  const renderCosmeticsView = () => (
    <div className="cosmetics-canvas-outer">
      <div className="cosmetics-poster-card">
        <div className="cosmetics-trust-banner">
          <CosmeticsTrustBadge />
          <div className="cosmetics-trust-title-wrap">
            <h2>MỸ PHẨM CHÍNH HÃNG - BẢO VỆ LÀN DA VIỆT</h2>
            <p>Đã qua kiểm nghiệm da liễu & An toàn cho mọi loại da</p>
          </div>
        </div>

        <div className="cosmetics-hero-card">
          <img src={product?.images?.[0] || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=60'} alt={product?.name} className="cosmetics-hero-img" />
          <div className="cosmetics-hero-info">
            <h3>{product?.name || 'Mỹ phẩm chăm sóc da cao cấp'}</h3>
            <p className="cosmetics-brand">Thương hiệu: <strong>{product?.brand || enterprise?.name || 'Beauty Care'}</strong></p>
            <div className="cosmetics-specs">
              <span>Loại da: <strong>Mọi loại da</strong></span>
              <span>PAO (Mở nắp): <strong>12 Tháng</strong></span>
              <span>Số công bố: <strong>CB-8834/22</strong></span>
            </div>
          </div>
        </div>

        <div className="cosmetics-grid-actions">
          <div className="cosmetics-action-card" onClick={() => setActiveModal('tem')}><ShieldCheck size={26} color="#BE185D" /><span>Thông tin tem</span></div>
          <div className="cosmetics-action-card" onClick={() => setActiveModal('scan')}><Scan size={26} color="#BE185D" /><span>Lịch sử quét</span></div>
          <div className="cosmetics-action-card" onClick={() => setActiveModal('ingredients')}><Sparkles size={26} color="#BE185D" /><span>Thành phần</span></div>
          <div className="cosmetics-action-card" onClick={() => setActiveModal('mfg')}><Building2 size={26} color="#BE185D" /><span>Nhà sản xuất</span></div>
        </div>

        {/* Related Products - Cosmetics */}
        {showRelated && filteredRelated.length > 0 && (
          <div className="cosmetics-related-section">
            <div className="cosmetics-related-header">
              <h3><ShoppingBag size={20} color="#BE185D" style={{ marginRight: 8 }} />SẢN PHẨM LIÊN QUAN</h3>
            </div>
            <div className="cosmetics-related-grid">
              {filteredRelated.map((p, idx) => (
                <div key={p._id || idx} className="cosmetics-related-card">
                  <div className="cosmetics-related-img">
                    {p.images?.[0] ? <img src={p.images[0]} alt={p.name} style={{ width: 56, height: 56, objectFit: "contain" }} /> : <Sparkles size={32} color="#BE185D" />}
                  </div>
                  <div className="cosmetics-related-name">{p.name}</div>
                  {p.category && <div className="cosmetics-related-sub">{p.category}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Related Products - Default */}
      {showRelated && filteredRelated.length > 0 && (
        <div style={{ padding: "16px", marginTop: "16px" }}>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "12px", display: "flex", alignItems: "center", gap: 8 }}>
            <ShoppingBag size={18} /><span>SẢN PHẨM LIÊN QUAN</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "12px" }}>
            {filteredRelated.map((p, idx) => (
              <div key={p._id || idx} style={{ textAlign: "center", padding: "10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.1)", background: "#fff" }}>
                <div style={{ width: 48, height: 48, margin: "0 auto 6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {p.images?.[0] ? <img src={p.images[0]} alt={p.name} style={{ width: 48, height: 48, objectFit: "contain" }} /> : <Package size={32} color="#6366f1" />}
                </div>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, lineHeight: 1.3 }}>{p.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // =========================================================================
  // 6. TEM XÁC THỰC TIÊU CHUẨN (Default Layout)
  // =========================================================================
  const renderDefaultView = () => (
    <div className="product-info-body">
      <div className={`product-info-verify ${label?.scanCount > 5 ? 'product-info-verify--warning' : ''}`}>
        <div className="product-info-verify-icon">
          {label?.scanCount > 5 ? <AlertTriangle size={22} /> : <ShieldCheck size={22} />}
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
          {product?.description && <p className="product-info-desc">{product.description}</p>}
          <div className="product-info-rows">
            <div className="product-info-row">
              <div className="product-info-row-icon"><QrCode size={16} /></div>
              <span className="product-info-row-label">Mã serial</span>
              <span className="product-info-row-value">{label?.serialNumber || serial}</span>
            </div>
            {product?.category && (
              <div className="product-info-row">
                <div className="product-info-row-icon"><Hash size={16} /></div>
                <span className="product-info-row-label">Danh mục</span>
                <span className="product-info-row-value">{product.category}</span>
              </div>
            )}
          </div>
        </div>
      </div>

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

      {(product?.manufacturerId || product?.manufacturerInfo || enterprise) && (() => {
        const mfg = product?.manufacturerId || enterprise;
        return (
          <div className="product-info-enterprise">
            <div className="product-info-enterprise-title">
              {product?.manufacturerId ? 'Nhà sản xuất' : 'Doanh nghiệp sản xuất'}
            </div>
            <div className="product-info-enterprise-name">{mfg?.name || enterprise?.name}</div>
            {product?.manufacturerInfo && (
              <div style={{ whiteSpace: 'pre-line', fontSize: '0.85rem', color: '#475569', margin: '6px 0 10px', padding: '8px 10px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                {product.manufacturerInfo}
              </div>
            )}
            {mfg?.address && <div className="product-info-enterprise-row"><MapPin size={14} />{mfg.address}</div>}
            {mfg?.phone && <div className="product-info-enterprise-row"><Phone size={14} />{mfg.phone}</div>}
          </div>
        );
      })()}
    </div>
  );

  return (
    <div className={`product-info-page theme-${activeTheme}`}>
      {/* Enterprise Custom Domain Banner */}
      {isCustomDomain && customEnterprise && (
        <div className="product-info-domain-banner"
          style={{ background: customEnterprise.brandConfig?.primaryColor || '#1565C0' }}
        >
          {customEnterprise.logo && (
            <img src={customEnterprise.logo} alt={customEnterprise.name} className="product-info-domain-logo" />
          )}
          <span className="product-info-domain-name">{customEnterprise.name}</span>
        </div>
      )}


      {/* Render Active View by Industry */}
      {(activeTheme === 'staycool' || activeTheme === 'vyphyto') && renderStayCoolView()}
      {activeTheme === 'medical' && renderMedicalView()}
      {activeTheme === 'appliance' && renderApplianceView()}
      {(activeTheme === 'functional_food' || activeTheme === 'food') && renderFoodView()}
      {activeTheme === 'agriculture' && renderAgricultureView()}
      {activeTheme === 'cosmetics' && renderCosmeticsView()}
      {activeTheme === 'ocop' && renderOcopView()}
      {activeTheme === 'default' && renderDefaultView()}

      {/* Modals Popup */}
      {activeModal && (
        <div className="appliance-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="appliance-modal-body" onClick={e => e.stopPropagation()}>
            <div className="appliance-modal-header" style={{
              background: (activeTheme === 'staycool' || activeTheme === 'vyphyto') ? '#ea580c' : activeTheme === 'medical' ? '#00695C' : activeTheme === 'functional_food' ? '#15803D' : activeTheme === 'agriculture' ? '#166534' : activeTheme === 'cosmetics' ? '#BE185D' : '#003366'
            }}>
              <h4>
                {activeModal === 'activate' && 'Kích hoạt Xác thực & Bảo hành'}
                {activeModal === 'tem' && 'Chi tiết Thông tin Tem'}
                {activeModal === 'scan' && 'Lịch sử & Thông tin Quét'}
                {activeModal === 'mfg' && 'Thông tin Nhà sản xuất'}
                {activeModal === 'distributor' && 'Thông tin Độc quyền Phân phối'}
                {activeModal === 'cert' && 'Giấy công bố sản phẩm'}
                {activeModal === 'brand' && 'Câu chuyện Thương hiệu'}
                {activeModal === 'export' && 'Thông tin Xuất khẩu'}
                {activeModal === 'reward' && 'Chương trình Tích điểm Đổi quà'}
                {activeModal === 'product_detail' && 'Chi tiết Thông tin Sản phẩm'}
                {activeModal === 'all_products' && 'Sản phẩm cùng nhà sản xuất'}
                {activeModal === 'ingredients' && 'Thành phần & Dược chất'}
                {activeModal === 'dosage' && 'Chỉ định & Hướng dẫn sử dụng'}
                {activeModal === 'caution' && 'Thận trọng & Bảo quản'}
              </h4>
              <button className="appliance-modal-close" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="appliance-modal-content">
              {activeModal === 'activate' && (() => {
                return (
                  <div>
                    <div style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', border: '1px solid #fed7aa', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ea580c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ShieldCheck size={22} />
                        </div>
                        <div>
                          <h5 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#c2410c' }}>
                            KÍCH HOẠT XÁC THỰC & BẢO HÀNH
                          </h5>
                          <p style={{ margin: 0, fontSize: '0.78rem', color: '#7c2d12' }}>
                            Bảo vệ quyền lợi khách hàng chính hãng
                          </p>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.86rem', lineHeight: '1.5', color: '#334155', margin: 0 }}>
                        Sản phẩm <strong>{product?.name || 'Chính hãng'}</strong> đã được xác thực hợp lệ trên hệ thống Smart QR Trace.
                      </p>
                    </div>

                    <div className="modal-info-list" style={{ marginBottom: 16 }}>
                      <div className="modal-info-item"><span>Mã Serial:</span> <strong style={{ color: '#ea580c' }}>{label?.serialNumber || serial}</strong></div>
                      <div className="modal-info-item"><span>Trạng thái tem:</span> <strong style={{ color: '#059669' }}>Đã xác thực chính hãng</strong></div>
                      <div className="modal-info-item"><span>Nhà sản xuất:</span> <strong>VYPHYTO LABORATORIES (France) 🇫🇷</strong></div>
                      <div className="modal-info-item"><span>Đơn vị phân phối:</span> <strong>{enterprise?.name || 'Công Ty TNHH StayCool Việt Nam'}</strong></div>
                    </div>

                    {activateSuccess ? (
                      <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: 10, padding: '16px', textAlign: 'center' }}>
                        <CheckCircle2 size={36} color="#059669" style={{ margin: '0 auto 8px' }} />
                        <h5 style={{ margin: 0, color: '#065f46', fontSize: '0.98rem', fontWeight: 800 }}>KÍCH HOẠT THÀNH CÔNG!</h5>
                        <p style={{ margin: '6px 0 0', fontSize: '0.86rem', color: '#047857' }}>
                          Sản phẩm đã được đăng ký thông tin bảo hành điện tử cho khách hàng <strong>{activateName || 'Quý khách'}</strong> ({activatePhone}).
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        if (!activatePhone.trim()) return alert('Vui lòng nhập số điện thoại kích hoạt!');
                        setActivateSuccess(true);
                      }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#334155' }}>Đăng ký kích hoạt thông tin:</label>
                        <input
                          type="text"
                          placeholder="Họ và tên của bạn"
                          value={activateName}
                          onChange={(e) => setActivateName(e.target.value)}
                          style={{ padding: '10px 14px', borderRadius: 8, border: '1.5px solid #fed7aa', fontSize: '0.9rem', outline: 'none' }}
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            type="tel"
                            placeholder="Số điện thoại (*)"
                            value={activatePhone}
                            onChange={(e) => setActivatePhone(e.target.value)}
                            style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1.5px solid #fed7aa', fontSize: '0.9rem', outline: 'none' }}
                            required
                          />
                          <button
                            type="submit"
                            style={{ background: '#ea580c', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            Kích Hoạt
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                );
              })()}

              {activeModal === 'distributor' && (() => {
                const isStayCool = activeTheme === 'staycool' || activeTheme === 'vyphyto' || (enterprise?.name || '').toLowerCase().includes('staycool');
                const distributorName = label?.distributorName || label?.distributorId?.fullName || product?.distributors?.[0]?.name;
                const entName = enterprise?.name || 'Công ty TNHH StayCool Việt Nam';
                const mainDistributor = (distributorName || entName).toUpperCase();

                return (
                  <div>
                    {isStayCool ? (
                      <div>
                        <div style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', border: '1px solid #fed7aa', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ea580c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                              <Handshake size={22} />
                            </div>
                            <div>
                              <h5 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#c2410c' }}>
                                ĐẠI DIỆN NHẬP KHẨU & PHÂN PHỐI ĐỘC QUYỀN
                              </h5>
                              <p style={{ margin: 0, fontSize: '0.78rem', color: '#7c2d12' }}>
                                Đối tác phân phối độc quyền chính thức tại Việt Nam
                              </p>
                            </div>
                          </div>
                          <p style={{ fontSize: '0.86rem', lineHeight: '1.6', color: '#334155', margin: '8px 0 0' }}>
                            Các sản phẩm chính hãng được nhập khẩu và phân phối độc quyền bởi <strong>{mainDistributor}</strong>, có đầy đủ giấy phép lưu hành và giấy tiếp nhận đăng ký bản công bố của Cục An Toàn Thực Phẩm – Bộ Y Tế Việt Nam.
                          </p>
                        </div>

                        <div className="modal-info-list">
                          <div className="modal-info-item">
                            <span>Đơn vị độc quyền:</span>
                            <strong style={{ color: '#ea580c' }}>{mainDistributor}</strong>
                          </div>
                          <div className="modal-info-item">
                            <span>Thương hiệu phân phối:</span>
                            <strong>{product?.brand || enterprise?.name || 'VYPHYTO LABORATORIES (France)'}</strong>
                          </div>
                          <div className="modal-info-item">
                            <span>Địa chỉ trụ sở:</span>
                            <strong>{enterprise?.address || '28 Đặng Thuỳ Châm, Phường 13, Quận Bình Thạnh, TP. Hồ Chí Minh'}</strong>
                          </div>
                          <div className="modal-info-item">
                            <span>Hotline hỗ trợ:</span>
                            <strong>{enterprise?.phone || '1900 636 828 / 0988 567 890'}</strong>
                          </div>
                          <div className="modal-info-item">
                            <span>Email liên hệ:</span>
                            <strong>{enterprise?.email || 'staycool@gmail.com'}</strong>
                          </div>
                          <div className="modal-info-item">
                            <span>Website chính thức:</span>
                            <a href={enterprise?.website ? (enterprise.website.startsWith('http') ? enterprise.website : `https://${enterprise.website}`) : 'https://staycool.vn'} target="_blank" rel="noreferrer" style={{ color: '#ea580c', fontWeight: 700, textDecoration: 'underline' }}>
                              {enterprise?.website || 'staycool.vn'}
                            </a>
                          </div>
                        </div>

                        <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 10, background: '#f8fafc', border: '1px dashed #ea580c', fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
                          🛡️ <strong>Cam kết vàng từ {mainDistributor}:</strong> 100% sản phẩm phân phối ra thị trường đều dán tem niêm phong chống giả thông minh tích hợp công nghệ QR Trace. Phát hiện hàng giả cam kết đền bù gấp 10 lần giá trị sản phẩm.
                        </div>
                      </div>
                    ) : (
                      <div className="modal-info-list">
                        <div className="modal-info-item"><span>Đơn vị phân phối:</span> <strong>{mainDistributor}</strong></div>
                        <div className="modal-info-item"><span>Địa chỉ:</span> <strong>{enterprise?.address || 'Toàn quốc'}</strong></div>
                        <div className="modal-info-item"><span>Hotline:</span> <strong>{enterprise?.phone || '1900 1234'}</strong></div>
                        <div className="modal-info-item"><span>Email:</span> <strong>{enterprise?.email || 'info@domain.com'}</strong></div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {activeModal === 'reward' && (() => {
                const isStayCool = activeTheme === 'staycool' || activeTheme === 'vyphyto' || (enterprise?.name || '').toLowerCase().includes('staycool');
                return (
                  <div>
                    <div style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', border: '1px solid #fed7aa', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ea580c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Gift size={22} />
                        </div>
                        <div>
                          <h5 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#c2410c' }}>
                            TÍCH ĐIỂM ĐỔI QUÀ - TRI ÂN KHÁCH HÀNG
                          </h5>
                          <p style={{ margin: 0, fontSize: '0.78rem', color: '#7c2d12' }}>
                            {isStayCool ? 'Chương trình thành viên VIP VYPHYTO Club' : 'Chương trình khách hàng thân thiết'}
                          </p>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.86rem', lineHeight: '1.5', color: '#334155', margin: 0 }}>
                        Mỗi mã tem quét thành công được ghi nhận <strong>+100 điểm thưởng</strong>. Tích lũy điểm để nhận voucher mua hàng, quà tặng chăm sóc sức khỏe và tham gia quay số may mắn.
                      </p>
                    </div>

                    {/* Hướng dẫn 3 bước */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                        <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#ea580c', color: '#fff', fontSize: '0.78rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>1</span>
                        <div style={{ fontSize: '0.84rem', color: '#334155' }}><strong>Quét mã QR</strong> trên tem niêm phong sản phẩm để xác thực hàng chính hãng.</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                        <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#ea580c', color: '#fff', fontSize: '0.78rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>2</span>
                        <div style={{ fontSize: '0.84rem', color: '#334155' }}><strong>Nhập số điện thoại</strong> bên dưới để tích lũy điểm thưởng vào tài khoản thành viên.</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                        <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#ea580c', color: '#fff', fontSize: '0.78rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>3</span>
                        <div style={{ fontSize: '0.84rem', color: '#334155' }}><strong>Đổi quà hấp dẫn</strong> hoặc voucher giảm giá trực tiếp cho lần mua tiếp theo.</div>
                      </div>
                    </div>

                    {/* Interactive Form */}
                    {rewardSuccess ? (
                      <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: 10, padding: '16px', textAlign: 'center' }}>
                        <CheckCircle2 size={36} color="#059669" style={{ margin: '0 auto 8px' }} />
                        <h5 style={{ margin: 0, color: '#065f46', fontSize: '0.98rem', fontWeight: 800 }}>TÍCH ĐIỂM THÀNH CÔNG!</h5>
                        <p style={{ margin: '6px 0 0', fontSize: '0.86rem', color: '#047857' }}>
                          Chúc mừng bạn đã tích lũy thành công <strong>+100 điểm</strong> cho số điện thoại <strong>{rewardPhone}</strong>.
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        if (!rewardPhone.trim()) return alert('Vui lòng nhập số điện thoại để tích điểm!');
                        setRewardSuccess(true);
                      }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#334155' }}>Nhập số điện thoại nhận điểm:</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            type="tel"
                            placeholder="VD: 0912 345 678"
                            value={rewardPhone}
                            onChange={(e) => setRewardPhone(e.target.value)}
                            style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1.5px solid #fed7aa', fontSize: '0.9rem', outline: 'none' }}
                            required
                          />
                          <button
                            type="submit"
                            style={{ background: '#ea580c', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            Tích Điểm
                          </button>
                        </div>
                        <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          Mỗi mã tem hợp lệ chỉ được tích điểm 01 lần duy nhất cho chủ sở hữu đầu tiên.
                        </span>
                      </form>
                    )}
                  </div>
                );
              })()}

              {activeModal === 'tem' && (
                <div className="modal-info-list">
                  <div className="modal-info-item"><span>Mã Serial:</span> <strong>{label?.serialNumber || serial}</strong></div>
                  <div className="modal-info-item"><span>Mã QR mã hóa:</span> <strong>{label?.qrCode || 'Đã xác thực bí mật'}</strong></div>
                  <div className="modal-info-item"><span>Trạng thái:</span> <strong style={{ color: '#059669' }}>{label?.status === 'ACTIVE' ? 'Đã kích hoạt' : 'Hoạt động'}</strong></div>
                  <div className="modal-info-item"><span>Hạn tem:</span> <strong>{formatDate(label?.expiryDate || scanData?.label?.batchId?.expiryDate)}</strong></div>
                </div>
              )}
              {activeModal === 'scan' && (
                <div className="modal-info-list">
                  <div className="modal-info-item"><span>Số lượt quét:</span> <strong>{label?.scanCount || 1} lần</strong></div>
                  <div className="modal-info-item"><span>Quét lần đầu:</span> <strong>{formatDate(label?.firstScannedAt || scanData?.firstScanTime)}</strong></div>
                  <div className="modal-info-item"><span>Quét gần nhất:</span> <strong>{formatDate(label?.lastScannedAt || new Date())}</strong></div>
                  <div className="modal-info-item"><span>Địa điểm xác minh:</span> <strong>GPS Việt Nam</strong></div>
                </div>
              )}
              {activeModal === 'mfg' && (() => {
                const isStayCool = activeTheme === 'staycool' || activeTheme === 'vyphyto' || (enterprise?.name || '').toLowerCase().includes('staycool');
                const mfg = (product?.manufacturerId && typeof product.manufacturerId === 'object') ? product.manufacturerId : null;
                const hasAssignedMfg = Boolean(mfg?.name || product?.manufacturerInfo?.trim());

                // Detect quốc gia xuất xứ theo địa chỉ/tên đối tác
                const getCountryMeta = (addr = '', name = '') => {
                  const s = `${addr} ${name}`.toLowerCase();
                  if (s.includes('france') || s.includes('pháp') || s.includes('paris')) return { flag: '🇫🇷', country: 'Cộng hòa Pháp (France)' };
                  if (s.includes('poland') || s.includes('ba lan') || s.includes('polska') || s.includes('warsaw') || s.includes('warszawa')) return { flag: '🇵🇱', country: 'Cộng hòa Ba Lan (Poland)' };
                  if (s.includes('spain') || s.includes('tây ban nha') || s.includes('espana') || s.includes('españa') || s.includes('madrid') || s.includes('barcelona')) return { flag: '🇪🇸', country: 'Vương quốc Tây Ban Nha (Spain)' };
                  if (s.includes('germany') || s.includes('đức') || s.includes('deutschland')) return { flag: '🇩🇪', country: 'Cộng hòa Liên bang Đức (Germany)' };
                  if (s.includes('usa') || s.includes('mỹ') || s.includes('united states') || s.includes('america')) return { flag: '🇺🇸', country: 'Hoa Kỳ (USA)' };
                  if (s.includes('japan') || s.includes('nhật')) return { flag: '🇯🇵', country: 'Nhật Bản (Japan)' };
                  if (s.includes('korea') || s.includes('hàn')) return { flag: '🇰🇷', country: 'Hàn Quốc (South Korea)' };
                  if (s.includes('việt nam') || s.includes('vietnam')) return { flag: '🇻🇳', country: 'Việt Nam' };
                  return { flag: '🏭', country: 'Quốc tế' };
                };

                const countryMeta = getCountryMeta(mfg?.address, mfg?.name);
                const mfgName = mfg?.name || (product?.manufacturerInfo ? 'Đơn Vị Sản Xuất Tiêu Chuẩn Quốc Tế' : 'VYPHYTO LABORATORIES (FRANCE)');
                const mfgAddress = mfg?.address || '';
                const mfgPhone = mfg?.phone || '';
                const mfgEmail = mfg?.email || '';
                const mfgDetails = mfg?.partnerDetails || '';

                if (isStayCool) {
                  // Nếu sản phẩm CHƯA gắn NSX riêng -> Hiển thị mặc định viện Vyphyto France
                  if (!hasAssignedMfg) {
                    return (
                      <div>
                        <div style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', border: '1px solid #fed7aa', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ea580c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem' }}>
                              🇫🇷
                            </div>
                            <div>
                              <h5 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#c2410c' }}>
                                VYPHYTO LABORATORIES (FRANCE)
                              </h5>
                              <p style={{ margin: 0, fontSize: '0.78rem', color: '#7c2d12' }}>
                                Viện Nghiên Cứu & Sản Xuất Dược Phẩm Sinh Học Cộng Hòa Pháp
                              </p>
                            </div>
                          </div>
                          <p style={{ fontSize: '0.86rem', lineHeight: '1.6', color: '#334155', margin: '8px 0 0' }}>
                            <strong>VYPHYTO LABORATORIES</strong> là viện nghiên cứu và sản xuất các dòng thực phẩm bảo vệ sức khỏe, vitamin và khoáng chất hàng đầu tại Pháp, dựa trên công nghệ sinh học và chiết xuất hữu cơ tự nhiên đạt chuẩn Châu Âu.
                          </p>
                        </div>

                        <div className="modal-info-list">
                          <div className="modal-info-item"><span>Đơn vị sản xuất:</span> <strong style={{ color: '#ea580c' }}>VYPHYTO LABORATORIES</strong></div>
                          <div className="modal-info-item"><span>Quốc gia xuất xứ:</span> <strong>Cộng hòa Pháp (Made in France) 🇫🇷</strong></div>
                          <div className="modal-info-item"><span>Tiêu chuẩn nhà máy:</span> <strong style={{ color: '#059669' }}>cGMP - WHO, ISO 22000, HACCP Châu Âu</strong></div>
                          <div className="modal-info-item"><span>Định hướng phát triển:</span> <strong>Tinh Hoa Pháp – Sức Khỏe Bạn</strong></div>
                          <div className="modal-info-item"><span>Website hãng:</span> <a href="https://vyphyto.com" target="_blank" rel="noreferrer" style={{ color: '#ea580c', fontWeight: 700, textDecoration: 'underline' }}>vyphyto.com</a></div>
                        </div>

                        <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
                          🔬 <strong>Cam kết chất lượng Châu Âu:</strong> 100% nguyên liệu đều trải qua quy trình kiểm nghiệm nghiêm ngặt của Liên minh Châu Âu (EU) trước khi đưa vào sản xuất và đóng gói.
                        </div>
                      </div>
                    );
                  }

                  // Khi đã gắn NSX cụ thể (UNIPRO, HC CLOVER, MASENZ DANYA, PHYTÉO, v.v...)
                  return (
                    <div>
                      <div style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', border: '1px solid #fed7aa', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#ea580c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.25rem' }}>
                            {countryMeta.flag}
                          </div>
                          <div>
                            <h5 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#c2410c' }}>
                              {mfgName.toUpperCase()}
                            </h5>
                            <p style={{ margin: 0, fontSize: '0.78rem', color: '#7c2d12' }}>
                              Nhà máy & cơ sở sản xuất đạt chuẩn tiêu chuẩn Quốc Tế
                            </p>
                          </div>
                        </div>
                        {mfgAddress && (
                          <p style={{ fontSize: '0.84rem', lineHeight: '1.5', color: '#334155', margin: '6px 0 0' }}>
                            📍 <strong>Địa chỉ:</strong> {mfgAddress}
                          </p>
                        )}
                      </div>

                      <div className="modal-info-list">
                        <div className="modal-info-item"><span>Đơn vị sản xuất:</span> <strong style={{ color: '#ea580c' }}>{mfgName}</strong></div>
                        {countryMeta.country && <div className="modal-info-item"><span>Xuất xứ / Quốc gia:</span> <strong>{countryMeta.country} {countryMeta.flag}</strong></div>}
                        {mfgAddress && <div className="modal-info-item"><span>Địa chỉ nhà máy:</span> <strong>{mfgAddress}</strong></div>}
                        {mfgPhone && <div className="modal-info-item"><span>Điện thoại:</span> <strong>{mfgPhone}</strong></div>}
                        {mfgEmail && <div className="modal-info-item"><span>Email:</span> <strong>{mfgEmail}</strong></div>}
                        <div className="modal-info-item"><span>Tiêu chuẩn nhà máy:</span> <strong style={{ color: '#059669' }}>cGMP - WHO, ISO 22000, HACCP Quốc Tế</strong></div>
                      </div>

                      {product?.manufacturerInfo && (
                        <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #fed7aa' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#ea580c', marginBottom: 6 }}>
                            📋 CHI TIẾT THÔNG TIN NHÀ SẢN XUẤT:
                          </div>
                          <div style={{ whiteSpace: 'pre-line', fontSize: '0.85rem', lineHeight: '1.6', color: '#334155' }}>
                            {product.manufacturerInfo}
                          </div>
                        </div>
                      )}

                      {mfgDetails && (
                        <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 10, background: '#ffffff', border: '1px solid #fed7aa' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#ea580c', marginBottom: 6 }}>
                            🏭 GIỚI THIỆU NHÀ MÁY & ĐỐI TÁC:
                          </div>
                          <div 
                            className="partner-details-html"
                            dangerouslySetInnerHTML={{ __html: mfgDetails }}
                            style={{ fontSize: '0.85rem', lineHeight: '1.6', color: '#334155' }}
                          />
                        </div>
                      )}

                      <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 10, background: '#f8fafc', border: '1px dashed #ea580c', fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
                        🔬 <strong>Cam kết chất lượng:</strong> 100% quy trình sản xuất và đóng gói được kiểm tra, chứng nhận kiểm định chất lượng nghiêm ngặt trước khi xuất xưởng lưu hành.
                      </div>
                    </div>
                  );
                }

                // Giao diện cho các theme khác
                const fallbackMfg = mfg || enterprise;
                return (
                  <div>
                    {product?.manufacturerInfo && (
                      <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#003366', marginBottom: 6 }}>
                          THÔNG TIN NHÀ SẢN XUẤT:
                        </div>
                        <div style={{ whiteSpace: 'pre-line', fontSize: '0.9rem', lineHeight: '1.6', color: '#334155' }}>
                          {product.manufacturerInfo}
                        </div>
                      </div>
                    )}
                    <div className="modal-info-list">
                      <div className="modal-info-item"><span>Tên đơn vị:</span> <strong>{mfg?.name || fallbackMfg?.name || 'Doanh nghiệp sản xuất'}</strong></div>
                      <div className="modal-info-item"><span>Địa chỉ:</span> <strong>{mfg?.address || fallbackMfg?.address || 'Việt Nam'}</strong></div>
                      {(mfg?.phone || fallbackMfg?.phone) && <div className="modal-info-item"><span>Hotline:</span> <strong>{mfg?.phone || fallbackMfg?.phone}</strong></div>}
                      {(mfg?.email || fallbackMfg?.email) && <div className="modal-info-item"><span>Email:</span> <strong>{mfg?.email || fallbackMfg?.email}</strong></div>}
                    </div>
                    {(mfg?.partnerDetails || fallbackMfg?.partnerDetails) && (
                      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#003366', marginBottom: '8px', textTransform: 'uppercase' }}>
                          Chi tiết đối tác:
                        </div>
                        <div 
                          className="partner-details-html"
                          dangerouslySetInnerHTML={{ __html: mfg?.partnerDetails || fallbackMfg?.partnerDetails }}
                          style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#334155' }}
                        />
                      </div>
                    )}
                  </div>
                );
              })()}
              {activeModal === 'ingredients' && (
                <div className="modal-info-list">
                  <div className="modal-info-item"><span>Thành phần chính:</span> <strong>Paracetamol (500mg), Phụ liệu vừa đủ 1 viên</strong></div>
                  <div className="modal-info-item"><span>Tác dụng dược lý:</span> <strong>Giảm đau, hạ sốt nhanh chóng và an toàn</strong></div>
                  <div className="modal-info-item"><span>Độ tinh khiết:</span> <strong>Đạt 99.8% chuẩn Dược điển VN V</strong></div>
                </div>
              )}
              {activeModal === 'dosage' && (
                <div className="modal-info-list">
                  <div className="modal-info-item"><span>Người lớn:</span> <strong>1-2 viên / lần, mỗi 4-6 giờ (Tối đa 8 viên/ngày)</strong></div>
                  <div className="modal-info-item"><span>Trẻ em (7-12 tuổi):</span> <strong>1/2 - 1 viên / lần (Theo chỉ định bác sĩ)</strong></div>
                  <div className="modal-info-item"><span>Cách dùng:</span> <strong>Uống sau khi ăn với 150ml nước lọc</strong></div>
                </div>
              )}
              {activeModal === 'caution' && (
                <div className="modal-info-list">
                  <div className="modal-info-item"><span>Chống chỉ định:</span> <strong>Mẫn cảm với paracetamol, suy gan nặng</strong></div>
                  <div className="modal-info-item"><span>Bảo quản:</span> <strong>Khu vực khô ráo, dưới 30°C, tránh ánh sáng</strong></div>
                </div>
              )}
              {activeModal === 'cert' && (
                <div>
                  {product?.congBoImages?.filter(img => img && img.trim()).length > 0 ? (
                    <div>
                      <p style={{ fontSize: '0.88rem', color: '#4b5563', marginBottom: 14, lineHeight: 1.5 }}>
                        Giấy tiếp nhận đăng ký bản công bố sản phẩm đã được xác nhận bởi cơ quan có thẩm quyền.
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {product.congBoImages.filter(img => img && img.trim()).map((img, idx) => (
                          <a key={idx} href={img} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                            <img
                              src={img}
                              alt={'Giấy công bố ' + (idx + 1)}
                              style={{ width: '100%', borderRadius: 10, border: '1px solid #d1fae5', objectFit: 'contain', maxHeight: 340, background: '#f9fafb' }}
                            />
                            <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#6b7280', marginTop: 4 }}>
                              Nhấn để xem đầy đủ ↗
                            </p>
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: '#9ca3af' }}>
                      <FileText size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                      <p style={{ fontSize: '0.9rem' }}>Chưa có giấy công bố sản phẩm.</p>
                      <p style={{ fontSize: '0.82rem', marginTop: 4 }}>Vui lòng liên hệ nhà sản xuất để biết thêm thông tin.</p>
                    </div>
                  )}
                </div>
              )}
              {activeModal === 'all_products' && (
                <div>
                  {showRelated && filteredRelated.length > 0 ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "12px", padding: "4px 0" }}>
                      {filteredRelated.map((p, idx) => (
                        <div key={p._id || idx} style={{ textAlign: "center", padding: "10px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.1)", background: "#f0fdf4" }}>
                          <div style={{ width: 56, height: 56, margin: "0 auto 8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {p.images?.[0] ? <img src={p.images[0]} alt={p.name} style={{ width: 56, height: 56, objectFit: "contain", borderRadius: 6 }} /> : <Package size={32} color="#16a34a" />}
                          </div>
                          <div style={{ fontSize: "0.8rem", fontWeight: 600, lineHeight: 1.3, color: "#166534" }}>{p.name}</div>
                          {p.category && <div style={{ fontSize: "0.72rem", color: "#4ade80", marginTop: 3 }}>{p.category}</div>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ textAlign: "center", opacity: 0.6, padding: "20px 0" }}>Không có sản phẩm liên quan.</p>
                  )}
                </div>
              )}
              {activeModal === 'product_detail' && (() => {
                const isStayCool = activeTheme === 'staycool' || activeTheme === 'vyphyto' || (enterprise?.name || '').toLowerCase().includes('staycool');
                if (isStayCool) {
                  return (
                    <div>
                      <div style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', border: '1px solid #fed7aa', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ea580c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Package size={22} />
                          </div>
                          <div>
                            <h5 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#c2410c' }}>
                              {product?.name || 'MUMMACAL-ZT DIAMOND'}
                            </h5>
                            <p style={{ margin: 0, fontSize: '0.78rem', color: '#7c2d12' }}>
                              {product?.category || 'Thực phẩm bảo vệ sức khỏe'} • Chuẩn Dược phẩm Châu Âu 🇫🇷
                            </p>
                          </div>
                        </div>
                        <p style={{ fontSize: '0.86rem', lineHeight: '1.6', color: '#334155', margin: '8px 0 0' }}>
                          {product?.description || 'MUMMACAL-ZT DIAMOND là dòng sản phẩm bổ sung Canxi hữu cơ tự nhiên chiết xuất từ Tảo biển đỏ Aquamin F Iceland kết hợp Vitamin D3, Vitamin K2-MK7, Magie và Kẽm. Giúp tăng cường mật độ xương răng chắc khỏe, ngừa loãng xương và thúc đẩy chiều cao vượt trội, hoàn toàn không gây nóng hay lắng cặn sỏi thận.'}
                        </p>
                      </div>

                      <div className="modal-info-list" style={{ marginBottom: 16 }}>
                        <div className="modal-info-item"><span>Tên sản phẩm:</span> <strong style={{ color: '#ea580c' }}>{product?.name || 'MUMMACAL-ZT DIAMOND'}</strong></div>
                        <div className="modal-info-item"><span>Xuất xứ thương hiệu:</span> <strong>VYPHYTO LABORATORIES (Pháp) 🇫🇷</strong></div>
                        <div className="modal-info-item"><span>Đơn vị nhập khẩu:</span> <strong>{enterprise?.name || 'Công Ty TNHH StayCool Việt Nam'}</strong></div>
                        <div className="modal-info-item"><span>Quy cách đóng gói:</span> <strong>{product?.specifications?.['Quy cách'] || 'Hộp 30 viên / 60 viên nang mềm'}</strong></div>
                        <div className="modal-info-item"><span>Tiêu chuẩn nhà máy:</span> <strong style={{ color: '#059669' }}>cGMP - WHO, ISO 22000</strong></div>
                        <div className="modal-info-item"><span>Hạn sử dụng:</span> <strong>{formatDate(scanData?.label?.batchId?.expiryDate || label?.expiryDate) || '36 tháng kể từ NSX'}</strong></div>
                      </div>

                      {/* Thành phần & Công dụng nổi bật */}
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#c2410c', marginBottom: 8, textTransform: 'uppercase' }}>
                          🌟 Thành phần & Công dụng nổi bật:
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #fed7aa', fontSize: '0.85rem', lineHeight: 1.5 }}>
                            🌱 <strong>Aquamin F (Tảo biển đỏ Iceland):</strong> Cung cấp Canxi hữu cơ và hơn 70 khoáng chất vi lượng sinh khả dụng cao, cấu trúc xốp tổ ong giúp hấp thu êm dịu, không gây táo bón.
                          </div>
                          <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #fed7aa', fontSize: '0.85rem', lineHeight: 1.5 }}>
                            ☀️ <strong>Bộ đôi Vitamin D3 & K2-MK7:</strong> Hỗ trợ hấp thu Canxi tối đa từ ruột vào máu và định hướng canxi gắn trúng đích vào mô xương, tránh vôi hóa mạch máu.
                          </div>
                          <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #fed7aa', fontSize: '0.85rem', lineHeight: 1.5 }}>
                            🛡️ <strong>Magie Oxyd & Kẽm Gluconat:</strong> Củng cố khung xương dẻo dai và nâng cao sức đề kháng toàn diện cho mẹ bầu và thanh thiếu niên.
                          </div>
                        </div>
                      </div>

                      {/* Đối tượng sử dụng */}
                      <div style={{ marginBottom: 14, padding: '12px 14px', borderRadius: 10, background: '#fff7ed', border: '1px solid #ffedd5', fontSize: '0.84rem', color: '#7c2d12', lineHeight: 1.5 }}>
                        👥 <strong>Đối tượng khuyên dùng:</strong> Phụ nữ chuẩn bị mang thai, đang mang thai và nuôi con bú; trẻ em từ 6 tuổi trở lên đang trong giai đoạn phát triển chiều cao; người cao tuổi, người có nguy cơ loãng xương hoặc gãy xương.
                      </div>
                    </div>
                  );
                }

                return (
                  <div>
                    {/* Tên & mô tả */}
                    <p style={{ fontWeight: 700, fontSize: '1rem', color: '#00695C', marginBottom: '8px' }}>
                      {product?.name || 'Sản phẩm chính hãng'}
                    </p>
                    {product?.description ? (
                      <p style={{ color: '#334155', fontSize: '0.9rem', lineHeight: '1.7', marginBottom: 16, whiteSpace: 'pre-line' }}>
                        {product.description}
                      </p>
                    ) : (
                      <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: 16 }}>
                        Sản phẩm được xác thực nguồn gốc và kiểm định chất lượng chính hãng.
                      </p>
                    )}

                    {/* Thông số kỹ thuật / thuộc tính */}
                    {product?.specifications && Object.keys(product.specifications).length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#00695C', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Thông số sản phẩm
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {Object.entries(product.specifications).map(([key, val]) => (
                            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 6, background: '#f0fdf4', fontSize: '0.86rem' }}>
                              <span style={{ color: '#4b5563', fontWeight: 500 }}>{key}:</span>
                              <span style={{ color: '#166534', fontWeight: 600 }}>{val}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Thông tin bổ sung nhà sản xuất */}
                    {product?.producerInfo && (
                      <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#00695C', marginBottom: 6 }}>Đơn vị sản xuất:</div>
                        <div style={{ whiteSpace: 'pre-line', fontSize: '0.86rem', lineHeight: '1.6', color: '#334155' }}>{product.producerInfo}</div>
                      </div>
                    )}

                    {/* Ảnh giấy công bố (nếu có) */}
                    {product?.congBoImages?.filter(img => img && img.trim()).length > 0 && (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#00695C', marginBottom: 8 }}>Giấy công bố sản phẩm:</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {product.congBoImages.filter(img => img && img.trim()).map((img, idx) => (
                            <a key={idx} href={img} target="_blank" rel="noopener noreferrer">
                              <img src={img} alt={'Giấy công bố ' + (idx + 1)} style={{ width: '100%', borderRadius: 8, border: '1px solid #d1fae5', objectFit: 'contain', maxHeight: 300 }} />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Floating Chatbot Widget */}
      {enterprise?.chatbotConfig?.enabled !== false && (
        <div className="product-info-chatbot-widget">
          {!chatOpen ? (
            <button className="chatbot-toggle-btn" onClick={() => setChatOpen(true)}>
              <MessageSquare size={20} />
              <span>Trò chuyện AI</span>
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
