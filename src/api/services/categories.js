/**
 * Categories API Service
 * Fetches category data from Salesforce Commerce Cloud
 */

import sfccApiClient from '../sfccApiClient';
// import { getCurrentSiteIdSync, DEFAULT_SITE_ID } from '../../utils/geolocation';

const ORG_ID = import.meta.env.VITE_SFCC_ORG_ID;

/**
 * Fetch categories with subcategories
 * @param {string} categoryIds - Comma-separated list of category IDs (e.g., "new_in,shop_by_catagory")
 * @param {number} levels - Number of levels to include subcategories (default: 2)
 * @param {string} siteId - Site ID (default: dynamic based on geolocation)
 * @returns {Promise<Object>} Categories data
 */
export async function fetchCategories(categoryIds = "new_in,shop_by_catagory", levels = 2, siteId = null) {
  // Use provided siteId, or get dynamic site ID, or fallback
  const currentSiteId = siteId || import.meta.env.VITE_SFCC_SITE_ID;
  try {
    const endpoint = `/product/shopper-products/v1/organizations/${ORG_ID}/categories`;
    const params = new URLSearchParams({
      siteId: currentSiteId,
      ids: categoryIds,
      levels: levels.toString()
    });
    
    const url = `${endpoint}?${params.toString()}`;
    
    const response = await sfccApiClient.get(url);
    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Fetch all root categories
 * @param {string} siteId - Site ID (default: dynamic based on geolocation)
 * @returns {Promise<Object>} Root categories data
 */
export async function fetchRootCategories(siteId = null) {
  // Use provided siteId, or get dynamic site ID, or fallback
  const currentSiteId = siteId || import.meta.env.VITE_SFCC_SITE_ID;
  
  try {
    const endpoint = `/product/shopper-products/v1/organizations/${ORG_ID}/categories`;
    const params = new URLSearchParams({
      siteId: currentSiteId,
      ids: "root",
      levels: "1"
    });
    
    const url = `${endpoint}?${params.toString()}`;
    return await sfccApiClient.get(url);
  } catch (error) {
    throw error;
  }
}

/**
 * Transform API data to match component structure
 * @param {Object} apiData - Raw API response
 * @returns {Object} Transformed data for component
 */
export function transformCategoriesData(apiData) {
  if (!apiData?.data) {
    return {};
  }  
  const transformed = {};
  
  apiData.data.forEach(category => {
    const key = category.id.toLowerCase().replace(/_/g, ' ');
    
    const transformedCategory = {
      id: category.id,
      name: category.name,
      image: category.image,
      thumbnail: category.thumbnail,
      sideLinks: true, // Enable side links for all categories
      subcategories: category.categories?.map(sub => ({
        id: sub.id,
        name: sub.name,
        parentId: sub.parentCategoryId
      })) || []
    };
    
    transformed[key] = transformedCategory;
    
  });
  return transformed;
}
