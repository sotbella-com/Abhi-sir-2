import { Link, Box, Text } from "@chakra-ui/react";
import React from "react";

const AbsLink = ({ children, href = "#", showArrow = true }) => {
  if (typeof children === "string" && children.trim() === "") return null;

  return (
    <Link
      href={href}              // ✅ Chakra Link uses href (not to)
      color="white"
      textAlign="center"
      cursor="pointer"
      fontSize={{ base: "20px", md: "20px" }}
      fontWeight="700"
      textTransform="uppercase"
      _hover={{ opacity: 0.85 }}
      display="inline-block"
      position="relative"
    >
      <Box
        display="inline-flex"
        alignItems="center"     // ✅ FIX: iOS-safe
        gap="6px"
        lineHeight="1"          // ✅ Keep both on same line height
      >
        <Text as="span" lineHeight="1">
          {children}
        </Text>

        {showArrow && (
          <Box
            as="span"
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            lineHeight="1"
            fontWeight="900"
            fontSize="0.9em"     // ✅ slightly smaller than 1.5em to match visually
            transform="translateY(0.02em)" // ✅ tiny tweak for Safari
          >
            &rarr;
          </Box>
        )}
      </Box>

      <Box position="absolute" left="0" right="0" bottom="-6px" height="2px" bg="white" />
    </Link>
  );
};

export default AbsLink;
