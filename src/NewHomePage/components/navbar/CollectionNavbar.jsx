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
const Hamburger = ({ isOpen, onClick, onMouseEnter }) => {
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
            bg="black"
            borderRadius="1px"
            transition="all 0.3s ease"
            top={isOpen ? "50%" : 0}
            transform={isOpen ? "translateY(-50%) rotate(45deg)" : "none"}
          />
          <Box
            pos="absolute"
            w="100%"
            h="2px"
            bg="black"
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

const CollectionNavbar = ({ logoSrc, logoAlt = "Sotbella", loading = false }) => {
  const location = useLocation();

  // ✅ open states
  const [isOpen, setIsOpen] = useState(false); // hamburger click open (mostly mobile)
  const [isHoverOpen, setIsHoverOpen] = useState(false); // desktop hover open

  // ✅ which Level-1 should be active in Menubar
  const [activeLevel1Key, setActiveLevel1Key] = useState("new in");

  // ✅ control whether Menubar should show Level-1 column
  const [hideLevel1, setHideLevel1] = useState(true);

  const [isScrolled, setIsScrolled] = useState(false);

  // ✅ load level-1 menu for navbar
  const [menuData, setMenuData] = useState({});
  const [menuLoading, setMenuLoading] = useState(true);

  const { itemCount: cartCount, handleShow } = useUnifiedCartStore();
  const wishListProduct = useWishlistStore((s) => s.wishListProduct);
  const wishCount = Array.isArray(wishListProduct) ? wishListProduct.length : 0;

  const isDesktop = useBreakpointValue({ base: false, xl: true });

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

  const level1Keys = useMemo(() => Object.keys(menuData || {}), [menuData]);

  const hasChildrenForKey = (key) => {
    const cat = menuData?.[key];
    const subs = cat?.subcategories || cat?.categories || cat?.children;
    return Array.isArray(subs) && subs.length > 0;
  };

  // ✅ show menubar if either is open
  const shouldShowMenubar = isOpen || isHoverOpen;

  // ✅ lock body scroll when menu open (AND prevent layout shift)
  useEffect(() => {
    if (shouldShowMenubar) {
      const scrollBarWidth =
        window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";

      // ✅ prevents logo/header shifting when scrollbar disappears
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.paddingRight = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [shouldShowMenubar]);

  // ✅ hamburger click toggle (mobile)
  const toggleMenu = () => {
    setHideLevel1(false); // hamburger mode => show Level-1
    setIsOpen((prev) => !prev);
    setIsHoverOpen(false);
  };

  // ✅ hamburger hover (desktop)
  const handleHamburgerHover = () => {
    if (!isDesktop) return;
    setHideLevel1(false);
    setIsHoverOpen(true);
    setIsOpen(false);
  };

  if (loading) return <NavbarShimmer />;

  return (
    <Box
      as="nav"
      pos="fixed"
      top={0}
      left={0}
      w="full"
      zIndex={30}
      // ✅ keep background always white (as you asked)
      bg="white"
      pt={{ base: "10px", xl: "20px" }}
      pb={{ base: 0, xl: "10px" }}
      // ✅ close hover menu when mouse leaves entire navbar+dropdown
      onMouseLeave={() => setIsHoverOpen(false)}
    >
      <Flex
        w="full"
        pos="relative"
        align="center"
        justify="space-between"
        transition="all 0.4s ease-in-out"
        px={{ base: "5px", xl: "50px" }}
        bg="white"
      >
        {/* LEFT */}
        <Flex pos="relative" zIndex={20} align="center" gap={{ base: "0", xl: "1vw" }}>
          <Box mr={["7px", null, null, null, "2px"]} pl={{ base: "10px", xl: "0" }}>
            <Hamburger
              isOpen={isOpen || (isHoverOpen && !hideLevel1)}
              onClick={toggleMenu}
              onMouseEnter={handleHamburgerHover}
            />
          </Box>

          {/* ✅ BUG-1 FIX: remove mobile left logo completely */}
          {/* (do not render the mobile left logo here) */}

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
                  color="black"
                  fontWeight={700}
                  textTransform="uppercase"
                  cursor="pointer"
                  fontSize={{ base: "xs", xl: "12px", "2xl": "13px" }}
                  _hover={{ opacity: 0.8 }}
                  onMouseEnter={() => {
                    setActiveLevel1Key(key);

                    // ✅ only open dropdown if children exist
                    if (canOpenOnHover) {
                      setHideLevel1(true); // text-hover mode
                      setIsHoverOpen(true);
                      setIsOpen(false);
                    } else {
                      setIsHoverOpen(false);
                      setIsOpen(false);
                    }
                  }}
                  textDecoration={isActive && isHoverOpen && hideLevel1 ? "underline" : "none"}
                  textUnderlineOffset="6px"
                >
                  {label}
                </Text>
              );
            })}
        </Flex>

        {/* RIGHT */}
        <Flex pos="relative" zIndex={20} align="center" gap={["3vw", "2.5vw", null, "2vw", "2vw"]}>
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
              <path d="M17 17L21 21" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19C15.4183 19 19 15.4183 19 11Z" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
              <path d="M13 14H11C7.13401 14 4 17.134 4 21H20C20 17.134 16.866 14 13 14Z" stroke="#1D1D1D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="#1D1D1D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
              <path d="M10.4107 19.9677C7.58942 17.858 2 13.0348 2 8.69444C2 5.82563 4.10526 3.5 7 3.5C8.5 3.5 10 4 12 6C14 4 15.5 3.5 17 3.5C19.8947 3.5 22 5.82563 22 8.69444C22 13.0348 16.4106 17.858 13.5893 19.9677C12.6399 20.6776 11.3601 20.6776 10.4107 19.9677Z" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
            <HiOutlineShoppingBag />
          </Box>
        </Flex>

        {/* ✅ Center Logo (mobile + desktop) */}
        <Flex
          pos="absolute"
          inset={0}
          w="full"
          h="full"
          align="center"
          justify="center"
          pointerEvents="none"
          display="flex"
          zIndex={10}
        >
          {logoSrc && (
            <Box as={RouterLink} to="/" pointerEvents="auto">
              <ChakraImage
                src={logoSrc}
                alt={logoAlt}
                w={{ base: "120px", xl: ["15vw", null, null, null, "11vw"] }}
                h="auto"
                loading="lazy"
              />
            </Box>
          )}
        </Flex>
      </Flex>

      {/* ✅ show menubar (keeps navbar visible, same behavior as your Navbar) */}
      {shouldShowMenubar && (
        <Box onMouseEnter={() => setIsHoverOpen(true)}>
          <Menubar
            onClose={closeAllMenus}
            selectedKey={activeLevel1Key}
            onSelectKey={setActiveLevel1Key}
            hideLevel1={hideLevel1}
          />
        </Box>
      )}
    </Box>
  );
};

export default CollectionNavbar;
