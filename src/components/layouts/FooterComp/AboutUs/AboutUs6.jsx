import React from "react";
import img3 from "@/assets/images/about3.webp";
import { Box, Flex, Image, Heading, Text } from "@chakra-ui/react";

const AboutUs6 = () => {
  return (
    <Box
      as="section"
      bg="black"
      color="white"
      py={{ base: 4, md: 12 }}
      px={{ base: "12px", md: "50px" }}
    >
      <Flex
        direction={{ base: "column", lg: "row" }}
        align="center"
        gap={{ base: 2, md: 8, xl: 16 }}
      >
        {/* Text Section */}
        <Box
          w={{ base: "100%", lg: "50%" }}
          order={{ base: 2, lg: 1 }}
          textAlign="left"
        >
          {/* ✅ AboutUs3 Heading */}
          <Heading
            as="h2"
            fontSize={{ base: "xl", md: "3xl", xl:"4xl" }}
            fontWeight="medium"
            mb={{ base: 2, md: 6 }}
            lineHeight="short"
            letterSpacing={"wider"}
          >
            Empowering Confidence <br /> Through Conscious Fashion.
          </Heading>

          <Text
            fontSize={{ base: "sm", md: "md" }}
            mb={{ base: 3, md: 6 }}
            lineHeight="tall"
            letterSpacing={"wider"}
          >
            We believe in fashion that feels good, on your skin, and on your
            conscience.
          </Text>

          <Text
            fontSize={{ base: "sm", md: "md" }}
            lineHeight="tall"
            letterSpacing={"wider"}
          >
            From responsibly sourced fabrics and minimal-waste production to
            recyclable packaging, we’re committed to making fashion more
            sustainable, season after season.
          </Text>
        </Box>

        {/* Image Section */}
        <Flex
          w={{ base: "100%", lg: "50%" }}
          order={{ base: 1, lg: 2 }}
          justify="center"
        >
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
        </Flex>
      </Flex>
    </Box>
  );
};

export default AboutUs6;
