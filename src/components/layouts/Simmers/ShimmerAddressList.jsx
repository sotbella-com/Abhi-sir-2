import React, { Fragment } from "react";
import {
    Box,
    Flex,
    useBreakpointValue,
} from "@chakra-ui/react";
import { ProfileSideBar } from "@/components/layouts";

const ShimmerAddressCard = () => (
    <Box w="full" mt={{ base: 4, md: 0 }} mb={{ md: 3 }}>
        <Box bg="#fafafa" border="1px solid #ebebeb" p={4}>
            {/* Top row: Name + actions */}
            <Flex justify="space-between" align="center" pb={2} borderBottom="1px solid #ebebeb">
                {/* Name */}
                <Box w="55%">
                    <Box className="shimmer" h="16px" w="70%" mb={1} />
                </Box>

                {/* Right actions: default pill + edit + remove */}
                <Flex
                    align="center"
                    gap={2}
                    w="45%"
                    justify={{ base: "flex-end", md: "space-between" }}
                >
                    {/* Default pill (desktop) */}
                    <Box display={{ base: "none", md: "block" }}>
                        <Box className="shimmer" h="20px" w="90px" />
                    </Box>

                    {/* Edit */}
                    <Box className="shimmer" h="16px" w="50px" />

                    {/* Remove */}
                    <Box className="shimmer" h="16px" w="60px" />
                </Flex>
            </Flex>

            {/* Address + phone */}
            <Flex justifyContent="space-between" mt={2}>
                <Flex flexDirection="column" flex="1">
                    <Box py={{ base: 2, md: 5 }}>
                        <Box className="shimmer" h="10px" w="90%" />
                        <Box className="shimmer" h="10px" w="90%" />
                    </Box>

                    <Box>
                        <Box className="shimmer" h="10px" w="50%" />
                    </Box>
                </Flex>

                {/* Mobile default pill at bottom-right */}
                <Flex
                    justifyContent="flex-end"
                    alignItems="flex-end"
                    ml={2}
                    display={{ base: "flex", md: "none" }}
                >
                    <Box className="shimmer" h="18px" w="90px" />
                </Flex>
            </Flex>
        </Box>
    </Box>
);

const ShimmerAddressList = () => {
    const isMobile = useBreakpointValue({ base: true, md: false });

    return (
        <Fragment>
            {/* Desktop heading shimmer */}
            <Box mt="140px" display={{ base: "none", md: "block" }}>

            </Box>

            <Box pb={5} pt={{ base: 12, md: 10 }} px={{ base: "12px", md: "50px" }}>
                <Flex wrap="wrap" justify="space-between" gap={4}>
                    {/* Left: Profile sidebar (real component, but looks fine with shimmer cards on right) */}
                    <ProfileSideBar activeTab={"ADDRESS"} />

                    {/* Right column shimmer */}
                    <Box
                        w={{ base: "100%", lg: "66.666%" }}
                        overflowY={{ lg: "auto" }}
                        maxH={{ lg: "500px" }}
                        sx={{ "&::-webkit-scrollbar": { width: "6px" } }}
                    >
                        {/* Mobile top bar shimmer */}
                        <Flex
                            w="full"
                            mt={{ base: 14, lg: 0 }}
                            align="center"
                            justify="space-between"
                            display={{ base: "flex", lg: "none" }}
                            position="sticky"
                            top="56px"
                            zIndex={2}
                            bg="white"
                            py={2}
                        >
                            <Flex align="center" gap={2}>
                                <Box className="shimmer" boxSize="16px" />
                                <Box className="shimmer" h="16px" w="70px" />
                            </Flex>

                            <Box className="shimmer" h="20px" w="130px" />
                        </Flex>

                        {/* A few shimmering address cards */}
                        <ShimmerAddressCard />
                        <ShimmerAddressCard />
                        <ShimmerAddressCard />

                        {/* Bottom add-address button shimmer (desktop) */}
                        {isMobile ? null : (
                            <Flex
                                w={{ base: "100%", lg: "66.666%" }}
                                p={{ md: 4 }}
                                wrap="wrap"
                                gap={2}
                                mt={4}
                            >
                                <Box className="shimmer" h="40px" w="200px" />
                            </Flex>
                        )}
                    </Box>
                </Flex>
            </Box>
        </Fragment>
    );
};

export default ShimmerAddressList;
