/**
 * Salesforce Commerce Cloud API Client
 * Provides authenticated requests with automatic token management
 */

import { getAuthToken } from '../utils/tokenUtils.js';
// import { getCurrentSiteIdSync, DEFAULT_SITE_ID } from '../utils/geolocation.js';

// Determine base URL for SFCC API calls
// In development, default to Vite proxy at `/sfcc`
// In production, default to the public Commerce Cloud API domain
const SHORTCODE = import.meta.env.VITE_SFCC_SHORTCODE;
const IS_DEV = import.meta.env.DEV;
const DEFAULT_BASE = IS_DEV
  ? '/sfcc'
  : `https://${SHORTCODE}.api.commercecloud.salesforce.com`;
// Allow override via env: VITE_SFCC_BASE_URL (set to '/sfcc' if using a server reverse-proxy)
const BASE_URL = import.meta.env.VITE_SFCC_BASE_URL || DEFAULT_BASE;

const ORG_ID = import.meta.env.VITE_SFCC_ORG_ID;
// Use dynamic site ID based on geolocation, fallback to env or default (UAE)
const ENV_SITE_ID = import.meta.env.VITE_SFCC_SITE_ID;
const FALLBACK_SITE_ID = ENV_SITE_ID;  

class SFCCAPIClient {
  constructor() {
    this.baseUrl = BASE_URL;
    this.orgId = ORG_ID;
    this.fallbackSiteId = FALLBACK_SITE_ID;
  }

  /**
   * Make an authenticated GET request
   */
  async get(endpoint, options = {}) {
    return this.request('GET', endpoint, options);
  }

  /**
   * Make an authenticated POST request
   */
  async post(endpoint, data = null, options = {}) {
    return this.request('POST', endpoint, { ...options, body: data });
  }

  /**
   * Make an authenticated PUT request
   */
  async put(endpoint, data = null, options = {}) {
    return this.request('PUT', endpoint, { ...options, body: data });
  }

  /**
   * Make an authenticated DELETE request
   */
  async delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, options);
  }

  /**
   * Make an authenticated PATCH request
   */
  async patch(endpoint, data = null, options = {}) {
    return this.request('PATCH', endpoint, { ...options, body: data });
  }

  /**
   * Core request method with automatic token management
   */
  async request(method, endpoint, options = {}) {
    try {
      // Get token from unified auth_token object (automatically ensures valid token)
      const accessToken = await getAuthToken();
      
      if (!accessToken) {
        throw new Error('No valid token available. Please refresh the page.');
      }
      
      // Build full URL
      const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
      
      // Prepare headers
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-dw-client-id': import.meta.env.VITE_SFCC_CLIENT_ID,
        ...options.headers
      };

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      // Prepare request options
      const requestOptions = {
        method,
        headers,
        signal: controller.signal,
        ...options
      };

      // Add body for requests that support it
      if (options.body && ['POST', 'PUT', 'PATCH'].includes(method)) {
        if (typeof options.body === 'object') {
          requestOptions.body = JSON.stringify(options.body);
        } else {
          requestOptions.body = options.body;
        }
      }
      
      try {
        
        const response = await fetch(url, requestOptions);
        clearTimeout(timeoutId); // Clear timeout on successful response


        if (!response.ok) {
          let errorDetail = "";
          try {
            errorDetail = await response.text();
          } catch (err) {
          }

          if (response.status === 401) {
            throw new Error(`401 Unauthorized — token likely expired/invalid. ${errorDetail}`);
          }

          throw new Error(`${method} request failed: ${response.status} ${response.statusText} ${errorDetail}`);
        }

        // Parse as JSON
        const jsonResponse = await response.json();
        return jsonResponse;

      } catch (error) {
        clearTimeout(timeoutId); // Clear timeout on error
        
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout: ${method} ${endpoint} took longer than 30 seconds`);
        }
        
        throw error;
      }

    } catch (error) {
      throw error;
    }
  }

  /**
   * Build URL with organization and site parameters
   * Uses dynamic site ID based on geolocation if not provided
   */
  buildUrl(endpoint, siteId = null) {
    // Use provided siteId, or get dynamic site ID, or fallback
    const site = siteId;
    const separator = endpoint.includes('?') ? '&' : '?';
    return `${endpoint}${separator}siteId=${encodeURIComponent(site)}`;
  }

  /**
   * Get organization-specific URL
   */
  getOrgUrl(path) {
    return `/organizations/${this.orgId}${path}`;
  }

  /**
   * Get shopper API URL
   */
  getShopperUrl(path) {
    return `/shopper${path}`;
  }

  /**
   * Get custom data API URL
   */
  getCustomDataUrl(path) {
    return `/custom/custom-data/v1/organizations/${this.orgId}${path}`;
  }
}

// Create singleton instance
const sfccApiClient = new SFCCAPIClient();

// Export the instance and class
export default sfccApiClient;
export { SFCCAPIClient };

// Convenience functions for common operations
export const sfccGet = (endpoint, options) => sfccApiClient.get(endpoint, options);
export const sfccPost = (endpoint, data, options) => sfccApiClient.post(endpoint, data, options);
export const sfccPut = (endpoint, data, options) => sfccApiClient.put(endpoint, data, options);
export const sfccDelete = (endpoint, options) => sfccApiClient.delete(endpoint, options);
export const sfccPatch = (endpoint, data, options) => sfccApiClient.patch(endpoint, data, options);