import React from "react";
import { Box, Flex, Skeleton, SkeletonText } from "@chakra-ui/react";

const ShimmerLines = ({ lines = 3 }) => (
    <Box>
        {Array.from({ length: lines }).map((_, i) => (
            <Box
                key={i}
                className="shimmer"
                h="14px"
                w="100%"
                mb={3}
            />
        ))}
    </Box>
);



export const AboutUs1Shimmer = () => {
    return (
        <Box as="section" py={{ base: 4, md: 12 }} px={{ base: "12px", md: "50px" }}>
            <Flex
                direction={{ base: "column", lg: "row" }}
                align="center"
                gap={8}
            >
                {/* Left Image Shimmer */}
                <Flex
                    w={{ base: "100%", lg: "50%" }}
                    justify="center"
                    mb={{ base: 6, xl: 0 }}
                >
                    <Box
                        className="shimmer"
                        w="100%"
                        h={{ base: "250px", md: "400px", lg: "80vh" }}
                        fadeDuration={0.8}
                    />
                </Flex>

                {/* Right Text Shimmer */}
                <Box w={{ base: "100%", lg: "50%" }}>
                    {/* Title */}
                    <Box
                        className="shimmer"
                        height="28px"
                        width="180px"
                        mb={3}
                        fadeDuration={0.8}
                    />

                    {/* Subtitle */}
                    <Box
                        className="shimmer"
                        height="22px"
                        width={{ base: "100%", md: "80%" }}
                        mb={4}
                        fadeDuration={0.8}
                    />

                    {/* Paragraph 1 */}
                    <ShimmerLines lines={4} />


                    {/* Paragraph 2 */}
                    <ShimmerLines lines={4} />


                    {/* Paragraph 3 */}
                    <ShimmerLines lines={3} />

                </Box>
            </Flex>
        </Box>
    );
};

export const AboutUs2Shimmer = () => {
    return (
        <Box
            as="section"
            bg="black"
            color="white"
            py={{ base: 4, md: 12 }}
            px={{ base: "12px", md: "50px" }}
        >
            <Flex direction={{ base: "column", lg: "row" }} align="center" gap={8}>
                {/* Text Section Shimmer */}
                <Box w={{ base: "100%", lg: "50%" }} order={{ base: 2, lg: 1 }}>
                    {/* "Our Movement" */}
                    <Box
                        className="shimmer"
                        h="16px"
                        w={{ base: "140px", md: "180px" }}
                        mb={{ base: 3, md: 4 }}
                    />

                    {/* #YesWeCanIndia (heading) */}
                    <Box
                        className="shimmer"
                        h={{ base: "28px", md: "40px" }}
                        w={{ base: "70%", md: "60%" }}
                        mb={3}
                    />
                    <Box
                        className="shimmer"
                        h={{ base: "28px", md: "40px" }}
                        w={{ base: "85%", md: "75%" }}
                        mb={6}
                    />

                    {/* Paragraphs */}
                    <ShimmerLines lines={4} />
                    <Box h={2} />
                    <ShimmerLines lines={4} />
                    <Box h={2} />
                    <ShimmerLines lines={3} />
                </Box>

                {/* Image Section Shimmer */}
                <Flex w={{ base: "100%", lg: "50%" }} order={{ base: 1, lg: 2 }} justify="center">
                    <Box
                        className="shimmer"
                        w="100%"
                        h={{ base: "250px", md: "400px", lg: "80vh" }}
                    />
                </Flex>
            </Flex>
        </Box>
    );
};
