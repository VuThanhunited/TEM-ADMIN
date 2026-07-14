const API_BASE = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api' 
    : 'https://tem-admin.onrender.com/api');

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

  async request(method, endpoint, data = null, params = {}) {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        url.searchParams.append(key, val);
      }
    });

    const options = {
      method,
      headers: this.getHeaders(),
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url.toString(), options);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Có lỗi xảy ra');
    }

    return result;
  }

  // Auth
  login(credentials) { return this.request('POST', '/auth/login', credentials); }
  getMe() { return this.request('GET', '/auth/me'); }
  changePassword(data) { return this.request('POST', '/auth/change-password', data); }
  updateProfile(data) { return this.request('PUT', '/auth/profile', data); }

  // Accounts
  getAccounts(params) { return this.request('GET', '/accounts', null, params); }
  createAccount(data) { return this.request('POST', '/accounts', data); }
  updateAccount(id, data) { return this.request('PUT', `/accounts/${id}`, data); }
  renewAccount(id, data) { return this.request('PUT', `/accounts/${id}/renew`, data); }
  deleteAccount(id) { return this.request('DELETE', `/accounts/${id}`); }

  // Distributors
  getDistributors(params) { return this.request('GET', '/accounts/distributors', null, params); }
  createDistributor(data) { return this.request('POST', '/accounts/distributors', data); }
  updateDistributor(id, data) { return this.request('PUT', `/accounts/distributors/${id}`, data); }
  deleteDistributor(id) { return this.request('DELETE', `/accounts/distributors/${id}`); }

  // Enterprises
  getEnterprises() { return this.request('GET', '/enterprises'); }
  getEnterprise(id) { return this.request('GET', `/enterprises/${id}`); }
  updateEnterprise(id, data) { return this.request('PUT', `/enterprises/${id}`, data); }
  updateDomain(id, data) { return this.request('PUT', `/enterprises/${id}/domain`, data); }
  updateChatbot(id, data) { return this.request('PUT', `/enterprises/${id}/chatbot`, data); }

  // Products
  getProducts(params) { return this.request('GET', '/products', null, params); }
  getProduct(id) { return this.request('GET', `/products/${id}`); }
  createProduct(data) { return this.request('POST', '/products', data); }
  updateProduct(id, data) { return this.request('PUT', `/products/${id}`, data); }
  deleteProduct(id) { return this.request('DELETE', `/products/${id}`); }

  // Labels
  getBatches(params) { return this.request('GET', '/labels/batches', null, params); }
  createBatch(data) { return this.request('POST', '/labels/batches', data); }
  updateBatchStatus(id, data) { return this.request('PUT', `/labels/batches/${id}/status`, data); }
  mapBatchProduct(id, data) { return this.request('POST', `/labels/batches/${id}/map-product`, data); }
  renewBatch(id, data) { return this.request('PUT', `/labels/batches/${id}/renew`, data); }
  migrateLabels(data) { return this.request('POST', '/labels/migrate', data); }
  getLabels(params) { return this.request('GET', '/labels', null, params); }
  mapLabel(id, data) { return this.request('PUT', `/labels/${id}/map`, data); }
  updateLabelStatus(id, data) { return this.request('PUT', `/labels/${id}/status`, data); }
  bulkMapLabels(data) { return this.request('POST', '/labels/bulk-map', data); }

  // Analytics
  getOverview() { return this.request('GET', '/analytics/overview'); }
  getScans(params) { return this.request('GET', '/analytics/scans', null, params); }
  getScanLocations() { return this.request('GET', '/analytics/scan-locations'); }
  getCharts() { return this.request('GET', '/analytics/charts'); }

  // Templates
  getTemplates() { return this.request('GET', '/templates'); }
  getTemplate(id) { return this.request('GET', `/templates/${id}`); }
  createTemplate(data) { return this.request('POST', '/templates', data); }
  updateTemplate(id, data) { return this.request('PUT', `/templates/${id}`, data); }
  deleteTemplate(id) { return this.request('DELETE', `/templates/${id}`); }
  
  // Public scan
  getPublicScan(serial) { return this.request('GET', `/public/scan/${serial}`); }
  getPublicBarcode(barcode) { return this.request('GET', `/public/barcode/${barcode}`); }
  sendScanLocation(serial, data) { return this.request('POST', `/public/scan/${serial}/location`, data); }

  // Public NPP distributor features (for NPP users logged into admin)
  nppLogin(credentials) { return this.request('POST', '/public/npp-login', credentials); }
  nppRegister(data) { return this.request('POST', '/public/npp-register', data); }
  nppScanSerial(data) { return this.request('POST', '/public/distributor-entry-single', data); }
  nppGetHistory() { return this.request('GET', '/public/npp-scan-history'); }
  getPublicDistributors(enterpriseId) { return this.request('GET', `/public/distributors/${enterpriseId}`); }
  submitDistributorEntry(data) { return this.request('POST', '/public/distributor-entry', data); }

  // Admin impersonation - lấy token NPP để truy cập trang user
  adminLoginAs() { return this.request('POST', '/public/admin-login-as'); }

  // Label Designs (Quản lý mẫu tem)
  getLabelDesigns(params) { return this.request('GET', '/label-designs', null, params); }
  getLabelDesign(id) { return this.request('GET', `/label-designs/${id}`); }
  createLabelDesign(data) { return this.request('POST', '/label-designs', data); }
  updateLabelDesign(id, data) { return this.request('PUT', `/label-designs/${id}`, data); }
  deleteLabelDesign(id) { return this.request('DELETE', `/label-designs/${id}`); }
}


const api = new ApiService();
export default api;
