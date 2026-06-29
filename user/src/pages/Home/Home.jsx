import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Leaf, QrCode, ShieldCheck, Eye, Heart, Search,
  Phone, Mail, MapPin, Globe, Menu, X, ChevronRight,
  Sprout, Truck, PackageCheck, Users, CheckCircle,
  BarChart3, TrendingUp, Lock, ArrowRight, Scan,
  User, Sparkles, Battery, Wifi, Plus, Smartphone, Store, ArrowLeft, Clock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const { isLoggedIn, user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [traceCode, setTraceCode] = useState('');

  // Scroll handler for navbar
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll('.home-animate').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Smooth scroll to section
  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      const navHeight = 68;
      const top = el.getBoundingClientRect().top + window.scrollY - navHeight;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  // Handle trace code submit
  const handleTraceSubmit = (e) => {
    e.preventDefault();
    if (!traceCode.trim()) return;
    navigate(`/trace/${traceCode.trim()}`);
  };

  const navLinks = [
    { label: 'Trang chủ', id: 'hero' },
    { label: 'Giới thiệu', id: 'about' },
    { label: 'Lợi ích', id: 'benefits' },
    { label: 'Quy trình', id: 'process' },
    { label: 'Sản phẩm', id: 'hero' },
    { label: 'Tin tức', id: 'hero' },
    { label: 'Liên hệ', id: 'footer' },
  ];

  return (
    <div className="home-page">
      {/* ══ NAVBAR ══ */}
      <nav className={`home-navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="home-navbar-inner">
          <a href="#" className="home-navbar-logo" onClick={(e) => { e.preventDefault(); scrollToSection('hero'); }}>
            <div className="home-navbar-logo-icon">
              <Leaf size={22} />
            </div>
            <div className="home-navbar-logo-text">
              <span className="home-navbar-logo-title">TRUY XUẤT NGUỒN GỐC</span>
              <span className="home-navbar-logo-sub">Minh bạch · An toàn · Bền vững</span>
            </div>
          </a>

          <ul className="home-navbar-links">
            {navLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={`#${link.id}`}
                  onClick={(e) => { e.preventDefault(); scrollToSection(link.id); }}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {isLoggedIn ? (
            <div className="home-navbar-user-info">
              <span className="home-navbar-user-welcome">Xin chào, <strong>{user?.fullName || user?.username}</strong></span>
              <button className="home-navbar-logout-btn" onClick={logout}>Đăng xuất</button>
            </div>
          ) : (
            <a
              href="#"
              className="home-navbar-login-btn"
              onClick={(e) => { e.preventDefault(); navigate('/login'); }}
            >
              Đăng nhập
            </a>
          )}

          <a
            href="#"
            className="home-navbar-cta"
            onClick={(e) => { e.preventDefault(); scrollToSection('cta'); }}
          >
            <QrCode size={16} />
            Quét mã ngay
          </a>

          <button
            className="home-navbar-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`home-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        {navLinks.map((link) => (
          <a
            key={link.label}
            href={`#${link.id}`}
            onClick={(e) => { e.preventDefault(); scrollToSection(link.id); }}
          >
            {link.label}
          </a>
        ))}
        {isLoggedIn ? (
          <div className="home-mobile-user-info">
            <span className="home-mobile-user-welcome">Xin chào, {user?.fullName || user?.username}</span>
            <button className="home-mobile-logout-btn" onClick={() => { logout(); setMobileMenuOpen(false); }}>
              Đăng xuất
            </button>
          </div>
        ) : (
          <a
            href="#"
            className="home-mobile-login-btn"
            onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigate('/login'); }}
          >
            Đăng nhập
          </a>
        )}

        <a
          href="#"
          className="home-navbar-cta"
          onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); scrollToSection('cta'); }}
        >
          <QrCode size={16} />
          Quét mã ngay
        </a>
      </div>

      {/* ══ HERO SECTION ══ */}
      <section className="home-hero" id="hero">
        {/* Decorative backgrounds */}
        <div className="home-hero-deco home-hero-deco--left" />
        <div className="home-hero-deco home-hero-deco--right" />

        {/* Landscape at bottom */}
        <div className="home-hero-landscape">
          <img src="/images/hero_landscape.png" alt="" />
        </div>

        <div className="home-hero-inner">
          <div className="home-hero-content">
            <h1 className="home-hero-title">
              QR CODE
              <span>TRUY XUẤT NGUỒN GỐC</span>
            </h1>

            <p className="home-hero-subtitle">
              Minh bạch thông tin – Nâng tầm nông sản Việt
            </p>

            <p className="home-hero-desc">
              Giải pháp giúp doanh nghiệp công khai thông tin sản phẩm
              đến người tiêu dùng chỉ với một lần quét mã QR.
              <br />
              Xây dựng niềm tin – Khẳng định thương hiệu – Mở rộng thị trường.
            </p>

            <div className="home-hero-buttons">
              <button
                className="home-hero-btn home-hero-btn--primary"
                onClick={() => scrollToSection('cta')}
              >
                <Scan size={18} />
                Quét mã truy xuất
              </button>
              <button
                className="home-hero-btn home-hero-btn--outline"
                onClick={() => scrollToSection('about')}
              >
                Xem sản phẩm mẫu
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Phone mockup with real product image */}
          <div className="home-hero-visual">
            <div className="home-hero-phone">
              <div className="home-hero-phone-header">
                <h4>Thông tin sản phẩm</h4>
                <p>Truy xuất nguồn gốc chính hãng</p>
              </div>
              <div className="home-hero-phone-body">
                <div className="home-hero-phone-product">
                  <img src="/images/pomelo_product.png" alt="Sản phẩm mẫu" />
                </div>
                <div className="home-hero-phone-checklist">
                  <div className="home-hero-phone-check">
                    <div className="home-hero-phone-check-icon">
                      <CheckCircle size={12} />
                    </div>
                    Nguồn gốc rõ ràng
                  </div>
                  <div className="home-hero-phone-check">
                    <div className="home-hero-phone-check-icon">
                      <CheckCircle size={12} />
                    </div>
                    Quy trình minh bạch
                  </div>
                  <div className="home-hero-phone-check">
                    <div className="home-hero-phone-check-icon">
                      <CheckCircle size={12} />
                    </div>
                    Chất lượng đảm bảo
                  </div>
                  <div className="home-hero-phone-check">
                    <div className="home-hero-phone-check-icon">
                      <CheckCircle size={12} />
                    </div>
                    An tâm khi sử dụng
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ WHAT IS QR CODE SECTION ══ */}
      <section className="home-section" id="about">
        <div className="home-section-inner">
          <div className="home-section-header home-animate">
            <h2 className="home-section-title">QR CODE TRUY XUẤT NGUỒN GỐC LÀ GÌ?</h2>
            <p className="home-section-desc">
              Là giải pháp ứng dụng công nghệ để lưu trữ và công khai toàn bộ thông tin của sản phẩm
              trong suốt quá trình sản xuất, chế biến, đóng gói và phân phối đến tay người tiêu dùng.
            </p>
          </div>

          <div className="home-features-grid home-animate">
            <div className="home-feature-card">
              <div className="home-feature-icon home-feature-icon--qr">
                <QrCode size={28} />
              </div>
              <h3 className="home-feature-title">Một mã QR duy nhất</h3>
              <p className="home-feature-desc">
                Mỗi sản phẩm/lô sản phẩm sở hữu một mã QR riêng biệt, không thể sao chép.
              </p>
            </div>

            <div className="home-feature-card">
              <div className="home-feature-icon home-feature-icon--eye">
                <Eye size={28} />
              </div>
              <h3 className="home-feature-title">Thông tin minh bạch</h3>
              <p className="home-feature-desc">
                Hiển thị đầy đủ thông tin về nguồn gốc, quy trình, chứng nhận, kiểm định chất lượng.
              </p>
            </div>

            <div className="home-feature-card">
              <div className="home-feature-icon home-feature-icon--check">
                <ShieldCheck size={28} />
              </div>
              <h3 className="home-feature-title">Xác thực dễ dàng</h3>
              <p className="home-feature-desc">
                Người tiêu dùng chỉ cần quét mã để kiểm tra thông tin nhanh chóng, dễ dàng và chính xác.
              </p>
            </div>

            <div className="home-feature-card">
              <div className="home-feature-icon home-feature-icon--heart">
                <Heart size={28} />
              </div>
              <h3 className="home-feature-title">Tăng niềm tin</h3>
              <p className="home-feature-desc">
                Minh bạch thông tin giúp xây dựng uy tín thương hiệu và gia tăng lòng tin của khách hàng.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ PROCESS SECTION ══ */}
      <section className="home-section home-section--green-light" id="process">
        <div className="home-section-inner">
          <div className="home-section-header home-animate">
            <h2 className="home-section-title">QUY TRÌNH TRUY XUẤT NGUỒN GỐC</h2>
          </div>

          <div className="home-process-container home-animate">
            <div className="home-process-grid">
              <div className="home-process-step">
                <div className="home-process-step-icon home-process-step-icon--green">
                  <Sprout size={30} />
                </div>
                <h4 className="home-process-step-title">Vùng nguyên liệu</h4>
                <p className="home-process-step-desc">
                  Thông tin về vùng trồng, người sản xuất, giống, nhật ký canh tác.
                </p>
              </div>

              <div className="home-process-arrow">
                <ArrowRight size={18} />
              </div>

              <div className="home-process-step">
                <div className="home-process-step-icon home-process-step-icon--blue">
                  <PackageCheck size={30} />
                </div>
                <h4 className="home-process-step-title">Thu hoạch – Sơ chế</h4>
                <p className="home-process-step-desc">
                  Thời gian thu hoạch, quy trình sơ chế, kiểm tra chất lượng.
                </p>
              </div>

              <div className="home-process-arrow">
                <ArrowRight size={18} />
              </div>

              <div className="home-process-step">
                <div className="home-process-step-icon home-process-step-icon--orange">
                  <Lock size={30} />
                </div>
                <h4 className="home-process-step-title">Chế biến – Đóng gói</h4>
                <p className="home-process-step-desc">
                  Quy trình chế biến, đóng gói, tiêu chuẩn an toàn thực phẩm.
                </p>
              </div>

              <div className="home-process-arrow">
                <ArrowRight size={18} />
              </div>

              <div className="home-process-step">
                <div className="home-process-step-icon home-process-step-icon--teal">
                  <Truck size={30} />
                </div>
                <h4 className="home-process-step-title">Phân phối</h4>
                <p className="home-process-step-desc">
                  Thông tin vận chuyển, đơn vị phân phối, điểm bán.
                </p>
              </div>

              <div className="home-process-arrow">
                <ArrowRight size={18} />
              </div>

              <div className="home-process-step">
                <div className="home-process-step-icon home-process-step-icon--emerald">
                  <Users size={30} />
                </div>
                <h4 className="home-process-step-title">Người tiêu dùng</h4>
                <p className="home-process-step-desc">
                  Quét mã QR để xem toàn bộ hành trình của sản phẩm.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ BENEFITS SECTION ══ */}
      <section className="home-section" id="benefits">
        <div className="home-section-inner">
          <div className="home-section-header home-animate">
            <h2 className="home-section-title">LỢI ÍCH KHI SỬ DỤNG</h2>
          </div>

          <div className="home-benefits-grid home-animate">
            <div className="home-benefit-card">
              <div className="home-benefit-image">
                <img src="/images/benefit_safety.png" alt="Minh bạch an toàn" />
              </div>
              <div className="home-benefit-body">
                <h3 className="home-benefit-title">Minh bạch – An toàn</h3>
                <p className="home-benefit-desc">
                  Cung cấp thông tin rõ ràng, giúp người tiêu dùng an tâm lựa chọn.
                </p>
              </div>
            </div>

            <div className="home-benefit-card">
              <div className="home-benefit-image">
                <img src="/images/benefit_brand.png" alt="Nâng tầm thương hiệu" />
              </div>
              <div className="home-benefit-body">
                <h3 className="home-benefit-title">Nâng tầm thương hiệu</h3>
                <p className="home-benefit-desc">
                  Khẳng định uy tín và chất lượng sản phẩm trên thị trường.
                </p>
              </div>
            </div>

            <div className="home-benefit-card">
              <div className="home-benefit-image">
                <img src="/images/benefit_market.png" alt="Mở rộng thị trường" />
              </div>
              <div className="home-benefit-body">
                <h3 className="home-benefit-title">Mở rộng thị trường</h3>
                <p className="home-benefit-desc">
                  Dễ dàng đáp ứng yêu cầu truy xuất của các thị trường khó tính.
                </p>
              </div>
            </div>

            <div className="home-benefit-card">
              <div className="home-benefit-image">
                <img src="/images/benefit_management.png" alt="Quản lý hiệu quả" />
              </div>
              <div className="home-benefit-body">
                <h3 className="home-benefit-title">Quản lý hiệu quả</h3>
                <p className="home-benefit-desc">
                  Doanh nghiệp quản lý dữ liệu sản xuất, phân phối khoa học.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ NPP WORKFLOW SECTION ══ */}
      <section className="home-section home-section--npp-workflow" id="npp-workflow">
        <div className="home-section-inner">
          <div className="home-section-header home-animate">
            <h2 className="home-section-title">QUY TRÌNH NHẬP HÀNG BẰNG QR CODE</h2>
            <p className="home-section-desc" style={{ color: '#2E7D32', fontWeight: 600 }}>
              Mỗi lần quét QR Code tương ứng điểm bán nhập thêm 1 sản phẩm
            </p>
          </div>

          {/* Workflow Steps */}
          <div className="npp-steps-container home-animate">
            <div className="npp-step-item">
              <div className="npp-step-number">1</div>
              <div className="npp-step-icon-circle">
                <User size={24} />
              </div>
              <div className="npp-step-text">
                <h4>Đăng nhập</h4>
                <p>Đăng nhập bằng tài khoản nhà phân phối</p>
              </div>
            </div>

            <div className="npp-step-divider">--------&gt;</div>

            <div className="npp-step-item">
              <div className="npp-step-number">2</div>
              <div className="npp-step-icon-circle">
                <QrCode size={24} />
              </div>
              <div className="npp-step-text">
                <h4>Quét QR Code</h4>
                <p>Quét mã QR Code trên sản phẩm</p>
              </div>
            </div>

            <div className="npp-step-divider">--------&gt;</div>

            <div className="npp-step-item">
              <div className="npp-step-number">3</div>
              <div className="npp-step-icon-circle">
                <Store size={24} />
              </div>
              <div className="npp-step-text">
                <h4>Chọn điểm bán</h4>
                <p>Chọn điểm bán nhập hàng</p>
              </div>
            </div>

            <div className="npp-step-divider">--------&gt;</div>

            <div className="npp-step-item">
              <div className="npp-step-number">4</div>
              <div className="npp-step-icon-circle">
                <div style={{ position: 'relative' }}>
                  <PackageCheck size={24} />
                  <span className="npp-step-plus-badge">+1</span>
                </div>
              </div>
              <div className="npp-step-text">
                <h4>Nhập thêm 1 sản phẩm</h4>
                <p>Mỗi lần quét là điểm bán đó nhập thêm 1 sản phẩm</p>
              </div>
            </div>
          </div>

          {/* Phone Mockups Mocking the Zalo screenshot */}
          <div className="npp-phones-grid home-animate">
            {/* Phone 1: Login */}
            <div className="npp-phone-container">
              <div className="npp-phone-label-step">1</div>
              <div className="npp-phone-mockup">
                <div className="npp-phone-notch"></div>
                <div className="npp-phone-status-bar">
                  <span>9:41</span>
                  <div className="npp-phone-status-icons">
                    <Wifi size={10} />
                    <Battery size={12} />
                  </div>
                </div>
                <div className="npp-phone-screen npp-phone-screen--login">
                  <div className="npp-screen-header">Đăng nhập</div>
                  <div className="npp-screen-content">
                    <div className="npp-login-logo">
                      <Store size={36} color="#ffffff" />
                    </div>
                    <div className="npp-login-brand">NHÀ PHÂN PHỐI</div>
                    <div className="npp-login-sub">Quản lý nhập hàng</div>
                    <div className="npp-login-input">
                      <User size={14} className="npp-input-icon" />
                      <span>np_phucan</span>
                    </div>
                    <div className="npp-login-input">
                      <Lock size={14} className="npp-input-icon" />
                      <span>••••••••</span>
                      <Eye size={14} style={{ marginLeft: 'auto', color: '#999' }} />
                    </div>
                    <div className="npp-login-options">
                      <div className="npp-login-remember">
                        <input type="checkbox" checked readOnly />
                        <span>Ghi nhớ đăng nhập</span>
                      </div>
                      <span className="npp-login-forgot">Quên mật khẩu?</span>
                    </div>
                    <button className="npp-login-btn">Đăng nhập</button>
                    <div className="npp-login-footer">Phiên bản 1.0.0</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phone 2: Scan */}
            <div className="npp-phone-container">
              <div className="npp-phone-label-step">2</div>
              <div className="npp-phone-mockup">
                <div className="npp-phone-notch"></div>
                <div className="npp-phone-status-bar">
                  <span>9:41</span>
                  <div className="npp-phone-status-icons">
                    <Wifi size={10} />
                    <Battery size={12} />
                  </div>
                </div>
                <div className="npp-phone-screen npp-phone-screen--scan">
                  <div className="npp-screen-header">
                    <ArrowLeft size={16} />
                    <span>Quét QR Code</span>
                    <Sparkles size={14} style={{ opacity: 0.8 }} />
                  </div>
                  <div className="npp-screen-content npp-scan-content">
                    <div className="npp-scan-hint">Đưa mã QR vào khung để quét</div>
                    <div className="npp-scan-box-wrapper">
                      <div className="npp-scan-box">
                        <img src="/images/pomelo_product.png" alt="Sản phẩm quét" className="npp-scan-image" />
                        <div className="npp-scan-overlay-corners">
                          <div className="corner-tl"></div>
                          <div className="corner-tr"></div>
                          <div className="corner-bl"></div>
                          <div className="corner-br"></div>
                        </div>
                        <div className="npp-scan-line"></div>
                        <div className="npp-scan-qr-visual">
                          <QrCode size={48} style={{ opacity: 0.8 }} />
                        </div>
                      </div>
                    </div>
                    <div className="npp-scan-footer">
                      <Clock size={16} />
                      <span>Lịch sử quét</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phone 3: Select Store */}
            <div className="npp-phone-container">
              <div className="npp-phone-label-step">3</div>
              <div className="npp-phone-mockup">
                <div className="npp-phone-notch"></div>
                <div className="npp-phone-status-bar">
                  <span>9:41</span>
                  <div className="npp-phone-status-icons">
                    <Wifi size={10} />
                    <Battery size={12} />
                  </div>
                </div>
                <div className="npp-phone-screen npp-phone-screen--store">
                  <div className="npp-screen-header">
                    <ArrowLeft size={16} />
                    <span>Chọn điểm bán nhập hàng</span>
                  </div>
                  <div className="npp-screen-content">
                    <div className="npp-store-search">
                      <Search size={12} />
                      <span>Tìm kiếm điểm bán</span>
                    </div>
                    <div className="npp-store-list">
                      <div className="npp-store-item npp-store-item--active">
                        <div className="npp-radio active"></div>
                        <div className="npp-store-text">
                          <div className="npp-store-name">ĐIỂM BÁN 01 - TẠP HÓA ANH TUẤN</div>
                          <div className="npp-store-address">12 Đường số 5, P. Hiệp Bình, TP. Thủ Đức</div>
                        </div>
                      </div>
                      <div className="npp-store-item">
                        <div className="npp-radio"></div>
                        <div className="npp-store-text">
                          <div className="npp-store-name">ĐIỂM BÁN 02 - TẠP HÓA MINH CHÂU</div>
                          <div className="npp-store-address">45 Kha Vạn Cân, P. Linh Đông, TP. Thủ Đức</div>
                        </div>
                      </div>
                      <div className="npp-store-item">
                        <div className="npp-radio"></div>
                        <div className="npp-store-text">
                          <div className="npp-store-name">ĐIỂM BÁN 03 - TẠP HÓA HỒNG PHÁT</div>
                          <div className="npp-store-address">100 Phạm Văn Đồng, P. Linh Tây, TP. Thủ Đức</div>
                        </div>
                      </div>
                      <div className="npp-store-item">
                        <div className="npp-radio"></div>
                        <div className="npp-store-text">
                          <div className="npp-store-name">ĐIỂM BÁN 04 - TẠP HÓA BẢO AN</div>
                          <div className="npp-store-address">23 Quốc lộ 13, P. Hiệp Bình Phước, TP. Thủ Đức</div>
                        </div>
                      </div>
                      <div className="npp-store-item">
                        <div className="npp-radio"></div>
                        <div className="npp-store-text">
                          <div className="npp-store-name">ĐIỂM BÁN 05 - TẠP HÓA THANH HÀ</div>
                          <div className="npp-store-address">88 Đường số 7, P. Hiệp Bình Chánh, TP. Thủ Đức</div>
                        </div>
                      </div>
                    </div>
                    <button className="npp-store-btn">Xác nhận</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Phone 4: Success */}
            <div className="npp-phone-container">
              <div className="npp-phone-label-step">4</div>
              <div className="npp-phone-mockup">
                <div className="npp-phone-notch"></div>
                <div className="npp-phone-status-bar">
                  <span>9:41</span>
                  <div className="npp-phone-status-icons">
                    <Wifi size={10} />
                    <Battery size={12} />
                  </div>
                </div>
                <div className="npp-phone-screen npp-phone-screen--success">
                  <div className="npp-screen-header">
                    <ArrowLeft size={16} />
                    <span>Nhập hàng thành công</span>
                  </div>
                  <div className="npp-screen-content npp-success-content">
                    <div className="npp-success-badge-circle">
                      <CheckCircle size={28} color="#ffffff" />
                    </div>
                    <div className="npp-success-msg-title">Đã nhập thêm 1 sản phẩm cho điểm bán</div>
                    <div className="npp-success-msg-store">ĐIỂM BÁN 01 - TẠP HÓA ANH TUẤN</div>
                    
                    <div className="npp-success-prod-card">
                      <img src="/images/omo_detergent.png" alt="OMO" className="npp-success-prod-img" />
                      <div className="npp-success-prod-info">
                        <div className="npp-success-prod-name">Nước giặt OMO Matic Cửa trên</div>
                        <div className="npp-success-prod-sku">Mã hàng: OMOMATIC-3.6KG</div>
                      </div>
                    </div>

                    <div className="npp-success-time-row">
                      <span>Thời gian</span>
                      <span>20/05/2024 09:41:23</span>
                    </div>

                    <div className="npp-success-total-card">
                      <div className="npp-total-label">Tổng số sản phẩm đã nhập cho điểm bán này</div>
                      <div className="npp-total-num">24</div>
                    </div>

                    <div className="npp-success-buttons">
                      <button className="npp-btn-scan-again">
                        <QrCode size={12} />
                        Quét tiếp
                      </button>
                      <button className="npp-btn-change-store">Chọn điểm bán khác</button>
                      <button className="npp-btn-end">KẾT THÚC</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* New workflow specific benefits list */}
          <div className="npp-benefits-container">
            <h3 className="npp-benefits-title">LỢI ÍCH</h3>
            <div className="npp-benefits-grid">
              <div className="npp-benefit-item">
                <div className="npp-benefit-icon-wrapper">
                  <Sparkles size={20} />
                </div>
                <div className="npp-benefit-text">
                  <h4>Nhập hàng nhanh chóng</h4>
                  <p>Quét QR là nhập ngay 1 sản phẩm, tiết kiệm thời gian</p>
                </div>
              </div>
              <div className="npp-benefit-item">
                <div className="npp-benefit-icon-wrapper">
                  <Store size={20} />
                </div>
                <div className="npp-benefit-text">
                  <h4>Quản lý theo từng điểm bán</h4>
                  <p>Theo dõi số lượng nhập của từng điểm bán chính xác</p>
                </div>
              </div>
              <div className="npp-benefit-item">
                <div className="npp-benefit-icon-wrapper">
                  <BarChart3 size={20} />
                </div>
                <div className="npp-benefit-text">
                  <h4>Dữ liệu cập nhật tức thì</h4>
                  <p>Số lượng nhập được ghi nhận ngay lập tức trên hệ thống</p>
                </div>
              </div>
              <div className="npp-benefit-item">
                <div className="npp-benefit-icon-wrapper">
                  <CheckCircle size={20} />
                </div>
                <div className="npp-benefit-text">
                  <h4>Hạn chế sai sót</h4>
                  <p>Quét mã giúp giảm lỗi nhập liệu thủ công, tăng độ chính xác</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CTA SECTION ══ */}
      <section className="home-cta" id="cta">
        <div className="home-cta-inner home-animate">
          <h2 className="home-cta-title">BẮT ĐẦU TRUY XUẤT NGUỒN GỐC NGAY HÔM NAY</h2>
          <p className="home-cta-desc">
            Hãy quét mã QR trên sản phẩm hoặc nhập mã truy xuất để kiểm tra thông tin.
          </p>
          <form className="home-cta-form" onSubmit={handleTraceSubmit}>
            <input
              type="text"
              className="home-cta-input"
              placeholder="Nhập mã truy xuất (ID, mã lô,...)"
              value={traceCode}
              onChange={(e) => setTraceCode(e.target.value)}
              id="trace-code-input"
            />
            <button type="submit" className="home-cta-submit" id="trace-submit-btn">
              <Search size={18} />
              Kiểm tra ngay
            </button>
          </form>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="home-footer" id="footer">
        <div className="home-footer-inner">
          <div className="home-footer-item">
            <div className="home-footer-item-icon">
              <Phone size={18} />
            </div>
            <div>
              <div className="home-footer-item-label">Hotline</div>
              <div className="home-footer-item-value">0123 456 789</div>
            </div>
          </div>

          <div className="home-footer-item">
            <div className="home-footer-item-icon">
              <Mail size={18} />
            </div>
            <div>
              <div className="home-footer-item-label">Email</div>
              <div className="home-footer-item-value">info@truyxuatnguongoc.vn</div>
            </div>
          </div>

          <div className="home-footer-item">
            <div className="home-footer-item-icon">
              <MapPin size={18} />
            </div>
            <div>
              <div className="home-footer-item-label">Địa chỉ</div>
              <div className="home-footer-item-value">123 Đường ABC, Quận 1, TP. HCM</div>
            </div>
          </div>

          <div className="home-footer-item">
            <div className="home-footer-item-icon">
              <Globe size={18} />
            </div>
            <div>
              <div className="home-footer-item-label">Website</div>
              <div className="home-footer-item-value">www.truyxuatnguongoc.vn</div>
            </div>
          </div>
        </div>

        <div className="home-footer-bottom">
          © 2024 Truy Xuất Nguồn Gốc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
