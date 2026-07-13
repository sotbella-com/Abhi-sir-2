import sfccApiClient from '../sfccApiClient';

/**
 * Get customer baskets using customer_id
 * @param {string} customerId - Customer ID (from either guest or user token)
 * @returns {Promise<Object>} Customer baskets response
 */
export const getCustomerBaskets = async (customerId) => {
  try {
    // Use the correct endpoint structure as per reference
    const endpoint = `/customer/shopper-customers/v1/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/customers/${customerId}/baskets`;
    const url = sfccApiClient.buildUrl(endpoint, import.meta.env.VITE_SFCC_SITE_ID);
    
    // No additional parameters needed as per Category.txt documentation
    // Note: siteId is already added by sfccApiClient.buildUrl()
    const fullUrl = url;
    
    
    const response = await sfccApiClient.get(fullUrl);    
    
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Get the most recent active basket for a customer
 * @param {string} customerId - Customer ID
 * @returns {Promise<Object|null>} Most recent active basket or null
 */
export const getMostRecentBasket = async (customerId) => {
  try {
    const basketsResponse = await getCustomerBaskets(customerId);
    
    if (!basketsResponse.baskets || basketsResponse.baskets.length === 0) {
      ('No baskets found for customer:', customerId);
      return null;
    }
    
    // Sort by lastModified date and get the most recent
    const sortedBaskets = basketsResponse.baskets.sort((a, b) => 
      new Date(b.lastModified) - new Date(a.lastModified)
    );
    
    const mostRecentBasket = sortedBaskets[0];
    
    ('📦 Most recent basket found:', {
      basketId: mostRecentBasket.basketId,
      customerId: mostRecentBasket.customerInfo?.customerId,
      lastModified: mostRecentBasket.lastModified,
      productItems: mostRecentBasket.productItems?.length || 0,
      productTotal: mostRecentBasket.productTotal,
      currency: mostRecentBasket.currency,
      temporaryBasket: mostRecentBasket.temporaryBasket
    });
    
    return mostRecentBasket;
  } catch (error) {
    throw error;
  }
};

/**
 * Get baskets filtered by type (guest vs customer)
 * @param {string} customerId - Customer ID
 * @param {boolean} isGuest - Whether to get guest baskets (temporaryBasket: true) or customer baskets (temporaryBasket: false)
 * @returns {Promise<Array>} Filtered baskets array
 */
export const getBasketsByType = async (customerId, isGuest = false) => {
  try {
    const basketsResponse = await getCustomerBaskets(customerId);
    
    if (!basketsResponse.baskets || basketsResponse.baskets.length === 0) {
      return [];
    }
    
    // Filter baskets by type
    const filteredBaskets = basketsResponse.baskets.filter(basket => {
      const isGuestBasket = basket.temporaryBasket === true;
      return isGuestBasket === isGuest;
    });
    return filteredBaskets;
  } catch (error) {
    throw error;
  }
};

export default {
  getCustomerBaskets,
  getMostRecentBasket,
  getBasketsByType
};
