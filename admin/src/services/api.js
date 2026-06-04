const API_BASE = 'http://localhost:5000/api';

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

  // Accounts
  getAccounts(params) { return this.request('GET', '/accounts', null, params); }
  createAccount(data) { return this.request('POST', '/accounts', data); }
  updateAccount(id, data) { return this.request('PUT', `/accounts/${id}`, data); }
  renewAccount(id, data) { return this.request('PUT', `/accounts/${id}/renew`, data); }
  deleteAccount(id) { return this.request('DELETE', `/accounts/${id}`); }

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
}

const api = new ApiService();
export default api;
