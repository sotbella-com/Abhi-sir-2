import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { postRequest } from "@/utils/apiService";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import {
  Box,
  Flex,
  Text,
  Button,
  Image as CImage,
  Textarea,
  HStack,
  VisuallyHidden,
  useColorModeValue,
  Divider,
} from "@chakra-ui/react";
import { submitReviewWithMedia } from "@/api/services/review";

const getProductImage = (p) => {
  if (!p) return "";
  const img =
    p?.productImages?.[0]?.image ||
    p?.image ||
    p?.images?.[0]?.src ||
    "";
  return img || "/api/placeholder/100/100";
};

const getProductName = (p) =>
  (p?.title || p?.name || "PRODUCT").toString().toUpperCase();

const RatingReviewModal = ({
  open,
  handleClose,
  data,
  setHandleRefresh,
  handleRefresh,
}) => {
  const { user } = useAuth();
  const [review, setReview] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [image, setImage] = useState(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const overlayRef = useRef(null);
  const dialogRef = useRef(null);
  const firstFocusableRef = useRef(null);
  const fileInputRef = useRef(null);
  const bannerBg = useColorModeValue("#f5f5f5", "gray.700");
  const borderCol = useColorModeValue("blackAlpha.300", "whiteAlpha.300");

  // scroll lock + esc + focus trap
  useEffect(() => {
    if (!open) return;

    const body = document.body;
    const html = document.documentElement;

    // store previous inline styles so we can restore perfectly
    const prev = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      paddingRight: body.style.paddingRight,
      overscroll: html.style.overscrollBehaviorY,
    };

    // current scroll to restore later
    const scrollY = window.scrollY || window.pageYOffset || 0;

    // avoid layout shift when scrollbar disappears
    const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarW > 0) body.style.paddingRight = `${scrollbarW}px`;

    // HARD LOCK
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";
    html.style.overscrollBehaviorY = "none"; // iOS/Android rubber-band stop

    // focus first focusable
    setTimeout(() => firstFocusableRef.current?.focus(), 0);

    const onKey = (e) => {
      if (e.key === "Escape") handleClose?.();
      if (e.key === "Tab") {
        const focusable = dialogRef.current?.querySelectorAll(
          'button,[href],input,textarea,select,[tabindex]:not([tabindex="-1"])'
        );
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);

    // Optional: block background touch scroll on iOS
    const preventTouch = (e) => {
      if (!dialogRef.current?.contains(e.target)) {
        e.preventDefault();
      }
    };
    document.addEventListener("touchmove", preventTouch, { passive: false });

    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("touchmove", preventTouch);

      // restore styles
      body.style.overflow = prev.overflow;
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      body.style.paddingRight = prev.paddingRight;
      html.style.overscrollBehaviorY = prev.overscroll;

      // restore scroll position exactly
      const y = Math.abs(parseInt(prev.top || "0", 10)) || scrollY;
      window.scrollTo(0, y);
    };
  }, [open, handleClose]);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
      setImage(file);
    }
  };


  const onPostReview = async () => {

    const productId = data?.product?.id ?? "";


    // ✅ build full name from firstName + lastName (preferred)
    const firstName = String(user?.firstName || "").trim();
    const lastName = String(user?.lastName || "").trim();
    const fullName = `${firstName} ${lastName}`.trim();

    const authorName =
      fullName || "";

    const authorEmail =
      String(user?.email || "").trim() ||
      "";


    if (!productId) {
      // toast.error("Product not found for review.");
      return;
    }
    if (!authorEmail) {
      // toast.error("Please login again to submit review.");
      return;
    }
    if (!rating) {
      // toast.warning("Please select a rating.");
      return;
    }

    try {
      setSubmitting(true);

      const form = new FormData();

      form.append("productId", productId);
      form.append("rating", String(rating));
      form.append("title", "Great product"); // replace later if you add input
      form.append("text", review || "");
      form.append("authorName", authorName);
      form.append("authorEmail", authorEmail);
      // form.append("wouldRecommend", "true");
      // form.append("pros", "Fast shipping"); // replace later if you add input
      // form.append("cons", "Packaging could be better"); // replace later if you add input

      if (image) form.append("file", image);

      const res = await submitReviewWithMedia(form);

      // toast.success(res?.message || "Review submitted");
      handleClose?.();

      setReview("");
      setRating(0);
      setSelectedImage(null);
      setImage(null);

      setHandleRefresh?.(!handleRefresh);
    } catch (err) {
      if (err.message === "Review already exists for this product") {
        // toast.warning("You have already submitted a review for this product.");
      } else {
        // toast.error(err?.message || "Something went wrong");
      }
    } finally {
      setSubmitting(false);
    }
  };


  if (!open) return null;

  const product = data?.product ?? {};
  const prodImg = getProductImage(product);
  const prodName = getProductName(product);

  return createPortal(
    <Box
      ref={overlayRef}
      position="fixed"
      inset={0}
      bg="blackAlpha.700"
      display="flex"
      alignItems="flex-start"
      justifyContent="center"
      zIndex={1000}
      onMouseDown={(e) => { if (e.target === overlayRef.current) handleClose?.(); }}
      px={{ base: 2, md: 6 }}
      pt={{ base: 4, md: 8 }}
      pb={{ base: 6, md: 10 }}
    >
      <Box
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Write a review"
        tabIndex={-1}
        bg="white"
        w="100%"
        maxW="800px"
        borderRadius="none"
        boxShadow="2xl"
        overflow="hidden"
        maxH="90vh" overflowY="auto" className="scrollbar-hide"
      >

        <Flex
          justifyContent={"end"}
          ref={firstFocusableRef}
          onClick={handleClose}
          variant="ghost"
          aria-label="Close"
          fontSize="2xl"
          mr={3}
          fontWeight={"normal"}
          cursor={"pointer"}
        >
          ×
        </Flex>

        {/* Header strip like screenshot */}
        <Flex align="center" justify="space-between" pb={2} ps={6} pe={6}>
          <Box bg={bannerBg} w="full" py={3} px={4} fontWeight="medium">
            <Text fontSize="md">Write review ...</Text>
          </Box>
        </Flex>

        {/* Body */}
        <Box px={6} pb={6}>
          {/* Product row: image left, name + stars right */}
          <HStack spacing={4} align="flex-start" mt={2} mb={4}>
            <CImage
              src={prodImg}
              alt={prodName}
              h={100}
              w={70}
              objectFit="cover"
              borderRadius="none"
              fallbackSrc="/api/placeholder/100/100"
            />
            <Box>
              <Text fontSize="sm" fontWeight="medium" letterSpacing="wide" mb={2}>
                {prodName}
              </Text>
              {/* ⭐ Inline SVG 5 Stars */}
              <HStack spacing={1}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Box
                    as="button"
                    key={i}
                    aria-label={`Rate ${i}`}
                    onClick={() => setRating(i)}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(0)}
                    cursor="pointer"
                    bg="transparent"
                    border="none"
                    p={0}
                  >
                    <svg
                      width="18"
                      height="17"
                      viewBox="0 0 13 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M8.12402 4.23047L8.18262 4.37598L8.33984 4.38574L12.71 4.65527L9.34473 7.35938L9.21875 7.46094L9.25977 7.61816L10.3457 11.7314L6.63086 9.45312L6.5 9.37305L6.36914 9.45312L2.6543 11.7305L3.74023 7.61816L3.78223 7.46094L3.65527 7.35938L0.289062 4.65527L4.66016 4.38574L4.81738 4.37598L4.87598 4.23047L6.5 0.268555L8.12402 4.23047Z"
                        stroke="black"
                        strokeWidth="0.5"
                        fill={
                          i <= (hover || rating)
                            ? "#f5970a"
                            : "transparent"
                        }
                      />
                    </svg>
                  </Box>
                ))}
              </HStack>
            </Box>
          </HStack>

          {/* Textarea */}
          <Box border="1px solid" borderColor={borderCol}>
            <Textarea
              border="none"
              resize="vertical"
              minH="100px"
              placeholder="Please write product review here."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              fontSize="sm"
              _placeholder={{ color: "blackAlpha.500" }}
              _focus={{
                boxShadow: "none",
                outline: "none",
              }}
              _focusVisible={{
                boxShadow: "none",
                outline: "none",
              }}
            />
          </Box>

          {/* Add Photos + preview */}
          <Box mt={4} bg="#F5F5F5" border="none" px={4} py={3}>
            <Text fontSize="sm" mb={3}>Upload Image</Text>

            <HStack align="center" spacing={4}>
              {/* Preview (left) */}
              {selectedImage && (
                <CImage
                  src={selectedImage}
                  alt="Selected"
                  h="120px"
                  w="90px"
                  objectFit="cover"
                  borderRadius="sm"
                  border="1px solid"
                  borderColor="blackAlpha.200"
                />
              )}

              {/* Camera button */}
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
                  <path d="M4 7h3l1.2-2h7.6L17 7h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" stroke="black" />
                  <circle cx="12" cy="13" r="3.5" stroke="black" />
                </svg>
              </Button>

              <VisuallyHidden>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </VisuallyHidden>
            </HStack>
          </Box>


          {/* spacer */}
          <Box h={8} />
          <Divider borderColor="transparent" />
          {/* Full-width black submit button (bottom) */}
          <Button
            onClick={onPostReview}
            isLoading={submitting}
            loadingText="Submitting"
            bg="black"
            color="white"
            _hover={{ bg: "black" }}
            w="100%"
            h="45px"
            fontWeight={"medium"}
            fontSize="md"
            letterSpacing="widest"
            rounded={"none"}
          >
            SUBMIT
          </Button>
        </Box>
      </Box>
    </Box>,
    document.body
  );
};

export default RatingReviewModal;
