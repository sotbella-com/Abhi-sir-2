import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import GuestCartService from '../api/services/guestCart';
import BasketMergeService from '../api/services/basketMerge';
import { getCustomerBaskets, getMostRecentBasket } from '../api/services/customerBaskets';
import sfccApiClient from '../api/sfccApiClient';
import storageManager from '../utils/storageManager';
import CartErrorHandler from '../utils/cartErrorHandler';
import { getCustomerId } from '../utils/tokenUtils';
import { logger } from '../utils/logger.js';
import {
  getAuthoritativeGuestBasketData,
  getAuthoritativeCustomerBasketData,
  validateBasketIdConsistency,
  cleanupGuestCartData
} from '../utils/cartDataManager';
import {
  getAuthoritativeBasketId,
  setBasketIdConsistently,
  clearBasketId,
  validateBasketIdConsistency as validateBasketId,
  getBasketIdFromBasket
} from '../utils/basketIdManager';
import { add_coupon_to_basket, add_payment_instrument, create_order_from_basket, remove_coupon_from_basket, update_shipping_address, update_shipping_method, remove_payment_instrument } from '@/api/services/sfccCheckout';
// import { getCurrentLocale, getCurrentSiteId } from '@/utils/sfccSiteConfig';
import { toast } from "react-toastify";
import { trackAddToCart as trackEinsteinAddToCart } from '@/api/services/einsteinTracking';

const CART_STORAGE_KEY = 'unified-cart-storage';
const GUEST_BASKET_KEY = 'guest_basket_id';
const CUSTOMER_BASKET_KEY = 'customer_basket_id';

// Small helpers to resolve site & locale dynamically
const resolveSiteId = () =>
  (typeof getCurrentSiteId === "function" && getCurrentSiteId()) ||
  import.meta.env.VITE_SFCC_SITE_ID ||
  "sotbella_in"; // fallback

const resolveLocale = () =>
  (typeof getCurrentLocale === "function" && getCurrentLocale()) ||
  import.meta.env.VITE_SFCC_LOCALE ||
  "en-IN"; // fallback

export const useUnifiedCartStore = create(
  persist(
    (set, get) => ({
      // State
      basket: null,
      basketId: null,
      basketType: 'guest',
      isLoading: false,
      error: null,
      itemCount: 0,
      total: 0,
      orderTotalUI: 0, // ✅ reset
      isInitialized: false,
      showCartModal: false,
      _initializationLock: null, // Lock for preventing concurrent initialization

      // Actions
      setBasket: (basket) => {
        // Get basket ID from basket object (validated)
        const basketId = getBasketIdFromBasket(basket);
        const basketType = basket?.temporaryBasket ? 'guest' : 'customer';

        // Validate consistency with existing state
        const currentState = get();
        if (currentState.basketId && basketId && currentState.basketId !== basketId) {
          logger.warn('Basket ID mismatch in setBasket:', {
            existing: currentState.basketId,
            new: basketId,
            basketType
          });
          // Use the new ID from basket (more authoritative)
        }

        const itemCount = basket?.productItems?.reduce((total, item) => total + item.quantity, 0) || 0;
        const total = basket?.productSubTotal || 0;

        set({
          basket,
          itemCount,
          total,
          basketId: basketId,
          basketType: basketType,
          error: null
        });

        // Set basket ID consistently across all storage locations
        if (basketId) {
          setBasketIdConsistently(basketId, basketType, currentState);
        }

        try {
          // Persist guest items snapshot for merge fallback
          if (basket?.temporaryBasket && Array.isArray(basket.productItems)) {
            const pendingItems = basket.productItems.map((it) => ({
              productId: it.productId,
              quantity: it.quantity || 1,
            }));
            localStorage.setItem('pending_merge_items', JSON.stringify(pendingItems));
          } else {
            localStorage.removeItem('pending_merge_items');
          }
        } catch { }

        // Trigger custom event for components that might not be subscribed to the store
        logger.log('Dispatching cartUpdated event for setBasket:', {
          itemCount,
          total,
          basketId: basket?.basketId,
          basketType: basket?.temporaryBasket ? 'guest' : 'customer',
          action: 'setBasket',
          productItemsCount: basket?.productItems?.length || 0
        });
        window.dispatchEvent(new CustomEvent('cartUpdated', {
          detail: {
            itemCount,
            total,
            basketId: basket?.basketId,
            basketType: basket?.temporaryBasket ? 'guest' : 'customer',
            action: 'setBasket'
          }
        }));

        logger.log('UnifiedCartStore: State set successfully');
      },

      setOrderTotalUI: (value) => {
  const n = Number(value);
  set({ orderTotalUI: Number.isFinite(n) ? n : 0 });
},


      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      // Force UI update - triggers re-render of all components using this store
      forceUpdate: () => {
        logger.log('Forcing UI update...');
        set((state) => ({ ...state }));
      },

      // Debug function to log current cart state
      debugCartState: () => {
        const state = get();
        logger.log('Cart Debug State:', {
          basket: state.basket,
          basketId: state.basketId,
          basketType: state.basketType,
          itemCount: state.itemCount,
          total: state.total,
          isLoading: state.isLoading,
          error: state.error,
          isInitialized: state.isInitialized,
          productItems: state.basket?.productItems,
          productItemsCount: state.basket?.productItems?.length || 0
        });
      },

      // Test function to manually trigger cart update event
      testCartUpdate: () => {
        logger.log('Testing cart update event...');
        window.dispatchEvent(new CustomEvent('cartUpdated', {
          detail: {
            type: 'test',
            itemCount: get().itemCount,
            total: get().total,
            timestamp: Date.now()
          }
        }));
      },

      // Test refresh cart from API
      testRefreshCart: async () => {
        logger.log('Testing refresh cart from API...');
        try {
          const result = await get().refreshCartFromAPI();
          logger.log('Refresh test successful:', result);
          return result;
        } catch (error) {
          throw error;
        }
      },

      // Immediate cart count update - updates count before full basket data is available
      updateCartCountImmediately: (productId, quantity = 1) => {
        const { itemCount, total } = get();
        const newItemCount = itemCount + quantity;

        logger.log('Updating cart count immediately:', {
          previousCount: itemCount,
          newCount: newItemCount,
          addedQuantity: quantity
        });

        // Update count immediately for instant UI feedback
        set((state) => ({
          ...state,
          itemCount: newItemCount,
          // Keep existing total for now, will be updated with full basket data
        }));

        // Force UI update
        get().forceUpdate();

        // Trigger a custom event for components that might not be subscribed to the store
        logger.log('Dispatching cartUpdated event for immediate count update:', {
          itemCount: newItemCount,
          total: total,
          action: 'add',
          quantity: quantity
        });
        window.dispatchEvent(new CustomEvent('cartUpdated', {
          detail: {
            itemCount: newItemCount,
            total: total,
            action: 'add',
            quantity: quantity
          }
        }));
      },

      // Modal controls
      handleShow: () => set({ showCartModal: true }),
      handleClose: () => set({ showCartModal: false }),

      // Initialize cart - this is the main entry point
      initializeCart: async () => {
        const currentState = get();
        
        // CART-002: Proper locking mechanism to prevent race conditions
        if (currentState._initializationLock) {
          logger.log('Cart initialization already in progress, waiting...');
          // Wait for existing initialization to complete
          await currentState._initializationLock;
          return;
        }
        if (currentState.isInitialized) {
          logger.log('Cart already initialized, skipping...');
          return;
        }

        // Create lock promise
        let resolveLock;
        const lockPromise = new Promise(resolve => {
          resolveLock = resolve;
        });
        
        set({ _initializationLock: lockPromise, isLoading: true, error: null });

        try {

          // Check authentication state using storage manager
          const authState = storageManager.getAuthState();
          const isGuest = !authState.isUserLoggedIn;

          logger.log('🛒 Initializing cart with auth state:', {
            isUserLoggedIn: authState.isUserLoggedIn,
            hasGuestData: authState.hasGuestData,
            isGuest
          });

          let customerId;

          if (isGuest) {
            // For guest users, ensure valid token and get customer ID
            try {
              const { getAuthToken, getCustomerId } = await import('../utils/tokenUtils.js');

              // This will automatically ensure token is valid (refresh if needed)
              const token = await getAuthToken();
              if (!token) {
                throw new Error('No valid token available');
              }

              customerId = await getCustomerId();
            } catch (error) {
              set({ error: 'Failed to initialize guest session' });
              return;
            }
          } else {
            // For logged-in users, get customer ID from auth_token
            const { getCustomerId } = await import('../utils/tokenUtils.js');
            customerId = await getCustomerId();
          }

          logger.log('Customer ID and User Data check:', {
            customerId,
            customerIdExists: !!customerId,
            isGuest,
            authState: authState
          });

          // Both guest and logged-in users should have customer IDs
          if (!customerId) {
            logger.log('No customer ID found, cannot initialize cart');
            set({ error: 'No customer ID found' });
            return;
          }

          // Validate customer ID format
          if (customerId === 'undefined' || customerId === 'null' || customerId.length < 10) {
            logger.log('Invalid customer ID format:', customerId);
            set({ error: 'Invalid customer ID format' });
            return;
          }

          logger.log('Initializing cart for customer:', {
            customerId,
            isGuest,
            authState: authState,
            type: isGuest ? 'guest' : 'user'
          });

          // Check for basketId in URL (e.g. from Buy Now flow)
          const urlParams = new URLSearchParams(window.location.search);
          const urlBasketId = urlParams.get('basketId');
          if (urlBasketId) {
             logger.log('OPTIMIZED: Found basketId in URL, will prefer this basket:', urlBasketId);
          }

          // OPTIMIZED FLOW: Use authoritative data sources
          if (isGuest) {
            // Guest Cart Flow (per optimization plan):
            // 1. Check guest_token → extract customer_id → fetch baskets → use most recent
            logger.log('🛒 OPTIMIZED: Initializing guest cart using authoritative source...');

            const guestBasketData = await getAuthoritativeGuestBasketData();

            if (guestBasketData.basketId && guestBasketData.basket) {
              // Use the basket from authoritative source
              logger.log('✅ OPTIMIZED: Using guest basket from authoritative source:', {
                basketId: guestBasketData.basketId,
                source: guestBasketData.source,
                itemCount: guestBasketData.basket.productItems?.length || 0
              });

              get().setBasket(guestBasketData.basket);
              set({ isInitialized: true });
              return;
            } else if (guestBasketData.basketId) {
              // We have basket ID but need to fetch the basket
              logger.log('OPTIMIZED: Fetching guest basket details...');
              try {
                const basket = await GuestCartService.getBasket(guestBasketData.basketId, guestBasketData.customerId);
                if (basket) {
                  get().setBasket(basket);
                  set({ isInitialized: true });
                  return;
                }
              } catch (error) {
                logger.warn('Failed to fetch guest basket, will create new one:', error);
              }
            }

            // No existing basket found - create new one
            logger.log('OPTIMIZED: Creating new guest basket...');
            await get().initializeGuestCart();
            logger.log('Guest basket created successfully');
          } else {
            // Customer Cart Flow (per optimization plan):
            // 1. API call to get customer baskets (always from API, no localStorage cache)
            logger.log('🛒 OPTIMIZED: Initializing customer cart using authoritative source...');

            const customerBasketData = await getAuthoritativeCustomerBasketData(customerId, urlBasketId);

            if (customerBasketData.basket) {
              // Use the basket from authoritative source
              logger.log('✅ OPTIMIZED: Using customer basket from authoritative source:', {
                basketId: customerBasketData.basketId,
                source: customerBasketData.source,
                itemCount: customerBasketData.basket.productItems?.length || 0
              });

              get().setBasket(customerBasketData.basket);
              set({ isInitialized: true });
              return;
            }

            // No existing basket found - create new one
            logger.log('OPTIMIZED: Creating new customer basket...');
            await get().createNewCustomerBasket(customerId);
            logger.log('Customer basket created successfully');
          }

          set({ isInitialized: true });
        } catch (error) {
          set({ error: error.message });
        } finally {
          // CART-002: Release lock
          set({ isLoading: false, _initializationLock: null });
          if (resolveLock) {
            resolveLock();
          }
        }
      },

      // Initialize guest cart (OPTIMIZED: Uses authoritative source)
      initializeGuestCart: async () => {
        try {
          logger.log('🛒 OPTIMIZED: Initializing guest cart using authoritative source...');

          // OPTIMIZED FLOW: Check guest_token → extract customer_id → fetch baskets → use most recent
          const guestBasketData = await getAuthoritativeGuestBasketData();

          if (guestBasketData.basketId && guestBasketData.basket) {
            // Use existing basket from authoritative source
            logger.log('✅ OPTIMIZED: Using existing guest basket:', {
              basketId: guestBasketData.basketId,
              source: guestBasketData.source,
              itemCount: guestBasketData.basket.productItems?.length || 0
            });

            get().setBasket(guestBasketData.basket);
            return guestBasketData.basket;
          } else if (guestBasketData.basketId) {
            // We have basket ID but need to fetch the basket
            logger.log('OPTIMIZED: Fetching guest basket details...');
            try {
              const basket = await GuestCartService.getBasket(guestBasketData.basketId, guestBasketData.customerId);
              if (basket) {
                get().setBasket(basket);
                return basket;
              }
            } catch (error) {
              logger.warn('Failed to fetch guest basket, will create new one:', error);
            }
          }

          // No existing basket found - create new one
          logger.log('OPTIMIZED: Creating new guest basket...');
          const basket = await GuestCartService.createBasket();

          if (basket) {
            get().setBasket(basket);
            logger.log('✅ OPTIMIZED: Guest basket created and initialized:', basket.basketId);
            return basket;
          }

          throw new Error('Failed to create guest basket');
        } catch (error) {
          logger.error('❌ Failed to initialize guest cart:', error);
          throw error;
        }
      },

      // Initialize customer cart
      initializeCustomerCart: async (customerId, guestData = null) => {
        try {
          // Ensure we use the customerId from the active user token to avoid mismatch
          let tokenCustomerId = await getCustomerId();
          if (tokenCustomerId && customerId && tokenCustomerId !== customerId) {
          }
          if (tokenCustomerId) {
            customerId = tokenCustomerId;
          }
          if (!customerId) {
            throw new Error('No customerId available for customer cart initialization');
          }

          // OPTIMIZED: Get authoritative guest basket data (single source of truth)
          let guestBasketData = null;

          // Priority 1: Use guest data from login params (most reliable - extracted before login)
          if (guestData && guestData.guestBasketId) {
            guestBasketData = {
            basketId: guestData.guestBasketId,
            customerId: guestData.guestCustomerId,
            basket: null,
            source: 'login_params'
          };
          logger.log('CART MERGE: Using guest data from login params:', guestBasketData);
          } else {
            // Priority 2: Get from authoritative source (guest_token or API)
            guestBasketData = await getAuthoritativeGuestBasketData();
            logger.log('✅ CART MERGE: Got guest basket from authoritative source:', guestBasketData);
          }

          const guestBasketId = guestBasketData?.basketId;
          const guestCustomerId = guestBasketData?.customerId;

          // CART-001: Validate basket ID consistency using basketIdManager
          if (guestBasketId) {
            const currentState = get();
            const authoritativeId = getAuthoritativeBasketId(currentState, 'guest');
            if (authoritativeId && !validateBasketId(guestBasketId, authoritativeId, 'guest_basket_merge')) {
              logger.warn('CART MERGE: Basket ID mismatch detected, using authoritative source');
            }
          }

          let customerBasket = null;

          // Check if merge was already attempted in AuthContext
          // If merge was attempted but failed, we should still try here with fallback
          // Only skip if merge was explicitly marked as completed
          const mergeAlreadyCompleted = guestData && guestData.mergeCompleted === true;

          // STEP 1: Get authoritative customer basket data (always from API)
          logger.log('CART INIT: Step 1 - Getting customer basket from API...');
          const customerBasketData = await getAuthoritativeCustomerBasketData(customerId);
          customerBasket = customerBasketData.basket;

          if (customerBasket) {
            logger.log('✅ CART INIT: Step 1 - Found existing customer basket:', {
              basketId: customerBasket.basketId,
              itemCount: customerBasket.productItems?.length || 0,
              total: customerBasket.productTotal || 0,
              source: customerBasketData.source
            });
          } else {
            // STEP 2: Create new customer basket if none exists
            logger.log('🆕 CART INIT: Step 2 - No customer basket found, creating new basket...');
            try {
              customerBasket = await BasketMergeService.getOrCreateCustomerBasket(customerId);
              if (customerBasket) {
                logger.log('✅ CART INIT: Step 2 - New customer basket created:', {
                  basketId: customerBasket.basketId,
                  itemCount: customerBasket.productItems?.length || 0,
                  total: customerBasket.productTotal || 0
                });
              } else {
                throw new Error('Failed to create customer basket');
              }
            } catch (error) {
              logger.error('CART INIT: Step 2 - Error creating customer basket:', error);
              throw error;
            }
          }

          // CART-003: If merge was already completed in AuthContext, use the merged basket
          if (mergeAlreadyCompleted && guestData?.mergeResult?.basket) {
            logger.log('CART: Merge already completed in AuthContext, using merged basket from mergeResult');
            // Use the merged basket from AuthContext (this has both customer and guest items)
            customerBasket = guestData.mergeResult.basket;
            
            // Verify the merged basket has the correct structure
            if (customerBasket && customerBasket.basketId) {
              logger.log('✅ CART: Using merged basket from AuthContext:', {
                basketId: customerBasket.basketId,
                itemCount: customerBasket.productItems?.length || 0,
                total: customerBasket.productTotal || 0,
                items: customerBasket.productItems?.map(item => ({
                  productId: item.productId,
                  quantity: item.quantity
                })) || []
              });
              
              // CART-001: Ensure basket ID is set consistently
              setBasketIdConsistently(customerBasket.basketId, 'customer', get());
              
              // Set the merged basket in Zustand state
              get().setBasket(customerBasket);
              get().forceUpdate();
              
              // Clean up guest data after successful merge
              try {
                storageManager.clearGuestData();
              } catch (e) {
                logger.warn('Failed to clear guest data:', e);
              }
              
              // Set final state and return
              const finalCartState = {
                basket: customerBasket,
                basketId: customerBasket.basketId,
                basketType: 'customer',
                itemCount: customerBasket.productItems?.reduce((total, item) => total + item.quantity, 0) || 0,
                total: customerBasket.productTotal || 0
              };
              
              set(finalCartState);
              return customerBasket; // Exit early with merged basket
            } else {
              logger.warn('CART: Merge marked as completed but merged basket is invalid, fetching fresh customer basket');
              // Fall through to fetch fresh customer basket
            }
          } else if (mergeAlreadyCompleted) {
            // Merge was marked as completed but no merged basket provided - fetch fresh customer basket
            logger.log('✅ CART: Merge already completed in AuthContext, fetching fresh customer basket to verify');
            // Continue to use the customerBasket we fetched, but refresh it to ensure it has all items
            try {
              const refreshedBasket = await get().getCustomerBasket(customerBasket?.basketId);
              if (refreshedBasket) {
                customerBasket = refreshedBasket;
                logger.log('✅ CART: Refreshed customer basket after merge:', {
                  basketId: customerBasket.basketId,
                  itemCount: customerBasket.productItems?.length || 0
                });
              }
            } catch (refreshError) {
              logger.warn('⚠️ CART: Failed to refresh customer basket, using existing:', refreshError);
            }
          } else if (guestBasketId && customerBasket && guestData?.guestBasketItems) {
            // Fallback: If merge failed in AuthContext, try manual item transfer using helper
            logger.log('🛟 CART: Merge failed in AuthContext, attempting fallback item transfer...');
            
            try {
              const { manuallyAddGuestItems } = await import('../utils/basketMergeHelper.js');
              const fallbackResult = await manuallyAddGuestItems(guestData.guestBasketItems, customerBasket.basketId);
              
              if (fallbackResult.success && fallbackResult.addedItems.length > 0) {
                // Refresh customer basket after additions
                const refreshed = await get().getCustomerBasket(customerBasket.basketId);
                if (refreshed) {
                  customerBasket = refreshed;
                  get().setBasket(refreshed);
                  get().forceUpdate();
                  logger.log('CART: Fallback item transfer completed:', {
                    addedItems: fallbackResult.addedItems.length,
                    failedItems: fallbackResult.failedItems.length
                  });
                }
              } else {
                logger.warn('CART: Fallback item transfer failed or no items added');
              }
            } catch (fallbackError) {
              logger.error('CART: Fallback item transfer error:', fallbackError);
              // Continue with customer basket - user can manually re-add items
            }
          } else if (guestBasketId && customerBasket) {
            // Last resort: Try merge API one more time (shouldn't happen if AuthContext worked correctly)
            logger.warn('CART: Merge not completed in AuthContext and no guest items provided, attempting merge API...');
            try {
              const mergedBasket = await BasketMergeService.mergeBaskets(guestBasketId, customerBasket.basketId);
              if (mergedBasket && mergedBasket.basketId) {
                customerBasket = mergedBasket;
                get().setBasket(mergedBasket);
                get().forceUpdate();
                logger.log('CART: Merge API succeeded in cart store fallback');
              }
            } catch (mergeError) {
              logger.error('CART: Merge API failed in cart store fallback:', mergeError);
              // Continue with customer basket - user can manually re-add items
            }
          }

          // CART-001: Set basket ID consistently after merge/initialization
          if (customerBasket && customerBasket.basketId) {
            setBasketIdConsistently(customerBasket.basketId, 'customer', get());
            get().setBasket(customerBasket);
          }
          
          // CART-003: Old complex merge logic completely removed
          // All merge logic is now handled in AuthContext with fallback support

          // Only proceed with merge if we have guest basket data
          // Initialize variables for guest basket verification (outside try block for scope)
          let guestBasketValid = false;
          let guestBasketItems = [];
          
          if (guestBasketId && customerBasket) {
            try {
              // Use guest customer ID from the data extracted before login
              // This is the customer_id from the guest auth_token (before it was replaced)
              const guestCustomerIdToUse = guestCustomerId || localStorage.getItem('pending_guest_customer_id');

              logger.log('CART MERGE DEBUG: Verifying guest basket with customer ID:', {
                guestBasketId,
                guestCustomerId: guestCustomerIdToUse,
                source: guestCustomerId ? 'from login params' : 'from localStorage'
              });

              // Priority 1: Fetch guest basket using saved guest_token (single source of truth)
              // The guest_token was saved in localStorage before login in authTokenManager.saveUserToken
              const guestTokenRaw = localStorage.getItem('guest_token');
              if (guestTokenRaw && guestBasketId) {
                try {
                  const guestToken = JSON.parse(guestTokenRaw);
                  logger.log('CART MERGE DEBUG: Found saved guest_token, fetching guest basket:', {
                    guestBasketId,
                    guestCustomerId: guestToken.customer_id,
                    tokenSavedAt: guestToken.saved_at ? new Date(guestToken.saved_at).toISOString() : 'unknown'
                  });

                  // Temporarily use guest token to fetch the basket
                  // We'll use the guest token's access_token to make the API call
                  const originalToken = localStorage.getItem('auth_token');

                  // Temporarily set guest token as auth_token to fetch basket
                  localStorage.setItem('auth_token', JSON.stringify(guestToken));

                  try {
                    // Fetch guest basket using GuestCartService with the guest token
                    const guestBasket = await GuestCartService.getBasket(guestBasketId, guestToken.customer_id);

                    if (guestBasket && guestBasket.productItems?.length > 0) {
                      guestBasketValid = true;
                      guestBasketItems = guestBasket.productItems;
                      logger.log('CART MERGE DEBUG: Guest basket fetched successfully using saved guest_token:', {
                        basketId: guestBasketId,
                        itemCount: guestBasketItems.length,
                        items: guestBasketItems.map(item => ({
                          productId: item.productId,
                          quantity: item.quantity,
                          itemId: item.itemId
                        }))
                      });
                    } else {
                      logger.warn('CART MERGE DEBUG: Guest basket found but has no items:', {
                        basketId: guestBasketId,
                        basketExists: !!guestBasket
                      });
                    }
                  } finally {
                    // Restore original user token
                    if (originalToken) {
                      localStorage.setItem('auth_token', originalToken);
                    }
                  }
                } catch (fetchError) {
                  logger.warn('CART MERGE DEBUG: Failed to fetch guest basket using saved guest_token:', fetchError.message);
                  // Continue to try other sources
                }
              }

              // Priority 2: Check localStorage snapshot (fallback if guest_token fetch failed)
              if (!guestBasketValid) {
                const raw = localStorage.getItem('pending_merge_items');
                const pending = raw ? JSON.parse(raw) : [];
                if (Array.isArray(pending) && pending.length > 0) {
                  guestBasketValid = true;
                  guestBasketItems = pending;
                  logger.log('CART MERGE DEBUG: Guest basket items found in localStorage snapshot:', {
                    itemCount: guestBasketItems.length
                  });
                }
              }

              // Priority 3: Check localStorage snapshot (last resort - still localStorage, not Zustand state)
              // We don't use Zustand state here - localStorage is the single source of truth
              if (!guestBasketValid) {
                // Try to get items from localStorage snapshot if available
                const raw = localStorage.getItem('pending_merge_items');
                const pending = raw ? JSON.parse(raw) : [];
                if (Array.isArray(pending) && pending.length > 0) {
                  guestBasketValid = true;
                  guestBasketItems = pending;
                  logger.log('CART MERGE DEBUG: Guest basket items found in localStorage snapshot:', {
                    basketId: guestBasketId,
                    itemCount: guestBasketItems.length,
                    note: 'Using localStorage snapshot - no Zustand state used'
                  });
                }
              }

              if (!guestBasketValid) {
                logger.warn('CART MERGE DEBUG: No guest basket items found from any source, will skip merge and use fallback');
              }
            } catch (verifyError) {
              logger.warn('CART MERGE DEBUG: Failed to verify guest basket, will try merge anyway:', verifyError);
              // Continue to try merge - it might still work
              guestBasketValid = true;
            }

            // Only attempt merge if we have valid guest basket items
            if (guestBasketValid && guestBasketItems.length > 0) {
              try {
                logger.log('CART MERGE DEBUG: Starting merge process:', {
                  guestBasketId,
                  customerBasketId: customerBasket.basketId,
                  customerBasketItemsBefore: customerBasket.productItems?.length || 0,
                  guestBasketItemsCount: guestBasketItems.length,
                  timestamp: new Date().toISOString()
                });

                // Store customer basket ID before merge for reference
                // Note: The merge API merges source basket into current shopper's active basket
                // Since we're using a user token, it will merge into the user's active basket
                const destinationBasketId = customerBasket.basketId;

                logger.log('CART MERGE DEBUG: About to merge:', {
                  sourceBasketId: guestBasketId,
                  destinationBasketId: destinationBasketId,
                  note: 'Merge will merge source into current shopper\'s active basket (from token)'
                });

                // Merge guest basket into customer basket
                // The merge API automatically uses the current shopper's active basket as destination
                const mergedBasket = await BasketMergeService.mergeBaskets(
                  guestBasketId,
                  destinationBasketId
                );

                logger.log('CART MERGE DEBUG: Basket merge API call completed:', {
                  mergedBasketId: mergedBasket?.basketId,
                  totalItems: mergedBasket?.productItems?.length || 0,
                  totalValue: mergedBasket?.productTotal,
                  currency: mergedBasket?.currency,
                  items: mergedBasket?.productItems?.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    itemId: item.itemId,
                    productName: item.productName
                  })) || [],
                  timestamp: new Date().toISOString()
                });

                // The merge response should contain the merged basket
                // CRITICAL: Always refresh the customer basket after merge to ensure we have the latest state
                // The merge API might return a partial response, so we need to fetch the full basket
                logger.log('CART MERGE DEBUG: Merge API call completed, refreshing customer basket to get latest state...');
                
                // Always fetch the customer basket after merge to ensure we have all items
                // This is critical because the merge response might not include all product details
                try {
                  // Use the destination basket ID (customer basket) to fetch the merged result
                  const refreshedBasket = await get().getCustomerBasket(destinationBasketId);
                  if (refreshedBasket && refreshedBasket.basketId) {
                    customerBasket = refreshedBasket;
                    // CRITICAL: Update Zustand with refreshed basket (latest from API with all items)
                    get().setBasket(refreshedBasket);
                    get().forceUpdate();
                    logger.log('CART MERGE DEBUG: Refreshed customer basket after merge and updated Zustand:', {
                      basketId: customerBasket.basketId,
                      totalItems: customerBasket.productItems?.length || 0,
                      totalValue: customerBasket.productTotal,
                      currency: customerBasket.currency,
                      items: customerBasket.productItems?.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        itemId: item.itemId,
                        productName: item.productName
                      })) || [],
                      note: 'This basket should contain both existing customer items and merged guest items'
                    });
                  } else {
                    // Fallback: Use merge response if refresh failed
                    if (mergedBasket && mergedBasket.basketId) {
                      customerBasket = mergedBasket;
                      get().setBasket(mergedBasket);
                      get().forceUpdate();
                      logger.warn('CART MERGE DEBUG: Refresh failed, using merge response:', {
                        basketId: mergedBasket.basketId,
                        totalItems: mergedBasket.productItems?.length || 0
                      });
                    }
                  }
                } catch (fetchError) {
                  logger.error('CART MERGE DEBUG: Failed to refresh customer basket after merge:', fetchError);
                  // Fallback: Use merge response if available
                  if (mergedBasket && mergedBasket.basketId) {
                    customerBasket = mergedBasket;
                    get().setBasket(mergedBasket);
                    get().forceUpdate();
                    logger.warn('CART MERGE DEBUG: Using merge response as fallback due to refresh error');
                  } else {
                    // Last resort: Try to fetch using original destination basket ID
                    try {
                      const fetchedBasket = await get().getCustomerBasket(destinationBasketId);
                      if (fetchedBasket) {
                        customerBasket = fetchedBasket;
                        get().setBasket(fetchedBasket);
                        get().forceUpdate();
                        logger.log('CART MERGE DEBUG: Fetched customer basket using destination ID as last resort');
                      }
                    } catch (lastResortError) {
                      logger.error('CART MERGE DEBUG: All attempts to get merged basket failed:', lastResortError);
                    }
                  }
                }

                // Clean up guest basket key regardless of merge outcome
                cleanupGuestCartData();
              } catch (error) {
                // Check if it's a 409 error (source basket doesn't exist or wrong previous customer)
                const is409Error = error.message?.includes('409') || error.message?.includes('Conflict');
                const isSourceBasketError = error.message?.includes('no active basket') ||
                  error.message?.includes('Source Basket') ||
                  error.message?.includes('previous customer');

                if (is409Error && isSourceBasketError) {
                  logger.warn('CART MERGE DEBUG: Merge API failed (409) - SFCC cannot identify previous shopper, using manual item transfer:', {
                    error: error.message,
                    guestBasketId,
                    guestBasketItemsCount: guestBasketItems.length,
                    note: 'SFCC session tracking issue - will manually add items from guest basket'
                  });

                  // Fallback: Manually add items from guest basket to customer basket
                  // This happens when SFCC cannot identify the previous shopper from session
                  if (guestBasketItems.length > 0 && customerBasket?.basketId) {
                    try {
                      logger.log('CART MERGE FALLBACK: Manually adding guest items to customer basket:', {
                        itemCount: guestBasketItems.length,
                        customerBasketId: customerBasket.basketId
                      });

                      for (const item of guestBasketItems) {
                        if (item.productId && item.quantity > 0) {
                          try {
                            // Add item - productId should already be the variant productId if it has variations
                            const itemsPayload = [{
                              productId: item.productId,
                              quantity: item.quantity
                            }];

                            const endpoint = `/checkout/shopper-baskets/v2/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/baskets/${customerBasket.basketId}/items`;
                            const url = sfccApiClient.buildUrl(endpoint, resolveSiteId());
                            const params = new URLSearchParams({ locale: resolveLocale() });
                            const fullUrl = `${url}&${params.toString()}`;

                            await sfccApiClient.post(fullUrl, itemsPayload);
                            logger.log('CART MERGE FALLBACK: Added item successfully:', {
                              productId: item.productId,
                              quantity: item.quantity
                            });
                          } catch (addErr) {
                            logger.warn('CART MERGE FALLBACK: Failed to add item, continuing:', {
                              productId: item.productId,
                              quantity: item.quantity,
                              error: addErr.message
                            });
                          }
                        }
                      }

                      // Refresh customer basket after additions
                      const refreshed = await get().getCustomerBasket(customerBasket.basketId);
                      if (refreshed) {
                        customerBasket = refreshed;
                        // CRITICAL: Update Zustand with refreshed basket (latest from API)
                        get().setBasket(refreshed);
                        get().forceUpdate();
                        logger.log('CART MERGE FALLBACK: Customer basket updated after manual item transfer and Zustand synced:', {
                          totalItems: customerBasket.productItems?.length || 0,
                          totalValue: customerBasket.productTotal
                        });
                      }

                      // Clean up guest data after successful manual transfer
                      // Note: Guest basket deletion requires guest token, but it's not critical if it fails
                      // The items are already transferred, so we can just clean up localStorage
                      try {
                        // Try to delete using guest token if available
                        const guestTokenRaw = localStorage.getItem('guest_token');
                        if (guestTokenRaw && guestBasketId) {
                          try {
                            const guestToken = JSON.parse(guestTokenRaw);
                            const originalToken = localStorage.getItem('auth_token');

                            // Temporarily use guest token to delete the basket
                            localStorage.setItem('auth_token', JSON.stringify(guestToken));
                            try {
                              await BasketMergeService.deleteBasket(guestBasketId);
                              logger.log('CART MERGE FALLBACK: Guest basket deleted successfully using guest token');
                            } finally {
                              // Restore user token
                              if (originalToken) {
                                localStorage.setItem('auth_token', originalToken);
                              }
                            }
                          } catch (deleteError) {
                            logger.warn('Failed to delete guest basket (non-critical):', deleteError.message);
                          }
                        }

                        // Always clean up localStorage regardless of deletion success
                        localStorage.removeItem(GUEST_BASKET_KEY);
                        localStorage.removeItem('guest_token');
                        logger.log('CART MERGE FALLBACK: Guest data cleaned up from localStorage');
                      } catch (cleanupError) {
                        logger.warn('Failed to clean up guest data:', cleanupError);
                        // Still try to clean up localStorage
                        try {
                          localStorage.removeItem(GUEST_BASKET_KEY);
                          localStorage.removeItem('guest_token');
                        } catch { }
                      }
                    } catch (fbErr) {
                      logger.error('CART MERGE FALLBACK: Failed to manually transfer items:', fbErr);
                      throw fbErr;
                    }
                  } else {
                    logger.warn('CART MERGE FALLBACK: Cannot transfer items - missing guest items or customer basket');
                  }
                } else {
                  // Other errors - log and throw
                  logger.error('CART MERGE ERROR: Failed to merge baskets:', {
                    error: error.message,
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    responseData: error.response?.data,
                    stack: error.stack,
                    guestBasketId,
                    customerBasketId: customerBasket?.basketId
                  });
                  throw error;
                }
              }
            } else {
              // No valid guest basket items found - log warning but still attempt merge
              logger.warn('CART MERGE DEBUG: No valid guest basket items found - merge API will be called anyway', {
                guestBasketId,
                guestBasketValid,
                guestBasketItemsCount: guestBasketItems.length,
                note: 'Merge API should still work - it automatically detects previous shopper basket'
              });

              // Still attempt merge - the API might still work even without items verification
              try {
                const mergedBasket = await BasketMergeService.mergeBaskets(
                  guestBasketId,
                  customerBasket?.basketId
                );

                if (mergedBasket && mergedBasket.basketId) {
                  customerBasket = mergedBasket;
                  logger.log('CART MERGE DEBUG: Merge succeeded despite no items verification:', {
                    mergedBasketId: mergedBasket.basketId,
                    totalItems: mergedBasket.productItems?.length || 0
                  });
                }
              } catch (mergeError) {
                logger.error('CART MERGE ERROR: Merge failed - no fallback used:', {
                  error: mergeError.message,
                  status: mergeError.response?.status,
                  responseData: mergeError.response?.data
                });
                // Don't throw - continue with customer basket initialization
              }
            }
          } else {
            // Check localStorage as single source of truth
            const storedGuestBasketId = localStorage.getItem(GUEST_BASKET_KEY);
            logger.log('CART MERGE DEBUG: No guest basket to merge:', {
              guestBasketId,
              customerBasket: !!customerBasket,
              storedGuestBasketId_from_localStorage: storedGuestBasketId,
              note: 'Using localStorage as single source of truth - no Zustand state checked',
              timestamp: new Date().toISOString()
            });
            logger.log('CART INIT: Step 3 - No merge needed (no guest basket or merge already completed)');
          }

          // Ensure we have a customer basket at this point
          if (!customerBasket) {
            logger.error('CART INIT: No customer basket available after merge/init process');
            throw new Error('Failed to initialize customer basket');
          }

          logger.log('CART INIT: Step 3 - Merge process completed');

          // CRITICAL: Refresh customer basket one final time to ensure we have the latest state
          // This is especially important after merge to ensure all items (existing + merged) are present
          try {
            const finalBasket = await get().getCustomerBasket(customerBasket.basketId);
            if (finalBasket && finalBasket.productItems) {
              // Only use refreshed basket if it has items (prevents using empty basket if refresh fails)
              if (finalBasket.productItems.length > 0 || customerBasket.productItems?.length === 0) {
                customerBasket = finalBasket;
                logger.log('CART INIT: Final refresh of customer basket completed:', {
                  basketId: customerBasket.basketId,
                  itemCount: customerBasket.productItems?.length || 0,
                  total: customerBasket.productTotal || 0,
                  items: customerBasket.productItems?.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    productName: item.productName
                  })) || []
                });
              } else {
                logger.log('CART INIT: Using existing customer basket (refresh returned empty, keeping existing)');
              }
            }
          } catch (refreshError) {
            logger.warn('CART INIT: Failed to refresh customer basket (non-critical), using existing:', refreshError.message);
            // Continue with existing customerBasket - it should still be valid
          }

          // Store customer basket ID and clear guest data after successful merge/init
          if (customerBasket && customerBasket.basketId) {
            // CART-001: Use basketIdManager for consistent ID management
            setBasketIdConsistently(customerBasket.basketId, 'customer', get());
          }
          try {
            // Clear all guest-specific data to keep storage clean
            storageManager.clearGuestData();
          } catch (e) {
            logger.warn('Failed to clear guest data:', e);
          }

          const finalCartState = {
            basket: customerBasket || null,
            basketId: customerBasket?.basketId || null,
            basketType: 'customer',
            itemCount: customerBasket?.productItems?.reduce((total, item) => total + item.quantity, 0) || 0,
            total: customerBasket?.productTotal || 0
          };

          logger.log('CART INIT: Setting final cart state:', {
            basketId: finalCartState.basketId,
            itemCount: finalCartState.itemCount,
            total: finalCartState.total,
            basketType: finalCartState.basketType
          });

          set(finalCartState);
          get().forceUpdate(); // Force UI update

          return customerBasket;
        } catch (error) {
          throw error;
        }
      },

      // Add item to basket (merges with existing identical line by increasing quantity)
      addToBasket: async (productId, quantity = 1) => {
        if (get().isLoading) {
            return; // de-dupe rapid clicks
        }
        let { basketId, basketType, basket } = get();
        
        if (!basketId) {
          // If no basket, try to initialize cart first
          await get().initializeCart();

    ({ basketId, basketType, basket } = get());

    if (!basketId) {
      throw new Error("Failed to initialize cart");
    }
        }

        try {
          set({ isLoading: true, error: null });

          // IMMEDIATE UI UPDATE: Update cart count instantly for better UX
          // const { itemCount } = get();

          // get().updateCartCountImmediately(productId, quantity);

          let updatedBasket;

          // If same product already exists in basket, update its quantity instead of adding a new line
          // const existingItem = (basket?.productItems || []).find((it) => it?.productId === productId);
          // if (existingItem) {
          //   const newQty = Math.max(1, Number(existingItem.quantity || 0) + Number(quantity || 0));
          //   logger.log('addToBasket: Found existing line item, updating quantity instead of adding duplicate', {
          //     itemId: existingItem.itemId,
          //     productId,
          //     prevQty: existingItem.quantity,
          //     newQty
          //   });
          //   updatedBasket = await get().updateItemQuantity(existingItem.itemId, newQty);
          //   // updateItemQuantity already refreshes and sets basket; return early
          //   // setTimeout(() => set({ showCartModal: true }), 0);
          //    set({ showCartModal: true });
          //   return updatedBasket;
          // }

          if (basketType === 'guest') {
            // Pass the existing basket ID to avoid creating a new basket
            updatedBasket = await GuestCartService.addToBasket(productId, quantity, basketId);

            // Immediately update UI with the response from addToBasket
            set({ showCartModal: true });
            if (updatedBasket) {
              get().setBasket(updatedBasket);
              
              // Track add to cart for Einstein Commerce Cloud
              const addedItem = (updatedBasket?.productItems || []).find(item => 
                item.productId === productId
              );
              if (addedItem) {
                trackEinsteinAddToCart([{
                  id: productId,
                  price: Number(addedItem.price || addedItem.basePrice || 0),
                  originalPrice: Number(addedItem.basePrice || addedItem.price || 0),
                  quantity: Number(addedItem.quantity || quantity)
                }]);
              }
            }

            // Force a state update to ensure UI components re-render immediately
            // get().forceUpdate();

            // IMPORTANT: Refresh cart data immediately after adding item to get complete product details
            // try {
            //   const refreshedBasket = await GuestCartService.getBasket(basketId);
            //   if (refreshedBasket) {
            //     logger.log('Updating UI with refreshed basket data:', refreshedBasket);
            //     get().setBasket(refreshedBasket);

            //     // Force another state update after refresh
            //     get().forceUpdate();

            //     logger.log('Guest cart data refreshed successfully');
            //   }
            // } catch (refreshError) {
            // }
          } else {
            // For customer baskets, add item first
            updatedBasket = await get().addToCustomerBasket(productId, quantity);

            // Immediately update UI with the response from addToCustomerBasket
            if (updatedBasket) {
              set({ showCartModal: true });
              get().setBasket(updatedBasket);
              
              // Track add to cart for Einstein Commerce Cloud
              const addedItem = (updatedBasket?.productItems || []).find(item => 
                item.productId === productId
              );
              if (addedItem) {
                trackEinsteinAddToCart([{
                  id: productId,
                  price: Number(addedItem.price || addedItem.basePrice || 0),
                  originalPrice: Number(addedItem.basePrice || addedItem.price || 0),
                  quantity: Number(addedItem.quantity || quantity)
                }]);
              }
              // get().forceUpdate();
            }
            else {
        // still open cart if you want consistent UX
        set({ showCartModal: true });
      }
            // Always open sidebar on success
            // setTimeout(() => set({ showCartModal: true }), 0);
            // set({ showCartModal: true });

            // IMPORTANT: Refresh cart data immediately after adding item to get complete product details
            // try {
            //   const refreshedBasket = await get().getCustomerBasket();
            //   if (refreshedBasket) {
            //     logger.log('Updating UI with refreshed customer basket data:', refreshedBasket);
            //     get().setBasket(refreshedBasket);

            //     // Force state update for customer baskets
            //     get().forceUpdate();

            //     logger.log('Customer cart data refreshed successfully after adding item');
            //   }
            // } catch (refreshError) {
            //   logger.warn('Failed to refresh customer cart data after adding item:', refreshError);
            // }
          }
          return updatedBasket;
        } catch (error) {

           // Parse error from message string if response object is missing (SFCCApiClient behavior)
           let errorDetailObj = null;
           try {
             // Error message format: "PATCH request failed: 400 Bad Request {JSON...}"
             const match = error.message?.match(/{.*}/);
             if (match) {
               errorDetailObj = JSON.parse(match[0]);
             }
           } catch (e) {
            //  console.log("Failed to parse error message JSON", e);
           }

           // Check parsed object or original response data
           const finalErrorData = error.response?.data || errorDetailObj;
           
          if (finalErrorData?.type === "https://api.commercecloud.salesforce.com/documentation/error/v1/errors/product-item-not-available") {
              //  toast.error(finalErrorData.detail || "Insufficient stock");
          } 

          // const { itemCount } = get();
          // const revertedCount = Math.max(0, itemCount - quantity);
          set((state) => ({ ...state, itemCount: revertedCount }));
          // get().forceUpdate();

          // Handle cart errors using error handler
          if (CartErrorHandler.isInvalidCustomerError(error) ||
            CartErrorHandler.isInvalidBasketError(error)) {

            CartErrorHandler.logErrorDetails(error, 'addToBasket');


            // Clear invalid data and force re-initialization
            const authState = storageManager.getAuthState();
            get().clearInvalidBasketData(!authState.isUserLoggedIn);

            // Force re-initialization with fresh credentials
            await get().initializeCart();

            // Try adding to cart again with new basket
            const newBasketId = get().basketId;
            if (newBasketId) {
              logger.log('Retrying add to cart with new basket:', newBasketId);
              return await get().addToBasket(productId, quantity);
            } else {
              logger.log('Failed to get new basket after error recovery');
              set({ error: 'Failed to initialize cart after error recovery' });
              return;
            }
          }

          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Add item to customer basket
      addToCustomerBasket: async (productId, quantity = 1) => {
        const { basketId } = get();

        try {
          // Validate customer ID before making API call
          const customerId = await getCustomerId();
          if (!customerId || customerId === 'undefined' || customerId === 'null' || customerId.length < 10) {
            throw new Error('Invalid Customer - customer ID is invalid or missing');
          }

          const endpoint = `/checkout/shopper-baskets/v2/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/baskets/${basketId}/items`;
          const url = sfccApiClient.buildUrl(endpoint, resolveSiteId());

          // Use the same format as guest cart - array of items
          const items = [
            {
              productId: productId,
              quantity: quantity
            }
          ];

          const response = await sfccApiClient.post(url, items);
          return response;
        } catch (error) {
          throw error;
        }
      },

      // Update item quantity
      updateItemQuantity: async (itemId, quantity) => {
        const { basketId, basketType } = get();

        if (!basketId) {
          throw new Error('No basket available');
        }

        try {
          set({ isLoading: true, error: null });

          let updatedBasket;
          if (basketType === 'guest') {
            updatedBasket = await GuestCartService.updateItemQuantity(itemId, quantity);
            get().setBasket(updatedBasket);

            // IMPORTANT: Refresh cart data after updating quantity to get complete product details
            // try {
            //   const refreshedBasket = await GuestCartService.getBasket(basketId);
            //   if (refreshedBasket) {
            //     get().setBasket(refreshedBasket);
            //     logger.log('Guest cart data refreshed successfully after quantity update');
            //   }
            // } catch (refreshError) {
            // }
          } else {
            updatedBasket = await get().updateCustomerItemQuantity(itemId, quantity);
            get().setBasket(updatedBasket);

            // try {
            //   const refreshedBasket = await get().getCustomerBasket();
            //   if (refreshedBasket) {
            //     logger.log('Updating UI with refreshed customer basket data:', refreshedBasket);
            //     get().setBasket(refreshedBasket);
            //     get().forceUpdate();
            //     logger.log('Customer cart data refreshed successfully after quantity update');
            //   }
            // } catch (refreshError) {
            // }
          }

          return updatedBasket;
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Update customer item quantity
      updateCustomerItemQuantity: async (itemId, quantity) => {
        const { basketId } = get();

        try {
          // Correct endpoint as per API documentation - items without specific itemId in path
          const endpoint = `/checkout/shopper-baskets/v2/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/baskets/${basketId}/items`;
          const url = sfccApiClient.buildUrl(endpoint, resolveSiteId());

          // Request body format as per API documentation
          const requestBody = [
            {
              itemId: itemId,
              quantity: quantity
            }
          ];

          logger.log('Updating customer item quantity:', {
            basketId,
            itemId,
            quantity,
            url,
            requestBody
          });

          const response = await sfccApiClient.patch(url, requestBody);

          logger.log('Customer item quantity updated successfully:', response);
          return response;
        } catch (error) {
          throw error;
        }
      },

      // Remove item from basket
      removeFromBasket: async (itemId) => {
        const { basketId, basketType } = get();

        if (!basketId) {
          throw new Error('No basket available');
        }

        try {
          set({ isLoading: true, error: null });

          let updatedBasket;
          if (basketType === 'guest') {
            updatedBasket = await GuestCartService.removeItem(itemId);
            get().setBasket(updatedBasket);

            // IMPORTANT: Refresh cart data after removing item to get complete product details
            // try {
            //   const refreshedBasket = await GuestCartService.getBasket(basketId);
            //   if (refreshedBasket) {
            //     get().setBasket(refreshedBasket);
            //   }
            // } catch (refreshError) {
            // }
          } else {
            updatedBasket = await get().removeFromCustomerBasket(itemId);
            get().setBasket(updatedBasket);

            // IMPORTANT: Refresh cart data after removing item to get complete product details
            // try {
            //   const refreshedBasket = await get().getCustomerBasket();
            //   if (refreshedBasket) {
            //     logger.log('Updating UI with refreshed customer basket data:', refreshedBasket);
            //     get().setBasket(refreshedBasket);
            //     get().forceUpdate();
            //     logger.log('Customer cart data refreshed successfully after item removal');
            //   }
            // } catch (refreshError) {
            // }
          }

          return updatedBasket;
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Remove item from customer basket
      removeFromCustomerBasket: async (itemId) => {
        const { basketId } = get();

        try {
          const endpoint = `/checkout/shopper-baskets/v2/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/baskets/${basketId}/items/${itemId}`;
          const url = sfccApiClient.buildUrl(endpoint, resolveSiteId());

          const response = await sfccApiClient.delete(url);
          return response;
        } catch (error) {
          throw error;
        }
      },

      // Get basket details
      getBasket: async () => {
        const { basketId, basketType } = get();


        if (!basketId) {
          return null;
        }

        try {
          set({ isLoading: true, error: null });

          let basket;
          if (basketType === 'guest') {
            basket = await GuestCartService.getBasket(basketId);
          } else {
            basket = await get().getCustomerBasket(basketId);
          }


          // CRITICAL: Always update Zustand with latest basket from API
          if (basket) {
            get().setBasket(basket);
            get().forceUpdate();
          }
          return basket;
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Refresh cart data from API (for drawer and cart page)
      refreshCartFromAPI: async () => {
        try {
          set({ isLoading: true, error: null });

          const { basketId, basketType } = get();

          if (!basketId) {
            logger.log('No basket ID found, initializing cart...');
            await get().initializeCart();
            return;
          }

          let freshBasket;
          if (basketType === 'guest') {
            logger.log('Fetching fresh guest basket data...');
            freshBasket = await GuestCartService.getBasket(basketId);
          } else {
            logger.log('Fetching fresh customer basket data...');
            try {
              freshBasket = await get().getCustomerBasket(basketId);
            } catch (error) {
              // If no basket found, this might be a new customer - try to initialize cart
              if (error.message && error.message.includes('No basket found')) {
                logger.log('No customer basket found, initializing cart...');
                await get().initializeCart();
                return;
              }
              throw error;
            }
          }

          if (freshBasket) {

            // CRITICAL: Always update Zustand with latest basket from API
            get().setBasket(freshBasket);
            get().forceUpdate();

            // Dispatch cart updated event for UI components
            window.dispatchEvent(new CustomEvent('cartUpdated', {
              detail: {
                source: 'refreshCartFromAPI',
                basketId: freshBasket.basketId,
                itemCount: freshBasket.productItems?.length || 0,
                total: freshBasket.productTotal || 0
              }
            }));
          }

          return freshBasket;
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Get customer basket using customer baskets API only (per cart.txt)
      getCustomerBasket: async (requestedBasketId) => {
        try {
          const { getCustomerId } = await import('../utils/tokenUtils.js');
          const customerId = await getCustomerId();
          if (!customerId) throw new Error('No customer ID found');

          const endpoint = `/customer/shopper-customers/v1/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/customers/${customerId}/baskets`;
          const url = sfccApiClient.buildUrl(endpoint, resolveSiteId());
          const response = await sfccApiClient.get(url);

          let targetBasket = null;
          if (requestedBasketId) {
            targetBasket = response.baskets?.find(basket => basket.basketId === requestedBasketId) || null;
          } else {
            const customerBaskets = response.baskets?.filter(basket => basket.temporaryBasket === false) || [];
            const sorted = (customerBaskets.length ? customerBaskets : (response.baskets || []))
              .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
            targetBasket = sorted[0] || null;
          }

          if (!targetBasket) {
            // If no basket found, this is expected for new customers - return null instead of throwing
            logger.log('No basket found for customer - this is normal for new customers');
            return null;
          }
          return targetBasket;
        } catch (error) {
          throw error;
        }
      },

      // Clear basket
      clearBasket: async () => {
        const { basketId, basketType } = get();

        if (!basketId) {
          return;
        }

        try {
          set({ isLoading: true, error: null });

          if (basketType === 'guest') {
            await GuestCartService.clearBasket();
          } else {
            await get().clearCustomerBasket();
          }

          set({ basket: null, itemCount: 0, total: 0, orderTotalUI: 0, basketId: null });
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Clear customer basket
      clearCustomerBasket: async () => {
        const { basketId, basket } = get();

        if (!basketId) {
          logger.warn("No basket ID to clear");
          return;
        }

        // Check if basket has items before trying to clear
        const hasItems = basket?.productItems && basket.productItems.length > 0;
        if (!hasItems) {
          logger.log("Basket is already empty, skipping clear operation");
          return;
        }

        try {
          const endpoint = `/checkout/shopper-baskets/v2/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/baskets/${basketId}/items`;
          const url = sfccApiClient.buildUrl(endpoint, resolveSiteId());

          await sfccApiClient.delete(url);
          logger.log("✅ Customer basket items cleared successfully");
        } catch (error) {
          // If we get 405 (Method Not Allowed), the basket might be empty or endpoint doesn't support DELETE
          // This is okay for fresh baskets - they're already empty
          if (error.message && error.message.includes('405')) {
            logger.warn("405 Method Not Allowed when clearing basket - basket may already be empty");
            // Don't throw - this is expected for empty baskets
            return;
          }
          throw error;
        }
      },

      // Unified: fetch cart via customerId only (per cart.txt). No direct basketId fetch.
      getBasketById: async (_basketId, _isGuest = false) => {
        const { getCustomerId } = await import('../utils/tokenUtils.js');
        const customerId = await getCustomerId();
        if (!customerId) throw new Error('No customer ID found');
        // Delegate to getCustomerBasket (which uses customer-baskets API)
        return await get().getCustomerBasket();
      },

      // Get customer basket by ID using customer baskets API list
      getCustomerBasketById: async (basketId) => {
        try {
          const { getCustomerId } = await import('../utils/tokenUtils.js');
          const customerId = await getCustomerId();
          if (!customerId) throw new Error('No customer ID found');

          const endpoint = `/customer/shopper-customers/v1/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/customers/${customerId}/baskets`;
          const url = sfccApiClient.buildUrl(endpoint, resolveSiteId());
          const response = await sfccApiClient.get(url);

          const targetBasket = response.baskets?.find(basket => basket.basketId === basketId) || null;
          if (!targetBasket) throw new Error('No basket found for customer');
          return targetBasket;
        } catch (error) {
          throw error;
        }
      },


      // Force re-initialize cart (useful for debugging or recovery)
      forceReinitializeCart: async () => {
        logger.log('Force re-initializing cart...');

        // Clear all basket data
        localStorage.removeItem(GUEST_BASKET_KEY);
        localStorage.removeItem(CUSTOMER_BASKET_KEY);

        // Reset cart state
        set({
          basket: null,
          basketId: null,
          itemCount: 0,
          total: 0,
          orderTotalUI: 0, // ✅ reset
          error: null,
          isInitialized: false
        });

        // Re-initialize
        await get().initializeCart();

        logger.log('Cart force re-initialized');
      },

      // Ensure we are using the permanent basket (for non-BuyNow flows)
      // This is called when navigating to pages like Home, where we shouldn't show the BuyNow temporary basket
      ensurePermanentBasket: async () => {
        const { basket, basketId } = get();
        
        // Only act if we currently have a temporary basket (Buy Now basket)
        // If we already have a permanent basket (temporaryBasket === false), do nothing
        if (basket?.temporaryBasket === true) {
           logger.log('ensuringPermanentBasket: Switching to Permanent Basket (Active was Temporary)...', {
              currentBasketId: basketId
           });
           
           try {
             set({ isLoading: true });
             const { getCustomerId } = await import('../utils/tokenUtils.js');
             const customerId = await getCustomerId();
             
             if (customerId) {
                  // Fetch authoritative basket data without a preferred ID
                  // This will automatically fall back to the most recent permanent basket (temporary === false)
                  const customerBasketData = await getAuthoritativeCustomerBasketData(customerId); 
                  
                  if (customerBasketData.basket) {
                       logger.log('ensurePermanentBasket: Switched to permanent basket:', customerBasketData.basket.basketId);
                       get().setBasket(customerBasketData.basket);
                  } else {
                       // If no permanent basket exists, we might need to create one or just clear the temporary one
                       // For now, if no permanent basket, clearing the temporary one from UI is safer than showing wrong data
                       // But better to just initialize a new one?
                       // Let's defer to initializeCart logic if possible, or just create new.
                       try {
                          const newBasket = await BasketMergeService.getOrCreateCustomerBasket(customerId);
                          if (newBasket) {
                              get().setBasket(newBasket);
                          }
                       } catch(e) {
                          logger.warn('Failed to recover permanent basket');
                       }
                  }
             }
           } catch(error) {
               logger.error('ensurePermanentBasket error:', error);
           } finally {
              set({ isLoading: false });
           }
        }
      },

      // Create new guest basket
      createNewGuestBasket: async () => {
        try {
          logger.log('Creating new guest basket');

          const basket = await GuestCartService.createBasket();
          const basketId = basket.basketId;

          // Don't store in localStorage - keep in memory only

          set({
            basket,
            basketId,
            basketType: 'guest',
            itemCount: basket.productItems?.length || 0,
            total: basket.productTotal || 0,
            currency: basket.currency || ''
          });

          logger.log('New guest basket created:', basketId);
          return basket;
        } catch (error) {
          // Handle quota exceeded error by reusing existing basket
          if (error.message.includes('Customer Baskets Quota Exceeded')) {
            logger.log('Basket quota exceeded, trying to reuse existing basket from error message');
            try {
              // Extract basket ID from error message
              const basketIdMatch = error.message.match(/baskets \(([^)]+)\)/);
              if (basketIdMatch && basketIdMatch[1]) {
                const existingBasketId = basketIdMatch[1];
                logger.log('Using existing basket from error message:', existingBasketId);

                // Try to get the existing basket
                const basket = await GuestCartService.getBasket(existingBasketId);

                set({
                  basket,
                  basketId: existingBasketId,
                  basketType: 'guest',
                  itemCount: basket.productItems?.length || 0,
                  total: basket.productTotal || 0,
                  currency: basket.currency || ''
                });

                logger.log('Successfully using existing basket:', existingBasketId);
                return basket;
              } else {
                logger.log('No basket ID found in error message');
                throw error;
              }
            } catch (basketError) {
              throw error;
            }
          }

          throw error;
        }
      },

      // Create new customer basket
      createNewCustomerBasket: async (customerId) => {
        try {
          logger.log('Creating new customer basket for:', customerId);

          const basket = await BasketMergeService.getOrCreateCustomerBasket(customerId);
          const basketId = basket.basketId;

          // CART-001: Use basketIdManager for consistent ID management
          setBasketIdConsistently(basketId, 'customer', get());

          set({
            basket,
            basketId,
            basketType: 'customer',
            itemCount: basket.productItems?.length || 0,
            total: basket.productTotal || 0,
            currency: basket.currency || ''
          });

          logger.log('New customer basket created:', basketId);
        } catch (error) {
          throw error;
        }
      },

      // Handle login - merge guest basket with customer basket
      handleLogin: async (customerId, guestData = null) => {
        try {
          set({ isLoading: true, error: null });

          // If guest data is provided (extracted before login), use it
          // Otherwise, try to extract from localStorage
          let guestBasketId = null;
          let guestCustomerId = null;

          if (guestData) {
            guestBasketId = guestData.guestBasketId;
            guestCustomerId = guestData.guestCustomerId;
            logger.log('CART MERGE: Using guest data from login params:', {
              guestBasketId,
              guestCustomerId
            });
          } else {
            // Fallback: try to get from localStorage (extracted before login)
            guestBasketId = localStorage.getItem('pending_guest_basket_id');
            guestCustomerId = localStorage.getItem('pending_guest_customer_id');
            logger.log('CART MERGE: Using guest data from localStorage:', {
              guestBasketId,
              guestCustomerId
            });
          }

          // Initialize customer cart (this will handle merging)
          // Pass guest data to merge function
          await get().initializeCustomerCart(customerId, {
            guestBasketId,
            guestCustomerId
          });

          // Clean up temporary guest data after merge
          localStorage.removeItem('pending_guest_basket_id');
          localStorage.removeItem('pending_guest_customer_id');

        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Reset cart state
      resetCart: () => {
        set({
          basket: null,
          basketId: null,
          basketType: 'guest',
          itemCount: 0,
          total: 0,
          orderTotalUI: 0, // ✅ reset
          error: null,
          isLoading: false,
          isInitialized: false
        });

        // Clear stored IDs
        localStorage.removeItem(GUEST_BASKET_KEY);
        localStorage.removeItem(CUSTOMER_BASKET_KEY);
      },

      // Handle logout - clear user data and generate fresh guest identity
      handleLogout: async () => {
        try {
          set({ isLoading: true, error: null });

          // Clear user-specific storage (tokens, user_data, customer_basket_id, etc.)
          storageManager.clearUserData();

          // Generate a fresh guest identity (new customerId, tokens)
          try {
            const { getCustomerId } = await import('../utils/tokenUtils.js');
            const guestCustomerId = await getCustomerId();
            logger.log('New guest identity after logout:', guestCustomerId);
          } catch (e) {
          }

          // Initialize guest cart (fresh)
          await get().initializeGuestCart();

          logger.log('Logout complete: user data cleared and guest session initialized');
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Clear invalid basket data
      clearInvalidBasketData: (isGuest = true) => {
        logger.log('Clearing invalid basket data:', { isGuest });

        try {
          // Clear basket IDs
          localStorage.removeItem(GUEST_BASKET_KEY);
          localStorage.removeItem(CUSTOMER_BASKET_KEY);

          // Clear basket cache
          localStorage.removeItem('guest_basket_cache');

          // Reset cart state
          get().resetCart();

          // Clear guest data if switching to guest mode
          if (isGuest) {
            // Clear guest data from localStorage
            const guestDataKeys = ['guest_token', 'guest_cart_id', 'guest_customer_id'];
            guestDataKeys.forEach(key => {
              localStorage.removeItem(key);
            });
          }

          logger.log('Invalid basket data cleared');
        } catch (error) {
        }
      },


      updateShippingAddress: async ({
        shippingAddress,
        basketId: overrideBasketId,
        temporary = false
      }) => {
        if (get().isLoading) return;
        try {
          // Use override basketId if provided (for temporary baskets), otherwise use store's basketId
          const basketId = overrideBasketId || get().basketId;
          set({ isLoading: true, error: null });

          const result = await update_shipping_address({
            basketId,
            shipmentId: "me", // Use the shipmentId from SFCC API (use 'me' by default)
            shippingAddress,
            locale: resolveLocale(),
          });
          if (!temporary && result) {
            get().setBasket(result);
          }
           return result;
        }
        catch (error) {
          throw error;
        }
        finally {
          set({ isLoading: false });
        }
      },


      updateShippingMethod: async ({ id, basketId: overrideBasketId, temporary = false }) => {
        if (get().isLoading) return;
        try {
          // Use override basketId if provided (for temporary baskets), otherwise use store's basketId
          const basketId = overrideBasketId || get().basketId;
          if (!basketId) return;

          set({ isLoading: true, error: null });
          logger.log("updateShippingMethod called with id:", id);

          const result = await update_shipping_method({
            basketId,
            shipmentId: "me",
            methodId: id,      
          });

          if (!temporary && result) {
            get().setBasket(result);
          }
          return result;
        } catch (error) {
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },


      addPaymentInstrument: async (obj) => {
        if (get().isLoading) return;
        try {
          const basketId = obj.basketId || get().basketId;
          set({ isLoading: true, error: null });
          const result = await add_payment_instrument({
            basketId,
            paymentMethodId: obj.paymentMethodId,
            // amount: obj.amount
          });
          if ( !obj.temporary && result) {
            get().setBasket(result);
          }
          return result;
        } catch (error) {
          throw error;
        }
        finally {
          set({ isLoading: false });
        }
      },
      removePaymentInstrument: async (obj) => {
        if (get().isLoading) return;
        try {
          const basketId = obj.basketId || get().basketId;
          set({ isLoading: true, error: null });
          const result = await remove_payment_instrument({
            basketId,
            paymentInstrumentId: obj.paymentInstrumentId,
          });
          if (!obj.temporary && result) {
             get().setBasket(result);
          }
          return result;
        } catch(e) {
          throw e;
        } finally {
          set({isLoading: false});
        }
      },
      addCoupon: async (code, overrideBasketId = null, temporary = false, paymentMethod = null) => {
        if (get().isLoading) return;
        if (!code) return;
        try {
          const basketId = overrideBasketId || get().basketId;
          set({ isLoading: true, error: null });
          const result = await add_coupon_to_basket({
            basketId,
            code
          });
          if (result) {
            if (!temporary) {
              get().setBasket(result);
            }
            get().setOrderTotalUI(result?.orderTotal);
            
            const currentPaymentMethod = result?.paymentInstruments?.[0]?.paymentMethodId || paymentMethod || "COD";
            await add_payment_instrument({
              basketId,
              paymentMethodId: currentPaymentMethod,
              amount: result?.orderTotal,
            });
            
            return result;
          }
          else {
            return false;
          }
        } catch (error) {
          throw error;
        }
        finally {
          set({ isLoading: false });
        }
      },
      removeCoupon: async (id, overrideBasketId = null, temporary = false, paymentMethod = null) => {
        if (get().isLoading) return;
        if (!id) return;
        try {
          const basketId = overrideBasketId || get().basketId;
          set({ isLoading: true, error: null });
          const result = await remove_coupon_from_basket({
            basketId,
            coupon_id: id
          });
          if (result) {
            if (!temporary) {
              get().setBasket(result);
            }
            
            const currentPaymentMethod = result?.paymentInstruments?.[0]?.paymentMethodId || paymentMethod || "COD";
            await add_payment_instrument({
              basketId,
              paymentMethodId: currentPaymentMethod,
              amount: result?.orderTotal,
            });
            
            return result;
          }
          else {
            return false;
          }
        } catch (error) {
          throw error;
        }
        finally {
          set({ isLoading: false });
        }
      },
      createOrder: async (overrideBasketId, temporary = false) => {
        if (get().isLoading) return;
        try {
          const basketId = overrideBasketId || get().basketId;
          set({ isLoading: true, error: null });
          const result = await create_order_from_basket({
            basketId
          });
          
          // ⚠️ IMPORTANT: Don't clear basket here - only clear after successful payment
          // If payment fails, user needs the basket to retry 
          // i will shift it later when these conditions of payment failed are handled into  project
          // if (!temporary && result) {
          //   get().clearBasketAfterPayment();
          // }
          return result;
        } catch (error) {
          throw error;
        }
        finally {
          set({ isLoading: false });
        }
      },

      // Clear basket after successful payment confirmation
      clearBasketAfterPayment: () => {
        set({
          basket: null,
          basketId: null,
          itemCount: 0,
          total: 0,
          orderTotalUI: 0, // ✅ reset
          error: null,
          isInitialized: false
        });
      },

      // Restore basket items to a new basket (used when payment fails after order creation)
      // CHK-001: Enhanced with better error handling and result tracking
      // FIXED: Only clear basket if it has items (skip for fresh/empty baskets)
      restoreBasketItems: async (items) => {
        if (!Array.isArray(items) || items.length === 0) {
          logger.warn("No items to restore");
          return {
            success: false,
            error: 'No items to restore',
            restoredItems: [],
            failedItems: []
          };
        }

        try {
          set({ isLoading: true, error: null });

          // Initialize a new cart
          await get().initializeCart();
          const { basketId: newBasketId, basketType, basket } = get();

          if (!newBasketId) {
            throw new Error("Failed to create new basket for restoration");
          }

          // CRITICAL: Only clear basket if it has items (fresh baskets are already empty)
          // This prevents 405 errors on empty baskets and 400 errors when adding items
          const hasItems = basket?.productItems && basket.productItems.length > 0;
          
          if (hasItems) {
            logger.log("Basket has existing items, clearing before restoration to ensure exact quantities");
            try {
              // Try to clear items, but don't fail if it doesn't work (405 for empty baskets)
              await get().clearBasket();
              // CRITICAL: Reset isInitialized flag before re-initializing
              // This ensures initializeCart() doesn't skip initialization
              set({ isInitialized: false, basketId: null });
              // Re-initialize cart after clearing to get fresh basket
              await get().initializeCart();
              const { basketId: clearedBasketId } = get();
              if (!clearedBasketId) {
                throw new Error("Failed to re-initialize cart after clearing");
              }
              logger.log("✅ Basket cleared successfully, ready for restoration");
            } catch (clearError) {
              // If clearing fails (e.g., 405 Method Not Allowed for empty baskets),
              // check if basket is actually empty - if so, it's fine to continue
              logger.warn("Failed to clear basket, checking if it's empty:", clearError);
              
              try {
                // Refresh basket to check current state
                await get().refreshCartFromAPI();
                const { basket: refreshedBasket, basketId: refreshedBasketId } = get();
                const stillHasItems = refreshedBasket?.productItems && refreshedBasket.productItems.length > 0;
                
                if (stillHasItems) {
                  // Basket still has items, this is a real problem
                  logger.error("⚠️ Basket still has items after failed clear, restoration may have quantity issues");
                  // Continue anyway - we'll try to add items and see what happens
                } else {
                  // Basket is empty, which is what we want - continue with restoration
                  logger.log("✅ Basket is empty (as expected), proceeding with restoration");
                  
                  // CRITICAL: Ensure we have a valid basketId even if refresh didn't return one
                  if (!refreshedBasketId) {
                    logger.warn("⚠️ No basketId after refresh, re-initializing cart...");
                    set({ isInitialized: false });
                    await get().initializeCart();
                  }
                }
              } catch (refreshError) {
                logger.warn("Could not verify basket state, continuing with restoration:", refreshError);
                // CRITICAL: If refresh fails, ensure we have a valid basketId
                // Reset initialization flag and try again
                set({ isInitialized: false });
                await get().initializeCart();
              }
            }
          } else {
            logger.log("✅ Basket is empty (fresh user), skipping clear step and proceeding with restoration");
          }

          const restoredItems = [];
          const failedItems = [];

          // CRITICAL: Get current basket state before restoration and verify basketId exists
          let { basketId: currentBasketId, basketType: currentBasketType, basket: currentBasket } = get();
          
          // If basketId is still null, force re-initialization
          if (!currentBasketId) {
            logger.warn("⚠️ basketId is null after restoration setup, forcing re-initialization...");
            set({ isInitialized: false });
            await get().initializeCart();
            const refreshedState = get();
            currentBasketId = refreshedState.basketId;
            currentBasketType = refreshedState.basketType;
            currentBasket = refreshedState.basket;
            
            if (!currentBasketId) {
              throw new Error("Failed to get valid basketId for restoration");
            }
            logger.log("✅ Got valid basketId after forced re-initialization:", currentBasketId);
          }
          
          // CRITICAL: Refresh basket to get current state before restoration
          // This ensures we know what items are already in the basket
          try {
            await get().refreshCartFromAPI();
            const refreshedState = get();
            currentBasket = refreshedState.basket;
            logger.log("✅ Basket refreshed before restoration, current items:", {
              itemCount: currentBasket?.productItems?.length || 0,
              items: currentBasket?.productItems?.map(i => ({ id: i.productId, qty: i.quantity })) || []
            });
          } catch (refreshError) {
            logger.warn("Could not refresh basket before restoration, continuing anyway:", refreshError);
          }
          
          // Restore all items to the basket with exact quantities
          for (const item of items) {
            const productId = item.productId || item.id;
            const quantity = item.quantity || 1;
            const variantId = item.variantId || item.variant_id; // Support variant ID if available

            if (productId) {
              try {
                // CRITICAL: Check if item already exists in basket
                // If it does, skip adding it (prevents "insufficient stock" errors)
                const existingItem = currentBasket?.productItems?.find(
                  (bi) => bi.productId === productId || bi.id === productId
                );
                
                if (existingItem) {
                  logger.log(`⏭️ Item ${productId} already in basket (quantity: ${existingItem.quantity}), skipping restoration`);
                  restoredItems.push(item);
                  continue;
                }
                
                // Add item with exact quantity
                // For fresh baskets, items are added directly (no duplicates since basket is empty)
                if (currentBasketType === 'guest') {
                  await GuestCartService.addToBasket(productId, quantity, currentBasketId);
                } else {
                  // For customer baskets, use the addToCustomerBasket method
                  // This handles the basket state correctly
                  await get().addToCustomerBasket(productId, quantity);
                }
                restoredItems.push(item);
                logger.log(`✅ Restored item ${productId} (quantity: ${quantity})`);
                
                // Refresh basket after adding to get updated state
                try {
                  await get().refreshCartFromAPI();
                  const updatedState = get();
                  currentBasket = updatedState.basket;
                } catch (refreshError) {
                  logger.warn("Could not refresh basket after adding item:", refreshError);
                }
              } catch (itemError) {
                logger.warn(`Failed to restore item ${productId}:`, {
                  error: itemError.message,
                  productId,
                  quantity,
                  variantId,
                  basketId: currentBasketId,
                  basketType: currentBasketType
                });
                
                // Check if error is due to insufficient stock or item already exists
                const errorMessage = itemError.message || '';
                const isInsufficientStock = errorMessage.includes('insufficient stock') || errorMessage.includes('Insufficient Stock');
                const isAlreadyInBasket = errorMessage.includes('already') || errorMessage.includes('duplicate');
                
                if (isInsufficientStock || isAlreadyInBasket) {
                  // Item might already be in basket or out of stock - check basket state
                  try {
                    await get().refreshCartFromAPI();
                    const refreshedState = get();
                    const refreshedBasket = refreshedState.basket;
                    const itemExists = refreshedBasket?.productItems?.some(
                      (bi) => bi.productId === productId || bi.id === productId
                    );
                    
                    if (itemExists) {
                      logger.log(`✅ Item ${productId} found in basket after error, considering it restored`);
                      restoredItems.push(item);
                      currentBasket = refreshedBasket;
                      continue;
                    } else {
                      // Item is truly out of stock or can't be added
                      failedItems.push({ ...item, error: isInsufficientStock ? 'Insufficient stock' : itemError.message });
                    }
                  } catch (refreshError) {
                    logger.error("Failed to refresh basket after item error:", refreshError);
                    failedItems.push({ ...item, error: itemError.message });
                  }
                } else {
                  failedItems.push({ ...item, error: itemError.message });
                  
                  // If we get a 400 error, the basket might be in a bad state
                  // Try to refresh and continue with next item
                  if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
                    logger.warn("Got 400 error, refreshing basket state before continuing...");
                    try {
                      await get().refreshCartFromAPI();
                      const refreshedState = get();
                      currentBasket = refreshedState.basket;
                    } catch (refreshError) {
                      logger.error("Failed to refresh basket after item error:", refreshError);
                    }
                  }
                }
              }
            } else {
              failedItems.push({ ...item, error: 'Missing productId' });
            }
          }

          // Refresh the basket to get updated data
          if (restoredItems.length > 0) {
            await get().refreshCartFromAPI();
          }

          const result = {
            success: restoredItems.length > 0,
            restoredItems,
            failedItems,
            basket: restoredItems.length > 0 ? get().basket : null
          };

          if (result.success) {
            logger.log("Basket items restored successfully with exact quantities:", {
              restored: restoredItems.length,
              failed: failedItems.length,
              total: items.length
            });
          } else {
            logger.error("❌ Basket restoration failed:", {
              restored: restoredItems.length,
              failed: failedItems.length,
              total: items.length
            });
          }

          return result;
        } catch (error) {
          logger.error("❌ Failed to restore basket items:", error);
          set({ error: error.message });
          return {
            success: false,
            error: error.message,
            restoredItems: [],
            failedItems: items
          };
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: CART_STORAGE_KEY,
      partialize: (state) => ({
        basket: state.basket,
        basketId: state.basketId,
        basketType: state.basketType,
        itemCount: state.itemCount,
        total: state.total,
        orderTotalUI: state.orderTotalUI,
        // isInitialized: state.isInitialized // REMOVED: Do not persist initialization state
      }),
    }
  )
);

// Expose debug functions to window in development
if (import.meta.env.DEV) {
  window.cartDebug = {
    debugCartState: () => useUnifiedCartStore.getState().debugCartState(),
    testCartUpdate: () => useUnifiedCartStore.getState().testCartUpdate(),
    testRefreshCart: () => useUnifiedCartStore.getState().testRefreshCart(),
    getCartState: () => useUnifiedCartStore.getState(),
    addToCart: (productId, quantity = 1) => useUnifiedCartStore.getState().addToBasket(productId, quantity)
  };
  logger.log('Cart Debug functions available as window.cartDebug');
}

export default useUnifiedCartStore;
