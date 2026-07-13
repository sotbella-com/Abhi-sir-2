import React, { Fragment, useState, useMemo, useRef, useEffect } from "react";
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
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useWishlistStore } from "@/context/wishlistStore";
import { useAuth } from "@/context/AuthContext";
// ✅ CHANGE: removed cart store usage (no add-to-cart feature)
// import { useUnifiedCartStore } from "@/context/unifiedCartStore";
import { ShimmerProducts } from "@/components/layouts";
import { useMobile } from "@/components/molecules";
import { sortProducts } from "@/utils/sortProducts";
import scaleIcon from "@/public/scale.webp";
// ✅ CHANGE: cart icon no longer needed
// import cartIcon from "@/public/cart.png";
// ✅ CHANGE: close icon no longer needed
// import { IoMdClose } from "react-icons/io";
import SizeChartPopup from "@/pages/ProductDetails/components/SizeChartPopup";
import { toast } from "react-toastify";

/** More permissive: treat as having an image if first slot has a URL */
const hasImage = (item) =>
    Array.isArray(item?.productImages) &&
    item.productImages.length > 0 &&
    Boolean(item.productImages?.[0]?.image);

// ✅ CHANGE: helper no longer needed since we removed add-to-cart UI
// const getVariantIdBySize = (item, sizeObj) => {
//   const targetVal = sizeObj?.value ?? sizeObj?.name;
//   if (!targetVal) return null;

//   const child = item?.childProducts?.find(
//     (c) => (c?.size?.value ?? c?.size?.name) === targetVal
//   );
//   return child?.id || null;
// };

const ProductListingSimple = ({
    collectionPoduct,
    loading,
    isActive = true,
    sortBy,
    fromCollection,
    orderId = "",
    isDifferentExchange = false,
    exchangeContext = null,
}) => {
    const isMobile = useMobile();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

    // Sort products based on the sortBy parameter
    const sortedProducts = useMemo(() => {
        return sortProducts(collectionPoduct, sortBy);
    }, [collectionPoduct, sortBy]);

    // ✅ CHANGE: removed CART hook usage
    // const { addToBasket } = useUnifiedCartStore();

    // ✅ WISHLIST
    const addToWishlist = useWishlistStore((s) => s.addToWishlist);
    const removeFromWishlist = useWishlistStore((s) => s.removeFromWishlist);
    const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);
    const wishListProduct = useWishlistStore((s) => s.wishListProduct);
    const isInWishlistStore = useWishlistStore((s) => s.isInWishlist);

    // Use store's isInWishlist function for consistency
    const inWishlist = (id) => {
        if (!id) return false;
        return isInWishlistStore(id);
    };

    // Fetch wishlist on mount if authenticated
    useEffect(() => {
        if (isAuthenticated && user?.id) {
            fetchWishlist({ customerId: user.id });
        }
    }, [isAuthenticated, user?.id, fetchWishlist]);

    // ✅ remove refresh
    const toggleWishlist = async (item) => {
        if (!item?.id) return;

        if (inWishlist(item.id)) {
            await removeFromWishlist({
                productId: item.id,
                navigate,
                customerId: user?.id,
            });
            // toast.success("Removed from wishlist.");
            // Force a full-page refresh so the heart un-fills everywhere
            setTimeout(() => navigate(0), 300);
        } else {
            await addToWishlist({ item, isAuthenticated, navigate, customerId: user?.id });
            // toast.success("Added to wishlist.");
        }
    };

    // ✅ CHANGE: remove add-to-cart function completely
    // const addProductToCart = (id) => {
    //   if (!id) return;

    //   // Parent (same id as product)
    //   const main = collectionPoduct?.find((p) => p.id === id);
    //   if (main) {
    //     addToBasket(main.id, 1);
    //     return;
    //   }

    //   // Child (variant)
    //   const parent = collectionPoduct?.find(
    //     (p) => Array.isArray(p.childProducts) && p.childProducts.some((c) => c.id === id)
    //   );
    //   const child = parent?.childProducts?.find((c) => c.id === id);

    //   if (child) {
    //     let payload = child;

    //     if (!isAuthenticated && parent) {
    //       // build a new object; don't mutate original
    //       payload = {
    //         ...child,
    //         title: parent.title ?? child.title,
    //         productImages: [
    //           ...(Array.isArray(parent.productImages) ? parent.productImages : []),
    //           ...(Array.isArray(child.productImages) ? child.productImages : []),
    //         ],
    //       };
    //     }

    //     addToBasket(payload.id, 1);
    //   }
    // };

    const handleDetailPage = (item) => {
        const qs = new URLSearchParams();
        if (isDifferentExchange) qs.set("isDifferentExchange", "true");
        if (orderId) qs.set("orderId", String(orderId));

        navigate(`/product/${item.slug}/${item.id}?${qs.toString()}`, {
            state: {
                fromCollection,
                ...(exchangeContext ? { exchangeContext } : {}),
            },
        });
    };


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

    return (
        <Fragment>
            <Box
                id="collection3"
                px={{ base: "12px", md: "75px" }}
                display={isActive ? "block" : "none"}
            >
                {loading ? (
                    <ShimmerProducts />
                ) : (
                    <Grid
                        templateColumns={{
                            base: "repeat(1, 1fr)",
                            md: "repeat(2, 1fr)",
                        }}
                    >
                        {Array.isArray(sortedProducts) &&
                            sortedProducts.length > 0 &&
                            sortedProducts.map((item) => {
                                // ✅ Safe discount math
                                const price = Number(item?.price) || 0;
                                const displayPrice = Number(item?.displayPrice ?? item?.price) || 0;
                                const hasDiscount = price > 0 && displayPrice > 0 && displayPrice > price;

                                const representedProductIds = item.representedProduct?.id;
                                const productIdToShow = item?.id;

                                return (
                                    <Box
                                        key={item.id}
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
                                            {hasImage(item) ? (
                                                // ✅ CHANGE: ChakraProductImage no longer takes addProductToCart
                                                <ChakraProductImage item={item}>
                                                    {/* Wishlist button */}
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
                                                                    fill={inWishlist(item?.id) ? "black" : "transparent"}
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
                                                        position="absolute"
                                                        top={0}
                                                        right={0}
                                                        zIndex={10}
                                                        bg="transparent"
                                                        _hover={{ bg: "transparent" }}
                                                    />
                                                </ChakraProductImage>
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
                                        <VStack py={3} px={1} align="stretch" gap={0}>
                                            <div id="productId" hidden>{productIdToShow}</div>
                                            <div id="product-sku" hidden>
                                                {representedProductIds}
                                            </div>

                                            {/* Title + Size Guide */}
                                            <HStack justify="space-between" align="center">
                                                <Text fontSize="sm" fontWeight="semibold" isTruncated title={item?.title}>
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
                                                >
                                                    <IconButton
                                                        aria-label="Size Guide"
                                                        icon={<Image src={scaleIcon} alt="Scale Icon" h="20px" w="auto" />}
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
                                                <HStack>
                                                    <Text fontSize="sm" fontWeight="bold" id="product-price">
                                                        {formatPrice(price, item?.currency)}
                                                    </Text>

                                                    {hasDiscount && (
                                                        <Text fontSize="xs" color="blackAlpha.500" as="del">
                                                            {formatPrice(displayPrice, item?.currency)}
                                                        </Text>
                                                    )}
                                                </HStack>
                                            </HStack>
                                        </VStack>
                                    </Box>
                                );
                            })}
                    </Grid>
                )}
            </Box>

            <SizeChartPopup
                open={isSizeGuideOpen}
                handleClose={() => setIsSizeGuideOpen(false)}
                onComplete={() => { }}
            />
        </Fragment>
    );
};

// ✅ CHANGE: this component is now only responsible for images + wishlist slot.
// Add-to-cart UI removed, but all CSS kept untouched elsewhere.
const ChakraProductImage = ({ item, children }) => {
    const isMobile = useMobile();

    // kept refs/hooks for parity (safe to remove too, but leaving minimal changes)
    const panelRef = useRef(null);
    useOutsideClick({
        ref: panelRef,
        handler: () => { },
    });

    const mainImage = item?.productImages?.[0];
    const hoverImage = item?.productImages?.[1];
    if (!Array.isArray(item?.productImages) || !mainImage) return null;

    return (
        <Box position="relative" overflow="visible" h="full">
            {/* Image area */}
            <Box position="relative" w="full" h="full" overflow="hidden" role="group">
                {/* Base image */}
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

                {/* Hover image */}
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

                {/* ✅ CHANGE: Removed Add-to-cart UI completely */}
            </Box>
        </Box>
    );
};

export default ProductListingSimple;
