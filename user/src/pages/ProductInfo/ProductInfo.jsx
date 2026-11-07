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
  BookOpen, AlertCircle, UserCheck, User, Store
} from 'lucide-react';
import { useDomain } from '../../contexts/DomainContext';
import userApi from '../../services/api';
import './ProductInfo.css';

// 1. Trust Badge cho Tem Đồ gia dụng (Trạng thái Đã kích hoạt)
const TrustShieldBadge = () => (
  <svg width="56" height="56" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 4L7 11V22C7 32.5 14.2 41.8 24 44C33.8 41.8 41 32.5 41 22V11L24 4Z" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
    <path d="M24 6.8L10 12.6V22C10 30.7 16 38.4 24 40.5C32 38.4 38 30.7 38 22V12.6L24 6.8Z" fill="#0A369D" />
    <path d="M19 22.5L22.5 26L29 17.5" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="7" y="32" width="34" height="10" rx="3" fill="#002244" stroke="#F59E0B" strokeWidth="1" />
    <text x="24" y="39.5" fill="#FBBF24" fontSize="7" fontWeight="900" textAnchor="middle" letterSpacing="0.8">TRUST</text>
  </svg>
);

// 1b. Trust Badge Cảnh Báo Chưa Kích Hoạt cho Tem Đồ gia dụng
const UnactivatedShieldBadge = () => (
  <svg width="56" height="56" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 4L7 11V22C7 32.5 14.2 41.8 24 44C33.8 41.8 41 32.5 41 22V11L24 4Z" fill="#DC2626" stroke="#991B1B" strokeWidth="1.5" />
    <path d="M24 6.8L10 12.6V22C10 30.7 16 38.4 24 40.5C32 38.4 38 30.7 38 22V12.6L24 6.8Z" fill="#7F1D1D" />
    <path d="M24 15V27M24 32H24.02" stroke="#FEF08A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="7" y="32" width="34" height="10" rx="3" fill="#450A0A" stroke="#EF4444" strokeWidth="1" />
    <text x="24" y="39.5" fill="#FEF08A" fontSize="6.2" fontWeight="900" textAnchor="middle" letterSpacing="0.6">CHƯA ACTIVE</text>
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

  const [scanData, setScanData] = useState(location.state?.scanData || defaultMockScanData);
  const serial = location.state?.serial || scanData?.label?.serialNumber;

  // Dynamic Automatic Theme Detection based on Batch Theme, Product, & Enterprise Info
  const getInitialTheme = () => {
    const normalizeTheme = (val) => {
      if (val === 'warranty' || val === 'warranty_solution') return 'appliance';
      if (val === 'mint_honey' || val === 'hoang_bach') return 'honey';
      return val;
    };
    const searchParams = new URLSearchParams(location.search);
    const paramTheme = normalizeTheme(searchParams.get('theme'));
    if (paramTheme) return paramTheme;

    // 1. Ưu tiên theme cài đặt riêng trên sản phẩm (Product-level theme)
    const prodTheme = normalizeTheme(scanData?.product?.theme);
    if (prodTheme && prodTheme !== 'auto' && prodTheme !== 'default') {
      return prodTheme;
    }

    // 2. Ưu tiên theme từ lô tem (Batch-level theme) hoặc từ API scan response
    const batchOrApiTheme = normalizeTheme(scanData?.label?.batchId?.theme || scanData?.theme || scanData?.template?.layout);
    if (batchOrApiTheme && batchOrApiTheme !== 'default' && batchOrApiTheme !== 'auto') {
      return batchOrApiTheme;
    }

    // 3. Ưu tiên theme mặc định từ cấu hình doanh nghiệp
    const enterpriseDefaultTheme = normalizeTheme(scanData?.enterprise?.displayConfig?.defaultTheme);
    if (enterpriseDefaultTheme && enterpriseDefaultTheme !== 'default') {
      return enterpriseDefaultTheme;
    }

    // Tự động nhận diện doanh nghiệp StayCool / Vyphyto
    const entName = (scanData?.enterprise?.name || '').toLowerCase();
    if (entName.includes('staycool') || entName.includes('vyphyto')) {
      return 'staycool';
    }

    // Comprehensive automatic detection based on scanned product & enterprise data
    const cat = (scanData?.product?.category || '').toLowerCase();
    const pName = (scanData?.product?.name || '').toLowerCase();
    const desc = (scanData?.product?.description || '').toLowerCase();

    const textToMatch = `${cat} ${pName} ${desc} ${entName}`;

    // 0A. Mật Ong Hoa Bạc Hà / Hoàng Bách / Cao Nguyên Đá Hà Giang (3 ngôn ngữ)
    const honeyKeywords = [
      'mật ong', 'hoa bạc hà', 'hoàng bách', 'cao nguyên đá', 'đồng văn', 'mèo vạc', 'lũng cú'
    ];
    if (honeyKeywords.some(kw => textToMatch.includes(kw))) {
      return 'honey';
    }

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
      'bánh', 'kẹo', 'sữa', 'trà', 'cà phê', 'yến sào',
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
  const [previewImage, setPreviewImage] = useState(null);
  const chatEndRef = useRef(null);

  // State kích hoạt trực tiếp riêng cho giao diện điện gia dụng - thiết bị
  const [applianceActiveCode, setApplianceActiveCode] = useState('');
  const [applianceCustomerName, setApplianceCustomerName] = useState('');
  const [applianceCustomerPhone, setApplianceCustomerPhone] = useState('');
  const [isActivatingAppliance, setIsActivatingAppliance] = useState(false);
  const [applianceActivationError, setApplianceActivationError] = useState('');
  const [applianceActivationSuccess, setApplianceActivationSuccess] = useState(false);

  // State cho Giao diện Mật Ong Hoa Bạc Hà - Hoàng Bách (3 ngôn ngữ + 6 tab + điểm phân phối chi tiết)
  const [honeyLang, setHoneyLang] = useState('vi');
  const [honeyTab, setHoneyTab] = useState('distribution');
  const [honeyRegion, setHoneyRegion] = useState('dong_van');
  const [selectedHoneyDist, setSelectedHoneyDist] = useState(null);
  const honeyContentBoxRef = useRef(null);

  // Computed values (không phải hooks, an toàn để đặt đây)
  const product = scanData?.product;
  const enterprise = scanData?.enterprise;
  const label = scanData?.label;
  const serialNumber = label?.serialNumber || serial || '';
  const scanCount = Number(label?.scanCount || 0);
  const relatedProducts = scanData?.relatedProducts || scanData?.enterpriseProducts || [];
  const currentProductId = product?._id || product?.id;
  const filteredRelated = relatedProducts.filter(p => (p._id || p.id) !== currentProductId);
  const showRelated = (scanData?.showRelated !== undefined)
    ? scanData.showRelated
    : (scanData?.template?.showRelatedProducts !== undefined
        ? scanData.template.showRelatedProducts
        : (enterprise?.displayConfig?.showRelatedProducts !== false));

  // Kiểm tra trạng thái kích hoạt riêng cho giao diện Điện gia dụng - Bảo hành:
  // Chỉ khi bên khách hàng đã nhập mã kích hoạt (ownerCode) hoặc đã import Mã nội bộ (internalCode) thì mới coi là đã kích hoạt
  const isApplianceActivated = Boolean(
    (label?.internalCode && String(label.internalCode).trim()) ||
    (label?.ownerCode && String(label.ownerCode).trim())
  );

  // Kiểm tra trạng thái kích hoạt cho Thực phẩm chức năng (Bước 6):
  // Active mã (qua Điểm bán quét hoặc nhập mã kích hoạt) mới xem được full thông tin & Giấy công bố;
  // nếu chưa active thì người dùng quét chỉ xem được thông tin sản phẩm, không xem được Giấy công bố.
  const isFoodTheme = activeTheme === 'functional_food' || activeTheme === 'food' || activeTheme === 'staycool' || activeTheme === 'vyphyto';
  const isFoodActivated = Boolean(
    (label?.ownerCode && String(label.ownerCode).trim()) ||
    label?.storeId ||
    label?.distributedAt ||
    label?.ownerInfo?.activatedAt
  );

  const handleApplianceActivate = async (e) => {
    e.preventDefault();
    const cleanCode = applianceActiveCode.trim();
    if (!cleanCode) {
      setApplianceActivationError('Vui lòng nhập mã kích hoạt trên tem.');
      return;
    }

    setIsActivatingAppliance(true);
    setApplianceActivationError('');

    try {
      const serialToActivate = label?.serialNumber || serial;
      const res = await userApi.activateLabel({
        serial: serialToActivate,
        activationCode: cleanCode,
        customerName: applianceCustomerName.trim(),
        customerPhone: applianceCustomerPhone.trim()
      });

      const nowIso = res.activatedAt || new Date().toISOString();
      setScanData(prev => ({
        ...prev,
        isActivated: true,
        label: {
          ...prev.label,
          ownerCode: res.ownerCode || cleanCode,
          ownerInfo: {
            ...(prev.label?.ownerInfo || {}),
            name: applianceCustomerName.trim() || 'Khách hàng cá nhân',
            phone: applianceCustomerPhone.trim() || null,
            activatedAt: nowIso
          },
          status: 'ACTIVE'
        }
      }));

      setApplianceActivationSuccess(true);
    } catch (err) {
      setApplianceActivationError(err.message || 'Mã kích hoạt không chính xác. Vui lòng kiểm tra lại!');
    } finally {
      setIsActivatingAppliance(false);
    }
  };


  // Tự động làm mới dữ liệu mới nhất từ server khi vào trang hoặc reload để luôn cập nhật ảnh/thông tin sản phẩm
  useEffect(() => {
    const serialToFetch = serial || scanData?.label?.serialNumber || scanData?.label?.qrCode;
    if (serialToFetch && serialToFetch !== 'VSM-88392100') {
      userApi.getPublicScan(serialToFetch, { noCount: '1' })
        .then(freshData => {
          if (freshData && freshData.product) {
            setScanData(freshData);
          }
        })
        .catch(() => {
          // Bỏ qua lỗi ngầm, vẫn giữ scanData hiện tại
        });
    }
  }, [serial]);

  useEffect(() => {
    setActiveTheme(getInitialTheme());
  }, [scanData]);

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


  // Bộ câu hỏi tự chọn gửi Chatbot (kết hợp cấu hình Sản phẩm + Doanh nghiệp + Câu hỏi gợi ý mặc định)
  const configuredQAs = [
    ...(product?.chatbotQA || []),
    ...(enterprise?.chatbotConfig?.qaList || [])
  ].filter(qa => qa && qa.question && qa.question.trim());

  const defaultPresetQAs = [
    {
      question: 'Cách sử dụng và công dụng của sản phẩm?',
      answer: product?.description
        ? `Thông tin & công dụng sản phẩm "${product?.name}": ${product.description}`
        : `Quý khách vui lòng sử dụng sản phẩm "${product?.name || 'chính hãng'}" theo đúng hướng dẫn in trên bao bì hoặc liên hệ Hotline ${enterprise?.phone || 'doanh nghiệp'} để được tư vấn chi tiết.`
    },
    {
      question: 'Làm sao để kiểm tra sản phẩm chính hãng?',
      answer: `Sản phẩm "${product?.name || ''}" được bảo vệ bằng tem QR chống giả thông minh. Mã Serial ${label?.serialNumber || serial || ''} đã được xác thực chính hãng bởi ${enterprise?.name || 'nhà phân phối'}.`
    },
    {
      question: 'Địa chỉ và Hotline liên hệ của đơn vị phân phối?',
      answer: `Đơn vị phân phối: ${enterprise?.name || 'Chính hãng'}. Địa chỉ: ${enterprise?.address || 'Việt Nam'}. Hotline hỗ trợ: ${enterprise?.phone || 'Đang cập nhật'}.`
    },
    {
      question: 'Hạn sử dụng và cách bảo quản sản phẩm?',
      answer: `Quý khách vui lòng bảo quản sản phẩm ở nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp. Hạn sử dụng tem xác thực: ${formatDate(label?.expiryDate || scanData?.label?.batchId?.expiryDate)}.`
    }
  ];

  const presetQuestions = configuredQAs.length > 0 ? configuredQAs : defaultPresetQAs;

  const handleSelectPresetQuestion = (qa) => {
    if (!qa || !qa.question) return;
    const newUserMsg = { sender: 'user', text: qa.question, time: new Date() };
    setChatMessages(prev => [...prev, newUserMsg]);
    setTimeout(() => {
      const reply = qa.answer || `Cảm ơn bạn đã quan tâm đến sản phẩm "${product?.name}". Vui lòng liên hệ Hotline ${enterprise?.phone || ''} để được tư vấn chi tiết hơn!`;
      setChatMessages(prev => [...prev, { sender: 'bot', text: reply, time: new Date() }]);
    }, 450);
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

      const allQAs = [...configuredQAs, ...defaultPresetQAs];

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
        {(product?.bannerImage || enterprise?.bannerImage || scanData?.template?.bannerImage) && (
          <div style={{ width: '100%', marginBottom: 12, borderRadius: 12, overflow: 'hidden', maxHeight: 180, border: '1px solid rgba(0, 137, 123, 0.2)' }}>
            <img src={product?.bannerImage || enterprise?.bannerImage || scanData?.template?.bannerImage} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        )}
        <div className="medical-trust-banner">
          <div className="medical-trust-logo-box">
            {enterprise?.logo || scanData?.template?.logo ? (
              <img src={enterprise?.logo || scanData?.template?.logo} alt="Logo" style={{ width: 46, height: 46, objectFit: 'contain', borderRadius: 8, background: '#fff', padding: 2 }} />
            ) : (
              <MedicalTrustBadge />
            )}
          </div>
          <div className="medical-trust-title-wrap">
            <h2 className="medical-trust-title">
              {product?.distributionBannerText || enterprise?.displayConfig?.distributionBannerText || 'BỘ Y TẾ XÁC THỰC : TEM DƯỢC PHẨM CHÍNH HÃNG'}
            </h2>
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
  // 2. TEM BẢO HÀNH ĐỒ GIA DỤNG (Appliance Theme) - Phân tách rõ Chưa kích hoạt / Đã kích hoạt
  // =========================================================================
  const renderApplianceView = () => {
    // -------------------------------------------------------------
    // TRƯỜNG HỢP 1: SẢN PHẨM CHƯA ĐƯỢC KÍCH HOẠT (Bên khách hàng chưa nhập mã kích hoạt)
    // Yêu cầu khách hàng: người dùng quét sẽ không hiện thông tin gì cả
    // -------------------------------------------------------------
    if (!isApplianceActivated) {
      return (
        <div className="appliance-canvas-outer">
          <div
            className="appliance-poster-card"
            style={{
              padding: '48px 20px',
              textAlign: 'center',
              minHeight: '60vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16
              }}
            >
              <ShieldAlert size={32} color="#dc2626" />
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b', margin: '0 0 8px' }}>
              Chưa có thông tin hiển thị
            </h2>
            <p style={{ fontSize: '0.92rem', color: '#64748b', maxWidth: 360, lineHeight: 1.5, margin: '0 0 24px' }}>
              Tem bảo hành này chưa được nhập mã kích hoạt trên hệ thống.
            </p>
            {(label?.serialNumber || serial) && (
              <button
                type="button"
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  color: '#334155',
                  cursor: 'pointer'
                }}
                onClick={() => navigate(`/trace/${encodeURIComponent(label?.qrCode || label?.serialNumber || serial)}`)}
              >
                ← Quay lại
              </button>
            )}
          </div>
        </div>
      );
    }

    // -------------------------------------------------------------
    // TRƯỜNG HỢP 2: SẢN PHẨM ĐÃ ĐƯỢC KÍCH HOẠT (Đã nhập mã kích hoạt / Mã nội bộ)
    // Với các doanh nghiệp dùng giao diện bảo hành tiêu chuẩn (VD: PUMPS GLOBAL - xacthuc.tubosglobal.com),
    // hiển thị đúng giao diện bảo hành tiêu chuẩn (renderDefaultView) theo ảnh yêu cầu của khách hàng.
    // -------------------------------------------------------------
    const isVinsumiBrand =
      (enterprise?.name || '').toLowerCase().includes('vinsumi') ||
      (product?.name || '').toLowerCase().includes('vinsumi');

    if (!isVinsumiBrand) {
      return renderDefaultView();
    }

    return (
      <div className="appliance-canvas-outer">
        <div className="appliance-poster-card">
          {/* 1. Header Trust Banner Chính Hãng */}
          <div className="appliance-trust-banner">
            <div className="appliance-trust-logo-box">
              {enterprise?.logo || scanData?.template?.logo ? (
                <img src={enterprise?.logo || scanData?.template?.logo} alt="Logo" style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 8, background: '#fff', padding: 2 }} />
              ) : (
                <TrustShieldBadge />
              )}
            </div>
            <div className="appliance-trust-title-wrap">
              <h2 className="appliance-trust-title">
                {product?.distributionBannerText || enterprise?.displayConfig?.distributionBannerText || 'TRUST : SẢN PHẨM CHÍNH HÃNG'}
              </h2>
              <p className="appliance-trust-subtitle">Sản phẩm đã được kích hoạt bảo hành điện tử chính hãng</p>
            </div>
            <div className="appliance-trust-watermark">
              <ShieldCheck size={72} color="rgba(0, 51, 102, 0.07)" />
            </div>
          </div>

          {/* 2. Thẻ Xác Thực Bảo Hành Điện Tử Đã Kích Hoạt Thành Công */}
          <div className="appliance-activated-card card animate-fade-in-up">
            <div className="appliance-activated-header">
              <div className="appliance-activated-badge">
                <CheckCircle2 size={20} color="#10b981" />
                <span>ĐÃ KÍCH HOẠT BẢO HÀNH CHÍNH HÃNG</span>
              </div>
            </div>
            <div className="appliance-activated-grid">
              <div className="appliance-activated-item highlight">
                <span className="appliance-activated-label">Mã sở hữu sản phẩm:</span>
                <strong className="appliance-activated-value serial-code">
                  {label?.internalCode || label?.ownerCode || label?.ownerInfo?.activatedSerial || label?.serialNumber}
                </strong>
              </div>
              <div className="appliance-activated-item highlight">
                <span className="appliance-activated-label">Mã chống giả:</span>
                <strong className="appliance-activated-value serial-code">
                  {label?.serialNumber || serial}
                </strong>
              </div>
              <div className="appliance-activated-item">
                <span className="appliance-activated-label">Ngày kích hoạt:</span>
                <strong className="appliance-activated-value">
                  {formatDate(label?.ownerInfo?.activatedAt || label?.updatedAt)}
                </strong>
              </div>
              {label?.ownerInfo?.name && (
                <div className="appliance-activated-item">
                  <span className="appliance-activated-label">Khách hàng / Đại lý sở hữu:</span>
                  <strong className="appliance-activated-value">
                    {label.ownerInfo.name} {label.ownerInfo.phone ? `(${label.ownerInfo.phone})` : ''}
                  </strong>
                </div>
              )}
            </div>
          </div>

          {/* 3. Hero Appliance Banner Showcase (Mở Khóa Toàn Bộ) */}
          <div className="appliance-hero-card">
            <div className="appliance-hero-image-wrap">
              <img 
                src={product?.bannerImage || enterprise?.bannerImage || scanData?.template?.bannerImage || product?.images?.[0] || "/pdf_assets/hero_banner_appliance.png"} 
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

          {/* 4. 8 Interactive Quick Info Grid Cards (Mở Khóa 100%) */}
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

          {/* 5. Related Products Section - dùng data thật từ API */}
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

          {/* 6. Appliance Warranty Information Card (Đầy Đủ 100%) */}
          <div className="appliance-warranty-box">
            <div className="appliance-warranty-header-bar">
              <ShieldCheck size={24} color="#003366" />
              <span>THÔNG TIN BẢO HÀNH CHÍNH HÃNG</span>
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
  };

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

    const storeDisplayName = label?.distributorName || label?.ownerInfo?.name || '';
    const storeDisplayAddress = label?.distributorAddress || label?.ownerInfo?.address || '';
    const storeDisplayPhone = label?.ownerInfo?.phone || '';
    const storeSoldTime = label?.distributedAt || label?.ownerInfo?.activatedAt || null;
    const congBoImagesList = (product?.congBoImages || []).filter(img => img && img.trim());

    return (
      <div className="exact-tpcn-container">
        {/* 1. Header trên cùng: Banner Tùy chỉnh (nếu có) + Logo khiên + Tiêu đề */}
        {(product?.bannerImage || enterprise?.bannerImage || scanData?.template?.bannerImage) && (
          <div style={{ width: '100%', marginBottom: 12, borderRadius: 12, overflow: 'hidden', maxHeight: 180, border: '1px solid rgba(22, 163, 74, 0.2)' }}>
            <img src={product?.bannerImage || enterprise?.bannerImage || scanData?.template?.bannerImage} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        )}
        <div className="exact-tpcn-header">
          <div className="exact-tpcn-shield-icon">
            {enterprise?.logo || scanData?.template?.logo ? (
              <img src={enterprise?.logo || scanData?.template?.logo} alt="Logo" style={{ width: 38, height: 38, objectFit: 'contain', borderRadius: 6, background: '#fff', padding: 2 }} />
            ) : (
              <ShieldCheck size={28} color="#16a34a" />
            )}
          </div>
          <div className="exact-tpcn-header-text">
            <h2>{product?.distributionBannerText || enterprise?.displayConfig?.distributionBannerText || 'SẢN PHẨM CHÍNH HÃNG'}</h2>
            <p>Nguồn gốc minh bạch – An tâm sử dụng</p>
          </div>
        </div>

        {/* 2. Banner trạng thái xác thực (Bước 6: Phân biệt rõ Đã active mã vs Chưa active mã) */}
        {isFoodActivated ? (
          <div className="exact-tpcn-verify-banner">
            <div className="exact-tpcn-banner-icon">
              <CheckCircle2 size={24} color="#16a34a" />
            </div>
            <div className="exact-tpcn-banner-text">
              <h3>Đã kích hoạt mã – Xem đầy đủ thông tin</h3>
              <p>Sản phẩm đã được kích hoạt hợp lệ, mở khóa Giấy công bố & thông tin Điểm bán</p>
            </div>
            <div className="exact-tpcn-leaf-bg">🌿</div>
          </div>
        ) : (
          <div
            className="exact-tpcn-verify-banner"
            style={{
              background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
              borderColor: '#f59e0b'
            }}
          >
            <div className="exact-tpcn-banner-icon" style={{ background: '#fef3c7' }}>
              <ShieldAlert size={24} color="#d97706" />
            </div>
            <div className="exact-tpcn-banner-text">
              <h3 style={{ color: '#92400e' }}>Tem chưa kích hoạt mã</h3>
              <p style={{ color: '#b45309' }}>
                Bạn hiện chỉ xem được Thông tin sản phẩm. Hãy kích hoạt mã để xem Giấy công bố & đầy đủ thông tin.
              </p>
            </div>
          </div>
        )}

        {/* 3. Card Sản phẩm chi tiết (Người dùng quét luôn xem được Thông tin sản phẩm) */}
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
            {isFoodActivated && (
              <div className="exact-tpcn-maker-row">
                <Building2 size={16} color="#16a34a" />
                <span>Nhà sản xuất: <strong>{makerName}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* 3B. BƯỚC 6: Nếu CHƯA kích hoạt mã -> Hiển thị khung nhập mã kích hoạt để mở khóa Giấy công bố & Full thông tin */}
        {!isFoodActivated && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              padding: '16px',
              margin: '0 0 14px',
              border: '1.5px solid #f59e0b',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <ShieldCheck size={20} color="#d97706" />
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#92400e' }}>
                KÍCH HOẠT MÃ ĐỂ XEM GIẤY CÔNG BỐ & ĐẦY ĐỦ THÔNG TIN
              </h4>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 12px', lineHeight: 1.45 }}>
              Hiện tại bạn chỉ xem được thông tin sản phẩm. Vui lòng nhập mã kích hoạt (Serial trên tem) để xem <strong>Giấy công bố sản phẩm</strong> và toàn bộ thông tin truy xuất.
            </p>
            <form onSubmit={handleApplianceActivate} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Nhập mã kích hoạt (Serial trên tem)..."
                  value={applianceActiveCode}
                  onChange={(e) => {
                    setApplianceActiveCode(e.target.value);
                    setApplianceActivationError('');
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={isActivatingAppliance}
                  style={{
                    background: 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 16px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {isActivatingAppliance ? 'Đang xử lý...' : 'Kích hoạt ngay'}
                </button>
              </div>
              {applianceActivationError && (
                <div style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 600 }}>
                  ⚠️ {applianceActivationError}
                </div>
              )}
            </form>
          </div>
        )}

        {/* 3C. BƯỚC 5 & 6: Nếu ĐÃ kích hoạt mã -> Hiển thị Điểm bán đã xuất bán Serial này + Giấy công bố */}
        {isFoodActivated && storeDisplayName && (
          <div
            style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              borderRadius: '14px',
              padding: '14px 16px',
              margin: '0 0 14px',
              border: '1.5px solid #86efac'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#166534', fontWeight: 800, fontSize: '0.92rem' }}>
              <Truck size={18} color="#16a34a" />
              <span>THÔNG TIN ĐIỂM BÁN / PHÂN PHỐI CHÍNH HÃNG</span>
            </div>
            <div style={{ fontSize: '0.86rem', color: '#1e293b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div><span>Điểm bán:</span> <strong style={{ color: '#15803d' }}>{storeDisplayName}</strong></div>
              {storeDisplayAddress && <div><span>Địa chỉ:</span> <span>{storeDisplayAddress}</span></div>}
              {storeDisplayPhone && <div><span>Điện thoại:</span> <strong>{storeDisplayPhone}</strong></div>}
              <div>
                <span>Mã Serial đã kích hoạt:</span>{' '}
                <strong style={{ fontFamily: 'monospace', color: '#059669' }}>
                  {label?.ownerCode || label?.serialNumber || serial}
                </strong>
              </div>
              {storeSoldTime && (
                <div><span>Thời gian xuất bán:</span> <span>{formatDate(storeSoldTime)}</span></div>
              )}
            </div>
          </div>
        )}

        {/* 4. Grid Chức Năng (Bước 6: Khi chưa active chỉ hiển thị Thông tin sản phẩm, ẩn Giấy công bố và các mục khác) */}
        <div className="exact-tpcn-grid-card">
          <div className="exact-tpcn-grid-8" style={!isFoodActivated ? { gridTemplateColumns: '1fr' } : {}}>
            <div
              className="exact-tpcn-grid-item"
              onClick={() => setActiveModal('product_detail')}
              style={{ border: '1.5px solid #86efac', background: '#f0fdf4', borderRadius: '12px', padding: !isFoodActivated ? '14px' : undefined }}
            >
              <div className="exact-tpcn-icon-circle"><FileText size={22} color="#16a34a" /></div>
              <span style={{ fontWeight: 700, color: '#15803d' }}>Thông tin sản phẩm</span>
            </div>
            {isFoodActivated && (
              <>
                <div
                  className="exact-tpcn-grid-item"
                  onClick={() => setActiveModal('cert')}
                >
                  <div className="exact-tpcn-icon-circle"><FileCheck size={22} color="#16a34a" /></div>
                  <span>Công Bố</span>
                </div>
                <div
                  className="exact-tpcn-grid-item"
                  onClick={() => setActiveModal('mfg')}
                >
                  <div className="exact-tpcn-icon-circle"><Building2 size={22} color="#16a34a" /></div>
                  <span>Nhà Sản Xuất</span>
                </div>
                <div
                  className="exact-tpcn-grid-item"
                  onClick={() => setActiveModal('distributor')}
                >
                  <div className="exact-tpcn-icon-circle"><Truck size={22} color="#16a34a" /></div>
                  <span>Nhà Phân Phối</span>
                </div>
                <div
                  className="exact-tpcn-grid-item"
                  onClick={() => setActiveModal('tem')}
                >
                  <div className="exact-tpcn-icon-circle"><ShieldCheck size={22} color="#16a34a" /></div>
                  <span>Thông tin tem</span>
                </div>
                {showRelated && (
                  <div
                    className="exact-tpcn-grid-item"
                    onClick={() => setActiveModal('all_products')}
                  >
                    <div className="exact-tpcn-icon-circle"><BookOpen size={22} color="#16a34a" /></div>
                    <span>Thư Viện SP</span>
                  </div>
                )}
                <div
                  className="exact-tpcn-grid-item"
                  onClick={() => setActiveModal('brand')}
                >
                  <div className="exact-tpcn-icon-circle"><Package size={22} color="#16a34a" /></div>
                  <span>Bao bì</span>
                </div>
                <div
                  className="exact-tpcn-grid-item"
                  onClick={() => setActiveModal('reward')}
                >
                  <div className="exact-tpcn-icon-circle"><Gift size={22} color="#16a34a" /></div>
                  <span>Tích điểm</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Hiển thị trực tiếp Hồ sơ & Giấy công bố sản phẩm khi ĐÃ ACTIVE MÃ (Bước 6) */}
        {isFoodActivated && (product?.congBoNumber || congBoImagesList.length > 0) && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              padding: '16px',
              margin: '0 0 14px',
              border: '1.5px solid #bbf7d0',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <FileCheck size={20} color="#15803d" />
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#15803d' }}>
                GIẤY CÔNG BỐ SẢN PHẨM
              </h3>
            </div>
            {product?.congBoNumber && (
              <div style={{ marginBottom: 10, padding: '8px 12px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #86efac', fontSize: '0.86rem' }}>
                Số công bố: <strong style={{ color: '#14532d' }}>{product.congBoNumber}</strong>
              </div>
            )}
            {congBoImagesList.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: congBoImagesList.length === 1 ? '1fr' : 'repeat(2, 1fr)', gap: 10 }}>
                {congBoImagesList.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setPreviewImage(img)}
                    style={{ cursor: 'pointer', borderRadius: 10, overflow: 'hidden', border: '1px solid #bbf7d0', background: '#f8fafc' }}
                  >
                    <img src={img} alt={`Giấy công bố ${idx + 1}`} style={{ width: '100%', height: 160, objectFit: 'contain', background: '#fff', display: 'block' }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5. Sản Phẩm Liên Quan - chỉ hiện khi đã active mã */}
        {isFoodActivated && showRelated && filteredRelated.length > 0 && (
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
    
    // Tìm ảnh hợp lệ đầu tiên từ images mảng hoặc trường image
    const firstValidImage = (product?.images && Array.isArray(product.images))
      ? product.images.find(img => img && typeof img === 'string' && img.trim() && !img.includes('hero_banner') && !img.includes('vinsumi'))
      : (product?.image || null);

    const heroImage = firstValidImage || (isMock ? '/images/ocop_hero_product.png' : '');

    // Ưu tiên đọc từ distributionBannerText (field "Tiêu Đề Banner" trong admin),
    // fallback về verificationText nếu có OCOP keyword, cuối cùng default 'CHỨNG NHẬN OCOP'
    const rawBanner = product?.distributionBannerText?.trim() || '';
    const rawVerif = product?.verificationText || '';
    const isOcopRelated = /ocop|sao|chứng nhận|tiêu chuẩn/i.test(rawVerif);
    const ocopCertText = (!isMock && rawBanner)
      ? rawBanner.toUpperCase()
      : (!isMock && isOcopRelated)
        ? rawVerif.toUpperCase()
        : 'CHỨNG NHẬN OCOP';

    return (
      <div className="exact-ocop-container">
        {/* Banner Tùy chỉnh (nếu có) */}
        {(product?.bannerImage || enterprise?.bannerImage || scanData?.template?.bannerImage) && (
          <div style={{ width: '100%', marginBottom: 12, borderRadius: 12, overflow: 'hidden', maxHeight: 180, border: '1px solid rgba(217, 119, 6, 0.2)' }}>
            <img src={product?.bannerImage || enterprise?.bannerImage || scanData?.template?.bannerImage} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        )}

        {/* 2. Hero Banner Hình ảnh sản phẩm thật */}
        {heroImage ? (
          <div className="exact-ocop-hero-card">
            <img
              src={heroImage}
              alt={productName}
              className="exact-ocop-hero-img"
              onError={(e) => {
                if (isMock) {
                  e.target.src = '/images/ocop_hero_product.png';
                } else {
                  e.target.style.display = 'none';
                }
              }}
            />
          </div>
        ) : null}

        {/* 3. Khối Thông Tin Sản Phẩm & Chứng Nhận OCOP 4 Sao */}
        <div className="exact-ocop-cert-card">
          <div className="exact-ocop-cert-left">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              {(enterprise?.logo || scanData?.template?.logo) && (
                <img src={enterprise?.logo || scanData?.template?.logo} alt="Logo" style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 8, background: '#fff', padding: 2, border: '1px solid rgba(0,0,0,0.08)' }} />
              )}
              <h1 className="exact-ocop-title" style={{ margin: 0 }}>{productName}</h1>
            </div>
            
            <div className="exact-ocop-cert-row">
              <div className="exact-ocop-check-icon">
                <CheckCircle2 size={18} color="#15803d" />
              </div>
              <div>
                <span className="exact-ocop-sublabel">Sản phẩm đã được cấp:</span>
                <div className="exact-ocop-red-cert">{ocopCertText}</div>
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
        </div>

        {/* 4. Khối Thông Tin Chủ Thể */}
        <div className="exact-ocop-owner-box" onClick={() => setActiveModal('mfg')}>
          <div className="exact-ocop-owner-left-icon">
            {enterprise?.logo ? (
              <img src={enterprise.logo} alt={ownerName} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
            ) : isMock ? (
              <img src="/images/ocop_owner_logo.png" alt={ownerName} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
            ) : (
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={24} color="#15803d" />
              </div>
            )}
          </div>
          <div className="exact-ocop-owner-details">
            <h3>THÔNG TIN CHỦ THỂ</h3>
            <p className="exact-ocop-owner-name-bold">{ownerName}</p>
            <p className="exact-ocop-owner-addr">Địa chỉ: {enterprise?.address?.trim() ? enterprise.address : (isMock ? 'Thôn Lục Sơn, Xã Minh Hòa, Huyện Lục Ngạn, Tỉnh Bắc Giang' : 'Đang cập nhật')}</p>
            <p className="exact-ocop-owner-phone">Điện thoại: {enterprise?.phone?.trim() ? enterprise.phone : (isMock ? '0987 854 321' : 'Đang cập nhật')}</p>
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

        {/* Khối Hồ sơ & Giấy công bố sản phẩm (Hiển thị trực tiếp khi có dữ liệu) */}
        {(product?.congBoNumber || (product?.congBoImages && product.congBoImages.filter(img => img && img.trim()).length > 0)) && (
          <div className="exact-ocop-cert-section" style={{
            background: '#ffffff',
            borderRadius: 14,
            padding: '16px',
            margin: '14px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            border: '1.5px solid #bbf7d0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#15803d',
                flexShrink: 0
              }}>
                <FileCheck size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#15803d' }}>
                  HỒ SƠ CÔNG BỐ SẢN PHẨM
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Giấy tiếp nhận bản công bố đã được cơ quan có thẩm quyền thẩm định
                </span>
              </div>
            </div>

            {/* Số công bố */}
            {product?.congBoNumber && (
              <div style={{
                marginBottom: 12,
                padding: '10px 14px',
                borderRadius: 10,
                background: '#f0fdf4',
                border: '1.5px solid #86efac',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>
                    Số tiếp nhận bản công bố
                  </div>
                  <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#14532d', marginTop: 2 }}>
                    {product.congBoNumber}
                  </div>
                </div>
                <Award size={24} color="#16a34a" />
              </div>
            )}

            {/* Danh sách ảnh công bố */}
            {product?.congBoImages && product.congBoImages.filter(img => img && img.trim()).length > 0 && (
              <div>
                <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: 10, lineHeight: 1.4 }}>
                  Văn bản công bố sản phẩm hợp quy (chạm vào ảnh để xem phóng to):
                </p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: product.congBoImages.filter(img => img && img.trim()).length === 1 ? '1fr' : 'repeat(2, 1fr)',
                  gap: 10
                }}>
                  {product.congBoImages.filter(img => img && img.trim()).map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setPreviewImage(img)}
                      style={{
                        cursor: 'pointer',
                        borderRadius: 10,
                        overflow: 'hidden',
                        border: '1.5px solid #bbf7d0',
                        background: '#f8fafc',
                        position: 'relative'
                      }}
                    >
                      <img
                        src={img}
                        alt={`Giấy công bố ${idx + 1}`}
                        style={{ width: '100%', height: 160, objectFit: 'contain', background: '#fff', display: 'block' }}
                      />
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '5px 8px',
                        background: 'rgba(21, 128, 61, 0.88)',
                        color: '#fff',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4
                      }}>
                        <Eye size={13} />
                        <span>Xem phóng to</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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

    const storeDisplayName = label?.ownerInfo?.name || label?.distributorName || '';
    const storeDisplayAddress = label?.ownerInfo?.address || label?.distributorAddress || '';
    const storeDisplayPhone = label?.ownerInfo?.phone || '';
    const storeSoldTime = label?.distributedAt || label?.ownerInfo?.activatedAt || null;
    const congBoImagesList = (product?.congBoImages || []).filter(img => img && img.trim());

    return (
      <div className="exact-vyphyto-container">
        {/* 1. Header trên cùng: Quốc kỳ Pháp + Logo Vyphyto + Slogan Tinh Hoa Pháp hoặc Banner Tùy chỉnh */}
        <div className="vyphyto-header-banner">
          <img
            src={product?.bannerImage || enterprise?.bannerImage || scanData?.template?.bannerImage || "/images/vyphyto_header_clean.png"}
            alt="VYPHYTO LABORATORIES - Tinh Hoa Pháp, Sức Khỏe Bạn"
            className="vyphyto-header-img"
          />
        </div>

        {/* 2. Banner Cam Capsule 1 */}
        <div className="vyphyto-pill-banner">
          <span>
            {isFoodActivated
              ? 'SẢN PHẨM CHÍNH HÃNG - ĐÃ KÍCH HOẠT MÃ'
              : 'THÔNG TIN SẢN PHẨM (CHƯA KÍCH HOẠT MÃ)'}
          </span>
        </div>

        {/* 3. Khối Ảnh & Thông tin Sản Phẩm (Người dùng quét luôn xem được Thông tin sản phẩm) */}
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
            {product?.description && (
              <p style={{ fontSize: '0.84rem', color: '#334155', marginTop: '8px', lineHeight: 1.5 }}>
                {product.description}
              </p>
            )}
          </div>
        </div>

        {/* 3B. BƯỚC 6: Nếu CHƯA kích hoạt mã -> Chỉ hiện nút Thông tin sản phẩm + khung nhập mã kích hoạt */}
        {!isFoodActivated && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              padding: '16px',
              margin: '0 14px 14px',
              border: '1.5px solid #f59e0b',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.12)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <ShieldAlert size={20} color="#d97706" />
              <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#92400e' }}>
                TEM CHƯA KÍCH HOẠT MÃ
              </h4>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#475569', margin: '0 0 12px', lineHeight: 1.45 }}>
              Hiện tại bạn chỉ xem được <strong>Thông tin sản phẩm</strong>. Vui lòng kích hoạt mã (hoặc để Điểm bán quét xuất hàng) để xem <strong>Giấy công bố sản phẩm</strong> và đầy đủ thông tin truy xuất.
            </p>
            <form onSubmit={handleApplianceActivate} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Nhập mã kích hoạt (Serial trên tem)..."
                  value={applianceActiveCode}
                  onChange={(e) => {
                    setApplianceActiveCode(e.target.value);
                    setApplianceActivationError('');
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={isActivatingAppliance}
                  style={{
                    background: '#ea580c',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 16px',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {isActivatingAppliance ? 'Đang xử lý...' : 'Kích hoạt'}
                </button>
              </div>
              {applianceActivationError && (
                <div style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 600 }}>
                  ⚠️ {applianceActivationError}
                </div>
              )}
            </form>
          </div>
        )}

        {/* 3C. BƯỚC 5 & 6: Nếu ĐÃ kích hoạt mã -> Hiển thị Điểm bán đã xuất bán Serial này + Thời gian */}
        {isFoodActivated && storeDisplayName && (
          <div
            style={{
              background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
              borderRadius: '14px',
              padding: '14px 16px',
              margin: '0 14px 14px',
              border: '1.5px solid #fdba74'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#c2410c', fontWeight: 800, fontSize: '0.9rem' }}>
              <Truck size={18} color="#ea580c" />
              <span>THÔNG TIN ĐIỂM BÁN / PHÂN PHỐI CHÍNH HÃNG</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#1e293b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div><span>Điểm bán:</span> <strong style={{ color: '#ea580c' }}>{storeDisplayName}</strong></div>
              {storeDisplayAddress && <div><span>Địa chỉ:</span> <span>{storeDisplayAddress}</span></div>}
              {storeDisplayPhone && <div><span>Điện thoại:</span> <strong>{storeDisplayPhone}</strong></div>}
              <div>
                <span>Mã Serial đã kích hoạt:</span>{' '}
                <strong style={{ fontFamily: 'monospace', color: '#059669' }}>
                  {label?.ownerCode || label?.serialNumber || serial}
                </strong>
              </div>
              {storeSoldTime && (
                <div><span>Thời gian xuất bán:</span> <span>{formatDate(storeSoldTime)}</span></div>
              )}
            </div>
          </div>
        )}

        {/* 4. 3 Nút Hành Động Trắng Bo Tròn: Chỉ hiện khi ĐÃ kích hoạt mã */}
        {isFoodActivated && (
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
        )}

        {/* 5. Banner Cam Capsule 2: Chỉ hiện khi ĐÃ kích hoạt mã */}
        {isFoodActivated && (
          <div className="vyphyto-pill-banner vyphyto-pill-banner-2">
            <span>{bannerText}</span>
          </div>
        )}

        {/* 6. Lưới Nút Chức Năng (Bước 6: Khi chưa active chỉ hiện Thông tin sản phẩm; khi đã active mới hiện Công Bố & đầy đủ thông tin) */}
        <div className="vyphyto-grid-4" style={!isFoodActivated ? { gridTemplateColumns: '1fr' } : {}}>
          <div className="vyphyto-grid-item" onClick={() => setActiveModal('product_detail')}>
            <div className="vyphyto-grid-icon">
              <img src="/images/vyphyto_icon_product.png" alt="Thông tin sản phẩm" />
            </div>
            <span className="vyphyto-grid-label">Thông tin sản phẩm</span>
          </div>

          {isFoodActivated && (
            <>
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

              {/* Nút NHẬN DIỆN THƯƠNG HIỆU */}
              <div className="vyphyto-grid-item vyphyto-grid-item--text" onClick={() => setActiveModal('brand')}>
                <span className="vyphyto-grid-label-bold">NHẬN DIỆN<br />THƯƠNG HIỆU</span>
              </div>

              {/* Nút CÔNG BỐ - chỉ hiển thị khi đã active mã */}
              <div className="vyphyto-grid-item vyphyto-grid-item--text" onClick={() => setActiveModal('cert')}>
                <span className="vyphyto-grid-label-bold">CÔNG BỐ</span>
              </div>
            </>
          )}
        </div>

        {/* 6B. Hiển thị trực tiếp Giấy công bố sản phẩm khi ĐÃ ACTIVE MÃ (Bước 6) */}
        {isFoodActivated && (product?.congBoNumber || congBoImagesList.length > 0) && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              padding: '16px',
              margin: '0 14px 14px',
              border: '1.5px solid #fdba74',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <FileCheck size={20} color="#ea580c" />
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#c2410c' }}>
                GIẤY CÔNG BỐ SẢN PHẨM
              </h3>
            </div>
            {product?.congBoNumber && (
              <div style={{ marginBottom: 10, padding: '8px 12px', borderRadius: 8, background: '#fff7ed', border: '1px solid #fed7aa', fontSize: '0.86rem' }}>
                Số công bố: <strong style={{ color: '#9a3412' }}>{product.congBoNumber}</strong>
              </div>
            )}
            {congBoImagesList.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: congBoImagesList.length === 1 ? '1fr' : 'repeat(2, 1fr)', gap: 10 }}>
                {congBoImagesList.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setPreviewImage(img)}
                    style={{ cursor: 'pointer', borderRadius: 10, overflow: 'hidden', border: '1px solid #fed7aa', background: '#f8fafc' }}
                  >
                    <img src={img} alt={`Giấy công bố ${idx + 1}`} style={{ width: '100%', height: 160, objectFit: 'contain', background: '#fff', display: 'block' }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 7. Sản Phẩm Cùng Doanh Nghiệp (chỉ hiện khi đã active mã) */}
        {isFoodActivated && showRelated && filteredRelated.length > 0 && (
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

        {/* 7B. Khối Tư vấn sản phẩm trực tuyến (Chatbot Bộ câu hỏi tự chọn) */}
        <div
          style={{
            margin: '12px 14px 4px',
            padding: '14px 16px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
            border: '1.5px solid #fdba74',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: '0 4px 12px rgba(234, 88, 12, 0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ea580c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MessageSquare size={20} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#c2410c' }}>TƯ VẤN SẢN PHẨM TRỰC TUYẾN</h4>
              <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#7c2d12' }}>Chọn câu hỏi để nhận tư vấn tự động từ Chatbot</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            style={{
              background: '#ea580c',
              color: '#fff',
              border: 'none',
              borderRadius: '20px',
              padding: '8px 16px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            💬 Tư vấn ngay
          </button>
        </div>

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
        {(product?.bannerImage || enterprise?.bannerImage || scanData?.template?.bannerImage) && (
          <div style={{ width: '100%', marginBottom: 12, borderRadius: 12, overflow: 'hidden', maxHeight: 180, border: '1px solid rgba(21, 128, 61, 0.2)' }}>
            <img src={product?.bannerImage || enterprise?.bannerImage || scanData?.template?.bannerImage} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        )}
        <div className="agri-trust-banner">
          {enterprise?.logo || scanData?.template?.logo ? (
            <img src={enterprise?.logo || scanData?.template?.logo} alt="Logo" style={{ width: 46, height: 46, objectFit: 'contain', borderRadius: 8, background: '#fff', padding: 2 }} />
          ) : (
            <AgriTrustBadge />
          )}
          <div className="agri-trust-title-wrap">
            <h2>{product?.distributionBannerText || enterprise?.displayConfig?.distributionBannerText || 'NÔNG SẢN VIỆT CHÍNH HÃNG - TRUY XUẤT NGUỒN GỐC'}</h2>
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
        {(product?.bannerImage || enterprise?.bannerImage || scanData?.template?.bannerImage) && (
          <div style={{ width: '100%', marginBottom: 12, borderRadius: 12, overflow: 'hidden', maxHeight: 180, border: '1px solid rgba(190, 24, 93, 0.2)' }}>
            <img src={product?.bannerImage || enterprise?.bannerImage || scanData?.template?.bannerImage} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        )}
        <div className="cosmetics-trust-banner">
          {enterprise?.logo || scanData?.template?.logo ? (
            <img src={enterprise?.logo || scanData?.template?.logo} alt="Logo" style={{ width: 46, height: 46, objectFit: 'contain', borderRadius: 8, background: '#fff', padding: 2 }} />
          ) : (
            <CosmeticsTrustBadge />
          )}
          <div className="cosmetics-trust-title-wrap">
            <h2>{product?.distributionBannerText || enterprise?.displayConfig?.distributionBannerText || 'MỸ PHẨM CHÍNH HÃNG - BẢO VỆ LÀN DA VIỆT'}</h2>
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
  // KHỐI CHUNG: THÔNG TIN KHÁCH HÀNG SỞ HỮU SẢN PHẨM (NPP nhập khi kích hoạt tem)
  // =========================================================================
  const ownerInfo = label?.ownerInfo;
  const activatedSerialCode = label?.internalCode || label?.ownerCode || ownerInfo?.ownerCode || ownerInfo?.activatedSerial || label?.serialNumber;
  const hasOwnerInfo = Boolean(
    (ownerInfo?.activatedAt && ownerInfo?.name) ||
    (label?.internalCode && String(label.internalCode).trim()) ||
    (label?.ownerCode && String(label.ownerCode).trim())
  );

  const renderOwnerInfoCard = () => {
    if (!hasOwnerInfo) return null;
    return (
      <div className="product-info-enterprise product-info-owner-card">
        <div className="product-info-enterprise-title owner-card-title">
          <UserCheck size={16} />
          <span>Thông tin KH sở hữu sản phẩm</span>
        </div>
        {ownerInfo?.name && (
          <div className="owner-card-list">
            <div className="owner-card-row">
              <User size={15} className="owner-card-icon" />
              <span className="owner-card-label">Tên NPP / cá nhân:</span>
              <strong className="owner-card-value">{ownerInfo.name}</strong>
            </div>
            {ownerInfo.address && (
              <div className="owner-card-row">
                <MapPin size={15} className="owner-card-icon" />
                <span className="owner-card-label">Địa chỉ:</span>
                <span className="owner-card-value">{ownerInfo.address}</span>
              </div>
            )}
            {ownerInfo.phone && (
              <div className="owner-card-row">
                <Phone size={15} className="owner-card-icon" />
                <span className="owner-card-label">Số ĐT liên hệ:</span>
                <span className="owner-card-value">{ownerInfo.phone}</span>
              </div>
            )}
          </div>
        )}
        <div className="owner-card-serial">
          <ShieldCheck size={18} />
          <span>Serial đã được kích hoạt:</span>
          <strong>{activatedSerialCode}</strong>
        </div>
      </div>
    );
  };

  // =========================================================================
  // 6. TEM XÁC THỰC TIÊU CHUẨN (Default Layout)
  // =========================================================================
  const renderDefaultView = () => {
    // 1. Dữ liệu Nhà sản xuất (NSX)
    const mfg = product?.manufacturerId || null;
    const mfgName = mfg?.name || product?.producerInfo || enterprise?.name;
    const mfgAddress = mfg?.address || enterprise?.address;
    const mfgPhone = mfg?.phone || enterprise?.phone;
    const mfgEmail = mfg?.email || enterprise?.email;

    // 2. Dữ liệu Nhà phân phối (NPP) & Mã sở hữu (Cột 2: Mã nội bộ) + Mã chống giả (Cột 1: Serial hệ thống)
    const distributorName = label?.distributorName || product?.distributors?.[0]?.name || product?.distributorInfo;
    const distributorAddress = label?.distributorAddress || product?.distributors?.[0]?.address || '';
    const ownerCode = label?.internalCode || label?.ownerCode;
    const antiCounterfeitCode = label?.serialNumber || serial;

    // 3. Dữ liệu Giấy tờ công bố & Chứng nhận
    const congBoImagesList = (product?.congBoImages || []).filter(img => img && img.trim());

    // Các chứng chỉ đạt chuẩn (nếu có)
    const certList = [];
    if (product?.certifications) {
      if (product.certifications.iso?.checked) certList.push({ name: 'ISO', no: product.certifications.iso.certNo, color: '#0284c7' });
      if (product.certifications.vetinhATTP?.checked) certList.push({ name: 'ATTP', no: product.certifications.vetinhATTP.certNo, color: '#16a34a' });
      if (product.certifications.gmp?.checked) certList.push({ name: 'GMP', no: product.certifications.gmp.certNo, color: '#0d9488' });
      if (product.certifications.cgmp?.checked) certList.push({ name: 'c-GMP', no: product.certifications.cgmp.certNo, color: '#8b5cf6' });
      if (product.certifications.vietgap?.checked) certList.push({ name: 'VietGAP', no: product.certifications.vietgap.certNo, color: '#15803d' });
      if (product.certifications.organic?.checked) certList.push({ name: 'Organic', no: product.certifications.organic.certNo, color: '#65a30d' });
    }

    return (
      <div className="product-info-body">
        {/* Banner Tùy chỉnh (nếu có) */}
        {(product?.bannerImage || enterprise?.bannerImage || scanData?.template?.bannerImage) && (
          <div style={{ width: '100%', marginBottom: 14, borderRadius: 12, overflow: 'hidden', maxHeight: 200, border: '1px solid rgba(0,0,0,0.08)' }}>
            <img src={product?.bannerImage || enterprise?.bannerImage || scanData?.template?.bannerImage} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        )}

        {/* Banner xác thực chính hãng */}
        <div className={`product-info-verify ${label?.scanCount > 5 ? 'product-info-verify--warning' : ''}`}>
          <div className="product-info-verify-icon">
            {enterprise?.logo || scanData?.template?.logo ? (
              <img src={enterprise?.logo || scanData?.template?.logo} alt="Logo" style={{ width: 34, height: 34, objectFit: 'contain', borderRadius: 6, background: '#fff', padding: 2 }} />
            ) : label?.scanCount > 5 ? (
              <AlertTriangle size={22} />
            ) : (
              <ShieldCheck size={22} />
            )}
          </div>
          <div className="product-info-verify-text">
            {label?.scanCount > 5 ? (
              <>
                <h3>Cảnh báo lượt quét ({label.scanCount})</h3>
                <p>Sản phẩm đã được quét nhiều lần. Vui lòng kiểm tra kỹ tem niêm phong và nguồn gốc.</p>
              </>
            ) : (
              <>
                <h3>{product?.distributionBannerText || enterprise?.displayConfig?.distributionBannerText || 'Sản phẩm chính hãng'}</h3>
                <p>Thông tin truy xuất nguồn gốc đã được xác thực</p>
              </>
            )}
          </div>
        </div>

        {/* Thẻ sản phẩm */}
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
                <span className="product-info-row-label">Mã kích hoạt</span>
                {/* Lấy theo ô "Mã sở hữu sản phẩm" NPP/KH nhập khi kích hoạt tem */}
                <span className="product-info-row-value">{ownerCode || 'Chưa kích hoạt'}</span>
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

        {/* Lượt quét */}
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

        {/* KHỐI 1: THÔNG TIN NHÀ SẢN XUẤT (NSX) */}
        <div className="product-info-enterprise product-info-nsx-card">
          <div className="product-info-enterprise-title" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#166534' }}>
            <Building2 size={16} color="#166534" />
            <span>Thông tin Nhà sản xuất (NSX)</span>
          </div>
          <div className="product-info-enterprise-name" style={{ fontSize: '1.05rem', color: '#0f172a' }}>
            {mfgName}
          </div>
          {product?.manufacturerInfo && (
            <div style={{ whiteSpace: 'pre-line', fontSize: '0.86rem', color: '#475569', margin: '6px 0 10px', padding: '8px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', lineHeight: '1.5' }}>
              {product.manufacturerInfo}
            </div>
          )}
          {mfgAddress && (
            <div className="product-info-enterprise-row">
              <MapPin size={15} color="#166534" style={{ flexShrink: 0 }} />
              <span>{mfgAddress}</span>
            </div>
          )}
          {mfgPhone && (
            <div className="product-info-enterprise-row">
              <Phone size={15} color="#166534" style={{ flexShrink: 0 }} />
              <a href={`tel:${mfgPhone}`} style={{ color: '#166534', fontWeight: 600 }}>{mfgPhone}</a>
            </div>
          )}
          {mfgEmail && (
            <div className="product-info-enterprise-row">
              <Mail size={15} color="#166534" style={{ flexShrink: 0 }} />
              <span>{mfgEmail}</span>
            </div>
          )}
          {enterprise?.name && enterprise.name !== mfgName && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #e2e8f0', fontSize: '0.8rem', color: '#64748b' }}>
              Chủ sở hữu nhãn hiệu: <strong style={{ color: '#334155' }}>{enterprise.name}</strong>
            </div>
          )}
        </div>

        {/* KHỐI 2: THÔNG TIN NHÀ PHÂN PHỐI (NHÀ PP) & MÃ SỞ HỮU */}
        <div className="product-info-enterprise product-info-npp-card">
          <div className="product-info-enterprise-title" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1e40af' }}>
            <Truck size={16} color="#1e40af" />
            <span>Thông tin Nhà phân phối (Nhà PP)</span>
          </div>

          {distributorName ? (
            <>
              <div className="product-info-enterprise-name" style={{ fontSize: '1.02rem', color: '#1e3a8a' }}>
                {distributorName}
              </div>
              {distributorAddress && (
                <div className="product-info-enterprise-row">
                  <MapPin size={15} color="#1e40af" style={{ flexShrink: 0 }} />
                  <span>{distributorAddress}</span>
                </div>
              )}
            </>
          ) : product?.distributors && product.distributors.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {product.distributors.map((dist, idx) => (
                <div key={idx} style={{ padding: '8px 10px', background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e40af' }}>{dist.name}</div>
                  {dist.address && <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: 2 }}>{dist.address}</div>}
                  {dist.phone && <div style={{ fontSize: '0.8rem', color: '#1e40af', marginTop: 2 }}>Hotline: {dist.phone}</div>}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '0.86rem', color: '#475569', padding: '6px 0', lineHeight: 1.5 }}>
              Sản phẩm chính hãng được phân phối và lưu hành thông qua hệ thống đại lý trên toàn quốc.
            </div>
          )}

          {/* Trường MÃ SỞ HỮU SẢN PHẨM (Cột 2: Mã nội bộ) & MÃ CHỐNG GIẢ (Cột 1: Serial lô tem) */}
          {ownerCode ? (
            <div style={{
              marginTop: 12,
              padding: '12px 14px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
              border: '1.5px solid #6ee7b7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <ShieldCheck size={22} color="#059669" style={{ marginTop: 2, flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Mã sở hữu sản phẩm
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#065f46', marginTop: 1 }}>
                      {ownerCode}
                    </div>
                  </div>
                  <div style={{ paddingTop: 6, borderTop: '1px dashed rgba(5, 150, 105, 0.28)' }}>
                    <div style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Mã chống giả
                    </div>
                    <div style={{ fontSize: '0.96rem', fontWeight: 900, color: '#065f46', marginTop: 1 }}>
                      {antiCounterfeitCode}
                    </div>
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, background: '#059669', color: '#fff', padding: '4px 10px', borderRadius: 12, flexShrink: 0 }}>
                ĐÃ XÁC THỰC
              </span>
            </div>
          ) : (
            <div style={{ marginTop: 8, fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
              Mã sở hữu sẽ được cập nhật khi đại lý xuất bán cho khách hàng.
            </div>
          )}
        </div>

        {/* KHỐI 3: PHẦN GIẤY TỜ / HỒ SƠ CÔNG BỐ SẢN PHẨM */}
        <div className="product-info-enterprise product-info-cert-card">
          <div className="product-info-enterprise-title" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#b45309' }}>
            <FileText size={16} color="#b45309" />
            <span>Phần giấy tờ & Bản công bố sản phẩm</span>
          </div>

          {/* Số công bố */}
          {product?.congBoNumber && (
            <div style={{
              marginBottom: 12,
              padding: '9px 12px',
              borderRadius: 8,
              background: '#fffbeb',
              border: '1.5px solid #fde68a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 700, textTransform: 'uppercase' }}>
                  Số tiếp nhận bản công bố
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#92400e', marginTop: 2 }}>
                  {product.congBoNumber}
                </div>
              </div>
              <Award size={22} color="#f59e0b" />
            </div>
          )}

          {/* Huy hiệu các chứng chỉ chất lượng */}
          {certList.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {certList.map((c, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: '#f8fafc',
                  border: `1px solid ${c.color}`,
                  color: c.color,
                  fontSize: '0.78rem',
                  fontWeight: 700
                }}>
                  <CheckCircle2 size={13} color={c.color} />
                  <span>Đạt chuẩn {c.name}{c.no ? ` (${c.no})` : ''}</span>
                </div>
              ))}
            </div>
          )}

          {/* Ảnh giấy công bố */}
          {congBoImagesList.length > 0 ? (
            <div>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: 10 }}>
                Giấy tiếp nhận bản công bố đã được thẩm định bởi cơ quan có thẩm quyền (nhấn để phóng to):
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: congBoImagesList.length === 1 ? '1fr' : 'repeat(2, 1fr)', gap: 10 }}>
                {congBoImagesList.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setPreviewImage(img)}
                    style={{
                      cursor: 'pointer',
                      borderRadius: 10,
                      overflow: 'hidden',
                      border: '1.5px solid #e2e8f0',
                      background: '#f8fafc',
                      position: 'relative'
                    }}
                  >
                    <img
                      src={img}
                      alt={`Giấy công bố ${idx + 1}`}
                      style={{ width: '100%', height: 160, objectFit: 'contain', background: '#fff', display: 'block' }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '4px 6px',
                      background: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      fontSize: '0.72rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4
                    }}>
                      <Eye size={12} />
                      <span>Xem phóng to</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : !product?.congBoNumber && certList.length === 0 ? (
            <div style={{
              padding: '12px 14px',
              borderRadius: 8,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              fontSize: '0.84rem',
              color: '#64748b',
              lineHeight: 1.5
            }}>
              Hồ sơ công bố sản phẩm hợp quy và chứng nhận kiểm định chất lượng đã được lưu trữ hợp lệ trên hệ thống cơ sở dữ liệu quốc gia.
            </div>
          ) : null}
        </div>

        {/* KHỐI 4: THÔNG TIN KH SỞ HỮU SẢN PHẨM */}
        {renderOwnerInfoCard()}
      </div>
    );
  };

  // ==================== GIAO DIỆN 9: MẬT ONG HOA BẠC HÀ - HOÀNG BÁCH (3 NGÔN NGỮ & 6 TAB) ====================
  const renderHoneyView = () => {
    const i18n = {
      vi: {
        headerTitle: 'TEM TRUY XUẤT NGUỒN GỐC',
        lblProduct: 'SẢN PHẨM:',
        lblProducer: 'ĐƠN VỊ SẢN XUẤT:',
        lblAddress: 'ĐỊA CHỈ:',
        lblContact: 'LIÊN HỆ:',
        defaultProductName: product?.name || 'Mật Ong Hoa Bạc Hà',
        defaultProducerName: enterprise?.name || product?.manufacturer || 'Hộ Kinh Doanh Hoàng Bách',
        defaultAddress: enterprise?.address || product?.mfgAddress || 'Thôn Xín Chải, Xã Sơn Vĩ, Tỉnh Tuyên Quang',
        defaultContact: enterprise?.phone || product?.hotline || '0866.603.589 - 0812.838.589',
        serialBadge: 'Mã xác thực QR:',
        scanCountBadge: 'Lượt tra cứu:',
        verifiedLabel: 'Chính hãng Hoàng Bách',
        tabs: [
          { id: 'intro', label: 'Giới thiệu' },
          { id: 'featured', label: 'Đặc sắc' },
          { id: 'usage', label: 'Cách dùng' },
          { id: 'distribution', label: 'Các điểm phân phối' },
          { id: 'soil', label: 'Thổ nhưỡng' },
          { id: 'bee_breed', label: 'Giống ong' },
        ],
        regions: [
          { id: 'dong_van', label: 'Đồng Văn' },
          { id: 'meo_vac', label: 'Mèo Vạc' },
          { id: 'yen_minh', label: 'Yên Minh' },
        ],
        distLabels: {
          unitName: 'Tên đơn vị sản xuất:',
          address: 'Địa chỉ:',
          contact: 'Liên hệ:',
          intro: 'Giới thiệu:',
          btnMore: 'GIỚI THIỆU',
          btnBack: 'QUAY LẠI DANH SÁCH ĐIỂM PHÂN PHỐI (BACK)',
          btnBackShort: 'QUAY LẠI (BACK)',
          detailTitle: 'THÔNG TIN CHI TIẾT ĐIỂM SẢN XUẤT & PHÂN PHỐI',
          scaleLabel: 'Quy mô & Sản lượng:',
          areaLabel: 'Vùng nguyên liệu:',
          certLabel: 'Tiêu chuẩn chất lượng:',
          callNow: 'Gọi điện liên hệ ngay',
        },
        articles: {
          intro: {
            title: 'GIỚI THIỆU MẬT ONG HOA BẠC HÀ HOÀNG BÁCH',
            subtitle: 'Tinh hoa mật quý từ Công viên Địa chất Toàn cầu Cao nguyên đá Đồng Văn - Hà Giang',
            lead: (product?.description && product.description.length > 40)
              ? product.description
              : 'Mật Ong Hoa Bạc Hà Hoàng Bách là sản phẩm đặc sản trứ danh được khai thác hoàn toàn tự nhiên từ những cánh rừng hoa bạc hà tím biếc nở rộ trên độ cao 1.000m – 1.600m tại Cao nguyên đá Hà Giang vào dịp cuối thu đầu đông (tháng 10 đến tháng 1 năm sau).',
            sections: [
              {
                heading: '1. Nguồn gốc thiên nhiên thuần khiết 100%',
                body: 'Cây bạc hà dại trên Cao nguyên đá là loài thảo dược mọc tự nhiên trên các triền núi đá tai mèo hiểm trở. Mỗi năm hoa chỉ nở duy nhất một vụ kéo dài từ 2,5 đến 3 tháng. Đàn ong nội bản địa hút mật trực tiếp từ nhụy hoa bạc hà tạo nên dòng mật có màu vàng chanh ánh xanh lục đặc trưng, sánh đặc tự nhiên và hương thơm thanh mát dịu nhẹ không lẫn với bất kỳ loại mật nào khác.'
              },
              {
                heading: '2. Quy trình khai thác & kiểm định nghiêm ngặt',
                body: 'Hộ Kinh Doanh Hoàng Bách liên kết trực tiếp với các hợp tác xã và hộ nuôi ong lâu năm tại Đồng Văn, Mèo Vạc, Lũng Cú, Yên Minh. Mật được quay khai thác khi cầu mật đã vít nắp chín tự nhiên tối thiểu 90%, lọc tĩnh loại bỏ sáp vụn hoàn toàn thủ công, không qua xử lý nhiệt công nghiệp nhằm giữ trọn vẹn hệ enzyme, vitamin và khoáng chất quý giá.'
              },
              {
                heading: '3. Cam kết chất lượng từ Hoàng Bách',
                bullets: [
                  '100% mật ong hoa bạc hà nguyên chất khai thác đúng vụ tại Cao nguyên đá.',
                  'Không pha trộn đường, không chất bảo quản, không hương liệu hay phẩm màu nhân tạo.',
                  'Mỗi sản phẩm đều gắn tem QR truy xuất nguồn gốc minh bạch từng lô thu hoạch.',
                  'Đạt tiêu chuẩn An toàn vệ sinh thực phẩm và chứng nhận đặc sản vùng cao.'
                ]
              }
            ]
          },
          featured: {
            title: 'ĐẶC SẮC CỦA MẬT ONG HOA BẠC HÀ',
            subtitle: 'Những giá trị độc bản tạo nên danh tiếng "Vàng lỏng" vùng Cao nguyên đá',
            lead: 'Mật ong hoa bạc hà sở hữu sắc - hương - vị và hàm lượng dinh dưỡng vượt trội nhờ sự giao thoa kỳ diệu giữa cây dược liệu bạc hà núi đá và giống ong nội bản địa.',
            sections: [
              {
                heading: '1. Màu sắc & Hương vị độc nhất vô nhị',
                body: 'Mật có màu vàng chanh óng ả pha chút ánh xanh oliu dịu mắt, độ kết dính cao, khi rót tạo dòng chảy mềm mại không đứt đoạn. Vị ngọt thanh tao, mát dịu nơi đầu lưỡi và đọng lại hậu vị the mát thoảng hương hoa bạc hà rừng tự nhiên, hoàn toàn không ngọt gắt như các loại mật thông thường.'
              },
              {
                heading: '2. Giá trị dược tính & Chăm sóc sức khỏe',
                bullets: [
                  'Hỗ trợ làm dịu cổ họng, giảm ho khan, ho có đờm, viêm họng và bảo vệ đường hô hấp hiệu quả khi thời tiết giao mùa.',
                  'Bồi bổ cơ thể, tăng cường sức đề kháng tự nhiên nhờ hàm lượng cao các axit amin, enzyme tự nhiên (Diastase, Invertase), Vitamin B1, B2, B6, C và khoáng chất (Canxi, Sắt, Kẽm, Magie).',
                  'Hỗ trợ hệ tiêu hóa khỏe mạnh, làm dịu niêm mạc dạ dày và cải thiện giấc ngủ sâu.',
                  'Làm đẹp da từ bên trong nhờ hoạt chất chống oxy hóa tự nhiên dồi dào.'
                ]
              },
              {
                heading: '3. Dấu hiệu nhận biết mật ong hoa bạc hà chuẩn Hoàng Bách',
                body: 'Mật ong hoa bạc hà chuẩn có hàm lượng thủy phần thấp (< 20%), sánh đặc tự nhiên, để lâu năm vẫn giữ hương thơm dịu và màu sắc tươi sáng, không bị chua hay lên ga khi bảo quản đúng cách.'
              }
            ]
          },
          usage: {
            title: 'HƯỚNG DẪN SỬ DỤNG & BẢO QUẢN ĐÚNG CÁCH',
            subtitle: 'Phát huy tối đa dưỡng chất quý giá từ Mật Ong Hoa Bạc Hà',
            lead: 'Sử dụng mật ong hoa bạc hà đúng thời điểm và đúng nhiệt độ giúp cơ thể hấp thu trọn vẹn các enzyme sinh học và hoạt chất thảo dược tự nhiên.',
            sections: [
              {
                heading: '1. Cách dùng hàng ngày tốt nhất cho sức khỏe',
                bullets: [
                  'Pha uống buổi sáng: Pha 1–2 thìa cà phê (10–15ml) mật ong hoa bạc hà với 150–200ml nước ấm (nhiệt độ lý tưởng 40°C – 50°C, không dùng nước sôi trên 60°C để tránh làm mất enzyme quý). Uống trước bữa sáng 20–30 phút giúp thanh lọc cơ thể và bảo vệ dạ dày.',
                  'Giảm ho, dịu họng: Ngậm trực tiếp 1 thìa nhỏ mật ong nguyên chất hoặc chưng cách thủy cùng quất (tắc), chanh đào, gừng tươi, lá hẹ dùng 2–3 lần/ngày.',
                  'Kết hợp thảo dược & ẩm thực: Pha cùng trà hoa cúc, trà thảo mộc, saffron (nhụy hoa nghệ tây), nước cam chanh hoặc dùng kèm sữa chua, bánh mì, salad trái cây.'
                ]
              },
              {
                heading: '2. Đối tượng sử dụng & Lưu ý quan trọng',
                bullets: [
                  'Phù hợp cho người lớn, người cao tuổi, người suy nhược cơ thể, người làm việc căng thẳng và trẻ em trên 1 tuổi.',
                  'Lưu ý: Không dùng mật ong cho trẻ sơ sinh dưới 12 tháng tuổi.',
                  'Nên dùng thìa gỗ, sứ hoặc nhựa sạch để lấy mật; hạn chế ngâm thìa kim loại lâu trong hũ mật.'
                ]
              },
              {
                heading: '3. Hướng dẫn bảo quản',
                body: 'Đậy kín nắp sau khi sử dụng, đặt ở nơi khô ráo, thoáng mát (nhiệt độ phòng 20°C – 28°C), tránh ánh nắng mặt trời chiếu trực tiếp. Không cần bảo quản trong ngăn mát tủ lạnh vì nhiệt độ thấp dễ làm mật ong tự nhiên kết tinh đường glucose.'
              }
            ]
          },
          soil: {
            title: 'THỔ NHƯỠNG & KHÍ HẬU VÙNG CAO NGUYÊN ĐÁ',
            subtitle: 'Hệ sinh thái núi đá vôi hàng trăm triệu năm tuổi tạo nên loài hoa bạc hà độc bản',
            lead: 'Cao nguyên đá Đồng Văn (bao gồm 4 huyện Quản Bạ, Yên Minh, Đồng Văn, Mèo Vạc) được UNESCO công nhận là Công viên Địa chất Toàn cầu với địa hình hơn 80% là núi đá vôi tai mèo dựng đứng ở độ cao 1.000m – 1.600m so với mực nước biển.',
            sections: [
              {
                heading: '1. Địa chất đá vôi giàu khoáng chất tự nhiên',
                body: 'Trải qua hàng trăm triệu năm kiến tạo địa chất, lớp đất mùn tích tụ trong các hốc đá tai mèo cực kỳ giàu khoáng chất vi lượng (Canxi, Magie, Kali, Silic). Cây bạc hà dại (Elsholtzia ciliata / Mentha arvensis bản địa) bám rễ sâu vào các khe đá khô cằn để hút dưỡng chất và sương núi, giúp tinh dầu trong cánh hoa và mật hoa đậm đặc gấp nhiều lần vùng đồng bằng.'
              },
              {
                heading: '2. Khí hậu khắc nghiệt hun đúc tinh hoa',
                body: 'Vào mùa hoa bạc hà nở (từ tháng 10 đến tháng 12 âm lịch), vùng cao nguyên có biên độ nhiệt ngày và đêm rất lớn: ban ngày nắng hanh vàng rực rỡ, ban đêm sương mù bao phủ và nhiệt độ hạ thấp 8°C – 15°C. Chính sự khắc nghiệt này kích thích cây bạc hà tiết ra lượng mật hoa cô đặc nhất, giàu đường tự nhiên và tinh dầu thơm mát để thu hút đàn ong.'
              },
              {
                heading: '3. Môi trường sinh thái nguyên sơ',
                bullets: [
                  'Hoàn toàn tách biệt khỏi khu công nghiệp, khói bụi đô thị và hóa chất nông nghiệp.',
                  'Cây bạc hà mọc hoang dã tự nhiên trên sườn núi đá, không sử dụng phân bón hóa học hay thuốc bảo vệ thực vật.',
                  'Nguồn nước sương núi trong lành tạo nên độ tinh khiết tuyệt đối cho từng giọt mật.'
                ]
              }
            ]
          },
          bee_breed: {
            title: 'GIỐNG ONG NỘI BẢN ĐỊA CAO NGUYÊN ĐÁ',
            subtitle: 'Những "nghệ nhân" cần mẫn vượt gió sương núi đá thu lượm mật quý',
            lead: 'Mật Ong Hoa Bạc Hà Hoàng Bách được tạo nên bởi giống Ong Nội địa bản xứ (Apis cerana) đã thích nghi hàng ngàn năm với địa hình hiểm trở và khí hậu lạnh giá của vùng núi cao cực Bắc.',
            sections: [
              {
                heading: '1. Đặc điểm sinh học vượt trội của giống Ong Nội vùng cao',
                body: 'Khác với các giống ong ngoại nhập khẩu, ong nội bản địa Cao nguyên đá có kích thước cơ thể nhỏ gọn, đôi cánh khỏe, cực kỳ nhanh nhẹn và có khả năng chịu rét, chịu sương mù xuất sắc. Nhờ vòi hút mật mảnh và sự linh hoạt, ong nội dễ dàng len lỏi sâu vào từng đài hoa bạc hà nhỏ li ti mọc sát vách đá tai mèo để lấy trọn giọt mật tinh túy nhất.'
              },
              {
                heading: '2. Quá trình luyện mật kỳ công trong tổ',
                body: 'Mỗi ngày, hàng vạn ong thợ bay hàng cây số qua các triền đá để thu gom mật hoa. Khi mang về tổ, đàn ong truyền mật qua nhau, tiết thêm hệ enzyme tự nhiên từ tuyến hầu và quạt cánh liên tục suốt ngày đêm để làm bay hơi nước tự nhiên. Chỉ khi hàm lượng nước giảm xuống dưới 19–20%, ong mới dùng sáp trắng vít kín nắp lỗ tổ (mật chín tự nhiên).'
              },
              {
                heading: '3. Phương thức nuôi ong truyền thống bền vững',
                bullets: [
                  'Thùng ong được làm từ gỗ tự nhiên khô thoáng, đặt dọc theo các thung lũng và sườn núi đá nơi có thảm hoa bạc hà dày đặc nhất.',
                  'Tuyệt đối không cho ong ăn đường trong suốt vụ thu hoạch mật hoa bạc hà.',
                  'Không sử dụng kháng sinh trong mật thương phẩm, bảo tồn quần thể ong bản địa và hệ sinh thái tự nhiên.'
                ]
              }
            ]
          }
        }
      },
      en: {
        headerTitle: 'ORIGIN TRACEABILITY STAMP',
        lblProduct: 'PRODUCT:',
        lblProducer: 'PRODUCER:',
        lblAddress: 'ADDRESS:',
        lblContact: 'CONTACT:',
        defaultProductName: 'Wild Mint Flower Honey (Mật Ong Hoa Bạc Hà)',
        defaultProducerName: 'Hoang Bach Business Household',
        defaultAddress: 'Xin Chai Village, Son Vi Commune, Tuyen Quang Province, Vietnam',
        defaultContact: '0866.603.589 - 0812.838.589',
        serialBadge: 'QR Auth Code:',
        scanCountBadge: 'Total Scans:',
        verifiedLabel: 'Authentic Hoang Bach',
        tabs: [
          { id: 'intro', label: 'Introduction' },
          { id: 'featured', label: 'Highlights' },
          { id: 'usage', label: 'How to Use' },
          { id: 'distribution', label: 'Distribution' },
          { id: 'soil', label: 'Terroir & Soil' },
          { id: 'bee_breed', label: 'Bee Breed' },
        ],
        regions: [
          { id: 'dong_van', label: 'Dong Van' },
          { id: 'meo_vac', label: 'Meo Vac' },
          { id: 'yen_minh', label: 'Yen Minh' },
        ],
        distLabels: {
          unitName: 'Production Unit:',
          address: 'Address:',
          contact: 'Contact:',
          intro: 'Overview:',
          btnMore: 'DETAILS',
          btnBack: 'BACK TO DISTRIBUTION POINTS (BACK)',
          btnBackShort: 'BACK TO LIST',
          detailTitle: 'PRODUCTION & DISTRIBUTION POINT DETAILS',
          scaleLabel: 'Scale & Capacity:',
          areaLabel: 'Foraging Zone:',
          certLabel: 'Quality Standard:',
          callNow: 'Call Hotline Now',
        },
        articles: {
          intro: {
            title: 'ABOUT HOANG BACH WILD MINT FLOWER HONEY',
            subtitle: 'Precious Highland Nectar from the Dong Van Karst Plateau UNESCO Global Geopark',
            lead: 'Hoang Bach Mint Flower Honey is a renowned highland specialty harvested 100% naturally from wild purple mint blossoms thriving at altitudes of 1,000m – 1,600m across the rocky mountains of Ha Giang from late autumn to early winter (October to January).',
            sections: [
              {
                heading: '1. 100% Pure Highland Origin',
                body: 'Wild highland mint grows naturally along jagged limestone cliffs. Blooming only once a year for under three months, its nectar is gathered by indigenous honeybees to create a signature lemon-yellow honey with a delicate olive-green hue, rich viscosity, and a refreshing herbal aroma.'
              },
              {
                heading: '2. Artisanal Harvesting & Strict Quality Control',
                body: 'Hoang Bach partners directly with traditional beekeeping cooperatives across Dong Van, Meo Vac, Lung Cu, and Yen Minh. Honeycombs are extracted only when at least 90% naturally capped with beeswax, cold-filtered without industrial heat treatment to preserve all natural enzymes, vitamins, and minerals.'
              },
              {
                heading: '3. Our Quality Commitment',
                bullets: [
                  '100% pure seasonal wild mint blossom honey from the Karst Plateau.',
                  'Zero added sugar, zero preservatives, and zero artificial flavors or colorings.',
                  'Full batch-level QR traceability from apiary to jar.',
                  'Certified food safety and authentic highland specialty standards.'
                ]
              }
            ]
          },
          featured: {
            title: 'SIGNATURE HIGHLIGHTS OF MINT FLOWER HONEY',
            subtitle: 'Unique sensory and nutritional qualities known as "Liquid Gold" of the Highlands',
            lead: 'Wild mint honey stands apart thanks to the extraordinary synergy between medicinal mountain mint flowers and indigenous highland honeybees.',
            sections: [
              {
                heading: '1. Distinctive Color, Texture & Flavor',
                body: 'Luminous golden-yellow with a subtle greenish tint and thick, silky consistency. It offers a refined, gentle sweetness on the palate followed by a cool, soothing floral aftertaste without any harsh throat burn.'
              },
              {
                heading: '2. Wellness & Nutritional Benefits',
                bullets: [
                  'Soothes sore throats, relieves coughs, and supports respiratory health during cold seasons.',
                  'Boosts natural immunity with abundant amino acids, live enzymes (Diastase, Invertase), B-complex vitamins, Vitamin C, and trace minerals (Calcium, Iron, Zinc, Magnesium).',
                  'Supports healthy digestion, calms the stomach lining, and promotes restful sleep.',
                  'Rich in natural antioxidants that nourish skin vitality from within.'
                ]
              },
              {
                heading: '3. Authenticity Benchmark',
                body: 'Naturally low moisture content (< 20%) ensures long-lasting freshness, vibrant color, and stable herbal aroma without fermentation when stored properly.'
              }
            ]
          },
          usage: {
            title: 'HOW TO USE & STORE PROPERLY',
            subtitle: 'Maximize the natural bio-enzymes and herbal nutrients in every spoonful',
            lead: 'Using wild mint honey at the right temperature and time of day ensures optimal absorption of its active enzymes and botanical compounds.',
            sections: [
              {
                heading: '1. Daily Recommended Usage',
                bullets: [
                  'Morning Wellness Drink: Mix 1–2 teaspoons (10–15ml) of mint honey into 150–200ml of warm water (ideal temperature 40°C – 50°C; avoid boiling water above 60°C to protect live enzymes). Drink 20–30 minutes before breakfast.',
                  'Throat & Cough Relief: Take 1 teaspoon of pure honey directly or steam-infuse with kumquat, lemon, or fresh ginger 2–3 times daily.',
                  'Culinary & Herbal Pairing: Stir into chamomile tea, herbal infusions, saffron water, fresh citrus juice, or drizzle over yogurt, toast, and fruit salads.'
                ]
              },
              {
                heading: '2. Suitable Users & Precautions',
                bullets: [
                  'Ideal for adults, seniors, individuals recovering from fatigue, and children over 1 year old.',
                  'Note: Do not feed honey to infants under 12 months of age.',
                  'Use clean wooden, ceramic, or food-grade plastic spoons rather than leaving metal spoons submerged.'
                ]
              },
              {
                heading: '3. Storage Instructions',
                body: 'Keep the lid tightly sealed after each use. Store in a cool, dry place at room temperature (20°C – 28°C) away from direct sunlight. Do not refrigerate, as cold temperatures accelerate natural glucose crystallization.'
              }
            ]
          },
          soil: {
            title: 'TERROIR & CLIMATE OF THE KARST PLATEAU',
            subtitle: 'Hundreds of millions of years of limestone geology shaping a rare botanical ecosystem',
            lead: 'The Dong Van Karst Plateau (spanning Quan Ba, Yen Minh, Dong Van, and Meo Vac) is a UNESCO Global Geopark characterized by over 80% rugged limestone peaks rising 1,000m – 1,600m above sea level.',
            sections: [
              {
                heading: '1. Mineral-Rich Limestone Karst',
                body: 'Organic humus pockets nestled within ancient limestone crevices are naturally enriched with Calcium, Magnesium, Potassium, and Silica. Wild mint roots penetrate deep into the rock fissures, producing blossoms with exceptionally concentrated essential oils and nectar.'
              },
              {
                heading: '2. High-Altitude Microclimate',
                body: 'During the blooming season (October to December), crisp golden sunshine by day and misty mountain nights (8°C – 15°C) stimulate the wild mint plants to secrete dense, aromatic nectar rich in natural sugars and trace minerals.'
              },
              {
                heading: '3. Untouched Pristine Environment',
                bullets: [
                  'Completely isolated from industrial zones, urban pollution, and agricultural chemicals.',
                  '100% wild-growing mint flora with zero chemical fertilizers or pesticides.',
                  'Nourished solely by pure mountain mist and natural rainfall.'
                ]
              }
            ]
          },
          bee_breed: {
            title: 'INDIGENOUS HIGHLAND HONEYBEE BREED',
            subtitle: 'Resilient native pollinators braving mountain winds and mist',
            lead: 'Hoang Bach Mint Flower Honey is crafted by native Eastern honeybees (Apis cerana) that have co-evolved for centuries with the steep terrain and cold climate of Vietnam’s northernmost highlands.',
            sections: [
              {
                heading: '1. Superior Adaptation of Native Highland Bees',
                body: 'Smaller, agile, and remarkably cold-hardy compared to imported lowland bees, native highland bees forage actively even in chilly mountain mist. Their slender proboscis easily reaches deep inside tiny wild mint corollas clinging to limestone cliffs.'
              },
              {
                heading: '2. Natural Hive Ripening Process',
                body: 'Worker bees fly miles across rocky valleys to collect nectar, enriching it with pharyngeal enzymes and fanning their wings tirelessly until moisture drops below 19–20% before sealing the cells with pure white beeswax.'
              },
              {
                heading: '3. Sustainable Traditional Beekeeping',
                bullets: [
                  'Natural wooden hives placed directly along wild mint valleys and karst slopes.',
                  'Strictly no sugar-feeding during the mint blossom harvest season.',
                  'Zero antibiotics in harvested honey, preserving both native bee health and biodiversity.'
                ]
              }
            ]
          }
        }
      },
      zh: {
        headerTitle: '原产地溯源防伪标签',
        lblProduct: '产品名称:',
        lblProducer: '生产单位:',
        lblAddress: '生产地址:',
        lblContact: '联系电话:',
        defaultProductName: '野生薄荷花蜂蜜 (Mật Ong Hoa Bạc Hà)',
        defaultProducerName: '黄百 (Hoàng Bách) 经营户',
        defaultAddress: '越南宣光省山尾社新寨村',
        defaultContact: '0866.603.589 - 0812.838.589',
        serialBadge: '防伪溯源码:',
        scanCountBadge: '查询次数:',
        verifiedLabel: '黄百正品认证',
        tabs: [
          { id: 'intro', label: '产品介绍' },
          { id: 'featured', label: '产品特色' },
          { id: 'usage', label: '使用方法' },
          { id: 'distribution', label: '分销网点' },
          { id: 'soil', label: '风土环境' },
          { id: 'bee_breed', label: '蜜蜂品种' },
        ],
        regions: [
          { id: 'dong_van', label: '同文 (Đồng Văn)' },
          { id: 'meo_vac', label: '苗旺 (Mèo Vạc)' },
          { id: 'yen_minh', label: '安明 (Yên Minh)' },
        ],
        distLabels: {
          unitName: '生产合作单位:',
          address: '地址:',
          contact: '联系电话:',
          intro: '简介:',
          btnMore: '详细介绍',
          btnBack: '返回分销网点列表 (BACK)',
          btnBackShort: '返回列表 (BACK)',
          detailTitle: '生产与分销网点详细介绍',
          scaleLabel: '养殖规模与产量:',
          areaLabel: '采蜜产区:',
          certLabel: '质量认证标准:',
          callNow: '立即拨打电话',
        },
        articles: {
          intro: {
            title: '黄百 (HOÀNG BÁCH) 野生薄荷花蜂蜜介绍',
            subtitle: '源自河江同文喀斯特高原世界地质公园的珍贵高山蜜源',
            lead: '黄百薄荷花蜂蜜是采集自海拔 1,000 米至 1,600 米高寒石山野生紫薄荷花海的纯天然高原特产，每年仅在深秋至初冬（农历十月至十二月）盛花期采收一季。',
            sections: [
              {
                heading: '1. 100% 纯天然高山野生蜜源',
                body: '高原野生薄荷自然生长在险峻的石灰岩峰丛裂缝间，一年仅开一次花。当地本土中华蜜蜂采集薄荷花蜜酿造出的蜂蜜呈独特的柠檬金黄带微绿光泽，蜜质浓稠醇厚，散发清新淡雅的草本薄荷花香。'
              },
              {
                heading: '2. 传统自然成熟采割与严格品控',
                body: '黄百与同文、苗旺、龙鼓、安明等地资深养蜂合作社紧密合作。坚持只采割自然封盖率达 90% 以上的成熟蜜脾，采用传统物理静置过滤，不经工业高温浓缩，完整保留天然活性酶、维生素与矿物质。'
              },
              {
                heading: '3. 黄百品质承诺',
                bullets: [
                  '100% 喀斯特石山高原当季纯正野生薄荷花蜜。',
                  '绝不添加白糖、防腐剂、人工香精或色素。',
                  '一物一码二维码防伪溯源，批次信息透明可查。',
                  '符合食品安全卫生标准及高山特色农产品认证。'
                ]
              }
            ]
          },
          featured: {
            title: '薄荷花蜂蜜的独特品质',
            subtitle: '色、香、味俱佳的高原“液体黄金”',
            lead: '凭借高山药用野生薄荷与本土耐寒蜜蜂的完美结合，薄荷花蜜展现出与众不同的感官与营养价值。',
            sections: [
              {
                heading: '1. 独特外观与清润口感',
                body: '色泽金黄透亮并带有柔和的橄榄绿光晕，质地绵密顺滑。入口清甜细腻而不腻喉，回味带有淡淡的野生薄荷清凉花香。'
              },
              {
                heading: '2. 养生价值与营养成分',
                bullets: [
                  '润肺止咳、舒缓咽喉不适，特别适合换季时节呵护呼吸道健康。',
                  '富含多种氨基酸、天然活性酶（淀粉酶、转化酶）、B族维生素、维生素C及钙、铁、锌、镁等微量元素，增强机体免疫力。',
                  '温和调理肠胃消化系统，舒缓神经并帮助改善睡眠质量。',
                  '富含天然抗氧化成分，由内而外滋养肌肤。'
                ]
              },
              {
                heading: '3. 纯正薄荷蜜鉴别特征',
                body: '天然波美度高、水分含量低（< 20%），久置依然保持清雅花香与鲜亮色泽，正确保存下不发酸、不胀气。'
              }
            ]
          },
          usage: {
            title: '科学食用方法与保存指南',
            subtitle: '充分锁住每一滴薄荷花蜜的天然活性营养',
            lead: '掌握正确的冲泡水温与饮用时间，有助于人体充分吸收蜂蜜中的生物活性酶与草本精华。',
            sections: [
              {
                heading: '1. 日常养生推荐吃法',
                bullets: [
                  '晨起温水冲饮：取 1–2 茶匙（10–15ml）薄荷蜂蜜，加入 150–200ml 温开水（适宜水温 40°C – 50°C，切勿使用超过 60°C 的沸水以免破坏活性酶），早餐前 20–30 分钟饮用最佳。',
                  '润喉护嗓：直接含服一勺纯蜜，或搭配金桔、柠檬、鲜姜片隔水炖服，每日 2–3 次。',
                  '花草茶与美食搭配：可调入菊花茶、草本茶、藏红花水、鲜榨果汁，或搭配酸奶、吐司面包及水果沙拉。'
                ]
              },
              {
                heading: '2. 适用人群与注意事项',
                bullets: [
                  '适合成年人、中老年人、体虚疲劳人群及 1 周岁以上儿童。',
                  '注意：未满 12 个月的婴幼儿不宜食用蜂蜜。',
                  '建议使用干净的木勺、瓷勺或食品级塑料勺取蜜，避免金属勺长时间浸泡在蜜罐中。'
                ]
              },
              {
                heading: '3. 保存方法',
                body: '每次食用后请拧紧瓶盖，置于阴凉干燥通风处（室温 20°C – 28°C），避免阳光直射。无需放入冰箱冷藏，低温环境容易导致天然葡萄糖结晶。'
              }
            ]
          },
          soil: {
            title: '喀斯特石山高原的风土与气候',
            subtitle: '数亿年石灰岩地质孕育出的珍稀高山蜜源生态',
            lead: '同文喀斯特高原（涵盖管簿、安明、同文、苗旺四县）被联合国教科文组织列为世界地质公园，超过 80% 的地表为海拔 1,000 米至 1,600 米的陡峭石灰岩山峰。',
            sections: [
              {
                heading: '1. 富含矿物质的石灰岩风土',
                body: '历经数亿年地质演变，石缝中沉积的腐殖土富含钙、镁、钾、硅等天然矿物质。野生薄荷根系深扎于岩石缝隙中汲取养分与高山晨露，使花瓣精油与花蜜浓度远高于平原地区。'
              },
              {
                heading: '2. 昼夜温差造就醇厚蜜质',
                body: '每年花期（农历十月至十二月）高原白天阳光明媚干燥，夜间云雾缭绕、气温降至 8°C – 15°C。巨大的昼夜温差促使野生薄荷分泌出高浓度、富含芳香精油与天然糖分的优质花蜜。'
              },
              {
                heading: '3. 零污染原生生态环境',
                bullets: [
                  '远离工业区、城市粉尘与农业化学品污染。',
                  '野生薄荷自然生长于石山坡地，零化肥、零农药。',
                  '高山甘露滋养，确保每一滴蜂蜜纯净无暇。'
                ]
              }
            ]
          },
          bee_breed: {
            title: '高原本土中华蜜蜂品种',
            subtitle: '不畏寒风雾露、穿梭于悬崖石缝间的勤劳采蜜者',
            lead: '黄百薄荷花蜂蜜由世居极北高寒石山区的本土中华蜜蜂（Apis cerana）采集酿造，千百年来已完美适应高原险峻地形与寒冷气候。',
            sections: [
              {
                heading: '1. 高原本土蜜蜂的生物学优势',
                body: '与外来引进蜂种相比，喀斯特高原本土蜜蜂体型精巧、双翼强健、飞行敏捷，具备极强的耐寒与抗雾能力。其细长的吻部能轻松深入紧贴岩壁生长的微小薄荷花萼中采撷精华。'
              },
              {
                heading: '2. 蜂巢内的自然酿熟过程',
                body: '成千上万只工蜂每日飞越数公里石山采集花蜜，回巢后通过口口相传混入咽下腺天然活性酶，并昼夜不停振翅扇风使水分自然蒸发。当水分降至 19–20% 以下时，蜜蜂才用洁白蜂蜡将蜜脾完全封盖。'
              },
              {
                heading: '3. 可持续的传统生态养蜂方式',
                bullets: [
                  '采用天然原木蜂箱，沿野生薄荷最繁茂的石山谷地分布式摆放。',
                  '薄荷花采蜜期绝不饲喂白糖。',
                  '商品蜜零抗生素残留，守护本土蜂群与高原自然生态平衡。'
                ]
              }
            ]
          }
        }
      }
    };

    const distributorsByRegion = {
      dong_van: [
        {
          id: 'htx_dong_van',
          region: 'dong_van',
          image: '/images/honey/honey_dist_dong_van.png',
          vi: {
            name: 'Hợp tác xã Mật ong Hoa Bạc Hà Đồng Văn',
            address: 'Thị trấn Đồng Văn, huyện Đồng Văn, tỉnh Hà Giang',
            phone: '0987 654 321',
            shortIntro: 'HTX quy tụ các hộ nuôi ong bản địa, khai thác mật ong hoa bạc hà theo phương thức truyền thống trên vùng Cao nguyên đá Đồng Văn.',
            scale: 'Hơn 45 hộ thành viên — 1.200+ đàn ong nội bản địa',
            foragingArea: 'Các sườn núi đá vôi Phố Cáo, Sủng Là, Phố Bảng, Thị trấn Đồng Văn (độ cao 1.200m – 1.500m)',
            cert: 'Chứng nhận OCOP 4 Sao & An toàn thực phẩm Chi cục Quản lý chất lượng Nông lâm sản và Thủy sản',
            fullStory: [
              'Hợp tác xã Mật ong Hoa Bạc Hà Đồng Văn là đơn vị nòng cốt trong mạng lưới liên kết sản xuất và phân phối của Hộ Kinh Doanh Hoàng Bách tại khu vực trung tâm Cao nguyên đá Đồng Văn. Được thành lập bởi những nghệ nhân nuôi ong người Mông, Tày, Giáy có truyền thống lâu đời, HTX hiện quản lý hơn 1.200 đàn ong nội đặt tại các thung lũng hoa bạc hà tự nhiên đẹp nhất vùng lõi công viên địa chất.',
              'Toàn bộ các hộ thành viên trong HTX tuân thủ nghiêm ngặt quy trình nuôi ong sinh thái: chỉ di chuyển đàn ong đến vùng hoa bạc hà tự nhiên từ đầu tháng 10 âm lịch, tuyệt đối không cho ong ăn đường trong mùa khai thác và chỉ quay mật khi cầu ong đã vít nắp sáp trắng chín tự nhiên trên 90%.',
              'Mật sau khi thu hoạch tại từng điểm trại được kiểm tra độ thủy phần bằng khúc xạ kế chuyên dụng, lọc thô qua lưới inox thực phẩm và đóng can niêm phong chuyển về kho bảo quản tiêu chuẩn, đảm bảo giữ nguyên hương vị the mát đặc trưng và màu vàng chanh ánh xanh nguyên bản của vùng đá Đồng Văn.'
            ]
          },
          en: {
            name: 'Dong Van Mint Flower Honey Cooperative',
            address: 'Dong Van Town, Dong Van District, Ha Giang Province',
            phone: '0987 654 321',
            shortIntro: 'The cooperative unites indigenous beekeeping households harvesting wild mint flower honey using traditional methods across the Dong Van Karst Plateau.',
            scale: '45+ member households — 1,200+ native highland bee colonies',
            foragingArea: 'Limestone valleys of Pho Cao, Sung La, Pho Bang, and Dong Van Town (altitude 1,200m – 1,500m)',
            cert: '4-Star OCOP Specialty & Certified Food Hygiene and Safety Standard',
            fullStory: [
              'Dong Van Mint Flower Honey Cooperative is a cornerstone production and distribution partner of Hoang Bach in the heart of the Dong Van Karst Plateau. Founded by experienced local H’Mong, Tay, and Giay beekeepers, the cooperative manages over 1,200 native bee colonies stationed across pristine wild mint valleys.',
              'Every member household adheres strictly to ecological beekeeping protocols: zero sugar feeding during the blossom season and harvesting only when honeycombs are over 90% naturally wax-capped.',
              'Each batch is tested for moisture content via refractometer, cold-filtered through food-grade stainless mesh, and sealed with full origin traceability.'
            ]
          },
          zh: {
            name: '同文薄荷花蜂蜜合作社 (HTX Mật ong Đồng Văn)',
            address: '河江省同文县同文镇',
            phone: '0987 654 321',
            shortIntro: '合作社汇聚当地世居养蜂农户，在同文喀斯特高原采用传统生态方式采酿纯正野生薄荷花蜂蜜。',
            scale: '45+ 合作社成员农户 — 1,200+ 群高原本土中华蜜蜂',
            foragingArea: '副告 (Phố Cáo)、崇喇 (Sủng Là)、副榜 (Phố Bảng) 及同文镇周边海拔 1,200m – 1,500m 石山花谷',
            cert: 'OCOP 四星级特产认证 & 农林水产品质量安全卫生认证',
            fullStory: [
              '同文薄荷花蜂蜜合作社是黄百 (Hoàng Bách) 在同文喀斯特高原核心产区的重要生产与分销网点。合作社由世代养蜂的赫蒙族、岱依族匠人创立，目前管理超过 1,200 群本土蜜蜂，分布在世界地质公园核心区最茂盛的野生薄荷山谷中。',
              '所有成员农户严格执行生态养蜂规范：花期绝不饲喂白糖，坚持只采割自然封盖率达 90% 以上的成熟蜜脾。',
              '采收后的原蜜均经过专业折光仪检测波美度与水分含量，采用食品级滤网物理过滤，确保每一滴蜂蜜都保持同文产区标志性的清凉薄荷花香与柠檬黄绿光泽。'
            ]
          }
        },
        {
          id: 'ho_lung_cu',
          region: 'dong_van',
          image: '/images/honey/honey_dist_lung_cu.png',
          vi: {
            name: 'Hộ sản xuất Mật ong Lũng Cú – Đồng Văn',
            address: 'Thôn Lũng Cú, xã Lũng Cú, huyện Đồng Văn, tỉnh Hà Giang',
            phone: '0369 888 568',
            shortIntro: 'Hộ gia đình có nhiều năm nuôi ong tại Lũng Cú, khai thác mật ong hoa bạc hà tự nhiên, đảm bảo nguyên chất, đậm hương vị vùng cao.',
            scale: '320 đàn ong nội bản địa đặt quanh chân Cột cờ Lũng Cú & thung lũng Thèn Pả',
            foragingArea: 'Thôn Lô Lô Chải, Thèn Pả, Séo Lủng – Xã Lũng Cú (độ cao 1.450m – 1.600m)',
            cert: 'Chứng nhận cơ sở đủ điều kiện An toàn thực phẩm & Truy xuất nguồn gốc QR',
            fullStory: [
              'Nằm ngay dưới chân Cột cờ Quốc gia Lũng Cú – điểm cực Bắc thiêng liêng của Tổ quốc ở độ cao gần 1.500m, Hộ sản xuất Mật ong Lũng Cú là một trong những điểm nuôi ong lâu đời và uy tín nhất tại huyện Đồng Văn. Gia đình sinh sống trong ngôi nhà trình tường đất truyền thống với hàng trăm thùng ong gỗ đặt dọc theo sườn núi đá.',
              'Nhờ vị trí địa lý đặc biệt nơi khí hậu lạnh sâu và sương muối dày vào mùa đông, cây bạc hà dại tại vùng núi đá Lũng Cú có thân thấp, lá dày và hoa tím đậm, tiết ra lượng mật hoa đặc sánh với hàm lượng tinh dầu bạc hà tự nhiên rất cao.',
              'Du khách khi ghé thăm Lũng Cú có thể trực tiếp trải nghiệm quy trình thăm tổ ong, thưởng thức mật ong hoa bạc hà nguyên sáp ngay tại vườn đá và tra cứu tem QR chính hãng Hoàng Bách trên từng sản phẩm.'
            ]
          },
          en: {
            name: 'Lung Cu – Dong Van Honey Production Household',
            address: 'Lung Cu Village, Lung Cu Commune, Dong Van District, Ha Giang Province',
            phone: '0369 888 568',
            shortIntro: 'Long-standing family apiary in Lung Cu harvesting pure natural wild mint honey with rich highland character.',
            scale: '320 native bee colonies around Lung Cu Flag Tower & Then Pa Valley',
            foragingArea: 'Lo Lo Chai, Then Pa, and Seo Lung Villages – Lung Cu Commune (altitude 1,450m – 1,600m)',
            cert: 'Certified Food Safety Household & QR Origin Traceability',
            fullStory: [
              'Located at the foot of the iconic Lung Cu National Flag Tower at Vietnam’s northernmost point (nearly 1,500m elevation), the Lung Cu Honey Production Household has practiced traditional stone-walled courtyard beekeeping for generations.',
              'Because of the colder microclimate and dense mountain mist in Lung Cu, wild mint blossoms here develop deep purple petals with highly concentrated aromatic nectar.',
              'Visitors to Lung Cu can visit the family apiary in person, taste freshly harvested honeycomb, and verify every jar via the Hoang Bach QR traceability stamp.'
            ]
          },
          zh: {
            name: '龙鼓 (Lũng Cú) – 同文养蜂生产户',
            address: '河江省同文县龙鼓社龙鼓村',
            phone: '0369 888 568',
            shortIntro: '在极北龙鼓地区拥有多年养蜂经验的传统农户，采集纯天然野生薄荷花蜜，高原风味浓郁纯正。',
            scale: '320 群本土中华蜜蜂，分布于龙鼓国旗台脚下及山谷地带',
            foragingArea: '倮倮寨 (Lô Lô Chải)、Then Pả、Séo Lủng 村 – 龙鼓社（海拔 1,450m – 1,600m）',
            cert: '食品安全合格生产户认证 & 二维码原产地溯源',
            fullStory: [
              '位于越南极北地标龙鼓国家旗台脚下（海拔近 1,500 米），龙鼓养蜂生产户世代居住在传统的夯土石墙民居中，数百个原木蜂箱整齐排列在石山坡地与花海之间。',
              '得益于龙鼓高海拔严寒与浓雾气候，这里的野生薄荷植株紧凑、花色深紫，分泌出的花蜜尤为浓稠，天然薄荷精油香气极为浓郁。',
              '来到龙鼓的游客可以亲临蜂场参观采蜜过程，品尝新鲜成熟巢蜜，并通过黄百 (Hoàng Bách) 防伪溯源二维码查询每一瓶蜂蜜的完整产地信息。'
            ]
          }
        }
      ],
      meo_vac: [
        {
          id: 'htx_meo_vac',
          region: 'meo_vac',
          image: '/images/honey/honey_dist_dong_van.png',
          vi: {
            name: 'Hợp tác xã Ong mật Hoa Bạc Hà Mèo Vạc',
            address: 'Thị trấn Mèo Vạc, huyện Mèo Vạc, tỉnh Hà Giang',
            phone: '0866 603 589',
            shortIntro: 'Đơn vị liên kết khai thác mật ong hoa bạc hà trên các triền núi đá vôi hùng vĩ dọc đèo Mã Pì Lèng và thung lũng Pả Vi, Sín Cái.',
            scale: '38 hộ nuôi ong liên kết — hơn 950 đàn ong nội bản địa',
            foragingArea: 'Khu vực đèo Mã Pì Lèng, Pả Vi, Giàng Chu Phìn, Sủng Trà – Huyện Mèo Vạc',
            cert: 'Chứng nhận Chỉ dẫn địa lý Mật ong Bạc hà Mèo Vạc & OCOP 4 Sao',
            fullStory: [
              'Huyện Mèo Vạc từ lâu được mệnh danh là "thủ phủ" của cây hoa bạc hà dại trên Cao nguyên đá với diện tích hoa mọc tự nhiên rộng lớn trải dài dọc theo sườn đèo Mã Pì Lèng, hẻm vực sông Nho Quế và các xã Pả Vi, Giàng Chu Phìn, Sủng Trà.',
              'Hợp tác xã Ong mật Hoa Bạc Hà Mèo Vạc phối hợp chặt chẽ cùng Hộ Kinh Doanh Hoàng Bách để tuyển chọn những mẻ mật đầu vụ và giữa vụ đạt độ chín hoàn hảo nhất. Mật ong Mèo Vạc nổi tiếng với độ sánh đặc cao, sắc vàng chanh ánh xanh ngọc bích rất đẹp mắt và hương thơm thanh khiết lâu phai.',
              'Tại điểm phân phối Mèo Vạc, khách hàng được tư vấn trực tiếp cách phân biệt mật ong hoa bạc hà thật – giả, kiểm tra độ đặc sóng sánh và hỗ trợ vận chuyển toàn quốc.'
            ]
          },
          en: {
            name: 'Meo Vac Mint Flower Honey Cooperative',
            address: 'Meo Vac Town, Meo Vac District, Ha Giang Province',
            phone: '0866 603 589',
            shortIntro: 'Partner cooperative harvesting wild mint honey along the majestic limestone cliffs of Ma Pi Leng Pass and Pa Vi Valley.',
            scale: '38 partner beekeeping families — 950+ native bee colonies',
            foragingArea: 'Ma Pi Leng Pass, Pa Vi, Giang Chu Phin, and Sung Tra – Meo Vac District',
            cert: 'Geographical Indication Certified & 4-Star OCOP Specialty',
            fullStory: [
              'Meo Vac District is widely celebrated as the heartland of wild highland mint, with vast natural blossom carpets stretching along Ma Pi Leng Pass and the Nho Que River canyon.',
              'Meo Vac Mint Flower Honey Cooperative works closely with Hoang Bach to select peak-season honey harvests renowned for their emerald-tinted golden hue, exceptional viscosity, and long-lasting floral bouquet.',
              'Customers visiting our Meo Vac distribution center can sample authentic mid-season harvests and arrange nationwide delivery.'
            ]
          },
          zh: {
            name: '苗旺 (Mèo Vạc) 薄荷花蜂蜜合作社',
            address: '河江省苗旺县苗旺镇',
            phone: '0866 603 589',
            shortIntro: '在雄伟的马皮凉 (Mã Pì Lèng) 险峰与帕薇山谷地带合作采酿优质高山野生薄荷花蜜。',
            scale: '38 户联合养蜂家庭 — 950+ 群本土中华蜜蜂',
            foragingArea: '马皮凉山口、帕薇 (Pả Vi)、Giàng Chu Phìn、Sủng Trà – 苗旺县产区',
            cert: '地理标志保护产品认证 & OCOP 四星级标准',
            fullStory: [
              '苗旺县素有喀斯特高原“野生薄荷之乡”的美誉，广阔的天然薄荷花海沿着马皮凉大峡谷与儒桂河两岸连绵分布。',
              '苗旺薄荷花蜂蜜合作社与黄百 (Hoàng Bách) 深度合作，严选盛花期自然封盖成熟蜜。苗旺产区的薄荷蜜以极高的浓稠度、迷人的翠绿金黄光泽和持久幽雅的花香而闻名。',
              '分销中心提供现场品鉴、真伪鉴别指导及全国安全配送服务。'
            ]
          }
        },
        {
          id: 'ho_xin_chai_hoang_bach',
          region: 'meo_vac',
          image: '/images/honey/honey_dist_lung_cu.png',
          vi: {
            name: 'Trại Ong Hoàng Bách – Xín Chải, Sơn Vĩ',
            address: 'Thôn Xín Chải, Xã Sơn Vĩ (Khu vực biên giới Thượng Phùng - Sơn Vĩ)',
            phone: '0812 838 589',
            shortIntro: 'Cơ sở sản xuất và đóng gói trung tâm của Hộ Kinh Doanh Hoàng Bách, trực tiếp quản lý đàn ong tại vùng núi cao biên giới.',
            scale: 'Trụ sở chính & Trại ong trung tâm — hơn 600 đàn ong nội',
            foragingArea: 'Thôn Xín Chải, Xã Sơn Vĩ và vùng núi đá giáp ranh Mèo Vạc',
            cert: 'Cơ sở chính chủ Hộ Kinh Doanh Hoàng Bách — Kiểm định chất lượng định kỳ',
            fullStory: [
              'Trại Ong Hoàng Bách tại Thôn Xín Chải, Xã Sơn Vĩ là cơ sở sản xuất gốc và trung tâm kiểm soát chất lượng của thương hiệu Mật Ong Hoa Bạc Hà Hoàng Bách. Nằm ở vùng núi cao nguyên sơ nơi thảm thực vật rừng đá còn giữ nguyên vẻ hoang dã, trại ong thu hoạch những giọt mật tinh khiết nhất từ các triền đá vôi biệt lập.',
              'Mọi lô mật ong trước khi đóng chai thủy tinh và dán tem truy xuất nguồn gốc đều được kiểm tra nghiêm ngặt về độ trong, thủy phần, hương vị và lưu mẫu đối chứng tại cơ sở Xín Chải – Sơn Vĩ.',
              'Quý khách hàng và đại lý có thể liên hệ trực tiếp qua số hotline 0866.603.589 hoặc 0812.838.589 để đặt hàng chính gốc từ cơ sở sản xuất.'
            ]
          },
          en: {
            name: 'Hoang Bach Central Apiary – Xin Chai, Son Vi',
            address: 'Xin Chai Village, Son Vi Commune, Tuyen Quang / Ha Giang Highland Border',
            phone: '0812 838 589',
            shortIntro: 'Central production and packaging facility of Hoang Bach Business Household, directly managing highland apiaries.',
            scale: 'Headquarters & Central Apiary — 600+ native bee colonies',
            foragingArea: 'Xin Chai Village, Son Vi Commune, and surrounding pristine karst ridges',
            cert: 'Official Hoang Bach Production Facility — Periodic Lab Quality Testing',
            fullStory: [
              'Hoang Bach Central Apiary in Xin Chai Village, Son Vi Commune serves as the primary production base and quality control center for Hoang Bach Mint Flower Honey.',
              'Every harvested batch undergoes rigorous testing for clarity, moisture level, and floral aroma before bottling and applying the official QR traceability seal.',
              'Customers and distributors can contact our direct hotline at 0866.603.589 - 0812.838.589 for authentic factory-direct orders.'
            ]
          },
          zh: {
            name: '黄百 (Hoàng Bách) 中心蜂场 – 新寨村, 山尾社',
            address: '山尾社新寨村（高山生态核心产区）',
            phone: '0812 838 589',
            shortIntro: '黄百经营户核心生产与灌装基地，直接管理高山原生态养蜂场与品质检验中心。',
            scale: '总部基地与中心蜂场 — 600+ 群本土蜜蜂',
            foragingArea: '新寨村、山尾社及毗邻苗旺的高山原始石林花海',
            cert: '黄百官方直营生产基地 — 定期实验室理化指标检测',
            fullStory: [
              '位于山尾社新寨村的黄百中心蜂场是“黄百薄荷花蜂蜜”品牌的源头生产基地与质量控制中心。这里地处偏远纯净的高山石林地带，野生薄荷植被茂密且远离人为干扰。',
              '每一批次蜂蜜在灌装贴标前，均在新寨基地经过波美度、纯净度与感官风味的严格检验，并留存批次样品备查。',
              '欢迎广大消费者与合作伙伴拨打官方热线 0866.603.589 或 0812.838.589 直接订购源头正品。'
            ]
          }
        }
      ],
      yen_minh: [
        {
          id: 'htx_yen_minh',
          region: 'yen_minh',
          image: '/images/honey/honey_dist_dong_van.png',
          vi: {
            name: 'Tổ hợp tác Nuôi ong Bạc Hà Yên Minh',
            address: 'Thị trấn Yên Minh, huyện Yên Minh, tỉnh Hà Giang',
            phone: '0866 603 589',
            shortIntro: 'Điểm thu hoạch và phân phối mật ong hoa bạc hà tại cửa ngõ Cao nguyên đá Yên Minh – Lao Và Chải – Du Già.',
            scale: '28 hộ nuôi ong truyền thống — hơn 680 đàn ong nội',
            foragingArea: 'Xã Lao Và Chải, Na Khê, Bạch Đích, Du Già – Huyện Yên Minh',
            cert: 'Chứng nhận An toàn vệ sinh thực phẩm & Chuỗi cung ứng Mật ong Cao nguyên đá',
            fullStory: [
              'Tổ hợp tác Nuôi ong Bạc Hà Yên Minh phụ trách vùng nguyên liệu phía Tây và phía Nam của Cao nguyên đá, trải dài từ các sườn núi đá vôi Lao Và Chải, Na Khê, Bạch Đích cho tới vùng rừng núi nguyên sinh Du Già.',
              'Nhờ thảm thực vật phong phú giao thoa giữa rừng thông Yên Minh và các triền đá tai mèo phủ đầy hoa bạc hà tím, mật ong thu hoạch tại khu vực Yên Minh có hương thơm dịu nhẹ quyến rũ, vị ngọt thanh mát rất dễ thưởng thức cho cả người lớn tuổi và trẻ nhỏ.',
              'Điểm phân phối tại Thị trấn Yên Minh là trạm dừng chân tin cậy cho du khách trên cung đường khám phá Hà Giang muốn mua mật ong hoa bạc hà Hoàng Bách chính hãng có tem truy xuất nguồn gốc rõ ràng.'
            ]
          },
          en: {
            name: 'Yen Minh Mint Honey Beekeeping Cooperative Group',
            address: 'Yen Minh Town, Yen Minh District, Ha Giang Province',
            phone: '0866 603 589',
            shortIntro: 'Harvesting and distribution hub at the gateway to the Yen Minh – Lao Va Chai – Du Gia karst region.',
            scale: '28 traditional beekeeping households — 680+ native bee colonies',
            foragingArea: 'Lao Va Chai, Na Khe, Bach Dich, and Du Gia Communes – Yen Minh District',
            cert: 'Certified Food Hygiene & Karst Plateau Honey Supply Chain Partner',
            fullStory: [
              'The Yen Minh Beekeeping Cooperative Group oversees the western and southern foraging zones of the Karst Plateau, spanning from the limestone slopes of Lao Va Chai and Bach Dich to the pristine valleys of Du Gia.',
              'Surrounded by highland pine forests and wild mint limestone ridges, honey harvested in Yen Minh features a remarkably gentle floral aroma and smooth, refreshing sweetness.',
              'Our Yen Minh Town center serves as a trusted stopover for travelers exploring Ha Giang who seek authentic QR-verified Hoang Bach Mint Flower Honey.'
            ]
          },
          zh: {
            name: '安明 (Yên Minh) 薄荷蜜养蜂合作组',
            address: '河江省安明县安明镇',
            phone: '0866 603 589',
            shortIntro: '位于安明 – 劳瓦寨 (Lao Và Chải) – 游嘉 (Du Già) 喀斯特高原门户产区的采收与分销网点。',
            scale: '28 户传统养蜂家庭 — 680+ 群高原本土蜜蜂',
            foragingArea: '劳瓦寨、那溪 (Na Khê)、白迪 (Bạch Đích) 及游嘉自然保护区周边石山',
            cert: '食品安全卫生认证 & 喀斯特高原蜂蜜标准化供应链成员',
            fullStory: [
              '安明薄荷蜜养蜂合作组负责喀斯特高原西南部蜜源产区，涵盖劳瓦寨、那溪、白迪的石灰岩山坡以及游嘉原始生态山谷。',
              '得益于安明高山松林与石山野生薄荷花海交织的微生态，安明产区的薄荷蜜香气柔美清新，口感温润甘甜，老少皆宜。',
              '安明镇分销网点是环游河江高原游客信赖的正品驿站，所有产品均贴有黄百 (Hoàng Bách) 防伪溯源二维码标签。'
            ]
          }
        },
        {
          id: 'ho_du_gia_yen_minh',
          region: 'yen_minh',
          image: '/images/honey/honey_dist_lung_cu.png',
          vi: {
            name: 'Hộ nuôi ong Sinh thái Du Già – Yên Minh',
            address: 'Xã Du Già, huyện Yên Minh, tỉnh Hà Giang',
            phone: '0812 838 589',
            shortIntro: 'Khai thác mật ong hoa bạc hà tự nhiên tại khu vực vùng đệm Vườn Quốc gia Du Già – Cao nguyên đá Đồng Văn.',
            scale: '250 đàn ong nội bản địa nuôi theo mô hình sinh thái rừng đá',
            foragingArea: 'Thung lũng Du Già, Đường Thượng, Lũng Hồ – Huyện Yên Minh',
            cert: 'Sản phẩm OCOP địa phương & Cam kết 100% nguyên chất tự nhiên',
            fullStory: [
              'Nằm trong vùng sinh thái trong lành giáp Vườn Quốc gia Du Già và các xã Đường Thượng, Lũng Hồ, Hộ nuôi ong Sinh thái Du Già sở hữu nguồn hoa bạc hà rừng hoàn toàn tự nhiên mọc xen kẽ trên các dãy núi đá vôi hùng vĩ.',
              'Đàn ong tại đây tận hưởng nguồn nước suối thác tinh khiết và thảm hoa bạc hà nở muộn kéo dài đến tận tháng Chạp âm lịch, tạo nên những giọt mật cuối vụ sánh đặc, giàu khoáng chất và đậm đà hương vị núi rừng.',
              'Sản phẩm được thu gom, kiểm định chất lượng và phân phối chính thức trong hệ thống Mật Ong Hoa Bạc Hà Hoàng Bách.'
            ]
          },
          en: {
            name: 'Du Gia Ecological Beekeeping Household – Yen Minh',
            address: 'Du Gia Commune, Yen Minh District, Ha Giang Province',
            phone: '0812 838 589',
            shortIntro: 'Harvesting wild mint honey in the pristine buffer zone of Du Gia National Park – Dong Van Karst Plateau.',
            scale: '250 native bee colonies managed under forest-karst ecological standards',
            foragingArea: 'Du Gia, Duong Thuong, and Lung Ho Valleys – Yen Minh District',
            cert: 'Local OCOP Specialty & 100% Pure Natural Guarantee',
            fullStory: [
              'Nestled in the unspoiled valleys bordering Du Gia National Park, Duong Thuong, and Lung Ho, the Du Gia Ecological Beekeeping Household benefits from wild mountain mint thriving alongside crystal-clear waterfall streams.',
              'Late-season blossoms here yield a rich, mineral-dense honey with a deep herbal aroma, fully inspected and distributed under the Hoang Bach quality seal.'
            ]
          },
          zh: {
            name: '游嘉 (Du Già) – 安明生态养蜂户',
            address: '河江省安明县游嘉社',
            phone: '0812 838 589',
            shortIntro: '在游嘉国家公园缓冲带与同文喀斯特高原交界处采集纯天然野生薄荷花蜜。',
            scale: '250 群原生态石林放养本土蜜蜂',
            foragingArea: '游嘉山谷、Đường Thượng、Lũng Hồ – 安明县生态产区',
            cert: '地方特色农产品认证 & 100% 纯天然品质保证',
            fullStory: [
              '坐落于毗邻游嘉国家公园的原始山谷中，游嘉生态养蜂户依托清澈的高山溪流与绵延的野生薄荷石山，拥有得天独厚的无污染蜜源环境。',
              '这里的晚花期薄荷蜜质地尤为醇厚、矿物质丰富，经黄百 (Hoàng Bách) 严格检验后统一贴标溯源上市。'
            ]
          }
        }
      ]
    };

    const t = i18n[honeyLang] || i18n.vi;
    const currentRegionDists = distributorsByRegion[honeyRegion] || distributorsByRegion.dong_van;

    const handleSelectHoneyTab = (tabId) => {
      setHoneyTab(tabId);
      setSelectedHoneyDist(null);
      if (honeyContentBoxRef.current) {
        honeyContentBoxRef.current.scrollTop = 0;
      }
    };

    const handleOpenDistDetail = (distItem) => {
      setSelectedHoneyDist(distItem);
      if (honeyContentBoxRef.current) {
        honeyContentBoxRef.current.scrollTop = 0;
      }
    };

    const handleBackToDistList = () => {
      setSelectedHoneyDist(null);
      if (honeyContentBoxRef.current) {
        honeyContentBoxRef.current.scrollTop = 0;
      }
    };

    const renderTabIcon = (tabId, isActive) => {
      const strokeColor = isActive ? '#103b19' : '#f7d56e';
      switch (tabId) {
        case 'intro':
          return <BookOpen size={20} strokeWidth={2.2} color={strokeColor} />;
        case 'featured':
          return <Award size={20} strokeWidth={2.2} color={strokeColor} />;
        case 'usage':
          return (
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
              <path d="M3 8h14v7a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
              <line x1="6" y1="2" x2="6" y2="5" />
              <line x1="10" y1="2" x2="10" y2="5" />
              <line x1="14" y1="2" x2="14" y2="5" />
              <line x1="2" y1="21" x2="18" y2="21" />
            </svg>
          );
        case 'distribution':
          return <MapPin size={20} strokeWidth={2.2} color={strokeColor} />;
        case 'soil':
          return <Sprout size={20} strokeWidth={2.2} color={strokeColor} />;
        case 'bee_breed':
          return (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="14" rx="4.5" ry="6" />
              <path d="M8 12h8" />
              <path d="M8 15.5h8" />
              <path d="M12 8C9 5 4 6 3 9c-1 2.5 2 5 4.8 4.2" />
              <path d="M12 8c3-3 8-2 9 1 1 2.5-2 5-4.8 4.2" />
              <path d="M10 4.5 11.2 8" />
              <path d="M14 4.5 12.8 8" />
              <path d="M12 20v2" />
            </svg>
          );
        default:
          return <Sparkles size={20} color={strokeColor} />;
      }
    };

    const activeArticle = t.articles[honeyTab] || t.articles.intro;
    const distDetailData = selectedHoneyDist ? (selectedHoneyDist[honeyLang] || selectedHoneyDist.vi) : null;

    return (
      <div className="honey-trace-wrapper">
        <div className="honey-trace-card">
          {/* 1. HEADER BAR: TIÊU ĐỀ + 3 NGÔN NGỮ */}
          <div className="honey-top-header">
            <h1 className="honey-main-title">{t.headerTitle}</h1>
            <div className="honey-lang-switcher" role="group" aria-label="Language Selector">
              <button
                type="button"
                className={`honey-lang-btn ${honeyLang === 'vi' ? 'active' : ''}`}
                onClick={() => setHoneyLang('vi')}
              >
                <span className="honey-flag-icon" aria-hidden="true">
                  <svg viewBox="0 0 36 36" width="18" height="18">
                    <circle cx="18" cy="18" r="18" fill="#DA251D" />
                    <polygon points="18,7.5 20.9,14.8 28.8,15.3 22.7,20.3 24.7,28 18,23.7 11.3,28 13.3,20.3 7.2,15.3 15.1,14.8" fill="#FFFF00" />
                  </svg>
                </span>
                <span>Tiếng Việt</span>
              </button>
              <button
                type="button"
                className={`honey-lang-btn ${honeyLang === 'en' ? 'active' : ''}`}
                onClick={() => setHoneyLang('en')}
              >
                <span className="honey-flag-icon" aria-hidden="true">
                  <svg viewBox="0 0 36 36" width="18" height="18">
                    <circle cx="18" cy="18" r="18" fill="#012169" />
                    <path d="M5,5 L31,31 M31,5 L5,31" stroke="#FFF" strokeWidth="4.5" />
                    <path d="M5,5 L31,31 M31,5 L5,31" stroke="#C8102E" strokeWidth="2.2" />
                    <path d="M18,0 V36 M0,18 H36" stroke="#FFF" strokeWidth="6.5" />
                    <path d="M18,0 V36 M0,18 H36" stroke="#C8102E" strokeWidth="3.8" />
                  </svg>
                </span>
                <span>English</span>
              </button>
              <button
                type="button"
                className={`honey-lang-btn ${honeyLang === 'zh' ? 'active' : ''}`}
                onClick={() => setHoneyLang('zh')}
              >
                <span className="honey-flag-icon" aria-hidden="true">
                  <svg viewBox="0 0 36 36" width="18" height="18">
                    <circle cx="18" cy="18" r="18" fill="#DE2910" />
                    <polygon points="10.5,8.5 12,13 16.5,13 12.8,15.8 14.2,20.2 10.5,17.5 6.8,20.2 8.2,15.8 4.5,13 9,13" fill="#FFDE00" />
                    <circle cx="19.5" cy="7.5" r="1.3" fill="#FFDE00" />
                    <circle cx="22.8" cy="10.8" r="1.3" fill="#FFDE00" />
                    <circle cx="22.8" cy="15.5" r="1.3" fill="#FFDE00" />
                    <circle cx="19.5" cy="19" r="1.3" fill="#FFDE00" />
                  </svg>
                </span>
                <span>中文</span>
              </button>
            </div>
          </div>

          <div className="honey-gold-divider-line" />

          {/* 2. KHỐI THÔNG TIN SẢN PHẨM (TRÁI) & LOGO HOÀNG BÁCH (PHẢI) */}
          <div className="honey-product-header-grid">
            <div className="honey-product-meta-list">
              <div className="honey-meta-row">
                <div className="honey-meta-icon-box">
                  <Layers size={19} strokeWidth={2.2} />
                </div>
                <div className="honey-meta-text">
                  <span className="honey-meta-label">{t.lblProduct}</span>
                  <span className="honey-meta-value">{t.defaultProductName}</span>
                </div>
              </div>

              <div className="honey-meta-row">
                <div className="honey-meta-icon-box">
                  <Building2 size={19} strokeWidth={2.2} />
                </div>
                <div className="honey-meta-text">
                  <span className="honey-meta-label">{t.lblProducer}</span>
                  <span className="honey-meta-value">{t.defaultProducerName}</span>
                </div>
              </div>

              <div className="honey-meta-row">
                <div className="honey-meta-icon-box">
                  <MapPin size={19} strokeWidth={2.2} />
                </div>
                <div className="honey-meta-text">
                  <span className="honey-meta-label">{t.lblAddress}</span>
                  <span className="honey-meta-value">{t.defaultAddress}</span>
                </div>
              </div>

              <div className="honey-meta-row honey-meta-row-contact">
                <div className="honey-meta-icon-box">
                  <Phone size={19} strokeWidth={2.2} />
                </div>
                <div className="honey-meta-text">
                  <span className="honey-meta-label">{t.lblContact}</span>
                  <a href={`tel:${String(t.defaultContact).split('-')[0].replace(/\D/g, '')}`} className="honey-meta-value honey-contact-highlight">
                    {t.defaultContact}
                  </a>
                </div>
              </div>
            </div>

            <div className="honey-brand-logo-frame">
              <div className="honey-brand-logo-inner">
                <img
                  src="/images/honey/honey_logo_hoang_bach.png"
                  alt="Hoàng Bách - Mật Ong Hoa Bạc Hà - Cao Nguyên Đá Hà Giang"
                  className="honey-brand-logo-img"
                />
              </div>
            </div>
          </div>

          {/* Dải xác thực mã QR nhỏ gọn nếu có serialNumber */}
          {(label?.internalCode || label?.serialNumber || serial) && (
            <div className="honey-auth-strip">
              <div className="honey-auth-strip-item">
                <ShieldCheck size={15} />
                <span>{t.verifiedLabel}</span>
              </div>
              <div className="honey-auth-strip-item">
                <QrCode size={14} />
                <span>{t.serialBadge} <strong>{label?.internalCode || label?.serialNumber || serial}</strong></span>
              </div>
              {Number(label?.scanCount || 0) > 0 && (
                <div className="honey-auth-strip-item">
                  <Eye size={14} />
                  <span>{t.scanCountBadge} <strong>{label?.scanCount}</strong></span>
                </div>
              )}
            </div>
          )}

          {/* 3. 6 TAB ĐIỀU HƯỚNG (2 HÀNG x 3 CỘT - BẤM VÀO TAB NÀO THÌ TAB ĐÓ ĐỔI MÀU VÀNG) */}
          <div className="honey-tabs-grid" role="tablist">
            {t.tabs.map((tab) => {
              const isActive = honeyTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`honey-tab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectHoneyTab(tab.id)}
                >
                  <span className="honey-tab-icon">
                    {renderTabIcon(tab.id, isActive)}
                  </span>
                  <span className="honey-tab-label">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* 4. BANNER PHONG CẢNH CAO NGUYÊN ĐÁ & HŨ MẬT ONG */}
          <div className="honey-hero-banner-wrap">
            <img
              src="/images/honey/honey_hero_banner.png"
              alt="Mật Ong Hoa Bạc Hà Cao Nguyên Đá Hà Giang"
              className="honey-hero-banner-img"
            />
          </div>

          {/* 5. Ô NỘI DUNG CHÍNH PHÍA DƯỚI (CỨ BẤM VÀO ĐÂU THÌ NỘI DUNG Ở TRONG Ô ĐỎ HẾT, DÀI QUÁ THÌ KÉO XUỐNG DƯỚI) */}
          <div className="honey-content-outer-frame">
            <div className="honey-content-box" ref={honeyContentBoxRef}>
              {honeyTab === 'distribution' ? (
                selectedHoneyDist === null ? (
                  /* 5A. DANH SÁCH CÁC ĐIỂM PHÂN PHỐI THEO VÙNG (ĐỒNG VĂN | MÈO VẠC | YÊN MINH) */
                  <div className="honey-distribution-view">
                    <div className="honey-region-subtabs">
                      {t.regions.map((reg) => {
                        const isRegActive = honeyRegion === reg.id;
                        return (
                          <button
                            key={reg.id}
                            type="button"
                            className={`honey-region-pill ${isRegActive ? 'active' : ''}`}
                            onClick={() => setHoneyRegion(reg.id)}
                          >
                            <MapPin size={16} strokeWidth={2.4} className="honey-region-pin" />
                            <span>{reg.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="honey-dist-cards-list">
                      {currentRegionDists.map((dist) => {
                        const dInfo = dist[honeyLang] || dist.vi;
                        return (
                          <div key={dist.id} className="honey-dist-card">
                            <div
                              className="honey-dist-card-thumb"
                              onClick={() => handleOpenDistDetail(dist)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => e.key === 'Enter' && handleOpenDistDetail(dist)}
                            >
                              <img src={dist.image} alt={dInfo.name} />
                            </div>

                            <div className="honey-dist-card-info">
                              <div className="honey-dist-info-row">
                                <span className="honey-dist-row-icon">
                                  <Handshake size={15} strokeWidth={2.3} />
                                </span>
                                <p>
                                  <strong>{t.distLabels.unitName}</strong> {dInfo.name}
                                </p>
                              </div>

                              <div className="honey-dist-info-row">
                                <span className="honey-dist-row-icon">
                                  <MapPin size={15} strokeWidth={2.3} />
                                </span>
                                <p>
                                  <strong>{t.distLabels.address}</strong> {dInfo.address}
                                </p>
                              </div>

                              <div className="honey-dist-info-row">
                                <span className="honey-dist-row-icon">
                                  <Phone size={15} strokeWidth={2.3} />
                                </span>
                                <p>
                                  <strong>{t.distLabels.contact}</strong>{' '}
                                  <a href={`tel:${dInfo.phone.replace(/\s+/g, '')}`} className="honey-dist-phone-link">
                                    {dInfo.phone}
                                  </a>
                                </p>
                              </div>

                              <div className="honey-dist-info-row">
                                <span className="honey-dist-row-icon">
                                  <FileText size={15} strokeWidth={2.3} />
                                </span>
                                <p>
                                  <strong>{t.distLabels.intro}</strong> {dInfo.shortIntro}
                                </p>
                              </div>
                            </div>

                            <div className="honey-dist-card-action">
                              <button
                                type="button"
                                className="honey-dist-more-btn"
                                onClick={() => handleOpenDistDetail(dist)}
                              >
                                <span>{t.distLabels.btnMore}</span>
                                <ChevronRight size={15} strokeWidth={2.8} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* 5B. CHI TIẾT 1 ĐIỂM PHÂN PHỐI KHI BẤM "GIỚI THIỆU >" + NÚT BACK ĐỂ XEM ĐIỂM KHÁC */
                  <div className="honey-dist-detail-view">
                    <div className="honey-dist-detail-topbar">
                      <button
                        type="button"
                        className="honey-back-btn"
                        onClick={handleBackToDistList}
                      >
                        <ArrowLeft size={16} strokeWidth={2.5} />
                        <span>{t.distLabels.btnBackShort}</span>
                      </button>
                      <span className="honey-dist-detail-badge">{t.distLabels.detailTitle}</span>
                    </div>

                    <div className="honey-dist-detail-hero">
                      <img
                        src={selectedHoneyDist.image}
                        alt={distDetailData.name}
                        className="honey-dist-detail-img"
                      />
                      <div className="honey-dist-detail-summary">
                        <h3 className="honey-dist-detail-name">{distDetailData.name}</h3>
                        <div className="honey-dist-detail-meta">
                          <p><MapPin size={15} /> <strong>{t.distLabels.address}</strong> {distDetailData.address}</p>
                          <p><Phone size={15} /> <strong>{t.distLabels.contact}</strong> <a href={`tel:${distDetailData.phone.replace(/\s+/g, '')}`}>{distDetailData.phone}</a></p>
                          <p><Layers size={15} /> <strong>{t.distLabels.scaleLabel}</strong> {distDetailData.scale}</p>
                          <p><Sprout size={15} /> <strong>{t.distLabels.areaLabel}</strong> {distDetailData.foragingArea}</p>
                          <p><Award size={15} /> <strong>{t.distLabels.certLabel}</strong> {distDetailData.cert}</p>
                        </div>
                      </div>
                    </div>

                    <div className="honey-dist-detail-story">
                      {distDetailData.fullStory.map((paragraph, idx) => (
                        <p key={idx} className="honey-article-paragraph">
                          {paragraph}
                        </p>
                      ))}
                    </div>

                    <div className="honey-dist-detail-footer-actions">
                      <a
                        href={`tel:${distDetailData.phone.replace(/\s+/g, '')}`}
                        className="honey-call-dist-btn"
                      >
                        <Phone size={16} />
                        <span>{t.distLabels.callNow}: {distDetailData.phone}</span>
                      </a>

                      <button
                        type="button"
                        className="honey-back-btn honey-back-btn-bottom"
                        onClick={handleBackToDistList}
                      >
                        <ArrowLeft size={17} strokeWidth={2.6} />
                        <span>{t.distLabels.btnBack}</span>
                      </button>
                    </div>
                  </div>
                )
              ) : (
                /* 5C. NỘI DUNG BÀI VIẾT CỦA CÁC TAB: GIỚI THIỆU | ĐẶC SẮC | CÁCH DÙNG | THỔ NHƯỠNG | GIỐNG ONG */
                <div className="honey-article-view">
                  <div className="honey-article-header">
                    <h2 className="honey-article-title">{activeArticle.title}</h2>
                    <p className="honey-article-subtitle">{activeArticle.subtitle}</p>
                  </div>

                  <div className="honey-article-lead-box">
                    <p>{activeArticle.lead}</p>
                  </div>

                  <div className="honey-article-sections">
                    {activeArticle.sections.map((sec, idx) => (
                      <div key={idx} className="honey-article-section-card">
                        <h3 className="honey-article-sec-heading">{sec.heading}</h3>
                        {sec.body && <p className="honey-article-paragraph">{sec.body}</p>}
                        {sec.bullets && (
                          <ul className="honey-article-bullet-list">
                            {sec.bullets.map((b, bIdx) => (
                              <li key={bIdx}>
                                <CheckCircle2 size={16} className="honey-bullet-icon" />
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 6. FOOTER ĐẶC SẢN CAO NGUYÊN ĐÁ HÀ GIANG */}
          <div className="honey-footer-banner-wrap">
            <img
              src="/images/honey/honey_footer_banner.png"
              alt="Mật Ong Hoa Bạc Hà - Đặc Sản Cao Nguyên Đá Hà Giang"
              className="honey-footer-banner-img"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`product-info-page theme-${activeTheme}`}>
      {/* Enterprise Custom Domain Banner */}
      {isCustomDomain && customEnterprise && activeTheme !== 'honey' && !(activeTheme === 'appliance' && !isApplianceActivated) && (
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
      {activeTheme === 'honey' && renderHoneyView()}
      {(activeTheme === 'staycool' || activeTheme === 'vyphyto') && renderStayCoolView()}
      {activeTheme === 'medical' && renderMedicalView()}
      {activeTheme === 'appliance' && renderApplianceView()}
      {(activeTheme === 'functional_food' || activeTheme === 'food') && renderFoodView()}
      {activeTheme === 'agriculture' && renderAgricultureView()}
      {activeTheme === 'cosmetics' && renderCosmeticsView()}
      {activeTheme === 'ocop' && renderOcopView()}
      {activeTheme === 'default' && renderDefaultView()}

      {/* Thông tin KH sở hữu cho các theme ngành hàng (default, appliance, functional_food đã tự hiển thị) */}
      {activeTheme !== 'default' && activeTheme !== 'appliance' && activeTheme !== 'honey' && !isFoodTheme && hasOwnerInfo && (
        <div className="product-info-body owner-card-standalone">
          {renderOwnerInfoCard()}
        </div>
      )}

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
              {isFoodTheme && !isFoodActivated && activeModal !== 'product_detail' ? (
                <div style={{ textAlign: 'center', padding: '16px 8px' }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: '#fef3c7',
                      color: '#d97706',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px'
                    }}
                  >
                    <ShieldAlert size={30} />
                  </div>
                  <h5 style={{ margin: '0 0 8px', fontSize: '1.05rem', fontWeight: 800, color: '#92400e' }}>
                    Yêu cầu kích hoạt mã
                  </h5>
                  <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.55, margin: '0 0 16px' }}>
                    Tem Thực phẩm chức năng này chưa được kích hoạt mã. Người dùng quét khi chưa kích hoạt chỉ xem được <strong>Thông tin sản phẩm</strong>, không xem được <strong>Giấy công bố</strong> và các thông tin chi tiết khác.
                  </p>
                  <form onSubmit={handleApplianceActivate} style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
                    <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b' }}>
                      Nhập mã kích hoạt (Serial trên tem) để mở khóa toàn bộ thông tin:
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        placeholder="Nhập mã kích hoạt..."
                        value={applianceActiveCode}
                        onChange={(e) => {
                          setApplianceActiveCode(e.target.value);
                          setApplianceActivationError('');
                        }}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          borderRadius: 10,
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.9rem',
                          outline: 'none'
                        }}
                      />
                      <button
                        type="submit"
                        disabled={isActivatingAppliance}
                        style={{
                          background: '#15803d',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 10,
                          padding: '10px 16px',
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {isActivatingAppliance ? 'Đang xử lý...' : 'Kích hoạt'}
                      </button>
                    </div>
                    {applianceActivationError && (
                      <div style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 600 }}>
                        ⚠️ {applianceActivationError}
                      </div>
                    )}
                  </form>
                </div>
              ) : (
              <>
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
                        <div className="modal-info-item">
                          <span>Điểm bán / Đơn vị phân phối:</span>
                          <strong>{label?.distributorName || label?.ownerInfo?.name || mainDistributor}</strong>
                        </div>
                        <div className="modal-info-item">
                          <span>Địa chỉ:</span>
                          <strong>{label?.distributorAddress || label?.ownerInfo?.address || enterprise?.address || 'Toàn quốc'}</strong>
                        </div>
                        <div className="modal-info-item">
                          <span>Điện thoại liên hệ:</span>
                          <strong>{label?.ownerInfo?.phone || enterprise?.phone || '1900 1234'}</strong>
                        </div>
                        {(label?.distributedAt || label?.ownerInfo?.activatedAt) && (
                          <div className="modal-info-item">
                            <span>Thời gian xuất bán:</span>
                            <strong>{formatDate(label?.distributedAt || label?.ownerInfo?.activatedAt)}</strong>
                          </div>
                        )}
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
                  {/* Hiển thị số công bố nếu có */}
                  {product?.congBoNumber && (
                    <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: '#f0fdf4', border: '1.5px solid #6ee7b7', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '1.2rem' }}>🏷️</span>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Số công bố</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#065f46', marginTop: 2 }}>{product.congBoNumber}</div>
                      </div>
                    </div>
                  )}
                  {product?.congBoImages?.filter(img => img && img.trim()).length > 0 ? (
                    <div>
                      <p style={{ fontSize: '0.88rem', color: '#4b5563', marginBottom: 14, lineHeight: 1.5 }}>
                        Giấy tiếp nhận đăng ký bản công bố sản phẩm đã được xác nhận bởi cơ quan có thẩm quyền.
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {product.congBoImages.filter(img => img && img.trim()).map((img, idx) => (
                          <div
                            key={idx}
                            onClick={() => setPreviewImage(img)}
                            style={{
                              cursor: 'pointer',
                              borderRadius: 10,
                              overflow: 'hidden',
                              border: '1.5px solid #d1fae5',
                              background: '#f9fafb',
                              position: 'relative'
                            }}
                          >
                            <img
                              src={img}
                              alt={'Giấy công bố ' + (idx + 1)}
                              style={{ width: '100%', objectFit: 'contain', maxHeight: 340, display: 'block', background: '#fff' }}
                            />
                            <div style={{
                              padding: '6px 10px',
                              background: '#f0fdf4',
                              textAlign: 'center',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              color: '#059669',
                              borderTop: '1px solid #d1fae5',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 5
                            }}>
                              <Eye size={13} />
                              <span>Nhấn để xem phóng to</span>
                            </div>
                          </div>
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
                              {product?.name || ''}
                            </h5>
                            <p style={{ margin: 0, fontSize: '0.78rem', color: '#7c2d12' }}>
                              {product?.category || ''}
                            </p>
                          </div>
                        </div>
                        {product?.description && (
                          <p style={{ fontSize: '0.86rem', lineHeight: '1.6', color: '#334155', margin: '8px 0 0' }}>
                            {product.description}
                          </p>
                        )}
                      </div>

                      <div className="modal-info-list" style={{ marginBottom: 16 }}>
                        <div className="modal-info-item"><span>Tên sản phẩm:</span> <strong style={{ color: '#ea580c' }}>{product?.name || ''}</strong></div>
                        <div className="modal-info-item"><span>Đơn vị nhập khẩu:</span> <strong>{enterprise?.name || ''}</strong></div>
                        {product?.specifications?.['Quy cách'] && (
                          <div className="modal-info-item"><span>Quy cách đóng gói:</span> <strong>{product.specifications['Quy cách']}</strong></div>
                        )}
                        {formatDate(scanData?.label?.batchId?.expiryDate || label?.expiryDate) && (
                          <div className="modal-info-item"><span>Hạn sử dụng:</span> <strong>{formatDate(scanData?.label?.batchId?.expiryDate || label?.expiryDate)}</strong></div>
                        )}
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

                    {/* Ảnh giấy công bố (nếu có) — ẩn khi Thực phẩm chức năng chưa kích hoạt mã (Bước 6) */}
                    {(!isFoodTheme || isFoodActivated) && (product?.congBoNumber || product?.congBoImages?.filter(img => img && img.trim()).length > 0) && (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#00695C', marginBottom: 8 }}>Giấy công bố sản phẩm:</div>
                        {product?.congBoNumber && (
                          <div style={{ marginBottom: 10, padding: '8px 12px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #6ee7b7', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: '1rem' }}>🏷️</span>
                            <div>
                              <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700, textTransform: 'uppercase' }}>Số công bố</div>
                              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#065f46' }}>{product.congBoNumber}</div>
                            </div>
                          </div>
                        )}
                        {product?.congBoImages?.filter(img => img && img.trim()).length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {product.congBoImages.filter(img => img && img.trim()).map((img, idx) => (
                              <div
                                key={idx}
                                onClick={() => setPreviewImage(img)}
                                style={{ cursor: 'pointer', borderRadius: 8, overflow: 'hidden', border: '1px solid #d1fae5' }}
                              >
                                <img src={img} alt={'Giấy công bố ' + (idx + 1)} style={{ width: '100%', objectFit: 'contain', maxHeight: 300, display: 'block', background: '#fff' }} />
                                <div style={{ padding: '4px', textAlign: 'center', background: '#f0fdf4', fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                                  Nhấn để xem phóng to
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
              </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Chatbot Widget */}
      {enterprise?.chatbotConfig?.enabled !== false && !(activeTheme === 'appliance' && !isApplianceActivated) && (
        <div className="product-info-chatbot-widget">
          {!chatOpen ? (
            <button className="chatbot-toggle-btn" onClick={() => setChatOpen(true)}>
              <MessageSquare size={20} />
              <span>Tư vấn sản phẩm</span>
            </button>
          ) : (
            <div className="chatbot-window" style={{ width: 350, maxWidth: 'calc(100vw - 24px)', height: 480, maxHeight: '80vh' }}>
              <div className="chatbot-header">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Bot size={18} /> Tư vấn — {enterprise?.name ? enterprise.name.split(' ').slice(-2).join(' ') : 'Trợ lý AI'}
                </span>
                <button className="chatbot-close-btn" onClick={() => setChatOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="chatbot-messages" style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`chat-msg ${msg.sender}`}>
                    {msg.text}
                  </div>
                ))}

                {/* Bộ câu hỏi tự chọn gửi Chatbot (Chỉ áp dụng cho giao diện Thực phẩm chức năng) */}
                {isFoodTheme && presetQuestions.length > 0 && (
                  <div style={{ marginTop: 10, padding: '10px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Sparkles size={13} color="#ea580c" /> Bộ câu hỏi tự chọn (Bấm để gửi):
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {presetQuestions.map((qa, qIdx) => (
                        <button
                          key={qIdx}
                          type="button"
                          onClick={() => handleSelectPresetQuestion(qa)}
                          style={{
                            textAlign: 'left',
                            padding: '8px 11px',
                            borderRadius: 8,
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#1e293b',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            lineHeight: 1.35
                          }}
                        >
                          💬 {qa.question}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div ref={chatEndRef}></div>
              </div>
              <form onSubmit={handleSendMessage} className="chatbot-input-area">
                <input
                  type="text"
                  className="chatbot-input"
                  placeholder="Nhập câu hỏi hoặc chọn ở trên..."
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

      {/* Lightbox Preview Modal cho Ảnh Giấy công bố */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.88)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
        >
          <button
            onClick={() => setPreviewImage(null)}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: '#fff',
              width: 44,
              height: 44,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={26} />
          </button>
          <img
            src={previewImage}
            alt="Giấy công bố sản phẩm"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '96%',
              maxHeight: '85vh',
              objectFit: 'contain',
              borderRadius: 12,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
            }}
          />
          <p style={{ color: '#e2e8f0', fontSize: '0.86rem', marginTop: 12, textAlign: 'center' }}>
            Nhấn ra ngoài hoặc bấm dấu (X) để đóng
          </p>
        </div>
      )}
    </div>
  );
}
