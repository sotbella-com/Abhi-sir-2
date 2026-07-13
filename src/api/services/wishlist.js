import sfccApiClient from '../sfccApiClient';

// SFCC Wishlist (Customer Product Lists) APIs per whishlist.txt

const buildCustomerListsUrl = (customerId) => {
  const endpoint = `/customer/shopper-customers/v1/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/customers/${customerId}/product-lists`;
  return sfccApiClient.buildUrl(endpoint, import.meta.env.VITE_SFCC_SITE_ID);
};

const buildListItemsUrl = (customerId, listId) => {
  const endpoint = `/customer/shopper-customers/v1/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/customers/${customerId}/product-lists/${listId}/items`;
  return sfccApiClient.buildUrl(endpoint, import.meta.env.VITE_SFCC_SITE_ID);
};

export const WishlistService = {
  async getProductLists(customerId) {
    const url = buildCustomerListsUrl(customerId);
    return await sfccApiClient.get(url);
  },

  async getOrCreateWishlist(customerId) {
    // Get lists
    const listsResponse = await this.getProductLists(customerId);
    // Docs show response with { data: [ ... ], total }
    const lists = listsResponse?.data || listsResponse?.baskets || [];
    let wishList = Array.isArray(lists)
      ? lists.find((l) => l?.type === 'wish_list')
      : null;

    if (wishList) return wishList;

    // Create if not found
    const url = buildCustomerListsUrl(customerId);
    const body = { public: true, type: 'wish_list' };
    return await sfccApiClient.post(url, body);
  },

  async getWishlistItems(customerId) {
    const wishList = await this.getOrCreateWishlist(customerId);
    return {
      listId: wishList?.id,
      items: wishList?.customerProductListItems || [],
      raw: wishList,
    };
  },

  async addItem(customerId, productId, quantity = 1, listIdOverride = null) {
    const listId = listIdOverride || (await this.getOrCreateWishlist(customerId))?.id;
    const url = buildListItemsUrl(customerId, listId);
    const body = {
      product_id: productId,
      quantity: quantity,
      public: true,
      type: 'product',
      priority: 0,
    };
    return await sfccApiClient.post(url, body);
  },

  async addMultiple(customerId, listId, productsJsonString) {
    const url = buildListItemsUrl(customerId, listId);
    const body = {
      product_id: '__bulk__',
      quantity: 1,
      public: true,
      type: 'product',
      priority: 0,
      c_productIdsJson: productsJsonString,
    };
    return await sfccApiClient.post(url, body);
  },

  async removeItem(customerId, listId, itemId) {
    const base = buildListItemsUrl(customerId, listId);
    const [path, qs] = base.split("?");
    const url = `${path}/${itemId}?${qs || ""}`;

    return await sfccApiClient.delete(url);
  }

};

export default WishlistService;
