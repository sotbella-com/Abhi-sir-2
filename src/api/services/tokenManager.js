/**
 * Token Manager - Wrapper around authTokenManager for backward compatibility
 * 
 * This file now delegates all operations to authTokenManager.js to ensure
 * a single source of truth for token management.
 * 
 * @deprecated Use authTokenManager or tokenUtils directly instead
 */

import authTokenManager from '../../utils/authTokenManager.js';
import { getAuthToken, getCustomerId, isUserLoggedIn, isGuestUser, saveUserToken, clearAuthToken, getAuthTokenObject } from '../../utils/tokenUtils.js';

/**
 * Token Manager Class - Wrapper for backward compatibility
 * All methods delegate to authTokenManager
 */
class TokenManager {
  constructor() {
    // No initialization needed - authTokenManager is a singleton
  }

  /**
   * Get valid access token (automatically refreshes if needed)
   * @returns {Promise<string>} Access token
   */
  async getValidToken() {
    return await getAuthToken();
  }

  /**
   * Get guest token
   * @returns {Promise<string>} Guest access token
   */
  async getGuestToken() {
    const tokenData = await authTokenManager.ensureValidToken();
    if (tokenData?.kind === 'guest') {
      return tokenData.access_token;
    }
    // If not guest, generate new guest token
    const guestToken = await authTokenManager.generateGuestToken();
    return guestToken.access_token;
  }

  /**
   * Get user token if logged in
   * @returns {string|null} User access token or null
   */
  getUserToken() {
    const tokenObj = getAuthTokenObject();
    if (tokenObj?.kind === 'user') {
      return tokenObj.access_token;
    }
    return null;
  }

  /**
   * Get user token with refresh
   * @returns {Promise<string|null>} User access token or null
   */
  async getUserTokenWithRefresh() {
    if (!isUserLoggedIn()) {
      return null;
    }
    const tokenData = await authTokenManager.ensureValidToken();
    if (tokenData?.kind === 'user') {
      return tokenData.access_token;
    }
    return null;
  }

  /**
   * Refresh user access token
   * @returns {Promise<string>} Refreshed access token
   */
  async refreshUserAccessToken() {
    const tokenData = await authTokenManager.ensureValidToken();
    if (tokenData?.kind === 'user') {
      return await authTokenManager.refreshToken();
    }
    throw new Error('No user token to refresh');
  }

  /**
   * Save user tokens
   * @param {Object} tokenData - User token data
   */
  saveUserTokens(tokenData) {
    saveUserToken(tokenData);
  }

  /**
   * Clear user tokens
   */
  clearUserTokens() {
    clearAuthToken();
  }

  /**
   * Clear guest tokens
   */
  clearGuestTokens() {
    // Clear auth token will generate new guest token on next access
    clearAuthToken();
  }

  /**
   * Refresh guest token
   * @returns {Promise<string>} Refreshed guest token
   */
  async refreshGuestToken() {
    const tokenData = await authTokenManager.ensureValidToken();
    if (tokenData?.kind === 'guest') {
      return await authTokenManager.refreshToken();
    }
    // Generate new guest token
    const guestToken = await authTokenManager.generateGuestToken();
    return guestToken.access_token;
  }

  /**
   * Clear all tokens
   */
  clearTokens() {
    clearAuthToken();
  }

  /**
   * Get current customer ID
   * @returns {Promise<string|null>} Customer ID or null
   */
  async getCurrentCustomerId() {
    return await getCustomerId();
  }

  /**
   * Get token status for debugging
   * @returns {Object} Token status information
   */
  getTokenStatus() {
    return authTokenManager.getTokenStatus();
  }

  /**
   * Generate new guest token
   * @returns {Promise<string>} New guest token
   */
  async generateGuestToken() {
    const guestToken = await authTokenManager.generateGuestToken();
    return guestToken.access_token;
  }

  /**
   * Get stored guest token
   * @returns {Object|null} Guest token data or null
   */
  getStoredGuestToken() {
    const tokenObj = getAuthTokenObject();
    if (tokenObj?.kind === 'guest') {
      return {
        access_token: tokenObj.access_token,
        refresh_token: tokenObj.refresh_token,
        customer_id: tokenObj.customer_id,
        refresh_token_expires_at: tokenObj.updated_at + (tokenObj.refresh_token_expires_in || 0),
        generated_at: tokenObj.updated_at,
        last_refreshed_at: tokenObj.updated_at
      };
    }
    return null;
  }

  /**
   * Get stored user token
   * @returns {Object|null} User token data or null
   */
  getStoredUserToken() {
    const tokenObj = getAuthTokenObject();
    if (tokenObj?.kind === 'user') {
      const now = Date.now();
      return {
        access_token: tokenObj.access_token,
        refresh_token: tokenObj.refresh_token,
        customer_id: tokenObj.customer_id,
        usid: tokenObj.usid,
        access_token_expires_at: tokenObj.updated_at + (tokenObj.expires_in || 0) * 1000,
        refresh_token_expires_at: tokenObj.refresh_token_expires_in 
          ? tokenObj.updated_at + tokenObj.refresh_token_expires_in * 1000
          : now + 12 * 60 * 60 * 1000, // Default 12 hours
        generated_at: tokenObj.updated_at,
        last_refreshed_at: tokenObj.updated_at
      };
    }
    return null;
  }

  /**
   * Generate and persist guest identity
   * @param {boolean} clearBasket - Whether to clear basket cache
   * @returns {Promise<string>} New guest token
   */
  async generateAndPersistGuestIdentity(clearBasket = false) {
    if (clearBasket) {
      try {
        localStorage.removeItem('guest_basket_cache');
        localStorage.removeItem('guest_basket_id');
      } catch {}
    }
    const guestToken = await authTokenManager.generateGuestToken();
    return guestToken.access_token;
  }

  /**
   * Refresh guest access token
   * @returns {Promise<string>} Refreshed guest token
   */
  async refreshGuestAccessToken() {
    const tokenData = await authTokenManager.ensureValidToken();
    if (tokenData?.kind === 'guest') {
      const refreshed = await authTokenManager.refreshToken();
      return refreshed.access_token;
    }
    // Generate new guest token
    const guestToken = await authTokenManager.generateGuestToken();
    return guestToken.access_token;
  }

  /**
   * Clear guest baskets (for quota management)
   * @param {string} customerId - Customer ID
   */
  async clearGuestBaskets(customerId = null) {
    // This is handled by the cart system, not token manager
    // Keeping for backward compatibility but no-op
    if (customerId) {
      try {
        localStorage.removeItem('guest_basket_id');
        localStorage.removeItem('guest_basket_cache');
      } catch {}
    }
  }

  /**
   * Get unified token
   * @returns {Object|null} Unified token object or null
   */
  getUnifiedToken() {
    return getAuthTokenObject();
  }

  /**
   * Save unified token
   * @param {Object} params - Token parameters
   */
  saveUnifiedToken({ kind, payload }) {
    if (kind === 'user') {
      saveUserToken(payload);
    } else {
      // Guest tokens are managed automatically by authTokenManager
      // This is mainly for backward compatibility
    }
  }
}

// Create singleton instance
const tokenManager = new TokenManager();

// Export convenience functions for backward compatibility
export const getValidToken = () => tokenManager.getValidToken();
export const getGuestToken = () => tokenManager.getGuestToken();
export const getUserToken = () => tokenManager.getUserToken();
export const getUserTokenWithRefresh = () => tokenManager.getUserTokenWithRefresh();
export const refreshUserAccessToken = () => tokenManager.refreshUserAccessToken();
export const saveUserTokens = (tokenData) => tokenManager.saveUserTokens(tokenData);
export const clearUserTokens = () => tokenManager.clearUserTokens();
export const clearGuestTokens = () => tokenManager.clearGuestTokens();
export const refreshGuestToken = () => tokenManager.refreshGuestToken();
export const clearTokens = () => tokenManager.clearTokens();
export const getCurrentCustomerId = () => tokenManager.getCurrentCustomerId();
export const getTokenStatus = () => tokenManager.getTokenStatus();

// Export the class and instance
export default tokenManager;
export { TokenManager, TOKEN_CONFIG };

// Note: TOKEN_CONFIG is kept for backward compatibility but not used
// All configuration is now in authTokenManager
const TOKEN_CONFIG = {
  baseUrl: import.meta.env.VITE_SFCC_BASE_URL || `https://${import.meta.env.VITE_SFCC_SHORTCODE}.api.commercecloud.salesforce.com`,
  organizationId: import.meta.env.VITE_SFCC_ORG_ID,
  siteId: import.meta.env.VITE_SFCC_SITE_ID,
  clientId: import.meta.env.VITE_SFCC_CLIENT_ID,
  clientSecret: import.meta.env.VITE_SFCC_CLIENT_SECRET,
  storageKeys: {
    accessToken: "auth_token", // Now using unified key
    refreshToken: "auth_token",
    tokenExpiry: "auth_token",
    refreshTokenExpiry: "auth_token"
  },
  refreshBuffer: 300
};
