/**
 * Menu API Service
 * Fetches menu data from the menu.json API response
 */

import sfccApiClient from '../sfccApiClient';
// import { getCurrentSiteIdSync, DEFAULT_SITE_ID } from '../../utils/geolocation';

const ORG_ID = import.meta.env.VITE_SFCC_ORG_ID || "f_ecom_blxz_dev";

/**
 * Fetch menu data (categories with subcategories)
 * @param {string} siteId - Site ID (default: dynamic based on geolocation)
 * @returns {Promise<Object>} Menu data
 */
export async function fetchMenuData(siteId = null) {
  // Use provided siteId, or get dynamic site ID, or fallback
  const currentSiteId =  import.meta.env.VITE_SFCC_SITE_ID;
  
  try {
    const endpoint = `/product/shopper-products/v1/organizations/${ORG_ID}/categories`;
    const params = new URLSearchParams({
      siteId: currentSiteId,
      ids: "root",
      levels: "3"
    });
    
    const url = `${endpoint}?${params.toString()}`;
    
    const response = await sfccApiClient.get(url);
    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Transform menu API data to match component structure
 * @param {Object} apiData - Raw API response from menu.json structure
 * @returns {Object} Transformed data for Menubar component
 */
export function transformMenuData(apiData) {
  if (!apiData?.data?.[0]?.categories) {
    return {};
  }

  const transformed = {};
  const categories = apiData.data[0].categories;

  categories.forEach((category) => {
    const key = category.name.toLowerCase();

    // ===============================
    // ✅ LEVEL 2 + LEVEL 3 HANDLING
    // ===============================
    const subcategories =
      category.categories?.map((sub) => ({
        id: sub.id,
        name: sub.name,
        image: sub.image,
        parentId: sub.parentCategoryId,
        parentCategoryTree: sub.parentCategoryTree,

        // 🔥🔥🔥 NEW: KEEP LEVEL-3 CATEGORIES
        categories:
          sub.categories?.map((lvl3) => ({
            id: lvl3.id,
            name: lvl3.name,
            image: lvl3.image,
            parentId: lvl3.parentCategoryId,
            parentCategoryTree: lvl3.parentCategoryTree,
          })) || [],
      })) || [];

    // ===============================
    // Images logic (UNCHANGED)
    // ===============================
    const imagesFromSubcategories = subcategories
      .map((s) => s.image)
      .filter(Boolean);

    const fallbackImages = [category.image, category.thumbnail].filter(Boolean);

    const transformedCategory = {
      id: category.id,
      name: category.name,
      image: category.image,
      thumbnail: category.thumbnail,
      images:
        imagesFromSubcategories.length > 0
          ? imagesFromSubcategories
          : fallbackImages,

      sideLinks: true,
      subcategories, // Level-2 (now includes Level-3)
    };

    transformed[key] = transformedCategory;
  });

  return transformed;
}


/**
 * Get category URL from category ID
 * @param {string} categoryId - Category ID
 * @returns {string} Category URL
 */
export function getCategoryUrl(categoryId) {
  return `/category/${categoryId}`;
}

/**
 * Get collection URL from collection ID
 * @param {string} collectionId - Collection ID
 * @returns {string} Collection URL
 */
export function getCollectionUrl(collectionId) {
  return `/collection/${collectionId}`;
}
