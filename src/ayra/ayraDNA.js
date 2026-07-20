/**
 * Fashion-DNA client — the astrological archetype/energy comes from the SATYA
 * mechanism (server-side via the broker; key never in the browser). This just
 * requests the DNA and caches it for the session. Until Satya is configured the
 * broker returns { pending:true } and the wardrobe shows a graceful state.
 */
const SESSION_URL = import.meta.env.VITE_AYRA_SESSION_URL || "";
const DNA_URL =
  import.meta.env.VITE_AYRA_DNA_URL ||
  (SESSION_URL ? SESSION_URL.replace(/\/session\/?$/, "") + "/ayra/dna" : "");

function customerNo() {
  try { const t = JSON.parse(localStorage.getItem("auth_token") || "null"); return (t && t.kind === "user" && (t.customer_id || t.customer_no)) || ""; } catch { return ""; }
}

let cached = null; // last DNA for this session

export function getCachedDNA() { return cached; }

/** Request Fashion-DNA from Satya (via broker). input: {dob, tob, place, name, occasion}.
 *  Satya computes async; the broker returns {computing} until ready, so we poll a few
 *  times (Vedic compute ~15-25s). */
export async function fetchDNA(input = {}) {
  if (!DNA_URL) return { ok: false, pending: true };
  const body = JSON.stringify({ ...input, customer_no: customerNo() });
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const r = await fetch(DNA_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body });
      const data = await r.json().catch(() => ({}));
      if (data && data.ok && data.dna) {
        cached = data.dna;
        try { sessionStorage.setItem("ayra_dna", JSON.stringify(cached)); } catch {}
        return { ok: true, dna: cached };
      }
      if (data?.reason) return { ok: false, pending: true };       // not configured — don't poll
      if (data?.error && !data?.computing) return { ok: false, error: data.error };
    } catch (e) { if (attempt >= 7) return { ok: false, error: String(e?.message || e).slice(0, 120) }; }
    await new Promise((res) => setTimeout(res, 2800));             // wait, then retry
  }
  return { ok: false, pending: true };                            // still computing
}

// Restore a DNA captured earlier this session.
try { const s = sessionStorage.getItem("ayra_dna"); if (s) cached = JSON.parse(s); } catch {}

export default { fetchDNA, getCachedDNA };
