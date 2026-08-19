const API_BASE =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api';

class UserApiService {
  constructor() {
    this.baseUrl = API_BASE;
  }

  getNppToken() {
    return localStorage.getItem('npp_scan_token');
  }

  getHeaders(useNppToken = true) {
    const headers = { 'Content-Type': 'application/json' };
    const token = useNppToken ? this.getNppToken() : null;
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  // Ping để warmup server (Render cold-start) – timeout ngắn 5s, không retry
  async ping() {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 5000);
      const baseUrl = this.baseUrl.startsWith('http')
        ? this.baseUrl
        : `${window.location.origin}${this.baseUrl}`;
      await fetch(`${baseUrl}/ping`, { signal: controller.signal });
      clearTimeout(id);
    } catch {
      // Ignore ping errors – đây chỉ là warmup
    }
  }

  async request(method, endpoint, data = null, params = {}, useNppToken = true, retries = 2, timeoutMs = 45000) {
    // Xây dựng URL an toàn – tránh throw khi baseUrl là relative path
    let urlString;
    try {
      const base = this.baseUrl.startsWith('http')
        ? this.baseUrl
        : `${window.location.origin}${this.baseUrl}`;
      const url = new URL(`${base}${endpoint}`);
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          url.searchParams.append(key, val);
        }
      });
      urlString = url.toString();
    } catch {
      // Fallback nếu URL construction lỗi
      const qs = Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
      urlString = `${this.baseUrl}${endpoint}${qs ? '?' + qs : ''}`;
    }

    const options = {
      method,
      headers: this.getHeaders(useNppToken),
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    // AbortController timeout – tăng lên 45s để chịu được Render cold-start
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    options.signal = controller.signal;

    let response;
    try {
      response = await fetch(urlString, options);
      clearTimeout(timeoutId);
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      // Retry khi gặp lỗi network hoặc timeout
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 3000)); // chờ 3s trước khi retry
        return this.request(method, endpoint, data, params, useNppToken, retries - 1, timeoutMs);
      }
      throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại.');
    }

    // Parse JSON an toàn – tránh crash khi body rỗng hoặc không phải JSON
    let result;
    try {
      const text = await response.text();
      result = text ? JSON.parse(text) : {};
    } catch {
      // Body rỗng hoặc không phải JSON – retry nếu còn lượt
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 1500));
        return this.request(method, endpoint, data, params, useNppToken, retries - 1);
      }
      throw new Error('Máy chủ trả về dữ liệu không hợp lệ. Vui lòng thử lại.');
    }

    if (!response.ok) {
      if (response.status === 401 && result.code === 'SESSION_SUPERSEDED') {
        localStorage.removeItem('npp_scan_token');
        localStorage.removeItem('npp_scan_user');
        alert('⚠️ CẢNH BÁO BẢO MẬT:\nTài khoản của bạn vừa được đăng nhập từ một thiết bị hoặc trình duyệt khác.\nPhiên làm việc trên thiết bị này đã bị chấm dứt.');
        window.location.href = '/login?reason=session_superseded';
      }
      throw new Error(result.error || 'Có lỗi xảy ra');
    }

    return result;
  }

  // Auth – login dùng timeout 50s để chịu Render cold-start
  nppLogin(credentials) {
    return this.request('POST', '/public/npp-login', credentials, {}, false, 2, 50000);
  }

  guestLogin(credentials) {
    return this.request('POST', '/public/guest-login', credentials, {}, false, 2, 50000);
  }

  // Public scan data
  getPublicScan(serial) {
    return this.request('GET', `/public/scan/${serial}`, null, {}, false);
  }

  getPublicBarcode(barcode) {
    return this.request('GET', `/public/barcode/${barcode}`, null, {}, false);
  }

  sendScanLocation(serial, data) {
    return this.request('POST', `/public/scan/${serial}/location`, data, {}, false);
  }

  // Distributors / Stores
  getPublicDistributors(enterpriseId) {
    return this.request('GET', `/public/distributors/${enterpriseId}`, null, {}, false);
  }

  // NPP stores list (per account / enterprise)
  getNppStores() {
    return this.request('GET', '/public/npp-stores');
  }

  // Submit distributor entry (one label = +1 product)
  submitSingleEntry(data) {
    return this.request('POST', '/public/distributor-entry-single', data);
  }

  // Fallback: use bulk-map endpoint for one serial
  submitDistributorEntry(data) {
    return this.request('POST', '/public/distributor-entry', data);
  }

  // Get scan history for NPP
  getNppScanHistory() {
    return this.request('GET', '/public/npp-scan-history');
  }

  // Get active enterprises for registration dropdown
  getPublicEnterprises() {
    return this.request('GET', '/public/enterprises', null, {}, false);
  }

  // Register new NPP account
  nppRegister(data) {
    return this.request('POST', '/public/npp-register', data, {}, false);
  }

  // Register new Guest (Consumer) account
  guestRegister(data) {
    return this.request('POST', '/public/guest-register', data, {}, false);
  }



  // Submit Contact Form
  submitContact(data) {
    return this.request('POST', '/public/contact', data, {}, false);
  }

  // Tìm enterprise theo custom domain (dùng cho custom domain routing)
  getEnterpriseByDomain(domain) {
    return this.request('GET', '/public/enterprise-by-domain', null, { domain }, false);
  }

  // Lấy hostname hiện tại (bỏ www., chỉ lấy domain)
  getCurrentDomain() {
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    const isVercel = hostname.endsWith('.vercel.app');
    const isSystemDomain = hostname.includes('giaiphapqrcode.vn');
    if (isLocal || isVercel || isSystemDomain) return null; // Domain hệ thống portal chính, không phải custom domain của doanh nghiệp
    return hostname.replace(/^www\./, '');
  }
}

const userApi = new UserApiService();
export default userApi;
