/**
 * Einstein Commerce Cloud (CQuotient) Activity Tracking Service
 * 
 * Tracks user activities to SFCC for personalization and analytics.
 * Optimized for performance with:
 * - Non-blocking requests (fire and forget)
 * - Request batching/debouncing
 * - sendBeacon for page unload
 * - Error handling that doesn't block user flow
 * - Offline queue support
 */

import { isUserLoggedIn, getCustomerId } from '@/utils/tokenUtils';
import { logger } from '@/utils/logger';

// Configuration
const EINSTEIN_BASE_URL = 'https://api.cquotient.com/v3/activities';
const EINSTEIN_SITE_ID = 'blxz-sotbella_in';
const EINSTEIN_CLIENT_ID = 'b62c4d5c-1705-4a6d-bd07-f0c138460169';
const REALM = 'blxz';

// Request queue for offline scenarios
const requestQueue = [];
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

// Track online/offline status
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    isOnline = true;
    processQueue();
  });
  window.addEventListener('offline', () => {
    isOnline = false;
  });
}

/**
 * Get cookie ID from browser cookies
 * Looks for dwanonymous_* cookie or generates a persistent ID
 */
const getCookieId = () => {
  if (typeof document === 'undefined') return '';

  // Try to get dwanonymous_* cookie (SFCC standard)
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name && name.startsWith('dwanonymous_')) {
      return value || '';
    }
  }

  // Fallback: Use or create a persistent anonymous ID in localStorage
  const STORAGE_KEY = 'einstein_anonymous_id';
  let anonymousId = localStorage.getItem(STORAGE_KEY);
  
  if (!anonymousId) {
    anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    try {
      localStorage.setItem(STORAGE_KEY, anonymousId);
    } catch (e) {
      // localStorage might be disabled
      return '';
    }
  }
  
  return anonymousId;
};

/**
 * Get user ID (hashed customer ID for logged-in users)
 */
const getUserId = async () => {
  if (!isUserLoggedIn()) {
    return '';
  }
  
  try {
    const customerId = await getCustomerId();
    // Note: In production, this should be hashed on the backend
    // For now, we'll send the customer ID (backend should hash it)
    return customerId || '';
  } catch (error) {
    logger.warn('Failed to get user ID for Einstein tracking:', error);
    return '';
  }
};

/**
 * Send tracking request with performance optimizations
 * Uses sendBeacon for page unload, fetch for normal requests
 */
const sendTrackingRequest = async (endpoint, data, useBeacon = false) => {
  const url = `${EINSTEIN_BASE_URL}/${EINSTEIN_SITE_ID}/${endpoint}`;
  
  // If offline, queue the request
  if (!isOnline) {
    requestQueue.push({ endpoint, data, useBeacon });
    return { queued: true };
  }

  const headers = {
    'x-cq-client-id': EINSTEIN_CLIENT_ID,
    'Content-Type': 'application/json',
  };

  // Note: sendBeacon doesn't support custom headers, so we can't use it for Einstein API
  // which requires 'x-cq-client-id' header. Always use fetch with keepalive instead.

  // Use fetch with non-blocking approach
  try {
    // Fire and forget - don't await to avoid blocking
    fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      keepalive: true, // Keep request alive even if page unloads
      mode: 'cors', // Use CORS to see error responses for debugging
    })
    .then(async (response) => {
      if (!response.ok) {
        // Log error response for debugging
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = errorText;
        }
        logger.warn(`Einstein tracking failed (${endpoint}):`, {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          payload: data,
        });
      } else {
        logger.debug(`Einstein tracking succeeded (${endpoint})`);
      }
    })
    .catch((error) => {
      // Silently fail - tracking should never block user experience
      logger.debug('Einstein tracking request failed (non-blocking):', error);
    });

    return { success: true, method: 'fetch' };
  } catch (error) {
    // Queue for retry if request fails
    requestQueue.push({ endpoint, data, useBeacon });
    logger.debug('Einstein tracking request queued:', error);
    return { queued: true };
  }
};

/**
 * Process queued requests when back online
 */
const processQueue = async () => {
  if (!isOnline || requestQueue.length === 0) return;

  const queue = [...requestQueue];
  requestQueue.length = 0; // Clear queue

  for (const { endpoint, data } of queue) {
    try {
      await sendTrackingRequest(endpoint, data);
    } catch (error) {
      // Re-queue if still failing
      requestQueue.push({ endpoint, data });
    }
  }
};

/**
 * Build base payload with common fields
 */
const buildBasePayload = async () => {
  const cookieId = getCookieId();
  const userId = await getUserId();

  // API spec shows cookieId can be empty string, but it's marked as required
  // Generate one if missing to ensure we always have a valid value
  const finalCookieId = cookieId || `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

  return {
    cookieId: finalCookieId,
    userId: userId || '', // Empty string is acceptable per API spec
    realm: REALM,
  };
};

/**
 * Extract main product ID (not variant ID)
 * Uses representedProduct.id if available, otherwise falls back to product.id
 * @param {Object} product - Product object
 * @returns {string} Main product ID
 */
const getMainProductId = (product) => {
  if (!product) return null;
  
  // If product is a string, return it as-is
  if (typeof product === 'string') return product;
  
  // Prefer representedProduct.id (master product ID) over variant ID
  if (product.representedProduct?.id) {
    return product.representedProduct.id;
  }
  
  // Fallback to product.id or product.productId
  return product.id || product.productId || null;
};

/**
 * Track product view
 * @param {string|Object} productIdOrProduct - Product ID string or product object
 */
export const trackViewProduct = async (productIdOrProduct) => {
  const productId = typeof productIdOrProduct === 'string' 
    ? productIdOrProduct 
    : getMainProductId(productIdOrProduct);
    
  if (!productId) {
    logger.warn('trackViewProduct: productId is required');
    return;
  }

  try {
    const basePayload = await buildBasePayload();
    // Per spec: viewProduct requires product, cookieId, realm (userId is optional)
    const payload = {
      product: {
        id: productId,
      },
      cookieId: basePayload.cookieId,
      realm: basePayload.realm,
      // Include userId only if it exists (per CURL example, it can be empty string)
      ...(basePayload.userId && { userId: basePayload.userId }),
    };

    await sendTrackingRequest('viewProduct', payload);
    logger.debug('Einstein: Tracked viewProduct', { productId });
  } catch (error) {
    logger.debug('Einstein: Failed to track viewProduct', error);
  }
};

/**
 * Track search view
 * @param {string} searchText - Search query text
 * @param {Array} products - Array of product objects with id
 * @param {Array} sortingRule - Sorting rules (optional)
 * @param {Object} itemRange - Pagination info (optional)
 */
export const trackViewSearch = async (searchText, products = [], sortingRule = null, itemRange = null) => {
  if (!searchText) {
    logger.warn('trackViewSearch: searchText is required');
    return;
  }

  try {
    const basePayload = await buildBasePayload();
    
    // Map products - API spec shows products array is required
    const mappedProducts = products.map((p) => {
      const mainId = getMainProductId(p);
      return { id: mainId || p.id || p.productId || p };
    }).filter(p => p && p.id); // Remove any products without valid IDs
    
    const payload = {
      ...basePayload,
      searchText,
      products: mappedProducts, // Can be empty array per spec
    };

    if (sortingRule && Array.isArray(sortingRule) && sortingRule.length > 0) {
      payload.sortingRule = sortingRule;
    } else if (sortingRule && !Array.isArray(sortingRule)) {
      payload.sortingRule = [sortingRule];
    }

    if (itemRange && Object.keys(itemRange).length > 0) {
      payload.itemRange = itemRange;
    }

    await sendTrackingRequest('viewSearch', payload);
    logger.debug('Einstein: Tracked viewSearch', { searchText, productCount: mappedProducts.length });
  } catch (error) {
    logger.debug('Einstein: Failed to track viewSearch', error);
  }
};

/**
 * Track search click (when user clicks on a search result)
 * @param {string} searchText - Search query text
 * @param {Object} product - Product object with id, sku, altId, altIdType
 * @param {Array} products - All products on search page (optional)
 * @param {Array} sortingRule - Sorting rules (optional)
 * @param {Object} itemRange - Pagination info (optional)
 * @param {string} correlationId - Correlation ID (optional)
 */
export const trackClickSearch = async (searchText, product, products = [], sortingRule = null, itemRange = null, correlationId = null) => {
  if (!searchText || !product) {
    logger.warn('trackClickSearch: searchText and product are required');
    return;
  }

  try {
    const basePayload = await buildBasePayload();
    const productId = getMainProductId(product) || product.id || product.productId || product;
    
    // clickSearch API requires:
    // - searchText (required)
    // - product (singular object with id) - REQUIRED
    // Optional: products array, sortingRule, itemRange, correlationId
    
    const payload = {
      ...basePayload,
      searchText, // Required
      product: { // Required - singular product object
        id: productId,
        ...(product.sku && { sku: product.sku }),
        ...(product.altId && { altId: product.altId }),
        ...(product.altIdType && { altIdType: product.altIdType }),
      },
    };

    // Optional: products array (all products on the page)
    if (products && products.length > 0) {
      payload.products = products.map((p) => {
        const mainId = getMainProductId(p);
        return { id: mainId || p.id || p.productId || p };
      }).filter(p => p && p.id);
    }

    // Optional: sortingRule
    if (sortingRule && Array.isArray(sortingRule) && sortingRule.length > 0) {
      payload.sortingRule = sortingRule;
    } else if (sortingRule && !Array.isArray(sortingRule)) {
      payload.sortingRule = [sortingRule];
    }

    // Optional: itemRange
    if (itemRange && Object.keys(itemRange).length > 0) {
      payload.itemRange = itemRange;
    }

    // Optional: correlationId
    if (correlationId) {
      payload.correlationId = correlationId;
    }

    await sendTrackingRequest('clickSearch', payload);
    logger.debug('Einstein: Tracked clickSearch', { searchText, productId });
  } catch (error) {
    logger.debug('Einstein: Failed to track clickSearch', error);
  }
};

/**
 * Track page view (general page views)
 */
export const trackViewPage = async () => {
  try {
    const basePayload = await buildBasePayload();
    await sendTrackingRequest('viewPage', basePayload, true); // Use beacon for page views
    logger.debug('Einstein: Tracked viewPage');
  } catch (error) {
    logger.debug('Einstein: Failed to track viewPage', error);
  }
};

/**
 * Track category view
 * @param {string} categoryId - Category ID
 * @param {Array} products - Array of product objects with id
 * @param {Array} sortingRule - Sorting rules (optional)
 * @param {Object} itemRange - Pagination info (optional)
 */
export const trackViewCategory = async (categoryId, products = [], sortingRule = null, itemRange = null) => {
  // API spec shows category.id can be empty string, but it's marked as required
  // Allow empty string but not null/undefined
  if (categoryId === null || categoryId === undefined) {
    logger.warn('trackViewCategory: categoryId is required');
    return;
  }

  try {
    const basePayload = await buildBasePayload();
    
    // Map products and ensure we have at least one valid product
    // API spec shows products array is required
    const mappedProducts = products.map((p) => {
      const mainId = getMainProductId(p);
      const productId = mainId || p.id || p.productId || p;
      if (!productId) return null;
      
      // Include optional fields if available (per CURL example)
      const productObj = { id: productId };
      if (p.sku) productObj.sku = p.sku;
      if (p.altId) productObj.altId = p.altId;
      if (p.altIdType) productObj.altIdType = p.altIdType;
      
      return productObj;
    }).filter(p => p && p.id); // Remove null/invalid products
    
    // If no valid products, log warning but still send request with empty array
    // (API spec shows empty array is acceptable in examples)
    if (mappedProducts.length === 0 && products.length > 0) {
      logger.warn('trackViewCategory: No valid product IDs found in products array');
    }
    
    const payload = {
      ...basePayload,
      category: {
        id: categoryId || '', // Allow empty string per spec
      },
      products: mappedProducts, // Can be empty array per spec examples
    };

    if (sortingRule && Array.isArray(sortingRule) && sortingRule.length > 0) {
      payload.sortingRule = sortingRule;
    }

    if (itemRange && Object.keys(itemRange).length > 0) {
      payload.itemRange = itemRange;
    }

    await sendTrackingRequest('viewCategory', payload);
    logger.debug('Einstein: Tracked viewCategory', { categoryId, productCount: mappedProducts.length });
  } catch (error) {
    logger.debug('Einstein: Failed to track viewCategory', error);
  }
};

/**
 * Track category click (when user clicks on a product in category)
 * @param {string} categoryId - Category ID
 * @param {Object} product - Product object with id, sku, altId, altIdType
 * @param {string} correlationId - Correlation ID (optional)
 */
export const trackClickCategory = async (categoryId, product, correlationId = null) => {
  if (!categoryId || !product) {
    logger.warn('trackClickCategory: categoryId and product are required');
    return;
  }

  try {
    const basePayload = await buildBasePayload();
    const productId = getMainProductId(product) || product.id || product.productId || product;
    
    const payload = {
      ...basePayload,
      category: {
        id: categoryId,
      },
      product: {
        id: productId,
        ...(product.sku && { sku: product.sku }),
        ...(product.altId && { altId: product.altId }),
        ...(product.altIdType && { altIdType: product.altIdType }),
      },
    };

    if (correlationId) {
      payload.correlationId = correlationId;
    }

    await sendTrackingRequest('clickCategory', payload);
    logger.debug('Einstein: Tracked clickCategory', { categoryId, productId });
  } catch (error) {
    logger.debug('Einstein: Failed to track clickCategory', error);
  }
};

/**
 * Track checkout begin
 * @param {Array} products - Array of product objects with id, price, quantity
 * @param {number} amount - Total checkout amount
 */
export const trackBeginCheckout = async (products = [], amount = 0) => {
  try {
    const basePayload = await buildBasePayload();
    const payload = {
      ...basePayload,
      products: products.map((p) => {
        const mainId = getMainProductId(p);
        return {
          id: mainId || p.id || p.productId || p,
          price: Number(p.price || 0),
          quantity: Number(p.quantity || 1),
        };
      }).filter(p => p.id), // Remove any products without valid IDs
      amount: Number(amount || 0),
    };

    await sendTrackingRequest('beginCheckout', payload);
    logger.debug('Einstein: Tracked beginCheckout', { productCount: products.length, amount });
  } catch (error) {
    logger.debug('Einstein: Failed to track beginCheckout', error);
  }
};

/**
 * Track add to cart
 * @param {Array} products - Array of product objects with id, price, quantity
 */
export const trackAddToCart = async (products = []) => {
  if (!products || products.length === 0) {
    logger.warn('trackAddToCart: products array is required');
    return;
  }

  try {
    const basePayload = await buildBasePayload();
    const payload = {
      ...basePayload,
      products: products.map((p) => {
        const mainId = getMainProductId(p);
        return {
          id: mainId || p.id || p.productId || p,
          sku: p.sku || '',
          price: Number(p.price || 0),
          originalPrice: Number(p.originalPrice || p.price || 0),
          quantity: Number(p.quantity || 1),
        };
      }).filter(p => p.id), // Remove any products without valid IDs
    };

    await sendTrackingRequest('addToCart', payload);
    logger.debug('Einstein: Tracked addToCart', { productCount: products.length });
  } catch (error) {
    logger.debug('Einstein: Failed to track addToCart', error);
  }
};

// Export queue processor for manual triggering if needed
export { processQueue };
