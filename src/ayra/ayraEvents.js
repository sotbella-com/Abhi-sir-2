/**
 * AYRA Showroom — custom Meta events, TEST PIXEL ONLY.
 *
 * HARD ISOLATION (same contract as ayraTracking.js): no-op unless
 * VITE_AYRA_SANDBOX === 'true' AND a TEST pixel id is configured. Every event is
 * fired with `fbq('trackSingleCustom', TEST_PIXEL_ID, ...)` so it targets ONLY the
 * test pixel — NEVER bare fbq('track'|'trackCustom') (those fan out to the
 * GTM-loaded production pixel 791536550066080). Never imports dataLayer.js, never
 * calls the production CAPI. Persona/funnel telemetry also flows through
 * ayraJourney.emit() (separate sandbox broker).
 */

const SANDBOX = import.meta.env.VITE_AYRA_SANDBOX === "true";
const TEST_PIXEL_ID = import.meta.env.VITE_AYRA_TEST_PIXEL_ID || ""; // test pixel ONLY
const TEST_EVENT_CODE = import.meta.env.VITE_AYRA_TEST_EVENT_CODE || ""; // Meta Test Events

let _inited = false;
function ensureInit() {
  if (_inited || !TEST_PIXEL_ID || typeof window === "undefined" || !window.fbq) return _inited;
  try { window.fbq("init", TEST_PIXEL_ID); _inited = true; } catch (_) {}
  return _inited;
}

const enabled = () => SANDBOX && !!TEST_PIXEL_ID && typeof window !== "undefined" && !!window.fbq;

/**
 * Fire ONE custom event to the test pixel only. Silent no-op off-sandbox / when no
 * test pixel is set (so the page is safe until the founder configures the env vars).
 */
export function track(event, params = {}) {
  if (!enabled()) {
    if (SANDBOX) console.debug("[AYRA showroom] event (no test pixel):", event, params);
    return;
  }
  if (!ensureInit()) return;
  try {
    const opts = TEST_EVENT_CODE ? { test_event_code: TEST_EVENT_CODE } : undefined;
    window.fbq("trackSingleCustom", TEST_PIXEL_ID, event, params, opts);
  } catch (_) { /* never block the shopper */ }
}

// ── semantic stage helpers (persona funnel) ──────────────────────────────────
export const showroomView   = (occasion) => track("AyraShowroomView", { occasion: occasion || "" });
export const styled         = (label)    => track("AyraStyled", { style: label || "" });
export const productShown    = (id, name) => track("AyraProductShown", { content_ids: id ? [id] : [], name: name || "" });
export const addToCart       = (id, size, value, currency = "INR") =>
  track("AyraAddToCart", { content_ids: id ? [id] : [], size: size || "", value: value || 0, currency });
export const initiateCheckout = (value, currency = "INR") =>
  track("AyraInitiateCheckout", { value: value || 0, currency });
export const purchase        = (value, ids = [], currency = "INR") =>
  track("AyraPurchase", { value: value || 0, currency, content_ids: ids });
// persona signal — socially-active, high-intent premium shopper
export const highIntent      = (reason) => track("AyraHighIntent", { reason: reason || "" });

export default { track, showroomView, styled, productShown, addToCart, initiateCheckout, purchase, highIntent };
