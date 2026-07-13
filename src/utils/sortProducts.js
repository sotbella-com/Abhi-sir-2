// Utility function to sort products based on different criteria
export const sortProducts = (products, sortBy) => {
  if (!Array.isArray(products) || !sortBy) {
    return products;
  }

  const sortedProducts = [...products];

  switch (sortBy) {
    case "Oldest":
      return sortedProducts.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.updatedAt || 0);
        const dateB = new Date(b.createdAt || b.updatedAt || 0);
        return dateA - dateB; // Oldest first
      });

    case "Newest":
    case "new-products": // SFCC API
      return sortedProducts.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.updatedAt || 0);
        const dateB = new Date(b.createdAt || b.updatedAt || 0);
        return dateB - dateA; // Newest first
      });

    case "Lowest price":
    case "price-low-to-high": // SFCC API
      return sortedProducts.sort((a, b) => {
        const priceA = Number(a.displayPrice || a.price || 0);
        const priceB = Number(b.displayPrice || b.price || 0);
        return priceA - priceB; // Lowest first
      });

    case "Highest price":
    case "price-high-to-low": // SFCC API
      return sortedProducts.sort((a, b) => {
        const priceA = Number(a.displayPrice || a.price || 0);
        const priceB = Number(b.displayPrice || b.price || 0);
        return priceB - priceA; // Highest first
      });

    case "Product title A-Z":
    case "name-asc": // SFCC API
      return sortedProducts.sort((a, b) => {
        const titleA = (a.title || "").toLowerCase();
        const titleB = (b.title || "").toLowerCase();
        return titleA.localeCompare(titleB);
      });

    case "Product title Z-A":
    case "name-desc": // SFCC API
      return sortedProducts.sort((a, b) => {
        const titleA = (a.title || "").toLowerCase();
        const titleB = (b.title || "").toLowerCase();
        return titleB.localeCompare(titleA);
      });

    default:
      return sortedProducts;
  }
};

// Helper function to get sort label from sort value
export const getSortLabel = (sortValue) => {
  const sortLabels = {
    "Oldest": "Oldest",
    "Newest": "Newest",
    "Lowest price": "Lowest price", 
    "Highest price": "Highest price",
    "Product title A-Z": "Product title A-Z",
    "Product title Z-A": "Product title Z-A"
  };
  
  return sortLabels[sortValue] || "SORT BY";
};
