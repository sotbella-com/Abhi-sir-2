import axios from "axios";
import { SFCC_CONFIG } from "./auth";
import { getAuthToken, getAuthTokenObject } from "@/utils/tokenUtils";
// import { getCurrentSiteId } from "@/utils/sfccSiteConfig";

/**
 * Check delivery availability by pincode
 * POST /custom/custom-data/v1/organizations/{orgId}/shippingAvailability?siteId={siteId}
 */
export const checkShippingAvailability = async ({ pincode, cod = true }) => {
  const accessToken = await getAuthToken();

  if (!accessToken) {
    const tokenObj = getAuthTokenObject?.() || null;
    // console.warn("Shipping API: access token missing", { tokenObj });

    const err = new Error("Access token missing. Please refresh or login again.");
    err.code = "TOKEN_MISSING";
    throw err;
  }

  if (!pincode) throw new Error("Missing pincode");

  // ✅ Dynamic siteId at runtime
  const siteId = import.meta.env.VITE_SFCC_SITE_ID || 
  "sotbella_in";;

  const url =
    `${SFCC_CONFIG.baseUrl}` +
    `/custom/custom-data/v1/organizations/${SFCC_CONFIG.organizationId}` +
    `/shippingAvailability?siteId=${encodeURIComponent(siteId)}`;

  const response = await axios.post(
    url,
    { pincode, cod },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "x-dw-client-id": SFCC_CONFIG.clientId,
      },
    }
  );

  return response.data;
};
