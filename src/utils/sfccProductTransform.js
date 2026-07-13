/**
 * Transform SFCC API product data to match our component expectations
 */
export const transformSFCCProduct = (sfccProduct) => {
  if (!sfccProduct) return null;

  const productId   = sfccProduct.productId ?? sfccProduct.id ?? null;
  const productName = sfccProduct.productName ?? sfccProduct.name ?? "";
  const price       = Number(sfccProduct.price ?? 0) || 0;
  const currency    = sfccProduct.currency || "";
  const orderable   = Boolean(sfccProduct.orderable);

  // Images (main + hover)
  const image = sfccProduct.image || {};
  const productImages = [];
  if (image.disBaseLink) {
    productImages.push({
      id: `${productId}-main`,
      image: image.disBaseLink,
      alt: image.alt || productName,
      title: image.title || productName,
      type: "product",
    });
  }
  if (image.link && image.link !== image.disBaseLink) {
    productImages.push({
      id: `${productId}-hover`,
      image: image.link,
      alt: image.alt || productName,
      title: image.title || productName,
      type: "product",
    });
  }

  // Variations
  const variationAttributes = sfccProduct.variationAttributes || [];
  const sizeAttr     = variationAttributes.find((a) => a.id === "size");
  const colorAttr    = variationAttributes.find((a) => a.id === "Color" || a.id === "color" || a.id === "c_color");
  const materialAttr = variationAttributes.find((a) => a.id === "material" || a.id === "c_material");

  // Extract sizes from variants array (primary source)
  const variants = sfccProduct.variants || [];
  const availableSizes = variants.map((variant) => ({
    name: variant.variationValues?.size || "NF",
    value: variant.variationValues?.size || "NF",
    orderable: variant.orderable !== false,
    productId: variant.productId, // This is the key for adding to cart
    price: variant.price || price,
    currency: currency
  }));

  // Default size (first available size)
  const size = availableSizes[0] || null;

  const color = colorAttr?.values?.[0]
    ? { name: colorAttr.values[0].name, value: colorAttr.values[0].value, orderable: colorAttr.values[0].orderable }
    : null;

  const material = materialAttr?.values?.[0]
    ? { name: materialAttr.values[0].name, value: materialAttr.values[0].value, orderable: materialAttr.values[0].orderable }
    : null;

  // Variants for child products (using variants array)
  const childProducts = variants.map((variant) => ({
    id: variant.productId,
    size: {
      name: variant.variationValues?.size || "NF",
      value: variant.variationValues?.size || "NF",
      orderable: variant.orderable !== false,
    },
    // Use ATS if available, fallback to 99 if orderable, else 0.
    stock: variant.inventory?.ats ?? (variant.stock ?? (variant.orderable ? 99 : 0)),
    price: variant.price || price,
    currency: currency,
  }));

  // Use productId as both slug and ID since it's already URL-friendly
  const slug = productId;

  return {
    id: productId, // Use productId as the ID
    title: productName,
    slug: slug, // Use productId as slug too
    price,
    displayPrice: price,
    currency,
    stock: sfccProduct.inventory?.ats ?? (sfccProduct.stock ?? (orderable ? 99 : 0)),
    size,
    color,
    material,
    productImages,
    availableSizes,
    childProducts,
    orderable,
    hitType: sfccProduct.hitType,
    productType: sfccProduct.productType,
    representedProduct: sfccProduct.representedProduct,
    imageGroups: sfccProduct.imageGroups,
    priceRanges: sfccProduct.priceRanges,
  };
};

/* -------------------- Refinements (facets) -------------------- */

const FACET_MAP = {
  // colors
  c_color: "colors",
  c_refinementColor: "colors",
  refinementColor: "colors",
  color: "colors",
  // materials
  c_material: "materials",
  material: "materials",
  // sizes
  c_size: "sizes",
  size: "sizes",
  // categories
  cgid: "categories",      // ✅ SFCC category facet
  c_category: "categories",
  category: "categories",
  // price
  price: "price",
};

const canonKey = (id = "") => FACET_MAP[id] || null;

const normValues = (values = []) =>
  values
    .map((v) => {
      const id = v?.value ?? v?.id ?? v?.key;
      const name = v?.label ?? v?.name ?? String(id ?? "");
      if (id == null) return null;
      return { id: String(id), name: String(name), count: Number(v?.hitCount ?? 0) };
    })
    .filter(Boolean);

const uniqById = (arr = []) => {
  const seen = new Set();
  return arr.filter((x) => {
    const k = x?.id;
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

const derivePriceMinMax = (values = []) => {
  const lows = [];
  const highs = [];
  values.forEach((v) => {
    const raw = String(v?.value ?? v?.id ?? "");
    const m = raw.match(/\(?\s*(\d+)\s*\.\.\s*(\d+)\s*\)?/);
    if (m) {
      lows.push(Number(m[1]));
      highs.push(Number(m[2]));
    }
  });
  if (!lows.length || !highs.length) return { min: 0, max: 0 };
  return { min: Math.min(...lows), max: Math.max(...highs) };
};

// Best-effort enrichment from hits (if backend facets are sparse)
const enrichFromHits = (facets, hits = []) => {
  if (!Array.isArray(hits) || hits.length === 0) return facets;

  const addIfEmpty = (key, extractor) => {
    if (facets[key]?.length) return;
    const set = new Set();
    hits.forEach((h) => {
      const raw = extractor(h);
      const arr = Array.isArray(raw) ? raw : raw ? [raw] : [];
      arr.forEach((x) => x != null && x !== "" && set.add(String(x)));
    });
    facets[key] = Array.from(set)
      .map((id) => ({ id, name: id }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  addIfEmpty("colors",    (h) => h.c_color || h.color || h.c_refinementColor);
  addIfEmpty("materials", (h) => h.c_material || h.material);
  addIfEmpty("sizes",     (h) => h.c_size || h.size);
  return facets;
};

export const transformSFCCRefinements = (refinements = [], products = []) => {
  ('🔍 transformSFCCRefinements input:', { refinements, products });
  
  const out = {
    categories: [],
    colors: [],
    materials: [],
    sizes: [],
    price: { min: 0, max: 0 },
  };

  if (Array.isArray(refinements)) {
    refinements.forEach((ref, index) => {
      (`🔍 Processing refinement ${index}:`, ref);
      const attrId = ref?.attributeId || ref?.id || ref?.attribute || "";
      const key = canonKey(String(attrId));
      (`🔍 Attribute ID: ${attrId}, Key: ${key}`);
      if (!key) return;

      if (key === "price") {
        const price = derivePriceMinMax(ref?.values || ref?.buckets || []);
        if (price.min || price.max) out.price = price;
        return;
      }

      const vals = normValues(ref?.values || []);
      (`🔍 Values for ${key}:`, vals);
      if (!vals.length) return;

      if (key === "categories") {
        out.categories = uniqById([...(out.categories || []), ...vals]);
        (`🔍 Updated categories:`, out.categories);
      } else if (key === "colors") {
        out.colors = uniqById([...(out.colors || []), ...vals]).sort((a, b) => a.name.localeCompare(b.name));
        (`🔍 Updated colors:`, out.colors);
      } else if (key === "materials") {
        out.materials = uniqById([...(out.materials || []), ...vals]).sort((a, b) => a.name.localeCompare(b.name));
        (`🔍 Updated materials:`, out.materials);
      } else if (key === "sizes") {
        out.sizes = uniqById([...(out.sizes || []), ...vals]).sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
        );
        (`🔍 Updated sizes:`, out.sizes);
      }
    });
  }

  // Fill missing facets from hits
  enrichFromHits(out, products);

  ('🔍 transformSFCCRefinements output:', out);
  return out;
};

/**
 * Build refinements for search request:
 *  [{ attributeId: 'c_color', value: 'red' }, ...]
 */
export const buildRefinements = (filters = {}) => {
  const out = [];
  const pushMany = (attributeId, arr) => {
    if (!arr || !arr.length) return;
    const joined = arr.filter((v) => v != null && v !== "").join("|");
    if (joined) out.push({ attributeId, value: joined });
  };

  pushMany("cgid",       filters.categories);
  pushMany("c_color",    filters.colors);
  pushMany("c_material", filters.materials);
  pushMany("c_size",     filters.sizes);

  if (
    filters.priceRange &&
    filters.priceRange.min !== undefined &&
    filters.priceRange.max !== undefined
  ) {
    out.push({
      attributeId: "price",
      value: `(${Number(filters.priceRange.min)}..${Number(filters.priceRange.max)})`,
    });
  }

  return out;
};
