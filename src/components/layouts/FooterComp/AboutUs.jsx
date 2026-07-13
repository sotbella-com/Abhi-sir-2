import { Fragment, useEffect, useState } from "react";
import LogoNavbar from "@/components/layouts/LogoNavbar";
import { useMobile } from "@/components/molecules";
import AboutUs1 from "./AboutUs/AboutUs1";
import AboutUs2 from "./AboutUs/AboutUs2";
import AboutUs3 from "./AboutUs/AboutUs3";
import AboutUs4 from "./AboutUs/AboutUs4";
import AboutUs5 from "./AboutUs/AboutUs5";
import CartQuickView from "@/pages/ProductDetails/components/cartQuickView";
import Footer from "@/NewHomePage/components/footer/Footer";
import { Box, Grid, Text, Heading } from "@chakra-ui/react";
import { AboutUs1Shimmer, AboutUs2Shimmer } from "../Simmers/AboutUsShimmer";
import AboutUs6 from "./AboutUs/AboutUs6";

const AboutUs = () => {
  const isMobile = useMobile();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <Fragment>
      <LogoNavbar />
      <CartQuickView />

      <Box
        mt="90px"
        py={10}
        bg={"black"}
        display={{ base: "none", md: "block" }}
      >
        <Box textAlign="center">
          <Heading
            as="h1"
            fontSize="2xl"
            // fontSize="4xl"
            // fontFamily="Dm Serif Display"
            textTransform={"uppercase"}
            color={"white"}
          >
            HOMEGROWN | INCLUSIVE | AFFORDABLE LUXURY
          </Heading>
        </Box>
      </Box>

      <Grid gap={8} pt={{ base: 14, md: 0 }} pb={0}>
        {loading ? (
          <AboutUs1Shimmer />
        ) : (
          <AboutUs1 />
        )}
        {loading ? (
          <AboutUs2Shimmer />
        ) : (
          <AboutUs2 />
        )}
        <AboutUs3 />
        <AboutUs6 />
        <AboutUs4 />
      </Grid>

      <Box mt={{ base: 4, md: 10 }}>
        <AboutUs5 />
      </Box>

      <Footer />
    </Fragment>
  );
};

export default AboutUs;
