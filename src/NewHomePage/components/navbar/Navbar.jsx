import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Flex,
  IconButton,
  Image as ChakraImage,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react";
import { HiOutlineShoppingBag } from "react-icons/hi2";
import Menubar from "../menubar/Menubar";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useUnifiedCartStore } from "@/context/unifiedCartStore";
import { useWishlistStore } from "@/context";

// ✅ menu api helpers
import {
  fetchMenuData,
  transformMenuData,
  getCategoryUrl,
} from "@/api/services/menuApi.js";

import { NavbarShimmer } from "@/components/layouts/Simmers/NavbarShimmer";

/** Minimal custom hamburger built with Chakra primitives */
const Hamburger = ({ isOpen, onClick, onMouseEnter, color = "black" }) => {
  return (
    <IconButton
      id="navbar-hamburger"
      aria-label="Toggle menu"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      variant="ghost"
      p={0}
      minW="auto"
      _hover={{ bg: "transparent" }}
      _active={{ bg: "transparent" }}
      icon={
        <Box pos="relative" w="20px" h="10px" transition="all 0.3s ease">
          <Box
            pos="absolute"
            w="100%"
            h="2px"
            bg={color}
            borderRadius="1px"
            transition="all 0.3s ease"
            top={isOpen ? "50%" : 0}
            transform={isOpen ? "translateY(-50%) rotate(45deg)" : "none"}
          />
          <Box
            pos="absolute"
            w="100%"
            h="2px"
            bg={color}
            borderRadius="1px"
            transition="all 0.3s ease"
            bottom={isOpen ? "50%" : 0}
            transform={isOpen ? "translateY(50%) rotate(-45deg)" : "none"}
          />
        </Box>
      }
    />
  );
};

const Navbar = ({ logoSrc, logoBlackSrc, logoAlt = "Sotbella", loading = false, navbarTextColor = "black", topOffset = 0 }) => {

  const location = useLocation();
  // ✅ open states
  const [isOpen, setIsOpen] = useState(false);       // hamburger click open (mostly mobile)
  const [isHoverOpen, setIsHoverOpen] = useState(false); // desktop hover open
  const [isNavbarHovered, setIsNavbarHovered] = useState(false); // ✅ NEW: general navbar hover

  // ✅ which Level-1 should be active in Menubar
  const [activeLevel1Key, setActiveLevel1Key] = useState("new in");

  // ✅ NEW: control whether Menubar should show Level-1 column
  // hamburger hover => show Level-1 (hideLevel1=false)
  // text hover => hide Level-1 (hideLevel1=true)
  const [hideLevel1, setHideLevel1] = useState(true);

  const [isScrolled, setIsScrolled] = useState(false);

  // ✅ load level-1 menu for navbar
  const [menuData, setMenuData] = useState({});
  const [menuLoading, setMenuLoading] = useState(true);

  const wishListProduct = useWishlistStore((s) => s.wishListProduct);
  const wishCount = Array.isArray(wishListProduct) ? wishListProduct.length : 0;

  // ✅ close everything
  const closeAllMenus = () => {
    setIsOpen(false);
    setIsHoverOpen(false);
  };

  // ✅ close on route change
  useEffect(() => {
    closeAllMenus();
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ✅ load menu from API once
  useEffect(() => {
    const loadMenu = async () => {
      try {
        setMenuLoading(true);
        const apiData = await fetchMenuData();
        const transformed = transformMenuData(apiData);
        setMenuData(transformed || {});

        const keys = Object.keys(transformed || {});
        if (keys.length && !keys.includes(activeLevel1Key)) {
          setActiveLevel1Key(keys[0]);
        }
      } catch (e) {
        setMenuData({});
      } finally {
        setMenuLoading(false);
      }
    };
    loadMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Fix: Ensure we show Permanent Basket on standard pages (Home, PDP, etc.)
  // If we came from Buy Now flow (Temporary Basket, we must revert to Permanent unless we are still in a flow that explicitly uses basketId
  const { itemCount: cartCount, handleShow, ensurePermanentBasket, basket } = useUnifiedCartStore();

  useEffect(() => {
    // If URL does NOT have basketId, we shouldn't be using a temporary basket
    // This ensures that hitting Home/Search/etc reverts to the main cart.
    if (!location.search.includes('basketId')) {
      ensurePermanentBasket();
    }
  }, [location.pathname, location.search, ensurePermanentBasket]);


  const level1Keys = useMemo(() => Object.keys(menuData || {}), [menuData]);

  // ✅ show menubar if either is open
  const shouldShowMenubar = isOpen || isHoverOpen;

  // ✅ Determine final active state (affects bg color, logo, text color)
  const isActiveState = shouldShowMenubar || isNavbarHovered;

  // ✅ Switch logo to black if active AND black logo is provided
  const currentLogoSrc = (isActiveState && logoBlackSrc) ? logoBlackSrc : logoSrc;

  // ✅ Switch text/icon color to black if active, otherwise use prop (usually white/black)
  const currentTextColor = isActiveState ? "black" : navbarTextColor;

  useEffect(() => {
    if (shouldShowMenubar) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [shouldShowMenubar]);


  // ✅ hamburger click toggle (mobile)
  const toggleMenu = () => {
    setHideLevel1(false); // hamburger mode => show Level-1
    setIsOpen((prev) => !prev);
    setIsHoverOpen(false);
  };


  const isDesktop = useBreakpointValue({ base: false, xl: true });

  // ✅ hamburger hover (desktop)
  const handleHamburgerHover = () => {
    if (!isDesktop) return;
    setHideLevel1(false);
    setIsHoverOpen(true);
    setIsOpen(false);
  };

  const hasChildrenForKey = (key) => {
    const cat = menuData?.[key];
    const subs = cat?.subcategories || cat?.categories || cat?.children;
    return Array.isArray(subs) && subs.length > 0;
  };


  if (loading) return <NavbarShimmer />;

  return (
    <Box
      as="nav"
      pos="fixed"
      // top={-1}
      top={topOffset}
      left={0}
      w="full"
      zIndex={30}
      // pt={isScrolled ? { base: "0", xl: "0" } : { base: "40px", xl: "40px" }}

      // ✅ Handle hover state for entire navbar
      onMouseEnter={() => setIsNavbarHovered(true)}
      onMouseLeave={() => {
        setIsNavbarHovered(false);
        setIsHoverOpen(false); // existing close logic
      }}
    >
      <Flex
        w="full"
        pos="relative"
        align="center"
        justify="space-between"
        transition="all 0.4s ease-in-out"
        px={{ base: "5px", xl: "50px" }}
        pt={{ base: "10px", xl: "20px" }}
        bg={isActiveState ? "white" : "transparent"} // ✅ Change bg on active
      >
        {/* LEFT */}
        <Flex pos="relative" zIndex={20} align="center" gap={{ base: "0", xl: "1vw" }}>
          <Box mr={["7px", null, null, null, "2px"]} pl={{ base: "10px", xl: "0" }}>
            <Hamburger
              isOpen={isOpen || (isHoverOpen && !hideLevel1)}
              onClick={toggleMenu}
              onMouseEnter={handleHamburgerHover} // ✅ NEW: hover shows Level-1
              color={currentTextColor} // ✅ Dynamic color
            />
          </Box>

          {/* MOBILE LEFT LOGO */}
          {/* {logoSrc && (
            <Box as={RouterLink} to="/" display={{ base: "block", xl: "none" }}>
              <ChakraImage src={logoSrc} alt={logoAlt} h="40px" w="auto" loading="lazy" />
            </Box>
          )} */}

          {/* ✅ Dynamic Level-1 links (desktop only) */}
          {!menuLoading &&
            level1Keys.map((key) => {
              const cat = menuData[key];
              const label = (cat?.name || key).toString();
              const id = cat?.id || label.replace(/\s+/g, "_").toLowerCase();
              const url = getCategoryUrl(id);

              const isActive = key === activeLevel1Key;
              const canOpenOnHover = hasChildrenForKey(key);

              return (
                <Text
                  key={key}
                  as={RouterLink}
                  to={url}
                  display={{ base: "none", xl: "flex" }}
                  color={currentTextColor} // ✅ Dynamic color
                  fontWeight={700}
                  textTransform="uppercase"
                  cursor="pointer"
                  fontSize={{ base: "xs", xl: "12px", "2xl": "13px" }}
                  _hover={{ opacity: 0.8 }}
                  onMouseEnter={() => {
                    setActiveLevel1Key(key);

                    // ✅ Only open dropdown on hover if children exist
                    if (canOpenOnHover) {
                      setHideLevel1(true);     // text-hover mode
                      setIsHoverOpen(true);
                      setIsOpen(false);
                    } else {
                      // ✅ No categories => DON'T open dropdown
                      setIsHoverOpen(false);
                      setIsOpen(false);
                    }
                  }}
                  textDecoration={
                    isActive && isHoverOpen && hideLevel1 ? "underline" : "none"
                  }
                  textUnderlineOffset="6px"
                >
                  {label}
                </Text>
              );
            })}

        </Flex>

        {/* RIGHT */}
        {/* ... (commented out section omitted for brevity) ... */}

        {/* RIGHT */}
        <Flex
          pos="relative"
          zIndex={20}
          align="center"
          gap={["3vw", "2.5vw", null, "2vw", "2vw"]}
        >
          {/* Search (mobile + desktop) */}
          <Box
            as={RouterLink}
            to="/search"
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontSize="23px"
            cursor="pointer"
            _hover={{ opacity: 0.8 }}
            aria-label="Search"
            id="search-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M17 17L21 21" stroke={currentTextColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19C15.4183 19 19 15.4183 19 11Z" stroke={currentTextColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Box>

          {/* ✅ Login (desktop only) */}
          <Box
            as={RouterLink}
            to="/order"
            display={{ base: "none", xl: "flex" }}
            alignItems="center"
            justifyContent="center"
            fontSize="23px"
            aria-label="Account"
            id="loginAndprofile-btn"
            cursor="pointer"
            _hover={{ opacity: 0.8 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M13 14H11C7.13401 14 4 17.134 4 21H20C20 17.134 16.866 14 13 14Z" stroke={currentTextColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke={currentTextColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Box>

          {/* ✅ Wishlist (desktop only) */}
          <Box
            as={RouterLink}
            to="/wishlist"
            display={{ base: "none", xl: "flex" }}
            alignItems="center"
            justifyContent="center"
            fontSize="23px"
            aria-label="Wishlist"
            id="wishlist-btn"
            pos="relative"
            cursor="pointer"
          >
            {wishCount > 0 && (
              <Box
                as="span"
                pos="absolute"
                top="-6px"
                right="-8px"
                w="18px"
                h="18px"
                bg="black"
                color="white"
                borderRadius="full"
                fontSize="10px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                zIndex={10}
              >
                {wishCount}
              </Box>
            )}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M10.4107 19.9677C7.58942 17.858 2 13.0348 2 8.69444C2 5.82563 4.10526 3.5 7 3.5C8.5 3.5 10 4 12 6C14 4 15.5 3.5 17 3.5C19.8947 3.5 22 5.82563 22 8.69444C22 13.0348 16.4106 17.858 13.5893 19.9677C12.6399 20.6776 11.3601 20.6776 10.4107 19.9677Z" stroke={currentTextColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Box>

          {/* Cart (mobile + desktop) */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontSize="20px"
            pr={{ base: "10px", xl: "0" }}
            aria-label="Cart"
            id="cart-btn"
            pos="relative"
            cursor="pointer"
            onClick={handleShow}
          >
            {cartCount > 0 && (
              <Box
                as="span"
                pos="absolute"
                top="-6px"
                right={{ base: "1px", xl: "-8px" }}
                w="18px"
                h="18px"
                bg="black"
                color="white"
                borderRadius="full"
                fontSize="10px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                zIndex={10}
              >
                {cartCount}
              </Box>
            )}
            <HiOutlineShoppingBag color={currentTextColor} />
          </Box>
        </Flex>




        {/* CENTER LOGO */}
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
          {currentLogoSrc && (
            <Box as={RouterLink} to="/" pointerEvents="auto">
              <ChakraImage
                src={currentLogoSrc}
                alt={logoAlt}
                w={{ base: "120px", xl: ["15vw", null, null, null, "11vw"] }}
                h="auto"
                loading="lazy"
                pt={{ base: "0px", xl: "20px" }}
              />
            </Box>
          )}
        </Flex>

      </Flex>

      {/* ✅ show menubar */}
      {shouldShowMenubar && (
        <Box onMouseEnter={() => setIsHoverOpen(true)}>
          <Menubar
            onClose={closeAllMenus}
            selectedKey={activeLevel1Key}
            onSelectKey={setActiveLevel1Key}
            hideLevel1={hideLevel1} // ✅ key point
          />
        </Box>
      )}
    </Box>
  );
};

export default Navbar;
