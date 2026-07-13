/**
 * Hook for tracking page views with Einstein Commerce Cloud
 * Automatically tracks page views on mount
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackViewPage } from '@/api/services/einsteinTracking';

/**
 * Hook to track page views
 * Call this in your page components to automatically track page views
 */
export const useEinsteinPageTracking = (enabled = true) => {
  const location = useLocation();

  useEffect(() => {
    if (enabled) {
      // Small delay to ensure page is fully loaded
      const timer = setTimeout(() => {
        trackViewPage();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [location.pathname, enabled]);
};

export default useEinsteinPageTracking;
