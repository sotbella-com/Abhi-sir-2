import React from "react";
import { Box, Flex } from "@chakra-ui/react";

export const ContactCardShimmer = () => {
  return (
    <Box
      w="full"
      border="1px solid"
      borderColor="blackAlpha.200"
      px={4}
      py={3}
    >
      <Flex align="start" justify="space-between" gap={4}>
        {/* LEFT: icon + title */}
        <Flex direction="column" align="flex-start" gap={2} flexShrink={0} w="40%">
          <Box
            w="50px"
            h="50px"
            border="1px solid"
            borderColor="blackAlpha.200"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Box className="shimmer" w="40px" h="40px" />
          </Box>

          <Box className="shimmer" h="14px" w="85%" />
        </Flex>

        {/* RIGHT: link + description */}
        <Flex direction="column" align="flex-start" textAlign="left" flex="1">

          {/* description placeholder */}
          <Box mt={2} w="full">
            <Box className="shimmer" h="10px" w="100%" mb={2} />
            <Box className="shimmer" h="10px" w="90%" />
          </Box>
        </Flex>
      </Flex>
    </Box>
  );
};
