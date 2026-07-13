import React, { Fragment } from "react";
import Shippingmid1 from "./Shippingmid1";
import { Box } from "@chakra-ui/react";
import { useLocation } from "react-router-dom";
import InsideNavbar from "@/components/layouts/InsideNavbar";
import Loginfooter from "../CartLogin/Loginfooter";

const Shipping = () => {
  const location = useLocation();

  const isHidden =
    location.state?.isHidden ??
    JSON.parse(sessionStorage.getItem("isHidden") || "false");

  return (
    <Fragment>
      {isHidden ? (
        <Flex justify="center" mt={4}>
          <Image
            src="https://stgsfcc.sotbella.com/on/demandware.static/-/Sites-sotbella_uae-Library/default/sotbella-logo.png"
            alt="Sotbella"
            maxW={{ base: "140px", md: "180px" }}
            h="auto"
          />
        </Flex>
      ) : (
        <InsideNavbar />
      )}

      <Box
        mt={{
          base: isHidden ? "20px" : "50px",
          lg: isHidden ? "30px" : "120px",
        }}
        position="relative"
        w="full"
      >
        <Shippingmid1 isHidden={isHidden} />

        {!isHidden && <Loginfooter />}
      </Box>
    </Fragment>
  );
};

export default Shipping;