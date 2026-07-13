import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  Image as CImage,
  Text,
  Textarea,
  VisuallyHidden,
} from "@chakra-ui/react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

import { useAuth } from "@/context/AuthContext";
// import custom from "@/assets/images/dummy.png";
import ReviewLoginFlowModal from "@/components/compounds/reviewLoginFlow";
import ShimmerRatingReviewPage from "@/components/layouts/Simmers/ShimmerRatingReviewPage";

import { get_order_details } from "@/api/services";
import { checkHasReview, submitReviewWithMedia } from "@/api/services/review";
// ✅ TODO: replace with your actual service
// import { submitReviewWithMedia } from "@/api/services/reviewService";

const Star = ({ filled }) => (
  <svg width="22" height="22" viewBox="0 0 13 12" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8.12402 4.23047L8.18262 4.37598L8.33984 4.38574L12.71 4.65527L9.34473 7.35938L9.21875 7.46094L9.25977 7.61816L10.3457 11.7314L6.63086 9.45312L6.5 9.37305L6.36914 9.45312L2.6543 11.7305L3.74023 7.61816L3.78223 7.46094L3.65527 7.35938L0.289062 4.65527L4.66016 4.38574L4.81738 4.37598L4.87598 4.23047L6.5 0.268555L8.12402 4.23047Z"
      stroke="black"
      strokeWidth="0.5"
      fill={filled ? "#000" : "transparent"}
    />
  </svg>
);

const CheckboxBW = ({ id, checked, onChange, label }) => {
  const labelStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
    userSelect: "none",
  };

  const inputStyle = {
    position: "absolute",
    opacity: 0,
    width: 0,
    height: 0,
    margin: 0,
    pointerEvents: "none",
  };

  const boxStyle = {
    width: 16,
    height: 16,
    boxSizing: "border-box",
    border: "1.5px solid #000",
    borderRadius: 0,
    background: checked ? "#000" : "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 120ms ease-in-out, border-color 120ms ease-in-out",
  };

  return (
    <label htmlFor={id} style={labelStyle}>
      <input id={id} type="checkbox" checked={checked} onChange={onChange} style={inputStyle} />
      <span style={boxStyle}>
        {checked ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 6.5l2 2 5-5"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>

      {/* If you DON'T want label text, pass label="" */}
      {label ? <span style={{ fontSize: 14, color: "#343434" }}>{label}</span> : null}
    </label>
  );
};


const getFirstProductImage = (subOrder) => {
  // your normalized shape: subOrder.product.productImages[]
  const img = subOrder?.product?.productImages?.[0]?.image;
  return img || custom;
};

const RatingReviewForm = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const sku = searchParams.get("sku");
  const { isAuthenticated, user, authReady } = useAuth();

  const [showLoginFlow, setShowLoginFlow] = useState(false);
  const [modalType, setModalType] = useState("");

  const [pageLoading, setPageLoading] = useState(false);
  const [order, setOrder] = useState(null);

  // ✅ selected product (auto-select first)
  const [selectedItemId, setSelectedItemId] = useState("");
  const [reviewExistsByProductId, setReviewExistsByProductId] = useState({});
  const [deletedProducts, setDeletedProducts] = useState(new Set());

  // ✅ per item form state
  // { [itemId]: { rating, hover, review, file, previewUrl, submitting } }
  const [formByItemId, setFormByItemId] = useState({});

  const fileInputRef = useRef(null);

  // ---- Auth gating ----
  useEffect(() => {
    if (!authReady) return; // Wait until auth restoration is complete

    if (!isAuthenticated) {
      setModalType("LOGIN");
      setShowLoginFlow(true);
      return;
    }
    setModalType("");
    setShowLoginFlow(false);
  }, [isAuthenticated, user?.customerId, authReady]);

  // ---- Fetch order details using :orderId ----
  const fetchOrder = async () => {
    if (!orderId) return;
    try {
      setPageLoading(true);
      const res = await get_order_details({ queryKey: ["sfcc_order_details", { orderId }] });
      const order = res?.data?.order;
      if (!order) {
        // toast.error("Could not load order details.");
        return;
      }
      setOrder(order);
      checkReviewExistsForAllProducts(order);
    } catch (e) {
      // console.error(e);
      // toast.error(e?.message || "Order details fetch failed");
    } finally {
      setPageLoading(false);
    }
  };

  // ---- Check if reviews exist for all products ----
  const checkReviewExistsForAllProducts = async (order) => {
    if (!order?.subOrders) return;

    const checkReviewPromises = order.subOrders.map(async (subOrder) => {
      const productId = subOrder.productId;
      const authorEmail = user?.email || user?.customerEmail || user?.data?.email;

      if (!productId || !authorEmail) return;

      try {
        const result = await checkHasReview({
          productId,
          authorEmail,
        });
        if (result.hasReview) {
          setReviewExistsByProductId((prev) => ({
            ...prev,
            [productId]: true,
          }));
        }
      } catch (error) {
        // console.error("Error checking review existence:", error);
      }
    });

    await Promise.all(checkReviewPromises);
  };

  useEffect(() => {
    if (isAuthenticated) fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, isAuthenticated, user?.customerId]);

  // ✅ list for UI (from your normalizer)
  const subOrders = useMemo(() => {
    return Array.isArray(order?.subOrders) ? order.subOrders : [];
  }, [order]);

  // ---- Auto select first product when subOrders ready ----
  useEffect(() => {
    if (!subOrders.length) return;

    // Try to find by SKU from query param first
    let initialId = null;
    if (sku) {
      const found = subOrders.find(
        (item) =>
          String(item.productId).toLowerCase() === String(sku).toLowerCase() ||
          String(item.itemId).toLowerCase() === String(sku).toLowerCase()
      );
      if (found) {
        initialId = found.itemId || found.productId;
      }
    }

    // Fallback to first item if no SKU match
    if (!initialId) {
      const first = subOrders[0];
      initialId = first?.itemId || first?.productId || "first";
    }

    setSelectedItemId((prev) => prev || initialId);

    setFormByItemId((prev) => {
      if (prev[initialId]) return prev;
      return {
        ...prev,
        [initialId]: {
          rating: 0,
          hover: 0,
          review: "",
          files: [],
          previewUrls: [],
          submitting: false,
        },
      };
    });
  }, [subOrders, sku]);

  const ensureForm = (id) => {
    setFormByItemId((prev) => {
      if (prev[id]) return prev;
      return {
        ...prev,
        [id]: {
          rating: 0,
          hover: 0,
          review: "",
          files: [],
          previewUrls: [],
          submitting: false,
        },
      };
    });
  };

  const activeForm = selectedItemId ? formByItemId[selectedItemId] : null;

  const patchActive = (patch) => {
    if (!selectedItemId) return;
    setFormByItemId((prev) => ({
      ...prev,
      [selectedItemId]: { ...(prev[selectedItemId] || {}), ...patch },
    }));
  };

  const handleSelect = (id) => {
    setSelectedItemId(id);
    ensureForm(id);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedItemId) return;

    const current = formByItemId[selectedItemId];
    const currentFiles = current?.files || [];
    const currentPreviews = current?.previewUrls || [];

    if (currentFiles.length >= 3) {
      toast.warning("You can upload a maximum of 3 images.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setFormByItemId((prev) => ({
      ...prev,
      [selectedItemId]: {
        ...(prev[selectedItemId] || {}),
        files: [...currentFiles, file],
        previewUrls: [...currentPreviews, previewUrl],
      },
    }));

    // Reset input so same file can be selected again if needed (though unlikely here)
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveImage = (index) => {
    if (!selectedItemId) return;

    setFormByItemId((prev) => {
      const current = prev[selectedItemId];
      if (!current) return prev;

      const newFiles = [...(current.files || [])];
      const newPreviews = [...(current.previewUrls || [])];

      newFiles.splice(index, 1);
      newPreviews.splice(index, 1);

      return {
        ...prev,
        [selectedItemId]: {
          ...current,
          files: newFiles,
          previewUrls: newPreviews,
        },
      };
    });
  };

  const handleCancel = () => {
    if (!selectedItemId) return;
    patchActive({ rating: 0, hover: 0, review: "", files: [], previewUrls: [] });
  };

  const canSubmit = !!activeForm?.rating;

  const handleSubmit = async () => {
    if (!selectedItemId) {
      // toast.warning("Select a product to review.");
      return;
    }
    const current = formByItemId[selectedItemId];
    if (!current?.rating) {
      // toast.warning("Please select a rating.");
      return;
    }

    const selected = subOrders.find((s) => (s?.itemId || s?.productId) === selectedItemId);
    const productId = selected?.productId;
    if (!productId) {
      // toast.error("Product id missing.");
      return;
    }

    // ✅ build full name from firstName + lastName (preferred)
    const firstName = String(user?.firstName || "").trim();
    const lastName = String(user?.lastName || "").trim();
    const fullName = `${firstName} ${lastName}`.trim();

    const authorName =
      fullName || "";

    const authorEmail =
      String(user?.email || "").trim() ||
      "";

    if (!authorEmail) {
      // toast.error("Please login again to submit review.");
      return;
    }

    try {
      patchActive({ submitting: true });

      const form = new FormData();
      form.append("productId", String(productId));
      form.append("rating", String(current.rating));
      form.append("title", "Great product");
      form.append("text", current.review || "");
      form.append("authorName", authorName);
      form.append("authorEmail", authorEmail);
      // form.append("wouldRecommend", "true");
      // form.append("pros", "Fast shipping"); // replace later if you add input
      // form.append("cons", "Packaging could be better"); 
      if (current.files && current.files.length > 0) {
        current.files.forEach((file) => {
          form.append("file", file);
        });
      }

      const baseUrl = "YOUR_BASE_URL"; // replace with actual base URL
      const url = `${baseUrl}/reviews/with-media`;
      const response = await submitReviewWithMedia(form);
      const data = await response.json();

      if (response.ok && data.success !== false) {
        // Successfully submitted the review
        setDeletedProducts((prev) => new Set(prev.add(productId)));
        toast.success("Review submitted successfully!");

        // Reset form for this item
        setFormByItemId((prev) => ({
          ...prev,
          [selectedItemId]: {
            rating: 0,
            hover: 0,
            review: "",
            files: [],
            previewUrls: [],
            submitting: false,
          }
        }));
      } else {
        if (data?.error) {
          toast.error(data.error.message || "Review submission failed");
        } else {
          toast.error("Review submission failed");
        }
      }
    } catch (error) {
      // console.error(error);
      toast.error(error.message || "Error submitting review");
    } finally {
      patchActive({ submitting: false });
    }
  };

  const visibleSubOrders = subOrders.filter((item) => !deletedProducts.has(item.productId));


  if ((pageLoading && !order) || !authReady) {
    return (
      <>
        <ShimmerRatingReviewPage />
        <ReviewLoginFlowModal
          start={showLoginFlow && authReady}
          onCompletion={() => setShowLoginFlow(false)}
          modalType={modalType}
          setModalType={setModalType}
        />
      </>
    );
  }

  return (
    <>
      <Box maxW="860px" mx="auto" py={5} px={5}>
        <Text
          fontSize={{ base: "lg", md: "2xl" }}
          fontWeight="700"
          textAlign="center"
          mb={8}
          letterSpacing="0.08em"
          textTransform="uppercase"
        >
          WRITE A REVIEW
        </Text>


        {/* ✅ Product list from order history */}
        <Box>
          {visibleSubOrders.map((item, idx) => {
            const id = item?.itemId || item?.productId || `idx_${idx}`;
            const name = item?.productName || item?.product?.title || "PRODUCT";
            const img = getFirstProductImage(item);

            const isSelected = id === selectedItemId;
            const form = formByItemId[id] || {
              rating: 0,
              hover: 0,
              review: "",
              files: [],
              previewUrls: [],
              submitting: false,
            };

            return (
              <Box key={id} py={0.5}>
                {/* row */}
                <Flex align="flex-start" justify="space-between" gap={3}>
                  <HStack spacing={4} align="flex-start">
                    <CImage
                      src={img}
                      alt={name}
                      h="120px"
                      w={{ md: "90px" }}
                      objectFit="cover"
                      bg="gray.50"
                    />
                    <Box>
                      <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="600" textTransform="uppercase">
                        {name}
                      </Text>

                      {/* ⭐ always visible */}
                      <HStack spacing={1} mt={2}>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Box
                            as="button"
                            type="button"
                            key={i}
                            onClick={() => {
                              handleSelect(id);
                              setFormByItemId((prev) => ({
                                ...prev,
                                [id]: { ...(prev[id] || form), rating: i },
                              }));
                            }}
                            onMouseEnter={() =>
                              setFormByItemId((prev) => ({
                                ...prev,
                                [id]: { ...(prev[id] || form), hover: i },
                              }))
                            }
                            onMouseLeave={() =>
                              setFormByItemId((prev) => ({
                                ...prev,
                                [id]: { ...(prev[id] || form), hover: 0 },
                              }))
                            }
                            bg="transparent"
                            border="none"
                          >
                            <Star filled={i <= (form.hover || form.rating)} />
                          </Box>
                        ))}
                      </HStack>
                    </Box>
                  </HStack>

                  {/* checkbox right */}
                  <Box mt="4px">
                    <CheckboxBW
                      id={`select_${id}`}
                      checked={isSelected}
                      label="" // keep empty to match screenshot (only checkbox)
                      onChange={() => handleSelect(id)}
                    />
                  </Box>

                </Flex>

                {/* ✅ expanded section only for selected */}
                {isSelected && (
                  <Box mt={4}>
                    {/* review box */}
                    <Box border="1px solid" borderColor="blackAlpha.300" mb={5}>
                      <Textarea
                        placeholder="Write a review"
                        minH="120px"
                        border="none"
                        fontSize="sm"
                        value={form.review}
                        maxLength={500}
                        onChange={(e) =>
                          setFormByItemId((prev) => ({
                            ...prev,
                            [id]: { ...(prev[id] || form), review: e.target.value },
                          }))
                        }
                        _placeholder={{ color: "blackAlpha.500" }}
                        _focus={{
                          borderColor: "blackAlpha.300",
                          boxShadow: "none",
                        }}
                        _focusVisible={{
                          borderColor: "blackAlpha.300",
                          boxShadow: "none",
                        }}
                        _active={{
                          borderColor: "blackAlpha.300",
                          boxShadow: "none",
                        }}
                      />
                    </Box>

                    {/* upload */}
                    <Box bg="#F5F5F5" px={4} py={3} mb={6}>
                      <Text fontSize="sm" mb={3}>
                        Upload Images (Max 3)
                      </Text>

                      <HStack spacing={4} align="center" flexWrap="wrap">
                        {/* Previews */}
                        {(form.previewUrls || []).map((url, idx) => (
                          <Box key={idx} position="relative" w="90px" h="120px">
                            <CImage
                              src={url}
                              alt={`Uploaded ${idx + 1}`}
                              w="100%"
                              h="100%"
                              objectFit="cover"
                              bg="gray.50"
                            />
                            {/* Remove button */}
                            <Button
                              position="absolute"
                              top="-8px"
                              right="-8px"
                              size="xs"
                              rounded="full"
                              bg="black"
                              color="white"
                              w="20px"
                              h="20px"
                              minW="20px"
                              p={0}
                              zIndex={2}
                              onClick={() => handleRemoveImage(idx)}
                              _hover={{ bg: "gray.800" }}
                            >
                              ×
                            </Button>
                          </Box>
                        ))}

                        {/* Add Button */}
                        {(form.files || []).length < 3 && (
                          <Button
                            onClick={() => fileInputRef.current?.click()}
                            variant="ghost"
                            bg="transparent"
                            border="1px solid"
                            borderColor="gray.300"
                            rounded="full"
                            w="50px"
                            h="32px"
                            p={0}
                            _hover={{ bg: "transparent" }}
                            _active={{ bg: "transparent" }}
                            aria-label="Upload image"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path
                                d="M4 7h3l1.2-2h7.6L17 7h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"
                                stroke="black"
                              />
                              <circle cx="12" cy="13" r="3.5" stroke="black" />
                            </svg>
                          </Button>
                        )}

                        <VisuallyHidden>
                          <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                          // Reset key or value to allow re-uploading if needed is handled in handler
                          />
                        </VisuallyHidden>
                      </HStack>
                    </Box>

                    {/* cancel + submit */}
                    <Flex gap={4} mb={4}>
                      <Button
                        type="button"
                        w="full"
                        bg="white"
                        border="1px solid"
                        borderColor="blackAlpha.500"
                        borderRadius="0"
                        fontWeight="400"
                        fontSize={{ base: "xs", md: "md" }}
                        onClick={handleCancel}
                        _hover={{ bg: "transparent" }}
                      >
                        CANCEL
                      </Button>

                      <Button
                        type="button"
                        w="full"
                        borderRadius="0"
                        fontWeight="400"
                        fontSize={{ base: "xs", md: "md" }}
                        bg={canSubmit ? "black" : "#1D1D1D"}
                        color="white"
                        _hover={{ bg: canSubmit ? "black" : "#1D1D1D" }}
                        isDisabled={!canSubmit || !!form.submitting}
                        onClick={handleSubmit}
                      >
                        SUBMIT
                      </Button>
                    </Flex>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>

      <ReviewLoginFlowModal
        start={showLoginFlow}
        onCompletion={() => setShowLoginFlow(false)}
        modalType={modalType}
        setModalType={setModalType}
      />
    </>
  );
};

export default RatingReviewForm;
