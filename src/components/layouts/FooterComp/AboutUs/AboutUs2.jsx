import React from "react";
import img2 from "@/assets/images/about2.webp";
import { Box, Flex, Image, Heading, Text } from "@chakra-ui/react";

const AboutUs2 = () => {
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
          <Text
            fontSize={{ base: "md", md: "lg", xl:"xl" }}
            mb={{ base: 2, md: 4 }}
          >
            Our Movement
          </Text>

          <Heading
            as="h1"
            fontSize={{ base: "2xl", md: "4xl", xl: "5xl" }}
            fontWeight="medium"
            textTransform="uppercase"
            mb={{ base:4, md: 6}}
          >
            #YesWeCanIndia
          </Heading>

          <Text
            fontSize={{ base: "sm", md: "md" }}
            mb={{ base:3, md: 6}}
            lineHeight="tall"
            letterSpacing={"wider"}
          >
            At Sötbella, #YesWeCanIndia isn’t just a hashtag, it’s a celebration
            of those redefining their paths with ambition and authenticity. From
            our makers to our wearers, every Sötbellaite is part of this
            growing, confident community.
          </Text>

          <Text
            fontSize={{ base: "sm", md: "md" }}
            mb={{ base:3, md: 6}}
            lineHeight="tall"
            letterSpacing={"wider"}
          >
            Tag your looks with #YesWeCanIndia and @sotbella_in on Instagram. We
            love featuring your stories.
          </Text>

          <Text
            fontSize={{ base: "sm", md: "md" }}
            lineHeight="tall"
            letterSpacing={"wider"}
          >
            Let’s keep pushing boundaries, one outfit at a time.
          </Text>
        </Box>

        {/* Image Section */}
        <Flex
          w={{ base: "100%", lg: "50%" }}
          order={{ base: 1, lg: 2 }}
          justify="center"
        >
          <Image
            src={img2}
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

export default AboutUs2;
