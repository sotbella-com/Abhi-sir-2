/**
 * React Hook for Site ID
 * Provides current site ID based on geolocation
 */

import { useState, useEffect } from 'react';
import { getCurrentSiteId, getCurrentSiteIdSync, DEFAULT_SITE_ID } from '../utils/geolocation';

/**
 * Hook to get current site ID
 * @returns {Object} { siteId, isLoading, error }
 */
export function useSiteId() {
  const [siteId, setSiteId] = useState(() => getCurrentSiteIdSync());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSiteId = async () => {
      try {
        setIsLoading(true);
        const currentSiteId = await getCurrentSiteId();
        
        if (isMounted) {
          setSiteId(currentSiteId);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setSiteId(DEFAULT_SITE_ID);
          setError(err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // If we already have a cached value, don't show loading
    if (siteId !== DEFAULT_SITE_ID) {
      setIsLoading(false);
    }

    fetchSiteId();

    return () => {
      isMounted = false;
    };
  }, []);

  return { siteId, isLoading, error };
}

/**
 * Hook to get site ID synchronously (for immediate use)
 * Returns cached value or default
 * @returns {string} Site ID
 */
export function useSiteIdSync() {
  return getCurrentSiteIdSync();
}

export default useSiteId;

