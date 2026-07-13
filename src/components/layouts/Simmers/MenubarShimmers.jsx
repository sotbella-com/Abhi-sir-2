import { Box, Flex, HStack, VStack } from "@chakra-ui/react";

export const SidebarShimmer = () => (
  <VStack align="flex-start" spacing="1vw">
    {Array.from({ length: 7 }).map((_, i) => (
      <Box key={i} width="80%" height="1.2vw" className="shimmer" />
    ))}
  </VStack>
);

export const ContentShimmer = () => (
  <Flex w="78%" bg="#eae9e3" p="2vw" gap="1.5vw" overflow="hidden">
    <Box flex="1">
      <Box width="60%" height="1.3vw" borderRadius="0" mb="1.3vw" className="shimmer" />
      <VStack align="flex-start" spacing="1vw" mt="1vw">
        {Array.from({ length: 5 }).map((_, i) => (
          <Box key={i} width="70%" height="0.9vw" className="shimmer" />
        ))}
      </VStack>
    </Box>
    {Array.from({ length: 3 }).map((_, i) => (
      <Box key={i} flex="1">
        <Box width="100%" height="1vw" mb="10px" className="shimmer" />
        <Box width="100%" height="22vw" className="shimmer" />
      </Box>
    ))}
  </Flex>
);


/* ---------- 1) MOBILE ROOT LIST SHIMMER ---------- */
export const MobileRootMenuShimmer = () => (
  <Box w="100%" h="100vh" bg="#FBF6F0">
    {/* list rows */}
    <VStack align="stretch" spacing={0}>
      {Array.from({ length: 10 }).map((_, i) => (
        <Flex
          key={i}
          align="center"
          justify="space-between"
          p="4"
          borderBottom="1px solid"
          borderColor="#EFE9E0"
        >
          <Box w="40%" h="12px" className="shimmer" />
          <Box w="16px" h="16px" br="4px" className="shimmer" />
        </Flex>
      ))}
    </VStack>
  </Box>
);

/* ---------- 2) MOBILE CATEGORY PANEL SHIMMER ---------- */
export const MobileCategoryPanelShimmer = () => (
  <Box w="100%" h="auto" bg="#FBF6F0">
    {/* sticky header */}
    <Flex
      h="48px"
      align="center"
      justify="space-between"
      px="4"
      borderBottom="1px solid"
      borderColor="#E8E2D9"
      bg="white"
      pos="sticky"
      top="0"
      zIndex={10}
    >
      <Box w="16px" h="16px" br="4px" className="shimmer" />
      <Box w="120px" h="12px" className="shimmer" />
      <Box w="16px" h="16px" br="4px" className="shimmer" />
    </Flex>

    {/* section heading underline */}
    <Box px="4" pt="3" pb="2">
      <Box w="90%" mx="auto" borderBottom="1px solid #E8E2D9" pb="6px">
        <Box w="110px" h="10px" className="shimmer" />
      </Box>
    </Box>

    {/* image strip (horizontal scroll) */}
    <Box px="4" py="3">
      <HStack gap="3" overflowX="auto" pb="2" sx={{ "&::-webkit-scrollbar": { display: "none" } }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Box key={i} minW="136px">
            <Box w="80px" h="10px" mb="8px" className="shimmer" />
            <Box w="136px" h="170px" br="6px" className="shimmer" />
          </Box>
        ))}
      </HStack>
    </Box>

    {/* subcategory list rows */}
    <VStack align="stretch" spacing={0} px="4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Flex
          key={i}
          align="center"
          justify="space-between"
          py="3.5"
          borderBottom="1px solid"
          borderColor="#EFE9E0"
        >
          <Box w="50%" h="12px" className="shimmer" />
          <Box w="12px" h="12px" br="3px" className="shimmer" />
        </Flex>
      ))}
    </VStack>
  </Box>
);