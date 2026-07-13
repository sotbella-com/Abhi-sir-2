import React from "react";
import { Box, Container, HStack, Text, Button, Link } from "@chakra-ui/react";

const Announcebar = ({
  message = "JUST DROPPED - RESORT 25 COLLECTION",
  ctaLabel = "Shop Now",
  href = "#",
  onClick,
}) => {
  return (
    <Box bg="black" color="white">
      <Container maxW="container.xl" py={ 1 }>
        <HStack
          spacing={{ base: 2, md: 3 }}
          justify="center"
          align="center"
          wrap="wrap"
        >
          <Text
            textAlign="center"
            fontWeight="semibold"
            letterSpacing="wide"
            textTransform="uppercase"
            fontSize={{ base: "9px", sm: "10px" }}
            lineHeight="shorter"
          >
            {message}
          </Text>

          {onClick ? (
            <Button
              onClick={onClick}
              bg="white"
              color="black"
              size="sm"
              px={{ base: 3, md: 4 }}
              height={7}
              className="rounded"
              cursor="pointer"
              fontSize="11px" 
              fontWeight="800"
              _hover={{ bg: "whiteAlpha.900" }}
              _active={{ bg: "whiteAlpha.800" }}
            >
              {ctaLabel}
            </Button>
          ) : (
            <Link href={href} _hover={{ textDecoration: "none" }}>
              <Button
                bg="white"
                color="black"
                size="sm"
                px={{ base: 3, md: 4 }}
                height={7}
                className="rounded"
                cursor="pointer"
                fontSize="11px" 
                fontWeight="800"
                _hover={{ bg: "whiteAlpha.900" }}
                _active={{ bg: "whiteAlpha.800" }}
              >
                {ctaLabel}
              </Button>
            </Link>
          )}
        </HStack>
      </Container>
    </Box>
  );
};

export default Announcebar;
