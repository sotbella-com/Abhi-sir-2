/**
 * Evergage / Salesforce Interaction Studio Helper
 * Handles initialization and provides debugging utilities
 */

import { isUserLoggedIn } from './tokenUtils';

/**
 * Check if Evergage script has loaded
 * @returns {boolean} True if Evergage is available
 */
export const isEvergageLoaded = () => {
  if (typeof window === 'undefined') return false;
  return !!(window.Evergage || window._evg || window._evergage);
};

/**
 * Wait for Evergage to load
 * @param {number} timeout - Maximum time to wait in milliseconds (default: 10000)
 * @returns {Promise<boolean>} True if Evergage loaded, false if timeout
 */
export const waitForEvergage = (timeout = 10000) => {
  return new Promise((resolve) => {
    if (isEvergageLoaded()) {
      resolve(true);
      return;
    }

    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (isEvergageLoaded()) {
        clearInterval(checkInterval);
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        resolve(false);
      }
    }, 100);
  });
};

/**
 * Set user ID in Evergage (required for tracking)
 * This function tries multiple methods to ensure userId is set
 * @param {string} userId - User ID (customer ID or email)
 * @param {string} email - Optional email address
 */
export const setEvergageUserId = async (userId, email = null) => {
  try {
    if (!isEvergageLoaded()) {
      // If not loaded yet, wait a bit
      await waitForEvergage(5000);
    }
    
    if (!isEvergageLoaded()) {
      return;
    }

    if (!userId) {
      return;
    }

    let setSuccess = false;

    // Method 1: Direct property assignment (fastest, synchronous)
    if (window.Evergage) {
      if (window.Evergage.userId !== undefined) {
        window.Evergage.userId = userId;
        setSuccess = true;
      }
      
      // Method 2: setUserId function
      if (typeof window.Evergage.setUserId === 'function') {
        try {
          window.Evergage.setUserId(userId);
          setSuccess = true;
        } catch (e) {
        }
      }
      
      // Method 3: setUser function
      if (typeof window.Evergage.setUser === 'function') {
        try {
          window.Evergage.setUser({ userId, email: email || userId });
          setSuccess = true;
        } catch (e) {
        }
      }
    }
    
    // Method 4: _evg queue (for queued commands)
    if (window._evg && typeof window._evg.push === 'function') {
      window._evg.push(['setUserId', userId]);
      if (email) {
        window._evg.push(['setEmail', email]);
      }
      setSuccess = true;
    }
    
    if (!setSuccess) {
    }
  } catch (error) {
  }
};

/**
 * Get customer ID directly from localStorage
 * Reads from auth_token object which always has customer_id (guest or user)
 * @returns {string|null} Customer ID or null
 */
const getCustomerIdFromStorage = () => {
  try {
    // Try auth_token first (unified token object)
    const authToken = localStorage.getItem('auth_token');
    if (authToken) {
      const tokenData = JSON.parse(authToken);
      if (tokenData?.customer_id) {
        return tokenData.customer_id;
      }
    }
    
    // Fallback to guest_token
    const guestToken = localStorage.getItem('guest_token');
    if (guestToken) {
      const guestData = JSON.parse(guestToken);
      if (guestData?.customer_id) {
        return guestData.customer_id;
      }
    }
    
    // Fallback to CUSTOMER_ID (legacy)
    const customerId = localStorage.getItem('CUSTOMER_ID');
    if (customerId) {
      return customerId;
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Initialize Evergage with current user information
 * Automatically gets customer ID from localStorage
 */
export const initializeEvergageUser = async () => {
  try {
    await waitForEvergage(5000);
    
    if (!isEvergageLoaded()) {
      return;
    }

    // Get customer ID directly from localStorage
    const customerId = getCustomerIdFromStorage();
    const isLoggedIn = isUserLoggedIn();
    
    if (customerId) {
      // Use customer ID as userId
      await setEvergageUserId(customerId);
    } else {
    }
  } catch (error) {
  }
};

/**
 * Track a page view event
 * @param {string} pageName - Name of the page
 * @param {Object} additionalData - Additional data to send
 */
export const trackPageView = async (pageName, additionalData = {}) => {
  try {
    await waitForEvergage(5000);
    
    // Ensure user ID is set before tracking
    await initializeEvergageUser();
    
    if (!isEvergageLoaded()) {
      return;
    }

    // Evergage typically uses _evg or window.Evergage
    if (window._evg && typeof window._evg.push === 'function') {
      window._evg.push(['viewPage', pageName, additionalData]);
    } else if (window.Evergage && typeof window.Evergage.viewPage === 'function') {
      window.Evergage.viewPage(pageName, additionalData);
    } else {
    }
  } catch (error) {
  }
};

/**
 * Track a custom event
 * @param {string} eventName - Name of the event
 * @param {Object} eventData - Event data
 */
export const trackEvent = async (eventName, eventData = {}) => {
  try {
    await waitForEvergage(5000);
    
    // Ensure user ID is set before tracking
    await initializeEvergageUser();
    
    if (!isEvergageLoaded()) {
      return;
    }

    if (window._evg && typeof window._evg.push === 'function') {
      window._evg.push(['trackAction', eventName, eventData]);
    } else if (window.Evergage && typeof window.Evergage.trackAction === 'function') {
      window.Evergage.trackAction(eventName, eventData);
    } else {
    }
  } catch (error) {
  }
};

/**
 * Get Evergage debug information
 * @returns {Object} Debug information
 */
export const getEvergageDebugInfo = () => {
  if (typeof window === 'undefined') {
    return { error: 'Window object not available' };
  }
  
  const scriptElement = document.querySelector('script[src*="evergage"]');
  const scriptLoaded = scriptElement !== null;
  
  return {
    isLoaded: isEvergageLoaded(),
    hasEvg: !!window._evg,
    hasEvergage: !!window.Evergage,
    hasEvergageGlobal: !!window._evergage,
    evgType: typeof window._evg,
    evergageType: typeof window.Evergage,
    scriptElementExists: scriptLoaded,
    scriptSrc: scriptElement?.src || 'not found',
    userAgent: navigator.userAgent,
    currentUrl: window.location.href,
    protocol: window.location.protocol,
    host: window.location.host,
    // Check for common Evergage global variables
    allWindowKeys: Object.keys(window).filter(key => 
      key.toLowerCase().includes('evg') || 
      key.toLowerCase().includes('evergage')
    )
  };
};

/**
 * Log Evergage debug information to console
 */
export const logEvergageDebugInfo = () => {
  const info = getEvergageDebugInfo();
  
  if (!info.isLoaded) {
  }
};

// Auto-log debug info in development
if (import.meta.env.DEV) {
  // Check script loading status multiple times
  const checkScriptLoading = () => {
    if (typeof window === 'undefined') return;
    
    const scriptElement = document.querySelector('script[src*="evergage"]');
    if (!scriptElement) {
      return;
    }
    
    // Check if script has loaded
    const checkInterval = setInterval(() => {
      const loaded = isEvergageLoaded();
      if (loaded) {
        clearInterval(checkInterval);
        logEvergageDebugInfo();
        
        // Initialize user ID IMMEDIATELY (synchronously) to prevent missing userId errors
        // Don't wait - Evergage makes API calls immediately upon loading
        const customerId = getCustomerIdFromStorage();
        if (customerId && window.Evergage) {
          // Set userId immediately using direct property assignment
          try {
            if (window.Evergage.userId !== undefined) {
              window.Evergage.userId = customerId;
            }
            // Also try setUserId if available
            if (typeof window.Evergage.setUserId === 'function') {
              window.Evergage.setUserId(customerId);
            }
            // Also try _evg queue
            if (window._evg && typeof window._evg.push === 'function') {
              window._evg.push(['setUserId', customerId]);
            }
          } catch (error) {
          }
        }
        
        // Also call async initialization as backup
        setTimeout(() => {
          initializeEvergageUser();
        }, 100);
      }
    }, 100); // Check more frequently (every 100ms instead of 500ms)
    
    // Stop checking after 10 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      if (!isEvergageLoaded()) {
        logEvergageDebugInfo();
        
      }
    }, 10000);
  };
  
  // Wait for DOM to be ready
  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkScriptLoading);
    } else {
      // DOM already loaded
      setTimeout(checkScriptLoading, 1000);
    }
  }
  
  // Expose helper functions to window for debugging
  if (typeof window !== 'undefined') {
    window.evergageHelper = {
      isLoaded: isEvergageLoaded,
      waitForEvergage,
      setUserId: setEvergageUserId,
      initializeUser: initializeEvergageUser,
      trackPageView,
      trackEvent,
      getDebugInfo: getEvergageDebugInfo,
      logDebugInfo: logEvergageDebugInfo
    };
  }
}

