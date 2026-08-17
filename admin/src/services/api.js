// API base URL:
// - Local dev: dùng localhost:5000 trực tiếp
// - Production (trên Vercel): dùng /api (proxy qua vercel.json rewrites đến server cPanel)
const API_BASE = import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api');

// Timeout mặc định cho mỗi API request (ms)
const DEFAULT_TIMEOUT_MS = 30000;

class ApiService {
  constructor() {
    this.baseUrl = API_BASE;
  }

  getToken() {
    return localStorage.getItem('tem_token');
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  /**
   * Thực hiện HTTP request với retry và exponential backoff.
   * @param {string} method  - HTTP method (GET, POST, PUT, DELETE, PATCH)
   * @param {string} endpoint - API path (vd: '/auth/login')
   * @param {object|null} data   - Request body (chỉ cho POST/PUT)
   * @param {object} params      - Query string params
   * @param {number} _retryCount - Số lần đã retry (nội bộ)
   */
  async request(method, endpoint, data = null, params = {}, _retryCount = 0) {
    const MAX_RETRIES = 2; // Tối đa 3 lần (lần 0 + 2 lần retry)

    // Exponential backoff: 800ms, 1600ms
    const RETRY_DELAY_MS = 800 * Math.pow(2, _retryCount);

    const url = new URL(`${this.baseUrl}${endpoint}`, window.location.origin);
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        url.searchParams.append(key, val);
      }
    });

    const options = {
      method,
      headers: this.getHeaders(),
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS), // Tự cancel sau 30s
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    let response;
    let text;

    try {
      response = await fetch(url.toString(), options);
      text = await response.text();
    } catch (networkError) {
      const isTimeout = networkError?.name === 'TimeoutError' || networkError?.name === 'AbortError';

      // Retry khi lỗi mạng hoặc timeout
      if (_retryCount < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
        return this.request(method, endpoint, data, params, _retryCount + 1);
      }

      if (isTimeout) {
        throw new Error('Yêu cầu hết thời gian chờ. Máy chủ có thể đang bận, vui lòng thử lại.');
      }
      throw new Error('Không kết nối được đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
    }

    // Nếu response body rỗng → server chưa sẵn sàng hoặc crash mid-request, thử lại
    if (!text && _retryCount < MAX_RETRIES) {
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
      return this.request(method, endpoint, data, params, _retryCount + 1);
    }

    let result = null;

    if (text) {
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        // Parse thất bại (HTML error page từ cPanel) – thử lại nếu còn lượt
        if (_retryCount < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
          return this.request(method, endpoint, data, params, _retryCount + 1);
        }
        // Log để debug sau
        console.warn('[API] Phản hồi không phải JSON:', text.substring(0, 200));
        result = { error: 'Phản hồi máy chủ không hợp lệ. Vui lòng thử lại.' };
      }
    }

    if (!response.ok) {
      // Phiên đăng nhập bị chiếm từ thiết bị khác
      if (response.status === 401 && result && result.code === 'SESSION_SUPERSEDED') {
        localStorage.removeItem('tem_token');
        localStorage.removeItem('npp_scan_token');
        localStorage.removeItem('npp_scan_user');
        alert('⚠️ CẢNH BÁO BẢO MẬT:\nTài khoản của bạn vừa được đăng nhập từ một thiết bị hoặc trình duyệt khác.\nPhiên làm việc trên thiết bị này đã bị chấm dứt.');
        window.location.href = '/login?reason=session_superseded';
      }

      // Với lỗi 503 (server bị quá tải/timeout) thử lại
      if (response.status === 503 && _retryCount < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
        return this.request(method, endpoint, data, params, _retryCount + 1);
      }

      const message = (result && (result.error || result.message)) || response.statusText || 'Có lỗi xảy ra';
      throw new Error(message);
    }

    return result;
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  login(credentials) { return this.request('POST', '/auth/login', credentials); }
  getMe() { return this.request('GET', '/auth/me'); }
  changePassword(data) { return this.request('POST', '/auth/change-password', data); }
  updateProfile(data) { return this.request('PUT', '/auth/profile', data); }

  // ── Accounts ──────────────────────────────────────────────────────────────
  getAccounts(params) { return this.request('GET', '/accounts', null, params); }
  createAccount(data) { return this.request('POST', '/accounts', data); }
  updateAccount(id, data) { return this.request('PUT', `/accounts/${id}`, data); }
  renewAccount(id, data) { return this.request('PUT', `/accounts/${id}/renew`, data); }
  deleteAccount(id) { return this.request('DELETE', `/accounts/${id}`); }
  backupDatabase() { return this.request('GET', '/accounts/backup-database'); }

  // ── Distributors ──────────────────────────────────────────────────────────
  getDistributors(params) { return this.request('GET', '/accounts/distributors', null, params); }
  createDistributor(data) { return this.request('POST', '/accounts/distributors', data); }
  updateDistributor(id, data) { return this.request('PUT', `/accounts/distributors/${id}`, data); }
  deleteDistributor(id) { return this.request('DELETE', `/accounts/distributors/${id}`); }

  // ── Enterprises ───────────────────────────────────────────────────────────
  getEnterprises() { return this.request('GET', '/enterprises'); }
  getEnterprise(id) { return this.request('GET', `/enterprises/${id}`); }
  createEnterprise(data) { return this.request('POST', '/enterprises', data); }
  updateEnterprise(id, data) { return this.request('PUT', `/enterprises/${id}`, data); }
  deleteEnterprise(id) { return this.request('DELETE', `/enterprises/${id}`); }
  updateDomain(id, data) { return this.request('PUT', `/enterprises/${id}/domain`, data); }
  updateChatbot(id, data) { return this.request('PUT', `/enterprises/${id}/chatbot`, data); }

  // ── Products ──────────────────────────────────────────────────────────────
  getProducts(params) { return this.request('GET', '/products', null, params); }
  getProduct(id) { return this.request('GET', `/products/${id}`); }
  createProduct(data) { return this.request('POST', '/products', data); }
  updateProduct(id, data) { return this.request('PUT', `/products/${id}`, data); }
  deleteProduct(id) { return this.request('DELETE', `/products/${id}`); }

  // ── Labels ────────────────────────────────────────────────────────────────
  getBatches(params) { return this.request('GET', '/labels/batches', null, params); }
  getNextSerial() { return this.request('GET', '/labels/next-serial'); }
  clearAllLabels() { return this.request('DELETE', '/labels/clear-all'); }
  createBatch(data) { return this.request('POST', '/labels/batches', data); }
  updateBatchStatus(id, data) { return this.request('PUT', `/labels/batches/${id}/status`, data); }
  mapBatchProduct(id, data) { return this.request('POST', `/labels/batches/${id}/map-product`, data); }
  renewBatch(id, data) { return this.request('PUT', `/labels/batches/${id}/renew`, data); }
  deleteBatch(id) { return this.request('DELETE', `/labels/batches/${id}`); }
  migrateLabels(data) { return this.request('POST', '/labels/migrate', data); }
  getLabels(params) { return this.request('GET', '/labels', null, params); }
  mapLabel(id, data) { return this.request('PUT', `/labels/${id}/map`, data); }
  updateLabelStatus(id, data) { return this.request('PUT', `/labels/${id}/status`, data); }
  bulkMapLabels(data) { return this.request('POST', '/labels/bulk-map', data); }
  fixEncryption(data) { return this.request('POST', '/labels/fix-encryption', data); }
  exportBatchLabels(batchId) { return this.request('GET', '/labels/export', null, { batchId }); }
  exportFilteredLabels(params) { return this.request('GET', '/labels/export-all', null, params); }

  // ── Analytics ─────────────────────────────────────────────────────────────
  getOverview() { return this.request('GET', '/analytics/overview'); }
  getScans(params) { return this.request('GET', '/analytics/scans', null, params); }
  getScanLocations() { return this.request('GET', '/analytics/scan-locations'); }
  getCharts() { return this.request('GET', '/analytics/charts'); }

  // ── Templates ─────────────────────────────────────────────────────────────
  getTemplates() { return this.request('GET', '/templates'); }
  getTemplate(id) { return this.request('GET', `/templates/${id}`); }
  createTemplate(data) { return this.request('POST', '/templates', data); }
  updateTemplate(id, data) { return this.request('PUT', `/templates/${id}`, data); }
  deleteTemplate(id) { return this.request('DELETE', `/templates/${id}`); }

  // ── Public scan ───────────────────────────────────────────────────────────
  getPublicScan(serial) { return this.request('GET', `/public/scan/${serial}`); }
  getPublicBarcode(barcode) { return this.request('GET', `/public/barcode/${barcode}`); }
  sendScanLocation(serial, data) { return this.request('POST', `/public/scan/${serial}/location`, data); }

  // ── NPP distributor features ──────────────────────────────────────────────
  nppLogin(credentials) { return this.request('POST', '/public/npp-login', credentials); }
  nppRegister(data) { return this.request('POST', '/public/npp-register', data); }
  nppScanSerial(data) { return this.request('POST', '/public/distributor-entry-single', data); }
  nppGetHistory() { return this.request('GET', '/public/npp-scan-history'); }
  getPublicDistributors(enterpriseId) { return this.request('GET', `/public/distributors/${enterpriseId}`); }
  submitDistributorEntry(data) { return this.request('POST', '/public/distributor-entry', data); }

  // ── Admin impersonation ───────────────────────────────────────────────────
  adminLoginAs() { return this.request('POST', '/public/admin-login-as'); }

  // ── Label Designs (Quản lý mẫu tem) ──────────────────────────────────────
  getLabelDesigns(params) { return this.request('GET', '/label-designs', null, params); }
  getLabelDesign(id) { return this.request('GET', `/label-designs/${id}`); }
  createLabelDesign(data) { return this.request('POST', '/label-designs', data); }
  updateLabelDesign(id, data) { return this.request('PUT', `/label-designs/${id}`, data); }
  deleteLabelDesign(id) { return this.request('DELETE', `/label-designs/${id}`); }
}

const api = new ApiService();
export default api;
