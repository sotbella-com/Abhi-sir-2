import React from "react";
import { Box, Flex, Heading, Button, Link } from "@chakra-ui/react";

const AboutUs5 = () => {
  return (
    <Box as="section" py={{ base: 2, md: 12 }} px={{ base: "12px", md: "50px" }} bg="white">
      <Box maxW="full" mx="auto" textAlign="center">
        <Heading
          as="h2"
          fontSize={{ base: "xl", md: "3xl" }}
          fontWeight="normal"
          color="#1d1d1d"
          mb={6}
          fontFamily="Dm Serif Display"
          textTransform="uppercase"
        >
          Sötbella isn’t just a label — it’s a movement. And you’re invited
        </Heading>

        {/* Social Buttons */}
        <Flex wrap="wrap" justify="center" gap={{ base: 2, md: 4 }} mb={{ base: 2, md: 4 }}>
          <Link
            href="https://www.instagram.com/accounts/login/?next=%2Fsotbella_in%2F&source=omni_redirect"
            isExternal
          >
            <Button
              w={{ base: "130px", sm: "150px" }}
              bg="black"
              color="white"
              px={6}
              py={1}
              textTransform="uppercase"
              fontSize={{ base: "sm", md: "md", xl: "16px" }}
              fontWeight="normal"
              transition="all 0.2s ease"
              _hover={{ bg: "gray.800" }}
              borderRadius="0"
            >
              Instagram
            </Button>
          </Link>

          <Link href="https://www.facebook.com/sotbellastyle/" isExternal>
            <Button
              w={{ base: "130px", sm: "150px" }}
              bg="black"
              color="white"
              px={6}
              py={1}
              textTransform="uppercase"
              fontSize={{ base: "sm", md: "md", xl: "16px" }}
              fontWeight="normal"
              transition="all 0.2s ease"
              _hover={{ bg: "gray.800" }}
              borderRadius="0"
            >
              Facebook
            </Button>
          </Link>
        </Flex>

        <Box mb={6}>
          <Link href="https://www.youtube.com/@Sotbella" isExternal>
            <Button
              w={{ base: "130px", sm: "150px" }}
              bg="black"
              color="white"
              px={6}
              py={1}
              textTransform="uppercase"
              fontSize={{ base: "sm", md: "md", xl: "16px" }}
              fontWeight="normal"
              transition="all 0.2s ease"
              _hover={{ bg: "gray.800" }}
              borderRadius="0"
            >
              YouTube
            </Button>
          </Link>
        </Box>
      </Box>
    </Box>
  );
};

export default AboutUs5;

