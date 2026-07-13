import { SFCC_CONFIG } from "@/api/services";
// import { getCurrentLocale, getCurrentSiteId } from "@/utils/sfccSiteConfig";
import { getAuthToken } from "@/utils/tokenUtils";
import { logger } from "@/utils/logger.js";

/**
 * Fetch available payment methods for a basket.
 * GET /checkout/shopper-baskets/v2/organizations/{org}/baskets/{basketId}/payment-methods?siteId={siteId}&locale={locale}
 *
 * Returns { methods: [{ id, name, description, paymentProcessorId }] }
 */
export const get_available_payment_methods = async ({ queryKey }) => {
  // allow second arg to be optional
  const [_, params = {}] = queryKey || [];
  const { basketId, locale: localeOverride } = params;

  if (!basketId) throw new Error("basketId is required");

  // 🔹 Dynamic siteId (domain/geo → env → fallback)
  const siteId = import.meta.env.VITE_SFCC_SITE_ID || "sotbella_in";

  // 🔹 Dynamic locale (override from caller → geolocation config → env → fallback)
  const locale = import.meta.env.VITE_SFCC_LOCALE || "en-IN";

  const url =
    `${SFCC_CONFIG.baseUrl}/checkout/shopper-baskets/v2/organizations/${SFCC_CONFIG.organizationId}` +
    `/baskets/${basketId}/payment-methods?siteId=${encodeURIComponent(siteId)}` +
    `&locale=${encodeURIComponent(locale)}`;

  const accessToken = await getAuthToken();
  if (!accessToken) throw new Error("Missing access token");

  const resp = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    if (resp.status === 404 && /basket-not-found|Basket Not Found/i.test(text)) {
      const err = new Error("BASKET_NOT_FOUND");
      err.code = "BASKET_NOT_FOUND";
      throw err;
    }
    throw new Error(`Payment methods fetch failed: ${resp.status} ${text}`);
  }

  const data = await resp.json();
  const list = Array.isArray(data?.applicablePaymentMethods)
    ? data.applicablePaymentMethods
    : [];

  // ✅ Hide mobile-only methods
  const filtered = list.filter((m) => m?.c_mobileOnly !== true);

  // Normalize
  const methods = filtered.map((m) => ({
    id: m.id,
    name: m.name || m.id,
    description: m.description || "",
    paymentProcessorId: m.paymentProcessorId || "",
    c_mobileOnly: !!m.c_mobileOnly,
    default: !!m.c_default
  }));

  return { methods };
};

// update_shipping_address API call
export const update_shipping_address = async ({
  basketId,
  shipmentId = "me",
  shippingAddress,
  locale: localeOverride,
}) => {
  if (!basketId) throw new Error("basketId is required");
  if (!shippingAddress) throw new Error("shippingAddress is required");

  // 🔹 Dynamic siteId
  const siteId = import.meta.env.VITE_SFCC_SITE_ID || "sotbella_in";

  // 🔹 Dynamic locale (caller override → geo → config → fallback)
  const locale = import.meta.env.VITE_SFCC_LOCALE || "en-IN";

  const url =
    `${SFCC_CONFIG.baseUrl}/checkout/shopper-baskets/v1/organizations/${SFCC_CONFIG.organizationId}` +
    `/baskets/${encodeURIComponent(basketId)}` +
    `/shipments/${encodeURIComponent(shipmentId)}` +
    `/shipping-address?siteId=${encodeURIComponent(siteId)}` +
    `&locale=${encodeURIComponent(locale)}` +
    `&useAsBilling=true`;

  const accessToken = await getAuthToken();
  if (!accessToken) throw new Error("Missing access token");

  logger.log("Updating shipping address with data:", shippingAddress);

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(shippingAddress),
  });

  const data = await response.json();
  logger.log("Response from updating shipping address:", data);

  if (!response.ok) {
    throw new Error(
      `Failed to update shipping address: ${data.message || "Unknown error"}`
    );
  }

  return data;
};


/**
 * Get available shipping methods for a shipment
 * GET /checkout/shopper-baskets/v2/organizations/{org}/baskets/{basketId}/shipments/{shipmentId}/shipping-methods
 *
 * query: ?siteId={siteId}&locale={locale}
 */
export const get_available_shipping_methods = async ({ queryKey }) => {
  const [_, params = {}] = queryKey || [];
  const { basketId, shipmentId, locale: localeOverride } = params;

  if (!basketId) throw new Error("basketId is required");
  if (!shipmentId) throw new Error("shipmentId is required");

  // 🔹 dynamic siteId
  const siteId = import.meta.env.VITE_SFCC_SITE_ID || "sotbella_in";

  // 🔹 dynamic locale
  const locale = import.meta.env.VITE_SFCC_LOCALE || "en-IN";

  const url =
    `${SFCC_CONFIG.baseUrl}/checkout/shopper-baskets/v2/organizations/${SFCC_CONFIG.organizationId}` +
    `/baskets/${encodeURIComponent(basketId)}` +
    `/shipments/${encodeURIComponent(shipmentId)}` +
    `/shipping-methods?siteId=${encodeURIComponent(siteId)}&locale=${encodeURIComponent(locale)}`;

  const accessToken = await getAuthToken();
  if (!accessToken) throw new Error("Missing access token");

  const resp = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    if (resp.status === 404) {
      const err = new Error("SHIPPING_METHODS_NOT_FOUND");
      err.code = "SHIPPING_METHODS_NOT_FOUND";
      err.details = text;
      throw err;
    }
    throw new Error(
      `Shipping methods fetch failed: ${resp.status} ${text}`
    );
  }

  const data = await resp.json();

  const list = Array.isArray(data?.applicableShippingMethods)
    ? data.applicableShippingMethods
    : [];

  const methods = list.map((m) => ({
    id: m.id,
    name: m.name || m.id,
    description: m.description || "",
    price: typeof m.price === "number" ? m.price : Number(m.price || 0),
    c_storePickupEnabled: Boolean(m.c_storePickupEnabled),
  }));

  const defaultMethodId = data?.defaultShippingMethodId || methods[0]?.id || null;

  return { methods, defaultMethodId };
};

/**
 * Update shipping method on a shipment
 * PUT /checkout/shopper-baskets/v1/organizations/{org}/baskets/{basketId}/shipments/{shipmentId}/shipping-method
 *
 * body: { id: "express" }
 */

export const update_shipping_method = async ({
  basketId,
  shipmentId,
  methodId,
  locale: localeOverride,
}) => {
  if (!basketId) throw new Error("basketId is required");
  if (!shipmentId) throw new Error("shipmentId is required");
  if (!methodId) throw new Error("methodId (shipping method id) is required");

  const siteId = import.meta.env.VITE_SFCC_SITE_ID || "sotbella_in";

  const locale = import.meta.env.VITE_SFCC_LOCALE || "en-IN";

  const url =
    `${SFCC_CONFIG.baseUrl}/checkout/shopper-baskets/v1/organizations/${SFCC_CONFIG.organizationId}` +
    `/baskets/${encodeURIComponent(basketId)}` +
    `/shipments/${encodeURIComponent(shipmentId)}` +
    `/shipping-method?siteId=${encodeURIComponent(siteId)}&locale=${encodeURIComponent(locale)}`;

  const accessToken = await getAuthToken();
  if (!accessToken) throw new Error("Missing access token");

  logger.log("Updating shipping method with data:", { id: methodId });

  const resp = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: methodId }), // 🔹 This was `{ id }` before
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Update shipping method failed: ${resp.status} ${text}`);
  }

  const data = await resp.json();
  return data;
};


/**
 * Add a payment instrument to the basket (e.g. COD / STRIPE / QWIKCILVER)
 * POST /checkout/shopper-baskets/v2/organizations/{org}/baskets/{basketId}/payment-instruments
 */
export const add_payment_instrument = async ({
  basketId,
  paymentMethodId,
  amount,
  locale: localeOverride,
}) => {
  if (!basketId) throw new Error("basketId is required");
  if (!paymentMethodId) throw new Error("paymentMethodId is required");

  const siteId = import.meta.env.VITE_SFCC_SITE_ID || "sotbella_in";

  const locale = import.meta.env.VITE_SFCC_LOCALE || "en-IN";

  const url =
    `${SFCC_CONFIG.baseUrl}/checkout/shopper-baskets/v2/organizations/${SFCC_CONFIG.organizationId}` +
    `/baskets/${encodeURIComponent(basketId)}` +
    `/payment-instruments?siteId=${encodeURIComponent(siteId)}&locale=${encodeURIComponent(locale)}`;

  const accessToken = await getAuthToken();
  if (!accessToken) throw new Error("Missing access token");

  const body = { paymentMethodId };
  if (typeof amount === "number" && Number.isFinite(amount)) {
    body.amount = amount;
  }

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    let errorMessage = `Add payment instrument failed: ${resp.status}`;
    let errorDetails = null;

    try {
      const errorData = await resp.json();

      // Parse SFCC error response structure
      if (errorData.type && errorData.title) {
        errorMessage = `${errorData.title}: ${errorData.detail || errorData.statusMessage || errorMessage}`;
        errorDetails = {
          type: errorData.type,
          statusCode: errorData.statusCode,
          statusMessage: errorData.statusMessage,
          detail: errorData.detail
        };
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.fault) {
        errorMessage = errorData.fault.message || errorMessage;
      }

      // Create error with details
      const error = new Error(errorMessage);
      error.status = resp.status;
      error.statusCode = errorData.statusCode;
      error.details = errorDetails || errorData;
      throw error;
    } catch (parseError) {
      // If JSON parsing fails, try to get text
      const text = await resp.text().catch(() => "");
      const error = new Error(`Add payment instrument failed: ${resp.status} ${text}`);
      error.status = resp.status;
      throw error;
    }
  }

  return resp.json();
};

export const remove_payment_instrument = async ({
  basketId,
  paymentInstrumentId,
  locale: localeOverride,
}) => {
  if (!basketId) throw new Error("basketId is required");
  if (!paymentInstrumentId) throw new Error("paymentInstrumentId is required");

  const siteId = import.meta.env.VITE_SFCC_SITE_ID || "sotbella_in";

  const url =
    `${SFCC_CONFIG.baseUrl}/checkout/shopper-baskets/v2/organizations/${SFCC_CONFIG.organizationId}` +
    `/baskets/${encodeURIComponent(basketId)}` +
    `/payment-instruments/${encodeURIComponent(paymentInstrumentId)}?siteId=${encodeURIComponent(siteId)}`;

  const accessToken = await getAuthToken();
  if (!accessToken) throw new Error("Missing access token");

  const resp = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Remove payment instrument failed: ${resp.status} ${text}`);
  }

  const data = await resp.json();
  return data;
};

// coupon Api's
export const add_coupon_to_basket = async ({ basketId, code }) => {
  if (!basketId) throw new Error("basketId is required");
  if (!code) throw new Error("Coupon code is required");

  const siteId = import.meta.env.VITE_SFCC_SITE_ID || "sotbella_in";

  const url =
    `${SFCC_CONFIG.baseUrl}/checkout/shopper-baskets/v2/organizations/${SFCC_CONFIG.organizationId}` +
    `/baskets/${encodeURIComponent(basketId)}` +
    `/coupons?siteId=${encodeURIComponent(siteId)}`;

  const accessToken = await getAuthToken();
  if (!accessToken) throw new Error("Missing access token");

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code }),
  });

  if (!resp.ok) {
    let errorMessage = `Add coupon to basket failed: ${resp.status}`;
    try {
      const errorData = await resp.json();
      // Prefer 'detail' as it usually contains the specific message like "Coupon code 'xyz' is invalid."
      if (errorData.detail) {
        errorMessage = errorData.detail;
      } else if (errorData.title) {
        errorMessage = errorData.title;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (e) {
      const text = await resp.text().catch(() => "");
      errorMessage += ` ${text}`;
    }
    throw new Error(errorMessage);
  }

  const data = await resp.json();
  return data;
};

export const remove_coupon_from_basket = async ({ basketId, coupon_id }) => {
  if (!basketId) throw new Error("basketId is required");
  if (!coupon_id) throw new Error("Coupon id is required");

  const siteId = import.meta.env.VITE_SFCC_SITE_ID || "sotbella_in";

  const url =
    `${SFCC_CONFIG.baseUrl}/checkout/shopper-baskets/v2/organizations/${SFCC_CONFIG.organizationId}` +
    `/baskets/${encodeURIComponent(basketId)}` +
    `/coupons/${encodeURIComponent(coupon_id)}?siteId=${encodeURIComponent(siteId)}`;

  const accessToken = await getAuthToken();
  if (!accessToken) throw new Error("Missing access token");

  const resp = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Remove coupon from basket failed: ${resp.status} ${text}`);
  }

  const data = await resp.json();
  return data;
};

/**
 * Cancel a Stripe payment intent
 * This calls a backend endpoint that uses Stripe's secret key to cancel the payment intent
 * Reference: https://docs.stripe.com/api/payment_intents/cancel
 * 
 * @param {string} paymentIntentId - Stripe payment intent ID (e.g., "pi_xxx")
 * @param {string} orderId - Order ID (optional, for logging)
 * @param {string} cancellationReason - Reason for cancellation: "duplicate", "fraudulent", "requested_by_customer", or "abandoned"
 * @returns {Promise<Object>} Cancelled payment intent object
 */
// export const cancel_stripe_payment_intent = async ({
//   paymentIntentId,
//   orderId = null,
//   cancellationReason = "abandoned"
// }) => {
//   // if (!paymentIntentId) {
//   //   throw new Error("Payment intent ID is required");
//   // }

//   const accessToken = await getAuthToken();
//   if (!accessToken) {
//     throw new Error("Missing access token");
//   }

//   const siteId = import.meta.env.VITE_SFCC_SITE_ID || "sotbella_in";

//   // Use SFCC custom endpoint for order cancellation
//   // URL: https://{shortCode}.api.commercecloud.salesforce.com/custom/custom-data/v1/organizations/{organizationId}/cancelOrder?siteId={siteId}
//   const url = `${SFCC_CONFIG.baseUrl}/custom/custom-data/v1/organizations/${SFCC_CONFIG.organizationId}/cancelOrder?siteId=${encodeURIComponent(siteId)}`;

//   try {
//     const resp = await fetch(url, {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${accessToken}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         orderNo: orderId,
//         // cancellationReason: cancellationReason,
//         // paymentIntentId: paymentIntentId
//       }),
//     });

//     if (!resp.ok) {
//       const errorText = await resp.text().catch(() => "");
//       logger.error(`Failed to cancel order: ${resp.status} ${errorText}`);

//       // Even if it fails, we return an error object rather than throwing, 
//       // so the UI can decide how to handle it (though usually it just keeps the basket as is)
//       return { cancelled: false, message: `Failed to cancel order: ${resp.status}`, details: errorText };
//     }

//     const data = await resp.json();
//     return data;
//   } catch (error) {
//     logger.error("Error canceling order:", error);
//     return { cancelled: false, error: error.message };
//   }
// };


/**
 * Cancel an SFCC order
 * This calls a backend endpoint that uses SFCC custom endpoint to cancel the order
 *
 * @param {string} orderId - Order ID to cancel
 * @param {string} cancellationReason - Reason for cancellation: "duplicate", "fraudulent", "requested_by_customer", or "abandoned"
 * @returns {Promise<Object>} Cancelled order response
 */
export const cancel_sfcc_order = async ({
  orderId = null,
  cancellationReason = "abandoned"
}) => {
  const accessToken = await getAuthToken();
  if (!accessToken) {
    throw new Error("Missing access token");
  }

  const siteId = import.meta.env.VITE_SFCC_SITE_ID || "sotbella_in";

  // Use SFCC custom endpoint for order cancellation
  const url = `${SFCC_CONFIG.baseUrl}/custom/custom-data/v1/organizations/${SFCC_CONFIG.organizationId}/cancelOrder?siteId=${encodeURIComponent(siteId)}`;

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderNo: orderId,
      }),
    });

    if (!resp.ok) {
      const errorText = await resp.text().catch(() => "");
      logger.error(`Failed to cancel order: ${resp.status} ${errorText}`);

      return { cancelled: false, message: `Failed to cancel order: ${resp.status}`, details: errorText };
    }

    const data = await resp.json();
    return data;
  } catch (error) {
    logger.error("Error canceling order:", error);
    return { cancelled: false, error: error.message };
  }
};

/**
 * Create an order from a basket
 * POST /checkout/shopper-orders/v1/organizations/{org}/orders
 */
export const create_order_from_basket = async ({
  basketId,
  locale: localeOverride,
}) => {
  if (!basketId) throw new Error("basketId is required");

  const siteId = import.meta.env.VITE_SFCC_SITE_ID || "sotbella_in";

  const locale = import.meta.env.VITE_SFCC_LOCALE || "en-IN";

  const url =
    `${SFCC_CONFIG.baseUrl}/checkout/shopper-orders/v1/organizations/${SFCC_CONFIG.organizationId}` +
    `/orders?siteId=${encodeURIComponent(siteId)}&locale=${encodeURIComponent(locale)}`;

  const accessToken = await getAuthToken();
  if (!accessToken) throw new Error("Missing access token");

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ basketId }),
  });

  let result;

  if (!resp.ok) {
    result = await resp.json();
    // const text = await resp.text().catch(() => "");
    // throw new Error(`Create order failed: ${resp.status} ${text}`);
    const text = result?.statusMessage || result?.message || "";
    throw new Error(`Create order failed: Insufficient Stock`);
  }

  return resp.json();
};
