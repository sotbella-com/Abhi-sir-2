import React from "react";
import { Box, Flex } from "@chakra-ui/react";

export const ShimmerWallet = ({ rows = 4 }) => {
  return (
    <Box>
      {Array.from({ length: rows }).map((_, idx) => (
        <Flex
          key={idx}
          justify="space-between"
          wrap="wrap"
          borderBottom="1px solid"
          borderColor={idx === rows - 1 ? "transparent" : "blackAlpha.200"}
          pb={idx === rows - 1 ? 0 : 4}
          mb={idx === rows - 1 ? 0 : 4}
        >
          <Box w={{ base: "100%", sm: "75%" }}>
            <Flex align="center" gap={2} mb={2} flexWrap="wrap">
              <Box className="shimmer" height="14px" width="180px" />
              <Box className="shimmer" height="14px" width="10px" />
              <Box className="shimmer" height="14px" width="140px" />
            </Flex>

            <Box className="shimmer" height="14px" width="260px" mb={2} />

            <Flex align="center" gap={2}>
              <Box className="shimmer" height="12px" width="40px" />
              <Box className="shimmer" height="12px" width="160px" />
            </Flex>
          </Box>

          <Box
            w={{ base: "100%", sm: "25%" }}
            textAlign="right"
            mt={{ base: 2, sm: 0 }}
          >
            <Box className="shimmer" height="18px" width="120px" ml="auto" />
          </Box>
        </Flex>
      ))}
    </Box>
  );
};

export default ShimmerWallet;
