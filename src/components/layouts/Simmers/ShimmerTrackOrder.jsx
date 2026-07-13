import React from "react";
import {
  Box,
  Flex,
  Stack,
  HStack,
  VStack,
  SimpleGrid,
  Skeleton,
  SkeletonCircle,
} from "@chakra-ui/react";

export const ShimmerTrackOrder = ({ isMobile }) => {
  return (
    <Box
      maxW="1200px"
      mx="auto"
      px={{ base: 4, md: 6 }}
      mt={isMobile ? "20%" : "10%"}
      textAlign="left"
    >
      {/* Top row: breadcrumb + action */}
      <Flex
        w="100%"
        mb={2}
        mt={3}
        align="center"
        justify="space-between"
      >
        <Box height="24px" width="200px" className="shimmer" />
        <Box height="24px" width="150px" className="shimmer" />
      </Flex>

      <Flex
        gap={{ base: 6, md: 8 }}
        mt={3}
        align="flex-start"
        direction={{ base: "column", lg: "row" }}
      >
        {/* Left Section */}
        <Box
          flex="1.6"
          borderWidth="1px"
          borderColor="blackAlpha.100"
          p={4}
          w="100%"
        >
          <Box height="24px" width="200px" mb={5} className="shimmer" />

          {/* Track Boxes */}
          <SimpleGrid
            columns={{ base: 2, md: 4 }}
            spacing={4}
            mt={4}
          >
            {[1, 2, 3, 4].map((i) => (
              <Box key={i} height="80px" className="shimmer" />
            ))}
          </SimpleGrid>

          {/* Shipping Address */}
          <Box mt={6}>
            <Box height="24px" width="180px" mb={4} className="shimmer" />
            <Box height="100px" width="300px" maxW="100%" className="shimmer" />
          </Box>

          {/* Order Items */}
          <Box mt={6}>
            <Box height="24px" width="150px" mb={5} className="shimmer" />
            <Stack spacing={4}>
              {[1, 2].map((i) => (
                <HStack key={i} align="flex-start" spacing={4}>
                  <Box height="100px" width="100px" className="shimmer" />
                  <Box flex="1">
                    <Box height="20px" width="80%" mb={2} className="shimmer" />
                    <Box height="20px" width="40%" className="shimmer" />
                  </Box>
                </HStack>
              ))}
            </Stack>
          </Box>

          {/* Order Summary */}
          <Box mt={6}>
            <Box height="24px" width="180px" mb={4} className="shimmer" />
            <Stack spacing={2}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Box key={i} height="30px" className="shimmer" />
              ))}
            </Stack>
          </Box>
        </Box>

        {/* Right Section - Package Tracking */}
        <Box
          flex="1"
          borderWidth="1px"
          borderColor="blackAlpha.100"
          p={4}
          w="100%"
        >
          <Box height="24px" width="180px" mb={5} className="shimmer" />

          <Stack spacing={4}>
            {[1, 2, 3].map((i) => (
              <HStack key={i} align="center" spacing={4}>
                <Box borderRadius={"full"} height={5} width={5} className="shimmer" />
                <Box flex="1">
                  <Box height="20px" width="80%" mb={2} className="shimmer" />
                  <Box height="16px" width="60%" className="shimmer" />
                </Box>
              </HStack>
            ))}
          </Stack>
        </Box>
      </Flex>
    </Box>
  );
};
