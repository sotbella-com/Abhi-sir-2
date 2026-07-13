/**
 * Payment Verification Utility
 * Verifies payment status with backend before showing success
 * CHK-002: Don't rely solely on Stripe redirect status
 */

import { logger } from './logger.js';

/**
 * Verify payment status with backend
 * @param {string} orderId - Order ID
 * @param {string} paymentIntentId - Stripe payment intent ID
 * @returns {Promise<Object>} Verification result
 */
export async function verifyPaymentWithBackend(orderId, paymentIntentId) {
  try {
    // Import order details API
    const { get_order_details } = await import('../api/services/sfccOrders.js');
    
    // Fetch order details from backend
    const orderResponse = await get_order_details({ queryKey: [null, { orderId }] });
    const order = orderResponse?.data?.order;

    if (!order) {
      return {
        verified: false,
        error: 'Order not found',
        orderId,
        paymentIntentId
      };
    }

    // Check payment status from backend
    const paymentStatus = order.paymentStatus?.toUpperCase();
    const isPaid = paymentStatus === 'PAID' || paymentStatus === 'COMPLETED';

    // Verify payment intent ID matches (if available)
    const orderPaymentIntentId = order._raw?.paymentGatewayResponse?.paymentIntentId;
    if (orderPaymentIntentId && paymentIntentId && orderPaymentIntentId !== paymentIntentId) {
      logger.warn('⚠️ Payment intent ID mismatch:', {
        expected: paymentIntentId ? `${paymentIntentId.substring(0, 8)}...` : null,
        actual: orderPaymentIntentId ? `${orderPaymentIntentId.substring(0, 8)}...` : null
      });
    }

    return {
      verified: isPaid,
      paymentStatus,
      orderId,
      paymentIntentId: orderPaymentIntentId || paymentIntentId,
      order
    };
  } catch (error) {
    logger.error('❌ Payment verification error:', error);
    return {
      verified: false,
      error: error.message,
      orderId,
      paymentIntentId
    };
  }
}

/**
 * Verify payment with both Stripe and backend
 * @param {Object} stripeIntent - Stripe payment intent
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} Combined verification result
 */
export async function verifyPaymentComprehensive(stripeIntent, orderId) {
  const results = {
    stripe: null,
    backend: null,
    verified: false
  };

  // Verify with Stripe
  if (stripeIntent) {
    results.stripe = {
      status: stripeIntent.status,
      succeeded: stripeIntent.status === 'succeeded',
      id: stripeIntent.id
    };
  }

  // Verify with backend
  if (orderId) {
    results.backend = await verifyPaymentWithBackend(orderId, stripeIntent?.id);
  }

  // Payment is verified if both Stripe and backend confirm success
  results.verified = 
    results.stripe?.succeeded === true &&
    results.backend?.verified === true;

  return results;
}

