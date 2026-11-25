import { useState, useEffect } from 'react';

let pdfJsLoadPromise = null;

const loadPdfJs = () => {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (pdfJsLoadPromise) return pdfJsLoadPromise;

  pdfJsLoadPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-pdfjs-cdn="true"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.pdfjsLib));
      existingScript.addEventListener('error', () => reject(new Error('Không thể tải PDF.js')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    script.dataset.pdfjsCdn = 'true';
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      } else {
        reject(new Error('PDF.js chưa sẵn sàng'));
      }
    };
    script.onerror = () => {
      pdfJsLoadPromise = null;
      reject(new Error('Không thể tải thư viện đọc PDF'));
    };
    document.head.appendChild(script);
  });

  return pdfJsLoadPromise;
};

/**
 * Hiển thị TOÀN BỘ các trang của file PDF theo dạng danh sách ảnh xếp dọc từ trang 1 -> trang cuối.
 * Hỗ trợ cuộn tự nhiên trên mọi thiết bị di động (iOS, Android, Zalo WebView) và máy tính,
 * đồng thời có nút Export / Tải file PDF về máy.
 */
export default function PdfAllPagesViewer({
  url,
  title = 'Tài liệu PDF',
  accentColor = '#15803d',
  borderColor = '#d1fae5',
  onPageClick = null
}) {
  const [pages, setPages] = useState([]);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fallbackIframe, setFallbackIframe] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let activeLoadingTask = null;
    let activePdf = null;

    const renderAllPages = async () => {
      if (!url) {
        setPages([]);
        setNumPages(0);
        setLoading(false);
        return;
      }

      setLoading(true);
      setFallbackIframe(false);
      setPages([]);
      setNumPages(0);

      try {
        const pdfjsLib = await loadPdfJs();
        activeLoadingTask = pdfjsLib.getDocument({ url, withCredentials: false });
        const pdf = await activeLoadingTask.promise;
        activePdf = pdf;
        if (cancelled) return;

        const total = pdf.numPages || 0;
        setNumPages(total);

        const renderedPages = [];
        for (let pageNum = 1; pageNum <= total; pageNum++) {
          if (cancelled) return;
          const page = await pdf.getPage(pageNum);
          const baseViewport = page.getViewport({ scale: 1 });
          const targetWidth = 960;
          const scale = Math.min(Math.max(targetWidth / baseViewport.width, 1.4), 2.4);
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);

          await page.render({ canvasContext: context, viewport }).promise;
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          canvas.width = 0;
          canvas.height = 0;
          renderedPages.push({ pageNum, dataUrl });

          if (!cancelled) {
            setPages([...renderedPages]);
          }
        }
      } catch (err) {
        console.warn('PdfAllPagesViewer fallback to iframe:', err?.message || err);
        if (!cancelled) {
          setFallbackIframe(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    renderAllPages();

    return () => {
      cancelled = true;
      try { activeLoadingTask?.destroy?.(); } catch {}
      try { activePdf?.destroy?.(); } catch {}
    };
  }, [url]);

  if (!url) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
          padding: '8px 12px',
          borderRadius: 8,
          background: '#f8fafc',
          border: `1px solid ${borderColor}`
        }}
      >
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
          📄 {title}{numPages > 0 ? ` (${numPages} trang)` : ''}
        </span>
        <a
          href={url}
          download
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '6px 12px',
            borderRadius: 8,
            background: accentColor,
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.8rem',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          ⬇️ Tải về / Export PDF
        </a>
      </div>

      {fallbackIframe ? (
        <iframe
          className="production-process-pdf"
          src={url}
          title={title}
          style={{ width: '100%', height: 480, border: `1px solid ${borderColor}`, borderRadius: 8, background: '#fff' }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
          {pages.map((p) => (
            <div
              key={p.pageNum}
              onClick={() => onPageClick && onPageClick(p.dataUrl)}
              style={{
                cursor: onPageClick ? 'pointer' : 'default',
                borderRadius: 8,
                overflow: 'hidden',
                border: `1px solid ${borderColor}`,
                background: '#fff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
              }}
            >
              <div
                style={{
                  padding: '4px 10px',
                  background: '#f1f5f9',
                  borderBottom: `1px solid ${borderColor}`,
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: '#475569',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>Trang {p.pageNum} / {numPages}</span>
                {onPageClick && <span style={{ color: accentColor }}>Chạm để phóng to</span>}
              </div>
              <img
                src={p.dataUrl}
                alt={`${title} - Trang ${p.pageNum}`}
                style={{ width: '100%', height: 'auto', display: 'block', background: '#fff' }}
              />
            </div>
          ))}

          {loading && (
            <div
              style={{
                padding: '18px 12px',
                textAlign: 'center',
                borderRadius: 8,
                border: `1px dashed ${borderColor}`,
                background: '#f8fafc',
                color: '#64748b',
                fontSize: '0.84rem'
              }}
            >
              {pages.length > 0
                ? `Đang tải tiếp các trang (${pages.length}/${numPages || '?'})...`
                : 'Đang tải đầy đủ các trang của file PDF...'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
