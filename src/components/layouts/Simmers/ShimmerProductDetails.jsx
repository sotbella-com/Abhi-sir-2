import React from "react";
import {
  Box,
  Container,
  Grid,
  GridItem,
  VStack,
  HStack,
  Wrap,
  WrapItem,
  SimpleGrid,
} from "@chakra-ui/react";

/** Single shimmer block */
const Sh = ({ w = "100%", h = "16px", radius = "0", ...rest }) => (
  <Box w={w} h={h} borderRadius={radius} overflow="hidden" {...rest}>
    <Box className="shimmer" w="100%" h="100%" />
  </Box>
);

/** AspectRatio-like shimmer block (ratio 3/4) */
const ShRatio34 = ({ w = "100%", h = "auto", ...rest }) => (
  <Box w={w} h={h} position="relative" {...rest}>
    {/* ratio box */}
    <Box w="100%" pt="133.3333%" position="relative">
      <Box position="absolute" inset={0}>
        <Sh w="100%" h="100%" />
      </Box>
    </Box>
  </Box>
);

export const ShimmerProductDetails = () => {
  return (
    <Box>
      {/* Breadcrumb */}
      <Container
        maxW="full"
        px={{ base: "12px", lg: "50px" }}
        pt={2}
        fontSize={{ base: "8px", lg: "xs" }}
      >
        <HStack spacing="10px" align="center">
          <Sh w="40px" h="12px" />
          <Sh w="10px" h="10px" />
          <Sh w="70px" h="12px" />
          <Sh w="10px" h="10px" />
          <Sh w={{ base: "150px", lg: "260px" }} h="12px" />
        </HStack>
      </Container>

      {/* Main */}
      <Container
        maxW="full"
        px={{ base: "12px", lg: "50px" }}
        py={{ base: 2, lg: 6 }}
      >
        <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={{ base: 0, lg: 5 }}>
          {/* LEFT: images */}
          <GridItem id="product-img">
            <VStack align="stretch" gap={0}>
              {/* DESKTOP/TABLET: thumbs + main */}
              <Grid
                templateColumns={{ base: "1fr", lg: "120px 1fr" }}
                gap={{ base: 0, lg: 3 }}
                display={{ base: "none", lg: "grid" }}
                alignItems="start"
                h={{ lg: "150vh" }}
              >
                {/* Thumbs */}
                <Box
                  h="100%"
                  overflowY="auto"
                  className="scrollbar-hide"
                  pr="6px"
                  sx={{
                    "&::-webkit-scrollbar": { width: "4px" },
                    "&::-webkit-scrollbar-thumb": { background: "rgba(0,0,0,0.25)" },
                    "&::-webkit-scrollbar-track": { background: "transparent" },
                  }}
                >
                  <VStack spacing={2} align="stretch">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <Box key={i} border="1px solid" borderColor="transparent" p="2px">
                        {/* mimic thumb AspectRatio */}
                        <ShRatio34 />
                      </Box>
                    ))}
                  </VStack>
                </Box>

                {/* Main image */}
                <Box position="relative">
                  {/* mimic AspectRatio ratio 3/4 + h=150vh */}
                  <Box w="full" h="150vh">
                    <Sh w="100%" h="100%" />
                  </Box>

                  {/* Prev / Next overlay */}
                  <Sh
                    w="30px"
                    h="30px"
                    radius="999px"
                    position="absolute"
                    left="12px"
                    top="50%"
                    transform="translateY(-50%)"
                  />
                  <Sh
                    w="30px"
                    h="30px"
                    radius="999px"
                    position="absolute"
                    right="12px"
                    top="50%"
                    transform="translateY(-50%)"
                  />
                </Box>
              </Grid>

              {/* MOBILE */}
              <Box display={{ base: "block", lg: "none" }}>
                {/* Main image */}
                <Box position="relative">
                  <ShRatio34 />
                  {/* Dots */}
                  <HStack
                    pos="absolute"
                    bottom="14px"
                    left="50%"
                    transform="translateX(-50%)"
                    gap="8px"
                  >
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Sh key={i} w={i === 0 ? "18px" : "8px"} h="8px" radius="999px" />
                    ))}
                  </HStack>
                </Box>

                {/* Thumbs strip */}
                <HStack spacing="1px" overflow="hidden" mt="1px">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Box key={i} flexShrink={0} w="25%">
                      <ShRatio34 />
                    </Box>
                  ))}
                </HStack>
              </Box>
            </VStack>
          </GridItem>

          {/* RIGHT: info (MATCH PDP sticky + scroll) */}
          <GridItem
            h={{ base: "auto", lg: "150vh" }}
            overflowY={{ base: "visible", lg: "auto" }}
            className="scrollbar-hide"
            position="sticky"
            top="0"
          >
            <VStack align="stretch">
              {/* Title row with rating pill on right */}
              <Box>
                <HStack align="flex-start" w="full">
                  <Box flex="1" pr={2} mt={{ base: 4, lg: 0 }}>
                    <Sh w="85%" h="18px" />
                  </Box>
                  <Box mt={{ base: 4, lg: 0 }}>
                    <Sh w="58px" h="26px" />
                  </Box>
                </HStack>
              </Box>

              {/* Price row */}
              <HStack align="center" justify="space-between" mt={2}>
                <HStack align="center" spacing={2}>
                  <Sh w="90px" h="16px" />
                </HStack>
              </HStack>

              {/* taxes */}
              <Sh w="170px" h="12px" mt={1} />

              {/* SIZE */}
              <Box mt={4}>
                <HStack justify="space-between" mb={1}>
                  <Sh w="40px" h="14px" />
                  <Sh w="24px" h="24px" borderRadius="50%" />
                </HStack>

                <Wrap spacing={2}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <WrapItem key={i}>
                      <Sh w="50px" h="29px" />
                    </WrapItem>
                  ))}
                </Wrap>

                <Sh w="90px" h="10px" mt={2} />
              </Box>

              {/* COLOR */}
              <Box mt={2}>
                <Sh w="45px" h="14px" mb={2} />
                <Wrap>
                  {Array.from({ length: 1 }).map((_, i) => (
                    <WrapItem key={i}>
                      <VStack align="flex-start" spacing={1}>
                        <Sh w="30px" h="30px" radius="999px" />
                        <Sh w="40px" h="10px" />
                      </VStack>
                    </WrapItem>
                  ))}
                </Wrap>
              </Box>

              {/* MATERIAL */}
              <Box mt={2} mb={{ base: 3, lg: 6 }}>
                <Sh w="70px" h="14px" mb={2} />
                <Wrap>
                  {Array.from({ length: 1 }).map((_, i) => (
                    <WrapItem key={i}>
                      <Sh w="90px" h="32px" />
                    </WrapItem>
                  ))}
                </Wrap>
              </Box>

              {/* Qty + Add + Wishlist */}
              <HStack align="center" spacing={2}>
                <Sh w="100px" h="45px" />
                <Sh w="100%" h="45px" />
                <Sh w="48px" h="45px" />
              </HStack>

              {/* Buy Now */}
              <Sh w="100%" h="45px" />

              {/* Free shipping text */}
              <Sh w="260px" h="12px" mx="auto" mt={2} />

              {/* Offers box (only if promos exist on real PDP; skeleton keeps space to avoid jump) */}
              <Sh w="100%" h="90px" mt={3} />

              {/* Easy return row */}
              <HStack spacing={5} justify="center" mt={2}>
                <Sh w="160px" h="12px" />
                <Sh w="140px" h="12px" />
              </HStack>

              {/* Divider + tagline */}
              <Box my={5} borderTop="1px solid" borderColor="blackAlpha.200" />
              <Sh w="90%" h="12px" mx="auto" />
              <Box mt={5} mb={{ lg: 10 }} />

              {/* Accordion blocks (match your actual UI instead of tabs) */}
              <Box>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Box
                    key={i}
                    borderBottom="1px solid"
                    borderColor="blackAlpha.200"
                  >
                    <HStack px={0} py={4} justify="space-between">
                      <Sh w="150px" h="12px" />
                      <Sh w="10px" h="10px" />
                    </HStack>
                    {/* collapsed by default: no panel content */}
                  </Box>
                ))}
              </Box>
            </VStack>
          </GridItem>
        </Grid>

        {/* Reviews + Similar Products placeholders (same placement as PDP bottom) */}
        <Box w={{ base: "100%", lg: "60%" }} mt={{ base: 8, lg: 14 }}>
          <HStack spacing={3} align="center" mb={3}>
            <Sh w="58px" h="26px" />
            <Sh w="200px" h="12px" />
          </HStack>

          <Sh w="100%" h="60px" />
          <Sh w="180px" h="12px" mt="8px" />
        </Box>

        {/* CustomerReviewsStrip area */}
        <Box mt={8}>
          <HStack spacing={3} overflow="hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <Sh key={i} w="280px" h="120px" />
            ))}
          </HStack>
        </Box>

        {/* SimilarProducts area */}
        <Box mt={8}>
          <Sh w="220px" h="14px" mb={4} />
          <SimpleGrid columns={{ base: 2, lg: 4 }} spacing={3}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Box key={i}>
                <Sh h={{ base: "220px", lg: "280px" }} mb={2} />
                <Sh w="85%" h="12px" mb={2} />
                <Sh w="60%" h="12px" />
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      </Container>
    </Box>
  );
};

export default ShimmerProductDetails;
