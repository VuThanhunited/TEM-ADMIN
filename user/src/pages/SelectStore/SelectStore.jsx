import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Search, Package, QrCode, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import userApi from '../../services/api';
import './SelectStore.css';

export default function SelectStore() {
  const navigate = useNavigate();
  const location = useLocation();
  const { nppToken } = useAuth();

  // Get scan data passed from ScanQR page
  const { scanData, serial } = location.state || {};

  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingStores, setLoadingStores] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const enterprise = scanData?.enterprise;
  const product = scanData?.product;
  const label = scanData?.label;

  useEffect(() => {
    if (!scanData) {
      navigate('/scan', { replace: true });
      return;
    }
    loadStores();
  }, []);

  const loadStores = async () => {
    setLoadingStores(true);
    try {
      // Try NPP stores endpoint first (requires auth token)
      const res = await userApi.getNppStores();
      if (res.stores && res.stores.length > 0) {
        setStores(res.stores);
        if (res.stores.length === 1) {
          setSelectedStoreId(res.stores[0].id || res.stores[0]._id);
        }
        return;
      }
      // Fallback: get distributors by enterprise
      if (enterprise?._id) {
        const res2 = await userApi.getPublicDistributors(enterprise._id);
        const storeList = (res2.distributors || []).map(d => ({
          id: d._id,
          name: d.fullName || d.username,
          address: d.address || '',
        }));
        setStores(storeList.length > 0 ? storeList : getSampleStores());
        if (storeList.length === 1) {
          setSelectedStoreId(storeList[0].id);
        }
      } else {
        setStores(getSampleStores());
      }
    } catch (err) {
      console.error('Load stores error:', err);
      // Try public distributors as fallback
      try {
        if (enterprise?._id) {
          const res2 = await userApi.getPublicDistributors(enterprise._id);
          const storeList = (res2.distributors || []).map(d => ({
            id: d._id,
            name: d.fullName || d.username,
            address: d.address || '',
          }));
          setStores(storeList.length > 0 ? storeList : getSampleStores());
          if (storeList.length === 1) {
            setSelectedStoreId(storeList[0].id);
          }
        } else {
          setStores(getSampleStores());
        }
      } catch {
        setStores(getSampleStores());
      }
    } finally {
      setLoadingStores(false);
    }
  };

  const getSampleStores = () => [
    { id: '1', name: 'ĐIỂM BÁN 01 – TẠP HÓA ANH TUẤN', address: '12 Đường số 5, P. Hiệp Bình, TP. Thủ Đức' },
    { id: '2', name: 'ĐIỂM BÁN 02 – TẠP HÓA MINH CHÂU', address: '45 Kha Vạn Cân, P. Linh Đông, TP. Thủ Đức' },
    { id: '3', name: 'ĐIỂM BÁN 03 – TẠP HÓA HỒNG PHÁT', address: '100 Phạm Văn Đồng, P. Linh Tây, TP. Thủ Đức' },
    { id: '4', name: 'ĐIỂM BÁN 04 – TẠP HÓA BẢO AN', address: '23 Quốc lộ 13, P. Hiệp Bình Phước, TP. Thủ Đức' },
    { id: '5', name: 'ĐIỂM BÁN 05 – TẠP HÓA THANH HÀ', address: '88 Đường số 7, P. Hiệp Bình Chánh, TP. Thủ Đức' },
  ];

  const filteredStores = useMemo(() => {
    if (!searchQuery.trim()) return stores;
    const q = searchQuery.toLowerCase();
    return stores.filter(
      s => s.name.toLowerCase().includes(q) || (s.address || '').toLowerCase().includes(q)
    );
  }, [stores, searchQuery]);

  const selectedStore = stores.find(s => s.id === selectedStoreId);

  const handleConfirm = async () => {
    if (!selectedStore) return;

    setSubmitting(true);
    try {
      const batchId = label?.batchId?._id || label?.batchId;
      const serialNumber = label?.serialNumber || serial;

      const res = await userApi.submitSingleEntry({
        serialNumber,
        distributorName: selectedStore.name,
        distributorAddress: selectedStore.address || '',
      });

      // Save to local history for History page
      try {
        const localHistory = JSON.parse(localStorage.getItem('npp_scan_history') || '[]');
        const newHistoryItem = {
          productName: product?.name || 'Sản phẩm',
          serial: serialNumber,
          storeName: selectedStore.name,
          time: new Date().toISOString(),
        };
        localStorage.setItem('npp_scan_history', JSON.stringify([newHistoryItem, ...localHistory].slice(0, 50)));
      } catch (historyErr) {
        console.error('Save scan history error:', historyErr);
      }

      // Navigate to success
      navigate('/success', {
        state: {
          scanData,
          serial,
          storeName: selectedStore.name,
          storeAddress: selectedStore.address,
          scanTime: new Date().toISOString(),
          totalForStore: res.totalForStore,
        }
      });
    } catch (err) {
      alert('Lỗi khi lưu dữ liệu: ' + (err.message || 'Vui lòng thử lại'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="store-page">
      {/* Header */}
      <div className="store-header">
        <button className="store-header-back" onClick={() => navigate('/scan')} aria-label="Quay lại">
          <ArrowLeft size={22} />
        </button>
        <span className="store-header-title">Chọn điểm bán nhập hàng</span>
      </div>

      {/* Product info bar */}
      {product && (
        <div className="store-product-bar">
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={product.name} className="store-product-img" />
          ) : (
            <div className="store-product-img-placeholder">
              <Package size={20} />
            </div>
          )}
          <div className="store-product-info">
            <div className="store-product-name">{product.name}</div>
            <div className="store-product-serial">
              <QrCode size={11} />
              Mã hàng: <strong>{label?.serialNumber || serial}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="store-search-wrap">
        <div className="store-search-inner">
          <Search size={16} className="store-search-icon" />
          <input
            type="text"
            className="store-search-input"
            placeholder="Tìm kiếm điểm bán"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Store list */}
      <div className="store-list-container">
        <div className="store-list">
          {loadingStores ? (
            <div className="store-list-loading">
              <div className="loading-ring" />
              <span>Đang tải danh sách điểm bán...</span>
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="store-list-empty">
              {searchQuery ? 'Không tìm thấy điểm bán phù hợp' : 'Chưa có điểm bán nào'}
            </div>
          ) : (
            filteredStores.map((store) => (
              <div
                key={store.id}
                className={`store-item ${selectedStoreId === store.id ? 'selected' : ''}`}
                onClick={() => setSelectedStoreId(store.id)}
              >
                <div className="store-radio-dot">
                  <div className="store-radio-inner" />
                </div>
                <div className="store-item-info">
                  <div className="store-item-name">{store.name}</div>
                  {store.address && (
                    <div className="store-item-addr">{store.address}</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confirm button */}
      <div className="store-confirm-bar">
        <button
          id="store-confirm-btn"
          className="store-confirm-btn"
          onClick={handleConfirm}
          disabled={!selectedStoreId || submitting}
        >
          {submitting ? (
            <>
              <span className="btn-spinner" />
              Đang xử lý...
            </>
          ) : (
            <>
              <CheckCircle size={20} />
              Xác nhận
            </>
          )}
        </button>
      </div>
    </div>
  );
}
