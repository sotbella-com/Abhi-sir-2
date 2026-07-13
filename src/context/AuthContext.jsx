import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { sendOTP, verifyOTP, loginVerification, createUser, checkUserExists, refreshAccessToken, clearStoredLoginData, clearStoredGuestData, logoutCustomerSLAS } from '../api/services/auth';
import { getAuthToken, getCustomerId, isUserLoggedIn, isGuestUser, saveUserToken, clearAuthToken, getAuthTokenObject } from '../utils/tokenUtils';
import { useUnifiedCartStore } from './unifiedCartStore';
import storageManager from '../utils/storageManager';
import { initializeEvergageUser } from '../utils/evergageHelper';
import { getCustomer } from '@/api/services';
import { logger } from '../utils/logger.js';

// Auth Context
const AuthContext = createContext();

// Auth Actions
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_TOKENS: 'SET_TOKENS',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  LOGOUT: 'LOGOUT',
  SET_GUEST_TOKEN: 'SET_GUEST_TOKEN'
};

// Initial State
const initialState = {
  user: null,
  tokens: null,
  guestToken: null,
  loading: false,
  error: null,
  isAuthenticated: false
};

// Auth Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };

    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        error: null
      };

    case AUTH_ACTIONS.SET_TOKENS:
      return {
        ...state,
        tokens: action.payload,
        error: null
      };

    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        guestToken: state.guestToken // Keep guest token on logout
      };

    case AUTH_ACTIONS.SET_GUEST_TOKEN:
      return { ...state, guestToken: action.payload };

    default:
      return state;
  }
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [authReady, setAuthReady] = useState(false);

  // Get the current active token from auth_token object
  const getActiveToken = async () => {
    try {
      const token = await getAuthToken();
      if (token) {
        return token;
      }

      return null;
    } catch (error) {
      return null;
    }
  };

  // Get token type for API calls
  const getTokenType = () => {
    // Check if user is logged in using auth_token object
    if (isUserLoggedIn()) {
      return 'user';
    }
    return 'guest';
  };

  // Check if auth_token exists on app start
  useEffect(() => {
    const checkAuthToken = () => {
      try {
        const token = getAuthToken();
        if (token) {
        } else {
        }
      } catch (error) {
      }
    };

    checkAuthToken();
  }, []);

  // Listen for guest token refresh events
  useEffect(() => {
    const handleGuestTokenRefresh = (event) => {
      dispatch({ type: AUTH_ACTIONS.SET_GUEST_TOKEN, payload: event.detail.token });
      // Don't store in localStorage - keep in memory only
    };

    const handleUserTokenRefresh = (event) => {
      dispatch({ type: AUTH_ACTIONS.SET_TOKENS, payload: { access_token: event.detail.token } });
    };

    window.addEventListener('guestTokenRefreshed', handleGuestTokenRefresh);
    window.addEventListener('userTokenRefreshed', handleUserTokenRefresh);

    return () => {
      window.removeEventListener('guestTokenRefreshed', handleGuestTokenRefresh);
      window.removeEventListener('userTokenRefreshed', handleUserTokenRefresh);
    };
  }, []);

  // Helper to fix phone number double prefix issue
  const formatPhoneNumber = (phone) => {
    if (!phone) return "";
    const phoneStr = String(phone);
    // Fix double prefix (e.g. 91+91... -> +91...)
    if (phoneStr.startsWith('91+91')) {
      return phoneStr.substring(3);
    }
    return phoneStr;
  };

  // Load user session from auth_token on app start
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const tokenObj = getAuthTokenObject();

        if (tokenObj && tokenObj.kind === "user") {
          // base info from token
          let userData = {
            customerId: tokenObj.customer_id || null,
            email: tokenObj.email,
            usid: tokenObj.usid || null,
          };

          // 💡 Try to get full profile (firstName, lastName, phone, etc.)
          try {
            const customer = await getCustomer();
            userData = {
              ...userData,
              firstName: customer.firstName || "",
              lastName: customer.lastName || "",
              email: customer.email || userData.email,
              phone: formatPhoneNumber(customer.phone) || formatPhoneNumber(customer.phoneMobile) || formatPhoneNumber(customer.phoneHome) || "",
              phoneMobile: formatPhoneNumber(customer.phoneMobile) || "",
              phoneHome: formatPhoneNumber(customer.phoneHome) || "",
            };
          } catch (e) {
          }

          dispatch({ type: AUTH_ACTIONS.SET_USER, payload: userData });
        } else {
        }
      } catch (error) {
        storageManager.clearUserData();
      } finally {
        setAuthReady(true);
      }
    };

    loadStoredAuth();
  }, []);


  // Removed user_data persistence. UI derives from auth_token on load.

  // Clear all user data from localStorage (preserves guest data)
  const clearAuthData = () => {

    // Use storage manager to clear only user data
    storageManager.clearUserData();

    // Clear auth token (this will force regeneration of new guest token)
    clearAuthToken();

    // Clear login response data using utility function
    clearStoredLoginData();

  };

  // Send OTP
  const handleSendOTP = async (userId) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const response = await sendOTP(userId);

      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      return { success: true, data: response };
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    }
  };

  // Verify OTP
  const handleVerifyOTP = async (otp) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      // CRITICAL: Extract guest data BEFORE calling verifyOTP
      // This ensures we have guest basket info before token replacement
      const { getAuthTokenObject } = await import('../utils/tokenUtils.js');
      const guestAuthToken = getAuthTokenObject();

      let guestBasketId = null;
      let guestCustomerId = null;
      let guestBasketItems = null;

      // Extract guest data from auth_token if it's a guest token
      // if (guestAuthToken && guestAuthToken.kind === 'guest') {
      //   guestCustomerId = guestAuthToken.customer_id || null;

      //   // Get guest basket ID from localStorage (stored when items are added)
      //   guestBasketId = localStorage.getItem('guest_basket_id');

      //   // Also check guest_customer_id from localStorage (stored by guestCart.js)
      //   const storedGuestCustomerId = localStorage.getItem('guest_customer_id');
      //   if (storedGuestCustomerId) {
      //     guestCustomerId = storedGuestCustomerId;
      //   }

      //   // CRITICAL: Fetch guest basket items from API before login (using guest token)
      //   // This ensures we have the actual items even if pending_merge_items wasn't set
      //   if (guestBasketId && guestCustomerId) {
      //     try {
      //       const GuestCartService = (await import('../api/services/guestCart')).default;
      //       const guestBasket = await GuestCartService.getBasket(guestBasketId, guestCustomerId);

      //       if (guestBasket && guestBasket.productItems && guestBasket.productItems.length > 0) {
      //         guestBasketItems = guestBasket.productItems;
      //         // Store in localStorage for fallback during merge
      //         localStorage.setItem('pending_merge_items', JSON.stringify(guestBasketItems));
   
      //       } else {
      //         // Fallback: Check localStorage snapshot if API fetch returned empty
      //         const pendingItems = localStorage.getItem('pending_merge_items');
      //         if (pendingItems) {
      //           try {
      //             guestBasketItems = JSON.parse(pendingItems);
      //           } catch (e) {
      //           }
      //         }
      //       }
      //     } catch (fetchError) {
      //       // Fallback: Check localStorage snapshot if API fetch failed
      //       const pendingItems = localStorage.getItem('pending_merge_items');
      //       if (pendingItems) {
      //         try {
      //           guestBasketItems = JSON.parse(pendingItems);
      //         } catch (e) {
      //         }
      //       }
      //     }
      //   } else {
      //     // No basket ID, check localStorage as last resort
      //     const pendingItems = localStorage.getItem('pending_merge_items');
      //     if (pendingItems) {
      //       try {
      //         guestBasketItems = JSON.parse(pendingItems);
      //       } catch (e) {
      //         // Invalid JSON, ignore
      //       }
      //     }
      //   }

      //   // Store guest data temporarily for merge (will be used after login)
      //   if (guestBasketId) {
      //     localStorage.setItem('pending_guest_basket_id', guestBasketId);
      //   }
      //   if (guestCustomerId) {
      //     localStorage.setItem('pending_guest_customer_id', guestCustomerId);
      //   }
      // }

        guestCustomerId = guestAuthToken.customer_id || null;

        // Get guest basket ID from localStorage (stored when items are added)
        guestBasketId = localStorage.getItem('guest_basket_id');

        // Also check guest_customer_id from localStorage (stored by guestCart.js)
        const storedGuestCustomerId = localStorage.getItem('guest_customer_id');
        if (storedGuestCustomerId) {
          guestCustomerId = storedGuestCustomerId;
        }

      // NOW call verifyOTP (this will NOT save user token - we'll do it after merge)
      const response = await verifyOTP(otp);
      // Call Login Verification
      const loginVerificationResponse = await loginVerification(
        response.data.access_token
      );


      if (response.success && loginVerificationResponse?.success) {
        // CRITICAL: Save user token first (guest token is already saved in authTokenManager.saveUserToken)
        saveUserToken(response.data);

        // Extract basic user info from token (fast, no API call)
        let userData = {
          customerId: response.data.customerId,
          email: loginVerificationResponse.customer.email,
          usid: response.data.usid,
        };

        // Dispatch user immediately for fast UI response
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: userData });

        // Perform basket merge in background (non-blocking)
        // This allows immediate navigation and toast response
        let mergeResult = null;
        if (guestBasketId && guestCustomerId) {
          // Start merge in background - don't await it
          // (async () => {
          try {
            let shouldMerge = true;
            try {
              // Fetch customer to check basket ID match
              const GuestCartService = (await import('../api/services/guestCart')).default;
              const customer = await GuestCartService.getBasket();

              if (customer && customer.basketId === guestBasketId) {
                shouldMerge = false;
                // logger.log('✅ AUTH: Skipping basket merge - Customer basket matches guest basket');
              }
            } catch (checkErr) {
              // validation failed, safe to proceed with merge
            }

            if (shouldMerge) {
              const { mergeBasketsWithFallback } = await import('../utils/basketMergeHelper.js');

              // logger.log('🔄 AUTH: Starting basket merge in background...', {
              //   guestBasketId,
              //   guestCustomerId,
              //   guestItemsCount: guestBasketItems?.length || 0
              // });

              mergeResult = await mergeBasketsWithFallback(guestBasketId, guestCustomerId,
                //   {
                //   maxRetries: 2,
                //   retryDelay: 500
                // }
              );
            }

            if (mergeResult?.success) {
              // logger.log('✅ AUTH: Basket merge completed in background:', {
              //   method: mergeResult.method,
              //   basketId: mergeResult.basket?.basketId,
              //   itemCount: mergeResult.basket?.productItems?.length || 0
              // });

              // Update cart store with merged basket
              if (mergeResult.basket) {
                try {

                  const GuestCartService = (await import('../api/services/guestCart')).default;
                  const customer = await GuestCartService.getBasket(mergeResult.basket.basketId);
                  const { setBasket } = useUnifiedCartStore.getState();
                  setBasket(customer);
                } catch (cartError) {
                  logger.warn('⚠️ AUTH: Failed to update cart store:', cartError);
                }
              }
            } else {
              logger.warn('⚠️ AUTH: Basket merge failed in background:', {
                method: mergeResult.method,
                error: mergeResult.error
              });
            }
          } catch (mergeError) {
            // console.error('❌ AUTH: Basket merge error in background:', mergeError);
          }
          // })();
        }

        // Handle cart initialization in background (non-blocking)
        // Pass merge result if available, otherwise let cart store handle it
        // (async () => {
        //   try {
        //     // Wait a bit for merge to complete if it's in progress
        //     if (guestBasketId && guestCustomerId && !mergeResult) {
        //       await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s for merge
        //     }

        //     const { handleLogin } = useUnifiedCartStore.getState();
        //     await handleLogin(userData.customerId, {
        //       guestBasketId: mergeResult?.success ? null : guestBasketId,
        //       guestCustomerId: mergeResult?.success ? null : guestCustomerId,
        //       guestBasketItems: mergeResult?.success ? null : guestBasketItems,
        //       mergeCompleted: mergeResult?.success || false,
        //       mergeResult: mergeResult
        //     });
        //   } catch (cartError) {
        //     logger.warn('⚠️ AUTH: Cart initialization failed in background:', cartError);
        //   }
        // })();

        // Load full customer data in background (non-blocking)
        // This enriches user data but doesn't block login
        (async () => {
          try {
            const customer = await getCustomer();
            const enrichedUserData = {
              ...userData,
              firstName: customer.firstName || "",
              lastName: customer.lastName || "",
              email: customer.email || userData.email,
              phone: formatPhoneNumber(customer.phone) || formatPhoneNumber(customer.phoneMobile) || formatPhoneNumber(customer.phoneHome) || "",
              phoneMobile: formatPhoneNumber(customer.phoneMobile) || "",
              phoneHome: formatPhoneNumber(customer.phoneHome) || "",
            };
            dispatch({ type: AUTH_ACTIONS.SET_USER, payload: enrichedUserData });
          } catch (e) {
            // Non-critical, user data already set
          }
        })();

        // Update Evergage user ID in background (non-blocking)
        (async () => {
          try {
            await initializeEvergageUser();
          } catch (evergageError) {
            // Non-critical
          }
        })();

        // Clear guest data in background
        (async () => {
          try {
            clearStoredGuestData();
          } catch (e) {
            // Non-critical
          }
        })();
      }

      // Set loading to false immediately for fast response
      // Background operations (merge, cart init, etc.) continue asynchronously
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      return response;
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    }
  };

  // Create User
  const handleCreateUser = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      // createUser now handles token management internally
      const response = await createUser({ ...userData, email: userData.email.toLowerCase() });

      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      return response;
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    }
  };

  // Check if user exists and send OTP if they do
  const handleCheckUserExists = async (userId) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const result = await checkUserExists(userId);

      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      return result;
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error.message });
      return { success: false, userExists: false, error: error.message };
    }
  };

  // Refresh Token (tokens handled by token manager; no user_data updates)
  const refreshToken = async (refreshTokenValue) => {
    try {
      const response = await refreshAccessToken(refreshTokenValue);

      if (response.success) {
        dispatch({ type: AUTH_ACTIONS.SET_TOKENS, payload: response.data });
      }

      return response;
    } catch (error) {
      // If refresh fails, logout user
      handleLogout();
      return { success: false, error: error.message };
    }
  };

  // Logout
  const handleLogout = async () => {
    // 1) call server logout (best-effort)
    try {
      await logoutCustomerSLAS();
    } catch (e) {
      logger.warn("⚠️ SLAS logout failed, continuing local logout:", e?.message || e);
    }

    // 2) local logout (your existing logic)
    dispatch({ type: AUTH_ACTIONS.LOGOUT });

    // Clear only user data from localStorage (preserves guest data)
    clearAuthData();

    // Clear auth_token using unified token manager
    clearAuthToken();

    // Handle cart switching when user logs out
    try {
      const { handleLogout: handleCartLogout } = useUnifiedCartStore.getState();
      handleCartLogout();
      window.location.reload();
    } catch (cartError) {
      // Don't fail logout if cart switch fails
    }

    // Update Evergage user ID after logout (switch to guest)
    try {
      await initializeEvergageUser();
    } catch (evergageError) {
    }

    ('✅ Logout completed - user data cleared, guest data preserved');
  };

  // Clear Error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Set Guest Token
  const setGuestToken = (token) => {
    dispatch({ type: AUTH_ACTIONS.SET_GUEST_TOKEN, payload: token });
    // Note: guest_token is now managed by authTokenManager
    // This is kept for backward compatibility but token should come from authTokenManager
  };

  const value = {
    // State
    user: state.user,
    tokens: state.tokens,
    guestToken: state.guestToken,
    loading: state.loading,
    error: state.error,
    isAuthenticated: state.isAuthenticated,
    authReady,

    // Computed
    activeToken: getActiveToken(),
    tokenType: getTokenType(),

    // Actions
    sendOTP: handleSendOTP,
    verifyOTP: handleVerifyOTP,
    createUser: handleCreateUser,
    checkUserExists: handleCheckUserExists,
    refreshToken,
    logout: handleLogout,
    clearError,
    setGuestToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
