import { Fragment } from "react";
import { Box, Container, Flex, Image, Text } from "@chakra-ui/react";
import { useMobile } from "@/components/molecules";
import thankyou from "@/assets/images/thankyou.png";
import Footer from "@/NewHomePage/components/footer/Footer";
import LogoNavbar from "@/components/layouts/LogoNavbar";

const ThankyouScreen = () => {
  const isMobile = useMobile();

  return (
    <Fragment>
      <LogoNavbar />

      <Box mt={isMobile ? "85px" : "10%"} as="section">
        <Container maxW="full">
          <Flex justify="center">
            <Box w={{ base: "83.333%", md: "66.666%" }}>
              <Image src={thankyou} alt="Thank you" w="full" />
              <Text textAlign="center" py={4} fontSize="lg" fontWeight="semibold">
                Thank you for your order please visit again.
              </Text>
            </Box>
          </Flex>
        </Container>
      </Box>

      <Footer />
    </Fragment>
  );
};

export default ThankyouScreen;
