/**
 * AYRA ⇄ native (Flutter) bridge.
 *
 * When AYRA runs inside the Sotbella Flutter app, the app injects a JavaScript
 * channel `window.SotbellaBridge` (Flutter `addJavaScriptChannel`). This module
 * lets AYRA hand cart/checkout/navigation OFF TO THE NATIVE APP so buying happens
 * on the native cart → native Blaze payment + native FB logAddToCart/logPurchase
 * (Meta attribution + payment stay native). In a normal browser there is no
 * channel, so `isNative()` is false and everything falls back to the web path —
 * the web storefront is completely unaffected.
 *
 * Direction:
 *   JS → native : window.SotbellaBridge.postMessage(JSON)  (fire-and-forget)
 *   native → JS : native runs window.__AYRA_LAUNCH__ / window.__AYRA_IDENTITY__ /
 *                 dispatches an "ayra:start" event before/after page load.
 */

export function isNative() {
  try {
    return typeof window !== "undefined" &&
      !!window.SotbellaBridge &&
      typeof window.SotbellaBridge.postMessage === "function";
  } catch { return false; }
}

/** Post one typed message to the native host. No-op (returns false) off-app. */
export function send(type, payload = {}) {
  if (!isNative()) return false;
  try {
    window.SotbellaBridge.postMessage(JSON.stringify({ type, ...payload }));
    return true;
  } catch { return false; }
}

/**
 * Launch context for an ad-landing open. Native sets `window.__AYRA_LAUNCH__`
 * before load; we also read the URL query (?occasion=&product=&campaign=&utm_*)
 * so the same /ayra page works from a plain browser link too.
 */
export function getLaunchParams() {
  const out = {};
  try {
    const nat = window.__AYRA_LAUNCH__;
    if (nat && typeof nat === "object") Object.assign(out, nat);
  } catch {}
  try {
    const q = new URLSearchParams(window.location.search || "");
    for (const k of ["occasion", "product", "campaign", "source", "medium",
      "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
      const v = q.get(k);
      if (v && !out[k]) out[k] = v;
    }
  } catch {}
  return out;
}

/** Identity the native app knows (native login) so fusion/attribution match. */
export function getNativeIdentity() {
  try {
    const id = window.__AYRA_IDENTITY__;
    if (id && typeof id === "object") return id;
  } catch {}
  return null;
}

/**
 * Subscribe to native "start AYRA now" pings (corner-mic tap / deep-link open).
 * Native dispatches a CustomEvent("ayra:start", {detail:{...launchParams}}) or
 * simply calls window.dispatchEvent(new Event("ayra:start")).
 */
export function onLaunch(cb) {
  if (typeof window === "undefined") return () => {};
  const handler = (e) => { try { cb(e?.detail || getLaunchParams()); } catch {} };
  window.addEventListener("ayra:start", handler);
  return () => window.removeEventListener("ayra:start", handler);
}

export default { isNative, send, getLaunchParams, getNativeIdentity, onLaunch };
