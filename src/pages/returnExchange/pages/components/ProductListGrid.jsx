import React, { Fragment, useMemo, useRef, useState, useEffect } from "react";
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
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useWishlistStore } from "@/context/wishlistStore";
import { useAuth } from "@/context/AuthContext";
// ✅ CHANGE: remove cart store
// import { useUnifiedCartStore } from "@/context/unifiedCartStore";
import { ShimmerProducts } from "@/components/layouts";
import { useMobile } from "@/components/molecules";
import { sortProducts } from "@/utils/sortProducts";
// ✅ CHANGE: remove cart icon
// import cartIcon from "@/public/cart.png";
import scaleIcon from "@/public/scale.webp";
// ✅ CHANGE: remove close icon (only used for cart popup)
// import { IoMdClose } from "react-icons/io";
import SizeChartPopup from "@/pages/ProductDetails/components/SizeChartPopup";
import { toast } from "react-toastify";

/* -------------------- helpers -------------------- */
const hasImage = (item) =>
    Array.isArray(item?.productImages) &&
    item.productImages.length > 0 &&
    Boolean(item.productImages?.[0]?.image);

// ✅ CHANGE: remove helper used only by cart popup
// const getVariantIdBySize = (item, sizeObj) => {
//   const targetVal = sizeObj?.value ?? sizeObj?.name;
//   if (!targetVal) return null;
//   const child = item?.childProducts?.find(
//     (c) => (c?.size?.value ?? c?.size?.name) === targetVal
//   );
//   return child?.id || null;
// };

/* ================================================================
   Main grid
   ================================================================ */
const ProductListingGrid = ({
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

    const sortedProducts = useMemo(
        () => sortProducts(collectionPoduct, sortBy),
        [collectionPoduct, sortBy]
    );

    // ✅ CHANGE: remove Cart hook
    // const { addToBasket } = useUnifiedCartStore();

    // Wishlist
    const wishListProduct = useWishlistStore((s) => s.wishListProduct);
    const addToWishlist = useWishlistStore((s) => s.addToWishlist);
    const removeFromWishlist = useWishlistStore((s) => s.removeFromWishlist);
    const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);
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

    // EXACT wishlist page behavior: remove => store does hardRefresh(navigate)
    const toggleWishlist = async (item) => {
        if (!item?.id) return;
        if (inWishlist(item.id)) {
            await removeFromWishlist({
                productId: item.id,
                navigate,
                customerId: user?.id,
            });
            // toast.success("Removed from wishlist.");
            // 🔁 Force full page reload to update icons and UI instantly
            setTimeout(() => {
                navigate(0);
            }, 300);
        } else {
            await addToWishlist({
                item,
                isAuthenticated,
                navigate,
                customerId: user?.id,
            });
            // toast.success("Added to wishlist.");
        }
    };

    // ✅ CHANGE: remove addProductToCart completely
    // const addProductToCart = (id) => {
    //   if (!id) return;
    //
    //   // Parent (same id as product)
    //   const main = collectionPoduct?.find((p) => p.id === id);
    //   if (main) {
    //     addToBasket(main.id, 1);
    //     return;
    //   }
    //
    //   // Child (variant)
    //   const parent = collectionPoduct?.find(
    //     (p) =>
    //       Array.isArray(p.childProducts) &&
    //       p.childProducts.some((c) => c.id === id)
    //   );
    //   const child = parent?.childProducts?.find((c) => c.id === id);
    //
    //   if (child) {
    //     let payload = child;
    //
    //     // for guest, enrich title/images from parent (nice UX)
    //     if (!isAuthenticated && parent) {
    //       payload = {
    //         ...child,
    //         title: parent.title ?? child.title,
    //         productImages: [
    //           ...(Array.isArray(parent.productImages) ? parent.productImages : []),
    //           ...(Array.isArray(child.productImages) ? child.productImages : []),
    //         ],
    //       };
    //     }
    //
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
                            base: "repeat(2, 1fr)",
                            md: "repeat(3, 1fr)",
                            lg: "repeat(4, 1fr)",
                        }}
                    >
                        {Array.isArray(sortedProducts) &&
                            sortedProducts.length > 0 &&
                            sortedProducts.map((item) => {
                                const price = Number(item?.price) || 0;
                                const displayPrice = Number(item?.displayPrice ?? item?.price) || 0;
                                const hasDiscount =
                                    price > 0 && displayPrice > 0 && displayPrice > price;

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
                                                // ✅ CHANGE: ChakraProductImage no longer receives addProductToCart
                                                <ChakraProductImage item={item}>
                                                    {/* Wishlist button */}
                                                    <IconButton
                                                        id="wishlist-btn"
                                                        aria-label="Add/Remove wishlist"
                                                        icon={
                                                            <svg
                                                                width="20"
                                                                height="20"
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
                                            <HStack justify="space-between" align="center">
                                                <Text
                                                    fontSize="sm"
                                                    fontWeight="semibold"
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
                                                >
                                                    <IconButton
                                                        aria-label="Size Guide"
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

/* ================================================================
   Image (exact UI kept, cart removed)
   ================================================================ */
const ChakraProductImage = ({ item, children }) => {
    const isMobile = useMobile();

    // ✅ CHANGE: keep these for minimal diff, but they do nothing now
    const [isHover, setIsHover] = useState(false);
    const [isOpenMobile, setIsOpenMobile] = useState(false);

    const panelRef = useRef(null);
    useOutsideClick({ ref: panelRef, handler: () => setIsOpenMobile(false) });

    const mainImage = item?.productImages?.[0];
    const hoverImage = item?.productImages?.[1];
    if (!Array.isArray(item?.productImages) || !mainImage) return null;

    const stop = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    // ✅ CHANGE: remove cart helper
    // const isSizeOOS = (s) => !s?.value || !s?.orderable;

    return (
        <Box position="relative" overflow="visible" h="full">
            {/* Images */}
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
                        _groupHover={{ opacity: 1, transform: "scale(1.03)" }}
                        onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                )}

                {/* Wishlist slot */}
                <Box position="absolute" top={2} right={2} zIndex={10}>
                    {children}
                </Box>

                {/* ✅ CHANGE: Cart icon + sizes removed */}
            </Box>
        </Box>
    );
};

export default ProductListingGrid;
