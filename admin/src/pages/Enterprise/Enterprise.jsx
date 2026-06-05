import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
  Building2, Globe, MessageSquare, Save, ExternalLink
} from 'lucide-react';
import './Enterprise.css';

export default function Enterprise() {
  const { user, enterpriseId } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab based on route path
  let activeTab = 'info';
  if (location.pathname.endsWith('/domain')) {
    activeTab = 'domain';
  } else if (location.pathname.endsWith('/chatbot')) {
    activeTab = 'chatbot';
  }

  const [enterprise, setEnterprise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [domainForm, setDomainForm] = useState({ domain: '', subdomain: '' });
  const [chatbotForm, setChatbotForm] = useState({ enabled: false, script: '', welcomeMessage: '' });

  useEffect(() => { loadEnterprise(); }, []);

  const loadEnterprise = async () => {
    try {
      if (enterpriseId) {
        const data = await api.getEnterprise(enterpriseId);
        setEnterprise(data);
        setForm({ name: data.name, address: data.address, phone: data.phone, email: data.email, website: data.website, taxCode: data.taxCode });
        setDomainForm({ domain: data.domain || '', subdomain: data.subdomain || '' });
        setChatbotForm(data.chatbotConfig || { enabled: false, script: '', welcomeMessage: '' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInfo = async () => {
    setSaving(true);
    try {
      await api.updateEnterprise(enterpriseId, form);
      alert('Cập nhật thành công!');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDomain = async () => {
    setSaving(true);
    try {
      await api.updateDomain(enterpriseId, domainForm);
      alert('Cập nhật domain thành công!');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveChatbot = async () => {
    setSaving(true);
    try {
      await api.updateChatbot(enterpriseId, { chatbotConfig: chatbotForm });
      alert('Cập nhật chatbot thành công!');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-overlay"><div className="loading-spinner" style={{width:40,height:40}}></div></div>;

  if (!enterprise) {
    return (
      <div className="empty-state">
        <Building2 size={60} />
        <h3>Chưa có thông tin doanh nghiệp</h3>
        <p>Vui lòng liên hệ Admin để được cấu hình.</p>
      </div>
    );
  }

  const tabs = [
    { id: 'info', label: 'Thông tin công ty', icon: Building2 },
    { id: 'domain', label: 'Cấu hình Domain', icon: Globe },
    { id: 'chatbot', label: 'Cài đặt Chatbot', icon: MessageSquare },
  ];

  return (
    <div className="enterprise-page">
      <div className="page-header">
        <h1>Cấu hình Doanh nghiệp</h1>
        <p>Quản lý thông tin công ty, domain và chatbot</p>
      </div>

      <div className="tabs">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button 
              key={tab.id} 
              className={`tab ${activeTab === tab.id ? 'active' : ''}`} 
              onClick={() => {
                if (tab.id === 'info') navigate('/enterprise');
                else if (tab.id === 'domain') navigate('/enterprise/domain');
                else if (tab.id === 'chatbot') navigate('/enterprise/chatbot');
              }}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="card animate-fade-in-up">
        {activeTab === 'info' && (
          <>
            <div className="card-header">
              <h3 className="card-title">Thông tin Doanh nghiệp</h3>
              <span className={`badge badge-dot ${enterprise.type === 'NSX' ? 'badge-success' : 'badge-warning'}`}>
                {enterprise.type === 'NSX' ? 'Nhà sản xuất' : 'Nhà phân phối'}
              </span>
            </div>
            <div className="form-grid">
              <div className="input-group"><label>Tên công ty</label><input className="input" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div className="input-group"><label>Mã số thuế</label><input className="input" value={form.taxCode || ''} onChange={e => setForm({...form, taxCode: e.target.value})} /></div>
              <div className="input-group" style={{gridColumn:'span 2'}}><label>Địa chỉ</label><input className="input" value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} /></div>
              <div className="input-group"><label>Số điện thoại</label><input className="input" value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} /></div>
              <div className="input-group"><label>Email</label><input className="input" type="email" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} /></div>
              <div className="input-group"><label>Website</label><input className="input" value={form.website || ''} onChange={e => setForm({...form, website: e.target.value})} /></div>
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" onClick={handleSaveInfo} disabled={saving}>
                <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </>
        )}

        {activeTab === 'domain' && (
          <>
            <div className="card-header">
              <h3 className="card-title">Cấu hình Domain</h3>
            </div>
            <div className="domain-info-box">
              <Globe size={20} />
              <p>Cấu hình domain/subdomain riêng cho trang hiển thị tem của doanh nghiệp bạn.</p>
            </div>
            <div className="form-grid">
              <div className="input-group"><label>Domain chính</label><input className="input" value={domainForm.domain} onChange={e => setDomainForm({...domainForm, domain: e.target.value})} placeholder="vd: tem.congty.vn" /></div>
              <div className="input-group"><label>Subdomain</label><input className="input" value={domainForm.subdomain} onChange={e => setDomainForm({...domainForm, subdomain: e.target.value})} placeholder="vd: congty" /></div>
            </div>
            {domainForm.domain && (
              <div className="domain-preview">
                <ExternalLink size={14}/> <span>URL hiển thị: <strong>https://{domainForm.domain}</strong></span>
              </div>
            )}
            <div className="form-actions">
              <button className="btn btn-primary" onClick={handleSaveDomain} disabled={saving}>
                <Save size={16} /> Lưu cấu hình Domain
              </button>
            </div>
          </>
        )}

        {activeTab === 'chatbot' && (
          <>
            <div className="card-header">
              <h3 className="card-title">Cài đặt Chatbot</h3>
            </div>
            <div className="form-grid">
              <div className="input-group" style={{gridColumn:'span 2'}}>
                <label className="toggle-label">
                  <input type="checkbox" checked={chatbotForm.enabled} onChange={e => setChatbotForm({...chatbotForm, enabled: e.target.checked})} />
                  <span className="toggle-switch"></span>
                  <span>Bật Chatbot trên trang hiển thị tem</span>
                </label>
              </div>
              <div className="input-group" style={{gridColumn:'span 2'}}>
                <label>Lời chào mừng</label>
                <input className="input" value={chatbotForm.welcomeMessage} onChange={e => setChatbotForm({...chatbotForm, welcomeMessage: e.target.value})} />
              </div>
              <div className="input-group" style={{gridColumn:'span 2'}}>
                <label>Script Chatbot (embed code)</label>
                <textarea className="input textarea" value={chatbotForm.script} onChange={e => setChatbotForm({...chatbotForm, script: e.target.value})} placeholder="Dán embed code chatbot tại đây..." rows={6} />
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" onClick={handleSaveChatbot} disabled={saving}>
                <Save size={16} /> Lưu cài đặt Chatbot
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
