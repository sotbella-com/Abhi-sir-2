// src/api/services/sfccPreferences.js
import authTokenManager from "@/utils/authTokenManager";
import axios from "axios";
// import { getCurrentSiteIdSync, DEFAULT_SITE_ID } from "@/utils/geolocation";

/**
 * ENV (.env)
 *  - VITE_SFCC_SHORTCODE=dyp4l3dm
 *  - VITE_SFCC_ORG_ID=f_ecom_blxz_stg
 *  - VITE_SFCC_SITE_ID=sotbella_in (fallback, uses dynamic geolocation)
 *  - VITE_SFCC_BASE_URL=/sfcc   (proxy base; leave blank for direct host)
 */
const SHORT_CODE = import.meta.env.VITE_SFCC_SHORTCODE ?? "dyp4l3dm";
const ORG_ID     = import.meta.env.VITE_SFCC_ORG_ID   ?? "f_ecom_blxz_stg";
const PROXY_BASE = import.meta.env.VITE_SFCC_BASE_URL ?? "";

/** Build base: proxy first, fallback to public host */
function baseUrl() {
  if (PROXY_BASE) {
    // e.g. /sfcc/custom/custom-data/v1/organizations/{ORG_ID}
    return `${PROXY_BASE}/custom/custom-data/v1/organizations/${ORG_ID}`;
  }
  return `https://${SHORT_CODE}.api.commercecloud.salesforce.com/custom/custom-data/v1/organizations/${ORG_ID}`;
}

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/**
 * Fetches frontend preferences (stateToCityMapping, orderStatus, etc.)
 * GET {base}/preferences?siteId={SITE_ID}
 *
 * Token is resolved internally (user or guest); no args needed.
 */
export async function getFrontendPreferences() {
  // Get dynamic site ID
  const siteId = import.meta.env.VITE_SFCC_SITE_ID;
  
  const token = await authTokenManager.ensureValidToken({ preferUser: true });
  if (!token) {
    const err = new Error("Missing SFCC access token");
    err.code = "NO_TOKEN";
    throw err;
  }

  const url = `${baseUrl()}/preferences`;
  const { data } = await axios.get(url, {
    headers: authHeaders(token.access_token || token),
    params: { siteId },
  });
  return data;
}

/** Build <Select> options for States */
export function buildStateOptions(preferences) {
  const mapping = preferences?.stateToCityMapping || {};
  return Object.keys(mapping).map((stateName) => ({
    label: stateName,
    // Use the provided code (value) if present, otherwise fall back to the name
    value: mapping[stateName]?.value || stateName,
  }));
}

/** Build <Select> options for Cities given state value or label */
export function buildCityOptions(preferences, stateValueOrName) {
  const mapping = preferences?.stateToCityMapping || {};
  const entry = Object.entries(mapping).find(([stateName, obj]) => {
    const code = String(obj?.value || "");
    const target = String(stateValueOrName || "");
    return (
      code.toLowerCase() === target.toLowerCase() ||
      stateName.toLowerCase() === target.toLowerCase()
    );
  });

  const cities = entry?.[1]?.cities || [];
  return cities.map((c) => ({ label: c, value: c }));
}
