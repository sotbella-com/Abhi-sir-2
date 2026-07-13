/**
 * Category Search API Service
 * Fetches category products from Salesforce Commerce Cloud Shopper Search API
 */

import sfccApiClient from '../sfccApiClient';

const ORG_ID = import.meta.env.VITE_SFCC_ORG_ID || "f_ecom_blxz_stg";
const SHORT_CODE = import.meta.env.VITE_SFCC_SHORT_CODE || "dyp4l3dm";

/**
 * Search products by category ID with enhanced parameters and dynamic filtering
 * @param {string} categoryId - Category ID (e.g., "new_in", "shop_by_category")
 * @param {Object} options - Search options
 * @param {number} options.limit - Maximum records to retrieve (default: 25, max: 200)
 * @param {number} options.offset - Offset for pagination (default: 0)
 * @param {Object} options.filters - Dynamic filter object with attributeId-value pairs
 * @param {string} options.sort - Sort option ID (from sortingOptions response)
 * @param {string} options.siteId - Site ID (default: sotbella_in)
 * @param {boolean} options.allVariationProperties - Include all variation properties (default: true)
 * @param {boolean} options.orderableOnly - Show only orderable products (default: true)
 * @param {boolean} options.masterProductsOnly - Show only master products (default: true)
 * @param {boolean} options.includeInventoryListIds - Include inventory list IDs (default: true)
 * @param {Array} options.expand - Fields to expand (default: ['prices', 'images', 'custom_properties', 'variations', 'availability'])
 * @returns {Promise<Object>} Search results with products and dynamic refinements
 */
export async function searchCategoryProducts(categoryId, options = {}) {
  try {
    const {
      limit = 200,
      offset = 0,
      filters = {},
      sort = "",
      siteId = null,
      allVariationProperties = true,
      orderableOnly = true,
      masterProductsOnly = true,
      includeInventoryListIds = true,
      expand = [
        "availability",
        "images",
        "prices",
        "represented_products",
        "variations",
        "promotions",
        "custom_properties",
      ],
      allImages = true
    } = options;

    // currentSiteId correctly
    const currentSiteId =
      siteId ||
      import.meta.env.VITE_SFCC_SITE_ID;

    const endpoint = `/search/shopper-search/v1/organizations/${ORG_ID}/product-search`;

    const params = new URLSearchParams({
      siteId: currentSiteId,
      limit: Math.min(limit, 200).toString(),
      offset: offset.toString(),
      refine: `cgid=${categoryId}`,
      allVariationProperties: allVariationProperties.toString(),
      expand: expand.join(","),
      locale: import.meta.env.VITE_SFCC_LOCALE,
      // sort: "category-position",
      allImages: allImages,
      perPricebook: true
    });

    // Core refinements
    if (masterProductsOnly) {
      params.append("refine", "htype=master");
    }

    if (orderableOnly) {
      params.append("refine", "orderable_only=true");
    }

    if (includeInventoryListIds) {
      params.append("refine", "ilids=true");
    }

    // Dynamic filters
    if (Array.isArray(filters)) {
      filters.forEach(({ attributeId, value }) => {
        if (value !== null && value !== undefined && value !== "") {
          params.append("refine", `${attributeId}=${value}`);
        }
      });
    } else {
      Object.entries(filters).forEach(([attributeId, value]) => {
        if (value === null || value === undefined || value === "") return;

        if (
          attributeId === "price" &&
          typeof value === "object" &&
          value.min !== undefined &&
          value.max !== undefined
        ) {
          params.append("refine", `price=(${value.min}..${value.max})`);
        } else {
          params.append("refine", `${attributeId}=${value}`);
        }
      });
    }

    // Sorting
    if (sort) {
      params.append("sort", sort);
    }

    const url = `${endpoint}?${params.toString()}`;


    const response = await sfccApiClient.get(url);


    return response;
  } catch (error) {
    throw error;
  }
}


/**
 * Get category refinements (filters) for a specific category
 * @param {string} categoryId - Category ID
 * @param {string} siteId - Site ID (default: sotbella_in)
 * @returns {Promise<Object>} Refinements data
 */
export async function getCategoryRefinements(categoryId, siteId = null) {
  // Use provided siteId, or get dynamic site ID, or fallback
  const currentSiteId = siteId || import.meta.env.VITE_SFCC_SITE_ID || DEFAULT_SITE_ID;
  try {
    const response = await searchCategoryProducts(categoryId, {
      limit: 1,
      offset: 0,
      siteId: currentSiteId
    });

    return {
      refinements: response.refinements || [],
      sortingOptions: response.sortingOptions || [],
      total: response.total || 0
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Transform SFCC product data to match application structure
 * @param {Object} sfccProduct - Product from SFCC API
 * @returns {Object} Transformed product
 */
export function transformSFCCProduct(sfccProduct) {
  const {
    productId,
    productName,
    price,
    pricePerUnit,
    currency,
    image,
    orderable,
    variationAttributes = [],
    representedProduct
  } = sfccProduct;

  // Extract variation attributes
  const variations = {};
  variationAttributes.forEach(attr => {
    if (attr.values && attr.values.length > 0) {
      variations[attr.id] = {
        id: attr.id,
        name: attr.name,
        value: attr.values[0].value,
        label: attr.values[0].name,
        orderable: attr.values[0].orderable
      };
    }
  });

  return {
    id: productId,
    title: productName,
    price: price || 0,
    displayPrice: pricePerUnit || price || 0,
    currency: currency || '',
    slug: productName?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || productId,
    stock: orderable ? 1 : 0,
    productImages: image ? [{
      id: `${productId}-main`,
      image: image.link || image.disBaseLink,
      alt: image.alt || productName,
      type: 'product'
    }] : [],
    size: variations.size ? {
      id: variations.size.id,
      name: variations.size.label,
      value: variations.size.value
    } : null,
    color: variations.Color ? {
      id: variations.Color.id,
      name: variations.Color.label,
      value: variations.Color.value
    } : null,
    material: variations.material ? {
      id: variations.material.id,
      name: variations.material.label,
      value: variations.material.value
    } : null,
    variationAttributes: variations,
    representedProduct: representedProduct?.id || productId,
    isVariant: sfccProduct.productType?.variant || false
  };
}

/**
 * Transform SFCC refinements to application filter structure
 * @param {Array} sfccRefinements - Refinements from SFCC API
 * @returns {Object} Transformed filter data
 */
export function transformSFCCRefinements(sfccRefinements) {
  const filters = {
    categories: [],
    colors: [],
    materials: [],
    sizes: [],
    price: { min: 0, max: 0 }
  };

  sfccRefinements.forEach(refinement => {
    const { attributeId, label, values } = refinement;

    if (!values || !Array.isArray(values)) return;

    switch (attributeId) {
      case 'cgid':
        filters.categories = values.map(item => ({
          id: item.value,
          name: item.label,
          count: item.hitCount || 0
        }));
        break;

      case 'c_color':
        filters.colors = values.map(item => ({
          id: item.value,
          name: item.label,
          count: item.hitCount || 0
        }));
        break;

      case 'c_material':
        filters.materials = values.map(item => ({
          id: item.value,
          name: item.label,
          count: item.hitCount || 0
        }));
        break;

      case 'c_size':
        filters.sizes = values.map(item => ({
          id: item.value,
          name: item.label,
          count: item.hitCount || 0
        }));
        break;

      case 'price':
        if (values.length > 0) {
          const priceValues = values.map(v => {
            const match = v.value.match(/\((\d+)\.\.(\d+)\)/);
            return match ? { min: parseInt(match[1]), max: parseInt(match[2]) } : null;
          }).filter(Boolean);

          if (priceValues.length > 0) {
            filters.price = {
              min: Math.min(...priceValues.map(p => p.min)),
              max: Math.max(...priceValues.map(p => p.max))
            };
          }
        }
        break;
    }
  });

  return filters;
}

/**
 * Build refinement objects for API calls
 * @param {Object} filters - Filter selections
 * @returns {Array} Refinement objects
 */
export function buildRefinements(filters) {
  const refinements = [];

  if (filters.colors && filters.colors.length > 0) {
    filters.colors.forEach(color => {
      refinements.push({
        attributeId: 'c_color',
        value: color
      });
    });
  }

  if (filters.materials && filters.materials.length > 0) {
    filters.materials.forEach(material => {
      refinements.push({
        attributeId: 'c_material',
        value: material
      });
    });
  }

  if (filters.sizes && filters.sizes.length > 0) {
    filters.sizes.forEach(size => {
      refinements.push({
        attributeId: 'c_size',
        value: size
      });
    });
  }

  if (filters.priceRange && filters.priceRange.min !== undefined && filters.priceRange.max !== undefined) {
    refinements.push({
      attributeId: 'price',
      value: `(${filters.priceRange.min}..${filters.priceRange.max})`
    });
  }

  return refinements;
}
