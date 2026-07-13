import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from "@chakra-ui/react";
import LogoNavbar from "../layouts/LogoNavbar";
import CartQuickView from "@/pages/ProductDetails/components/cartQuickView";
import Footer from "@/NewHomePage/components/footer/Footer";
import { getContentData } from "../../api/services/homeapi";
import { Skeleton } from "@chakra-ui/react";

const FaqPage = () => {
  const [faqData, setFaqData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getContentData('faq-page');
        if (response && response.body && response.body.FAQ) {
          setFaqData(response.body.FAQ);
        }
      } catch (error) {
        // console.error("Failed to fetch FAQ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <Box>
      <LogoNavbar />
      <CartQuickView />
      <Container
        maxW="full"
        px={{ base: "12px", md: "50px" }}
        py={{ base: 6, md: 10 }}
        mt={{ base: 10, md: 16 }}
      >
        <Box textAlign="center" mb={{ base: 4, md: 16 }}>
          <Heading
            as="h1"
            fontSize={{ base: "2xl", md: "4xl" }}
            fontWeight="normal"
            fontFamily="Dm Serif Display"
            textTransform={"uppercase"}
          >
            FAQ
          </Heading>
        </Box>

        {/* Accordion */}
        <Accordion allowToggle defaultIndex={[0]}>
          {loading ? (
            <Box>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Box className="shimmer" key={i} height="50px" mb={4} borderRadius="md" />
              ))}
            </Box>
          ) : (
            faqData.map((item, idx) => (
              <AccordionItem key={idx} border="none" mb={3} borderRadius="md">
                {({ isExpanded }) => (
                  <Box
                    border="1px solid"
                    borderColor={isExpanded ? "black" : "blackAlpha.200"}
                    borderRadius="md"
                    overflow="hidden"
                    bg="white"
                  >
                    <h2>
                      <AccordionButton
                        px={4}
                        py={3}
                        _hover={{ bg: "blackAlpha.100" }}
                        _expanded={{ bg: "blackAlpha.100" }}
                      >
                        <Text flex="1" textAlign="left" fontSize="sm">
                          {item.Question}
                        </Text>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel
                      px={4}
                      pt={0}
                      pb={4}
                      fontSize="sm"
                      color="blackAlpha.700"
                      lineHeight="1.7"
                      bg="blackAlpha.100"
                    >
                      {item.Answer}
                    </AccordionPanel>
                  </Box>
                )}
              </AccordionItem>
            ))
          )}
        </Accordion>
      </Container>

      <Footer />
    </Box>
  );
};

export default FaqPage;
