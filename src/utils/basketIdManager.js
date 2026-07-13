/**
 * Basket ID Manager
 * Single source of truth for basket IDs
 * Ensures consistency across all storage locations
 */

const GUEST_BASKET_KEY = 'guest_basket_id';
const CUSTOMER_BASKET_KEY = 'customer_basket_id';

/**
 * Get the authoritative basket ID
 * Priority: Zustand store > localStorage > null
 * @param {Object} storeState - Zustand store state
 * @param {string} basketType - 'guest' or 'customer'
 * @returns {string|null} Basket ID
 */
export function getAuthoritativeBasketId(storeState, basketType = 'guest') {
  // Priority 1: Zustand store (most up-to-date)
  if (storeState?.basketId) {
    return storeState.basketId;
  }

  // Priority 2: Zustand store basket object
  if (storeState?.basket?.basketId) {
    return storeState.basket.basketId;
  }

  // Priority 3: localStorage (fallback)
  const storageKey = basketType === 'guest' ? GUEST_BASKET_KEY : CUSTOMER_BASKET_KEY;
  const storedId = localStorage.getItem(storageKey);
  if (storedId) {
    return storedId;
  }

  return null;
}

/**
 * Set basket ID consistently across all storage locations
 * @param {string} basketId - Basket ID to set
 * @param {string} basketType - 'guest' or 'customer'
 * @param {Object} storeState - Zustand store state (optional, for validation)
 */
export function setBasketIdConsistently(basketId, basketType = 'guest', storeState = null) {
  if (!basketId) {
    // console.warn('⚠️ Attempted to set empty basket ID');
    return;
  }

  // Validate consistency if store state provided
  if (storeState) {
    const existingId = getAuthoritativeBasketId(storeState, basketType);
    if (existingId && existingId !== basketId) {
      // console.warn('⚠️ Basket ID mismatch detected:', {
      //   existing: existingId,
      //   new: basketId,
      //   basketType
      // });
      // Use the new ID (from API, more authoritative)
    }
  }

  // Set in localStorage
  const storageKey = basketType === 'guest' ? GUEST_BASKET_KEY : CUSTOMER_BASKET_KEY;
  try {
    localStorage.setItem(storageKey, basketId);
  } catch (error) {
    // console.warn('⚠️ Failed to set basket ID in localStorage:', error);
  }

  // Note: Zustand store should be updated via setBasket() which updates basketId automatically
}

/**
 * Clear basket ID from all storage locations
 * @param {string} basketType - 'guest' or 'customer'
 */
export function clearBasketId(basketType = 'guest') {
  const storageKey = basketType === 'guest' ? GUEST_BASKET_KEY : CUSTOMER_BASKET_KEY;
  try {
    localStorage.removeItem(storageKey);
  } catch (error) {
    // console.warn('⚠️ Failed to clear basket ID from localStorage:', error);
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
 * Get basket ID from basket object with validation
 * @param {Object} basket - Basket object
 * @param {string} expectedBasketId - Expected basket ID (optional, for validation)
 * @returns {string|null} Basket ID
 */
export function getBasketIdFromBasket(basket, expectedBasketId = null) {
  if (!basket) {
    return null;
  }

  const basketId = basket.basketId || basket.id || null;

  // Validate if expected ID provided
  if (expectedBasketId && basketId && basketId !== expectedBasketId) {
    // console.warn('⚠️ Basket ID mismatch:', {
    //   expected: expectedBasketId,
    //   actual: basketId
    // });
    // Return the actual ID from basket (more authoritative)
  }

  return basketId;
}

/**
 * Clean up all basket ID storage
 */
export function cleanupAllBasketIds() {
  try {
    localStorage.removeItem(GUEST_BASKET_KEY);
    localStorage.removeItem(CUSTOMER_BASKET_KEY);
  } catch (error) {
    // console.warn('⚠️ Error cleaning up basket IDs:', error);
  }
}

