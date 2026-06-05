import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  BarChart3, MapPin, Eye, Search, Calendar, Clock,
  Smartphone, Monitor, Tablet
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import './Analytics.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('history');
  const [scans, setScans] = useState([]);
  const [locations, setLocations] = useState([]);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanPagination, setScanPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  useEffect(() => { loadData(); }, [activeTab, scanPagination.page]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'history') {
        const r = await api.getScans({ page: scanPagination.page, limit: 30 });
        setScans(r.data);
        setScanPagination(p => ({ ...p, ...r.pagination }));
      } else if (activeTab === 'map') {
        const [locs, chartData] = await Promise.all([api.getScanLocations(), api.getCharts()]);
        setLocations(locs);
        setCharts(chartData);
      } else if (activeTab === 'demo') {
        const chartData = await api.getCharts();
        setCharts(chartData);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const formatDateTime = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getDeviceIcon = (type) => {
    switch(type) {
      case 'mobile': return <Smartphone size={14}/>;
      case 'tablet': return <Tablet size={14}/>;
      case 'desktop': return <Monitor size={14}/>;
      default: return <Smartphone size={14}/>;
    }
  };

  const tabs = [
    { id: 'history', label: 'Lịch sử quét tem', icon: Clock },
    { id: 'map', label: 'Bản đồ vị trí quét', icon: MapPin },
    { id: 'demo', label: 'Xem Demo hiển thị', icon: Eye },
  ];

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1e293b', titleColor: '#f1f5f9', bodyColor: '#94a3b8', borderColor: '#334155', borderWidth: 1, cornerRadius: 8, padding: 12 } },
    scales: {
      x: { grid: { color: 'rgba(148,163,184,0.06)' }, ticks: { color: '#64748b', font: { size: 11 } } },
      y: { grid: { color: 'rgba(148,163,184,0.06)' }, ticks: { color: '#64748b', font: { size: 11 } } }
    }
  };

  return (
    <div className="analytics-page">
      <div className="page-header">
        <h1>Báo cáo & Thống kê</h1>
        <p>Theo dõi lịch sử quét tem, vị trí và thống kê chi tiết</p>
      </div>

      <div className="tabs">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return <button key={tab.id} className={`tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}><Icon size={16}/> {tab.label}</button>;
        })}
      </div>

      {loading ? (
        <div className="loading-overlay"><div className="loading-spinner" style={{width:40,height:40}}></div></div>
      ) : (
        <>
          {/* Scan History */}
          {activeTab === 'history' && (
            <>
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title"><Clock size={20}/> Lịch sử quét tem ({scanPagination.total} bản ghi)</h3>
                </div>
                <div className="table-container" style={{border:'none'}}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Thời gian</th>
                        <th>Serial</th>
                        <th>Sản phẩm</th>
                        <th>Thành phố</th>
                        <th>Thiết bị</th>
                        <th>IP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scans.length === 0 ? (
                        <tr><td colSpan={6}><div className="empty-state"><BarChart3 size={40}/><h3>Chưa có dữ liệu quét</h3></div></td></tr>
                      ) : (
                        scans.map(scan => (
                          <tr key={scan._id}>
                            <td><span className="scan-time">{formatDateTime(scan.scannedAt)}</span></td>
                            <td><span className="serial-number">{scan.serialNumber || scan.labelId?.serialNumber || '—'}</span></td>
                            <td>{scan.productId?.name || '—'}</td>
                            <td>
                              <div className="location-cell">
                                <MapPin size={14}/>
                                {scan.location?.city || 'Không xác định'}
                              </div>
                            </td>
                            <td><span className="device-badge">{getDeviceIcon(scan.deviceType)} {scan.deviceType}</span></td>
                            <td><span className="ip-address">{scan.ipAddress}</span></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              {scanPagination.totalPages > 1 && (
                <div className="pagination">
                  <button className="pagination-btn" disabled={scanPagination.page <= 1} onClick={() => setScanPagination(p => ({...p, page: p.page - 1}))}>‹</button>
                  {Array.from({length: Math.min(scanPagination.totalPages, 10)}, (_, i) => (
                    <button key={i+1} className={`pagination-btn ${scanPagination.page === i+1 ? 'active' : ''}`}
                      onClick={() => setScanPagination(p => ({...p, page: i+1}))}>{i+1}</button>
                  ))}
                  <button className="pagination-btn" disabled={scanPagination.page >= scanPagination.totalPages} onClick={() => setScanPagination(p => ({...p, page: p.page + 1}))}>›</button>
                </div>
              )}
            </>
          )}

          {/* Map View */}
          {activeTab === 'map' && (
            <div className="map-section">
              <div className="card" style={{gridColumn: 'span 2'}}>
                <div className="card-header">
                  <h3 className="card-title"><MapPin size={20}/> Vị trí quét tem</h3>
                  <span className="badge badge-info">{locations.length} điểm quét</span>
                </div>
                <div className="map-placeholder">
                  <MapPin size={60} />
                  <h3>Bản đồ vị trí quét tem</h3>
                  <p>Hiển thị {locations.length} vị trí quét trên bản đồ</p>
                  <div className="location-list">
                    {locations.slice(0, 20).map((loc, idx) => (
                      <div key={idx} className="location-item">
                        <MapPin size={14} className="text-accent"/>
                        <span>{loc.location?.city || 'N/A'}</span>
                        <span className="location-coords">{loc.location?.lat?.toFixed(4)}, {loc.location?.lng?.toFixed(4)}</span>
                        <span className="location-time">{formatDateTime(loc.scannedAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {charts && (
                <div className="card">
                  <div className="card-header"><h3 className="card-title">Quét theo thành phố</h3></div>
                  <div style={{height: 300}}>
                    <Bar data={{
                      labels: charts.scansByCity?.map(d => d._id || 'N/A') || [],
                      datasets: [{ label: 'Lượt quét', data: charts.scansByCity?.map(d => d.count) || [], backgroundColor: 'rgba(99,102,241,0.6)', borderColor: '#6366f1', borderWidth: 1, borderRadius: 6 }]
                    }} options={chartOptions} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Demo View */}
          {activeTab === 'demo' && (
            <div className="demo-section">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title"><Eye size={20}/> Demo hiển thị tem</h3>
                </div>
                <div className="demo-container">
                  <div className="demo-phone">
                    <div className="phone-notch"></div>
                    <div className="phone-screen">
                      <div className="demo-scan-result">
                        <div className="demo-badge-verified">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                          <span>Sản phẩm chính hãng</span>
                        </div>
                        <div className="demo-product">
                          <div className="demo-product-image">📦</div>
                          <h3>Nước mắm Việt Hương Premium</h3>
                          <p className="demo-product-desc">Nước mắm cá cơm truyền thống, ủ 12 tháng</p>
                        </div>
                        <div className="demo-info-section">
                          <h4>Nhà sản xuất</h4>
                          <p>Công ty TNHH Thực phẩm Việt Hương</p>
                        </div>
                        <div className="demo-info-section">
                          <h4>Điểm bán</h4>
                          <p>Siêu thị Co.opMart - Q.1, TP.HCM</p>
                        </div>
                        <div className="demo-serial">Serial: VH-000001</div>
                      </div>
                    </div>
                  </div>
                  <div className="demo-details">
                    <h3>Cách hiển thị khi quét tem</h3>
                    <p>Khi người tiêu dùng quét mã QR trên tem, trang hiển thị sẽ bao gồm:</p>
                    <ul>
                      <li>✅ Badge xác nhận sản phẩm chính hãng</li>
                      <li>📦 Thông tin sản phẩm (tên, ảnh, mô tả)</li>
                      <li>🏢 Thông tin nhà sản xuất</li>
                      <li>📍 Điểm bán / nhà phân phối</li>
                      <li>🔢 Serial number và lượt quét</li>
                    </ul>
                    <p className="demo-note" style={{ marginBottom: '16px' }}>Giao diện có thể tùy chỉnh theo template của doanh nghiệp tại mục "Cấu hình Giao diện".</p>
                    <a href="/scan/VH-000001" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                      <Eye size={16} /> Mở Trang Quét Thực Tế (Test)
                    </a>
                  </div>
                </div>
              </div>

              {charts && (
                <div className="chart-row">
                  <div className="card">
                    <div className="card-header"><h3 className="card-title">Thiết bị quét</h3></div>
                    <div style={{height: 250}}>
                      <Doughnut data={{
                        labels: charts.scansByDevice?.map(d => d._id || 'Khác') || [],
                        datasets: [{ data: charts.scansByDevice?.map(d => d.count) || [], backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444'], borderWidth: 0 }]
                      }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 12, usePointStyle: true } } }, cutout: '65%' }} />
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-header"><h3 className="card-title">Xu hướng quét (30 ngày)</h3></div>
                    <div style={{height: 250}}>
                      <Line data={{
                        labels: charts.dailyScans?.map(d => { const dt = new Date(d._id); return `${dt.getDate()}/${dt.getMonth()+1}`; }) || [],
                        datasets: [{ data: charts.dailyScans?.map(d => d.count) || [], borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', fill: true, tension: 0.4, borderWidth: 2, pointRadius: 2 }]
                      }} options={chartOptions} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
