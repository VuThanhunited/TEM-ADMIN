import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, ShieldCheck, AlertTriangle, Package, QrCode,
  Building2, MapPin, Phone, Globe, Mail, Clock, Hash,
  Truck, Home, MessageSquare, Send, X, Bot, Zap,
  Award, CheckCircle2, Layers, Cpu, Sparkles, ChevronLeft, ChevronRight,
  Headphones, Gift, Lock, LayoutGrid, Check, Activity, Shield, Flame, Eye,
  Wrench, FileText
} from 'lucide-react';
import { useDomain } from '../../contexts/DomainContext';
import './ProductInfo.css';

export default function ProductInfo() {
  const navigate = useNavigate();
  const location = useLocation();
  const { customEnterprise, isCustomDomain } = useDomain();

  const { scanData, serial } = location.state || {};

  // Theme detection
  const initialTheme = scanData?.theme || 'default';
  const [activeTheme, setActiveTheme] = useState(
    initialTheme === 'default' ? 'warranty_solution' : initialTheme
  );
  const [viewMode, setViewMode] = useState('html'); // 'html' or 'pdf_exact'

  const themeClass = activeTheme !== 'default' ? `theme-${activeTheme}` : '';

  useEffect(() => {
    if (!scanData) {
      navigate('/home', { replace: true });
    }
  }, []);

  if (!scanData) return null;

  const product = scanData.product;
  const enterprise = scanData.enterprise;
  const label = scanData.label;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // Chatbot & Modal State
  const [chatOpen, setChatOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
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

  // Content Customization Overrides from Admin Template Config
  const contentConfig = scanData?.template?.contentConfig || {};

  const headerTitle1 = contentConfig.headerTitle1 || 'GIẢI PHÁP QRcode';
  const headerTitle2 = contentConfig.headerTitle2 || 'TEM BẢO HÀNH SẢN PHẨM';
  const transparencyLine1 = contentConfig.transparencyLine1 || 'SẢN PHẨM ĐÃ ĐƯỢC NHÀ CUNG CẤP';
  const transparencyLine2 = contentConfig.transparencyLine2 || 'CAM KẾT MINH BẠCH THÔNG TIN';

  // 4 Specs matching PDF / Admin config
  const pdfSpecs = [
    { label: contentConfig.spec1Label || 'Dung tích', value: contentConfig.spec1Value || '1.8L', icon: <Package size={20} color="#0D47A1" strokeWidth={1.5} /> },
    { label: contentConfig.spec2Label || 'Công suất', value: contentConfig.spec2Value || '1200W', icon: <Activity size={20} color="#0D47A1" strokeWidth={1.5} /> },
    { label: contentConfig.spec3Label || 'Lòng nồi', value: contentConfig.spec3Value || 'Inox 304', icon: <Layers size={20} color="#0D47A1" strokeWidth={1.5} /> },
    { label: contentConfig.spec4Label || 'Bảo hành', value: contentConfig.spec4Value || '24 tháng', icon: <ShieldCheck size={20} color="#0D47A1" strokeWidth={1.5} /> }
  ];

  // 5 Benefits Cards from Admin Config or default
  const defaultBenefits = [
    { title: 'ĐẢM BẢO CHÍNH HÃNG', desc: 'Xác thực nguồn gốc, nói không với hàng giả', icon: <ShieldCheck size={22} color="#0D47A1" strokeWidth={1.5} /> },
    { title: 'BẢO HÀNH ĐIỆN TỬ', desc: 'Kích hoạt và tra cứu bảo hành nhanh chóng', icon: <Award size={22} color="#0D47A1" strokeWidth={1.5} /> },
    { title: 'HỖ TRỢ NHANH CHÓNG', desc: 'Tiếp nhận yêu cầu và hỗ trợ kịp thời', icon: <Headphones size={22} color="#0D47A1" strokeWidth={1.5} /> },
    { title: 'ƯU ĐÃI ĐẶC QUYỀN', desc: 'Nhận thông tin khuyến mãi, ưu đãi hấp dẫn', icon: <Gift size={22} color="#0D47A1" strokeWidth={1.5} /> },
    { title: 'BẢO VỆ QUYỀN LỢI', desc: 'An tâm sử dụng, bảo vệ quyền lợi người tiêu dùng', icon: <Lock size={22} color="#0D47A1" strokeWidth={1.5} /> }
  ];

  const benefitsList = (contentConfig.benefits && contentConfig.benefits.length === 5)
    ? contentConfig.benefits.map((b, idx) => ({
        title: b.title || defaultBenefits[idx].title,
        desc: b.desc || defaultBenefits[idx].desc,
        icon: defaultBenefits[idx].icon
      }))
    : defaultBenefits;

  // 6 Checklist features split into 2 columns
  const pdfCol1Features = [
    'Công nghệ cao tần IH giúp nấu chín đều, cơm dẻo ngon',
    'Lòng nồi inox 304 an toàn cho sức khỏe, dễ vệ sinh',
    'Nhiều chế độ nấu tiện lợi: nấu cơm, cháo, súp, hấp, hầm...'
  ];
  
  const pdfCol2Features = [
    'Màn hình LED cảm ứng, điều khiển thông minh',
    'Tiết kiệm điện năng, thân thiện với môi trường',
    'Thiết kế hiện đại, sang trọng, dễ dàng sử dụng'
  ];

  // 5 Related Products matching PDF 100% with extracted assets
  const pdfRelatedProducts = [
    {
      name: 'Nồi chiên không dầu HOMEPLUS HP-AF60',
      image: '/pdf_assets/rel_air_fryer.png'
    },
    {
      name: 'Máy xay sinh tố HOMEPLUS HP-BL80',
      image: '/pdf_assets/rel_blender.png'
    },
    {
      name: 'Bếp từ đôi HOMEPLUS HP-IC72',
      image: '/pdf_assets/rel_induction.png'
    },
    {
      name: 'Máy hút mùi HOMEPLUS HP-HM90',
      image: '/pdf_assets/rel_hood.png'
    },
    {
      name: 'Bình nóng lạnh HOMEPLUS HP-WH30',
      image: '/pdf_assets/rel_water_heater.png'
    }
  ];

  const relatedList = (scanData.relatedProducts && scanData.relatedProducts.length > 0)
    ? scanData.relatedProducts.map(p => ({ name: p.name, image: p.images?.[0] }))
    : pdfRelatedProducts;

  const scrollRef = useRef(null);
  const handleScrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -220, behavior: 'smooth' });
  };
  const handleScrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 220, behavior: 'smooth' });
  };

  const isWarrantyView = activeTheme === 'warranty_solution' || activeTheme === 'warranty';
  const isApplianceView = activeTheme === 'appliance';

  return (
    <div className={`product-info-page ${themeClass}`}>
      {/* Custom Domain Enterprise Banner */}
      {isCustomDomain && customEnterprise && (
        <div className="product-info-domain-banner"
          style={{
            background: customEnterprise.brandConfig?.primaryColor || 'var(--brand-primary, #1565C0)',
          }}
        >
          {customEnterprise.logo && (
            <img src={customEnterprise.logo} alt={customEnterprise.name} className="product-info-domain-logo" />
          )}
          <span className="product-info-domain-name">{customEnterprise.name}</span>
        </div>
      )}

      {isApplianceView ? (
        <div className="appliance-warrant-wrapper">
          {/* Top Back Navigation Bar */}
          <div className="appliance-top-nav">
            <button className="pdf-clean-back" onClick={() => navigate(-1)}>
              <ArrowLeft size={16} /> Quay lại
            </button>
            <span className="appliance-nav-title">BẢO HÀNH GIA DỤNG CHÍNH HÃNG</span>
          </div>

          {/* 1. Header Trust Banner */}
          <div className="appliance-trust-banner">
            <div className="appliance-trust-logo-box">
              <ShieldCheck size={28} color="#0D47A1" />
              <div className="appliance-trust-logo-text">TRUST</div>
            </div>
            <div className="appliance-trust-title-wrap">
              <h2 className="appliance-trust-title">TRUST : SẢN PHẨM CHÍNH HÃNG</h2>
              <p className="appliance-trust-subtitle">Sản phẩm đã được minh bạch thông tin</p>
            </div>
            <div className="appliance-trust-watermark">
              <ShieldCheck size={64} color="rgba(13, 71, 161, 0.08)" />
            </div>
          </div>

          {/* 2. Hero Appliance Banner Showcase */}
          <div className="appliance-hero-card">
            <div className="appliance-hero-image-wrap">
              <img 
                src={product?.images?.[0] || "/pdf_assets/hero_banner.png"} 
                alt={product?.name || "Gia dụng VINSUMI"} 
                className="appliance-hero-img" 
              />
            </div>
            <div className="appliance-hero-body">
              <h3 className="appliance-hero-brand">
                Sản phẩm : <span className="appliance-hero-brand-name">{product?.brand || enterprise?.name || "VINSUMI"}</span>
              </h3>
              <p className="appliance-hero-desc">
                {product?.description || `${product?.brand || enterprise?.name || "VINSUMI"} cam kết mang đến những sản phẩm chất lượng cao, an toàn và bền bỉ - đồng hành cùng gia đình bạn trong cuộc sống hiện đại.`}
              </p>
              <button className="appliance-hero-more-btn" onClick={() => setActiveModal('product_detail')}>
                Xem thêm <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* 3. 8 Quick Info Grid Cards */}
          <div className="appliance-grid-actions">
            <div className="appliance-action-card" onClick={() => setActiveModal('tem')}>
              <div className="appliance-action-icon"><ShieldCheck size={26} color="#0D47A1" /></div>
              <span className="appliance-action-label">Thông tin tem</span>
            </div>
            <div className="appliance-action-card" onClick={() => setActiveModal('scan')}>
              <div className="appliance-action-icon"><QrCode size={26} color="#0D47A1" /></div>
              <span className="appliance-action-label">Thông tin quét</span>
            </div>
            <div className="appliance-action-card" onClick={() => setActiveModal('mfg')}>
              <div className="appliance-action-icon"><Building2 size={26} color="#0D47A1" /></div>
              <span className="appliance-action-label">Nhà sản xuất</span>
            </div>
            <div className="appliance-action-card" onClick={() => setActiveModal('distributor')}>
              <div className="appliance-action-icon"><Truck size={26} color="#0D47A1" /></div>
              <span className="appliance-action-label">Nhà phân phối</span>
            </div>
            <div className="appliance-action-card" onClick={() => setActiveModal('cert')}>
              <div className="appliance-action-icon"><Award size={26} color="#0D47A1" /></div>
              <span className="appliance-action-label">Chứng nhận</span>
            </div>
            <div className="appliance-action-card" onClick={() => setActiveModal('brand')}>
              <div className="appliance-action-icon"><Sparkles size={26} color="#0D47A1" /></div>
              <span className="appliance-action-label">Thương hiệu</span>
            </div>
            <div className="appliance-action-card" onClick={() => setActiveModal('export')}>
              <div className="appliance-action-icon"><Globe size={26} color="#0D47A1" /></div>
              <span className="appliance-action-label">Thông tin XK</span>
            </div>
            <div className="appliance-action-card" onClick={() => setActiveModal('reward')}>
              <div className="appliance-action-icon"><Gift size={26} color="#0D47A1" /></div>
              <span className="appliance-action-label">Tích điểm</span>
            </div>
          </div>

          {/* 4. Related Products Section */}
          <div className="appliance-related-section">
            <div className="appliance-related-header">
              <h3 className="appliance-related-title">
                <Package size={18} color="#0D47A1" style={{ marginRight: 6 }} />
                SẢN PHẨM LIÊN QUAN
              </h3>
              <button className="appliance-related-more-link" onClick={() => setActiveModal('all_products')}>
                Xem thêm <ChevronRight size={16} />
              </button>
            </div>
            <div className="appliance-related-grid">
              {relatedList.slice(0, 4).map((relItem, idx) => (
                <div key={idx} className="appliance-related-card">
                  <div className="appliance-related-img-box">
                    <img src={relItem.image || "/pdf_assets/rel_air_fryer.png"} alt={relItem.name} />
                  </div>
                  <div className="appliance-related-name">{relItem.name}</div>
                  <div className="appliance-related-sub">Chính hãng VINSUMI</div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Appliance Warranty Information Card */}
          <div className="appliance-warranty-box">
            <div className="appliance-warranty-header-bar">
              <ShieldCheck size={20} color="#FFFFFF" />
              <span>THÔNG TIN BẢO HÀNH</span>
            </div>
            <div className="appliance-warranty-content">
              <div className="appliance-warranty-grid4">
                <div className="appliance-warranty-col">
                  <div className="appliance-warranty-icon-box">
                    <ShieldCheck size={24} color="#0D47A1" />
                  </div>
                  <div className="appliance-warranty-label">Thời gian bảo hành</div>
                  <div className="appliance-warranty-val highlight">
                    {contentConfig.warrantyPeriod || "24 tháng"}
                  </div>
                </div>
                <div className="appliance-warranty-col">
                  <div className="appliance-warranty-icon-box">
                    <Wrench size={24} color="#0D47A1" />
                  </div>
                  <div className="appliance-warranty-label">Hình thức bảo hành</div>
                  <div className="appliance-warranty-val">
                    {contentConfig.warrantyType || "Toàn quốc"}
                  </div>
                </div>
                <div className="appliance-warranty-col">
                  <div className="appliance-warranty-icon-box">
                    <FileText size={24} color="#0D47A1" />
                  </div>
                  <div className="appliance-warranty-label">Điều kiện bảo hành</div>
                  <div className="appliance-warranty-val subtext">
                    {contentConfig.warrantyCondition || "Sản phẩm còn nguyên tem, không rách, không tẩy xóa"}
                  </div>
                </div>
                <div className="appliance-warranty-col">
                  <div className="appliance-warranty-icon-box">
                    <Phone size={24} color="#0D47A1" />
                  </div>
                  <div className="appliance-warranty-label">Hotline hỗ trợ</div>
                  <div className="appliance-warranty-val highlight hotline">
                    {enterprise?.phone || contentConfig.hotline || "1900 1234"}
                  </div>
                </div>
              </div>
              <p className="appliance-warranty-footer-note">
                Vui lòng liên hệ trung tâm bảo hành của VINSUMI gần nhất để được hỗ trợ nhanh chóng.
              </p>
            </div>
          </div>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <button className="pdf-canvas-home-btn" onClick={() => navigate('/home')}>
              <Home size={18} />
              Quay lại trang chủ
            </button>
          </div>

          {/* Modal Popups for 8 cards */}
          {activeModal && (
            <div className="appliance-modal-overlay" onClick={() => setActiveModal(null)}>
              <div className="appliance-modal-body" onClick={e => e.stopPropagation()}>
                <div className="appliance-modal-header">
                  <h4>
                    {activeModal === 'tem' && 'Chi tiết Thông tin Tem'}
                    {activeModal === 'scan' && 'Lịch sử & Thông tin Quét'}
                    {activeModal === 'mfg' && 'Thông tin Nhà sản xuất'}
                    {activeModal === 'distributor' && 'Thông tin Nhà phân phối'}
                    {activeModal === 'cert' && 'Chứng nhận & Tiêu chuẩn'}
                    {activeModal === 'brand' && 'Câu chuyện Thương hiệu'}
                    {activeModal === 'export' && 'Thông tin Xuất khẩu'}
                    {activeModal === 'reward' && 'Tích điểm Thành viên'}
                    {activeModal === 'product_detail' && 'Chi tiết Sản phẩm'}
                    {activeModal === 'all_products' && 'Tất cả sản phẩm cùng nhà sản xuất'}
                  </h4>
                  <button className="appliance-modal-close" onClick={() => setActiveModal(null)}>
                    <X size={18} />
                  </button>
                </div>
                <div className="appliance-modal-content">
                  {activeModal === 'tem' && (
                    <div className="modal-info-list">
                      <div className="modal-info-item"><span>Mã Serial:</span> <strong>{label?.serialNumber || serial}</strong></div>
                      <div className="modal-info-item"><span>Mã QR mã hóa:</span> <strong>{label?.qrCode || 'Đã xác thực bí mật'}</strong></div>
                      <div className="modal-info-item"><span>Trạng thái:</span> <strong style={{ color: '#059669' }}>{label?.status === 'ACTIVE' ? 'Đã kích hoạt' : 'Hoạt động'}</strong></div>
                      <div className="modal-info-item"><span>Hạn bảo hành:</span> <strong>{formatDate(label?.expiryDate || scanData?.label?.batchId?.expiryDate)}</strong></div>
                    </div>
                  )}
                  {activeModal === 'scan' && (
                    <div className="modal-info-list">
                      <div className="modal-info-item"><span>Số lượt quét:</span> <strong>{label?.scanCount || 1} lần</strong></div>
                      <div className="modal-info-item"><span>Quét lần đầu:</span> <strong>{formatDate(label?.firstScannedAt || scanData?.firstScanTime)}</strong></div>
                      <div className="modal-info-item"><span>Quét gần nhất:</span> <strong>{formatDate(label?.lastScannedAt || new Date())}</strong></div>
                      <div className="modal-info-item"><span>Xác minh địa điểm:</span> <strong>GPS Việt Nam (Hà Nội / TP.HCM)</strong></div>
                    </div>
                  )}
                  {activeModal === 'mfg' && (
                    <div className="modal-info-list">
                      <div className="modal-info-item"><span>Tên doanh nghiệp:</span> <strong>{enterprise?.name || 'CÔNG TY TNHH VINSUMI VIỆT NAM'}</strong></div>
                      <div className="modal-info-item"><span>Địa chỉ:</span> <strong>{enterprise?.address || 'Lô B2-3, KCN Thăng Long, Đông Anh, Hà Nội'}</strong></div>
                      <div className="modal-info-item"><span>Hotline / Tel:</span> <strong>{enterprise?.phone || '024 6688 1234'}</strong></div>
                      <div className="modal-info-item"><span>Email hỗ trợ:</span> <strong>{enterprise?.email || 'contact@vinsumi.vn'}</strong></div>
                      <div className="modal-info-item"><span>Website:</span> <strong>{enterprise?.website || 'www.vinsumi.vn'}</strong></div>
                    </div>
                  )}
                  {activeModal === 'distributor' && (
                    <div className="modal-info-list">
                      <div className="modal-info-item"><span>Nhà phân phối:</span> <strong>{label?.distributorName || enterprise?.name || 'Hệ thống Đại lý VINSUMI toàn quốc'}</strong></div>
                      <div className="modal-info-item"><span>Địa chỉ đại lý:</span> <strong>{label?.distributorAddress || 'Toàn bộ cửa hàng & Siêu thị điện máy chính hãng'}</strong></div>
                    </div>
                  )}
                  {activeModal === 'cert' && (
                    <div className="modal-info-list">
                      <div className="modal-info-item"><span>Quản lý chất lượng:</span> <strong>ISO 9001:2015</strong></div>
                      <div className="modal-info-item"><span>An toàn điện gia dụng:</span> <strong>QCVN 4:2009/BKHCN</strong></div>
                      <div className="modal-info-item"><span>Hiệu suất năng lượng:</span> <strong>Nhãn năng lượng 5 Sao (Tiết kiệm điện)</strong></div>
                    </div>
                  )}
                  {activeModal === 'brand' && (
                    <div>
                      <p style={{ lineHeight: '1.6', color: '#334155' }}>
                        {product?.brand || enterprise?.name || 'VINSUMI'} là thương hiệu gia dụng hàng đầu, cam kết tiên phong ứng dụng công nghệ hiện đại, chất lượng an toàn và mang lại trải nghiệm sống tiện nghi nhất cho mỗi gia đình Việt.
                      </p>
                    </div>
                  )}
                  {activeModal === 'export' && (
                    <div className="modal-info-list">
                      <div className="modal-info-item"><span>Thị trường xuất khẩu:</span> <strong>Đông Nam Á, Nhật Bản, Hàn Quốc, EU</strong></div>
                      <div className="modal-info-item"><span>Tiêu chuẩn quốc tế:</span> <strong>CE, RoHS, CB Certification</strong></div>
                    </div>
                  )}
                  {activeModal === 'reward' && (
                    <div className="modal-info-list">
                      <div className="modal-info-item"><span>Điểm thưởng tem:</span> <strong style={{ color: '#2563eb' }}>+50 Điểm Care</strong></div>
                      <div className="modal-info-item"><span>Quyền lợi:</span> <strong>Giảm 10% khi thay thế linh kiện chính hãng & Đổi quà sinh nhật</strong></div>
                    </div>
                  )}
                  {(activeModal === 'product_detail' || activeModal === 'all_products') && (
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '1rem', color: '#1e3a8a', marginBottom: '8px' }}>
                        {product?.name || 'Sản phẩm gia dụng VINSUMI'}
                      </p>
                      <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: '1.5' }}>
                        {product?.description || 'Dòng sản phẩm điện gia dụng cao cấp, áp dụng tiêu chuẩn quốc tế, bảo hành chính hãng 24 tháng.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : isWarrantyView ? (
        <div className="pdf-wrapper">
          {/* Clean Top Bar - Only Back Button */}
          <div className="pdf-clean-topbar">
            <button className="pdf-clean-back" onClick={() => navigate(-1)}>
              <ArrowLeft size={16} /> Quay lại
            </button>
          </div>

          {/* Web HTML Responsive Layout */}
          <div className="pdf-poster-canvas">
            {/* Header Title Section */}
            <div className="pdf-header-section">
              <h1 className="pdf-title-line1">
                {headerTitle1}
              </h1>
              <h2 className="pdf-title-line2">{headerTitle2}</h2>
              
              <div className="pdf-diamond-divider">
                <span className="pdf-line-left"></span>
                <span className="pdf-diamond-icon">❖</span>
                <span className="pdf-line-right"></span>
              </div>
            </div>

            {/* 1. Hero Image Banner */}
            <div className="pdf-hero-box">
              <img 
                src="/pdf_assets/hero_banner.png" 
                alt="GIẢI PHÁP QRcode TEM BẢO HÀNH SẢN PHẨM"
                className="pdf-hero-image"
              />
            </div>

            {/* 2. Transparency Commitment Shield Banner */}
            <div className="pdf-transparency-card-img">
              <img 
                src="/pdf_assets/transparency_banner.png" 
                alt="SẢN PHẨM ĐÃ ĐƯỢC NHÀ CUNG CẤP CAM KẾT MINH BẠCH THÔNG TIN"
                className="pdf-transparency-img"
              />
            </div>

            {/* 3. Main Product Details Box (Dynamic Per Product Scanned) */}
            <div className="pdf-product-details-card">
              <div className="pdf-product-layout">
                {/* Product Photo on Left - Dynamic depending on scanned product */}
                <div className="pdf-product-photo-wrap">
                  <img 
                    src={product?.images?.[0] || '/pdf_assets/rice_cooker.png'} 
                    alt={product?.name || 'Nồi cơm điện cao tần HOMEPLUS HP-RC18'} 
                    className="pdf-product-photo"
                  />
                </div>

                {/* Product Details on Right */}
                <div className="pdf-product-info-wrap">
                  <h2 className="pdf-product-heading">
                    {product?.name || 'NỒI CƠM ĐIỆN CAO TẦN HOMEPLUS HP-RC18'}
                  </h2>

                  {/* 4 Key Specs Horizontal Row */}
                  <div className="pdf-specs-horizontal">
                    {pdfSpecs.map((spec, idx) => (
                      <div key={idx} className="pdf-spec-unit">
                        <div className="pdf-spec-icon-box">{spec.icon}</div>
                        <div className="pdf-spec-name">{spec.label}</div>
                        <div className="pdf-spec-value">{spec.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Feature Checklist (2 Columns with Blue Check Circles) */}
                  <div className="pdf-checklist-two-cols">
                    <div className="pdf-checklist-col">
                      {pdfCol1Features.map((feat, idx) => (
                        <div key={idx} className="pdf-checklist-row">
                          <div className="pdf-blue-check-circle">✓</div>
                          <span className="pdf-checklist-text">{feat}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pdf-checklist-col">
                      {pdfCol2Features.map((feat, idx) => (
                        <div key={idx} className="pdf-checklist-row">
                          <div className="pdf-blue-check-circle">✓</div>
                          <span className="pdf-checklist-text">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Related Products Section */}
            <div className="pdf-section-container">
              <h3 className="pdf-section-heading">
                THÔNG TIN SẢN PHẨM & SẢN PHẨM CÙNG NHÀ SẢN XUẤT
              </h3>

              <div className="pdf-carousel-box">
                <button className="pdf-nav-arrow left" onClick={handleScrollLeft} aria-label="Previous">
                  <ChevronLeft size={18} />
                </button>

                <div className="pdf-related-grid" ref={scrollRef}>
                  {pdfRelatedProducts.map((item, idx) => (
                    <div key={idx} className="pdf-related-item-card">
                      <div className="pdf-related-photo-box">
                        <img src={item.image} alt={item.name} />
                      </div>
                      <div className="pdf-related-item-title">{item.name}</div>
                    </div>
                  ))}
                </div>

                <button className="pdf-nav-arrow right" onClick={handleScrollRight} aria-label="Next">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* 5. Manufacturer Information Section */}
            <div className="pdf-section-container">
              <h3 className="pdf-section-heading">THÔNG TIN NHÀ SẢN XUẤT</h3>

              <div className="pdf-manufacturer-layout">
                {/* Building photo on left */}
                <div className="pdf-mfg-building-photo">
                  <img 
                    src="/pdf_assets/factory_building.png" 
                    alt="HOMEPLUS Building" 
                  />
                </div>

                {/* Company info on right */}
                <div className="pdf-mfg-content">
                  <div className="pdf-mfg-field">
                    <Building2 size={16} className="pdf-mfg-field-icon" />
                    <span className="pdf-mfg-field-lbl">Tên công ty:</span>
                    <span className="pdf-mfg-field-val bold">
                      {enterprise?.name || 'CÔNG TY TNHH HOMEPLUS VIỆT NAM'}
                    </span>
                  </div>

                  <div className="pdf-mfg-field">
                    <MapPin size={16} className="pdf-mfg-field-icon" />
                    <span className="pdf-mfg-field-lbl">Địa chỉ:</span>
                    <span className="pdf-mfg-field-val">
                      {enterprise?.address || 'Lô B2-3, KCN Thăng Long, Đông Anh, Hà Nội, Việt Nam'}
                    </span>
                  </div>

                  <div className="pdf-mfg-field">
                    <Phone size={16} className="pdf-mfg-field-icon" />
                    <span className="pdf-mfg-field-lbl">Điện thoại:</span>
                    <span className="pdf-mfg-field-val">
                      {enterprise?.phone || '024 6688 1234'}
                    </span>
                  </div>

                  <div className="pdf-mfg-field">
                    <Mail size={16} className="pdf-mfg-field-icon" />
                    <span className="pdf-mfg-field-lbl">Email:</span>
                    <span className="pdf-mfg-field-val">
                      {enterprise?.email || 'contact@homeplus.vn'}
                    </span>
                  </div>

                  <div className="pdf-mfg-field">
                    <Globe size={16} className="pdf-mfg-field-icon" />
                    <span className="pdf-mfg-field-lbl">Website:</span>
                    <span className="pdf-mfg-field-val">
                      {enterprise?.website || 'www.homeplus.vn'}
                    </span>
                  </div>

                  <p className="pdf-mfg-paragraph">
                    {contentConfig.manufacturerNote || 'HOMEPLUS là thương hiệu uy tín chuyên cung cấp các sản phẩm gia dụng, thiết bị nhà bếp và thiết bị vệ sinh chất lượng cao, đáp ứng tiêu chuẩn quốc tế, đem lại tiện nghi và an toàn cho mọi gia đình.'}
                  </p>
                </div>
              </div>
            </div>

            {/* 6. Benefits Footer Section (5 Items Horizontal) */}
            <div className="pdf-section-container pdf-benefits-section-container">
              <h3 className="pdf-section-heading">LỢI ÍCH KHI XÁC THỰC SẢN PHẨM</h3>

              <div className="pdf-benefits-5cols">
                {benefitsList.map((item, idx) => (
                  <div key={idx} className="pdf-benefit-column">
                    <div className="pdf-benefit-circle-icon">
                      {item.icon}
                    </div>
                    <h4>{item.title}</h4>
                    <p>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Home Button matching canvas width */}
            <button className="pdf-canvas-home-btn" onClick={() => navigate('/home')}>
              <Home size={18} />
              Quay lại trang chủ
            </button>
          </div>
        </div>
      ) : (
        /* Default Layout */
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
      )}

      {/* Bottom button for default layout */}
      {!isWarrantyView && (
        <div className="product-info-bottom">
          <button className="product-info-home-btn" onClick={() => navigate('/home')}>
            <Home size={18} />
            Quay lại trang chủ
          </button>
        </div>
      )}

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
