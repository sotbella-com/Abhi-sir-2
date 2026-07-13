/**
 * Custom hook for logo management without caching
 * Provides consistent logo handling across the application
 */

import { useState, useEffect } from 'react';

/**
 * Hook to get logo data without caching
 * @param {Object} apiLogo - Logo object from API {link, label}
 * @returns {Object} Logo data with {url, alt, isLoading}
 */
export const useLogo = (apiLogo) => {
  const [logoData, setLogoData] = useState({
    url: null,
    alt: 'Sotbella',
    isLoading: false
  });

  useEffect(() => {
    if (apiLogo?.link) {
      setLogoData({
        url: apiLogo.link,
        alt: apiLogo.label || 'Sotbella',
        isLoading: false
      });
    } else {
      setLogoData({
        url: null,
        alt: 'Sotbella',
        isLoading: false
      });
    }
  }, [apiLogo]);

  return logoData;
};

export default useLogo;
