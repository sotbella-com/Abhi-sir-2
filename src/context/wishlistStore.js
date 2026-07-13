  import { create } from "zustand";
  import WishlistService from "@/api/services/wishlist";
  import { getProductDetails } from "@/api/services/sfccSearchService";
  import { getCustomerId as getTokenCustomerId } from "@/utils/tokenUtils";
  import { LOCAL_KEYS } from "@/constants/localStorageKeys";

  /* --------------------------------- Refresh -------------------------------- */
  const hardRefresh = (navigate) => {
    try { if (typeof navigate === "function") { navigate(0); return; } } catch {}
    try { if (typeof window !== "undefined") { window.location.reload(); return; } } catch {}
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("_r", Date.now().toString());
      window.location.assign(url.toString());
      return;
    } catch {}
    try { window.history.go(0); } catch {}
  };

  /* --------------------------- Generic value helpers ------------------------ */
  const asArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);
  const first = (arr) => (Array.isArray(arr) && arr.length ? arr[0] : undefined);
  const isHttp = (url) => typeof url === "string" && /^https?:\/\//i.test(url);

  /* ------------------------------- Image picker ----------------------------- */
  /** Returns [{image: <absoluteOrRelativeUrl>}, ...] */
  const extractImages = (raw) => {
    if (!raw) return [];

    // 1) raw.images: [{src}] or [{url}] or strings
    if (Array.isArray(raw.images) && raw.images.length) {
      return raw.images
        .map((img) => img?.src || img?.url || img?.link || img?.image || img)
        .filter(Boolean)
        .map((u) => ({ image: u }));
    }

    // 2) SFCC "imageGroups": [{images:[{link|url|src}]}]
    if (Array.isArray(raw.imageGroups) && raw.imageGroups.length) {
      const groups = raw.imageGroups.flatMap((g) => asArray(g?.images));
      const urls = groups
        .map((im) => im?.link || im?.url || im?.src || im?.image)
        .filter(Boolean);
      if (urls.length) return urls.map((u) => ({ image: u }));
    }

    // 3) Common custom fields
    const candidates = [
      raw.primaryImage,
      raw.pdpImage,
      raw.tileImage,
      raw.smallImage,
      raw.mediumImage,
      raw.largeImage,
      raw.c_image,
      raw.c_primaryImage,
      raw.c_pdpImage,
      raw.image,
    ]
      .filter(Boolean)
      .map((u) => (typeof u === "string" ? u : u?.src || u?.url || u?.link))
      .filter(Boolean);

    if (candidates.length) return candidates.map((u) => ({ image: u }));

    // 4) Sometimes present under raw.c_images (array of strings)
    if (Array.isArray(raw.c_images) && raw.c_images.length) {
      return raw.c_images.map((u) => ({ image: u }));
    }

    return [];
  };

  /* ------------------------------ Variant picker ---------------------------- */
  /** Returns childProducts[] and availableSizes[] even if "variants" missing */
  const extractVariantsAndSizes = (raw) => {
    const childProducts = [];
    const availableSizes = [];

    // A) If explicit variants are present
    if (Array.isArray(raw.variants) && raw.variants.length) {
      raw.variants.forEach((v) => {
        const sizeName =
          v?.size ||
          v?.c_size ||
          v?.variationValues?.size ||
          v?.variationValues?.Size ||
          v?.values?.size ||
          "";

        childProducts.push({
          id: v?.id || v?.sku || v?.productId,
          orderable: v?.orderable !== false,
          stock: v?.orderable === false ? 0 : 1,
          size: { name: sizeName },
          productImages: v?.image
            ? [{ image: v.image?.src || v.image?.url || v.image }]
            : [],
        });

        if (sizeName) {
          availableSizes.push({
            name: sizeName,
            value: sizeName,
            orderable: v?.orderable !== false,
            _childId: v?.id || v?.sku || v?.productId,
          });
        }
      });
    }

    // B) If no variants, we may still have variationAttributes for size
    if (!childProducts.length && Array.isArray(raw.variationAttributes)) {
      const sizeAttr =
        raw.variationAttributes.find(
          (a) => a?.id?.toLowerCase?.() === "size"
        ) || raw.variationAttributes.find((a) =>
          /size/i.test(a?.name || "")
        );

      if (sizeAttr && Array.isArray(sizeAttr.values)) {
        sizeAttr.values.forEach((val) => {
          const sz = val?.value || val?.name || val?.label || "";
          const orderable =
            val?.orderable !== false && val?.orderable !== "false";
          availableSizes.push({
            name: sz,
            value: sz,
            orderable,
            _childId: null, // no concrete variant id provided by API
          });
        });
      }
    }

    return { childProducts, availableSizes };
  };

  /* ------------------------------ Price picker ------------------------------ */
  const extractPrice = (raw) => {
    const price =
      raw?.price ??
      raw?.salePrice ??
      raw?.c_salePrice ??
      raw?.minPrice ??
      raw?.pricePerUnit ??
      raw?.priceRange?.min ??
      0;

    const mrp =
      raw?.mrp ??
      raw?.listPrice ??
      raw?.c_listPrice ??
      raw?.priceRange?.max ??
      raw?.price ??
      price ??
      0;

    return { price, mrp };
  };

  /* --------------------------- Normalize Product ---------------------------- */
  const normalizeProduct = (raw) => {
    if (!raw) return null;

    // Some services return {data:{…}} or {hit:{…}} or {hits:[…]}
    const core =
      raw?.data ||
      raw?.hit ||
      (Array.isArray(raw?.hits) ? first(raw.hits) : null) ||
      raw;

    const images = extractImages(core);
    const { childProducts, availableSizes } = extractVariantsAndSizes(core);
    const { price, mrp } = extractPrice(core);

    const id = core?.id || core?.productId || core?.sku;
    const title = core?.name || core?.productName || "";
    const stock = core?.orderable === false ? 0 : 1;

    return {
      id,
      title,
      price,
      displayPrice: price,
      mrp,
      stock,
      productImages: images,
      childProducts,
      availableSizes, // may be empty if variants are explicit only
      slug: id,
      size: null,
    };
  };

  /* --------------------------- Helper Functions ----------------------------- */
  /**
   * Extract base product ID by removing size suffix (e.g., "ST-1333XS" -> "ST-1333")
   * Common size suffixes: XS, S, M, L, XL, XXL, XXXL, etc.
   * This function tries to find the base ID by removing trailing size codes.
   */
  const extractBaseProductId = (productId) => {
    if (!productId || typeof productId !== 'string') return productId;
    
    // Common size patterns: XS, S, M, L, XL, XXL, XXXL, etc.
    // Also handle patterns like "ST-1333XS", "ST-1333S", etc.
    // Remove trailing size codes (1-4 letters, case-insensitive)
    const sizePattern = /[A-Z]{1,4}$/i;
    const baseId = productId.replace(sizePattern, '').trim();
    
    // If removal resulted in empty string or very short, return original
    if (!baseId || baseId.length < 3) return productId;
    
    return baseId;
  };

  /**
   * Get wishlist base IDs from localStorage
   * @returns {Array<string>} Array of base product IDs
   */
  const getWishlistBaseIdsFromStorage = () => {
    try {
      const stored = localStorage.getItem(LOCAL_KEYS.WISHLIST_BASE_IDS);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  };

  /**
   * Save wishlist base IDs to localStorage
   * @param {Array<string>} baseIds - Array of base product IDs
   */
  const saveWishlistBaseIdsToStorage = (baseIds) => {
    try {
      const uniqueIds = [...new Set(baseIds.filter(Boolean))];
      localStorage.setItem(LOCAL_KEYS.WISHLIST_BASE_IDS, JSON.stringify(uniqueIds));
    } catch (error) {
      // console.error('Failed to save wishlist to localStorage:', error);
    }
  };

  /**
   * Add base ID to wishlist in localStorage (real-time update)
   * Also triggers store update to cause re-renders
   * @param {string} productId - Full product ID (e.g., "ST-1454XS")
   * @param {Function} setStoreState - Zustand set function to trigger re-renders
   */
  const addBaseIdToStorage = (productId, setStoreState = null) => {
    if (!productId) return;
    const baseId = extractBaseProductId(productId);
    const currentIds = getWishlistBaseIdsFromStorage();
    if (!currentIds.includes(baseId)) {
      saveWishlistBaseIdsToStorage([...currentIds, baseId]);
      // Trigger store update to cause re-renders in all components
      if (setStoreState) {
        setStoreState((state) => ({ 
          handleRefresh: !state.handleRefresh,
          _localStorageUpdated: Date.now() // Force re-render
        }));
      }
    }
  };

  /**
   * Remove base ID from wishlist in localStorage (real-time update)
   * Also triggers store update to cause re-renders
   * @param {string} productId - Full product ID (e.g., "ST-1454XS")
   * @param {Function} setStoreState - Zustand set function to trigger re-renders
   */
  const removeBaseIdFromStorage = (productId, setStoreState = null) => {
    if (!productId) return;
    const baseId = extractBaseProductId(productId);
    const currentIds = getWishlistBaseIdsFromStorage();
    const filtered = currentIds.filter(id => id !== baseId);
    saveWishlistBaseIdsToStorage(filtered);
    // Trigger store update to cause re-renders in all components
    if (setStoreState) {
      setStoreState((state) => ({ 
        handleRefresh: !state.handleRefresh,
        _localStorageUpdated: Date.now() // Force re-render
      }));
    }
  };

  /* --------------------------------- Store ---------------------------------- */
  export const useWishlistStore = create((set, get) => ({
    wishListProduct: [],         // [{ id: listItemId, product: {…}, _listId }]
    isAddedToWishlist: false,
    handleRefresh: false,

    fetchWishlist: async ({ customerId } = {}) => {
      try {
        let cid = customerId;
        if (!cid) { try { cid = await getTokenCustomerId(); } catch {} }
        if (!cid) return set({ wishListProduct: [] });

        const { listId, items } = await WishlistService.getWishlistItems(cid);
        const listItems = Array.isArray(items) ? items : [];

        const enriched = await Promise.all(
          listItems.map(async (it) => {
            try {
              const raw = await getProductDetails(it.productId);
              const normalized = normalizeProduct(raw);
              if (!normalized?.id) return null;
              // FINAL SAFETY: if image URL is absolute already, keep it;
              // component may call getImageUrl() — so raw should remain a plain URL.
              normalized.productImages = (normalized.productImages || []).map((x) => {
                const url = x.image;
                return { image: typeof url === "string" ? url : "" };
              });
              return { id: it.id, product: normalized, _listId: listId };
            } catch (e) {
              return null;
            }
          })
        );

        // Replace entire wishlist with fetched data
        const enrichedList = enriched.filter(Boolean);
        set({ wishListProduct: enrichedList });
        
        // Sync localStorage with backend data (real-time sync)
        const baseIds = enrichedList.map(item => extractBaseProductId(item?.product?.id)).filter(Boolean);
        saveWishlistBaseIdsToStorage(baseIds);
      } catch (error) {
        set({ wishListProduct: [] });
        saveWishlistBaseIdsToStorage([]);
      }
    },

    isInWishlist(productId) {
      if (!productId) return false;
      
      // Check localStorage first (fast, always available, real-time)
      const productBaseId = extractBaseProductId(productId);
      const storedBaseIds = getWishlistBaseIdsFromStorage();
      if (storedBaseIds.includes(productBaseId)) {
        return true;
      }
      
      // Fallback: Check store (for backward compatibility during migration)
      const wishlist = get().wishListProduct || [];
      return wishlist.some((item) => {
        const wishlistProductId = item?.product?.id;
        if (!wishlistProductId) return false;
        
        // Exact match
        if (wishlistProductId === productId) return true;
        
        // Base ID match (e.g., "ST-1333" matches "ST-1333XS")
        const wishlistBaseId = extractBaseProductId(wishlistProductId);
        return wishlistBaseId === productBaseId && productBaseId.length > 0;
      });
    },

    addToWishlist: async ({ item, isAuthenticated, navigate, location, customerId }) => {
      try {
        let cid = customerId;
        if (!cid) { try { cid = await getTokenCustomerId(); } catch {} }

        if (!isAuthenticated || !cid) {
          localStorage.setItem("redirectLink", location?.pathname || "/wishlist");
          if (typeof navigate === "function") navigate("/main-login");
          return;
        }

        const { listId, items } = await WishlistService.getWishlistItems(cid);
        
        // Check for duplicates using base ID matching (not exact ID)
        // This prevents adding both parent and variant (e.g., "ST-1454" and "ST-1454XS")
        const itemBaseId = extractBaseProductId(item?.id);
        const existing = (items || []).find((it) => {
          if (!it?.productId) return false;
          // Check exact match first
          if (it.productId === item?.id) return true;
          // Check base ID match
          const existingBaseId = extractBaseProductId(it.productId);
          return existingBaseId === itemBaseId && itemBaseId.length > 0;
        });

        if (existing) {
          // Remove from backend
          await WishlistService.removeItem(cid, listId, existing.id);
          
          // Remove from localStorage immediately (real-time update) - triggers re-render
          removeBaseIdFromStorage(item.id, set);
          
          // Optimistically remove from store immediately
          set((state) => ({
            wishListProduct: state.wishListProduct.filter(
              (wishItem) => {
                const wishlistId = wishItem?.product?.id;
                if (!wishlistId) return true;
                // Remove if exact match or base ID matches
                const productBaseId = extractBaseProductId(item.id);
                const wishlistBaseId = extractBaseProductId(wishlistId);
                return wishlistId !== item.id && wishlistBaseId !== productBaseId;
              }
            ),
            handleRefresh: !state.handleRefresh,
          }));
          
          hardRefresh(navigate);
          return "Removed from wishlist";
        } else {
          // Add to backend
          await WishlistService.addItem(cid, item.id, 1, listId);
          
          // Add to localStorage immediately (real-time update - makes heart fill instantly) - triggers re-render
          addBaseIdToStorage(item.id, set);
          
          // Optimistically add to store immediately (temporary entry)
          // This will be replaced with full product details when fetchWishlist completes
          const optimisticEntry = {
            id: `temp-${Date.now()}`, // Temporary ID
            product: {
              id: item.id,
              title: item.title || item.name || '',
              price: item.price || 0,
              productImages: item.productImages || [],
            },
            _listId: listId,
            _optimistic: true, // Flag to identify temporary entries
          };
          
          set((state) => ({
            wishListProduct: [...state.wishListProduct, optimisticEntry],
            handleRefresh: !state.handleRefresh,
          }));
          
          // Fetch full wishlist in background to replace optimistic entry with real data
          get().fetchWishlist({ customerId: cid }).catch(() => {
            // If fetch fails, remove optimistic entry but keep localStorage entry
            set((state) => ({
              wishListProduct: state.wishListProduct.filter(
                (wishItem) => wishItem.id !== optimisticEntry.id
              ),
            }));
          });
          
          return "Added to wishlist";
        }
      } catch (error) {
        // On error, remove any optimistic entry
        set((state) => ({
          wishListProduct: state.wishListProduct.filter(
            (wishItem) => !wishItem._optimistic || wishItem.product?.id !== item?.id
          ),
        }));
        throw error;
      }
    },

    removeFromWishlist: async ({ productId, itemId, navigate, customerId }) => {
      try {
        let cid = customerId;
        if (!cid) { try { cid = await getTokenCustomerId(); } catch {} }
        if (!cid) return;

        const { listId, items } = await WishlistService.getWishlistItems(cid);
        let targetItemId = itemId;
        if (!targetItemId && productId) {
          targetItemId = (items || []).find((it) => it.productId === productId)?.id;
        }
        if (!targetItemId) return;

        // Remove from backend
        await WishlistService.removeItem(cid, listId, targetItemId);
        
        // Remove from localStorage immediately (real-time update) - triggers re-render
        if (productId) {
          removeBaseIdFromStorage(productId, set);
        }
        
        // Optimistically remove from store immediately
        set((state) => ({
          wishListProduct: state.wishListProduct.filter(
            (wishItem) => {
              const wishlistId = wishItem?.product?.id;
              if (!wishlistId) return true;
              // Remove if exact match or base ID matches
              const productBaseId = extractBaseProductId(productId);
              const wishlistBaseId = extractBaseProductId(wishlistId);
              return wishlistId !== productId && wishlistBaseId !== productBaseId;
            }
          ),
        }));
        
        // Fetch full wishlist in background to ensure consistency
        get().fetchWishlist({ customerId: cid }).catch(() => {
          // If fetch fails, the optimistic removal is still valid
        });
        
        hardRefresh(navigate);
      } catch (error) {
        // On error, re-fetch to restore correct state
        const cid = customerId || await getTokenCustomerId().catch(() => null);
        if (cid) {
          get().fetchWishlist({ customerId: cid }).catch(() => {});
        }
      }
    },

    clearWishlist: () => set({ wishListProduct: [] }),
  }));
