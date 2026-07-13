import { Box, Flex, Skeleton, Stack } from "@chakra-ui/react";

export const ShimmerCheckout = () => {
  return (
    <Stack spacing={{ base: 2, md: 3 }}>
      {[1].map((i) => (
        <Box
          key={i}
          borderWidth="1px"
          borderColor="blackAlpha.200"
          p={3}
          mb={{ base: 2, md: 3 }}
        >
          {/* Top row: address + radio */}
          <Flex justify="space-between" align="flex-start" mb={2}>
            {/* Address text */}
            <Box className="shimmer" h="18px" w="60%" />
            {/* Radio */}
            <Box className="shimmer" boxSize="18px" borderRadius="full" />
          </Flex>

          {/* Name */}
          <Box className="shimmer" h="14px" w="40%" mb={2} />

          {/* City, State */}
          <Box className="shimmer" h="14px" w="50%" mb={2} />

          {/* Phone + Edit */}
          <Flex justify="space-between" align="center" mt={1}>
            <Box className="shimmer" h="14px" w="50%" />
            <Box className="shimmer" h="12px" w="40px" />
          </Flex>
        </Box>
      ))}
    </Stack>
  );
};

export const ShimmerCheckoutProducts = () => {
  return (
    <Stack spacing={3} mt={6}>
      <Box className="shimmer" h="14px" w="30%" />
      {[1].map((i) => (
        <Flex key={i} gap={3} align="center">
          {/* Product Image */}
          <Box
            className="shimmer"
            w="70px"
            minW="70px"
            h="90px"
            bg="blackAlpha.50"
          />

          {/* Product Details */}
          <Box flex="1" minW={0}>
            <Box className="shimmer" h="14px" w="90%" mb={2} />
            <Box className="shimmer" h="14px" w="70%" mb={2} />

            <Box className="shimmer" h="12px" w="45%" mb={2} />

            <Box className="shimmer" h="14px" w="35%" mt="6px" />
          </Box>
        </Flex>
      ))}
    </Stack>
  );
};

export const ShimmerShippingMethods = () => {
  return (
    <Stack spacing={3}>
      {[1, 2].map((i) => (
        <Box
          key={i}
          borderWidth={{ base: "0", lg: "1px" }}
          borderColor={{ base: "transparent", lg: "blackAlpha.200" }}
          borderRadius={{ base: "0", lg: "0" }}
          p={{ base: 3, lg: 4 }}
          overflow="hidden"
        >
          <Flex align="center">
            {/* Radio */}
            <Box
              className="shimmer"
              boxSize="18px"
              borderRadius="full"
              minW="18px"
            />

            {/* Content */}
            <Box ml={3} flex="1">
              <Box
                className="shimmer"
                h="14px"
                w={{ base: "120px", lg: "140px" }}
                mb={2}
              />

              <Box
                className="shimmer"
                h="11px"
                w={{ base: "160px", lg: "200px" }}
              />
            </Box>

            {/* Price */}
            <Box ml="auto">
              <Box
                className="shimmer"
                h="14px"
                w="50px"
              />
            </Box>
          </Flex>
        </Box>
      ))}
    </Stack>
  );
};
