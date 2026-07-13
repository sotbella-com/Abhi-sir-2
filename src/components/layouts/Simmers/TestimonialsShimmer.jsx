import { AspectRatio, Box, Flex, Grid, HStack } from "@chakra-ui/react";

export const TestimonialCardShimmer = () => {
  return (
    <Box
      border="1px solid"
      borderColor="blackAlpha.200"
      p={{ base: 2, md: 3 }}
      bg="white"
    >
      {/* Image shimmer (same as real card) */}
      <AspectRatio ratio={3 / 4} w="full">
        <Box className="shimmer" w="100%" h="100%" />
      </AspectRatio>

      <Flex justify="space-between" align="flex-start" mt={2}>
        {/* Name + date */}
        <Box w="70%">
          <Box className="shimmer" h="14px" w="90%" mb={2} borderRadius="2px" />
          <Box className="shimmer" h="10px" w="55%" borderRadius="2px" />
        </Box>

        {/* Stars */}
        <HStack spacing="2px">
          {Array.from({ length: 5 }).map((_, i) => (
            <Box
              key={i}
              className="shimmer"
              boxSize={{ base: 3, md: 3.5 }}
              borderRadius="2px"
            />
          ))}
        </HStack>
      </Flex>

      {/* Message lines */}
      <Box mt={2}>
        <Box className="shimmer" h="11px" w="100%" mb={1.5} borderRadius="2px" />
        <Box className="shimmer" h="11px" w="90%" mb={1.5} borderRadius="2px" />
        <Box className="shimmer" h="11px" w="70%" borderRadius="2px" />
      </Box>
    </Box>
  );
};

export const TestimonialsGridShimmer = ({ count = 8 }) => {
  return (
    <Grid
      templateColumns={{ base: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }}
      gap={{ base: 2, md: 4 }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <TestimonialCardShimmer key={i} />
      ))}
    </Grid>
  );
};
