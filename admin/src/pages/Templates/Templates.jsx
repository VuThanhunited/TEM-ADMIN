import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
  Palette, Plus, X, Save, Eye, Trash2, CheckCircle, XCircle, FileText,
  Settings, ShieldCheck, Package, RotateCcw, ChevronDown, ChevronUp,
  Smartphone, Search, Sparkles, Building2, Layers
} from 'lucide-react';
import {
  THEME_LIST,
  DEFAULT_THEME_CONTENTS,
  THEME_EDITOR_SECTIONS,
  resolveCanonicalThemeKey,
  getMergedThemeContent
} from '../../config/themeDefaultContents';
import './Templates.css';

const defaultContentConfig = {
  headerTitle1: 'GIẢI PHÁP QRcode',
  headerTitle2: 'TEM BẢO HÀNH SẢN PHẨM',
  transparencyLine1: 'SẢN PHẨM ĐÃ ĐƯỢC NHÀ CUNG CẤP',
  transparencyLine2: 'CAM KẾT MINH BẠCH THÔNG TIN',
  spec1Label: 'Dung tích',
  spec1Value: '1.8L',
  spec2Label: 'Công suất',
  spec2Value: '1200W',
  spec3Label: 'Lòng nồi',
  spec3Value: 'Inox 304',
  spec4Label: 'Bảo hành',
  spec4Value: '24 tháng',
  benefit1Title: 'ĐẢM BẢO CHÍNH HÃNG',
  benefit1Desc: 'Xác thực nguồn gốc, nói không với hàng giả',
  benefit2Title: 'BẢO HÀNH ĐIỆN TỬ',
  benefit2Desc: 'Kích hoạt và tra cứu bảo hành nhanh chóng',
  benefit3Title: 'HỖ TRỢ NHANH CHÓNG',
  benefit3Desc: 'Tiếp nhận yêu cầu và hỗ trợ kịp thời',
  benefit4Title: 'ƯU ĐÃI ĐẶC QUYỀN',
  benefit4Desc: 'Nhận thông tin khuyến mãi, ưu đãi hấp dẫn',
  benefit5Title: 'BẢO VỆ QUYỀN LỢI',
  benefit5Desc: 'An tâm sử dụng, bảo vệ quyền lợi người tiêu dùng',
  manufacturerNote: 'HOMEPLUS là thương hiệu uy tín chuyên cung cấp các sản phẩm gia dụng, thiết bị nhà bếp và thiết bị vệ sinh chất lượng cao, đáp ứng tiêu chuẩn quốc tế, đem lại tiện nghi và an toàn cho mọi gia đình.'
};

export default function Templates() {
  const { isAdmin, enterpriseId } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [enterprises, setEnterprises] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState('basic');
  const [editing, setEditing] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [modalError, setModalError] = useState(null);

  // Quick On/Off Toggle for Related Products & Selected Enterprise
  const [selectedEnterpriseId, setSelectedEnterpriseId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [togglingRelated, setTogglingRelated] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Theme Content Builder states (8 giao diện)
  const [selectedThemeKey, setSelectedThemeKey] = useState('appliance');
  const [themeDraft, setThemeDraft] = useState({ ...DEFAULT_THEME_CONTENTS.appliance });
  const [savingThemeContent, setSavingThemeContent] = useState(false);
  const [setAsDefaultTheme, setSetAsDefaultTheme] = useState(false);
  const [fieldSearch, setFieldSearch] = useState('');
  const [collapsedSections, setCollapsedSections] = useState({});
  const [activeSectionFilter, setActiveSectionFilter] = useState('all');

  const [form, setForm] = useState({
    name: '', primaryColor: '#0d47a1', secondaryColor: '#1565c0',
    backgroundColor: '#f0f4f8', textColor: '#0f172a', layout: 'warranty_solution',
    showVerificationBadge: true, showProductInfo: true, showDistributorInfo: true, showScanCount: false, showRelatedProducts: true, enterpriseId: '',
    logo: '', backgroundImage: '',
    contentConfig: { ...defaultContentConfig }
  });

  useEffect(() => {
    loadTemplates();
    if (isAdmin) {
      loadEnterprises();
    } else if (enterpriseId) {
      loadCurrentEnterprise();
    }
  }, [isAdmin, enterpriseId]);

  const loadTemplates = async () => {
    try { const data = await api.getTemplates(); setTemplates(data); }
    catch (e) {} finally { setLoading(false); }
  };

  const loadEnterprises = async () => {
    try {
      const data = await api.getEnterprises();
      setEnterprises(data || []);
      if (data && data.length > 0 && !selectedEnterpriseId) {
        setSelectedEnterpriseId(data[0]._id);
      }
    } catch (e) {}
  };

  const loadCurrentEnterprise = async () => {
    try {
      const ent = await api.getEnterprise(enterpriseId);
      if (ent) {
        setEnterprises([ent]);
        setSelectedEnterpriseId(ent._id);
      }
    } catch (e) {}
  };

  // Khi đổi doanh nghiệp được chọn -> tải danh sách sản phẩm của doanh nghiệp đó & đồng bộ theme mặc định
  useEffect(() => {
    if (!selectedEnterpriseId) {
      setProducts([]);
      setSelectedProductId('');
      return;
    }
    setSelectedProductId('');
    api.getProducts({ enterpriseId: selectedEnterpriseId, limit: 200 })
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.products || res?.data || []);
        setProducts(list.filter(p => String(p.enterpriseId?._id || p.enterpriseId) === String(selectedEnterpriseId)));
      })
      .catch(() => setProducts([]));

    const ent = enterprises.find(e => String(e._id) === String(selectedEnterpriseId));
    if (ent?.displayConfig?.defaultTheme) {
      const canonical = resolveCanonicalThemeKey(ent.displayConfig.defaultTheme);
      setSelectedThemeKey(canonical);
    }
  }, [selectedEnterpriseId]);

  const targetEnterprise = useMemo(
    () => enterprises.find(e => String(e._id) === String(selectedEnterpriseId)) || enterprises[0],
    [enterprises, selectedEnterpriseId]
  );

  const targetProduct = useMemo(
    () => products.find(p => String(p._id) === String(selectedProductId)) || null,
    [products, selectedProductId]
  );

  // Nạp nội dung của giao diện đang chọn (từ Product Override hoặc Enterprise.displayConfig.themeContents hoặc Default)
  useEffect(() => {
    const canonicalKey = resolveCanonicalThemeKey(selectedThemeKey);
    const entSaved = targetEnterprise?.displayConfig?.themeContents?.[canonicalKey] || {};
    const prodSaved = targetProduct?.themeContentOverride?.[canonicalKey] || null;
    const effectiveCustom = targetProduct ? (prodSaved || entSaved) : entSaved;
    setThemeDraft(getMergedThemeContent(canonicalKey, effectiveCustom));
    setSetAsDefaultTheme(
      resolveCanonicalThemeKey(targetEnterprise?.displayConfig?.defaultTheme) === canonicalKey
    );
  }, [selectedThemeKey, targetEnterprise, targetProduct]);

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3800);
  };

  const handleThemeFieldChange = (fieldKey, value) => {
    setThemeDraft(prev => ({
      ...prev,
      [fieldKey]: value
    }));
  };

  const toggleSectionCollapse = (idx) => {
    setCollapsedSections(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handleSaveThemeContent = async () => {
    if (!targetEnterprise) return;
    setSavingThemeContent(true);
    try {
      const res = await api.saveEnterpriseThemeContent(targetEnterprise._id, {
        themeKey: selectedThemeKey,
        content: themeDraft,
        productId: selectedProductId || undefined,
        setAsDefaultTheme: !selectedProductId && setAsDefaultTheme
      });

      if (selectedProductId && res.product) {
        setProducts(prev => prev.map(p => String(p._id) === String(res.product._id) ? res.product : p));
      } else if (res.enterprise) {
        setEnterprises(prev => prev.map(ent => String(ent._id) === String(res.enterprise._id) ? res.enterprise : ent));
      }

      showToast(res.message || 'Đã lưu thay đổi nội dung giao diện thành công!');
    } catch (err) {
      alert(err.message || 'Lỗi khi lưu nội dung giao diện tem');
    } finally {
      setSavingThemeContent(false);
    }
  };

  const handleResetThemeContent = async () => {
    if (!targetEnterprise) return;
    const scopeText = targetProduct
      ? `sản phẩm "${targetProduct.name}"`
      : `doanh nghiệp "${targetEnterprise.name}"`;
    const activeThemeMeta = THEME_LIST.find(t => t.key === selectedThemeKey);
    if (!confirm(`Khôi phục toàn bộ nội dung của "${activeThemeMeta?.shortName || selectedThemeKey}" cho ${scopeText} về mặc định hệ thống?`)) {
      return;
    }

    setSavingThemeContent(true);
    try {
      const res = await api.saveEnterpriseThemeContent(targetEnterprise._id, {
        themeKey: selectedThemeKey,
        content: null,
        productId: selectedProductId || undefined
      });

      if (selectedProductId && res.product) {
        setProducts(prev => prev.map(p => String(p._id) === String(res.product._id) ? res.product : p));
      } else if (res.enterprise) {
        setEnterprises(prev => prev.map(ent => String(ent._id) === String(res.enterprise._id) ? res.enterprise : ent));
      }

      setThemeDraft({ ...(DEFAULT_THEME_CONTENTS[selectedThemeKey] || DEFAULT_THEME_CONTENTS.appliance) });
      showToast(res.message || 'Đã khôi phục nội dung mặc định!');
    } catch (err) {
      alert(err.message || 'Lỗi khi khôi phục nội dung mặc định');
    } finally {
      setSavingThemeContent(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setModalError(null);
    setModalTab('basic');
    setForm({
      name: '', primaryColor: '#0d47a1', secondaryColor: '#1565c0', backgroundColor: '#f0f4f8', textColor: '#0f172a', layout: 'warranty_solution', showVerificationBadge: true, showProductInfo: true, showDistributorInfo: true, showScanCount: false, showRelatedProducts: true, enterpriseId: selectedEnterpriseId || '', logo: '', backgroundImage: '',
      contentConfig: { ...defaultContentConfig }
    });
    setShowModal(true);
  };

  const openEdit = (tmpl) => {
    setEditing(tmpl);
    setModalError(null);
    setModalTab('basic');

    const cfg = tmpl.contentConfig || {};
    const b = cfg.benefits || [];

    setForm({
      name: tmpl.name,
      primaryColor: tmpl.primaryColor || '#0d47a1',
      secondaryColor: tmpl.secondaryColor || '#1565c0',
      backgroundColor: tmpl.backgroundColor || '#f0f4f8',
      textColor: tmpl.textColor || '#0f172a',
      layout: tmpl.layout || 'warranty_solution',
      showVerificationBadge: tmpl.showVerificationBadge ?? true,
      showProductInfo: tmpl.showProductInfo ?? true,
      showDistributorInfo: tmpl.showDistributorInfo ?? true,
      showScanCount: tmpl.showScanCount ?? false,
      showRelatedProducts: tmpl.showRelatedProducts ?? true,
      enterpriseId: tmpl.enterpriseId?._id || tmpl.enterpriseId || '',
      logo: tmpl.logo || '',
      backgroundImage: tmpl.backgroundImage || '',
      contentConfig: {
        headerTitle1: cfg.headerTitle1 || defaultContentConfig.headerTitle1,
        headerTitle2: cfg.headerTitle2 || defaultContentConfig.headerTitle2,
        transparencyLine1: cfg.transparencyLine1 || defaultContentConfig.transparencyLine1,
        transparencyLine2: cfg.transparencyLine2 || defaultContentConfig.transparencyLine2,
        spec1Label: cfg.spec1Label || defaultContentConfig.spec1Label,
        spec1Value: cfg.spec1Value || defaultContentConfig.spec1Value,
        spec2Label: cfg.spec2Label || defaultContentConfig.spec2Label,
        spec2Value: cfg.spec2Value || defaultContentConfig.spec2Value,
        spec3Label: cfg.spec3Label || defaultContentConfig.spec3Label,
        spec3Value: cfg.spec3Value || defaultContentConfig.spec3Value,
        spec4Label: cfg.spec4Label || defaultContentConfig.spec4Label,
        spec4Value: cfg.spec4Value || defaultContentConfig.spec4Value,
        benefit1Title: b[0]?.title || defaultContentConfig.benefit1Title,
        benefit1Desc: b[0]?.desc || defaultContentConfig.benefit1Desc,
        benefit2Title: b[1]?.title || defaultContentConfig.benefit2Title,
        benefit2Desc: b[1]?.desc || defaultContentConfig.benefit2Desc,
        benefit3Title: b[2]?.title || defaultContentConfig.benefit3Title,
        benefit3Desc: b[2]?.desc || defaultContentConfig.benefit3Desc,
        benefit4Title: b[3]?.title || defaultContentConfig.benefit4Title,
        benefit4Desc: b[3]?.desc || defaultContentConfig.benefit4Desc,
        benefit5Title: b[4]?.title || defaultContentConfig.benefit5Title,
        benefit5Desc: b[4]?.desc || defaultContentConfig.benefit5Desc,
        manufacturerNote: cfg.manufacturerNote || defaultContentConfig.manufacturerNote
      }
    });
    setShowModal(true);
  };

  const updateContentField = (field, val) => {
    setForm(prev => ({
      ...prev,
      contentConfig: {
        ...prev.contentConfig,
        [field]: val
      }
    }));
  };

  const applyPreset = (presetType) => {
    if (!presetType) return;
    let presetName = '';
    if (presetType === 'duoc') {
      presetName = 'Giao diện Dược phẩm';
      setForm(prev => ({
        ...prev,
        name: prev.name || presetName,
        primaryColor: '#0d9488',
        secondaryColor: '#0ea5e9',
        backgroundColor: '#ffffff',
        textColor: '#1e293b',
        layout: 'modern',
        logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="20" fill="%23f0fdfa"/><path d="M50 20v60M30 50h40" stroke="%230d9488" stroke-width="12" stroke-linecap="round"/><circle cx="50" cy="50" r="10" fill="%230ea5e9"/></svg>'
      }));
    } else if (presetType === 'mypham') {
      presetName = 'Giao diện Mỹ phẩm';
      setForm(prev => ({
        ...prev,
        name: prev.name || presetName,
        primaryColor: '#c5a880',
        secondaryColor: '#db2777',
        backgroundColor: '#0f0f15',
        textColor: '#ffffff',
        layout: 'premium',
        logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="20" fill="%230f0f15"/><path d="M50 15c0 0-10 15-10 25s10 10 10 10 10 0 10-10-10-25-10-25zM50 85c0 0 10-15 10-25s-10-10-10-10-10 0-10 10 10 25 10 25zM15 50c0 0 15 10 25 10s10-10 10-10-0-10-10-10-25 10-25 10zM85 50c0 0-15-10-25-10s-10 10-10 10 0 10 10 10 25-10 25-10z" fill="%23c5a880"/><circle cx="50" cy="50" r="8" fill="%23db2777"/></svg>'
      }));
    } else if (presetType === 'nongnghiep') {
      presetName = 'Giao diện Nông nghiệp';
      setForm(prev => ({
        ...prev,
        name: prev.name || presetName,
        primaryColor: '#16a34a',
        secondaryColor: '#84cc16',
        backgroundColor: '#f0fdf4',
        textColor: '#1f2937',
        layout: 'minimal',
        logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="20" fill="%23f0fdf4"/><path d="M50 80V40M50 40c0-10-15-15-25-5 0 0 5 15 25 5zm0 15c0-8 15-12 25-2 0 0-5 12-25 2z" stroke="%2316a34a" stroke-width="8" stroke-linecap="round" fill="none"/><circle cx="50" cy="30" r="6" fill="%2384cc16"/></svg>'
      }));
    } else if (presetType === 'baohanh') {
      presetName = 'Giao diện Tem Bảo Hành (PDF Standard)';
      setForm(prev => ({
        ...prev,
        name: prev.name || presetName,
        primaryColor: '#0d47a1',
        secondaryColor: '#1565c0',
        backgroundColor: '#f0f4f8',
        textColor: '#0f172a',
        layout: 'warranty_solution',
        logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="20" fill="%230d47a1"/><path d="M50 20L75 35V60L50 80L25 60V35L50 20Z" stroke="%23ffffff" stroke-width="6" fill="none"/><path d="M40 50L47 57L62 42" stroke="%234ade80" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError(null);
    if (isAdmin && !form.enterpriseId) {
      setModalError('Vui lòng chọn doanh nghiệp sở hữu template');
      return;
    }

    const c = form.contentConfig;
    const formattedContentConfig = {
      headerTitle1: c.headerTitle1,
      headerTitle2: c.headerTitle2,
      transparencyLine1: c.transparencyLine1,
      transparencyLine2: c.transparencyLine2,
      spec1Label: c.spec1Label,
      spec1Value: c.spec1Value,
      spec2Label: c.spec2Label,
      spec2Value: c.spec2Value,
      spec3Label: c.spec3Label,
      spec3Value: c.spec3Value,
      spec4Label: c.spec4Label,
      spec4Value: c.spec4Value,
      benefits: [
        { title: c.benefit1Title, desc: c.benefit1Desc },
        { title: c.benefit2Title, desc: c.benefit2Desc },
        { title: c.benefit3Title, desc: c.benefit3Desc },
        { title: c.benefit4Title, desc: c.benefit4Desc },
        { title: c.benefit5Title, desc: c.benefit5Desc }
      ],
      manufacturerNote: c.manufacturerNote
    };

    try {
      const data = {
        ...form,
        contentConfig: formattedContentConfig,
        enterpriseId: isAdmin ? form.enterpriseId : enterpriseId
      };
      if (editing) await api.updateTemplate(editing._id, data);
      else await api.createTemplate(data);
      setShowModal(false);
      loadTemplates();
    } catch (err) { setModalError(err.message || 'Lỗi lưu template'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Xóa template này?')) return;
    try { await api.deleteTemplate(id); loadTemplates(); }
    catch (err) { alert(err.message); }
  };

  const currentEntShowRelated = targetEnterprise?.displayConfig?.showRelatedProducts !== false;

  const handleToggleQuickRelated = async () => {
    if (!targetEnterprise) return;
    const nextVal = !currentEntShowRelated;
    setTogglingRelated(true);

    setEnterprises(prev => prev.map(ent => {
      if (ent._id === targetEnterprise._id) {
        return {
          ...ent,
          displayConfig: {
            ...(ent.displayConfig || {}),
            showRelatedProducts: nextVal
          }
        };
      }
      return ent;
    }));

    try {
      await api.toggleRelatedProducts(targetEnterprise._id, nextVal);
      showToast(`Đã ${nextVal ? 'BẬT' : 'TẮT'} hiển thị Sản phẩm liên quan cho "${targetEnterprise.name}"`);
    } catch (err) {
      setEnterprises(prev => prev.map(ent => {
        if (ent._id === targetEnterprise._id) {
          return {
            ...ent,
            displayConfig: {
              ...(ent.displayConfig || {}),
              showRelatedProducts: currentEntShowRelated
            }
          };
        }
        return ent;
      }));
      alert(err.message || 'Lỗi khi cập nhật cấu hình hiển thị sản phẩm liên quan');
    } finally {
      setTogglingRelated(false);
    }
  };

  const activeThemeMeta = useMemo(
    () => THEME_LIST.find(t => t.key === selectedThemeKey) || THEME_LIST[0],
    [selectedThemeKey]
  );

  const activeSections = useMemo(() => {
    const rawSections = THEME_EDITOR_SECTIONS[selectedThemeKey] || THEME_EDITOR_SECTIONS.appliance;
    const q = fieldSearch.trim().toLowerCase();
    if (!q) return rawSections;
    return rawSections
      .map(sec => ({
        ...sec,
        fields: sec.fields.filter(
          f =>
            f.label.toLowerCase().includes(q) ||
            String(themeDraft[f.key] || '').toLowerCase().includes(q)
        )
      }))
      .filter(sec => sec.fields.length > 0);
  }, [selectedThemeKey, fieldSearch, themeDraft]);

  // Render Live Preview cho giao diện đang chọn
  const renderLiveThemePreview = () => {
    const c = themeDraft || {};
    const entName = targetEnterprise?.name || 'CÔNG TY CỔ PHẦN THƯƠNG HIỆU CHÍNH HÃNG';
    const prodName = targetProduct?.name || 'Sản phẩm mẫu chính hãng';

    if (selectedThemeKey === 'appliance') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.8rem' }}>
          <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldCheck size={22} color="#16a34a" />
            <div>
              <div style={{ fontWeight: 800, color: '#166534', fontSize: '0.88rem' }}>{c.verifyTitle}</div>
              <div style={{ color: '#15803d', fontSize: '0.75rem' }}>{c.verifySubtitle}</div>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 10, padding: 12, border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', marginBottom: 6 }}>{prodName}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderTop: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b' }}>{c.activationCodeLabel}:</span>
              <strong style={{ color: '#0f172a' }}>00066</strong>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 10, padding: 12, border: '1px solid #bbf7d0' }}>
            <div style={{ fontWeight: 800, color: '#166534', marginBottom: 4 }}>{c.nsxSectionTitle}</div>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>{entName}</div>
          </div>

          <div style={{ background: '#fff', borderRadius: 10, padding: 12, border: '1px solid #bfdbfe' }}>
            <div style={{ fontWeight: 800, color: '#1e40af', marginBottom: 6 }}>{c.nppSectionTitle}</div>
            <div style={{ color: '#475569', fontSize: '0.75rem', marginBottom: 8 }}>{c.nppDefaultText}</div>
            <div style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', border: '1.5px solid #6ee7b7', borderRadius: 8, padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#047857', textTransform: 'uppercase' }}>{c.ownerCodeLabel}</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#065f46' }}>00066</div>
                <div style={{ marginTop: 4, paddingTop: 4, borderTop: '1px dashed rgba(5,150,105,0.3)' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#047857', textTransform: 'uppercase' }}>{c.antiCounterfeitLabel}</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#065f46' }}>00306916</div>
                </div>
              </div>
              <span style={{ background: '#059669', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '3px 8px', borderRadius: 10 }}>
                {c.verifiedBadgeText}
              </span>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 10, padding: 12, border: '1px solid #fde68a' }}>
            <div style={{ fontWeight: 800, color: '#b45309', marginBottom: 4 }}>{c.certSectionTitle}</div>
            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{c.certGuideText}</div>
          </div>

          <div style={{ background: '#fff', borderRadius: 10, padding: 12, border: '1px solid #c7d2fe' }}>
            <div style={{ fontWeight: 800, color: '#4338ca', marginBottom: 6 }}>{c.ownerCardTitle}</div>
            <div style={{ fontSize: '0.76rem', marginBottom: 4 }}>{c.ownerNameLabel} <strong>Đại lý chính hãng</strong></div>
            <div style={{ background: '#eef2ff', color: '#4338ca', padding: '6px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700 }}>
              {c.activatedSerialLabel} <strong>00066</strong>
            </div>
          </div>
        </div>
      );
    }

    if (selectedThemeKey === 'functional_food') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.8rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #15803d, #16a34a)', color: '#fff', borderRadius: 10, padding: 12 }}>
            <div style={{ fontWeight: 900, fontSize: '0.92rem' }}>{c.headerTitle}</div>
            <div style={{ fontSize: '0.74rem', opacity: 0.9 }}>{c.headerSubtitle}</div>
          </div>
          <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 10, padding: 10 }}>
            <div style={{ fontWeight: 800, color: '#166534' }}>{c.activatedBannerTitle}</div>
            <div style={{ fontSize: '0.73rem', color: '#15803d' }}>{c.activatedBannerDesc}</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 10, padding: 12, border: '1px solid #e2e8f0' }}>
            <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: 10 }}>{c.categoryTagText}</span>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', marginTop: 4 }}>{prodName}</div>
            <div style={{ color: '#16a34a', fontSize: '0.75rem', fontWeight: 700, marginTop: 4 }}>{c.viewDetailBtnText}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, background: '#fff', padding: 10, borderRadius: 10, border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '0.68rem', fontWeight: 700, color: '#15803d' }}>
            {[c.btn1Label, c.btn2Label, c.btn3Label, c.btn4Label, c.btn5Label, c.btn6Label, c.btn7Label, c.btn8Label].map((lbl, i) => (
              <div key={i} style={{ padding: '6px 4px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>{lbl}</div>
            ))}
          </div>
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 800, color: '#166534', fontSize: '0.8rem' }}>{c.supportTitle}</div>
              <div style={{ fontSize: '0.7rem', color: '#475569' }}>{c.supportDesc}</div>
            </div>
            <span style={{ background: '#16a34a', color: '#fff', padding: '5px 10px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 700 }}>{c.supportBtnText}</span>
          </div>
          <div style={{ background: '#14532d', color: '#fff', borderRadius: 8, padding: 8, textAlign: 'center', fontSize: '0.72rem' }}>
            {c.footerThankYou}
          </div>
        </div>
      );
    }

    if (selectedThemeKey === 'staycool') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.8rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #ea580c, #f97316)', color: '#fff', borderRadius: 20, padding: '8px 12px', textAlign: 'center', fontWeight: 800, fontSize: '0.76rem' }}>
            {c.pillBanner1Activated}
          </div>
          <div style={{ background: '#fff', borderRadius: 10, padding: 12, border: '1px solid #fed7aa' }}>
            <div style={{ fontWeight: 800, color: '#c2410c', fontSize: '0.92rem' }}>{prodName}</div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 4 }}>NSX: {c.mfgDefaultTitle}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, textAlign: 'center', fontSize: '0.72rem', fontWeight: 700 }}>
            {[c.actionPill1Label, c.actionPill2Label, c.actionPill3Label].map((lbl, i) => (
              <div key={i} style={{ background: '#fff', border: '1.5px solid #fdba74', borderRadius: 20, padding: '6px 4px', color: '#ea580c' }}>{lbl}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, textAlign: 'center', fontSize: '0.72rem', fontWeight: 700 }}>
            {[c.gridBtn1Label, c.gridBtn2Label, c.gridBtn3Label, c.gridBtn4Label, c.gridBtn5Label, c.gridBtn6Label].map((lbl, i) => (
              <div key={i} style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '8px 6px', color: '#9a3412' }}>{lbl}</div>
            ))}
          </div>
          <div style={{ background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 10, padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 800, color: '#c2410c', fontSize: '0.78rem' }}>{c.consultTitle}</div>
              <div style={{ fontSize: '0.68rem', color: '#7c2d12' }}>{c.consultDesc}</div>
            </div>
            <span style={{ background: '#ea580c', color: '#fff', padding: '5px 10px', borderRadius: 16, fontSize: '0.7rem', fontWeight: 700 }}>{c.consultBtnText}</span>
          </div>
        </div>
      );
    }

    if (selectedThemeKey === 'honey') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.8rem', background: '#fefce8', padding: 10, borderRadius: 10, border: '1px solid #fde047' }}>
          <div style={{ fontWeight: 900, color: '#14532d', fontSize: '0.88rem', textAlign: 'center', borderBottom: '1px solid #fde047', paddingBottom: 6 }}>
            {c.headerTitle_vi}
          </div>
          <div style={{ background: '#fff', borderRadius: 8, padding: 10, border: '1px solid #fef08a', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div><strong>{c.lblProduct_vi}</strong> {c.defaultProductName_vi}</div>
            <div><strong>{c.lblProducer_vi}</strong> {c.defaultProducerName_vi}</div>
            <div><strong>{c.lblAddress_vi}</strong> {c.defaultAddress_vi}</div>
            <div><strong>{c.lblContact_vi}</strong> {c.defaultContact_vi}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, textAlign: 'center', fontSize: '0.7rem', fontWeight: 700 }}>
            {[c.tab1Label_vi, c.tab2Label_vi, c.tab3Label_vi, c.tab4Label_vi, c.tab5Label_vi, c.tab6Label_vi].map((t, idx) => (
              <div key={idx} style={{ background: idx === 0 ? '#eab308' : '#15803d', color: '#fff', padding: '6px 4px', borderRadius: 14 }}>
                {t}
              </div>
            ))}
          </div>
          <div style={{ background: '#fff', borderRadius: 8, padding: 10, border: '1px solid #bbf7d0' }}>
            <div style={{ fontWeight: 800, color: '#14532d', fontSize: '0.82rem' }}>{c.introTitle_vi}</div>
            <div style={{ fontSize: '0.7rem', color: '#15803d', fontStyle: 'italic', marginBottom: 6 }}>{c.introSubtitle_vi}</div>
            <div style={{ fontSize: '0.73rem', color: '#334155', lineHeight: 1.4 }}>{c.introLead_vi}</div>
          </div>
        </div>
      );
    }

    if (selectedThemeKey === 'ocop') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.8rem' }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: 12, border: '1.5px solid #86efac' }}>
            <div style={{ fontWeight: 900, color: '#15803d', fontSize: '0.95rem' }}>{prodName}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>{c.certSublabel}</div>
            <div style={{ fontWeight: 900, color: '#dc2626', fontSize: '0.88rem' }}>{c.defaultCertText}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>{c.ownerSublabel} <strong style={{ color: '#0f172a' }}>{entName}</strong></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, background: '#fff', padding: 10, borderRadius: 10, border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '0.67rem', fontWeight: 700, color: '#15803d' }}>
            {[c.btn1Label, c.btn2Label, c.btn3Label, c.btn4Label, c.btn5Label, c.btn6Label, c.btn7Label, c.btn8Label].map((lbl, i) => (
              <div key={i} style={{ padding: '6px 4px', background: '#f0fdf4', borderRadius: 8 }}>{lbl}</div>
            ))}
          </div>
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: 10 }}>
            <div style={{ fontWeight: 800, color: '#15803d', fontSize: '0.8rem' }}>{c.commitmentTitle}</div>
            <div style={{ fontSize: '0.72rem', color: '#334155', marginTop: 2 }}>{c.commitmentDesc}</div>
          </div>
        </div>
      );
    }

    if (selectedThemeKey === 'medical') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
            <span style={{ background: '#ccfbf1', color: '#0f766e', fontSize: '0.66rem', fontWeight: 800, padding: '4px 8px', borderRadius: 8 }}>{c.rxBadgeText}</span>
            <span style={{ background: '#0d9488', color: '#fff', fontSize: '0.66rem', fontWeight: 800, padding: '4px 8px', borderRadius: 8 }}>{c.gmpBadgeText}</span>
          </div>
          <div style={{ background: '#fff', borderRadius: 10, padding: 12, border: '1px solid #99f6e4' }}>
            <div style={{ fontWeight: 800, color: '#0f766e', fontSize: '0.92rem' }}>{prodName}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8, fontSize: '0.72rem' }}>
              <div style={{ background: '#f0fdfa', padding: 6, borderRadius: 6 }}><div style={{ color: '#64748b' }}>{c.spec1Label}</div><strong>{c.spec1DefaultVal}</strong></div>
              <div style={{ background: '#f0fdfa', padding: 6, borderRadius: 6 }}><div style={{ color: '#64748b' }}>{c.spec2Label}</div><strong>{c.spec2DefaultVal}</strong></div>
              <div style={{ background: '#f0fdfa', padding: 6, borderRadius: 6 }}><div style={{ color: '#64748b' }}>{c.spec3Label}</div><strong>{c.spec3DefaultVal}</strong></div>
              <div style={{ background: '#f0fdfa', padding: 6, borderRadius: 6 }}><div style={{ color: '#64748b' }}>{c.spec4Label}</div><strong>{c.spec4DefaultVal}</strong></div>
            </div>
          </div>
          <div style={{ background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 10, padding: 10 }}>
            <div style={{ fontWeight: 800, color: '#c2410c', fontSize: '0.76rem' }}>{c.warningTitle}</div>
            <div style={{ fontSize: '0.7rem', color: '#7c2d12', marginTop: 2 }}>{c.warningDesc}</div>
          </div>
        </div>
      );
    }

    if (selectedThemeKey === 'agriculture') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.8rem' }}>
          <div style={{ background: '#15803d', color: '#fff', borderRadius: 10, padding: 12 }}>
            <div style={{ fontWeight: 800, fontSize: '0.86rem' }}>{c.bannerTitle}</div>
            <div style={{ fontSize: '0.72rem', opacity: 0.9 }}>{c.bannerSubtitle}</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 10, padding: 12, border: '1px solid #bbf7d0' }}>
            <div style={{ fontWeight: 800, color: '#166534', fontSize: '0.92rem', marginBottom: 6 }}>{prodName}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: '0.72rem' }}>
              <span style={{ background: '#f0fdf4', padding: '4px 8px', borderRadius: 6, border: '1px solid #86efac' }}>{c.tag1Label} <strong>{c.tag1Val}</strong></span>
              <span style={{ background: '#f0fdf4', padding: '4px 8px', borderRadius: 6, border: '1px solid #86efac' }}>{c.tag2Label} <strong>{c.tag2Val}</strong></span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, textAlign: 'center', fontSize: '0.74rem', fontWeight: 700, color: '#15803d' }}>
            {[c.btn1Label, c.btn2Label, c.btn3Label, c.btn4Label].map((lbl, i) => (
              <div key={i} style={{ background: '#fff', padding: 8, borderRadius: 8, border: '1px solid #bbf7d0' }}>{lbl}</div>
            ))}
          </div>
        </div>
      );
    }

    // Cosmetics
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.8rem' }}>
        <div style={{ background: 'linear-gradient(135deg, #be185d, #db2777)', color: '#fff', borderRadius: 10, padding: 12 }}>
          <div style={{ fontWeight: 800, fontSize: '0.86rem' }}>{c.bannerTitle}</div>
          <div style={{ fontSize: '0.72rem', opacity: 0.9 }}>{c.bannerSubtitle}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 10, padding: 12, border: '1px solid #fbcfe8' }}>
          <div style={{ fontWeight: 800, color: '#9d174d', fontSize: '0.92rem' }}>{prodName}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6, fontSize: '0.73rem' }}>
            <div>{c.spec1Label} <strong>{c.spec1Val}</strong></div>
            <div>{c.spec2Label} <strong>{c.spec2Val}</strong></div>
            <div>{c.spec3Label} <strong>{c.spec3Val}</strong></div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, textAlign: 'center', fontSize: '0.74rem', fontWeight: 700, color: '#be185d' }}>
          {[c.btn1Label, c.btn2Label, c.btn3Label, c.btn4Label].map((lbl, i) => (
            <div key={i} style={{ background: '#fdf2f8', padding: 8, borderRadius: 8, border: '1px solid #fbcfe8' }}>{lbl}</div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) return <div className="loading-overlay"><div className="loading-spinner" style={{width:40,height:40}}></div></div>;

  return (
    <div className="templates-page">
      <div className="page-header">
        <div>
          <h1>Cấu hình &amp; Tùy chỉnh Nội dung Giao diện Tem</h1>
          <p>Chọn bất kỳ giao diện nào trong 8 giao diện ngành hàng để tùy ý thay đổi nội dung chữ, tiêu đề, nhãn nút, bài viết tab và popup hiển thị khi quét QR</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={18}/> Tạo Template Màu Sắc</button>
      </div>

      {/* Quick Global / Enterprise Display Setting for Related Products */}
      <div className="related-products-banner card animate-fade-in-up">
        <div className="related-banner-content">
          <div className="related-banner-header">
            <div className="related-banner-icon">
              <Package size={24} />
            </div>
            <div>
              <div className="related-banner-title-row">
                <h3>Cài đặt Bật / Tắt Khối "Sản phẩm liên quan"</h3>
                <span className={`badge ${currentEntShowRelated ? 'badge-success' : 'badge-danger'}`}>
                  {currentEntShowRelated ? 'ĐANG BẬT' : 'ĐANG TẮT'}
                </span>
              </div>
              <p className="related-banner-desc">
                Bật hoặc tắt tùy ý mục "Sản phẩm liên quan" / "Sản phẩm phân phối" trên toàn bộ tem của doanh nghiệp
              </p>
            </div>
          </div>

          <div className="related-banner-actions">
            {isAdmin && enterprises.length > 0 && (
              <div className="related-banner-select-box">
                <label>Doanh nghiệp:</label>
                <select
                  className="input select"
                  value={selectedEnterpriseId}
                  onChange={(e) => setSelectedEnterpriseId(e.target.value)}
                >
                  {enterprises.map(ent => (
                    <option key={ent._id} value={ent._id}>
                      {ent.name} ({ent.displayConfig?.showRelatedProducts !== false ? 'Bật' : 'Tắt'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              className={`related-main-toggle-btn ${currentEntShowRelated ? 'active' : 'inactive'}`}
              disabled={togglingRelated}
              onClick={handleToggleQuickRelated}
              title={`Bấm để ${currentEntShowRelated ? 'TẮT' : 'BẬT'} hiển thị sản phẩm liên quan cho doanh nghiệp này`}
            >
              <span className="related-toggle-track">
                <span className="related-toggle-thumb"></span>
              </span>
              <span className="related-toggle-text">
                {togglingRelated ? 'Đang lưu...' : (currentEntShowRelated ? 'BẬT (Hiển thị)' : 'TẮT (Đã ẩn)')}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          TRÌNH TÙY CHỈNH NỘI DUNG CHI TIẾT CHO 8 GIAO DIỆN TEM (THEME CONTENT BUILDER)
          ===================================================================== */}
      <div className="theme-builder-card animate-fade-in-up">
        <div className="theme-builder-top-bar">
          <div className="theme-builder-header-left">
            <div className="theme-builder-header-icon">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="theme-builder-title">
                Trình Tùy Chỉnh Nội Dung Từng Giao Diện Tem (8 Giao Diện)
              </h2>
              <p className="theme-builder-subtitle">
                Chọn doanh nghiệp (hoặc từng sản phẩm riêng) rồi bấm vào giao diện cần sửa bên dưới để thay đổi mọi câu chữ, tiêu đề, nhãn nút, thông số và nội dung popup.
              </p>
            </div>
          </div>

          <div className="theme-builder-controls">
            {isAdmin && enterprises.length > 0 && (
              <div className="theme-control-group">
                <span className="theme-control-label">
                  <Building2 size={15} color="#4f46e5" /> Doanh nghiệp:
                </span>
                <select
                  className="input select"
                  style={{ minWidth: 210, height: 38, fontWeight: 600 }}
                  value={selectedEnterpriseId}
                  onChange={(e) => setSelectedEnterpriseId(e.target.value)}
                >
                  {enterprises.map(ent => (
                    <option key={ent._id} value={ent._id}>{ent.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="theme-control-group">
              <span className="theme-control-label">
                <Layers size={15} color="#4f46e5" /> Phạm vi:
              </span>
              <select
                className="input select"
                style={{ minWidth: 230, height: 38, fontWeight: 600 }}
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                title="Chọn áp dụng cho toàn Doanh nghiệp hoặc riêng 1 Sản phẩm"
              >
                <option value="">🌐 Áp dụng chung toàn Doanh nghiệp</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>
                    📦 Riêng SP: {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Bộ chọn 8 Giao diện Tem */}
        <div className="theme-selector-grid">
          {THEME_LIST.map((themeItem) => {
            const isSelected = selectedThemeKey === themeItem.key;
            const hasCustomEnt = Boolean(
              targetEnterprise?.displayConfig?.themeContents?.[themeItem.key] &&
              Object.keys(targetEnterprise.displayConfig.themeContents[themeItem.key]).length > 0
            );
            const hasCustomProd = Boolean(
              targetProduct?.themeContentOverride?.[themeItem.key] &&
              Object.keys(targetProduct.themeContentOverride[themeItem.key]).length > 0
            );
            const isEntDefault =
              resolveCanonicalThemeKey(targetEnterprise?.displayConfig?.defaultTheme) === themeItem.key;

            return (
              <button
                key={themeItem.key}
                type="button"
                className={`theme-selector-item ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  setSelectedThemeKey(themeItem.key);
                  setActiveSectionFilter('all');
                }}
                style={{
                  '--theme-card-color': themeItem.color,
                  ...(isSelected
                    ? {
                        borderColor: themeItem.color,
                        background: `linear-gradient(180deg, ${themeItem.bgLight} 0%, #ffffff 75%)`
                      }
                    : {})
                }}
              >
                <div>
                  <div className="theme-selector-head">
                    <span
                      className="theme-selector-badge"
                      style={{ background: themeItem.color, color: '#fff' }}
                    >
                      {themeItem.badge}
                    </span>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {isSelected && (
                        <span
                          className="badge"
                          style={{
                            fontSize: '0.66rem',
                            fontWeight: 800,
                            background: themeItem.color,
                            color: '#ffffff',
                            padding: '2px 7px'
                          }}
                        >
                          ✓ Đang chọn
                        </span>
                      )}
                      {isEntDefault && (
                        <span
                          className="badge badge-success"
                          style={{
                            fontSize: '0.66rem',
                            fontWeight: 800,
                            background: '#dcfce7',
                            color: '#15803d',
                            border: '1px solid #86efac'
                          }}
                        >
                          Mặc định DN
                        </span>
                      )}
                      {(hasCustomProd || hasCustomEnt) && (
                        <span
                          className="badge"
                          style={{
                            fontSize: '0.66rem',
                            fontWeight: 700,
                            background: '#eef2ff',
                            color: '#4f46e5',
                            border: '1px solid #c7d2fe'
                          }}
                        >
                          Đã tùy chỉnh
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    className="theme-selector-title"
                    style={isSelected ? { color: themeItem.color } : undefined}
                  >
                    {themeItem.shortName}
                  </div>
                  <div className="theme-selector-sub">{themeItem.subtitle}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Thanh công cụ của Giao diện đang chọn */}
        <div
          className="theme-active-toolbar"
          style={{ borderLeft: `5px solid ${activeThemeMeta.color}` }}
        >
          <div className="theme-active-info">
            <span
              className="theme-active-dot"
              style={{ background: activeThemeMeta.color }}
            />
            <div>
              <div className="theme-active-name">
                Đang chỉnh sửa: <span style={{ color: activeThemeMeta.color }}>{activeThemeMeta.name}</span>
              </div>
              <div className="theme-active-scope">
                <span>Phạm vi lưu:</span>
                <span className="theme-scope-pill">
                  {targetProduct
                    ? `📦 Riêng sản phẩm "${targetProduct.name}"`
                    : `🏢 Toàn bộ doanh nghiệp "${targetEnterprise?.name || ''}"`}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                className="input"
                style={{ paddingLeft: 34, height: 38, width: 220, fontSize: '0.83rem', background: '#ffffff' }}
                placeholder="Tìm nhanh mục cần sửa..."
                value={fieldSearch}
                onChange={(e) => setFieldSearch(e.target.value)}
              />
            </div>

            {!selectedProductId && (
              <label className="theme-default-checkbox-pill">
                <input
                  type="checkbox"
                  checked={setAsDefaultTheme}
                  onChange={(e) => setSetAsDefaultTheme(e.target.checked)}
                />
                <span>Đặt làm giao diện mặc định của DN</span>
              </label>
            )}

            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleResetThemeContent}
              disabled={savingThemeContent}
              style={{
                height: 38,
                fontSize: '0.83rem',
                fontWeight: 700,
                background: '#ffffff',
                color: '#334155',
                border: '1.5px solid #cbd5e1'
              }}
            >
              <RotateCcw size={15} /> Khôi phục mặc định
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveThemeContent}
              disabled={savingThemeContent}
              style={{
                height: 38,
                fontWeight: 700,
                background: activeThemeMeta.color,
                borderColor: activeThemeMeta.color,
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)'
              }}
            >
              <Save size={16} />
              {savingThemeContent ? 'Đang lưu...' : 'Lưu Nội Dung Giao Diện'}
            </button>
          </div>
        </div>

        {/* Thanh chọn nhanh nhóm mục (Section Filter Pills) & Đóng/Mở nhanh */}
        {activeSections.length > 1 && !fieldSearch.trim() && (
          <div className="theme-section-nav-bar">
            <div className="theme-section-pills">
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginRight: 4 }}>
                Chuyển nhanh nhóm mục:
              </span>
              <button
                type="button"
                className={`theme-sec-pill ${activeSectionFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveSectionFilter('all')}
                style={activeSectionFilter === 'all' ? { background: activeThemeMeta.color, borderColor: activeThemeMeta.color } : undefined}
              >
                Tất cả ({activeSections.length} nhóm)
              </button>
              {activeSections.map((sec, idx) => (
                <button
                  key={sec.title}
                  type="button"
                  className={`theme-sec-pill ${activeSectionFilter === idx ? 'active' : ''}`}
                  onClick={() => {
                    setActiveSectionFilter(idx);
                    setCollapsedSections(prev => ({ ...prev, [`${selectedThemeKey}_${idx}`]: false }));
                  }}
                  style={activeSectionFilter === idx ? { background: activeThemeMeta.color, borderColor: activeThemeMeta.color } : undefined}
                >
                  {sec.title.split(':')[0]}
                </button>
              ))}
            </div>

            {activeSectionFilter === 'all' && (
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  className="theme-sec-pill"
                  onClick={() => {
                    const next = { ...collapsedSections };
                    activeSections.forEach((_, idx) => { next[`${selectedThemeKey}_${idx}`] = false; });
                    setCollapsedSections(next);
                  }}
                >
                  Mở rộng tất cả
                </button>
                <button
                  type="button"
                  className="theme-sec-pill"
                  onClick={() => {
                    const next = { ...collapsedSections };
                    activeSections.forEach((_, idx) => { next[`${selectedThemeKey}_${idx}`] = true; });
                    setCollapsedSections(next);
                  }}
                >
                  Thu gọn tất cả
                </button>
              </div>
            )}
          </div>
        )}

        {/* Workspace 2 Cột: Cột Trái (Form theo Khối) + Cột Phải (Live Mobile Preview) */}
        <div className="theme-builder-workspace">
          <div className="theme-editor-pane">
            {activeSections.map((sec, secIdx) => {
              if (activeSectionFilter !== 'all' && activeSectionFilter !== secIdx && !fieldSearch.trim()) {
                return null;
              }
              const isCollapsed = Boolean(collapsedSections[`${selectedThemeKey}_${secIdx}`]);
              const modifiedCount = sec.fields.filter(f => {
                const v = themeDraft[f.key] ?? '';
                const dv = DEFAULT_THEME_CONTENTS[selectedThemeKey]?.[f.key] ?? '';
                return v !== dv;
              }).length;

              return (
                <div key={sec.title} className="theme-section-box">
                  <button
                    type="button"
                    className="theme-section-header"
                    onClick={() => toggleSectionCollapse(`${selectedThemeKey}_${secIdx}`)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          width: 8,
                          height: 20,
                          borderRadius: 4,
                          background: activeThemeMeta.color,
                          display: 'inline-block'
                        }}
                      />
                      <span>{sec.title}</span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 12,
                          background: '#e2e8f0',
                          color: '#475569'
                        }}
                      >
                        {sec.fields.length} trường
                      </span>
                      {modifiedCount > 0 && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 12,
                            background: '#fef3c7',
                            color: '#b45309',
                            border: '1px solid #fde68a'
                          }}
                        >
                          Đã sửa {modifiedCount}
                        </span>
                      )}
                    </div>
                    {isCollapsed ? <ChevronDown size={18} color="#475569" /> : <ChevronUp size={18} color="#475569" />}
                  </button>

                  {!isCollapsed && (
                    <div className="theme-section-body">
                      {sec.fields.map((field) => {
                        const isTextarea = field.type === 'textarea';
                        const val = themeDraft[field.key] ?? '';
                        const defaultVal = DEFAULT_THEME_CONTENTS[selectedThemeKey]?.[field.key] ?? '';
                        const isModified = val !== defaultVal;
                        return (
                          <div
                            key={field.key}
                            className={`input-group ${isTextarea ? 'theme-field-full' : ''}`}
                            style={{ marginBottom: 0 }}
                          >
                            <div className="theme-field-label-row">
                              <label className="theme-field-label">
                                {field.label}
                              </label>
                              {isModified && (
                                <button
                                  type="button"
                                  className="theme-field-reset-btn"
                                  onClick={() => handleThemeFieldChange(field.key, defaultVal)}
                                  title="Khôi phục trường này về mặc định gốc"
                                >
                                  ↺ Mặc định
                                </button>
                              )}
                            </div>
                            {isTextarea ? (
                              <textarea
                                className={`input textarea ${isModified ? 'is-modified' : ''}`}
                                rows={3}
                                value={val}
                                onChange={(e) => handleThemeFieldChange(field.key, e.target.value)}
                                placeholder={defaultVal}
                              />
                            ) : (
                              <input
                                type="text"
                                className={`input ${isModified ? 'is-modified' : ''}`}
                                value={val}
                                onChange={(e) => handleThemeFieldChange(field.key, e.target.value)}
                                placeholder={defaultVal}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleResetThemeContent}
                disabled={savingThemeContent}
                style={{
                  fontWeight: 700,
                  background: '#ffffff',
                  color: '#334155',
                  border: '1.5px solid #cbd5e1'
                }}
              >
                <RotateCcw size={15} /> Khôi phục mặc định
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveThemeContent}
                disabled={savingThemeContent}
                style={{
                  fontWeight: 700,
                  background: activeThemeMeta.color,
                  borderColor: activeThemeMeta.color
                }}
              >
                <Save size={16} />
                {savingThemeContent ? 'Đang lưu...' : 'Lưu Nội Dung Giao Diện'}
              </button>
            </div>
          </div>

          {/* Cột Phải: Live Mobile Preview */}
          <div className="theme-preview-pane">
            <div className="theme-preview-topbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
                <Smartphone size={18} color={activeThemeMeta.color} />
                <span>Xem trước trực tiếp: {activeThemeMeta.shortName}</span>
              </div>
              <span
                className="badge"
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  background: activeThemeMeta.color,
                  color: '#ffffff'
                }}
              >
                LIVE PREVIEW
              </span>
            </div>
            <div className="theme-preview-phone-bezel">
              <div className="theme-preview-phone">
                {renderLiveThemePreview()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danh sách Template Màu sắc & Bố cục tùy chỉnh */}
      <div style={{ marginTop: 8 }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 12 }}>
          Danh sách Template Màu sắc &amp; Bố cục Lô tem
        </h3>
        <div className="templates-grid">
          {templates.length === 0 ? (
            <div className="empty-state"><Palette size={60}/><h3>Chưa có template nào</h3></div>
          ) : (
            templates.map(tmpl => (
              <div key={tmpl._id} className="template-card card animate-fade-in-up">
                {/* Preview */}
                <div className="template-preview" style={{background: tmpl.backgroundColor, color: tmpl.textColor}}>
                  <div className="preview-header" style={{background: `linear-gradient(135deg, ${tmpl.primaryColor}, ${tmpl.secondaryColor})`}}>
                    <CheckCircle size={20}/> <span>{tmpl.contentConfig?.headerTitle2 || 'TEM BẢO HÀNH SẢN PHẨM'}</span>
                  </div>
                  <div className="preview-body">
                    <div className="preview-product-name">{tmpl.contentConfig?.headerTitle1 || 'GIẢI PHÁP QRcode'}</div>
                    {tmpl.showProductInfo && <div className="preview-info">Sản phẩm &amp; Thông số</div>}
                    {tmpl.showDistributorInfo && <div className="preview-info">Điểm bán &amp; NSX</div>}
                    {tmpl.showScanCount && <div className="preview-scan">Đã quét: 5 lần</div>}
                  </div>
                </div>
                <div className="template-info">
                  <h3>{tmpl.name}</h3>
                  <div className="template-meta">
                    <span className="badge badge-neutral">{tmpl.layout}</span>
                    {tmpl.isDefault && <span className="badge badge-success">Mặc định</span>}
                  </div>
                  <div className="template-colors">
                    <span className="color-dot" style={{background: tmpl.primaryColor}} title="Primary"></span>
                    <span className="color-dot" style={{background: tmpl.secondaryColor}} title="Secondary"></span>
                    <span className="color-dot" style={{background: tmpl.backgroundColor}} title="Background"></span>
                  </div>
                  <div className="template-actions">
                    <button className="btn btn-sm btn-ghost" onClick={() => openEdit(tmpl)}><Edit size={14}/> Sửa</button>
                    <button className="btn btn-sm btn-ghost" onClick={() => setPreviewTemplate(tmpl)}><Eye size={14}/> Xem</button>
                    <button className="btn btn-sm btn-ghost" onClick={() => handleDelete(tmpl._id)}><Trash2 size={14}/></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create/Edit Modal with Content Editor Tabs */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{maxWidth: 680}}>
            <div className="modal-header">
              <h3 className="modal-title">{editing ? 'Sửa Template Tem' : 'Tạo Template Tem mới'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>

            {/* Modal Tabs Header */}
            <div className="modal-tabs">
              <button
                type="button"
                className={`tab-btn ${modalTab === 'basic' ? 'active' : ''}`}
                onClick={() => setModalTab('basic')}
              >
                <Settings size={16} /> Cấu hình Cơ bản &amp; Màu sắc
              </button>
              <button
                type="button"
                className={`tab-btn ${modalTab === 'content' ? 'active' : ''}`}
                onClick={() => setModalTab('content')}
              >
                <FileText size={16} /> Tùy chỉnh Nội dung Tem
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                {modalError && (
                  <div className="modal-error animate-fade-in" style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: 12, marginBottom: 16,
                    borderRadius: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)'
                  }}>
                    <XCircle size={18} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.9rem' }}>{modalError}</span>
                  </div>
                )}

                {modalTab === 'basic' ? (
                  <>
                    {isAdmin && (
                      <div className="input-group">
                        <label>Doanh nghiệp sở hữu *</label>
                        <select
                          className="input select"
                          value={form.enterpriseId}
                          onChange={e => setForm({...form, enterpriseId: e.target.value})}
                          required
                        >
                          <option value="">-- Chọn doanh nghiệp --</option>
                          {enterprises.map(ent => (
                            <option key={ent._id} value={ent._id}>{ent.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="input-group">
                      <label>Áp dụng nhanh Ngành Hàng mẫu</label>
                      <select
                        className="input select"
                        defaultValue=""
                        onChange={e => applyPreset(e.target.value)}
                      >
                        <option value="">-- Tùy chọn thiết kế mẫu --</option>
                        <option value="baohanh">Tem Bảo Hành Sản Phẩm (PDF Standard - Blue/Emerald)</option>
                        <option value="duoc">Dược phẩm &amp; Y tế (Xanh Teal, Modern, Light mode)</option>
                        <option value="mypham">Mỹ phẩm &amp; Làm đẹp (Gold/Rose, Premium, Dark mode)</option>
                        <option value="nongnghiep">Nông nghiệp &amp; Thực phẩm (Xanh lá, Minimal, Nature)</option>
                      </select>
                    </div>
                    <div className="input-group"><label>Tên Template *</label><input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
                    <div className="input-group">
                      <label>Layout</label>
                      <select className="input select" value={form.layout} onChange={e => setForm({...form, layout: e.target.value})}>
                        <option value="warranty_solution">Tem Bảo Hành PDF (Warranty Solution)</option>
                        <option value="default">Default</option>
                        <option value="minimal">Minimal</option>
                        <option value="premium">Premium</option>
                        <option value="modern">Modern</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label>Logo của Template (URL hoặc SVG Data URI)</label>
                      <input
                        className="input"
                        value={form.logo || ''}
                        onChange={e => setForm({...form, logo: e.target.value})}
                        placeholder="Để trống sẽ dùng logo doanh nghiệp"
                      />
                    </div>
                    {form.logo && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0', padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Logo hiện tại:</span>
                        <img src={form.logo} alt="Logo preview" style={{ height: 32, maxWidth: 120, objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
                      </div>
                    )}
                    <div className="input-group">
                      <label>Hình nền Template (URL tùy chọn)</label>
                      <input
                        className="input"
                        value={form.backgroundImage || ''}
                        onChange={e => setForm({...form, backgroundImage: e.target.value})}
                        placeholder="URL ảnh nền cho trang quét tem"
                      />
                    </div>
                    <div className="color-grid">
                      <div className="input-group">
                        <label>Màu chính</label>
                        <div className="color-input"><input type="color" value={form.primaryColor} onChange={e => setForm({...form, primaryColor: e.target.value})} /><span>{form.primaryColor}</span></div>
                      </div>
                      <div className="input-group">
                        <label>Màu phụ</label>
                        <div className="color-input"><input type="color" value={form.secondaryColor} onChange={e => setForm({...form, secondaryColor: e.target.value})} /><span>{form.secondaryColor}</span></div>
                      </div>
                      <div className="input-group">
                        <label>Nền</label>
                        <div className="color-input"><input type="color" value={form.backgroundColor} onChange={e => setForm({...form, backgroundColor: e.target.value})} /><span>{form.backgroundColor}</span></div>
                      </div>
                      <div className="input-group">
                        <label>Chữ</label>
                        <div className="color-input"><input type="color" value={form.textColor} onChange={e => setForm({...form, textColor: e.target.value})} /><span>{form.textColor}</span></div>
                      </div>
                    </div>
                    <div className="toggle-group">
                      <label className="toggle-label"><input type="checkbox" checked={form.showVerificationBadge} onChange={e => setForm({...form, showVerificationBadge: e.target.checked})} /><span className="toggle-switch"></span><span>Hiển thị badge xác thực</span></label>
                      <label className="toggle-label"><input type="checkbox" checked={form.showProductInfo} onChange={e => setForm({...form, showProductInfo: e.target.checked})} /><span className="toggle-switch"></span><span>Hiển thị thông tin SP</span></label>
                      <label className="toggle-label"><input type="checkbox" checked={form.showDistributorInfo} onChange={e => setForm({...form, showDistributorInfo: e.target.checked})} /><span className="toggle-switch"></span><span>Hiển thị điểm bán</span></label>
                      <label className="toggle-label"><input type="checkbox" checked={form.showScanCount} onChange={e => setForm({...form, showScanCount: e.target.checked})} /><span className="toggle-switch"></span><span>Hiển thị lượt quét</span></label>
                      <label className="toggle-label"><input type="checkbox" checked={form.showRelatedProducts} onChange={e => setForm({...form, showRelatedProducts: e.target.checked})} /><span className="toggle-switch"></span><span>Hiển thị sản phẩm liên quan</span></label>
                    </div>
                  </>
                ) : (
                  <div className="content-editor-section">
                    <div className="editor-group-title">1. Tiêu Đề Đầu Trang</div>
                    <div className="input-group-row">
                      <div className="input-group">
                        <label>Dòng tiêu đề 1</label>
                        <input
                          className="input"
                          value={form.contentConfig.headerTitle1}
                          onChange={e => updateContentField('headerTitle1', e.target.value)}
                          placeholder="VD: GIẢI PHÁP QRcode"
                        />
                      </div>
                      <div className="input-group">
                        <label>Dòng tiêu đề 2 (In hoa lớn)</label>
                        <input
                          className="input"
                          value={form.contentConfig.headerTitle2}
                          onChange={e => updateContentField('headerTitle2', e.target.value)}
                          placeholder="VD: TEM BẢO HÀNH SẢN PHẨM"
                        />
                      </div>
                    </div>

                    <div className="editor-group-title" style={{ marginTop: 16 }}>2. Khung Cam Kết Minh Bạch (Nền Xanh Lá)</div>
                    <div className="input-group-row">
                      <div className="input-group">
                        <label>Cam kết Dòng 1</label>
                        <input
                          className="input"
                          value={form.contentConfig.transparencyLine1}
                          onChange={e => updateContentField('transparencyLine1', e.target.value)}
                          placeholder="VD: SẢN PHẨM ĐÃ ĐƯỢC NHÀ CUNG CẤP"
                        />
                      </div>
                      <div className="input-group">
                        <label>Cam kết Dòng 2</label>
                        <input
                          className="input"
                          value={form.contentConfig.transparencyLine2}
                          onChange={e => updateContentField('transparencyLine2', e.target.value)}
                          placeholder="VD: CAM KẾT MINH BẠCH THÔNG TIN"
                        />
                      </div>
                    </div>

                    <div className="editor-group-title" style={{ marginTop: 16 }}>3. Bộ 4 Icon Thông Số Kỹ Thuật</div>
                    <div className="specs-editor-grid">
                      <div className="spec-item-group">
                        <label className="spec-lbl">Ô 1 (Nhãn &amp; Giá trị)</label>
                        <input className="input sm" value={form.contentConfig.spec1Label} onChange={e => updateContentField('spec1Label', e.target.value)} placeholder="Nhãn: Dung tích" />
                        <input className="input sm" value={form.contentConfig.spec1Value} onChange={e => updateContentField('spec1Value', e.target.value)} placeholder="Giá trị: 1.8L" />
                      </div>
                      <div className="spec-item-group">
                        <label className="spec-lbl">Ô 2 (Nhãn &amp; Giá trị)</label>
                        <input className="input sm" value={form.contentConfig.spec2Label} onChange={e => updateContentField('spec2Label', e.target.value)} placeholder="Nhãn: Công suất" />
                        <input className="input sm" value={form.contentConfig.spec2Value} onChange={e => updateContentField('spec2Value', e.target.value)} placeholder="Giá trị: 1200W" />
                      </div>
                      <div className="spec-item-group">
                        <label className="spec-lbl">Ô 3 (Nhãn &amp; Giá trị)</label>
                        <input className="input sm" value={form.contentConfig.spec3Label} onChange={e => updateContentField('spec3Label', e.target.value)} placeholder="Nhãn: Lòng nồi/Vật liệu" />
                        <input className="input sm" value={form.contentConfig.spec3Value} onChange={e => updateContentField('spec3Value', e.target.value)} placeholder="Giá trị: Inox 304" />
                      </div>
                      <div className="spec-item-group">
                        <label className="spec-lbl">Ô 4 (Nhãn &amp; Giá trị)</label>
                        <input className="input sm" value={form.contentConfig.spec4Label} onChange={e => updateContentField('spec4Label', e.target.value)} placeholder="Nhãn: Bảo hành" />
                        <input className="input sm" value={form.contentConfig.spec4Value} onChange={e => updateContentField('spec4Value', e.target.value)} placeholder="Giá trị: 24 tháng" />
                      </div>
                    </div>

                    <div className="editor-group-title" style={{ marginTop: 16 }}>4. 5 Thẻ Lợi Ích Ở Chân Trang</div>
                    <div className="benefits-editor-list">
                      <div className="benefit-edit-row">
                        <span className="benefit-idx">#1</span>
                        <input className="input sm" value={form.contentConfig.benefit1Title} onChange={e => updateContentField('benefit1Title', e.target.value)} placeholder="Tiêu đề: ĐẢM BẢO CHÍNH HÃNG" />
                        <input className="input sm wide" value={form.contentConfig.benefit1Desc} onChange={e => updateContentField('benefit1Desc', e.target.value)} placeholder="Mô tả: Xác thực nguồn gốc..." />
                      </div>

                      <div className="benefit-edit-row">
                        <span className="benefit-idx">#2</span>
                        <input className="input sm" value={form.contentConfig.benefit2Title} onChange={e => updateContentField('benefit2Title', e.target.value)} placeholder="Tiêu đề: BẢO HÀNH ĐIỆN TỬ" />
                        <input className="input sm wide" value={form.contentConfig.benefit2Desc} onChange={e => updateContentField('benefit2Desc', e.target.value)} placeholder="Mô tả: Kích hoạt nhanh..." />
                      </div>

                      <div className="benefit-edit-row">
                        <span className="benefit-idx">#3</span>
                        <input className="input sm" value={form.contentConfig.benefit3Title} onChange={e => updateContentField('benefit3Title', e.target.value)} placeholder="Tiêu đề: HỖ TRỢ NHANH CHÓNG" />
                        <input className="input sm wide" value={form.contentConfig.benefit3Desc} onChange={e => updateContentField('benefit3Desc', e.target.value)} placeholder="Mô tả: Tiếp nhận hỗ trợ..." />
                      </div>

                      <div className="benefit-edit-row">
                        <span className="benefit-idx">#4</span>
                        <input className="input sm" value={form.contentConfig.benefit4Title} onChange={e => updateContentField('benefit4Title', e.target.value)} placeholder="Tiêu đề: ƯU ĐÃI ĐẶC QUYỀN" />
                        <input className="input sm wide" value={form.contentConfig.benefit4Desc} onChange={e => updateContentField('benefit4Desc', e.target.value)} placeholder="Mô tả: Nhận thông tin km..." />
                      </div>

                      <div className="benefit-edit-row">
                        <span className="benefit-idx">#5</span>
                        <input className="input sm" value={form.contentConfig.benefit5Title} onChange={e => updateContentField('benefit5Title', e.target.value)} placeholder="Tiêu đề: BẢO VỆ QUYỀN LỢI" />
                        <input className="input sm wide" value={form.contentConfig.benefit5Desc} onChange={e => updateContentField('benefit5Desc', e.target.value)} placeholder="Mô tả: An tâm sử dụng..." />
                      </div>
                    </div>

                    <div className="editor-group-title" style={{ marginTop: 16 }}>5. Ghi Chú Nhà Sản Xuất</div>
                    <div className="input-group">
                      <label>Đoạn văn bản giới thiệu ở khối Nhà Sản Xuất</label>
                      <textarea
                        className="input textarea"
                        rows={3}
                        value={form.contentConfig.manufacturerNote}
                        onChange={e => updateContentField('manufacturerNote', e.target.value)}
                        placeholder="Nhập đoạn văn bản giới thiệu uy tín thương hiệu..."
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary"><Save size={16}/> Lưu Thay Đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Preview Modal */}
      {previewTemplate && (
        <div className="modal-overlay" onClick={() => setPreviewTemplate(null)}>
          <div className="preview-modal animate-scale-in" style={{
            background: previewTemplate.backgroundColor || '#f0f4f8', 
            color: previewTemplate.textColor || '#0f172a',
            backgroundImage: previewTemplate.backgroundImage ? `url(${previewTemplate.backgroundImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            maxWidth: 640
          }}>
            <button className="preview-close btn-icon" onClick={() => setPreviewTemplate(null)}><X size={24}/></button>
            <div className="preview-full">
              <h3 style={{ color: '#0d47a1', textAlign: 'center', marginBottom: 4, fontWeight: 900 }}>
                {previewTemplate.contentConfig?.headerTitle1 || 'GIẢI PHÁP QRcode'}
              </h3>
              <h2 style={{ color: '#0d47a1', textAlign: 'center', marginTop: 0, fontWeight: 900 }}>
                {previewTemplate.contentConfig?.headerTitle2 || 'TEM BẢO HÀNH SẢN PHẨM'}
              </h2>

              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: 12, textAlign: 'center', margin: '16px 0' }}>
                <div style={{ color: '#15803d', fontWeight: 800, fontSize: '0.9rem' }}>
                  {previewTemplate.contentConfig?.transparencyLine1 || 'SẢN PHẨM ĐÃ ĐƯỢC NHÀ CUNG CẤP'}
                </div>
                <div style={{ color: '#166534', fontWeight: 900, fontSize: '1rem' }}>
                  {previewTemplate.contentConfig?.transparencyLine2 || 'CAM KẾT MINH BẠCH THÔNG TIN'}
                </div>
              </div>

              <div style={{ background: '#ffffff', borderRadius: 10, padding: 14, border: '1px solid #e2e8f0', margin: '16px 0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{previewTemplate.contentConfig?.spec1Label || 'Dung tích'}</div>
                    <div style={{ fontWeight: 800, color: '#0d47a1', fontSize: '0.85rem' }}>{previewTemplate.contentConfig?.spec1Value || '1.8L'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{previewTemplate.contentConfig?.spec2Label || 'Công suất'}</div>
                    <div style={{ fontWeight: 800, color: '#0d47a1', fontSize: '0.85rem' }}>{previewTemplate.contentConfig?.spec2Value || '1200W'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{previewTemplate.contentConfig?.spec3Label || 'Lòng nồi'}</div>
                    <div style={{ fontWeight: 800, color: '#0d47a1', fontSize: '0.85rem' }}>{previewTemplate.contentConfig?.spec3Value || 'Inox 304'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{previewTemplate.contentConfig?.spec4Label || 'Bảo hành'}</div>
                    <div style={{ fontWeight: 800, color: '#0d47a1', fontSize: '0.85rem' }}>{previewTemplate.contentConfig?.spec4Value || '24 tháng'}</div>
                  </div>
                </div>
              </div>

              <div className="preview-footer" style={{ marginTop: 20 }}>Template: {previewTemplate.name}</div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="toast-notification animate-fade-in" style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid #22c55e',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: 10,
          boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          backdropFilter: 'blur(8px)',
          fontSize: '0.9rem',
          fontWeight: 600
        }}>
          <CheckCircle size={18} style={{ color: '#22c55e', flexShrink: 0 }} />
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}

function Edit({ size }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>;
}
