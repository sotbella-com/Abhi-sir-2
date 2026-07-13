import { Box, Flex, Grid, GridItem } from "@chakra-ui/react";

const ShimmerBox = ({ w = "100%", h = "14px", ...props }) => (
  <Box
    className="shimmer"
    w={w}
    h={h}
    rounded="none"
    flexShrink={0}
    {...props}
  />
);

const ReturnExchangeShimmer = () => {
  return (
    <Box py={4} mb={3} mt={{ base: 10, md: 24 }} px={{ base: 3, md: "75px" }}>
      {/* TOP DESKTOP BAR */}
      <Grid
        templateColumns={{ base: "1fr", lg: "1fr 1fr" }}
        gap={4}
        display={{ base: "none", md: "grid" }}
      >
        <GridItem>
          <Box border="1px solid" borderColor="blackAlpha.200" p={3}>
            <Flex border="1px solid" borderColor="blackAlpha.200" gap={0.5}>
              <ShimmerBox h="38px" w="50%" />
              <ShimmerBox h="38px" w="50%" />
            </Flex>
          </Box>
        </GridItem>

        <GridItem>
          <Box border="1px solid" borderColor="blackAlpha.200" p={3}>
            <Flex align="center" justify="space-between" gap={4}>
              <ShimmerBox h="18px" w="55%" />
              <ShimmerBox h="36px" w="120px" />
            </Flex>
          </Box>
        </GridItem>
      </Grid>

      {/* MAIN TWO COLUMN */}
      <Flex
        direction={{ base: "column", md: "row" }}
        gap={4}
        align="flex-start"
        w="full"
        mt={{ base: 0, md: 4 }}
      >
        {/* LEFT COLUMN */}
        <Flex direction="column" flex="1" gap={4} w="full">
          <Box border="1px solid" borderColor="blackAlpha.200" p={3}>
            <ShimmerBox h="18px" w="140px" mb={4} />

            {[1, 2].map((item) => (
              <Flex key={item} align="flex-start" justify="space-between" gap={3} p={2}>
                <Flex gap={3} align="flex-start" flex="1">
                  <ShimmerBox w="70px" h="100px" />

                  <Box flex="1">
                    <ShimmerBox h="16px" w="75%" mb={3} />
                    <ShimmerBox h="14px" w="90px" mb={2} />
                    <ShimmerBox h="14px" w="120px" mb={3} />

                    <Flex align="center" gap={2}>
                      <ShimmerBox h="14px" w="105px" />
                      <ShimmerBox h="28px" w={{ base: "150px", md: "180px" }} />
                    </Flex>
                  </Box>
                </Flex>

                <ShimmerBox w="16px" h="16px" />
              </Flex>
            ))}
          </Box>

          <Box border="1px solid" borderColor="blackAlpha.200" p={3}>
            <ShimmerBox h="18px" w="110px" mb={3} />
            <ShimmerBox h="120px" w="100%" />
          </Box>
        </Flex>

        {/* RIGHT COLUMN */}
        <Flex direction="column" flex="1" gap={4} w="full">
          <Box border="1px solid" borderColor="blackAlpha.200" p={3}>
            <ShimmerBox h="18px" w="130px" mb={4} />

            <Flex gap={3} wrap="wrap">
              {[1].map((item) => (
                <ShimmerBox key={item} w="80px" h="80px" />
              ))}
            </Flex>

            <ShimmerBox h="12px" w="130px" mt={3} />
          </Box>

          <Box border="1px solid" borderColor="blackAlpha.200" p={3}>
            <ShimmerBox h="18px" w="130px" mb={4} />

            {[1, 2, 3].map((item) => (
              <Flex key={item} justify="space-between" mb={3}>
                <ShimmerBox h="14px" w="45%" />
                <ShimmerBox h="14px" w="80px" />
              </Flex>
            ))}

            <Box borderTop="1px solid" borderColor="blackAlpha.200" my={3} />

            <Flex justify="space-between">
              <ShimmerBox h="16px" w="130px" />
              <ShimmerBox h="16px" w="90px" />
            </Flex>
          </Box>
        </Flex>
      </Flex>

      {/* MOBILE STICKY BAR SHIMMER */}
      <Box
        display={{ base: "block", md: "none" }}
        position="fixed"
        bottom="0"
        left="0"
        right="0"
        zIndex="1000"
        bg="white"
        borderTop="1px solid"
        borderColor="blackAlpha.200"
        px={3}
        py={2}
      >
        <Flex border="1px solid" borderColor="blackAlpha.200">
          <ShimmerBox h="36px" w="50%" />
          <ShimmerBox h="36px" w="50%" />
        </Flex>

        <ShimmerBox h="36px" w="100%" mt={2} />
        <ShimmerBox h="12px" w="70%" mt={2} />
      </Box>
    </Box>
  );
};

export default ReturnExchangeShimmer;