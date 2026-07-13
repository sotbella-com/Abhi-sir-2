import React from "react";
import { Box, Skeleton, Stack, HStack, VStack } from "@chakra-ui/react";

const CartCouponAndPricingShimmer = () => {
    return (
        <Stack spacing={4}>
            {/* Available Offers Section Shimmer */}
            <Box
                borderWidth="1.5px"
                borderStyle="dashed"
                borderColor="blackAlpha.200"
                w="full"
                p={{ base: 2, md: 3 }}
                fontFamily="sans-serif"
            >
                {/* Shimmer for Available Offers */}
                <Box className="shimmer" height="20px" width="50%" mb={2} />
                <VStack align="stretch" spacing={2}>
                    <Box className="shimmer" height="15px" width="90%" />
                    <Box className="shimmer" height="15px" width="70%" />
                </VStack>

                {/* See More / See Less toggle */}
                <HStack
                    mt="2"
                    fontSize={{ base: "11px", md: "xs" }}
                    cursor="pointer"
                    color="black"
                    align="center"
                    spacing="6px"
                >
                    <Box className="shimmer" height="15px" width="60px" />
                </HStack>
            </Box>

            {/* Coupon Input Card Shimmer */}
            <Box my="5" p="3" borderWidth="1px" borderColor="blackAlpha.200">
                <Box className="shimmer" height="20px" width="30%" mb={2} />

                {/* Input + Buttons Shimmer */}
                <HStack justify="space-between" w="full" mt="2">
                    <Box className="shimmer" height="40px" width="80%" />
                    <Box className="shimmer" height="40px" width="18%" />
                </HStack>

                {/* Available Coupons List Shimmer */}
                <VStack as="ul" mt="4" spacing="4" align="stretch">
                    {new Array(3).fill("").map((_, idx) => (
                        <HStack key={idx} justify="space-between" borderWidth="1px" borderColor="blackAlpha.200" p="3">
                            <Box className="shimmer" height="20px" width="50%" />
                            <Box className="shimmer" height="20px" width="25%" />
                        </HStack>
                    ))}
                </VStack>

                {/* See More / See Less toggle */}
                <HStack
                    mt="2"
                    fontSize="sm"
                    cursor="pointer"
                    color="black"
                    align="center"
                    spacing="1"
                >
                    <Box className="shimmer" height="15px" width="60px" />
                </HStack>
            </Box>

            {/* Pricing / Order Summary Shimmer */}
            <Box mt="5" p="3" borderWidth="1px" borderColor="blackAlpha.200">
                <Box className="shimmer" height="20px" width="50%" mb={2} />
                <VStack align="stretch" spacing={3}>
                    <Box className="shimmer" height="15px" width="60%" />
                    <Box className="shimmer" height="15px" width="70%" />
                    <Box className="shimmer" height="15px" width="40%" />
                </VStack>

                <Box w="full" mt={4}>
                    <Box className="shimmer" height="40px" width="100%" />
                </Box>
            </Box>


            {/* Checkout Button Shimmer */}
            <Box w="full">
                <Box className="shimmer" height="40px" width="100%" />
            </Box>
            {/* Delivery & Return Shimmer */}
            <Box w="full">
                <Box className="shimmer" height="40px" width="100%" />
            </Box>
        </Stack>
    );
};

export default CartCouponAndPricingShimmer;
