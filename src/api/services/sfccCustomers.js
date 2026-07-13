import axios from "axios";
import { getAuthToken, getCustomerId, isUserLoggedIn } from "@/utils/tokenUtils";


const SHORT_CODE = import.meta.env.VITE_SFCC_SHORTCODE ?? "dyp4l3dm";
const ORG_ID = import.meta.env.VITE_SFCC_ORG_ID ?? "f_ecom_blxz_stg";
const PROXY_BASE = import.meta.env.VITE_SFCC_BASE_URL ?? "";

const apiBase = PROXY_BASE
    ? `${PROXY_BASE}/customer/shopper-customers/v1/organizations/${ORG_ID}`
    : `https://${SHORT_CODE}.api.commercecloud.salesforce.com/customer/shopper-customers/v1/organizations/${ORG_ID}`;

const withSite = (params = {}) => {
  const siteId = import.meta.env.VITE_SFCC_SITE_ID;
  return { siteId, ...params };
};

const authHeaders = (token) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
});

// Cache state
let customerRequestPromise = null;
let cachedCustomerData = null;
let cacheTimestamp = 0;
let cachedCustomerId = null;
const CACHE_TTL_MS = 10000; // 10 seconds cache to prevent rapid-fire redundant calls

// Helper to invalidate cache
const invalidateCustomerCache = () => {
    cachedCustomerData = null;
    cachedCustomerId = null;
    cacheTimestamp = 0;
    customerRequestPromise = null;
};

/** GET customer (with deduplication and caching) */
export async function getCustomer(forceRefresh = false) {
    if (!isUserLoggedIn()) {
        throw new Error("You must be logged in to view customer data");
    }

// 1. Return cached data if we have it (optimistic check, detailed check inside promise)
    // Note: detailed check requiring customerId happens inside the promise to update cache safely

    // 2. Return existing promise if request is already in flight
    if (customerRequestPromise) {
        return customerRequestPromise;
    }

    // 3. Make new request (wrapped in IIFE to assign promise synchronously)
    customerRequestPromise = (async () => {
        try {
            const [token, customerId] = await Promise.all([getAuthToken(), getCustomerId()]);

            // Check cache with customerId
            // We do this check here because we need customerId to validate the cache
            const now = Date.now();
            if (!forceRefresh && cachedCustomerData && cachedCustomerId === customerId && (now - cacheTimestamp < CACHE_TTL_MS)) {
                return cachedCustomerData;
            }

            const url = `${apiBase}/customers/${customerId}`;
            const { data } = await axios.get(url, { headers: authHeaders(token), params: withSite() });

            cachedCustomerData = data;
            cachedCustomerId = customerId;
            cacheTimestamp = Date.now();
            return data;
        } finally {
            customerRequestPromise = null;
        }
    })();

    return customerRequestPromise;
}

/** Create address (user token required) */
export async function createCustomerAddress({ address }) {
    // Must be a user token
    if (!isUserLoggedIn()) {
        throw new Error("You must be logged in to add an address");
    }

    const [token, customerId] = await Promise.all([getAuthToken(), getCustomerId()]);
    if (!token || !customerId) {
        throw new Error("You must be logged in to add an address");
    }

    const url = `${apiBase}/customers/${customerId}/addresses`;
    const { data } = await axios.post(url, address, {
        headers: authHeaders(token),
        params: withSite(),
    });

    invalidateCustomerCache(); // Invalidate cache on mutation
    return data;
}

export async function getCustomerAddressById({ addressName, customerId }) {
    if (!isUserLoggedIn()) {
        throw new Error("You must be logged in to view address details");
    }
    const token = await getAuthToken();
    const cid = customerId ?? (await getCustomerId());
    if (!token || !cid) {
        throw new Error("You must be logged in to view address details");
    }
    const url = `${apiBase}/customers/${cid}/addresses/${encodeURIComponent(addressName)}`;
    const { data } = await axios.get(url, { headers: authHeaders(token), params: withSite() });
    return data;
}

export async function updateCustomerAddress({ addressName, payload, customerId }) {
    if (!isUserLoggedIn()) {
        throw new Error("You must be logged in to update an address");
    }
    const token = await getAuthToken();
    const cid = customerId ?? (await getCustomerId());
    if (!token || !cid) {
        throw new Error("You must be logged in to update an address");
    }
    const url = `${apiBase}/customers/${cid}/addresses/${encodeURIComponent(addressName)}`;
    const { data } = await axios.patch(url, payload, { headers: authHeaders(token), params: withSite() });
    
    invalidateCustomerCache(); // Invalidate cache on mutation
    return data;
}

export async function deleteCustomerAddress({ addressName, customerId }) {
    if (!isUserLoggedIn()) {
        throw new Error("You must be logged in to delete an address");
    }
    const token = await getAuthToken();
    const cid = customerId ?? (await getCustomerId());
    if (!token || !cid) {
        throw new Error("You must be logged in to delete an address");
    }
    const url = `${apiBase}/customers/${cid}/addresses/${encodeURIComponent(addressName)}`;
    const response = await axios.delete(url, { headers: authHeaders(token), params: withSite() });
    
    invalidateCustomerCache(); // Invalidate cache on mutation
    // 204 No Content expected on success
    return true;
}

/**
 * Update customer profile details
 * Supports: firstName, lastName, gender, birthday, c_anniversaryDate,
 * c_newsletterSubscribed, c_receiveOrderUpdates
 */
export async function updateCustomerDetails(payload) {
  if (!isUserLoggedIn()) {
    throw new Error("You must be logged in to update profile details");
  }
  const [token, customerId] = await Promise.all([getAuthToken(), getCustomerId()]);
  if (!token || !customerId) {
    throw new Error("You must be logged in to update profile details");
  }
  const url = `${apiBase}/customers/${customerId}`;
  const { data } = await axios.patch(url, payload, {
    headers: authHeaders(token),
    params: withSite(),
  });

  invalidateCustomerCache(); // Invalidate cache on mutation
  return data;
}

/**
 * Get customer profile data (same as getCustomer, but with clearer naming)
 * Profile data is included in the getCustomer response along with addresses
 * This is just an alias for getCustomer() for clarity
 */
export async function getCustomerMe() {
  // Reuse getCustomer since profile data is in the same response
  return await getCustomer();
}

/**
 * Get customer profile data only (extracts profile fields from getCustomer response)
 * Returns profile fields: firstName, lastName, email, gender, birthday, etc.
 */
export async function getCustomerProfile() {
  const customer = await getCustomer();
  return {
    customerId: customer.customerId,
    customerNo: customer.customerNo,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    gender: customer.gender,
    birthday: customer.birthday,
    phoneMobile: customer.phoneMobile,
    phoneHome: customer.phoneHome,
    phoneBusiness: customer.phoneBusiness,
    c_anniversaryDate: customer.c_anniversaryDate,
    c_newsletterSubscribed: customer.c_newsletterSubscribed,
    c_receiveOrderUpdates: customer.c_receiveOrderUpdates,
    c_stripeCustomerId: customer.c_stripeCustomerId,
    c_uniqueReferralCode: customer.c_uniqueReferralCode,
    creationDate: customer.creationDate,
    lastModified: customer.lastModified,
    lastLoginTime: customer.lastLoginTime,
    authType: customer.authType,
  };
}