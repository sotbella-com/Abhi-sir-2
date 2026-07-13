/**
 * SFCC Product Search Service
 * Handles product search using Salesforce Commerce Cloud API
 */

import sfccApiClient from '../sfccApiClient';

const ORG_ID = import.meta.env.VITE_SFCC_ORG_ID || "f_ecom_blxz_dev";
// import { getCurrentSiteId } from '@/utils/sfccSiteConfig';
const DEFAULT_CURRENCY = "";

const resolveSiteId = (siteId) =>
  import.meta.env.VITE_SFCC_SITE_ID;

/**
 * Search products using SFCC Product Search API with enhanced parameters and dynamic filtering
 * @param {Object} params - Search parameters
 * @param {string} params.query - Search query
 * @param {Object} params.filters - Dynamic filter object with attributeId-value pairs
 * @param {string} params.sort - Sort option ID (from sortingOptions response)
 * @param {number} params.limit - Results per page (max 200)
 * @param {number} params.offset - Pagination offset
 * @param {string} params.siteId - Site ID (defaults to sotbella_in)
 * @param {boolean} params.allVariationProperties - Include all variation properties (default: true)
 * @param {boolean} params.orderableOnly - Show only orderable products (default: true)
 * @param {boolean} params.masterProductsOnly - Show only master products (default: true)
 * @param {boolean} params.includeInventoryListIds - Include inventory list IDs (default: true)
 * @param {Array} params.expand - Fields to expand (default: ['prices', 'images', 'custom_properties', 'variations', 'availability'])
 * @returns {Promise<Object>} Search results with dynamic refinements
 */
export async function searchProducts({
  query = "",
  filters = {},
  sort = "",
  limit = 25,
  offset = 0,
  siteId = null,
  allVariationProperties = true,
  orderableOnly = true,
  masterProductsOnly = true,
  includeInventoryListIds = true,
  expand = ['prices', 'images', 'custom_properties', 'variations', 'availability']
}) {
  try {
    // Use provided siteId, or get dynamic site ID, or fallback
    const currentSiteId = resolveSiteId(siteId);


    // Build query parameters
    const searchParams = new URLSearchParams({
      siteId: currentSiteId,
      q: query,
      limit: Math.min(limit, 200).toString(),
      offset: offset.toString(),
      currency: DEFAULT_CURRENCY,
      allVariationProperties: allVariationProperties.toString(),
      expand: expand.join(','),
      perPricebook: 'true'
    });

    // Add core refinements for better performance
    if (masterProductsOnly) {
      searchParams.append('refine', 'htype=master');
    }

    if (orderableOnly) {
      searchParams.append('refine', 'orderable_only=true');
    }

    if (includeInventoryListIds) {
      searchParams.append('refine', 'ilids=true');
    }

    // Add dynamic filters from the response structure
    Object.entries(filters).forEach(([attributeId, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        // Handle price range filter specially
        if (attributeId === 'price' && typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
          searchParams.append('refine', `price=(${value.min}..${value.max})`);
        } else {
          // Handle other filters (color, size, material, etc.)
          searchParams.append('refine', `${attributeId}=${value}`);
        }
      }
    });

    // Add sorting using dynamic sort ID
    if (sort) {
      searchParams.append('sort', sort);
    }

    const endpoint = `/search/shopper-search/v1/organizations/${ORG_ID}/product-search?${searchParams.toString()}`;

    return await sfccApiClient.get(endpoint);
  } catch (error) {
    throw error;
  }
}

/**
 * Get search refinements/filters
 * @param {string} query - Search query
 * @param {string} siteId - Site ID
 * @returns {Promise<Object>} Refinements data
 */
export async function getSearchRefinements(query = "", siteId = null) {
  // Use provided siteId, or get dynamic site ID, or fallback
  const currentSiteId = resolveSiteId(siteId);

  try {
    const searchParams = new URLSearchParams({
      siteId: currentSiteId,
      q: query,
      limit: "1", // Minimum required by SFCC API (1-200), we only need refinements
      currency: DEFAULT_CURRENCY
    });

    const endpoint = `/search/shopper-search/v1/organizations/${ORG_ID}/product-search?${searchParams.toString()}`;


    const response = await sfccApiClient.get(endpoint);
    return response.refinements || [];
  } catch (error) {
    throw error;
  }
}

/**
 * Get search suggestions
 * @param {string} query - Search query (minimum 3 characters)
 * @param {string} siteId - Site ID
 * @param {number} limit - Maximum number of suggestions per type (default: 5, max: 10)
 * @returns {Promise<Object>} Search suggestions data
 */
export async function getSearchSuggestions(query = "", siteId = null, limit = 5) {
  // Use provided siteId, or get dynamic site ID, or fallback
  const currentSiteId = resolveSiteId(siteId);

  try {
    // Only fetch suggestions if query is at least 3 characters
    if (query.length < 3) {
      return {
        brandSuggestions: { suggestedTerms: [] },
        categorySuggestions: { categories: [], suggestedPhrases: [], suggestedTerms: [] },
        contentSuggestions: { suggestedTerms: [] },
        customSuggestions: { suggestedTerms: [] },
        productSuggestions: { products: [], suggestedPhrases: [], suggestedTerms: [] },
        searchPhrase: query
      };
    }

    const searchParams = new URLSearchParams({
      siteId: currentSiteId,
      q: query,
      limit: Math.min(limit, 10).toString(), // Max 10 per type
      currency: DEFAULT_CURRENCY
    });

    const endpoint = `/search/shopper-search/v1/organizations/${ORG_ID}/search-suggestions?${searchParams.toString()}`;

    const response = await sfccApiClient.get(endpoint);
    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Transform SFCC product data to our format
 * @param {Object} sfccProduct - Product from SFCC API
 * @returns {Object} Transformed product
 */
export function transformSFCCSearchProduct(sfccProduct) {
  const variationAttributes = sfccProduct.variationAttributes || [];

  const findAttr = (id) =>
    variationAttributes.find((a) => (a.id || "").toLowerCase() === id);

  // Extract color, size, material from variation attributes
  const color = findAttr("color")?.values?.[0]?.value || "";
  const size = findAttr("size")?.values?.[0]?.value || "";
  const material = findAttr("material")?.values?.[0]?.value || "";

  return {
    id: sfccProduct.productId,
    name: sfccProduct.productName,
    price: sfccProduct.price,
    currency: sfccProduct.currency,
    image: sfccProduct.image?.link || "",
    alt: sfccProduct.image?.alt || sfccProduct.productName,
    orderable: sfccProduct.orderable,
    color,
    size,
    material,
    slug: (sfccProduct.productId || "").toLowerCase().replace(/_/g, "-"),
    c_promotions: sfccProduct.c_promotions || [],
  };
}

/**
 * Transform SFCC refinements to our filter format
 * @param {Array} sfccRefinements - Refinements from SFCC API
 * @returns {Object} Transformed filter data
 */
export function transformSFCCRefinements(sfccRefinements) {
  const filterData = {
    categories: [],
    colors: [],
    materials: [],
    sizes: [],
    price: { min: 0, max: 10000 }
  };

  sfccRefinements.forEach(refinement => {
    switch (refinement.attributeId) {
      case 'c_color':
        filterData.colors = (refinement.values || [])
          .filter((item) => Number(item.hitCount || 0) > 0)   // ✅ hide 0 hitCount
          .map((item) => ({
            id: item.value,
            name: item.label,
            count: item.hitCount,
          }));
        break;

      case 'c_material':
        filterData.materials = (refinement.values || [])
          .filter((item) => Number(item.hitCount || 0) > 0)   // ✅ hide 0 hitCount
          .map((item) => ({
            id: item.value,
            name: item.label,
            count: item.hitCount,
          }));
        break;
      case 'c_size':
        filterData.sizes = refinement.values.map(item => ({
          id: item.value,
          name: item.label,
          count: item.hitCount
        }));
        break;
      case 'cgid':
        filterData.categories = refinement.values.map(item => ({
          id: item.value,
          name: item.label,
          count: item.hitCount
        }));
        break;
      default:
        break;
    }
  });

  return filterData;
}

/**
 * Build refinement parameters for API
 * @param {Object} filters - Filter selections
 * @returns {Array} Refinement array for API
 */
export function buildSearchRefinements(filters) {
  const refinements = [];

  // Price range
  if (filters.priceRange && (filters.priceRange.min > 0 || filters.priceRange.max < 10000)) {
    refinements.push({
      type: 'price',
      value: `(${filters.priceRange.min}..${filters.priceRange.max})`
    });
  }

  // Colors
  if (filters.colors && filters.colors.length > 0) {
    refinements.push({
      type: 'c_color',
      value: filters.colors.join('|')
    });
  }

  // Materials
  if (filters.materials && filters.materials.length > 0) {
    refinements.push({
      type: 'c_material',
      value: filters.materials.join('|')
    });
  }

  // Sizes
  if (filters.sizes && filters.sizes.length > 0) {
    refinements.push({
      type: 'c_size',
      value: filters.sizes.join('|')
    });
  }

  // Categories
  if (filters.categories && filters.categories.length > 0) {
    refinements.push({
      type: 'cgid',
      value: filters.categories.join('|')
    });
  }

  return refinements;
}

/**
 * Get product details by ID using SFCC Product API
 * @param {string} productId - Product ID/SKU
 * @param {string} siteId - Site ID (defaults to sotbella_in)
 * @returns {Promise<Object>} Product details
 */
export async function getProductDetails(productId, siteId = null) {
  try {
    // Use provided siteId, or get dynamic site ID, or fallback
    const currentSiteId = resolveSiteId(siteId);


    const searchParams = new URLSearchParams({
      allImages: true,
      siteId: currentSiteId,
      perPricebook: true,
      currency: DEFAULT_CURRENCY
    });

    const endpoint = `/product/shopper-products/v1/organizations/${ORG_ID}/products/${productId}?${searchParams.toString()}`;

    return await sfccApiClient.get(endpoint);
  } catch (error) {
    throw error;
  }
}

/**
 * Transform SFCC product details to our format
 * @param {Object} sfccProduct - Product details from SFCC API
 * @returns {Object} Transformed product details
 */
export function transformSFCCProductDetails(sfccProduct) {
  const variationAttributes = sfccProduct.variationAttributes || [];
  const imageGroups = sfccProduct.imageGroups || [];
  const variants = sfccProduct.variants || [];

  // helper: find attr by lowercase id
  const findAttr = (id) =>
    variationAttributes.find((a) => (a.id || "").toLowerCase() === id) || { values: [] };

  // Extract main product info from imageGroups
  const mainImageGroup = imageGroups.find(img => img.viewType === 'large') || imageGroups[0];
  const mainImage = mainImageGroup?.images?.[0];

  // Build images array from all image groups
  const allImages = imageGroups
    .flatMap(group => group.images || [])
    .map(img => ({
      src: img.link,
      alt: img.alt || sfccProduct.name,
      title: img.title || sfccProduct.name
    }));

  // Extract variation attributes
  const colorOptions = findAttr("color").values || [];
  const sizeOptions = findAttr("size").values || [];
  const materialOptions = findAttr("material").values || [];

  // Build variants array
  const productVariants = variants.map((v) => {
    const vv = v.variationValues || {};
    const vvLower = Object.fromEntries(
      Object.entries(vv).map(([k, val]) => [k.toLowerCase(), val])
    );
    return {
      id: v.productId,
      name: sfccProduct.name,
      price: v.price ?? sfccProduct.price,
      currency: sfccProduct.currency || "INR",
      image: mainImage?.link || "",
      alt: mainImage?.alt || sfccProduct.name,
      orderable: v.orderable !== false,
      stock: sfccProduct.inventory?.ats || 0,
      color: vvLower.color || "",
      size: vvLower.size || "",
      material: vvLower.material || "",
    };
  });

  // ✅ Fix: Build size orderable map from actual variants (source of truth)
  // This ensures we use the variant's orderable status, not just variationAttributes
  // A size is orderable if at least one variant of that size is orderable
  const sizeOrderableMap = new Map();
  variants.forEach((v) => {
    const size = (v.variationValues?.size || "").toUpperCase().trim();
    if (size) {
      // orderable is true if v.orderable is not explicitly false
      // (undefined/null/true all mean orderable, only false means not orderable)
      const variantOrderable = v.orderable !== false;
      // If size already exists, mark as orderable if existing OR current variant is orderable
      // (size is available if ANY variant of that size is orderable)
      const existingOrderable = sizeOrderableMap.get(size);
      if (existingOrderable === undefined) {
        // First time seeing this size
        sizeOrderableMap.set(size, variantOrderable);
      } else {
        // Already exists - keep it orderable if it was already orderable OR current variant is orderable
        sizeOrderableMap.set(size, existingOrderable || variantOrderable);
      }
    }
  });

  return {
    id: sfccProduct.productId || sfccProduct.id || sfccProduct.master?.masterId,
    title: sfccProduct.c_one_word_name,
    name: sfccProduct.name,
    shortDescription: sfccProduct.shortDescription,
    longDescription: sfccProduct.longDescription,
    price: sfccProduct.price,
    currency: sfccProduct.currency,
    image: mainImage?.link,
    alt: mainImage?.alt || sfccProduct.name,
    orderable: sfccProduct.master?.orderable ?? true,
    stock: sfccProduct.inventory?.ats || 0,
    brand: sfccProduct.brand,
    master: sfccProduct.master,
    primaryCategoryId: sfccProduct.primaryCategoryId,
    categories: sfccProduct.categories || [],
    variationAttributes,

    images: allImages,
    variants: productVariants,

    // expose normalized options (keep simple text chip if no hex)
    colorOptions: colorOptions.map((o) => ({
      id: o.value,
      name: o.name || o.value,
      value: o.value,
      orderable: o.orderable !== false,
      hexCode: o.c_hexCode || o.hex || null,
    })),
    // ✅ Fix: Use variant orderable status from variants array (source of truth)
    // Always check variants array directly - it's the authoritative source
    sizeOptions: sizeOptions.map((o) => {
      const sizeValue = (o.value || "").toUpperCase().trim();

      // Always check variants array directly for this size (most reliable)
      const sizeVariants = variants.filter((v) => {
        const variantSize = (v.variationValues?.size || "").toUpperCase().trim();
        return variantSize === sizeValue;
      });

      let orderable = false;
      if (sizeVariants.length > 0) {
        // Size is orderable if ANY variant of this size is orderable
        // Check each variant: orderable is true if not explicitly false
        // IMPORTANT: We check the raw variant's orderable property directly
        orderable = sizeVariants.some((v) => {
          // Explicitly check: if orderable is false, then not orderable
          // If orderable is true, undefined, or null, then orderable
          const isVariantOrderable = v.orderable !== false;
          return isVariantOrderable;
        });
      } else {
        // No variants found for this size - check sizeOrderableMap as fallback
        if (sizeOrderableMap.has(sizeValue)) {
          orderable = sizeOrderableMap.get(sizeValue);
        } else {
          // Last resort: Use variationAttributes (should rarely happen)
          orderable = o.orderable !== false;
        }
      }

      return {
        id: o.value,
        name: o.name || o.value,
        value: o.value,
        orderable,
      };
    }),
    materialOptions: materialOptions.map((o) => ({
      id: o.value,
      name: o.name || o.value,
      value: o.value,
      orderable: o.orderable !== false,
    })),

    minOrderQuantity: sfccProduct.minOrderQuantity || 1,
    stepQuantity: sfccProduct.stepQuantity || 1,
    maxOrderQuantity: sfccProduct.maxOrderQuantity || 999,
    pageTitle: sfccProduct.pageTitle || sfccProduct.name,
    pageDescription: sfccProduct.pageDescription || sfccProduct.shortDescription,
    keywords: sfccProduct.c_tags || [],
    c_promotions: sfccProduct.c_promotions || [],
    priceRanges: sfccProduct.priceRanges || [],
  };
}

/**
 * Map sort options to SFCC format
 * @param {string} sortOption - Our sort option
 * @returns {string} SFCC sort option
 */
export function mapSortOption(sortOption) {
  const sortMap = {
    'Oldest': 'new-products',
    'Newest': 'new-products',
    'Lowest price': 'price-low-to-high',
    'Highest price': 'price-high-to-low',
    'Product title A-Z': 'name-asc',
    'Product title Z-A': 'name-desc'
  };

  return sortMap[sortOption] || '';
}
