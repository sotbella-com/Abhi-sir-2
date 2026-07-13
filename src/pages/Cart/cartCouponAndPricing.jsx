import React, { Fragment, useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import img1 from "@/assets/images/coupon-icon.png";
import img2 from "@/assets/images/Frame.png";
import { toast } from "react-toastify";
// import { useAuth } from "@/context/AuthContext";
import { LOCAL_KEYS } from "@/constants/localStorageKeys";

import { ChevronDown, ChevronUp } from "lucide-react";
import DeliveryReturnModal from "@/components/compounds/deliveryReturnModal";
import { DeliveryInstructionButton } from "@/components/atoms";
import { useUnifiedCartStore } from "@/context/unifiedCartStore";
import { useAddressStore, useAuth } from "@/context";
import ConfirmationModal from "@/components/compounds/confirmationModal";
import {
  Box,
  Flex,
  Text,
  Image,
  Button,
  Input,
  HStack,
  VStack,
  Divider,
  useBreakpointValue,
  Icon,
  Collapse,
} from "@chakra-ui/react";
import CartCouponAndPricingShimmer from "@/components/layouts/Simmers/CartCouponAndPricingShimmer";
import { CURRENCY_SYMBOL } from "@/constants/constants";
import OurPromise from "../ProductDetails/OurPromise";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";

const CartCouponAndPricingSection = ({
  seeMoreClick = [],
  setHandleSeeMore = () => { },
  bottomRef,
  buttonTitle,
  onButtonClick,
  isButtonDisable = false,
  selectedItems = [],
  guestCartData = null,
  shippingCostOverride = null,
  shippingLabel = null, // e.g. "Express Shipping"
  paymentMethod = null, // ✅ Received from parent
  isHidden,
}) => {
  const { addCoupon, removeCoupon, basket } = useUnifiedCartStore();

  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const urlBasketId = queryParams.get("basketId");
  const [coupon, setCoupon] = useState("");
  const [couponError, setCouponError] = useState("");
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [customerBasket, setCustomerBasket] = useState(null);
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const { isAuthenticated, user } = useAuth();
  const [showTax, setShowTax] = useState(false);
  const [showCouponSummary, setShowCouponSummary] = useState(false);

  // Derived basket: For standard flow, prefer global 'basket' from store which updates automatically.
  // For 'Buy Now' (urlBasketId), use the locally fetched 'customerBasket'.
  const effectiveBasket = urlBasketId
    ? customerBasket
    : basket || customerBasket;

  const [message, setMessage] = useState("");
  const [showDeliveryReturnModal, setShowDeliveryReturnModal] = useState(false);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [removingCouponId, setRemovingCouponId] = useState(null);
  // const { user } = useAuth(); // Removed to prevent context error if used outside provider
  const [buttonToggle, setButtonToggle] = useState(false);
  const [seeMore, setSeeMore] = useState(13);
  const [toggleViewMore, setToggleViewMore] = useState(false);
  const [localPromotions, setLocalPromotions] = useState({
    order: [],
    shipping: [],
    product: [],
  });
  const [promotionsFetched, setPromotionsFetched] = useState(false);
  const couponList =
    effectiveBasket?.c_orderPromotions &&
      effectiveBasket.c_orderPromotions.length > 0
      ? effectiveBasket.c_orderPromotions
      : localPromotions.order;
  const shippingPromotions =
    effectiveBasket?.c_shippingPromotions &&
      effectiveBasket.c_shippingPromotions.length > 0
      ? effectiveBasket.c_shippingPromotions
      : localPromotions.shipping;
  const productPromotions =
    effectiveBasket?.c_productPromotions &&
      effectiveBasket.c_productPromotions.length > 0
      ? effectiveBasket.c_productPromotions
      : localPromotions.product;

  const setOrderTotalUI = useUnifiedCartStore((s) => s.setOrderTotalUI);

  const nonMarketingCoupons = useMemo(() => {
    return couponList.filter((itm) => {
      const isMarketing =
        (itm?.name || "").trim().toLowerCase() === "marketing";
      if (isMarketing) return false;

      // For temporary basket (Buy Now flow), promotions might lack 'coupons' array
      // but have 'id' and 'couponRequired'
      if (urlBasketId) {
        return itm?.coupons?.length > 0 || (itm?.id && itm?.couponRequired);
      }

      return itm?.coupons?.length > 0;
    });
  }, [couponList, urlBasketId]);

  const visibleCoupons = toggleViewMore
    ? nonMarketingCoupons
    : nonMarketingCoupons.slice(0, 2);

  const eligibleCouponsOffers = useMemo(() => {
    return [...productPromotions, ...shippingPromotions, ...couponList].filter(
      (itm) => {
        const callout = (itm?.callout || "").trim();
        return callout.length > 0;
      },
    );
  }, [productPromotions, shippingPromotions, couponList]);

  const visibleCouponsOffers = toggleViewMore
    ? eligibleCouponsOffers
    : eligibleCouponsOffers.slice(0, 2);

  const [viewMore, setViewMore] = useState(2);
  const [couponId, setCouponId] = useState("");

  const { fetchAddress } = useAddressStore();


  // ---------------------------
  // Currency from basket / guest cart (safe)
  // ---------------------------
  const currencyCode = CURRENCY_SYMBOL;


  // ---------------------------
  // ✅ Safe helpers
  // ---------------------------

  const getDiscountLabel = (adjustments = [], type = "coupon") => {
    const matchedAdjustment = adjustments.find((adj) => {
      if (!adj?.appliedDiscount) return false;

      if (type === "coupon") {
        return adj?.couponCode;
      }

      if (type === "prepaid") {
        return adj?.promotionId?.includes("PREPAID");
      }

      return false;
    });

    const discount = matchedAdjustment?.appliedDiscount;

    if (!discount) return "";

    if (discount.type === "percentage") {
      return `(${discount.percentage}% discount)`;
    }

    if (discount.type === "amount") {
      return `(${currencyCode}${discount.amount} discount)`;
    }

    return "";
  };

  const orderAdjustments = effectiveBasket?.orderPriceAdjustments || [];

  const couponDiscountLabel = getDiscountLabel(orderAdjustments, "coupon");
  const prepaidDiscountLabel = getDiscountLabel(orderAdjustments, "prepaid");

  const toNum = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const pickNum = (...vals) => {
    for (const v of vals) {
      if (v === null || v === undefined) continue;
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
    return 0;
  };

  const round2 = (n) => Math.round(toNum(n) * 100) / 100;

  // ---------------------------
  // Fetch basket
  // ---------------------------
  // ---------------------------
  // Fetch basket
  // ---------------------------
  // ---------------------------
  // Fetch basket
  // ---------------------------
  const fetchBasketData = React.useCallback(
    async (existingBasket = null) => {
      const queryParams = new URLSearchParams(location.search);
      const urlBasketId = queryParams.get("basketId");

      try {
        if (urlBasketId) {
          // Use existing basket if provided (from parent), otherwise fetch
          let resolved = existingBasket;

          if (!resolved) {
            try {
              const endpoint = `/checkout/shopper-baskets/v2/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/baskets/${urlBasketId}`;
              const { default: sfccApiClient } =
                await import("@/api/sfccApiClient");
              // const { getCurrentLocale } = await import('@/utils/sfccSiteConfig');

              const url = sfccApiClient.buildUrl(
                endpoint,
                import.meta.env.VITE_SFCC_SITE_ID,
              );
              const params = new URLSearchParams({
                locale: import.meta.env.VITE_SFCC_LOCALE || "en-IN",
              });
              const fullUrl = `${url}&${params.toString()}`;

              resolved = await sfccApiClient.get(fullUrl);
            } catch (error) {
              // console.error("Failed to fetch temporary basket via checkout API:", error);
            }
          }

          if (resolved) {
            let finalBasket = resolved;

            setCustomerBasket(finalBasket);
          }
        }
      } catch (err) {
        // console.error("Failed to resolve basket:", err);
      }
    },
    [location.search],
  ); // Minimized dependencies

  // New Effect: Fetch active promotions for standard flow if missing from global basket
  useEffect(() => {
    // Only run for startard flow (no urlBasketId) and when basket is loaded
    // if (!urlBasketId && basket && (!basket.c_orderPromotions || basket.c_orderPromotions.length === 0) && localPromotions.order.length === 0) {
    if (!promotionsFetched) {
      const fetchLocalPromos = async () => {
        try {
          // Mark as fetched immediately to prevent duplicate calls during basket updates
          setPromotionsFetched(true);

          const { default: sfccApiClient } =
            await import("@/api/sfccApiClient");
          // const { getCurrentLocale } = await import('@/utils/sfccSiteConfig');

          const customEndpoint = `/custom/custom-data/v1/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/activePromotions`;
          const customUrl = sfccApiClient.buildUrl(
            customEndpoint,
            import.meta.env.VITE_SFCC_SITE_ID,
          );
          const customParams = new URLSearchParams({
            locale: import.meta.env.VITE_SFCC_LOCALE || "en-IN",
          });
          const fullCustomUrl = `${customUrl}&${customParams.toString()}`;

          const promotionsResponse = await sfccApiClient.get(fullCustomUrl);

          if (promotionsResponse && promotionsResponse.customerPromotions) {
            setLocalPromotions({
              order: promotionsResponse.customerPromotions || [],
              shipping: promotionsResponse.shippingPromotions || [],
              product: promotionsResponse.productPromotions || [],
            });
          }
        } catch (err) {
          // console.warn("Failed to fetch local promotions for standard flow", err);
        }
      };
      fetchLocalPromos();
    }
  }, [promotionsFetched]);

  // Effect 1: Respond to data updates from parent (Primary)
  useEffect(() => {
    if (urlBasketId && guestCartData) {
      // Parent passed new data? Use it immediately.
      fetchBasketData(guestCartData);
    } else if (!urlBasketId) {
      setCustomerBasket(null);
    }
  }, [guestCartData, urlBasketId, fetchBasketData]);

  // Effect 2: Fallback / Initial load (Secondary)
  // Only runs if parent didn't provide data yet, and button becomes enabled
  useEffect(() => {
    if (urlBasketId && !guestCartData) {
      if (!isButtonDisable) {
        fetchBasketData();
      }
    }
  }, [isButtonDisable, guestCartData, urlBasketId, fetchBasketData]);

  // Detect applied coupon from effectiveBasket
  useEffect(() => {
    const appliedCoupon = effectiveBasket?.couponItems?.[0] || null;
    if (appliedCoupon) {
      // User requested input field to be empty even when coupon is applied
      // setCoupon(appliedCoupon.code || "");
      setCouponId(appliedCoupon.couponItemId || "");
      setIsCouponApplied(true);
    } else {
      setIsCouponApplied(false);
      setCouponId("");
    }
  }, [effectiveBasket]);

  const couponDiscounts = useMemo(() => {
    const couponMap = {};

    // Order level coupons
    (effectiveBasket?.orderPriceAdjustments || []).forEach((adj) => {
      if (!adj?.couponCode) return;

      const code = adj.couponCode;

      if (!couponMap[code]) {
        couponMap[code] = {
          code,
          amount: 0,
          label: "",
        };
      }

      couponMap[code].amount += Math.abs(toNum(adj.price, 0));

      if (adj.appliedDiscount?.type === "percentage") {
        couponMap[code].label = `(${adj.appliedDiscount.percentage}% discount)`;
      } else if (adj.appliedDiscount?.type === "amount") {
        couponMap[code].label = `(${currencyCode}${adj.appliedDiscount.amount} discount)`;
      }
    });

    // Product level coupons
    (effectiveBasket?.productItems || []).forEach((item) => {
      (item.priceAdjustments || []).forEach((adj) => {
        if (!adj?.couponCode) return;

        const code = adj.couponCode;

        if (!couponMap[code]) {
          couponMap[code] = {
            code,
            amount: 0,
            label: "",
          };
        }

        couponMap[code].amount += Math.abs(toNum(adj.price, 0));

        if (!couponMap[code].label && adj.appliedDiscount?.type === "percentage") {
          couponMap[code].label = `(${adj.appliedDiscount.percentage}% discount)`;
        }
      });
    });

    return Object.values(couponMap);
  }, [effectiveBasket]);

  // Fetch address based on customer ID from basket (preferred) or user context if available
  useEffect(() => {
    // Fallback strategy for customerId
    const custId =
      basket?.customerInfo?.customerId ||
      guestCartData?.customerInfo?.customerId ||
      // If user object was passed as prop, we could use it, but safe to rely on basket here
      null;

    if (custId) {
      // fetchAddress({ customerId: custId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basket, guestCartData]);

  const AVAILABLE_OFFERS = useMemo(() => {
    return couponList.map((item) => item?.details).filter(Boolean);
  }, [couponList]);

  const [showAllOffers, setShowAllOffers] = useState(false);

  const visibleOffers = showAllOffers
    ? AVAILABLE_OFFERS
    : AVAILABLE_OFFERS.slice(0, 2);

  // ---------------------------
  // Totals from selection (safe)
  // ---------------------------
  const calcFromSelection = () => {
    const isTemporary = !!urlBasketId;

    // In temporary/BuyNow flow, we ignore the parent's selectedItems (which come from global basket)
    // and assume ALL items in this specific temporary basket are selected.
    // In temporary/BuyNow flow, we ignore the parent's selectedItems (which come from global basket)
    // and assume ALL items in this specific temporary basket are selected.
    const itemsUsing = isTemporary
      ? effectiveBasket?.productItems || []
      : selectedItems;

    const allLines = effectiveBasket?.productItems || [];
    const baseSubtotal =
      pickNum(effectiveBasket?.productSubTotal) ||
      allLines.reduce((s, l) => s + toNum(l?.price), 0);

    const selSubtotal = itemsUsing.reduce((s, l) => s + toNum(l?.price), 0);

    // Basket shipping base
    const basketShipping = toNum(effectiveBasket?.shippingTotal, 0);

    // If override provided, always use it (pure SFCC shipping price)
    const computedShipping =
      shippingCostOverride != null
        ? toNum(shippingCostOverride, 0)
        : baseSubtotal > 0
          ? basketShipping * (selSubtotal / baseSubtotal)
          : 0;

    // Prefer store basket (unified) values if present
    // const shippingValue = pickNum(basket?.shippingTotal, computedShipping);
    // const shippingValue = pickNum(basket?.shippingTotal, computedShipping);
    const shippingValue = isTemporary
      ? pickNum(effectiveBasket?.shippingTotal, computedShipping)
      : pickNum(basket?.shippingTotal, computedShipping);

    // const taxValue = pickNum(basket?.taxTotal, basket?.groupedTaxItems?.[0]?.taxValue);
    // const taxValue = pickNum(basket?.taxTotal, basket?.groupedTaxItems?.[0]?.taxValue);
    const taxValue = isTemporary
      ? pickNum(effectiveBasket?.taxTotal, effectiveBasket?.totalTax)
      : pickNum(basket?.taxTotal, basket?.groupedTaxItems?.[0]?.taxValue);

    const totalDiscountValue = round2(
      toNum(effectiveBasket?.productSubTotal) -
      toNum(effectiveBasket?.productTotal),
    );

    const productPriceAdjustments = (
      effectiveBasket?.productItems || []
    ).flatMap((item) => item?.priceAdjustments || []);

    const productCouponAdjustments = productPriceAdjustments.filter((adj) => {
      return (
        adj?.couponCode ||
        adj?.appliedCoupon ||
        adj?.promotionId ||
        adj?.price < 0
      );
    });

    const productCouponDiscountValue = productCouponAdjustments.reduce(
      (total, adj) => total + Math.abs(toNum(adj?.price, 0)),
      0,
    );

    const orderCouponDiscountValue = (
      effectiveBasket?.orderPriceAdjustments || []
    ).reduce((total, adj) => {
      return adj?.couponCode ? total + Math.abs(toNum(adj?.price, 0)) : total;
    }, 0);

    const couponDiscountValue =
      orderCouponDiscountValue + productCouponDiscountValue;

    // Calculate Prepaid Discount
    const sumPrepaid = (adjs) =>
      (adjs || []).reduce((acc, adj) => {
        return adj?.promotionId?.includes("PREPAID")
          ? acc + Math.abs(toNum(adj?.price, 0))
          : acc;
      }, 0);

    const prepaidOrder = sumPrepaid(effectiveBasket?.orderPriceAdjustments);

    let prepaidProduct = 0;
    (effectiveBasket?.productItems || []).forEach((item) => {
      prepaidProduct += sumPrepaid(item.priceAdjustments);
    });

    let prepaidShipping = 0;
    (effectiveBasket?.shippingItems || []).forEach((item) => {
      prepaidShipping += sumPrepaid(item.priceAdjustments);
    });

    const totalPrepaidDiscount =
      prepaidOrder + prepaidProduct + prepaidShipping;

    // order total
    // const basketOrderTotal = basket?.orderTotal;
    // const basketOrderTotal = isTemporary
    //   ? effectiveBasket?.orderTotal
    //   : basket?.orderTotal;

    const basketOrderTotal = isTemporary
      ? effectiveBasket?.productSubTotal + effectiveBasket?.shippingTotal
      : basket?.orderTotal;

    console.log(basketOrderTotal, "basketOrderTotal");
    console.log(effectiveBasket, "effectiveBasket");
    console.log(basket, "basket");
    console.log(isHidden, "isHidden");

    const orderTotalValue = isHidden === "true"
      ? effectiveBasket?.orderTotal
      : effectiveBasket?.orderTotal;


    // basketOrderTotal == null
    //     ? round2(
    //         selSubtotal -
    //           couponDiscountValue -
    //           prepaidOrder +
    //           toNum(shippingValue) 
    //           // toNum(taxValue),
    //       )
    //     : round2(toNum(basketOrderTotal, 0));

    console.log(orderTotalValue, "orderTotalValue");

    const couponData = {
      total: couponDiscountValue,
      codes: [
        ...(effectiveBasket?.couponItems || [])
          .filter((ci) => ci.statusCode === "applied")
          .map((ci) => ci.code),

        ...productCouponAdjustments
          .map((adj) => adj?.couponCode || adj?.promotionId)
          .filter(Boolean),
      ],
    };

    couponData.codes = [...new Set(couponData.codes)];

    return {
      subtotal: round2(selSubtotal),
      shipping: round2(shippingValue),
      tax: round2(taxValue),
      totalDiscount: round2(totalDiscountValue),
      couponDiscount: round2(couponDiscountValue),
      couponCodes: couponData.codes, // 👈 add this
      prepaidDiscount: round2(totalPrepaidDiscount),
      total: round2(orderTotalValue),
      itemCount: itemsUsing.reduce((s, l) => s + toNum(l?.quantity, 1), 0),
    };
  };

  const totals = calcFromSelection();
  // const hasItems = totals.itemCount > 0;
  const hasItems = true;

  // Safe visibility conditions
  // const shippingBasePrice = basket?.shippingItems?.[0]?.basePrice;
  // const showShipping = shippingBasePrice != null; // catches null + undefined
  // console.log(showShipping, "33333333333333333333333333");

  const handleViewMore = () => setToggleViewMore(true);
  const handleViewLess = () => {
    setViewMore(2);
    setToggleViewMore(false);
  };

  useEffect(() => {
    setHandleSeeMore(seeMore);
  }, [seeMore, setHandleSeeMore]);

  // Loading State Check
  const isLoading = !effectiveBasket;

  // Safe tax + total for UI (uses already-safe totals, but keeps UI consistent)
  // const taxValueUI = round2(pickNum(basket?.taxTotal, basket?.groupedTaxItems?.[0]?.taxValue));
  // const taxValueUI = round2(pickNum(basket?.taxTotal));
  // const taxValueUI = round2((basket?.adjustedMerchandizeTotalTax || 0) + (basket?.adjustedShippingTotalTax || 0));
  // const taxValueUI = round2((basket?.adjustedMerchandizeTotalTax || 0) + (basket?.adjustedShippingTotalTax || 0));
  const taxValueUI = !!urlBasketId
    ? round2(
      (effectiveBasket?.adjustedMerchandizeTotalTax || 0) +
      (effectiveBasket?.adjustedShippingTotalTax || 0),
    )
    : round2(
      (basket?.adjustedMerchandizeTotalTax || 0) +
      (basket?.adjustedShippingTotalTax || 0),
    );

  const orderTotalUI =
    // basket?.orderTotal == null
    (!!urlBasketId ? effectiveBasket?.orderTotal : basket?.orderTotal) == null
      ? round2(
        totals.subtotal +
        // (showShipping ? totals.shipping : 0) +
        (totals.shipping ? totals.shipping : 0) +
        taxValueUI -
        totals.couponDiscount,
      )
      : round2(
        toNum(
          !!urlBasketId ? effectiveBasket?.orderTotal : basket?.orderTotal,
          0,
        ),
      );

  useEffect(() => {
    setOrderTotalUI(orderTotalUI);
  }, [orderTotalUI, setOrderTotalUI]);

  // ---------------------------
  // Coupon handlers
  // ---------------------------
  // Helper to check if a coupon is "automatic" (from Available Offers/Promotions)
  const isAutomaticCoupon = (code) => {
    return couponList.some((p) => {
      const codes = p?.coupons || [];
      return codes.includes(code) || p?.id === code;
    });
  };

  const handleApplyCoupon = async (overrideCode = null) => {
    try {
      setIsApplyingCoupon(true);
      setCouponError("");

      const code = (overrideCode ?? coupon)?.trim();
      if (!code) return;

      const temporary = !!urlBasketId;

      const result = await addCoupon(
        code,
        urlBasketId,
        temporary,
        paymentMethod,
      );

      if (result) {
        const appliedItem = result.couponItems?.find(
          (ci) => ci.code.toLowerCase() === code.toLowerCase(),
        );

        if (appliedItem?.statusCode === "applied") {
          setIsCouponApplied(true);

          // ✅ Clear input ONLY for manual entry
          if (!overrideCode) {
            setCoupon("");
          }

          if (urlBasketId) {
            await fetchBasketData();
          }
        }
      }
    } catch (error) {
      const errorMsg =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        "Invalid coupon code.";

      setCouponError(errorMsg);
      setCoupon("");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async (targetId) => {
    try {
      const idToRemove = targetId || couponId;
      if (!idToRemove) {
        // nothing to remove; keep state consistent
        setCoupon("");
        return;
      }
      setRemovingCouponId(idToRemove);

      let temporary = false;
      if (urlBasketId) {
        temporary = true;
      }
      // Pass paymentMethod to removeCoupon
      const result = await removeCoupon(
        idToRemove,
        urlBasketId,
        temporary,
        paymentMethod,
      );
      if (result) {
        // Only clear global coupon state if we removed the one currently being tracked or if we want to reset input
        if (idToRemove === couponId) {
          setCoupon("");
          setCouponId("");
          setIsCouponApplied(false);
        }

        // toast.success("Coupon removed successfully");

        // Refresh basket data explicitly for temporary baskets (or general safety)
        if (urlBasketId) {
          await fetchBasketData();
        }
      }
      setButtonToggle((v) => !v);
    } catch (error) {
      setMessage("Failed to remove coupon");
    } finally {
      setRemovingCouponId(null);
    }
  };

  const handleCouponClick = async (itm) => {
    // 1. Try old way: coupons array
    let code = itm?.coupons?.[0];

    // 2. If missing, and we are in temporary basket mode, use logic: "id" field
    if (!code && urlBasketId) {
      code = itm?.id;
    }

    if (!code) return;

    // if (isCouponApplied && code !== coupon) {
    //   setIsConfirmationModalOpen(true);
    // } else {
    //   setCoupon(code);
    // }
    setCoupon(code);
    setCouponId(itm?.id);
    setIsCouponApplied(true);
  };

  const handleCancelCouponChange = () => {
    setIsConfirmationModalOpen(false);
    setCoupon(coupon);
  };

  const handleToggleCoupons = () => setToggleViewMore((prev) => !prev);
  const isShipping = location.pathname.includes("/Shipping");

  const appliedCouponCodes = useMemo(() => {
    return (
      effectiveBasket?.couponItems
        ?.filter((ci) => ci.statusCode === "applied")
        ?.map((ci) => ci.code) || []
    );
  }, [effectiveBasket]);

  const handleApplyCouponFromList = async (code) => {
    await handleApplyCoupon(code); // ✅ direct apply
  };

  console.log(totals, "totals")

  return (
    <Fragment>
      {/* mobile view */}
      <Box display={{ base: "block", lg: "none" }}>
        <Box w={{ base: "full", lg: "41.6667%" }}>
          {/* Available Offers */}
          {isLoading ? (
            <CartCouponAndPricingShimmer />
          ) : (
            <>
              {/* PRICING / ORDER SUMMARY */}
              <Box py="3">
                <Text
                  color="black"
                  textTransform="uppercase"
                  fontSize="sm"
                  fontWeight="medium"
                  mb="2"
                >
                  Order Summary
                </Text>

                {/* Subtotal */}
                <Flex
                  justify="space-between"
                  fontSize="xs"
                  mb={{ base: 1, lg: 2 }}
                >
                  <Text>Subtotal</Text>
                  <Text>
                    {currencyCode} {round2(totals.subtotal).toFixed(2)}
                  </Text>
                </Flex>

                {/* Shipping */}
                {/* {showShipping && ( */}
                <Flex
                  justify="space-between"
                  fontSize="xs"
                  mb={{ base: 1, lg: 2 }}
                >
                  <HStack spacing="4px">
                    <Text mb="0">Shipping</Text>
                    {shippingLabel ? (
                      <Text fontSize="10px" color="blackAlpha.600">
                        ({shippingLabel})
                      </Text>
                    ) : null}
                  </HStack>
                  <Text>
                    {totals.shipping === 0
                      ? "Free"
                      : currencyCode + " " + round2(totals.shipping).toFixed(2)}
                  </Text>
                </Flex>
                {/* )} */}

                {/* Coupon Discount (show only if > 0) */}
                {couponDiscounts.length > 0 && (
                  <>
                    <Flex
                      justify="space-between"
                      align="center"
                      fontSize="xs"
                      mb={{ base: 1, lg: 2 }}
                      cursor="pointer"
                      onClick={() => setShowCouponSummary(!showCouponSummary)}
                    >
                      <HStack spacing="4px">
                        <Text>Coupon Discount</Text>

                        <Icon
                          as={showCouponSummary ? ChevronUpIcon : ChevronDownIcon}
                          w={4}
                          h={4}
                        />
                      </HStack>

                      <Text color="green.500">
                        - {currencyCode} {round2(totals.couponDiscount).toFixed(2)}
                      </Text>
                    </Flex>

                    <Collapse in={showCouponSummary} animateOpacity>
                      <Box pl={2} pb={2}>
                        {couponDiscounts.map((coupon) => (
                          <Flex
                            key={coupon.code}
                            justify="space-between"
                            fontSize="xs"
                            py={1}
                          >
                            <Text color="gray.600">
                              {coupon.code}{" "}
                              {coupon.label && (
                                <Text
                                  as="span"
                                  color="green.500"
                                  fontWeight="medium"
                                >
                                  {coupon.label}
                                </Text>
                              )}
                            </Text>

                            <Text color="green.500">
                              - {currencyCode} {round2(coupon.amount).toFixed(2)}
                            </Text>
                          </Flex>
                        ))}
                      </Box>
                    </Collapse>
                  </>
                )}

                {/* Prepaid Discount (show only if > 0) */}

                {round2(totals.prepaidDiscount) > 0 && (
                  <Flex justify="space-between" fontSize="xs" mb={{ base: 1, lg: 2 }}>
                    <Text>
                      Prepaid Discount{" "}
                      <Text as="span" color="green.500" fontWeight="medium">
                        {prepaidDiscountLabel}
                      </Text>
                    </Text>

                    <Text color="green.500">
                      - {currencyCode} {round2(totals.prepaidDiscount).toFixed(2)}
                    </Text>
                  </Flex>
                )}

                <Divider
                  borderColor={{ base: "black", lg: "blackAlpha.500" }}
                  my="2"
                />

                {/* Estimated Total */}
                <Box>
                  {/* HEADER ROW */}
                  <Flex
                    justify="space-between"
                    align="center"
                    pt="2"
                    mt={{ base: 0, lg: 4 }}
                    cursor="pointer"
                    onClick={() => setShowTax(!showTax)}
                  >
                    <HStack spacing="4px">
                      <Text fontSize="sm" color="blackAlpha.900">
                        Total Price
                      </Text>

                      <Text fontSize="xs" color="blackAlpha.900">
                        (incl. all taxes)
                      </Text>

                      {/* Animated Chevron */}
                      <Icon
                        as={showTax ? ChevronUpIcon : ChevronDownIcon}
                        w={4}
                        h={4}
                        color="gray.700"
                        transition="transform 0.25s ease"
                        transform={showTax ? "rotate(180deg)" : "rotate(0deg)"}
                      />
                    </HStack>

                    <Text fontSize="md" fontWeight="bold">
                      {currencyCode}{" "}
                      {(location.pathname === "/Shipping"
                        ? totals?.subtotal
                        : isHidden === "true"
                          ? totals?.total
                          : totals?.total
                      )?.toFixed(2)}
                    </Text>
                  </Flex>

                  {/* SLIDE DOWN PANEL */}
                  <Collapse in={showTax} animateOpacity>
                    <Box mt="3" pl="2" pb="2">
                      {/* TAX */}
                      <Flex justify="space-between" fontSize="xs" py="1">
                        <Text color="gray.700">Tax</Text>
                        <Text color="gray.900">
                          {currencyCode} {round2(taxValueUI).toFixed(2)}
                        </Text>
                      </Flex>
                    </Box>
                  </Collapse>
                </Box>
              </Box>

              {/* coupon input card */}
              {isHidden === "true" ? null : (
                <Box py="3">
                  {/* header row */}
                  <Flex
                    textTransform="uppercase"
                    justify="space-between"
                    align="center"
                    fontSize="sm"
                    borderBottomWidth="1px"
                    borderColor="black"
                    pb="2"
                    mb="2"
                  >
                    <HStack spacing="1" align="center">
                      <Image src={img1} w="17px" alt="Coupon Icon" />
                      <Text>Got a coupon?</Text>
                    </HStack>

                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      p="0"
                      h="auto"
                      minW="auto"
                      fontWeight="600"
                      textTransform="none"
                      color="blackAlpha.600"
                      _hover={{ bg: "transparent", opacity: 0.8 }}
                      _active={{ bg: "transparent" }}
                      onClick={() => setToggleViewMore((prev) => !prev)}
                      isDisabled={nonMarketingCoupons?.length <= 2}
                    >
                      <HStack spacing="4px">
                        <Text fontSize="sm">
                          {toggleViewMore ? "See Less" : "See all"}
                        </Text>
                      </HStack>
                    </Button>
                  </Flex>

                  {/* input + buttons */}
                  <Flex as="form" justify="space-between" mt="2" w="full" gap="2">
                    <Box w="75%">
                      <Input
                        type="text"
                        placeholder="Enter Coupon Code"
                        value={coupon}
                        onChange={(e) => {
                          setCoupon(e.target.value);
                          if (couponError) setCouponError("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault(); // Prevent form submission if inside a form
                            // 🚫 Block Enter on /Shipping
                            if (location.pathname.includes("/Shipping")) return;
                            if (!coupon?.trim()) return;
                            handleApplyCoupon();
                          }
                        }}
                        borderColor={{ base: "black", lg: "blackAlpha.500" }}
                        fontSize="xs"
                        borderRadius={{ base: "lg", lg: 0 }}
                        p="3"
                        _hover={{ boxShadow: "none", outline: "none" }}
                        _focus={{ boxShadow: "none", outline: "none" }}
                        _focusVisible={{ boxShadow: "none", outline: "none" }}
                        _placeholder={{ fontSize: "xs" }}
                        isReadOnly={location.pathname.includes("/Shipping")}
                      />
                      {couponError && (
                        <Text color="red.500" fontSize="xs" mt={1}>
                          {couponError}
                        </Text>
                      )}
                      {message && (
                        <Text color="red.500" fontSize="xs" mt={1}>
                          {message}
                        </Text>
                      )}
                    </Box>

                    <Box w="25%">
                      <Button
                        w="full"
                        bg="black"
                        color="white"
                        fontSize="sm"
                        fontWeight={"500"}
                        borderRadius={{ base: "lg", lg: 0 }}
                        py="2"
                        _hover={{ bg: "blackAlpha.900" }}
                        _disabled={{
                          bg: "blackAlpha.600",
                          color: "white",
                          opacity: 1,
                          cursor: "not-allowed",
                        }}
                        onClick={() => {
                          if (!coupon?.trim()) return;
                          handleApplyCoupon();
                        }}
                        id="apply-coupon-btn"
                        isDisabled={
                          !coupon?.trim() ||
                          isApplyingCoupon ||
                          location.pathname.includes("/Shipping")
                        }
                        isLoading={isApplyingCoupon}
                        loadingText="Applying"
                        pointerEvents="auto"
                        opacity={!coupon?.trim() ? 0.5 : 1}
                        cursor={!coupon?.trim() ? "not-allowed" : "pointer"}
                        type="button"
                      >
                        Apply
                      </Button>
                    </Box>
                  </Flex>

                  {/* Available coupons list */}
                  {isAuthenticated && (
                    <VStack as="ul" mt="4" spacing="4" align="stretch">
                      {/* 1. APPLIED COUPONS - Sourced directly from basket */}
                      {effectiveBasket?.couponItems
                        ?.filter((ci) => {
                          const isApplied = ci.statusCode === "applied";
                          const isAuto = isAutomaticCoupon(ci.code);
                          // Show if applied OR (automatic AND failed)
                          // Manual failed coupons are excluded
                          return isApplied || isAuto;
                        })
                        .map((appliedItem, idx) => {
                          // Try to find rich details from the promotions list
                          const promoDetails = couponList.find((p) => {
                            const codes = p?.coupons || [];
                            return (
                              codes.includes(appliedItem.code) ||
                              p?.id === appliedItem.code
                            );
                          });

                          const isApplied = appliedItem.statusCode === "applied";

                          return (
                            <Flex
                              as="li"
                              key={`applied-${idx}`}
                              justify="space-between"
                              borderWidth={{ base: "1.5px", lg: "1px" }}
                              borderColor={isApplied ? "green.400" : "red.500"}
                              borderRadius={{ base: "lg", lg: 0 }}
                              bg={isApplied ? "green.50" : "red.50"}
                              p="2"
                              fontSize="sm"
                            >
                              <Box>
                                <Text
                                  as="h3"
                                  fontWeight="semibold"
                                  fontSize="xs"
                                  color={isApplied ? "black" : "red.700"}
                                  borderRadius={{ base: "lg", lg: 0 }}
                                >
                                  {appliedItem.code}
                                </Text>
                                <Text
                                  mt="2"
                                  color={isApplied ? "green.600" : "red.600"}
                                  fontSize="10px"
                                  borderRadius={{ base: "lg", lg: 0 }}
                                >
                                  {promoDetails?.callout ||
                                    (isApplied
                                      ? "Applied Coupon"
                                      : "Not Applicable")}
                                </Text>
                              </Box>

                              {isApplied ? (
                                <Button
                                  variant="outline"
                                  borderColor="green.400"
                                  colorScheme="green"
                                  color="black"
                                  size="xs"
                                  borderRadius={{ base: "lg", lg: 0 }}
                                  px="4"
                                  py="4"
                                  onClick={() =>
                                    handleRemoveCoupon(appliedItem.couponItemId)
                                  }
                                  isLoading={
                                    removingCouponId === appliedItem.couponItemId
                                  }
                                  isDisabled={!!removingCouponId}
                                >
                                  Remove
                                </Button>
                              ) : (
                                <Text
                                  color="red.500"
                                  fontSize="xs"
                                  fontWeight="bold"
                                  alignSelf="center"
                                  px="4"
                                >
                                  Not Applicable
                                </Text>
                              )}
                            </Flex>
                          );
                        })}

                      {/* 2. AVAILABLE PROMOTIONS - Filter out those that are already applied */}
                      {visibleCoupons
                        ?.filter((itm) => {
                          // Check if this promotion's coupons are already in the applied list
                          const codes = itm?.coupons || [];
                          const promotionId = itm?.id;
                          const appliedCodes =
                            effectiveBasket?.couponItems?.map((ci) => ci.code) ||
                            [];

                          // If any code from this promo is applied OR present in list (even if failed), hide it from "Available"
                          // because we show failed automatic coupons in the section above now
                          const isPresent =
                            codes.some((c) => appliedCodes.includes(c)) ||
                            appliedCodes.includes(promotionId);
                          return !isPresent;
                        })
                        .map((itm, idx) => {
                          const itemCode =
                            itm?.coupons?.[0] || (urlBasketId ? itm?.id : "");
                          const couponCode = itm?.coupons?.[0] || itm?.id;
                          const isApplied =
                            appliedCouponCodes.includes(couponCode);
                          return (
                            <Flex
                              as="li"
                              key={`available-${idx}`}
                              justify="space-between"
                              // borderWidth={{ base: "1px", lg: "1px" }}
                              // borderColor={{ base: "black", lg: "blackAlpha.500" }}
                              // borderRadius={{ base: "lg", lg: 0 }}
                              // px="3"
                              fontSize="sm"
                            >
                              <Box>
                                <Text
                                  as="h3"
                                  role="button"
                                  fontWeight="semibold"
                                  fontSize={{ base: "sm", lg: "lg" }}
                                  onClick={() => handleCouponClick(itm)}
                                >
                                  {itemCode}
                                </Text>
                                <Text color="blackAlpha.600" fontSize="xs">
                                  {itm?.callout}
                                </Text>
                              </Box>

                              <Button
                                size="xs"
                                variant={isApplied ? "solid" : "outline"}
                                colorScheme={isApplied ? "red" : "green"}
                                onClick={() => {
                                  if (isApplied) {
                                    handleRemoveCoupon(
                                      effectiveBasket?.couponItems?.find(
                                        (ci) => ci.code === couponCode,
                                      )?.couponItemId,
                                    );
                                  } else {
                                    handleApplyCouponFromList(couponCode);
                                  }
                                }}
                              >
                                {isApplied ? "Remove" : "Apply"}
                              </Button>
                            </Flex>
                          );
                        })}
                    </VStack>
                  )}

                  {nonMarketingCoupons?.length > 2 && (
                    <HStack
                      mt="2"
                      fontSize="sm"
                      cursor="pointer"
                      color="black"
                      align="center"
                      spacing="1"
                      onClick={() => setToggleViewMore((prev) => !prev)}
                      role="button"
                    >
                      <Text>{toggleViewMore ? "See Less" : "See More"}</Text>
                      {toggleViewMore ? (
                        <Box as={ChevronUp} size={14} />
                      ) : (
                        <Box as={ChevronDown} size={14} />
                      )}
                    </HStack>
                  )}
                </Box>
              )}
              {/* ✅ Sticky Checkout Button (Mobile Only) */}
              <Box
                display={{ base: "block", lg: "none" }}
                position="fixed"
                left="0"
                right="0"
                bottom="0"
                zIndex="1000"
                bg="white"
                borderTop="1px solid"
                borderColor="blackAlpha.200"
                px="12px"
                py="6px"
                pb="calc(env(safe-area-inset-bottom, 0px) + 6px)"
              >
                <Button
                  id="continue-to-payment"
                  onClick={onButtonClick}
                  w="full"
                  bg="black"
                  color="white"
                  fontSize="sm"
                  textTransform="uppercase"
                  borderRadius="0"
                  py="4"
                  letterSpacing="wide"
                  _hover={{ bg: "blackAlpha.900" }}
                  isDisabled={isButtonDisable || !hasItems}
                  opacity={isButtonDisable || !hasItems ? 0.6 : 1}
                  cursor={
                    isButtonDisable || !hasItems ? "not-allowed" : "pointer"
                  }
                >
                  {buttonTitle}
                </Button>
              </Box>

              {/* Mobile: OurPromise | Desktop: Delivery button */}
              {isMobile ? (
                <Box mt="6">
                  <OurPromise />
                </Box>
              ) : (
                <DeliveryInstructionButton
                  onClick={() => setShowDeliveryReturnModal(true)}
                />
              )}
            </>
          )}
        </Box>
      </Box>

      {/* desktop view */}
      <Box display={{ base: "none", lg: "flex" }}>
        <Box w="full">
          {/* Available Offers */}
          {isLoading ? (
            <CartCouponAndPricingShimmer />
          ) : (
            <>
              {/* coupon input card */}
              {isHidden === "true" ? null : (
                <Box
                  my="5"
                  p="3"
                  borderWidth={{ base: "1.5px", lg: "1px" }}
                  borderColor={{ base: "black", lg: "blackAlpha.500" }}
                  borderRadius={{ base: "lg", lg: 0 }}
                  boxShadow={{
                    base: "0 0 14px rgba(0, 0, 0, 0.24)",
                    lg: "none",
                  }}
                >
                  <Flex
                    textTransform="uppercase"
                    justify="space-between"
                    align="center"
                    fontSize="sm"
                    borderBottomWidth="1px"
                    borderColor="black"
                    pb="2"
                    mb="2"
                  >
                    <HStack spacing="1" align="center">
                      <Image src={img1} w="17px" alt="Coupon Icon" />
                      <Text>Got a coupon?</Text>
                    </HStack>

                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      p="0"
                      h="auto"
                      minW="auto"
                      fontWeight="600"
                      textTransform="none"
                      color="blackAlpha.600"
                      _hover={{ bg: "transparent", opacity: 0.8 }}
                      _active={{ bg: "transparent" }}
                      onClick={() => setToggleViewMore((prev) => !prev)}
                      isDisabled={nonMarketingCoupons?.length <= 2}
                    >
                      <HStack spacing="4px">
                        <Text fontSize="sm">
                          {toggleViewMore ? "See Less" : "See all"}
                        </Text>
                      </HStack>
                    </Button>
                  </Flex>

                  <Flex
                    as="form"
                    justify="space-between"
                    mt="2"
                    w="full"
                    gap="2"
                  >
                    <Box w="75%">
                      <Input
                        type="text"
                        placeholder="Enter Coupon Code"
                        value={coupon}
                        isReadOnly={isShipping}
                        isDisabled={isShipping}
                        onChange={(e) => {
                          if (isShipping) return; // 🚫 block state update
                          setCoupon(e.target.value);
                          if (couponError) setCouponError("");
                        }}
                        onKeyDown={(e) => {
                          if (isShipping) {
                            e.preventDefault();
                            e.stopPropagation();
                            return;
                          }

                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (!coupon?.trim()) return;
                            handleApplyCoupon();
                          }
                        }}
                        onPaste={(e) => {
                          if (isShipping) {
                            e.preventDefault(); // 🚫 block paste
                          }
                        }}
                        borderColor={{ base: "black", lg: "blackAlpha.500" }}
                        fontSize="xs"
                        borderRadius={{ base: "lg", lg: 0 }}
                        p="3"
                        _hover={{ boxShadow: "none", outline: "none" }}
                        _focus={{ boxShadow: "none", outline: "none" }}
                        _focusVisible={{ boxShadow: "none", outline: "none" }}
                        _placeholder={{ fontSize: "xs" }}
                      />
                      {couponError && (
                        <Text color="red.500" fontSize="xs" mt={1}>
                          {couponError}
                        </Text>
                      )}
                      {message && (
                        <Text color="red.500" fontSize="xs" mt={1}>
                          {message}
                        </Text>
                      )}
                    </Box>

                    <Box w="25%">
                      <Button
                        w="full"
                        bg="black"
                        color="white"
                        fontSize="sm"
                        fontWeight={"500"}
                        borderRadius={{ base: "lg", lg: 0 }}
                        py="2"
                        _hover={{ bg: "blackAlpha.900" }}
                        _disabled={{
                          bg: "blackAlpha.600",
                          color: "white",
                          opacity: 1,
                          cursor: "not-allowed",
                        }}
                        onClick={() => {
                          if (!coupon?.trim()) return;
                          handleApplyCoupon();
                        }}
                        id="apply-coupon-btn"
                        isDisabled={!coupon?.trim() || isApplyingCoupon}
                        isLoading={isApplyingCoupon}
                        loadingText="Applying"
                        pointerEvents="auto"
                        opacity={!coupon?.trim() ? 0.5 : 1}
                        cursor={!coupon?.trim() ? "not-allowed" : "pointer"}
                        type="button"
                      >
                        Apply
                      </Button>
                    </Box>
                  </Flex>

                  {/* Available coupons list */}
                  {isAuthenticated && (
                    <VStack as="ul" mt="4" spacing="4" align="stretch">
                      {/* 1. APPLIED COUPONS - Sourced directly from basket */}
                      {effectiveBasket?.couponItems
                        ?.filter((ci) => {
                          const isApplied = ci.statusCode === "applied";
                          const isAuto = isAutomaticCoupon(ci.code);
                          // Show if applied OR (automatic AND failed)
                          // Manual failed coupons are excluded
                          return isApplied || isAuto;
                        })
                        .map((appliedItem, idx) => {
                          // Try to find rich details from the promotions list
                          const promoDetails = couponList.find((p) => {
                            const codes = p?.coupons || [];
                            return (
                              codes.includes(appliedItem.code) ||
                              p?.id === appliedItem.code
                            );
                          });

                          const isApplied =
                            appliedItem.statusCode === "applied";

                          return (
                            <Flex
                              as="li"
                              key={`applied-${idx}`}
                              justify="space-between"
                              borderWidth={{ base: "1.5px", lg: "1px" }}
                              borderColor={isApplied ? "green.400" : "red.500"}
                              borderRadius={{ base: "lg", lg: 0 }}
                              bg={isApplied ? "green.50" : "red.50"}
                              p="2"
                              fontSize="sm"
                            >
                              <Box>
                                <Text
                                  as="h3"
                                  fontWeight="semibold"
                                  fontSize="xs"
                                  color={isApplied ? "black" : "red.700"}
                                  borderRadius={{ base: "lg", lg: 0 }}
                                >
                                  {appliedItem.code}
                                </Text>
                                <Text
                                  mt="2"
                                  color={isApplied ? "green.600" : "red.600"}
                                  fontSize="10px"
                                  borderRadius={{ base: "lg", lg: 0 }}
                                >
                                  {promoDetails?.callout ||
                                    (isApplied
                                      ? "Applied Coupon"
                                      : "Not Applicable")}
                                </Text>
                              </Box>

                              {isApplied ? (
                                <Button
                                  variant="outline"
                                  borderColor="green.400"
                                  colorScheme="green"
                                  color="black"
                                  size="xs"
                                  borderRadius={{ base: "lg", lg: 0 }}
                                  px="4"
                                  py="4"
                                  onClick={() =>
                                    handleRemoveCoupon(appliedItem.couponItemId)
                                  }
                                  isLoading={
                                    removingCouponId ===
                                    appliedItem.couponItemId
                                  }
                                  isDisabled={!!removingCouponId}
                                >
                                  Remove
                                </Button>
                              ) : (
                                <Text
                                  color="red.500"
                                  fontSize="xs"
                                  fontWeight="bold"
                                  alignSelf="center"
                                  px="4"
                                >
                                  Not Applicable
                                </Text>
                              )}
                            </Flex>
                          );
                        })}

                      {/* 2. AVAILABLE PROMOTIONS - Filter out those that are already applied */}
                      {visibleCoupons
                        ?.filter((itm) => {
                          // Check if this promotion's coupons are already in the applied list
                          const codes = itm?.coupons || [];
                          const promotionId = itm?.id;
                          const appliedCodes =
                            effectiveBasket?.couponItems?.map(
                              (ci) => ci.code,
                            ) || [];

                          // If any code from this promo is applied OR present in list (even if failed), hide it from "Available"
                          // because we show failed automatic coupons in the section above now
                          const isPresent =
                            codes.some((c) => appliedCodes.includes(c)) ||
                            appliedCodes.includes(promotionId);
                          return !isPresent;
                        })
                        .map((itm, idx) => {
                          const itemCode =
                            itm?.coupons?.[0] || (urlBasketId ? itm?.id : "");
                          const couponCode = itm?.coupons?.[0] || itm?.id;
                          const isApplied =
                            appliedCouponCodes.includes(couponCode);
                          return (
                            <Flex
                              as="li"
                              key={`available-${idx}`}
                              justify="space-between"
                              borderWidth={{ base: "1px", lg: "1px" }}
                              borderColor={{
                                base: "black",
                                lg: "blackAlpha.500",
                              }}
                              borderRadius={{ base: "lg", lg: 0 }}
                              p="3"
                              fontSize="sm"
                            >
                              <Box>
                                <Text
                                  as="h3"
                                  role="button"
                                  fontWeight="semibold"
                                  fontSize={{ base: "md", lg: "lg" }}
                                  onClick={() => handleCouponClick(itm)}
                                >
                                  {itemCode}
                                </Text>
                                <Text
                                  mt="2"
                                  color="blackAlpha.600"
                                  fontSize="xs"
                                >
                                  {itm?.callout}
                                </Text>
                              </Box>

                              <Button
                                size="xs"
                                id="add-coupon-btn"
                                variant={isApplied ? "solid" : "outline"}
                                colorScheme={isApplied ? "red" : "gray"}
                                onClick={() => {
                                  if (isApplied) {
                                    handleRemoveCoupon(
                                      effectiveBasket?.couponItems?.find(
                                        (ci) => ci.code === couponCode,
                                      )?.couponItemId,
                                    );
                                  } else {
                                    handleApplyCouponFromList(couponCode);
                                  }
                                }}
                              >
                                {isApplied ? "Remove" : "Apply"}
                              </Button>

                              {/* <Button
                              id="add-coupon-btn"
                              type="button"
                              variant="outline"
                              borderColor={{
                                base: "black",
                                lg: "blackAlpha.500",
                              }}
                              size="xs"
                              borderRadius={{ base: "lg", lg: 0 }}
                              px="4"
                              py="4"
                              onClick={() => handleCouponClick(itm)}
                            >
                              Add
                            </Button> */}
                            </Flex>
                          );
                        })}
                    </VStack>
                  )}

                  {nonMarketingCoupons?.length > 2 && (
                    <HStack
                      mt="2"
                      fontSize="sm"
                      cursor="pointer"
                      color="black"
                      align="center"
                      spacing="1"
                      onClick={() => setToggleViewMore((prev) => !prev)}
                      role="button"
                    >
                      <Text>{toggleViewMore ? "See Less" : "See More"}</Text>
                      {toggleViewMore ? (
                        <Box as={ChevronUp} size={14} />
                      ) : (
                        <Box as={ChevronDown} size={14} />
                      )}
                    </HStack>
                  )}
                </Box>
              )}

              {/* PRICING / ORDER SUMMARY */}
              <Box
                my="5"
                mb="5"
                p="3"
                borderWidth={{ base: "1.5px", lg: "1px" }}
                borderColor={{ base: "black", lg: "blackAlpha.500" }}
                borderRadius={{ base: "lg", lg: 0 }}
                boxShadow={{
                  base: "0 0 14px rgba(0, 0, 0, 0.24)",
                  lg: "none",
                }}
              >
                <Text
                  color="black"
                  textTransform="uppercase"
                  fontSize="sm"
                  fontWeight="medium"
                  mb="2"
                >
                  Order Summary
                </Text>

                {/* Subtotal */}
                <Flex
                  justify="space-between"
                  fontSize="xs"
                  mb={{ base: 1, lg: 2 }}
                >
                  <Text>Subtotal</Text>
                  <Text>
                    {currencyCode} {round2(totals.subtotal).toFixed(2)}
                  </Text>
                </Flex>

                {/* Shipping */}
                {/* {showShipping && ( */}
                <Flex
                  justify="space-between"
                  fontSize="xs"
                  mb={{ base: 1, lg: 2 }}
                >
                  <HStack spacing="4px">
                    <Text mb="0">Shipping</Text>
                    {shippingLabel ? (
                      <Text fontSize="10px" color="blackAlpha.600">
                        ({shippingLabel})
                      </Text>
                    ) : null}
                  </HStack>
                  <Text>
                    {totals.shipping === 0
                      ? "Free"
                      : currencyCode + " " + round2(totals.shipping).toFixed(2)}
                  </Text>
                </Flex>
                {/* )} */}

                {/* Coupon Discount (show only if > 0) */}
                {couponDiscounts.length > 0 && (
                  <>
                    <Flex
                      justify="space-between"
                      align="center"
                      fontSize="xs"
                      mb={{ base: 1, lg: 2 }}
                      cursor="pointer"
                      onClick={() => setShowCouponSummary(!showCouponSummary)}
                    >
                      <HStack spacing="4px">
                        <Text>Coupon Discount</Text>

                        <Icon
                          as={showCouponSummary ? ChevronUpIcon : ChevronDownIcon}
                          w={4}
                          h={4}
                        />
                      </HStack>

                      <Text color="green.500">
                        - {currencyCode} {round2(totals.couponDiscount).toFixed(2)}
                      </Text>
                    </Flex>

                    <Collapse in={showCouponSummary} animateOpacity>
                      <Box pl={2} pb={2}>
                        {couponDiscounts.map((coupon) => (
                          <Flex
                            key={coupon.code}
                            justify="space-between"
                            fontSize="xs"
                            py={1}
                          >
                            <Text color="gray.600">
                              {coupon.code}{" "}
                              {coupon.label && (
                                <Text
                                  as="span"
                                  color="green.500"
                                  fontWeight="medium"
                                >
                                  {coupon.label}
                                </Text>
                              )}
                            </Text>

                            <Text color="green.500">
                              - {currencyCode} {round2(coupon.amount).toFixed(2)}
                            </Text>
                          </Flex>
                        ))}
                      </Box>
                    </Collapse>
                  </>
                )}

                {/* Prepaid Discount (show only if > 0) */}
                {round2(totals.prepaidDiscount) > 0 && (
                  <Flex justify="space-between" fontSize="xs" mb={{ base: 1, lg: 2 }}>
                    <Text>
                      Prepaid Discount{" "}
                      <Text as="span" color="green.500" fontWeight="medium">
                        {prepaidDiscountLabel}
                      </Text>
                    </Text>

                    <Text color="green.500">
                      - {currencyCode} {round2(totals.prepaidDiscount).toFixed(2)}
                    </Text>
                  </Flex>
                )}


                {/* Tax */}

                <Divider
                  borderColor={{ base: "black", lg: "blackAlpha.500" }}
                  my="2"
                />

                {/* Estimated Total */}
                <Box>
                  <Flex
                    justify="space-between"
                    align="center"
                    pt="2"
                    mt={{ base: 0, lg: 4 }}
                    cursor="pointer"
                    onClick={() => setShowTax(!showTax)}
                  >
                    <HStack spacing="4px">
                      <Text fontSize="sm" color="blackAlpha.900">
                        Total Price
                      </Text>
                      <Text fontSize="xs" color="blackAlpha.900">
                        (incl. all taxes)
                      </Text>

                      {/* Animated Chevron */}
                      <Icon
                        as={showTax ? ChevronUpIcon : ChevronDownIcon}
                        w={4}
                        h={4}
                        color="gray.700"
                        transition="transform 0.25s ease"
                      />
                    </HStack>

                    <Text fontSize="sm" fontWeight="bold">
                      {currencyCode}{" "}
                      {(location.pathname === "/Shipping"
                        ? totals?.subtotal
                        : isHidden === "true"
                          ? totals?.total
                          : totals?.total
                      )?.toFixed(2)}
                    </Text>
                  </Flex>

                  {/* Slide-down animated breakdown */}
                  <Collapse in={showTax} animateOpacity>
                    <Box mt="3" pl="2" pb="2">
                      <Flex justify="space-between" fontSize="xs" py="1">
                        <Text color="gray.700">Tax</Text>
                        <Text color="gray.900">
                          {currencyCode} {round2(taxValueUI).toFixed(2)}
                        </Text>
                      </Flex>
                    </Box>
                  </Collapse>
                </Box>
              </Box>

              {/* Checkout Button */}
              <Box w="full">
                <Button
                  id="continue-to-payment"
                  onClick={onButtonClick}
                  w="full"
                  bg="black"
                  color="white"
                  fontSize="sm"
                  textTransform="uppercase"
                  borderRadius="0"
                  py="3"
                  px="6"
                  letterSpacing="wide"
                  _hover={{ bg: "blackAlpha.900" }}
                  isDisabled={isButtonDisable || !hasItems}
                  opacity={isButtonDisable || !hasItems ? 0.2 : 1}
                  cursor={
                    isButtonDisable || !hasItems ? "not-allowed" : "pointer"
                  }
                >
                  {buttonTitle}
                </Button>
              </Box>

              {/* Mobile: OurPromise | Desktop: Delivery button */}
              {isMobile ? (
                <Box mt="6">
                  <OurPromise />
                </Box>
              ) : (
                <DeliveryInstructionButton
                  onClick={() => setShowDeliveryReturnModal(true)}
                />
              )}
            </>
          )}
        </Box>
      </Box>

      {/* MODALS */}
      {!isMobile && (
        <DeliveryReturnModal
          isOpen={showDeliveryReturnModal}
          onClose={() => setShowDeliveryReturnModal(false)}
        />
      )}

      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onCancel={handleCancelCouponChange}
        title="Are you sure you want to apply this coupon"
        subtitle="It will remove Current coupon"
        onConfirm={async () => {
          await handleRemoveCoupon();
          setIsConfirmationModalOpen(false);
          setTimeout(() => {
            setCoupon(coupon);
          }, 500);
        }}
      />
    </Fragment>
  );
};

export default CartCouponAndPricingSection;
