import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
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
  Flex,
  useOutsideClick,
  Center,
  Spinner
} from "@chakra-ui/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useWishlistStore } from "@/context/wishlistStore";
import { useAuth } from "@/context/AuthContext";
import { useUnifiedCartStore } from "@/context/unifiedCartStore";
import { ShimmerProducts } from "@/components/layouts";
import { CURRENCY_SYMBOL } from "@/constants/constants";
import { useMobile } from "@/components/molecules";
import { sortProducts } from "@/utils/sortProducts";
import scaleIcon from "@/public/scale.webp";
import cartIcon from "@/public/cart.png";
import { IoMdClose } from "react-icons/io";
import SizeChartPopup from "@/pages/ProductDetails/components/SizeChartPopup";
import { slugToCategoryId } from "@/utils/categoryLinks";

// 🔁 reuse your existing services/utilities
import { searchCategoryProducts } from "@/api/services/categorySearch";
import { transformSFCCProduct } from "@/utils/sfccProductTransform";
import { getProductDetails } from "@/api/services/sfccSearchService";
import ShimmerGridProducts from "@/components/layouts/Simmers/ShimmerGridProducts";
import { toast } from "react-toastify";

/* ---------------------- helpers ---------------------- */
const hasImage = (item) =>
  Array.isArray(item?.productImages) &&
  item.productImages.length > 0 &&
  Boolean(item.productImages?.[0]?.image);

const DEFAULT_LIMIT = 12;

/* ---------------------- main component ---------------------- */
const RecentlyViewedProducts = ({
  fromCollection,
  currentProductId,
  sortBy,
  isActive = true,
}) => {
  const isMobile = useMobile();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [similar, setSimilar] = useState([]);

  // CART
  const { addToBasket } = useUnifiedCartStore();

  // ✅ WISHLIST (now includes removeFromWishlist for toggle + refresh)
  const addToWishlist = useWishlistStore((s) => s.addToWishlist);
  const removeFromWishlist = useWishlistStore((s) => s.removeFromWishlist);
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);
  const wishListProduct = useWishlistStore((s) => s.wishListProduct);
  const isInWishlistStore = useWishlistStore((s) => s.isInWishlist);

  // Fetch wishlist on mount if authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchWishlist({ customerId: user.id });
    }
  }, [isAuthenticated, user?.id, fetchWishlist]);

  // Use store's isInWishlist function for consistency
  const inWishlist = (id) => {
    if (!id) return false;
    return isInWishlistStore(id);
  };

  // 🔁 same as grid: remove → refresh the page so icon & counts sync everywhere
  const toggleWishlist = async (item) => {
    if (!item?.id) return;
    if (inWishlist(item.id)) {
      await removeFromWishlist({
        productId: item.id,
        navigate,
        customerId: user?.id,
      });
      // toast.success("Removed from wishlist.");
      setTimeout(() => navigate(0), 250);
    } else {
      await addToWishlist({ item, isAuthenticated, navigate, customerId: user?.id });
      // toast.success("Added to wishlist.");
    }
  };

  // Add-to-cart logic
  const addProductToCart = async (idOrChildId, parentList) => {
    if (!idOrChildId) return;

    // find by parent id
    const main = parentList?.find((p) => p.id === idOrChildId);
    if (main) {
      await addToBasket(main.id, 1);
      return;
    }

    // or by child id
    const parent = parentList?.find(
      (p) => Array.isArray(p.childProducts) && p.childProducts.some((c) => c.id === idOrChildId)
    );
    const child = parent?.childProducts?.find((c) => c.id === idOrChildId);

    if (child) {
      let payload = child;
      if (!isAuthenticated && parent) {
        payload = {
          ...child,
          title: parent.title ?? child.title,
          productImages: [
            ...(Array.isArray(parent.productImages) ? parent.productImages : []),
            ...(Array.isArray(child.productImages) ? child.productImages : []),
          ],
        };
      }
      await addToBasket(payload.id, 1);
    }
  };

  const handleDetailPage = (item) => {
    navigate(`/product/${item.id}`, {
      state: { fromCollection },
    });
  };

  /* ---------------------- fetch same-category products ---------------------- */
  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        // 1) Try category from router state
        let effectiveCategoryId = null;
        const categorySlug = fromCollection?.slug || null;
        if (categorySlug) {
          effectiveCategoryId = slugToCategoryId(categorySlug) || categorySlug;
        }

        // 2) If missing, derive from current product details
        if (!effectiveCategoryId && currentProductId) {
          const raw = await getProductDetails(currentProductId);
          const catCandidates = [
            raw?.primaryCategoryId,
            raw?.primary_category_id,
            raw?.c_primaryCategory,
            raw?.c_defaultCategory,
            raw?.classificationCategory?.id,
            Array.isArray(raw?.categories) ? raw.categories?.[0]?.id : null,
            raw?.variationAttributes?.find?.((a) => /category/i.test(a?.id || a?.name))?.value,
          ].filter(Boolean);
          effectiveCategoryId = catCandidates[0] || null;
        }

        if (!effectiveCategoryId) {
          if (!ignore) setSimilar([]);
          return;
        }

        // 4) Fetch similar products from that category
        const response = await searchCategoryProducts(effectiveCategoryId, {
          limit: DEFAULT_LIMIT + 4,
          offset: 0,
          siteId: "sotbella_in",
          sort: sortBy || "",
        });

        const transformed =
          response?.hits?.map(transformSFCCProduct).filter(Boolean) || [];
        const filtered = transformed.filter((p) => p.id !== currentProductId);
        const finalList = filtered.slice(0, DEFAULT_LIMIT);
        if (!ignore) setSimilar(finalList);
      } catch (err) {
        if (!ignore) setSimilar([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [fromCollection?.slug, currentProductId, sortBy]);

  // Optional client-side sort
  const sortedProducts = useMemo(() => {
    return sortProducts(similar, sortBy);
  }, [similar, sortBy]);

  /* ---------------------- UI ---------------------- */
  return (
    <Fragment>
      {/* Title Row */}

      <Box
        id="recentlt-viewed-products"
        px={{ base: "12px", md: "50px" }}
        mt={{ base: 4, md: 6 }}
      >
      </Box>

      {/* Size chart modal */}
      <SizeChartPopup
        open={isSizeGuideOpen}
        handleClose={() => setIsSizeGuideOpen(false)}
        onComplete={() => { }}
      />
    </Fragment>
  );
};

/* ---------------------- image sub-component ---------------------- */
const ChakraProductImage = ({ item, children, addProductToCart }) => {
  const [isHover, setIsHover] = useState(false);
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const isMobile = useMobile();

  const panelRef = useRef(null);
  useOutsideClick({
    ref: panelRef,
    handler: () => setIsOpenMobile(false),
  });

  const mainImage = item?.productImages?.[0];
  const hoverImage = item?.productImages?.[1];
  if (!Array.isArray(item?.productImages) || !mainImage) return null;

  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };

  return (
    <Box position="relative" overflow="visible" h="full">
      {/* Base image */}
      <Box position="relative" w="full" h="full" overflow="hidden" role="group">
        <Image
          src={mainImage?.image || "/api/placeholder/200/200"}
          alt={item?.title || "Product"}
          loading="lazy"
          position="absolute"
          inset={0}
          h="full"
          w="full"
          objectFit="cover"
          objectPosition="top"
          transition="opacity 0.3s ease"
          opacity={1}
        />
        {hoverImage && (
          <Image
            src={hoverImage?.image || "/api/placeholder/200/200"}
            alt=""
            aria-hidden="true"
            loading="eager"
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

        {/* Wishlist slot */}
        <Box position="absolute" top={2} right={2} zIndex={10}>
          {children}
        </Box>

        {/* Cart icon + panels */}
        <Box position="absolute" bottom={8} left="50%" transform="translateX(-50%)" zIndex={20}>
          <Box
            position="relative"
            display="inline-block"
            onMouseEnter={() => { if (!isMobile) setIsHover(true); }}
            onMouseLeave={() => { if (!isMobile) setIsHover(false); }}
          >
            {/* Cart Icon */}
            <Button
              aria-label="Open sizes"
              variant="ghost"
              bg="blackAlpha.100"
              borderRadius={"full"}
              backdropFilter="blur(10px)"
              _hover={{ bg: "transparent" }}
              onClick={(e) => {
                stop(e);
                if (isMobile) setIsOpenMobile((v) => !v);
              }}
              minW="unset"
              minH="unset"
              h={"35px"}
              w={"35px"}
              p={0}
            >
              <Image src={cartIcon} alt="Cart Icon" w="4" h="4" />
            </Button>

            {/* Desktop hover size panel */}
            {!isMobile && (
              <Box
                role="dialog"
                id="add-to-cart"
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
                <Text fontSize="xs" fontWeight="medium" color="white" textAlign="center" mb={2}>
                  Add to Cart
                </Text>

                <Flex gap={1} justify="center" id="size-btn">
                  {(item?.availableSizes || []).map((size) => {
                    const disabled = !size?.value || !size?.orderable;
                    return (
                      <button
                        id={`btn-${size?.value}`}
                        key={size?.value || size?.name}
                        disabled={disabled}
                        onClick={async (e) => {
                          stop(e);
                          if (disabled) return;

                          e.currentTarget.style.opacity = "0.6";
                          e.currentTarget.disabled = true;
                          try {
                            const child = item?.childProducts?.find(
                              (c) => c?.size?.value === size?.value
                            );
                            if (child?.id) {
                              await addProductToCart(child.id);
                            } else {
                              await addProductToCart(item.id);
                            }
                          } finally {
                            e.currentTarget.style.opacity = "1";
                            e.currentTarget.disabled = false;
                          }
                        }}
                        title={disabled ? "Out of stock" : "Add to cart"}
                        style={{
                          fontSize: "12px",
                          lineHeight: "28px",
                          height: 28,
                          padding: "0 8px",
                          backgroundColor: disabled ? "#f5f5f5" : "#ffffff",
                          color: "#000",
                          border: "1px solid #e5e5e5",
                          cursor: disabled ? "not-allowed" : "pointer",
                          position: "relative",
                          textAlign: "center",
                        }}
                      >
                        {size?.name || size?.value}
                        {disabled && (
                          <span
                            style={{
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              width: "70%",
                              height: 1,
                              backgroundColor: "rgba(0,0,0,0.8)",
                              transform: "translate(-50%, -50%) rotate(140deg)",
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

            {/* Mobile inline size popover */}
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
                  <Text fontSize="sm" fontWeight="medium" color="white">
                    Add to Cart
                  </Text>
                </Flex>

                <Flex flexWrap="wrap" gap={2} justify="center" id="size-btn">
                  {(item?.availableSizes || []).map((size) => {
                    const disabled = !size?.value || !size?.orderable;
                    return (
                      <button
                        id={`btn-${size.value}`}
                        key={size.value}
                        disabled={disabled}
                        onClick={(e) => {
                          stop(e);
                          if (disabled) return;
                          const child = item?.childProducts?.find(
                            (c) => c?.size?.value === size.value
                          );
                          addProductToCart(child?.id || item.id);
                          setIsOpenMobile(false);
                        }}
                        style={{
                          fontSize: "10px",
                          padding: "4px 6px",
                          backgroundColor: disabled ? "#f5f5f5" : "#ffffff",
                          color: "#000000",
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
                              transform: "translate(-50%, -50%) rotate(140deg)",
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
      </Box>
    </Box>
  );
};

export default RecentlyViewedProducts;
