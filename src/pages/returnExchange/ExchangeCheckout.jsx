import React, { Fragment } from "react";
import Loginfooter from "@/pages/CartLogin/Loginfooter";
import AddressExchangeContent from "./AddressExchangeContent";

// ✅ Chakra UI
import { Box, Flex } from "@chakra-ui/react";
import InsideNavbar from "@/components/layouts/InsideNavbar";

const ExchangeCheckout = () => {
    return (
        <Flex direction="column" minH="100vh">
            <InsideNavbar />
            <Box
                mt={{ base: "16", md: "10%" }}
                position="relative"
                w="full"
                flex="1"
            >
                <AddressExchangeContent />
            </Box>
            <Loginfooter />
        </Flex>
    );
};

export default ExchangeCheckout;
