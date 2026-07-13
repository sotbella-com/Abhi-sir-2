import React from "react";
import { Box, Flex, SimpleGrid } from "@chakra-ui/react";
import "@/css/Shimmer.css"; // Ensure shimmer CSS is imported if not global

const ShimmerLines = ({ lines = 3, height = "14px", mb = 3 }) => (
    <Box>
        {Array.from({ length: lines }).map((_, i) => (
            <Box
                key={i}
                className="shimmer"
                h={height}
                w="100%"
                mb={mb}
            />
        ))}
    </Box>
);

const SizeGuideShimmer = () => {
    return (
        <Box>
            {/* Title Shimmer */}
            <Box className="shimmer" h="32px" w="200px" mb={2} />

            {/* Sub-heading Shimmer */}
            <ShimmerLines lines={2} height="14px" mb={2} />

            {/* Toolbar Shimmer (Buttons) */}
            <Flex justify="space-between" align="center" mt={10} mb={3} gap={3}>
                <Flex gap={2}>
                    <Box className="shimmer" h="32px" w="60px" />
                    <Box className="shimmer" h="32px" w="60px" />
                </Flex>
                <Box className="shimmer" h="32px" w="150px" />
            </Flex>

            {/* Table Shimmer */}
            <Box overflowX="auto" mt={4} border="1px solid" borderColor="gray.100" p={2}>
                <SimpleGrid columns={7} spacing={2} minW="600px">
                    {/* Header Row */}
                    {Array.from({ length: 7 }).map((_, i) => (
                        <Box key={`h-${i}`} className="shimmer" h="30px" w="100%" />
                    ))}
                    {/* Data Rows */}
                    {Array.from({ length: 4 }).map((_, r) => (
                        <React.Fragment key={`row-${r}`}>
                            {Array.from({ length: 7 }).map((_, c) => (
                                <Box key={`c-${r}-${c}`} className="shimmer" h="30px" w="100%" my={1} />
                            ))}
                        </React.Fragment>
                    ))}
                </SimpleGrid>
            </Box>

            {/* "How to Measure" Section Shimmer */}
            <Box className="shimmer" h="20px" w="200px" mx="auto" mt={8} mb={4} />

            <Flex justify="space-between" mt={4} gap={8} direction={{ base: "column-reverse", md: "row" }} align="center">
                {/* List Items */}
                <Box w={{ base: "90%", md: "45%" }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Flex key={i} mb={4} align="center">
                            <Box className="shimmer" h="20px" w="20px" borderRadius="full" mr={2} flexShrink={0} />
                            <Box className="shimmer" h="14px" w="80%" />
                        </Flex>
                    ))}
                </Box>

                {/* Image Placeholder */}
                <Box className="shimmer" w={{ base: "200px", md: "300px" }} h={{ base: "200px", md: "300px" }} />
            </Flex>

        </Box>
    );
};

export default SizeGuideShimmer;
