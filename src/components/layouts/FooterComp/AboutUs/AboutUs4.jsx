import React from "react";
import img4 from "@/assets/images/about4.webp";
import { Box, Flex, Image, Heading, Text } from "@chakra-ui/react";
import { Link } from "react-router-dom";

const AboutUs4 = () => {
  return (
    <Box
      as="section"
      py={{ base: 2, md: 12 }}
      px={{ base: "12px", md: "50px" }}
    >
      <Flex
        direction={{ base: "column-reverse", lg: "row" }}
        align="center"
        gap={{ base: 2, md: 8, xl: 16 }}
      >
        {/* Image Section */}
        <Box w={{ base: "100%", lg: "50%" }} textAlign="center">
          <Image
            src={img4}
            alt="Sotbella"
            // maxW="full"
            w="full"
            h={{ lg: "90vh" }}
            objectFit="cover"
            objectPosition={"top"}
          // mx="auto"
          />
        </Box>
        {/* Text Section */}
        <Box w={{ base: "100%", lg: "50%" }} textAlign="left">
          <Heading
            as="h2"
            fontSize={{ base: "xl", md: "3xl", xl: "4xl" }}
            letterSpacing={"wider"}
            fontWeight="medium"
            mb={{ base: 2, md: 4 }}
          >
            Homegrown with heart
          </Heading>
          {/* 
          <Heading
            as="h3"
            fontSize={{ base: "xl", md: "2xl" }}
            fontWeight="medium"
            mb={5}
            textTransform="uppercase"
          >
            Image with text
          </Heading> */}

          <Text
            fontSize={{ base: "sm", md: "md" }}
            lineHeight="tall"
            mb={{ base: 2, md: 4 }}
            letterSpacing={"wider"}
          >
            From our founder’s vision to every final photoshoot, we pour love,
            culture, and craft into all we do. Our passionate team of creators,
            designers, and marketers see fashion as a form of freedom.
          </Text>

          <Text
            fontSize={{ base: "sm", md: "md" }}
            lineHeight="tall"
            mb={{ base: 2, md: 4 }}
            letterSpacing={"wider"}
          >
            Our customers aren’t just buyers – they’re part of our journey.
            Whether it's through product reviews, social tags, or our Creator
            Affiliate Program, your voice shapes who we are.
          </Text>

          <Text
            fontSize={{ base: "sm", md: "md" }}
            lineHeight="tall"
            mb={{ base: 2, md: 4 }}
            letterSpacing={"wider"}
          >
            <Box as="span" fontWeight="semibold">
              Tag
              <Link to="https://www.instagram.com/sotbella_og_verse"> @sotbella_og_verse
              </Link>
            </Box>{" "}
            to get featured
          </Text>

          <Text
            fontSize={{ base: "sm", md: "md" }}
            lineHeight="tall"
            letterSpacing={"wider"}
          >
            <Box as="span" fontWeight="semibold">
              Be a #Sötbellaite
            </Box>{" "}
            and help rewrite fashion norms – one powerful outfit at a time.
          </Text>
        </Box>
      </Flex>
    </Box>
  );
};

export default AboutUs4;
