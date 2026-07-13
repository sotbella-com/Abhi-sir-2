import sfccApiClient from '../sfccApiClient';
// import { getCurrentSiteIdSync, DEFAULT_SITE_ID } from '../../utils/geolocation';

/**
 * Fetches HomePage content using dynamic token management.
 * Automatically handles token refresh if needed.
 */
// De-dupe homepage fetches across the app
let cachedHomeData = null;
let inFlightHomePromise = null;

export async function fetchHomePageContent(siteId = null) {
  // Use provided siteId, or get dynamic site ID, or fallback
  const currentSiteId =  import.meta.env.VITE_SFCC_SITE_ID;
  
  if (cachedHomeData) return cachedHomeData;
  if (inFlightHomePromise) return inFlightHomePromise;

  const endpoint = sfccApiClient.getCustomDataUrl('/content/HomePage');
  const url = sfccApiClient.buildUrl(endpoint, currentSiteId);

  inFlightHomePromise = sfccApiClient.get(url)
    .then((data) => {
      cachedHomeData = data;
      return data;
    })
    .finally(() => {
      inFlightHomePromise = null;
    });

  return await inFlightHomePromise;
}

export async function getContentData(pageKey, siteId = null) {
  const currentSiteId = siteId || import.meta.env.VITE_SFCC_SITE_ID;
  const endpoint = sfccApiClient.getCustomDataUrl(`/content/${pageKey}`);
  const url = sfccApiClient.buildUrl(endpoint, currentSiteId);
  return await sfccApiClient.get(url);
}

// Cache policy data to prevent redundant fetches when switching between policy tabs
let cachedPolicyData = null;
let inFlightPolicyPromise = null;

export async function fetchPolicyContent() {
  if (cachedPolicyData) return cachedPolicyData;
  if (inFlightPolicyPromise) return inFlightPolicyPromise;

  inFlightPolicyPromise = getContentData('policy-page')
    .then((data) => {
      cachedPolicyData = data;
      return data;
    })
    .finally(() => {
      inFlightPolicyPromise = null;
    });

  return await inFlightPolicyPromise;
}

