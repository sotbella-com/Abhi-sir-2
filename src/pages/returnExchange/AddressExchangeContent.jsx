import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";

import { LottieModal, PaymentOptions } from "@/components/compounds";
import { LOCAL_KEYS } from "@/constants/localStorageKeys";
import { LoaderAnimation } from "@/assets/animation";

import useAddressStore from "@/context/useAddressStore";
import { useUnifiedCartStore } from "@/context/unifiedCartStore";
// import CartCouponAndPricingSection from "../Cart/cartCouponAndPricing";

import ExchangeOrderSummary from "./components/ExchangeOrderSummary";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Elements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { STRIPE_PUBLISHABLE_KEY } from "@/constants/constants";
import StripePaymentModal from "@/components/compounds/stripePaymentModal";

// SFCC
import { getCustomer } from "@/api/services/sfccCustomers";
import { isUserLoggedIn } from "@/utils/tokenUtils";
import { get_available_shipping_methods } from "@/api/services/sfccCheckout";

import { Box, Flex, Heading, Text, Link, Stack } from "@chakra-ui/react";

// Import payment utilities at the top to avoid dynamic import issues
// Note: verifyPaymentWithBackend removed - we trust Stripe's status, backend updates via webhook
import { savePaymentState, getPaymentState, clearPaymentState, hasValidPaymentState, markPaymentCancelled, isPaymentCancelled } from "@/utils/paymentStateManager";
import { restoreBasketItemsWithRetry, validateBasketSnapshot, createBasketSnapshot } from "@/utils/basketRestorationHelper";
import { logger } from "@/utils/logger.js";

import {
  ShimmerCheckout,
  ShimmerShippingMethods,
} from "@/components/layouts/Simmers/ShimmerCheckout";
import { trackBeginCheckout } from "@/utils/dataLayer";
import { trackBeginCheckout as trackEinsteinBeginCheckout } from "@/api/services/einsteinTracking";
import ExchangePaymentOptions from "@/components/compounds/payment-options/exchange-payment-option";

/* ============ black/white inline radio ============ */
const RadioBW = ({ name, value, checked, onChange, label }) => {
  const labelStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
    userSelect: "none",
  };
  const inputStyle = {
    position: "absolute",
    opacity: 0,
    width: 0,
    height: 0,
    margin: 0,
    pointerEvents: "none",
  };
  const ringStyle = {
    width: 16,
    height: 16,
    boxSizing: "border-box",
    border: "1.5px solid #000",
    borderRadius: "50%",
    background: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };
  const dotStyle = {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: checked ? "#000" : "transparent",
    transform: checked ? "scale(1)" : "scale(0.1)",
    transition: "transform 120ms ease-in-out, background 120ms ease-in-out",
  };

  return (
    <label style={labelStyle}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        style={inputStyle}
      />
      <span style={ringStyle}>
        <span style={dotStyle} />
      </span>
      {label && <span style={{ fontSize: 14, color: "#000" }}>{label}</span>}
    </label>
  );
};


/** Stripe wrapper */
const AddressExchangeContent = () => (
    <CheckoutForm />
);

const toNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const CheckoutForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { basketId: paramBasketId } = useParams();
  const { user } = useAuth();
  const urlBasketId = paramBasketId;
  const exchangeData = location.state;

  console.log("Received exchange data:", exchangeData);

  console.log("CheckoutForm render", { urlBasketId });

  // Fix: Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { fetchAddress, address: addressFromStore, isLoading: loadingAddresses } = useAddressStore();
  // const loadingAddresses = false; // Mocked for consistency
  
  const {
    total: cartTotalFromStore,
    basket,
    createOrder,
    clearBasketAfterPayment,
    getCustomerBasket, // Need this to fetch customer basket if not available
  } = useUnifiedCartStore();

  const [customerBasket, setCustomerBasket] = useState(null);

  // Derived basket: use local customerBasket (temporary) if available, otherwise global basket
  const checkoutBasket = useMemo(() => {
    return urlBasketId ? customerBasket : basket;
  }, [urlBasketId, customerBasket, basket]);

  console.log(checkoutBasket)

  // Also derive total UI from the correct basket
  const orderTotalUI = toNum(checkoutBasket?.orderTotal || useUnifiedCartStore.getState().orderTotalUI, 0);

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
          const { default: sfccApiClient } = await import('@/api/sfccApiClient');
          const locale = import.meta.env.VITE_SFCC_LOCALE || "en-IN";
          const url = sfccApiClient.buildUrl(endpoint, import.meta.env.VITE_SFCC_SITE_ID);
          const params = new URLSearchParams({
            locale,
          });
          const fullUrl = `${url}&${params.toString()}`;

          const resolved = await sfccApiClient.get(fullUrl);

          if (resolved) {
            let finalBasket = resolved;
            // No need to fetch promotions here, just the basket structure is enough for checkout
            setCustomerBasket(finalBasket);
          }
        } catch (error) {
          // console.error("Failed to fetch temporary basket via checkout API:", error);
          // Fallback: Try to get customer basket if specific ID fails (maybe it was merged)
          try {
            // await getCustomerBasket();
            const fallbackBasket = await getCustomerBasket();

            if (fallbackBasket) {
              setCustomerBasket(fallbackBasket); // ✅ sync local
            }
            // The hook above (useUnifiedCartStore) will update 'basket' state.
            // We can then use 'basket' as fallback in effectiveBasket derivation.
            // console.log("Attempting fallback to active customer basket...");
          } catch (fallbackError) {
            // console.error("Fallback basket fetch failed:", fallbackError);
          }
        }
      }
    } catch (err) {
      // console.error("Failed to resolve basket:", err);
    }
  }, [urlBasketId]);


  useEffect(() => {
    fetchBasketData();
  }, [fetchBasketData]);

  // Stripe Payment Modal State
  const [isStripeModalOpen, setIsStripeModalOpen] = useState(false);
  const [stripePaymentData, setStripePaymentData] = useState(null);

  const basketId = checkoutBasket?.basketId || checkoutBasket?.id || checkoutBasket?.basket_id;
  const shipmentId = checkoutBasket?.shipments?.[0]?.shipmentId || "";

  // UI + data
  // Mocks/State for compatibility with handlePaymentFailure
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const displayAddresses = []; // Mocked as empty since we use basket address directo

  const [paymentMethod, setPaymentMethod] = useState("");
  const [shippingMethod, setShippingMethod] = useState(null);
  const [shippingPrice, setShippingPrice] = useState(0);

  const [placingOrder, setPlacingOrder] = useState(false);

  // ✅ strict sequence flags - default to true as data comes from basket
  const [addressSynced, setAddressSynced] = useState(true);
  const [shippingSynced, setShippingSynced] = useState(true);
  const [paymentSynced, setPaymentSynced] = useState(true);

  // ✅ PI sync anti-spam
  const piSyncRef = useRef({ lastKey: "" });
  const isSyncingRef = useRef(false); // Fix: Prevent concurrent syncPI calls

  // helpers moved outside

  // CRITICAL: Clear stale payment state on component mount
  useEffect(() => {
    // Check if payment was cancelled - if so, clear all state
    if (isPaymentCancelled()) {
      logger.log('🧹 Payment was cancelled, clearing all state on mount');
      clearPaymentState();
      localStorage.removeItem(LOCAL_KEYS.PLACED_ORDER_ID);
      localStorage.removeItem('stripe_payment_intent_id');
      localStorage.removeItem('order_payment_pending');
      localStorage.removeItem('basket_items_snapshot');
      return;
    }

    // Check for stale payment state when component mounts
    // If payment state exists but no active payment, clear it
    if (hasValidPaymentState() && !isStripeModalOpen && !stripePaymentData) {
      const savedState = getPaymentState();
      // Only clear if payment didn't succeed (no paymentSucceeded flag)
      // This prevents clearing valid payment states from 3D Secure redirects
      if (savedState && !savedState.paymentSucceeded) {
        // console.log('🧹 Clearing stale payment state on mount');
        clearPaymentState();
        localStorage.removeItem(LOCAL_KEYS.PLACED_ORDER_ID);
        localStorage.removeItem('stripe_payment_intent_id');
        localStorage.removeItem('order_payment_pending');
      }
    }
  }, []); // Only run on mount

  // CRITICAL: Clear payment state when component unmounts (user navigates away)
  useEffect(() => {
    return () => {
      // If payment was cancelled, ensure state is cleared
      if (isPaymentCancelled()) {
        clearPaymentState();
        localStorage.removeItem(LOCAL_KEYS.PLACED_ORDER_ID);
        localStorage.removeItem('stripe_payment_intent_id');
        localStorage.removeItem('order_payment_pending');
        return;
      }

      // Clear payment state when component unmounts if payment wasn't completed
      if (hasValidPaymentState()) {
        const savedState = getPaymentState();
        // Only clear if payment didn't succeed
        if (savedState && !savedState.paymentSucceeded) {
          // console.log('🧹 Clearing payment state on unmount (user navigated away)');
          clearPaymentState();
          localStorage.removeItem(LOCAL_KEYS.PLACED_ORDER_ID);
          localStorage.removeItem('stripe_payment_intent_id');
          localStorage.removeItem('order_payment_pending');
        }
      }
    };
  }, []);

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

  const {
    data: shippingData,
    isLoading: loadingShippingMethods,
    isError: shippingError,
  } = useQuery({
    queryKey: ["sfcc_shipping_methods", { basketId, shipmentId }],
    queryFn: get_available_shipping_methods,
    enabled: false,
    // FORCE FRESH FETCH every time
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
  });

  // const shippingMutation = useMutation({
  //   mutationFn: ({ id }) => updateShippingMethod({ id, basketId: urlBasketId, temporary: Boolean(urlBasketId), }),
  //   onSuccess: async (data) => {
  //     if (urlBasketId && data) {
  //       setCustomerBasket(data);
  //     }
  //     setShippingSynced(true);
  //     setPaymentSynced(false);
  //   },
  //   onError: (err) => {
  //     // console.error(err);
  //     // toast.error("Failed to update shipping method");
  //     setShippingSynced(false);
  //   },
  // });

  // Removed shipping method update logic

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


  useEffect(() => {
    try {
      if (basket) {
        trackBeginCheckout(basket);

        // Track beginCheckout for Einstein Commerce Cloud
        const products = (basket?.productItems || []).map(item => ({
          id: item.productId || item.id,
          price: Number(item.price || item.basePrice || 0),
          quantity: Number(item.quantity || 1),
          image:
            item?.c_images?.large?.[0]?.absURL ||
            item?.c_images?.small?.[0]?.absURL ||
            "",
        }));
        const amount = Number(basket.orderTotal || basket.total || 0);
        trackEinsteinBeginCheckout(products, amount);
      }
    } catch {
      // ignore
    }
  }, [basket]);

  // ------------------------
  // Payment method default (UI)
  // ------------------------
  useEffect(() => {
    const basketPI =
      checkoutBasket?.paymentInstruments?.[0]?.paymentMethodId ||
      checkoutBasket?.paymentInstruments?.[0]?.payment_method_id ||
      checkoutBasket?.paymentInstruments?.[0]?.paymentMethod ||
      "";

    if (basketPI) {
      setPaymentMethod(String(basketPI));
      return;
    }
    if (!paymentMethod) setPaymentMethod("STRIPE");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutBasket?.paymentInstruments]);

  // ------------------------
  // addPaymentInstrument (THIRD)
  // ------------------------
  // Removed payment instrument add logic

  const basketHasAddress = Boolean(
    checkoutBasket?.billingAddress?.address1 ||
    checkoutBasket?.shipments?.[0]?.shippingAddress?.address1
  );

  const basketHasShippingMethod = Boolean(
    checkoutBasket?.shipments?.[0]?.shippingMethod?.id ||
    checkoutBasket?.shipments?.[0]?.shippingMethod?.shippingMethodId
  );

  const basketHasStripePI = (checkoutBasket?.paymentInstruments ?? []).some((pi) => {
    const id = String(
      pi?.paymentMethodId || pi?.payment_method_id || pi?.paymentMethod || ""
    )
      .trim()
      .toUpperCase();
    return id === "STRIPE";
  });

  logger.log("Checkout state:", {
    loadingAddresses,
    loadingShippingMethods,
    // shippingMutationPending: shippingMutation.isPending,
    basketHasAddress,
    basketHasShippingMethod,
    basketHasStripePI,
    placingOrder,
    addressSynced,
    shippingSynced,
    paymentSynced
  });
  const disablePlaceOrder =
    placingOrder ||
    // !basketId ||
    loadingAddresses ||
    loadingShippingMethods ||
    // shippingMutation.isPending ||
    !addressSynced ||
    !shippingSynced ||
    !paymentSynced
  // !basketHasAddress ||
  // !basketHasShippingMethod 
  // !basketHasStripePI;
  // ------------------------
  // place order (NO addPaymentInstrument here)
  // ------------------------
  const onPlaceOrder = async () => {
    console.log("[Checkout] Place order triggered");
  
    if (!basketId) {
      console.log("[Checkout] ❌ Missing basketId");
      return;
    }
  
    if (urlBasketId) {
      if (!addressSynced || !shippingSynced || !paymentSynced) {
        console.log("[Checkout] ⏳ Waiting for sync (address/shipping/payment)");
        return;
      }
    } else {
      if (!paymentMethod || !basketHasAddress || !basketHasShippingMethod || !basketHasStripePI) {
        console.log("[Checkout] ⏳ Basket not ready", {
          paymentMethod,
          basketHasAddress,
          basketHasShippingMethod,
          basketHasStripePI
        });
        return;
      }
    }

    setPlacingOrder(true);

    if (isPaymentCancelled()) {
      console.log("[Checkout] Clearing previous payment state");
      clearPaymentState();
    }

    const basketItemsSnapshot = checkoutBasket?.productItems || [];

    const enhancedSnapshot = createBasketSnapshot(basketItemsSnapshot, {
      basketId,
      orderTimestamp: Date.now()
    });

    if (basketItemsSnapshot.length > 0) {
      localStorage.setItem('basket_items_snapshot', JSON.stringify(enhancedSnapshot));
    }

    try {
      console.log("[Checkout] 🚀 Creating order...");

      const temporary = !!urlBasketId;
      const orderData = await createOrder(urlBasketId, temporary);

      const refundAmount = Number(exchangeData?.refundAmount || 0);

      console.log("Exchange Refund Amount:", refundAmount);

      if (refundAmount > 0) {
        try {
          const walletEmail =
            user?.email ||
            checkoutBasket?.customerInfo?.email;

          const walletResponse = await fetch(
            `${import.meta.env.VITE_WALLET_API_URL}/api/sfcc/wallet/${walletEmail}/credit`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${import.meta.env.VITE_WALLET_API_KEY}`,
              },
              body: JSON.stringify({
                amount: refundAmount,
                type: "credit",
                description: "Exchange wallet credit",
                remarks: "Exchange wallet credit",
                referenceId: orderData?.orderNo || orderData?.id,
              }),
            }
          );

          const walletData = await walletResponse.json();

          // ✅ Log full wallet response
          console.log("Wallet Data:", walletData);

        } catch (walletError) {
          console.error("Wallet credit API failed:", walletError);
        }
      }

      console.log("[Checkout] Order response:", orderData);

      const orderId = orderData?.orderNo || orderData?.id;

      if (!orderId) {
        throw new Error("Order ID missing");
      }

      const orderTotal = toNum(orderData?.orderTotal || orderData?.total || 0);

      console.log("[Checkout] Order created:", {
        orderId,
        orderTotal
      });

      // ✅ SUCCESS FLOW (Stripe removed → always complete order)
      console.log("[Checkout] ✅ Completing order (Stripe removed)");

      if (!urlBasketId) {
        clearBasketAfterPayment();
      }

      localStorage.removeItem('basket_items_snapshot');
      localStorage.removeItem('stripe_payment_intent_id');
      localStorage.removeItem('order_payment_pending');

      clearPaymentState();

      console.log("[Checkout] 🔁 Navigating to Thank You page");

      navigate(`/thankyou?orderId=${orderId}`);

    } catch (err) {
      console.error("[Checkout] ❌ Order failed:", err);

      // 🔄 Restore basket
      if (basketItemsSnapshot.length > 0) {
        try {
          console.log("[Checkout] Attempting basket restore...");

          const snapshot = enhancedSnapshot.items || basketItemsSnapshot;

          if (validateBasketSnapshot(enhancedSnapshot)) {
            const restoreResult = await restoreBasketItemsWithRetry(snapshot, {
              maxRetries: 3,
              retryDelay: 1000
            });

            console.log("[Checkout] Restore result:", restoreResult);
          }
        } catch (restoreError) {
          console.error("[Checkout] Restore failed:", restoreError);
        }
      }

      console.log("[Checkout] 🔁 Navigating fallback (/address)");

      navigate("/");
    } finally {
      setPlacingOrder(false);
      console.log("[Checkout] Done");
    }
  };
  const greetingName = user?.firstName || "Guest";


  return (
    <Fragment>
      <Box w="full" px={{ base: "12px", md: "50px" }} textAlign="left">
        <Flex flexDirection={{ base: "column", md: "row" }} gap={4}>
          {/* Left column */}
          <Box w={{ base: "100%", md: "50%" }}>
            <Heading
              as="h4"
              fontWeight="normal"
              fontSize={{ base: "xl", md: "2xl" }}
            >
              Hi, {greetingName}
            </Heading>

            <Flex my={1} justify="space-between">
              <Text
                textTransform="uppercase"
                fontWeight="normal"
                mt={2}
                mb={3}
                fontSize="md"
              >
                Shipping to
              </Text>
            </Flex>

            {/* Address Read-Only View */}
            <Box mb={6}>
              {checkoutBasket?.shipments?.[0]?.shippingAddress ? (
                <Box
                  borderWidth="1px"
                  borderColor="#9d9d9d"
                  p={3}
                  bg="white"
                  position="relative"
                  mb={{ base: 2, md: 3 }}
                >
                  <Flex justify="space-between" align="start">
                    <Box>
                      <Text fontWeight="bold" fontSize="md" mb={1} textTransform="uppercase">
                        {(checkoutBasket.shipments[0].shippingAddress.firstName || "") + " " + (checkoutBasket.shipments[0].shippingAddress.lastName || "")}
                      </Text>
                      <Text fontSize={{ base: "xs", md: "sm"}} color="gray.600" textTransform="uppercase">
                        {[
                          checkoutBasket.shipments[0].shippingAddress.address1,
                          checkoutBasket.shipments[0].shippingAddress.address2,
                          checkoutBasket.shipments[0].shippingAddress.city,
                          checkoutBasket.shipments[0].shippingAddress.stateCode,
                          checkoutBasket.shipments[0].shippingAddress.countryCode,
                          checkoutBasket.shipments[0].shippingAddress.postalCode
                        ].filter(Boolean).join(", ")}
                      </Text>
                      <Text fontSize={{ base: "xs", md: "sm"}} mt={2}>
                        {checkoutBasket.shipments[0].shippingAddress.phone}
                      </Text>
                    </Box>
                    <Box>
                      <RadioBW
                        name="selectedAddress"
                        value="default"
                        checked={true}
                        onChange={() => { }}
                        label=""
                      />
                    </Box>
                  </Flex>
                </Box>
              ) : (
                <Text color="red.500">No shipping address found in exchange details.</Text>
              )}
            </Box>

            {/* Shipping method */}
            <Text
              textTransform="uppercase"
              fontWeight="normal"
              mt={4}
              mb={3}
              fontSize="md"
            >
              Shipping method
            </Text>

            {checkoutBasket?.shipments?.[0]?.shippingMethod ? (
              <Box
                w="full"
                display="flex"
                flexDir="column"
                p={{ base: 2, md: 4 }}
                mb={1}
                borderWidth="1px"
                borderColor="gray.500"
                cursor="default"
              >
                <Flex align="center">
                  <RadioBW
                    name="shippingMethod"
                    value={checkoutBasket.shipments[0].shippingMethod.id}
                    checked={true}
                    onChange={() => { }}
                    label=""
                  />
                  <Box ml={3}>
                    <Text fontSize="sm" mb={0}>
                      {checkoutBasket.shipments[0].shippingMethod.name}
                    </Text>
                  </Box>
                  <Box ml="auto">
                    <Text fontSize={{ base: "xs", md: "sm" }}>
                      {toNum(checkoutBasket.shipments[0].shippingMethod.price) > 0
                        ? `₹ ${toNum(checkoutBasket.shipments[0].shippingMethod.price).toFixed(2)}`
                        : "Free"}
                    </Text>
                  </Box>
                </Flex>
              </Box>
            ) : loadingShippingMethods ? (
              <ShimmerShippingMethods />
            ) : shippingError ? (
              <Text fontSize="sm" color="red.500" p={{ base: 2, md: 4 }}>
                Failed to load shipping methods
              </Text>
            ) : (
              shippingData?.methods?.map((method) => (
                <Fragment key={method.id}>
                  <Box
                    w="full"
                    display="flex"
                    flexDir="column"
                    p={{ base: 2, md: 4 }}
                    // pt={{ md: 6 }}
                    mb={1}
                    borderWidth="1px"
                    borderColor="gray.500"
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
                        onChange={() => handleRadioShippingMethodChange(method.id)}
                        label=""
                      />
                      <Box ml={3}>
                        <Text fontSize="sm" mb={0}>
                          {method.name}
                        </Text>
                      </Box>
                      <Box ml="auto">
                        <Text fontSize={{ base: "xs", md: "sm" }}>
                          {toNum(method.price) > 0
                            ? `+ ₹ ${toNum(method.price).toFixed(2)}`
                            : "Free"}
                        </Text>
                      </Box>
                    </Flex>
                  </Box>
                </Fragment>
              ))
            )}
            


            {/* Payment */}
            <ExchangePaymentOptions
              basketId={basketId}
              basket={checkoutBasket}
              paymentMethod={paymentMethod}
              setPaymentMethod={(val) => {
                setPaymentMethod(val);
                // setPaymentSynced(false);
              }}
              wallet={false}
              remainingAmount={0}
            />
          </Box>


          {/* Right column – summary */}
          <ExchangeOrderSummary
            basket={checkoutBasket}
            exchangeData={exchangeData}
            onPlaceOrder={onPlaceOrder}
            isPlacingOrder={placingOrder}
            isButtonDisabled={disablePlaceOrder}
            currencyCode={checkoutBasket?.currency || "Rs."}
          />
        </Flex>
      </Box>

      <LottieModal
        animationData={LoaderAnimation}
        isOpen={placingOrder}
        onClose={() => setPlacingOrder(false)}
        title="Placing Your Order"
        subtitle="Do not close this window while we are processing your order"
      />

      {/* Stripe Payment Modal */}
      {isStripeModalOpen && stripePaymentData && (
        <StripePaymentModal
          isOpen={isStripeModalOpen}
          onClose={handleStripeModalClose}
          clientSecret={stripePaymentData.clientSecret}
          amount={stripePaymentData.amount}
          orderId={stripePaymentData.orderId}
          onSuccess={handleStripePaymentSuccess}
          onError={handleStripePaymentError}
          stripePromise={stripePromise}
          paymentIntentId={stripePaymentData.paymentIntentId}
          returnUrl={`${window.location.origin}/address?orderId=${stripePaymentData.orderId}${urlBasketId ? `&basketId=${urlBasketId}` : ''}`}
        />
      )}
    </Fragment>
  );
};

export default AddressExchangeContent;
