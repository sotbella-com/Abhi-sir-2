import React from "react";
import { Box, Grid, AspectRatio, Skeleton, SkeletonText, IconButton } from "@chakra-ui/react";

export default function ShimmerGridProducts({
  count = 8,                        // how many cards to show
  showWishlistDot = true,           // top-right dot where the heart sits
}) {
  // Build an array of placeholders
  const items = Array.from({ length: count });

  return (
    <Box>
      <Grid
        templateColumns={{
          base: "repeat(2, 1fr)",
          md: "repeat(3, 1fr)",
          lg: "repeat(4, 1fr)",
        }}
        gap={{ base: 0, md: 0 }}
      >
        {items.map((_, i) => (
          <Box
            key={i}
            position="relative"
            w="full"
            border="1px"
            borderColor="white"
            borderRadius="0"
            overflow="hidden"
            bg="white"
          >
            {/* Image area skeleton (3:4 like your cards) */}
            <AspectRatio ratio={3 / 4} w="full">
              <Box className="shimmer" />
            </AspectRatio>

            {/* Text (title + price) */}
            <Box py={3} px={1}>
             <Box className="shimmer" h="12px" w="80%" mb="6px" />
              <Box className="shimmer" h="12px" w="60%" />
            </Box>
          </Box>
        ))}
      </Grid>
    </Box>
  );
}
