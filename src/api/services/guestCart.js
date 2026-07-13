import sfccApiClient from '../sfccApiClient';
import { getCustomerId } from '../../utils/tokenUtils';
// import { getCurrentLocale } from '@/utils/sfccSiteConfig';

// Must match the key read by unifiedCartStore for merge
const GUEST_CART_KEY = 'guest_basket_id';
const GUEST_CUSTOMER_KEY = 'guest_customer_id';

/**
 * Guest Cart Service - Handles cart operations for non-logged in users
 */
export class GuestCartService {
  // De-duplicate in-flight operations to prevent misuse/spikes
  static inFlight = {
    create: null,
    getBasketId: null,
    addToBasket: {}, // key: `${basketId}:${productId}`
  };
  /**
   * Get current customer ID from the active token
   * @returns {string|null} Current customer ID or null
   */
  static async getCurrentCustomerId() {
    // Use the centralized function from auth_token object
    const customerId = await getCustomerId();
    
    return customerId;
  }
  /**
   * Create a new guest basket
   * @returns {Promise<Object>} Basket object
   */
  static async createBasket(options = {}) {
    try {
      if (this.inFlight.create) return await this.inFlight.create;
      // Ensure we know the current guest customer id for merge bookkeeping
      const currentCustomerId = await this.getCurrentCustomerId();
      const endpoint = `/checkout/shopper-baskets/v2/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/baskets`;
      const url = sfccApiClient.buildUrl(endpoint, import.meta.env.VITE_SFCC_SITE_ID);
      
      // Add parameters as per Category.txt documentation
      // Note: siteId is already added by sfccApiClient.buildUrl()
      const isTemporary = options?.temporary === true;
      const params = new URLSearchParams({
        locale: import.meta.env.VITE_SFCC_LOCALE || "en-IN", // Default locale if not found
        temporary: isTemporary.toString() // Pass temporary flag
      });
      
      const fullUrl = `${url}&${params.toString()}`;

      
      // Empty JSON body as per documentation
      this.inFlight.create = sfccApiClient.post(fullUrl, {});
      const response = await this.inFlight.create;
      this.inFlight.create = null;
      

      // Persist guest basket id and customer id for later merge after login
      try {
        if (response?.basketId) {
          localStorage.setItem(GUEST_CART_KEY, response.basketId);
        }
        if (currentCustomerId) {
          localStorage.setItem(GUEST_CUSTOMER_KEY, currentCustomerId);
        }
      } catch (e) {
      }
      
      return response;
    } catch (error) {
      // Handle quota exceeded error by trying to reuse existing basket
      if (error.message && error.message.includes('Customer Baskets Quota Exceeded')) {
        try {
          // Extract basket ID from error message
          const basketIdMatch = error.message.match(/baskets \(([^)]+)\)/);
          if (basketIdMatch && basketIdMatch[1]) {
            const existingBasketId = basketIdMatch[1];
            
            // Try to get the existing basket
            const existingBasket = await this.getBasket(existingBasketId);
            
            return existingBasket;
          } else {
            throw error;
          }
        } catch (reuseError) {
          throw error; // Throw original error if reuse fails
        }
      }
      
      throw error;
    }
  }

  /**
   * Delete a guest basket
   * @param {string} basketId - Basket ID to delete
   * @returns {Promise<boolean>} Success status
   */
  static async deleteBasket(basketId) {
    try {
      const endpoint = `/checkout/shopper-baskets/v2/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/baskets/${basketId}`;
      const url = sfccApiClient.buildUrl(endpoint, import.meta.env.VITE_SFCC_SITE_ID);
      
      // Add parameters as per Category.txt documentation
      const params = new URLSearchParams({
        // siteId is already added by sfccApiClient.buildUrl()
        locale: import.meta.env.VITE_SFCC_LOCALE || "en-IN", // Default locale if not found
      });
      const fullUrl = `${url}&${params.toString()}`;
      
      await sfccApiClient.delete(fullUrl);
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all customer baskets and delete them to free up quota
   * @param {string} customerId - Customer ID to clear baskets for
   * @returns {Promise<boolean>} Success status
   */
  static async clearAllBaskets(customerId = null) {
    try {
      // Use provided customerId or get current one
      const targetCustomerId = customerId || await this.getCurrentCustomerId();
      
      if (!targetCustomerId) {

        return true;
      }

      
      const endpoint = `/customer/shopper-customers/v1/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/customers/${targetCustomerId}/baskets`;
      const url = sfccApiClient.buildUrl(endpoint, import.meta.env.VITE_SFCC_SITE_ID);
      
      // Add parameters as per Category.txt documentation
      const params = new URLSearchParams({
        // siteId is already added by sfccApiClient.buildUrl()
        locale: import.meta.env.VITE_SFCC_LOCALE || "en-IN", // Default locale if not found
      });
      const fullUrl = `${url}&${params.toString()}`;
      
      try {
        const response = await sfccApiClient.get(fullUrl);
        
        if (response && response.baskets && response.baskets.length > 0) {
          
          // Delete all existing baskets
          for (const basket of response.baskets) {
            try {
              await this.deleteBasket(basket.basketId);
            } catch (error) {
            }
          }
          
        } else {
        }
        
        return true;
      } catch (apiError) {
        // If customer is invalid, just log and continue
        if (apiError.message && apiError.message.includes('Invalid Customer')) {
          return true;
        }
        
        // For other errors, log and continue
        return true;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Get existing basket ID from localStorage or create new one
   * Uses cached basket ID if it's associated with current valid guest token (30min cache)
   * @returns {Promise<string>} Basket ID
   */
  static async getBasketId() {
    try {
      if (this.inFlight.getBasketId) return await this.inFlight.getBasketId;
      
      // Check if we have a valid cached basket ID for current guest token
      const cachedBasketId = this.getCachedBasketId();
      if (cachedBasketId) {
        try { localStorage.setItem(GUEST_CART_KEY, cachedBasketId); } catch {}
        return cachedBasketId;
      }
      
      this.inFlight.getBasketId = this.createBasket();
      const basket = await this.inFlight.getBasketId;
      this.inFlight.getBasketId = null;
      
      
      // Cache the basket ID with current guest token
      this.cacheBasketId(basket.basketId);
      // Persist for merge flow
      try { localStorage.setItem(GUEST_CART_KEY, basket.basketId); } catch {}
      
      return basket.basketId;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get cached basket ID if it's associated with current valid guest token
   * @returns {string|null} Cached basket ID or null
   */
  static getCachedBasketId() {
    try {
      const guestTokenData = localStorage.getItem('guest_token');
      const cachedBasketData = localStorage.getItem('guest_basket_cache');
      
      if (!guestTokenData || !cachedBasketData) {
        return null;
      }
      
      const tokenData = JSON.parse(guestTokenData);
      const basketData = JSON.parse(cachedBasketData);
      
      // Check if basket is associated with current guest token and within 30min cache
      const now = Date.now();
      const tokenAge = now - tokenData.generated_at;
      const thirtyMinutes = 30 * 60 * 1000;
      
      if (basketData.customer_id === tokenData.customer_id && 
          basketData.generated_at === tokenData.generated_at &&
          tokenAge < thirtyMinutes) {
        return basketData.basketId;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Cache basket ID with current guest token for 30-minute validity
   * @param {string} basketId - Basket ID to cache
   */
  static cacheBasketId(basketId) {
    try {
      const guestTokenData = localStorage.getItem('guest_token');
      if (!guestTokenData) {
        return;
      }
      
      const tokenData = JSON.parse(guestTokenData);
      const basketCache = {
        basketId: basketId,
        customer_id: tokenData.customer_id,
        generated_at: tokenData.generated_at,
        cached_at: Date.now()
      };
      
      localStorage.setItem('guest_basket_cache', JSON.stringify(basketCache));
    } catch (error) {
    }
  }

  /**
   * Add product to guest basket
   * @param {string} productId - Product ID to add
   * @param {number} quantity - Quantity to add
   * @param {string} basketId - Optional basket ID to use (if not provided, will get/create one)
   * @returns {Promise<Object>} Updated basket object
   */
  static async addToBasket(productId, quantity = 1, basketId = null) {
    try {
      // Use provided basketId or get/create one
      const targetBasketId = basketId || await this.getBasketId();
      // Persist for merge flow
      try { localStorage.setItem(GUEST_CART_KEY, targetBasketId); } catch {}
      const key = `${targetBasketId}:${productId}`;
      if (this.inFlight.addToBasket[key]) return await this.inFlight.addToBasket[key];
      
      const endpoint = `/checkout/shopper-baskets/v2/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/baskets/${targetBasketId}/items`;
      const url = sfccApiClient.buildUrl(endpoint, import.meta.env.VITE_SFCC_SITE_ID);
      
      // Add parameters as per Category.txt documentation
      const params = new URLSearchParams({
        // siteId is already added by sfccApiClient.buildUrl()
        locale: import.meta.env.VITE_SFCC_LOCALE || "en-IN", // Default locale if not found
      });
      const fullUrl = `${url}&${params.toString()}`;
      
      // Use the exact format from Category.txt documentation
      const items = [
        {
          productId: productId,
          quantity: quantity
        }
      ];
      
      
      try {
        this.inFlight.addToBasket[key] = sfccApiClient.post(fullUrl, items);
        const response = await this.inFlight.addToBasket[key];
        delete this.inFlight.addToBasket[key];
        
        
        // IMPORTANT: After adding item, get the complete basket data with product details
        if(response.temporaryBasket  === false){
         const completeBasket = await this.getBasket(targetBasketId);
         return completeBasket;
        }
        else {
          const endpoint = `/checkout/shopper-baskets/v2/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/baskets/${targetBasketId}`;
          const url = sfccApiClient.buildUrl(endpoint, import.meta.env.VITE_SFCC_SITE_ID);
          
          // const params = new URLSearchParams({
          //   locale: getCurrentLocale() || 'en-IN', 
          // });
          // const fullUrl = `${url}&${params.toString()}`;

          const completeBasket = await sfccApiClient.get(url);
          return completeBasket;
        }
      } catch (apiError) {
        delete this.inFlight.addToBasket[key];
        
        throw apiError;
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get guest basket details using customer baskets API (returns complete data)
   * @returns {Promise<Object>} Basket object with complete product details
   */
  static async getBasket(basketId = null, customerIdOverride = null) {
    try {
      // Always use the customer baskets API first (per cart.txt) for complete product data
      // Allow passing a specific customerId (e.g., guest id during merge) to avoid mismatches after login
      const customerId = customerIdOverride || await this.getCurrentCustomerId();
      if (!customerId) {
        throw new Error('No customer ID found. Please create a basket first.');
      }

      const endpoint = `/customer/shopper-customers/v1/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/customers/${customerId}/baskets`;
      const url = sfccApiClient.buildUrl(endpoint, import.meta.env.VITE_SFCC_SITE_ID);
      const response = await sfccApiClient.get(url);

      let targetBasket = null;
      if (basketId) {
        targetBasket = response?.baskets?.find(b => b.basketId === basketId) || null;
      } else {
        const guestBaskets = (response?.baskets || []).filter(b => b.temporaryBasket === true);
        const sorted = (guestBaskets.length ? guestBaskets : (response?.baskets || []))
          .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
        targetBasket = sorted[0] || null;
      }

      if (!targetBasket) {
        throw new Error('No basket found for customer');
      }

      return targetBasket;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update item quantity in guest basket
   * @param {string} itemId - Item ID to update
   * @param {number} quantity - New quantity
   * @returns {Promise<Object>} Updated basket object
   */
  static async updateItemQuantity(itemId, quantity) {
    try {
      const basketId = await this.getBasketId();
      
      // Correct endpoint as per API documentation - items without specific itemId in path
      const endpoint = `/checkout/shopper-baskets/v2/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/baskets/${basketId}/items`;
      const url = sfccApiClient.buildUrl(endpoint, import.meta.env.VITE_SFCC_SITE_ID);
      
      // Add parameters as per Category.txt documentation
      const params = new URLSearchParams({
        // siteId is already added by sfccApiClient.buildUrl()
        locale: import.meta.env.VITE_SFCC_LOCALE || "en-IN", // Default locale if not found
      });
      const fullUrl = `${url}&${params.toString()}`;
      
      // Request body format as per Category.txt documentation
      const requestBody = [
        {
          itemId: itemId,
          quantity: quantity
        }
      ];
      
      const response = await sfccApiClient.patch(fullUrl, requestBody);
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove item from guest basket
   * @param {string} itemId - Item ID to remove
   * @returns {Promise<Object>} Updated basket object
   */
  static async removeItem(itemId) {
    try {
      const basketId = await this.getBasketId();
      
      const endpoint = `/checkout/shopper-baskets/v2/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/baskets/${basketId}/items/${itemId}`;
      const url = sfccApiClient.buildUrl(endpoint, import.meta.env.VITE_SFCC_SITE_ID);
      
      // Add parameters as per Category.txt documentation
      const params = new URLSearchParams({
        // siteId is already added by sfccApiClient.buildUrl()
        locale: import.meta.env.VITE_SFCC_LOCALE || "en-IN", // Default locale if not found
      });
      const fullUrl = `${url}&${params.toString()}`;
      
      const response = await sfccApiClient.delete(fullUrl);
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Clear guest basket
   * @returns {Promise<void>}
   */
  static async clearBasket() {
    try {
      const basketId = localStorage.getItem(GUEST_CART_KEY);
      
      if (basketId) {
        const endpoint = `/checkout/shopper-baskets/v2/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/baskets/${basketId}`;
        const url = sfccApiClient.buildUrl(endpoint, import.meta.env.VITE_SFCC_SITE_ID);
        
        await sfccApiClient.delete(url);
        localStorage.removeItem(GUEST_CART_KEY);
        localStorage.removeItem(GUEST_CUSTOMER_KEY);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get basket ID from localStorage
   * @returns {string|null} Basket ID or null
   */
  static getStoredBasketId() {
    return localStorage.getItem(GUEST_CART_KEY);
  }

  /**
   * Get customer cart data using customer ID
   * @returns {Promise<Object>} Customer baskets data with new response format
   */
  static async getCustomerBaskets() {
    try {
      const customerId = localStorage.getItem(GUEST_CUSTOMER_KEY);
      
      if (!customerId) {
        throw new Error('No customer ID found. Please create a basket first.');
      }
      
      const endpoint = `/customer/shopper-customers/v1/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/customers/${customerId}/baskets`;
      const url = sfccApiClient.buildUrl(endpoint, import.meta.env.VITE_SFCC_SITE_ID);
      
      
      const response = await sfccApiClient.get(url);
      
      
      // Return the response as-is since it now has the correct structure
      // { baskets: [...], total: number }
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get stored customer ID
   * @returns {string|null} Customer ID or null
   */
  static getStoredCustomerId() {
    return localStorage.getItem(GUEST_CUSTOMER_KEY);
  }

  /**
   * Check if user has a guest basket
   * @returns {boolean} True if guest basket exists
   */
  static hasGuestBasket() {
    return !!localStorage.getItem(GUEST_CART_KEY);
  }

  /**
   * Check if user has customer data
   * @returns {boolean} True if customer ID exists
   */
  static hasCustomerData() {
    return !!localStorage.getItem(GUEST_CUSTOMER_KEY);
  }

  /**
   * Delete a specific basket
   * @param {string} basketId - Basket ID to delete
   * @returns {Promise<void>}
   */
  static async deleteBasket(basketId) {
    try {
      const endpoint = `/checkout/shopper-baskets/v2/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/baskets/${basketId}`;
      const url = sfccApiClient.buildUrl(endpoint, import.meta.env.VITE_SFCC_SITE_ID);
      
      // Add locale parameter as per API specification
      const params = new URLSearchParams({
        locale: import.meta.env.VITE_SFCC_LOCALE || "en-IN", // Default locale if not found
      });
      
      const fullUrl = `${url}&${params.toString()}`;
    
      await sfccApiClient.delete(fullUrl);
      
    } catch (error) {
      throw error;
    }
  }
}

export default GuestCartService;
