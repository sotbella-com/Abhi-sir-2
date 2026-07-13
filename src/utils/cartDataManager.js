/**
 * Cart Data Manager
 * Single source of truth for cart-related data
 * Ensures no ID or data mismatches
 */

const GUEST_TOKEN_KEY = 'guest_token';
const GUEST_BASKET_KEY = 'guest_basket_id';

/**
 * Get authoritative guest basket data
 * Priority: guest_token > API call
 * @returns {Promise<{basketId: string, customerId: string, basket: Object|null}>}
 */
export async function getAuthoritativeGuestBasketData() {
  try {
    // Priority 1: Get from saved guest_token (saved before login)
    const guestTokenRaw = localStorage.getItem(GUEST_TOKEN_KEY);
    if (guestTokenRaw) {
      try {
        const guestToken = JSON.parse(guestTokenRaw);
        const guestCustomerId = guestToken.customer_id;
        
        // Try to get basket ID from guest_token metadata or fetch from API
        if (guestCustomerId) {
          // Fetch baskets for this guest customer using GuestCartService
          // Note: We need to temporarily use guest token for this API call
          const originalToken = localStorage.getItem('auth_token');
          try {
            // Temporarily set guest token
            localStorage.setItem('auth_token', guestTokenRaw);
            
            // Fetch baskets using GuestCartService (handles token internally)
            const GuestCartService = (await import('../api/services/guestCart')).default;
            const basketsResponse = await GuestCartService.getBasket(null, guestCustomerId);
            
            // Restore original token
            if (originalToken) {
              localStorage.setItem('auth_token', originalToken);
            }
            
            // If we got a basket, return it
            if (basketsResponse && basketsResponse.basketId) {
              return {
                basketId: basketsResponse.basketId,
                customerId: guestCustomerId,
                basket: basketsResponse,
                source: 'guest_token_api'
              };
            }
          } catch (error) {
            // Restore original token on error
            if (originalToken) {
              localStorage.setItem('auth_token', originalToken);
            }
            throw error;
          }
          
          // Alternative: Use customerBaskets API if GuestCartService didn't work
          try {
            const { getCustomerBaskets } = await import('../api/services/customerBaskets');
            const originalToken2 = localStorage.getItem('auth_token');
            localStorage.setItem('auth_token', guestTokenRaw);
            
            try {
              const basketsResponse = await getCustomerBaskets(guestCustomerId);
              
              if (basketsResponse?.baskets?.length > 0) {
                // Get the most recent temporary basket (guest basket)
                const guestBaskets = basketsResponse.baskets
                  .filter(b => b.temporaryBasket === true)
                  .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
                
                if (guestBaskets.length > 0) {
                  // Restore original token
                  if (originalToken2) {
                    localStorage.setItem('auth_token', originalToken2);
                  }
                  
                  return {
                    basketId: guestBaskets[0].basketId,
                    customerId: guestCustomerId,
                    basket: guestBaskets[0],
                    source: 'guest_token_api'
                  };
                }
              }
            } finally {
              // Restore original token
              if (originalToken2) {
                localStorage.setItem('auth_token', originalToken2);
              }
            }
          } catch (altError) {
            // console.warn('⚠️ Alternative API call also failed:', altError);
          }
        }
      } catch (error) {
        // console.warn('⚠️ Failed to get guest basket from guest_token:', error);
      }
    }
    
    // Priority 2: Get from localStorage guest_basket_id (fallback)
    const storedBasketId = localStorage.getItem(GUEST_BASKET_KEY);
    if (storedBasketId) {
      // Try to get customer ID from current auth_token (if still guest)
      const authTokenRaw = localStorage.getItem('auth_token');
      if (authTokenRaw) {
        try {
          const authToken = JSON.parse(authTokenRaw);
          if (authToken.kind === 'guest' && authToken.customer_id) {
            return {
              basketId: storedBasketId,
              customerId: authToken.customer_id,
              basket: null,
              source: 'localStorage_fallback'
            };
          }
        } catch {}
      }
    }
    
    return {
      basketId: null,
      customerId: null,
      basket: null,
      source: 'none'
    };
  } catch (error) {
    // console.error('❌ Error getting authoritative guest basket data:', error);
    return {
      basketId: null,
      customerId: null,
      basket: null,
      source: 'error'
    };
  }
}

/**
 * Get authoritative customer basket data
 * Always fetches from API (no localStorage cache)
 * @param {string} customerId - Customer ID
 * @param {string} preferredBasketId - Optional basket ID to prefer
 * @returns {Promise<{basketId: string|null, basket: Object|null}>}
 */
export async function getAuthoritativeCustomerBasketData(customerId, preferredBasketId = null) {
  try {
    const { getCustomerBaskets } = await import('../api/services/customerBaskets');
    const basketsResponse = await getCustomerBaskets(customerId);
    
    // Handle new response format { baskets: [...], total: N }
    const basketsList = basketsResponse?.baskets || [];
    
    if (basketsList.length > 0) {
      let targetBasket = null;
      
      // Selection Logic:
      // 1. If preferredBasketId is provided, try to find it
      if (preferredBasketId) {
        targetBasket = basketsList.find(b => b.basketId === preferredBasketId);
      }
      
      // 2. If not found or not provided, prefer the permanent basket (temporaryBasket === false)
      if (!targetBasket) {
        // Sort by lastModified (most recent first) to get the active permanent basket
        const permanentBaskets = basketsList
          .filter(b => b.temporaryBasket === false)
          .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
          
        if (permanentBaskets.length > 0) {
          targetBasket = permanentBaskets[0];
        }
      }
      
      // 3. Fallback: If no permanent basket, use the most recent basket of any type
      // REMOVED: We strictly want permanent baskets only for this flow.
      // if (!targetBasket) {
      //   const allSorted = [...basketsList].sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
      //   targetBasket = allSorted[0];
      // }

      if (targetBasket) {
        return {
          basketId: targetBasket.basketId,
          basket: targetBasket,
          source: 'api'
        };
      }
    }
    
    return {
      basketId: null,
      basket: null,
      source: 'none'
    };
  } catch (error) {
    // console.error('❌ Error getting authoritative customer basket data:', error);
    return {
      basketId: null,
      basket: null,
      source: 'error'
    };
  }
}

/**
 * Validate basket ID consistency
 * @param {string} basketId1 - First basket ID
 * @param {string} basketId2 - Second basket ID
 * @param {string} context - Context for logging
 * @returns {boolean} True if consistent
 */
export function validateBasketIdConsistency(basketId1, basketId2, context = '') {
  if (!basketId1 || !basketId2) {
    return false;
  }
  
  if (basketId1 !== basketId2) {
    // console.warn(`⚠️ Basket ID mismatch in ${context}:`, {
    //   id1: basketId1,
    //   id2: basketId2,
    //   context
    // });
    return false;
  }
  
  return true;
}

/**
 * Clean up guest cart data
 * Removes all guest-related localStorage entries
 */
export function cleanupGuestCartData() {
  try {
    localStorage.removeItem(GUEST_BASKET_KEY);
    localStorage.removeItem(GUEST_TOKEN_KEY);
    localStorage.removeItem('pending_guest_basket_id');
    localStorage.removeItem('pending_guest_customer_id');
    localStorage.removeItem('pending_merge_items');
  } catch (error) {
    // console.warn('⚠️ Error cleaning up guest cart data:', error);
  }
}

