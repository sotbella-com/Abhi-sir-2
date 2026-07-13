import { Fragment, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LogoNavbar from "@/components/layouts/LogoNavbar";
import { ProfileSideBar, ShimmerOrderDetails } from "@/components/layouts";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { LOCAL_KEYS } from "@/constants/localStorageKeys";
import PaymentDetailsModal from "@/components/compounds/paymentDetailsModal";
import { useMobile } from "@/components/molecules";
import CartQuickView from "@/pages/ProductDetails/components/cartQuickView";
import { getImageUrl, useNavigateToProduct } from "@/utils/url";
import img1 from "@/assets/images/left-arrow.png";
import { Box, Flex, Heading, Text, Image, Button, Select } from "@chakra-ui/react";
import Footer from "@/NewHomePage/components/footer/Footer";
import { get_order_details, cancel_order_item } from "@/api/services/sfccOrders";
import { getFrontendPreferences } from "@/api/services/sfccPreferences";
import { toast } from "react-toastify";
import ConfirmationModal from "@/components/compounds/confirmationModal";
import { CURRENCY_SYMBOL } from "@/constants/constants";

const CheckboxBW = ({ id, checked, onChange, label = "" }) => {
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
  const boxStyle = {
    width: 14,
    height: 14,
    boxSizing: "border-box",
    border: "1.5px solid #000",
    borderRadius: 0,
    background: checked ? "#000" : "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 120ms ease-in-out, border-color 120ms ease-in-out",
  };

  return (
    <label htmlFor={id} style={labelStyle}>
      <input id={id} type="checkbox" checked={checked} onChange={onChange} style={inputStyle} />
      <span style={boxStyle}>
        {checked ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6.5l2 2 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
      {label ? <span style={{ fontSize: 14, color: "#343434" }}>{label}</span> : null}
    </label>
  );
};

/* ---------------------- currency helpers ---------------------- */
const getOrderCurrency = (order = {}) =>
  CURRENCY_SYMBOL;

const getSubCurrency = (sub, order) => sub?.currency || getOrderCurrency(order);

const buildTrackingUrl = ({ provider, trackingNumber, trackingLinks }) => {
  if (!provider || !trackingNumber) return null;

  const base = trackingLinks?.[String(provider).toUpperCase()];
  if (!base) return null;

  if (base.includes("?") || base.endsWith("=")) {
    return `${base}${encodeURIComponent(trackingNumber)}`;
  }

  const needsSlash = !base.endsWith("/");
  return `${base}${needsSlash ? "/" : ""}${encodeURIComponent(trackingNumber)}`;
};

const getPaymentMethodLabel = (method) => {
  const m = String(method || "").toUpperCase().trim();
  if (m === "STRIPE") return "ONLINE";
  return m || "N/A";
};

/* ---------------------- refund helpers ---------------------- */
const parseRefundDetails = (raw) => {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  if (typeof raw !== "string") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const formatMoney = (currency, amount) => {
  const n = Number(amount);
  if (!Number.isFinite(n)) return null;
  return `${currency} ${n.toFixed(2)}`;
};

const OrderSummary = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const navigateToProduct = useNavigateToProduct();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState(null);

  const [statusCodeToLabel, setStatusCodeToLabel] = useState({});
  const [lineItemStatusCodeToLabel, setLineItemStatusCodeToLabel] = useState({});

  const [cancelReasons, setCancelReasons] = useState([]);
  const [cancelReason, setCancelReason] = useState("");
  const [trackingLinks, setTrackingLinks] = useState({});

  const [cancelMode, setCancelMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState({});

  const [showModal, setShowModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const isMobile = useMobile();

  const toggleItem = (productId) => {
    if (!productId) return;
    setSelectedItems((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  const selectedProductIds = useMemo(
    () => Object.keys(selectedItems).filter((k) => selectedItems[k]),
    [selectedItems]
  );

  const hasSelected = selectedProductIds.length > 0;

  // ✅ Order details
  const { data: resp, isFetching, refetch: refetchOrderDetails } = useQuery({
    queryKey: [LOCAL_KEYS.ordersDetails, { orderId: id }],
    queryFn: get_order_details,
    enabled: !!id,
    refetchOnWindowFocus: false,
  });

  const orderDetails = resp?.data?.order || {};
  const rawOrder = orderDetails?._raw || orderDetails || {};

  /* ------------------ STATUS HELPERS ------------------ */

  // ✅ ONLY read from subOrders item
  const getLineItemStatusLabel = (sub) => {
    const raw = sub?.c_lineItemStatus ?? sub?._raw?.c_lineItemStatus ?? "";

    if (raw === null || raw === undefined || raw === "") return "-";

    // backend sends text label
    if (typeof raw === "string" && isNaN(Number(raw))) return raw.toUpperCase();

    // backend sends numeric code
    const code = String(raw);
    const label = lineItemStatusCodeToLabel?.[code];
    return (label || code).toUpperCase();
  };

  const buildCodeToLabelMap = (source) => {
    const out = {};

    // object map { LABEL: CODE }
    if (source && typeof source === "object" && !Array.isArray(source)) {
      Object.entries(source).forEach(([label, code]) => {
        if (code !== undefined && code !== null) out[String(code)] = String(label);
      });
      return out;
    }

    // array options
    if (Array.isArray(source)) {
      source.forEach((it) => {
        const label = it?.label ?? it?.name ?? it?.key ?? it?.title ?? it?.displayName;
        const code = it?.value ?? it?.id ?? it?.code ?? it?.statusCode ?? it?.number;
        if (label != null && code != null) out[String(code)] = String(label);
      });
      return out;
    }

    return out;
  };

  const findLineItemStatusSource = (pref) => {
    if (!pref || typeof pref !== "object") return null;

    const candidates = [pref?.lineItemStatus].filter(Boolean);
    return candidates[0] || null;
  };

  // ✅ Load preferences: order status mapping + line item mapping + cancel reasons
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const pref = await getFrontendPreferences();
        if (!alive) return;

        setTrackingLinks(pref?.trackingLinks || {});

        // order status mapping: { LABEL: CODE } => reverse to { CODE: LABEL }
        const orderStatus = pref?.orderStatus || {};
        const reverseOrder = {};
        Object.entries(orderStatus).forEach(([label, code]) => {
          if (code != null) reverseOrder[String(code)] = String(label);
        });

        // line item mapping
        const lineItemSource = findLineItemStatusSource(pref);
        const reverseLine = buildCodeToLabelMap(lineItemSource);

        const reasons = pref?.reasonsForOrderCancel?.options || [];

        setStatusCodeToLabel(reverseOrder);
        setLineItemStatusCodeToLabel(reverseLine);
        setCancelReasons(reasons);
        setCancelReason((prev) => prev || reasons[0] || "");
      } catch (e) {
        // console.error(e);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // ✅ ORDER STATUS
  const statusCode = useMemo(() => {
    const raw = orderDetails?._raw || {};
    return raw?.c_orderStatus ?? orderDetails?.c_orderStatus ?? null;
  }, [orderDetails]);

  const displayStatus = useMemo(() => {
    if (statusCode === undefined || statusCode === null || statusCode === "") return "";
    return statusCodeToLabel[String(statusCode)] || String(statusCode);
  }, [statusCode, statusCodeToLabel]);

  const isOrderCancelled = useMemo(() => {
    const s = String(displayStatus || "").toUpperCase();
    return s === "CANCELLED";
  }, [displayStatus]);

  const isCancelableOrder = useMemo(() => {
    const s = String(displayStatus || "").toUpperCase();
    return ["PENDING", "PROCESSING"].includes(s) && !isOrderCancelled;
  }, [displayStatus, isOrderCancelled]);

  // reset cancel flow on order/status change
  useEffect(() => {
    setCancelMode(false);
    setSelectedItems({});
    setShowModal(false);
  }, [orderDetails?.orderNo, orderDetails?.id, displayStatus]);

  const formattedDate = (dateString) => (dateString ? dayjs(dateString).format("DD MMM YYYY") : "-");
  const getTimeFromDate = (dateString) => (dateString ? dayjs(dateString).format("hh:mm a") : "-");

  const handleBack = () => navigate(-1);

  const getStatusColor = (status) => {
    const s = String(status || "").toUpperCase();
    if (["CANCELLED", "CANCELED", "FAILED"].includes(s)) return "red.500";
    if (["DELIVERED", "COMPLETED", "COMPLETE"].includes(s)) return "green.500";
    if (["SHIPPED", "DISPATCHED", "IN_TRANSIT", "IN-TRANSIT"].includes(s)) return "purple.500";
    if (["PENDING", "PROCESSING", "NOTSHIPPED", "NOT_SHIPPED"].includes(s)) return "orange.400";
    if (["RETURNED", "REFUNDED"].includes(s)) return "blue.500";
    return "gray.600";
  };

  const orderStatusColor = useMemo(() => getStatusColor(displayStatus), [displayStatus]);

  const getLineItemStatusColor = (statusLabelOrCode) => {
    if (!statusLabelOrCode || statusLabelOrCode === "-") return "gray.600";

    const s = String(statusLabelOrCode).toUpperCase().trim();

    if (
      [
        "DELIVERED",
        "RETURN ACCEPTED",
        "EXCHANGE ACCEPTED",
        "REPLACED",
        "RESHIPPED",
        "EXCHANGED",
        "RETURNED AND REFUNDED",
        "EXCHANGED AND REFUNDED",
        "CANCELLED AND REFUNDED",
      ].includes(s)
    ) {
      return "green.600";
    }

    if (
      [
        "CREATED",
        "FULFILLABLE",
        "DISPATCHED",
        "ADDED TO MANIFEST",
        "PICKING FOR STAGING",
        "STAGED IN STAGING AREA",
        "PICKING FOR INVOICING",
        "RETURN INITIATED",
        "EXCHANGE INITIATED",
        "RETURN REQUESTED",
        "EXCHANGE REQUESTED",
      ].includes(s)
    ) {
      return "orange.400";
    }

    if (["ALTERNATE SUGGESTED", "ALTERNATE ACCEPTED"].includes(s)) {
      return "blue.600";
    }

    if (
      ["UNFULFILLABLE", "UNABLE TO PURCHASE", "LOCATION NOT SERVICEABLE", "RETURN REJECTED", "EXCHANGE REJECTED"].includes(
        s
      )
    ) {
      return "red.600";
    }

    if (["CANCELLED", "EXCHANGED AND CANCELLED"].includes(s)) {
      return "red.600";
    }

    return "gray.600";
  };

  const isOrderDelivered = useMemo(() => {
    const subs = orderDetails?.subOrders || [];

    return subs.some((sub) => {
      const deliveredDate = sub?._raw?.c_deliveredDate || sub?.c_deliveredDate;
      return !!deliveredDate;
    });
  }, [orderDetails]);

  // Totals
  const mrp = Number(orderDetails?.mrp ?? 0);
  const couponAmount = Number(orderDetails?.couponAmount ?? 0);
  const shippingCharge = Number(orderDetails?.shippingCharge ?? 0);
  const vat = Number(orderDetails?.vat ?? 0);
  const grand = Number(orderDetails?.grandTotal ?? 0);

  const paymentStatusText = String(orderDetails?.paymentStatus || "").toUpperCase();
  const hasPaymentIntent = !!orderDetails?.paymentGatewayResponse?.paymentIntentId;

  const handleEnterCancelMode = () => {
    if (!isCancelableOrder) return;
    setCancelMode(true);
  };

  const handleExitCancelMode = () => {
    setCancelMode(false);
    setSelectedItems({});
  };

  const handleOpenConfirm = () => {
    if (!cancelMode) return;
    if (!hasSelected) return;
    if (!cancelReason) return;
    setShowModal(true);
  };

  const handleConfirmCancel = async () => {
    try {
      const orderIdToSend = orderDetails?.orderNo || orderDetails?.id;
      if (!orderIdToSend) return;

      setIsCancelling(true);

      const siteIdFromOrder = orderDetails?._raw?.siteId || orderDetails?.siteId;

      for (const productId of selectedProductIds) {
        await cancel_order_item({
          orderId: orderIdToSend,
          itemId: productId,
          reason: cancelReason,
          ...(siteIdFromOrder ? { siteId: siteIdFromOrder } : {}),
        });
      }

      setShowModal(false);
      setSelectedItems({});
      setCancelMode(false);
      await refetchOrderDetails();
    } catch (e) {
      // console.error(e);
    } finally {
      setIsCancelling(false);
    }
  };

  const provider = rawOrder?.c_shippingProvider;
  const trackingNumber = rawOrder?.c_trackingNumber;

  const canTrack = Boolean(trackingNumber && provider && trackingLinks?.[String(provider).toUpperCase()]);

  const handleTrackOrder = () => {
    if (!trackingNumber) {
      toast.info("Tracking number not available yet.");
      return;
    }

    const url = buildTrackingUrl({ provider, trackingNumber, trackingLinks });

    if (!url) {
      toast.info("Tracking link not available for this provider.");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const orderCurrency = getOrderCurrency(orderDetails);

  /* ---------------------- REFUND: make lookup maps (works even if UI uses subOrders) ---------------------- */

  const refundLookup = useMemo(() => {
    const items = rawOrder?.productItems || [];
    const byProductId = {};
    const byItemId = {};

    items.forEach((it) => {
      const refund = parseRefundDetails(it?.c_refundDetails);
      if (!refund) return;

      if (it?.productId) byProductId[String(it.productId)] = refund;
      if (it?.itemId) byItemId[String(it.itemId)] = refund;
    });

    return { byProductId, byItemId };
  }, [rawOrder]);

  const anyRefundPresent = useMemo(() => {
    const subs = orderDetails?.subOrders || [];

    return subs.some((sub) => {
      const productId = sub?.productId ?? sub?._raw?.productId;
      const itemId = sub?.itemId ?? sub?._raw?.itemId;

      const refund =
        parseRefundDetails(sub?.c_refundDetails ?? sub?._raw?.c_refundDetails) ||
        (productId ? refundLookup.byProductId[String(productId)] : null) ||
        (itemId ? refundLookup.byItemId[String(itemId)] : null);

      return Boolean(refund); // refund key/object exists
    });
  }, [orderDetails, refundLookup]);


  const totalRefundAmount = useMemo(() => {
    const subs = orderDetails?.subOrders || [];
    let sum = 0;

    subs.forEach((sub) => {
      const productId = sub?.productId ?? sub?._raw?.productId;
      const itemId = sub?.itemId ?? sub?._raw?.itemId;

      const refund =
        parseRefundDetails(sub?.c_refundDetails ?? sub?._raw?.c_refundDetails) ||
        (productId ? refundLookup.byProductId[String(productId)] : null) ||
        (itemId ? refundLookup.byItemId[String(itemId)] : null);

      const amt = Number(refund?.amount);
      if (Number.isFinite(amt)) sum += amt;
    });

    return sum;
  }, [orderDetails, refundLookup]);

  const afterRefund = Math.max(0, Number(grand || 0) - Number(totalRefundAmount || 0));

  const latestDeliveredDate = useMemo(() => {
    const subs = orderDetails?.subOrders || [];

    const dates = subs
      .map((sub) => sub?._raw?.c_deliveredDate || sub?.c_deliveredDate)
      .filter(Boolean)
      .map((d) => new Date(d))
      .filter((d) => !Number.isNaN(d.getTime()));

    if (!dates.length) return null;

    dates.sort((a, b) => b.getTime() - a.getTime());
    return dates[0];
  }, [orderDetails]);

  const canShowReturnExchange = useMemo(() => {
    if (!latestDeliveredDate) return false;

    const lastDate = new Date(latestDeliveredDate);
    lastDate.setDate(lastDate.getDate() + 6);

    const today = new Date();
    return today.getTime() <= lastDate.getTime();
  }, [latestDeliveredDate]);

  return (
    <Fragment>
      <LogoNavbar />
      <CartQuickView />

      <Box mt="90px" display={{ base: "none", md: "block" }}>
        <Box textAlign="center">
          <Heading as="h1" fontFamily="Dm Serif Display" fontWeight="normal" fontSize="4xl" textTransform={"uppercase"}>
            My Account / Orders
          </Heading>
        </Box>
      </Box>

      <Box pb={5} pt={{ base: 16, md: 12 }} px={{ base: "12px", md: "50px" }}>
        <Flex wrap="wrap" justify="space-between" gap={4}>
          <ProfileSideBar activeTab={"ORDER"} />

          {isFetching ? (
            <ShimmerOrderDetails />
          ) : (
            <Box w={{ base: "100%", lg: "66.666%" }}>
              <Box p={4} border="1px solid" borderColor="black">
                {/* Header row */}
                <Box w="full">
                  <Flex justify="space-between" borderBottom="1px solid" borderColor="blackAlpha.500" pb={3}>
                    <Flex align="center" gap={2} w="40%">
                      <Box onClick={handleBack} display={{ base: "none", md: "block" }} cursor="pointer">
                        <Image src={img1} alt="back" w="20px" mr={2} />
                      </Box>
                      <Text fontSize={{ base: "sm", md: "lg" }} textTransform="uppercase" color="black">
                        Order Summary
                      </Text>
                    </Flex>

                    {/* ✅ TOP = ORDER STATUS ONLY */}
                    <Flex flexDirection={"column"} align="end" gap={1}>
                      <Text
                        fontSize="xs"
                        fontWeight="semibold"
                        textTransform="uppercase"
                        color={orderStatusColor}
                        fontFamily="Lato"
                      >
                        {displayStatus ? String(displayStatus).toUpperCase() : "-"}
                      </Text>
                    </Flex>
                  </Flex>
                </Box>

                {/* Order info */}
                <Box mt={5} borderBottom="1px solid" borderColor="blackAlpha.500" pb={2}>
                  <Flex justify="space-between" mb={2}>
                    <Text fontSize="sm" fontWeight="medium" color="black" fontFamily="Lato">
                      Order ID
                    </Text>
                    <Text fontSize="sm" color="black" fontFamily="Lato">
                      #{orderDetails?.orderNo || orderDetails?.id || "-"}
                    </Text>
                  </Flex>

                  <Flex justify="space-between" mb={2}>
                    <Text fontSize="sm" fontWeight="medium" color="black" fontFamily="Lato">
                      Date
                    </Text>
                    <Text fontSize="sm" color="black" fontFamily="Lato">
                      {formattedDate(orderDetails?.createdAt)}, {getTimeFromDate(orderDetails?.createdAt)}
                    </Text>
                  </Flex>

                  <Flex justify="space-between" mb={2}>
                    <Text fontSize="sm" fontWeight="medium" color="black" fontFamily="Lato">
                      Shipping Address
                    </Text>
                    <Text fontSize="sm" color="black" textAlign="right" fontFamily="Lato" maxW="60%">
                      {orderDetails?.address || "-"}
                    </Text>
                  </Flex>

                  <Flex justify="space-between" mb={2}>
                    <Text fontSize="sm" fontWeight="medium" color="black" fontFamily="Lato">
                      Payment Method
                    </Text>
                    <Text fontSize="sm" color="black" fontFamily="Lato">
                      {getPaymentMethodLabel(orderDetails?.paymentMethod)}
                    </Text>
                  </Flex>

                  {!isOrderCancelled && (
                    <Flex justify="space-between" mb={2}>
                      <Text fontSize="sm" fontWeight="medium" color="black" fontFamily="Lato">
                        Payment Status
                      </Text>
                      <Text
                        fontSize="sm"
                        color={paymentStatusText === "PAID" ? "green.600" : "red.500"}
                        fontFamily="Lato"
                        textTransform="uppercase"
                      >
                        {paymentStatusText || ""}
                      </Text>
                    </Flex>
                  )}

                  {hasPaymentIntent && (
                    <Flex justify="space-between" mb={2}>
                      <Text fontSize="sm" fontWeight="medium" color="black" fontFamily="Lato">
                        Payment Id
                      </Text>
                      <Text
                        fontSize="sm"
                        color="black"
                        textDecoration="underline"
                        cursor="pointer"
                        fontFamily="Lato"
                        onClick={() => {
                          setShowPaymentModal(true);
                          setPaymentIntentId(orderDetails?.paymentGatewayResponse?.paymentIntentId);
                        }}
                      >
                        {orderDetails?.paymentGatewayResponse?.paymentIntentId}
                      </Text>
                    </Flex>
                  )}
                </Box>

                {/* Products */}
                <Box>
                  {(orderDetails?.subOrders || []).map((sub, idx) => {
                    const productId = sub?.productId ?? sub?._raw?.productId;
                    const itemId = sub?.itemId ?? sub?._raw?.itemId;
                    const rowKey = productId || itemId || String(idx);

                    const subCurrency = getSubCurrency(sub, orderDetails);

                    // ✅ product-level status only from sub (NO fallback)
                    const lineStatusLabel = getLineItemStatusLabel(sub);
                    const lineStatusColor = getLineItemStatusColor(lineStatusLabel);

                    // ✅ Refund (works even if refund exists only in raw productItems)
                    const refund =
                      parseRefundDetails(sub?.c_refundDetails ?? sub?._raw?.c_refundDetails) ||
                      (productId ? refundLookup.byProductId[String(productId)] : null) ||
                      (itemId ? refundLookup.byItemId[String(itemId)] : null);

                    const refundAmountText = refund ? formatMoney(subCurrency, refund?.amount) : null;
                    const refundMethod = refund?.method ? String(refund.method).toUpperCase() : "";
                    const refundDate = refund?.date ? dayjs(refund.date).format("DD MMM YYYY") : "";
                    const refundTxn = refund?.transactionId ? String(refund.transactionId) : "";

                    const title = sub?.product?.title || sub?.product?.name || "";
                    const pid = productId; // from your existing productId



                    return (
                      <Flex
                        key={rowKey}
                        justify="space-between"
                        align="flex-start"
                        p={{ base: 1, md: 2 }}
                        mt={{ base: 2, md: 5 }}
                        gap={{ base: 2, md: 3 }}
                      >
                        <Flex gap={3}>
                          <Box w="100px" h="130px" overflow="hidden" flexShrink={0}
                            cursor={cancelMode ? "default" : "pointer"}
                            onClick={() => {
                              if (cancelMode) return;
                              const title = sub?.product?.title;
                              navigateToProduct(title, productId);
                            }}
                          >
                            {(() => {
                              const imgs = sub?.product?.productImages || [];
                              const first = imgs.find((i) => i?.type === "product") || imgs[0];
                              const src = first?.image ? getImageUrl(first.image) : null;
                              if (!src) return null;

                              return (
                                <Image
                                  src={src}
                                  alt={sub?.product?.title || "Product"}
                                  w="100%"
                                  h="100%"
                                  objectFit="cover"
                                  objectPosition="top"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.style.display = "none";
                                  }}
                                  loading="lazy"
                                  decoding="async"
                                />
                              );
                            })()}
                          </Box>

                          <Flex direction="column">
                            <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="medium" mb={0}
                              cursor={cancelMode ? "default" : "pointer"}
                              onClick={() => {
                                if (cancelMode) return;
                                const title = sub?.product?.title;
                                navigateToProduct(title, productId);
                              }}
                            >
                              {sub?.product?.title}
                            </Text>

                            {/* ✅ LINE ITEM STATUS */}
                            {lineStatusLabel && lineStatusLabel !== "-" && (
                              <Text fontSize="10px" textTransform="uppercase" color={lineStatusColor} mb={1}>
                                Status: {lineStatusLabel}
                              </Text>
                            )}

                            {/* ✅ REFUND INFO (amount + optional method/date/txn) */}
                            {refundAmountText && (
                              <Box mb={2}>
                                <Text fontSize="10px" textTransform="uppercase" color="green.600">
                                  Refund: {refundAmountText}
                                  {refundMethod ? ` (${refundMethod})` : ""}
                                </Text>

                                {(refundDate || refundTxn) && (
                                  <Text fontSize="10px" color="blackAlpha.700">
                                    {refundDate ? `Date: ${refundDate}` : ""}
                                    {refundDate && refundTxn ? " • " : ""}
                                    {refundTxn ? `Txn: ${refundTxn}` : ""}
                                  </Text>
                                )}
                              </Box>
                            )}

                            <Text fontSize={{ base: "xs", md: "sm" }} mb={2}>
                              Qty: {sub?.quantity}
                            </Text>

                            <Text fontFamily="Lato" fontSize={{ base: "sm", md: "base" }} fontWeight="semibold" color="black">
                              {subCurrency} {Number(sub?.product?.priceAfterItemDiscount || 0).toFixed(2)}
                            </Text>
                          </Flex>
                        </Flex>

                        {/* checkbox only in cancelMode */}
                        {cancelMode && !!productId && (
                          <Box textAlign="right" pt="2px" onClick={(e) => e.stopPropagation()}>
                            <CheckboxBW
                              id={`select-${productId}`}
                              checked={!!selectedItems[productId]}
                              onChange={() => toggleItem(productId)}
                              label=""
                            />
                          </Box>
                        )}
                      </Flex>
                    );
                  })}
                </Box>

                {/* Reason dropdown */}
                {cancelMode && hasSelected && (
                  <Box mt={4} borderTop="1px solid" borderColor="blackAlpha.500" pt={4}>
                    <Text fontSize="sm" fontWeight="medium" mb={2} fontFamily="Lato" color="black">
                      Select cancellation reason
                    </Text>

                    <Select
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      borderRadius="0"
                      borderColor="black"
                      _focus={{ boxShadow: "none", borderColor: "black" }}
                      fontSize="sm"
                    >
                      {cancelReasons.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </Select>

                    <Button
                      mt={3}
                      w="full"
                      borderRadius="0"
                      variant="outline"
                      border="1px solid"
                      borderColor={cancelReason ? "red.500" : "blackAlpha.300"}
                      color={cancelReason ? "red.500" : "blackAlpha.400"}
                      _hover={{ bg: "transparent" }}
                      isDisabled={!cancelReason}
                      onClick={handleOpenConfirm}
                    >
                      Cancel Selected
                    </Button>
                  </Box>
                )}

                {/* Totals */}
                <Box mt={4}>
                  <Flex justify="space-between" py={2}>
                    <Text fontSize="sm" fontWeight="semibold" color="black" fontFamily="Lato">
                      MRP
                    </Text>
                    <Text fontSize="sm" color="black" fontFamily="Lato">
                      {orderCurrency} {mrp.toFixed(2)}
                    </Text>
                  </Flex>

                  <Flex justify="space-between" py={2}>
                    <Text fontSize="sm" fontWeight="semibold" color="black" fontFamily="Lato">
                      Shipping
                    </Text>
                    {shippingCharge ? (
                      <Text fontSize="sm" color="black" fontFamily="Lato">
                        {orderCurrency} {shippingCharge.toFixed(2)}
                      </Text>
                    ) : (
                      <Text fontSize="sm" color="black" fontFamily="Lato">
                        Free
                      </Text>
                    )}
                  </Flex>

                  {couponAmount > 0 && (
                    <Flex justify="space-between" py={2}>
                      <Text fontSize="sm" fontWeight="semibold" color="black" fontFamily="Lato">
                        Coupon Discount
                      </Text>
                      <Text fontSize="sm" color="green.500" fontFamily="Lato">
                        - {orderCurrency} {couponAmount.toFixed(2)}
                      </Text>
                    </Flex>
                  )}

                  <Box mb={2}>
                    <Flex justify="space-between" align="center" borderBottom="1px solid" borderColor="black" py={2}>
                      <Text fontSize="sm" fontWeight="semibold" color="black" fontFamily="Lato">
                        Tax
                      </Text>
                      <Text fontSize="sm" color="black" fontFamily="Lato">
                        {orderCurrency} {vat.toFixed(2)}
                      </Text>
                    </Flex>
                  </Box>

                  <Flex justify="space-between" align="center" py={2}>
                    <Text fontSize="sm" fontWeight="semibold" color="black" fontFamily="Lato">
                      Grand Total{" "}
                      <Text as="span" fontWeight="normal">
                        (incl. all taxes)
                      </Text>
                    </Text>
                    <Text fontSize="sm" fontWeight="semibold" color="black" fontFamily="Lato">
                      {orderCurrency} {grand.toFixed(2)}
                    </Text>
                  </Flex>
                </Box>

                {/* ✅ TOTAL REFUND (shows only if > 0) */}
                {Number.isFinite(totalRefundAmount) && totalRefundAmount > 0 && (
                  <Flex justify="space-between" py={2}>
                    <Text fontSize="sm" fontWeight="semibold" color="black" fontFamily="Lato">
                      Refund Amount
                    </Text>
                    <Text fontSize="sm" color="green.600" fontFamily="Lato">
                      {orderCurrency} {totalRefundAmount.toFixed(2)}
                    </Text>
                  </Flex>
                )}

                {anyRefundPresent && (
                  <Flex justify="space-between" align="center" py={2}>
                    <Text fontSize="sm" fontWeight="semibold" color="black" fontFamily="Lato">
                      Total after Refund
                    </Text>
                    <Text fontSize="sm" fontWeight="semibold" color="black" fontFamily="Lato">
                      {orderCurrency} {afterRefund.toFixed(2)}
                    </Text>
                  </Flex>
                )}

              </Box>

              {!isOrderCancelled && (
                <Flex gap={3} mt={3} w="full">
                  {isOrderDelivered && canShowReturnExchange ? (
                    <Button
                      variant="outline"
                      borderColor="black"
                      color="black"
                      w="full"
                      px={4}
                      py={3}
                      fontWeight="medium"
                      fontSize="sm"
                      borderRadius="0"
                      _hover={{ bg: "transparent" }}
                      onClick={() => {
                        const orderIdToUse = orderDetails?.orderNo || orderDetails?.id;
                        if (!orderIdToUse) return;
                        navigate(`/returnexchange/${encodeURIComponent(orderIdToUse)}`);
                      }}
                    >
                      Return &amp; Exchange
                    </Button>
                  ) : !isOrderDelivered ? (
                    <Button
                      variant="outline"
                      borderColor="black"
                      color="black"
                      w="full"
                      px={4}
                      py={3}
                      fontWeight="medium"
                      fontSize="sm"
                      borderRadius="0"
                      _hover={{ bg: "transparent" }}
                      onClick={handleTrackOrder}
                      isDisabled={!canTrack}
                    >
                      Track Order
                    </Button>
                  ) : null}

                  <Button
                    bg="black"
                    color="white"
                    w="full"
                    px={4}
                    py={3}
                    fontWeight="medium"
                    fontSize="sm"
                    borderRadius="0"
                    _hover={{ bg: "gray.800" }}
                    onClick={() => navigate("/")}
                  >
                    More Shopping
                  </Button>
                </Flex>
              )}
            </Box>
          )}
        </Flex>
      </Box>

      <Footer />

      {showPaymentModal && (
        <PaymentDetailsModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          paymentIntentId={paymentIntentId}
        />
      )}

      <ConfirmationModal
        isOpen={showModal}
        onConfirm={handleConfirmCancel}
        onCancel={() => setShowModal(false)}
        title="Are you sure you want to cancel selected item?"
        subtitle={cancelReason ? `Reason: ${cancelReason}` : ""}
        isLoading={isCancelling}
      />

      {isCancelling && <Box position="fixed" inset={0} bg="blackAlpha.200" zIndex={9999} cursor="wait" />}
    </Fragment>
  );
};

export default OrderSummary;
