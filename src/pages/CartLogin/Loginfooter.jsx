import React, { Fragment, useMemo } from "react";
import { Link as RouterLink, useLocation, matchPath } from "react-router-dom";
import { Box, Flex, Link, Text } from "@chakra-ui/react";

const Loginfooter = () => {
  const location = useLocation();

  const needsExtraBottomSpace = useMemo(() => {
    const path = location.pathname;

    return (
      path === "/shipping" ||
      path === "/Shipping" ||
      path === "/address" ||
      matchPath("/edit-shipping-address/:id", path)
    );
  }, [location.pathname]);

  return (
    <Fragment>
      <Box
        as="footer"
        p={4}
        mt={4}
        mb={{
          base: needsExtraBottomSpace ? 14 : 0,
          lg: 0,
        }}
        bg="blackAlpha.900"
      >
        <Box w="full">
          <Flex
            direction={{ base: "column", lg: "row" }}
            align="center"
            justify="center"
            textAlign="center"
            color="white"
            fontSize="sm"
            gap={{ base: 3, lg: 0 }}
          >
            <Link
              as={RouterLink}
              to="/privacypolicy"
              textDecoration="underline"
              _hover={{ textDecoration: "underline" }}
            >
              Privacy Policy
            </Link>

            <Box display={{ base: "none", lg: "block" }}>
              <Text as="span" px={4}>
                |
              </Text>
              Copyright © 2026. All rights reserved.
              <Text as="span" px={4}>
                |
              </Text>
            </Box>

            <Link
              as={RouterLink}
              to="/terms"
              textDecoration="underline"
              _hover={{ textDecoration: "underline" }}
            >
              Terms & Conditions
            </Link>

            <Box display={{ base: "block", lg: "none" }}>
              Copyright © 2026. All rights reserved.
            </Box>
          </Flex>
        </Box>
      </Box>
    </Fragment>
  );
};

export default Loginfooter;
