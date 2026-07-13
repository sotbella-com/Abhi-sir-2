import React, { useEffect, useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { Box, Flex, Text, IconButton, Image as ChakraImage } from "@chakra-ui/react";
import Menubar from "@/NewHomePage/components/menubar/Menubar";

/* -------- route → step -------- */
const useCheckoutStep = () => {
  const { pathname } = useLocation();
  const isAddress =
    pathname === "/customer-address" ||
    pathname === "/add-address" ||
    pathname === "/shipping" ||
    pathname === "/address" ||
    /^\/edit-address\/[^/]+$/.test(pathname) ||
    /^\/edit-shipping-address\/[^/]+$/.test(pathname);

  if (pathname === "/cart") return 1;
  if (isAddress) return 2;
  return 1;
};

/* -------- progress bar -------- */
const CheckoutProgress = ({ currentStep = 1, ...props }) => {
  const isActive = (n) => n <= currentStep;

  return (
    <Flex justify="center" align="center" gap={{ base: 1, md: 4 }} {...props} mr={{ lg: 24 }} my={2}>
      {/* Cart */}
      <Flex align="center">
        <Box bg={isActive(1) ? "black" : "blackAlpha.200"} rounded="full" w={{ base: 5, md: 5 }} h={{ base: 5, md: 5 }} />
        <Text ml={{ base: 2, md: 2 }} fontSize={{ base: "sm", md: "sm" }} color="black">
          Cart
        </Text>
        <Box
          borderColor={isActive(1) ? "black" : "blackAlpha.400"}
          borderBottom={isActive(1) ? "1.5px solid" : "1.5px dashed"}
          w={{ base: 10, sm: 16, md: 16 }}
          mx={{ base: 1, md: 2 }}
        />
      </Flex>

      {/* Address */}
      <Flex align="center">
        <Box bg={isActive(2) ? "black" : "blackAlpha.200"} rounded="full" w={{ base: 5, md: 5 }} h={{ base: 5, md: 5 }} />
        <Text ml={{ base: 2, md: 2 }} fontSize={{ base: "sm", md: "sm" }} color="black">
          Address
        </Text>
        <Box
          borderColor={isActive(2) ? "black" : "blackAlpha.400"}
          borderBottom={isActive(2) ? "1.5px solid" : "1.5px dashed"}
          w={{ base: 10, sm: 16, md: 16 }}
          mx={{ base: 2, md: 2 }}
        />
      </Flex>

      {/* Payment */}
      <Flex align="center">
        <Box bg={isActive(3) ? "black" : "blackAlpha.200"} rounded="full" w={{ base: 5, md: 5 }} h={{ base: 5, md: 5 }} />
        <Text ml={{ base: 2, md: 2 }} fontSize={{ base: "sm", md: "sm" }} color="black">
          Payment
        </Text>
      </Flex>
    </Flex>
  );
};

/* -------- hamburger -------- */
const Hamburger = ({ isOpen, onClick }) => (
  <IconButton
    aria-label="Toggle menu"
    onClick={onClick}
    variant="ghost"
    p={0}
    minW="auto"
    _hover={{ bg: "transparent" }}
    _active={{ bg: "transparent" }}
    icon={
      <Box pos="relative" w="24px" h="12px" transition="all 0.3s ease">
        <Box pos="absolute" w="100%" h="2px" bg="black" borderRadius="1px" top={isOpen ? "50%" : 0}
          transform={isOpen ? "translateY(-50%) rotate(45deg)" : "none"} transition="all 0.3s ease" />
        <Box pos="absolute" w="100%" h="2px" bg="black" borderRadius="1px" bottom={isOpen ? "50%" : 0}
          transform={isOpen ? "translateY(50%) rotate(-45deg)" : "none"} transition="all 0.3s ease" />
      </Box>
    }
  />
);

const HeaderForCartAndAddress = ({ logoSrc, logoAlt = "Sotbella", loading = false }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const currentStep = useCheckoutStep();

  const toggleMenu = () => setIsOpen((v) => !v);
  const closeMenu = () => setIsOpen(false);

  useEffect(() => { closeMenu(); }, [location.pathname]);
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prev);
  }, [isOpen]);

  if (loading) return null;

  return (
    <Box as="nav" pos="fixed" top={0} left={0} w="full" zIndex={30} bg="white">
      {/* Top bar */}
      <Flex
        w="full"
        pos="relative"
        align="center"
        justify="space-between"
        px={{ base: "10px", lg: "50px" }}
        pt={{ base: "10px", lg: "20px" }}
        pb={{ base: 2, md: 3 }}
        bg={isOpen ? "white" : "transparent"}
      >
        {/* Left: Hamburger */}
        <Flex pos="relative" zIndex={20} align="center" gap={{ base: 0, md: "1vw" }}>
          {/* <Box mr={{ base: "7px", lg: "2px" }} pl={{ base: "10px", md: 0 }}>
            <Hamburger isOpen={isOpen} onClick={toggleMenu} />
          </Box> */}

          {/* Desktop logo */}
          {logoSrc && (
            <Box as={RouterLink} to="/" display={{ base: "none", md: "block" }}>
              <ChakraImage src={logoSrc} alt={logoAlt} h={{ md: "45px" }} w={{ lg: "70%", xl: "auto" }} loading="lazy" />
            </Box>
          )}
        </Flex>

        {/* Desktop progress bar */}
        <CheckoutProgress currentStep={currentStep} display={{ base: "none", md: "flex" }} />

        {/* Mobile centered logo */}
        {logoSrc && (
          <Box
            as={RouterLink}
            to="/"
            display={{ base: "flex", md: "none" }}
            // pos="absolute"
            // left="50%"
            transform="translateX(-100%)"
            zIndex={10}
            // pt={8}
          >
            <ChakraImage src={logoSrc} alt={logoAlt} h="30px" w="auto" loading="lazy" />
          </Box>
        )}
      </Flex>

      {/* Mobile progress bar */}
      {/* <CheckoutProgress
        currentStep={currentStep}
        display={{ base: "flex", md: "none" }}
        px="12px"
        pb="10px"
      /> */}

      {/* Menubar overlay */}
      {isOpen && <Menubar onClose={closeMenu} />}
    </Box>
  );
};

export default HeaderForCartAndAddress;
