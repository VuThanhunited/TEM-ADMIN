import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
  Tag, ScanLine, Package, Building2, Users, Activity,
  TrendingUp, TrendingDown, BarChart3, MapPin, Clock
} from 'lucide-react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import './Dashboard.css';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [overview, chartData] = await Promise.all([
        api.getOverview(),
        api.getCharts()
      ]);
      setStats(overview);
      setCharts(chartData);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner" style={{width:40,height:40}}></div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Tổng số Tem',
      value: stats?.totalLabels || 0,
      icon: Tag,
      gradient: 'var(--gradient-primary)',
      change: '+12%',
      up: true
    },
    {
      label: 'Tem đang hoạt động',
      value: stats?.activeLabels || 0,
      icon: Activity,
      gradient: 'var(--gradient-success)',
      change: `${stats?.totalLabels ? Math.round((stats.activeLabels / stats.totalLabels) * 100) : 0}%`,
      up: true
    },
    {
      label: 'Tổng lượt quét',
      value: stats?.totalScans || 0,
      icon: ScanLine,
      gradient: 'linear-gradient(135deg, #06b6d4, #22d3ee)',
      change: `+${stats?.weeklyScans || 0} tuần này`,
      up: true
    },
    {
      label: 'Sản phẩm',
      value: stats?.totalProducts || 0,
      icon: Package,
      gradient: 'var(--gradient-warning)',
      change: `${stats?.totalBatches || 0} lô tem`,
      up: true
    },
  ];

  if (isAdmin) {
    statCards.push(
      {
        label: 'Doanh nghiệp',
        value: stats?.totalEnterprises || 0,
        icon: Building2,
        gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
        change: 'Đang hoạt động',
        up: true
      },
      {
        label: 'Tài khoản NSX/NPP',
        value: stats?.totalUsers || 0,
        icon: Users,
        gradient: 'linear-gradient(135deg, #ec4899, #f472b6)',
        change: 'Tổng cộng',
        up: true
      }
    );
  }

  // Chart configurations
  const dailyScanData = {
    labels: charts?.dailyScans?.map(d => {
      const date = new Date(d._id);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }) || [],
    datasets: [{
      label: 'Lượt quét',
      data: charts?.dailyScans?.map(d => d.count) || [],
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      fill: true,
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 6,
      pointBackgroundColor: '#6366f1',
    }]
  };

  const labelStatusData = {
    labels: charts?.labelsByStatus?.map(d => {
      switch(d._id) {
        case 'ACTIVE': return 'Hoạt động';
        case 'INACTIVE': return 'Chưa kích hoạt';
        case 'SCANNED': return 'Đã quét';
        case 'EXPIRED': return 'Hết hạn';
        default: return d._id;
      }
    }) || [],
    datasets: [{
      data: charts?.labelsByStatus?.map(d => d.count) || [],
      backgroundColor: ['#10b981', '#64748b', '#06b6d4', '#ef4444'],
      borderColor: 'transparent',
      borderWidth: 0,
    }]
  };

  const cityData = {
    labels: charts?.scansByCity?.map(d => d._id || 'Không xác định') || [],
    datasets: [{
      label: 'Lượt quét',
      data: charts?.scansByCity?.map(d => d.count) || [],
      backgroundColor: 'rgba(99, 102, 241, 0.6)',
      borderColor: '#6366f1',
      borderWidth: 1,
      borderRadius: 6,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f1f5f9',
        bodyColor: '#94a3b8',
        borderColor: '#334155',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(148,163,184,0.06)' },
        ticks: { color: '#64748b', font: { size: 11 } }
      },
      y: {
        grid: { color: 'rgba(148,163,184,0.06)' },
        ticks: { color: '#64748b', font: { size: 11 } }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 8,
          font: { size: 12 }
        }
      }
    },
    cutout: '70%'
  };

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Tổng quan hệ thống tem nhãn thông minh</p>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="stat-card animate-fade-in-up" style={{animationDelay: `${idx * 80}ms`}}>
              <div className="stat-card-top">
                <div className="stat-info">
                  <span className="stat-label">{card.label}</span>
                  <span className="stat-value">{card.value.toLocaleString('vi-VN')}</span>
                </div>
                <div className="stat-icon" style={{background: card.gradient}}>
                  <Icon size={22} />
                </div>
              </div>
              <div className="stat-card-bottom">
                <span className={`stat-change ${card.up ? 'up' : 'down'}`}>
                  {card.up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {card.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="chart-grid">
        <div className="chart-card card" style={{gridColumn: 'span 2'}}>
          <div className="card-header">
            <h3 className="card-title">
              <BarChart3 size={20} />
              Lượt quét tem theo ngày (30 ngày)
            </h3>
          </div>
          <div className="chart-body" style={{height: 300}}>
            <Line data={dailyScanData} options={chartOptions} />
          </div>
        </div>

        <div className="chart-card card">
          <div className="card-header">
            <h3 className="card-title">
              <Tag size={20} />
              Trạng thái Tem
            </h3>
          </div>
          <div className="chart-body" style={{height: 300}}>
            <Doughnut data={labelStatusData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      <div className="chart-grid">
        <div className="chart-card card" style={{gridColumn: 'span 2'}}>
          <div className="card-header">
            <h3 className="card-title">
              <MapPin size={20} />
              Lượt quét theo thành phố
            </h3>
          </div>
          <div className="chart-body" style={{height: 280}}>
            <Bar data={cityData} options={chartOptions} />
          </div>
        </div>

        <div className="chart-card card">
          <div className="card-header">
            <h3 className="card-title">
              <Clock size={20} />
              Quét gần đây
            </h3>
          </div>
          <div className="recent-scans">
            <div className="recent-scan-item">
              <div className="scan-dot active"></div>
              <div className="scan-info">
                <span className="scan-serial">Lượt quét 30 ngày qua</span>
                <span className="scan-location">{stats?.recentScans || 0} lượt</span>
              </div>
            </div>
            <div className="recent-scan-item">
              <div className="scan-dot"></div>
              <div className="scan-info">
                <span className="scan-serial">Lượt quét 7 ngày qua</span>
                <span className="scan-location">{stats?.weeklyScans || 0} lượt</span>
              </div>
            </div>
            <div className="recent-scan-item">
              <div className="scan-dot warning"></div>
              <div className="scan-info">
                <span className="scan-serial">Tem chưa kích hoạt</span>
                <span className="scan-location">{stats?.inactiveLabels || 0} tem</span>
              </div>
            </div>
            <div className="recent-scan-item">
              <div className="scan-dot"></div>
              <div className="scan-info">
                <span className="scan-serial">Tổng lô tem</span>
                <span className="scan-location">{stats?.totalBatches || 0} lô</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
