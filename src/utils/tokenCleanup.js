/**
 * Token Cleanup Utility
 * Removes legacy token storage keys to ensure single source of truth (auth_token)
 * Should be called once on app initialization
 */

import { logger } from './logger.js';

/**
 * Clean up all legacy token storage keys
 * This ensures we only use the unified auth_token key
 */
export const cleanupLegacyTokenKeys = () => {
  const legacyKeys = [
    // Legacy SFCC token keys
    'SFCC_ACCESS_TOKEN',
    'SFCC_REFRESH_TOKEN',
    'SFCC_TOKEN_EXPIRY',
    'SFCC_REFRESH_TOKEN_EXPIRY',
    
    // Legacy user token keys
    'ACCESS_TOKEN',
    'ID_TOKEN',
    'REFRESH_TOKEN',
    'EXPIRES_IN',
    'REFRESH_TOKEN_EXPIRES_IN',
    'TOKEN_TYPE',
    'USID',
    'CUSTOMER_ID',
    'ENC_USER_ID',
    'IDP_ACCESS_TOKEN',
    'IDP_REFRESH_TOKEN',
    'DNT',
    'user_token',
    'user_tokens',
    
    // Legacy guest token keys
    'GUEST_ACCESS_TOKEN',
    'GUEST_ID_TOKEN',
    'GUEST_REFRESH_TOKEN',
    'GUEST_EXPIRES_IN',
    'GUEST_REFRESH_TOKEN_EXPIRES_IN',
    'GUEST_TOKEN_TYPE',
    'GUEST_USID',
    'GUEST_CUSTOMER_ID',
    'GUEST_ENC_USER_ID',
    'GUEST_IDP_ACCESS_TOKEN',
    'GUEST_IDP_REFRESH_TOKEN',
    'GUEST_DNT',
  ];

  let cleanedCount = 0;
  legacyKeys.forEach(key => {
    try {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        cleanedCount++;
      }
    } catch (error) {
      // Ignore errors (e.g., in private browsing mode)
    }
  });

  if (cleanedCount > 0) {
    logger.log(`🧹 Cleaned up ${cleanedCount} legacy token keys`);
  }

  return cleanedCount;
};

/**
 * Migrate legacy token data to unified auth_token format
 * This is a one-time migration for existing users
 */
export const migrateLegacyTokens = () => {
  try {
    // Check if we already have auth_token (already migrated)
    const authToken = localStorage.getItem('auth_token');
    if (authToken) {
      // Already using unified format, just clean up legacy keys
      return cleanupLegacyTokenKeys();
    }

    // Try to migrate from legacy user token
    const userToken = localStorage.getItem('user_token') || localStorage.getItem('ACCESS_TOKEN');
    if (userToken) {
      try {
        const tokenData = typeof userToken === 'string' ? JSON.parse(userToken) : { access_token: userToken };
        if (tokenData.access_token) {
          // Migrate to unified format
          const unifiedToken = {
            kind: 'user',
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || null,
            expires_in: tokenData.expires_in || 3600,
            refresh_token_expires_in: tokenData.refresh_token_expires_in || null,
            customer_id: tokenData.customer_id || tokenData.customerId || null,
            usid: tokenData.usid || null,
            token_type: tokenData.token_type || 'Bearer',
            id_token: tokenData.id_token || null,
            idp_access_token: tokenData.idp_access_token || null,
            idp_refresh_token: tokenData.idp_refresh_token || null,
            dnt: tokenData.dnt || null,
            updated_at: Math.floor(Date.now() / 1000)
          };
          localStorage.setItem('auth_token', JSON.stringify(unifiedToken));
          logger.log('✅ Migrated user token to unified format');
        }
      } catch (e) {
        // Migration failed, will generate new token
      }
    }

    // Clean up legacy keys after migration
    return cleanupLegacyTokenKeys();
  } catch (error) {
    logger.warn('⚠️ Token migration failed:', error);
    return 0;
  }
};

