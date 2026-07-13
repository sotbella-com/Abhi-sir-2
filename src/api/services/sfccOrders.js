import { SFCC_CONFIG } from "@/api/services";
// import { getCurrentSiteId } from "@/utils/sfccSiteConfig";
import { getAuthToken, getAuthTokenObject } from "@/utils/tokenUtils";

/**
 * Orders listing (Custom Data endpoint)
 */
export const get_orders_listing = async ({ queryKey }) => {
  const [_, { page = 1, limit = 10, status, failedOrders = false }] = queryKey || [];
  const offset = (Number(page) - 1) * Number(limit);

  const effectiveSiteId = import.meta.env.VITE_SFCC_SITE_ID;

  const url =
    `${SFCC_CONFIG.baseUrl}/custom/custom-data/v1/organizations/` +
    `${SFCC_CONFIG.organizationId}/orders?siteId=${encodeURIComponent(effectiveSiteId)}`;

  const accessToken = await getAuthToken();
  if (!accessToken) {
    return { limit, offset, orders: [] };
  }

  const effectiveStatus = status && status !== "ALL" ? status : undefined;

  const body = {
    limit: Number(limit),
    offset: Number(offset),
    failedOrders: Boolean(failedOrders),
    ...(effectiveStatus ? { status: effectiveStatus } : {}),
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Orders fetch failed: ${resp.status} ${text}`);
  }

  const data = await resp.json();

  const rawOrders = Array.isArray(data?.orders) ? data.orders : [];
  const normalized = rawOrders.map((row) => {
    const o = row?.OrderData || {};
    const items = Array.isArray(o?.productLineItems) ? o.productLineItems : [];
    const shipments = Array.isArray(o?.shipments) ? o.shipments : [];
    const paymentMethods = Array.isArray(o?.c_paymentMethods) ? o.c_paymentMethods : [];

    const statusText =
      o.orderStatus || o.shippingStatus || (shipments[0]?.shippingStatus ?? "") || "";

    let paymentMethod = "PREPAID";

    if (paymentMethods.length > 0) {
      const method = paymentMethods[0]?.paymentMethod || "";
      paymentMethod = method === "COD" ? "COD" : "PREPAID";
    }

    return {
      id: o.orderNo || "",
      createdAt: o.creationDate || "",
      status: String(statusText ?? "").toUpperCase(),
      paymentStatus: String(o.paymentStatus ?? "").toUpperCase(),
      paymentMethod,
      grandTotal: Number(o.totalGrossPrice || 0),
      subOrders: items,
      currencyCode: o.currencyCode || "INR",
      _raw: o,
    };
  });

  return {
    limit: Number(data?.limit ?? limit),
    offset: Number(data?.offset ?? offset),
    orders: normalized,
  };
};

/**
 * Order details (Shopper Orders endpoint)
 */
export const get_order_details = async ({ queryKey }) => {
  const [_, { orderId }] = queryKey || [];
  if (!orderId) throw new Error("orderId is required");

  const effectiveSiteId = import.meta.env.VITE_SFCC_SITE_ID;

  const url =
    `${SFCC_CONFIG.baseUrl}/checkout/shopper-orders/v1/organizations/` +
    `${SFCC_CONFIG.organizationId}/orders/${encodeURIComponent(orderId)}?siteId=${encodeURIComponent(
      effectiveSiteId
    )}`;

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
    throw new Error(`Order details fetch failed: ${resp.status} ${text}`);
  }

  const data = await resp.json();

  const productItems = Array.isArray(data?.productItems) ? data.productItems : [];
  const shipments = Array.isArray(data?.shipments) ? data.shipments : [];
  const shipping = shipments[0] || {};
  const shippingMethodName = shipping?.shippingMethod?.name || "";
  const shippingCharge = Number(shipping?.shippingMethod?.price || data?.shippingTotal || 0);

  const subOrders = productItems.map((pi) => {
    const images = pi?.c_images?.large || [];
    const productImages = images
      .map((img, idx) => ({
        type: "product",
        image: img?.absURL || img?.url || "",
        alt: img?.alt || pi?.productName || "",
        title: img?.title || pi?.productName || "",
        index: img?.index || idx.toString(),
      }))
      .filter((img) => img.image);

    const variationAttributes = Array.isArray(pi?.c_variationAttributes)
      ? pi.c_variationAttributes
      : [];

    return {
      itemId: pi?.itemId || "",       // SFCC line item id 
      productId: pi?.productId || "", // ✅ you want to use this as "itemId" for cancel API
      productName: pi?.productName || pi?.itemText || "",
      product: {
        title: pi?.productName || pi?.itemText || "",
        price: Number(pi?.priceAfterOrderDiscount ?? pi?.price ?? pi?.basePrice ?? 0),
        basePrice: Number(pi?.basePrice || 0),
        priceAfterItemDiscount: Number(pi?.priceAfterItemDiscount || 0),
        priceAfterOrderDiscount: Number(pi?.priceAfterOrderDiscount || 0),
        productImages,
      },
      quantity: Number(pi?.quantity || 0),
      status: (data?.shippingStatus || data?.status || "").toUpperCase(),
      tax: Number(pi?.tax || 0),
      adjustedTax: Number(pi?.adjustedTax || 0),
      taxRate: Number(pi?.taxRate || 0),
      variationAttributes,
      _raw: pi,
    };
  });

  const couponItems = Array.isArray(data?.couponItems) ? data.couponItems : [];
  const mrp = Number(data?.productSubTotal ?? data?.productTotal ?? 0);
  const couponAmount = Number(mrp - (data?.productTotal || 0));
  const vat = Number(data?.taxTotal ?? 0);
  const grand = Number(data?.orderTotal ?? mrp - couponAmount + shippingCharge + vat);
  const orderPriceAdjustments = Array.isArray(data?.orderPriceAdjustments)
  ? data.orderPriceAdjustments
  : [];

  const paymentInstruments = Array.isArray(data?.paymentInstruments) ? data.paymentInstruments : [];
  const paymentInstrument = paymentInstruments[0] || null;
  const rawMethod = paymentInstrument?.paymentMethodId || "";
  const paymentMethod = rawMethod === "COD" ? "COD" : "PREPAID";
  const paymentAmount = Number(paymentInstrument?.amount || data?.orderTotal || 0);
  const paymentStatus = String(data?.paymentStatus || "").toUpperCase();

  const shipAddr = shipping?.shippingAddress || data?.billingAddress || {};
  const addressText = [shipAddr?.address1, shipAddr?.city, shipAddr?.stateCode, shipAddr?.postalCode, shipAddr?.countryCode]
    .filter(Boolean)
    .join(", ");

  const orderNo = data?.orderNo || "";

  return {
    data: {
      order: {
        id: orderNo,
        orderNo,
        orderToken: data?.orderToken || "",
        orderViewCode: data?.orderViewCode || "",
        createdAt: data?.creationDate || "",
        status: String(data?.status || data?.confirmationStatus || "").toUpperCase(),
        confirmationStatus: data?.confirmationStatus || "",
        paymentStatus,
        paymentMethod,
        paymentAmount,
        shippingMethod: shippingMethodName,
        shippingCharge,
        shippingStatus: String(data?.shippingStatus || "").toUpperCase(),
        mrp,
        couponAmount,
        vat,
        grandTotal: grand,
        currency: data?.currency || "INR",
        subOrders,
        couponItems,
        address: addressText,
        billingAddress: data?.billingAddress || {},
        shippingAddress: shipAddr,
        customerInfo: data?.customerInfo || {},
        cartId: data?.c_cartId || "",
        orderPriceAdjustments,

        _raw: data,
      },
    },
  };
};

export const cancel_order_item = async ({ orderId, itemId, reason, siteId }) => {
  const accessToken = await getAuthToken();

  if (!accessToken) {
    const tokenObj = getAuthTokenObject?.() || null;
    // console.warn("Cancel API: access token missing", { tokenObj });
    const err = new Error("Access token missing. Please refresh or login again.");
    err.code = "TOKEN_MISSING";
    throw err;
  }

  if (!orderId) throw new Error("Missing orderId");
  if (!itemId) throw new Error("Missing itemId");
  if (!reason) throw new Error("Missing cancellation reason");

  const effectiveSiteId = siteId || import.meta.env.VITE_SFCC_SITE_ID;

  const url =
    `${SFCC_CONFIG.baseUrl}/custom/order/v1/organizations/` +
    `${SFCC_CONFIG.organizationId}/cancel?siteId=${encodeURIComponent(effectiveSiteId)}`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "x-dw-client-id": SFCC_CONFIG.clientId,
    },
    body: JSON.stringify({ orderId, itemId, reason }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Cancel API failed: ${resp.status} ${text}`);
  }

  return resp.json();
};

/**
 * Track Order (Custom API)
 * @param {Object} params
 * @param {string} params.orderId - (Optional) Order ID
 * @param {string} params.awbNumber - (Optional) AWB Number
 */
export const track_order = async ({ orderId, awbNumber }) => {
  const accessToken = await getAuthToken();

  // If we truly need a token, ensure it exists (guest or user)
  if (!accessToken) {
    throw new Error("Missing access token for tracking");
  }

  const effectiveSiteId = import.meta.env.VITE_SFCC_SITE_ID;
  const url = `${SFCC_CONFIG.baseUrl}/custom/order/v1/organizations/${SFCC_CONFIG.organizationId}/trackOrder?siteId=${effectiveSiteId}`;

  const body = {};
  if (orderId) body.orderId = orderId;
  if (awbNumber) body.awbNumber = awbNumber;

  if (Object.keys(body).length === 0) {
    throw new Error("Either orderId or awbNumber is required");
  }

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      // "x-dw-client-id": SFCC_CONFIG.clientId, // typical for custom APIs, but follow other patterns if needed
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    throw errorData;
  }

  return resp.json();
};

