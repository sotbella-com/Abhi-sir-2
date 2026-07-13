/**
 * Category Links Utility
 * Helper functions for generating category navigation links
 */

/**
 * Convert category ID to URL-friendly slug
 * @param {string} categoryId - Category ID (e.g., "new_in", "shop_by_category")
 * @returns {string} URL slug (e.g., "new-in", "shop-by-category")
 */
export function categoryIdToSlug(categoryId) {
  if (!categoryId) return "";
  return categoryId
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-");
}

/**
 * Convert category slug back to category ID
 * @param {string} slug - URL slug (e.g., "new-in", "shop-by-category")
 * @returns {string} Category ID (e.g., "new_in", "shop_by_category")
 */
export function slugToCategoryId(slug) {
  // console.log("slugToCategoryId", slug);
  if (!slug) return "";
  const a =  slug
    .toLowerCase()
    .replace(/-/g, "_")
    .replace(/\s+/g, "_");
    // console.log(a, 100)
}

/**
 * Generate category page URL
 * @param {string} categoryId - Category ID
 * @returns {string} Category page URL
 */
export function getCategoryUrl(categoryId) {
  // Special-case: "new-in" should keep underscore in URL for consistency
  if (categoryId === "new-in") return "/category/new-in";
  const slug = categoryIdToSlug(categoryId);
  return `/category/${slug}`;
}

/**
 * Generate collection page URL (for backward compatibility)
 * @param {string} collectionId - Collection ID
 * @returns {string} Collection page URL
 */
export function getCollectionUrl(collectionId) {
  if (collectionId === "new-in") return "/category/new-in";
  const slug = categoryIdToSlug(collectionId);
  return `/category/${slug}`;
}

/**
 * Check if a URL is a category page
 * @param {string} pathname - Current pathname
 * @returns {boolean} True if it's a category page
 */
export function isCategoryPage(pathname) {
  return pathname.startsWith("/category/");
}

/**
 * Check if a URL is a category page (alias for backward compatibility)
 * @param {string} pathname - Current pathname
 * @returns {boolean} True if it's a category page
 */
export function isCollectionPage(pathname) {
  return pathname.startsWith("/category/");
}

/**
 * Extract category ID from pathname
 * @param {string} pathname - Current pathname
 * @returns {string|null} Category ID or null
 */
export function extractCategoryIdFromPath(pathname) {
  if (isCategoryPage(pathname)) {
    const match = pathname.match(/^\/category\/(.+)$/);
    return match ? slugToCategoryId(match[1]) : null;
  }
  return null;
}

/**
 * Extract collection ID from pathname
 * @param {string} pathname - Current pathname
 * @returns {string|null} Collection ID or null
 */
export function extractCollectionIdFromPath(pathname) {
  if (isCollectionPage(pathname)) {
    const match = pathname.match(/^\/collection\/(.+)$/);
    return match ? slugToCategoryId(match[1]) : null;
  }
  return null;
}

/**
 * Common category mappings for navigation
 */
export const CATEGORY_MAPPINGS = {
  // Main categories
  "new_in": {
    name: "New In",
    slug: "new-in",
    description: "Latest arrivals and newest products",
    sfccCategoryId: "new_in"
  },
  "new-in": {
    name: "New In",
    slug: "new-in",
    description: "Browse all our products",
    sfccCategoryId: null // No specific category filter
  },
  "best_seller": {
    name: "Best Seller",
    slug: "best-seller",
    description: "Our best selling products",
    sfccCategoryId: "best_seller"
  },
  "shop_by_category": {
    name: "Shop by Category",
    slug: "shop-by-category", 
    description: "Browse products by category"
  },
  "style_by_color": {
    name: "Style by Color",
    slug: "style-by-color",
    description: "Shop by your favorite colors"
  },
  "fabric_edit": {
    name: "Fabric Edit",
    slug: "fabric-edit",
    description: "Curated fabric collections"
  },
  "latest_arrivals": {
    name: "Latest Arrivals",
    slug: "latest-arrivals",
    description: "Just arrived products"
  },
  
  // Subcategories
  "everyday_chic": {
    name: "Everyday Chic",
    slug: "everyday-chic",
    description: "Perfect for daily wear"
  },
  "formal_power_dressing": {
    name: "Formal & Power Dressing",
    slug: "formal-power-dressing",
    description: "Professional and formal wear"
  },
  "evening_wear": {
    name: "Evening Wear",
    slug: "evening-wear",
    description: "Elegant evening outfits"
  },
  "special_even_edit": {
    name: "Special Even Edit",
    slug: "special-even-edit",
    description: "Special occasion pieces"
  },
  "celebration_edit": {
    name: "Celebration Edit",
    slug: "celebration-edit",
    description: "Perfect for celebrations"
  }
};

/**
 * Get category info by ID
 * @param {string} categoryId - Category ID
 * @returns {Object|null} Category info or null
 */
export function getCategoryInfo(categoryId) {
  return CATEGORY_MAPPINGS[categoryId] || null;
}

/**
 * Get all available category links for navigation
 * @returns {Array} Array of category link objects
 */
export function getAllCategoryLinks() {
  return Object.entries(CATEGORY_MAPPINGS).map(([id, info]) => ({
    id,
    ...info,
    url: getCategoryUrl(id)
  }));
}

/**
 * Generate breadcrumb data for category pages
 * @param {string} categoryId - Category ID
 * @param {Object} categoryInfo - Additional category info
 * @returns {Array} Breadcrumb items
 */
export function generateCategoryBreadcrumbs(categoryId, categoryInfo = {}) {
  const info = getCategoryInfo(categoryId) || categoryInfo;
  const name = info.name || categoryId?.replace(/_/g, " ").toUpperCase();
  
  return [
    { label: "HOME", url: "/" },
    { label: "CATEGORIES", url: "/categories" },
    { label: name, url: getCategoryUrl(categoryId), current: true }
  ];
}
