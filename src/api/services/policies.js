import sfccApiClient from "../sfccApiClient";
// import { getCurrentSiteIdSync, DEFAULT_SITE_ID } from "../../utils/geolocation";

const cache = {};
const inFlight = {};

export async function fetchContentPage(pageKey, siteId = null) {
  if (!pageKey) throw new Error("pageKey is required");

  const currentSiteId =
    siteId ||
    import.meta.env.VITE_SFCC_SITE_ID;

  if (cache[pageKey]) return cache[pageKey];
  if (inFlight[pageKey]) return inFlight[pageKey];

  // ✅ IMPORTANT: dynamic pageKey
  const endpoint = sfccApiClient.getCustomDataUrl(`/content/${pageKey}`);
  const url = sfccApiClient.buildUrl(endpoint, currentSiteId);

  inFlight[pageKey] = sfccApiClient
    .get(url)
    .then((res) => {
      const data = res?.data ?? res; // normalize axios response
      cache[pageKey] = data;
      return data;
    })
    .finally(() => {
      delete inFlight[pageKey];
    });

  return inFlight[pageKey];
}
