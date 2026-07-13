import { useEffect, useMemo, useRef, useState } from "react";
import LogoNavbar from "@/components/layouts/LogoNavbar";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LOCAL_KEYS } from "@/constants/localStorageKeys";
import { useNavigate, useParams, Link } from "react-router-dom";
import { SuccessReturnModal } from "@/components/compounds";
import { toast } from "react-toastify";
import { useMobile } from "@/components/molecules";
import CartQuickView from "@/pages/ProductDetails/components/cartQuickView";
import Footer from "@/NewHomePage/components/footer/Footer";
import { get_order_details } from "@/api/services/sfccOrders";
import {
  Box,
  Flex,
  Grid,
  GridItem,
  Text,
  Button,
  Image,
  Textarea,
  VisuallyHidden,
  Heading,
} from "@chakra-ui/react";
import emptyicon from "../../../assets/images/empty.png";

import ConfirmReturnModal from "./ConfirmReturnModal";
import RefundPopup from "./RefundPopup";
import BankDetailsModal from "./bankDetailModal";
import ExchangeProductModal from "./exchangeProductModal";
import UpiInputModal from "./upiInputModal";

import { create_return_request } from "@/api/services/returnExchange";

// ✅ CHANGE START: import exchange store actions
import { useReturnExchangeStore } from "@/context/returnExchangeStore"; // adjust path if different
import ReturnExchangeShimmer from "@/components/layouts/Simmers/ReturnExchangeShimmer";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { getFrontendPreferences } from "@/api/services/sfccPreferences";
// ✅ CHANGE END
import { differenceInCalendarDays } from "date-fns";

const CheckboxBW = ({ id, checked, onChange, label }) => {
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
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={inputStyle}
      />
      <span style={boxStyle}>
        {checked ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 6.5l2 2 5-5"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
      {label ? (
        <span style={{ fontSize: 14, color: "#343434" }}>{label}</span>
      ) : null}
    </label>
  );
};

const CustomDropdown = ({
  value = "",
  options = [],
  placeholder = "Select reason",
  disabled = false,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };

    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);

    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  const displayText = value ? value : placeholder;

  return (
    <Box ref={ref} position="relative" w={{ base: "full", md: "180px" }}>
      <Box
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={(e) => {
          e.stopPropagation();
          if (disabled) return;
          setOpen((p) => !p);
        }}
        border="1px solid"
        borderColor="blackAlpha.700"
        h="28px"
        px="10px"
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        bg={disabled ? "blackAlpha.100" : "white"}
        cursor={disabled ? "not-allowed" : "pointer"}
      >
        <Text
          fontSize="xs"
          color={value ? "black" : "blackAlpha.700"}
          noOfLines={1}
        >
          {displayText}
        </Text>

        <Text fontSize="xs" ml={2}>
          <ChevronDownIcon />
        </Text>
      </Box>

      {open && !disabled && (
        <Box
          position="absolute"
          top="calc(100% + 4px)"
          left="0"
          right="0"
          bg="white"
          border="1px solid"
          borderColor="blackAlpha.700"
          zIndex={9999}
          maxH="200px"
          overflowY="auto"
          rounded="none"
        >
          {options.length === 0 ? (
            <Box px={3} py={2}>
              <Text fontSize="xs" color="gray.500">
                No options
              </Text>
            </Box>
          ) : (
            options.map((opt) => (
              <Box
                key={opt}
                px={2}
                py={1}
                cursor="pointer"
                _hover={{ bg: "blackAlpha.100" }}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange?.(opt);
                  setOpen(false);
                }}
              >
                <Text fontSize={{ base: "11px", md: "xs" }}>{opt}</Text>
              </Box>
            ))
          )}
        </Box>
      )}
    </Box>
  );
};

const ReturnExchangeForm = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const fileRef = useRef(null);

  // ✅ CHANGE START: store actions for PRODUCT_EXCHANGE flow
  const startProductExchangeFlow = useReturnExchangeStore(
    (s) => s.startProductExchangeFlow,
  );
  const clearExchangeContext = useReturnExchangeStore(
    (s) => s.clearExchangeContext,
  );
  // ✅ CHANGE END

  // -----------------------------
  // Local only states (NO persistence)
  // -----------------------------
  const [response, setResponse] = useState({});
  const [exchangeType, setExchangeType] = useState(null);

  const [isConfirmReturnOpen, setConfirmReturnOpen] = useState(false);
  const [isRefundOpen, setRefundOpen] = useState(false);
  const [isBankOpen, setBankOpen] = useState(false);
  const [isExchangeModalOpen, setExchangeModalOpen] = useState(false);
  const [itemReasons, setItemReasons] = useState({});

  // order + form are local now
  const [orderDetails, setOrderDetails] = useState(null);

  const [form, setForm] = useState({
    orderId: orderId || "",
    subOrderId: "",
    type: "RETURN", // RETURN/EXCHANGE (this is user's choice)
    items: [],
    description: "",
    customerId: 1,
    upi: "us_upi",
  });

  const [selectedReason, setSelectedReason] = useState("");

  // Files must remain local
  const [images, setImages] = useState([]);
  const [imageError, setImageError] = useState("");

  const { data: preferences } = useQuery({
    queryKey: ["frontendPreferences"],
    queryFn: getFrontendPreferences,
    refetchOnWindowFocus: false,
  });

  const returnReasons = Array.isArray(
    preferences?.reasonsForOrderReturn?.options,
  )
    ? preferences.reasonsForOrderReturn.options
    : [];

  const exchangeReasons = Array.isArray(
    preferences?.reasonsForOrderExchange?.options,
  )
    ? preferences.reasonsForOrderExchange.options
    : [];

  const reasonOptions =
    form.type === "EXCHANGE" ? exchangeReasons : returnReasons;

  // -----------------------------
  // Fetch order (always on mount if orderId)
  // -----------------------------
  const { data: orderData, isLoading } = useQuery({
    queryKey: [LOCAL_KEYS.ordersDetailsForReturn, { orderId }],
    queryFn: get_order_details,
    enabled: !!orderId,
    refetchOnWindowFocus: false,
  });

  const apiOrder = orderData?.data?.order;

  const isBogoOrder = useMemo(() => {
    const couponItems = apiOrder?.couponItems || [];

    return couponItems.some((coupon) => coupon?.code?.toUpperCase() === "BOGO");
  }, [apiOrder]);

  useEffect(() => {
    if (isBogoOrder) {
      setForm((prev) => ({
        ...prev,
        type: "EXCHANGE",
      }));
    }
  }, [isBogoOrder]);

  useEffect(() => {
    if (apiOrder?.id) {
      setOrderDetails(apiOrder);
      setForm((prev) => ({
        ...prev,
        orderId: apiOrder.id || apiOrder.orderNo || orderId || "",
      }));
    }
  }, [apiOrder?.id, apiOrder?.orderNo, orderId]);

  const subOrders = orderDetails?.subOrders || [];

  const validSubOrders = subOrders.filter((subOrder) => {
    const raw = subOrder?._raw || subOrder;

    return !raw?.c_returnExchangeRequestDate && !raw?.c_cancellationDate;
  });

  // If no order, redirect
  useEffect(() => {
    if (!isLoading && orderId && !apiOrder?.id) {
      // toast.error("No Order Found. Please enter a valid Order ID.");
      navigate("/", { replace: true });
    }
  }, [isLoading, orderId, apiOrder?.id, navigate]);

  // -----------------------------
  // Selection logic
  // -----------------------------
  const selectedProductId = String(form.items?.[0]?.productId || "");

  const selectedSubOrder = useMemo(() => {
    if (!selectedProductId) return null;
    return (
      subOrders.find((s) => String(s?.productId) === selectedProductId) || null
    );
  }, [subOrders, selectedProductId]);

  const isOtherReason = String(itemReasons[selectedProductId] || "")
    .toLowerCase()
    .includes("other");

  // ✅ CHANGE START: cleanup exchange context when leaving page (optional but production-safe)
  useEffect(() => {
    return () => {
      // Only cleanup if you want “one-time flow”.
      // If you want user to resume later, remove this.
      // clearExchangeContext();
    };
  }, [clearExchangeContext]);
  // ✅ CHANGE END

  // -----------------------------
  // Exchange navigation flow
  // -----------------------------
  useEffect(() => {
    const handleExchangeFlow = async () => {
      if (!exchangeType) return;

      // Close exchange popup before navigate
      setExchangeModalOpen(false);
      setIsProcessing(true); // Start loading

      // Upload images
      let uploadedUrls = [];
      if (images.length > 0) {
        uploadedUrls = await uploadFiles();
        if (!uploadedUrls) {
          setIsProcessing(false);
          // Toast is already handled in uploadFiles
          return;
        }
      }

      // Map raw file names if upload didn't happen (fallback) or use uploaded URLs?
      // The store expects "images" to be an array of strings.
      // Previously it was image names. Now we send URLs.
      const imageList =
        uploadedUrls.length > 0 ? uploadedUrls : images.map((x) => x.name);

      if (exchangeType === "SAME_ITEM_DIFFERENT_SIZE") {
        const item = form.items?.[0];
        if (!item) {
          setIsProcessing(false);
          return;
        }

        const product = subOrders?.find(
          (so) => String(so.productId) === String(item.productId),
        )?.product;

        // ✅ Store data in Zustand store instead of sessionStorage
        startProductExchangeFlow({
          orderId: String(form.orderId || orderId),
          subOrderId: String(item.productId), // Old item ID
          reason: selectedReason,
          description: form.description,
          images: imageList, // ✅ Pass URLs or Names
          items: form.items,
        });

        // Remove sessionStorage usage
        sessionStorage.removeItem("orderFormData");
        sessionStorage.removeItem("exchange_reason");
        sessionStorage.removeItem("exchange_description");
        sessionStorage.removeItem("exchange_media_links");
        sessionStorage.removeItem("exchange_item_id");

        try {
          navigate(
            `/product/${item.productId}?isExchange=true&orderId=${form.orderId}&itemId=${item.productId}&actionType=EXCHANGE-SAME`,
            { state: { currentSize: product?.size?.id, isExchange: true } },
          );
        } catch (e) {
          // console.error(e);
          setIsProcessing(false);
        }
      }

      // ✅ CHANGE START: PRODUCT_EXCHANGE uses persisted Zustand exchangeContext (no sessionStorage)
      if (exchangeType === "PRODUCT_EXCHANGE") {
        const item = form.items?.[0]; // ✅ Define item here

        // Store “exchange intent” into zustand (production-safe + refresh safe)
        startProductExchangeFlow({
          orderId: String(form.orderId || orderId || ""),
          subOrderId: String(form.subOrderId || ""),
          reason: String(selectedReason || ""),
          description: String(form.description || ""),
          customerId: form.customerId ?? 1,
          items: Array.isArray(form.items) ? form.items : [],
          images: imageList, // ✅ Pass URLs or Names
        });

        // Keep URL flags for parity & simple routing guard
        try {
          // navigate(
          //   `/category/all dresses?isExchange=true&orderId=${form.orderId || orderId}&itemId=${item?.productId || ""}&actionType=EXCHANGE-DIFFERENT`
          // );
          navigate(
            `/search?search=All+Dresses&isExchange=true&orderId=${form.orderId || orderId}&itemId=${item?.productId || ""}&actionType=EXCHANGE-DIFFERENT`,
          );
        } catch (e) {
          // console.error(e);
          setIsProcessing(false);
        }
      }
      // ✅ CHANGE END

      // We don't turn off isProcessing here because navigate unmounts the component usually.
      // But if it fails, we catch it?
    };

    handleExchangeFlow();
  }, [
    exchangeType,
    // Dependencies mostly static or from ref/state that doesn't cycle quickly
    // form.items, form.orderId... etc are needed inside.
    // Ideally we list them, but to avoid stale closures in the async function:
    form,
    selectedReason,
    images,
    subOrders,
    orderId,
    navigate,
    startProductExchangeFlow,
  ]);

  // -----------------------------
  // Product select (single selection)
  // -----------------------------
  const onSelectProduct = (subOrder) => {
    const productId = subOrder?.productId;
    if (!productId) {
      // toast.error("Product ID not found in this order.");
      return;
    }

    setForm((prev) => ({
      ...prev,
      subOrderId: subOrder?.itemId || "",
      items: [
        {
          productId: String(productId),
          quantity: subOrder?.quantity || 1,
          reason: selectedReason || "",
        },
      ],
    }));
  };

  // Reason select
  const onSelectReason = (productId, reason) => {
    setItemReasons((prev) => ({
      ...prev,
      [productId]: reason,
    }));

    setSelectedReason(reason); // optional (for global use)

    setForm((prev) => {
      const current = prev.items?.[0];
      if (!current) return prev;

      return {
        ...prev,
        description: String(reason || "")
          .toLowerCase()
          .includes("other")
          ? prev.description
          : "",
        items: [{ ...current, reason }],
      };
    });
  };

  // -----------------------------
  // Images (max 3) local only
  // -----------------------------
  const handlePick = () => {
    if (images.length >= 3) {
      // toast.error("Max 3 images allowed.");
      return;
    }
    fileRef.current?.click();
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;

    const onlyImages = files.filter((f) => f.type.startsWith("image/"));
    const available = 3 - images.length;
    const toAdd = onlyImages.slice(0, available);

    if (!toAdd.length) {
      // toast.error("Max 3 images allowed.");
      return;
    }

    const mapped = toAdd.map((f) => ({
      file: f,
      previewUrl: URL.createObjectURL(f),
      name: f.name,
      type: f.type,
    }));

    setImages((prev) => [...prev, ...mapped]);
    setImageError("");
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const queryClient = useQueryClient();

  // -----------------------------
  // API submit (RETURN)
  // -----------------------------
  const { mutate, isPending: isSubmitting } = useMutation({
    mutationFn: (payload) => create_return_request({ payload }),
    onSuccess: (success) => {
      const ok = Boolean(success?.status ?? success?.success);
      if (ok) {
        // toast.success(success?.message || "Request created");
        setResponse(success?.data?.returnRequest || success?.result || {});

        // Invalidate order details cache so it refetches on redirect
        queryClient.invalidateQueries({ queryKey: [LOCAL_KEYS.ordersDetails] });

        setRefundOpen(false);
        setBankOpen(false);
        setConfirmReturnOpen(false);
        navigate(`/ordersummary/${form.orderId || orderId}`);
      } else {
        // toast.error(success?.message || "Something went wrong");
      }
    },
    // onError: (error) => toast.error(error?.message || "Something went wrong"),
  });

  const validateBeforeSubmit = () => {
    if (!form.items?.length) {
      toast.error("Please select a product.");
      return false;
    }

    if (!selectedReason) {
      toast.error("Please select a reason.");
      return false;
    }

    if (isOtherReason && !String(form.description || "").trim()) {
      toast.error("Please write description for 'Other'.");
      return false;
    }

    // ✅ Image mandatory
    if (!images.length) {
      setImageError("Please upload at least one image.");
      return false;
    }

    setImageError("");

    return true;
  };

  // Submit always opens confirm modal first
  const onSubmit = () => {
    if (!validateBeforeSubmit()) return;

    // ✅ CHANGE: If user selected "EXCHANGE" tab, go directly to Exchange Modal
    if (form.type === "EXCHANGE") {
      setExchangeModalOpen(true);
      return;
    }

    // Otherwise (RETURN), show confirmation modal
    setConfirmReturnOpen(true);
  };

  // ✅ CHANGE: Upload files to external API
  const uploadFiles = async () => {
    if (!images.length) return [];

    const formData = new FormData();
    images.forEach((img) => {
      if (img.file instanceof File) {
        formData.append("file", img.file);
      }
    });

    try {
      const res = await fetch("https://reviews.sotbella.com/api/upload", {
        method: "POST",
        headers: {
          Authorization: "Bearer gogXEGuFe3rVfQwIMxe44VOxthvwT4ZWRA/q6ohHkQc",
        },
        body: formData,
      });

      const data = await res.json();

      if (data.status === "success") {
        if (Array.isArray(data.data)) {
          return data.data.map((item) => item.url);
        } else if (data.data && typeof data.data === "object") {
          return [data.data.url];
        }
      }

      // console.error("Upload failed", data);
      toast.error("Failed to upload images");
      return null;
    } catch (error) {
      // console.error("Upload error", error);
      toast.error("Error uploading images");
      return null;
    }
  };

  const buildPayload = ({ bankDetails, mediaUrls } = {}) => {
    const payload = new FormData();
    payload.append("orderId", form.orderId || orderId);
    payload.append("subOrderId", form.subOrderId || "");
    payload.append("reason", selectedReason);
    payload.append("items", JSON.stringify(form.items));
    payload.append("description", form.description || "");
    payload.append("type", "RETURN");
    payload.append("customerId", String(form.customerId ?? 1));
    payload.append("upi", "us_upi");

    if (bankDetails) {
      payload.append("bankName", bankDetails.bankName || "");
      payload.append("accountNumber", bankDetails.accountNumber || "");
      payload.append("ifscCode", bankDetails.ifscCode || "");
      payload.append("mobileNumber", bankDetails.mobileNumber || "");
    }

    // append mediaUrl from upload response
    if (mediaUrls && mediaUrls.length > 0) {
      mediaUrls.forEach((url) => payload.append("mediaUrl", url));
    }

    // Fallback: still append files if needed, but usually we replace them.
    // The user requested adding to mediaUrl, so we skip raw file append if mediaUrls exist?
    // Let's keep raw files ONLY if upload wasn't done/failed? NO, user interaction implies strict flow.
    // If we have mediaUrls, we generally don't need raw files.

    // images.forEach((img) => {
    //   if (img?.file instanceof File) payload.append("images", img.file);
    // });

    return payload;
  };

  // Local processing state to show loader during upload
  const [isProcessing, setIsProcessing] = useState(false);

  // Refund confirm -> upload -> call API
  const handleConfirmRefund = async () => {
    setIsProcessing(true);
    let uploadedUrls = [];
    if (images.length > 0) {
      uploadedUrls = await uploadFiles();
      if (!uploadedUrls) {
        setIsProcessing(false);
        return; // Stop if upload failed
      }
    }
    mutate(buildPayload({ mediaUrls: uploadedUrls }), {
      onSettled: () => setIsProcessing(false),
    });
  };

  // Refund other option -> bank modal
  const handleOtherOptions = () => {
    setRefundOpen(false);
    setBankOpen(true);
  };

  // Bank confirm -> upload -> call API
  const handleBankConfirm = async (bankDetails) => {
    setIsProcessing(true);
    let uploadedUrls = [];
    if (images.length > 0) {
      uploadedUrls = await uploadFiles();
      if (!uploadedUrls) {
        setIsProcessing(false);
        return;
      }
    }
    mutate(buildPayload({ bankDetails, mediaUrls: uploadedUrls }), {
      onSettled: () => setIsProcessing(false),
    });
  };

  // ConfirmReturnModal actions
  const handleChooseReturn = () => {
    setForm((p) => ({ ...p, type: "RETURN" }));
    setConfirmReturnOpen(false);

    // ✅ Detect COD (safe for different backend values)
    const isCOD = String(
      orderDetails?.paymentMethod ||
        orderDetails?.paymentInstrument ||
        orderDetails?.paymentType ||
        "",
    )
      .toLowerCase()
      .includes("cod");

    if (isCOD) {
      // 👉 COD → open bank modal
      setBankOpen(true);
    } else {
      // 👉 Prepaid → open refund popup
      setRefundOpen(true);
    }
  };

  const handleChooseExchange = () => {
    setForm((p) => ({ ...p, type: "EXCHANGE" }));
    setConfirmReturnOpen(false);
    setExchangeModalOpen(true); // ✅ OPEN THIS POPUP (screenshot)
  };

  // -----------------------------
  // UI helpers
  // -----------------------------
  const toValidDate = (value) => {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const getLatestDeliveredDateFromOrder = (order) => {
    const raw = order?._raw || order;
    const items = raw?.productItems || [];
    if (!Array.isArray(items) || items.length === 0) return null;

    const deliveredDates = items
      .map((it) =>
        toValidDate(it?.c_deliveredDate || it?._raw?.c_deliveredDate),
      )
      .filter(Boolean);

    if (!deliveredDates.length) return null;

    deliveredDates.sort((a, b) => b.getTime() - a.getTime()); // latest
    return deliveredDates[0];
  };

  const addDays = (dateObj, days) => {
    const d = new Date(dateObj);
    d.setDate(d.getDate() + days);
    return d;
  };

  const formatEligibleDate = (dateObj) =>
    dateObj
      .toLocaleDateString("en-IN", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
      .toUpperCase();

  const deliveredDate = useMemo(
    () => getLatestDeliveredDateFromOrder(orderDetails),
    [orderDetails],
  );

  const eligibleUntil = useMemo(() => {
    if (!deliveredDate) return "-";
    return formatEligibleDate(addDays(deliveredDate, 6));
  }, [deliveredDate]);

  const isReturnEligible = useMemo(() => {
    if (!deliveredDate) return false;
    const expiry = addDays(deliveredDate, 6);
    return new Date().getTime() <= expiry.getTime();
  }, [deliveredDate]);

  console.log(
    "isReturnEligible:",
    isReturnEligible,
    "deliveredDate:",
    deliveredDate,
    "eligibleUntil:",
    eligibleUntil,
  );

  const refundAmountText = `${orderDetails?.currency || "₹"} ${Number(
    orderDetails?.grandTotal || 0,
  ).toFixed(1)}`;

  const daysSinceDelivery = deliveredDate
  ? differenceInCalendarDays(new Date(), deliveredDate)
  : -1;

const isReturn = daysSinceDelivery >= 0 && daysSinceDelivery <= 2;

const isExchange = daysSinceDelivery >= 0 && daysSinceDelivery <= 6;

const showReturn = isReturn && !isBogoOrder;
const showExchange = isExchange;

const buttonWidth = showReturn && showExchange ? "50%" : "100%";

  // -----------------------------
  // Loading state
  // -----------------------------
  if (isLoading || !orderDetails?.id) {
    return (
      <Box w="full">
        <LogoNavbar />
        <CartQuickView />
        <ReturnExchangeShimmer />
        <Footer />
      </Box>
    );
  }



  return (
    <Box w="full">
      <LogoNavbar />
      <CartQuickView />

      {/* ✅ EMPTY STATE */}
      {validSubOrders.length === 0 ? (
        <Box textAlign="center" pb={10} pt={100}>
          <Box w={{ base: "50%", md: "350px" }} mx="auto">
            <Image src={emptyicon} alt="Empty" />
          </Box>

          <Box my={4}>
            <Heading as="h4" fontSize="lg" fontWeight="semibold">
              Hey, it’s looks empty!
            </Heading>

            <Text fontSize="xs">No items available for return/exchange</Text>

            <Button
              as={Link}
              to="/category/all dresses"
              mt={4}
              bg="black"
              color="white"
              fontSize="sm"
              fontWeight="medium"
              px={6}
              py={3}
              borderRadius={0}
              textTransform="uppercase"
              letterSpacing="wide"
              _hover={{ bg: "#000" }}
            >
              Shop Now
            </Button>
          </Box>
        </Box>
      ) : (
        <Box py={4} mb={3} mt={{ base: 12, md: 24 }} px={isMobile ? 3 : "75px"}>
          <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={4}>
            {/* Tabs (optional) */}
            <GridItem>
              <Box border="1px solid" borderColor="black" p={3}>
              <Flex border="1px solid" borderColor="black">
  {showReturn && (
    <Button
      w={buttonWidth}
      py={2}
      rounded="none"
      fontSize="sm"
      letterSpacing="wide"
      bg={form.type === "RETURN" ? "black" : "white"}
      color={form.type === "RETURN" ? "white" : "black"}
      borderRight={showExchange ? "1px solid" : "none"}
      borderColor="black"
      _hover={{ bg: form.type === "RETURN" ? "black" : "white" }}
      onClick={() => setForm((p) => ({ ...p, type: "RETURN" }))}
    >
      RETURN
    </Button>
  )}

  {showExchange && (
    <Button
      w={buttonWidth}
      py={2}
      rounded="none"
      fontSize="sm"
      letterSpacing="wide"
      bg={form.type === "EXCHANGE" ? "black" : "white"}
      color={form.type === "EXCHANGE" ? "white" : "black"}
      _hover={{ bg: form.type === "EXCHANGE" ? "black" : "white" }}
      onClick={() => setForm((p) => ({ ...p, type: "EXCHANGE" }))}
    >
      EXCHANGE
    </Button>
  )}
</Flex>
              </Box>
            </GridItem>

            {/* Eligible + Submit */}
            <GridItem>
              <Box border="1px solid" borderColor="black" p={3}>
                <Flex align="center" justify="space-between" gap={3}>
                  <Text fontSize="sm" fontWeight="medium">
                    RETURN ELIGIBLE THROUGH {eligibleUntil}
                  </Text>

                  <Button
                    onClick={onSubmit}
                    rounded="none"
                    bg="black"
                    color="white"
                    px={8}
                    fontSize="sm"
                    _hover={{ bg: "black" }}
                    isLoading={isSubmitting || isProcessing}
                    isDisabled={!isReturnEligible}
                  >
                    SUBMIT
                  </Button>
                </Flex>
              </Box>
            </GridItem>
          </Grid>

          {/* Select Product */}
          <Flex direction={{ base: "column", md: "row" }} gap={4} mt={4}>
            {/* LEFT */}
            <Flex direction="column" flex="1" gap={4}>
              {/* Product */}
              <Box border="1px solid" borderColor="black" p={3}>
                <Text fontWeight="bold" mb={0.5}>
                  Select Product
                </Text>

                {validSubOrders.map((subOrder, index) => {
                  const productId = String(subOrder?.productId || "");
                  const isSelected = selectedProductId === productId;

                  return (
                    <Flex key={index} justify="space-between" p={2} w="full">
                      <Flex gap={3} w="full">
                        <Image
                          src={subOrder?.product?.productImages?.[0]?.image}
                          h="100px"
                          w="70px"
                          objectFit="contain"
                        />

                        <Box flex="1" minW={0}>
                          <Flex
                            justify="space-between"
                            align="center"
                            w="full"
                            gap={3}
                          >
                            <Text fontWeight="bold" flex="1" noOfLines={1}>
                              {subOrder?.productName}
                            </Text>
                            <CheckboxBW
                              checked={isSelected}
                              onChange={() => onSelectProduct(subOrder)}
                            />
                          </Flex>

                          <Text>Qty: {subOrder?.quantity}</Text>

                          {/* Dropdown */}
                          <Flex mt={2} gap={2} align="center">
                            <Text>
                              {form.type === "RETURN"
                                ? "Return Reason:"
                                : "Exchange Reason:"}
                            </Text>

                            <CustomDropdown
                              value={itemReasons[productId] || ""}
                              options={reasonOptions}
                              disabled={!isSelected}
                              onChange={(val) => onSelectReason(productId, val)}
                            />
                          </Flex>
                        </Box>
                      </Flex>
                    </Flex>
                  );
                })}
              </Box>

              {/* Description BELOW */}
              {isOtherReason && (
                <Box border="1px solid" borderColor="black" p={3}>
                  <Text fontWeight="bold" mb={2}>
                    Description
                  </Text>

                  <Textarea
                    value={form.description || ""}
                    resize="none"
                    minH="120px"
                    rounded="none"
                    border="1px solid"
                    borderColor="blackAlpha.300"
                    _focus={{
                      boxShadow: "none",
                      outline: "none",
                      borderColor: "blackAlpha.300", // keeps border same
                    }}
                    _active={{
                      boxShadow: "none",
                    }}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, description: e.target.value }))
                    }
                  />
                </Box>
              )}
            </Flex>

            {/* RIGHT */}
            <Flex direction="column" flex="1" gap={4}>
              <Box border="1px solid" borderColor="black" p={3}>
                <Text fontWeight="bold" mb={3}>
                  Upload Image{" "}
                  <Text as="span" color="red.500">
                    *
                  </Text>
                </Text>

                <Flex gap={3} wrap="wrap">
                  {images.slice(0, 3).map((img, idx) => (
                    <Box key={idx} position="relative" w="80px" h="80px">
                      <Image
                        src={img.previewUrl}
                        w="80px"
                        h="80px"
                        objectFit="cover"
                      />
                      <Button
                        position="absolute"
                        top="-8px"
                        right="-8px"
                        h="20px"
                        w="20px"
                        bg="black"
                        color="white"
                        borderRadius={0}
                        onClick={() => removeImage(idx)}
                      >
                        ×
                      </Button>
                    </Box>
                  ))}

                  <Box
                    onClick={handlePick}
                    w="80px"
                    h="80px"
                    bg="#D9D9D9"
                    display="grid"
                    placeItems="center"
                    cursor="pointer"
                  >
                    📷
                  </Box>

                  <VisuallyHidden
                    as="input"
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                  />

                  {imageError ? (
                    <Text color="red.500" fontSize="xs" fontWeight="medium">
                      {imageError}
                    </Text>
                  ) : null}
                </Flex>

                <Text mt={2} fontSize="xs">
                  Max 3 images allowed.
                </Text>
              </Box>
            </Flex>
          </Flex>
        </Box>
      )}
      <Footer />

      {/* 1) SUBMIT -> Confirm Return/Exchange modal */}
      {isConfirmReturnOpen && (
        <ConfirmReturnModal
          isOpen={isConfirmReturnOpen}
          onClose={() => setConfirmReturnOpen(false)}
          onReturn={handleChooseReturn}
          onExchange={handleChooseExchange}
        />
      )}

      {/* 2) Return -> Refund popup */}
      {isRefundOpen && (
        <RefundPopup
          isOpen={isRefundOpen}
          onClose={() => setRefundOpen(false)}
          amountText={refundAmountText}
          onConfirmRefund={handleConfirmRefund}
          onOtherOptions={handleOtherOptions}
          isLoading={isSubmitting || isProcessing}
        />
      )}

      {/* 3) Refund other options -> Bank details popup */}
      {isBankOpen && (
        <BankDetailsModal
          isOpen={isBankOpen}
          onClose={() => setBankOpen(false)}
          onConfirm={handleBankConfirm}
          isLoading={isSubmitting || isProcessing}
        />
      )}

      {/* 4) Exchange -> Exchange Product popup */}
      <ExchangeProductModal
        open={isExchangeModalOpen}
        onCancel={() => setExchangeModalOpen(false)}
        onConfirm={() => setExchangeModalOpen(false)}
        setExchangeType={setExchangeType}
        isBogoOrder={isBogoOrder}
      />

      <UpiInputModal open={false} onCancel={() => {}} onConfirm={() => {}} />

      <SuccessReturnModal
        open={!!response?.id}
        onClose={() => setResponse({})}
        data={{
          type: response?.type,
          id: response?.id,
          items: [{ name: selectedSubOrder?.productName || "Item" }],
          status: response?.status,
          reason: response?.reason || selectedReason,
          orderId: response?.orderId || orderId,
          images: response?.images,
        }}
      />
    </Box>
  );
};

export default ReturnExchangeForm;
