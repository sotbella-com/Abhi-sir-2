import React from "react";
import img1 from "@/assets/images/about1.webp";
import { Box, Flex, Image, Heading, Text } from "@chakra-ui/react";

const AboutUs1 = () => {
  return (
    <Box as="section" py={{ base: 2, md: 12 }} px={{ base: "12px", md: "50px" }}>
      <Flex
        direction={{ base: "column", lg: "row" }}
        align="center"
        gap={{ base: 2, md: 8, xl: 16 }}
      >
        {/* Left Image */}
        <Flex
          w={{ base: "100%", lg: "50%" }}
          justify="center"
          mb={{ base: 2, xl: 0 }}
        >
          <Image
            src={img1}
            alt="Sotbella"
            // maxW="full"
            w="full"
            h={{ lg: "90vh" }}
            objectFit="cover"
            objectPosition={"top"}
          // mx="auto"
          />
        </Flex>

        {/* Right Text */}
        <Box w={{ base: "100%", lg: "50%" }} textAlign="left">
          <Heading
            as="h1"
            fontSize={{ base: "4xl", md: "5xl", xl: "6xl" }}
            fontWeight="medium"
            textTransform="uppercase"
            mb={2}
          >
            Our Story
          </Heading>

          <Heading
            as="h2"
            fontSize={{ base: "lg", md: "xl", xl: "3xl" }}
            fontWeight="normal"
            mb={{ base: 1, md: 2 }}
          >
            Where style meets your Universe!
          </Heading>

          <Text
            fontSize={{ base: "sm", md: "md", xl: "16px" }}
            mb={{ base: 3, xl: 6 }}
            lineHeight="tall"
            letterSpacing={"wider"}
          >
            Sötbella was born in 2023, with a desire to blend bold fashion with
            timeless elegance, while staying rooted in inclusivity,
            individuality and self-expression. What started as a dream has
            evolved into a movement: fashion that goes beyond fabric to inspire,
            uplift, and empower.
          </Text>

          <Text
            fontSize={{ base: "sm", md: "md", xl: "16px" }}
            mb={{ base: 3, xl: 6 }}
            lineHeight="tall"
            letterSpacing={"wider"}
          >
            Proudly made in India and worn across the globe, Sötbella celebrates
            body confidence, bold expression, and unapologetic self-love. Every
            piece we design reflects the vibrancy of Indian creativity,
            ambition, and craftsmanship, powered by the spirit of the{" "}
            <Box as="strong" fontWeight="bold">
              #YesWeCanIndia
            </Box>{" "}
            movement.
          </Text>

          <Text
            fontSize={{ base: "sm", md: "md", xl: "16px" }}
            lineHeight="tall"
            letterSpacing={"wider"}
          >
            We believe fashion should be personal and powerful. That’s why we
            create luxury silhouettes at accessible prices, empowering you to
            express your unique style — without compromise.
          </Text>
        </Box>
      </Flex>
    </Box>
  );
};

export default AboutUs1;
