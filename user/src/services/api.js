const API_BASE =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://tem-admin.onrender.com/api';

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

  async request(method, endpoint, data = null, params = {}, useNppToken = true) {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        url.searchParams.append(key, val);
      }
    });

    const options = {
      method,
      headers: this.getHeaders(useNppToken),
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
  nppLogin(credentials) {
    return this.request('POST', '/public/npp-login', credentials, {}, false);
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

  // Guest (Consumer) login
  guestLogin(credentials) {
    return this.request('POST', '/public/guest-login', credentials, {}, false);
  }

  // Submit Contact Form
  submitContact(data) {
    return this.request('POST', '/public/contact', data, {}, false);
  }
}

const userApi = new UserApiService();
export default userApi;
