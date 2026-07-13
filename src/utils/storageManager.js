/**
 * Storage Manager - Handles localStorage operations for user and guest data
 * Provides clear separation between user-specific and guest data
 */

import { LOCAL_KEYS } from '../constants/localStorageKeys';
import localStorageCleaner from './localStorageCleaner';

class StorageManager {
  constructor() {
    this.userKeys = this.getUserKeys();
    this.guestKeys = this.getGuestKeys();
    this.cartKeys = this.getCartKeys();
    this.appKeys = this.getAppKeys();
  }

  /**
   * Get all user-specific localStorage keys
   * @returns {Array} Array of user-specific keys
   */
  getUserKeys() {
    return [
      // User authentication data (auth_token only)
      'user_tokens',
      
      // Login response data
      LOCAL_KEYS.USER_LOGGED_IN,
      LOCAL_KEYS.TOKEN,
      LOCAL_KEYS.ACCESS_TOKEN,
      LOCAL_KEYS.ID_TOKEN,
      LOCAL_KEYS.REFRESH_TOKEN,
      LOCAL_KEYS.EXPIRES_IN,
      LOCAL_KEYS.REFRESH_TOKEN_EXPIRES_IN,
      LOCAL_KEYS.TOKEN_TYPE,
      LOCAL_KEYS.USID,
      LOCAL_KEYS.CUSTOMER_ID,
      LOCAL_KEYS.ENC_USER_ID,
      LOCAL_KEYS.IDP_ACCESS_TOKEN,
      LOCAL_KEYS.IDP_REFRESH_TOKEN,
      LOCAL_KEYS.DNT,
      
      // User profile data
      LOCAL_KEYS.SAVED_PHONE_NUMBER,
      LOCAL_KEYS.PHONE_NUMBER,
      LOCAL_KEYS.LOGIN_DATA,
      LOCAL_KEYS.DEFAULT_SIZE,
      
      // User-specific app data
      LOCAL_KEYS.CHECKOUT_TO_LOGIN,
      LOCAL_KEYS.OTP_SESSION_TOKEN,
      LOCAL_KEYS.RECENT_SEARCHES,
      LOCAL_KEYS.BUY_NOW,
      LOCAL_KEYS.PLACED_ORDER_ID,
      
      // SFCC user tokens
      'SFCC_ACCESS_TOKEN',
      'SFCC_REFRESH_TOKEN',
      'SFCC_TOKEN_EXPIRY',
      'SFCC_REFRESH_TOKEN_EXPIRY',
      
      // User cart data
      'customer_basket_id',
      'unified-cart-storage', // Will be reset to guest state
      LOCAL_KEYS.WISHLIST_BASE_IDS
    ];
  }

  /**
   * Get all guest-specific localStorage keys
   * @returns {Array} Array of guest-specific keys
   */
  getGuestKeys() {
    return [
      // Guest token data
      LOCAL_KEYS.GUEST_ACCESS_TOKEN,
      LOCAL_KEYS.GUEST_ID_TOKEN,
      LOCAL_KEYS.GUEST_REFRESH_TOKEN,
      LOCAL_KEYS.GUEST_EXPIRES_IN,
      LOCAL_KEYS.GUEST_REFRESH_TOKEN_EXPIRES_IN,
      LOCAL_KEYS.GUEST_TOKEN_TYPE,
      LOCAL_KEYS.GUEST_USID,
      LOCAL_KEYS.GUEST_CUSTOMER_ID,
      LOCAL_KEYS.GUEST_ENC_USER_ID,
      LOCAL_KEYS.GUEST_IDP_ACCESS_TOKEN,
      LOCAL_KEYS.GUEST_IDP_REFRESH_TOKEN,
      LOCAL_KEYS.GUEST_DNT,
      
      // Guest token cache (30min validity)
      LOCAL_KEYS.GUEST_TOKEN,
      LOCAL_KEYS.GUEST_BASKET_CACHE,
      
      // Saved guest token (saved before login for cart merge)
      'guest_token',
      
      // Guest cart data
      'guest_cart_id',
      'guest_basket_id',
      'guest_customer_id',
      
      // Pending merge data
      'pending_merge_items',
      'pending_guest_basket_id',
      'pending_guest_customer_id'
    ];
  }

  /**
   * Get cart-related localStorage keys
   * @returns {Array} Array of cart-related keys
   */
  getCartKeys() {
    return [
      'unified-cart-storage',
      'guest_cart_id',
      'guest_basket_id',
      'guest_customer_id',
      'customer_basket_id',
      'guest_basket_cache'
    ];
  }

  /**
   * Get app-specific localStorage keys (not user/guest specific)
   * @returns {Array} Array of app-specific keys
   */
  getAppKeys() {
    return [
      'openFilter',
      'reviewRedirect',
      'SAVED_CART' // This might be app-specific
    ];
  }

  /**
   * Clear all user-specific data from localStorage
   * Preserves guest data and app settings
   */
  clearUserData() {
    ('🧹 Clearing user-specific data from localStorage...');
    
    try {
      // Clear user-specific keys
      this.userKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      // Reset cart storage to guest state
      this.resetCartToGuestState();

      ('✅ User data cleared successfully');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear all guest data from localStorage
   * Used when switching to user mode or clearing everything
   */
  clearGuestData() {
    ('🧹 Clearing guest data from localStorage...');
    
    try {
      // Clear guest-specific keys
      this.guestKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      ('✅ Guest data cleared successfully');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear all cart data from localStorage
   * Used when resetting cart state
   */
  clearCartData() {
    ('🧹 Clearing cart data from localStorage...');
    
    try {
      // Clear cart-specific keys
      this.cartKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      ('✅ Cart data cleared successfully');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear all data from localStorage (nuclear option)
   * Clears everything including guest data and app settings
   */
  clearAllData() {
    ('🧹 Clearing ALL data from localStorage...');
    
    try {
      // Clear all user keys
      this.userKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      // Clear all guest keys
      this.guestKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      // Clear all app keys
      this.appKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      ('✅ All data cleared successfully');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Reset cart storage to guest state
   * Preserves cart structure but resets to guest mode
   */
  resetCartToGuestState() {
    try {
      const cartData = localStorage.getItem('unified-cart-storage');
      if (cartData) {
        const parsed = JSON.parse(cartData);
        const guestCartData = {
          ...parsed,
          basket: null,
          basketId: null,
          basketType: 'guest',
          itemCount: 0,
          total: 0,
          isInitialized: false,
          error: null,
          isLoading: false
        };
        localStorage.setItem('unified-cart-storage', JSON.stringify(guestCartData));
        ('✅ Cart reset to guest state');
      }
    } catch (error) {
    }
  }

  /**
   * Get current storage state for debugging
   * @returns {Object} Current storage state
   */
  getStorageState() {
    const state = {
      user: {},
      guest: {},
      cart: {},
      app: {}
    };

    // Check user keys
    this.userKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        state.user[key] = value.length > 100 ? `${value.substring(0, 100)}...` : value;
      }
    });

    // Check guest keys
    this.guestKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        state.guest[key] = value.length > 100 ? `${value.substring(0, 100)}...` : value;
      }
    });

    // Check cart keys
    this.cartKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        state.cart[key] = value.length > 100 ? `${value.substring(0, 100)}...` : value;
      }
    });

    // Check app keys
    this.appKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        state.app[key] = value.length > 100 ? `${value.substring(0, 100)}...` : value;
      }
    });

    return state;
  }

  /**
   * Check if user is logged in based on localStorage
   * @returns {boolean} True if user is logged in
   */
  isUserLoggedIn() {
    try {
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) return false;
      const tokenObj = JSON.parse(authToken);
      return tokenObj && tokenObj.kind === 'user' && tokenObj.access_token && tokenObj.customer_id;
    } catch (_) {
      return false;
    }
  }

  /**
   * Check if guest data exists
   * @returns {boolean} True if guest data exists
   */
  hasGuestData() {
    try {
      const guestToken = localStorage.getItem('guest_token');
      if (!guestToken) return false;
      
      const guestData = JSON.parse(guestToken);
      return !!(guestData.access_token && guestData.customer_id);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current authentication state
   * @returns {Object} Authentication state
   */
  getAuthState() {
    let guestTokenData = null;
    try {
      const guestToken = localStorage.getItem('guest_token');
      if (guestToken) {
        guestTokenData = JSON.parse(guestToken);
      }
    } catch (error) {
    }

    let userFromAuth = null;
    try {
      const authToken = localStorage.getItem('auth_token');
      if (authToken) {
        const obj = JSON.parse(authToken);
        if (obj.kind === 'user') {
          userFromAuth = { customerId: obj.customer_id, usid: obj.usid };
        }
      }
    } catch (_) {}

    return {
      isUserLoggedIn: this.isUserLoggedIn(),
      hasGuestData: this.hasGuestData(),
      userData: userFromAuth,
      guestToken: guestTokenData,
      customerId: userFromAuth?.customerId || null,
      guestCustomerId: guestTokenData?.customer_id || null
    };
  }

  /**
   * Clean unnecessary data from localStorage
   * @param {boolean} dryRun - If true, only analyze without cleaning
   * @returns {Object} Cleanup results
   */
  cleanUnnecessaryData(dryRun = true) {
    ('🧹 Cleaning unnecessary localStorage data...');
    return localStorageCleaner.cleanRedundantData(dryRun);
  }

  /**
   * Optimize localStorage by consolidating data
   * @param {boolean} dryRun - If true, only analyze without optimizing
   * @returns {Object} Optimization results
   */
  optimizeStorage(dryRun = true) {
    ('🔧 Optimizing localStorage...');
    return localStorageCleaner.optimizeStorage(dryRun);
  }

  /**
   * Get detailed storage analysis
   * @returns {Object} Storage analysis
   */
  getStorageAnalysis() {
    return localStorageCleaner.analyzeStorage();
  }

  /**
   * Print storage analysis to console
   */
  printStorageAnalysis() {
    localStorageCleaner.printAnalysis();
  }

  /**
   * Get storage usage statistics
   * @returns {Object} Storage statistics
   */
  getStorageStats() {
    return localStorageCleaner.getStorageStats();
  }
}

// Create singleton instance
const storageManager = new StorageManager();

export default storageManager;
