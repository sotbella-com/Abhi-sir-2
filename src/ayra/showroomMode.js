/**
 * Showroom-mode flag (session-scoped). When on, AYRA becomes an ambient presence
 * that DRIVES the real storefront (navigates + highlights products in place) with
 * corner glow + voice, instead of showing product cards in her own panel. Read by
 * AyraShopper (glow + shelf-suppression) and ayraActions (real-store navigation).
 */
export const isShowroom = () => {
  try { return sessionStorage.getItem("ayra_mode") === "showroom"; } catch { return false; }
};
export const setShowroom = (on) => {
  try {
    if (on) sessionStorage.setItem("ayra_mode", "showroom");
    else sessionStorage.removeItem("ayra_mode");
  } catch {}
};
export default { isShowroom, setShowroom };
