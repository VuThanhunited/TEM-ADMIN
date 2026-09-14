import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import './Namecard.css';

// ── Static demo cards ────────────────────────────────────────────────────────
const STATIC_CARDS = {
  'thuy-hoang': {
    slug: 'thuy-hoang',
    name: 'THÚY HOÀNG',
    title: 'GIÁM ĐỐC',
    company: 'HHB ELEVATOR',
    bio: 'Kết nối – Giá trị – Bền lâu',
    mobile: '0947 19 8686',
    hotline: '0943 877 688',
    email: 'thuyhoang@hhbelevator.vn',
    website: 'www.hhbelevator.vn',
    websiteUrl: 'https://www.hhbelevator.vn',
    address: 'Số 9, đường 2.4, KĐT Gamuda Gardens, Hoàng Mai, Hà Nội',
    logo: '',
    avatar: '',
    coverImage: '',
    themeColor: '#c9a84c',
    socialLinks: { zalo: '0947198686' },
    footerTags: ['UY TÍN', 'HỢP TÁC', 'PHÁT TRIỂN', 'BỀN VỮNG'],
  },
  'nguyen-van-linh': {
    slug: 'nguyen-van-linh',
    name: 'NGUYỄN VĂN LINH',
    title: 'GIÁM ĐỐC',
    company: 'CÔNG TY TNHH MDQUEEN',
    bio: 'Vì sức khỏe cộng đồng',
    mobile: '0357 587 257',
    hotline: '',
    email: 'linh@mdqueen.vn',
    website: 'www.mdqueen.vn',
    websiteUrl: 'https://www.mdqueen.vn',
    address: 'Hà Nội, Việt Nam',
    logo: '',
    avatar: '',
    coverImage: '',
    themeColor: '#c9a84c',
    socialLinks: { zalo: '0357587257' },
    footerTags: ['SỨC KHỎE', 'CHẤT LƯỢNG', 'NIỀM TIN', 'TƯƠNG LAI'],
  }
};

// ── Fetch từ API hoặc static fallback ─────────────────────────────────────────
async function fetchNamecard(slug) {
  try {
    const API = import.meta.env.VITE_API_URL ||
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000/api'
        : '/api');
    const res = await fetch(`${API}/public/namecard/${slug}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.name) return data;
    }
  } catch (_) {}

  if (STATIC_CARDS[slug]) return STATIC_CARDS[slug];
  return null;
}

// ── vCard download ───────────────────────────────────────────────────────────
function downloadVCard(card) {
  const phoneVal = (card.mobile || card.phone || '').replace(/\s/g, '');
  const hotlineVal = (card.hotline || card.phone2 || '').replace(/\s/g, '');
  const vcfContent = card.vcard || `BEGIN:VCARD
VERSION:3.0
FN:${card.name}
ORG:${card.company || ''}
TITLE:${card.title || ''}
TEL;TYPE=CELL:${phoneVal}
${hotlineVal ? `TEL;TYPE=WORK:${hotlineVal}\n` : ''}EMAIL:${card.email || ''}
URL:${card.websiteUrl || (card.website ? (card.website.startsWith('http') ? card.website : `https://${card.website}`) : '')}
ADR:;;${card.address || ''};;;Việt Nam
NOTE:${card.bio || ''}
END:VCARD`;

  const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${card.name.replace(/\s+/g, '_')}.vcf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function Namecard() {
  const { slug } = useParams();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const qrCanvasRef = useRef(null);
  const qrUrlRef = useRef('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      const data = await fetchNamecard(slug);
      if (!mounted) return;
      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setCard(data);
      setLoading(false);
      qrUrlRef.current = `https://www.giaiphapqrcode.vn/namecard/${slug}`;
    })();
    return () => { mounted = false; };
  }, [slug]);

  // Render QR Code lên Canvas
  useEffect(() => {
    if (!card || !qrCanvasRef.current || !qrUrlRef.current) return;
    QRCode.toCanvas(qrCanvasRef.current, qrUrlRef.current, {
      width: 124,
      margin: 1,
      color: {
        dark: '#140e03',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    }).catch(err => console.error('QR render error:', err));
  }, [card]);

  if (loading) {
    return (
      <div className="nc-container">
        <div className="nc-loading-screen">
          <div className="nc-spinner-gold" />
          <span className="nc-loading-text">Đang tải danh thiếp...</span>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="nc-container">
        <div className="nc-loading-screen">
          <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>🪪</div>
          <h2 style={{ color: '#fedb72', fontSize: '1.25rem', fontWeight: 800 }}>Không tìm thấy Namecard</h2>
          <p style={{ color: '#a69575', fontSize: '0.88rem', marginTop: 8 }}>
            Liên kết danh thiếp không tồn tại hoặc đã bị xóa.
          </p>
        </div>
      </div>
    );
  }

  const mobile = card.mobile || card.phone || '';
  const hotline = card.hotline || card.phone2 || '';
  const zaloPhone = card.socialLinks?.zalo || mobile;
  const websiteUrl = card.websiteUrl || (card.website ? (card.website.startsWith('http') ? card.website : `https://${card.website}`) : '#');

  // Xác định ảnh hiển thị ở badge trên đỉnh và profile card dưới
  const topImage = card.logo || card.avatar || '';
  const bottomAvatar = card.avatar || '';

  return (
    <div className="nc-viewport">
      {/* ── Outer Smartphone Frame on Desktop ── */}
      <div className="nc-phone-frame">
        {/* Background ambient lighting & luxury textures */}
        <div className="nc-bg-ambient" />
        <div className="nc-bg-executive" />
        <div className="nc-bg-gold-waves" />
        <div className="nc-bg-sparkles" />

        <div className="nc-inner-content">
          {/* ── Top Header with Calligraphy & Badges ── */}
          <div className="nc-top-header">
            {/* Top-left calligraphy text */}
            <div className="nc-calligraphy-left">
              <span>Kết nối</span>
              <span>Giá trị</span>
              <span>Bền lâu</span>
            </div>

            {/* Center Circular Logo/Avatar Badge */}
            <div className="nc-center-badge-wrap">
              <div className="nc-badge-outer-glow">
                <div className="nc-badge-gold-ring">
                  <div className="nc-badge-inner-circle">
                    {topImage ? (
                      <img
                        src={topImage}
                        alt={card.name}
                        className={card.logo ? 'nc-badge-logo-img' : 'nc-badge-avatar-img'}
                      />
                    ) : (
                      /* Monogram / Luxury Emblem */
                      <div className="nc-badge-default-emblem">
                        <svg width="76" height="76" viewBox="0 0 100 100" fill="none">
                          <circle cx="50" cy="50" r="46" stroke="#d4af37" strokeWidth="1.5" strokeDasharray="4 2" />
                          <path d="M50 18C41 33 35 48 48 70C55 58 61 41 50 18Z" fill="#15803d" />
                          <path d="M53 22C61 36 67 50 54 72C61 60 65 44 53 22Z" fill="#d4af37" />
                          <text x="50" y="86" textAnchor="middle" fill="#8c6413" fontSize="8.5" fontWeight="900" letterSpacing="0.5">
                            {card.company ? card.company.split(' ').slice(0, 2).join(' ') : 'VIP'}
                          </text>
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Top-right badges */}
            <div className="nc-badges-right">
              <span>UY TÍN</span>
              <span>HỢP TÁC</span>
              <span>PHÁT TRIỂN</span>
            </div>
          </div>

          {/* ── Identity Section ── */}
          <div className="nc-identity-section">
            <h1 className="nc-name-gold">{card.name}</h1>

            <div className="nc-title-row">
              <div className="nc-gold-line" />
              <span className="nc-title-text">{card.title || 'GIÁM ĐỐC'}</span>
              <div className="nc-gold-line" />
            </div>

            <div className="nc-company-name">{card.company || 'CÔNG TY TNHH MDQUEEN'}</div>
            {card.bio && <div className="nc-bio-slogan">{card.bio}</div>}
          </div>

          {/* ── Button LƯU DANH BẠ ── */}
          <div className="nc-save-btn-wrap">
            <button className="nc-save-vcard-btn" onClick={() => downloadVCard(card)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#fedb72" className="nc-save-icon">
                <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0-6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 8c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zm6 4H9c.22-.72 3.31-2 6-2 2.7 0 5.8 1.29 6 2zM5 8v2h3v2H5v2H3v-2H0v-2h3V8h2z" />
              </svg>
              <span>LƯU DANH BẠ</span>
            </button>
          </div>

          {/* ── 5 Quick Action Circles ── */}
          <div className="nc-quick-grid">
            {/* 1. Gọi điện */}
            <a href={`tel:${mobile.replace(/\s/g, '')}`} className="nc-quick-btn" title="Gọi điện">
              <div className="nc-circle-rim">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#fedb72">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                </svg>
              </div>
              <span className="nc-quick-label">Gọi điện</span>
            </a>

            {/* 2. Zalo */}
            <a
              href={`https://zalo.me/${zaloPhone.replace(/\s/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="nc-quick-btn"
              title="Nhắn Zalo"
            >
              <div className="nc-circle-rim">
                <svg width="34" height="24" viewBox="0 0 48 34" fill="none">
                  <rect x="2" y="2" width="44" height="30" rx="15" stroke="#fedb72" strokeWidth="2.5" />
                  <text x="24" y="21.5" textAnchor="middle" fill="#fedb72" fontSize="12.5" fontWeight="900" fontFamily="sans-serif">Zalo</text>
                </svg>
              </div>
              <span className="nc-quick-label">Zalo</span>
            </a>

            {/* 3. Email */}
            <a href={`mailto:${card.email}`} className="nc-quick-btn" title="Gửi Email">
              <div className="nc-circle-rim">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#fedb72">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              </div>
              <span className="nc-quick-label">Email</span>
            </a>

            {/* 4. Website */}
            <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="nc-quick-btn" title="Mở Website">
              <div className="nc-circle-rim">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fedb72" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <span className="nc-quick-label">Website</span>
            </a>

            {/* 5. Chỉ đường */}
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(card.address || '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="nc-quick-btn"
              title="Chỉ đường Google Maps"
            >
              <div className="nc-circle-rim">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#fedb72">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </div>
              <span className="nc-quick-label">Chỉ đường</span>
            </a>
          </div>

          {/* ── Detail Contact Cards ── */}
          <div className="nc-cards-list">
            {mobile && (
              <a href={`tel:${mobile.replace(/\s/g, '')}`} className="nc-contact-card">
                <div className="nc-card-icon-circle">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fedb72">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                  </svg>
                </div>
                <div className="nc-card-content">
                  <div className="nc-card-lbl">Số điện thoại</div>
                  <div className="nc-card-val">{mobile}</div>
                </div>
                <span className="nc-card-arrow">›</span>
              </a>
            )}

            {hotline && (
              <a href={`tel:${hotline.replace(/\s/g, '')}`} className="nc-contact-card">
                <div className="nc-card-icon-circle">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fedb72">
                    <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1.02 1.02 0 0 0-1.02.24l-2.2 2.2a15.045 15.045 0 0 1-6.59-6.59l2.2-2.21a.96.96 0 0 0 .25-1A11.36 11.36 0 0 1 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1zM19 12h2a9 9 0 0 0-9-9v2c3.87 0 7 3.13 7 7zm-4 0h2c0-2.76-2.24-5-5-5v2c1.66 0 3 1.34 3 3z" />
                  </svg>
                </div>
                <div className="nc-card-content">
                  <div className="nc-card-lbl">Hotline</div>
                  <div className="nc-card-val">{hotline}</div>
                </div>
                <span className="nc-card-arrow">›</span>
              </a>
            )}

            {card.email && (
              <a href={`mailto:${card.email}`} className="nc-contact-card">
                <div className="nc-card-icon-circle">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fedb72">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                </div>
                <div className="nc-card-content">
                  <div className="nc-card-lbl">Email</div>
                  <div className="nc-card-val">{card.email}</div>
                </div>
                <span className="nc-card-arrow">›</span>
              </a>
            )}

            {card.website && (
              <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="nc-contact-card">
                <div className="nc-card-icon-circle">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fedb72" strokeWidth="2.2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>
                <div className="nc-card-content">
                  <div className="nc-card-lbl">Website</div>
                  <div className="nc-card-val">{card.website}</div>
                </div>
                <span className="nc-card-arrow">›</span>
              </a>
            )}

            {card.address && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(card.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="nc-contact-card"
              >
                <div className="nc-card-icon-circle">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fedb72">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                </div>
                <div className="nc-card-content">
                  <div className="nc-card-lbl">Địa chỉ</div>
                  <div className="nc-card-val">{card.address}</div>
                </div>
                <span className="nc-card-arrow">›</span>
              </a>
            )}
          </div>

          {/* ── Bottom Dual Cards: QR Code & Profile Doanh Nhân ── */}
          <div className="nc-dual-box-row">
            {/* Box Left: QR Code */}
            <div className="nc-gold-box nc-qr-card">
              <div className="nc-qr-white-frame">
                <canvas ref={qrCanvasRef} className="nc-qr-canvas" />
              </div>
              <div className="nc-box-caption">QUÉT MÃ ĐỂ KẾT NỐI</div>
            </div>

            {/* Box Right: Profile Doanh Nhân */}
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="nc-gold-box nc-profile-card"
            >
              {bottomAvatar ? (
                <div className="nc-profile-avatar-wrap">
                  <img src={bottomAvatar} alt="Avatar" className="nc-profile-avatar-img" />
                </div>
              ) : (
                <div className="nc-suit-silhouette">
                  <svg width="58" height="58" viewBox="0 0 64 64" fill="none">
                    <circle cx="32" cy="17" r="10" fill="url(#goldGrad)" />
                    <path d="M14 54C14 38 22 31 32 31C42 31 50 38 50 54" fill="url(#goldGrad)" />
                    <path d="M25 31L32 44L39 31" stroke="#161005" strokeWidth="2.5" fill="#fedb72" />
                    <polygon points="32,35 34.5,43 32,50 29.5,43" fill="#8c6413" />
                    <defs>
                      <linearGradient id="goldGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#fff7d6" />
                        <stop offset="0.4" stopColor="#fedb72" />
                        <stop offset="0.8" stopColor="#d4af37" />
                        <stop offset="1" stopColor="#8c6413" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              )}

              <div className="nc-profile-heading">
                <span>PROFILE</span>
                <strong>DOANH NHÂN</strong>
              </div>

              <div className="nc-profile-arrow-circle">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#110d04" strokeWidth="3.5" strokeLinecap="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </a>
          </div>

          {/* ── Footer ── */}
          <div className="nc-footer-wrap">
            <div className="nc-footer-emblem">
              <svg width="34" height="22" viewBox="0 0 34 22" fill="none">
                <path d="M17 20C17 20 10 13 10 7C10 3.5 13 1.5 17 1.5C21 1.5 24 3.5 24 7C24 13 17 20 17 20Z" fill="#fedb72" />
                <path d="M8 17C8 17 2.5 11.5 2.5 6C2.5 2.5 5.5 1.5 8 1.5C10.5 1.5 13.5 3.5 13.5 7C13.5 11.5 8 17 8 17Z" fill="#d4af37" opacity="0.8" />
                <path d="M26 17C26 17 31.5 11.5 31.5 6C31.5 2.5 28.5 1.5 26 1.5C23.5 1.5 20.5 3.5 20.5 7C20.5 11.5 26 17 26 17Z" fill="#d4af37" opacity="0.8" />
              </svg>
            </div>
            <div className="nc-footer-tags-line">
              {(card.footerTags || ['SỨC KHỎE', 'CHẤT LƯỢNG', 'NIỀM TIN', 'TƯƠNG LAI']).join('   |   ')}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
