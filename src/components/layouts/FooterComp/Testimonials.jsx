import React, { Fragment, useMemo, useState, useEffect, useRef } from "react";
import {
  Box,
  Grid,
  Image,
  Text,
  Heading,
  Flex,
  Button,
  HStack,
  useDisclosure,
  AspectRatio,
} from "@chakra-ui/react";
import { StarIcon } from "@chakra-ui/icons";
import { useQuery } from "@tanstack/react-query";

import { useNavigateToProduct } from "@/utils/url";
import CartQuickView from "@/pages/ProductDetails/components/cartQuickView";
import Footer from "@/NewHomePage/components/footer/Footer";
import LogoNavbar from "../LogoNavbar";
import TestimonialsModal from "./TestimonialsModal";

import { getStoreReviews, mapStoreReviewToCard } from "@/api/services/testimonials";
import { TestimonialsGridShimmer } from "../Simmers/TestimonialsShimmer";

const ReviewImage = ({ src, alt }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <Box
        w="100%"
        h="100%"
        bg="blackAlpha.100"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text fontSize="xs" color="blackAlpha.600">
          No image
        </Text>
      </Box>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      objectFit="cover"
      w="100%"
      h="100%"
      onError={(e) => {
        setFailed(true);
      }}
    />
  );
};


/* ✅ super-stable star renderer */
const Stars = ({ value = 0, size = { base: 2.5, md: 3.5 } }) => {
  const rating = Math.max(0, Math.min(5, Number(value) || 0));
  const rounded = Math.round(rating);

  return (
    <HStack spacing="2px" mt={1}>
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon
          key={i}
          boxSize={size}
          color={i < rounded ? "black" : "blackAlpha.300"}
        />
      ))}
    </HStack>
  );
};

/** ✅ Prevent empty string src (fixes warning) */
const safeSrc = (src) =>
  typeof src === "string" && src.trim().length > 0 ? src.trim() : null;

const Testimonials = () => {
  const navigateToProduct = useNavigateToProduct();

  const PAGE_SIZE = 24;      // show 20 per page
  const FETCH_LIMIT = 1000;   // fetch 1000 total (increase if needed)
  const [page, setPage] = useState(1);
  const observerRef = useRef(null);
  const observerInstanceRef = useRef(null);

  const {
    data: ratingData,
    isLoading: ratingsLoading,
    isError: ratingsError,
    error: ratingsErrObj,
  } = useQuery({
    queryKey: ["store-reviews", { limit: FETCH_LIMIT, status: "approved" }],
    queryFn: () =>
      getStoreReviews({
        limit: FETCH_LIMIT,
        status: "approved",
      }),
    refetchOnWindowFocus: false,
    retry: 1,
  });


  // If your API returns meta like { total, totalPages }, use it.
  // Otherwise we fallback to "if results < LIMIT => no next page".
  const rawReviews = ratingData?.reviews || ratingData?.data?.reviews || [];
  const ratings = useMemo(() => rawReviews.map(mapStoreReviewToCard), [rawReviews]);

  useEffect(() => {
    if (ratingData?.data?.reviews?.length) {
    }
  }, [ratingData]);

  const hasRatings = Array.isArray(ratings) && ratings.length > 0;

  const visibleRatings = useMemo(() => {
    return ratings.slice(0, page * PAGE_SIZE); // ✅ 20, 40, 60... show
  }, [ratings, page]);

  const hasMore = visibleRatings.length < ratings.length;

  const [selected, setSelected] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const openModal = (t) => {
    if (isOpen) return;
    setSelected(t);
    onOpen();
  };

  const selectedImgSrc = safeSrc(selected?.media) || safeSrc(selected?.icon);

  useEffect(() => {
    setPage(1);
  }, [ratings.length]);

  useEffect(() => {
    if (!hasRatings) return;

    if (!observerInstanceRef.current) {
      observerInstanceRef.current = new IntersectionObserver(
        (entries) => {
          const first = entries[0];
          if (!first.isIntersecting) return;
          if (!hasMore) return;

          setPage((p) => p + 1); // ✅ reveal next 20
        },
        { root: null, rootMargin: "500px 0px 0px 0px", threshold: 0 }
      );
    }

    const el = observerRef.current;
    const io = observerInstanceRef.current;

    if (el) io.observe(el);

    return () => {
      if (el) io.unobserve(el);
    };
  }, [hasRatings, hasMore]);


  return (
    <Fragment>
      <Box overflowX="hidden">
        <LogoNavbar />
        <CartQuickView />

        <Box mt={{ base: "60px", md: "90px" }} pt={4}>
          <Heading
            as="h1"
            fontSize={{ base: "2xl", md: "4xl" }}
            fontWeight="normal"
            fontFamily="Dm Serif Display"
            textAlign="center"
            textTransform="uppercase"
          >
            Testimonials
          </Heading>
        </Box>

        <Box
          mt={{ base: "10px", md: "20px" }}
          px={{ base: "12px", md: "50px" }}
          minH={!hasRatings ? "80vh" : "auto"}
          display="flex"
          flexDir="column"
        >
          <Heading
            as="h2"
            size="lg"
            textAlign="center"
            textTransform="uppercase"
            fontWeight="semibold"
            fontSize={{ base: "14px", md: "24px" }}
            color="black"
            mb={6}
            lineHeight="130%"
          >
            The Love We Share: Sotbella’s Customer Stories
          </Heading>

          {ratingsLoading ? (
            <Box py={6}>
              <TestimonialsGridShimmer count={8} />
            </Box>
          ) : ratingsError ? (
            <Flex flex="1" align="center" justify="center" py={10}>
              <Text fontSize="sm" color="red.500">
                {ratingsErrObj?.message || "Failed to load reviews"}
              </Text>
            </Flex>
          ) : !hasRatings ? (
            <Flex
              flex="1"
              align="center"
              justify="center"
              border="1px solid"
              borderColor="blackAlpha.200"
              bg="blackAlpha.50"
              px={6}
              textAlign="center"
            >
              <Box>
                <Text
                  fontSize={{ base: "sm", md: "xl" }}
                  fontWeight="semibold"
                  textTransform="uppercase"
                  mb={2}
                >
                  Coming soon...
                </Text>
                <Text fontSize={{ base: "xs", md: "sm" }} color="blackAlpha.700">
                  We’re collecting customer stories and will publish them here shortly.
                </Text>
              </Box>
            </Flex>
          ) : (
            <Box pointerEvents={isOpen ? "none" : "auto"}>
              <Grid
                templateColumns={{ base: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }}
                gap={{ base: 2, md: 4 }}
              >
                {visibleRatings.map((item, idx) => {
                  const cardImgSrc = safeSrc(item?.media) || safeSrc(item?.icon);

                  return (
                    <Box
                      key={`rating-${item?.id}-${idx}`}
                      border="1px solid"
                      borderColor="black"
                      cursor="pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal(item);
                      }}
                      p={{ base: 2, md: 3 }}
                    >
                      <AspectRatio ratio={3 / 4} w="full">
                        <ReviewImage src={cardImgSrc} alt="testimonial" />
                      </AspectRatio>

                      <Flex justify="space-between" align="flex-start" mt={2}>
                        <Box>
                          <Text
                            fontSize={{ base: "11px", md: "14px" }}
                            fontWeight="bold"
                            textTransform="uppercase"
                            color="black"
                            lineHeight="150%"
                            mb={{ base: 0, md: "3px" }}
                            noOfLines={1}
                          >
                            {item?.authorName}
                          </Text>

                          <Text fontSize={{ base: "9px", md: "11px" }} color="blackAlpha.700" fontWeight="medium">
                            {item?.createdAtLabel}
                          </Text>
                        </Box>

                        <Stars value={item?.rating} />
                      </Flex>

                      <Text
                        fontSize={{ base: "10px", md: "12px" }}
                        fontWeight="medium"
                        color="black"
                        mt={{ base: 1, md: 2 }}
                        noOfLines={5}
                        title={item?.message}
                      >
                        {item?.message}
                      </Text>
                    </Box>
                  );
                })}
              </Grid>
              <Box ref={observerRef} h="1px" />
              {hasMore && (
                <Box py={4}>
                  <TestimonialsGridShimmer count={4} />
                </Box>
              )}
            </Box>
          )}
        </Box>

        {/* Modal */}
        <TestimonialsModal
          isOpen={isOpen}
          onClose={onClose}
          closeOnOverlay={true}
          centered
          zIndex={2000}
        >
          <Box
            display="flex"
            flexDir={{ base: "column", md: "row" }}
            w="100%"
            h={{ base: "80vh", md: "80vh" }}
            bg="white"
          >
            {/* Left image panel */}
            <Box
              w={{ base: "100%", md: "50%" }}
              h={{ base: "100%", md: "100%" }}
              bg="blackAlpha.50"
            >
              {/* ✅ Fix: don't pass empty string src */}
              {selectedImgSrc ? (
                <Image
                  src={selectedImgSrc}
                  alt="testimonial"
                  w="100%"
                  h={{ base: "50vh", md: "100%" }}
                  objectFit="cover"
                  objectPosition="top"
                />
              ) : (
                <Box
                  w="100%"
                  h="100%"
                  bg="blackAlpha.100"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize="sm" color="blackAlpha.600">
                    No image available
                  </Text>
                </Box>
              )}
            </Box>

            {/* Right content panel */}
            <Box
              w={{ base: "100%", md: "50%" }}
              h={{ base: "100%", md: "100%" }}
              display="flex"
              flexDir="column"
              justifyContent="space-between"
              px={{ base: 5, md: 8 }}
              pt={{ base: 5, md: 16 }}
              pb={{ base: 3, md: 5 }}
            >
              <Box>
                <Flex align="flex-start" justify="space-between" gap={4}>
                  <Box>
                    <Text
                      fontSize={{ base: "sm", md: "lg" }}
                      fontWeight="bold"
                      textTransform="uppercase"
                      letterSpacing="0.5px"
                      color="black"
                      lineHeight="1.2"
                    >
                      {selected?.authorName || selected?.name || "Anonymous"}
                    </Text>

                    {selected?.createdAtLabel ? (
                      <Text mt={1} fontSize={{ base: "10px", md: "xs" }} color="blackAlpha.700">
                        {selected.createdAtLabel}
                      </Text>
                    ) : null}
                  </Box>

                  <Box mt="2px">
                    {selected?.rating ? <Stars value={selected.rating} size={{ base: 3, md: 3.5 }} /> : null}
                  </Box>
                </Flex>

                <Text
                  mt={{ base: 2, md: 4 }}
                  fontSize={{ base: "xs", md: "md" }}
                  color="black"
                  lineHeight="1.8"
                >
                  {selected?.message || selected?.description}
                </Text>
              </Box>

              <Box pt={4} mt="auto">
                {selected?.productId && selected?.handle ? (
                  <Button
                    w="100%"
                    bg="black"
                    color="white"
                    fontSize={{ base: "xs", md: "sm" }}
                    fontWeight="thin"
                    borderRadius="0"
                    letterSpacing="1px"
                    textTransform="uppercase"
                    _hover={{ bg: "blackAlpha.900" }}
                    _active={{ bg: "black" }}
                    onClick={() => navigateToProduct(selected.handle, selected.productId)}
                  >
                    View Product
                  </Button>
                ) : (
                  <Button
                    w="100%"
                    h="52px"
                    bg="black"
                    color="white"
                    borderRadius="0"
                    fontWeight="medium"
                    letterSpacing="1px"
                    textTransform="uppercase"
                    _hover={{ bg: "black" }}
                    _active={{ bg: "black" }}
                    onClick={onClose}
                  >
                    Close
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        </TestimonialsModal>

        <Footer />
      </Box>
    </Fragment>
  );
};

export default Testimonials;
