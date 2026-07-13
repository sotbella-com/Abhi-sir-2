import { Box, Flex } from "@chakra-ui/react";

export const ShimmerProducts = ({ count = 4 }) => (
  <Flex wrap="wrap" minH="100vh" w="full">
    {Array.from({ length: count }).map((_, i) => (
      <Box key={i} w={{ base: "100%", md: "50%" }} mb={4}>
        <Box
          className="shimmer" // keep shimmer animation from your CSS
          h="600px"
          m="0.5"
        />
      </Box>
    ))}
  </Flex>
);
