import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Flex,
  Container,
  Grid,
  GridItem,
  AspectRatio,
  Image,
  VStack,
  HStack,
  Text,
  Heading,
  Badge,
  Button,
  Wrap,
  WrapItem,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  useDisclosure,
  Tooltip,
  Link as CLink,
  useBreakpointValue,
  Center,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  Portal,
  InputGroup,
  InputLeftElement,
  Input,
} from "@chakra-ui/react";
import scaleIcon from "@/public/scale.webp";
import {
  getProductDetails,
  transformSFCCProductDetails,
} from "@/api/services/sfccSearchService";
import { useUnifiedCartStore } from "@/context/unifiedCartStore";
import { useWishlistStore } from "@/context/wishlistStore";
import { useAuth } from "@/context/AuthContext";
import { FiPlus, FiMinus } from "react-icons/fi";
import { ShimmerProductDetails } from "@/components/layouts/Simmers/ShimmerProductDetails";
import { CustomerReviewsStrip } from "./CustomerReviewsStrip";
import { checkHasReview, itemOrderCheck } from "@/api/services/review";
import { trackViewItem, trackAddToCart } from "@/utils/dataLayer";
import {
  trackViewProduct,
  trackAddToCart as trackEinsteinAddToCart,
} from "@/api/services/einsteinTracking";
import { checkShippingAvailability } from "@/api/services/shippingService";
import { useMobile } from "@/components/molecules";
import BuyNowButton from "@/components/atoms/BuyNowButton";
import { LoginFlowModal } from "@/components/compounds";
import OurPromise from "./OurPromise";
import { exchange_same_item } from "@/api/services/returnExchange";
import { get_order_details } from "@/api/services/sfccOrders";
import { useReturnExchangeStore } from "@/context/returnExchangeStore";
import FeatureInPDP from "@/NewHomePage/components/FeatureIn/FeatureInPDP";
import { CURRENCY_SYMBOL } from "@/constants/constants";
import InstaIcon from "../../assets/images/socialicons/instagram.png";
import {
  MdOutlineKeyboardArrowLeft,
  MdOutlineKeyboardArrowRight,
} from "react-icons/md";

// ✅ Performance Optimization: Code splitting - Lazy load heavy components and modals
const SizeChartPopup = React.lazy(() => import("./components/SizeChartPopup"));
const ProductImageModal = React.lazy(
  () => import("./components/ProductImageModal"),
);
const RatingReviewModal = React.lazy(
  () => import("./components/RatingReviewModal"),
);
const SimilarProducts = React.lazy(
  () => import("./components/similarProducts"),
);

// Loading fallback for lazy components
const ComponentLoader = () => (
  <Center py={8}>
    {/* <Spinner size="lg" /> */}
    <ShimmerProductDetails />
  </Center>
);

/* Helpers */
const pctOff = (mrp, sale) => {
  if (!mrp || !sale || mrp <= sale) return null;
  return Math.round(((mrp - sale) / mrp) * 100);
};

const ChakraProductDetails = ({ fromCollection, isHidden }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const [sizeTipOpen, setSizeTipOpen] = useState(false);
  const [showLoginFlow, setShowLoginFlow] = useState(false);
  const [modalType, setModalType] = useState("");
  const location = useLocation();

  // ✅ Check for Exchange Flow
  const searchParams = new URLSearchParams(location.search);
  const isExchange = searchParams.get("isExchange") === "true";
  const isDifferentExchange =
    searchParams.get("isDifferentExchange") === "true"; // ✅ New flag
  const actionType = searchParams.get("actionType") || "EXCHANGE-SAME"; // ✅ Default to SAME
  const orderId = searchParams.get("orderId");
  const oldItemId = searchParams.get("itemId");

  // Flow is active if either flag is true AND we have an orderId
  const isExchangeFlow = (isExchange || isDifferentExchange) && orderId;

  const cameFromCategory = location.state?.from === "category";
  const cameFromSearch = location.state?.from === "search";

  const backQueryKey =
    location.state?.categoryQueryKey || location.state?.searchQueryKey || "";

  const backScrollY = Number(
    location.state?.categoryScrollY || location.state?.searchScrollY || 0,
  );

  useEffect(() => {
    // ✅ only set markers if user actually came from category/search listing
    const backPage = Number(location.state?.backPage || 1);

    if (!cameFromCategory && !cameFromSearch) return;

    if (backPage)
      sessionStorage.setItem("__BACK_FROM_PDP_PAGE__", String(backPage));

    sessionStorage.setItem("__BACK_FROM_PDP__", "1");

    if (backQueryKey)
      sessionStorage.setItem("__BACK_FROM_PDP_QUERYKEY__", backQueryKey);
    if (backScrollY)
      sessionStorage.setItem("__BACK_FROM_PDP_SCROLLY__", String(backScrollY));
  }, [
    cameFromCategory,
    cameFromSearch,
    backQueryKey,
    backScrollY,
    location.state?.backPage,
  ]);

  const closeSizeTip = () => setSizeTipOpen(false);

  const [qtyTipOpen, setQtyTipOpen] = useState(false);
  const qtyTipTimerRef = useRef(null);

  const closeQtyTip = () => {
    setQtyTipOpen(false);
    if (qtyTipTimerRef.current) {
      clearTimeout(qtyTipTimerRef.current);
      qtyTipTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (qtyTipTimerRef.current) clearTimeout(qtyTipTimerRef.current);
    };
  }, []);

  const categoryLabel = (fromCollection?.name || "Products").toUpperCase();

  // qty helpers
  const [quantity, setQuantity] = useState(1);
  const decQty = async () => {
    setQuantity((q) => Math.max(1, (q ?? 1) - 1));
  };

  const incQty = async () => {
    setQuantity((q) => Math.min(maxQty, (q ?? 1) + 1));
  };

  // Find an existing cart line for current selection
  const findCartLine = (pid) =>
    (basket?.productItems || []).find((li) => li?.productId === pid) || null;

  const {
    addToBasket,
    isLoading: isAddingToCart,
    updateItemQuantity,
    refreshCartFromAPI,
    basket,
    itemCount,
    handleShow,
    handleClose,
    showCartModal,
  } = useUnifiedCartStore();
  const [pincode, setPincode] = useState("");
  const [isSizeOpen, setIsSizeOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const mobileThumbsRef = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const touchEndX = useRef(null);
  const touchEndY = useRef(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    const t = e.targetTouches[0];
    touchEndX.current = null;
    touchEndY.current = null;
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
  };

  const onTouchMove = (e) => {
    const t = e.targetTouches[0];
    touchEndX.current = t.clientX;
    touchEndY.current = t.clientY;
  };

  const onTouchEnd = () => {
    if (
      touchStartX.current == null ||
      touchEndX.current == null ||
      touchStartY.current == null ||
      touchEndY.current == null
    )
      return;

    const dx = touchEndX.current - touchStartX.current; // ✅ right swipe => +dx
    const dy = touchEndY.current - touchStartY.current;

    // ✅ if user is scrolling vertically, ignore swipe
    if (Math.abs(dy) > Math.abs(dx)) return;

    if (Math.abs(dx) < minSwipeDistance) return;

    if (dx < 0) {
      // ✅ swipe LEFT => NEXT
      nextImg();
    } else {
      // ✅ swipe RIGHT => PREV
      prevImg();
    }
  };

  const [activeImgIdx, setActiveImgIdx] = useState(0);

  const { isAuthenticated, user } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdatingQty, setIsUpdatingQty] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isCheckingReview, setIsCheckingReview] = useState(false);
  const [reviewRefresh, setReviewRefresh] = useState(false);
  const [productReviews, setProductReviews] = useState({
    reviews: [],
    averageRating: 0,
  });
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [fetchedOldItemId, setFetchedOldItemId] = useState(null); // :white_tick: State to hold fetched item ID
  const exchangeContext = useReturnExchangeStore((s) => s.exchangeContext); // :white_tick: Read store context for exchange data

  const {
    addToWishlist,
    removeFromWishlist,
    isInWishlist: isInWishlistStore,
    fetchWishlist,
    wishListProduct,
  } = useWishlistStore();

  const handleCheckPincode = async () => {
    if (!/^\d{6}$/.test(pincode)) {
      return;
    }

    try {
      setIsChecking(true); // 🔥 start loading

      const resp = await checkShippingAvailability({
        pincode,
        cod: true,
      });

      setDeliveryInfo(resp);
    } catch (err) {
      setDeliveryInfo({ isServicable: false });
    } finally {
      setIsChecking(false); // 🔥 stop loading
    }
  };

  useEffect(() => {
    setDeliveryInfo(null);
    setIsChecking(false); // optional safety reset
  }, [pincode]);

  useEffect(() => {
    if (user?.id) fetchWishlist({ customerId: user.id });
  }, [user?.id, fetchWishlist]);

  const {
    isOpen: isImageModalOpen,
    onOpen: onImageModalOpen,
    onClose: onImageModalClose,
  } = useDisclosure();

  // Fetch / transform
  const {
    data: productData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["product-details", id],
    queryFn: () => getProductDetails(id),
    enabled: !!id,
  });

  const product = useMemo(() => {
    if (!productData) return null;
    return transformSFCCProductDetails(productData);
  }, [productData]);

  // Track view_item when product loads
  useEffect(() => {
    if (product && selectedVariant) {
      const productToTrack = {
        productId: selectedVariant.id || product.id,
        productName: product.name,
        price: selectedVariant.price || product.price,
        basePrice: product.mrp || selectedVariant.price,
        category: product.category || product.categoryId || "",
        categoryId: product.categoryId || "",
        variantId: selectedVariant.id,
        size: selectedVariant.size || "",
        color: selectedVariant.color || "",
        currency: CURRENCY_SYMBOL,
        image: selectedVariant.image || product.image || "",
      };
      trackViewItem(productToTrack, productToTrack.currency);

      // Track product view for Einstein Commerce Cloud
      // Pass the product object so it can extract the main product ID (not variant ID)
      if (product) {
        trackViewProduct(product);
      }
    }
  }, [product, selectedVariant]);

  // ✅ HANDLER: Product Not Found / Error
  if (!isLoading && (error || !product)) {
    return (
      <Box
        h="60vh"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
      >
        <Image
          src={import.meta.env.VITE_App_Url + "/assets/images/empty.png"}
          mx="auto"
          w="200px"
          alt="Product not found"
          mb={4}
          fallbackSrc="https://via.placeholder.com/200?text=Product+Not+Found"
        />
        <Heading size="md" mb={2}>
          Product currently not available
        </Heading>
        <Text color="gray.600" mb={6}>
          We couldn't find the product you're looking for.
        </Text>
        <Button
          bg="black"
          color="white"
          _hover={{ bg: "gray.800" }}
          onClick={() => navigate("/")}
        >
          Continue Shopping
        </Button>
      </Box>
    );
  }

  // Derived ids for wishlist logic
  const targetId = useMemo(
    () => selectedVariant?.id || product?.id,
    [selectedVariant?.id, product?.id],
  );

  // Use store's isInWishlist function for consistency
  // Subscribe to store updates to trigger re-renders when localStorage changes
  const handleRefresh = useWishlistStore((s) => s.handleRefresh);
  const _localStorageUpdated = useWishlistStore((s) => s._localStorageUpdated);
  const isWishlisted = useMemo(() => {
    const ids = [selectedVariant?.id, product?.id].filter(Boolean);
    return ids.some((pid) => pid && isInWishlistStore(pid));
  }, [
    selectedVariant?.id,
    product?.id,
    isInWishlistStore,
    handleRefresh,
    _localStorageUpdated,
  ]);

  const [wishBusy, setWishBusy] = useState(false);

  const handleWishlist = async () => {
    const customerId = user?.id || user?.customerId || user?.data?.id;
    if (!customerId) {
      // toast.info("Please login to use wishlist");
      navigate("/main-login");
      return;
    }
    if (!targetId) return;

    try {
      // Check if product (or variant) already in wishlist
      const presentId =
        [selectedVariant?.id, product?.id].find(
          (pid) => pid && isInWishlistStore(pid),
        ) || null;

      if (presentId) {
        // ✅ REMOVE from wishlist then refresh page
        await removeFromWishlist({
          productId: presentId,
          navigate,
          customerId,
        });
        // toast.success("Removed from wishlist.");
        window.location.reload();
        return;
      }

      // ✅ ADD to wishlist (no refresh)
      // Note: addToWishlist already calls fetchWishlist in the background, so no need to call it again
      await addToWishlist({
        item: { id: targetId },
        isAuthenticated: true,
        navigate,
        location: window.location,
        customerId,
      });
      // toast.success("Added to wishlist.");
    } catch (e) {
      // toast.error("Could not update wishlist");
    }
  };

  // Images (derived from product)
  const images = useMemo(() => {
    return product?.images?.length
      ? product.images
      : [{ src: product?.image, alt: product?.name }];
  }, [product]);

  // Always safe array for UI + modal
  const safeImages = useMemo(() => {
    return images?.length
      ? images
      : [{ src: product?.image, alt: product?.name }];
  }, [images, product?.image, product?.name]);

  const showIndicators = isMobile && (safeImages?.length ?? 0) > 1;

  const goToImg = (idx) => {
    const total = safeImages.length;
    if (!total) return;
    const next = ((idx % total) + total) % total;
    setActiveImgIdx(next);
  };

  const prevImg = () => goToImg(activeImgIdx - 1);
  const nextImg = () => goToImg(activeImgIdx + 1);

  // Keyboard navigation (optional)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "ArrowLeft") prevImg();
      if (e.key === "ArrowRight") nextImg();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeImgIdx, safeImages.length]);

  const openModalAt = (i = 0) => {
    goToImg(i);
    onImageModalOpen();
  };

  const washCareHtml = product?.washCareHtml ?? productData?.c_washCare ?? "";
  const returnExchangeHtml =
    product?.returnExchangeHtml ?? productData?.c_returnAnExchange ?? "";

  useEffect(() => {
    setActiveImgIdx(0);
  }, [product?.id]);

  useEffect(() => {
    if (isMobile && mobileThumbsRef.current) {
      const container = mobileThumbsRef.current;
      const activeThumb = container.children[activeImgIdx];

      if (activeThumb) {
        // center the active thumb
        const containerWidth = container.clientWidth;
        const thumbWidth = activeThumb.offsetWidth;
        const thumbLeft = activeThumb.offsetLeft;

        const targetScroll = thumbLeft - containerWidth / 2 + thumbWidth / 2;

        container.scrollTo({ left: targetScroll, behavior: "smooth" });
      }
    }
  }, [activeImgIdx, isMobile, safeImages.length]);

  // Initialize variant
  useEffect(() => {
    if (!product) return;
    if (product.variants?.length) {
      const firstAvailableVariant =
        product.variants.find((v) => v.orderable !== false) ||
        product.variants[0];
      setSelectedVariant(firstAvailableVariant);
    } else {
      const firstAvailableSize =
        product.sizeOptions?.find((s) => s.orderable !== false) ||
        product.sizeOptions?.[0];

      setSelectedVariant({
        id: product.id,
        name: product.name,
        price: product.price,
        mrp: product.mrp,
        currency: product.currency,
        image: product.image,
        alt: product.alt,
        orderable: product.orderable,
        stock: product.stock,
        color: product.colorOptions?.[0]?.value || "",
        size: firstAvailableSize?.value || "",
        material: product.materialOptions?.[0]?.value || "",
      });
    }
  }, [product]);

  // :white_tick: Auto-fetch oldItemId from order if missing in URL
  useEffect(() => {
    const autoFetchOldItem = async () => {
      // console.log("AutoFetchEffect running. Params:", { isExchangeFlow, oldItemId, fetchedOldItemId, orderId, productId: product?.id });
      if (isExchangeFlow && !oldItemId && !fetchedOldItemId && product?.id) {
        try {
          // console.log("Fetching order details via API for ID:", orderId);
          const data = await get_order_details({
            queryKey: ["order-details", { orderId }],
          });
          if (!data?.data?.order?.subOrders) {
            // console.warn("No subOrders found in order details:", data);
            return;
          }
          const orderItems = data.data.order.subOrders;
          // console.log("Order items fetched:", orderItems);
          // Debugging match logic
          // console.log("Looking for match with Product ID:", product.id);
          const match = orderItems.find((item) => {
            const pId = String(item.productId);
            const targetId = String(product.id);
            // Exact?
            if (pId === targetId) return true;
            // Includes?
            if (pId.includes(targetId)) return true;
            // Reverse includes? (if product.id is variant ST-1234-S and order item is ST-1234... less likely but possible)
            if (targetId.includes(pId)) return true;
            return false;
          });
          if (match) {
            // console.log(":white_tick: Found matching old item in order:", match.productId);
            setFetchedOldItemId(match.productId);
          } else {
            // console.warn(":x: Could not find matching item in order for this product. Checked against:", product.id);
          }
        } catch (err) {
          // console.error("Failed to fetch order details for exchange:", err);
        }
      } else {
        // console.log("Skipping fetch. Conditions not met.");
      }
    };
    autoFetchOldItem();
  }, [isExchangeFlow, oldItemId, fetchedOldItemId, orderId, product?.id]);

  // Variant change
  const handleVariantChange = (attr, value) => {
    if (!product?.variants?.length) return;
    const base = {
      color: selectedVariant?.color || "",
      size: selectedVariant?.size || "",
      material: selectedVariant?.material || "",
    };
    base[attr] = value;

    const match = product.variants.find(
      (v) =>
        v.color === base.color &&
        v.size === base.size &&
        v.material === base.material,
    );
    if (match) {
      setSelectedVariant(match);
    } else {
      // If no variant match found, update attribute and preserve orderable status from the option itself
      let orderable = selectedVariant?.orderable ?? true;

      // Check orderable status from the specific option (size, color, or material)
      if (attr === "size") {
        const sizeOption = product.sizeOptions?.find((s) => s.value === value);
        orderable = sizeOption?.orderable !== false;
      } else if (attr === "color") {
        const colorOption = product.colorOptions?.find(
          (c) => c.value === value,
        );
        orderable = colorOption?.orderable !== false;
      } else if (attr === "material") {
        const materialOption = product.materialOptions?.find(
          (m) => m.value === value,
        );
        orderable = materialOption?.orderable !== false;
      }

      setSelectedVariant((v) => ({ ...v, [attr]: value, orderable }));
    }
  };

  // Raw SFCC variant (size-wise) from API
  const rawVariant = useMemo(() => {
    const pid = selectedVariant?.id;
    if (!pid) return null;
    return (
      (productData?.variants || []).find((v) => v?.productId === pid) || null
    );
  }, [selectedVariant?.id, productData?.variants]);

  // ✅ Size-wise available stock from SFCC -> give PRIORITY to c_ats
  const ats = Number(
    rawVariant?.c_ats ?? // 1) first: per-size stock from SFCC (e.g. XS = 1, S = 13)
    selectedVariant?.stock ?? // 2) fallback: transformed variant stock (if any)
    productData?.inventory?.ats ?? // 3) fallback: overall product ATS
    0, // 4) fallback: 0 if nothing is available
  );

  // Maximum quantity user can select for the currently selected variant
  const maxQty = Math.max(0, Math.floor(ats));

  const hurryLeftText = useMemo(() => {
    if (maxQty > 0 && maxQty < 2) return `Only ${maxQty} left`;
    return "";
  }, [maxQty]);

  // keep quantity within [ (stock>0 ? 1 : 0), stock ] whenever variant/stock changes
  useEffect(() => {
    setQuantity((q) => {
      const min = maxQty > 0 ? 1 : 0;
      const clamped = Math.min(Math.max(q ?? min, min), maxQty);
      return clamped;
    });
  }, [maxQty]);

  const lowInventoryText = useMemo(() => {
    return (
      selectedVariant?.c_lowInventoryMessage ||
      rawVariant?.c_lowInventoryMessage ||
      ""
    );
  }, [
    selectedVariant?.c_lowInventoryMessage,
    rawVariant?.c_lowInventoryMessage,
  ]);

  const handleAddToCart = async () => {
    try {
      setIsAdding(true);
      const pid = selectedVariant?.id || product?.id;
      if (!pid) return;

      if (maxQty === 0) {
        // toast.info("Selected size is out of stock.");
        return;
      }

      const line = findCartLine(pid);
      const safeQty = Math.min(quantity || 1, maxQty);

      if (line) {
        const next = safeQty;
        // ✅ Optimistic UI: Open sidebar immediately
        handleShow();
        await updateItemQuantity(line.itemId, next);
        // toast.success("Cart updated");
      } else {
        await addToBasket(pid, safeQty);
        // await refreshCartFromAPI(); // handled in store
        // toast.success("Added to cart");
        // handleShow(); // handled in store
      }

      // Track add_to_cart event
      const productToTrack = {
        productId: pid,
        productName: product.name,
        price: selectedVariant.price || product.price,
        basePrice: product.mrp || selectedVariant.price,
        priceAfterItemDiscount: selectedVariant.price || product.price,
        category: product.category || product.categoryId || "",
        categoryId: product.categoryId || "",
        variantId: selectedVariant.id,
        size: selectedVariant.size || "",
        color: selectedVariant.color || "",
        image: selectedVariant.image || product.image || "",
        currency: CURRENCY_SYMBOL,
      };

      console.log("Tracking add_to_cart with data:", productToTrack);

      // Track add to cart for Einstein Commerce Cloud
      trackEinsteinAddToCart([
        {
          id: pid,
          price: selectedVariant.price || product.price,
          originalPrice: product.mrp || selectedVariant.mrp,
          quantity: safeQty,
        },
      ]);
      trackAddToCart(productToTrack, safeQty, productToTrack.currency);
    } catch (e) {
      // toast.error("Failed to add to cart");
    } finally {
      setIsAdding(false);
    }
  };

  // keep PDP quantity in sync with the cart line for this variant
  useEffect(() => {
    const pid = selectedVariant?.id || product?.id;
    if (!pid) return;

    const line =
      (basket?.productItems || []).find((li) => li?.productId === pid) || null;

    if (line) {
      // if item is in cart, mirror its quantity (clamped by stock)
      const q = Math.max(1, Math.min(Number(line.quantity || 1), maxQty));
      setQuantity(q);
    } else {
      // if not in cart, show default (1 if in stock else 0)
      setQuantity(maxQty > 0 ? 1 : 0);
    }
    // re-run whenever cart items, selection, or stock cap changes
  }, [basket?.productItems, selectedVariant?.id, product?.id, maxQty]);

  const customerEmail = user?.email || null;

  const handleOpenReviewModal = async () => {
    if (!isAuthenticated) {
      // toast.info("Please login to write a review");
      setModalType("LOGIN");
      setShowLoginFlow(true);
      // navigate("/main-login");
      return;
    }

    if (
      !product?.id
      //  || !customerEmail
    ) {
      // toast.error("Missing review details. Please try again.");
      return;
    }

    try {
      setIsCheckingReview(true);

      // Check if item bought
      const orderCheckResp = await itemOrderCheck({
        productId: product.id,
      });

      if (!orderCheckResp?.isItemBought) {
        // toast.info("Buy product to write a review.");
        return;
      }

      const resp = await checkHasReview({
        productId: product.id,
        authorEmail: customerEmail,
      });

      if (resp?.hasReview) {
        // toast.info("You already reviewed this product.");
        return;
      }

      setIsReviewOpen(true);
    } catch (e) {
      // toast.error(e.message || "Could not check review status.");
    } finally {
      setIsCheckingReview(false);
    }
  };

  const handleOpenReviewModalCustom = async () => {
    if (!isAuthenticated) {
      setModalType("LOGIN");
      setShowLoginFlow(true);
      return;
    }

    if (!product?.id) {
      return;
    }

    try {
      setIsCheckingReview(true);

      const userId = user?.email || "guest";
      console.log(userId);

      const productId = product.variants[0]?.id;

      const eligibilityUrl =
        `${import.meta.env.VITE_WALLET_API_URL}/api/reviews/eligibility` +
        `?userId=${userId}` +
        `&productId=${productId}` +
        `&siteId=${import.meta.env.VITE_SFCC_SITE_ID}`;

      const response = await fetch(eligibilityUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer my-static-token-123`,
        },
      });

      const data = await response.json();

      console.log("Review eligibility response:", data);

      if (!response.ok) {
        return;
      }

      // Adjust these keys based on your API response
      if (data?.eligible === false || data?.isEligible === false) {
        // toast.info(data?.message || "Buy product to write a review.");
        return;
      }

      if (data?.hasReview === true || data?.alreadyReviewed === true) {
        // toast.info("You already reviewed this product.");
        return;
      }

      setIsReviewOpen(true);
    } catch (e) {
      console.error("Review eligibility API failed:", e);
      // toast.error(e.message || "Could not check review eligibility.");
    } finally {
      setIsCheckingReview(false);
    }
  };

  const handleExchange = async () => {
    // console.log("handleExchange triggered");
    // console.log("selectedVariant:", selectedVariant);
    // console.log("orderId:", orderId);
    if (!selectedVariant?.id) {
      // console.error("No selected variant ID");
      return;
    }
    if (!orderId) {
      // console.error("Missing order ID for exchange.");
      // toast.error("Missing order ID for exchange.");
      return;
    }
    // Retrieve extra data passed from previous step (Reason, Desc, Media)
    // :white_tick: CHANGED: Read from Zustand Store (exchangeContext) instead of sessionStorage
    // Fallback? If store is empty, maybe fallback to generics, but ideally store should have data.
    const reason = exchangeContext?.reason || "Size Change";
    const description = exchangeContext?.description || "Size issue";
    const mediaNames = exchangeContext?.images || []; // Store has names only
    const mediaLinks = Array.isArray(mediaNames) ? mediaNames : []; // API expects array of strings (names/urls)
    // subOrderId in context is used as the old Item ID in ReturnExchangeForm logic
    const storeOldItemId = exchangeContext?.subOrderId;
    // Priority: URL > Store > Fetch > Session (legacy)
    const oldVariantId =
      oldItemId ||
      storeOldItemId ||
      fetchedOldItemId ||
      sessionStorage.getItem("exchange_item_id");
    // console.log("oldVariantId:", oldVariantId);
    if (!oldVariantId) {
      // console.error("Missing old item ID for exchange");
      // toast.error("Missing details for exchange product");
      return;
    }
    try {
      // console.log("Calling exchange_same_item API...");
      setIsAdding(true); // Reuse adding state or create new one
      const isDiff = actionType === "EXCHANGE-DIFFERENT";
      const payload = {
        orderId,
        itemId: oldVariantId,
        reason,
        description,
        mediaLinks,
        exchangeItemId: selectedVariant.id,
        actionType,
        exchangeData: isDiff ? { quantity: 1 } : {}, // :white_tick: Add quantity for different item
      };
      // console.log("Payload:", payload);
      const resp = await exchange_same_item({ payload });
      console.log("API Response:", resp);
      if (resp?.success) {
        // :white_tick: Handle Basket response (Exchange Different) -> Exchange Checkout
        if (resp.result?.basket || resp?.data?.result?.basket) {
          const basketId =
            resp.result?.basket?.basketId ||
            resp?.data?.result?.basket?.basketId;
          if (basketId) {
            navigate(`/exchange/${basketId}`, {
              state: resp.result || resp.data?.result,
            });
          } else {
            // Fallback if no ID found (shouldn't happen)
            navigate("/cart");
          }
          return;
        }
        // :white_tick: Handle Direct Order (Exchange Same) -> Summary
        const newOrderId =
          resp.result?.newOrderId || resp.data?.result?.newOrderId;
        if (newOrderId) {
          // toast.success("Exchange request created successfully!");
          // navigate(`/ordersummary/${newOrderId}`);
          navigate(`/thankyou?orderId=${newOrderId}`);
        } else {
          // console.warn("Success but no newOrderId/basket found in result:", resp);
          // Fallback navigation or message?
          // navigate(`/ordersummary/${orderId}`);
          navigate(`/thankyou?orderId=${orderId}`);
        }
      } else {
        // console.error("Exchange API failed response:", resp);
        // toast.error(resp?.message || "Exchange failed.");
      }
    } catch (error) {
      // console.error("Exchange API Error:", error);
      // toast.error(error.message || "Something went wrong processing exchange.");
    } finally {
      setIsAdding(false);
    }
  };

  const isOutOfStock = maxQty === 0;
  const isMaxReached = maxQty > 0 && quantity >= maxQty;

  const qtyTipLabel = isOutOfStock
    ? "Out of stock"
    : isMaxReached
      ? `Only ${maxQty} left`
      : "";

  const openQtyTip = () => {
    setQtyTipOpen(true);

    if (qtyTipTimerRef.current) clearTimeout(qtyTipTimerRef.current);
    qtyTipTimerRef.current = setTimeout(() => {
      setQtyTipOpen(false);
    }, 1200);
  };

  const [liveViews, setLiveViews] = useState(26);
  const soldIdentity = product?.id || id; // after product loads
  const soldKey = `sold_count_${soldIdentity}`;
  const soldLastKey = `sold_last_update_${soldIdentity}`;

  const [soldCount, setSoldCount] = useState(() => {
    const stored = localStorage.getItem(soldKey);
    return stored ? Number(stored) : 88;
  });

  useEffect(() => {
    // console.log("PDP sold keys:", soldKey, soldLastKey);
  }, [soldKey, soldLastKey]);

  useEffect(() => {
    const today = new Date().toDateString();
    const lastUpdate = localStorage.getItem(soldLastKey);

    if (lastUpdate !== today) {
      const increment = Math.floor(Math.random() * 2) + 1; // 1-2

      setSoldCount((prev) => {
        const updated = prev + increment;
        localStorage.setItem(soldKey, String(updated));
        return updated;
      });

      localStorage.setItem(soldLastKey, today);
    } else {
      const stored = localStorage.getItem(soldKey);
      if (stored) setSoldCount(Number(stored));
    }
  }, [id]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveViews((prev) => {
        const change = Math.floor(Math.random() * 7) - 3; // -3..+3
        return Math.max(5, prev + change);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) return <ShimmerProductDetails />;

  //   /* ----------------- Prices + currency ----------------- */
  // Determine Prices based on tieredPrices if available
  let salePrice =
    product?.priceRanges[1]?.maxPrice ??
    selectedVariant?.price ??
    product.price ??
    0;
  let mrp =
    product?.priceRanges[0]?.maxPrice ??
    selectedVariant?.mrp ??
    product.mrp ??
    salePrice;

  if (rawVariant?.tieredPrices?.length === 2) {
    const listPriceObj = rawVariant.tieredPrices.find((tp) =>
      tp.pricebook.includes("listprice"),
    );
    const salePriceObj = rawVariant.tieredPrices.find((tp) =>
      tp.pricebook.includes("saleprice"),
    );

    if (listPriceObj && salePriceObj) {
      mrp = listPriceObj.price;
      salePrice = salePriceObj.price;
    }
  }

  const off = pctOff(mrp, salePrice);

  const showPrice = (amount) =>
    `${CURRENCY_SYMBOL ? CURRENCY_SYMBOL + " " : ""}${amount ?? 0}`;

  // ✅✅✅ TEMP: STATIC DATA FOR TESTING (REMOVE LATER)
  // const testModelMeasurementHtml = `
  //   Height: 5'9" · Bust: 32" · Waist: 24" · Hips: 35" Model wears size S
  // `;

  // ✅ TEMP override for testing UI (remove when API is ready)
  // const modelMeasurementHtml = testModelMeasurementHtml;
  // const modelMeasurementHtml = "";
  const modelMeasurementHtml = product?.shortDescription;

  const ratingValue = Number(productReviews?.averageRating || 0).toFixed(1);

  const shouldShowStickyBar =
    isMobile &&
    !isSizeOpen &&
    !isReviewOpen &&
    !isImageModalOpen &&
    !showLoginFlow &&
    !showCartModal;

  const returnTo = location.state?.returnTo;

  const offers =
    product?.c_promotions?.filter((promo) => promo?.callout)?.filter(Boolean) ||
    [];

  // console.log(selectedVariant, maxQty, isAdding)

  return (
    <Box>
      {/* Breadcrumb */}
      {isHidden ? null : (
        <Container
          maxW="full"
          px={{ base: "12px", lg: "50px" }}
          pt={2}
          fontSize={{ base: "8px", lg: "xs" }}
        >
          <Breadcrumb spacing="10px" separator={<Text> / </Text>}>
            <BreadcrumbItem>
              <BreadcrumbLink
                textTransform="uppercase"
                onClick={() => navigate("/")}
              >
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbItem>
              <BreadcrumbLink
                textTransform="uppercase"
                onClick={() => {
                  if (returnTo) {
                    sessionStorage.setItem("__BACK_FROM_PDP__", "1");
                    if (backQueryKey)
                      sessionStorage.setItem(
                        "__BACK_FROM_PDP_QUERYKEY__",
                        backQueryKey,
                      );
                    if (backScrollY)
                      sessionStorage.setItem(
                        "__BACK_FROM_PDP_SCROLLY__",
                        String(backScrollY),
                      );
                    const bp = Number(location.state?.backPage || 1);
                    sessionStorage.setItem(
                      "__BACK_FROM_PDP_PAGE__",
                      String(bp),
                    );

                    navigate(returnTo);
                  } else {
                    navigate(-1);
                  }
                }}
              >
                {categoryLabel}
              </BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbItem isCurrentPage>
              {/* Mobile: truncated */}
              <Text
                color="black"
                fontWeight="semibold"
                isTruncated
                maxW="150px"
                display={{ base: "block", lg: "none" }}
              >
                {product.name}
              </Text>

              {/* Desktop / tablet: full text */}
              <Text
                color="black"
                fontWeight="semibold"
                display={{ base: "none", lg: "block" }}
              >
                {product.name}
              </Text>
            </BreadcrumbItem>
          </Breadcrumb>
        </Container>
      )}
      {/* Main */}
      <Container
        maxW="full"
        px={{ base: "12px", lg: "50px" }}
        py={{ base: 2, lg: 6 }}
      >
        <Grid
          templateColumns={{ base: "1fr", lg: "2fr 1fr" }}
          gap={{ base: 0, lg: 5 }}
        >
          {/* LEFT: images */}
          <GridItem id="product-img">
            <VStack align="stretch" gap={0}>
              {/* DESKTOP/TABLET: Left thumbs + Right main */}
              <Grid
                templateColumns={{ base: "1fr", lg: "120px 1fr" }}
                gap={{ base: 0, lg: 3 }}
                display={{ base: "none", lg: "grid" }}
                alignItems="start"
                h={{ lg: "150vh" }}
              >
                {/* Thumbnails (left column) */}
                <Box
                  h="100%"
                  overflowY="auto"
                  className="scrollbar-hide"
                  pr="6px"
                  sx={{
                    "&::-webkit-scrollbar": { width: "4px" },
                    "&::-webkit-scrollbar-thumb": {
                      background: "rgba(0,0,0,0.25)",
                    },
                    "&::-webkit-scrollbar-track": { background: "transparent" },
                  }}
                >
                  <VStack spacing={2} align="stretch">
                    {safeImages.map((img, i) => {
                      const isActive = i === activeImgIdx;
                      return (
                        <Box
                          key={i}
                          cursor="pointer"
                          border="1px solid"
                          borderColor={isActive ? "black" : "transparent"}
                          p="2px"
                          onClick={() => goToImg(i)}
                        >
                          <AspectRatio ratio={3 / 4} w="full">
                            <Image
                              src={img.src}
                              alt={img.alt || `Thumbnail ${i + 1}`}
                              objectFit="cover"
                              draggable={false}
                            />
                          </AspectRatio>
                        </Box>
                      );
                    })}
                  </VStack>
                </Box>

                {/* Main Image (right) */}
                <Box position="relative">
                  <AspectRatio ratio={3 / 4} w="full" h="150vh">
                    <Image
                      src={safeImages[activeImgIdx]?.src}
                      alt={safeImages[activeImgIdx]?.alt || "Product image"}
                      objectFit="cover"
                      objectPosition="top"
                      draggable={false}
                      cursor="zoom-in"
                      onClick={() => openModalAt(activeImgIdx)}
                    />
                  </AspectRatio>

                  {/* Prev / Next overlay buttons */}
                  <Button
                    onClick={prevImg}
                    position="absolute"
                    left="12px"
                    top="50%"
                    transform="translateY(-50%)"
                    bg="black"
                    color="white"
                    borderRadius="50%"
                    minW="30px"
                    h="30px"
                    p={0}
                    _hover={{ bg: "black" }}
                    _active={{ bg: "black" }}
                    aria-label="Previous image"
                  >
                    <MdOutlineKeyboardArrowLeft size={24} />
                  </Button>

                  <Button
                    onClick={nextImg}
                    position="absolute"
                    right="12px"
                    top="50%"
                    transform="translateY(-50%)"
                    bg="black"
                    color="white"
                    borderRadius="50%"
                    minW="30px"
                    h="30px"
                    p={0}
                    _hover={{ bg: "black" }}
                    _active={{ bg: "black" }}
                    aria-label="Next image"
                  >
                    <MdOutlineKeyboardArrowRight size={24} />
                  </Button>
                </Box>
              </Grid>

              {/* MOBILE */}
              <Box display={{ base: "block", lg: "none" }}>
                <Box
                  position="relative"
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                >
                  <AspectRatio ratio={3 / 4} w="full" h="full" mb="1px">
                    <Image
                      src={safeImages[activeImgIdx]?.src}
                      alt={safeImages[activeImgIdx]?.alt || "Product image"}
                      objectFit="cover"
                      draggable={false}
                      cursor="zoom-in"
                      onClick={() => openModalAt(activeImgIdx)}
                    />
                  </AspectRatio>
                  {showIndicators ? (
                    <Flex
                      pos="absolute"
                      bottom="14px"
                      left="50%"
                      transform="translateX(-50%)"
                      gap="8px"
                      align="center"
                      justify="center"
                      zIndex={2}
                      pointerEvents="auto"
                    >
                      {safeImages.map((img, i) => {
                        const isActiveDot = i === activeImgIdx;
                        return (
                          <Box
                            key={`pdp-dot-${i}`}
                            w={isActiveDot ? "18px" : "8px"}
                            h="8px"
                            borderRadius="999px"
                            bg={isActiveDot ? "white" : "whiteAlpha.600"}
                            transition="all 0.25s ease"
                            cursor="pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              goToImg(i);
                            }}
                          />
                        );
                      })}
                    </Flex>
                  ) : null}
                </Box>

                {/* Mobile thumbs (same as you have) */}
                <Flex
                  ref={mobileThumbsRef}
                  gap="1px"
                  overflowX="auto"
                  css={{
                    "&::-webkit-scrollbar": { display: "none" },
                    msOverflowStyle: "none",
                    scrollbarWidth: "none",
                  }}
                >
                  {safeImages.map((img, i) => {
                    const isActive = i === activeImgIdx;
                    return (
                      <Box
                        key={i}
                        flexShrink={0}
                        w="25%"
                        overflow="hidden"
                        cursor="pointer"
                        border={
                          isActive ? "1px solid black" : "1px solid transparent"
                        }
                        onClick={() => goToImg(i)}
                      >
                        <AspectRatio ratio={3 / 4}>
                          <Image
                            src={img.src}
                            alt={img.alt || `Thumb ${i + 1}`}
                            objectFit="cover"
                          />
                        </AspectRatio>
                      </Box>
                    );
                  })}
                </Flex>
              </Box>
            </VStack>
          </GridItem>

          {/* RIGHT: info */}
          <GridItem
            h={{ base: "auto", lg: "150vh" }} // ✅ desktop height fixed
            overflowY={{ base: "visible", lg: "auto" }} // ✅ scroll only on desktop
            className="scrollbar-hide"
            position="sticky"
            top="0"
          >
            <VStack align="stretch">
              <div id="ProductId" hidden>
                {id}
              </div>
              <Heading
                //  display={{base:"none", lg:"block"}}
                fontWeight="400"
                fontSize={{ base: "2xl", md: "3xl", lg: "4xl" }}
                lineHeight="short"
                // textTransform={"uppercase"}
                mt={{ base: 4, lg: 0 }}
                mb={{ base: -4, lg: 0 }}
                flex="1"
                pr={2}
              >
                {product?.title}
              </Heading>
              <Flex align="flex-start" w="full">
                <Heading
                  id="product-name"
                  size="md"
                  fontWeight="semibold"
                  fontSize={{ base: "14px", lg: "18px" }}
                  lineHeight="short"
                  mt={{ base: 4, lg: 0 }}
                  mb={-1}
                  flex="1"
                  pr={2}
                >
                  {product.name}
                </Heading>

                {Number(ratingValue) > 0 && (
                  <HStack
                    bg="black"
                    color="white"
                    px="8px"
                    h="26px"
                    borderRadius="0"
                    spacing={2}
                    mt={{ base: 4, lg: 0 }}
                    mb={-2}
                    ml="auto"
                    flexShrink={0}
                    align="center"
                    justify="center"
                  >
                    <Box as="span" lineHeight={0} display="inline-flex">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z"
                          fill="white"
                        />
                      </svg>
                    </Box>
                    <Text fontSize="sm" fontWeight="semibold">
                      {ratingValue}
                    </Text>
                  </HStack>
                )}
              </Flex>

              {/* 
              <HStack align="center" id="product-price-div">
                <Text fontSize="base" id="product-price">{showPrice(salePrice)}</Text>
                {mrp && mrp > salePrice && (
                  <>
                    <Text as="s" color="gray.600">
                      {showPrice(mrp)}
                    </Text>
                    {off ? <Badge colorScheme="green">{off}% OFF</Badge> : null}
                  </>
                )}
              </HStack>
              <Text color="gray.600" fontSize="11px" mt="-2">
                (Incl. taxes)
              </Text> */}

              <HStack
                align="center"
                justify="space-between"
                id="product-price-div"
              >
                <HStack align="center" spacing={2} mt={{ base: -2, lg: 0 }}>
                  <Text
                    fontSize="13px"
                    fontWeight={"semibold"}
                    id="product-price"
                  >
                    {showPrice(salePrice)}
                  </Text>

                  {mrp && mrp > salePrice && (
                    <>
                      <Text as="s" color="blackAlpha.400" fontSize="13px">
                        {mrp}
                      </Text>
                      {off ? (
                        <Badge colorScheme="green" fontSize="11px">
                          {off}% OFF
                        </Badge>
                      ) : null}
                    </>
                  )}
                </HStack>
              </HStack>

              <Text color="gray.600" fontSize="11px" mt="-2">
                Taxes calculated at checkout
              </Text>

              {/* {product.shortDescription && (
                <Box
                  color="gray.700"
                  lineHeight="tall"
                  dangerouslySetInnerHTML={{ __html: product.shortDescription }}
                />
              )} */}

              {modelMeasurementHtml && (
                <Box mt={4}>
                  <Text
                    fontWeight="400"
                    letterSpacing="0.04em"
                    textTransform="uppercase"
                    // mb={1}
                    lineHeight="22px"
                  >
                    MODEL MEASUREMENTS
                  </Text>

                  <Box
                    mt="6px"
                    mb={1}
                    fontSize="13px"
                    color="rgba(0,0,0,0.65)"
                    lineHeight="18px"
                    dangerouslySetInnerHTML={{
                      __html: modelMeasurementHtml,
                    }}
                  />
                </Box>
              )}

              <div id="product-category" hidden>
                <p>{product.primaryCategoryId}</p>
              </div>

              {/* SIZE */}
              {product.sizeOptions?.length ? (
                <Box display={{ base: "none", lg: "block" }}>
                  <HStack justify="space-between" mb={1}>
                    <Text fontSize={"sm"}>SELECT SIZE</Text>

                    <Tooltip
                      label="Size Guide"
                      display={{ base: "none", lg: "block" }}
                      placement="top"
                      borderRadius="0"
                      bg="white"
                      color="black"
                      fontSize="10px"
                      px={2}
                      py={1}
                      boxShadow="none"
                      isOpen={isMobile ? sizeTipOpen : undefined} // ✅ mobile controlled
                      onClose={closeSizeTip}
                      closeOnClick={true}
                      shouldWrapChildren
                    >
                      <Button
                        variant="link"
                        size="sm"
                        onClick={(e) => {
                          if (isMobile) {
                            e.preventDefault();
                            e.stopPropagation();
                            setSizeTipOpen(false);
                          }
                          setIsSizeOpen(true);
                        }}
                        onTouchStart={() => {
                          if (isMobile) setSizeTipOpen(true);
                        }}
                        p={0}
                      >
                        <VStack spacing="2px">
                          {/* ✅ Text ONLY on mobile & below icon */}
                          <Text
                            fontSize="10px"
                            display={{ base: "block", lg: "none" }}
                            lineHeight="1"
                            mb={1}
                            fontWeight={800}
                            color={"black"}
                          >
                            Size Guide
                          </Text>
                          <img
                            src={scaleIcon}
                            alt="Scale Icon"
                            style={{ height: "20px" }}
                          />
                        </VStack>
                      </Button>
                    </Tooltip>
                  </HStack>

                  <Wrap spacing={2} id="size-btn">
                    {product.sizeOptions.map((s) => {
                      const isAvailable = s.orderable !== false;
                      const isSelected = selectedVariant?.size === s.value;
                      return (
                        <WrapItem key={s.id}>
                          <Button
                            size="sm"
                            w="50px"
                            h="29px"
                            borderRadius="0"
                            backgroundColor={
                              isSelected ? "black" : "transparent"
                            }
                            color={
                              isSelected
                                ? "white"
                                : isAvailable
                                  ? "black"
                                  : "gray.400"
                            }
                            border="1px"
                            borderColor="black"
                            variant={isSelected ? "solid" : "outline"}
                            onClick={() =>
                              isAvailable &&
                              handleVariantChange("size", s.value)
                            }
                            _hover={{
                              bg: isAvailable
                                ? isSelected
                                  ? "black"
                                  : "transparent"
                                : "transparent",
                              cursor: isAvailable ? "pointer" : "not-allowed",
                            }}
                            _active={{
                              bg: isSelected ? "black" : "transparent",
                            }}
                            isDisabled={!isAvailable}
                            position="relative"
                          >
                            {s.name}
                            {!isAvailable && (
                              <Box
                                position="absolute"
                                top="50%"
                                left="50%"
                                w="80%"
                                h="1px"
                                bg="gray.400"
                                transform="translate(-50%, -50%) rotate(-20deg)"
                              />
                            )}
                          </Button>
                        </WrapItem>
                      );
                    })}
                  </Wrap>

                  {hurryLeftText && (
                    <HStack mt={1} spacing={0}>
                      <Box as="span" lineHeight={0}>
                        {/* <svg width="14" height="18" viewBox="0 0 9 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2.73367 12.9193C1.81173 12.5286 1.19291 12.0035 0.731435 11.2757C-0.520071 9.34923 -0.138048 6.85689 1.66662 5.14607C2.2203 4.62094 2.81269 4.13592 3.36582 3.59675C4.24854 2.7481 4.60408 1.68375 4.3932 0.444376C4.37996 0.350082 4.37996 0.242246 4.36671 0C6.85598 2.02076 7.02706 4.6074 6.56611 7.42263C7.38261 7.00482 7.59349 6.53334 7.80437 4.68809C9.58258 7.28819 9.635 11.9221 6.18406 13C7.05354 11.3835 6.8824 9.99619 5.49897 8.79683C4.74818 8.16386 4.06305 7.51682 4.26072 6.34516C2.91802 7.36885 2.87877 8.78323 3.07595 10.3055C2.50953 9.95538 2.43059 9.48391 2.35163 8.97181C1.81171 10.2919 1.62732 11.5985 2.73366 12.9192L2.73367 12.9193Z" fill="#FF0004" />
                        </svg> */}
                      </Box>
                      <Text
                        fontSize="10px"
                        lineHeight="20px"
                        textTransform={"uppercase"}
                      >
                        {hurryLeftText}
                      </Text>
                    </HStack>
                  )}
                </Box>
              ) : null}

              {/* COLOR */}
              {product.colorOptions?.length ? (
                <Box>
                  <Text fontSize="sm" mt={2} mb={1}>
                    COLOR
                  </Text>
                  <Wrap>
                    {product.colorOptions.map((c) => (
                      <WrapItem key={c.id}>
                        <VStack align="flex-start" spacing={1}>
                          <Button
                            size="xs"
                            borderRadius="full"
                            bg={c.value || "transparent"}
                            border="1px"
                            borderColor="black"
                            variant={
                              selectedVariant?.color === c.value
                                ? "solid"
                                : "outline"
                            }
                            onClick={() =>
                              handleVariantChange("color", c.value)
                            }
                            _hover={{ bg: c.value || c.name || "transparent" }}
                            _active={{ bg: c.value || c.name || "transparent" }}
                            alignSelf="flex-start"
                          />
                          <Text fontSize="10px" textAlign="left">
                            {c.name}
                          </Text>
                        </VStack>
                      </WrapItem>
                    ))}
                  </Wrap>
                </Box>
              ) : null}

              {/* MATERIAL */}
              {product.materialOptions?.length ? (
                <Box>
                  <Text fontSize="sm" mt={2} mb={1}>
                    MATERIAL
                  </Text>
                  <Wrap>
                    {product.materialOptions.map((m) => (
                      <WrapItem key={m.id}>
                        <Button
                          size="sm"
                          fontSize="11px"
                          borderRadius="0"
                          fontWeight="normal"
                          backgroundColor="transparent"
                          border="1px"
                          borderColor="black"
                          variant={
                            selectedVariant?.material === m.value
                              ? "solid"
                              : "outline"
                          }
                          onClick={() =>
                            handleVariantChange("material", m.value)
                          }
                          _hover={{ bg: "transparent" }}
                          _active={{ bg: "transparent" }}
                        >
                          {m.name}
                        </Button>
                      </WrapItem>
                    ))}
                  </Wrap>
                </Box>
              ) : null}

              {/* CHECK DELIVERY */}
              <Box>
                <Text fontSize="sm" mt={2} mb={1} letterSpacing="wide">
                  CHECK DELIVERY
                </Text>

                <HStack spacing={0} align="stretch" maxW="300px">
                  <InputGroup flex="1">
                    <InputLeftElement pointerEvents="none">
                      <svg
                        width="12"
                        height="16"
                        viewBox="0 0 9 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <g opacity="0.5">
                          <path
                            d="M4.5 0C2.01839 0 0 2.01839 0 4.5C0 5.42805 0.377396 6.70474 0.819504 7.44828L4.2333 13.1897C4.26081 13.2359 4.29985 13.2741 4.34661 13.3007C4.39336 13.3273 4.44622 13.3413 4.5 13.3413C4.55378 13.3413 4.60664 13.3273 4.65339 13.3007C4.70015 13.2741 4.73919 13.2359 4.7667 13.1897L8.1805 7.44828C8.62261 6.70472 9 5.42805 9 4.5C9 2.01839 6.98161 0 4.5 0ZM4.5 0.62069C6.64616 0.62069 8.37931 2.35384 8.37931 4.5C8.37931 5.23984 7.99806 6.54282 7.64709 7.13309L4.5 12.4235L1.35291 7.13309C1.00195 6.54283 0.62069 5.23983 0.62069 4.5C0.62069 2.35384 2.35384 0.62069 4.5 0.62069ZM4.5 2.17241C3.21818 2.17241 2.17241 3.2182 2.17241 4.5C2.17241 5.78181 3.21819 6.82759 4.5 6.82759C5.78182 6.82759 6.82759 5.78181 6.82759 4.5C6.82759 3.2182 5.78182 2.17241 4.5 2.17241ZM4.5 2.7931C5.44637 2.7931 6.2069 3.55365 6.2069 4.5C6.2069 5.44637 5.44637 6.2069 4.5 6.2069C3.55363 6.2069 2.7931 5.44637 2.7931 4.5C2.7931 3.55365 3.55363 2.7931 4.5 2.7931Z"
                            fill="#1D1D1D"
                          />
                        </g>
                      </svg>
                    </InputLeftElement>
                    <Input
                      value={pincode}
                      onChange={(e) => {
                        const value = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 6);
                        setPincode(value);
                      }}
                      placeholder="Enter your pincode"
                      _placeholder={{
                        color: "rgba(29, 29, 29, 0.5)",
                        fontWeight: "normal",
                      }}
                      borderRadius="0"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      h="40px"
                      borderColor="black"
                      _focus={{ boxShadow: "none", borderColor: "black" }}
                      _hover={{
                        borderColor: "black",
                        boxShadow: "none",
                        outline: "none",
                      }}
                      fontSize="xs"
                    />
                  </InputGroup>

                  <Button
                    onClick={handleCheckPincode}
                    borderRadius="0"
                    h="40px"
                    px={6}
                    bg="black"
                    color="white"
                    _hover={{ bg: "black" }}
                    isDisabled={isChecking}
                  >
                    {isChecking ? "Checking" : "Check"}
                  </Button>
                </HStack>

                {deliveryInfo && (
                  <Text
                    fontSize="xs"
                    mt={1}
                    color={deliveryInfo.isServicable ? "green.500" : "red.500"}
                  >
                    {deliveryInfo.isServicable
                      ? "Delivery available to this pincode."
                      : "Delivery is not available for this pincode."}
                  </Text>
                )}
              </Box>

              {/* Low stock banner */}
              {/* {lowInventoryText && (
                <HStack mt={3} spacing={2}>
                  <Box as="span" lineHeight={0}>
                    <svg width="9" height="13" viewBox="0 0 9 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.73367 12.9193C1.81173 12.5286 1.19291 12.0035 0.731435 11.2757C-0.520071 9.34923 -0.138048 6.85689 1.66662 5.14607C2.2203 4.62094 2.81269 4.13592 3.36582 3.59675C4.24854 2.7481 4.60408 1.68375 4.3932 0.444376C4.37996 0.350082 4.37996 0.242246 4.36671 0C6.85598 2.02076 7.02706 4.6074 6.56611 7.42263C7.38261 7.00482 7.59349 6.53334 7.80437 4.68809C9.58258 7.28819 9.635 11.9221 6.18406 13C7.05354 11.3835 6.8824 9.99619 5.49897 8.79683C4.74818 8.16386 4.06305 7.51682 4.26072 6.34516C2.91802 7.36885 2.87877 8.78323 3.07595 10.3055C2.50953 9.95538 2.43059 9.48391 2.35163 8.97181C1.81171 10.2919 1.62732 11.5985 2.73366 12.9192L2.73367 12.9193Z" fill="#1D1D1D" />
                    </svg>
                  </Box>
                  <Text fontSize="13.5px">{lowInventoryText}</Text>
                </HStack>
              )} */}

              <Box display={{ base: "none", lg: "block" }}>
                {/* Qty + Add to Cart + Wishlist */}
                <Flex align="center" gap={2} mb={2} w="full">
                  <HStack
                    border="1px"
                    borderColor="gray.800"
                    px={1}
                    h="45px"
                    minW="100px"
                    justify="space-between"
                  >
                    <Button
                      onClick={decQty}
                      variant="ghost"
                      size="sm"
                      w="24px"
                      fontSize="lg"
                      _hover={{ bg: "transparent" }}
                      isDisabled={
                        isUpdatingQty || quantity <= (maxQty > 0 ? 1 : 0)
                      }
                    >
                      –
                    </Button>
                    <Text fontWeight="semibold">{quantity}</Text>
                    <Tooltip
                      label={qtyTipLabel}
                      fontSize="9px"
                      px="6px"
                      py="4px"
                      borderRadius="0"
                      hasArrow
                      placement="top"
                      isOpen={isMobile ? qtyTipOpen : undefined} // ✅ mobile controlled
                      onClose={closeQtyTip}
                      closeOnClick
                      shouldWrapChildren
                    >
                      <Button
                        onClick={(e) => {
                          if (isMobile) {
                            e.preventDefault();
                            e.stopPropagation();
                            openQtyTip(); // ✅ ALWAYS show on mobile click
                          }

                          // ✅ if cannot increment, stop here
                          if (isOutOfStock || isMaxReached || isUpdatingQty)
                            return;

                          // ✅ normal increment
                          incQty();
                        }}
                        variant="ghost"
                        size="sm"
                        w="24px"
                        fontSize="lg"
                        _hover={{ bg: "transparent" }}
                        isDisabled={false}
                        opacity={
                          isUpdatingQty || isOutOfStock || isMaxReached
                            ? 0.4
                            : 1
                        }
                        cursor={
                          isUpdatingQty || isOutOfStock || isMaxReached
                            ? "not-allowed"
                            : "pointer"
                        }
                      >
                        +
                      </Button>
                    </Tooltip>
                  </HStack>

                  {/* Buy Now */}
                  {!isExchangeFlow && isHidden && (
                    <BuyNowButton
                      id="buy-now"
                      productId={selectedVariant?.id || product?.id}
                      quantity={quantity}
                      w="full"
                      h="45px"
                      borderRadius="0"
                      bg="black"
                      color="white"
                      _hover={{ bg: "black" }}
                      disabled={!selectedVariant?.orderable || maxQty === 0}
                      isOrderable={selectedVariant?.orderable !== false}
                      maxQty={maxQty}
                      isHidden={isHidden}
                    >
                      Buy Now
                    </BuyNowButton>
                  )}

                  {/* Add To Cart */}
                  {!isHidden &&
                    (isExchangeFlow ? (
                      <Button
                        id="exchange-btn"
                        flex="1"
                        h="45px"
                        borderRadius="0"
                        bg="black"
                        color="white"
                        _hover={{ bg: "black" }}
                        isDisabled={
                          !selectedVariant?.orderable ||
                          maxQty === 0 ||
                          isAdding
                        }
                        onClick={handleExchange}
                        isLoading={isAdding}
                        loadingText="Processing..."
                      >
                        Exchange
                      </Button>
                    ) : (
                      <Button
                        id="add-to-cart"
                        flex="1"
                        h="45px"
                        borderRadius="0"
                        variant="outline"
                        borderColor="gray.800"
                        fontWeight="semibold"
                        _hover={{ bg: "transparent" }}
                        _active={{ bg: "transparent" }}
                        onClick={handleAddToCart}
                        isLoading={isAdding}
                        loadingText="Adding..."
                        isDisabled={
                          !selectedVariant?.orderable ||
                          maxQty === 0 ||
                          isAddingToCart
                        }
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        gap={2}
                      >
                        <Box as="span" lineHeight={0} display="inline-flex">
                          {/* SVG */}
                        </Box>

                        <Text as="span">Add To Cart</Text>
                      </Button>
                    ))}

                  {/* {isExchangeFlow ? (
                    <Button
                      id="exchange-btn"
                      flex="1"
                      h="45px"
                      borderRadius="0"
                      bg="black"
                      color="white"
                      _hover={{ bg: "black" }}
                      isDisabled={!selectedVariant?.orderable || maxQty === 0 || isAdding}
                      onClick={handleExchange}
                      isLoading={isAdding}
                      loadingText="Processing..."
                    >
                      {actionType === "EXCHANGE-DIFFERENT" ? "Exchange" : "Exchange"}
                    </Button>
                  ) : (
                    <Button
                      id="add-to-cart"
                      flex="1"
                      h="45px"
                      borderRadius="0"
                      variant="outline"
                      borderColor="gray.800"
                      fontWeight="semibold"
                      _hover={{ bg: "transparent" }}
                      _active={{ bg: "transparent" }}
                      onClick={handleAddToCart}
                      isLoading={isAdding}
                      loadingText="Adding..."
                      isDisabled={
                        !selectedVariant?.orderable ||
                        maxQty === 0 ||
                        isAddingToCart
                      }
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      gap={2}
                    >
                      <Box as="span" lineHeight={0} display="inline-flex">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M13.1234 8.75V5C13.1234 4.1712 12.7942 3.37634 12.2081 2.79029C11.6221 2.20424 10.8272 1.875 9.9984 1.875C9.1696 1.875 8.37474 2.20424 7.78869 2.79029C7.20264 3.37634 6.8734 4.1712 6.8734 5V8.75M16.3367 7.08917L17.3892 17.0892C17.4476 17.6433 17.0142 18.125 16.4567 18.125H3.54007C3.40857 18.1251 3.27852 18.0976 3.15836 18.0442C3.03819 17.9908 2.93061 17.9127 2.84259 17.8151C2.75457 17.7174 2.68808 17.6023 2.64745 17.4772C2.60681 17.3521 2.59294 17.2199 2.60673 17.0892L3.66007 7.08917C3.68436 6.8588 3.79309 6.64558 3.96528 6.49063C4.13746 6.33568 4.36092 6.24996 4.59257 6.25H15.4042C15.8842 6.25 16.2867 6.6125 16.3367 7.08917ZM7.1859 8.75C7.1859 8.83288 7.15298 8.91237 7.09437 8.97097C7.03577 9.02958 6.95628 9.0625 6.8734 9.0625C6.79052 9.0625 6.71103 9.02958 6.65243 8.97097C6.59382 8.91237 6.5609 8.83288 6.5609 8.75C6.5609 8.66712 6.59382 8.58763 6.65243 8.52903C6.71103 8.47042 6.79052 8.4375 6.8734 8.4375C6.95628 8.4375 7.03577 8.47042 7.09437 8.52903C7.15298 8.58763 7.1859 8.66712 7.1859 8.75ZM13.4359 8.75C13.4359 8.83288 13.403 8.91237 13.3444 8.97097C13.2858 9.02958 13.2063 9.0625 13.1234 9.0625C13.0405 9.0625 12.961 9.02958 12.9024 8.97097C12.8438 8.91237 12.8109 8.83288 12.8109 8.75C12.8109 8.66712 12.8438 8.58763 12.9024 8.52903C12.961 8.47042 13.0405 8.4375 13.1234 8.4375C13.2063 8.4375 13.2858 8.47042 13.3444 8.52903C13.403 8.58763 13.4359 8.66712 13.4359 8.75Z"
                            stroke="black"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </Box>

                      <Text as="span">Add To Cart</Text>
                    </Button>
                  )} */}

                  {/* PDP Wishlist button (filled if in wishlist) */}
                  {!isHidden && (
                    <Button
                      id="wishlist-btn"
                      onClick={handleWishlist}
                      aria-label={
                        isWishlisted
                          ? "Remove from wishlist"
                          : "Add to wishlist"
                      }
                      variant="outline"
                      borderColor="gray.800"
                      h="45px"
                      w="48px"
                      borderRadius="0"
                      p={0}
                      isLoading={wishBusy}
                      _hover={{ bg: "transparent" }}
                      _active={{ bg: "transparent" }}
                    >
                      {isWishlisted ? (
                        <svg width="24" height="24" viewBox="0 0 24 24">
                          <path
                            d="M10.4107 19.9677C7.58942 17.858 2 13.0348 2 8.69444C2 5.82563 4.10526 3.5 7 3.5C8.5 3.5 10 4 12 6C14 4 15.5 3.5 17 3.5C19.8947 3.5 22 5.82563 22 8.69444C22 13.0348 16.4106 17.858 13.5893 19.9677C12.6399 20.6776 11.3601 20.6776 10.4107 19.9677Z"
                            stroke="black"
                            strokeWidth="1.5"
                            fill="black"
                          />
                        </svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24">
                          <path
                            d="M10.4107 19.9677C7.58942 17.858 2 13.0348 2 8.69444C2 5.82563 4.10526 3.5 7 3.5C8.5 3.5 10 4 12 6C14 4 15.5 3.5 17 3.5C19.8947 3.5 22 5.82563 22 8.69444C22 13.0348 16.4106 17.858 13.5893 19.9677C12.6399 20.6776 11.3601 20.6776 10.4107 19.9677Z"
                            stroke="black"
                            strokeWidth="1.5"
                            fill="none"
                          />
                        </svg>
                      )}
                    </Button>
                  )}
                </Flex>

                {/* Buy Now */}
                {!isExchangeFlow && !isHidden && (
                  <BuyNowButton
                    id="buy-now"
                    productId={selectedVariant?.id || product?.id}
                    quantity={quantity}
                    w="full"
                    h="45px"
                    borderRadius="0"
                    bg="black"
                    color="white"
                    _hover={{ bg: "black" }}
                    disabled={!selectedVariant?.orderable || maxQty === 0}
                    isOrderable={selectedVariant?.orderable !== false}
                    maxQty={maxQty}
                    isHidden={isHidden}
                  >
                    Buy Now
                  </BuyNowButton>
                )}
              </Box>

              {/* ✅ Mobile Bottom Sticky Bar (Qty + ATC + Wishlist + Buy Now) */}
              {shouldShowStickyBar && (
                <Portal>
                  <Box
                    position="fixed"
                    left={0}
                    right={0}
                    m
                    bottom={0}
                    zIndex={10}
                    bg="white"
                    borderTop="1px solid"
                    borderColor="blackAlpha.200"
                    px="12px"
                    py="6px"
                    pb="calc(6px + env(safe-area-inset-bottom))"
                    style={{ transform: "translateZ(0)" }}
                  >
                    {/* SIZE */}
                    {product.sizeOptions?.length ? (
                      <Box mb={2}>
                        <HStack justify="space-between">
                          <Text fontSize={"sm"}>SELECT SIZE</Text>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={(e) => {
                              if (isMobile) {
                                e.preventDefault();
                                e.stopPropagation();
                                setSizeTipOpen(false);
                              }
                              setIsSizeOpen(true);
                            }}
                            onTouchStart={() => {
                              if (isMobile) setSizeTipOpen(true);
                            }}
                            p={0}
                          >
                            <VStack spacing="2px">
                              {/* ✅ Text ONLY on mobile & below icon */}
                              <Text
                                fontSize="10px"
                                display={{ base: "block", lg: "none" }}
                                lineHeight="1"
                                mb={1}
                                fontWeight={800}
                                color={"black"}
                              >
                                Size Guide
                              </Text>
                              <img
                                src={scaleIcon}
                                alt="Scale Icon"
                                style={{ height: "20px" }}
                              />
                            </VStack>
                          </Button>
                        </HStack>

                        <Wrap spacing={2} id="size-btn">
                          {product.sizeOptions.map((s) => {
                            const isAvailable = s.orderable !== false;
                            const isSelected =
                              selectedVariant?.size === s.value;
                            return (
                              <WrapItem key={s.id}>
                                <Button
                                  size="sm"
                                  w="42px"
                                  h="24px"
                                  borderRadius="0"
                                  backgroundColor={
                                    isSelected ? "black" : "transparent"
                                  }
                                  color={
                                    isSelected
                                      ? "white"
                                      : isAvailable
                                        ? "black"
                                        : "gray.400"
                                  }
                                  // border="1px"
                                  // borderColor="blackAlpha.500"
                                  variant={isSelected ? "solid" : "outline"}
                                  onClick={() =>
                                    isAvailable &&
                                    handleVariantChange("size", s.value)
                                  }
                                  _hover={{
                                    bg: isAvailable
                                      ? isSelected
                                        ? "black"
                                        : "transparent"
                                      : "transparent",
                                    cursor: isAvailable
                                      ? "pointer"
                                      : "not-allowed",
                                  }}
                                  _active={{
                                    bg: isSelected ? "black" : "transparent",
                                  }}
                                  isDisabled={!isAvailable}
                                  position="relative"
                                >
                                  {s.name}
                                  {!isAvailable && (
                                    <Box
                                      position="absolute"
                                      top="50%"
                                      left="50%"
                                      w="80%"
                                      h="1px"
                                      bg="gray.400"
                                      transform="translate(-50%, -50%) rotate(-20deg)"
                                    />
                                  )}
                                </Button>
                              </WrapItem>
                            );
                          })}
                        </Wrap>

                        {hurryLeftText && (
                          <HStack mt={1} spacing={0}>
                            <Box as="span" lineHeight={0}>
                              {/* <svg width="14" height="18" viewBox="0 0 9 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2.73367 12.9193C1.81173 12.5286 1.19291 12.0035 0.731435 11.2757C-0.520071 9.34923 -0.138048 6.85689 1.66662 5.14607C2.2203 4.62094 2.81269 4.13592 3.36582 3.59675C4.24854 2.7481 4.60408 1.68375 4.3932 0.444376C4.37996 0.350082 4.37996 0.242246 4.36671 0C6.85598 2.02076 7.02706 4.6074 6.56611 7.42263C7.38261 7.00482 7.59349 6.53334 7.80437 4.68809C9.58258 7.28819 9.635 11.9221 6.18406 13C7.05354 11.3835 6.8824 9.99619 5.49897 8.79683C4.74818 8.16386 4.06305 7.51682 4.26072 6.34516C2.91802 7.36885 2.87877 8.78323 3.07595 10.3055C2.50953 9.95538 2.43059 9.48391 2.35163 8.97181C1.81171 10.2919 1.62732 11.5985 2.73366 12.9192L2.73367 12.9193Z" fill="#FF0004" />
                        </svg> */}
                            </Box>
                            <Text
                              fontSize="10px"
                              lineHeight="20px"
                              textTransform={"uppercase"}
                            >
                              {hurryLeftText}
                            </Text>
                          </HStack>
                        )}
                      </Box>
                    ) : null}

                    {/* Row 1: Qty + Add to Cart + Wishlist */}
                    <HStack align="center" spacing={2}>
                      <HStack
                        border="1px"
                        borderColor="gray.800"
                        h="35px"
                        minW="70px"
                        justify="space-between"
                        bg="white"
                      >
                        <Button
                          onClick={decQty}
                          variant="ghost"
                          size="xs"
                          px={"0"}
                          fontSize="lg"
                          _hover={{ bg: "transparent" }}
                          isDisabled={
                            isUpdatingQty || quantity <= (maxQty > 0 ? 1 : 0)
                          }
                        >
                          –
                        </Button>

                        <Text fontWeight="semibold" fontSize="sm">
                          {quantity}
                        </Text>

                        <Tooltip
                          label={qtyTipLabel}
                          fontSize="9px"
                          px="6px"
                          py="4px"
                          borderRadius="0"
                          hasArrow
                          placement="top"
                          isOpen={qtyTipOpen} // ✅ mobile controlled always
                          onClose={closeQtyTip}
                          closeOnClick
                          shouldWrapChildren
                        >
                          <Button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();

                              // ✅ show tooltip always on tap
                              openQtyTip();

                              if (isOutOfStock || isMaxReached || isUpdatingQty)
                                return;
                              incQty();
                            }}
                            variant="ghost"
                            size="xs"
                            px={"0"}
                            fontSize="lg"
                            _hover={{ bg: "transparent" }}
                            opacity={
                              isUpdatingQty || isOutOfStock || isMaxReached
                                ? 0.4
                                : 1
                            }
                            cursor={
                              isUpdatingQty || isOutOfStock || isMaxReached
                                ? "not-allowed"
                                : "pointer"
                            }
                          >
                            +
                          </Button>
                        </Tooltip>
                      </HStack>

                      {!isExchangeFlow && isHidden && (
                        <BuyNowButton
                          id="buy-now-mobile"
                          productId={selectedVariant?.id || product?.id}
                          quantity={quantity}
                          w="full"
                          h="35px"
                          fontSize="sm"
                          borderRadius="0"
                          borderColor="black"
                          bg="black"
                          color="white"
                          _hover={{ bg: "black" }}
                          disabled={!selectedVariant?.orderable || maxQty === 0}
                          isOrderable={selectedVariant?.orderable !== false}
                          maxQty={maxQty}
                          isHidden={isHidden}
                        >
                          Buy Now
                        </BuyNowButton>
                      )}

                      {!isHidden &&
                        (isExchangeFlow ? (
                          <Button
                            id="exchange-btn"
                            flex="1"
                            h="45px"
                            borderRadius="0"
                            bg="black"
                            color="white"
                            _hover={{ bg: "black" }}
                            isDisabled={
                              !selectedVariant?.orderable ||
                              maxQty === 0 ||
                              isAdding
                            }
                            onClick={handleExchange}
                            isLoading={isAdding}
                            loadingText="Processing..."
                          >
                            {actionType === "EXCHANGE-DIFFERENT"
                              ? "Exchange"
                              : "Exchange"}
                          </Button>
                        ) : (
                          <Button
                            id="add-to-cart"
                            flex="1"
                            h="35px"
                            borderRadius="0"
                            variant="outline"
                            borderColor="gray.800"
                            fontSize="sm"
                            fontWeight="semibold"
                            _hover={{ bg: "transparent" }}
                            _active={{ bg: "transparent" }}
                            onClick={handleAddToCart}
                            isLoading={isAdding}
                            loadingText="Adding..."
                            isDisabled={
                              !selectedVariant?.orderable ||
                              maxQty === 0 ||
                              isAddingToCart
                            }
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            gap={2}
                          >
                            <Box as="span" lineHeight={0} display="inline-flex">
                              {/* same svg */}
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 20 20"
                                fill="none"
                              >
                                <path
                                  d="M13.1234 8.75V5C13.1234 4.1712 12.7942 3.37634 12.2081 2.79029C11.6221 2.20424 10.8272 1.875 9.9984 1.875C9.1696 1.875 8.37474 2.20424 7.78869 2.79029C7.20264 3.37634 6.8734 4.1712 6.8734 5V8.75M16.3367 7.08917L17.3892 17.0892C17.4476 17.6433 17.0142 18.125 16.4567 18.125H3.54007C3.40857 18.1251 3.27852 18.0976 3.15836 18.0442C3.03819 17.9908 2.93061 17.9127 2.84259 17.8151C2.75457 17.7174 2.68808 17.6023 2.64745 17.4772C2.60681 17.3521 2.59294 17.2199 2.60673 17.0892L3.66007 7.08917C3.68436 6.8588 3.79309 6.64558 3.96528 6.49063C4.13746 6.33568 4.36092 6.24996 4.59257 6.25H15.4042C15.8842 6.25 16.2867 6.6125 16.3367 7.08917Z"
                                  stroke="black"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </Box>
                            <Text as="span">Add To Cart</Text>
                          </Button>
                        ))}

                      {!isHidden && (
                        <Button
                          id="wishlist-btn-mobile"
                          onClick={handleWishlist}
                          aria-label={
                            isWishlisted
                              ? "Remove from wishlist"
                              : "Add to wishlist"
                          }
                          variant="outline"
                          borderColor="gray.800"
                          h="35px"
                          w="70px"
                          borderRadius="0"
                          p={0}
                          isLoading={wishBusy}
                          _hover={{ bg: "transparent" }}
                          _active={{ bg: "transparent" }}
                        >
                          {isWishlisted ? (
                            <svg width="18" height="18" viewBox="0 0 24 24">
                              <path
                                d="M10.4107 19.9677C7.58942 17.858 2 13.0348 2 8.69444C2 5.82563 4.10526 3.5 7 3.5C8.5 3.5 10 4 12 6C14 4 15.5 3.5 17 3.5C19.8947 3.5 22 5.82563 22 8.69444C22 13.0348 16.4106 17.858 13.5893 19.9677C12.6399 20.6776 11.3601 20.6776 10.4107 19.9677Z"
                                stroke="black"
                                strokeWidth="1.5"
                                fill="black"
                              />
                            </svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24">
                              <path
                                d="M10.4107 19.9677C7.58942 17.858 2 13.0348 2 8.69444C2 5.82563 4.10526 3.5 7 3.5C8.5 3.5 10 4 12 6C14 4 15.5 3.5 17 3.5C19.8947 3.5 22 5.82563 22 8.69444C22 13.0348 16.4106 17.858 13.5893 19.9677C12.6399 20.6776 11.3601 20.6776 10.4107 19.9677Z"
                                stroke="black"
                                strokeWidth="1.5"
                                fill="none"
                              />
                            </svg>
                          )}
                        </Button>
                      )}
                    </HStack>

                    {/* Row 2: Buy Now */}
                    <Box mt={1}>
                      {!isExchangeFlow && !isHidden && (
                        <BuyNowButton
                          id="buy-now-mobile"
                          productId={selectedVariant?.id || product?.id}
                          quantity={quantity}
                          w="full"
                          h="35px"
                          fontSize="sm"
                          borderRadius="0"
                          borderColor="black"
                          bg="black"
                          color="white"
                          _hover={{ bg: "black" }}
                          disabled={!selectedVariant?.orderable || maxQty === 0}
                          isOrderable={selectedVariant?.orderable !== false}
                          maxQty={maxQty}
                          isHidden={isHidden}
                        >
                          Buy Now
                        </BuyNowButton>
                      )}
                    </Box>
                  </Box>
                </Portal>
              )}

              {/* OFFERS */}
              {offers.length > 0 && !isHidden && (
                <Box
                  w={"full"}
                  border="1px"
                  borderColor="blackAlpha.400"
                  bg={"blackAlpha.50"}
                  my={2}
                  px={2}
                  py={3}
                  borderRadius="0"
                  mx="auto"
                  textTransform={"uppercase"}
                >
                  <VStack
                    align="center"
                    spacing={2}
                    fontSize={{ base: "10px", md: "xs" }}
                    fontWeight="semibold"
                    w="100%"
                  >
                    {offers.map((promo) => (
                      <HStack
                        key={promo.id || promo.callout}
                        justify="center"
                        align="flex-start"
                        spacing={1.5}
                        w="100%"
                        px={{ base: 1, md: 2 }}
                      >
                        <Box
                          as="span"
                          flexShrink={0}
                          mt="1px"
                          w={{ base: "10px", md: "12px" }}
                          h={{ base: "10px", md: "12px" }}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M9.84568 4.15256C10.0354 4.36139 10.0194 4.68453 9.80992 4.87421L4.60385 9.5859C4.39439 9.77492 4.07124 9.75896 3.8822 9.55013C3.69253 9.34067 3.70914 9.01753 3.91797 8.82849L9.12404 4.1168C9.33349 3.92712 9.65664 3.9431 9.84568 4.15256Z"
                              fill="#3D3D3D"
                            />
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M5.13908 4.45209C4.8568 4.4406 4.61924 4.65964 4.60775 4.94191C4.59625 5.22355 4.81593 5.46175 5.09757 5.47261C5.37985 5.4841 5.61741 5.26506 5.6289 4.98279C5.6404 4.70115 5.42072 4.46295 5.13908 4.45209ZM3.58723 4.90104C3.62108 4.05487 4.33442 3.3971 5.17995 3.43094C6.02549 3.46478 6.6839 4.17812 6.65006 5.02366C6.61557 5.86983 5.90287 6.5276 5.0567 6.49376C4.21116 6.45992 3.55275 5.74658 3.58723 4.90104Z"
                              fill="#3D3D3D"
                            />
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M8.77276 8.30373C8.44451 8.29032 8.16799 8.54513 8.15522 8.87338C8.14181 9.20163 8.39727 9.47815 8.72488 9.49092C9.05313 9.50433 9.32965 9.24888 9.34305 8.92126C9.35583 8.59302 9.10101 8.31649 8.77276 8.30373ZM7.13414 8.83251C7.1699 7.94036 7.92219 7.24682 8.81363 7.28257C9.70578 7.31834 10.3993 8.07063 10.3636 8.96207C10.3278 9.85422 9.57615 10.5478 8.68407 10.512C7.79192 10.4762 7.09838 9.72395 7.13414 8.83251Z"
                              fill="#3D3D3D"
                            />
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M5.56362 0.541713C6.17606 -0.180571 7.29037 -0.180571 7.9023 0.541713L8.36977 1.09348C8.49494 1.241 8.69292 1.30551 8.88067 1.25952L9.58315 1.08773C10.5028 0.862932 11.4046 1.51815 11.4753 2.46268L11.529 3.18369C11.5437 3.37656 11.6657 3.54451 11.8451 3.61794L12.5137 3.89191C13.3899 4.25082 13.7348 5.31093 13.2367 6.11615L12.8567 6.73114C12.7545 6.8959 12.7545 7.10408 12.8567 7.26886L13.2367 7.88321C13.7348 8.68915 13.3899 9.7486 12.5137 10.1074L11.8451 10.3821C11.6657 10.4549 11.5437 10.6235 11.529 10.8163L11.4753 11.5373C11.4045 12.4818 10.5027 13.1371 9.58315 12.9123L8.88067 12.7405C8.69292 12.6945 8.49494 12.759 8.36977 12.9065L7.9023 13.4583C7.2905 14.1806 6.17604 14.1806 5.56362 13.4583L5.09615 12.9065C4.97098 12.759 4.773 12.6945 4.58525 12.7405L3.88276 12.9123C2.96315 13.1371 2.06136 12.4818 1.99122 11.5373L1.93694 10.8163C1.92289 10.6234 1.80028 10.4549 1.62146 10.3821L0.952179 10.1074C0.0759884 9.74855 -0.268216 8.68907 0.229257 7.88321L0.60987 7.26886C0.71141 7.1041 0.71141 6.89592 0.60987 6.73114L0.229257 6.11615C-0.268233 5.31085 0.0759884 4.25077 0.952179 3.89191L1.62146 3.61794C1.80028 3.5445 1.9229 3.37654 1.93694 3.18369L1.99122 2.46268C2.06147 1.51817 2.9632 0.862932 3.88276 1.08773L4.58525 1.25952C4.773 1.3055 4.97098 1.241 5.09615 1.09348L5.56362 0.541713ZM7.12314 1.20205C6.91878 0.961285 6.54711 0.961285 6.34339 1.20205L5.87591 1.75382C5.5004 2.19702 4.90712 2.38988 4.34259 2.25195L3.64074 2.08016C3.33356 2.00544 3.03342 2.22385 3.00978 2.53869L2.95614 3.25969C2.91271 3.83893 2.54614 4.34343 2.00842 4.56376L1.33979 4.83773C1.0473 4.95716 0.93235 5.31095 1.09839 5.57918L1.479 6.19417C1.78426 6.68781 1.78426 7.31238 1.479 7.80605L1.09839 8.42103C0.93235 8.68925 1.0473 9.04305 1.33979 9.16248L2.00842 9.43645C2.54614 9.65678 2.9127 10.1613 2.95614 10.7405L3.00978 11.4615C3.03341 11.7764 3.33356 11.9948 3.64074 11.9194L4.34259 11.7483C4.90712 11.6103 5.5004 11.8032 5.87591 12.2464L6.34339 12.7975C6.54711 13.0389 6.91878 13.0389 7.12314 12.7975L7.58997 12.2464C7.96548 11.8032 8.5594 11.6103 9.1233 11.7483L9.82578 11.9194C10.1323 11.9948 10.4325 11.7764 10.4561 11.4615L10.5104 10.7405C10.5532 10.1613 10.9204 9.65678 11.4575 9.43645L12.1267 9.16248C12.4186 9.04306 12.5336 8.68927 12.3675 8.42103L11.9875 7.80605C11.6816 7.3124 11.6816 6.68783 11.9875 6.19417L12.3675 5.57918C12.5336 5.31096 12.4186 4.95716 12.1267 4.83773L11.4575 4.56376C10.9204 4.34343 10.5532 3.83893 10.5104 3.25969L10.4561 2.53869C10.4325 2.22384 10.1323 2.00544 9.82578 2.08016L9.1233 2.25195C8.5594 2.38989 7.96548 2.19703 7.58997 1.75382L7.12314 1.20205Z"
                              fill="#3D3D3D"
                            />
                          </svg>
                        </Box>
                        <Text
                          textAlign="center"
                          fontSize={{ base: "10px", md: "11px" }}
                          lineHeight={{ base: "14px", md: "16px" }}
                        >
                          {promo.callout}
                        </Text>
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              )}

              {/* INSTAGRAM SOCIAL FAVORITE STRIP*/}
              <Box mt={offers.length > 0 ? 2 : 0}>
                <CLink
                  href="https://www.instagram.com/sotbella_og_verse/"
                  isExternal
                  _hover={{ textDecoration: "none" }}
                  display="block"
                >
                  <Flex
                    align="center"
                    justify="space-between"
                    w="full"
                    py={3}
                    borderTop="1px solid"
                    borderBottom="1px solid"
                    borderColor="blackAlpha.200"
                  >
                    {/* Left: Icon + Text */}
                    <HStack spacing={3} align="center">
                      <Image
                        src={InstaIcon}
                        alt="Instagram"
                        w={{ base: "24px", lg: "28px" }}
                        h={{ base: "24px", lg: "28px" }}
                        objectFit="contain"
                      />

                      <Box lineHeight="1.2">
                        <Text
                          fontSize={{ base: "9px", lg: "11px" }}
                          letterSpacing="0.14em"
                          textTransform="uppercase"
                        >
                          Social Favorite
                        </Text>
                        <Text
                          fontSize={{ base: "9px", lg: "10px" }}
                          letterSpacing="0.14em"
                          textTransform="uppercase"
                          mt={2}
                        >
                          Women Styled This
                        </Text>
                      </Box>
                    </HStack>

                    {/* Right: VIEW */}
                    <Text
                      fontSize={{ base: "10px", lg: "11px" }}
                      letterSpacing="0.14em"
                      textTransform="uppercase"
                    >
                      View
                    </Text>
                  </Flex>
                </CLink>
              </Box>

              <Box mt={2}>
                <OurPromise />

                <Box
                  my={5}
                  borderTop="1px solid"
                  borderColor="blackAlpha.200"
                />

                {/* tagline row */}
                <Text
                  textAlign="center"
                  fontSize={{ base: "10px", lg: "10px" }}
                  fontWeight={700}
                // px={2}
                >
                  {/* Designed for Social Moments · Made to Feel Confident · Thoughtfully Priced */}
                  DESIGNED FOR SOCIAL MOMENTS · MADE TO FEEL CONFIDENT ·
                  THOUGHTFULLY PRICED
                </Text>

                {/* <Box my={3} borderTop="1px solid"  /> */}
                <Box mt={5} mb={{ lg: 10 }} />

                {/* Accordion for Details */}
                <Box>
                  <Accordion allowToggle defaultIndex={isMobile ? [0] : [0]}>
                    {/* Description */}
                    <AccordionItem
                      borderTop="0"
                      borderBottom="1px solid"
                      borderColor="blackAlpha.200"
                    >
                      {({ isExpanded }) => (
                        <>
                          <h2>
                            <AccordionButton
                              _hover={{ bg: "transparent" }}
                              px={0}
                              py={4}
                            >
                              <Box flex="1" textAlign="left">
                                <Text
                                  fontSize="10px"
                                  fontWeight="700"
                                  letterSpacing="0.18em"
                                  textTransform="uppercase"
                                >
                                  Description
                                </Text>
                              </Box>
                              {isExpanded ? (
                                <FiMinus fontSize="10px" />
                              ) : (
                                <FiPlus fontSize="10px" />
                              )}
                            </AccordionButton>
                          </h2>
                          <AccordionPanel pb={2}>
                            <Box
                              fontSize="xs"
                              lineHeight="1.8"
                              dangerouslySetInnerHTML={{
                                __html:
                                  product.longDescription ||
                                  product.shortDescription ||
                                  "Details coming soon.",
                              }}
                            />
                          </AccordionPanel>
                        </>
                      )}
                    </AccordionItem>

                    {/* Wash Care */}
                    <AccordionItem
                      borderBottom="1px solid"
                      borderColor="blackAlpha.200"
                    >
                      {({ isExpanded }) => (
                        <>
                          <h2>
                            <AccordionButton
                              _hover={{ bg: "transparent" }}
                              px={0}
                              py={4}
                            >
                              <Box flex="1" textAlign="left">
                                <Text
                                  fontSize="10px"
                                  fontWeight="700"
                                  letterSpacing="0.18em"
                                  textTransform="uppercase"
                                >
                                  Wash Care
                                </Text>
                              </Box>
                              {isExpanded ? (
                                <FiMinus fontSize="10px" />
                              ) : (
                                <FiPlus fontSize="10px" />
                              )}
                            </AccordionButton>
                          </h2>
                          <AccordionPanel pb={2}>
                            <Box
                              fontSize="xs"
                              lineHeight="1.8"
                              dangerouslySetInnerHTML={{ __html: washCareHtml }}
                            />
                          </AccordionPanel>
                        </>
                      )}
                    </AccordionItem>

                    {/* Return & Exchange */}
                    <AccordionItem
                      borderBottom="1px solid"
                      borderColor="blackAlpha.200"
                    >
                      {({ isExpanded }) => (
                        <>
                          <h2>
                            <AccordionButton
                              _hover={{ bg: "transparent" }}
                              px={0}
                              py={4}
                            >
                              <Box flex="1" textAlign="left">
                                <Text
                                  fontSize="10px"
                                  fontWeight="700"
                                  letterSpacing="0.18em"
                                  textTransform="uppercase"
                                >
                                  Shipping & Delivery
                                </Text>
                              </Box>
                              {isExpanded ? (
                                <FiMinus fontSize="10px" />
                              ) : (
                                <FiPlus fontSize="10px" />
                              )}
                            </AccordionButton>
                          </h2>
                          <AccordionPanel pb={2}>
                            <Box
                              fontSize="xs"
                              lineHeight="1.8"
                              dangerouslySetInnerHTML={{
                                __html: returnExchangeHtml,
                              }}
                            />
                          </AccordionPanel>
                        </>
                      )}
                    </AccordionItem>

                    {/* 1 */}
                    <AccordionItem
                      borderBottom="1px solid"
                      borderColor="blackAlpha.200"
                    >
                      {({ isExpanded }) => (
                        <>
                          <h2>
                            <AccordionButton
                              px={0}
                              py={4}
                              _hover={{ bg: "transparent" }}
                            >
                              <Box
                                flex="1"
                                textAlign="left"
                                display="flex"
                                alignItems="center"
                              >
                                <Text
                                  fontSize="10px"
                                  fontWeight="700"
                                  letterSpacing="0.18em"
                                  textTransform="uppercase"
                                >
                                  Confidence-first fit
                                </Text>
                              </Box>
                              {isExpanded ? (
                                <FiMinus fontSize="10px" />
                              ) : (
                                <FiPlus fontSize="10px" />
                              )}
                            </AccordionButton>
                          </h2>
                          <AccordionPanel pb={2} pl={0}>
                            <Text fontSize="xs" lineHeight="1.8">
                              Flattering, supportive, and easy to move in.
                              <br />
                              Designed in-house so you enjoy your moment — not
                              adjust your outfit.
                            </Text>
                          </AccordionPanel>
                        </>
                      )}
                    </AccordionItem>

                    {/* 2 */}
                    <AccordionItem
                      borderBottom="1px solid"
                      borderColor="blackAlpha.200"
                    >
                      {({ isExpanded }) => (
                        <>
                          <h2>
                            <AccordionButton
                              px={0}
                              py={4}
                              _hover={{ bg: "transparent" }}
                            >
                              <Box
                                flex="1"
                                textAlign="left"
                                display="flex"
                                alignItems="center"
                              >
                                <Text
                                  fontSize="10px"
                                  fontWeight="700"
                                  letterSpacing="0.18em"
                                  textTransform="uppercase"
                                >
                                  Made for real social moments
                                </Text>
                              </Box>
                              {isExpanded ? (
                                <FiMinus fontSize="10px" />
                              ) : (
                                <FiPlus fontSize="10px" />
                              )}
                            </AccordionButton>
                          </h2>
                          <AccordionPanel pb={2} pl={0}>
                            <Text fontSize="xs" lineHeight="1.8">
                              Perfect for parties, weddings, dinners, and
                              celebrations.
                              <br />
                              Designed and refined by our team for real moments,
                              not runways.
                            </Text>
                          </AccordionPanel>
                        </>
                      )}
                    </AccordionItem>

                    {/* 3 */}
                    <AccordionItem
                      borderBottom="1px solid"
                      borderColor="blackAlpha.200"
                    >
                      {({ isExpanded }) => (
                        <>
                          <h2>
                            <AccordionButton
                              px={0}
                              py={4}
                              _hover={{ bg: "transparent" }}
                            >
                              <Box
                                flex="1"
                                textAlign="left"
                                display="flex"
                                alignItems="center"
                              >
                                <Text
                                  fontSize="10px"
                                  fontWeight="700"
                                  letterSpacing="0.18em"
                                  textTransform="uppercase"
                                >
                                  Luxuriously affordable — by design
                                </Text>
                              </Box>
                              {isExpanded ? (
                                <FiMinus fontSize="10px" />
                              ) : (
                                <FiPlus fontSize="10px" />
                              )}
                            </AccordionButton>
                          </h2>
                          <AccordionPanel pb={2} pl={0}>
                            <Text fontSize="xs" lineHeight="1.8">
                              From design to final piece, everything is done
                              in-house.
                              <br />
                              That’s how we deliver a premium look and feel —
                              without unnecessary luxury markup.
                              <br />
                              Because confidence shouldn’t feel out of reach.
                            </Text>
                          </AccordionPanel>
                        </>
                      )}
                    </AccordionItem>
                  </Accordion>
                </Box>
              </Box>
            </VStack>
          </GridItem>
        </Grid>

        <FeatureInPDP />

        {/* Q&A + Reviews */}
        {!isHidden && (
          <Box w={{ base: "100%", lg: "60%" }} mt={{ base: 8, lg: 14 }}>
            {/* Rating + stats row */}
            <HStack spacing={3} align="center" mb={3}>
              {Number(ratingValue) > 0 && (
                <HStack
                  bg="black"
                  color="white"
                  px="8px"
                  h="26px"
                  spacing="6px"
                  align="center"
                  justify="center"
                >
                  <Box as="span" lineHeight={0} display="inline-flex">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z"
                        fill="white"
                      />
                    </svg>
                  </Box>

                  <Text fontSize="sm" fontWeight="600" lineHeight="1">
                    {ratingValue}
                  </Text>
                </HStack>
              )}

              <Text
                fontSize="11px"
                color="blackAlpha.700"
                textTransform="uppercase"
                letterSpacing="0.02em"
              >
                {liveViews} LIVE VIEWS • {soldCount} SOLD
              </Text>
            </HStack>

            {/* Single clickable review box */}
            <Box>
              <CLink
                as="button"
                // onClick={handleOpenReviewModal}
                onClick={handleOpenReviewModalCustom}
                w="100%"
                textAlign="left"
                _hover={{ textDecoration: "none" }}
              >
                <Box
                  border="1px solid"
                  borderColor="blackAlpha.300"
                  px="16px"
                  py="14px"
                >
                  <Text
                    fontSize="12px"
                    fontWeight="500"
                    textTransform="uppercase"
                    letterSpacing="0.04em"
                    mb="6px"
                  >
                    Write a review
                  </Text>

                  <Text fontSize="12px" color="blackAlpha.600">
                    Write a review…
                  </Text>
                </Box>
              </CLink>

              {/* No reviews text */}
              {!productReviews?.reviews?.length && (
                <Text mt="8px" fontSize="12px" color="blackAlpha.700">
                  Be the first to write a review
                </Text>
              )}
            </Box>
          </Box>
        )}
        {/* Customer review cards strip */}
        {!isHidden && (
          <Box gridColumn={{ base: "1 / -1", lg: "1 / -1" }}>
            <CustomerReviewsStrip
              currentProduct={product}
              onReviewsLoaded={setProductReviews}
            />
          </Box>
        )}
        {/* ✅ Performance Optimization: Lazy load SimilarProducts */}
        {/* <Suspense fallback={<ComponentLoader />}>
          <SimilarProducts fromCollection={fromCollection} currentProductId={id} />
        </Suspense> */}
      </Container>

      {/* ✅ Performance Optimization: Lazy load modals */}
      <Suspense fallback={null}>
        <ProductImageModal
          isOpen={isImageModalOpen}
          onClose={onImageModalClose}
          images={safeImages}
          startIndex={activeImgIdx}
        />
      </Suspense>

      <Suspense fallback={null}>
        <SizeChartPopup
          open={isSizeOpen}
          handleClose={() => setIsSizeOpen(false)}
          onComplete={() => { }}
        />
      </Suspense>

      <Suspense fallback={null}>
        <RatingReviewModal
          open={isReviewOpen}
          handleClose={() => setIsReviewOpen(false)}
          data={{ product }}
          setHandleRefresh={setReviewRefresh}
          handleRefresh={reviewRefresh}
        />
      </Suspense>

      <Suspense fallback={null}>
        <LoginFlowModal
          start={showLoginFlow}
          onCompletion={() => setShowLoginFlow(false)}
          onPreorderClose={() => {
            setShowLoginFlow(false);
            setModalType("");
          }}
          modalType={modalType}
          setModalType={setModalType}
          isHidden={isHidden}
        />
      </Suspense>
    </Box>
  );
};

export default ChakraProductDetails;
