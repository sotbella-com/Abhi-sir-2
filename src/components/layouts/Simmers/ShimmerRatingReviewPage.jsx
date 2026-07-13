import React from "react";
import { Box, Flex, HStack, Divider } from "@chakra-ui/react";

const ShimmerBlock = ({ h, w = "100%", radius = 0 }) => (
  <Box
    className="shimmer"
    height={h}
    width={w}
    borderRadius={radius}
  />
);

const ShimmerRatingReviewPage = () => {
  return (
    <Box
      w="100%"
      maxW="860px"
      mx="auto"
      bg="white"
      py={10}
      px={5}
      mt={10}
    >
      {/* ===== Title ===== */}
      <Flex justify="center" mb={6}>
        <Box className="shimmer shimmer-bar" w="220px" />
      </Flex>

      {/* ===== Product Row ===== */}
      <Flex align="flex-start" justify="space-between" gap={3} mb={6}>
        <HStack spacing={4} align="flex-start">
          {/* product image */}
          <ShimmerBlock h="120px" w="90px" />

          <Box>
            {/* product name */}
            <Box className="shimmer shimmer-bar" w="260px" mb={3} />

            {/* stars */}
            <HStack spacing={1}>
              {[1, 2, 3, 4, 5].map((i) => (
                <ShimmerBlock key={i} h="16px" w="16px" />
              ))}
            </HStack>
          </Box>
        </HStack>

        {/* checkbox */}
        <ShimmerBlock h="16px" w="16px" />
      </Flex>

      {/* ===== Review textarea ===== */}
      <Box
        border="1px solid"
        borderColor="blackAlpha.300"
        p={3}
        mb={5}
      >
        <Box className="shimmer shimmer-bar" mb={2} />
        <Box className="shimmer shimmer-bar" mb={2} />
        <Box className="shimmer shimmer-bar" w="80%" />
      </Box>

      {/* ===== Upload image block ===== */}
      <Box bg="#F5F5F5" px={4} py={3} mb={6}>
        <Box className="shimmer shimmer-bar--sm" w="120px" mb={3} />
        <HStack spacing={5} align="center">
          <ShimmerBlock h="120px" w="90px" />
          <ShimmerBlock h="32px" w="50px" radius="999px" />
        </HStack>
      </Box>

      <Divider borderColor="transparent" />

      {/* ===== Buttons ===== */}
      <Flex gap={4} mt={4}>
        <ShimmerBlock h="45px" />
        <ShimmerBlock h="45px" />
      </Flex>
    </Box>
  );
};

export default ShimmerRatingReviewPage;