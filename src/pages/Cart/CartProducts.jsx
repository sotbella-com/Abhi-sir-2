import React, { Fragment, useEffect, useState, useMemo } from "react";
import img1 from "@/assets/images/info-icon.png";
import WishlistService from "@/api/services/wishlist";
import { getCustomerId as getTokenCustomerId } from "@/utils/tokenUtils";
import { Link, useNavigate } from "react-router-dom";
import heartImg from "@/assets/images/blackheart1.png";
import redHeart from "@/assets/images/black-heart-icon.png";
import { toast } from "react-toastify";
import { LOCAL_KEYS } from "@/constants/localStorageKeys";
import { CURRENCY_SYMBOL } from "@/constants/constants";
import { Checkbox } from "antd";
import CartCouponAndPricingSection from "./cartCouponAndPricing";
import { Share2Icon } from "lucide-react";
import { useAddressStore, useWishlistStore } from "@/context";
import { useUnifiedCartStore } from "@/context/unifiedCartStore";
import { useAuth } from "@/context/AuthContext";
import AddToCartAnimation from "../../assets/images/empty.png";
import { LoginFlowModal } from "@/components/compounds";
import { useMobile } from "@/components/molecules";
import { trackViewCart, trackRemoveFromCart } from "@/utils/dataLayer";
import GuestCartItem from "./GuestCartItem.jsx";
import SingleCartComponent from "./SingleCartComponent.jsx";
import { Box, Flex, Text, Image, Button, HStack, VStack } from "@chakra-ui/react";

const CartProducts = ({ bottomRef }) => {
  const { basket, itemCount, total, refreshCartFromAPI, removeFromBasket } = useUnifiedCartStore();
  const { isAuthenticated, user } = useAuth();
  const { address, fetchAddress } = useAddressStore();
  const [showLoginFlow, setShowLoginFlow] = useState(false);
  const [modalType, setModalType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useMobile();
  const { fetchWishlist, wishListProduct } = useWishlistStore();
  const navigate = useNavigate();
  const [isBulkWishLoading, setIsBulkWishLoading] = useState(false);

  /** ── Selection state (controls Select All + item checkboxes) ── */
  const [selectedIds, setSelectedIds] = useState(new Set());


  const [idsSig, setIdsSig] = useState("");
  useEffect(() => {
    const items = basket?.productItems || [];
    const sig = items.map((it) => it.itemId || it.id).join("|");
    if (sig !== idsSig) {
      // ✅ Har change pe AUTO-SELECT ALL (deselects preserve nahi honge)
      const selectAll = new Set(items.map((it) => it.itemId || it.id));
      setSelectedIds(selectAll);
      setIdsSig(sig);
    }
  }, [basket, idsSig]);

  const items = basket?.productItems || [];
  const allSelected = items.length > 0 && selectedIds.size === items.length;

  const selectedItems = items.filter(it => selectedIds.has(it.itemId || it.id));

   // Check if all selected items are in wishlist
  const allSelectedInWishlist = useMemo(() => {
    if (selectedItems.length === 0) return false;
    return selectedItems.every(item => {
      const productId = item.productDetails?.id || item.productId || item.id;
      return wishListProduct?.some((w) => w?.product?.id === productId);
    });
  }, [selectedItems, wishListProduct]);

  const toggleSelectAll = (e) => {
    const checked = e.target.checked;
    if (checked) {
      setSelectedIds(new Set(items.map((it) => it.itemId || it.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleOne = (id, checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  // Fresh cart on load
  useEffect(() => {
    refreshCartFromAPI().catch((err) => 
      console.error("refresh cart failed", err));
  }, []);

  // Track view_cart when basket loads
  useEffect(() => {
    if (basket && basket.productItems?.length > 0) {
      trackViewCart(basket);
    }
  }, [basket]);

  const addAllToCartApi = async (element) => {
    let cid = user?.id;
    if (!cid) {
      try {
        cid = await getTokenCustomerId();
      } catch { }
    }
    if (!cid) return;
    await WishlistService.addItem(cid, element.productDetails?.id, 1);
    fetchWishlist({ customerId: cid });
  };

  const handleToggleAllWishlist = async () => {
    if (!isAuthenticated) {
      navigate("/main-login");
      return;
    }

    setIsBulkWishLoading(true);
    try {
      if (allSelectedInWishlist) {
        await bulkRemoveFromWishlist(selectedItems);
        // toast.success("Products removed from wishlist successfully!");
      } else {
        await bulkAddToWishlist(selectedItems);
        // toast.success("Products added to wishlist successfully!");
      }
    } catch (error) {
      // toast.error("Failed to update wishlist. Please try again.");
    } finally {
      setIsBulkWishLoading(false);
    }
  };

  const handleClick = async (event) => {
    if (isSubmitting) return;
    if (!isAuthenticated) {
      setModalType("LOGIN");
      setShowLoginFlow(true);
      return;
    }
    event.preventDefault();

    try {
      setIsSubmitting(true);

      // ✅ Re-fetch addresses, then read the latest from the store
      await fetchAddress({ customerId: user?.id });
      const latestAddresses = useAddressStore.getState().address;

      if (Array.isArray(latestAddresses) && latestAddresses.length > 0) {
        navigate("/address");
      } else {
        navigate("/Shipping");
      }
    } catch (e) {
      // toast.error("Something went wrong, please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };


  // get a customerId safely
  const ensureCustomerId = async () => {
    let cid = user?.id;
    if (!cid) {
      try { cid = await getTokenCustomerId(); } catch { }
    }
    return cid;
  };

  const bulkAddToWishlist = async (products = []) => {
    const cid = await ensureCustomerId();
    if (!cid) throw new Error("No customer id");
    // add in parallel
    const tasks = products.map(p =>
      WishlistService.addItem(cid, p.productDetails?.id || p.productId, 1)
    );
    await Promise.allSettled(tasks);
    await fetchWishlist({ customerId: cid });
  };

  const bulkRemoveFromWishlist = async (products = []) => {
    const cid = await ensureCustomerId();
    if (!cid) throw new Error("No customer id");
    // read wishlist once, then remove any matching productIds
    const { listId, items } = await WishlistService.getWishlistItems(cid);
    const idsToRemove = new Set(
      products
        .map(p => p.productDetails?.id || p.productId)
        .filter(Boolean)
    );
    const removeTasks = (items || [])
      .filter(w => idsToRemove.has(w.productId))
      .map(w => WishlistService.removeItem(cid, listId, w.id));
    await Promise.allSettled(removeTasks);
    await fetchWishlist({ customerId: cid });
  };



  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchAddress({ customerId: user.id }).catch(() => { });
      fetchWishlist({ customerId: user.id }).catch(() => { });
    }
  }, [isAuthenticated, user?.id, fetchAddress, fetchWishlist]);

  return (
    <Fragment>
      <Box textAlign="left" w="full" px={{ base: "12px", md: "50px" }} pt={{ base: "70px", sm: "40px", lg: 0 }}>
        <Flex flexWrap="wrap">
          {/* LEFT */}
          <Box
            w={itemCount === 0 ? "100%" : { base: "100%", md: "50%" }}
            overflowY="auto"
            maxH="650px"
            className="scrollbar-hide"
          >
            <Box w="full">
              <Text as="h5" textTransform="uppercase" fontWeight="semibold" fontSize="lg" mb="1">
                shopping bag{" "}
                <Text as="small" textTransform="capitalize" fontSize="sm" color="blackAlpha.600" fontWeight="normal">
                  ({itemCount} item{itemCount !== 1 ? "s" : ""})
                </Text>
              </Text>

              <HStack spacing="6px" align="center" color="#666" fontSize="14px">
                <Image src={img1} alt="" w="15px" />
                <Text>Items in your bag aren’t reserved — checkout now</Text>
              </HStack>
            </Box>

            {/* Top controls */}
            <Box w="full" mt="3">
              <Box display="flex" flexDirection="column" borderBottomWidth="1px" borderColor="#1d1d1d" mx="1px">
                <Flex flexWrap="wrap" align="center" mb="3" px="0" w="full">
                  {itemCount !== 0 && (
                    <Box w={{ base: "66.6667%", md: "83.3333%" }}>
                      <HStack align="center" gap={0}>
                        {/* ✅ Select All */}
                        {/* <Checkbox
                          id="all_items_check"
                          checked={allSelected}
                          // onChange={toggleSelectAll}
                        >
                          Select All
                        </Checkbox> */}

                        {/* show selected item count */}
                        <Text fontSize="xs" color="blackAlpha.600">
                          (
                          {selectedIds.size} item
                          {/* {selectedIds.size !== 1 ? "s" : ""} selected */}
                          )
                        </Text>
                      </HStack>
                    </Box>
                  )}


                  {itemCount !== 0 && (
                    <Box w={{ base: "33.3333%", md: "16.6667%" }}>
                      <HStack align="center" justify="flex-end" mb="0" spacing="8px">
                        <Box
                          as={Share2Icon}
                          size={14}
                          role="button"
                          title="Share Cart"
                          cursor="pointer"
                          _hover={{ opacity: 0.7 }}
                          onClick={() => {
                            const cartItems = (basket?.productItems || [])
                              .map((item, index) => {
                                const imageUrl = item?.productImages?.[0]?.image;
                                const productTitle = item?.productName?.toLowerCase()?.replace(/ /g, "-");
                                const productId = item?.productId;
                                const productLink = `https://sotbella.com/product/${productTitle}/${productId}`;
                                return `${index + 1}. *${item?.productName}*
   Price: ${CURRENCY_SYMBOL}${item?.price}
   Quantity: ${item?.quantity}
   Link: ${productLink}${imageUrl ? `\n   Image: ${imageUrl}` : ""}`;
                              })
                              .join("\n\n");

                            const message = `*SOTBELLA FASHION CART*

${cartItems}

*Cart Summary:*
   Total Items: ${itemCount}
   Total Value: ${CURRENCY_SYMBOL}${total}

*Shop the complete collection:*
https://sotbella.com

*Best regards,*
*Team Sotbella*`;

                            if (navigator.share) {
                              navigator
                                .share({ title: "Sotbella Fashion Cart", text: message, url: "https://sotbella.com" })
                                .catch(() => shareViaWhatsApp(message));
                            } else {
                              shareViaWhatsApp(message);
                            }

                            function shareViaWhatsApp(msg) {
                              const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
                              const newWindow = window.open(
                                whatsappUrl,
                                "_blank",
                                "noopener,noreferrer,width=800,height=600"
                              );
                              setTimeout(() => {
                                if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
                                  navigator.clipboard
                                    .writeText(msg)
                                    // .then(() => toast.success("Cart copied. Paste into WhatsApp!"))
                                    .catch(() => alert("Please copy this message manually:\n\n" + msg));
                                }
                              }, 100);
                            }
                          }}
                        />
                        <Text as="span">|</Text>
                        <Image
                          id="move-all-to-wishlist"
                          src={allSelectedInWishlist ? redHeart : heartImg}
                          w="15px"
                          cursor="pointer"
                          onClick={isBulkWishLoading ? undefined : handleToggleAllWishlist}
                          pointerEvents={isBulkWishLoading ? "none" : "auto"}
                          alt="Wishlist Icon"
                        />
                      </HStack>
                    </Box>
                  )}
                </Flex>
              </Box>

              {/* CART PRODUCT SECTION */}
              <Box display="flex" flexDirection="column" mt="4" w="full">
                {(() => {
                  const displayCart = basket?.productItems || [];
                  const hasItems = displayCart && displayCart.length > 0;

                  return hasItems ? (
                    <VStack align="stretch" spacing="4">
                      {items.map((item, idx) => {
                        const id = item.itemId || item.id;
                        const selected = selectedIds.has(id);
                        return isAuthenticated ? (
                          <SingleCartComponent
                            key={id || idx}
                            item={item}
                            selected={selected}
                            // onSelectChange={(checked) => toggleOne(id, checked)}
                          />
                        ) : (
                          <GuestCartItem
                            key={id || idx}
                            item={item}
                            index={idx}
                            selected={selected}
                            // onSelectChange={(checked) => toggleOne(id, checked)}
                          />
                        );
                      })}
                    </VStack>
                  ) : (
                    <Box textAlign="center">
                      <Box maxW="350px" mx="auto">
                        <Image src={AddToCartAnimation} alt="Empty Wishlist" />
                      </Box>
                      <Box my="4">
                        <Text as="h4" fontSize="lg" fontWeight="semibold">
                          Hey, it’s looks empty!
                        </Text>
                        <Text fontSize="sm">Oops! Your Shopping bag is empty. Start adding your items now.</Text>
                      </Box>

                      <Button
                        as={Link}
                        to="/category/all dresses"
                        bg="#1d1d1d"
                        color="white"
                        fontWeight="normal"
                        borderRadius="0"
                        fontSize="sm"
                        px="5"
                        py="2"
                        mt="2"
                        _hover={{ bg: "#1d1d1d" }}
                      >
                        Shop Now
                      </Button>
                    </Box>
                  );
                })()}
              </Box>
            </Box>
          </Box>

          {/* RIGHT */}
          {(basket?.productItems || []).length !== 0 && (
            <CartCouponAndPricingSection
              bottomRef={bottomRef}
              disabled={isSubmitting}
              buttonTitle={isSubmitting ? "Selecting..." : "Select address"}
              onButtonClick={handleClick}
              selectedItems={selectedItems}
            />
          )}

          {/* Login flow modal */}
          <LoginFlowModal
            start={showLoginFlow}
            onCompletion={() => setShowLoginFlow(false)}
            modalType={modalType}
            setModalType={setModalType}
          />
        </Flex>
      </Box>
    </Fragment>
  );
};

export default CartProducts;
