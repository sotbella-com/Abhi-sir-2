import { Box, Grid, GridItem } from "@chakra-ui/react";

export const UspShimmer = () => (
  <Box
    w="full"
    py={{ base: "6vw", lg: "5vw", xl: "3vw" }}
    px={{ base: "2vw", lg: "4vw", xl: "4vw" }}
  >
    <Grid
      templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }}
      gap={{ base: "10px", lg: 6, xl: 6 }}
      alignItems="stretch"
      autoRows="1fr"
    >
      {[1, 2, 3, 4].map((i) => (
        <GridItem key={i} display="flex">
          <Box
            bg="#fafafa"
            border="1px solid"
            borderColor="#f0f0f0"
            rounded="1vw"
            px={{ base: "2vw", md: "1vw" }}
            py={{ base: "2vw", md: "2vw" }}
            h="100%"
            display="flex"
            flexDir="column"
            w="100%"
          >
            <Box w="48px" h="48px" className="shimmer" mb="0.5vw" />
            <Box w="80%" h="1.2vw" className="shimmer" mb="5px" />
            <Box w="100%" h="0.9vw" className="shimmer" />
            <Box w="90%" h="0.9vw" className="shimmer" mt="2px" />
          </Box>
        </GridItem>
      ))}
    </Grid>
  </Box>
);