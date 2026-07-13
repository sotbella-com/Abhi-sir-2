import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Flex,
} from "@chakra-ui/react";

export const ShimmerOrdersTable = () => (
  <>
    {/* MOBILE VIEW */}
    <Box display={{ base: "block", md: "none" }} mt={4}>
      {[1, 2, 3, 4].map((item) => (
        <Box
          key={item}
          mb={4}
          border="1px solid"
          borderColor="gray.200"
          bg="white"
          overflow="hidden"
        >
          {/* Header */}
          <Flex
            justify="space-between"
            align="center"
            p={3}
            borderBottom="1px solid"
            borderColor="gray.100"
          >
            <Box className="shimmer" h="14px" w="120px" />
            <Box className="shimmer" h="14px" w="60px" />
          </Flex>

          {/* Subheader */}
          <Flex justify="space-between" px={3} py={2}>
            <Box className="shimmer" h="12px" w="80px" />
            <Box className="shimmer" h="12px" w="70px" />
          </Flex>

          {/* Body */}
          <Flex p={3} gap={4}>
            {/* Image */}
            <Box
              className="shimmer"
              w="80px"
              h="100px"
              flexShrink={0}
            />

            {/* Details */}
            <Box flex="1">
              <Box className="shimmer" h="14px" w="100%" mb={2} />
              <Box className="shimmer" h="14px" w="80%" mb={2} />
              <Box className="shimmer" h="12px" w="60%" />
            </Box>

            {/* Arrow */}
            <Box className="shimmer" h="20px" w="20px" mt={2} />
          </Flex>
        </Box>
      ))}
    </Box>

    {/* DESKTOP VIEW */}
    <Box display={{ base: "none", md: "block" }} overflowX="auto" mt={5}>
      <Table minW="full" sx={{ borderCollapse: "collapse" }}>
        <Thead>
          <Tr>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Th key={i} px={4} py={2}>
                <Box className="shimmer" h="14px" w="70px" />
              </Th>
            ))}
          </Tr>
        </Thead>

        <Tbody>
          {[1, 2, 3, 4, 5].map((item) => (
            <Tr
              key={item}
              borderBottom="1px solid"
              borderColor="gray.200"
            >
              <Td px={4} py={3}>
                <Box className="shimmer" w="30px" h="16px" />
              </Td>

              <Td px={4} py={3}>
                <Box className="shimmer" w="80px" h="16px" />
              </Td>

              <Td px={4} py={3}>
                <Box className="shimmer" w="100px" h="16px" />
              </Td>

              <Td px={4} py={3}>
                <Box className="shimmer" w="120px" h="16px" />
              </Td>

              <Td px={4} py={3}>
                <Box className="shimmer" w="80px" h="24px" />
              </Td>

              <Td px={4} py={3}>
                <Box className="shimmer" w="70px" h="16px" />
              </Td>

              <Td px={4} py={3}>
                <Box className="shimmer" w="40px" h="16px" />
              </Td>

              <Td px={4} py={3}>
                <Box className="shimmer" w="60px" h="32px" />
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  </>
);