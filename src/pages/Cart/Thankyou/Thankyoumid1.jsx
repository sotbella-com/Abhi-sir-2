import React, { Fragment, useEffect, useState } from "react";
import { Link, Link as RouterLink, useSearchParams } from "react-router-dom";
import img1 from "@/assets/images/teenyicons_tick-circle-outline.png";
import img2 from "@/assets/images/Vector-arrow-icon.png";
import { useAuth } from "@/context";
import { LOCAL_KEYS } from "@/constants/localStorageKeys";
import { CURRENCY_SYMBOL } from "@/constants/constants";
import { ShimmerThankyouPage } from "@/components/layouts/Simmers/ShimmerThankyouPage";
import { useMobile } from "@/components/molecules";
import {
  Box,
  Flex,
  Image,
  Text,
  Heading,
  Divider,
  Button,
  Collapse,
} from "@chakra-ui/react";

import { get_order_details } from "@/api/services/sfccOrders";
import { trackPurchase } from "@/utils/dataLayer";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";

const getLineItemPrice = (item) => {
  const raw =
    item?.product?.priceAfterItemDiscount ??
    item?.product?.priceAfterOrderDiscount ??
    item?.product?.price ??
    item?.priceAfterItemDiscount ??
    item?.priceAfterOrderDiscount ??
    item?.price ??
    0;

  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
};

const getPaymentMethodLabel = (method) => {
  const m = String(method || "")
    .toUpperCase()
    .trim();

  if (m === "STRIPE") return "ONLINE";
  return m || "N/A";
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const Thankyoumid1 = () => {
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const isMobile = useMobile();

  const [orderDetails, setOrderDetails] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [refersionCartId, setRefersionCartId] = useState("");
  const [cashbackData, setCashbackData] = useState(null);

  const orderIdFromQuery = searchParams.get("orderId");
  const orderIdFromStorage = localStorage.getItem(LOCAL_KEYS.PLACED_ORDER_ID);
  const orderId = orderIdFromQuery || orderIdFromStorage;

  const fetchOrderUntilCartId = async (currentOrderId) => {
    const maxAttempts = 8;
    const retryDelay = 1500;

    let latestOrder = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await get_order_details({
          queryKey: ["sfcc_order_details", { orderId: currentOrderId }],
        });

        const order = response?.data?.order || null;
        latestOrder = order;

        // console.log(`Order details attempt ${attempt}:`, order);
        // console.log(`Attempt ${attempt} cartId:`, order?.cartId);

        if (order?.cartId) {
          return order;
        }

        if (attempt < maxAttempts) {
          await sleep(retryDelay);
        }
      } catch (error) {
        // console.error(`Order details attempt ${attempt} failed:`, error);

        if (attempt < maxAttempts) {
          await sleep(retryDelay);
        }
      }
    }

    return latestOrder;
  };

  const getOrderData = async () => {
    if (!orderId) {
      // console.warn("No orderId found in URL or localStorage");
      return;
    }

    try {
      setIsLoading(true);

      const order = await fetchOrderUntilCartId(orderId);

      if (!order) {
        // console.warn("Could not load order details");
        return;
      }

      // console.log("Final normalized order:", order);
      console.log("Final cartId:", order?.cartId);

      setOrderDetails(order);
      setExpectedDeliveryDate(order?.createdAt || "");

      if (order?.cartId) {
        setRefersionCartId(order.cartId);
      }
      if (order?.orderNo && !window.__PURCHASE_TRACKED__) {
        const orderItems = order.subOrders || [];

        const orderToTrack = {
          orderTotal: order.grandTotal || 0,
          total: order.grandTotal || 0,
          items: orderItems.map((item) => ({
            productId: item.productId || "",
            productName: item.product?.title || item.productName || "",
            price: item.product?.price || 0,
            quantity: item.quantity || 1,
            category: item.category || "",
            categoryId: item.categoryId || "",
            size: item.size || "",
            color: item.color || "",
            currency: order.currency,
            image:
              item?.product?.productImages?.[0]?.image ||
              item?.product?.image ||
              "",
          })),
          productItems: orderItems,
          currency: order.currency,
        };

        console.log("Tracking purchase with order details:", orderToTrack);
        console.log("Purchase event firing", {
          order,
          orderItems,
          orderToTrack,
        });

        trackPurchase(orderToTrack, order.orderNo, order.currency);
        window.__PURCHASE_TRACKED__ = true;
      }
    } catch (error) {
      // console.error("Error fetching order details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    window.__REFERSION_SENT__ = false;
    window.__PURCHASE_TRACKED__ = false;

    getOrderData();
  }, [orderId]);

  useEffect(() => {
    if (!refersionCartId) return;
    if (window.__REFERSION_SENT__) return;

    const fireRefersion = () => {
      if (!window.r || typeof window.r.sendCheckoutEvent !== "function") {
        return false;
      }

      const rfsnId = localStorage.getItem("rfsn_v4_id");
      const aid = localStorage.getItem("rfsn_v4_aid");
      const cs = localStorage.getItem("rfsn_v4_cs");
      const url = window.location.href;

      // Normal non-affiliate users ke liye skip
      if (!rfsnId || !aid || !cs) {
        // console.log("Refersion skipped: no affiliate data found");
        return false;
      }

      try {
        window.r.sendCheckoutEvent(refersionCartId, rfsnId, url, aid, cs);

        window.__REFERSION_SENT__ = true;
        // console.log("Refersion checkout event sent");
        return true;
      } catch (error) {
        // console.error("Refersion send failed:", error);
        return false;
      }
    };

    if (fireRefersion()) return;

    const handleLoaded = () => {
      fireRefersion();
    };

    document.addEventListener("refersion-loaded", handleLoaded);

    return () => {
      document.removeEventListener("refersion-loaded", handleLoaded);
    };
  }, [refersionCartId]);

  function getDateAfter7DaysUAEFormat(isoDateString) {
    if (!isoDateString) return "-";

    const inputDate = new Date(isoDateString);
    if (Number.isNaN(inputDate.getTime())) return "-";

    inputDate.setUTCDate(inputDate.getUTCDate() + 6);

    const day = String(inputDate.getUTCDate()).padStart(2, "0");
    const month = String(inputDate.getUTCMonth() + 1).padStart(2, "0");
    const year = inputDate.getUTCFullYear();

    return `${day}/${month}/${year}`;
  }

  var orderData = orderDetails;


  useEffect(() => {
    if (!orderData?.orderNo || !orderId) return;

    const sendReviewPurchase = async () => {
      try {
        const alreadySent = sessionStorage.getItem(
          `review_purchase_${orderId}`,
        );

        if (alreadySent) {
          console.log("[REVIEW_API_ALREADY_SENT]");
          return;
        }

        const productItems = orderData?.subOrders || [];

        const products = productItems.map((item) => ({
          productId: item?.productId || "",
          productName: item?.product?.title || item?.productName || "",
          productImage: item?.product?.productImages?.[0]?.image || "",
          productImages: item?.product?.productImages || [],
          price: item?.product?.price || item?.product?.basePrice || 0,
          quantity: item?.quantity || 1,
          currency: orderData?.currency || "INR",
          variationAttributes: item?.variationAttributes || [],
        }));

        if (!products.length) return;

        const payload = {
          siteId: import.meta.env.VITE_SFCC_SITE_ID,
          userId:
            orderData?.customerInfo?.email ||
            orderData?.billingAddress?.c_email ||
            "guest",
          products,
          orderId,
        };

        const response = await fetch(
          `${import.meta.env.VITE_WALLET_API_URL}/api/reviews/purchase`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer my-static-token-123`,
            },
            body: JSON.stringify(payload),
          },
        );

        const result = await response.json();
        console.log("[REVIEW_API_SUCCESS]", result);

        sessionStorage.setItem(`review_purchase_${orderId}`, "true");
      } catch (error) {
        console.error("[REVIEW_API_FAILED]", error);
      }
    };

    const sendCashback = async () => {
      try {
        const cashbackKey = `cashback_sent_${orderId}`;

        if (sessionStorage.getItem(cashbackKey)) {
          return;
        }

        sessionStorage.setItem(cashbackKey, "true");

        const response = await fetch(
          `${import.meta.env.VITE_WALLET_API_URL}/api/cashback/create-order`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(orderData),
          },
        );

        const result = await response.json();

        console.log("[CASHBACK_SUCCESS]", result);

        await checkCashback();
      } catch (error) {
        sessionStorage.removeItem(`cashback_sent_${orderId}`);
        console.error("[CASHBACK_ERROR]", error);
      }
    };

    sendReviewPurchase();
    sendCashback();
  }, [orderData?.orderNo, orderId]);

  const checkCashback = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_WALLET_API_URL}/api/cashback/check`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: orderId,
          }),
        },
      );

      const data = await response.json();

      console.log("Cashback API Response:", data);

      if (data.success) {
        setCashbackData(data);
      }
    } catch (error) {
      console.error("Cashback API Error:", error);
    }
  };

  useEffect(() => {
    if (!window.nitro) return;
    if (!orderData?.id) return;
    if (!orderData?.subOrders?.length) return;

    const key = `nitro-order-${orderData.id}`;

    if (sessionStorage.getItem(key)) return;

    const buyData = {
      checkout_url: `${window.location.origin}/checkout`,
      order_id: orderData.id,
      items: orderData.subOrders.map((item) => ({
        product_id: item.productId,
        price: Number(item.product.priceAfterOrderDiscount),
        product_url: `${window.location.origin}/product/${encodeURIComponent(
          item.productName.trim().toLowerCase().replace(/\s+/g, "-")
        )}`,
      })),
    };

    window.nitro.buy(buyData);

    sessionStorage.setItem(key, "true");
  }, [orderData]);

  const showNitroRewards = orderDetails?.couponItems?.some(
    (coupon) => coupon?.code?.toUpperCase() === "SBNITRO24X"
  );

  const [showCouponSummary, setShowCouponSummary] = useState(false);

  const couponSummary = React.useMemo(() => {
    const map = {};

    (orderDetails?.orderPriceAdjustments || []).forEach((adj) => {
      if (!adj?.couponCode || Number(adj?.price) >= 0) return;

      const code = adj.couponCode;

      if (!map[code]) {
        map[code] = {
          code,
          amount: 0,
          percentage:
            adj?.appliedDiscount?.type === "percentage"
              ? adj.appliedDiscount.percentage
              : null,
        };
      }

      map[code].amount += Math.abs(Number(adj.price || 0));

      // Keep percentage if available
      if (!map[code].percentage && adj?.appliedDiscount?.percentage) {
        map[code].percentage = adj.appliedDiscount.percentage;
      }
    });

    return Object.values(map);
  }, [orderDetails]);

  const totalCouponDiscount = couponSummary.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  return (
    <Fragment>
      {isLoading ? (
        <ShimmerThankyouPage />
      ) : (
        <Box
          w="full"
          textAlign="left"
          px={{ base: "12px", md: "50px" }}
          mt={{ base: 16, md: 28 }}
          mb={5}
        >
          <Flex wrap="wrap" gap={6}>
            <Box w={{ base: "100%", lg: "50%" }}>
              <Flex align="flex-start" mb={6}>
                <Box mr={3}>
                  <Image src={img1} alt="Tick" />
                </Box>
                <Box>
                  <Heading as="h5" mb={0} fontSize="lg" fontWeight="semibold">
                    Thank You{" "}
                    {`${orderDetails?.customerInfo?.customerName ?? "Customer"}`}
                  </Heading>
                  <Text
                    mb={0}
                    fontSize="sm"
                    color="blackAlpha.700"
                    fontWeight="medium"
                  >
                    Your Order has been Placed
                  </Text>
                </Box>
              </Flex>

              {cashbackData?.success && cashbackData?.eligible && (
                <Box
                  mt={4}
                  p={{ base: 3, md: 4 }}
                  borderRadius="8px"
                  bg="#F0FFF4"
                  border="1px solid"
                  borderColor="#9AE6B4"
                >
                  <Text
                    fontWeight="700"
                    color="#22543D"
                    fontSize={{ base: "sm", md: "md" }}
                    mb={1}
                  >
                    🎉 Congratulations!
                  </Text>

                  <Text
                    color="#2F855A"
                    fontSize={{ base: "xs", md: "sm" }}
                    lineHeight="1.7"
                  >
                    As part of our{" "}
                    <Text as="span" fontWeight="700">
                      {cashbackData?.campaign?.name}
                    </Text>{" "}
                    campaign, you've earned{" "}
                    <Text as="span" fontWeight="700">
                      ₹{cashbackData?.result.cashbackAmount}
                    </Text>{" "}
                    cashback on this order. The cashback will be credited to
                    your wallet once the return and exchange period has ended
                    successfully.
                  </Text>
                </Box>
              )}

              <Box
                w="full"
                borderTop="1px solid"
                borderBottom="1px solid"
                borderColor="#adadad"
                py={4}
                mt={5}
                color="black"
                fontSize="sm"
              >
                <Text mb={2}>
                  <Text as="span" fontWeight="semibold" color="black">
                    Order number
                  </Text>{" "}
                  :{" "}
                  <Text as="span" color="blackAlpha.600" id="orderId">
                    #{orderDetails?.orderNo || "-"}
                  </Text>
                </Text>

                <Text mb={2}>
                  <Text as="span" fontWeight="semibold" color="black">
                    Expected Date of Delivery
                  </Text>{" "}
                  :{" "}
                  <Text as="span" color="blackAlpha.600">
                    {expectedDeliveryDate
                      ? getDateAfter7DaysUAEFormat(expectedDeliveryDate)
                      : "-"}
                  </Text>
                </Text>

                <Text mb={2}>
                  <Text as="span" fontWeight="semibold" color="black">
                    Payment Method
                  </Text>{" "}
                  :{" "}
                  <Text as="span" color="blackAlpha.600">
                    {getPaymentMethodLabel(orderDetails?.paymentMethod)}
                  </Text>
                </Text>
              </Box>

              <Box w="full" mb={2} mt={3}>
                <Text
                  textTransform="uppercase"
                  fontWeight="normal"
                  fontSize="16px"
                >
                  Shipping address
                </Text>
              </Box>

              <Box p={3} border="1px solid" borderColor="#9d9d9d">
                <Box>
                  <Flex justify="space-between">
                    <Text fontWeight="medium" fontSize="xl">
                      {orderDetails?.billingAddress?.fullName || "N/A"}
                    </Text>
                  </Flex>

                  <Flex
                    justify="space-between"
                    fontSize={{ base: "sm", md: "md" }}
                  >
                    <Text>{`${orderDetails?.billingAddress?.phone || "N/A"}, ${orderDetails?.billingAddress?.c_email || "N/A"
                      }.`}</Text>
                  </Flex>

                  <Flex
                    justify="space-between"
                    fontSize={{ base: "sm", md: "md" }}
                  >
                    <Text>
                      {orderDetails?.billingAddress?.address1 || "N/A"}
                    </Text>
                  </Flex>

                  <Flex
                    justify="space-between"
                    fontSize={{ base: "sm", md: "md" }}
                  >
                    <Text>{`${orderDetails?.billingAddress?.stateCode || "N/A"}, ${orderDetails?.billingAddress?.countryCode || "N/A"
                      }, ${orderDetails?.billingAddress?.postalCode || "N/A"}`}</Text>
                  </Flex>
                </Box>
              </Box>

              <Box
                w="full"
                borderTop="1px solid"
                borderColor="#adadad"
                py={4}
                mt={5}
                color="black"
              >
                <Box w="full">
                  <Text
                    textTransform="uppercase"
                    fontSize={{ base: "sm", md: "md" }}
                    fontWeight="semibold"
                    mb={4}
                  >
                    Order Items
                  </Text>

                  {Array.isArray(orderDetails?.subOrders) &&
                    orderDetails?.subOrders.length > 0 &&
                    orderDetails?.subOrders.map((item, index) => (
                      <Flex mb={4} key={index}>
                        <Box w="80px" mr={5}>
                          {item?.product?.productImages?.[0]?.image ? (
                            <Image
                              src={item.product.productImages[0].image}
                              alt={item?.product?.title || "Product"}
                              w="full"
                              h="auto"
                              objectFit="cover"
                            />
                          ) : (
                            <Text>No Image Available</Text>
                          )}
                        </Box>

                        <Box flex="1">
                          <Flex justify="space-between" align="flex-start">
                            <div
                              data-product-sku={item?.productId || ""}
                              hidden
                            />
                            <div
                              data-product-handle={
                                item?.productName
                                  ?.toLowerCase()
                                  ?.replace(/\s+/g, "-") || ""
                              }
                              hidden
                            />

                            <Text
                              fontSize={{ base: "xs", md: "md" }}
                              fontWeight="medium"
                              w={{ base: "70%", md: "60%", xl: "100%" }}
                            >
                              {item?.product?.title || "No Title"}
                            </Text>

                            <Text
                              fontSize={{ base: "xs", md: "sm" }}
                              fontWeight="semibold"
                              whiteSpace="nowrap"
                              data-product-price
                            >
                              {CURRENCY_SYMBOL}{" "}
                              {getLineItemPrice(item).toFixed(2)}
                            </Text>
                          </Flex>

                          <Text
                            textTransform="uppercase"
                            fontSize={{ base: "xs", md: "sm" }}
                            color="#1d1d1d"
                            mb={2}
                          >
                            <Text as="span" fontWeight="medium" data-qty-label>
                              Qty:
                            </Text>{" "}
                            {item?.quantity || 0}
                          </Text>
                        </Box>
                      </Flex>
                    ))}
                </Box>
              </Box>

              <Flex align="center" color="black" fontSize="sm">
                <Image src={img2} alt="Arrow" mr={3} w="16px" h="16px" />
                <Text>
                  7 days Return & Exchange available <br />
                  <Text as="small" ml={1} fontSize="xs" color="blackAlpha.600">
                    (From the date of delivery)
                  </Text>
                </Text>
              </Flex>
            </Box>

            <Box w={{ base: "100%", lg: "41.666%" }} ml={{ md: "auto" }}>
              <Box
                border="1px solid"
                borderColor="#888"
                p={3}
                my={4}
                mb={{ md: 7 }}
              >
                <Box>
                  <Text
                    textTransform="uppercase"
                    fontWeight="semibold"
                    fontSize={{ base: "sm", md: "md" }}
                    color="black"
                    mb={4}
                  >
                    Order Summary
                  </Text>

                  <Flex
                    justify="space-between"
                    color="blackAlpha.700"
                    fontSize="xs"
                    py={1}
                  >
                    <Text>MRP</Text>
                    <Text>
                      {CURRENCY_SYMBOL}{" "}
                      {orderDetails?.mrp ? orderDetails.mrp.toFixed(2) : "0.00"}
                    </Text>
                  </Flex>

                  <Flex
                    justify="space-between"
                    color="blackAlpha.700"
                    fontSize="xs"
                    py={1}
                  >
                    <Text>Shipping</Text>
                    <Text>
                      {Number(orderDetails?.shippingCharge || 0) === 0
                        ? "FREE"
                        : `${CURRENCY_SYMBOL} ${Number(
                          orderDetails?.shippingCharge,
                        ).toFixed(2)}`}
                    </Text>
                  </Flex>

                  {couponSummary.length > 0 && (
                    <>
                      <Flex
                        justify="space-between"
                        align="center"
                        color="blackAlpha.700"
                        fontSize="xs"
                        py={1}
                        cursor="pointer"
                        onClick={() => setShowCouponSummary((prev) => !prev)}
                      >
                        <Flex align="center" gap={1}>
                          <Text>Coupon Discount</Text>

                          {showCouponSummary ? (
                            <ChevronUpIcon boxSize={4} />
                          ) : (
                            <ChevronDownIcon boxSize={4} />
                          )}
                        </Flex>

                        <Text color="green.600">
                          - {CURRENCY_SYMBOL} {totalCouponDiscount.toFixed(2)}
                        </Text>
                      </Flex>

                      <Collapse in={showCouponSummary} animateOpacity>
                        {couponSummary.map((coupon) => (
                          <Flex
                            key={coupon.code}
                            justify="space-between"
                            color="blackAlpha.700"
                            fontSize="xs"
                            py={1}
                            pl={2}
                          >
                            <Text>
                              {coupon.code}
                              {coupon.percentage && (
                                <Text
                                  as="span"
                                  color="green.500"
                                >
                                  {" "}
                                  ({coupon.percentage}% discount)
                                </Text>
                              )}
                            </Text>

                            <Text color="green.600">
                              - {CURRENCY_SYMBOL} {coupon.amount.toFixed(2)}
                            </Text>
                          </Flex>
                        ))}
                      </Collapse>
                    </>
                  )}

                  <Flex
                    justify="space-between"
                    color="blackAlpha.700"
                    fontSize="xs"
                    py={1}
                  >
                    <Text>Tax</Text>
                    <Text>
                      {CURRENCY_SYMBOL}{" "}
                      {orderDetails?.vat ? orderDetails.vat.toFixed(2) : "0.00"}
                    </Text>
                  </Flex>
                </Box>

                <Divider mt={{ base: 2, md: 4 }} />

                <Box pt={2}>
                  <Flex justify="space-between" py={1}>
                    <Flex direction="column">
                      <Text
                        mb={0}
                        fontWeight="semibold"
                        color="#000"
                        fontSize="sm"
                      >
                        Grand Total
                      </Text>
                      <Text fontSize="12px" fontWeight="medium">
                        (incl. shipping & taxes)
                      </Text>
                    </Flex>

                    <Text mb={0} fontSize="sm">
                      {CURRENCY_SYMBOL}{" "}
                      {orderDetails?.grandTotal
                        ? orderDetails.grandTotal.toFixed(2)
                        : "0.00"}
                    </Text>
                  </Flex>
                </Box>
              </Box>

              <Flex gap={5} mt={{ base: 5, md: 8 }}>
                <Box w={{ base: "100%", sm: "50%" }}>
                  <Button
                    as={RouterLink}
                    id="track-order-btn"
                    to={`/ordersummary/${orderDetails?.id || orderId || ""}`}
                    w="full"
                    textTransform="uppercase"
                    px={4}
                    py={{ base: 2, md: 3 }}
                    fontSize={{ base: "xs", md: "sm" }}
                    fontWeight="medium"
                    bg="black"
                    color="white"
                    _hover={{ bg: "black" }}
                    borderRadius={0}
                    isDisabled={!orderDetails?.id && !orderId}
                  >
                    Track Order
                  </Button>
                </Box>

                <Box w={{ base: "100%", sm: "50%" }}>
                  <Button
                    as={RouterLink}
                    id="more-shopping-btn"
                    to="/"
                    w="full"
                    textTransform="uppercase"
                    px={4}
                    py={{ base: 2, md: 3 }}
                    fontSize={{ base: "xs", md: "sm" }}
                    fontWeight="medium"
                    bg="white"
                    color="black"
                    border="1px solid"
                    borderColor="black"
                    _hover={{ bg: "white" }}
                    borderRadius={0}
                  >
                    More Shopping
                  </Button>
                </Box>
              </Flex>

              {showNitroRewards && (
                <Box
                  mt={6}
                  p={4}
                  border="1px solid"
                  borderColor="blackAlpha.200"
                  borderRadius="md"
                  bg="blackAlpha.50"
                >
                  <Flex
                    direction={{ base: "column", md: "row" }}
                    align="center"
                    gap={6}
                  >
                    <Box
                      flexShrink={0}
                      w={{ base: "100%", md: "160px" }}
                      bg="white"
                      borderRadius="md"
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                      p={2}
                    >
                      <Image
                        src="https://cdn.shopify.com/s/files/1/0604/7655/5377/files/fd2c1a96b654e220d09525f006482477.gif?v=1746432062"
                        alt="Gift"
                        w="100%"
                        objectFit="contain"
                      />
                    </Box>

                    <Box flex={1}>
                      <Text
                        fontWeight="700"
                        fontSize="md"
                        mb={2}
                        color="#000"
                      >
                        VIP Perks Unlocked!
                      </Text>

                      <Text
                        fontSize="sm"
                        color="#000"
                        lineHeight="1.6"
                        mb={4}
                      >
                        <Text as="span" fontWeight="bold">
                          Hey, You rock!
                        </Text>{" "}
                        Here are your personalized coupons redeem them at any
                        partner store on your next spree. Let the savings begin!
                      </Text>

                      <Button
                        variant="contained"
                        onClick={() => {
                          window.open(
                            "https://rewards.nitrocommerce.ai/?utm_source=igp&_shop=https://www.igp.com/verify",
                            "_blank",
                            "noopener,noreferrer"
                          );
                        }}
                        sx={{
                          backgroundColor: "#000",
                          color: "#fff",
                          textTransform: "none",
                          fontWeight: 600,
                          borderRadius: "8px",
                          px: 3,
                          py: 1,
                          "&:hover": {
                            backgroundColor: "#181818",
                          },
                        }}
                      >
                        View Rewards
                      </Button>
                    </Box>
                  </Flex>
                </Box>
              )}
            </Box>
          </Flex>
        </Box>
      )}
    </Fragment>
  );
};

export default Thankyoumid1;
