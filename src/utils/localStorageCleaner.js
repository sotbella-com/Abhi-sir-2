/**
 * LocalStorage Cleaner - Identifies and removes unnecessary data from localStorage
 * Helps optimize storage usage and remove redundant/legacy data
 */

import { LOCAL_KEYS } from '../constants/localStorageKeys';

class LocalStorageCleaner {
  constructor() {
    this.essentialKeys = this.getEssentialKeys();
    this.redundantKeys = this.getRedundantKeys();
    this.legacyKeys = this.getLegacyKeys();
  }

  /**
   * Get essential keys that should always be preserved
   * @returns {Array} Array of essential keys
   */
  getEssentialKeys() {
    return [
      // Current user data (auth_token is the source of truth)
      'auth_token',
      
      // Current guest data (if not logged in)
      LOCAL_KEYS.GUEST_TOKEN,
      LOCAL_KEYS.GUEST_CUSTOMER_ID,
      LOCAL_KEYS.GUEST_BASKET_CACHE,
      
      // Current cart data
      'unified-cart-storage',
      
      // App preferences
      'chakra-ui-color-mode',
      LOCAL_KEYS.DEFAULT_SIZE,
      LOCAL_KEYS.RECENT_SEARCHES,
      
      // Current session data
      LOCAL_KEYS.SAVED_PHONE_NUMBER,
      LOCAL_KEYS.CHECKOUT_TO_LOGIN,
      LOCAL_KEYS.OTP_SESSION_TOKEN
    ];
  }

  /**
   * Get redundant keys that are duplicates or unnecessary
   * @returns {Array} Array of redundant keys
   */
  getRedundantKeys() {
    return [
      // Duplicate token storage
      LOCAL_KEYS.TOKEN, // Redundant with ACCESS_TOKEN
      LOCAL_KEYS.USER_LOGGED_IN, // Can be derived from ACCESS_TOKEN presence
      
      // Duplicate customer IDs
      LOCAL_KEYS.GUEST_CUSTOMER_ID, // Redundant with guest_token.customer_id
      
      // Duplicate token data
      LOCAL_KEYS.ID_TOKEN, // Not needed for API calls
      LOCAL_KEYS.TOKEN_TYPE, // Always 'BEARER'
      LOCAL_KEYS.EXPIRES_IN, // Can be calculated from token
      LOCAL_KEYS.REFRESH_TOKEN_EXPIRES_IN, // Can be calculated
      LOCAL_KEYS.USID, // Redundant with CUSTOMER_ID
      LOCAL_KEYS.ENC_USER_ID, // Redundant with CUSTOMER_ID
      LOCAL_KEYS.DNT, // Not needed
      
      // Duplicate guest data
      LOCAL_KEYS.GUEST_ACCESS_TOKEN, // Redundant with guest_token.access_token
      LOCAL_KEYS.GUEST_ID_TOKEN, // Not needed
      LOCAL_KEYS.GUEST_REFRESH_TOKEN, // Redundant with guest_token.refresh_token
      LOCAL_KEYS.GUEST_EXPIRES_IN, // Redundant with guest_token.expires_at
      LOCAL_KEYS.GUEST_REFRESH_TOKEN_EXPIRES_IN, // Not needed
      LOCAL_KEYS.GUEST_TOKEN_TYPE, // Always 'BEARER'
      LOCAL_KEYS.GUEST_USID, // Redundant with guest_token.customer_id
      LOCAL_KEYS.GUEST_ENC_USER_ID, // Redundant with guest_token.customer_id
      LOCAL_KEYS.GUEST_IDP_ACCESS_TOKEN, // Not needed
      LOCAL_KEYS.GUEST_IDP_REFRESH_TOKEN, // Not needed
      LOCAL_KEYS.GUEST_DNT, // Not needed
      
      // Legacy cart data
      LOCAL_KEYS.SAVED_CART, // Replaced by unified-cart-storage
      'guest_cart_id', // Legacy
      'guest_basket_id', // Legacy
      'customer_basket_id', // Legacy
      
      // Legacy SFCC tokens
      'SFCC_ACCESS_TOKEN', // Legacy
      'SFCC_REFRESH_TOKEN', // Legacy
      'SFCC_TOKEN_EXPIRY', // Legacy
      'SFCC_REFRESH_TOKEN_EXPIRY', // Legacy
      
      // Unnecessary data
      LOCAL_KEYS.PHONE_NUMBER, // Redundant with SAVED_PHONE_NUMBER
      LOCAL_KEYS.LOGIN_DATA, // Redundant
      LOCAL_KEYS.BUY_NOW, // Temporary data
      LOCAL_KEYS.PLACED_ORDER_ID, // Temporary data
      'sotbella_logo_cache', // Cache data
      'openFilter', // UI state
      'reviewRedirect' // UI state
    ];
  }

  /**
   * Get legacy keys that are no longer used
   * @returns {Array} Array of legacy keys
   */
  getLegacyKeys() {
    return [
      // Old authentication system
      'auth_token',
      'user_token',
      'session_token',
      
      // Old cart system
      'cart_items',
      'cart_total',
      'cart_count',
      
      // Old UI state
      'sidebar_open',
      'theme_preference',
      'language_preference',
      
      // Old API cache
      'api_cache',
      'product_cache',
      'category_cache'
    ];
  }

  /**
   * Analyze localStorage and identify unnecessary data
   * @returns {Object} Analysis results
   */
  analyzeStorage() {
    const allKeys = Object.keys(localStorage);
    const essentialKeys = this.essentialKeys;
    const redundantKeys = this.redundantKeys;
    const legacyKeys = this.legacyKeys;
    
    const analysis = {
      totalKeys: allKeys.length,
      essentialKeys: [],
      redundantKeys: [],
      legacyKeys: [],
      unknownKeys: [],
      totalSize: 0,
      redundantSize: 0,
      legacySize: 0,
      unknownSize: 0
    };

    allKeys.forEach(key => {
      const value = localStorage.getItem(key);
      const size = (key.length + value.length) * 2; // Rough estimate in bytes
      analysis.totalSize += size;

      if (essentialKeys.includes(key)) {
        analysis.essentialKeys.push({ key, size });
      } else if (redundantKeys.includes(key)) {
        analysis.redundantKeys.push({ key, size, value: value.substring(0, 100) });
        analysis.redundantSize += size;
      } else if (legacyKeys.includes(key)) {
        analysis.legacyKeys.push({ key, size, value: value.substring(0, 100) });
        analysis.legacySize += size;
      } else {
        analysis.unknownKeys.push({ key, size, value: value.substring(0, 100) });
        analysis.unknownSize += size;
      }
    });

    return analysis;
  }

  /**
   * Clean redundant data from localStorage
   * @param {boolean} dryRun - If true, only log what would be removed
   * @returns {Object} Cleanup results
   */
  cleanRedundantData(dryRun = true) {
    const analysis = this.analyzeStorage();
    const keysToRemove = [...analysis.redundantKeys, ...analysis.legacyKeys];
    
    const results = {
      removedKeys: [],
      removedSize: 0,
      errors: []
    };

    (`🧹 ${dryRun ? 'DRY RUN' : 'CLEANING'} localStorage...`);
    (`📊 Found ${keysToRemove.length} keys to remove (${this.formatBytes(analysis.redundantSize + analysis.legacySize)})`);

    keysToRemove.forEach(({ key, size }) => {
      try {
        if (!dryRun) {
          localStorage.removeItem(key);
        }
        results.removedKeys.push(key);
        results.removedSize += size;
        (`${dryRun ? 'Would remove' : 'Removed'}: ${key} (${this.formatBytes(size)})`);
      } catch (error) {
        results.errors.push({ key, error: error.message });
      }
    });

    if (!dryRun) {
      (`✅ Cleanup complete! Removed ${results.removedKeys.length} keys, freed ${this.formatBytes(results.removedSize)}`);
    } else {
      (`🔍 Dry run complete! Would remove ${results.removedKeys.length} keys, free ${this.formatBytes(results.removedSize)}`);
    }

    return results;
  }

  /**
   * Clean specific types of data
   * @param {string} type - Type of data to clean ('redundant', 'legacy', 'all')
   * @param {boolean} dryRun - If true, only log what would be removed
   * @returns {Object} Cleanup results
   */
  cleanByType(type = 'redundant', dryRun = true) {
    const analysis = this.analyzeStorage();
    let keysToRemove = [];

    switch (type) {
      case 'redundant':
        keysToRemove = analysis.redundantKeys;
        break;
      case 'legacy':
        keysToRemove = analysis.legacyKeys;
        break;
      case 'all':
        keysToRemove = [...analysis.redundantKeys, ...analysis.legacyKeys];
        break;
      default:
        throw new Error(`Unknown cleanup type: ${type}`);
    }

    const results = {
      removedKeys: [],
      removedSize: 0,
      errors: []
    };

    (`🧹 ${dryRun ? 'DRY RUN' : 'CLEANING'} ${type} data...`);
    (`📊 Found ${keysToRemove.length} keys to remove`);

    keysToRemove.forEach(({ key, size }) => {
      try {
        if (!dryRun) {
          localStorage.removeItem(key);
        }
        results.removedKeys.push(key);
        results.removedSize += size;
        (`${dryRun ? 'Would remove' : 'Removed'}: ${key} (${this.formatBytes(size)})`);
      } catch (error) {
        results.errors.push({ key, error: error.message });
      }
    });

    return results;
  }

  /**
   * Optimize localStorage by consolidating data
   * @param {boolean} dryRun - If true, only log what would be optimized
   * @returns {Object} Optimization results
   */
  optimizeStorage(dryRun = true) {
    (`🔧 ${dryRun ? 'DRY RUN' : 'OPTIMIZING'} localStorage...`);
    
    const results = {
      optimizedKeys: [],
      savedSize: 0,
      errors: []
    };

    // Consolidate guest token data
    const guestTokenData = this.consolidateGuestTokenData(dryRun);
    if (guestTokenData) {
      results.optimizedKeys.push(...guestTokenData.consolidatedKeys);
      results.savedSize += guestTokenData.savedSize;
    }

    // Consolidate user token data
    const userTokenData = this.consolidateUserTokenData(dryRun);
    if (userTokenData) {
      results.optimizedKeys.push(...userTokenData.consolidatedKeys);
      results.savedSize += userTokenData.savedSize;
    }

    (`✅ Optimization complete! ${dryRun ? 'Would save' : 'Saved'} ${this.formatBytes(results.savedSize)}`);
    return results;
  }

  /**
   * Consolidate guest token data into single object
   * @param {boolean} dryRun - If true, only log what would be consolidated
   * @returns {Object} Consolidation results
   */
  consolidateGuestTokenData(dryRun = true) {
    const guestKeys = [
      LOCAL_KEYS.GUEST_ACCESS_TOKEN,
      LOCAL_KEYS.GUEST_REFRESH_TOKEN,
      LOCAL_KEYS.GUEST_CUSTOMER_ID,
      LOCAL_KEYS.GUEST_USID,
      LOCAL_KEYS.GUEST_ENC_USER_ID
    ];

    const existingData = {};
    let totalSize = 0;
    let hasData = false;

    guestKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        existingData[key] = value;
        totalSize += (key.length + value.length) * 2;
        hasData = true;
      }
    });

    if (!hasData) return null;

    const consolidatedData = {
      access_token: existingData[LOCAL_KEYS.GUEST_ACCESS_TOKEN],
      refresh_token: existingData[LOCAL_KEYS.GUEST_REFRESH_TOKEN],
      customer_id: existingData[LOCAL_KEYS.GUEST_CUSTOMER_ID],
      usid: existingData[LOCAL_KEYS.GUEST_USID],
      enc_user_id: existingData[LOCAL_KEYS.GUEST_ENC_USER_ID],
      consolidated_at: Date.now()
    };

    const consolidatedSize = (LOCAL_KEYS.GUEST_TOKEN.length + JSON.stringify(consolidatedData).length) * 2;
    const savedSize = totalSize - consolidatedSize;

    if (!dryRun) {
      // Store consolidated data
      localStorage.setItem(LOCAL_KEYS.GUEST_TOKEN, JSON.stringify(consolidatedData));
      
      // Remove individual keys
      guestKeys.forEach(key => {
        if (existingData[key]) {
          localStorage.removeItem(key);
        }
      });
    }

    (`${dryRun ? 'Would consolidate' : 'Consolidated'} guest token data: ${this.formatBytes(savedSize)} saved`);

    return {
      consolidatedKeys: guestKeys.filter(key => existingData[key]),
      savedSize: Math.max(0, savedSize)
    };
  }

  /**
   * Consolidate user token data into single object
   * @param {boolean} dryRun - If true, only log what would be consolidated
   * @returns {Object} Consolidation results
   */
  consolidateUserTokenData(dryRun = true) {
    const userKeys = [
      LOCAL_KEYS.ACCESS_TOKEN,
      LOCAL_KEYS.REFRESH_TOKEN,
      LOCAL_KEYS.CUSTOMER_ID,
      LOCAL_KEYS.USID,
      LOCAL_KEYS.ENC_USER_ID
    ];

    const existingData = {};
    let totalSize = 0;
    let hasData = false;

    userKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        existingData[key] = value;
        totalSize += (key.length + value.length) * 2;
        hasData = true;
      }
    });

    if (!hasData) return null;

    const consolidatedData = {
      access_token: existingData[LOCAL_KEYS.ACCESS_TOKEN],
      refresh_token: existingData[LOCAL_KEYS.REFRESH_TOKEN],
      customer_id: existingData[LOCAL_KEYS.CUSTOMER_ID],
      usid: existingData[LOCAL_KEYS.USID],
      enc_user_id: existingData[LOCAL_KEYS.ENC_USER_ID],
      consolidated_at: Date.now()
    };

    const consolidatedSize = ('user_tokens'.length + JSON.stringify(consolidatedData).length) * 2;
    const savedSize = totalSize - consolidatedSize;

    if (!dryRun) {
      // Store consolidated data
      localStorage.setItem('user_tokens', JSON.stringify(consolidatedData));
      
      // Remove individual keys
      userKeys.forEach(key => {
        if (existingData[key]) {
          localStorage.removeItem(key);
        }
      });
    }

    (`${dryRun ? 'Would consolidate' : 'Consolidated'} user token data: ${this.formatBytes(savedSize)} saved`);

    return {
      consolidatedKeys: userKeys.filter(key => existingData[key]),
      savedSize: Math.max(0, savedSize)
    };
  }

  /**
   * Format bytes to human readable string
   * @param {number} bytes - Number of bytes
   * @returns {string} Formatted string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get storage usage statistics
   * @returns {Object} Storage statistics
   */
  getStorageStats() {
    const analysis = this.analyzeStorage();
    return {
      totalKeys: analysis.totalKeys,
      totalSize: this.formatBytes(analysis.totalSize),
      essentialKeys: analysis.essentialKeys.length,
      redundantKeys: analysis.redundantKeys.length,
      legacyKeys: analysis.legacyKeys.length,
      unknownKeys: analysis.unknownKeys.length,
      redundantSize: this.formatBytes(analysis.redundantSize),
      legacySize: this.formatBytes(analysis.legacySize),
      unknownSize: this.formatBytes(analysis.unknownSize),
      potentialSavings: this.formatBytes(analysis.redundantSize + analysis.legacySize)
    };
  }

  /**
   * Print detailed storage analysis
   */
  printAnalysis() {
    const analysis = this.analyzeStorage();
    
    (`Total Keys: ${analysis.totalKeys}`);
    (`Total Size: ${this.formatBytes(analysis.totalSize)}`);
    (`Essential Keys: ${analysis.essentialKeys.length}`);
    (`Redundant Keys: ${analysis.redundantKeys.length} (${this.formatBytes(analysis.redundantSize)})`);
    (`Legacy Keys: ${analysis.legacyKeys.length} (${this.formatBytes(analysis.legacySize)})`);
    (`Unknown Keys: ${analysis.unknownKeys.length} (${this.formatBytes(analysis.unknownSize)})`);
    
    if (analysis.redundantKeys.length > 0) {
      analysis.redundantKeys.forEach(({ key, size, value }) => {
        (`${key}: ${this.formatBytes(size)} - ${value.substring(0, 50)}...`);
      });
    }
    
    if (analysis.legacyKeys.length > 0) {
      analysis.legacyKeys.forEach(({ key, size, value }) => {
        (`${key}: ${this.formatBytes(size)} - ${value.substring(0, 50)}...`);
      });
    }
    
    if (analysis.unknownKeys.length > 0) {
      analysis.unknownKeys.forEach(({ key, size, value }) => {
        (`${key}: ${this.formatBytes(size)} - ${value.substring(0, 50)}...`);
      });
    }
    
  }
}

// Create singleton instance
const localStorageCleaner = new LocalStorageCleaner();

// Expose to window in development
if (import.meta.env.DEV) {
  window.localStorageCleaner = localStorageCleaner;
  ('🧹 LocalStorage Cleaner available as window.localStorageCleaner');
  ('📋 Available methods:');
  ('  - localStorageCleaner.analyzeStorage()');
  ('  - localStorageCleaner.cleanRedundantData(dryRun=true)');
  ('  - localStorageCleaner.cleanByType(type, dryRun=true)');
  ('  - localStorageCleaner.optimizeStorage(dryRun=true)');
  ('  - localStorageCleaner.getStorageStats()');
  ('  - localStorageCleaner.printAnalysis()');
}

export default localStorageCleaner;
