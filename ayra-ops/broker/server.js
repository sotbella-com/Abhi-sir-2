/**
 * AYRA Shopper — sandbox signed-URL broker.
 *
 * The storefront SPA can't hold the ElevenLabs API key, so this tiny isolated
 * service mints a short-lived signed WebSocket URL for the SANDBOX shopper agent.
 *
 * ISOLATION: this is its own service with its own env. It uses a SANDBOX
 * ElevenLabs key + the SANDBOX agent id only. It does NOT import, call, or share
 * anything with the live sotbella-brain / production CAPI / production agent.
 *
 * Env:
 *   ELEVENLABS_API_KEY     sandbox key (xi-api-key)
 *   AYRA_SANDBOX_AGENT_ID  the "AYRA Shopper — Sandbox" agent id
 *   ALLOWED_ORIGINS        comma-separated origins allowed to call /session
 *                          (e.g. https://sotbella-storefront-demo-production.up.railway.app)
 *   PORT                   default 8080
 */
import express from "express";

const app = express();
const PORT = process.env.PORT || 8080;
const API_KEY = process.env.ELEVENLABS_API_KEY || "";
const AGENT_ID = process.env.AYRA_SANDBOX_AGENT_ID || "";
const ALLOWED = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// ── CORS (explicit allow-list; "*" only if none configured, for local dev) ──
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!ALLOWED.length) res.setHeader("Access-Control-Allow-Origin", "*");
  else if (origin && ALLOWED.includes(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-live-key");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use(express.json({ limit: "16kb" }));

// Sandbox journey store (isolated). Anon key + insert-only RLS policy.
const SB_URL = process.env.SUPABASE_URL || "";
const SB_KEY = process.env.SUPABASE_ANON_KEY || "";

app.get("/health", (_req, res) => res.json({ ok: true, agent: AGENT_ID ? "set" : "missing", journey: SB_URL ? "set" : "off" }));

// AYRA journey telemetry -> Supabase ayra_journey_events (fire-and-forget).
app.post("/ayra/journey", async (req, res) => {
  if (!SB_URL || !SB_KEY) return res.status(204).end();
  try {
    const b = req.body || {};
    const row = {
      session_id: (b.session_id || "").slice(0, 80),
      seq: Number.isFinite(b.seq) ? b.seq : null,
      step: (b.step || "").slice(0, 40),
      customer_no: (b.customer_no || "").slice(0, 64),
      email: (b.email || "").toLowerCase().slice(0, 200),
      phone: String(b.phone || "").replace(/[^\d]/g, "").slice(0, 20),
      path: (b.path || "").slice(0, 200),
      data: b.data || {},
      fbp: (b.fbp || "").slice(0, 80),
      fbc: (b.fbc || "").slice(0, 120),
      ua: (b.ua || "").slice(0, 200),
      viewport: (b.viewport || "").slice(0, 20),
    };
    await fetch(`${SB_URL}/rest/v1/ayra_journey_events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, Prefer: "return=minimal" },
      body: JSON.stringify(row),
    });
  } catch (e) { /* never block the shopper */ }
  return res.status(204).end();
});

app.get("/session", async (_req, res) => {
  if (!API_KEY || !AGENT_ID) {
    return res.status(500).json({ error: "broker not configured (ELEVENLABS_API_KEY / AYRA_SANDBOX_AGENT_ID)" });
  }
  try {
    const r = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${encodeURIComponent(AGENT_ID)}`,
      { headers: { "xi-api-key": API_KEY } }
    );
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data?.detail || data || "elevenlabs error" });
    // ElevenLabs returns { signed_url }.
    return res.json({ signedUrl: data.signed_url });
  } catch (e) {
    return res.status(502).json({ error: String(e?.message || e).slice(0, 160) });
  }
});

// ── Fashion-DNA via the Satya mechanism (key stays server-side) ──────────────
// The astrological archetype/energy/"what she wants" is Satya's engine. This
// proxies the shopper's birth data to the Satya API and maps its response to the
// wardrobe's DNA shape. Returns { pending:true } until SATYA_* creds are set.
const SATYA_URL = process.env.SATYA_API_URL || "https://vivacious-adaptation-production-f466.up.railway.app/api/aira/fashion-blueprint";
const SATYA_KEY = process.env.SATYA_API_KEY || "";
// Satya's contract: auth via the x-partner-key header.
const SATYA_AUTH_HEADER = process.env.SATYA_AUTH_HEADER || "";

// Map the Satya /api/aira/fashion-blueprint response to the wardrobe's DNA shape.
// Satya returns: style_archetype, archetype_story, signature_pieces, power_palette,
// opening_line, current_energy, sotbella_angle.
function mapSatyaDNA(r = {}) {
  const d = r.fashion_dna || r.dna || r.data || r.result || r;
  const arr = (v) => (Array.isArray(v) ? v : v ? [v] : []);
  // power_palette is an object {primary,secondary,accent,neutrals,names[]} OR an array.
  let palette = [], palette_names = [];
  const pp = d.power_palette || d.palette || d.colors;
  const isHex = (x) => typeof x === "string" && /^#?[0-9a-fA-F]{3,8}$/.test(x.trim());
  if (pp && typeof pp === "object" && !Array.isArray(pp)) {
    palette = [pp.primary, pp.secondary, pp.accent, ...arr(pp.neutrals)].filter(isHex);
    palette_names = arr(pp.names);
  } else {
    const a = arr(pp);
    palette = a.map((x) => (typeof x === "string" ? x : x?.hex || x?.color || x?.value || "")).filter(isHex);
    palette_names = a.map((x) => (typeof x === "string" ? "" : x?.name || "")).filter(Boolean);
  }
  const pieces = arr(d.signature_pieces || d.pieces).map((p) => (typeof p === "string" ? p : p?.name || p?.piece || "")).filter(Boolean);
  const vibe = arr(d.vibe_keywords).length ? arr(d.vibe_keywords).join(" · ") : (d.vibe || d.current_energy || "");
  return {
    style_name: d.style_archetype || d.style_name || d.archetype || "",
    archetype_story: d.archetype_story || d.story || "",
    vibe,
    palette: palette.slice(0, 5),
    palette_names: palette_names.slice(0, 5),
    signature_pieces: pieces.slice(0, 6),
    occasion_matrix: d.occasion_matrix || {},
    opening_line: d.opening_line || d.greeting || "",
    element: d.element || "",
    nakshatra: d.nakshatra || "",
    energy: d.current_energy || d.energy || "",
    sotbella_angle: d.sotbella_angle || "",
    avoid: d.avoid || "",
    _source: "satya",
  };
}

// Satya's Vedic compute is slow (~15-25s) — longer than an ElevenLabs client-tool
// can wait. So we cache DNA and compute ASYNC: the first call kicks off Satya and
// returns {computing}; the DNA is ready (cached) on a follow-up call within seconds.
const DNA_CACHE = new Map(); // key -> { dna, at }
const DNA_INFLIGHT = new Set();
const dnaKey = (b) => [b.dob, b.tob, b.place, b.occasion].join("|");

// ── De-astrologise: AYRA must sound like a stylist who KNOWS her, never a fortune-
// teller. Strip all astrology (nakshatra/dasha/rashi/sign/planet/rising) from the
// spoken copy while keeping the style essence. Claude rewrite; rules-scrub fallback.
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || "";
const ASTRO_RE = /\b(nakshatra|dasha|rashi|rising|ascendant|zodiac|horoscope|astrolog\w*|natal|planetary|aries|taurus|gemini|cancer|leo|virgo|libra|scorpio|sagittarius|capricorn|aquarius|pisces|venus|mars|jupiter|saturn|mercury|moon sign|sun sign|jyeshtha|anuradha|rohini|ashwini|bharani|krittika|mrigashira|ardra|punarvasu|pushya|ashlesha|magha|revati)\b/i;
const scrub = (t) => !t ? "" : String(t).split(/(?<=[.!?])\s+/).filter((s) => !ASTRO_RE.test(s)).join(" ").trim();

async function deAstro(dna, name) {
  const fb = { opening_line: scrub(dna.opening_line), who_she_is: scrub(dna.archetype_story || dna.vibe), style_name: ASTRO_RE.test(dna.style_name || "") ? "" : dna.style_name };
  if (!ANTHROPIC_KEY) return fb;
  try {
    const sys = "You are Sotbella's fashion stylist copywriter. Rewrite the input style profile into warm, human, aspirational STYLE language that makes her feel deeply seen. ABSOLUTE RULE: NO astrology — never mention nakshatra, dasha, rashi, zodiac signs, planets, rising/ascendant, moon/sun signs, elements-as-astrology, or horoscopes. Translate any cosmic language into fashion + emotion (textures, silhouettes, mood, energy). Return ONLY JSON: {\"opening_line\":\"1-2 warm sentences, use her name if given, make her feel understood, NO astrology, invite her in\",\"who_she_is\":\"one-sentence style brief\",\"style_name\":\"a chic 2-4 word style label, no astrology\"}.";
    const body = { model: "claude-haiku-4-5-20251001", max_tokens: 400, system: sys,
      messages: [{ role: "user", content: JSON.stringify({ name, style_name: dna.style_name, story: dna.archetype_story, vibe: dna.vibe, energy: dna.energy, palette_names: dna.palette_names, signature_pieces: dna.signature_pieces, opening_line: dna.opening_line }) }] };
    const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "content-type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" }, body: JSON.stringify(body) });
    const d = await r.json();
    const txt = d?.content?.[0]?.text || "";
    const m = txt.match(/\{[\s\S]*\}/);
    const j = m ? JSON.parse(m[0]) : {};
    return { opening_line: j.opening_line || fb.opening_line, who_she_is: j.who_she_is || fb.who_she_is, style_name: j.style_name || fb.style_name || dna.style_name };
  } catch (e) { return fb; }
}

async function computeSatya(payload, key) {
  DNA_INFLIGHT.add(key);
  try {
    const headers = { "Content-Type": "application/json", "x-partner-key": SATYA_KEY };
    if (SATYA_AUTH_HEADER && SATYA_AUTH_HEADER !== "x-partner-key") headers[SATYA_AUTH_HEADER] = SATYA_KEY;
    const r = await fetch(SATYA_URL, { method: "POST", headers, body: JSON.stringify(payload) });
    const data = await r.json().catch(() => ({}));
    if (r.ok) {
      const dna = mapSatyaDNA(data);
      const clean = await deAstro(dna, payload.name);       // strip astrology from spoken copy
      dna.opening_line = clean.opening_line || dna.opening_line;
      dna.who_she_is = clean.who_she_is || "";
      if (clean.style_name) dna.style_name = clean.style_name;
      dna.vibe = scrub(dna.vibe);        // safety net — drop any astrology from vibe/energy
      dna.energy = scrub(dna.energy);
      DNA_CACHE.set(key, { dna, at: Date.now() });
    }
  } catch (e) { /* leave uncached; caller retries */ } finally { DNA_INFLIGHT.delete(key); }
}

app.post("/ayra/dna", (req, res) => {
  if (!SATYA_URL || !SATYA_KEY) return res.json({ ok: false, pending: true, reason: "Satya API not configured yet" });
  const b = req.body || {};
  if (!b.dob) return res.json({ ok: false, error: "date of birth required" });
  const key = dnaKey(b);
  const hit = DNA_CACHE.get(key);
  if (hit) return res.json({ ok: true, dna: hit.dna });
  if (!DNA_INFLIGHT.has(key)) {
    computeSatya({ name: b.name, dob: b.dob, tob: b.tob, place: b.place, occasion: b.occasion, customer_no: b.customer_no }, key);
  }
  return res.json({ ok: false, pending: true, computing: true });
});

// ── Live co-view relay (in-memory, ephemeral; NO persistence of replay data) ──
// Storefront streams masked rrweb events here; the ops live viewer polls them.
// Sessions auto-expire; inputs are masked at capture on the storefront side.
const LIVE = new Map(); // session_id -> { events:[], lastAt, path, customer_no }
const LIVE_MAX = 2500;  // cap events per session (drop oldest)
const LIVE_TTL = 5 * 60 * 1000;
setInterval(() => { const now = Date.now(); for (const [k, v] of LIVE) if (now - v.lastAt > LIVE_TTL) LIVE.delete(k); }, 60 * 1000).unref?.();

app.post("/ayra/live", (req, res) => {
  try {
    const b = req.body || {};
    const sid = String(b.session_id || "").slice(0, 80);
    const events = Array.isArray(b.events) ? b.events : [];
    if (!sid || !events.length) return res.status(204).end();
    let s = LIVE.get(sid);
    if (!s) { s = { events: [], lastAt: 0, path: "", customer_no: "" }; LIVE.set(sid, s); }
    s.events.push(...events);
    if (s.events.length > LIVE_MAX) s.events.splice(0, s.events.length - LIVE_MAX);
    s.lastAt = Date.now();
    if (b.path) s.path = String(b.path).slice(0, 200);
    if (b.customer_no) s.customer_no = String(b.customer_no).slice(0, 64);
  } catch (e) { /* never block the shopper */ }
  return res.status(204).end();
});

// Reads require the ops live key (server-side auth). Writes (POST /ayra/live) stay
// open like other telemetry, but carry only masked, in-memory-only data.
const LIVE_KEY = process.env.LIVE_VIEW_KEY || "";
function liveAuth(req, res) {
  if (!LIVE_KEY) { res.status(503).json({ error: "live view not configured" }); return false; }
  const k = req.headers["x-live-key"] || (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (k !== LIVE_KEY) { res.status(401).json({ error: "unauthorized" }); return false; }
  return true;
}

app.get("/ayra/live/sessions", (req, res) => {
  if (!liveAuth(req, res)) return;
  const now = Date.now();
  const list = [];
  for (const [sid, s] of LIVE) list.push({ session_id: sid, path: s.path, customer_no: s.customer_no, events: s.events.length, idle_ms: now - s.lastAt });
  list.sort((a, b) => a.idle_ms - b.idle_ms);
  res.json({ sessions: list.slice(0, 30) });
});

app.get("/ayra/live/:sid", (req, res) => {
  if (!liveAuth(req, res)) return;
  const s = LIVE.get(req.params.sid);
  if (!s) return res.json({ from: 0, count: 0, total: 0, events: [] });
  const since = Math.max(0, parseInt(req.query.since || "0", 10) || 0);
  const events = s.events.slice(since);
  res.json({ from: since, count: events.length, total: s.events.length, events });
});

app.listen(PORT, () => console.log(`AYRA sandbox broker on :${PORT} (agent ${AGENT_ID || "unset"})`));
