import React from "react";
import { Box, Flex } from "@chakra-ui/react";
import {
  MdOutlineKeyboardArrowLeft,
  MdOutlineKeyboardArrowRight,
} from "react-icons/md";

const NavigationArrows = ({
  onPrev,
  onNext,
  zIndex = 20,
}) => {
  return (
    <>
      {/* Left Arrow — hidden on mobile */}
      <Box
        pos="absolute"
        top="45%"
        left="2vw"
        zIndex={zIndex}
        onClick={onPrev}
        display={{ base: "none", md: "block" }}   // ✅ HIDE ON MOBILE
      >
        <Flex
          w="35px"
          h="35px"
          rounded="full"
          bg="rgba(93,92,92,0.408)"
          color="white"
          align="center"
          justify="center"
          fontSize={{ md: "2.1vw" }}
          cursor="pointer"
          _hover={{ bg: "rgba(93,92,92,0.6)" }}
          transition="background-color 0.3s ease"
        >
          <MdOutlineKeyboardArrowLeft />
        </Flex>
      </Box>

      {/* Right Arrow — hidden on mobile */}
      <Box
        pos="absolute"
        top="45%"
        right="2vw"
        zIndex={zIndex}
        onClick={onNext}
        display={{ base: "none", md: "block" }}   // ✅ HIDE ON MOBILE
      >
        <Flex
          w="35px"
          h="35px"
          rounded="full"
          bg="rgba(93,92,92,0.408)"
          color="white"
          align="center"
          justify="center"
          fontSize={{ md: "2.1vw" }}
          cursor="pointer"
          _hover={{ bg: "rgba(93,92,92,0.6)" }}
          transition="background-color 0.3s ease"
        >
          <MdOutlineKeyboardArrowRight />
        </Flex>
      </Box>

      {/* Left Arrow (hidden on desktop) */}
      <Box
        pos="absolute"
        top="45%"
        left="-6vw"
        zIndex={20}
        onClick={onPrev}
        display={{ base: "block", md: "none" }}
      >
        <Flex
          w="50px"
          h="50px"
          rounded="full"
          bg="rgba(255, 255, 255, 0.35)"
          backdropFilter="blur(8px)"
          WebkitBackdropFilter="blur(8px)"
          color="white"
          align="center"
          justify="end"
          fontSize={{ md: "2.1vw" }}
          cursor="pointer"
          _hover={{ bg: "rgba(93,92,92,0.6)" }}
          transition="background-color 0.3s ease"
        >
          <MdOutlineKeyboardArrowLeft size={38} color="black" />
        </Flex>
      </Box>

      {/* Right Arrow (hidden on desktop) */}
      <Box
        pos="absolute"
        top="45%"
        right="-6vw"
        zIndex={20}
        onClick={onNext}
        display={{ base: "block", md: "none" }}
      >
        <Flex
          w="50px"
          h="50px"
          rounded="full"
          bg="rgba(255, 255, 255, 0.35)"
          backdropFilter="blur(8px)"
          WebkitBackdropFilter="blur(8px)"
          color="white"
          align="center"
          justify="start"
          fontSize={{ md: "2.1vw" }}
          cursor="pointer"
          _hover={{ bg: "rgba(93,92,92,0.6)" }}
          transition="background-color 0.3s ease"
        >
          <MdOutlineKeyboardArrowRight size={38} color="black" />
        </Flex>
      </Box>
    </>
  );
};

export default NavigationArrows;
