/**
 * Unified Token Utilities
 * All APIs should use only the auth_token object from localStorage
 * Ensures auth_token is always valid through automatic refresh
 */

import authTokenManager from './authTokenManager';

/**
 * Get the current access token from the unified auth_token object
 * Automatically ensures token is valid (refreshes if needed)
 * @returns {Promise<string|null>} Access token or null if not available
 */
export const getAuthToken = async () => {
  try {
    const tokenData = await authTokenManager.ensureValidToken();
    return tokenData?.access_token || null;
  } catch (error) {
    return null;
  }
};

/**
 * Get the current customer ID from the unified auth_token object
 * Automatically ensures token is valid (refreshes if needed)
 * @returns {Promise<string|null>} Customer ID or null if not available
 */
export const getCustomerId = async () => {
  try {
    const tokenData = await authTokenManager.ensureValidToken();
    return tokenData?.customer_id || null;
  } catch (error) {
    return null;
  }
};

/**
 * Check if the current token is for a logged-in user
 * @returns {boolean} True if user is logged in
 */
export const isUserLoggedIn = () => {
  try {
    const tokenData = authTokenManager.getAuthTokenObject();
    return tokenData?.kind === 'user';
  } catch (error) {
    return false;
  }
};

/**
 * Check if the current token is for a guest user
 * @returns {boolean} True if user is guest
 */
export const isGuestUser = () => {
  try {
    const tokenData = authTokenManager.getAuthTokenObject();
    return !tokenData || tokenData.kind === 'guest';
  } catch (error) {
    return true;
  }
};

/**
 * Get the full auth token object
 * @returns {Object|null} Full auth token object or null
 */
export const getAuthTokenObject = () => {
  return authTokenManager.getAuthTokenObject();
};

/**
 * Save user token data (after login)
 * @param {Object} userTokenData - User token data from login response
 */
export const saveUserToken = (userTokenData) => {
  authTokenManager.saveUserToken(userTokenData);
};

/**
 * Clear auth token (on logout)
 */
export const clearAuthToken = () => {
  authTokenManager.clearAuthToken();
};

/**
 * Check if auth_token object exists and has valid structure
 * @returns {boolean} True if auth_token exists and is valid
 */
export const hasValidAuthToken = () => {
  return authTokenManager.hasValidAuthToken();
};

/**
 * Get token status for debugging
 * @returns {Object} Token status information
 */
export const getTokenStatus = () => {
  return authTokenManager.getTokenStatus();
};
