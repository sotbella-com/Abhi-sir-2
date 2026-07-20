/**
 * Tiny shared clock so the fuzzy speech-highlight (AyraShopper.highlightFromSpeech)
 * yields to the reliable id-based highlight (ayraActions.scrollTo/highlight_product).
 * When AYRA explicitly points at a piece, the heuristic must not fight it.
 */
let _lastExplicit = 0;
export const markExplicitHighlight = () => { _lastExplicit = Date.now(); };
export const msSinceExplicitHighlight = () => Date.now() - _lastExplicit;

// Generic words that must NOT trigger a highlight on their own (they match many cards).
export const HIGHLIGHT_STOPWORDS = new Set([
  "dress", "dresses", "set", "sets", "coord", "co-ord", "piece", "pieces", "look", "looks",
  "outfit", "colour", "color", "black", "white", "wine", "red", "blue", "green", "gold",
  "slip", "skirt", "blazer", "coat", "sotbella", "this", "that", "these", "those", "with",
  "your", "here", "there", "shall", "would", "could", "about", "really", "lovely", "beautiful",
]);
