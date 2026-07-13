// src/api/services/sfccCoupons.js
import { SFCC_CONFIG } from "@/api/services"; // Make sure this file contains the base URL, organization ID, etc.
import { getAuthToken } from "@/utils/tokenUtils";


/**
 * Fetch active promotions (including coupons) for the user.
 * GET /custom/custom-data/v1/organizations/{org}/activePromotions
 *
 * Returns: { promotions: [...], customerPromotions: [...] }
 */
export const get_active_promotions = async ({ locale = null, siteId = null }) => {
  // Use dynamic site ID and locale (UAE defaults)
  const effectiveSiteId = siteId || import.meta.env.VITE_SFCC_SITE_ID || DEFAULT_SITE_ID;
  const effectiveLocale = import.meta.env.VITE_SFCC_LOCALE || "en-IN";
  const url = `${SFCC_CONFIG.baseUrl}/custom/custom-data/v1/organizations/${SFCC_CONFIG.organizationId}/activePromotions?siteId=${effectiveSiteId}&locale=${effectiveLocale}`;

  const accessToken = await getAuthToken();
  if (!accessToken) throw new Error("Missing access token");

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(`Failed to fetch promotions: ${errorMessage}`);
  }

  const data = await response.json();

  // Normalize the data, returning an array of promotions and coupons
  const promotions = data.promotions || [];
  const customerPromotions = data.customerPromotions || [];

  // Combining promotions and customer promotions (you can adjust this based on your needs)
  return {
    promotions,
    customerPromotions,
  };
};
