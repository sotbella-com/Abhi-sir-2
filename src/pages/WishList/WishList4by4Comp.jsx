import { Fragment, useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useWishlistStore } from "@/context/wishlistStore";
import { useUnifiedCartStore } from "@/context/unifiedCartStore";
import { useAuth } from "@/context/AuthContext";
import EmptyWishlistAnimation from "../../assets/images/empty.png";
const PLACEHOLDER_IMG = EmptyWishlistAnimation;
import { useMobile } from "@/components/molecules";
import { CURRENCY_SYMBOL } from "@/constants/constants";
import { getImageUrl } from "@/utils/url";
import cartIcon from "@/public/cart.png";
import scaleIcon from "@/public/scale.webp";
import SizeChartPopup from "../ProductDetails/components/SizeChartPopup";
import {
  Box,
  Flex,
  Grid,
  Image as CImage,
  Text,
  Button,
  IconButton,
} from "@chakra-ui/react";

/* -------------------------------- Shimmer -------------------------------- */
const Shimmer = ({ h = "100%", w = "100%", rounded = "0", ...rest }) => (
  <Box
    position="relative"
    overflow="hidden"
    bg="gray.200"
    h={h}
    w={w}
    borderRadius={rounded}
    _before={{
      content: '""',
      position: "absolute",
      inset: 0,
      transform: "translateX(-100%)",
      bgGradient:
        "linear(to-r, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0) 100%)",
      animation: "shimmerMove 1.2s infinite",
    }}
    sx={{ "@keyframes shimmerMove": { "100%": { transform: "translateX(100%)" } } }}
    {...rest}
  />
);

const isHttp = (u) => typeof u === "string" && /^https?:\/\//i.test(u);

/* ------------------------------- Main Comp ------------------------------- */
const WishList4by4Comp = () => {
  const { addToBasket } = useUnifiedCartStore();
  const { isAuthenticated, user } = useAuth();
  const [openSizeGuide, setOpenSizeGuide] = useState(false);

  const wishListProduct = useWishlistStore((s) => s.wishListProduct);
  const removeFromWishlist = useWishlistStore((s) => s.removeFromWishlist);
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);

  const navigate = useNavigate();
  const isMobile = useMobile();

  
  // ✅ hydrate wishlist
  useEffect(() => {
    fetchWishlist({ customerId: user?.id }).catch(() => { });
  }, [user?.id, fetchWishlist]);

  const handleDetailPage = (item) => {
    if (!item?.product?.id) return;
    navigate(`/product/${item.product.id}`);
  };

  // Always pass productId (parent) + optional variantId (size)
  const addProductToCart = ({ productId, variantId = null, quantity = 1 }) => {
    const parentWrapper = wishListProduct.find((w) => w?.product?.id === productId);
    const parent = parentWrapper?.product;
    if (!parent) return;

    const variant = parent?.childProducts?.find((v) => v?.id === variantId) ?? null;
    const productToAdd = variant ?? parent;

    if (!productToAdd?.id) return;
    try {
      addToBasket(productToAdd.id, quantity);
      // toast.success("Added to cart");
    } catch (e) {
    }
  };

  const handleDelete = async (product) => {
    try {
      await removeFromWishlist({
        productId: product.id,
        navigate,
        customerId: user?.id,
      });
      await fetchWishlist({ customerId: user?.id });
      // toast.success("Removed from wishlist");
    } catch (error) {
    }
  };

  return (
    <Fragment>
      <Box mt={isMobile ? "10%" : "100px"} />

      <Box px={{ base: 3, md: "50px" }} pb={3} pt={{ base: 5, md: 0 }}>
        <Text as="h5" fontSize="sm" fontWeight="bold">
          My Wishlist:{" "}
          <Text as="span" fontWeight="normal">
            ({wishListProduct?.length || 0} Items)
          </Text>
        </Text>
      </Box>

      <Box w="full" border="0">
        <Grid
          templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }}
          gap={0}
          px={{ base: 3, md: "50px" }}
        >
          {Array.isArray(wishListProduct) && wishListProduct.length > 0 ? (
            wishListProduct.map((item) => {
              const product = item?.product || {};
              const currencyCode =CURRENCY_SYMBOL;           

              const price = Number(product?.price ?? 0);
              const displayPrice = Number(product?.displayPrice ?? 0);
              const hasStriked = displayPrice && displayPrice !== price;

              return (
                <Box
                  id={`${item.id}`}
                  key={item?.id || product?.id}
                  position="relative"
                  borderWidth="1px"
                  borderColor="white"
                  cursor="pointer"
                >
                  <Box onClick={() => handleDetailPage(item)}>
                    <ProductImage
                      item={item}
                      addProductToCart={addProductToCart}
                      onNavigate={() => handleDetailPage(item)}
                    />
                  </Box>

                  {/* Delete (X) */}
                  <IconButton
                    aria-label="Remove from wishlist"
                    icon={<Box as="i" className="fa-solid fa-xmark" />}
                    position="absolute"
                    top={{ base: 1, md: 2 }}
                    right={{ base: 1, md: 2 }}
                    size="sm"
                    variant="ghost"
                    color="black"
                    onClick={() => handleDelete(product)}
                    _hover={{ bg: "none" }}
                  />

                  <Box px={1} pb={4} pt={2}>
                    <Flex align="flex-start" justify="space-between" gap={2}>
                      <Box minW={0}>
                        <Text
                          fontWeight="normal"
                          noOfLines={1}
                          fontSize={isMobile ? "14px" : "14px"}
                        >
                          {product?.title || "—"}
                        </Text>

                        <Text fontSize={{ base: "sm", md: "sm" }} color="black">
                          {currencyCode} {price.toFixed(2)}
                          {hasStriked && (
                            <Text
                              as="span"
                              color="gray.400"
                              textDecor="line-through"
                              ml={1}
                            >
                              {currencyCode} {displayPrice.toFixed(2)}
                            </Text>
                          )}
                        </Text>
                      </Box>

                      {/* Size Guide */}
                      <Box
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenSizeGuide(true);
                        }}
                        minW={"15%"}
                        display="flex"
                        justifyContent="end"
                      >
                        <CImage src={scaleIcon} alt="Size Guide" h={5} w={5} mt={2} />
                      </Box>
                    </Flex>
                  </Box>
                </Box>
              );
            })
          ) : (
            <Box textAlign="center" my={6} gridColumn="1 / -1">
              <Box maxW="350px" mx="auto">
                <CImage src={EmptyWishlistAnimation} alt="Empty Wishlist" />
              </Box>

              <Box my={4}>
                <Text as="h4" fontSize="lg" fontWeight="semibold">
                  Hey, it looks empty!
                </Text>
                <Text fontSize="sm">
                  Oops! Your Wishlist is empty. Start adding your items now.
                </Text>
              </Box>

              <Button
                as={RouterLink}
                to="/category/all dresses"
                bg="black"
                color="white"
                fontSize="sm"
                borderRadius="0"
                fontWeight="normal"
                px={5}
                py={2}
                textTransform="uppercase"
                _hover={{ bg: "blackAlpha.800", textDecoration: "none" }}
              >
                Shop Now
              </Button>
            </Box>
          )}
        </Grid>
      </Box>

      {/* Size Guide Modal */}
      <SizeChartPopup
        open={openSizeGuide}
        handleClose={() => setOpenSizeGuide(false)}
        product={{}}
        onComplete={() => { }}
      />
    </Fragment>
  );
};

/* ---------------------------- ProductImage (Chakra) ---------------------------- */
const ProductImage = ({ item, addProductToCart, onNavigate }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [hoverIdx, setHoverIdx] = useState(0);          // 0: primary, 1: secondary on hover
  const [isIconHover, setIsIconHover] = useState(false);
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const isMobile = useMobile();

  const parentDisabled = (item?.product?.stock ?? 1) < 1;

  const images = Array.isArray(item?.product?.productImages)
    ? item.product.productImages
    : [];
  const primary = images[0]?.image || "";
  const secondary = images[1]?.image || "";             // will show on hover if present

  // resolve URL (absolute use as-is, else via getImageUrl)
  const resolve = (u) => (isHttp(u) ? u : getImageUrl(u));
  const currentSrc = resolve(hoverIdx === 1 && secondary ? secondary : primary) || PLACEHOLDER_IMG;

  // preload secondary (if exists)
  useEffect(() => {
    if (!secondary) return;
    const img = new Image();
    img.src = resolve(secondary);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondary]);

  useEffect(() => setImgLoaded(false), [currentSrc]);
  useEffect(() => {
    if (!currentSrc) return;
    const img = new Image();
    img.src = currentSrc;
    const done = () => setImgLoaded(true);
    img.onload = done; img.onerror = done;
    return () => { img.onload = null; img.onerror = null; };
  }, [currentSrc]);

  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };

  // ONLY API sizes
  const sizes = Array.isArray(item?.product?.childProducts)
    ? item.product.childProducts
    : [];
  const hasSizes = sizes.length > 0;

  // Panel open only when sizes exist
  const open = hasSizes ? (isMobile ? isOpenMobile : isIconHover) : false;

  const handleIconClick = (e) => {
    stop(e);
    if (!hasSizes) {
      if (!parentDisabled) addProductToCart({ productId: item.product.id, variantId: null });
      return;
    }
    if (isMobile) setIsOpenMobile((v) => !v);
  };

  const addAndClose = ({ variantId }) => {
    addProductToCart({ productId: item.product.id, variantId });
    if (isMobile) setIsOpenMobile(false);
  };

  return (
    <Box position="relative" overflow="hidden">
      {/* IMAGE — click to navigate; hover changes image */}
      <Box
        position="relative"
        w="full"
        aspectRatio={"3 / 4"}
        overflow="hidden"
        onMouseEnter={() => {
          if (!isMobile && secondary) setHoverIdx(1);
        }}
        onMouseLeave={() => {
          if (!isMobile) setHoverIdx(0);
        }}
      >
        <Box w="full" h="full" position="relative">
          {!imgLoaded && <Shimmer position="absolute" inset={0} />}
          <CImage
            src={currentSrc}
            alt={item?.product?.title || "Product Image"}
            onClick={onNavigate}
            draggable={false}
            position="absolute"
            inset={0}
            h="full"
            w="full"
            objectFit="cover"
            transition="opacity .25s ease, transform .25s ease"
            opacity={imgLoaded ? 1 : 0}
            // Small zoom only on image hover (not required for panel)
            _hover={{ transform: secondary ? "scale(1.02)" : "none" }}
            onError={(e) => {
              if (e?.target && e.target.src !== PLACEHOLDER_IMG) e.target.src = PLACEHOLDER_IMG;
            }}
          />
        </Box>
      </Box>

      {/* MOBILE overlay to close add-to-cart */}
      {isMobile && open && (
        <Box
          as="button"
          aria-label="Close size panel"
          position="absolute" inset={0} zIndex={10}
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* TRIGGER + PANEL (opens only on cart icon hover/click) */}
      <Box
        position="absolute"
        bottom="10"
        left="50%"
        transform="translateX(-50%)"
        zIndex={20}
        pointerEvents="none"
        onMouseEnter={() => !isMobile && hasSizes && setIsIconHover(true)}
        onMouseLeave={() => !isMobile && hasSizes && setIsIconHover(false)}
      >
        <Box position="relative" display="inline-block" pointerEvents="auto">
          {/* Cart trigger */}
          <Button
            variant="unstyled"
            display="flex"
            alignItems="center"
            bg="blackAlpha.100"
            borderRadius="full"
            backdropFilter="blur(10px)"
            aria-label="Open sizes"
            onClick={handleIconClick}
            onMouseEnter={() => !isMobile && hasSizes && setIsIconHover(true)}
            onMouseLeave={() => !isMobile && hasSizes && setIsIconHover(false)}
            isDisabled={parentDisabled && !hasSizes}
          >
            <CImage
              src={cartIcon}
              alt=""
              w={4} h={4}
              transition="transform .2s, opacity .2s"
              opacity={open ? 0.6 : 1}
              transform={open ? "scale(0.95)" : "scale(1)"}
            />
          </Button>

          {/* Size panel */}
          <Box
            position="absolute"
            left="50%"
            bottom="-2"
            transform={`translate(-50%, ${open ? "0" : "100%"}) scale(${open ? 1 : 0.9})`}
            w={{ base: "10.5rem", sm: "13rem", md: "10.5rem", xl: "15.5rem" }}
            bg="blackAlpha.100"
            backdropFilter="blur(8px)"
            px={{ base: 1, md: 3 }}
            py={{ base: 2, md: 3 }}
            boxShadow="xl"
            color="white"
            transition="transform .25s ease, opacity .25s ease"
            opacity={open ? 1 : 0}
            pointerEvents={open ? "auto" : "none"}
            onClick={stop}
            onMouseEnter={() => !isMobile && hasSizes && setIsIconHover(true)}
            onMouseLeave={() => !isMobile && hasSizes && setIsIconHover(false)}
          >
            <Flex align="center" justify="center" mb={2} position="relative">
              <Text fontSize="sm" fontWeight="medium">
                Add to cart
              </Text>
              {isMobile && (
                <Button
                  aria-label="Close"
                  variant="unstyled"
                  position="absolute"
                  right={-3} top={-3}
                  color="whiteAlpha.800" fontSize="9px"
                  onClick={(e) => { stop(e); setIsOpenMobile(false); }}
                >
                  ✕
                </Button>
              )}
            </Flex>

            <Flex justify="center" gap={{ base: 1, sm: 1 }}>
              {sizes.map((s, idx) => {
                const disabled = (s?.stock ?? 0) < 1 || !s?.id;
                const label = s?.size?.name || `Size ${idx + 1}`;
                return (
                  <Button
                    key={s.id || label + idx}
                    onClick={(e) => {
                      stop(e);
                      if (disabled) return;
                      addAndClose({ variantId: s.id });
                    }}
                    size="xs"
                    px={{ base: 0.5, sm: 2 }}
                    py={{ base: 0.5, sm: 2 }}
                    bg="white" color="black"
                    rounded="none"
                    fontWeight="normal"
                    isDisabled={disabled}
                    _hover={{ bg: "white" }}
                    _disabled={{ bg: "whiteAlpha.800", color: "blackAlpha.800", cursor: "not-allowed" }}
                    fontSize={{ base: "10px", md: "xs" }}
                    position="relative"
                  >
                    {label}
                    {disabled && (
                      <Box position="absolute" inset={0} display="flex" alignItems="center" justifyContent="center" pointerEvents="none">
                        <Box w="70%" h="1px" bg="blackAlpha.800" transform="rotate(140deg)" />
                      </Box>
                    )}
                  </Button>
                );
              })}
            </Flex>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default WishList4by4Comp;
