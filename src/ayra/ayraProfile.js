/**
 * AYRA shopper profile — fuses MANY parallel signals (not nakshatra) into one
 * "who she is" so AYRA feels like Aatman: her de-astrologised style read + real
 * purchase affinity + wishlist + cart + occasions + city + this session's behaviour.
 * All read client-side from the storefront's OWN SFCC (sandbox-safe). Every source
 * is defensive — missing signals are simply omitted.
 */
import { getCachedDNA } from "./ayraDNA.js";
import { recallSession } from "./ayraJourney.js";
import { getCustomerProfile, getCustomer } from "../api/services/sfccCustomers.js";
import { get_orders_listing, get_order_details } from "../api/services/sfccOrders.js";
import { useWishlistStore } from "../context/wishlistStore.js";
import { useUnifiedCartStore } from "../context/unifiedCartStore.js";

const loggedInId = () => {
  try { const t = JSON.parse(localStorage.getItem("auth_token") || "null"); return t && t.kind === "user" ? (t.customer_id || t.customer_no || null) : null; } catch { return null; }
};
const recentSearches = () => { try { return JSON.parse(localStorage.getItem("RECENT_SEARCHES") || "[]"); } catch { return []; } };
const mode = (arr) => { const m = {}; let best = null, bc = 0; for (const x of arr.filter(Boolean)) { m[x] = (m[x] || 0) + 1; if (m[x] > bc) { bc = m[x]; best = x; } } return best; };
const uniq = (a) => [...new Set(a.filter(Boolean))];

export async function buildProfile() {
  const p = { _source: "fusion" };
  // Style read (already de-astrologised at the broker)
  const dna = getCachedDNA();
  if (dna) { p.style_name = dna.style_name; p.palette_names = dna.palette_names; p.who_she_is = dna.who_she_is || dna.vibe; p.energy = dna.energy; p.signature_pieces = dna.signature_pieces; }
  // This session's behaviour
  const log = recallSession();
  p.session_searches = uniq(log.filter((e) => e.step === "search").map((e) => e.data?.query)).slice(-6);
  p.session_views = uniq(log.filter((e) => e.step === "view_product").map((e) => e.data?.id)).slice(-8);
  p.recent_searches = recentSearches().slice(0, 3);
  // Wishlist + cart (no network)
  try {
    const wl = useWishlistStore.getState?.().wishListProduct || [];
    p.wishlist = uniq(wl.map((w) => w.product?.title || w.product?.name)).slice(0, 8);
    const colors = wl.map((w) => w.product?.color?.name || w.product?.color);
    if (colors.filter(Boolean).length) p.fav_colors = uniq(colors).slice(0, 4);
  } catch {}
  try { const b = useUnifiedCartStore.getState?.().basket; p.cart = uniq((b?.productItems || []).map((i) => i.productName)).slice(0, 6); } catch {}

  const cid = loggedInId();
  if (cid) {
    p.known = true;
    try { const prof = await getCustomerProfile(); if (prof) { p.name = prof.firstName || p.name; p.gender = prof.gender; p.birthday = prof.birthday; p.anniversary = prof.c_anniversaryDate; } } catch {}
    try { const cust = await getCustomer(); const a = (cust?.addresses || [])[0]; if (a) { p.city = a.cityName || a.city; p.state = a.stateName || a.stateCode; } } catch {}
    try {
      const res = await get_orders_listing({ queryKey: ["orders", { page: 1, limit: 20 }] });
      const orders = res?.orders || (Array.isArray(res) ? res : []);
      if (orders.length) {
        p.order_count = orders.length;
        const totals = orders.map((o) => Number(o.grandTotal || 0)).filter((x) => x > 0);
        if (totals.length) p.aov = Math.round(totals.reduce((a, b) => a + b, 0) / totals.length);
        p.payment_pref = mode(orders.map((o) => o.paymentMethod));
        const lastId = orders[0]?.id;
        if (lastId) {
          try {
            const d = await get_order_details({ queryKey: ["od", { orderId: lastId }] });
            const items = (d?.subOrders?.flatMap((s) => s.productLineItems || []) || d?.productItems || []);
            const va = (i, re) => i.variationAttributes?.find?.((v) => re.test(v.id || v.name || ""))?.value;
            const sizes = items.map((i) => va(i, /size/i) || i.size).filter(Boolean);
            const colors = items.map((i) => va(i, /colou?r/i) || i.color).filter(Boolean);
            if (sizes.length) p.usual_size = mode(sizes);
            if (colors.length) p.fav_colors = uniq([...(p.fav_colors || []), ...colors]).slice(0, 4);
          } catch {}
        }
      }
    } catch {}
  }
  return p;
}

/** A compact, human brief for the agent (never astrological). */
export function briefFromProfile(p = {}) {
  const bits = [];
  if (p.name) bits.push(`Name: ${p.name}`);
  if (p.style_name) bits.push(`Style: ${p.style_name}`);
  if (p.who_she_is) bits.push(p.who_she_is);
  if (p.fav_colors?.length) bits.push(`Loves: ${p.fav_colors.join(", ")}`);
  if (p.usual_size) bits.push(`Usual size: ${p.usual_size}`);
  if (p.palette_names?.length) bits.push(`Palette: ${p.palette_names.join(", ")}`);
  if (p.aov) bits.push(`Typical spend ~₹${p.aov}`);
  if (p.payment_pref) bits.push(`Pays: ${p.payment_pref}`);
  if (p.city) bits.push(`City: ${p.city}`);
  if (p.order_count) bits.push(`${p.order_count} past orders`);
  if (p.wishlist?.length) bits.push(`Wishlist: ${p.wishlist.slice(0, 4).join(", ")}`);
  if (p.session_searches?.length) bits.push(`Just searched: ${p.session_searches.slice(-3).join(", ")}`);
  return bits.join(" · ");
}

export default { buildProfile, briefFromProfile };
