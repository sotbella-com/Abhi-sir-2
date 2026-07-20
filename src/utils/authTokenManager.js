/**
 * Auth Token Manager
 * Ensures auth_token object in localStorage always has valid token details
 * Handles both guest and user tokens with the same response schema
 */

import { logger } from './logger.js';

// Determine base URL for SFCC API calls.
// Honor VITE_SFCC_BASE_URL (set to "/sfcc" on the Railway/proxy host) so the
// token calls go SAME-ORIGIN through server.cjs — origin-independent, no SFCC
// CORS allowlist needed (works from any host incl. the app webview / tunnels).
// Falls back to the Vite dev proxy, then the direct SFCC host.
const SFCC_BASE_URL =
  import.meta.env.VITE_SFCC_BASE_URL ||
  (import.meta.env.DEV
    ? '/sfcc' // Vite dev proxy
    : 'https://dyp4l3dm.api.commercecloud.salesforce.com'); // direct host

const AUTH_TOKEN_KEY = 'auth_token';
const TOKEN_REFRESH_THRESHOLD = 300; // 5 minutes before expiry

class AuthTokenManager {
  constructor() {
    this.isRefreshing = false;
    this.refreshPromise = null;
    this._refreshLock = null; // Lock for refresh operations
    this._ensureValidLock = null; // Lock for ensureValidToken operations
  }

  /**
   * Get the current auth token object
   * @returns {Object|null} Auth token object or null
   */
  getAuthTokenObject() {
    try {
      const tokenData = localStorage.getItem(AUTH_TOKEN_KEY);
      return tokenData ? JSON.parse(tokenData) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Save auth token object to localStorage
   * @param {Object} tokenData - Token data to save
   */
  saveAuthTokenObject(tokenData) {
    try {
      localStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify(tokenData));
    } catch (error) {
    }
  }

  /**
   * Check if the current token is expired or will expire soon
   * @param {Object} tokenData - Token data to check
   * @returns {boolean} True if token needs refresh
   */
  isTokenExpired(tokenData) {
    if (!tokenData || !tokenData.expires_in) return true;

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = tokenData.updated_at + tokenData.expires_in;

    // Refresh if token expires within the threshold
    return (expiresAt - now) < TOKEN_REFRESH_THRESHOLD;
  }

  /**
   * Check if the refresh token is still valid
   * @param {Object} tokenData - Token data to check
   * @returns {boolean} True if refresh token is valid
   */
  isRefreshTokenValid(tokenData) {
    if (!tokenData || !tokenData.refresh_token) return false;

    // If no refresh token expiry info, assume it's valid
    if (!tokenData.refresh_token_expires_in) return true;

    const now = Math.floor(Date.now() / 1000);
    const refreshExpiresAt = tokenData.updated_at + tokenData.refresh_token_expires_in;

    // Refresh token is valid if it hasn't expired yet
    return refreshExpiresAt > now;
  }

  /**
   * Generate a new guest token
   * @returns {Promise<Object>} New guest token data
   */
  async generateGuestToken() {
    try {

      // Get dynamic site ID based on geolocation
      const siteId =  import.meta.env.VITE_SFCC_SITE_ID;

      const response = await fetch(`${SFCC_BASE_URL}/shopper/auth/v1/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${import.meta.env.VITE_SFCC_CLIENT_ID}:${import.meta.env.VITE_SFCC_CLIENT_SECRET}`)}`
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          channel_id: siteId // Required by SFCC API
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Guest token generation failed: ${response.status} - ${errorText}`);
      }

      const tokenData = await response.json();

      // Normalize guest token data
      const normalizedToken = {
        kind: 'guest',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        expires_in: tokenData.expires_in || 3600,
        refresh_token_expires_in: tokenData.refresh_token_expires_in || null,
        customer_id: tokenData.customer_id || null, // Guest tokens DO have customer_id
        usid: tokenData.usid || null, // Guest tokens DO have usid
        token_type: tokenData.token_type || 'Bearer',
        id_token: tokenData.id_token || null,
        idp_access_token: tokenData.idp_access_token || null,
        idp_refresh_token: tokenData.idp_refresh_token || null,
        dnt: tokenData.dnt || null,
        updated_at: Math.floor(Date.now() / 1000)
      };

      this.saveAuthTokenObject(normalizedToken);
      return normalizedToken;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Refresh the current token
   * Uses locking mechanism to prevent race conditions
   * @returns {Promise<Object>} Refreshed token data
   */
  async refreshToken() {
    // If already refreshing, return the existing promise
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    // If there's a lock, wait for it
    if (this._refreshLock) {
      return this._refreshLock;
    }

    // Create new lock
    this.isRefreshing = true;
    this._refreshLock = this._performRefresh();
    this.refreshPromise = this._refreshLock;

    try {
      const result = await this._refreshLock;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
      this._refreshLock = null;
    }
  }

  async _performRefresh() {
    try {
      const currentToken = this.getAuthTokenObject();
      if (!currentToken) {
        throw new Error('No token exists to refresh');
      }

      if (!currentToken.refresh_token) {
        throw new Error('No refresh token available');
      }

      if (!this.isRefreshTokenValid(currentToken)) {
        throw new Error('Refresh token has expired');
      }


      const response = await fetch(`${SFCC_BASE_URL}/shopper/auth/v1/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${import.meta.env.VITE_SFCC_CLIENT_ID}:${import.meta.env.VITE_SFCC_CLIENT_SECRET}`)}`
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: currentToken.refresh_token
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token refresh failed: ${response.status} - ${errorText}`);
      }

      const tokenData = await response.json();

      // Normalize refreshed token data
      const normalizedToken = {
        kind: currentToken.kind, // Keep the same kind
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || currentToken.refresh_token,
        expires_in: tokenData.expires_in || currentToken.expires_in,
        refresh_token_expires_in: tokenData.refresh_token_expires_in || currentToken.refresh_token_expires_in,
        customer_id: currentToken.customer_id, // Keep existing customer_id
        usid: currentToken.usid, // Keep existing usid
        token_type: tokenData.token_type || currentToken.token_type,
        id_token: tokenData.id_token || currentToken.id_token,
        idp_access_token: tokenData.idp_access_token || currentToken.idp_access_token,
        idp_refresh_token: tokenData.idp_refresh_token || currentToken.idp_refresh_token,
        dnt: tokenData.dnt || currentToken.dnt,
        updated_at: Math.floor(Date.now() / 1000)
      };

      this.saveAuthTokenObject(normalizedToken);
      return normalizedToken;
    } catch (error) {
      throw error; // Re-throw to let caller handle fallback
    }
  }

  /**
   * Ensure auth_token is valid (refresh if needed)
   * Uses locking mechanism to prevent concurrent calls
   * @param {Object} options - Options for token validation
   * @param {boolean} options.preferUser - Prefer user token over guest (default: false)
   * @returns {Promise<Object>} Valid token data
   */
  async ensureValidToken(options = {}) {
    // If there's already a validation in progress, wait for it
    if (this._ensureValidLock) {
      return this._ensureValidLock;
    }

    // Create lock for this validation
    this._ensureValidLock = this._performEnsureValidToken(options);

    try {
      return await this._ensureValidLock;
    } finally {
      this._ensureValidLock = null;
    }
  }

  async _performEnsureValidToken(options = {}) {
    try {
      let tokenData = this.getAuthTokenObject();

      // If no auth_token object exists, generate new guest token
      if (!tokenData) {
        return await this.generateGuestToken();
      }

      // If token is expired or will expire soon, try to refresh it
      if (this.isTokenExpired(tokenData)) {
        // Only try refresh if we have a valid refresh token
        if (tokenData.refresh_token && this.isRefreshTokenValid(tokenData)) {
          try {
            return await this.refreshToken();
          } catch (refreshError) {
            // Refresh failed, generate new token of same kind
            if (tokenData.kind === 'user') {
              // User refresh failed, fallback to guest token
              return await this.generateGuestToken();
            } else {
              // Guest refresh failed, generate new guest token
              return await this.generateGuestToken();
            }
          }
        } else {
          // No refresh token or refresh token expired, generate new token
          if (tokenData.kind === 'user') {
            // User token without refresh, fallback to guest
            return await this.generateGuestToken();
          } else {
            // Guest token without refresh, generate new guest token
            return await this.generateGuestToken();
          }
        }
      }

      // Token is still valid
      return tokenData;
    } catch (error) {
      // Last resort: generate new guest token
      return await this.generateGuestToken();
    }
  }

  /**
   * Save user token data (after login)
   * * CRITICAL: Before replacing the token, save the current guest token to guest_token in localStorage
   * This allows us to fetch guest basket items during merge even after login
   * @param {Object} userTokenData - User token data from login response
   */
  saveUserToken(userTokenData) {
    // CRITICAL: Save current guest token BEFORE replacing it
    // This is our source of truth for guest basket operations during merge
    const currentToken = this.getAuthTokenObject();
    if (currentToken && currentToken.kind === 'guest') {
      const guestTokenData = {
        ...currentToken,
        saved_at: Date.now()
      };
      localStorage.setItem('guest_token', JSON.stringify(guestTokenData));
      // Use secure logger to avoid exposing token data
      logger.log('💾 GUEST TOKEN DEBUG: Saved guest token before login:', {
        customer_id: currentToken.customer_id,
        basketId: localStorage.getItem('guest_basket_id'),
        saved_at: new Date(guestTokenData.saved_at).toISOString()
      });
    } else {
    }
    const normalizedToken = {
      kind: 'user',
      access_token: userTokenData.access_token,
      refresh_token: userTokenData.refresh_token || null,
      expires_in: userTokenData.expires_in || 3600,
      refresh_token_expires_in: userTokenData.refresh_token_expires_in || null,
      customer_id: userTokenData.customer_id || userTokenData.customerId || null,
      usid: userTokenData.usid || null,
      token_type: userTokenData.token_type || 'Bearer',
      id_token: userTokenData.id_token || null,
      idp_access_token: userTokenData.idp_access_token || null,
      idp_refresh_token: userTokenData.idp_refresh_token || null,
      dnt: userTokenData.dnt || null,
      updated_at: Math.floor(Date.now() / 1000)
    };

    this.saveAuthTokenObject(normalizedToken);
  }

  /**
   * Clear auth token (on logout)
   * Also clears the saved guest_token if it exists
   */
  clearAuthToken() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem('guest_token'); // Clear saved guest token on logout
    // Use secure logger (no sensitive data here, but consistent logging)
    logger.log('✅ Auth token cleared (including guest_token)');
  }

  /**
   * Check if auth_token object exists and has valid structure
   * @returns {boolean} True if auth_token exists and is valid
   */
  hasValidAuthToken() {
    const tokenData = this.getAuthTokenObject();
    return tokenData && tokenData.access_token && tokenData.kind;
  }

  /**
   * Get token status for debugging
   * @returns {Object} Token status information
   */
  getTokenStatus() {
    const tokenData = this.getAuthTokenObject();
    if (!tokenData) {
      return {
        hasToken: false,
        kind: null,
        expired: true,
        hasRefreshToken: false,
        refreshTokenValid: false
      };
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = tokenData.updated_at + tokenData.expires_in;
    const isExpired = this.isTokenExpired(tokenData);
    const hasRefreshToken = !!tokenData.refresh_token;
    const refreshTokenValid = this.isRefreshTokenValid(tokenData);

    return {
      hasToken: true,
      kind: tokenData.kind,
      customer_id: tokenData.customer_id,
      expired: isExpired,
      expiresIn: Math.max(0, expiresAt - now),
      hasRefreshToken,
      refreshTokenValid,
      isRefreshing: this.isRefreshing
    };
  }
}

// Create singleton instance
const authTokenManager = new AuthTokenManager();

export default authTokenManager;
