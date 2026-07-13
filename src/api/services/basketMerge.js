// import { getCurrentLocale } from '@/utils/sfccSiteConfig';
import sfccApiClient from '../sfccApiClient';

/**
 * Basket Merge Service - Handles merging guest and customer baskets
 */
export class BasketMergeService {
  /**
   * Merge guest basket with customer basket
   * @param {string} guestBasketId - Guest basket ID (for logging/reference only)
   * @param {string} customerBasketId - Customer basket ID (for logging/reference only)
   * @returns {Promise<Object>} Merged basket object
   * 
   * IMPORTANT: According to merge.txt documentation, the merge API:
   * - Does NOT require a request body (empty POST)
   * - Automatically merges the "previous shopper's basket" (guest) into the "current shopper's active basket" (user)
   * - The current shopper is determined by the access token used in the request
   * - Parameters: createDestinationBasket=true, productItemMergeMode=sum_quantities, locale=en-IN
   */
  static async mergeBaskets(guestBasketId, customerBasketId) {
    try {
      const endpoint = `/checkout/shopper-baskets/v2/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/baskets/actions/merge`;
      const url = sfccApiClient.buildUrl(endpoint, import.meta.env.VITE_SFCC_SITE_ID);
      
      // Add req
      // Add required parameters as per merge.txt documentation (line 529-565)
      // Note: siteId is already added by sfccApiClient.buildUrl()
      const params = new URLSearchParams({
        createDestinationBasket: 'true',  // Creates basket if user has no active basket
        productItemMergeMode: 'sum_quantities',  // Sums quantities from both baskets
        locale: import.meta.env.VITE_SFCC_LOCALE || "en-IN"
      });
      
      const fullUrl = `${url}&${params.toString()}`;
      
      // CRITICAL: The merge API does NOT require a request body (empty POST)
      // It automatically identifies the previous shopper's basket (guest) and merges it
      // into the current shopper's active basket (determined by the user token)
      
      
      // Empty POST - no request body as per merge.txt documentation
      const response = await sfccApiClient.post(fullUrl, null);
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get or create customer basket
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Customer basket object
   */
  static async getOrCreateCustomerBasket(customerId) {
    try {
      
      // First, try to get existing customer baskets using the correct customer-specific endpoint
      const basketsEndpoint = `/customer/shopper-customers/v1/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/customers/${customerId}/baskets`;
      const basketsUrl = sfccApiClient.buildUrl(basketsEndpoint, import.meta.env.VITE_SFCC_SITE_ID);
      
      // Note: locale parameter is not supported by this endpoint
      const fullBasketsUrl = basketsUrl;
      
      try {
        const existingBaskets = await sfccApiClient.get(fullBasketsUrl);
        
        
        // If customer has existing baskets, return the most recent non-temporary one
        if (existingBaskets.baskets && existingBaskets.baskets.length > 0) {
          // Find the most recent non-temporary basket
          const nonTemporaryBaskets = existingBaskets.baskets.filter(b => !b.temporaryBasket);
          const customerBasket = nonTemporaryBaskets.length > 0 
            ? nonTemporaryBaskets[0] // Use the first non-temporary basket
            : null; // Don't fallback to temporary basket
          
          if (customerBasket) {
            return customerBasket;
          }
        }
      } catch (error) {
        // If no baskets exist, we'll create one below
      }
      
      // No baskets found: create a new basket for this customer
      const createEndpoint = `/checkout/shopper-baskets/v2/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/baskets`;
      const createUrl = sfccApiClient.buildUrl(createEndpoint, import.meta.env.VITE_SFCC_SITE_ID);
      const created = await sfccApiClient.post(createUrl, {});
      return created;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get customer basket by customer ID
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object|null>} Customer basket or null if not found
   */
  static async getCustomerBasket(customerId) {
    try {
      const endpoint = `/checkout/shopper-baskets/v2/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/baskets`;
      const url = sfccApiClient.buildUrl(endpoint, import.meta.env.VITE_SFCC_SITE_ID);
      
      // Add locale parameter as per API specification
      const getParams = new URLSearchParams({
        locale: import.meta.env.VITE_SFCC_LOCALE || "en-IN", // Default locale if not found
      });
      
      const fullUrl = `${url}&${getParams.toString()}`;
      
      const response = await sfccApiClient.get(fullUrl);
      
      if (response.baskets && response.baskets.length > 0) {
        // Find basket for this customer
        const customerBasket = response.baskets.find(basket => 
          basket.customerInfo?.customerId === customerId
        );
        return customerBasket || null;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete a basket
   * @param {string} basketId - Basket ID to delete
   * @returns {Promise<boolean>} Success status
   */
  static async deleteBasket(basketId) {
    try {
      const endpoint = `/checkout/shopper-baskets/v2/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/baskets/${basketId}`;
      const url = sfccApiClient.buildUrl(endpoint, import.meta.env.VITE_SFCC_SITE_ID);
      
      await sfccApiClient.delete(url);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default BasketMergeService;
