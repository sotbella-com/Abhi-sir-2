import React, { useEffect, useState } from "react";
import { StarIcon } from "@chakra-ui/icons";
import {
  Box,
  SimpleGrid,
  AspectRatio,
  Image,
  Text,
  HStack,
  Flex,
  useBreakpointValue,
  Center,
} from "@chakra-ui/react";
import { getProductReviews } from "@/api/services/review";
import SeeReviewModal from "./SeeReviewModal";

export const CustomerReviewsStrip = ({ currentProduct, onReviewsLoaded }) => {
  const [reviews, setReviews] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [isSeeReviewOpen, setIsSeeReviewOpen] = useState(false);
  const [activeReview, setActiveReview] = useState(null);

  const openReview = (review) => {
    setActiveReview(review);
    setIsSeeReviewOpen(true);
  };

  const closeReview = () => {
    setIsSeeReviewOpen(false);
    setActiveReview(null);
  };


  const cardsToShow = useBreakpointValue({ base: 2, md: 3, lg: 4 });

  useEffect(() => {
    const loadReviews = async () => {
      if (!currentProduct?.id) return;

      try {

        const data = await getProductReviews(currentProduct.id);


        const list = Array.isArray(data?.reviews) ? data.reviews : [];

        // Check for media presence helper
        const hasMedia = (r) => (r?.mediaUrls?.length > 0) || (r?.mediaAssets?.length > 0);

        // Sort: Reviews with images first
        list.sort((a, b) => {
          const aHas = hasMedia(a);
          const bHas = hasMedia(b);
          if (aHas && !bHas) return -1;
          if (!aHas && bHas) return 1;
          return 0;
        });

        setReviews(list);
        onReviewsLoaded?.({
          reviews: list,
          averageRating: data?.averageRating || 0,
          totalReviews: data?.totalReviews || 0
        });
      } catch (e) {
        setReviews([]);
        onReviewsLoaded?.({ reviews: [], averageRating: 0, totalReviews: 0 });
      }
    };

    loadReviews();
  }, [currentProduct?.id]); // eslint-disable-line

  // ✅ If no reviews => don't show "WHY COSTUMERS LOVE US"
  if (!reviews?.length) return null;

  const visibleReviews = showAll ? reviews : reviews.slice(0, cardsToShow);

  const getName = (r) =>
    (r?.authorName ||
      r?.customerName ||
      r?.reviewerName ||
      r?.title ||
      "Anonymous")
      .toString()
      .toUpperCase();

  const getText = (r) => r?.text || r?.review || r?.comment || "";

  const getDate = (r) => {
    const d = r?.createdAt ? new Date(r.createdAt) : null;
    return d && !isNaN(d) ? d.toLocaleDateString("en-GB") : "";
  };

  const getRating = (r) => {
    const n = Number(r?.rating ?? 0);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(5, Math.round(n)));
  };

  return (
    <>
      <Box mt={6}>
        {/* Heading row (Figma) */}
        <Flex justify="space-between" align="center" mb={4}>
          <Text fontSize="lg" fontWeight="500" letterSpacing="wide">
            WHY CUSTOMERS LOVE US
          </Text>

          <Text
            fontSize="xs"
            textTransform="uppercase"
            cursor="pointer"
            _hover={{ textDecoration: "underline" }}
            onClick={() => setShowAll((p) => !p)}
          >
            {showAll ? "SEE LESS" : "SEE MORE"}
          </Text>
        </Flex>

        {/* Cards */}
        <SimpleGrid columns={{ base: 2, md: 4, lg: 5 }} spacing={4}>
          {visibleReviews.map((r, idx) => {
            const rating = getRating(r);
            // const media = r?.mediaUrls?.[0] || currentProduct?.images?.[0]?.src || currentProduct?.image || "";
            // Use review image ONLY, no fallback to product image
            const media = r?.mediaUrls?.[0];

            return (
              <Box key={r?.id || idx}
                border="1px"
                borderColor="black"
                bg="white"
                cursor="pointer"
                onClick={() => openReview(r)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") openReview(r);
                }}
              >
                {/* Content Area */}
                <Box p={3} h="full">
                  {media ? (
                    // Layout WITH Image: Side-by-side
                    <Flex align="flex-start" mb={2}>
                      <Image
                        src={media}
                        alt={getName(r)}
                        boxSize="60px"
                        objectFit="cover"
                        borderRadius="md"
                        mr={3}
                        draggable={false}
                      />
                      <Box flex="1">
                        <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="600" noOfLines={1} lineHeight="1.2">
                          {getName(r)}
                        </Text>
                        <HStack spacing={0.5} my={0.5}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <StarIcon
                              key={i}
                              boxSize={{ base: 2, md: 2.5 }}
                              color={i < rating ? "black" : "blackAlpha.300"}
                            />
                          ))}
                        </HStack>
                        <Text fontSize={{ base: "9px", md: "xs" }} color="blackAlpha.600">
                          {getDate(r)}
                        </Text>
                      </Box>
                    </Flex>
                  ) : (
                    // Layout WITHOUT Image: Stacked
                    <Box mb={2}>
                      <Flex justify="space-between" align="center">
                        <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="600" noOfLines={1}>
                          {getName(r)}
                        </Text>
                        <HStack spacing={0.5}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <StarIcon
                              key={i}
                              boxSize={{ base: 2.5, md: 3 }}
                              color={i < rating ? "black" : "blackAlpha.300"}
                            />
                          ))}
                        </HStack>
                      </Flex>
                      <Text fontSize={{ base: "9px", md: "xs" }} mt={1} color="blackAlpha.600">
                        {getDate(r)}
                      </Text>
                    </Box>
                  )}

                  {/* Review Text */}
                  <Text fontSize={{ base: "11px", md: "sm" }} noOfLines={4}>
                    {getText(r)}
                  </Text>
                </Box>
              </Box>
            );
          })}
        </SimpleGrid>
      </Box>
      <SeeReviewModal
        isOpen={isSeeReviewOpen}
        onClose={closeReview}
        review={activeReview}
        product={currentProduct}
      />
    </>
  );
};
