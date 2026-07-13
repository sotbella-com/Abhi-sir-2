/**
 * Payment State Manager
 * Manages payment state persistence across redirects and browser sessions
 * Handles 3D Secure redirects and recovery scenarios
 */

const PAYMENT_STATE_KEY = 'payment_state';
const PAYMENT_CANCELLED_KEY = 'payment_cancelled'; // Flag to track if payment was cancelled
const PAYMENT_STATE_EXPIRY = 30 * 60 * 1000; // 30 minutes

/**
 * Save payment state for recovery after redirect
 * @param {Object} state - Payment state object
 */
export function savePaymentState(state) {
  try {
    const stateWithTimestamp = {
      ...state,
      timestamp: Date.now(),
      expiry: Date.now() + PAYMENT_STATE_EXPIRY
    };
    localStorage.setItem(PAYMENT_STATE_KEY, JSON.stringify(stateWithTimestamp));
   
  } catch (error) {
    // console.warn('⚠️ Failed to save payment state:', error);
  }
}

/**
 * Get payment state (if not expired)
 * @returns {Object|null} Payment state or null if expired/not found
 */
export function getPaymentState() {
  try {
    const stateRaw = localStorage.getItem(PAYMENT_STATE_KEY);
    if (!stateRaw) return null;

    const state = JSON.parse(stateRaw);
    const now = Date.now();

    // Check if expired
    if (state.expiry && now > state.expiry) {
      // console.warn('⚠️ Payment state expired, clearing...');
      clearPaymentState();
      return null;
    }

    return state;
  } catch (error) {
    // console.warn('⚠️ Failed to get payment state:', error);
    return null;
  }
}

/**
 * Clear payment state
 */
export function clearPaymentState() {
  try {
    localStorage.removeItem(PAYMENT_STATE_KEY);
    localStorage.removeItem(PAYMENT_CANCELLED_KEY);
  } catch (error) {
    // console.warn('⚠️ Failed to clear payment state:', error);
  }
}

/**
 * Mark payment as cancelled
 */
export function markPaymentCancelled() {
  try {
    localStorage.setItem(PAYMENT_CANCELLED_KEY, 'true');
  } catch (error) {
    // console.warn('⚠️ Failed to mark payment as cancelled:', error);
  }
}

/**
 * Check if payment was cancelled
 */
export function isPaymentCancelled() {
  try {
    return localStorage.getItem(PAYMENT_CANCELLED_KEY) === 'true';
  } catch (error) {
    // console.warn('⚠️ Failed to check payment cancellation:', error);
    return false;
  }
}

/**
 * Check if payment state exists and is valid
 * @returns {boolean} True if valid payment state exists
 */
export function hasValidPaymentState() {
  const state = getPaymentState();
  return state !== null && state.orderId && state.paymentIntentId;
}

/**
 * Update payment state with new data
 * @param {Object} updates - Partial state updates
 */
export function updatePaymentState(updates) {
  const currentState = getPaymentState();
  if (currentState) {
    savePaymentState({ ...currentState, ...updates });
  }
}

