export const NavbarShimmer = () => (
  <Box as="nav" pos="fixed" top={0} left={0} w="full" zIndex={30}>
    <Flex
      w="full"
      pos="relative"
      align="center"
      justify="space-between"
      transition="all 0.4s ease-in-out"
      px={{ base: "5px", md: "50px" }}
      pt={{ base: "10px", md: "20px" }}
      pb={{ base: "10px", md: "20px" }}
      bg="white"
    >
      {/* LEFT (hamburger + desktop links shimmer) */}
      <Flex pos="relative" zIndex={20} align="center" gap={{ base: "0", md: "1vw" }}>
        {/* hamburger */}
        <Box mr={{ base: "7px", md: "2px" }} pl={{ base: "10px", md: "0" }}>
          <Box
            className="shimmer"
            w={{ base: "28px", md: "22px" }}
            h={{ base: "20px", md: "16px" }}
            borderRadius="4px"
          />
        </Box>

        {/* desktop nav items only */}
        <Flex display={{ base: "none", md: "flex" }} gap="16px">
          <Box className="shimmer" w="60px" h="12px" borderRadius="6px" />
          <Box className="shimmer" w="80px" h="12px" borderRadius="6px" />
          <Box className="shimmer" w="70px" h="12px" borderRadius="6px" />
          <Box className="shimmer" w="50px" h="12px" borderRadius="6px" />
        </Flex>
      </Flex>

      {/* RIGHT (icons shimmer) */}
      <Flex
        pos="relative"
        zIndex={20}
        align="center"
        gap={{ base: "12px", md: "20px" }}
        pr={{ base: "10px", md: "0" }}
      >
        {/* Search */}
        <Box className="shimmer" w={{ base: "22px", md: "20px" }} h={{ base: "22px", md: "20px" }} borderRadius="50%" />

        {/* Account (desktop only) */}
        <Box
          display={{ base: "none", md: "block" }}
          className="shimmer"
          w="20px"
          h="20px"
          borderRadius="50%"
        />

        {/* Wishlist (desktop only) */}
        <Box
          display={{ base: "none", md: "block" }}
          className="shimmer"
          w="20px"
          h="20px"
          borderRadius="50%"
        />

        {/* Cart */}
        <Box className="shimmer" w={{ base: "22px", md: "20px" }} h={{ base: "22px", md: "20px" }} borderRadius="50%" />
      </Flex>

      {/* CENTER LOGO (same as real navbar) */}
      <Flex
        pos="absolute"
        inset={0}
        w="full"
        h="full"
        align="center"
        justify="center"
        pointerEvents="none"
        display="flex"
        zIndex={25}
      >
        <Box
          className="shimmer"
          w={{ base: "120px", md: ["15vw", null, null, null, "11vw"] }}
          h={{ base: "28px", md: "40px" }}
          borderRadius="8px"
        />
      </Flex>
    </Flex>
  </Box>
);
