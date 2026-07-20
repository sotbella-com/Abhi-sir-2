/**
 * AYRA web copilot — client actions.
 *
 * The voice agent triggers these IN THE BROWSER to assist directly ON the site:
 * navigate the real store (PLP/PDP), highlight the pieces she's talking about in
 * place, add to bag and open the cart drawer for express buy. There is NO side
 * panel and NO wardrobe overlay — the website itself is the showroom. Every
 * action reuses the storefront's OWN services/hooks so a voice action == a human
 * tap, on the same (staging) SFCC + tracking paths. Nothing here touches
 * production Meta (Ayra* events go to the TEST pixel only via ayraEvents).
 *
 * The exported size helpers (loadSizes / addResolved) are shared by the voice
 * tools and any tap-to-buy UI.
 */

import { emit } from "./ayraJourney.js";
import { transformSFCCProductDetails } from "../api/services/sfccSearchService.js";
import { briefFromProfile } from "./ayraProfile.js";
import { isNative, send as bridgeSend } from "./ayraBridge.js";
import { productShown, addToCart as evAddToCart, initiateCheckout as evCheckout } from "./ayraEvents.js";
import { useUnifiedCartStore } from "../context/unifiedCartStore.js";
import { SOCIALWEAR, socialwearBrief, momentGuidance } from "./socialwearIntel.js";
import { markExplicitHighlight } from "./highlightSync.js";
import { get_orders_listing } from "../api/services/sfccOrders.js";

// Full Sotbella surface AYRA can take her to — she's the chief stylist AND concierge.
const NAV_MAP = {
  orders: "/order", "my orders": "/order", track: "/trackorder", "track order": "/trackorder",
  tracking: "/trackorder", wishlist: "/wishlist", saved: "/wishlist", wallet: "/wallet",
  coupons: "/coupons", account: "/manage-profile", profile: "/manage-profile",
  addresses: "/customer-address", address: "/customer-address", returns: "/returnexchange",
  return: "/returnexchange", exchange: "/returnexchange", "size guide": "/sizeguide",
  sizes: "/sizeguide", faq: "/faq", help: "/faq", contact: "/contactus", home: "/", cart: "/cart",
};

// Open the on-page cart quick-view drawer (express purchase surface) — no navigation away.
const openCartDrawer = () => { try { useUnifiedCartStore.getState?.().handleShow?.(); } catch {} };

// ── Weekly social-moment offers (value-driven discount playbook) ─────────────
// Configured via VITE_AYRA_OFFERS (JSON array [{code,label,rule,moment}]). The
// coupon CODES MUST exist in SFCC Business Manager — apply_offer applies them for
// real via the basket API and reports true success/failure, so AYRA can never
// promise a discount that didn't apply.
const DEFAULT_OFFERS = [
  { code: "AYRA-B2G1",  label: "Buy 2, get the 3rd on us",                    rule: "add 3 pieces — the lowest-priced one is free", moment: "this week's social edit" },
  { code: "AYRA-DUO10", label: "10% off when you complete the look",          rule: "2 or more pieces in the bag",                   moment: "date night / brunch" },
  { code: "AYRA-FIRST", label: "A little welcome from us on your first look", rule: "first order",                                   moment: "new to Sotbella" },
];
export function getOffers() {
  try {
    const raw = import.meta.env.VITE_AYRA_OFFERS;
    if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed) && parsed.length) return parsed; }
  } catch {}
  return DEFAULT_OFFERS;
}
async function applyCouponReal(code) {
  try {
    const st = useUnifiedCartStore.getState?.();
    if (!st?.addCoupon) return { ok: false, error: "cart not ready" };
    const r = await st.addCoupon(code);
    const ok = r === true || r?.success === true || !!r?.basket || !!r?.couponItems;
    return ok ? { ok: true } : { ok: false, error: r?.error || r?.message || "not accepted" };
  } catch (e) { return { ok: false, error: String(e?.message || e).slice(0, 120) }; }
}

// ── helpers ──────────────────────────────────────────────────────────────────
export const money = (p, c = "INR") =>
  p == null ? "" : `${c === "INR" ? "₹" : c + " "}${Number(p).toLocaleString("en-IN")}`;

function normalizeHit(h = {}) {
  const id = h.productId || h.id || h.representedProduct?.id || h.represented_product?.id || "";
  const name = h.productName || h.name || h.c_displayName || "";
  const price = h.price ?? h.pricePerUnit ?? null;
  const currency = h.currency || "INR";
  const image =
    h.image?.link ||
    h.image?.disBaseLink ||
    h.imageGroups?.[0]?.images?.[0]?.link ||
    (Array.isArray(h.imageGroups) ? h.imageGroups?.[0]?.images?.[0]?.link : null) ||
    null;
  return { id, name, price, currency, image };
}
const hitsFrom = (res) => res?.hits || res?.data?.hits || res?.data?.data?.hits || [];

/**
 * Load orderable sizes + a size→variant map for a product (on demand).
 * Reuses getProductDetails → transformSFCCProductDetails (variants[{id,size,orderable}]).
 */
export async function loadSizes(getProductDetails, id) {
  try {
    // getProductDetails returns RAW SFCC; transform to the flat shape (variants have
    // flat .size/.id/.orderable) so sizes actually resolve — otherwise every size
    // reads "unavailable" even when in stock.
    const d = transformSFCCProductDetails(await getProductDetails(id));
    const variants = d?.variants || [];
    const bySize = new Map(); // SIZE(upper) -> orderable variant id (prefer orderable)
    const seen = new Map(); // SIZE(upper) -> {value,name,orderable}
    for (const v of variants) {
      const sz = (v.size || "").toString().trim();
      if (!sz) continue;
      const key = sz.toUpperCase();
      const orderable = v.orderable !== false;
      if (orderable && !bySize.has(key)) bySize.set(key, v.id);
      const prev = seen.get(key);
      seen.set(key, { value: sz, name: sz, orderable: (prev?.orderable || false) || orderable });
    }
    const sizes = Array.from(seen.values());
    const hasSizes = sizes.length > 0;
    const defaultVariantId = hasSizes ? null : (variants[0]?.id || d?.id || id);
    return { hasSizes, sizes, bySize, defaultVariantId, category: d?.primaryCategoryId || d?.categories?.[0]?.id || d?.categories?.[0] || "" };
  } catch (e) {
    // No detail => treat as a single buyable item.
    return { hasSizes: false, sizes: [], bySize: new Map(), defaultVariantId: id, category: "" };
  }
}

/**
 * Resolve a size to a variant and add it. Returns {ok, needSize?, sizes?, error?}.
 */
export async function addResolved(addToCart, getProductDetails, id, size) {
  const info = await loadSizes(getProductDetails, id);
  if (info.hasSizes && !size) {
    return { ok: false, needSize: true, sizes: info.sizes.filter((s) => s.orderable) };
  }
  const variantId = info.hasSizes ? info.bySize.get(String(size).toUpperCase()) : info.defaultVariantId;
  if (!variantId) return { ok: false, error: `size ${size || ""} unavailable` };
  const r = await addToCart(variantId, 1);
  return r?.success ? { ok: true, variantId } : { ok: false, error: r?.error || "add failed" };
}

// ── voice tools factory ──────────────────────────────────────────────────────
/**
 * @param {object} d
 * @param {(path:string)=>void} d.navigate
 * @param {(id:string,qty?:number)=>Promise<{success:boolean,error?:string}>} d.addToCart
 * @param {(items:Array)=>void} d.setProducts       — silent: powers speech-highlight only
 * @param {(q:string,opts?:object)=>Promise<object>} d.searchProductsByQuery
 * @param {(id:string)=>Promise<object>} d.getProductDetails
 * @param {(catId:string,opts?:object)=>Promise<object>} d.searchCategoryProductsEnhanced
 * @param {(id:string)=>Promise<{ok:boolean,error?:string}>} d.wishlistAdd
 */
export function createAyraTools(d) {
  let last = []; // last narrated picks, for ordinal references
  let lastQuery = ""; // last search text, to fetch fresh alternatives
  const shownIds = new Set(); // everything shown this session — never re-pitch it
  const proof = (label) => d.onToolActivity?.(label); // live "conscious" proof feed

  const resolveId = (p = {}) => {
    const raw = p.product_id ?? p.productId ?? p.id;
    if (raw && String(raw).trim()) return String(raw).trim();
    const idx = p.index ?? p.position;
    if (idx != null && last[Number(idx) - 1]) return last[Number(idx) - 1].id;
    return "";
  };

  // Remember what AYRA is narrating (ordinals, dedupe, speech-highlight) — no panel UI.
  const remember = (items) => { last = items; items.forEach((i) => i?.id && shownIds.add(i.id)); d.setProducts?.(items); };

  const scrollTo = (id) => {
    if (!id) return false;
    let el = document.querySelector(`[data-product-id="${id}"]`);
    if (!el) {
      const link = document.querySelector(`a[href*="/product/${id}"]`);
      el = link ? link.closest("[data-product-id],article,li,div") || link : null;
    }
    if (!el) return false;
    // Clear any other active highlight → exactly one glows at a time (no mismatch).
    document.querySelectorAll(".ayra-highlight").forEach((n) => { if (n !== el) n.classList.remove("ayra-highlight"); });
    markExplicitHighlight(); // the speech heuristic yields to this for ~2.5s
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ayra-highlight");
    setTimeout(() => el.classList.remove("ayra-highlight"), 2600);
    return true;
  };

  const listLine = (items) =>
    items.slice(0, 5).map((p, i) => `${i + 1}. ${p.name}${p.price ? " — " + money(p.price, p.currency) : ""} [${p.id}]`).join("; ");

  // Copilot move: show a query's results ON the real search page and narrate them.
  const showOnSite = async (q, spokenIntro) => {
    const items = hitsFrom(await d.searchProductsByQuery(q, { limit: 8 })).map(normalizeHit).filter((x) => x.id);
    remember(items);
    d.navigate(`/search?search=${encodeURIComponent(q)}`);
    items.slice(0, 3).forEach((it) => { try { productShown(it.id, it.name); } catch {} });
    if (!items.length) return `I couldn't find anything for "${q}" — want a different direction?`;
    return `${spokenIntro || `Here's what I found for "${q}"`}: ${listLine(items)}. They're on the page — tell me which one draws you.`;
  };

  return {
    async search_products(p = {}) {
      const q = (p.query || p.q || "").toString().trim();
      if (!q) return "Tell me the social moment, colour, or style you have in mind.";
      proof(`Finding pieces for “${q}”…`); emit("search", { query: q });
      lastQuery = q;
      try {
        const spoken = await showOnSite(q);
        emit("search_results", { query: q, count: last.length, ids: last.map((x) => x.id) });
        return spoken;
      } catch (e) { return `Search hit a snag: ${String(e?.message || e).slice(0, 100)}`; }
    },

    async open_product(p = {}) {
      const id = resolveId(p);
      if (!id) return "Which piece — name it or say the number on screen.";
      proof("Opening the piece…"); emit("view_product", { id }); try { productShown(id); } catch {}
      // In the app: open the piece on the NATIVE product screen.
      if (isNative()) { bridgeSend("open_product", { product_id: id }); return `Opening it now.`; }
      d.navigate(`/product/${id}`);
      return `Opening it now — take a look. Tell me if it's the one or if you'd like something else.`;
    },

    async open_category(p = {}) {
      const cat = (p.category_id || p.categoryId || p.category || "").toString().trim();
      if (!cat) return "Which edit should I open?";
      d.navigate(`/category/${cat}`);
      return `Taking you to the ${cat} edit.`;
    },

    async highlight_product(p = {}) {
      const id = resolveId(p);
      if (!id) return "Which one should I point out?";
      return scrollTo(id) ? `There it is.` : `It's not on this page — want me to open it?`;
    },

    // CRO core: confirm size, then add — and open express checkout right there.
    async add_to_cart(p = {}) {
      const id = resolveId(p);
      if (!id) return "Which piece should I add?";
      proof("Adding to your bag…");
      // In the Sotbella app: resolve size/variant here (same voice UX), then hand
      // the actual add to the NATIVE cart so native Blaze pay + FB logAddToCart fire.
      if (isNative()) {
        const info = await loadSizes(d.getProductDetails, id);
        if (info.hasSizes && !p.size) {
          emit("size_ask", { id, sizes: info.sizes.filter((s) => s.orderable).map((s) => s.name) });
          return `Which size? Available: ${info.sizes.filter((s) => s.orderable).map((s) => s.name).join(", ")}.`;
        }
        const variantId = info.hasSizes ? info.bySize.get(String(p.size).toUpperCase()) : info.defaultVariantId;
        if (!variantId) {
          const others = info.sizes.filter((s) => s.orderable).map((s) => s.name);
          return `That size isn't available right now.${others.length ? " I do have " + others.join(", ") + "." : ""} Want another size?`;
        }
        bridgeSend("add_to_cart", { product_id: id, variant_id: variantId, size: p.size || "", qty: 1 });
        emit("add_to_cart", { id, size: p.size || null, native: true });
        return `Added to your bag${p.size ? " in " + p.size : ""}. Shall I take you to checkout?`;
      }
      const r = await addResolved(d.addToCart, d.getProductDetails, id, p.size);
      if (r.needSize) { emit("size_ask", { id, sizes: r.sizes.map((s) => s.name) }); return `Which size? Available: ${r.sizes.map((s) => s.name).join(", ")}.`; }
      emit(r.ok ? "add_to_cart" : "add_to_cart_failed", { id, size: p.size || null, error: r.ok ? undefined : r.error });
      if (r.ok) {
        // Express purchase in front of AYRA — open the on-page cart drawer (no nav away).
        try { evAddToCart(id, p.size); evCheckout(); } catch {}
        openCartDrawer();
        return `Done — it's in your bag${p.size ? " in " + p.size : ""} and I've opened your bag right here. Confirm and it's yours.`;
      }
      // Failed (often sold out / SFCC hook) — offer other orderable sizes.
      let alt = "";
      try {
        const info = await loadSizes(d.getProductDetails, id);
        const others = info.sizes.filter((s) => s.orderable && String(s.value).toUpperCase() !== String(p.size || "").toUpperCase()).map((s) => s.name);
        if (others.length) alt = ` I do have ${others.join(", ")}.`;
      } catch {}
      return `That${p.size ? " size (" + p.size + ")" : " piece"} just isn't available right now.${alt} Want another size, or shall I show the next look?`;
    },

    // AOV lever: complete the look from the same category — on the real page.
    async complete_the_look(p = {}) {
      const id = resolveId(p);
      if (!id) return "Point me at a piece first and I'll style the full look.";
      proof("Styling the full look…"); emit("complete_the_look", { id });
      try {
        const info = await loadSizes(d.getProductDetails, id);
        if (!info.category) return "I can't find matching pieces for that just now.";
        const items = hitsFrom(await d.searchCategoryProductsEnhanced(info.category, { limit: 8 }))
          .map(normalizeHit).filter((x) => x.id && x.id !== id);
        if (!items.length) return "Nothing to pair right now.";
        remember(items);
        d.navigate(`/category/${info.category}`);
        return `To complete the look, on the page now: ${listLine(items)}.`;
      } catch (e) { return `Styling hit a snag: ${String(e?.message || e).slice(0, 100)}`; }
    },

    // Rejection lever: shopper didn't like what's shown / wants something else.
    // Shows FRESH pieces on the real page (never re-pitches what she passed on).
    async show_alternatives(p = {}) {
      proof("Pulling fresh options…"); emit("show_alternatives", { note: p.note || p.query || "" });
      const q = (p.query || "").toString().trim() || lastQuery;
      try {
        let items = [];
        if (q) {
          items = hitsFrom(await d.searchProductsByQuery(q, { limit: 16 })).map(normalizeHit);
        } else if (last[0]?.id) {
          const info = await loadSizes(d.getProductDetails, last[0].id);
          if (info.category) items = hitsFrom(await d.searchCategoryProductsEnhanced(info.category, { limit: 16 })).map(normalizeHit);
        }
        const fresh = items.filter((x) => x.id && !shownIds.has(x.id)).slice(0, 8);
        if (!fresh.length) return "That's most of what I have in this direction — want me to try a different colour or style?";
        remember(fresh);
        if (q) d.navigate(`/search?search=${encodeURIComponent(q)}`);
        return `Fresh options, on the page: ${listLine(fresh)}. None of the earlier ones — see if any of these feel more you.`;
      } catch (e) { return `Let me try another angle — tell me a colour or vibe and I'll pull fresh pieces.`; }
    },

    async add_to_wishlist(p = {}) {
      const id = resolveId(p);
      if (!id) return "Which piece should I save?";
      proof("Saving to your wishlist…"); emit("wishlist", { id });
      try {
        const r = await d.wishlistAdd?.(id);
        return r?.ok ? `Saved to your wishlist.` : `I'll need you signed in to save that — want me to open login?`;
      } catch (e) { return `Couldn't save it: ${String(e?.message || e).slice(0, 80)}`; }
    },

    // Full real-time product knowledge — fabric/story/price/sizes/stock/colours,
    // straight from SFCC, so AYRA answers ANY product question accurately.
    async product_knowledge(p = {}) {
      const id = resolveId(p);
      if (!id) return "Which piece do you want to know about — name it or say its number.";
      proof("Checking the piece…");
      try {
        const raw = await d.getProductDetails(id);
        const t = transformSFCCProductDetails(raw) || {};
        const sizes = (t.variants || []).filter((v) => v.size).map((v) => ({
          size: v.size, orderable: v.orderable !== false, stock: v.stock ?? null }));
        const know = {
          id: t.id || id, name: t.name || t.title,
          price: t.price, currency: t.currency || "INR", priceRanges: t.priceRanges,
          description: (raw?.shortDescription || t.shortDescription || raw?.longDescription || t.longDescription || "")
            .toString().replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 600),
          colours: (t.colorOptions || []).map((c) => c.name || c.value).filter(Boolean),
          sizes, category: t.primaryCategoryId || "",
          low_stock: sizes.filter((s) => s.orderable && s.stock != null && s.stock <= 5).map((s) => s.size),
        };
        return JSON.stringify(know);
      } catch (e) { return `Couldn't load that piece's details: ${String(e?.message || e).slice(0, 80)}`; }
    },

    // DIRECT DISCOUNT CATALOGUE — real marked-down / promo pieces from SFCC,
    // available to AYRA at ANY moment. Shows them on the real page + narrates.
    async discount_catalogue(p = {}) {
      const q = (p.query || "").toString().trim();
      proof("Pulling the offer edit…"); emit("discount_catalogue", { query: q });
      try {
        let hits = [];
        // 1) a dedicated sale/offers category if the catalog has one
        for (const cat of ["sale", "offers", "discount", "end-of-season-sale"]) {
          try {
            const r = hitsFrom(await d.searchCategoryProductsEnhanced(cat, { limit: 24 }));
            if (r.length) { hits = r; break; }
          } catch {}
        }
        // 2) fallback: search, then keep only pieces with a live markdown/promotion
        if (!hits.length) {
          hits = hitsFrom(await d.searchProductsByQuery(q || "sale", { limit: 48 }));
        }
        const discounted = hits.filter((h) => {
          const promo = (h.productPromotions || []).length > 0;
          const strike = h.priceMax != null && h.price != null && Number(h.price) < Number(h.priceMax);
          return promo || strike;
        });
        const pool = (discounted.length ? discounted : hits).map(normalizeHit).filter((x) => x.id);
        const items = pool.slice(0, 8);
        if (!items.length) return "No live markdowns right now — but I can unlock this week's offers on a full look instead (get_offers).";
        remember(items);
        d.navigate(`/search?search=${encodeURIComponent(q || "sale")}`);
        items.slice(0, 3).forEach((it) => { try { productShown(it.id, it.name); } catch {} });
        return `On offer right now, on the page: ${listLine(items)}. ` +
          `${discounted.length ? "These carry live markdowns." : "Best current prices."} Which one shall we look at?`;
      } catch (e) { return `Couldn't load the offer edit: ${String(e?.message || e).slice(0, 80)}`; }
    },

    // This week's social-moment offers (value-driven). NEVER promise a discount
    // before apply_offer confirms it applied.
    async get_offers() {
      proof("Checking this week's edit offers…");
      const offers = getOffers();
      return JSON.stringify({
        offers,
        guidance: "Use ONE offer only when it genuinely completes her look (2-3 pieces). " +
          "Present it as styling value, tied to her moment — never as a price gimmick. " +
          "You MUST call apply_offer and get ok:true before telling her a discount is applied.",
      });
    },

    // Apply an offer code to the bag FOR REAL (SFCC coupon). Truthful result.
    async apply_offer(p = {}) {
      const code = (p.code || "").toString().trim().toUpperCase();
      if (!code) return "Which offer should I apply?";
      const known = getOffers().some((o) => (o.code || "").toUpperCase() === code);
      if (!known) return "That offer isn't in this week's list — call get_offers for what I can give her.";
      proof("Applying your offer…"); emit("offer_apply", { code });
      const r = await applyCouponReal(code);
      if (r.ok) { openCartDrawer(); return `Done — ${code} is applied to her bag. Tell her what she just unlocked.`; }
      emit("offer_apply_failed", { code, error: r.error });
      return `OFFER_NOT_APPLIED: ${code} didn't apply (${r.error}). Do NOT claim a discount — ` +
        `either the bag doesn't meet the rule yet (tell her what to add) or the code isn't active.`;
    },

    async show_size_help(p = {}) {
      const id = resolveId(p);
      if (id) {
        const info = await loadSizes(d.getProductDetails, id);
        if (info.hasSizes) return `Available sizes: ${info.sizes.filter((s) => s.orderable).map((s) => s.name).join(", ")}. Tell me your usual size and I'll pick the right fit.`;
      }
      return "Tell me your bust/waist or usual size and I'll guide the fit; there's a full size guide too.";
    },

    // THE SOCIALWEAR INTELLIGENCE LAYER — the category Sotbella created + why it's
    // valuable + the styling intent for a given moment. AYRA's conviction on tap.
    async socialwear_intel(p = {}) {
      const g = momentGuidance(p.moment);
      return JSON.stringify({
        brief: socialwearBrief(),
        positioning: SOCIALWEAR.positioning,
        value_props: SOCIALWEAR.value_props,
        never_say: SOCIALWEAR.never_say,
        moment: g ? { label: g.label, styling_intent: g.intent } : null,
        guidance: "Speak as the brand that CREATED socialwear. Anchor every piece to her real social " +
          "moment and how she'll FEEL in it; celebrate her body and story; accessible luxury, never cheap.",
      });
    },

    // HER personalized collection — curate the real store to her ENERGY / vibe /
    // signature silhouettes / palette + taste (from the Cosmic read + behaviour),
    // and show it as her own edit on the page. This is "made for you".
    async personalized_collection(p = {}) {
      proof("Curating your edit…"); emit("personalized_collection", {});
      let prof = {};
      try { prof = (await d.getProfile?.()) || {}; } catch {}
      const moment = (p.moment || "").toString().trim();
      // Build the query from her strongest signals: a signature silhouette she'll love,
      // her colour/palette, and the moment. Fall back to her energy words, then new-in.
      const terms = [];
      if (prof.signature_pieces?.length) terms.push(prof.signature_pieces[0]);
      if (prof.fav_colors?.length) terms.push(prof.fav_colors[0]);
      else if (prof.palette_names?.length) terms.push(prof.palette_names[0]);
      if (moment) terms.push(moment);
      const q = terms.filter(Boolean).join(" ").trim()
        || (prof.energy || prof.style_name || "new in").toString();
      const intro = `Your edit — ${prof.energy ? "in your " + prof.energy + " energy" : "made for you"}`
        + (prof.palette_names?.length ? `, in ${prof.palette_names.slice(0, 2).join(" & ")}` : "")
        + (prof.usual_size ? `, your usual ${prof.usual_size}` : "");
      try {
        return await showOnSite(q, intro);
      } catch (e) { return `Let me pull your edit — tell me a colour or a moment and I'll curate it.`; }
    },

    // Everything AYRA knows about her (fused signals — never astrological).
    async shopper_context() {
      try {
        const prof = await d.getProfile?.();
        const brief = briefFromProfile(prof || {});
        return brief ? `Here's what I know about her: ${brief}. Use it to style precisely and build a complete look — never mention astrology.`
          : "She's new — no history yet. Ask the social moment and read her taste as you go.";
      } catch { return "Couldn't load her profile — style from the conversation."; }
    },

    // Open the elegant on-screen card to capture her birth details precisely — the
    // reliable way in (voice mishears dates/cities). tier: "birthday" (date only) or
    // "full" (date+time+place → the full Cosmic read). The panel feeds apply_dna.
    async open_birth_capture(p = {}) {
      const tier = (p.tier || "full").toString().toLowerCase() === "birthday" ? "birthday" : "full";
      const opened = d.openBirthCapture?.(tier);
      if (opened === false) return "I couldn't open the card just now — tell me your date of birth and I'll read you.";
      emit("birth_capture_open", { tier });
      return tier === "full"
        ? "I've opened a little card for you — drop in your date, and your time and place if you know them, and I'll read exactly what you'll love."
        : "I've opened a little card — pop your birthday in and I'll tailor everything to you.";
    },

    // Style-DNA read (Satya, de-astrologised at the broker).
    async apply_dna(p = {}) {
      proof("Reading your style DNA…");
      try {
        const dna = await d.applyDNA?.({ dob: p.dob, tob: p.tob, place: p.place, name: p.name, occasion: p.occasion });
        emit("dna_captured", { has: !!dna });
        if (dna?.style_name) return `You're a ${dna.style_name}${dna.vibe ? " — " + dna.vibe : ""}. I'll style everything around it.`;
        return "NO_DNA_YET: your style DNA is still calibrating — do NOT name any zodiac sign or archetype; say you'll curate from the collection meanwhile and name it once it's ready.";
      } catch { return "I couldn't read your DNA just now."; }
    },

    // Legacy wardrobe tools (removed feature) → copilot equivalents on the REAL site,
    // so an un-repatched agent still works gracefully.
    async open_wardrobe(p = {}) {
      const m = (p.moment || "").toString().trim();
      proof("Curating your edit…"); emit("moment_view", { moment: m || "any", via: "voice" });
      return showOnSite(m ? `${m} outfit` : "new in", "I've curated these for you");
    },
    async build_look(p = {}) {
      const m = (p.moment || "").toString().trim();
      proof("Building your look…");
      return showOnSite(m ? `${m} outfit` : "co-ord set", "Let's build your look from these");
    },
    async show_for_moment(p = {}) {
      const m = (p.moment || "any").toString().trim();
      const g = momentGuidance(m);
      proof(`Styling you for ${g?.label || m}…`); emit("moment_view", { moment: m, via: "voice" });
      const intro = g ? `For ${g.label} — ${g.intent}` : `Styled for ${m}`;
      return showOnSite(`${m} outfit`, intro);
    },

    async go_to_cart() { proof("Opening your bag…"); emit("view_cart"); if (isNative()) { bridgeSend("go_to_cart"); return "Here's your bag."; } openCartDrawer(); return "Here's your bag — right here."; },
    async start_checkout() { proof("Taking you to checkout…"); emit("checkout"); if (isNative()) { bridgeSend("start_checkout"); return "Starting checkout — you'll confirm payment yourself."; } d.navigate("/shipping"); return "Starting checkout — you'll confirm payment yourself."; },

    // ── Full concierge: she can run her WHOLE journey, not just styling ──
    async navigate_to(p = {}) {
      const s = (p.section || "").toString().toLowerCase().trim();
      let route = NAV_MAP[s] || null;
      if (!route) for (const k in NAV_MAP) { if (s.includes(k)) { route = NAV_MAP[k]; break; } }
      if (!route) return "I can take you to your orders, tracking, wishlist, wallet, coupons, account, addresses, returns, the size guide, or help — which one?";
      emit("navigate_to", { section: s, route });
      if (isNative()) { bridgeSend("navigate", { path: route }); return "Opening that for you."; }
      d.navigate(route);
      return "Here you go — I've opened it for you.";
    },

    // Order tracking / status — reads her real orders, then opens them.
    async order_status(p = {}) {
      proof("Checking your orders…"); emit("order_status", {});
      try {
        const res = await get_orders_listing({ queryKey: ["orders", { page: 1, limit: 5 }] });
        const orders = res?.orders || (Array.isArray(res) ? res : []);
        if (!orders.length) return "I don't see any orders on this account yet — shall we find your first look?";
        if (!isNative()) d.navigate("/order");
        const o = orders[0];
        const st = o.status || o.orderStatus || o.shippingStatus || "being processed";
        const id = o.orderNo || o.orderNumber || o.id || "";
        return `Your most recent order ${id} is ${st}. I've opened your orders — want me to track it, or start a return or exchange?`;
      } catch { if (!isNative()) d.navigate("/order"); return "I've opened your orders for you — tell me which one and I'll help."; }
    },

    // Returns / exchange — take her into the flow.
    async start_return(p = {}) {
      proof("Opening returns & exchange…"); emit("start_return", {});
      if (isNative()) { bridgeSend("navigate", { path: "/returnexchange" }); return "Opening returns for you."; }
      d.navigate("/returnexchange");
      return "I've opened returns & exchange — tell me which piece and why, and I'll guide you through it.";
    },

    // Delivery / COD reassurance (honest, value-driven).
    async delivery_info(p = {}) {
      const pin = (p.pincode || "").toString().replace(/\D/g, "").slice(0, 6);
      emit("delivery_info", { pincode: pin });
      return "We deliver pan-India, usually in 4–7 days, with easy 7-day returns. COD is available on most pincodes; "
        + (pin ? `I'll confirm COD for ${pin} at checkout. ` : "share your pincode and I'll confirm COD. ")
        + "Prepaid also unlocks the smoothest experience.";
    },

    async get_page_context() {
      const path = window.location.pathname;
      const visible = Array.from(document.querySelectorAll("[data-product-id]"))
        .map((el) => el.getAttribute("data-product-id")).filter(Boolean).slice(0, 12);
      return JSON.stringify({ path, visible_products: visible, shelf: last.map((x) => x.id) });
    },
  };
}

export default createAyraTools;
