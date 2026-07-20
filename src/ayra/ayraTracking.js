/**
 * AYRA Shopper — sandbox-safe tracking.
 *
 * ISOLATION: this file must NEVER touch the currently-running production Meta
 * setup. It is a hard no-op unless VITE_AYRA_SANDBOX === 'true', and even then
 * it only ever uses a TEST pixel id + Meta Test-Event-Code supplied via env.
 * It never references the production pixel (791536550066080) and never calls the
 * live CAPI. Real, deduped production tracking is wired only at the promotion
 * step (sandbox → staging → production), separately.
 */

const SANDBOX = import.meta.env.VITE_AYRA_SANDBOX === "true";
const TEST_PIXEL_ID = import.meta.env.VITE_AYRA_TEST_PIXEL_ID || ""; // test pixel ONLY
const TEST_EVENT_CODE = import.meta.env.VITE_AYRA_TEST_EVENT_CODE || ""; // Meta Test Events

// India-first phone normalisation → "91XXXXXXXXXX".
function normalizePhone(raw) {
  if (!raw) return "";
  let d = String(raw).replace(/[^\d]/g, "");
  if (!d) return "";
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  if (d.length === 10) d = "91" + d;
  return d;
}
const lc = (v) => (v ? String(v).trim().toLowerCase() : "");

function advancedMatching(user = {}) {
  const am = {};
  const ph = normalizePhone(user.phone || user.mobile);
  if (ph) am.ph = ph; // PHONE FIRST — India's strongest PII
  if (user.email) am.em = lc(user.email);
  if (user.firstName || user.first_name) am.fn = lc(user.firstName || user.first_name);
  if (user.lastName || user.last_name) am.ln = lc(user.lastName || user.last_name);
  if (user.customerId || user.customer_id) am.external_id = String(user.customerId || user.customer_id);
  am.country = "in";
  return am;
}

/**
 * Register phone-first Advanced Matching for the shopper — sandbox/test only.
 * No-op in every non-sandbox context.
 */
export function identifyForMeta(user) {
  if (!SANDBOX || typeof window === "undefined") return;
  const am = advancedMatching(user || {});
  if (!am.ph && !am.em) return; // guests: nothing to match

  // Sandbox visibility: never hits production. Only fires if a TEST pixel is set.
  if (TEST_PIXEL_ID && window.fbq) {
    try {
      window.fbq("init", TEST_PIXEL_ID, am);
      if (TEST_EVENT_CODE) {
        window.fbq("trackSingle", TEST_PIXEL_ID, "PageView", {}, { test_event_code: TEST_EVENT_CODE });
      }
    } catch (_) { /* ignore */ }
  } else {
    // eslint-disable-next-line no-console
    console.debug("[AYRA sandbox] identify (no test pixel configured):", Object.keys(am));
  }
}

export default { identifyForMeta };
