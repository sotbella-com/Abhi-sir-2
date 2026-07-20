/**
 * AYRA live co-view — streams a MASKED rrweb recording of the shopper's screen to
 * the broker so the founder + engineer can watch live in the ops console and fix
 * in real time. Privacy-first: all input values are masked at capture (never
 * transmitted), and the broker keeps the stream in-memory only (no persistence).
 * Gated by VITE_AYRA_ENABLED. Best-effort; never blocks the shopper.
 */
import * as rrweb from "rrweb";

const SESSION_URL = import.meta.env.VITE_AYRA_SESSION_URL || "";
const LIVE_URL =
  import.meta.env.VITE_AYRA_LIVE_URL ||
  (SESSION_URL ? SESSION_URL.replace(/\/session\/?$/, "") + "/ayra/live" : "");

function sid() {
  try {
    let s = sessionStorage.getItem("ayra_sid");
    if (!s) { s = "as_" + (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)); sessionStorage.setItem("ayra_sid", s); }
    return s;
  } catch { return "as_" + Date.now().toString(36); }
}
function customerNo() {
  try { const t = JSON.parse(localStorage.getItem("auth_token") || "null"); return (t && t.kind === "user" && (t.customer_id || t.customer_no)) || ""; } catch { return ""; }
}

let stopFn = null, buffer = [], flushTimer = null;

function flush() {
  if (!buffer.length || !LIVE_URL) return;
  const events = buffer; buffer = [];
  try {
    const body = JSON.stringify({ session_id: sid(), events, path: location.pathname, customer_no: customerNo() });
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon && navigator.sendBeacon(LIVE_URL, blob)) return;
    fetch(LIVE_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  } catch {}
}

export function startLive() {
  if (stopFn || !LIVE_URL || import.meta.env.VITE_AYRA_ENABLED !== "true") return;
  try {
    stopFn = rrweb.record({
      emit: (e) => { buffer.push(e); if (buffer.length > 60) flush(); },
      maskAllInputs: true,                 // never capture typed values (PII/passwords)
      maskInputOptions: { password: true, email: true, tel: true },
      recordCanvas: false,
      collectFonts: false,
      sampling: { mousemove: 120, scroll: 200, input: "last" },
      slimDOMOptions: { comment: true, headMetaSocial: true },
    });
    flushTimer = setInterval(flush, 1500);
    window.addEventListener("pagehide", flush);
  } catch {}
}

export function stopLive() {
  try { stopFn && stopFn(); } catch {}
  stopFn = null;
  clearInterval(flushTimer);
  flush();
}

export default { startLive, stopLive };
