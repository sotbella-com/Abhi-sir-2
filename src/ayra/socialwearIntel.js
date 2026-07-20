/**
 * SOCIALWEAR INTELLIGENCE LAYER — the canonical brain behind AYRA.
 *
 * Sotbella CREATED the socialwear category. This module encodes what that means
 * and why it's valuable, distilled from the Series-A pitch deck / business plan /
 * franchise brief, so every recommendation carries true category conviction:
 * fashion organised around a woman's SOCIAL MOMENTS, not seasons or trends;
 * accessible luxury for every size and every story.
 *
 * Consumed by ayraActions (`socialwear_intel` tool) and reflected in the agent
 * persona. Pure data + helpers, no side effects.
 */

export const SOCIALWEAR = {
  one_liner:
    "Sotbella is the world's first socialwear house — fashion organised around a woman's social moments, not seasons or trends.",
  category_creator:
    "Category creators: SKIMS made shapewear, Lululemon made yoga wear, Aritzia made everyday luxury — Sotbella made SOCIALWEAR. No fashion brand globally is organised this way; the category is ours.",
  the_problem:
    "A woman dressing for her social life had two bad choices: designer wear she loved but couldn't afford (≈9 in 10 women priced out), or fast fashion she could afford but that cut corners on fabric and finish. Luxury also overlooks body diversity — 73% of women say finding stylish social-moment wear for their body type is hard.",
  the_shift:
    "Modern women live fuller, event-filled lives — 5.2× more social moments per month than pre-pandemic. Every one of those moments deserves an outfit that feels as special as the moment.",
  the_promise:
    "Accessible luxury, made real: designer-grade design and India's finest craftsmanship, priced within reach — so every woman, every size, every story feels confident, bold, valued, and beautifully individual at every social moment.",
  positioning: "Mid-premium social-moment dresses & sets. Blended order value ≈ ₹5,500. Accessible luxury — NOT fast fashion, NOT unreachable designer.",
  never_say: ["saree", "ethnic wear", "cheap", "discount brand"],
  always_frame: "Anchor every piece to a real social MOMENT in her life, and to how she'll FEEL walking into it.",

  // The 40+ moment taxonomy is the heart of the category. Each moment carries its
  // own styling intent — this is how AYRA merchandises "in the language of the moment".
  moments: {
    birthday:     { label: "Birthday Party",      intent: "her night to shine — statement, celebratory, photographs beautifully" },
    brunch:       { label: "Brunch Weekend",      intent: "day-social, effortless polish — relaxed but elevated" },
    date:         { label: "First / Date Night",  intent: "quietly unforgettable — flattering, a little alluring, confident" },
    cocktail:     { label: "Cocktail Night",      intent: "after-dark glamour — sleek, bold, striking silhouettes" },
    wedding:      { label: "Wedding Guest",       intent: "celebration-ready, respectful of the couple, never upstaging — colour + grace" },
    office:       { label: "Office Celebration",  intent: "polished, powerful, appropriate — commands the room without trying" },
    anniversary:  { label: "Anniversary Dinner",  intent: "romantic, timeless, intentionally elegant" },
    girls_night:  { label: "Girls' Night Out",    intent: "fun, high-energy, head-turning — she feels the main character" },
    photoshoot:   { label: "Photoshoot",          intent: "made for the camera — texture, colour, silhouette that reads on film" },
    launch:       { label: "Launch / Soirée",     intent: "arrival-worthy — modern, directional, memorable" },
    escape:       { label: "Weekend Escape",      intent: "vacation-social — easy glamour that travels" },
    milestone:    { label: "Milestone Celebration", intent: "once-in-a-while significance — elevated, emotional, worth remembering" },
  },

  value_props: [
    "Every size, every story — designed to flatter real bodies, not just sample sizes.",
    "Designer-grade design at a price she can actually reach (accessible luxury).",
    "Vertically integrated: designed, made, shot and shipped in-house → quality + a strong creative point of view.",
    "Built for the moment she's dressing for — not a random season's trend.",
  ],
};

/** Compact category brief for the agent — its conviction in a few lines. */
export function socialwearBrief() {
  const s = SOCIALWEAR;
  return [s.one_liner, s.category_creator, s.the_shift, s.the_promise, s.always_frame].join(" ");
}

/** Styling intent for a named moment (fuzzy match on key/label). */
export function momentGuidance(moment) {
  const m = (moment || "").toString().toLowerCase().trim();
  if (!m) return null;
  const M = SOCIALWEAR.moments;
  for (const [k, v] of Object.entries(M)) {
    if (m === k || m.includes(k) || k.includes(m) || v.label.toLowerCase().includes(m)) return { key: k, ...v };
  }
  return null;
}

export function momentList() {
  return Object.values(SOCIALWEAR.moments).map((m) => m.label);
}

export default { SOCIALWEAR, socialwearBrief, momentGuidance, momentList };
