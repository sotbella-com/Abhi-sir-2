import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Checkbox } from "antd";
import { Box, Flex, Image, Text, Tooltip, useBreakpointValue } from "@chakra-ui/react";
import { useUnifiedCartStore } from "@/context/unifiedCartStore";
import { useAuth } from "@/context/AuthContext";
import { CURRENCY_SYMBOL } from "@/constants/constants";
import { processImageUrl } from "@/utils/imageUtils";
import { getProductDetails } from "@/api/services/sfccSearchService";
import ConfirmationModal from "@/components/compounds/confirmationModal";
import { trackRemoveFromCart } from "@/utils/dataLayer";

/* ----------------------- helpers ----------------------- */

const lowerKeys = (obj = {}) =>
  Object.fromEntries(Object.entries(obj || {}).map(([k, v]) => [String(k).toLowerCase(), v]));

// pull selected display text directly from c_variationAttributes / variationAttributes
const fromVariationArrays = (item, key /* 'size' | 'material' | 'color' */) => {
  const target = String(key).toLowerCase();
  const lists = [item?.c_variationAttributes, item?.variationAttributes];
  for (const arr of lists) {
    if (!Array.isArray(arr)) continue;
    const a = arr.find(x => String(x?.attributeId || x?.id || "").toLowerCase() === target);
    if (!a) continue;
    if (a.displayValue) return a.displayValue; // many carts put pretty text here
    const sel = (a.values || []).find(v => v?.selected) || (a.values || [])[0];
    const pretty = sel?.displayValue || sel?.name || sel?.value;
    if (pretty) return pretty;
  }
  return "";
};

const resolveItemImage = (it, overrideUrl) => {
  if (overrideUrl) return overrideUrl;
  const buckets = [it?.c_images?.large, it?.c_images?.small];
  for (const bucket of buckets) {
    if (Array.isArray(bucket) && bucket.length) {
      for (const img of bucket) {
        const raw = img?.absURL || img?.url || img?.link;
        const processed = processImageUrl(raw);
        if (processed && processed !== "undefined" && processed !== "null") return processed;
      }
    }
  }
  return processImageUrl(it?.image?.link || it?.image?.disBaseLink) || "";
};

const isImageMismatch = (it) => {
  const name = (it?.productName || it?.itemText || "").toString();
  const first = it?.c_images?.large?.[0] || it?.c_images?.small?.[0];
  if (!first || !name) return false;
  const label = (first?.alt || first?.title || "").toString();
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return norm(label) && norm(name) && !norm(label).includes(norm(name).split(" ")[0]);
};

// product-details → display label map
const mapDisplayFromDetails = (details, attrId, rawVal) => {
  if (!details || !rawVal) return "";
  const attrs = Array.isArray(details.variationAttributes) ? details.variationAttributes : [];
  const hit = attrs.find(a => String(a.id || a.attributeId || "").toLowerCase() === String(attrId).toLowerCase());
  if (!hit) return String(rawVal);
  const v = (hit.values || []).find(v => String(v.value).toLowerCase() === String(rawVal).toLowerCase());
  return v?.name || v?.displayValue || String(rawVal);
};

const readMaterialFromDetails = (details) =>
  details?.c_material ||
  details?.material ||
  details?.customAttributes?.c_material ||
  details?.customAttributes?.material ||
  "";

// extract “raw” selected from several possible places; returns {raw, pretty}
const extractSelectedRaw = (item, attr) => {
  const key = String(attr).toLowerCase();

  const vv = lowerKeys(item?.variationValues || item?.c_variationValues || {});
  if (vv[key]) return { raw: vv[key], pretty: "" };

  const optionArrays = [item?.optionItems, item?.options, item?.selectedOptions, item?.c_selectedOptions];
  for (const arr of optionArrays) {
    if (Array.isArray(arr)) {
      const found = arr.find(o => String(o?.optionId || o?.id || o?.attributeId || o?.name || "").toLowerCase() === key);
      if (found) {
        const raw = found?.optionValueId || found?.value || found?.optionValue || found?.selectedValue || "";
        const pretty = found?.displayName || found?.name || found?.displayValue || "";
        if (raw || pretty) return { raw, pretty };
      }
    }
  }

  const vaArrays = [item?.c_variationAttributes, item?.variationAttributes];
  for (const arr of vaArrays) {
    if (Array.isArray(arr)) {
      const attrHit = arr.find(a => String(a?.attributeId || a?.id || "").toLowerCase() === key);
      if (attrHit) {
        const selected = (attrHit.values || []).find(v => v?.selected) || attrHit.values?.[0];
        const pretty = selected?.displayValue || selected?.name || "";
        const raw = selected?.value || "";
        if (raw || pretty) return { raw, pretty };
      }
    }
  }
  return { raw: "", pretty: "" };
};

/* ------------------------------------------------------ */

function SingleCartComponent({ item, selected = true, onSelectChange }) {
  const { basket, removeFromBasket, updateItemQuantity } = useUnifiedCartStore();
  const { isAuthenticated } = useAuth();

  const [confirmRemove, setConfirmRemove] = useState(false);
  const [selectedToRemove, setSelectedToRemove] = useState(null);

  const [imageOverride, setImageOverride] = useState("");
  const [attrOverride, setAttrOverride] = useState({ size: "", color: "", material: "" });
  const [maxStock, setMaxStock] = useState(10); // Default to 10 or generic high number until fetched

  const isMobile = useBreakpointValue({ base: true, md: false });

  const [qtyTipOpen, setQtyTipOpen] = useState(false);
  const qtyTipTimerRef = useRef(null);

  const closeQtyTip = () => {
    setQtyTipOpen(false);
    if (qtyTipTimerRef.current) {
      clearTimeout(qtyTipTimerRef.current);
      qtyTipTimerRef.current = null;
    }
  };

  const openQtyTip = () => {
    setQtyTipOpen(true);
    if (qtyTipTimerRef.current) clearTimeout(qtyTipTimerRef.current);

    qtyTipTimerRef.current = setTimeout(() => {
      setQtyTipOpen(false);
    }, 1200);
  };

  const quantity = item?.quantity || 1;

  const isOutOfStock = maxStock === 0;
  const isMaxReached = maxStock > 0 && quantity >= maxStock;

  const qtyTipLabel = isOutOfStock
    ? "Out of stock"
    : isMaxReached
      ? `Only ${maxStock} left`
      : "";


  useEffect(() => {
    let cancelled = false;
    const pid = item?.productId;
    if (!pid) return;

    const needImg = isImageMismatch(item) && !imageOverride;

    const selSize = extractSelectedRaw(item, "size");
    const selColor = extractSelectedRaw(item, "color");
    const selMaterial = extractSelectedRaw(item, "material");

    (async () => {
      try {
        const details = await getProductDetails(pid);
        if (cancelled || !details) {
          setAttrOverride({
            size: selSize.pretty || selSize.raw || "",
            color: selColor.pretty || selColor.raw || "",
            material: selMaterial.pretty || selMaterial.raw || ""
          });
          return;
        }

        // Extract ATS
        const ats = details?.inventory?.ats ?? details?.c_ats ?? 10;
        setMaxStock(ats);

        if (needImg) {
          const groups = details?.imageGroups || [];
          const prefer = groups.find((g) => g.viewType === "large") || groups[0];
          const url = prefer?.images?.[0]?.link || prefer?.images?.[0]?.absURL || "";
          const processed = processImageUrl(url);
          if (processed) setImageOverride(processed);
        }

        const mappedSize =
          (selSize.raw && mapDisplayFromDetails(details, "size", selSize.raw)) ||
          selSize.pretty || selSize.raw || "";

        const mappedColor =
          (selColor.raw && mapDisplayFromDetails(details, "color", selColor.raw)) ||
          selColor.pretty || selColor.raw || "";

        const mappedMaterial =
          readMaterialFromDetails(details) ||
          (selMaterial.raw && mapDisplayFromDetails(details, "material", selMaterial.raw)) ||
          selMaterial.pretty || selMaterial.raw || "";

        setAttrOverride({
          size: mappedSize,
          color: mappedColor,
          material: mappedMaterial
        });
      } catch {
        setAttrOverride({
          size: selSize.pretty || selSize.raw || "",
          color: selColor.pretty || selColor.raw || "",
          material: selMaterial.pretty || selMaterial.raw || ""
        });
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  const changeQuantity = (cartItem, qty) => {
    if (qty < 1) return;
    updateItemQuantity(cartItem.itemId, qty);
    window.location.reload();
  };

  const onClickRemove = (itm) => {
    setConfirmRemove(true);
    setSelectedToRemove(itm);
  };

  const handleRemove = async (itm) => {
    if (!itm || !itm.itemId) {
      // console.error('Cannot remove: item or itemId is missing', itm);
      return;
    }

    try {
      // Track remove_from_cart event
      const productToTrack = {
        productId: itm.productId || itm.id || '',
        productName: itm.productName || itm.name || '',
        price: itm.price || itm.basePrice || 0,
        basePrice: itm.basePrice || itm.price || 0,
        category: itm.category || itm.categoryId || '',
        categoryId: itm.categoryId || '',
        variantId: itm.variantId || '',
        size: itm.size || '',
        color: itm.color || '',
        currency: itm.currency || basket?.currency || 'Rs.'
      };
      trackRemoveFromCart(productToTrack, itm.quantity || 1, productToTrack.currency);

      // Await the removal operation
      await removeFromBasket(itm.itemId);

      setSelectedToRemove(null);
      setConfirmRemove(false);

      // Reload after successful removal
      window.location.reload();
    } catch (error) {
      // console.error('Failed to remove item from cart:', error);
      // Don't reload on error, let user retry
      setConfirmRemove(false);
    }
  };

  const parseSizeFromPid = (pid = "") => {
    const up = String(pid).toUpperCase();
    const m = up.match(/(XXXXL|XXXL|XXL|XL|XS|[0-9]+(?:\.[0-9]+)?|[SML])$/);
    return m ? m[1] : "";
  };

  const selVV = lowerKeys(item?.variationValues || item?.c_variationValues || {});
  const sizeFromPid = parseSizeFromPid(item?.productId);
  const imgSrc = resolveItemImage(item, imageOverride);

  const size =
    sizeFromPid ||
    (selVV.size ? String(selVV.size).toUpperCase() : "") ||
    (fromVariationArrays(item, "size") || "").toString().toUpperCase() ||
    (attrOverride.size || "").toString().toUpperCase() ||
    "";

  const material =
    attrOverride.material ||
    fromVariationArrays(item, "material") ||
    item?.c_material ||
    "";

  const priceNumber =
    Number(item?.price) || Number(item?.basePrice) || Number(item?.priceAfterItemDiscount) || 0;

  const currencyCode =
    item?.currency ||
    item?.productDetails?.currency ||
    basket?.currency;

  return (
    <Flex mb="4">
      <Box w={{ base: "88px", md: "130px", lg: "165px" }} h={{ base: "144px", md: "212px" }}>
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={item?.productName}
            w="full"
            h="full"
            objectFit="cover"
            objectPosition="top"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        ) : (
          <Box w="full" h="full" bg="blackAlpha.100" />
        )}
      </Box>

      <Flex flex="1" direction="column" justify="space-between" pl="4" position="relative">
        <Box>
          <Flex justify="space-between" align="flex-start">
            <Text as="h6" fontSize={{ base: "xs", lg: "md" }} fontWeight="normal" textTransform="uppercase">
              {item?.productName}
            </Text>

            {/* <Box position="relative">
              <Checkbox
                id={`${item?.itemId}`}
                checked={!!selected}
                onChange={(e) => onSelectChange?.(e.target.checked)}
              />
            </Box> */}
          </Flex>

          <Text textTransform="uppercase" fontSize={{ base: "xs", lg: "sm" }} color="#1d1d1d" my={{ base: 1, lg: 2 }}>
            <Text as="span" mr="1" color="blackAlpha.600">size -</Text>{size}
          </Text>

          <Text textTransform="uppercase" fontSize={{ base: "xs", lg: "sm" }} color="#1d1d1d" mb={{ base: 1, lg: 2 }}>
            <Text as="span" mr="1" color="blackAlpha.600">material -</Text>{material}
          </Text>

          <Box>
            <Text color="black" fontSize={{ base: "xs", lg: "md" }}>
              {currencyCode} {priceNumber.toFixed(2)}
            </Text>
          </Box>
        </Box>

        <Flex justify="space-between" align="flex-end" mt={{ base: 1, lg: 2 }}>
          <Flex align="center" justify="space-between" w="auto" borderWidth="1px" borderColor="black" px="3">
            <button
              onClick={() => changeQuantity(item, item?.quantity - 1)}
              disabled={item.quantity <= 1}
              style={{
                background: "transparent",
                padding: "4px 8px",
                fontSize: 14,
                cursor: item.quantity <= 1 ? "not-allowed" : "pointer",
                opacity: item.quantity <= 1 ? 0.3 : 1,
                marginRight: 8,
              }}
            >
              -
            </button>
            <span style={{ fontSize: "xs", color: "#3d3d3d", fontWeight: 300 }}>{item?.quantity}</span>
            <Tooltip
              label={qtyTipLabel}
              fontSize="9px"
              px="6px"
              py="4px"
              borderRadius="0"
              hasArrow
              placement="top"
              isOpen={isMobile ? qtyTipOpen : undefined}   // ✅ controlled only on mobile
              onClose={closeQtyTip}
              closeOnClick
              shouldWrapChildren
            >
              <button
                onClick={(e) => {
                  // 📱 Mobile: always show tooltip on tap if blocked
                  if (isMobile && (isOutOfStock || isMaxReached)) {
                    e.preventDefault();
                    e.stopPropagation();
                    openQtyTip();
                    return;
                  }

                  // ⛔ Block increment when stock reached
                  if (isOutOfStock || isMaxReached) return;

                  changeQuantity(item, quantity + 1);
                }}
                disabled={false} // keep enabled so tooltip can trigger
                style={{
                  background: "transparent",
                  padding: "4px 8px",
                  fontSize: 14,
                  cursor: (isOutOfStock || isMaxReached) ? "not-allowed" : "pointer",
                  opacity: (isOutOfStock || isMaxReached) ? 0.4 : 1,
                  marginLeft: 8,
                }}
              >
                +
              </button>
            </Tooltip>

          </Flex>

          <Box
            as={Link}
            to="#"
            fontSize={{ base: "11px", lg: "xs" }}
            textTransform="uppercase"
            color="blackAlpha.600"
            onClick={() => onClickRemove(item)}
          >
            Remove
          </Box>
        </Flex>
      </Flex>

      <ConfirmationModal
        isOpen={confirmRemove}
        onConfirm={() => handleRemove(selectedToRemove)}
        onCancel={() => {
          setConfirmRemove(false);
          setSelectedToRemove(null);
        }}
        title="Remove This Product?"
        subtitle="Are you sure you want to remove this product?"
      />
    </Flex>
  );
}

export default SingleCartComponent;
