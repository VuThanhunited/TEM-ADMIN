import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import './Namecard.css';

// ── Static namecard data (HHB Elevator — Thúy Hoàng) ────────────────────────
// Khi tích hợp backend: fetch từ /api/public/namecard/:slug
const STATIC_CARDS = {
  'thuy-hoang': {
    slug: 'thuy-hoang',
    name: 'Thúy Hoàng',
    title: '',
    company: 'HHB Elevator',
    bio: 'Kết nối – Giá trị – Bền lâu',
    mobile: '0947 19 8686',
    hotline: '0943 877 688',
    email: 'thuyhoang@hhbelevator.vn',
    website: 'www.hhbelevator.vn',
    websiteUrl: 'https://www.hhbelevator.vn',
    address: 'Số 9, đường 2.4, KĐT Gamuda Gardens, Hoàng Mai, Hà Nội',
    avatar: '',
    coverImage: '',
    themeColor: '#c9a84c',
    socialLinks: {},
    footerTags: ['UY TÍN', 'CHẤT LƯỢNG', 'CHUYÊN NGHIỆP', 'PHÁT TRIỂN'],
    vcard: `BEGIN:VCARD
VERSION:3.0
FN:Thúy Hoàng
ORG:HHB Elevator
TEL;TYPE=CELL:0947198686
TEL;TYPE=WORK:0943877688
EMAIL:thuyhoang@hhbelevator.vn
URL:https://www.hhbelevator.vn
ADR:;;Số 9, đường 2.4, KĐT Gamuda Gardens;Hoàng Mai;Hà Nội;;Việt Nam
END:VCARD`,
  }
};

// ── Fetch từ API (nếu có backend) ─────────────────────────────────────────
async function fetchNamecard(slug) {
  // 1. Thử fetch từ API backend để có dữ liệu mới nhất nếu được chỉnh sửa trong Admin
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

  // 2. Fallback sang static data (offline-capable)
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
TEL;TYPE=CELL:${phoneVal}
${hotlineVal ? `TEL;TYPE=WORK:${hotlineVal}\n` : ''}EMAIL:${card.email || ''}
URL:${card.websiteUrl || (card.website ? (card.website.startsWith('http') ? card.website : `https://${card.website}`) : '')}
ADR:;;${card.address || ''};;;Việt Nam
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

// ── Main Component ────────────────────────────────────────────────────────────
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
      // URL cố định trỏ đến domain chính thức
      qrUrlRef.current = `https://www.giaiphapqrcode.vn/namecard/${slug}`;
    })();
    return () => { mounted = false; };
  }, [slug]);

  // Vẽ QR code vào canvas sau khi card load xong và canvas đã mount
  useEffect(() => {
    if (!card || !qrCanvasRef.current || !qrUrlRef.current) return;
    QRCode.toCanvas(qrCanvasRef.current, qrUrlRef.current, {
      width: 130,
      margin: 1,
      color: {
        dark: '#1a1200',   // Màu module QR — đen nâu
        light: '#ffffff',  // Màu nền trắng
      },
      errorCorrectionLevel: 'M',
    }).catch(err => console.error('QR render error:', err));
  }, [card]);

  const getInitial = (name) => name?.charAt(0)?.toUpperCase() || '?';

  if (loading) {
    return (
      <div className="nc-page">
        <div className="nc-bg" />
        <div className="nc-loading">
          <div className="nc-spinner" />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Đang tải...</span>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="nc-page">
        <div className="nc-bg" />
        <div className="nc-loading">
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>🪪</div>
          <h2 style={{ color: 'var(--gold)', fontSize: '1.2rem', fontWeight: 700 }}>Không tìm thấy Namecard</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 8 }}>
            Link namecard không hợp lệ hoặc đã bị xóa.
          </p>
        </div>
      </div>
    );
  }

  const mobile = card.mobile || card.phone || '';
  const hotline = card.hotline || card.phone2 || '';

  return (
    <div className="nc-page">
      <div className="nc-bg" />
      <div className="nc-content">

        {/* ── Hero Banner ── */}
        <div className="nc-hero nc-animate nc-animate-d1">
          {card.coverImage
            ? <>
                <img src={card.coverImage} alt="cover" className="nc-hero-img" />
                <div className="nc-hero-gradient" />
              </>
            : <div className="nc-hero-default">
                {/* Gold world/globe SVG background element */}
                <svg width="160" height="160" viewBox="0 0 160 160" fill="none" style={{ opacity: 0.08 }}>
                  <circle cx="80" cy="80" r="78" stroke="#c9a84c" strokeWidth="1" />
                  <ellipse cx="80" cy="80" rx="40" ry="78" stroke="#c9a84c" strokeWidth="0.8" />
                  <ellipse cx="80" cy="80" rx="78" ry="30" stroke="#c9a84c" strokeWidth="0.8" />
                  <line x1="2" y1="80" x2="158" y2="80" stroke="#c9a84c" strokeWidth="0.6" />
                  <line x1="80" y1="2" x2="80" y2="158" stroke="#c9a84c" strokeWidth="0.6" />
                </svg>
              </div>
          }

          {/* Corner texts */}
          <div className="nc-corner-left">
            <span>Kết nối</span>
            <span>Giá trị</span>
            <span>Bền lâu</span>
          </div>
          <div className="nc-corner-right">
            {(card.footerTags || []).slice(0, 3).map((t, i) => (
              <span key={i}>{t}</span>
            ))}
          </div>
        </div>

        {/* ── Avatar ── */}
        <div className="nc-avatar-wrap nc-animate nc-animate-d2">
          <div className="nc-avatar-ring">
            <div className="nc-avatar-inner">
              {card.avatar
                ? <img src={card.avatar} alt={card.name} />
                : <span className="nc-avatar-placeholder">{getInitial(card.name)}</span>
              }
            </div>
          </div>
        </div>

        {/* ── Identity ── */}
        <div className="nc-identity nc-animate nc-animate-d2">
          <h1 className="nc-name">{card.name}</h1>
          {card.title && (
            <>
              <div className="nc-divider">
                <div className="nc-divider-line" />
                <span className="nc-divider-dot">— {card.title} —</span>
                <div className="nc-divider-line" />
              </div>
            </>
          )}
          {!card.title && (
            <div className="nc-divider">
              <div className="nc-divider-line" />
              <span className="nc-divider-dot">✦</span>
              <div className="nc-divider-line" />
            </div>
          )}
          {card.company && <div className="nc-company">{card.company}</div>}
          {card.bio && <div className="nc-bio">{card.bio}</div>}
        </div>

        {/* ── Save Contact Button ── */}
        <button className="nc-save-btn nc-animate nc-animate-d3" onClick={() => downloadVCard(card)}>
          <span className="nc-save-icon">👤+</span>
          LƯU DANH BẠ
        </button>

        {/* ── Quick Action Icons ── */}
        <div className="nc-quick-actions nc-animate nc-animate-d3">
          {mobile && (
            <a href={`tel:${mobile.replace(/\s/g, '')}`} className="nc-qa-item">
              <div className="nc-qa-circle">📞</div>
              <span className="nc-qa-label">Gọi điện</span>
            </a>
          )}
          {card.socialLinks?.zalo && (
            <a href={`https://zalo.me/${card.socialLinks.zalo}`} target="_blank" rel="noopener noreferrer" className="nc-qa-item">
              <div className="nc-qa-circle">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#c9a84c">
                  <text x="2" y="18" fontSize="15" fontWeight="bold" fontFamily="Arial">Z</text>
                </svg>
              </div>
              <span className="nc-qa-label">Zalo</span>
            </a>
          )}
          {card.email && (
            <a href={`mailto:${card.email}`} className="nc-qa-item">
              <div className="nc-qa-circle">✉️</div>
              <span className="nc-qa-label">Email</span>
            </a>
          )}
          {card.website && (
            <a href={card.websiteUrl || (card.website.startsWith('http') ? card.website : `https://${card.website}`)} target="_blank" rel="noopener noreferrer" className="nc-qa-item">
              <div className="nc-qa-circle">🌐</div>
              <span className="nc-qa-label">Website</span>
            </a>
          )}
          {card.address && (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(card.address)}`}
              target="_blank" rel="noopener noreferrer" className="nc-qa-item"
            >
              <div className="nc-qa-circle">📍</div>
              <span className="nc-qa-label">Chỉ đường</span>
            </a>
          )}
        </div>

        {/* ── Detail Contact Rows ── */}
        <div className="nc-details nc-animate nc-animate-d4">
          {mobile && (
            <a href={`tel:${mobile.replace(/\s/g, '')}`} className="nc-detail-row">
              <div className="nc-detail-icon">📱</div>
              <div className="nc-detail-text">
                <div className="nc-detail-label">Mobile</div>
                <div className="nc-detail-value">{mobile}</div>
              </div>
              <span className="nc-detail-arrow">›</span>
            </a>
          )}
          {hotline && (
            <a href={`tel:${hotline.replace(/\s/g, '')}`} className="nc-detail-row">
              <div className="nc-detail-icon">☎️</div>
              <div className="nc-detail-text">
                <div className="nc-detail-label">Hotline</div>
                <div className="nc-detail-value">{hotline}</div>
              </div>
              <span className="nc-detail-arrow">›</span>
            </a>
          )}
          {card.email && (
            <a href={`mailto:${card.email}`} className="nc-detail-row">
              <div className="nc-detail-icon">✉️</div>
              <div className="nc-detail-text">
                <div className="nc-detail-label">Email</div>
                <div className="nc-detail-value">{card.email}</div>
              </div>
              <span className="nc-detail-arrow">›</span>
            </a>
          )}
          {card.website && (
            <a href={card.websiteUrl || `https://${card.website}`} target="_blank" rel="noopener noreferrer" className="nc-detail-row">
              <div className="nc-detail-icon">🌐</div>
              <div className="nc-detail-text">
                <div className="nc-detail-label">Website</div>
                <div className="nc-detail-value">{card.website}</div>
              </div>
              <span className="nc-detail-arrow">›</span>
            </a>
          )}
          {card.address && (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(card.address)}`}
              target="_blank" rel="noopener noreferrer" className="nc-detail-row"
            >
              <div className="nc-detail-icon">📍</div>
              <div className="nc-detail-text">
                <div className="nc-detail-label">Địa chỉ</div>
                <div className="nc-detail-value">{card.address}</div>
              </div>
              <span className="nc-detail-arrow">›</span>
            </a>
          )}
        </div>

        {/* ── QR Code + Profile box ── */}
        <div className="nc-qr-section nc-animate nc-animate-d5">
          {/* QR — tự generate bằng qrcode library, không cần internet */}
          <div className="nc-qr-box">
            <div className="nc-qr-wrapper">
              <canvas
                ref={qrCanvasRef}
                className="nc-qr-canvas"
                title="Quét mã QR để xem namecard"
              />
            </div>
            <div className="nc-qr-caption">QUÉT MÃ ĐỂ KẾT NỐI</div>
          </div>

          {/* Profile / About box */}
          <a
            href={card.websiteUrl || `https://${card.website}`}
            target="_blank" rel="noopener noreferrer"
            className="nc-profile-box"
          >
            <div className="nc-profile-icon">👔</div>
            <div className="nc-profile-text">PROFILE{'\n'}DOANH NGHIỆP</div>
            <div className="nc-profile-arrow">›</div>
          </a>
        </div>

        {/* ── Footer ── */}
        <div className="nc-footer nc-animate nc-animate-d5">
          {(card.footerTags || ['UY TÍN', 'CHẤT LƯỢNG', 'CHUYÊN NGHIỆP', 'PHÁT TRIỂN']).map((tag, i) => (
            <div key={i} className="nc-footer-item">{tag}</div>
          ))}
        </div>

      </div>
    </div>
  );
}
