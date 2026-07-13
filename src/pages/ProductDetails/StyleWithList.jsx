import React, { useEffect, useRef, useState } from "react";
import {
  SimpleGrid,
  Box,
  Image,
  Text,
  HStack,
  Button,
  AspectRatio,
  VStack,
  Flex,
  IconButton,
  useOutsideClick,
  useBreakpointValue,
} from "@chakra-ui/react";
import { IoMdClose } from "react-icons/io";
import cartIcon from "@/public/cart.png";
import { useMobile } from "@/components/molecules";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useWishlistStore } from "@/context/wishlistStore";

import { searchCategoryProducts } from "@/api/services/categorySearch";
import { transformSFCCProduct } from "@/utils/sfccProductTransform";
import { slugToCategoryId } from "@/utils/categoryLinks";
import { getProductDetails } from "@/api/services/sfccSearchService";
import { toast } from "react-toastify";

/* ---------- Shimmer for Style With list ---------- */
const StyleWithListShimmer = ({ count = 8 }) => (
  <SimpleGrid columns={{ base: 4, sm: 4 }} spacing={0}>
    {Array.from({ length: count }).map((_, i) => (
      <Box key={i} border="1px" borderColor="white" overflow="hidden">
        <AspectRatio ratio={3 / 4}>
          <Box w="full" h="full" className="shimmer" />
        </AspectRatio>
        <VStack align="stretch" spacing={1} p={1} gap={0}>
          <Box h="12px" w="80%" className="shimmer" />
          <HStack spacing={2} justify="space-between" align="center" mt={1}>
            <Box h="12px" w="40%" className="shimmer" />
          </HStack>
        </VStack>
      </Box>
    ))}
  </SimpleGrid>
);

/* ❤️ Heart icon */
const HeartIcon = ({ filled, width = 20, height = 20 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24">
    <path
      d="M10.4107 19.9677C7.58942 17.858 2 13.0348 2 8.69444C2 5.82563 4.10526 3.5 7 3.5C8.5 3.5 10 4 12 6C14 4 15.5 3.5 17 3.5C19.8947 3.5 22 5.82563 22 8.69444C22 13.0348 16.4106 17.858 13.5893 19.9677C12.6399 20.6776 11.3601 20.6776 10.4107 19.9677Z"
      stroke="black"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={filled ? "black" : "none"}
    />
  </svg>
);

/* 📦 Image with Cart + Wishlist */
const SizePanelImage = ({ item, onAddById, inWishlist, toggleWishlist }) => {
  const isMobile = useMobile();
  const [isIconHover, setIsIconHover] = useState(false);
  const [isPanelHover, setIsPanelHover] = useState(false);
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const iconSize = useBreakpointValue({ base: "15", md: "20" });

  const panelRef = useRef(null);
  useOutsideClick({ ref: panelRef, handler: () => setIsOpenMobile(false) });

  const main =
    item?.productImages?.[0]?.image ||
    item?.image ||
    "/api/placeholder/300/400";
  const hover = item?.productImages?.[1]?.image;

  const sizes =
    (item?.availableSizes || []).map((s) => ({
      name: s.name,
      value: s.value,
      orderable: s.orderable !== false,
      _childId: (item?.childProducts || []).find(
        (c) => c?.size?.value === s.value
      )?.id,
    })) ||
    (item?.childProducts || []).map((c) => ({
      name: c?.size?.name || c?.size?.value || "One",
      value: c?.size?.value || c?.id,
      orderable: c?.orderable !== false,
      _childId: c?.id,
    }));

  const stop = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const isDesktopOpen = !isMobile && (isIconHover || isPanelHover);

  return (
    <Box position="relative" overflow="visible">
      {/* Image */}
      <AspectRatio ratio={3 / 4}>
        <Box position="relative">
          <Image
            src={main}
            alt={item?.title || item?.name || "Product"}
            objectFit="cover"
            objectPosition="top"
            position="absolute"
            inset={0}
            w="full"
            h="full"
          />
          {hover && (
            <Image
              src={hover}
              alt=""
              objectFit="cover"
              objectPosition="top"
              position="absolute"
              inset={0}
              w="full"
              h="full"
              opacity={0}
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}
        </Box>
      </AspectRatio>

      {/* ❤️ Wishlist button */}
      <Box position="absolute" top={1} right={1} zIndex={11}>
        <IconButton
          aria-label="Toggle wishlist"
          icon={<HeartIcon filled={inWishlist(item?.id)} width={iconSize} height={iconSize} />}
          size="xs"
          variant="ghost"
          bg="transparent"
          _hover={{ bg: "transparent" }}
          onClick={(e) => {
            stop(e);
            toggleWishlist(item);
          }}
        />
      </Box>

      {/* 🛒 Cart icon */}
      <Box
        position="absolute"
        bottom={3}
        left="50%"
        transform="translateX(-50%)"
        zIndex={10}
      >
        <Button
          size="sm"
          variant="ghost"
          bg="blackAlpha.100"
          borderRadius="full"
          backdropFilter="blur(10px)"
          _hover={{ bg: "transparent" }}
          p={2}
          onClick={(e) => {
            stop(e);
            if (isMobile) setIsOpenMobile((v) => !v);
          }}
          onMouseEnter={() => !isMobile && setIsIconHover(true)}
          onMouseLeave={() => !isMobile && setIsIconHover(false)}
          onFocus={() => !isMobile && setIsIconHover(true)}
          onBlur={() => !isMobile && setIsIconHover(false)}
        >
          <Image src={cartIcon} alt="Cart Icon" w="4" h="4" />
        </Button>

        {/* 🖥️ Desktop hover size panel */}
        {!isMobile && (
          <Box
            role="dialog"
            id="add-to-cart"
            aria-label="Add to Cart"
            position="absolute"
            left="50%"
            transform={`translateX(-50%) ${isDesktopOpen ? "" : "translateY(6px) scale(0.98)"
              }`}
            bottom="-4px"
            w="44"
            bg="blackAlpha.100"
            backdropFilter="blur(10px)"
            px={2}
            py={2}
            shadow="md"
            transition="opacity .18s ease, transform .18s ease"
            opacity={isDesktopOpen ? 1 : 0}
            pointerEvents={isDesktopOpen ? "auto" : "none"}
            onMouseEnter={() => setIsPanelHover(true)}
            onMouseLeave={() => setIsPanelHover(false)}
            onClick={stop}
          >
            <Text
              fontSize="xs"
              color="white"
              fontWeight="medium"
              textAlign="center"
              mb={2}
            >
              Add to Cart
            </Text>
            <Flex gap={1} justify="center" flexWrap="wrap">
              {sizes.map((s) => {
                const disabled = !s.orderable;
                return (
                  <button
                    id={`btn-${s.value}`}
                    key={s.value}
                    disabled={disabled}
                    onClick={() => onAddById?.(s._childId || item.id)}
                    style={{
                      fontSize: 9,
                      padding: "4px 6px",
                      background: disabled ? "#f5f5f5" : "#fff",
                      color: "#000",
                      cursor: disabled ? "not-allowed" : "pointer",
                      position: "relative",
                    }}
                  >
                    {s.name}
                    {disabled && (
                      <span
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          width: "70%",
                          height: 1,
                          background: "rgba(0,0,0,.6)",
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

        {/* 📱 Mobile panel */}
        {isMobile && (
          <Box
            ref={panelRef}
            role="dialog"
            id="add-to-cart"
            aria-label="Add to Cart"
            position="absolute"
            left="50%"
            transform={`translateX(-50%) ${isOpenMobile ? "" : "translateY(6px) scale(0.98)"
              }`}
            bottom="-4px"
            w="92vw"
            maxW="220px"
            bg="white"
            border="1px solid"
            borderColor="blackAlpha.200"
            px={3}
            py={3}
            shadow="md"
            transition="opacity .18s ease, transform .18s ease"
            opacity={isOpenMobile ? 1 : 0}
            pointerEvents={isOpenMobile ? "auto" : "none"}
            onClick={stop}
          >
            <Flex align="center" justify="space-between" mb={2}>
              <Text fontSize="sm" fontWeight="medium">
                Add to Cart
              </Text>
              <IconButton
                size="xs"
                variant="ghost"
                _hover={{ bg: "transparent" }}
                aria-label="Close"
                icon={<IoMdClose />}
                onClick={() => setIsOpenMobile(false)}
              />
            </Flex>

            <Flex gap={2} justify="center" flexWrap="wrap">
              {sizes.map((s) => {
                const disabled = !s.orderable;
                return (
                  <button
                    id={`btn-${s.value}`}
                    key={s.value}
                    disabled={disabled}
                    onClick={() => {
                      onAddById?.(s._childId || item.id);
                      setIsOpenMobile(false);
                    }}
                    style={{
                      fontSize: 9,
                      padding: "4px 6px",
                      background: disabled ? "#f5f5f5" : "#fff",
                      color: "#000",
                      cursor: disabled ? "not-allowed" : "pointer",
                      position: "relative",
                      border: "1px solid #000",
                    }}
                  >
                    {s.name}
                    {disabled && (
                      <span
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          width: "70%",
                          height: 1,
                          background: "rgba(0,0,0,.6)",
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
  );
};

export const StyleWithList = ({
  fromCollection,
  currentProductId,
  onAddById,
}) => {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);

  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
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

  const handleDetailPage = (item) => {
    navigate(`/product/${item.id}`, {
      state: { fromCollection },
    });
  };

  const toggleWishlist = async (item) => {
    if (!item?.id) return;
    try {
      if (inWishlist(item.id)) {
        await removeFromWishlist({
          productId: item.id,
          navigate,
          customerId: user?.id,
        });
        // toast.success("Removed from wishlist.");
        window.location.reload();
      } else {
        await addToWishlist({
          item,
          isAuthenticated,
          navigate,
          customerId: user?.id,
        });
        // toast.success("Added to wishlist.");
      }
    } catch (e) { }
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      setBusy(true);
      try {
        // derive category
        // let catId =
        //   fromCollection?.slug
        //     ? slugToCategoryId(fromCollection.slug) || fromCollection.slug
        //     : null;
        let catId =
          fromCollection?.slug
            ? (fromCollection.slug) || fromCollection.slug
            : null;

        if (!catId && currentProductId) {
          const raw = await getProductDetails(currentProductId);
          const candidates = [
            raw?.primaryCategoryId,
            raw?.primary_category_id,
            raw?.c_primaryCategory,
            raw?.c_defaultCategory,
            raw?.classificationCategory?.id,
            Array.isArray(raw?.categories) ? raw.categories?.[0]?.id : null,
          ].filter(Boolean);
          catId = candidates[0] || null;
        }

        if (!catId) {
          if (!ignore) setItems([]);
          return;
        }

        const res = await searchCategoryProducts(catId, {
          limit: 12,
          offset: 0,
          siteId: null,
        });

        const transformed = (res?.hits || [])
          .map(transformSFCCProduct)
          .filter(Boolean);
        const list = transformed
          .filter((p) => p.id !== currentProductId)
          .slice(0, 8);

        if (!ignore) setItems(list);
      } catch (e) {
        if (!ignore) setItems([]);
      } finally {
        if (!ignore) setBusy(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [fromCollection?.slug, currentProductId]);

  // 👉 shimmer when loading initial items
  if (busy && items.length === 0) return <StyleWithListShimmer count={8} />;
  if (!items.length) return null;

  return (
    <SimpleGrid columns={{ base: 4, sm: 4 }} spacing={0}>
      {items.map((it) => {
        const price = Number(it?.price ?? 0);
        const mrp = Number(it?.displayPrice ?? it?.mrp ?? 0);

        // 🔹 Use currency as a simple symbol/prefix (no locale formatting)
        const currencyCode = it?.currency || "";
        const renderMoney = (amount) =>
          amount != null ? `${currencyCode} ${amount}` : "";

        return (
          <Box
            key={it.id}
            border="1px"
            borderColor="white"
            overflow="hidden"
            position="relative"
            onClick={() => handleDetailPage(it)}
            cursor="pointer"
          >
            <SizePanelImage
              item={it}
              onAddById={onAddById}
              inWishlist={inWishlist}
              toggleWishlist={toggleWishlist}
            />

            <VStack align="stretch" spacing={1} p={1} gap={0}>
              <Text fontSize="xs" fontWeight="500" noOfLines={1}>
                {it?.title || it?.name || "Product"}
              </Text>

              <HStack spacing={2} justify="space-between" align="center">
                <HStack spacing={2} fontWeight={"500"}>
                  <Text fontSize="xs">
                    {renderMoney(price || 0)}
                  </Text>
                  {mrp > price ? (
                    <Text fontSize="xs" as="s" color="blackAlpha.600">
                      {renderMoney(mrp)}
                    </Text>
                  ) : null}
                </HStack>
              </HStack>
            </VStack>
          </Box>
        );
      })}
    </SimpleGrid>
  );
};


