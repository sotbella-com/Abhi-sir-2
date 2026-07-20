/**
 * AYRA journey telemetry — logs every step of a shopper's AYRA-guided journey to
 * the sandbox journey store (via the broker's /ayra/journey endpoint) so we can
 * measure the funnel and drive conversion toward 10%. Sandbox-isolated: fire-and-
 * forget, no production CAPI/pixel. No-op if the endpoint isn't configured.
 */
const SESSION_URL = import.meta.env.VITE_AYRA_SESSION_URL || "";
// Derive the journey endpoint from the broker origin (…/session -> …/ayra/journey).
const JOURNEY_URL =
  import.meta.env.VITE_AYRA_JOURNEY_URL ||
  (SESSION_URL ? SESSION_URL.replace(/\/session\/?$/, "") + "/ayra/journey" : "");

const cookie = (name) => {
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : "";
};

function sessionId() {
  try {
    let s = sessionStorage.getItem("ayra_sid");
    if (!s) {
      s = "as_" + (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
      sessionStorage.setItem("ayra_sid", s);
    }
    return s;
  } catch { return "as_" + Date.now().toString(36); }
}

function identity() {
  const id = { customer_no: "", email: "", phone: "" };
  try {
    const tok = JSON.parse(localStorage.getItem("auth_token") || "null");
    if (tok && tok.kind === "user") {
      id.customer_no = tok.customer_id || tok.customer_no || "";
      id.email = (tok.email || "").toLowerCase();
      id.phone = tok.phone || tok.mobile || "";
    }
  } catch {}
  return id;
}

let seq = 0;

// Readable session memory so AYRA can recall THIS visit (searches/views) — the
// broker log is write-only. Kept small in sessionStorage.
export function recallSession() {
  try { return JSON.parse(sessionStorage.getItem("ayra_session_log") || "[]"); } catch { return []; }
}
function remember(step, data) {
  try {
    const log = recallSession();
    log.push({ step, data, ts: Date.now() });
    sessionStorage.setItem("ayra_session_log", JSON.stringify(log.slice(-40)));
  } catch {}
}

/** Emit one journey event. step e.g. 'session_start','search','view_product',
 *  'size_ask','add_to_cart','add_to_cart_failed','wishlist','checkout','session_end'. */
export function emit(step, data = {}) {
  remember(step, data); // readable session memory (works even if broker is off)
  if (!JOURNEY_URL || import.meta.env.VITE_AYRA_ENABLED !== "true") return;
  try {
    const body = JSON.stringify({
      session_id: sessionId(),
      seq: ++seq,
      step,
      data,
      path: location.pathname,
      ts: new Date().toISOString(),
      ...identity(),
      fbp: cookie("_fbp"),
      fbc: cookie("_fbc"),
      ua: navigator.userAgent.slice(0, 180),
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    });
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon && navigator.sendBeacon(JOURNEY_URL, blob)) return;
    fetch(JOURNEY_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  } catch {}
}

export default { emit };
