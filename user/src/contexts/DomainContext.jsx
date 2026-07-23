import { createContext, useContext, useState, useEffect } from 'react';
import userApi from '../services/api';

const DomainContext = createContext(null);

/**
 * DomainProvider – Tự động detect custom domain khi app load.
 * Nếu domain là custom (không phải localhost/vercel.app),
 * sẽ gọi API để lấy thông tin enterprise tương ứng và lưu vào context.
 * Các component con có thể dùng useDomain() để truy cập.
 */
export function DomainProvider({ children }) {
  const [customEnterprise, setCustomEnterprise] = useState(null);
  const [domainLoading, setDomainLoading] = useState(true);
  const [customDomain, setCustomDomain] = useState(null);

  useEffect(() => {
    const detectDomain = async () => {
      const domain = userApi.getCurrentDomain();
      setCustomDomain(domain);

      if (!domain) {
        // Không phải custom domain, bỏ qua
        setDomainLoading(false);
        return;
      }

      try {
        const result = await userApi.getEnterpriseByDomain(domain);
        if (result?.enterprise) {
          setCustomEnterprise(result.enterprise);

          // Áp dụng brand colors nếu có
          const brand = result.enterprise.brandConfig;
          if (brand?.primaryColor) {
            document.documentElement.style.setProperty('--brand-primary', brand.primaryColor);
          }
          if (brand?.secondaryColor) {
            document.documentElement.style.setProperty('--brand-secondary', brand.secondaryColor);
          }
        }
      } catch {
        // Domain không khớp enterprise nào, giữ nguyên giao diện mặc định
        console.info('[DomainContext] Không tìm thấy enterprise cho domain:', domain);
      } finally {
        setDomainLoading(false);
      }
    };

    detectDomain();
  }, []);

  return (
    <DomainContext.Provider value={{
      customEnterprise,   // Enterprise data khớp với custom domain
      customDomain,       // Hostname hiện tại (null nếu là localhost/vercel)
      domainLoading,      // true khi đang detect
      isCustomDomain: !!customEnterprise  // Shorthand flag
    }}>
      {children}
    </DomainContext.Provider>
  );
}

export function useDomain() {
  return useContext(DomainContext);
}
