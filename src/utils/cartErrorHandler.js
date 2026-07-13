/**
 * Cart Error Handler - Utility for handling cart-related errors
 * Provides functions to detect and handle common cart errors
 */

import storageManager from './storageManager';

class CartErrorHandler {
  /**
   * Check if error is related to invalid customer
   * @param {Error} error - The error object
   * @returns {boolean} True if it's an invalid customer error
   */
  static isInvalidCustomerError(error) {
    if (!error || !error.message) return false;
    
    const message = error.message.toLowerCase();
    return message.includes('invalid customer') || 
           message.includes('invalid-customer') ||
           message.includes('customer is invalid');
  }

  /**
   * Check if error is related to invalid basket
   * @param {Error} error - The error object
   * @returns {boolean} True if it's an invalid basket error
   */
  static isInvalidBasketError(error) {
    if (!error || !error.message) return false;
    
    const message = error.message.toLowerCase();
    return message.includes('invalid basket') || 
           message.includes('basket not found') ||
           message.includes('basket does not exist');
  }

  /**
   * Check if error is related to authentication
   * @param {Error} error - The error object
   * @returns {boolean} True if it's an auth error
   */
  static isAuthError(error) {
    if (!error || !error.message) return false;
    
    const message = error.message.toLowerCase();
    return message.includes('unauthorized') || 
           message.includes('forbidden') ||
           message.includes('token expired') ||
           message.includes('invalid token');
  }

  /**
   * Get recommended action for error
   * @param {Error} error - The error object
   * @returns {string} Recommended action
   */
  static getRecommendedAction(error) {
    if (this.isInvalidCustomerError(error)) {
      return 'clear_customer_data_and_retry';
    }
    
    if (this.isInvalidBasketError(error)) {
      return 'clear_basket_data_and_retry';
    }
    
    if (this.isAuthError(error)) {
      return 'refresh_tokens_and_retry';
    }
    
    return 'retry_with_fresh_session';
  }

  /**
   * Handle cart error with appropriate action
   * @param {Error} error - The error object
   * @param {Function} retryCallback - Function to call for retry
   * @returns {Promise} Result of retry or error
   */
  static async handleCartError(error, retryCallback) {
    const action = this.getRecommendedAction(error);
    
    try {
      switch (action) {
        case 'clear_customer_data_and_retry':
          storageManager.clearUserData();
          break;
          
        case 'clear_basket_data_and_retry':
          storageManager.clearCartData();
          break;
          
        case 'refresh_tokens_and_retry':
          // This would be handled by the token manager
          break;
          
        case 'retry_with_fresh_session':
          storageManager.clearAllData();
          break;
      }
      
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Retry the operation
      if (retryCallback) {
        return await retryCallback();
      }
      
    } catch (retryError) {
      throw retryError;
    }
  }

  /**
   * Get error type for logging
   * @param {Error} error - The error object
   * @returns {string} Error type
   */
  static getErrorType(error) {
    if (this.isInvalidCustomerError(error)) return 'INVALID_CUSTOMER';
    if (this.isInvalidBasketError(error)) return 'INVALID_BASKET';
    if (this.isAuthError(error)) return 'AUTH_ERROR';
    return 'UNKNOWN_ERROR';
  }

  /**
   * Log error details for debugging
   * @param {Error} error - The error object
   * @param {string} context - Context where error occurred
   */
  static logErrorDetails(error, context = 'unknown') {
  }
}

export default CartErrorHandler;
