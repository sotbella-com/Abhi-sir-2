import React, { Fragment } from "react";
import Loginfooter from "@/pages/CartLogin/Loginfooter";
import Loginmiddle2 from "@/pages/CartLogin/Loginmiddle2";
import AddressContent from "./addressContent";
import { useLocation } from "react-router-dom";

// ✅ Chakra UI
import { Box, Flex } from "@chakra-ui/react";
import InsideNavbar from "@/components/layouts/InsideNavbar";
import { Image as ChakraImage } from "@chakra-ui/react";
const AddressPage = () => {
  const location = useLocation();

  const isHidden =
    location.state?.isHiddenm || sessionStorage.getItem("isHidden");
  console.log(isHidden, "isHidden in Address Page");
  return (
    <Fragment>
      {isHidden === "true" ? (
        <Flex
          justify="center"
          align="center"
          w="100%"
          mt={4}
        >
          <ChakraImage
            src="https://stgsfcc.sotbella.com/on/demandware.static/-/Sites-sotbella_uae-Library/default/sotbella-logo.png"
            alt="Sotbella Logo"
            w={{ base: "180px", xl: ["15vw", null, null, null, "11vw"] }}
            loading="lazy"
          />
        </Flex>
      ) : (
        <InsideNavbar />
      )}
      <Box mt={
        isHidden === "true"
          ? { base: "6", md: "8" }
          : { base: "16", md: "10%" }
      } 
      position="relative" w="full">
        <AddressContent isHidden={isHidden} />
        <Loginfooter />
      </Box>
    </Fragment>
  );
};

export default AddressPage;
