import React from "react";
import {
  Box,
  Flex,
  SimpleGrid,
  Divider,
} from "@chakra-ui/react";

export const ShimmerThankyouPage = () => (
  <Box maxW="full" mx="auto" mt={20} px={{ base: "12px", md: "50px" }} textAlign="left">
    <Flex wrap="wrap" gap={8}>
      {/* Left Column - Order Details */}
      <Box w={{ base: "100%", md: "50%" }}>
        {/* Header Section */}
        <Flex align="flex-start" mb={4}>
          <Box mr={3}>
            <Box height={10} width={10} className="shimmer" />
          </Box>
          <Box flex="1">
            <Box w="200px" h="20px" mb={2} className="shimmer" />
            <Box w="150px" h="16px" className="shimmer" />
          </Box>
        </Flex>

        {/* Order Info Section */}
        <Box borderY="1px" borderColor="blackAlpha.200" py={4} color="black">
          <Box w="100%" h="16px" mb={2} className="shimmer" />
          <Box w="100%" h="16px" mb={2} className="shimmer" />
          <Box w="100%" h="16px" className="shimmer" />
        </Box>

        {/* Shipping Address Section */}
        <Box mt={3} mb={2}>
          <Box w="120px" h="16px" className="shimmer" />
        </Box>
        <Box border="1px" borderColor="blackAlpha.200" p={3}>
          <Box>
            <Flex justify="space-between" mb={2}>
              <Box w="150px" h="16px" className="shimmer" />
            </Flex>
            <Flex justify="space-between" mb={2}>
              <Box w="100%" h="16px" className="shimmer" />
            </Flex>
            <Flex justify="space-between" mb={2}>
              <Box w="100%" h="16px" className="shimmer" />
            </Flex>
            <Flex justify="space-between">
              <Box w="100%" h="16px" className="shimmer" />
            </Flex>
          </Box>
        </Box>

        {/* Order Items Section */}
        <Box mt={5}>
          <Box w="100px" h="16px" mb={5} className="shimmer" />

          {[1, 2].map((i) => (
            <Flex key={i} align="flex-start" mb={4}>
              <Box w="80px" mr={4}>
                <Box w="80px" h="80px" className="shimmer" />
              </Box>
              <Box flex="1">
                <Flex align="center" justify="space-between" mb={2}>
                  <Box w="60%" h="18px" className="shimmer" />
                  <Box w="60px" h="18px" className="shimmer" />
                </Flex>
                <Box w="80%" h="12px" className="shimmer" />
              </Box>
            </Flex>
          ))}
        </Box>

        {/* Return Policy */}
        <Flex align="center" gap={3}>
          <Box w="20px" h="20px" className="shimmer" />
          <Box w="250px" h="16px" className="shimmer" />
        </Flex>
      </Box>

      {/* Right Column - Pricing Section */}
      <Box w={{ base: "100%", md: "41.666%" }} ml={{ md: "auto" }}>
        <Box border="1px" borderColor="blackAlpha.200" p={4} mt={0}>
          <Box w="120px" h="18px" mb={5} className="shimmer" />

          {/* Price Details */}
          <Box>
            {[1, 2, 3, 4, 5].map((i) => (
              <Flex key={i} align="center" justify="space-between" mb={3}>
                <Box w="80px" h="16px" className="shimmer" />
                <Box w="60px" h="16px" className="shimmer" />
              </Flex>
            ))}
          </Box>

          {/* Grand Total */}
          <Divider mt={3} />
          <Box pt={2}>
            <Flex align="center" justify="space-between">
              <Box w="100px" h="18px" className="shimmer" />
              <Box w="80px" h="18px" className="shimmer" />
            </Flex>
          </Box>
        </Box>

        {/* Action Buttons */}
        <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4} mt={4}>
          <Box h="45px" w="100%" className="shimmer" />
          <Box h="45px" w="100%" className="shimmer" />
        </SimpleGrid>
      </Box>
    </Flex>
  </Box>
);
