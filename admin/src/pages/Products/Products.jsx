import { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
  Package, Plus, Search, Edit, Trash2, X, Eye, XCircle, Upload, Link, Building2, ExternalLink, CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';
import './Products.css';
import Pagination from '../../components/Pagination';
import { useDebounce } from '../../hooks/useDebounce';

// Đọc file thành Data URL (Base64)
const readFileAsDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Không thể đọc file ảnh'));
    reader.readAsDataURL(file);
  });
};

// Nén ảnh tự động phía trình duyệt bằng HTML Canvas (tối đa 1280px, quality 0.82)
// Giúp giảm dung lượng từ 3-5MB xuống còn ~150-250KB, tải lên và lưu trữ siêu nhanh
const compressImageIfNeeded = (file) => {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) {
      return resolve(file);
    }
    // Nếu ảnh đã nhỏ hơn 400KB thì không cần nén thêm
    if (file.size <= 400 * 1024) {
      return resolve(file);
    }

    // Cơ chế an toàn: nếu sau 4 giây không nén xong thì trả về file gốc, không để bị treo
    const timeoutId = setTimeout(() => {
      resolve(file);
    }, 4000);

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const img = new window.Image();
          img.onload = () => {
            clearTimeout(timeoutId);
            try {
              const MAX_DIM = 1280;
              let width = img.width;
              let height = img.height;
              if (width > MAX_DIM || height > MAX_DIM) {
                if (width > height) {
                  height = Math.round((height * MAX_DIM) / width);
                  width = MAX_DIM;
                } else {
                  width = Math.round((width * MAX_DIM) / height);
                  height = MAX_DIM;
                }
              }
              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, width, height);
              canvas.toBlob((blob) => {
                if (blob && blob.size < file.size) {
                  const compressedFile = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
                    type: 'image/jpeg',
                    lastModified: Date.now()
                  });
                  resolve(compressedFile);
                } else {
                  resolve(file);
                }
              }, 'image/jpeg', 0.82);
            } catch (canvasErr) {
              clearTimeout(timeoutId);
              resolve(file);
            }
          };
          img.onerror = () => {
            clearTimeout(timeoutId);
            resolve(file);
          };
          img.src = e.target.result;
        } catch (imgErr) {
          clearTimeout(timeoutId);
          resolve(file);
        }
      };
      reader.onerror = () => {
        clearTimeout(timeoutId);
        resolve(file);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      clearTimeout(timeoutId);
      resolve(file);
    }
  });
};

// ── ImageInput: slot ảnh hỗ trợ cả URL lẫn upload từ thiết bị ──────────────
function ImageInput({ value, onChange, placeholder, index }) {
  const [mode, setMode] = useState('upload');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef();

  const hasValue = Boolean(value && typeof value === 'string' && value.trim());

  const handleFileChange = async (e) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;
    setUploadError('');
    setUploading(true);

    try {
      // Bước 1: Nén ảnh nếu ảnh nặng
      const file = await compressImageIfNeeded(rawFile);

      // Bước 2: Thử tải lên qua API backend
      let uploadedUrl = null;
      try {
        const result = await api.uploadImage(file);
        if (result && result.url) {
          uploadedUrl = result.url;
        }
      } catch (uploadErr) {
        console.warn('API upload qua server gặp sự cố, tự động dùng ảnh nén trực tiếp:', uploadErr);
      }

      // Bước 3: Nếu API trả về URL thì dùng, nếu không thì fallback chuyển thẳng sang Data URL
      if (uploadedUrl) {
        onChange(uploadedUrl);
      } else {
        const dataUrl = await readFileAsDataUrl(file);
        onChange(dataUrl);
      }
      setMode('upload');
    } catch (err) {
      // Trường hợp hiếm hoi cả nén và đọc file đều lỗi thì thử đọc file gốc
      try {
        const dataUrl = await readFileAsDataUrl(rawFile);
        onChange(dataUrl);
        setMode('upload');
      } catch (fallbackErr) {
        setUploadError(err.message || 'Lỗi tải ảnh');
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleClear = () => {
    onChange('');
    setUploadError('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          type="button"
          onClick={() => setMode('upload')}
          style={{
            padding: '3px 10px', borderRadius: 6, fontSize: '0.78rem', cursor: 'pointer',
            border: '1px solid',
            borderColor: mode === 'upload' ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)',
            background: mode === 'upload' ? 'rgba(99,102,241,0.15)' : 'transparent',
            color: mode === 'upload' ? 'var(--primary-color)' : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: 4
          }}
        >
          <Upload size={11} /> Tải từ thiết bị
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          style={{
            padding: '3px 10px', borderRadius: 6, fontSize: '0.78rem', cursor: 'pointer',
            border: '1px solid',
            borderColor: mode === 'url' ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)',
            background: mode === 'url' ? 'rgba(99,102,241,0.15)' : 'transparent',
            color: mode === 'url' ? 'var(--primary-color)' : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: 4
          }}
        >
          <Link size={11} /> Nhập URL trực tiếp
        </button>
        <input
          type="file"
          ref={fileRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      {mode === 'url' ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            className="input"
            style={{ flex: 1 }}
            placeholder={placeholder}
            value={value || ''}
            onChange={e => onChange(e.target.value)}
          />
          {hasValue && (
            <img
              src={value}
              alt={'Ảnh ' + (index + 1)}
              style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: '#fff' }}
              onError={e => { e.target.style.display = 'none'; }}
            />
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {hasValue ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flex: 1,
              padding: '6px 10px',
              borderRadius: 8,
              background: 'rgba(99,102,241,0.06)',
              border: '1px solid rgba(99,102,241,0.2)'
            }}>
              <img
                src={value}
                alt={'Ảnh ' + (index + 1)}
                style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 6, background: '#fff', border: '1px solid rgba(0,0,0,0.1)' }}
                onError={e => { e.target.style.display = 'none'; }}
              />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main, #e2e8f0)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={13} color="#22c55e" /> Ảnh đã tải lên
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {value.startsWith('data:') ? 'Ảnh từ thiết bị' : value}
                </div>
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: '0.78rem', cursor: 'pointer',
                  border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.1)',
                  color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: 4
                }}
              >
                <Upload size={12} /> {uploading ? 'Đang tải...' : 'Đổi ảnh'}
              </button>
              <button
                type="button"
                onClick={handleClear}
                title="Xóa ảnh này"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{
                flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer',
                border: '1px dashed rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.05)',
                color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontSize: '0.85rem'
              }}
            >
              {uploading ? (
                <><div className="loading-spinner" style={{ width: 14, height: 14 }} /> Đang tải...</>
              ) : (
                <><Upload size={14} /> Chọn ảnh từ thiết bị (JPG, PNG, WebP tối đa 5MB)</>
              )}
            </button>
          )}
        </div>
      )}

      {uploadError && (
        <span style={{ fontSize: '0.78rem', color: '#f87171' }}>{uploadError}</span>
      )}
    </div>
  );
}

// ── Session Cache Helper (SWR - Stale-While-Revalidate) ────────────────────────
const CACHE_PREFIX = 'tem_products_cache_v3_';
const getSessionCache = (page, search) => {
  if (search) return null; // Không dùng cache khi đang tìm kiếm
  try {
    const raw = sessionStorage.getItem(`${CACHE_PREFIX}${page}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.data) && parsed.data.length > 0 && Date.now() - parsed.ts < 10 * 60 * 1000) {
        return parsed;
      }
    }
  } catch (e) {}
  return null;
};

const setSessionCache = (page, search, data, pagination) => {
  if (search) return;
  try {
    sessionStorage.setItem(`${CACHE_PREFIX}${page}`, JSON.stringify({ data, pagination, ts: Date.now() }));
  } catch (e) {}
};

const clearSessionCache = () => {
  try {
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('tem_products_cache_')) sessionStorage.removeItem(key);
    });
  } catch (e) {}
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function Products() {
  const { isAdmin, enterpriseId } = useAuth();
  const initialCached = useRef(getSessionCache(1, '')).current;
  const [products, setProducts] = useState(initialCached ? initialCached.data : []);
  const [enterprises, setEnterprises] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(!initialCached);
  const [error, setError] = useState(null);
  const [modalDataLoading, setModalDataLoading] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [pagination, setPagination] = useState(initialCached ? initialCached.pagination : { page: 1, totalPages: 1, total: 0 });

  // Cache flag — chỉ gọi API 1 lần trong suốt session
  const modalDataLoadedRef = useRef(false);

  const MAX_IMAGES = 6;

  const initialForm = {
    name: '', description: '', category: '', sku: '', barcode: '',
    images: ['', '', '', '', '', ''], distributors: [], specifications: [], enterpriseId: '',
    verificationText: 'XÁC THỰC THÀNH CÔNG\nSản phẩm chính hãng',
    productionProcess: [],
    congBoImages: ['', '', ''],
    congBoNumber: '',
    producerInfo: '',
    distributorInfo: '',
    chatbotQA: [],
    manufacturerId: '',
    manufacturerInfo: '',
    distributionBannerText: ''
  };

  const [form, setForm] = useState({ ...initialForm });

  // Chỉ load products khi vào trang. Enterprises & Manufacturers được lazy-load khi mở modal.

  // Khi debouncedSearch thay đổi: reset về page 1
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [debouncedSearch]);

  // Load products khi page hoặc debouncedSearch thay đổi
  useEffect(() => {
    loadProducts();
  }, [pagination.page, debouncedSearch]);

  const loadProducts = async () => {
    const cached = getSessionCache(pagination.page, debouncedSearch);
    // Nếu có cache, cập nhật ngay để người dùng thấy sản phẩm tức thì (0ms)
    if (cached && products.length === 0) {
      setProducts(cached.data);
      setPagination(prev => ({ ...prev, ...(cached.pagination || {}) }));
      setLoading(false);
    } else if (!cached && products.length === 0) {
      setLoading(true);
    }
    setError(null);

    try {
      const result = await api.getProducts({ page: pagination.page, search: debouncedSearch, limit: 12 });
      if (result && Array.isArray(result.data)) {
        setProducts(result.data);
        setPagination(prev => ({ ...prev, ...(result.pagination || {}) }));
        setSessionCache(pagination.page, debouncedSearch, result.data, result.pagination);
      }
    } catch (err) {
      console.error('Lỗi khi tải sản phẩm:', err);
      // Nếu đã có dữ liệu cache trên màn hình thì không báo lỗi đơ trang
      if (products.length === 0 && (!cached || !cached.data?.length)) {
        setError(err.message || 'Không thể tải danh sách sản phẩm');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadEnterprises = async () => {
    try {
      const data = await api.getEnterprises();
      setEnterprises(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Lỗi tải doanh nghiệp:', err);
    }
  };

  const loadManufacturers = async () => {
    try {
      // Gọi song song 2 API, bỏ qua lỗi getDistributors
      const [mfgData, distResult] = await Promise.allSettled([
        api.getManufacturers(),
        api.getDistributors({ role: 'NSX', limit: 200 })
      ]);

      const mfgList = mfgData.status === 'fulfilled' && Array.isArray(mfgData.value) ? mfgData.value : [];
      const distList = distResult.status === 'fulfilled' && Array.isArray(distResult.value?.data) ? distResult.value.data : [];

      // Chuẩn hóa và gộp danh sách, loại bỏ trùng _id
      const map = new Map();
      mfgList.forEach(m => {
        if (m._id) map.set(String(m._id), m);
      });
      distList.forEach(d => {
        if (d._id && !map.has(String(d._id))) {
          map.set(String(d._id), {
            _id: d._id,
            name: d.fullName || d.name || '',
            address: d.address || '',
            phone: d.phone || '',
            email: d.email || '',
            partnerDetails: d.details || '',
            logo: d.logo || null,
            source: 'USER_NSX',
            isEnterprise: false
          });
        }
      });

      setManufacturers(Array.from(map.values()));
    } catch (err) {
      console.error('Lỗi tải NSX:', err);
    }
  };

  /**
   * Lazy-load dữ liệu cần thiết cho modal (enterprises + manufacturers).
   * Chỉ gọi API lần đầu, những lần sau dùng cache từ state hiện tại.
   */
  const ensureModalData = async () => {
    if (modalDataLoadedRef.current) return; // Đã tải rồi, bỏ qua
    setModalDataLoading(true);
    try {
      // Gọi song song tất cả, bỏ qua lỗi riêng lẻ
      const tasks = [
        api.getManufacturers().catch(() => []),
        api.getDistributors({ role: 'NSX', limit: 200 }).catch(() => ({ data: [] }))
      ];
      if (isAdmin) tasks.push(api.getEnterprises().catch(() => []));

      const results = await Promise.all(tasks);
      const [mfgData, distResult, entData] = results;

      const mfgList = Array.isArray(mfgData) ? mfgData : [];
      const distList = Array.isArray(distResult?.data) ? distResult.data : [];

      const map = new Map();
      mfgList.forEach(m => { if (m._id) map.set(String(m._id), m); });
      distList.forEach(d => {
        if (d._id && !map.has(String(d._id))) {
          map.set(String(d._id), {
            _id: d._id, name: d.fullName || d.name || '',
            address: d.address || '', phone: d.phone || '',
            email: d.email || '', partnerDetails: d.details || '',
            logo: d.logo || null, source: 'USER_NSX', isEnterprise: false
          });
        }
      });
      setManufacturers(Array.from(map.values()));
      if (isAdmin && Array.isArray(entData)) setEnterprises(entData);

      modalDataLoadedRef.current = true; // Đánh dấu đã tải xong
    } catch (err) {
      console.error('Lỗi tải dữ liệu modal:', err);
    } finally {
      setModalDataLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setModalError(null);
    setForm({ ...initialForm });
    setShowModal(true);
    ensureModalData(); // Lazy-load: chỉ gọi API khi mở modal
  };

  const openEdit = async (product) => {
    setEditing(product);
    setModalError(null);
    ensureModalData(); // Lazy-load: chỉ gọi API khi mở modal

    const populateForm = (p) => {
      const specList = p.specifications
        ? (p.specifications instanceof Map
            ? Array.from(p.specifications.entries()).map(([key, value]) => ({ key, value }))
            : typeof p.specifications === 'object'
              ? Object.entries(p.specifications).map(([key, value]) => ({ key, value }))
              : [])
        : [];

      let imgList = [...(p.images || [])];
      while (imgList.length < MAX_IMAGES) imgList.push('');

      let congBoImgs = [...(p.congBoImages || [])];
      while (congBoImgs.length < 3) congBoImgs.push('');

      setForm({
        name: p.name || '',
        description: p.description || '',
        category: p.category || '',
        sku: p.sku || '',
        barcode: p.barcode || '',
        images: imgList,
        distributors: p.distributors || [],
        specifications: specList,
        enterpriseId: p.enterpriseId?._id || p.enterpriseId || '',
        verificationText: p.verificationText || 'XÁC THỰC THÀNH CÔNG\nSản phẩm chính hãng',
        productionProcess: p.productionProcess || [],
        congBoImages: congBoImgs,
        congBoNumber: p.congBoNumber || '',
        producerInfo: p.producerInfo || '',
        distributorInfo: p.distributorInfo || '',
        chatbotQA: p.chatbotQA || [],
        manufacturerId: p.manufacturerId?._id || p.manufacturerId || '',
        manufacturerInfo: p.manufacturerInfo || '',
        distributionBannerText: p.distributionBannerText || ''
      });
    };

    populateForm(product);
    setShowModal(true);

    // Fetch full chi tiết sản phẩm để đảm bảo nạp đủ 100% dữ liệu gốc (congBoImages, productionProcess...)
    if (product._id) {
      setModalDataLoading(true);
      try {
        const fullProd = await api.getProduct(product._id);
        if (fullProd && (fullProd._id === product._id || fullProd.id === product._id)) {
          populateForm(fullProd);
        }
      } catch (err) {
        console.error('Lỗi lấy chi tiết sản phẩm:', err);
      } finally {
        setModalDataLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError(null);
    if (isAdmin && !form.enterpriseId) {
      setModalError('Vui lòng chọn doanh nghiệp sở hữu sản phẩm');
      return;
    }
    try {
      const specObj = form.specifications.reduce((acc, curr) => {
        if (curr.key.trim()) acc[curr.key.trim()] = curr.value;
        return acc;
      }, {});

      // Chỉ lấy ảnh hợp lệ: URL thực (http/https) hoặc data URL
      // Cảnh báo và từ chối ảnh base64 quá lớn (>5MB) để tránh vượt quá giới hạn tài nguyên
      const MAX_BASE64_SIZE = 5 * 1024 * 1024; // 5MB
      const cleanedImages = form.images.filter(img => {
        if (!img || !img.trim()) return false;
        if (img.startsWith('data:')) {
          // Kiểm tra kích thước base64
          if (img.length > MAX_BASE64_SIZE) {
            return false; // Bỏ qua ảnh base64 quá lớn
          }
        }
        return true;
      });

      // Kiểm tra xem có ảnh base64 quá lớn bị loại bỏ không
      const oversizedImages = form.images.filter(img => img?.startsWith('data:') && img.length > MAX_BASE64_SIZE);
      if (oversizedImages.length > 0) {
        setModalError(`⚠️ ${oversizedImages.length} ảnh bị loại do kích thước vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn hoặc dùng URL ảnh.`);
        return;
      }

      const data = {
        ...form,
        enterpriseId: isAdmin ? form.enterpriseId : enterpriseId,
        images: cleanedImages,
        specifications: specObj,
        manufacturerId: form.manufacturerId || null,
        manufacturerInfo: form.manufacturerInfo || '',
        congBoImages: (form.congBoImages || []).filter(img => img && img.trim()),
        congBoNumber: form.congBoNumber || '',
        clearImages: cleanedImages.length === 0,
        clearCongBoImages: (form.congBoImages || []).every(img => !img || !img.trim())
      };
      if (editing) {
        await api.updateProduct(editing._id, data);
      } else {
        await api.createProduct(data);
      }
      clearSessionCache();
      setShowModal(false);
      loadProducts();
    } catch (err) {
      setModalError(err.message || 'Lỗi lưu sản phẩm');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    try {
      await api.deleteProduct(id);
      clearSessionCache();
      loadProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const addSpecification = () => setForm({ ...form, specifications: [...form.specifications, { key: '', value: '' }] });
  const updateSpecification = (idx, field, value) => {
    const updated = [...form.specifications];
    updated[idx][field] = value;
    setForm({ ...form, specifications: updated });
  };
  const removeSpecification = (idx) => setForm({ ...form, specifications: form.specifications.filter((_, i) => i !== idx) });

  const addProductionStep = () => setForm({ ...form, productionProcess: [...form.productionProcess, { title: '', description: '', image: '' }] });
  const updateProductionStep = (idx, field, value) => {
    const steps = [...form.productionProcess];
    steps[idx][field] = value;
    setForm({ ...form, productionProcess: steps });
  };
  const removeProductionStep = (idx) => setForm({ ...form, productionProcess: form.productionProcess.filter((_, i) => i !== idx) });

  const addProductQA = () => setForm({ ...form, chatbotQA: [...form.chatbotQA, { question: '', answer: '' }] });
  const updateProductQA = (idx, field, value) => {
    const qas = [...form.chatbotQA];
    qas[idx][field] = value;
    setForm({ ...form, chatbotQA: qas });
  };
  const removeProductQA = (idx) => setForm({ ...form, chatbotQA: form.chatbotQA.filter((_, i) => i !== idx) });

  const selectedManufacturer = manufacturers.find(m => String(m._id) === String(form.manufacturerId));
  const partnerManufacturers = manufacturers.filter(m => m.source === 'USER_NSX' || !m.isEnterprise);
  const enterpriseManufacturers = manufacturers.filter(m => m.source === 'ENTERPRISE_NSX' || m.isEnterprise);

  const handleManufacturerSelect = (id, forceUpdate = true) => {
    const nsx = manufacturers.find(m => String(m._id) === String(id));
    if (!nsx) {
      setForm(prev => ({
        ...prev,
        manufacturerId: '',
        manufacturerInfo: ''
      }));
      return;
    }

    const parts = [
      nsx.name ? `Đơn vị sản xuất: ${nsx.name}` : '',
      nsx.address ? `Địa chỉ: ${nsx.address}` : '',
      nsx.phone ? `Hotline / ĐT: ${nsx.phone}` : '',
      nsx.email ? `Email: ${nsx.email}` : '',
      nsx.partnerDetails ? `Tiêu chuẩn / Giấy phép: ${nsx.partnerDetails.replace(/<[^>]*>?/gm, '').trim()}` : ''
    ].filter(Boolean);
    const autoInfo = parts.join('\n');

    setForm(prev => ({
      ...prev,
      manufacturerId: id,
      manufacturerInfo: forceUpdate ? autoInfo : (prev.manufacturerInfo || autoInfo)
    }));
  };


  return (
    <div className="products-page">
      <div className="page-header">
        <div>
          <h1>Quản lý Sản phẩm</h1>
          <p>Thêm, sửa, xóa sản phẩm và quản lý thông tin nhà sản xuất, điểm bán</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} /> Thêm sản phẩm
        </button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            className="input"
            placeholder="Tìm theo tên sản phẩm, mã SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearch('')}
              title="Xóa tìm kiếm"
            >
              <X size={15} />
            </button>
          )}
        </div>
        <span className="toolbar-count">{pagination.total} sản phẩm</span>
      </div>

      <div className="products-grid">
        {loading ? (
          <div className="loading-overlay"><div className="loading-spinner" style={{ width: 40, height: 40 }}></div></div>
        ) : error ? (
          <div className="empty-state">
            <XCircle size={48} color="#ef4444" style={{ marginBottom: 12 }} />
            <h3>Không thể tải danh sách sản phẩm</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>{error}</p>
            <button className="btn btn-primary" onClick={loadProducts}>
              Thử lại
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state"><Package size={60} /><h3>Chưa có sản phẩm nào</h3><p>Bấm "Thêm sản phẩm" để tạo mới</p></div>
        ) : (
          products.map(product => (
            <div key={product._id} className="product-card card animate-fade-in-up">
              <div className="product-image">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} />
                ) : (
                  <div className="product-image-placeholder"><ImageIcon size={32} /></div>
                )}
                <div className="product-overlay">
                  <button className="btn btn-sm btn-ghost" onClick={() => openEdit(product)} title="Sửa"><Edit size={14} /></button>
                  <button className="btn btn-sm btn-ghost" onClick={() => handleDelete(product._id)} title="Xóa"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <span className="product-category badge badge-neutral">{product.category || 'Chung'}</span>
                {product.sku && <span className="product-sku">SKU: {product.sku}</span>}
                <p className="product-desc">{product.description?.substring(0, 80)}{product.description?.length > 80 ? '...' : ''}</p>
                {product.manufacturerId && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Building2 size={11} /> NSX: {product.manufacturerId?.name || ''}
                  </span>
                )}
                {product.distributors?.length > 0 && (
                  <span className="product-dist">{product.distributors.length} điểm bán</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {pagination.totalPages > 1 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={(newPage) => setPagination(prev => ({ ...prev, page: newPage }))}
        />
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {editing ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
                {modalDataLoading && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                    <div className="loading-spinner" style={{ width: 12, height: 12 }} /> Đang tải dữ liệu...
                  </span>
                )}
              </h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {modalError && (
                  <div className="modal-error animate-fade-in" style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: 12, marginBottom: 16,
                    borderRadius: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)'
                  }}>
                    <XCircle size={18} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.9rem' }}>{modalError}</span>
                  </div>
                )}

                {isAdmin && (
                  <div className="input-group">
                    <label>Doanh nghiệp sở hữu *</label>
                    <select className="input select" value={form.enterpriseId} onChange={e => setForm({ ...form, enterpriseId: e.target.value })} required>
                      <option value="">-- Chọn doanh nghiệp --</option>
                      {enterprises.map(ent => <option key={ent._id} value={ent._id}>{ent.name}</option>)}
                    </select>
                  </div>
                )}

                <div className="input-group">
                  <label>Tên sản phẩm *</label>
                  <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-row">
                  <div className="input-group">
                    <label>Danh mục</label>
                    <input className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="VD: Nông sản, Thực phẩm, Dược phẩm..." />
                  </div>
                  <div className="input-group">
                    <label>Mã SKU</label>
                    <input className="input" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="VD: SP-001" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="input-group">
                    <label>Mã vạch (Barcode EAN/UPC)</label>
                    <input className="input" value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} placeholder="VD: 8931234567890" />
                  </div>
                  <div className="input-group">
                    <label>Dòng thông tin xác thực (CMS) <span style={{fontWeight:400, color:'var(--text-muted)', fontSize:'0.82em'}}>— Với sản phẩm OCOP: nhập text chứng nhận sao (VD: Sản Phẩm đạt tiêu chuẩn OCOP 3 sao)</span></label>
                    <input className="input" value={form.verificationText} onChange={e => setForm({ ...form, verificationText: e.target.value })} />
                  </div>
                </div>

                {/* Phần upload ảnh: Hỗ trợ URL và upload từ thiết bị */}
                <div className="input-group">
                  <label>Hình ảnh sản phẩm (Tối đa {MAX_IMAGES} ảnh — nhập URL hoặc tải từ thiết bị)</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {Array.from({ length: MAX_IMAGES }, (_, i) => i).map(i => (
                      <div key={i}>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                          Ảnh {i + 1}{i === 0 ? ' (Chính — bắt buộc)' : ' (Tùy chọn)'}
                        </div>
                        <ImageInput
                          index={i}
                          value={form.images[i] || ''}
                          placeholder={'Ảnh ' + (i + 1) + ' URL...'}
                          onChange={url => {
                            const imgs = [...form.images];
                            imgs[i] = url;
                            setForm({ ...form, images: imgs });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <label>Mô tả chi tiết sản phẩm</label>
                  <textarea className="input textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Mô tả công dụng, thành phần, đặc điểm nổi bật..." />
                </div>

                {/* Banner Nhập Khẩu & Phân Phối (Theo yêu cầu khách hàng: sửa tự động dòng cam) */}
                <div style={{ marginBottom: 20, background: 'rgba(234, 88, 12, 0.06)', border: '1.5px solid rgba(234, 88, 12, 0.3)', padding: '16px 18px', borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                    <label style={{ fontWeight: 700, fontSize: '0.9rem', color: '#ea580c', display: 'flex', alignItems: 'center', gap: 6 }}>
                      🏷️ Tiêu Đề Banner Nhập Khẩu & Phân Phối (Dòng chữ cam trên tem)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const ent = enterprises.find(e => e._id === (form.enterpriseId || enterpriseId)) || enterprises[0];
                        const entName = ent?.name || 'VYPHYTO';
                        setForm(prev => ({
                          ...prev,
                          distributionBannerText: `SẢN PHẨM CỦA ${entName.toUpperCase()} NHẬP KHẨU VÀ PHÂN PHỐI`
                        }));
                      }}
                      style={{ background: 'rgba(234, 88, 12, 0.12)', border: '1px solid #ea580c', color: '#ea580c', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
                      title="Bấm để tự động tạo tiêu đề theo tên Doanh nghiệp sở hữu"
                    >
                      ⚡ Tự động tạo theo Doanh nghiệp
                    </button>
                  </div>
                  <input
                    className="input"
                    value={form.distributionBannerText || ''}
                    onChange={e => setForm({ ...form, distributionBannerText: e.target.value })}
                    placeholder="VD: SẢN PHẨM CỦA VYPHYTO NHẬP KHẨU VÀ PHÂN PHỐI"
                    style={{ fontWeight: 600 }}
                  />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6, display: 'block', lineHeight: 1.4 }}>
                    Dòng chữ xuất hiện trên thanh banner màu cam ở trang xem thông tin tem. Nếu để trống, hệ thống sẽ tự động hiển thị: <em>SẢN PHẨM CỦA [TÊN DOANH NGHIỆP] NHẬP KHẨU VÀ PHÂN PHỐI</em>.
                  </span>
                </div>

                {/* NSX Section - Theo yêu cầu khách hàng: chọn NSX và bổ sung thông tin */}
                <div className="distributors-section" style={{ marginBottom: 20 }}>
                  <label style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6, marginBottom: '10px', color: 'var(--primary-color)' }}>
                    <Building2 size={16} /> Nhà Sản Xuất (NSX)
                  </label>

                  <div className="input-group" style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <label style={{ margin: 0 }}>Chọn Nhà Sản Xuất ({manufacturers.length} đơn vị có sẵn)</label>
                      <NavLink to="/distributors" target="_blank" style={{ fontSize: '0.78rem', color: 'var(--color-primary-light, #818cf8)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        + Thêm NSX mới trong Quản lý NSX <ExternalLink size={12} />
                      </NavLink>
                    </div>

                    <select 
                      className="input select" 
                      value={form.manufacturerId || ''} 
                      onChange={e => handleManufacturerSelect(e.target.value, true)}
                    >
                      <option value="">-- Không chọn / Nhập thủ công bên dưới --</option>
                      {partnerManufacturers.length > 0 && (
                        <optgroup label="🏢 Nhà Sản Xuất Đối Tác (từ Quản lý NSX / NPP / Điểm bán)">
                          {partnerManufacturers.map(m => (
                            <option key={m._id} value={m._id}>
                              {m.name} {m.address ? `— (${m.address})` : ''}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {enterpriseManufacturers.length > 0 && (
                        <optgroup label="🏭 Doanh Nghiệp Sở Hữu (từ Cấu hình Doanh nghiệp)">
                          {enterpriseManufacturers.map(m => (
                            <option key={m._id} value={m._id}>
                              {m.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>

                    {manufacturers.length === 0 && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                        Chưa có Nhà Sản Xuất trong danh sách. Bạn có thể nhập thông tin trực tiếp bên dưới hoặc thêm NSX trong menu "Quản lý NSX / NPP".
                      </span>
                    )}

                    {selectedManufacturer && (
                      <div style={{ marginTop: 10, padding: '12px 14px', borderRadius: 8, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <strong style={{ color: 'var(--color-primary-light, #818cf8)', fontSize: '0.92rem' }}>
                            🏢 {selectedManufacturer.name}
                          </strong>
                          <button
                            type="button"
                            onClick={() => handleManufacturerSelect(selectedManufacturer._id, true)}
                            style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '0.78rem', textDecoration: 'underline' }}
                          >
                            🔄 Tự động điền lại vào ô bên dưới
                          </button>
                        </div>
                        {selectedManufacturer.address && (
                          <div style={{ opacity: 0.85, marginTop: 2 }}>📍 Địa chỉ: {selectedManufacturer.address}</div>
                        )}
                        {selectedManufacturer.phone && (
                          <div style={{ opacity: 0.85, marginTop: 2 }}>📞 ĐT: {selectedManufacturer.phone}</div>
                        )}
                        {selectedManufacturer.email && (
                          <div style={{ opacity: 0.85, marginTop: 2 }}>✉️ Email: {selectedManufacturer.email}</div>
                        )}
                        {selectedManufacturer.partnerDetails && (
                          <div style={{ opacity: 0.75, marginTop: 4, fontSize: '0.8rem', fontStyle: 'italic' }}>
                            📋 {selectedManufacturer.partnerDetails.replace(/<[^>]*>?/gm, '').slice(0, 150)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="input-group">
                    <label>Thông tin bổ sung Nhà Sản Xuất (hiển thị trên trang quét QR)</label>
                    <textarea
                      className="input textarea"
                      rows={4}
                      placeholder={'VD: Công ty TNHH Sản Xuất Thực Phẩm ABC\nĐịa chỉ: Lô B2-3, KCN Thăng Long, Đông Anh, Hà Nội\nĐT: 024 6688 1234'}
                      value={form.manufacturerInfo || ''}
                      onChange={e => setForm({ ...form, manufacturerInfo: e.target.value })}
                    />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2, display: 'block' }}>
                      Thông tin này sẽ được hiển thị khi người tiêu dùng xem mục "Nhà sản xuất" trên trang quét mã QR.
                    </span>
                  </div>
                </div>

                {/* Giấy công bố sản phẩm */}
                <div className="distributors-section" style={{ marginBottom: 20 }}>
                  <label style={{ fontWeight: 600, fontSize: '0.9rem', display: 'block', marginBottom: '8px', color: 'var(--primary-color)' }}>
                    📄 Giấy tiếp nhận đăng ký bản công bố sản phẩm
                  </label>

                  {/* Số công bố */}
                  <div className="input-group" style={{ marginBottom: 14 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      🏷️ Số công bố (Mã số tiếp nhận)
                    </label>
                    <input
                      className="input"
                      placeholder="VD: 24/2025/ĐKSP-ATTP hay 0101/2024/ĐKBCB-TP..."
                      value={form.congBoNumber || ''}
                      onChange={e => setForm({ ...form, congBoNumber: e.target.value })}
                    />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                      Mã số trên giấy tiếp nhận đăng ký bản công bố sản phẩm — sẽ hiển thị trên trang quét QR.
                    </span>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                    Tải lên ảnh chụp / scan giấy công bố sản phẩm (tối đa 3 ảnh)
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {[0, 1, 2].map(i => (
                      <div key={i}>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                          Ảnh giấy công bố {i + 1}{i === 0 ? ' (Trang chính)' : ' (Tùy chọn)'}
                        </div>
                        <ImageInput
                          index={i}
                          value={form.congBoImages?.[i] || ''}
                          placeholder={'URL ảnh giấy công bố ' + (i + 1) + '...'}
                          onChange={url => {
                            const imgs = [...(form.congBoImages || ['', '', ''])];
                            imgs[i] = url;
                            setForm({ ...form, congBoImages: imgs });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quy trình sản xuất */}
                <div className="distributors-section" style={{ marginBottom: 20 }}>
                  <div className="section-header">
                    <label>Quy trình sản xuất (Từng bước thực hiện)</label>
                    <button type="button" className="btn btn-sm btn-ghost" onClick={addProductionStep}><Plus size={14} /> Thêm bước</button>
                  </div>
                  {form.productionProcess?.map((step, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 10, marginBottom: 8, alignItems: 'center' }}>
                      <input className="input" placeholder="Tên bước (VD: Gieo trồng)" value={step.title || ''} onChange={e => updateProductionStep(idx, 'title', e.target.value)} />
                      <input className="input" placeholder="Mô tả công việc của bước..." value={step.description || ''} onChange={e => updateProductionStep(idx, 'description', e.target.value)} />
                      <button type="button" className="btn-icon" onClick={() => removeProductionStep(idx)}><X size={16} /></button>
                    </div>
                  ))}
                </div>

                {/* Thông số kỹ thuật */}
                <div className="distributors-section" style={{ marginBottom: 20 }}>
                  <div className="section-header">
                    <label>Thông số kỹ thuật / Thuộc tính chung (VD: Trọng lượng, Hạn sử dụng...)</label>
                    <button type="button" className="btn btn-sm btn-ghost" onClick={addSpecification}><Plus size={14} /> Thêm thuộc tính</button>
                  </div>
                  {form.specifications?.map((spec, idx) => (
                    <div key={idx} className="distributor-row" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 10, marginBottom: 8, alignItems: 'center' }}>
                      <input className="input" placeholder="Tên thuộc tính (VD: Trọng lượng)" value={spec.key || ''} onChange={e => updateSpecification(idx, 'key', e.target.value)} />
                      <input className="input" placeholder="Giá trị (VD: 300g)" value={spec.value || ''} onChange={e => updateSpecification(idx, 'value', e.target.value)} />
                      <button type="button" className="btn-icon" onClick={() => removeSpecification(idx)}><X size={16} /></button>
                    </div>
                  ))}
                </div>

                {/* Chatbot Q&A */}
                <div className="distributors-section" style={{ marginBottom: 20 }}>
                  <div className="section-header">
                    <label>Hỏi - Đáp Chatbot sản phẩm (FAQ 1 câu hỏi - 1 câu trả lời)</label>
                    <button type="button" className="btn btn-sm btn-ghost" onClick={addProductQA}><Plus size={14} /> Thêm Q&A</button>
                  </div>
                  {form.chatbotQA?.map((qa, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr auto', gap: 10, marginBottom: 8, alignItems: 'center' }}>
                      <input className="input" placeholder="Câu hỏi của khách..." value={qa.question || ''} onChange={e => updateProductQA(idx, 'question', e.target.value)} />
                      <input className="input" placeholder="Câu trả lời của bot..." value={qa.answer || ''} onChange={e => updateProductQA(idx, 'answer', e.target.value)} />
                      <button type="button" className="btn-icon" onClick={() => removeProductQA(idx)}><X size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={modalDataLoading}>
                  {modalDataLoading ? 'Đang nạp dữ liệu...' : (editing ? 'Cập nhật' : 'Thêm mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
