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
// ❌ remove this, we don't want global fallback any more
// import { CURRENCY_SYMBOL } from "@/constants/constants";
import { useMobile } from "@/components/molecules";
import { sortProducts } from "@/utils/sortProducts";
import scaleIcon from "@/public/scale.webp";
import cartIcon from "@/public/cart.png";
import SizeChartPopup from "@/pages/ProductDetails/components/SizeChartPopup";
import { slugToCategoryId } from "@/utils/categoryLinks";

import { searchCategoryProducts } from "@/api/services/categorySearch";
import { transformSFCCProduct } from "@/utils/sfccProductTransform";
import ShimmerGridProducts from "@/components/layouts/Simmers/ShimmerGridProducts";
import { toast } from "react-toastify";
import { MdClose } from "react-icons/md";

const hasImage = (item) =>
  Array.isArray(item?.productImages) &&
  item.productImages.length > 0 &&
  Boolean(item.productImages?.[0]?.image);


const DEFAULT_LIMIT = 12;
const NEW_IN_SLUG = "new_in";

const YouMayLike = ({
  currentProductId,
  sortBy,
  isActive = true,
}) => {
  const isMobile = useMobile();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  const { addToBasket } = useUnifiedCartStore();

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

  const toggleWishlist = async (item) => {
    if (!item?.id) return;
    if (inWishlist(item.id)) {
      await removeFromWishlist({
        productId: item.id,
        navigate,
        customerId: user?.id,
      });
      // toast.success("Remove from wishlist.");
      setTimeout(() => navigate(0), 250);
    } else {
      await addToWishlist({ item, isAuthenticated, navigate, customerId: user?.id });
      // toast.success("Added to wishlist.");
    }
  };

  const addProductToCart = async (idOrChildId, list) => {
    if (!idOrChildId) return;
    const main = list?.find((p) => p.id === idOrChildId);
    if (main) return addToBasket(main.id, 1);

    const parent = list?.find(
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
      state: { fromCollection: { slug: NEW_IN_SLUG, name: "New In" } },
    });
  };

  useEffect(() => {
    let ignore = false;

    (async () => {
      setLoading(true);
      try {
        // const categoryId = slugToCategoryId(NEW_IN_SLUG) || NEW_IN_SLUG;
        const categoryId = NEW_IN_SLUG;

        const response = await searchCategoryProducts(categoryId, {
          limit: DEFAULT_LIMIT + 4,
          offset: 0,
          siteId: null,
          sort: sortBy || "",
        });

        const transformed = response?.hits?.map(transformSFCCProduct).filter(Boolean) || [];

        const filtered = currentProductId
          ? transformed.filter((p) => p.id !== currentProductId)
          : transformed;

        const finalList = filtered.slice(0, DEFAULT_LIMIT);
        if (!ignore) setItems(finalList);
      } catch (err) {
        if (!ignore) setItems([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => { ignore = true; };
  }, [currentProductId, sortBy]);

  const sortedProducts = useMemo(() => sortProducts(items, sortBy), [items, sortBy]);

  const hasProducts = sortedProducts?.length > 0;
  const showSeeMore = !loading && hasProducts;

  return (
    <Fragment>
      {/* Header */}
      <Box px={{ base: "12px", md: "50px" }} mt={8} mb={2}>
        <Flex justify="space-between" align="center">
          {/* <Text fontSize="md" fontWeight="semibold" color="#1d1d1d" textTransform="uppercase">
            You may also like
          </Text> */}
          {showSeeMore && (
            <Button
              as={RouterLink}
              to={`/category/${NEW_IN_SLUG}`}
              size="xs"
              variant="ghost"
              textTransform="uppercase"
              fontWeight="medium"
              _hover={{ bg: "transparent", textDecoration: "underline", fontWeight: "bold" }}
            >
              See more
            </Button>
          )}
        </Flex>
      </Box>

      <Box id="new-in-products" px={{ base: "12px", md: "50px" }} display={isActive ? "block" : "none"}>
        {loading ? (
          items.length === 0 ? (
            <ShimmerGridProducts />
          ) : (
            <Center py={8}><Spinner /></Center>
          )
        ) : sortedProducts?.length ? (
          <Grid templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" }}>
            {sortedProducts.map((item) => {
              const price = Number(item?.price) || 0;
              const displayPrice = Number(item?.displayPrice ?? item?.price) || 0;
              const hasDiscount = price > 0 && displayPrice > 0 && displayPrice > price;

              const representedProductIds = item.representedProduct?.id;
              const productIdToShow = item?.id;

              // 🔹 take currency from product itself (no global fallback)
              const currencyCode =
                item?.currency ||
                item?.currencyCode ||
                item?.currencyISOCode ||
                item?.prices?.currency ||
                "";


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
                      <ChakraProductImage
                        item={item}
                        addProductToCart={(idOrChildId) => addProductToCart(idOrChildId, sortedProducts)}
                      >
                        <IconButton
                          id="wishlist-btn"
                          aria-label="Add/Remove wishlist"
                          icon={
                            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
                          onClick={(e) => { e.stopPropagation(); toggleWishlist(item); }}
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
                        bg="gray.200"
                        w="full"
                        h="full"
                      >
                        <VStack>
                          <Image h="40px" w="auto" mx="auto" src="/api/placeholder/200/200" alt="Image Not Available" />
                          <Text fontSize="xs" color="gray.600">Image Not Available</Text>
                        </VStack>
                      </Box>
                    )}
                  </Box>

                  {/* Product info */}
                  <VStack pb={4} pt={2} px={1} align="stretch" gap={0}>
                    <div id="productId" hidden>{productIdToShow}</div>
                    <div id="product-sku" hidden>{representedProductIds}</div>
                    <HStack justify="space-between" align="center">
                      <Text fontSize="sm" fontWeight="normal" isTruncated title={item?.title}>
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
                          onClick={(e) => { e.stopPropagation(); setIsSizeGuideOpen(true); }}
                          bg="transparent"
                          _hover={{ bg: "transparent" }}
                          _active={{ bg: "transparent" }}
                          _focus={{ boxShadow: "none" }}
                        />
                      </Tooltip>
                    </HStack>

                    {/* 🔹 Currency-aware price row */}
                    <HStack justify="space-between" align="center" mt={0}>
                      <HStack>
                        <Text fontSize="sm" fontWeight="normal" id="product-price">
                          {currencyCode} {price.toFixed(2)}
                        </Text>
                        {hasDiscount && (
                          <Text fontSize="xs" color="blackAlpha.500" as="del">
                            {currencyCode} {displayPrice.toFixed(2)}
                          </Text>
                        )}
                      </HStack>
                    </HStack>
                  </VStack>
                </Box>
              );
            })}
          </Grid>
        ) : (
          <Box>
            {/* <Center h="100%">
              <Text fontSize="sm" color="gray.600" textAlign="center">
                No products found in this selection.
                <br />
                Explore our latest arrivals and find something perfect for you.
              </Text>
            </Center> */}
          </Box>
        )}
      </Box>

      <SizeChartPopup open={isSizeGuideOpen} handleClose={() => setIsSizeGuideOpen(false)} onComplete={() => { }} />
    </Fragment>
  );
};

/* ----- image sub-component (unchanged) ----- */
const ChakraProductImage = ({ item, children, addProductToCart }) => {
  const [isHover, setIsHover] = useState(false);
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const isMobile = useMobile();
  const panelRef = useRef(null);
  useOutsideClick({ ref: panelRef, handler: () => setIsOpenMobile(false) });

  const mainImage = item?.productImages?.[0];
  const hoverImage = item?.productImages?.[1];
  if (!Array.isArray(item?.productImages) || !mainImage) return null;

  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };

  return (
    <Box position="relative" overflow="visible" h="full">
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

        <Box position="absolute" top={2} right={2} zIndex={10}>
          {children}
        </Box>

        <Box position="absolute" bottom={8} left="50%" transform="translateX(-50%)" zIndex={20}>
          <Box
            position="relative"
            display="inline-block"
            onMouseEnter={() => { if (!isMobile) setIsHover(true); }}
            onMouseLeave={() => { if (!isMobile) setIsHover(false); }}
          >
            <Button
              aria-label="Open sizes"
              variant="ghost"
              bg="blackAlpha.100"
              borderRadius={"full"}
              backdropFilter="blur(10px)"
              _hover={{ bg: "transparent" }}
              onClick={(e) => { stop(e); if (isMobile) setIsOpenMobile((v) => !v); }}
              minW="unset"
              minH="unset"
              h={"35px"}
              w={"35px"}
              p={0}
            >
              <Image src={cartIcon} alt="Cart Icon" w="4" h="4" />
            </Button>

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

                <Flex gap={1} justify="center">
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
                            const child = item?.childProducts?.find((c) => c?.size?.value === size?.value);
                            await addProductToCart(child?.id || item.id);
                          } finally {
                            e.currentTarget.style.opacity = "1";
                            e.currentTarget.disabled = false;
                          }
                        }}
                        style={{
                          fontSize: "12px",
                          padding: "3px 8px",
                          backgroundColor: disabled ? "#f5f5f5" : "#ffffff",
                          color: "#000",
                          border: "1px solid #e5e5e5",
                          cursor: disabled ? "not-allowed" : "pointer",
                          position: "relative",
                          textAlign: "center",
                        }}
                        title={disabled ? "Out of stock" : "Add to cart"}
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
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              >
                <IconButton
                  aria-label="Close"
                  icon={<MdClose />}
                  size="xs"
                  variant="ghost"
                  color="whiteAlpha.900"
                  position="absolute"
                  top="6px"
                  right="14px"
                  onClick={() => setIsOpenMobile(false)}
                />
                <Flex align="center" justify="center" mb={2}>
                  <Text fontSize="sm" fontWeight="medium" color="white">Add to Cart</Text>
                </Flex>

                <Flex flexWrap="wrap" gap={1} justify="center">
                  {(item?.availableSizes || []).map((size) => {
                    const disabled = !size?.value || !size?.orderable;
                    const child = item?.childProducts?.find((c) => c?.size?.value === size.value);
                    return (
                      <button
                        id={`btn-${size.value}`}
                        key={size.value}
                        disabled={disabled}
                        onClick={() => { if (!disabled) { addProductToCart(child?.id || item.id); setIsOpenMobile(false); } }}
                        style={{
                          fontSize: "10px",
                          padding: "4px 7px",
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
export default YouMayLike;
