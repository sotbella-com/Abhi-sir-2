
import { SFCC_CONFIG } from "@/api/services";
import { getAuthToken } from "@/utils/tokenUtils";

const merchantId = import.meta.env.VITE_TAILOREDD_MERCHANT_ID;
const apiKey = import.meta.env.VITE_TAILOREDD_API_KEY;


/** 
 * fetch reviews with headers
 * @param {*} productId 
 */
export const getProductReviews = async (productId) => {
  try {
    // Use the proxy path '/api' to hit the target API
    const response = await fetch(
      `/api/products/${productId}/reviews?limit=10&sort=newest`, // Proxy path
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Merchant-Id": merchantId,
          // No need to set "Origin" here because the proxy handles it
        },
      }
    );

    if (!response.ok) {
      // console.log("HTTP Error: ", response.status);
      throw new Error(`HTTP Error: ${response.status}`);
    }
    // const data = await response.json();
    return response.json();
  } catch (error) {
    // console.error("Error fetching reviews:", error);
    return null;
  }
};

/**
 * check user bought the product or not
 * @param {*} productId 
 * @returns 
 */
export const itemOrderCheck = async ({
  productId,
  // locale = "en-IN", 
  siteId = "sotbella_in"
}) => {

  const url = `${SFCC_CONFIG.baseUrl}/custom/custom-data/v1/organizations/${SFCC_CONFIG.organizationId}/isItemBought?siteId=${siteId}&c_productId=${productId}`;

  const accessToken = await getAuthToken();
  if (!accessToken) throw new Error("Missing access token");


  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      msg = body?.error || msg;
    } catch { }
    throw new Error(msg);
  }

  // expected: { hasReview: true/false }
  return res.json();
};

/**
 * check review exists for a particular productId and authorEmail
 * @param {*} productId 
 * @param {*} authorEmail
 * @returns 
 */
export async function checkHasReview({ productId, authorEmail }) {

  const url =
    `/tailoredd/reviews/exists` +
    `?merchantId=${encodeURIComponent(merchantId)}` +
    `&productId=${encodeURIComponent(productId)}` +
    `&authorEmail=${encodeURIComponent(authorEmail)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "X-Merchant-Id": merchantId, // keep if your backend needs it
      "x-api-key": apiKey
    },
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      msg = body?.error || msg;
    } catch { }
    throw new Error(msg);
  }

  // expected: { hasReview: true/false }
  return res.json();
}

/**
 * Submit review with optional media
 * @param {FormData} formData
 * @param {{ merchantId: string, apiKey: string }} headersData
 */
export async function submitReviewWithMedia(formData) {
  const res = await fetch(`/tailoredd/reviews/with-media`, {
    method: "POST",
    headers: {
      "X-Merchant-Id": merchantId,
      "x-api-key": apiKey,
    },
    body: formData,
  });

  if (!res.ok) {
    let msg = `HTTP Error: ${res.status}`;
    try {
      const body = await res.json();
      msg = body?.error?.message;
    } catch { }
    throw new Error(msg);
  }

  return res;
}
