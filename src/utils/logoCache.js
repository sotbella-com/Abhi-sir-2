/**
 * Logo caching utility for better performance
 * Caches logo URL from Homepage API to reduce API calls
 */

const LOGO_CACHE_KEY = 'sotbella_logo_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Get cached logo data
 * @returns {Object|null} Cached logo object with {url, alt, timestamp} or null
 */
export const getCachedLogo = () => {
  try {
    const cached = localStorage.getItem(LOGO_CACHE_KEY);
    if (!cached) return null;
    
    const logoData = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is expired
    if (now - logoData.timestamp > CACHE_DURATION) {
      localStorage.removeItem(LOGO_CACHE_KEY);
      return null;
    }
    
    return logoData;
  } catch (error) {
    return null;
  }
};

/**
 * Cache logo data
 * @param {string} url - Logo URL
 * @param {string} alt - Logo alt text
 */
export const setCachedLogo = (url, alt) => {
  try {
    const logoData = {
      url,
      alt,
      timestamp: Date.now()
    };
    localStorage.setItem(LOGO_CACHE_KEY, JSON.stringify(logoData));
  } catch (error) {
  }
};

/**
 * Clear logo cache
 */
export const clearLogoCache = () => {
  try {
    localStorage.removeItem(LOGO_CACHE_KEY);
  } catch (error) {
  }
};

/**
 * Get logo with fallback strategy
 * @param {Object} apiLogo - Logo object from API {link, label}
 * @param {string} fallbackUrl - Fallback logo URL
 * @returns {Object} Logo object with {url, alt}
 */
export const getLogoWithFallback = (apiLogo, fallbackUrl) => {
  // Try cached logo first
  const cached = getCachedLogo();
  if (cached) {
    return { url: cached.url, alt: cached.alt };
  }
  
  // Try API logo
  if (apiLogo?.link) {
    const logoData = {
      url: apiLogo.link,
      alt: apiLogo.label || 'Sotbella'
    };
    // Cache the API logo
    setCachedLogo(logoData.url, logoData.alt);
    return logoData;
  }
  
  // No fallback - return null
  return { url: null, alt: 'Sotbella' };
};
