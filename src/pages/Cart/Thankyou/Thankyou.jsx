import React, { Fragment } from "react";
import Thankyoumid1 from "./Thankyoumid1";
import LogoNavbar from "@/components/layouts/LogoNavbar";
import PreventBack from "@/utils/preventBack";
import Footer from "@/NewHomePage/components/footer/Footer";
import { useLocation } from "react-router-dom";

// ✅ Chakra UI
import { Box, Image, Flex } from "@chakra-ui/react";
import CartQuickView from "@/pages/ProductDetails/components/cartQuickView";

const Thankyou = () => {
  const location = useLocation();

  const isHidden =
    location.state?.isHidden ??
    JSON.parse(sessionStorage.getItem("isHidden") || "false");

  return (
    <Fragment>
      {isHidden ? (
        <Flex
          justify="center"
          align="center"
          w="100%"
          mt={4}
        >
          <Image
            src="https://stgsfcc.sotbella.com/on/demandware.static/-/Sites-sotbella_uae-Library/default/sotbella-logo.png"
            alt="Sotbella Logo"
            maxW={{ base: "140px", md: "180px" }}
          />
        </Flex>
      ) : (
        <LogoNavbar />
      )}

      <CartQuickView />
      <PreventBack />

      <Box mt={10} position="relative">
        <Thankyoumid1 />
        {!isHidden && <Footer />}
      </Box>
    </Fragment>
  );
};

export default Thankyou;