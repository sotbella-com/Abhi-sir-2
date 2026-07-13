import React from "react";
import img3 from "@/assets/images/about6.webp";
import { Box, Flex, Image, Heading, Text } from "@chakra-ui/react";

const AboutUs3 = () => {
  return (
    <Box as="section" py={{ base: 2, md: 12 }} px={{ base: "12px", md: "50px" }}>
      <Flex
        direction={{ base: "column", lg: "row" }}
        align="center"
        gap={{ base: 2, md: 8, xl: 16 }}
      >
        {/* Left Image with overlay text */}
        <Box w={{ base: "100%", lg: "50%" }} position="relative" textAlign="center">
          <Image
            src={img3}
            alt="Sotbella"
            // maxW="full"
            w="full"
            h={{ lg: "90vh" }}
            objectFit="cover"
            objectPosition={"top"}
            // mx="auto"
          />

          {/* Overlay */}
          <Box
            position="absolute"
            left="50%"
            bottom={{ base: 6, md: 10 }}
            transform="translateX(-50%)"
            textAlign="center"
            w="90%"
            pointerEvents="none"
          >
            <Heading
              as="h3"
              fontSize={{ base: "4xl", md: "5xl", xl: "6xl" }}
              fontWeight="medium"
              color="white"
              lineHeight="short"
            >
              #WhatSheWants
            </Heading>

            <Text
              fontSize={{ base: "xs", md: "sm" }}
              color="whiteAlpha.900"
              mt={1}
              letterSpacing="0.5px"
            >
              Anniversary Capsule Collection
            </Text>
          </Box>
        </Box>

        {/* Right Text */}
        <Box w={{ base: "100%", lg: "50%" }} textAlign="left">
          <Text
            fontSize={{ base: "md", md: "lg", xl: "xl" }}
            mb={{ base: 2, md: 4 }}
          >
            Our Movements
          </Text>

          <Heading
            as="h2"
            fontSize={{ base: "2xl", md: "4xl", xl: "5xl" }}
            fontWeight="medium"
            mb={{ base: 4, md: 6 }}
            letterSpacing="0.5px"
          >
            #WHATSHEWANTS
          </Heading>

          <Text
            fontSize={{ base: "sm", md: "md" }}
            lineHeight="tall"
            mb={{ base: 4, md: 6 }}
            letterSpacing={"wider"}
          >
            At Sotbella, every collection begins with a simple thought —{" "}
            <Text as="span" fontStyle="italic">
              what does she truly want?
            </Text>
          </Text>

          <Text
            fontSize={{ base: "sm", md: "md" }}
            lineHeight="tall"
            mb={{ base: 4, md: 6 }}
            letterSpacing={"wider"}
          >
            With our anniversary capsule #WhatSheWants, we celebrate the women
            who choose for themselves, who express, redefine, and own their
            individuality.
          </Text>

          <Text
            fontSize={{ base: "sm", md: "md" }}
            lineHeight="tall"
            mb={{ base: 4, md: 6 }}
            letterSpacing={"wider"}
          >
            From Meher, a woman of today, for the women of today and tomorrow —
            this movement isn’t just about fashion, but about freedom.
          </Text>

          <Text
            fontSize={{ base: "sm", md: "md" }}
            lineHeight="tall"
            letterSpacing={"wider"}
          >
            Freedom to wear what you love, live how you want, and define beauty
            on your own terms.
          </Text>
        </Box>
      </Flex>
    </Box>
  );
};

export default AboutUs3;
