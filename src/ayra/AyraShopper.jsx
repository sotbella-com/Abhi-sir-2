/**
 * AYRA — Sotbella's conscious web copilot (customer-facing).
 *
 * A living WebGL orb FLOATS on every page of the site. Tap it and AYRA talks —
 * then she assists directly ON the web: navigates the real store, highlights the
 * pieces she's speaking about in place, opens the cart drawer for express buy.
 * No side panel, no wardrobe overlay — the website itself is her showroom.
 * Self-hosted sandbox agent via the broker; no satya.org / prod pixel / prod
 * agent. Gated by VITE_AYRA_ENABLED.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useConversation } from "@elevenlabs/react";

import { useAddToCart } from "../Hooks/useAddToCart.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useWishlistStore } from "../context/wishlistStore.js";
import { searchProductsByQuery, searchCategoryProductsEnhanced } from "../api/services/enhancedProductSearch.js";
import { getProductDetails } from "../api/services/sfccSearchService.js";
import { createAyraTools } from "./ayraActions.js";
import { createOrb } from "./ayraOrb.js";
import { emit } from "./ayraJourney.js";
import { startLive, stopLive } from "./ayraLive.js";
import { fetchDNA, getCachedDNA } from "./ayraDNA.js";
import { buildProfile } from "./ayraProfile.js";
import { isNative, getLaunchParams, onLaunch } from "./ayraBridge.js";
import { isShowroom } from "./showroomMode.js";
import { styled as evStyled, purchase as evPurchase } from "./ayraEvents.js";
import { msSinceExplicitHighlight, HIGHLIGHT_STOPWORDS } from "./highlightSync.js";
import ShowroomGlow from "./ShowroomGlow.jsx";
import BirthDetails from "./BirthDetails.jsx";
import { identifyForMeta } from "./ayraTracking.js";
import "./ayraShopper.css";

const AYRA_ENABLED = import.meta.env.VITE_AYRA_ENABLED === "true";
const SESSION_URL = import.meta.env.VITE_AYRA_SESSION_URL || "";

export default function AyraShopper() {
  if (!AYRA_ENABLED) return null;
  return <AyraShopperInner />;
}

// Map a route to a shopping stage so AYRA can OBSERVE the whole journey.
const stageOf = (path) => {
  if (path.startsWith("/product/")) return "viewing a product page";
  if (path.startsWith("/search")) return "browsing search results";
  if (path.startsWith("/category")) return "browsing a category edit";
  if (path === "/cart") return "reviewing her bag";
  if (path === "/shipping" || path.startsWith("/address")) return "CHECKOUT: address & delivery stage";
  if (path.includes("checkout") || path.includes("payment")) return "CHECKOUT: payment stage";
  if (path === "/thankyou" || path === "/greetthankyou") return "ORDER PLACED";
  return null;
};

function AyraShopperInner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useAddToCart();
  const auth = useAuth?.() || {};
  const addToWishlist = useWishlistStore((s) => s.addToWishlist);
  const firstName = (auth?.user?.firstName || auth?.user?.first_name || "").trim();

  const [products, setProducts] = useState([]); // what AYRA is narrating (for speech-highlight; never rendered)
  const [proofs, setProofs] = useState([]);     // live "conscious" proof feed
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState(null);
  const [dna, setDna] = useState(getCachedDNA());
  const [showroom, setShowroomState] = useState(isShowroom());
  const [noisy, setNoisy] = useState(false); // live background-noise detection
  const [birthTier, setBirthTier] = useState(null); // "birthday" | "full" — Cosmic-read capture

  const applyDNA = useCallback(async (input) => {
    const r = await fetchDNA(input || {});
    if (r.ok) { setDna(r.dna); try { evStyled(r.dna?.style_name); } catch {} return r.dna; }
    return null;
  }, []);

  const canvasRef = useRef(null);
  const orbRef = useRef(null);
  const convRef = useRef(null);
  const profileRef = useRef(null); // fused "who she is" (Aatman) — built once
  const launchRef = useRef({});    // ad-landing context (occasion/campaign)
  const thinkTimer = useRef(null);
  const productsRef = useRef([]);
  productsRef.current = products;

  const pushProof = useCallback((label) => {
    const id = Date.now() + ":" + Math.random().toString(36).slice(2, 6);
    setProofs((p) => [...p.slice(-2), { id, label }]);
    setThinking(true);
    clearTimeout(thinkTimer.current);
    thinkTimer.current = setTimeout(() => setThinking(false), 1500);
    setTimeout(() => setProofs((p) => p.filter((x) => x.id !== id)), 4200);
  }, []);

  // Voice-synced highlight (FALLBACK ONLY — the agent's explicit highlight_product is
  // the source of truth). Matches AYRA's DISTINCTIVE words against the pieces she pulled
  // up and glows the card ON THE PAGE — but never fights an explicit highlight, never
  // fires on generic words ("dress/black/slip"), and retries once after navigation render.
  const glow = (id) => {
    const el = document.querySelector(`[data-product-id="${id}"]`);
    if (!el) return false;
    document.querySelectorAll(".ayra-highlight").forEach((n) => { if (n !== el) n.classList.remove("ayra-highlight"); });
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ayra-highlight");
    setTimeout(() => el.classList.remove("ayra-highlight"), 3000);
    return true;
  };
  const highlightFromSpeech = useCallback((text) => {
    if (msSinceExplicitHighlight() < 2500) return; // she just pointed at a piece — don't fight it
    const words = text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/)
      .filter((w) => w.length > 3 && !HIGHLIGHT_STOPWORDS.has(w));
    if (!words.length) return;
    let best = null, bestScore = 0;
    for (const p of productsRef.current) {
      const name = (p.name || "").toLowerCase();
      const score = words.reduce((s, w) => s + (name.includes(w) ? 1 : 0), 0);
      if (score > bestScore) { bestScore = score; best = p.id; }
    }
    // Require a DISTINCTIVE match (≥2 tokens) so a single generic word can't mis-glow.
    if (!best || bestScore < 2) return;
    if (!glow(best)) setTimeout(() => glow(best), 420); // card may not be rendered yet (just navigated)
  }, []);

  const deps = useRef({});
  deps.current = {
    navigate, addToCart, setProducts, onToolActivity: pushProof,
    searchProductsByQuery, searchCategoryProductsEnhanced, getProductDetails,
    applyDNA,
    openBirthCapture: (tier) => { setBirthTier(tier === "birthday" ? "birthday" : "full"); return true; },
    getProfile: async () => { if (!profileRef.current) { try { profileRef.current = await buildProfile(); } catch {} } return profileRef.current; },
    wishlistAdd: async (id) => {
      if (!auth?.isAuthenticated) { navigate("/main-login"); return { ok: false }; }
      await addToWishlist({ item: { id }, isAuthenticated: auth.isAuthenticated, navigate });
      return { ok: true };
    },
  };

  const clientTools = useMemo(() => createAyraTools({
    navigate: (p) => deps.current.navigate(p),
    addToCart: (...a) => deps.current.addToCart(...a),
    setProducts: (x) => deps.current.setProducts(x),
    onToolActivity: (l) => deps.current.onToolActivity(l),
    searchProductsByQuery: (...a) => deps.current.searchProductsByQuery(...a),
    searchCategoryProductsEnhanced: (...a) => deps.current.searchCategoryProductsEnhanced(...a),
    getProductDetails: (...a) => deps.current.getProductDetails(...a),
    wishlistAdd: (...a) => deps.current.wishlistAdd(...a),
    applyDNA: (...a) => deps.current.applyDNA(...a),
    openBirthCapture: (...a) => deps.current.openBirthCapture(...a),
    getProfile: () => deps.current.getProfile(),
  }), []);

  // Birth-details panel submit → Satya Cosmic read → tell the LIVE agent her archetype
  // so she styles from it instantly (no re-ask). De-astrologised at the broker.
  const onBirthSubmit = useCallback(async ({ dob, tob, place }) => {
    const dna = await applyDNA({ dob, tob, place });
    setBirthTier(null);
    try {
      if (dna?.style_name) {
        convRef.current?.sendContextualUpdate?.(
          `[read] Her style archetype is ${dna.style_name}${dna.vibe ? " — " + dna.vibe : ""}` +
          `${dna.palette_names?.length ? "; palette " + dna.palette_names.join(", ") : ""}. ` +
          `Style everything from this and make her feel deeply SEEN. NEVER say anything astrological.`);
      } else {
        convRef.current?.sendContextualUpdate?.(
          "[read] Her style read is still calibrating — curate from the collection and name it once it's ready; do NOT invent an archetype.");
      }
    } catch {}
  }, [applyDNA]);

  const conversation = useConversation({
    clientTools,
    onConnect: () => setError(null),
    onError: (e) => setError(String(e?.message || e || "connection error").slice(0, 120)),
    onMessage: (m) => {
      const text = m?.message ?? m?.text ?? "";
      if (text && m?.source !== "user") highlightFromSpeech(text);
    },
  });
  convRef.current = conversation;

  const status = conversation.status;
  const connected = status === "connected";
  const connecting = status === "connecting";
  const speaking = connected && conversation.isSpeaking;

  // Floating orb — always mounted, site-wide.
  useEffect(() => {
    if (!canvasRef.current) return;
    const getAmp = () => {
      try {
        const c = convRef.current;
        const arr = (c?.isSpeaking ? c?.getOutputByteFrequencyData?.() : c?.getInputByteFrequencyData?.()) ||
          c?.getOutputByteFrequencyData?.();
        if (!arr || !arr.length) return 0;
        let sum = 0; for (let i = 0; i < arr.length; i += 4) sum += arr[i] * arr[i];
        return Math.min(1, (Math.sqrt(sum / (arr.length / 4)) / 255) * 2.4);
      } catch { return 0; }
    };
    orbRef.current = createOrb(canvasRef.current, { getAmp, onClick: () => {} });
    return () => { orbRef.current?.dispose?.(); orbRef.current = null; };
  }, []);

  // Drive orb state.
  useEffect(() => {
    const s = !connected ? (connecting ? "connecting" : "idle") : thinking ? "thinking" : speaking ? "speaking" : "listening";
    orbRef.current?.setState?.(s);
  }, [connected, connecting, speaking, thinking]);

  const start = useCallback(async () => {
    setError(null);
    if (!SESSION_URL) { setError("AYRA isn't configured yet."); return; }
    // Browser-level NOISE handling: suppression + echo cancel + auto-gain, so
    // AYRA hears her clearly in cafés/streets/parties.
    try {
      await navigator.mediaDevices.getUserMedia({
        audio: { noiseSuppression: true, echoCancellation: true, autoGainControl: true },
      });
    } catch { setError("Enable mic access and tap the orb again."); return; }
    try {
      const res = await fetch(SESSION_URL, { method: "GET" });
      const data = await res.json();
      const signedUrl = data.signedUrl || data.signed_url || data.url;
      if (!signedUrl) throw new Error("couldn't reach AYRA — try again in a moment");
      const prof = profileRef.current || {};
      const occasion = (launchRef.current?.occasion || "").toString().trim();
      const occasionOpener = occasion
        ? (prof.name
            ? `Welcome back, ${prof.name} — let's find your ${occasion} look.`
            : `Hi, I'm AYRA — let's style you for ${occasion}. Shall I show you the edit?`)
        : null;
      await conversation.startSession({
        signedUrl, connectionType: "websocket",
        dynamicVariables: {
          opening_line: dna?.opening_line || occasionOpener || (prof.name
            ? `Welcome back, ${prof.name} — I've been thinking about what you'll love next.`
            : "Hi, I'm AYRA — your Sotbella stylist. What's the social moment we're dressing for?"),
          style_archetype: dna?.style_name || prof.style_name || "",
          energy: dna?.energy || dna?.vibe || "",
          palette: (dna?.palette_names || prof.palette_names || []).join(", "),
          shopper_name: prof.name || "",
          fav_colors: (prof.fav_colors || []).join(", "),
          usual_size: prof.usual_size || "",
          city: prof.city || "",
          occasion,
        },
      });
      emit("session_start", { returning: !!firstName, occasion: occasion || undefined, campaign: launchRef.current?.campaign || launchRef.current?.utm_campaign || undefined, native: isNative() });
      identifyForMeta(auth?.user);
    } catch (e) { setError(String(e?.message || e).slice(0, 120)); }
  }, [conversation, auth, firstName, dna]);

  const stop = useCallback(async () => { emit("session_end", {}); try { await conversation.endSession(); } catch {} }, [conversation]);

  const toggle = useCallback(() => {
    if (connecting) return;
    if (connected) stop(); else start();
  }, [connected, connecting, start, stop]);

  useEffect(() => () => { conversation.endSession?.().catch(() => {}); clearTimeout(thinkTimer.current); }, []); // eslint-disable-line

  // Live co-view: stream a masked recording so ops can watch + fix in real time.
  useEffect(() => { startLive(); return () => stopLive(); }, []);

  // Pre-build the fused "who she is" profile so AYRA knows her from the first word.
  useEffect(() => { buildProfile().then((p) => { profileRef.current = p; }).catch(() => {}); }, []);

  // NOISE DETECTION: while she's listening (not speaking), watch the mic's energy
  // floor. Sustained high noise → show a hint + tell the agent ONCE to confirm
  // before acting on anything uncertain (mishears must never add/buy).
  const noiseToldRef = useRef(false);
  useEffect(() => {
    if (!connected) { setNoisy(false); return; }
    const t = setInterval(() => {
      try {
        const c = convRef.current;
        if (!c || c.isSpeaking) return;
        const arr = c.getInputByteFrequencyData?.();
        if (!arr || !arr.length) return;
        let sum = 0; for (let i = 0; i < arr.length; i += 2) sum += arr[i];
        const avg = sum / (arr.length / 2);
        const isNoisy = avg > 72; // persistent high floor ≈ crowd/traffic/music
        setNoisy((prev) => (isNoisy === prev ? prev : isNoisy));
        if (isNoisy && !noiseToldRef.current) {
          noiseToldRef.current = true;
          c.sendContextualUpdate?.(
            "[env] Background is NOISY where the shopper is. Speech may be garbled — repeat back and confirm before add_to_cart / apply_offer / checkout; never act on an uncertain command.");
        }
      } catch {}
    }, 2500);
    return () => clearInterval(t);
  }, [connected]);

  // FULL-FUNNEL OBSERVATION: AYRA sees every stage the shopper moves through —
  // browse → product → bag → address → payment → ORDER PLACED — and reacts.
  const lastStageRef = useRef(null);
  useEffect(() => {
    const path = location.pathname || "/";
    const stage = stageOf(path);
    if (!stage || stage === lastStageRef.current) return;
    lastStageRef.current = stage;
    if (stage === "ORDER PLACED") {
      emit("purchase", { path });          // closes the funnel for ayra_cvr
      try { evPurchase(0); } catch {}      // test-pixel AyraPurchase signal
    }
    try {
      convRef.current?.sendContextualUpdate?.(
        stage === "ORDER PLACED"
          ? "[stage] ORDER PLACED — she just bought. Congratulate her warmly (1 sentence), reassure delivery, and softly plant the NEXT moment (her birthday/next event) for a return visit."
          : `[stage] Shopper is now ${stage} (${path}). Stay with her — help at this exact step; don't restart the conversation.`);
    } catch {}
  }, [location.pathname]);

  // Deep-link / landing launches ("ayra:start" = a real user gesture → start voice).
  useEffect(() => {
    const params = getLaunchParams();
    if (Object.keys(params).length > 0) launchRef.current = { ...launchRef.current, ...params };
    return onLaunch((ctx = {}) => {
      launchRef.current = { ...launchRef.current, ...(ctx || {}) };
      if (ctx?.mode === "showroom" || isShowroom()) setShowroomState(true);
      const s = convRef.current?.status;
      if (s !== "connected" && s !== "connecting") start();
    });
  }, []); // eslint-disable-line

  const statusLabel = error ? error
    : connecting ? "Connecting…"
    : connected ? (thinking ? "Working on it…"
      : speaking ? "AYRA is speaking"
      : noisy ? "Bit noisy around you — I'm listening carefully"
      : "Listening — just talk")
    : null; // idle: no label, just the orb

  return (
    <div className="ayra-root is-copilot" aria-live="polite">
      {/* Showroom test mode keeps its corner glow. */}
      {showroom && <ShowroomGlow state={!connected ? "idle" : thinking ? "thinking" : speaking ? "speaking" : "listening"} />}

      {/* Cosmic-intelligence read — luxe birth-details capture (voice offers, panel captures). */}
      <AnimatePresence>
        {birthTier && (
          <BirthDetails tier={birthTier} onSubmit={onBirthSubmit} onClose={() => setBirthTier(null)} />
        )}
      </AnimatePresence>

      {/* Live proof feed — what AYRA is doing right now (floats above the orb) */}
      <AnimatePresence>
        {proofs.length > 0 && (
          <motion.div className="ayra-proof ayra-proof-float" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {proofs.map((p) => (
              <motion.div key={p.id} className="ayra-proof-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>{p.label}</motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status pill (only while active / on error) */}
      <AnimatePresence>
        {statusLabel && (
          <motion.div className={`ayra-fab-status ${error ? "has-err" : ""}`}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}>
            {statusLabel}
          </motion.div>
        )}
      </AnimatePresence>

      {/* The floating conscious orb — AYRA, everywhere. Tap to talk / tap to end. */}
      <button className={`ayra-orb-fab ${connected ? "is-live" : ""} ${connecting ? "is-connecting" : ""}`}
        onClick={toggle} aria-label={connected ? "End AYRA session" : "Talk to AYRA"}>
        <canvas ref={canvasRef} className="ayra-orb-canvas" />
      </button>
    </div>
  );
}
