import React from "react";
import { Box, Flex, Skeleton } from "@chakra-ui/react";

export const ShimmerOrderDetails = () => {
  return (
    <Box w={{ base: "100%", lg: "66.666%" }}>
      {/* Main bordered card */}
      <Box p={4} border="1px solid" borderColor="blackAlpha.500">
        {/* Header row */}
        <Box w="full">
          <Flex
            justify="space-between"
            borderBottom="1px solid"
            borderColor="blackAlpha.200"
            pb={3}
          >
            <Flex align="center" gap={2} w="40%">
              <Box className="shimmer" display={{ base: "none", md: "block" }} boxSize="20px" />
              <Box className="shimmer" h="18px" w="140px" />
            </Flex>
            <Box className="shimmer" h="14px" w="90px" />
          </Flex>
        </Box>

        {/* Order info */}
        <Box
          mt={5}
          borderBottom="1px solid"
          borderColor="blackAlpha.200"
          pb={2}
        >
          {[1, 2, 3, 4, 5, 6].map((_, idx) => (
            <Flex justify="space-between" mb={2} key={idx} align="flex-start">
              <Box className="shimmer" h="14px" w="120px" />
              <Box className="shimmer" h="14px" w={idx === 2 ? "60%" : "140px"} />
            </Flex>
          ))}
        </Box>

        {/* Products */}
        <Box mt={3}>
          {[1, 2].map((i) => (
            <Flex
              key={i}
              justify="space-between"
              align="flex-start"
              p={2}
              mt={5}
              gap={3}
            >
              <Flex gap={3}>
                <Box className="shimmer" w="100px" h="120px" flexShrink={0} />
                <Flex direction="column" gap={2}>
                  <Box className="shimmer" h="16px" w="200px" />
                  <Box className="shimmer" h="14px" w="80px" />
                </Flex>
              </Flex>
              <Box className="shimmer" h="16px" w="80px" />
            </Flex>
          ))}
        </Box>

        {/* Totals */}
        <Box mt={3}>
          {[1, 2, 3, 4].map((i) => (
            <Flex justify="space-between" py={2} key={i}>
              <Box className="shimmer" h="14px" w="140px" />
              <Box className="shimmer" h="14px" w="80px" />
            </Flex>
          ))}

          <Box mb={2}>
            <Flex
              justify="space-between"
              align="center"
              borderBottom="1px solid"
              borderColor="blackAlpha.200"
              py={2}
            >
              <Box className="shimmer" h="14px" w="80px" />
              <Box className="shimmer" h="14px" w="80px" />
            </Flex>
          </Box>

          <Flex justify="space-between" align="center" py={2}>
            <Box className="shimmer" h="14px" w="200px" />
            <Box className="shimmer" h="14px" w="90px" />
          </Flex>
        </Box>
      </Box>

      {/* Bottom buttons */}
      <Flex gap={3} mt={3} w="full">
        <Box className="shimmer" h="45px" w="full" />
        <Box className="shimmer" h="45px" w="full" />
      </Flex>
    </Box>
  );
};

export default ShimmerOrderDetails;
