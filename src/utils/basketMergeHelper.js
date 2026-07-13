/**
 * Basket Merge Helper
 * Provides utilities for reliable basket merging with error handling and fallbacks
 */

import GuestCartService from '../api/services/guestCart.js';
import BasketMergeService from '../api/services/basketMerge.js';
import sfccApiClient from '../api/sfccApiClient.js';
// import { getCurrentLocale, getCurrentSiteId } from './sfccSiteConfig.js';

/**
 * Get guest basket items using saved guest token
 * This preserves SFCC session context
 */
export const getGuestBasketItems = async (guestBasketId, guestCustomerId) => {
  try {
    // Priority 1: Use saved guest_token to fetch basket
    const guestTokenRaw = localStorage.getItem('guest_token');
    if (guestTokenRaw && guestBasketId) {
      try {
        const guestToken = JSON.parse(guestTokenRaw);
        const originalToken = localStorage.getItem('auth_token');

        // Temporarily use guest token to fetch the basket
        localStorage.setItem('auth_token', JSON.stringify(guestToken));

        try {
          const guestBasket = await GuestCartService.getBasket(guestBasketId, guestToken.customer_id);
          if (guestBasket && guestBasket.productItems?.length > 0) {
            return {
              success: true,
              items: guestBasket.productItems,
              basket: guestBasket
            };
          }
        } finally {
          // Restore original token
          if (originalToken) {
            localStorage.setItem('auth_token', originalToken);
          }
        }
      } catch (error) {
        // console.warn('⚠️ Failed to fetch guest basket using saved guest_token:', error.message);
      }
    }

    // Priority 2: Check localStorage snapshot
    const raw = localStorage.getItem('pending_merge_items');
    if (raw) {
      try {
        const pending = JSON.parse(raw);
        if (Array.isArray(pending) && pending.length > 0) {
          return {
            success: true,
            items: pending,
            basket: null
          };
        }
      } catch (e) {
        // Invalid JSON
      }
    }

    return {
      success: false,
      items: [],
      basket: null
    };
  } catch (error) {
    // console.error('❌ Error getting guest basket items:', error);
    return {
      success: false,
      items: [],
      basket: null,
      error: error.message
    };
  }
};

/**
 * Manually add guest items to customer basket (fallback when merge API fails)
 */
export const manuallyAddGuestItems = async (guestItems, customerBasketId) => {
  if (!guestItems || guestItems.length === 0 || !customerBasketId) {
    return { success: false, error: 'Missing items or basket ID' };
  }

  const addedItems = [];
  const failedItems = [];

  try {
    const siteId =  import.meta.env.VITE_SFCC_SITE_ID;
    const locale = import.meta.env.VITE_SFCC_LOCALE || 'en-IN';

    for (const item of guestItems) {
      if (item.productId && item.quantity > 0) {
        try {
          const itemsPayload = [{
            productId: item.productId,
            quantity: item.quantity
          }];

          const endpoint = `/checkout/shopper-baskets/v2/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/baskets/${customerBasketId}/items`;
          const url = sfccApiClient.buildUrl(endpoint, siteId);
          const params = new URLSearchParams({ locale });
          const fullUrl = `${url}&${params.toString()}`;

          await sfccApiClient.post(fullUrl, itemsPayload);
          addedItems.push(item);
        } catch (addErr) {
          // console.warn('⚠️ Failed to add item:', {
          //   productId: item.productId,
          //   quantity: item.quantity,
          //   error: addErr.message
          // });
          failedItems.push({ item, error: addErr.message });
        }
      }
    }

    return {
      success: addedItems.length > 0,
      addedItems,
      failedItems,
      totalAdded: addedItems.length,
      totalFailed: failedItems.length
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      addedItems,
      failedItems
    };
  }
};

/**
 * Merge baskets with retry logic and fallback
 * @param {string} guestBasketId - Guest basket ID
 * @param {string} guestCustomerId - Guest customer ID
 * @param {Object} options - Merge options
 * @returns {Promise<Object>} Merge result
 */
export const mergeBasketsWithFallback = async (guestBasketId, guestCustomerId, options = {}) => {
  const { maxRetries = 2, retryDelay = 500 } = options;

  // Step 1: Get guest basket items (for fallback)
  const guestItemsResult = await getGuestBasketItems(guestBasketId, guestCustomerId);
  const guestItems = guestItemsResult.items || [];

  // Step 2: Try merge API with retry logic
  let lastError = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }

      const mergedBasket = await BasketMergeService.mergeBaskets(guestBasketId, null);
      
      if (mergedBasket && mergedBasket.basketId) {
        return {
          success: true,
          method: 'api',
          basket: mergedBasket,
          attempt: attempt + 1
        };
      }
    } catch (error) {
      lastError = error;
      const is409Error = error.message?.includes('409') || error.message?.includes('Conflict');
      const isSourceBasketError = error.message?.includes('no active basket') ||
        error.message?.includes('Source Basket') ||
        error.message?.includes('previous customer');

      // If it's a 409 error related to source basket, try fallback immediately
      if (is409Error && isSourceBasketError) {
        break; // Exit retry loop and use fallback
      }

      // For other errors, retry
      if (attempt < maxRetries) {
        // console.warn(`⚠️ Merge attempt ${attempt + 1} failed, retrying...`, error.message);
      }
    }
  }

  // Step 3: Fallback - manually add items if merge API failed
  if (guestItems.length > 0) {
    
    // Get or create customer basket
    let customerBasket;
    try {
      const { getCustomerId } = await import('./tokenUtils.js');
      const customerId = await getCustomerId();
      customerBasket = await BasketMergeService.getOrCreateCustomerBasket(customerId);
    } catch (error) {
      return {
        success: false,
        method: 'fallback',
        error: `Failed to get customer basket: ${error.message}`,
        guestItems: guestItems.length
      };
    }

    if (customerBasket && customerBasket.basketId) {
      const fallbackResult = await manuallyAddGuestItems(guestItems, customerBasket.basketId);
      
      if (fallbackResult.success) {
        // Fetch updated basket using customer baskets API
        try {
          const { getCustomerId } = await import('./tokenUtils.js');
          const customerId = await getCustomerId();
          if (customerId) {
            const basketsEndpoint = `/customer/shopper-customers/v1/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/customers/${customerId}/baskets`;
            const basketsUrl = sfccApiClient.buildUrl(basketsEndpoint, import.meta.env.VITE_SFCC_SITE_ID || getCurrentSiteId());
            const existingBaskets = await sfccApiClient.get(basketsUrl);
            
            if (existingBaskets.baskets && existingBaskets.baskets.length > 0) {
              const nonTemporaryBaskets = existingBaskets.baskets.filter(b => !b.temporaryBasket);
              const updatedBasket = nonTemporaryBaskets.length > 0 
                ? nonTemporaryBaskets.find(b => b.basketId === customerBasket.basketId) || nonTemporaryBaskets[0]
                : existingBaskets.baskets.find(b => b.basketId === customerBasket.basketId) || existingBaskets.baskets[0];
              
              return {
                success: true,
                method: 'fallback',
                basket: updatedBasket || customerBasket,
                addedItems: fallbackResult.addedItems.length,
                failedItems: fallbackResult.failedItems.length,
                warning: fallbackResult.failedItems.length > 0 
                  ? `${fallbackResult.failedItems.length} items could not be added`
                  : null
              };
            }
          }
        } catch (error) {
          // Continue with customerBasket if fetch fails
        }
        
        return {
          success: true,
          method: 'fallback',
          basket: customerBasket,
          addedItems: fallbackResult.addedItems.length,
          failedItems: fallbackResult.failedItems.length,
          warning: fallbackResult.failedItems.length > 0 
            ? `${fallbackResult.failedItems.length} items could not be added`
            : null
        };
      } else {
        return {
          success: false,
          method: 'fallback',
          error: fallbackResult.error || 'Failed to add items',
          guestItems: guestItems.length
        };
      }
    }
  }

  // All methods failed
  return {
    success: false,
    method: 'none',
    error: lastError?.message || 'Merge failed and no fallback available',
    guestItems: guestItems.length
  };
};

