import React, { Fragment, useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import emptyicon from "../../../assets/images/empty.png";
import imageNotAvaliable from "@/assets/images/imageNotAvaliable.png";
import { useUnifiedCartStore } from "@/context/unifiedCartStore";
import { CURRENCY_SYMBOL, FreeShippingThreshold } from "@/constants/constants";
import { processImageUrl } from "@/utils/imageUtils";
import { getProductDetails } from "@/api/services/sfccSearchService";
import { useAuth } from "@/context/AuthContext";
import { LoginFlowModal } from "@/components/compounds";
import { useAddressStore } from "@/context";
import {
  Box,
  Flex,
  Image,
  Text,
  Button,
  HStack,
  Tooltip
} from "@chakra-ui/react";

const TRANSITION_MS = 500; // keep in sync with class durations

const ImgShimmer = () => (
  <Box
    w="full"
    h="full"
    className="shimmer"
  >
  </Box>
);

const CartQuickView = () => {
  const {
    basket,
    itemCount,
    total,
    removeFromBasket,
    updateItemQuantity,
    handleClose,
    showCartModal: show,
    isLoading: cartLoading,
    refreshCartFromAPI
  } = useUnifiedCartStore();

  const navigate = useNavigate();
  const location = window.location.pathname;

  const [isOperating, setIsOperating] = useState(false); // Loading state for cart operations
  const [forceUpdate, setForceUpdate] = useState(0); // Force re-render for cart updates
  const [openTipKey, setOpenTipKey] = useState(null); // which item tooltip is open

  const { isAuthenticated } = useAuth();
  const [showLoginFlow, setShowLoginFlow] = useState(false);
  const [modalType, setModalType] = useState("");
  const [callOut, setCallOut] = useState([]);

  // Cache of corrected images fetched from product details when the cart payload is wrong
  const [imageOverrides, setImageOverrides] = useState({}); // { [productId]: url }
  const [attrOverrides, setAttrOverrides] = useState({});   // { [productId]: { color,size,material } }
  const [stockOverrides, setStockOverrides] = useState({}); // { [productId]: ats }
  const inFlightRef = useRef(new Set());

  // Get unified cart data
  const cartData = {
    items: basket?.productItems || [],
    itemCount: itemCount || 0,
    total: total || 0,
    currency: CURRENCY_SYMBOL,
  };

  // If you want a symbol, you can use your constant here:
  const currencyCode = CURRENCY_SYMBOL; // or any default you want

  // Listen for cart updates to force re-render
  useEffect(() => {
    const handleCartUpdate = (event) => {
      ('🛒 CartQuickView: Received cart update event:', event.detail);
      ('🛒 CartQuickView: Current cart data before update:', {
        items: cartData.items,
        itemCount: cartData.itemCount,
        total: cartData.total
      });
      setForceUpdate(prev => prev + 1);
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []); // Remove cartData dependency to avoid circular reference

  // Debug cart data changes
  useEffect(() => {
    ('🛒 CartQuickView: Cart data changed:', {
      items: cartData.items,
      itemCount: cartData.itemCount,
      total: cartData.total,
      basket: basket,
      forceUpdate
    });
  }, [basket, itemCount, total, forceUpdate]); // Use individual dependencies instead of cartData

  // ---- Smooth mount/unmount for animations ----
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if we are in the middle of a Breeze cancellation redirect
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('atomsSt')) {
      return;
    }

    if (show) {
      setMounted(true);
      requestAnimationFrame(() => setOpen(true));

      // Fetch fresh cart data from API when drawer opens
      ('🛒 CartQuickView: Drawer opened, fetching fresh cart data from API...');
      refreshCartFromAPI().then((freshBasket) => {
        ('🛒 CartQuickView: Fresh cart data loaded:', {
          basketId: freshBasket?.basketId,
          itemCount: freshBasket?.productItems?.length || 0,
          total: freshBasket?.productSubTotal || 0
        });
      }).catch((error) => {
      });
    } else {
      setOpen(false);
      const t = setTimeout(() => setMounted(false), TRANSITION_MS);
      return () => clearTimeout(t);
    }
  }, [show, refreshCartFromAPI]);

  // ESC close + full-page scroll lock while mounted
  const drawerRef = useRef(null);

  useEffect(() => {
    if (!mounted) return;

    const onKey = (e) => e.key === "Escape" && handleClose();
    window.addEventListener("keydown", onKey);

    // Save scroll position
    const scrollY = window.scrollY || window.pageYOffset || 0;

    // Remember previous inline styles to restore later
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevHtmlScrollBehavior = document.documentElement.style.scrollBehavior;
    const prevBodyPosition = document.body.style.position;
    const prevBodyTop = document.body.style.top;
    const prevBodyWidth = document.body.style.width;
    const prevBodyOverflow = document.body.style.overflow;

    // Lock <html> and <body>
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.scrollBehavior = "auto";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";

    // Prevent background touch scrolls (allow inside drawerRef)
    const stopTouch = (e) => {
      const target = e.target;
      const insideDrawer =
        drawerRef.current && drawerRef.current.contains(target);

      if (!insideDrawer) {
        e.preventDefault();
      }
    };
    document.addEventListener("touchmove", stopTouch, { passive: false });

    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("touchmove", stopTouch);

      // Restore styles
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.documentElement.style.scrollBehavior = prevHtmlScrollBehavior;
      document.body.style.position = prevBodyPosition;
      document.body.style.top = prevBodyTop;
      document.body.style.width = prevBodyWidth;
      document.body.style.overflow = prevBodyOverflow;

      // Restore scroll position (avoids jump)
      window.scrollTo(0, scrollY);
    };
  }, [mounted, handleClose]);

  // --------------------------------------------

  // Resolve best image URL for a cart item (handles dynamic structures)
  const resolveItemImage = (it) => {
    // Highest priority: override fetched from product details if cart data is wrong
    if (it?.productId && imageOverrides[it.productId]) {
      return imageOverrides[it.productId];
    }
    // Prefer large images, then small
    const buckets = [it?.c_images?.large, it?.c_images?.small];
    for (const bucket of buckets) {
      if (Array.isArray(bucket) && bucket.length) {
        for (const img of bucket) {
          const raw = img?.absURL || img?.url;
          if (raw) {
            const processed = processImageUrl(raw);
            if (processed && processed !== 'undefined' && processed !== 'null') {
              return processed;
            }
          }
        }
      }
    }
    return null;
  };

  // Extract a specific variant attribute (color/size/material) robustly from different shapes
  const getVariantAttrValue = (it, key) => {
    const lowerKey = String(key || '').toLowerCase();
    const arrays = [it?.c_variationAttributes, it?.variationAttributes];
    for (const arr of arrays) {
      if (Array.isArray(arr)) {
        const found = arr.find((a) => String(a?.attributeId || a?.id || '').toLowerCase() === lowerKey);
        if (found) {
          if (found.displayValue) return found.displayValue;
          const vals = Array.isArray(found.values) ? found.values : [];
          const selected = vals.find((v) => v?.selected) || vals[0];
          if (selected?.displayValue) return selected.displayValue;
          if (selected?.value) return selected.value;
        }
      }
    }
    // Also check flat variationValues if provided
    const vv = it?.variationValues || {};
    if (vv) {
      const candidates = [vv[lowerKey], vv[lowerKey?.toUpperCase?.()], vv['Color'], vv['color'], vv['size'], vv['material']];
      for (const c of candidates) {
        if (typeof c === 'string' && c) return c;
      }
    }
    // Finally, consider override derived from product details
    if (it?.productId && attrOverrides[it.productId]?.[lowerKey]) {
      return attrOverrides[it.productId][lowerKey];
    }
    return '';
  };

  // Heuristic: detect when cart item's images belong to a different product (backend mismatch)
  const isImageMismatch = (it) => {
    const name = (it?.productName || it?.itemText || "").toString();
    const first = it?.c_images?.large?.[0] || it?.c_images?.small?.[0] || null;
    if (!first || !name) return false; // not enough info, don't trigger
    const label = (first.alt || first.title || "").toString();
    const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const nName = norm(name);
    const nLabel = norm(label);
    return nName && nLabel && !nLabel.includes(nName.split(" ")[0]);
  };

  // On cart open/updates, fetch correct images/swatches/stock for items
  useEffect(() => {
    const items = basket?.productItems || [];
    items.forEach(async (it) => {
      const pid = it?.productId;
      if (!pid) return;

      try {
        // Avoid duplicate fetches
        if (inFlightRef.current.has(pid)) return;
        const needImage = !imageOverrides[pid] && isImageMismatch(it);
        const needAttrs = !attrOverrides[pid];
        const needStock = stockOverrides[pid] === undefined;

        if (!needImage && !needAttrs && !needStock) return;

        inFlightRef.current.add(pid);
        const details = await getProductDetails(pid);

        if (needStock) {
          const ats = details?.inventory?.ats ?? details?.c_ats ?? 10;
          setStockOverrides((prev) => ({ ...prev, [pid]: ats }));
        }

        if (needImage) {
          const groups = details?.imageGroups || [];
          const prefer = groups.find((g) => g.viewType === 'large') || groups[0];
          const first = prefer?.images?.[0]?.link || prefer?.images?.[0]?.absURL;
          const processed = processImageUrl(first);
          if (processed) setImageOverrides((prev) => ({ ...prev, [pid]: processed }));
        }

        if (needAttrs) {
          let color = '', size = '', material = '';

          // 1) For variant products, SFCC returns variationValues directly on the product
          const directVV = details?.variationValues || details?.c_variationValues || {};
          color = directVV?.Color || directVV?.color || color;
          size = directVV?.size || size;
          material = directVV?.material || material;

          // 2) If master product was returned, try to locate the child variant entry that matches pid
          if (!color && !size && !material) {
            const variants = Array.isArray(details?.variants) ? details.variants : [];
            const match = variants.find((v) => v?.productId === pid) || null;
            const vv = match?.variationValues || {};
            color = vv?.Color || vv?.color || color;
            size = vv?.size || size;
            material = vv?.material || material;
          }

          // 3) As last resort, check selected values in variationAttributes
          if (!color || !size || !material) {
            const va = Array.isArray(details?.variationAttributes) ? details.variationAttributes : [];
            const pick = (id) => {
              const a = va.find((x) => String(x?.id || x?.attributeId || '').toLowerCase() === id);
              if (!a) return '';
              const sel = (a.values || []).find((v) => v?.selected) || a.values?.[0];
              return sel?.name || sel?.value || '';
            };
            color = color || pick('color') || pick('Color');
            size = size || pick('size');
            material = material || pick('material');
          }

          setAttrOverrides((prev) => ({ ...prev, [pid]: { color, size, material } }));
        }
      } catch (e) {
      } finally {
        inFlightRef.current.delete(pid);
      }
    });
  }, [basket, imageOverrides, attrOverrides, stockOverrides]);

  const handleRemove = async (item) => {
    setIsOperating(true);
    try {
      await removeFromBasket(item.itemId);
      const fresh = await refreshCartFromAPI();

      // notify others (you already listen for this)
      window.dispatchEvent(new CustomEvent("cartUpdated", {
        detail: { type: "remove", itemId: item.itemId, basketId: fresh?.basketId }
      }));
      ('🛒 CartQuickView: Item removed & cart refreshed');
    } catch (error) {
    } finally {
      setIsOperating(false);
    }
  };

  const decreaseQuantity = async (item, nextQty) => {
    if (isOperating) return;
    setIsOperating(true);
    try {
      if (nextQty <= 0) {
        await removeFromBasket(item.itemId);
      } else {
        await updateItemQuantity(item.itemId, nextQty);
      }
      const fresh = await refreshCartFromAPI();

      window.dispatchEvent(new CustomEvent("cartUpdated", {
        detail: { type: "decrease", itemId: item.itemId, qty: nextQty, basketId: fresh?.basketId }
      }));
      ('🛒 CartQuickView: Decreased qty & cart refreshed');
    } catch (error) {
    } finally {
      setIsOperating(false);
    }
  };

  const increaseQuantity = async (item, nextQty) => {
    if (isOperating) return;
    setIsOperating(true);
    try {
      await updateItemQuantity(item.itemId, nextQty);
      const fresh = await refreshCartFromAPI();

      window.dispatchEvent(new CustomEvent("cartUpdated", {
        detail: { type: "increase", itemId: item.itemId, qty: nextQty, basketId: fresh?.basketId }
      }));
      ('🛒 CartQuickView: Increased qty & cart refreshed');
    } catch (error) {
    } finally {
      setIsOperating(false);
    }
  };

  const { user } = useAuth();
  const { address, fetchAddress } = useAddressStore();

  const handleNavigate = async (skipAuth = false) => {
    if (!isAuthenticated && skipAuth !== true) {
      setModalType("LOGIN");
      setShowLoginFlow(true);
      return;
    }

    try {
      // ✅ Re-fetch addresses to get latest state
      await fetchAddress({ customerId: user?.id });
      const latestAddresses = useAddressStore.getState().address;

      if (Array.isArray(latestAddresses) && latestAddresses.length > 0) {
        navigate("/address");
      } else {
        navigate("/Shipping");
      }
      handleClose();
    } catch (e) {
      // Fallback
      navigate("/address");
      handleClose();
    }
  };

  const handleDetailPage = (productId) => {
    handleClose();
    navigate(`/product/${productId}`);
  };


  const products =
    basket?.productItems?.map(item => ({
      productId: item?.productId?.replace(/(XS|S|M|L|XL|XXL)$/i, ''),
      productName: item?.productName,
    })) || [];
  const cartAmount = basket?.productSubTotal || 0;
  const checkCallOutMessage = async () => {
    try {

      const response = await fetch(
        `${import.meta.env.VITE_WALLET_API_URL}/api/cashback/check-callout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            "cartAmount": cartAmount,
            "products": products
          }),
        }
      );

      const data = await response.json();

      console.log("Cashback Response:", data);
      setCallOut(data);


    } catch (error) {
      console.error("Cashback API Error:", error);
    }
  };

  useEffect(() => {
    if (!basket?.productItems?.length) return;

    checkCallOutMessage();
  }, [basket?.productItems]);

  if (!mounted) return null;

  return (
    <Fragment>
      {/* Backdrop (fade) */}
      <Box
        position="fixed"
        inset="0"
        zIndex="50"
        bg="blackAlpha.600"
        transition="opacity 0.5s"
        opacity={open ? 1 : 0}
        onClick={handleClose}
      />

      {/* Drawer (slide) */}
      <Box
        as="section"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        position="fixed"
        insetY="0"
        right="0"
        zIndex="70"
        w="100%"
        boxShadow="xl"
        transition="transform 0.5s"
        transform={open ? "translateX(0)" : "translateX(100%)"}
        onClick={handleClose}
      >
        <Flex h="full" direction="row-reverse">
          {/* CART (right) */}
          <Flex ref={drawerRef} onClick={(e) => e.stopPropagation()} h="full" w="full" direction="column" bg="white" maxW={{ lg: "400px" }}>
            {/* Header */}
            <Flex align="center" justify="space-between" px="4" py="3">
              <Text id="cart-drawer-title" fontSize={{ base: "sm", md: "md" }} letterSpacing="wide">
                SHOPPING BAG
              </Text>
              <button
                aria-label="Close"
                onClick={handleClose}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  style={{
                    fill: "none",
                    stroke: "currentColor",
                    strokeWidth: "2",
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                  }}
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </Flex>

            {/* Items */}
            <Box flex="1" overflowY="auto" px="4" py="4" position="relative" className="scroll-thin">
              {/* Loading overlay */}
              {/* {isOperating && (
                <Box
                  position="absolute"
                  top="0"
                  left="0"
                  right="0"
                  bottom="0"
                  bg="whiteAlpha.800"
                  zIndex="10"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize="sm" color="gray.600">
                    Updating cart...
                  </Text>
                </Box>
              )} */}

              {cartData.items?.map((item, index) => {
                // Debug logging for cart item data
                ('🛒 CartQuickView: Item data:', {
                  productName: item?.productName,
                  price: item?.price,
                  quantity: item?.quantity,
                  productId: item?.productId,
                  image: item?.c_images?.large?.[0]?.absURL,
                  size: item?.c_variationAttributes?.find(attr => attr.attributeId === 'size')?.displayValue,
                  material: item?.c_variationAttributes?.find(attr => attr.attributeId === 'material')?.displayValue
                });

                // SFCC cart item format - extract all available details dynamically
                // Normalize variant values per item with per-product overrides if available
                const productDetails = {
                  title: item?.productName || item?.itemText || 'Product',
                  price: item?.price || item?.basePrice || 0,
                  displayPrice: item?.priceAfterItemDiscount || item?.price || item?.basePrice || 0,
                  productId: item?.productId,
                  itemId: item?.itemId,
                  quantity: item?.quantity || 1,
                  stock: stockOverrides[item?.productId] ?? item?.stock ?? 10,
                  color: attrOverrides[item?.productId]?.value || getVariantAttrValue(item, 'color'),
                  size: attrOverrides[item?.productId]?.size || getVariantAttrValue(item, 'size'),
                  material: attrOverrides[item?.productId]?.material || getVariantAttrValue(item, 'material')
                };

                const stock = Number(productDetails?.stock ?? 0);
                const qty = Number(item?.quantity ?? 0);

                const isOutOfStock = stock <= 0;
                const isMaxReached = stock > 0 && qty >= stock;

                const tipKey = item?.itemId || `${item?.productId}-${index}`;
                const tipOpen = openTipKey === tipKey;

                const tipLabel = isOutOfStock
                  ? "Out of stock"
                  : isMaxReached
                    ? `Only ${stock} left`
                    : "";


                // Get image for cart items - dynamically resolve best candidate
                const itemImage = resolveItemImage(item);
                const hasImg = !!itemImage;

                // Debug cart item data
                ('🔍 Cart Quick View - Item Data:', {
                  productId: item?.productId,
                  productName: item?.productName,
                  itemImage,
                  hasImg,
                  c_images: item?.c_images,
                  c_variationAttributes: item?.c_variationAttributes,
                  size: item?.c_variationAttributes?.find(attr => attr.attributeId === 'size')?.displayValue,
                  material: item?.c_variationAttributes?.find(attr => attr.attributeId === 'material')?.displayValue,
                  fullItem: item
                });

                // Safe price + discount - handle multiple price fields dynamically
                const price = Number(productDetails?.price) || Number(item?.price) || Number(item?.basePrice) || 0;
                const mrp = Number(productDetails?.displayPrice) || Number(item?.priceAfterItemDiscount) || Number(item?.price) || Number(item?.basePrice) || 0;
                const showDiscount = price > 0 && mrp > 0 && mrp > price;
                const discountPercent = showDiscount
                  ? Math.round(((mrp - price) / mrp) * 100)
                  : 0;
                return (
                  <Fragment key={item?.itemId || `${item?.productId || "item"}-${index}`}>
                    {/* ========= DESKTOP LAYOUT ========= */}
                    <Flex
                      mb="4"
                      gap="3"
                      display={{ base: "none", md: "flex" }}
                    >
                      {/* Image */}
                      <Box w="112px" minW="112px" overflow="hidden" cursor="pointer" onClick={() => handleDetailPage(productDetails.productId)}>
                        {hasImg ? (
                          <Image
                            src={itemImage}
                            alt={productDetails?.title || "Cart item"}
                            w="full"
                            h="full"
                            objectFit="cover"
                            onError={(e) => {

                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          // <Flex h="full" minH="112px" align="center" justify="center">
                          //   <Box textAlign="center">
                          //     <Image
                          //       src={imageNotAvaliable}
                          //       alt="Not available"
                          //       mx="auto"
                          //       h="50px"
                          //       w="auto"
                          //     />
                          //     <Text mt="1" fontSize="xs" color="gray.600">
                          //       Image Not Available
                          //     </Text>
                          //   </Box>
                          // </Flex>
                          <ImgShimmer />
                        )}
                      </Box>

                      {/* Details (desktop) */}
                      <Flex minW={0} flex="1" direction="column" justify="space-between">
                        <div id="productId" hidden>{productDetails?.title?.toLowerCase()?.replace(/\s+/g, '-')}</div>
                        <Flex direction="column">
                          <Text noOfLines={2} fontSize="sm" fontWeight="medium" cursor="pointer" onClick={() => handleDetailPage(productDetails.productId)}>
                            {productDetails?.title}
                          </Text>

                          {/* Variant Information (line by line as before) */}
                          <Flex direction="column" mt="1" gap={1}>
                            {productDetails.color && (
                              <Text fontSize="11px">
                                Color- <strong> {productDetails.color}</strong>
                              </Text>
                            )}
                            {productDetails.size && (
                              <Text fontSize="11px">
                                Size- <strong> {productDetails.size}</strong>
                              </Text>
                            )}
                            {productDetails.material && (
                              <Text fontSize="11px">
                                Material- <strong> {productDetails.material}</strong>
                              </Text>
                            )}
                            {!productDetails.color &&
                              !productDetails.size &&
                              !productDetails.material && (
                                <Text fontSize="11px">No variant details available</Text>
                              )}
                          </Flex>

                          <HStack spacing="2" mt={1}>
                            <Text fontSize="sm" color="black">
                              {currencyCode} {price}
                            </Text>
                            {showDiscount && (
                              <Text fontSize="sm" color="gray.500" as="s">
                                {currencyCode} {mrp}
                              </Text>
                            )}
                          </HStack>
                        </Flex>

                        <Flex mt="2" align="center" justify="space-between" w="full">
                          {/* Counter */}
                          <HStack
                            align="center"
                            justify="space-between"
                            borderWidth="1px"
                            borderColor="blackAlpha.600"
                            px="3"
                            py={{ base: 1, md: 2 }}
                            fontSize="sm"
                          >
                            <div style={{ display: "flex", alignItems: "center" }}>
                              <button
                                onClick={() => decreaseQuantity(item, item.quantity - 1)}
                                disabled={item?.quantity <= 1 || isOperating}
                                style={{
                                  background: "transparent",
                                  padding: "0px 8px",
                                  fontSize: "14px",
                                  cursor:
                                    item?.quantity <= 1 || isOperating
                                      ? "not-allowed"
                                      : "pointer",
                                  opacity:
                                    item?.quantity <= 1 || isOperating ? 0.3 : 1,
                                }}
                              >
                                −
                              </button>
                              <span
                                style={{
                                  fontSize: "12px",
                                  color: "#4a4a4a",
                                  margin: "0 8px",
                                }}
                              >
                                {item?.quantity}
                              </span>
                              <Tooltip
                                label={
                                  isOutOfStock
                                    ? "Out of stock"
                                    : isMaxReached
                                      ? `Only ${stock} left`
                                      : ""
                                }
                                fontSize="10px"
                                lineHeight="1.4"
                                px="6px"
                                py="4px"
                                borderRadius="0"
                                hasArrow
                                placement="top"
                                shouldWrapChildren
                                isDisabled={!(isOutOfStock || isMaxReached)}
                              >
                                <button
                                  onClick={() => increaseQuantity(item, item.quantity + 1)}
                                  disabled={isOutOfStock || isMaxReached || isOperating}
                                  style={{
                                    background: "transparent",
                                    padding: "0px 8px",
                                    fontSize: "14px",
                                    cursor:
                                      isOutOfStock || isMaxReached || isOperating
                                        ? "not-allowed"
                                        : "pointer",
                                    opacity: isOutOfStock || isMaxReached || isOperating ? 0.35 : 1,
                                  }}
                                >
                                  +
                                </button>
                              </Tooltip>
                            </div>
                          </HStack>

                          <Button
                            onClick={() => handleRemove(item)}
                            variant="link"
                            fontSize="10px"
                            fontWeight="normal"
                            textTransform="uppercase"
                            color="gray.600"
                            _hover={{ color: "gray.900" }}
                            isDisabled={isOperating}
                          >
                            Remove
                          </Button>
                        </Flex>
                      </Flex>
                    </Flex>

                    {/* ========= MOBILE LAYOUT ========= */}
                    <Flex
                      mb="4"
                      gap="3"
                      display={{ base: "flex", md: "none" }}
                    >
                      <div id="productId" hidden>{productDetails?.title?.toLowerCase()?.replace(/\s+/g, '-')}</div>
                      {/* Image */}
                      <Box w="90px" minW="90px" overflow="hidden" height="128px" cursor="pointer" onClick={() => handleDetailPage(productDetails.productId)}>
                        {hasImg ? (
                          <Image
                            src={itemImage}
                            alt={productDetails?.title || "Cart item"}
                            w="full"
                            h="full"
                            objectFit="cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          // <Flex h="full" minH="96px" align="center" justify="center">
                          //   <Image
                          //     src={imageNotAvaliable}
                          //     alt="Not available"
                          //     mx="auto"
                          //     h="40px"
                          //     w="auto"
                          //   />
                          // </Flex>
                          <ImgShimmer />
                        )}
                      </Box>

                      {/* Right side */}
                      <Flex flex="1" direction="column" justify="space-between" minW={0}>
                        <Box>
                          {/* Title */}
                          <Text noOfLines={2} fontSize="xs" fontWeight="medium" cursor="pointer" onClick={() => handleDetailPage(productDetails.productId)}>
                            {productDetails?.title}
                          </Text>

                          {/* Price + MRP + %OFF */}
                          <HStack spacing="2" mt="1" align="baseline">
                            <Text fontSize="xs" color="black">
                              {currencyCode} {price}
                            </Text>
                            {showDiscount && (
                              <>
                                <Text fontSize="xs" color="gray.500" as="s">
                                  {currencyCode} {mrp}
                                </Text>
                                <Text fontSize="xs" color="green.500">
                                  ({discountPercent}% OFF)
                                </Text>
                              </>
                            )}
                          </HStack>

                          {/* S | RED | COTTON style */}
                          <Text fontSize="10px" mt="1" textTransform="uppercase" color="blackAlpha.600">
                            {productDetails.size && <span>{productDetails.size}</span>}
                            {productDetails.size && productDetails.color && " | "}
                            {productDetails.color && <span>{productDetails.color}</span>}
                            {(productDetails.size || productDetails.color) && productDetails.material && " | "}
                            {productDetails.material && <span>{productDetails.material}</span>}
                          </Text>
                        </Box>

                        {/* Bottom row: qty + remove */}
                        <Flex mt="3" align="center" justify="space-between">
                          <HStack
                            minW="100px"
                            align="center"
                            justify="space-between"
                            borderWidth="1px"
                            borderColor="blackAlpha.600"
                            px="3"
                            py="1"
                            fontSize="sm"
                          >
                            <button
                              onClick={() => decreaseQuantity(item, item.quantity - 1)}
                              disabled={item?.quantity <= 1 || isOperating}
                              style={{
                                background: "transparent",
                                padding: "0px 6px",
                                fontSize: "14px",
                                cursor:
                                  item?.quantity <= 1 || isOperating
                                    ? "not-allowed"
                                    : "pointer",
                                opacity:
                                  item?.quantity <= 1 || isOperating ? 0.3 : 1,
                              }}
                            >
                              −
                            </button>
                            <span
                              style={{
                                fontSize: "12px",
                                color: "#4a4a4a",
                                margin: "0 6px",
                              }}
                            >
                              {item?.quantity}
                            </span>
                            <Tooltip
                              label={tipLabel}
                              fontSize="9px"
                              px="6px"
                              py="4px"
                              borderRadius="0"
                              hasArrow
                              placement="top"
                              isOpen={tipOpen}
                              onClose={() => setOpenTipKey(null)}
                              closeOnClick={false}
                              closeOnPointerDown={false}
                              shouldWrapChildren
                            >
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();

                                  // ✅ If disabled due to stock -> show tooltip on tap
                                  if (isOutOfStock || isMaxReached) {
                                    setOpenTipKey(tipKey);

                                    // auto close after 2 sec
                                    window.clearTimeout(window.__cartTipTimer);
                                    window.__cartTipTimer = window.setTimeout(() => {
                                      setOpenTipKey(null);
                                    }, 2000);

                                    return;
                                  }

                                  // ✅ If not disabled -> normal increment
                                  increaseQuantity(item, item.quantity + 1);
                                }}
                                disabled={isOperating} // only block when API operation running
                                style={{
                                  background: "transparent",
                                  padding: "0px 6px",
                                  fontSize: "14px",
                                  cursor: isOperating ? "not-allowed" : "pointer",
                                  opacity: isOutOfStock || isMaxReached ? 0.35 : 1,
                                }}
                              >
                                +
                              </button>
                            </Tooltip>

                          </HStack>

                          <Button
                            onClick={() => handleRemove(item)}
                            variant="link"
                            fontSize="11px"
                            fontWeight="normal"
                            textTransform="uppercase"
                            color="gray.600"
                            _hover={{ color: "gray.900" }}
                            isDisabled={isOperating}
                          >
                            Remove
                          </Button>
                        </Flex>
                      </Flex>
                    </Flex>
                  </Fragment>
                );
              })}

              {(!cartData.items || cartData.items.length === 0) && (
                <Box h="100%" display="flex" flexDirection={"column"} alignItems="center" justifyContent="center">
                  <Image src={emptyicon} mx="auto" w="50%" alt="Your cart is empty" />
                  <Text mt="2" fontWeight="semibold">
                    Hey, it’s looks empty!
                  </Text>
                  <Text fontSize="sm">
                    Oops! Your Shopping bag is empty. Start adding your items now.
                  </Text>
                  <Button
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
                    onClick={() => {
                      handleClose();                 // ✅ close drawer
                      navigate("/category/all dresses"); // ✅ go to category
                    }}
                  >
                    Shop Now
                  </Button>

                </Box>
              )}

              {/* Subtotal */}
              {cartData.items?.length > 0 && (
                <Flex
                  mb="4"
                  mt="2"
                  align="center"
                  justify="space-between"
                  borderTopWidth="1px"
                  borderColor="gray.200"
                  pt="3"
                >
                  <Text fontSize="12px" textTransform="uppercase">
                    Subtotal{" "}
                    <Text as="span" ml="1">
                      ({cartData.itemCount} items)
                    </Text>
                  </Text>
                  <Text fontSize="12px" textTransform="uppercase">
                    {cartData.currency} {cartData.total?.toFixed?.(2) ?? "0.00"}
                  </Text>
                </Flex>
              )}
            </Box>

            {/* CTA */}
            <Box p="4">
              {cartData.items?.length > 0 && (
                <>
                  {/* <Text textAlign="center" fontSize="xs" fontWeight={"semibold"} textDecoration={"underline"} textUnderlineOffset={"4px"} mb={1}>
                    Free shipping on orders above {CURRENCY_SYMBOL}{FreeShippingThreshold}
                  </Text> */}
                  <Text
                    textAlign="center"
                    fontSize="xs"
                    fontWeight="bold"
                    mb="2"
                    color={
                      callOut?.eligible === true || callOut?.eligible === "true"
                        ? "green.500"
                        : "red.400"
                    }
                  >
                    {callOut?.message}
                  </Text>

                  <Text textAlign="center" fontSize="xs" mb="2" color="gray.700">
                    Shipping, taxes & discounts calculated at checkout
                  </Text>

                  <Button
                    w="full"
                    bg="black"
                    color="white"
                    _hover={{ bg: "black" }}
                    textTransform="uppercase"
                    fontSize="sm"
                    position="relative"
                    overflow="hidden"
                    borderRadius="0"
                    onClick={() => handleNavigate(false)}
                  >
                    Proceed to Checkout
                  </Button>
                </>
              )}
            </Box>

          </Flex>
        </Flex>
      </Box>
      <LoginFlowModal
        start={showLoginFlow}
        onCompletion={() => {
          setShowLoginFlow(false);
          handleNavigate(true);
        }}
        onNewUser={() => {
          setShowLoginFlow(false);
          handleNavigate(true);
        }}
        modalType={modalType}
        setModalType={setModalType}
      />
    </Fragment>
  );
};



export default CartQuickView;
