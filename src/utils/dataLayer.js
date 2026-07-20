/**
 * Unified DataLayer + Meta Utility
 * v3 — NO _sha256, NO _setPixelUserData. Adds fbp/fbc/client_ua passthrough to all CAPI calls.
 * Contract:
 * - All events include: userDetails, ecommerce, page, timestamp
 * - Frontend sends RAW data only
 * - GTM handles hashing
 * - Meta events fire automatically with GTM
 */

import { isUserLoggedIn, getAuthTokenObject } from './tokenUtils';
import { getCustomer } from '@/api/services/sfccCustomers';
import { isShowroom } from '@/ayra/showroomMode';

const DEFAULT_CURRENCY = 'INR';

// ISOLATION: while AYRA "showroom" test mode is active, AYRA drives the REAL store —
// so suppress the demo storefront's production GTM/pixel + direct prod-CAPI events for
// that session. Only the isolated test-pixel AYRA custom events (ayraEvents.js) fire.
const _showroomBlocked = () => { try { return isShowroom(); } catch { return false; } };

const _getCookie = (name) => {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
};

const _getSignals = () => ({
  fbp: _getCookie('_fbp') || null,
  fbc: _getCookie('_fbc') || null,
  client_ua: (typeof navigator !== 'undefined' ? navigator.userAgent : null) || null,
});

const initDataLayer = () => {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
};

const getUserDetails = async () => {
  try {
    const isLoggedIn = isUserLoggedIn();
    if (!isLoggedIn) return null;

    const tokenData = getAuthTokenObject();
    const customerId = tokenData?.customer_id;
    if (!customerId) return null;

    try {
      const customer = await getCustomer();
      if (!customer) return null;

      const address = customer.addresses?.[0] || customer.billingAddress || null;
      return {
        user_id: customerId,
        email: customer.email || null,
        phone: customer.phoneMobile || customer.phoneHome || null,
        first_name: customer.firstName || null,
        last_name: customer.lastName || null,
        address: address ? {
          street: address.address1 || null,
          city: address.city || null,
          state: address.stateCode || address.state || null,
          country: address.countryCode || null,
          postal_code: address.postalCode || null
        } : null
      };
    } catch (error) {
      return {
        user_id: customerId,
        email: null,
        phone: null,
        first_name: null,
        last_name: null,
        address: null
      };
    }
  } catch (error) {
    return null;
  }
};

const getPageContext = () => {
  if (typeof window === 'undefined') return { url: '', title: '' };
  return { url: window.location.href, title: document.title };
};

const getCurrency = (basket = null, overrideCurrency = null) => {
  if (overrideCurrency) return overrideCurrency;
  if (basket) {
    return basket.currency ||
           basket.currencyCode ||
           basket.currencyISOCode ||
           basket.productItems?.[0]?.currency ||
           DEFAULT_CURRENCY;
  }
  return DEFAULT_CURRENCY;
};

const transformItems = (items = [], currency = DEFAULT_CURRENCY) => {
  if (!Array.isArray(items)) return [];
  return items.map(item => ({
    item_id: item.productId || item.id || '',
    item_name: item.productName || item.name || '',
    item_category: item.category || item.categoryId || '',
    item_variant: item.variantId || item.size || item.color || '',
    price: Number(item.price || item.basePrice || item.priceAfterItemDiscount || 0),
    quantity: Number(item.quantity || 1)
  }));
};

export const pushToDataLayer = async (eventName, ecommerce = {}, options = {}) => {
  if (_showroomBlocked()) return; // AYRA showroom test session — no prod GTM/pixel
  initDataLayer();
  try {
    const eventId = options.event_id || crypto.randomUUID();
    const userDetails = await getUserDetails();
    const page = getPageContext();

    const eventData = {
      event: eventName,
      event_id: eventId,
      ecommerce: {
        currency: ecommerce.currency || DEFAULT_CURRENCY,
        value: Number(ecommerce.value || 0),
        items: Array.isArray(ecommerce.items) ? ecommerce.items : [],
        ...(ecommerce.transaction_id && { transaction_id: ecommerce.transaction_id })
      },
      userDetails: userDetails,
      page: page,
      timestamp: Date.now(),
      ...options
    };

    window.dataLayer.push(eventData);
    return eventId;
  } catch (error) {
    return null;
  }
};

export const trackViewItem = async (product, currency = DEFAULT_CURRENCY) => {
  const ecommerce = {
    currency: DEFAULT_CURRENCY,
    value: Number(product.price || product.basePrice || 0),
    items: [{
      item_id: product.productId || product.id || '',
      item_name: product.productName || product.name || '',
      item_category: product.category || product.categoryId || '',
      item_variant: product.variantId || product.size || product.color || '',
      price: Number(product.price || product.basePrice || 0),
      quantity: 1,
      item_image: product.image || ''
    }]
  };
  return await pushToDataLayer('view_item', ecommerce);
};

export const trackAddToCart = async (product, quantity = 1, currency = DEFAULT_CURRENCY) => {
  if (_showroomBlocked()) return; // AYRA showroom test session — no prod CAPI
  const itemPrice = Number(product.price || product.basePrice || product.priceAfterItemDiscount || 0);
  const ecommerce = {
    currency: DEFAULT_CURRENCY,
    value: itemPrice * quantity,
    items: [{
      item_id: product.productId || product.id || '',
      price: itemPrice,
      quantity: Number(quantity)
    }]
  };
  const eventId = await pushToDataLayer('add_to_cart', ecommerce);

  try {
    const dl = window.dataLayer[window.dataLayer.length - 1];
    const u = dl?.userDetails || {};
    const sig = _getSignals();
    fetch('https://sotbella-meta-production.up.railway.app/meta/capi/add_to_cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: eventId,
        product_id: product.productId || product.id || '',
        value: itemPrice * quantity,
        currency: DEFAULT_CURRENCY,
        quantity: Number(quantity),
        email: u.email || '',
        customer_no: u.user_id || '',
        fbp: sig.fbp,
        fbc: sig.fbc,
        client_ua: sig.client_ua,
      })
    }).catch(() => {});
  } catch (e) {}

  return eventId;
};

export const trackBeginCheckout = async (basket, currency = null) => {
  if (_showroomBlocked()) return; // AYRA showroom test session — no prod CAPI
  const basketCurrency = getCurrency(basket, currency);
  const items = transformItems(basket.productItems || basket.items || [], basketCurrency);
  const totalValue = Number(basket.orderTotal || basket.total || 0);

  const ecommerce = {
    currency: basketCurrency,
    value: totalValue,
    items: items
  };

  const eventId = await pushToDataLayer('begin_checkout', ecommerce);

  try {
    const dl = window.dataLayer[window.dataLayer.length - 1];
    const u = dl?.userDetails || {};
    const productIds = items.map(i => i.item_id).filter(Boolean);
    const sig = _getSignals();
    fetch('https://sotbella-meta-production.up.railway.app/meta/capi/initiate_checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: eventId,
        content_ids: productIds,
        value: totalValue,
        currency: basketCurrency,
        num_items: productIds.length,
        email: u.email || '',
        customer_no: u.user_id || '',
        fbp: sig.fbp,
        fbc: sig.fbc,
        client_ua: sig.client_ua,
      })
    }).catch(() => {});
  } catch (e) {}

  return eventId;
};

export const trackPurchase = async (order, transactionId, currency = null) => {
  if (_showroomBlocked()) return; // AYRA showroom test session — no prod CAPI
  const orderCurrency = getCurrency(order, currency);
  const items = transformItems(order.items || order.productItems || [], orderCurrency);
  const totalValue = Number(order.orderTotal || order.total || order.value || 0);

  const tid = transactionId || order.transactionId || order.id || null;
  const cleanTid = tid ? tid.replace(/\D/g, '') : null;

  const ecommerce = {
    currency: orderCurrency,
    value: totalValue,
    transaction_id: cleanTid,
    items
  };

  await pushToDataLayer('purchase', ecommerce, { event_id: cleanTid });

  try {
    const productIds = items.map(i => i.item_id).filter(Boolean);
    const billing = order.billingAddress || order.billing_address || {};
    const customer = order.customerInfo || order.customer || {};
    const sig = _getSignals();

    fetch('https://sotbella-meta-production.up.railway.app/meta/capi/sfcc_order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_no: tid,
        value: totalValue,
        currency: orderCurrency,
        content_ids: productIds,
        num_items: productIds.length,
        email: customer.email || order.customerEmail || '',
        first_name: billing.firstName || '',
        last_name: billing.lastName || '',
        phone: billing.phone || customer.phoneHome || '',
        customer_no: customer.customerNo || customer.customerId || '',
        fbp: sig.fbp,
        fbc: sig.fbc,
        client_ua: sig.client_ua,
      })
    }).catch(() => {});
  } catch (e) {}

  return cleanTid;
};

export const trackRemoveFromCart = async (product, quantity = 1, currency = DEFAULT_CURRENCY) => {
  const itemPrice = Number(product.price || product.basePrice || 0);
  const ecommerce = {
    currency: currency || DEFAULT_CURRENCY,
    value: itemPrice * quantity,
    items: [{
      item_id: product.productId || product.id || '',
      item_name: product.productName || product.name || '',
      item_category: product.category || product.categoryId || '',
      item_variant: product.variantId || product.size || product.color || '',
      price: itemPrice,
      quantity: Number(quantity)
    }]
  };
  return await pushToDataLayer('remove_from_cart', ecommerce);
};

export const trackViewCart = async (basket, currency = null) => {
  const basketCurrency = getCurrency(basket, currency);
  const items = transformItems(basket.productItems || basket.items || [], basketCurrency);
  const totalValue = Number(basket.orderTotal || basket.total || 0);

  const ecommerce = {
    currency: basketCurrency,
    value: totalValue,
    items: items
  };
  return await pushToDataLayer('view_cart', ecommerce);
};

export const trackSearch = async (searchTerm) => {
  return await pushToDataLayer('search', {
    currency: DEFAULT_CURRENCY,
    value: 0,
    items: []
  }, {
    search_term: searchTerm
  });
};

export const getLastEventId = () => {
  if (typeof window === 'undefined' || !window.dataLayer) return null;
  const lastEvent = window.dataLayer[window.dataLayer.length - 1];
  return lastEvent?.event_id || null;
};

if (typeof window !== 'undefined') {
  initDataLayer();
}

export default {
  pushToDataLayer,
  trackViewItem,
  trackAddToCart,
  trackBeginCheckout,
  trackPurchase,
  trackRemoveFromCart,
  trackViewCart,
  trackSearch,
  getLastEventId
};
