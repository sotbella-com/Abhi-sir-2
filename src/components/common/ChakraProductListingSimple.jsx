import React, {
  Fragment,
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  Box,
  Grid,
  Image,
  Text,
  Button,
  IconButton,
  VStack,
  HStack,
  Tooltip,
  useOutsideClick,
  Flex,
  Heading,
} from "@chakra-ui/react";
import Slider from "react-slick";
import { useNavigate, useLocation } from "react-router-dom";
import { useWishlistStore } from "@/context/wishlistStore";
import { useAuth } from "@/context/AuthContext";
import { useUnifiedCartStore } from "@/context/unifiedCartStore";
import { useMobile } from "@/components/molecules";
import { sortProducts } from "@/utils/sortProducts";
import {
  getProductDetails,
  transformSFCCProductDetails,
} from "@/api/services/sfccSearchService";
import scaleIcon from "@/public/scale.webp";
import cartIcon from "@/public/cart.png";
import { IoMdClose } from "react-icons/io";
import SizeChartPopup from "@/pages/ProductDetails/components/SizeChartPopup";
import { toast } from "react-toastify";
import {
  trackClickSearch,
  trackClickCategory,
} from "@/api/services/einsteinTracking";

/** More permissive: treat as having an image if first slot has a URL */
const hasImage = (item) =>
  Array.isArray(item?.productImages) &&
  item.productImages.length > 0 &&
  Boolean(item.productImages?.[0]?.image);

const getVariantIdBySize = (item, sizeObj) => {
  const targetVal = sizeObj?.value ?? sizeObj?.name;
  if (!targetVal) return null;

  const child = item?.childProducts?.find(
    (c) => (c?.size?.value ?? c?.size?.name) === targetVal,
  );
  return child?.id || null;
};

const ChakraProductListingSimple = ({
  collectionPoduct,
  loading,
  isActive = true,
  sortBy,
  fromCollection,
  searchText = null, // For search context tracking
  categoryId = null, // For category context tracking
  searchQueryKey = "",
  categoryQueryKey = "",
  currentPage,
  isHidden,
  campaignProducts = [],
}) => {
  const isMobile = useMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const isSearchContext = Boolean(searchText);

  // ✅ Check for Exchange Flow params
  const searchParams = new URLSearchParams(location.search);
  const isDifferentExchange = searchParams.get("isExchange") === "true";
  const actionType = searchParams.get("actionType");
  const orderId = searchParams.get("orderId");
  const itemId = searchParams.get("itemId");
  const isExchangeMode =
    isDifferentExchange && actionType === "EXCHANGE-DIFFERENT";

  // Sort products based on the sortBy parameter
  const sortedProducts = useMemo(() => {
    return sortProducts(collectionPoduct, sortBy);
  }, [collectionPoduct, sortBy]);

  // CART
  const addToBasket = useUnifiedCartStore((s) => s.addToBasket);
  const basket = useUnifiedCartStore((s) => s.basket);
  const handleShowCart = useUnifiedCartStore((s) => s.handleShow);

  // ✅ WISHLIST
  const addToWishlist = useWishlistStore((s) => s.addToWishlist);
  const removeFromWishlist = useWishlistStore((s) => s.removeFromWishlist);
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);
  const wishListProduct = useWishlistStore((s) => s.wishListProduct);
  const isInWishlistStore = useWishlistStore((s) => s.isInWishlist);
  // Subscribe to store updates to trigger re-renders when localStorage changes
  const handleRefresh = useWishlistStore((s) => s.handleRefresh);
  const _localStorageUpdated = useWishlistStore((s) => s._localStorageUpdated);

  // Fetch wishlist on mount if authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchWishlist({ customerId: user.id });
    }
  }, [isAuthenticated, user?.id, fetchWishlist]);

  // Use store's isInWishlist function for consistency
  // Make it reactive to store updates so hearts update in real-time
  const inWishlist = useCallback(
    (id) => {
      if (!id) return false;
      // The function is reactive because we're subscribed to handleRefresh and _localStorageUpdated
      return isInWishlistStore(id);
    },
    [isInWishlistStore],
  );

  // ✅ Performance Optimization: useCallback for wishlist handler
  // ✅ remove refresh
  const toggleWishlist = useCallback(
    async (item) => {
      if (!item?.id) return;
      // CRITICAL: Use representedProduct.id for wishlist operations if available
      // Listing API uses slug as item.id, but wishlist uses variant IDs (ST-1449S, etc.)
      const wishlistId = item.representedProduct?.id || item.id;

      if (inWishlist(wishlistId)) {
        await removeFromWishlist({
          productId: wishlistId,
          navigate,
          customerId: user?.id,
        });
        // toast.success("Removed from wishlist.");
      } else {
        // Use representedProduct.id if available, otherwise use item.id
        await addToWishlist({
          item: { ...item, id: wishlistId },
          isAuthenticated,
          navigate,
          customerId: user?.id,
        });
        if (isAuthenticated) {
          // toast.success("Added to wishlist.");
        }
      }
    },
    [
      inWishlist,
      removeFromWishlist,
      addToWishlist,
      navigate,
      user?.id,
      isAuthenticated,
    ],
  );

  // ✅ Performance Optimization: useCallback for add to cart handler
  const addProductToCart = useCallback(
    async (id) => {
      if (!id) return;

      let targetItem = null;

      // Parent (same id as product)
      const main = collectionPoduct?.find((p) => p.id === id);
      if (main) {
        targetItem = main;
      } else {
        // Child (variant)
        const parent = collectionPoduct?.find(
          (p) =>
            Array.isArray(p.childProducts) &&
            p.childProducts.some((c) => c.id === id),
        );
        const child = parent?.childProducts?.find((c) => c.id === id);

        if (child) {
          let payload = child;
          if (!isAuthenticated && parent) {
            payload = {
              ...child,
              title: parent.title ?? child.title,
              productImages: [
                ...(Array.isArray(parent.productImages)
                  ? parent.productImages
                  : []),
                ...(Array.isArray(child.productImages)
                  ? child.productImages
                  : []),
              ],
            };
          }
          targetItem = payload;
        }
      }

      if (!targetItem) return;

      // Check Max Quantity
      let maxQty = targetItem.stock;

      // If stock is unknown (placeholder 99) or null, rely on backend rejection or cart update
      // Removed blocking getProductDetails call to speed up UI response
      if (maxQty == null) {
        maxQty = 99;
      }

      maxQty = Math.max(0, Number(maxQty ?? 0));

      // Check against basket
      const line = (basket?.productItems || []).find(
        (li) => li?.productId === targetItem.id,
      );

      // If item already in cart, just open the drawer and do nothing else
      if (line) {
        handleShowCart();
        return;
      }

      const currentQty = Number(line?.quantity || 0);

      if (currentQty >= maxQty) {
        // toast.info(`You have already added the maximum available quantity (${maxQty}) to your cart.`);
        return;
      }

      if (currentQty + 1 > maxQty) {
        // toast.info(`You can only add ${maxQty - currentQty} more of this item.`);
        return;
      }

      try {
        await addToBasket(targetItem.id, 1);
        // toast.success("Added to cart");
        // ✅ OPEN cart quick view
        handleShowCart();
      } catch (e) {
        const msg =
          e?.detail || e?.response?.data?.detail || "Failed to add to cart";
        // toast.error(msg);
      }
    },
    [collectionPoduct, addToBasket, basket, isAuthenticated],
  );

  // ✅ Performance Optimization: useCallback for navigation handler
  const handleDetailPage = useCallback(
    (item) => {
      // Track clickSearch if in search context
      if (searchText) {
        trackClickSearch(
          searchText,
          item,
          (collectionPoduct || []).map((p) => ({ id: p.id || p.productId })),
        );
      }

      // Track clickCategory if in category context
      if (categoryId && !searchText) {
        trackClickCategory(categoryId, item);
      }

      const isSearch = Boolean(searchText);
      const scrollY = window.scrollY || 0;

      navigate(
        isExchangeMode
          ? `/product/${item.id}?isDifferentExchange=true&orderId=${orderId}&itemId=${itemId}&actionType=${actionType}`
          : `/product/${item.id}`,
        {
          state: {
            fromCollection,
            from: isSearch ? "search" : "category",

            // queryKey
            searchQueryKey: isSearch ? searchQueryKey : "",
            categoryQueryKey: !isSearch ? categoryQueryKey : "",

            // ✅ IMPORTANT: send correct scroll key
            searchScrollY: isSearch ? scrollY : 0,
            categoryScrollY: !isSearch ? scrollY : 0,

            // restore paging
            backPage: Number(currentPage || 1),

            // ✅ use react-router location instead of window.location (more reliable)
            returnTo: `${location.pathname}${location.search}`,
            isHidden, // Pass isHidden to detail page for consistent behavior

          },
        },
      );
    },
    [
      navigate,
      fromCollection,
      searchText,
      categoryId,
      collectionPoduct, // ✅ only the array, not collectionPoduct.map(...)
      isExchangeMode,
      orderId,
      itemId,
      actionType,
    ],
  );

  const formatPrice = (amount, currency) => {
    try {
      return new Intl.NumberFormat("en", {
        style: "currency",
        currency: currency || "",
        minimumFractionDigits: 0,
      }).format(amount);
    } catch {
      return amount;
    }
  };

  // ✅ Guard: CategoryPage empty state handle karega
  if (
    !isActive ||
    !Array.isArray(sortedProducts) ||
    sortedProducts.length === 0
  ) {
    return null;
  }

  return (
    <Fragment>
      <Box
        id="collection3"
        px={{ base: "12px", md: "50px" }}
        display={isActive ? "block" : "none"}
      >
        <Grid
          templateColumns={{
            base: "repeat(1, 1fr)",
            md: "repeat(2, 1fr)",
          }}
        >
          {sortedProducts.map((item, index) => {
            // ✅ Safe discount math
            // ✅ Safe discount math with support for detailed priceRanges
            let price = Number(item?.price) || 0;
            let displayPrice = Number(item?.displayPrice ?? item?.price) || 0;

            if (
              Array.isArray(item?.priceRanges) &&
              item.priceRanges.length > 0
            ) {
              const listObj =
                item.priceRanges.find(
                  (r) => r.pricebook && r.pricebook.includes("listprice"),
                ) || item.priceRanges[0];
              const saleObj = item.priceRanges.find(
                (r) => r.pricebook && r.pricebook.includes("saleprice"),
              );

              if (saleObj) {
                price = saleObj.maxPrice;
                if (listObj) displayPrice = listObj.maxPrice;
              } else if (listObj) {
                price = listObj.maxPrice;
                displayPrice = listObj.maxPrice;
              }
            }

            const hasDiscount =
              price > 0 && displayPrice > 0 && displayPrice > price;

            const discountPercent = hasDiscount
              ? Math.round(((displayPrice - price) / displayPrice) * 100)
              : 0;

            const representedProductIds = item.representedProduct?.id;
            const onewordtitle = item.representedProduct?.c_one_word_name;
            const productIdToShow = item?.id;
            const firstCampaign = item?.campaignData?.campaigns?.[0];

            return (
              <Box
                key={item.id}
                data-product-id={productIdToShow}
                position="relative"
                w="full"
                border="1px"
                borderColor="white"
                borderRadius="0"
                overflow="hidden"
                bg="white"
              >
                {/* Image wrapper */}
                <Box
                  position="relative"
                  w="full"
                  aspectRatio="3/4"
                  onClick={() => handleDetailPage(item)}
                  cursor="pointer"
                >
                  {item?.hasCampaign && firstCampaign?.eligible && (
                    <Box
                      position="absolute"
                      top={{ base: 2, md: 3 }}
                      left={{ base: 2, md: 3 }}
                      zIndex={25}
                      bg="white"
                      px={{ base: 1, md: 2 }}
                      py={{ base: 1, md: 2 }}
                      borderRadius="20px"
                    >
                      <Text
                        fontSize={{ base: "7px", md: "8px" }}
                        fontWeight="800"
                        textTransform="uppercase"
                        textAlign="center"
                        lineHeight="1"
                      >
                        {firstCampaign.campaignName}
                      </Text>
                    </Box>
                  )}

                  {hasImage(item) ? (
                    <ChakraProductImage
                      item={item}
                      index={index}
                      basket={basket}
                      addProductToCart={addProductToCart}
                      isWishlisted={inWishlist(
                        representedProductIds || item?.id,
                      )}
                      toggleWishlist={toggleWishlist}
                      isExchangeMode={isExchangeMode}
                      isHidden={isHidden}
                    />
                  ) : (
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      position="relative"
                      bg="gray.200"
                      w="full"
                      h="full"
                    >
                      <VStack>
                        <Image
                          h="40px"
                          w="auto"
                          mx="auto"
                          src="/api/placeholder/200/200"
                          alt="Image Not Available"
                        />
                        <Text fontSize="xs" color="gray.600">
                          Image Not Available
                        </Text>
                      </VStack>
                    </Box>
                  )}
                </Box>

                {/* Product info */}
                <VStack pb={4} pt={2} px={1} align="stretch" gap={0}>
                  <div id="productId" hidden>
                    {productIdToShow}
                  </div>
                  <div id="product-sku" hidden>
                    {representedProductIds}
                  </div>
                  {/* <Heading fontSize={{ base: "lg", md: "xl", lg: "2xl" }} fontWeight="400">{onewordtitle}</Heading> */}
                  {/* Title + Size Guide */}
                  <HStack justify="space-between" align="center">
                    <Text
                      fontSize="sm"
                      fontWeight="normal"
                      isTruncated
                      title={item?.title}
                    >
                      {item?.title}
                    </Text>
                    <Tooltip
                      label="Size Guide"
                      placement="top"
                      bg="white"
                      color="black"
                      fontSize="10px"
                      px={2}
                      py={1}
                      borderRadius="0"
                      shadow="0"
                      right={4}
                      isDisabled={isMobile}
                    >
                      <IconButton
                        aria-label="Size Guide"
                        id="size-guide-btn"
                        icon={
                          <Image
                            src={scaleIcon}
                            alt="Scale Icon"
                            h="20px"
                            w="auto"
                          />
                        }
                        size="xs"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsSizeGuideOpen(true);
                          try {
                            setOpenSizeGuide(true);
                          } catch { }
                        }}
                        bg="transparent"
                        _hover={{ bg: "transparent" }}
                        _active={{ bg: "transparent" }}
                        _focus={{ boxShadow: "none" }}
                      />
                    </Tooltip>
                  </HStack>

                  {/* Price row */}
                  <HStack justify="space-between" align="center" mt={0}>
                    <HStack spacing={1} flexWrap="wrap">
                      <Text
                        fontSize="sm"
                        fontWeight="normal"
                        id="product-price"
                      >
                        {formatPrice(price, item?.currency)}
                      </Text>

                      {hasDiscount && (
                        <Text fontSize="xs" color="blackAlpha.500" as="del">
                          {formatPrice(displayPrice, item?.currency)}
                        </Text>
                      )}

                      {hasDiscount && (
                        <Text
                          fontSize="xs"
                          color="green.500"
                          fontWeight="medium"
                        >
                          {discountPercent}% OFF
                        </Text>
                      )}
                    </HStack>
                  </HStack>
                </VStack>
              </Box>
            );
          })}
        </Grid>
      </Box>

      <SizeChartPopup
        open={isSizeGuideOpen}
        handleClose={() => setIsSizeGuideOpen(false)}
        onComplete={() => { }}
      />
    </Fragment>
  );
};

// ✅ Performance Optimization: React.memo to prevent unnecessary re-renders
const ChakraProductImage = React.memo(
  ({
    item,
    index,
    basket,
    addProductToCart,
    isWishlisted,
    toggleWishlist,
    isExchangeMode,
    isHidden,
  }) => {
    const [isHover, setIsHover] = useState(false); // desktop hover
    const [isOpenMobile, setIsOpenMobile] = useState(false); // mobile inline popover
    const isMobile = useMobile();

    const [currentSlide, setCurrentSlide] = useState(0);
    const sliderRef = useRef(null);

    // close on outside tap (mobile popover)
    const panelRef = useRef(null);
    useOutsideClick({
      ref: panelRef,
      handler: () => setIsOpenMobile(false),
    });

    // ✅ Prepare images for Mobile Carousel (try imageGroups "large", then fallback to productImages)
    const carouselImages = useMemo(() => {
      // 1. Try imageGroups "large"
      if (Array.isArray(item?.imageGroups)) {
        const largeGroup = item.imageGroups.find((g) => g.viewType === "large");
        if (largeGroup && Array.isArray(largeGroup.images)) {
          return largeGroup.images.map((img) => ({
            src: img.disBaseLink || img.link,
            alt: img.alt || item?.title,
            title: img.title,
          }));
        }
      }
      // 2. Fallback to productImages
      if (Array.isArray(item?.productImages)) {
        return item.productImages.map((img) => ({
          src: img.image,
          alt: item?.title,
        }));
      }
      return [];
    }, [item]);

    const mainImage = item?.productImages?.[0];

    let hoverImage = item?.productImages?.[1];
    // Check for imageGroups from API response (specifically the second image in the first group)
    if (item?.imageGroups?.[0]?.images?.[1]) {
      const rawHover = item.imageGroups[0].images[1];
      hoverImage = {
        image: rawHover.link || rawHover.disBaseLink,
        alt: rawHover.alt,
        title: rawHover.title,
      };
    }

    const sliderSettings = {
      dots: false, // Custom dots below
      infinite: carouselImages.length > 1,
      speed: 300,
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: false,
      autoplay: false,
      afterChange: (index) => setCurrentSlide(index),
      lazyLoad: false, // Usage of native loading="eager" is preferred for LCP

      // ✅ Swipe / Drag (per DynamicSection.jsx)
      swipe: true,
      touchMove: true,
      draggable: true,
      swipeToSlide: true,
      touchThreshold: 8,
      accessibility: true,
    };

    if (!Array.isArray(item?.productImages) || !mainImage) return null;

    const stop = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const checkMaxQty = (size) => {
      if (!basket) return false;
      const child = item?.childProducts?.find(
        (c) => c?.size?.value === size?.value,
      );
      const targetItem = child?.id ? child : item;

      // Check Max Quantity (optimistic check with 99 fallback)
      const maxQty = Math.max(0, Number(targetItem.stock ?? 99));
      const line = (basket?.productItems || []).find(
        (li) => li?.productId === targetItem.id,
      );
      const currentQty = Number(line?.quantity || 0);

      return currentQty >= maxQty && maxQty > 0;
    };

    return (
      <Box position="relative" overflow="visible" h="full">
        {/* Image area */}
        <Box
          position="relative"
          w="full"
          h="full"
          overflow="hidden"
          role="group"
        >
          {/* MOBILE: Swipeable Carousel with Custom Dots */}
          {isMobile && carouselImages.length > 0 ? (
            <Box h="full" w="full" position="relative">
              <Slider {...sliderSettings} ref={sliderRef}>
                {carouselImages.map((img, i) => (
                  <Box key={i} h="full" w="full" position="relative">
                    <Image
                      src={img.src || "/api/placeholder/200/200"}
                      alt={img.alt || "Product"}
                      loading={i === 0 ? "eager" : "lazy"} // Eager only first
                      fetchPriority={i === 0 ? "high" : "auto"} // High priority for LCP
                      decoding="async"
                      h="full"
                      w="full"
                      objectFit="cover"
                      objectPosition="top"
                    />
                  </Box>
                ))}
              </Slider>

              {/* Bottom Progress Bar (Slider) */}
              {carouselImages.length > 1 && (
                <Box
                  position="absolute"
                  bottom="0"
                  left="0"
                  right="0"
                  h="2px"
                  bg="blackAlpha.100"
                  zIndex={10}
                >
                  <Box
                    h="100%"
                    bg="blackAlpha.800"
                    transition="all 0.3s ease"
                    width={`${100 / carouselImages.length}%`}
                    transform={`translateX(${currentSlide * 100}%)`}
                  />
                </Box>
              )}
            </Box>
          ) : (
            /* DESKTOP: Standard Hover Effect */
            <>
              {/* Base image */}
              {/* ✅ Performance Optimization: Eager load first 4 images */}
              <Image
                src={mainImage?.image || "/api/placeholder/200/200"}
                alt={item?.title || "Product"}
                loading={index < 4 ? "eager" : "lazy"}
                fetchPriority={index < 4 ? "high" : "auto"}
                decoding="async"
                position="absolute"
                inset={0}
                h="full"
                w="full"
                objectFit="cover"
                objectPosition="top"
                transition="opacity 0.3s ease"
                opacity={1}
              />

              {/* Hover image */}
              {hoverImage && (
                <Image
                  src={hoverImage?.image || "/api/placeholder/200/200"}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  position="absolute"
                  inset={0}
                  h="full"
                  w="full"
                  objectFit="cover"
                  objectPosition="top"
                  transition="opacity 0.3s ease, transform 0.3s ease"
                  opacity={0}
                  _hover={{ opacity: 1, transform: "scale(1.03)" }}
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              )}
            </>
          )}

          {/* Wishlist slot */}
          {isHidden ? null : (
            <Box position="absolute" top={2} right={2} zIndex={10}>
              <IconButton
                id="wishlist-btn"
                aria-label="Add/Remove wishlist"
                icon={
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10.4107 19.9677C7.58942 17.858 2 13.0348 2 8.69444C2 5.82563 4.10526 3.5 7 3.5C8.5 3.5 10 4 12 6C14 4 15.5 3.5 17 3.5C19.8947 3.5 22 5.82563 22 8.69444C22 13.0348 16.4106 17.858 13.5893 19.9677C12.6399 20.6776 11.3601 20.6776 10.4107 19.9677Z"
                      stroke="black"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill={isWishlisted ? "black" : "transparent"}
                    />
                  </svg>
                }
                size="sm"
                fontSize="24px"
                variant="ghost"
                color="black"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWishlist(item);
                }}
                bg="transparent"
                _hover={{ bg: "transparent" }}
              />
            </Box>
          )}

          {/* Cart icon + panel wrapper */}
          {!isExchangeMode && !isHidden && (
            <Box
              position="absolute"
              bottom={8}
              left="50%"
              transform="translateX(-50%)"
              zIndex={20}
            >
              <Box
                position="relative"
                display="inline-block"
                onMouseEnter={() => {
                  if (!isMobile) setIsHover(true);
                }}
                onMouseLeave={() => {
                  if (!isMobile) setIsHover(false);
                }}
              >
                {/* Cart Icon */}
                <Button
                  aria-label="Open sizes"
                  variant="ghost"
                  bg="blackAlpha.200"
                  borderRadius={"full"}
                  backdropFilter="blur(10px)"
                  _hover={{ bg: "transparent" }}
                  onClick={(e) => {
                    stop(e);
                    if (isMobile) setIsOpenMobile((v) => !v); // mobile: toggle inline
                  }}
                  p={2}
                >
                  <Image
                    src={cartIcon}
                    alt="Cart Icon"
                    w="5"
                    h="5"
                    cursor="pointer"
                    transition="transform 0.2s ease"
                    _hover={!isMobile ? { transform: "scale(1.05)" } : {}}
                  />
                </Button>

                {/* 💻 Desktop hover panel */}
                {!isMobile && (
                  <Box
                    id="add-to-cart"
                    role="dialog"
                    aria-label="Add to Cart"
                    position="absolute"
                    left="50%"
                    transform={`translateX(-50%) ${isHover ? "" : "translateY(8px) scale(0.98)"}`}
                    bottom="-4px"
                    w="230px"
                    bg="blackAlpha.100"
                    backdropFilter="blur(10px)"
                    px={2}
                    py={2}
                    shadow="lg"
                    zIndex={30}
                    transition="opacity 0.18s ease, transform 0.18s ease"
                    opacity={isHover ? 1 : 0}
                    pointerEvents={isHover ? "auto" : "none"}
                    onClick={stop}
                  >
                    <Text
                      fontSize="xs"
                      fontWeight="medium"
                      color="white"
                      textAlign="center"
                      mb={2}
                      textTransform={"uppercase"}
                    >
                      Add to Cart
                    </Text>

                    {/* Sizes from availableSizes only */}
                    <Flex gap={1} justify="center">
                      {(item?.availableSizes || []).map((size) => {
                        const disabled = !size?.value || !size?.orderable;
                        const isMaxReached = checkMaxQty(size);
                        return (
                          <button
                            id={`btn-${size.value}`}
                            key={size.value}
                            disabled={disabled}
                            onClick={async (e) => {
                              stop(e);
                              if (disabled) return;

                              // Even if max reached visually, allow click to trigger toast
                              const btn = e.currentTarget;
                              btn.style.opacity = "0.6";
                              btn.style.cursor = "not-allowed";
                              btn.disabled = true;

                              try {
                                const childProduct = item?.childProducts?.find(
                                  (child) => child?.size?.value === size.value,
                                );

                                const idToAdd = childProduct?.id || item.id;
                                await addProductToCart(idToAdd);
                              } finally {
                                btn.style.opacity = "1";
                                btn.style.cursor = "pointer";
                                btn.disabled = false;
                              }
                            }}
                            style={{
                              fontSize: "12px",
                              padding: "4px 8px",
                              // Grey out if disabled OR max quantity reached
                              backgroundColor:
                                disabled || isMaxReached ? "#f5f5f5" : "#fff",
                              color: "#000",
                              cursor: disabled ? "not-allowed" : "pointer",
                              position: "relative",
                            }}
                          >
                            {size?.name}
                            {disabled && (
                              <span
                                style={{
                                  position: "absolute",
                                  top: "50%",
                                  left: "50%",
                                  width: "70%",
                                  height: "1px",
                                  backgroundColor: "rgba(0,0,0,0.6)",
                                  transform:
                                    "translate(-50%, -50%) rotate(140deg)",
                                  pointerEvents: "none",
                                }}
                              />
                            )}
                          </button>
                        );
                      })}
                    </Flex>
                  </Box>
                )}

                {/* 📱 Mobile inline popover */}
                {isMobile && (
                  <Box
                    ref={panelRef}
                    role="dialog"
                    id="add-to-cart"
                    aria-label="Add to Cart"
                    position="absolute"
                    left="50%"
                    transform={`translateX(-50%) ${isOpenMobile ? "" : "translateY(8px) scale(0.98)"}`}
                    bottom="-4px"
                    w="92vw"
                    maxW="200px"
                    bg="blackAlpha.100"
                    backdropFilter="blur(10px)"
                    px={3}
                    py={3}
                    zIndex={40}
                    transition="opacity 0.18s ease, transform 0.18s ease"
                    opacity={isOpenMobile ? 1 : 0}
                    pointerEvents={isOpenMobile ? "auto" : "none"}
                    onClick={stop}
                  >
                    {/* Floating close button */}
                    <IconButton
                      aria-label="Close"
                      icon={<IoMdClose />}
                      size="xs"
                      variant="ghost"
                      color="whiteAlpha.900"
                      position="absolute"
                      top="4px"
                      right="4px"
                      onClick={() => setIsOpenMobile(false)}
                    />

                    <Flex align="center" justify="center" mb={2}>
                      <Text
                        fontSize="sm"
                        fontWeight="medium"
                        color="white"
                        textTransform={"uppercase"}
                      >
                        Add to Cart
                      </Text>
                    </Flex>

                    <Flex flexWrap="wrap" gap={2} justify="center">
                      {(item?.availableSizes || []).map((size) => {
                        const disabled = !size?.value || !size?.orderable;
                        const isMaxReached = checkMaxQty(size);
                        return (
                          <button
                            id={`btn-${size.value}`}
                            key={size.value}
                            disabled={disabled}
                            onClick={async (e) => {
                              stop(e);
                              if (disabled) return;

                              const btn = e.currentTarget;
                              btn.style.opacity = "0.6";
                              btn.style.cursor = "not-allowed";
                              btn.disabled = true;

                              try {
                                const childProduct = item?.childProducts?.find(
                                  (child) => child?.size?.value === size.value,
                                );

                                const idToAdd = childProduct?.id || item.id;
                                await addProductToCart(idToAdd); //  toast
                                setIsOpenMobile(false);
                              } finally {
                                btn.style.opacity = "1";
                                btn.style.cursor = "pointer";
                                btn.disabled = false;
                              }
                            }}
                            style={{
                              fontSize: "10px",
                              padding: "4px 6px",
                              backgroundColor:
                                disabled || isMaxReached
                                  ? "#f5f5f5"
                                  : "#ffffff",
                              color: "#000000",
                              cursor: disabled ? "not-allowed" : "pointer",
                              position: "relative",
                            }}
                          >
                            {size?.name}

                            {/* Out of stock cross line */}
                            {disabled && (
                              <span
                                style={{
                                  position: "absolute",
                                  top: "50%",
                                  left: "50%",
                                  width: "70%",
                                  height: "1px",
                                  backgroundColor: "rgba(0,0,0,0.6)",
                                  transform:
                                    "translate(-50%, -50%) rotate(140deg)",
                                  pointerEvents: "none",
                                }}
                              />
                            )}
                          </button>
                        );
                      })}
                    </Flex>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    );
  },
  (prevProps, nextProps) => {
    // ✅ Performance Optimization: Custom comparison to prevent unnecessary re-renders
    return (
      prevProps.item?.id === nextProps.item?.id &&
      prevProps.item?.price === nextProps.item?.price &&
      prevProps.item?.productImages?.[0]?.image ===
      nextProps.item?.productImages?.[0]?.image &&
      prevProps.isWishlisted === nextProps.isWishlisted &&
      prevProps.toggleWishlist === nextProps.toggleWishlist &&
      prevProps.basket === nextProps.basket &&
      prevProps.isExchangeMode === nextProps.isExchangeMode
    );
  },
);

export default ChakraProductListingSimple;
