import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";

import { LottieModal, PaymentOptions } from "@/components/compounds";
import { LOCAL_KEYS } from "@/constants/localStorageKeys";
import { LoaderAnimation } from "@/assets/animation";
import useAddressStore from "@/context/useAddressStore";
import { useUnifiedCartStore } from "@/context/unifiedCartStore";
import CartCouponAndPricingSection from "../Cart/cartCouponAndPricing";

import { useQuery, useMutation } from "@tanstack/react-query";
import { CURRENCY_SYMBOL, FreeShippingThreshold } from "@/constants/constants";

// SFCC
import { getCustomer } from "@/api/services/sfccCustomers";
import { isUserLoggedIn } from "@/utils/tokenUtils";
import {
  get_available_shipping_methods,
  cancel_sfcc_order,
} from "@/api/services/sfccCheckout";

import {
  Box,
  Flex,
  Heading,
  Text,
  Link,
  Stack,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  ModalBody,
  ModalHeader,
  Divider,
  useBreakpointValue,
  Image,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerBody,
  Button,
} from "@chakra-ui/react";

// Import payment utilities at the top to avoid dynamic import issues
// Note: verifyPaymentWithBackend removed - we trust Stripe's status, backend updates via webhook
import {
  savePaymentState,
  getPaymentState,
  clearPaymentState,
  hasValidPaymentState,
  markPaymentCancelled,
  isPaymentCancelled,
} from "@/utils/paymentStateManager";
import {
  restoreBasketItemsWithRetry,
  validateBasketSnapshot,
  createBasketSnapshot,
} from "@/utils/basketRestorationHelper";
import {
  didBreezeCheckoutOpen,
  resetBreezeCheckoutState,
} from "@/utils/breezeCheckoutState";
import { logger } from "@/utils/logger.js";

import {
  ShimmerCheckout,
  ShimmerCheckoutProducts,
  ShimmerShippingMethods,
} from "@/components/layouts/Simmers/ShimmerCheckout";
import { trackBeginCheckout } from "@/utils/dataLayer";
import { trackBeginCheckout as trackEinsteinBeginCheckout } from "@/api/services/einsteinTracking";
import Shippingmid1 from "../Shipping/Shippingmid1";
import EditShippingAddress from "../Shipping/EditShippingAddress";
import {
  AddAddressModal,
  AddressList,
  CheckboxBW,
  CustomAddressModal,
  DesktopAddressModal,
  EditAddressModal,
  RadioBW,
} from "./AddressContentSubComponents";
import { useBreezeSDK } from "@/Hooks/useBreezeSDK";
import { useBackExitGuard } from "@/Hooks/useBackExitGuard";

const AddressContent = ({ isHidden }) => <CheckoutForm isHidden={isHidden} />;

const toNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const upper = (v) =>
  String(v || "")
    .trim()
    .toUpperCase();
const getRequestId = () => crypto.randomUUID();

const CartItems = ({ basketId }) => {
  const { getCustomerBasket } = useUnifiedCartStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBasket = async () => {
      try {
        const basketData = await getCustomerBasket(basketId);
        if (basketData?.productItems) {
          setItems(basketData.productItems);
        }
      } catch (error) {
        console.error("Failed to fetch customer basket:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBasket();
  }, [getCustomerBasket, basketId]);

  if (loading) return <ShimmerCheckoutProducts />;

  if (!items.length) return null;

  return (
    <Box
      mt={6}
      borderWidth={{ base: "1.5px", lg: "1px" }}
      borderColor={{ base: "black", lg: "#9d9d9d" }}
      borderRadius={{ base: "lg", lg: 0 }}
      boxShadow={{
        base: "0 0 14px rgba(0, 0, 0, 0.24)",
        lg: "none",
      }}
      p={3}
    >
      <Text
        fontSize={{ base: "sm", lg: "sm" }}
        fontWeight={{ base: "normal", lg: "semibold" }}
        textTransform="uppercase"
        mb={3}
      >
        Items in your bag ({items.length})
      </Text>

      <Stack spacing={3}>
        {items.map((it, idx) => {
          const title = it?.productName || it?.itemText || "Product";
          const qty = Number(it?.quantity || 1);
          const price = Number(it?.price || it?.basePrice || 0);

          // image (basic version; CartQuickView has advanced resolveItemImage)
          const raw =
            it?.c_images?.large?.[0]?.absURL ||
            it?.c_images?.small?.[0]?.absURL ||
            it?.c_images?.large?.[0]?.url ||
            it?.c_images?.small?.[0]?.url;

          return (
            <Flex
              key={it?.itemId || `${it?.productId}-${idx}`}
              gap={3}
              align="center"
            >
              <Box
                w="70px"
                minW="70px"
                h="90px"
                overflow="hidden"
                bg="blackAlpha.50"
              >
                {raw ? (
                  <Image
                    src={raw}
                    alt={title}
                    w="full"
                    h="full"
                    objectFit="cover"
                  />
                ) : (
                  <Box w="full" h="full" bg="blackAlpha.50" />
                )}
              </Box>

              <Box flex="1" minW={0}>
                <Text
                  fontSize={{ base: "xs", lg: "sm" }}
                  noOfLines={2}
                  fontWeight="medium"
                >
                  {title}
                </Text>
                <Text
                  fontSize={{ base: "10px", lg: "xs" }}
                  opacity={0.7}
                  mt="2px"
                >
                  Qty: {qty}
                </Text>
                <Text fontSize={{ base: "xs", lg: "sm" }} mt="6px">
                  {CURRENCY_SYMBOL} {price}
                </Text>
              </Box>
            </Flex>
          );
        })}
      </Stack>
    </Box>
  );
};

const CheckoutForm = ({ isHidden }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const queryParams = new URLSearchParams(location.search);
  const urlBasketId = queryParams.get("basketId");

  // Ref for manual Breeze observer
  const breezeObserverRef = useRef(null);

  const { isProcessing } = useBreezeSDK();
  if (isProcessing) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Simple loader or just blank to avoid flickering */}
        <div>Processing payment update...</div>
      </div>
    );
  }
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const openAddressModal = () => setIsAddressModalOpen(true);
  const closeAddressModal = () => setIsAddressModalOpen(false);
  const [isCodPopupOpen, setIsCodPopupOpen] = useState(false);

  const isDesktop = useBreakpointValue({ base: false, lg: true });
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const openAddAddress = () => setIsAddAddressOpen(true);
  const closeAddAddress = () => setIsAddAddressOpen(false);

  const [isEditAddressOpen, setIsEditAddressOpen] = useState(false);
  const [editAddressId, setEditAddressId] = useState(null);

  const openEditAddress = (id) => {
    setEditAddressId(id);
    setIsEditAddressOpen(true);
  };

  const closeEditAddress = async (opts = {}) => {
    const savedEditId = editAddressId;
    setIsEditAddressOpen(false);
    setEditAddressId(null);

    // refresh address list after save
    if (opts?.refresh) {
      try {
        await fetchAddress();
        // If the edited address is the currently selected one, re-run address sync
        // to refetch shipping methods and other APIs.
        if (savedEditId && savedEditId === selectedAddressId) {
          // fetchAddress updates the store. We get the fresh address array:
          const freshAddresses = useAddressStore.getState().address || [];
          const updatedSelectedAddress = freshAddresses.find(
            (a) => a.id === savedEditId,
          );

          if (updatedSelectedAddress) {
            // handleAddressSelect is defined below, but accessible at runtime
            await handleAddressSelect(updatedSelectedAddress);
          }
        }
      } catch (err) {
        console.error("Error refreshing address list:", err);
      }
    }
  };

  const useLockBodyScroll = (locked) => {
    useEffect(() => {
      if (!locked) return;

      const scrollY = window.scrollY;

      // Lock body in place (works on iOS too)
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none"; // prevent gestures

      return () => {
        // Restore
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        document.body.style.touchAction = "";

        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }, [locked]);
  };

  useLockBodyScroll(isAddressModalOpen);

  const handleOpenAddAddressModal = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    closeAddressModal(); // if saved address modal open, close it
    openAddAddress(); // open add address modal
  };

  // Fix: Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const {
    fetchAddress,
    address: addressFromStore,
    isLoading: loadingAddresses,
  } = useAddressStore();

  const {
    total: cartTotalFromStore,
    basket,
    updateShippingAddress,
    updateShippingMethod,
    addPaymentInstrument,
    createOrder,
    clearBasketAfterPayment,
    refreshCartFromAPI, // Add this to refresh cart after restoration
  } = useUnifiedCartStore();

  const [customerBasket, setCustomerBasket] = useState(null);

  // NEW: Force re-sync of payment and shipping on mount/visit (User requested "call ever time" & "never use cached value")
  useEffect(() => {
    console.log(
      basket?.basketId,
      urlBasketId,
      location.key,
      "Basket and URL state on mount",
    );
    const init = async () => {
      if (basket || urlBasketId) {
        // 1. Ensure fresh basket (fix for "new items not added" issue)
        if (!urlBasketId && refreshCartFromAPI) {
          await refreshCartFromAPI();
        }

        // 2. Reset flags to force the component to re-execute the API chain
        // Chain: handleAddressSelectFirstTime -> updateShippingAddress -> updateShippingMethod -> addPaymentInstrument
        setShippingSynced(false);
        setPaymentSynced(false);
        setAddressSynced(false);

        // 3. Reset selected address ID to null.
        // CRITICAL: This satisfies the condition (!addressSynced && selectedAddressId === null)
        // so that handleAddressSelectFirstTime is called.
        setSelectedAddressId(null);
      }
      console.log("Initialization complete - flags reset to force re-sync");
    };
    init();
  }, [basket?.basketId, urlBasketId, location.key]);

  // Derived basket: use local customerBasket (temporary) if available, otherwise global basket
  const checkoutBasket = urlBasketId ? customerBasket : basket;
  
  // Also derive total UI from the correct basket
  const orderTotalUI = toNum(
    checkoutBasket?.orderTotal || useUnifiedCartStore.getState().orderTotalUI,
    0,
  );
  console.log(checkoutBasket, "checkoutBasketorderTotalUI");
  console.log(orderTotalUI, "checkoutBasketorderTotalUI");

  // Breeze discount is calculated here
  // const breezeDiscountAmount = (orderTotalUI * 0.05).toFixed(1);

  // ---------------------------
  // Fetch basket logic (Ported from cartCouponAndPricing.jsx)
  // ---------------------------
  const fetchBasketData = React.useCallback(async () => {
    try {
      if (urlBasketId) {
        // Case 1: Buy Now Flow - Explicitly get basket by ID using Checkout API
        try {
          // We need dynamic imports or reuse existing api client
          const endpoint = `/checkout/shopper-baskets/v2/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/baskets/${urlBasketId}`;
          const { default: sfccApiClient } =
            await import("@/api/sfccApiClient");

          // Fix: Correctly get locale
          const locale = import.meta.env.VITE_SFCC_LOCALE || "en-IN";

          const url = sfccApiClient.buildUrl(
            endpoint,
            import.meta.env.VITE_SFCC_SITE_ID,
          );
          const params = new URLSearchParams({
            locale: locale,
          });
          const fullUrl = `${url}&${params.toString()}`;

          const resolved = await sfccApiClient.get(fullUrl);

          if (resolved) {
            let finalBasket = resolved;
            // No need to fetch promotions here, just the basket structure is enough for checkout
            setCustomerBasket(finalBasket);
          }
        } catch (error) {
          console.error(
            "Failed to fetch temporary basket via checkout API:",
            error,
          );
        }
      }
    } catch (err) {
      console.error("Failed to resolve basket:", err);
    }
  }, []);

  useEffect(() => {
    fetchBasketData();
  }, [fetchBasketData]);

  const basketId =
    checkoutBasket?.basketId || checkoutBasket?.id || checkoutBasket?.basket_id;
  const shipmentId = checkoutBasket?.shipments?.[0]?.shipmentId || "";

  // UI + data
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  // Use address from store, fallback to empty array
  const displayAddresses = addressFromStore || [];

  const [paymentMethod, setPaymentMethod] = useState("");
  const [shippingMethod, setShippingMethod] = useState(null);
  const [shippingPrice, setShippingPrice] = useState(0);

  const [placingOrder, setPlacingOrder] = useState(false);

  // ✅ strict sequence flags
  const [addressSynced, setAddressSynced] = useState(false);
  const [shippingSynced, setShippingSynced] = useState(false);
  const [paymentSynced, setPaymentSynced] = useState(false);

  // ✅ PI sync anti-spam
  const piSyncRef = useRef({ lastKey: "" });
  const isSyncingRef = useRef(false); // Fix: Prevent concurrent syncPI calls

  // helpers moved outside

  // redirect if basket missing
  useEffect(() => {
    // If usage of URL basket ID (Buy Now), wait for it to be fetched
    if (urlBasketId && !checkoutBasket) {
      return; // Loading...
    }

    if (checkoutBasket && !basketId) {
      // basket object exists but basketId is missing -> treat as broken basket
      navigate("/order");
    }
    if (!checkoutBasket && !urlBasketId) {
      // allow a moment for basket to load; don't force navigate instantly
      // if you want strict: uncomment next line
      // navigate("/order");
    }
  }, [checkoutBasket, basketId, navigate, urlBasketId]);

  // ------------------------
  // address select (FIRST) - ✅ wait for basketId
  // ------------------------
  useEffect(() => {
    if (!basketId) return; // ✅ IMPORTANT: do nothing until basketId exists
    if (!displayAddresses || displayAddresses.length === 0) return;

    // const billingAddress = basket?.billingAddress || null;
    // const normalize = (val) => (val || "").trim().toLowerCase();

    const handleAddressSelectFirstTime = async (address) => {
      if (!address) return;

      // ✅ guard
      if (!basketId) {
        setAddressSynced(false);
        return;
      }

      try {
        // reset later steps
        setAddressSynced(false);
        setShippingSynced(false);
        setPaymentSynced(false);
        const shippingAddress = {
          firstName: address.firstName,
          lastName: address.lastName,
          address1: address.address1 || address.address, // Fallback to joined if specific missing
          address2: address.address2 || "",
          city: address.cityName,
          postalCode: address.postalCode,
          stateCode: address.stateName,
          countryCode: address.countryName,
          phone: address.phone,
          c_email: address.c_email || user?.email,
        };

        let temporary = false;
        if (urlBasketId) {
          temporary = true;
        }
        const updatedBasket = await updateShippingAddress({
          shippingAddress,
          basketId: urlBasketId,
          temporary,
        });

        // Refresh local basket for temporary flow using returned result
        if (urlBasketId && updatedBasket) {
          setCustomerBasket(updatedBasket);
        }

        setSelectedAddressId(address.id);
        // ✅ step1 done
        setAddressSynced(true);
      } catch (e) {
        logger.error("Failed to update shipping address:", e);
        // toast.error("Failed to update shipping address");
        setAddressSynced(false);
      }
    };

    // otherwise select first address and push to basket
    // Only select if addressSynced is false (not already synced)
    // This prevents re-selecting when we've already synced
    if (!addressSynced && selectedAddressId === null) {
      const first = displayAddresses[0];
      if (first) {
        logger.log("🔄 Auto-selecting first address after basket restoration", {
          basketId,
          addressId: first.id,
          addressCount: displayAddresses.length,
        });
        handleAddressSelectFirstTime(first);
      }
    }
  }, [
    basketId,
    displayAddresses,
    user?.email,
    addressSynced,
    selectedAddressId,
  ]);

  const handleAddressSelect = async (address) => {
    try {
      if (!basketId) {
        // toast.error("Basket not found. Please refresh.");
        return;
      }

      // reset later steps
      setAddressSynced(false);
      setShippingSynced(false);
      setPaymentSynced(false);

      const shippingAddress = {
        firstName: address.firstName,
        lastName: address.lastName,
        address1: address.address1 || address.address,
        address2: address.address2 || "",
        city: address.cityName,
        postalCode: address.postalCode,
        stateCode: address.stateName,
        countryCode: address.countryName,
        phone: address.phone,
        c_email: address.c_email || user?.email,
      };

      let temporary = false;
      if (urlBasketId) {
        temporary = true;
      }
      const res = await updateShippingAddress({
        shippingAddress,
        basketId: urlBasketId,
        temporary,
      });

      if (urlBasketId && res) {
        setCustomerBasket(res);
      }

      setSelectedAddressId(address.id);

      setAddressSynced(true);
    } catch (error) {
      logger.error("Failed to update shipping address:", error);
      // toast.error("Failed to update shipping address.");
      setAddressSynced(false);
    }
  };

  const handleRadioBoxChange = async (addressId) => {
    const selectedAddress = displayAddresses.find((a) => a.id === addressId);
    if (!selectedAddress) return;

    await handleAddressSelect(selectedAddress);
    setSelectedAddressId(addressId);
  };

  const displaySorted = useMemo(() => {
    if (!Array.isArray(displayAddresses)) return [];
    return [...displayAddresses].sort((a, b) => {
      const aSel = a.id === selectedAddressId;
      const bSel = b.id === selectedAddressId;
      if (aSel === bSel) return 0;
      return aSel ? -1 : 1;
    });
  }, [displayAddresses, selectedAddressId]);

  const selectedAddress = useMemo(() => {
    if (!Array.isArray(displayAddresses) || displayAddresses.length === 0)
      return null;
    const found = displayAddresses.find(
      (a) => String(a.id) === String(selectedAddressId),
    );
    return found || displayAddresses[0] || null;
  }, [displayAddresses, selectedAddressId]);

  // ------------------------
  // shipping methods (SECOND) - wait for addressSynced
  // ------------------------
  const {
    data: shippingData,
    isLoading: loadingShippingMethods,
    isError: shippingError,
  } = useQuery({
    queryKey: ["sfcc_shipping_methods", { basketId, shipmentId }],
    queryFn: get_available_shipping_methods,
    enabled: Boolean(basketId && shipmentId && addressSynced),
    // FORCE FRESH FETCH every time
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
  });

  const shippingMutation = useMutation({
    mutationFn: ({ id }) =>
      updateShippingMethod({
        id,
        basketId: urlBasketId,
        temporary: Boolean(urlBasketId),
      }),
    onSuccess: async (data) => {
      if (urlBasketId && data) {
        setCustomerBasket(data);
      }
      setShippingSynced(true);
      setPaymentSynced(false);
    },
    onError: (err) => {
      console.error(err);
      // toast.error("Failed to update shipping method");
      setShippingSynced(false);
    },
  });

  // Coupon and order summary needs shipping price, so we calculate it here and pass down
  useEffect(() => {
    const run = async () => {
      if (!shippingData?.methods?.length) return;
      if (!addressSynced) return;
      if (!basketId) return;

      setShippingSynced(false);
      setPaymentSynced(false);

      const defaultMethod =
        shippingData.methods.find(
          (m) => m.id === shippingData.defaultMethodId,
        ) || shippingData.methods[0];

      const chosenId = shippingMethod || defaultMethod.id;
      const chosen =
        shippingData.methods.find((m) => m.id === chosenId) || defaultMethod;

      setShippingMethod(chosen.id);
      setShippingPrice(toNum(chosen.price, 0));

      try {
        let temporary = false;
        if (urlBasketId) {
          temporary = true;
        }
        const res = await updateShippingMethod({
          id: chosen.id,
          basketId: urlBasketId,
          temporary,
        });

        if (urlBasketId && res) {
          setCustomerBasket(res);
        }

        setShippingSynced(true);
      } catch (e) {
        console.error(e);
        // toast.error("Failed to set shipping method");
        setShippingSynced(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    shippingData?.methods,
    shippingData?.defaultMethodId,
    addressSynced,
    basketId,
  ]);

  const handleRadioShippingMethodChange = (methodId) => {
    setShippingMethod(methodId);

    if (shippingData?.methods?.length) {
      const m = shippingData.methods.find((x) => x.id === methodId);
      setShippingPrice(m ? toNum(m.price, 0) : 0);
    }

    if (basketId) {
      setShippingSynced(false);
      setPaymentSynced(false);
      shippingMutation.mutate({ id: methodId });
    }
  };

  // Track beginCheckout for Einstexin Commerce Cloud
  useEffect(() => {
    try {
      if (basket) {
        trackBeginCheckout(basket);

        const products = (basket?.productItems || []).map((item) => ({
          id: item.productId || item.id,
          price: Number(item.price || item.basePrice || 0),
          quantity: Number(item.quantity || 1),
          image:
            item?.c_images?.large?.[0]?.absURL ||
            item?.c_images?.small?.[0]?.absURL ||
            "",
        }));

        console.log("Tracking Einstein beginCheckout with products:", products);
        const amount = Number(basket.orderTotal || basket.total || 0);
        trackEinsteinBeginCheckout(products, amount);
      }
    } catch {
      // ignore
    }
  }, []);

  // ------------------------
  // Payment method default (UI)
  // ------------------------
  useEffect(() => {
    if (placingOrder) return;

    console.log(paymentMethod, "Current payment method in useEffect");

    const basketPI =
      checkoutBasket?.paymentInstruments?.[0]?.paymentMethodId ||
      checkoutBasket?.paymentInstruments?.[0]?.payment_method_id ||
      checkoutBasket?.paymentInstruments?.[0]?.paymentMethod ||
      "";

    console.log(basketPI, "Basket payment instrument on load");

    if (basketPI) {
      const method = basketPI.toUpperCase();

      if (method === "COD") {
        setPaymentMethod("BREEZE");
      } else {
        setPaymentMethod(method);
      }
      return;
    }

    console.log(paymentMethod, "Payment method after checking basket PI");

    // Default fallback
    if (!paymentMethod) setPaymentMethod("BREEZE");
  }, []);
  // ------------------------
  // addPaymentInstrument (THIRD)
  // ------------------------
  useEffect(() => {
    // ✅ PI sync anti-spam

    const syncPI = async () => {
      if (placingOrder) return; // Prevent duplicate syncs while order is being created
      if (!basketId) return;
      if (!addressSynced) return;
      if (!shippingSynced) return;
      if (!paymentMethod) return;

      const methodId = upper(paymentMethod);

      // ✅ Allow multiple payment processors
      // if (methodId !== "STRIPE") return;

      // ✅ CRITICAL: Verify basket actually has shipping address before adding payment instrument
      // This prevents MISSING_SHIPPING_ADDRESS errors from SFCC
      const hasShippingAddress = Boolean(
        checkoutBasket?.billingAddress?.address1 ||
        checkoutBasket?.shipments?.[0]?.shippingAddress?.address1,
      );

      if (!hasShippingAddress) {
        logger.warn(
          "Cannot add payment instrument: basket missing shipping address",
          {
            basketId,
            addressSynced,
            shippingSynced,
            hasBillingAddress: !!checkoutBasket?.billingAddress?.address1,
            hasShippingAddress:
              !!checkoutBasket?.shipments?.[0]?.shippingAddress?.address1,
          },
        );
        // Reset flags to trigger retry after basket refresh
        setAddressSynced(false);
        setShippingSynced(false);
        setPaymentSynced(false);

        // Try to refresh basket data to get latest state
        if (urlBasketId) {
          try {
            await fetchBasketData();
          } catch (refreshError) {
            logger.error("Failed to refresh basket data:", refreshError);
          }
        }
        return;
      }

      logger.log("basket", checkoutBasket);
      const amount = toNum(checkoutBasket?.orderTotal, 0); // Use checkoutBasket orderTotal safely
      if (!Number.isFinite(amount) || amount <= 0) return;

      const key = `${basketId}|${methodId}|${amount.toFixed(2)}`;

      // Check existing sync state
      if (piSyncRef.current.lastKey === key && paymentSynced) return;

      // Fix: Check if already syncing to prevent race conditions from basket updates
      if (isSyncingRef.current) return;

      try {
        isSyncingRef.current = true;
        setPaymentSynced(false);

        let temporary = false;
        if (urlBasketId) {
          temporary = true;
        }
        const res = await addPaymentInstrument({
          paymentMethodId: methodId,
          amount: orderTotalUI,
          basketId: urlBasketId,
          temporary,
        });

        if (urlBasketId && res) {
          setCustomerBasket(res);
        }

        piSyncRef.current.lastKey = key;
        setPaymentSynced(true);
      } catch (e) {
        logger.error("addPaymentInstrument failed:", e);

        // ✅ Handle MISSING_SHIPPING_ADDRESS error specifically
        const errorMessage = e?.message || String(e);
        const statusCode = e?.statusCode || e?.details?.statusCode;
        const isMissingAddressError =
          statusCode === "MISSING_SHIPPING_ADDRESS" ||
          errorMessage.includes("MISSING_SHIPPING_ADDRESS") ||
          errorMessage.includes("missing a shipping address") ||
          errorMessage.includes("The basket is missing a shipping address");

        if (isMissingAddressError) {
          logger.warn(
            "Payment instrument failed: basket missing shipping address",
            {
              basketId,
              statusCode,
              error: errorMessage,
              hasShippingAddress: Boolean(
                checkoutBasket?.billingAddress?.address1 ||
                checkoutBasket?.shipments?.[0]?.shippingAddress?.address1,
              ),
            },
          );

          // Reset flags to trigger retry
          setAddressSynced(false);
          setShippingSynced(false);
          setPaymentSynced(false);

          // Refresh basket to get latest state
          if (urlBasketId) {
            try {
              await fetchBasketData();
            } catch (refreshError) {
              logger.error(
                "Failed to refresh basket after payment instrument error:",
                refreshError,
              );
            }
          }

          // toast.warning("Please ensure address and shipping are set before payment. Retrying...");
        } else {
          setPaymentSynced(false);
          // toast.error("Failed to add payment method. Please try again.");
        }
      } finally {
        isSyncingRef.current = false;
      }
    };

    syncPI();
  }, [
    basketId,
    basket?.paymentInstruments,
    addressSynced,
    shippingSynced,
    paymentMethod,
    cartTotalFromStore,
    shippingPrice,
    addPaymentInstrument,
    // paymentSynced,
    checkoutBasket,
  ]);

  const basketHasAddress = Boolean(
    checkoutBasket?.billingAddress?.address1 ||
    checkoutBasket?.shipments?.[0]?.shippingAddress?.address1,
  );

  const basketHasShippingMethod = Boolean(
    checkoutBasket?.shipments?.[0]?.shippingMethod?.id ||
    checkoutBasket?.shipments?.[0]?.shippingMethod?.shippingMethodId,
  );

  logger.log("Checkout state:", {
    loadingAddresses,
    loadingShippingMethods,
    shippingMutationPending: shippingMutation.isPending,
    basketHasAddress,
    basketHasShippingMethod,
    placingOrder,
    addressSynced,
    shippingSynced,
    paymentSynced,
  });

  const disablePlaceOrder =
    placingOrder ||
    // !basketId ||
    loadingAddresses ||
    loadingShippingMethods ||
    shippingMutation.isPending ||
    !addressSynced ||
    !shippingSynced ||
    !paymentSynced;
  // ------------------------
  // Setup Breeze Observer (Moved outside onPlaceOrder for stability)
  // ------------------------
  const setupBreezeObserver = () => {
    // Disconnect existing if any
    if (breezeObserverRef.current) {
      breezeObserverRef.current.disconnect();
    }
    console.log("[BREEZE_DEBUG] Setting up Breeze observer");

    // We'll track the added SDK node to know when IT specifically is removed
    let sdkNode = null;
    const startTime = Date.now();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        // 1. Detect SDK Node Addition
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              // Element
              // Assume the first added element at body level is the SDK container
              if (node.parentElement === document.body && !sdkNode) {
                sdkNode = node;
                console.log("[BREEZE_DEBUG] Breeze SDK node detected", node);
                logger.log("Tracking Breeze SDK DOM Node:", node);
              }
            }
          });
        }

        // 2. Detect SDK Node Removal OR Hiding (Manual Close)
        const isRemoved =
          mutation.type === "childList" &&
          Array.from(mutation.removedNodes).includes(sdkNode);

        let isHidden = false;
        if (mutation.type === "attributes" && mutation.target === sdkNode) {
          const style = window.getComputedStyle(sdkNode);
          if (style.display === "none" || style.visibility === "hidden") {
            isHidden = true;
          }
        }

        // Check if modification happened immediately after initialization (ignore false positives during open animation)
        const isInitializationPhase = Date.now() - startTime < 2000;

        if (isRemoved || (isHidden && !isInitializationPhase)) {
          console.log(
            "[BREEZE_DEBUG] Breeze observer detected node removal/hide",
            {
              isRemoved,
              isHidden,
              isInitializationPhase,
              checkoutOpened: didBreezeCheckoutOpen(),
            },
          );
          if (isRemoved)
            logger.log("Breeze SDK Node removed (Manual Close detected)");
          if (isHidden)
            logger.log("Breeze SDK Node hidden (Manual Close detected)");

          if (!didBreezeCheckoutOpen()) {
            console.log(
              "[BREEZE_DEBUG] Ignoring removal because Breeze never became interactive",
            );
            logger.warn(
              "Ignoring Breeze SDK removal before checkout became interactive",
            );
            setPlacingOrder(false);
            resetBreezeCheckoutState();

            if (breezeObserverRef.current) {
              breezeObserverRef.current.disconnect();
              breezeObserverRef.current = null;
            }

            sdkNode = null;
            return;
          }

          const currentOrderId = localStorage.getItem(
            LOCAL_KEYS.PLACED_ORDER_ID,
          );
          if (currentOrderId) {
            console.log("[BREEZE_DEBUG] Triggering cancel from observer", {
              currentOrderId,
              checkoutOpened: didBreezeCheckoutOpen(),
            });
            logger.log(
              "Triggering manual cancellation for order:",
              currentOrderId,
            );
            // Perform cancellation
            cancel_sfcc_order({
              orderId: currentOrderId,
              cancellationReason: "abandoned",
            })
              .then(() => {
                // console.log('Order cancelled successfully via manual observer');
              })
              .catch((err) => {
                console.error("Failed to manually cancel order:", err);
              });

            // Cleanup
            localStorage.removeItem(LOCAL_KEYS.PLACED_ORDER_ID);
            if (breezeObserverRef.current) {
              breezeObserverRef.current.disconnect();
              breezeObserverRef.current = null;
            }

            resetBreezeCheckoutState();
            sdkNode = null;
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: false,
      attributes: true,
      attributeFilter: ["style", "class", "hidden"],
    });

    breezeObserverRef.current = observer;
  };

  // ------------------------
  // place order (NO addPaymentInstrument here)
  // ------------------------
  const onPlaceOrder = async (
    skipCodPopup = false,
    overridePaymentMethod = null,
  ) => {
    // If skipCodPopup is receiving a React synthetic event, reset it to false
    if (typeof skipCodPopup === "object" && skipCodPopup !== null) {
      skipCodPopup = false;
    }

    const activePaymentMethod = overridePaymentMethod || paymentMethod;

    if (!selectedAddressId) {
      // toast.error("Please select an address");
      return;
    }
    if (!basketId) {
      // toast.error("Basket not found");
      return;
    }

    // console.log("activePaymentMethod", activePaymentMethod);
    // console.log("skipCodPopup", skipCodPopup);

    if (activePaymentMethod === "COD" && !skipCodPopup) {
      setIsCodPopupOpen(true);
      return;
    }

    if (urlBasketId) {
      if (!addressSynced || !shippingSynced || !paymentSynced) {
        return;
      }
    } else {
      // Check if we have a valid PI (any type)
      const hasValidPI = (checkoutBasket?.paymentInstruments || []).length > 0;

      if (
        !activePaymentMethod ||
        !basketHasAddress ||
        !basketHasShippingMethod ||
        !hasValidPI
      ) {
        return;
      }
    }

    setPlacingOrder(true);

    // CRITICAL: Clear payment cancellation flag when starting a new order
    // This ensures previous cancellation doesn't affect new order attempt
    // if (isPaymentCancelled()) {
    //   clearPaymentState();
    // }

    try {
      let temporary = false;
      if (urlBasketId) {
        temporary = true;
      }
      const orderData = await createOrder(urlBasketId, temporary);
      const orderId = orderData?.orderNo || orderData?.id;

      if (!orderId) throw new Error("Order ID missing from SFCC response");

      // Handle COD flow: navigate directly to thank you page
      if (activePaymentMethod === "COD") {
        setPlacingOrder(false);
        // Clear global basket unless it's a temporary one (Buy Now flow)
        if (!urlBasketId) {
          clearBasketAfterPayment();
        }
        // Review purchase API call for COD orders
        // try {
        //   const productItems = basket?.productItems || [];

        //   const products = productItems
        //     .map((item) => item?.productId)
        //     .filter(Boolean);

        //   if (!products.length) return;

        //   const response = await fetch(
        //     `${import.meta.env.VITE_WALLET_API_URL}/api/reviews/purchase`,
        //     {
        //       method: "POST",
        //       headers: {
        //         "Content-Type": "application/json",
        //         Authorization: `Bearer my-static-token-123`,
        //       },
        //       body: JSON.stringify({
        //         siteId: "sotbella_in",
        //         userId: basket?.shipments?.[0]?.shippingAddress?.c_email || "guest",
        //         products,
        //         orderId,
        //       }),
        //     }
        //   );

        //   const result = await response.json();

        //   console.log("Review Purchase API result:", result);

        // } catch (error) {
        //   console.error("Review Purchase API failed:", error);
        // }

        navigate(`/thankyou?orderId=${orderId}`);
        return;
      }

      // Handle Breeze Payment flow
      if (activePaymentMethod === "BREEZE") {
        logger.log("🌊 Starting Breeze Payment Flow for order:", orderId);

        // Store current URL (including params and query) to redirect back to in case of failure
        localStorage.setItem("breeze_redirect_url", window.location.href);

        // 1. Extract Breeze payload and signature from API response
        // Note: The API returns c_breezePayload as a stringified JSON
        const breezePayloadStr = orderData?.c_breezePayload;
        const breezeSignature = orderData?.c_breezeSignature;

        if (!breezePayloadStr || !breezeSignature) {
          logger.error(
            "Missing Breeze payload or signature from API response",
            { orderId },
          );
          throw new Error("Invalid Breeze Payment Configuration");
        }

        // 2. Construct Process SDK Payload
        // Use the Key ID provided by the user
        const KEY_ID = "L9tssrqKfYCRT3PBNNlYd";

        // Parse inner payload for discount info
        let breezeInnerPayload = {};
        try {
          breezeInnerPayload = JSON.parse(breezePayloadStr);
        } catch (e) {
          logger.error("Failed to parse c_breezePayload", e);
        }

        const shipment = orderData?.shipments?.[0];
        const billingAddress = orderData?.billingAddress;
        const shippingAddrObj = shipment?.shippingAddress || {};

        // Delivery Charge
        const deliveryPrice = shipment?.shippingTotal || 0;

        // Discount
        const discountAmount = breezeInnerPayload?.totalDiscount || 0;

        // Customer Info
        const fullPhone = billingAddress?.phone || "";
        // simple parsing for IN phone numbers starting with +91
        const phoneWithoutCode = fullPhone.startsWith("+91")
          ? fullPhone.slice(3)
          : fullPhone;

        const customerName =
          billingAddress?.fullName || orderData?.customerName || "Guest";
        const customerEmail =
          billingAddress?.c_email ||
          orderData?.customerInfo?.email ||
          "guest@sotbella.com";

        const shippingPhoneFull = shippingAddrObj?.phone || fullPhone;
        const shippingPhoneWithoutCode = shippingPhoneFull.startsWith("+91")
          ? shippingPhoneFull.slice(3)
          : shippingPhoneFull;

        const processSDKPayload = {
          requestId: getRequestId(),
          service: "in.breeze.onecco",
          payload: {
            action: "startCheckout",
            cart: breezePayloadStr,
            keyId: import.meta.env.VITE_BREEZE_KEY_ID,
            signature: breezeSignature,
            skipOTP: true,
            // paymentLockingPayload: {
            //   paymentMethods: [
            //     {
            //       paymentMethodType: "OFFERS",
            //       filterType: "blacklist"
            //     }
            //   ],
            //   action: "lock",
            //   mergeWithDefaultMethods: false,
            //   supportReordering: false
            // },
            hideUserProfile: true,
            hideAddress: true,
            hideOffersSection: true,
            // amountMeta: [
            //   {
            //     key: "<span style='color:#798fa5'>Delivery Charges (Included)</span>",
            //     value: `<span style='color:black'>${deliveryPrice} {{currencySymbol}}</span>`
            //   },
            //   {
            //     key: "<span style='color:#798fa5'>Discount</span>",
            //     value: `<span style='color:black'>-${discountAmount} {{currencySymbol}}</span>`
            //   }
            // ],
            customer: {
              name: customerName,
              phoneNumber: phoneWithoutCode,
              countryCode: "+91",
              email: customerEmail,
            },
            shippingAddress: {
              name: shippingAddrObj.fullName || customerName,
              phoneNumber: shippingPhoneWithoutCode,
              postalCode: shippingAddrObj.postalCode || "",
              state: shippingAddrObj.stateCode || "",
              city: shippingAddrObj.city || "",
              fullAddress: [
                shippingAddrObj.address1,
                shippingAddrObj.address2,
                shippingAddrObj.city,
                shippingAddrObj.stateCode,
                shippingAddrObj.postalCode,
              ]
                .filter(Boolean)
                .join(", "),
              country: "India", // SDK expects full name usually
              countryPhoneCode: "+91",
            },
          },
        };

        // 3. Save order ID to local storage
        localStorage.setItem(LOCAL_KEYS.PLACED_ORDER_ID, orderId);
        resetBreezeCheckoutState();
        console.log("[BREEZE_DEBUG] Starting Breeze payment flow", {
          orderId,
          breezeSignaturePresent: Boolean(breezeSignature),
          breezePayloadPresent: Boolean(breezePayloadStr),
        });

        setupBreezeObserver();

        // 5. Call BlazeSDK.process
        logger.log("Processing Breeze Payment...", processSDKPayload);
        console.log("[BREEZE_DEBUG] Calling BlazeSDK.process", {
          orderId,
          requestId: processSDKPayload.requestId,
        });

        // 5. Call BlazeSDK.process
        logger.log("Processing Breeze Payment...", processSDKPayload);
        BlazeSDK.process(processSDKPayload);
        return;
      }
    } catch (err) {
      console.error(err);
      try {
        const snapshotRaw = localStorage.getItem("basket_items_snapshot");
        if (snapshotRaw) {
          const snapshot = JSON.parse(snapshotRaw);
          const restoreResult = await restoreBasketItemsWithRetry(
            snapshot.items || snapshot,
            {
              maxRetries: 3,
              retryDelay: 1000,
            },
          );
          if (restoreResult.success) {
            // restored
          }
        }
      } catch (restoreCheckError) {
        console.warn(
          "Failed to perform basket restore in catch block",
          restoreCheckError,
        );
      }
      setPlacingOrder(false);
      return;
    } finally {
      setPlacingOrder(false);
    }
  };

  const { isExitModalOpen, closeExitModal, confirmExit } = useBackExitGuard({
    enabled: true,
  });

  // Your Cancel purchase handler
  const handleCancelPurchase = () => {
    confirmExit();
  };

  console.log(selectedAddress, "isHidden from hook");

  return (
    <Fragment>
      {/* mobile view */}
      <Box display={{ base: "block", lg: "none" }}>
        <Box w="full" px={{ base: "12px", lg: "50px" }} textAlign="left">
          <Flex flexDirection={{ base: "column", lg: "row" }} gap={4}>
            {/* Left column */}
            <Box w={{ base: "100%", lg: "50%" }}>
              <Flex mb={2} mt={1} justify="space-between">
                <Text
                  textTransform="uppercase"
                  fontWeight="semibold"
                  mt={2}
                  mb={3}
                  fontSize="md"
                >
                  Shipping to
                </Text>

                <Text
                  display={{ base: "block", lg: "none" }}
                  textTransform="uppercase"
                  fontWeight="semibold"
                  mt={2}
                  mb={3}
                  fontSize="md"
                  cursor="pointer"
                  textDecoration="underline"
                  textUnderlineOffset="4px"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openAddressModal();
                  }}
                >
                  Saved Address
                </Text>
              </Flex>

              {/* Mobile selected address preview (ONLY ONE) */}
              <Box display={{ base: "block", lg: "none" }}>
                {loadingAddresses ? (
                  <ShimmerCheckout />
                ) : selectedAddress ? (
                  <Box
                    borderWidth={{ base: "1.5px", lg: "1px" }}
                    borderColor={{ base: "black", lg: "#9d9d9d" }}
                    borderRadius={{ base: "lg", lg: 0 }}
                    boxShadow={{
                      base: "0 0 14px rgba(0, 0, 0, 0.24)",
                      lg: "none",
                    }}
                    p={3}
                  >
                    <Flex justify="space-between" align="flex-start" mb="6px">
                      <Text
                        fontSize="sm"
                        fontWeight="medium"
                        color="black"
                        w="95%"
                      >
                        {selectedAddress.address}
                      </Text>

                      <CheckboxBW
                        id={`selected_address_preview_${selectedAddress.id}`}
                        checked={true}
                        label=""
                      />
                    </Flex>

                    <Text fontSize="sm" color="black" mb="3px">
                      {(selectedAddress.firstName ?? "") +
                        " " +
                        (selectedAddress.lastName ?? "")}
                      .
                    </Text>

                    <Text fontSize="sm" color="black" mb="3px">
                      {(selectedAddress.cityName ?? "") +
                        (selectedAddress.stateName
                          ? `, ${selectedAddress.stateName}`
                          : "")}
                    </Text>

                    <Flex justify="space-between" align="center">
                      <Text fontSize="sm" color="black">
                        {selectedAddress.phone}
                      </Text>

                      <Link
                        as="button"
                        type="button"
                        fontSize="xs"
                        opacity={0.5}
                        borderBottom="1px solid"
                        _hover={{ textDecoration: "none", opacity: 0.8 }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (selectedAddress?.id)
                            openEditAddress(selectedAddress.id);
                        }}
                      >
                        Edit
                      </Link>
                    </Flex>
                  </Box>
                ) : (
                  <Text fontSize="sm" color="black" opacity={0.7}>
                    No saved address found.
                  </Text>
                )}
              </Box>

              <Flex
                display={{ base: "flex", lg: "none" }}
                id="add-new-address"
                mb={3}
                gap={1}
                textTransform="uppercase"
                color="black"
                cursor="pointer"
                fontSize="xs"
                align="center"
                onClick={handleOpenAddAddressModal}
                mt={1}
              >
                <Box as="span">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 4V20M20 12H4"
                      stroke="#1D1D1D"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Box>
                <Text _hover={{ fontWeight: "semibold" }}>Add New Address</Text>
              </Flex>

              {/* ✅ MOBILE: show items below selected address */}
              <Box display={{ base: "block", lg: "none" }} mb={4}>
                <CartItems basketId={urlBasketId} />
              </Box>

              <Box
                display={{ base: "block", lg: "none" }}
                borderWidth={{ base: "1.5px", lg: "none" }}
                borderColor={{ base: "black", lg: "transparent" }}
                borderRadius={{ base: "lg", lg: "none" }}
                boxShadow={{ base: "0 0 14px rgba(0, 0, 0, 0.24)", lg: "none" }}
                p={{ base: 3, lg: 0 }}
              >
                {/* Shipping method */}
                {(loadingShippingMethods ||
                  shippingError ||
                  shippingData?.methods?.length > 0) && (
                    <Text
                      textTransform="uppercase"
                      fontWeight="normal"
                      // mt={4}
                      mb={2}
                      fontSize={{ base: "sm", lg: "md" }}
                    >
                      Shipping method
                    </Text>
                  )}

                {loadingShippingMethods ? (
                  <ShimmerShippingMethods />
                ) : shippingError ? (
                  <Text
                    fontSize={{ base: "xs", lg: "sm" }}
                    color="red.500"
                    p={{ base: 2, lg: 4 }}
                  >
                    Failed to load shipping methods
                  </Text>
                ) : (
                  <>
                    {/* ✅ MOBILE: One container box */}
                    <Box
                      display={{ base: "block", lg: "none" }}
                      // borderWidth="1.5px"
                      // borderColor="black"
                      // borderRadius="lg"
                      // boxShadow="0 0 14px rgba(0, 0, 0, 0.24)"
                      overflow="hidden"
                    >
                      {shippingData?.methods?.map((method, idx) => {
                        const isSelected = shippingMethod === method.id;

                        return (
                          <Box
                            key={method.id}
                            px="12px"
                            // py="12px"
                            cursor="pointer"
                            onClick={() =>
                              handleRadioShippingMethodChange(method.id)
                            }
                            // bg={isSelected ? "blackAlpha.50" : "white"}
                            opacity={
                              shippingMutation.isPending &&
                                shippingMethod === method.id
                                ? 0.6
                                : 1
                            }
                          // borderBottom={
                          //   idx === shippingData.methods.length - 1
                          //     ? "none"
                          //     : "1px solid rgba(0,0,0,0.12)"
                          // }
                          >
                            <Flex align="center">
                              <RadioBW
                                name="shippingMethod"
                                value={method.id}
                                checked={isSelected}
                                onChange={() =>
                                  handleRadioShippingMethodChange(method.id)
                                }
                                label=""
                              />

                              <Box ml={3}>
                                <Text
                                  fontSize="sm"
                                  mb={0}
                                  fontWeight={isSelected ? "600" : "400"}
                                >
                                  {method.name}
                                </Text>
                              </Box>

                              <Box ml="auto">
                                <Text fontSize="xs">
                                  {toNum(method.price) > 0
                                    ? `+ ${CURRENCY_SYMBOL} ${toNum(method.price).toFixed(2)}`
                                    : "Free"}
                                </Text>
                              </Box>
                            </Flex>
                            <Text
                              fontSize="xs"
                              color="#3d3d3d"
                              ml={7}
                              fontStyle="italic"
                            >
                              {method.description}
                            </Text>
                          </Box>
                        );
                      })}
                    </Box>
                  </>
                )}

                {/* Payment */}
                <PaymentOptions
                  basketId={basketId}
                  paymentMethod={paymentMethod}
                  setPaymentMethod={(val) => {
                    setPaymentMethod(val);
                    setPaymentSynced(false);
                  }}
                  wallet={false}
                  remainingAmount={0}
                  isHidden={isHidden}
                  selectedAddress={selectedAddress}
                />

                <Divider mt={4} />

                {/* Right column – summary */}
                <CartCouponAndPricingSection
                  bottomRef={{ current: null }}
                  buttonTitle={
                    placingOrder ? "Placing Order..." : "Place Order"
                  }
                  onButtonClick={onPlaceOrder}
                  isButtonDisable={disablePlaceOrder}
                  selectedItems={basket?.productItems || []}
                  shippingCostOverride={shippingPrice}
                  isHidden={isHidden}
                />
              </Box>
            </Box>
          </Flex>
        </Box>

        <LottieModal
          animationData={LoaderAnimation}
          isOpen={placingOrder}
          onClose={() => setPlacingOrder(false)}
          title="Placing Your Order"
          subtitle="Do not close this window while we are processing your order"
        />

        {/* Mobile Address Modal */}
        {!isDesktop && (
          <CustomAddressModal
            isOpen={isAddressModalOpen}
            onClose={closeAddressModal}
            title="Saved Address"
          >
            <Flex justify="space-between" align="center" mb={4}>
              <Text fontSize="sm" fontWeight="semibold">
                Select Address
              </Text>

              <Text
                fontSize="xs"
                textTransform="uppercase"
                cursor="pointer"
                onClick={handleOpenAddAddressModal}
              >
                + Add New
              </Text>
            </Flex>

            <AddressList
              loadingAddresses={loadingAddresses}
              displaySorted={displaySorted}
              selectedAddressId={selectedAddressId}
              handleRadioBoxChange={async (id) => {
                await handleRadioBoxChange(id);
                closeAddressModal();
              }}
              urlBasketId={urlBasketId}
              openEditAddress={(id) => {
                closeAddressModal();
                openEditAddress(id);
              }}
            />
          </CustomAddressModal>
        )}
      </Box>

      {/* desktop view */}
      <Flex
        flexDirection={{ base: "column", lg: "row" }}
        gap={10}
        w="full"
        px={{ base: "12px", lg: "50px" }}
        display={{ base: "none", lg: "flex" }}
      >
        {/* Left column (Address only) */}
        <Box w={{ base: "100%", lg: "50%" }}>
          <Flex mb={2} justify="space-between">
            <Text
              textTransform="uppercase"
              fontWeight="semibold"
              mb={3}
              fontSize="md"
            >
              Shipping to
            </Text>

            <Text
              textTransform="uppercase"
              fontWeight="semibold"
              mb={3}
              fontSize="md"
              cursor="pointer"
              textDecoration="underline"
              textUnderlineOffset="4px"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openAddressModal();
              }}
            >
              Saved Address
            </Text>
          </Flex>

          {/* Add new address (desktop) */}
          <Flex
            display={{ base: "none", lg: "flex" }}
            id="add-new-address"
            mb={5}
            gap={1}
            textTransform="uppercase"
            color="black"
            cursor="pointer"
            fontSize={{ base: "xs", lg: "sm" }}
            align="center"
            onClick={handleOpenAddAddressModal}
            mt={3}
          >
            <Box as="span">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 4V20M20 12H4"
                  stroke="#1D1D1D"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Box>
            <Text _hover={{ fontWeight: "semibold" }}>Add New Address</Text>
          </Flex>

          {/* Desktop address list */}
          {/* ✅ Desktop selected address preview (ONLY ONE) */}
          <Box display={{ base: "none", lg: "block" }}>
            {loadingAddresses ? (
              <ShimmerCheckout />
            ) : selectedAddress ? (
              <Box
                borderWidth="1px"
                borderColor="#9d9d9d"
                borderRadius={0}
                boxShadow="none"
                p={3}
                mt={2}
              >
                <Flex justify="space-between" align="flex-start" mb="6px">
                  <Text fontSize="lg" fontWeight="medium" color="black" w="95%">
                    {selectedAddress.address}
                  </Text>

                  {/* show checked indicator */}
                  <CheckboxBW
                    id={`selected_address_desktop_preview_${selectedAddress.id}`}
                    checked={true}
                    onChange={() => { }} // no-op
                    label=""
                  />
                </Flex>

                <Text fontSize="sm" color="black" mb="3px">
                  {(selectedAddress.firstName ?? "") +
                    " " +
                    (selectedAddress.lastName ?? "")}
                  .
                </Text>

                <Text fontSize="sm" color="black" mb="3px">
                  {(selectedAddress.cityName ?? "") +
                    (selectedAddress.stateName
                      ? `, ${selectedAddress.stateName}`
                      : "")}
                </Text>

                <Flex justify="space-between" align="center">
                  <Text fontSize="sm" color="black">
                    {selectedAddress.phone}
                  </Text>

                  <Link
                    as="button"
                    type="button"
                    fontSize="xs"
                    opacity={0.5}
                    borderBottom="1px solid"
                    _hover={{ textDecoration: "none", opacity: 0.8 }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (selectedAddress?.id)
                        openEditAddress(selectedAddress.id);
                    }}
                  >
                    Edit
                  </Link>
                </Flex>
              </Box>
            ) : (
              <Text fontSize="sm" color="black" opacity={0.7}>
                No saved address found.
              </Text>
            )}
          </Box>
          <Box display={{ base: "none", lg: "block" }}>
            <CartItems basketId={urlBasketId} />
          </Box>
        </Box>

        {/* Right column (Shipping + Payment + Summary) */}
        <Box w={{ base: "100%", lg: "50%" }}>
          {/* Shipping method */}
          {(loadingShippingMethods ||
            shippingError ||
            shippingData?.methods?.length > 0) && (
              <Text
                textTransform="uppercase"
                fontWeight="normal"
                mb={3}
                fontSize="md"
              >
                Shipping method
              </Text>
            )}

          {loadingShippingMethods ? (
            <ShimmerShippingMethods />
          ) : shippingError ? (
            <Text fontSize="sm" color="red.500" p={{ base: 2, lg: 4 }}>
              Failed to load shipping methods
            </Text>
          ) : (
            <Box>
              {shippingData?.methods?.map((method) => (
                <>
                  <Box
                    key={method.id}
                    w="full"
                    display="flex"
                    flexDir="column"
                    p={{ base: 2, lg: 4 }}
                    mb={{ base: 4, lg: 1 }}
                    borderWidth={{ base: "1.5px", lg: "1px" }}
                    borderColor={{ base: "black", lg: "blackAlpha.500" }}
                    borderRadius={{ base: "lg", lg: 0 }}
                    boxShadow={{
                      base: "0 0 14px rgba(0, 0, 0, 0.24)",
                      lg: "none",
                    }}
                    cursor="pointer"
                    onClick={() => handleRadioShippingMethodChange(method.id)}
                    opacity={
                      shippingMutation.isPending && shippingMethod === method.id
                        ? 0.6
                        : 1
                    }
                  >
                    <Flex align="center">
                      <RadioBW
                        name="shippingMethod"
                        value={method.id}
                        checked={shippingMethod === method.id}
                        onChange={() =>
                          handleRadioShippingMethodChange(method.id)
                        }
                        label=""
                      />
                      <Box ml={3}>
                        <Text fontSize="sm" mb={0}>
                          {method.name}
                        </Text>
                      </Box>
                      <Box ml="auto">
                        <Text fontSize={{ base: "xs", lg: "sm" }}>
                          {toNum(method.price) > 0
                            ? `+ ${CURRENCY_SYMBOL} ${toNum(method.price).toFixed(2)}`
                            : "Free"}
                        </Text>
                      </Box>
                    </Flex>
                    <Text
                      fontSize="xs"
                      color="#3d3d3d"
                      ml={7}
                      fontStyle="italic"
                    >
                      {method.description}
                    </Text>
                  </Box>
                </>
              ))}
            </Box>
          )}

          {/* Desktop Address Modal */}
          {isDesktop && (
            <DesktopAddressModal
              isOpen={isAddressModalOpen}
              onClose={closeAddressModal}
              title="Saved Address"
            >
              <Flex justify="space-between" align="center" mb={4}>
                <Text fontSize="sm" fontWeight="semibold">
                  Select Address
                </Text>

                <Flex
                  fontSize="sm"
                  textTransform="uppercase"
                  cursor="pointer"
                  align="center"
                  gap={1}
                  onClick={handleOpenAddAddressModal}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 4V20M20 12H4"
                      stroke="#1D1D1D"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Add New
                </Flex>
              </Flex>

              <AddressList
                loadingAddresses={loadingAddresses}
                displaySorted={displaySorted}
                selectedAddressId={selectedAddressId}
                handleRadioBoxChange={async (id) => {
                  await handleRadioBoxChange(id);
                  closeAddressModal();
                }}
                urlBasketId={urlBasketId}
                openEditAddress={(id) => {
                  closeAddressModal();
                  openEditAddress(id);
                }}
              />
            </DesktopAddressModal>
          )}

          {/* Payment method */}
          <Box mt={6}>
            <PaymentOptions
              basketId={basketId}
              paymentMethod={paymentMethod}
              setPaymentMethod={(val) => {
                setPaymentMethod(val);
                setPaymentSynced(false);
              }}
              wallet={false}
              remainingAmount={0}
              isHidden={isHidden}
              selectedAddress={selectedAddress}

            />
          </Box>

          {/* Summary */}
          <Box mt={1}>
            <CartCouponAndPricingSection
              bottomRef={{ current: null }}
              buttonTitle={placingOrder ? "Placing Order..." : "Place Order"}
              onButtonClick={() => onPlaceOrder(false, null)}
              isButtonDisable={disablePlaceOrder}
              selectedItems={basket?.productItems || []}
              shippingCostOverride={shippingPrice}
              isHidden={isHidden}
            />
          </Box>
        </Box>
      </Flex>

      {/* COD Payment Pop-up Modal */}
      {isCodPopupOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(5px)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          onClick={() => setIsCodPopupOpen(false)}
        >
          <div
            style={{
              width: "90%",
              maxWidth: "400px",
              background: "#fff",
              borderRadius: "8px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
              display: "flex",
              flexDirection: "column",
              animation: "fadeInScale 160ms ease-out",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div
              style={{
                padding: "16px",
                borderBottom: "1px solid #E2E8F0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                fontSize="sm"
                color="gray.500"
                textTransform="uppercase"
                fontWeight="medium"
              >
                CASH
              </Text>
              <button
                onClick={() => setIsCodPopupOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="#1D1D1D"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "24px 16px" }}>
              <Flex align="center" justify="space-between" mb={6}>
                <Flex align="center" gap={3}>
                  <Box p={2} bg="gray.100" borderRadius="md">
                    <Text fontSize="lg" fontWeight="bold" color="gray.600">
                      ₹
                    </Text>
                  </Box>
                  <Text fontSize="lg" fontWeight="semibold" color="gray.700">
                    Cash Payment
                  </Text>
                </Flex>
                <Box color="green.500">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </Box>
              </Flex>

              <Stack spacing={4}>
                <Button
                  variant="outline"
                  size="lg"
                  colorScheme="gray"
                  borderColor="gray.400"
                  color="black"
                  width="100%"
                  _hover={{ bg: "gray.50" }}
                  onClick={() => {
                    setIsCodPopupOpen(false);
                    onPlaceOrder(true, "COD");
                  }}
                >
                  PAY WITH CASH
                </Button>

                <Flex align="center">
                  <Box flex="1" h="1px" bg="gray.200" />
                  <Text
                    mx={4}
                    fontSize="xs"
                    color="gray.400"
                    fontWeight="medium"
                  >
                    OR
                  </Text>
                  <Box flex="1" h="1px" bg="gray.200" />
                </Flex>

                <Button
                  size="lg"
                  bg="#3A4753"
                  color="white"
                  width="100%"
                  _hover={{ bg: "#2d3844" }}
                  onClick={async () => {
                    setIsCodPopupOpen(false);
                    setPlacingOrder(true);
                    try {
                      let temporary = false;
                      if (urlBasketId) {
                        temporary = true;
                      }

                      // Update PI to BREEZE
                      await addPaymentInstrument({
                        basketId: urlBasketId || basketId,
                        paymentMethodId: "BREEZE",
                        temporary,
                      });

                      // Call the modified onPlaceOrder immediately expecting it to use "BREEZE" override.
                      await onPlaceOrder(true, "BREEZE");
                    } catch (error) {
                      console.error("Failed switching to Breeze:", error);
                      setPlacingOrder(false);
                    }
                  }}
                >
                  {/* PAY ONLINE AND SAVE ₹{breezeDiscountAmount} */}
                  PAY ONLINE AND SAVE 10%
                </Button>
              </Stack>
            </div>
          </div>
        </div>
      )}

      <AddAddressModal isOpen={isAddAddressOpen} onClose={closeAddAddress}>
        <Shippingmid1
          isModal
          onClose={closeAddAddress}
          isHidden={isHidden}
        />
      </AddAddressModal>

      <EditAddressModal
        isOpen={isEditAddressOpen}
        onClose={() => closeEditAddress()}
      >
        <EditShippingAddress
          isModal
          addressId={editAddressId}
          onClose={(didSave) => closeEditAddress({ refresh: !!didSave })}
        />
      </EditAddressModal>

      {isExitModalOpen && (
        <Modal
          isOpen={true}
          onClose={closeExitModal}
          motionPreset={isMobile ? "slideInBottom" : "scale"}
          isCentered={!isMobile} // ✅ centered only on desktop
        >
          <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />

          <ModalContent
            // ✅ Bottom sheet on mobile
            position={isMobile ? "fixed" : "relative"}
            bottom={isMobile ? "0" : "auto"}
            left={isMobile ? "0" : "auto"}
            right={isMobile ? "0" : "auto"}
            w={{ base: "100%", lg: "600px" }}
            maxW="100%"
            m={isMobile ? "0" : "auto"}
            borderRadius={isMobile ? "20px 20px 0 0" : "xl"} // ✅ rounded top only on mobile
            overflow="hidden"
            py={isMobile ? "8" : "4"}
          >
            <ModalBody textAlign="center" py={2}>
              <Text fontSize="2xl" fontWeight="bold">
                {user?.firstName || user?.lastName
                  ? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()
                  : "Guest"}
              </Text>

              <Text
                fontSize="md"
                color="blackAlpha.700"
                mb={6}
                letterSpacing={1}
              >
                Your cart items are selling fast!
              </Text>

              <Box
                bg="#FFF5E8"
                borderRadius="xl"
                p={5}
                mb={6}
                border="1px solid"
                borderColor="orange.100"
              >
                <Box
                  w="70px"
                  h="70px"
                  borderRadius="full"
                  bg="white"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  mx="auto"
                  mb={3}
                  borderLeft="2px solid"
                  borderRight="6px solid"
                  borderTop="4px solid"
                  borderBottom="4px solid"
                  borderColor="orange.100"
                >
                  <Text fontSize="40px" lineHeight="1">
                    📦
                  </Text>
                </Box>

                <Text fontSize="xl" fontWeight="900" mb={1}>
                  Few items left
                </Text>
                <Text fontSize="sm" color="blackAlpha.700">
                  Hurry now and continue shopping
                </Text>
              </Box>

              <Button
                w="full"
                bg="blackAlpha.900"
                color="white"
                borderRadius="md"
                fontSize={"sm"}
                py={6}
                _hover={{ bg: "blackAlpha.800" }}
                onClick={closeExitModal}
                fontWeight="bold"
                mb={3}
              >
                STAY ON PAGE
              </Button>

              <Button
                variant="link"
                color="black"
                textDecoration="underline"
                textUnderlineOffset={4}
                onClick={handleCancelPurchase}
                fontSize={"sm"}
                fontWeight="bold"
              >
                Cancel purchase
              </Button>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </Fragment>
  );
};

export default AddressContent;
