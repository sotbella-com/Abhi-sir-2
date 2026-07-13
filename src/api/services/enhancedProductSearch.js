/**
 * Enhanced Product Search Service
 * Provides optimized product search with all the latest SFCC API improvements
 */

import sfccApiClient from '../sfccApiClient';
// import { getCurrentSiteId, DEFAULT_SITE_ID } from "../../utils/geolocation";

const ORG_ID = import.meta.env.VITE_SFCC_ORG_ID || "f_ecom_blxz_dev";
const SHORT_CODE = import.meta.env.VITE_SFCC_SHORT_CODE || "dyp4l3dm";

// Default expand fields for comprehensive product data
const DEFAULT_EXPAND_FIELDS = [
  'prices',
  'images',
  'custom_properties',
  'variations',
  'availability'
];

// Default search options for optimal performance
const DEFAULT_SEARCH_OPTIONS = {
  allVariationProperties: true,
  orderableOnly: true,
  masterProductsOnly: true,
  includeInventoryListIds: true,
  expand: DEFAULT_EXPAND_FIELDS,
  limit: 25,
  offset: 0
};


/**
 * Enhanced product search with all SFCC API improvements and dynamic filtering
 * @param {Object} params - Search parameters
 * @param {string} params.query - Search query (optional for category search)
 * @param {string} params.categoryId - Category ID for category-specific search
 * @param {Object} params.filters - Dynamic filter object with attributeId-value pairs
 * @param {string} params.sort - Sort option ID (from sortingOptions response)
 * @param {number} params.limit - Results per page (max 200, default: 25)
 * @param {number} params.offset - Pagination offset (default: 0)
 * @param {string} params.siteId - Site ID (default: sotbella_in)
 * @param {boolean} params.allVariationProperties - Include all variation properties (default: true)
 * @param {boolean} params.orderableOnly - Show only orderable products (default: true)
 * @param {boolean} params.masterProductsOnly - Show only master products (default: true)
 * @param {boolean} params.includeInventoryListIds - Include inventory list IDs (default: true)
 * @param {Array} params.expand - Fields to expand (default: comprehensive list)
 * @param {string} params.currency - Currency code (default: INR)
 * @returns {Promise<Object>} Enhanced search results with dynamic refinements and sorting
 */
export async function searchProductsEnhanced({
  query = "",
  categoryId = "",
  filters = {},
  sort = "",
  limit = 25,
  offset = 0,
  siteId = null,
  allVariationProperties = true,
  orderableOnly = true,
  masterProductsOnly = true,
  includeInventoryListIds = true,
  expand = DEFAULT_EXPAND_FIELDS,
  currency = "",
}) {

  const currentSiteId = import.meta.env.VITE_SFCC_SITE_ID; 
  
  try {
    const endpoint = `/search/shopper-search/v1/organizations/${ORG_ID}/product-search`;
    const params = new URLSearchParams({
      siteId: currentSiteId,
      limit: Math.min(limit, 200).toString(),
      offset: offset.toString(),
      currency,
      allVariationProperties: allVariationProperties.toString(),
      expand: expand.join(','),
      allImages: 'true',
      perPricebook: 'true'
    });

    // Add search query if provided
    if (query) {
      params.append('q', query);
    }

    // Add category filter if provided
    if (categoryId) {
      params.append('refine', `cgid=${categoryId}`);
    }

    // Add core refinements for optimal performance
    if (masterProductsOnly) {
      params.append('refine', 'htype=master');
    }

    if (orderableOnly) {
      params.append('refine', 'orderable_only=true');
    }

    if (includeInventoryListIds) {
      params.append('refine', 'ilids=true');
    }

    // Add dynamic filters from the response structure
    // Support both array format (from buildRefinements) and object format
    if (Array.isArray(filters)) {
      // Handle array format from buildRefinements
      // Group by attributeId and combine multiple values with pipe separator
      const groupedFilters = {};
      filters.forEach(({ attributeId, value }) => {
        if (attributeId && value !== null && value !== undefined && value !== '') {
          if (!groupedFilters[attributeId]) {
            groupedFilters[attributeId] = [];
          }
          groupedFilters[attributeId].push(value);
        }
      });

      // Add grouped filters as refine parameters
      Object.entries(groupedFilters).forEach(([attributeId, values]) => {
        if (attributeId === 'price') {
          // Price range - should only have one value
          const priceValue = values[0];
          if (typeof priceValue === 'string' && priceValue.startsWith('(')) {
            params.append('refine', `price=${priceValue}`);
          }
        } else {
          // For other attributes, combine multiple values with pipe separator
          // API expects: refine=c_color=green|black for multiple values
          const combinedValue = values.join('|');
          params.append('refine', `${attributeId}=${combinedValue}`);
        }
      });
    } else {
      // Handle object format (legacy support)
    Object.entries(filters).forEach(([attributeId, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        // Handle price range filter specially
        if (attributeId === 'price') {
          if (typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
            params.append('refine', `price=(${value.min}..${value.max})`);
          } else if (typeof value === 'string' && value.startsWith('(')) {
            // Already formatted price range string
            params.append('refine', `price=${value}`);
          }
        } else if (Array.isArray(value)) {
         // Handle multiple values for same attribute - combine with pipe separator
            // API expects: refine=c_color=green|black for multiple values
            const combinedValue = value.filter(v => v !== null && v !== undefined && v !== '').join('|');
            if (combinedValue) {
              params.append('refine', `${attributeId}=${combinedValue}`);
            }
          } else {
            // Handle other filters (color, size, material, etc.) - single value
            params.append('refine', `${attributeId}=${value}`);
          }
        }
      });
    }

    // Add sorting using dynamic sort ID
    if (sort) {
      params.append('sort', sort);
    }

    const url = `${endpoint}?${params.toString()}`;


    const response = await sfccApiClient.get(url);

    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Search products by category with enhanced parameters and dynamic filtering
 * @param {string} categoryId - Category ID
 * @param {Object} options - Search options including filters and sort
 * @returns {Promise<Object>} Search results with dynamic refinements
 */
export async function searchCategoryProductsEnhanced(categoryId, options = {}) {
  return searchProductsEnhanced({
    categoryId,
    ...DEFAULT_SEARCH_OPTIONS,
    ...options
  });
}

/**
 * Search all products with enhanced parameters
 * @param {Object} options - Search options
 * @returns {Promise<Object>} Search results
 */
export async function searchAllProductsEnhanced(options = {}) {
  return searchProductsEnhanced({
    query: "*",
    ...DEFAULT_SEARCH_OPTIONS,
    ...options
  });
}

/**
 * Search products by query with enhanced parameters and dynamic filtering
 * @param {string} query - Search query
 * @param {Object} options - Search options including filters and sort
 * @returns {Promise<Object>} Search results with dynamic refinements
 */
export async function searchProductsByQuery(query, options = {}) {
  return searchProductsEnhanced({
    query,
    ...DEFAULT_SEARCH_OPTIONS,
    ...options
  });
}

/**
 * Get product refinements/filters with enhanced parameters
 * @param {string} categoryId - Category ID (optional)
 * @param {string} query - Search query (optional)
 * @param {string} siteId - Site ID
 * @returns {Promise<Object>} Refinements data
 */
export async function getProductRefinementsEnhanced(categoryId = "", query = "", siteId = null) {
  // Use provided siteId, or get dynamic site ID, or fallback
  const currentSiteId = import.meta.env.VITE_SFCC_SITE_ID;
  try {
    const endpoint = `/search/shopper-search/v1/organizations/${ORG_ID}/product-search`;
    const params = new URLSearchParams({
      siteId: currentSiteId,
      limit: '0', // Only get refinements, no products
      allVariationProperties: 'true',
      expand: 'refinements'
    });

    if (query) {
      params.append('q', query);
    }

    if (categoryId) {
      params.append('refine', `cgid=${categoryId}`);
    }

    // Add core refinements
    params.append('refine', 'htype=master');
    params.append('refine', 'orderable_only=true');
    params.append('refine', 'ilids=true');

    const url = `${endpoint}?${params.toString()}`;
    const response = await sfccApiClient.get(url);

    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Get sorting options for products
 * @param {string} categoryId - Category ID (optional)
 * @param {string} siteId - Site ID
 * @returns {Promise<Array>} Available sorting options
 */
export async function getProductSortingOptions(categoryId = "", siteId = null) {
  const currentSiteId = import.meta.env.VITE_SFCC_SITE_ID;
  try {
    const response = await searchProductsEnhanced({
      categoryId,
      limit: 1,
      siteId: currentSiteId
    });

    return response.sortingOptions || [];
  } catch (error) {
    return [];
  }
}

/**
 * Get search suggestions with enhanced parameters
 * @param {string} query - Search query
 * @param {string} siteId - Site ID
 * @param {number} limit - Number of suggestions (default: 5)
 * @returns {Promise<Array>} Search suggestions
 */
export async function getSearchSuggestionsEnhanced(query = "", siteId = null, limit = 5) {
  // Use provided siteId, or get dynamic site ID, or fallback
  const currentSiteId = import.meta.env.VITE_SFCC_SITE_ID;
  try {
    if (!query || query.length < 2) {
      return [];
    }

    const response = await searchProductsEnhanced({
      query,
      siteId,
      limit,
      orderableOnly: true,
      masterProductsOnly: true,
      expand: ['productName', 'image']
    });

    // Extract suggestions from search results
    const suggestions = response.hits?.map(hit => ({
      id: hit.productId,
      name: hit.productName,
      image: hit.image?.link || hit.image?.disBaseLink,
      type: 'product'
    })) || [];

    return suggestions;
  } catch (error) {
    return [];
  }
}

/**
 * Utility function to build dynamic filter object from response structure
 * @param {Object} selectedRefinements - Selected refinements from API response
 * @returns {Object} Filter object with attributeId-value pairs
 */
export function buildDynamicFilters(selectedRefinements = {}) {
  const filters = {};

  // Convert selectedRefinements to filters object
  Object.entries(selectedRefinements).forEach(([attributeId, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      filters[attributeId] = value;
    }
  });

  return filters;
}

/**
 * Utility function to build refinement objects (legacy support)
 * @param {Object} filters - Filter object
 * @returns {Array} Array of refinement objects
 */
export function buildRefinements(filters = {}) {
  const refinements = [];

  // Category refinements
  if (filters.categories && filters.categories.length > 0) {
    filters.categories.forEach(categoryId => {
      refinements.push({
        attributeId: 'cgid',
        value: categoryId
      });
    });
  }

  // Color refinements
  if (filters.colors && filters.colors.length > 0) {
    filters.colors.forEach(color => {
      refinements.push({
        attributeId: 'Color',
        value: color
      });
    });
  }

  // Size refinements
  if (filters.sizes && filters.sizes.length > 0) {
    filters.sizes.forEach(size => {
      refinements.push({
        attributeId: 'size',
        value: size
      });
    });
  }

  // Material refinements
  if (filters.materials && filters.materials.length > 0) {
    filters.materials.forEach(material => {
      refinements.push({
        attributeId: 'material',
        value: material
      });
    });
  }

  // Price range refinements
  if (filters.priceRange && filters.priceRange.min !== undefined && filters.priceRange.max !== undefined) {
    refinements.push({
      attributeId: 'price',
      value: `${filters.priceRange.min}-${filters.priceRange.max}`
    });
  }

  return refinements;
}

export default {
  searchProductsEnhanced,
  searchCategoryProductsEnhanced,
  searchAllProductsEnhanced,
  searchProductsByQuery,
  getProductRefinementsEnhanced,
  getProductSortingOptions,
  getSearchSuggestionsEnhanced,
  buildDynamicFilters,
  buildRefinements,
  DEFAULT_SEARCH_OPTIONS,
  DEFAULT_EXPAND_FIELDS
};
