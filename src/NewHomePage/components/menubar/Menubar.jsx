import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Box,
  Flex,
  VStack,
  Text,
  UnorderedList,
  ListItem,
  Image as ChakraImage,
  useBreakpointValue,
  HStack,
  Link as CLink,
  Image,
} from "@chakra-ui/react";
import { fetchMenuData, transformMenuData, getCategoryUrl } from "@/api/services/menuApi.js";
import { Link } from "react-router-dom";
import {
  ContentShimmer,
  MobileCategoryPanelShimmer,
  MobileRootMenuShimmer,
  SidebarShimmer,
} from "../../../components/layouts/Simmers/MenubarShimmers";

import InstaIcon from "../../../assets/images/socialicons/instagram.png";
import FbIcon from "../../../assets/images/socialicons/facebook.png";
import PinterestIcon from "../../../assets/images/socialicons/pinterest.png";
import YtIcon from "../../../assets/images/socialicons/youtube.png";
import { useAuth } from "@/context/AuthContext";
import { useWishlistStore } from "@/context";
import { useFooter } from "@/Hooks/FooterContext.jsx";

const defaultImage = "https://via.placeholder.com/300x400?text=Image";

/* ---------------------------
   ✅ MOBILE: Root list (first screen)
   --------------------------- */
function MobileRootMenu({ items = [], categoriesData = {}, onSelect, onClose }) {
  const { isAuthenticated, user } = useAuth();
  const wishListProduct = useWishlistStore((s) => s.wishListProduct);
  const wishCount = Array.isArray(wishListProduct) ? wishListProduct.length : 0;

  const { footerData } = useFooter();

  const newsletter = Array.isArray(footerData?.["NEWSLETTER SIGNUP"])
    ? footerData["NEWSLETTER SIGNUP"]
    : [];

  const collaborateItem = newsletter?.[2] || {};
  const collaborateText = collaborateItem.label || "";
  const collaborateHref = collaborateItem.href || collaborateItem.link || "";

  return (
    <Box
      w="100%"
      // bg="#FBF6F0"
      bg="#fbf9f7ff"

      // ✅ HIGHLIGHT: use dvh so bottom doesn't get cut on some mobiles
      h="100dvh"
      overflowY="auto"
      overflowX="hidden"
      // ✅ HIGHLIGHT: safe bottom padding so last elements are always reachable
      pb="calc(env(safe-area-inset-bottom) + 24px)"
      // ✅ HIGHLIGHT: smoother/safer mobile scrolling
      sx={{
        WebkitOverflowScrolling: "touch",
        overscrollBehavior: "contain",
      }}
    >
      <VStack align="stretch" spacing={0} mt="2">
        {items.map((item) => {
          const key =
            typeof item === "string" ? item : item?.name || item?.key || "";
          const id =
            typeof item === "object"
              ? item.id || key.replace(/\s+/g, "_").toLowerCase()
              : key.replace(/\s+/g, "_").toLowerCase();

          const url = getCategoryUrl(id);

          const node = categoriesData?.[key];
          const hasChildren =
            (node?.subcategories && node.subcategories.length > 0) ||
            (node?.categories && node.categories.length > 0) ||
            (node?.children && node.children.length > 0);

          return (
            <Flex
              key={`${id}-${key}`} // ✅ minor safety improvement for keys
              align="center"
              justify="space-between"
              px="4"
              py="3.5"
              borderColor="#EFE9E0"
              cursor="pointer"
              onClick={() => {
                if (hasChildren) onSelect?.(key);
              }}
            >
              {!hasChildren ? (
                <Link to={url} onClick={onClose} style={{ width: "100%" }}>
                  <Text fontSize="sm" textTransform="uppercase" letterSpacing="0.04em">
                    {key}
                  </Text>
                </Link>
              ) : (
                <Text fontSize="sm" textTransform="uppercase" letterSpacing="0.04em">
                  {key}
                </Text>
              )}

              {hasChildren ? (
                <Box
                  as="button"
                  aria-label="Open"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect?.(key);
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M9 5l7 7-7 7"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Box>
              ) : (
                <Box w="16px" />
              )}
            </Flex>
          );
        })}
      </VStack>

      {/* Bottom section */}
      <Box px="4" pt="5">
        <Box borderTop="1px solid" borderColor="#EFE9E0" mb="4" />

        <VStack align="stretch" spacing="5" pt={8}>
          <Link to="/mobileacount" onClick={onClose} style={{ width: "100%" }}>
            <Flex
              align="center"
              justify="space-between"
              w="100%"
              cursor="pointer"
              _hover={{ opacity: 0.8 }}
            >
              <Text fontSize="sm" letterSpacing="0.04em">
                {isAuthenticated ? "Hi, " + user?.firstName : "LOG IN"}
              </Text>

              {isAuthenticated && (
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="23px"
                  aria-label="Account"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M13 14H11C7.13401 14 4 17.134 4 21H20C20 17.134 16.866 14 13 14Z"
                      stroke="#1D1D1D"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
                      stroke="#1D1D1D"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Box>
              )}
            </Flex>
          </Link>

          <Link to="/wishlist" onClick={onClose} style={{ width: "100%" }}>
            <Flex
              align="center"
              justify="space-between"
              w="100%"
              cursor="pointer"
              _hover={{ opacity: 0.8 }}
            >
              <Text fontSize="13px" letterSpacing="0.04em">
                WISHLIST
              </Text>

              {wishCount > 0 && (
                <Box position="relative" display="flex" alignItems="center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12.1 20.3l-.1.1-.1-.1C7.14 16.36 4 13.39 4 9.75
                         4 7.24 5.99 5.25 8.5 5.25
                         c1.54 0 3.04.74 4 1.91
                         0.96-1.17 2.46-1.91 4-1.91
                         2.51 0 4.5 1.99 4.5 4.5
                         0 3.64-3.14 6.61-7.9 10.55Z"
                      stroke="#1D1D1D"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                  <Box
                    position="absolute"
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
                  >
                    {wishCount}
                  </Box>
                </Box>
              )}
            </Flex>
          </Link>

          {collaborateText &&
            (collaborateHref ? (
              <CLink
                href={collaborateHref}
                isExternal
                fontSize="sm"
                letterSpacing="wide"
                // textDecoration={{ base: "underline" }}
              >
                {collaborateText}
              </CLink>
            ) : (
              <Text
                fontSize="sm"
                letterSpacing="wide"
                // textDecoration={{ base: "underline" }}
              >
                {collaborateText}
              </Text>
            ))}
        </VStack>

        <HStack spacing={6} w="100%" pt="10" pb={7}>
          <CLink href="https://www.facebook.com/sotbellastyle/" isExternal aria-label="Facebook">
            <Image src={FbIcon} alt="Facebook" h="22px" w="22px" />
          </CLink>

          <CLink
            href="https://www.instagram.com/accounts/login/?next=%2Fsotbella_in%2F&source=omni_redirect&hl=en"
            isExternal
            aria-label="Instagram"
          >
            <Image src={InstaIcon} alt="Instagram" h="22px" w="22px" />
          </CLink>

          <CLink href="https://in.pinterest.com/sotbella/" isExternal aria-label="Pinterest">
            <Image src={PinterestIcon} alt="Pinterest" h="22px" w="22px" />
          </CLink>

          <CLink href="https://www.youtube.com/@Sotbella" isExternal aria-label="YouTube">
            <Image src={YtIcon} alt="YouTube" h="22px" w="22px" />
          </CLink>
        </HStack>
      </Box>
    </Box>
  );
}

/* ---------------------------
   ✅ MOBILE: Category detail (Level-2 + Level-3 drilldown)
   --------------------------- */
function MobileCategoryPanel({
  title = "NEW IN",
  images = [],
  subcategories = [],
  onBack,
  onClose,
}) {
  const labels = subcategories.map((sub) => sub?.name || sub).slice(0, 3);

  const [step, setStep] = useState("level2");
  const [selectedLevel2, setSelectedLevel2] = useState(null);

  const level3List = useMemo(() => {
    if (!selectedLevel2) return [];
    return (
      selectedLevel2?.categories ||
      selectedLevel2?.subcategories ||
      selectedLevel2?.children ||
      []
    );
  }, [selectedLevel2]);

  useEffect(() => {
    setStep("level2");
    setSelectedLevel2(null);
  }, [title]);

  const handleBack = () => {
    if (step === "level3") {
      setStep("level2");
      setSelectedLevel2(null);
      return;
    }
    onBack?.();
  };

  // ✅ HIGHLIGHT: single wrapper so both Level2 & Level3 use dvh + padding
  const MobileWrapper = ({ children }) => (
    <Box
      w="100%"
      bg="#fbf9f7ff"
      // bg="#FBF6F0"
      h="100dvh" // ✅ HIGHLIGHT
      overflowY="auto"
      overflowX="hidden"
      pb="calc(env(safe-area-inset-bottom) + 100px)" // ✅ HIGHLIGHT
      sx={{
        WebkitOverflowScrolling: "touch",
        overscrollBehavior: "contain",
      }}
    >
      {children}
    </Box>
  );

  // -------------------------
  // LEVEL 3 SCREEN
  // -------------------------
  if (step === "level3") {
    const level3Title = selectedLevel2?.name || title;

    return (
      <MobileWrapper>
        <Flex
          h="48px"
          align="center"
          justify="space-between"
          px="4"
          borderBottom="1px solid"
          borderColor="#E8E2D9"
          bg="white"
          pos="sticky"
          top="0"
          zIndex={10}
        >
          <Box as="button" aria-label="Back" onClick={handleBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 19L8 12L15 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Box>

          <Text
            fontSize="sm"
            fontWeight="semibold"
            textTransform="uppercase"
            letterSpacing="0.06em"
          >
            {level3Title}
          </Text>

          <Box w="16px" />
        </Flex>

        <Box px="4" pt="3" pb="2">
          <Box w="100%" mx="auto" borderBottom="1px solid #000">
            <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.06em">
              {level3Title}
            </Text>
          </Box>
        </Box>

        {level3List.length > 0 ? (
          <VStack align="stretch" spacing={0} px="4">
            {level3List.map((lvl3, i) => {
              const lvl3Name = lvl3?.name || "";
              const lvl3Id =
                lvl3?.id || lvl3Name.replace(/\s+/g, "_").toLowerCase();
              const lvl3Url = getCategoryUrl(lvl3Id);

              return (
                <Link key={`${lvl3Id}-${i}`} to={lvl3Url} onClick={onClose}>
                  <Flex
                    align="center"
                    py="3.5"
                    borderBottom="1px solid"
                    borderColor="#EFE9E0"
                    _hover={{ bg: "#f0f0f0" }}
                  >
                    <Text fontSize="13px">{lvl3Name}</Text>
                  </Flex>
                </Link>
              );
            })}
          </VStack>
        ) : (
          <Box px="4" py="8" textAlign="center">
            <Text fontSize="sm" color="gray.500">
              No subcategories available
            </Text>
          </Box>
        )}
      </MobileWrapper>
    );
  }

  // -------------------------
  // LEVEL 2 SCREEN
  // -------------------------
  return (
    <MobileWrapper>
      <Flex
        h="48px"
        align="center"
        justify="space-between"
        px="4"
        borderBottom="1px solid"
        borderColor="#E8E2D9"
        bg="white"
        pos="sticky"
        top="0"
        zIndex={10}
      >
        <Box as="button" aria-label="Back" onClick={handleBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 19L8 12L15 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Box>

        <Text
          fontSize="13px"
          fontWeight="semibold"
          textTransform="uppercase"
          letterSpacing="0.06em"
        >
          {title}
        </Text>

        <Box w="16px" />
      </Flex>

      <Box px="4" pt="3" pb="2">
        <Box w="100%" mx="auto" borderBottom="1px solid #000">
          <Text fontSize="10px" textTransform="uppercase" letterSpacing="0.06em">
            {title}
          </Text>
        </Box>
      </Box>

      <Box px="4" py="3">
        <Flex
          gap="3"
          overflowX="auto"
          pb="2"
          sx={{ "&::-webkit-scrollbar": { display: "none" } }}
        >
          {(images.length ? images : [defaultImage]).map((src, i) => {
            const sub = subcategories[i];
            const subName = typeof sub === "string" ? sub : sub?.name || title;
            const subId =
              typeof sub === "object"
                ? sub.id || subName.replace(/\s+/g, "_").toLowerCase()
                : subName.replace(/\s+/g, "_").toLowerCase();

            const subUrl = getCategoryUrl(subId);

            return (
              <Link key={`${subId}-${i}`} to={subUrl} onClick={onClose}>
                <Box minW="136px">
                  <Text mb="2" fontSize="xs">
                    {labels[i] || subName || ""}
                  </Text>
                  <ChakraImage
                    src={src || defaultImage}
                    alt={labels[i] || subName || "Image"}
                    w="136px"
                    h="170px"
                    objectFit="cover"
                    objectPosition="top"
                    bg="#f5f5f5"
                  />
                </Box>
              </Link>
            );
          })}
        </Flex>
      </Box>

      {subcategories.length > 0 ? (
        <VStack align="stretch" spacing={0} px="4">
          {subcategories.map((s, i) => {
            const item = typeof s === "string" ? { name: s } : s;
            const text = item?.name || "";
            const subcategoryId =
              item?.id || text.replace(/\s+/g, "_").toLowerCase();
            const subcategoryUrl = getCategoryUrl(subcategoryId);

            const hasChildren =
              (item?.categories && item.categories.length > 0) ||
              (item?.subcategories && item.subcategories.length > 0) ||
              (item?.children && item.children.length > 0);

            return (
              <Flex
                key={`${subcategoryId}-${i}`}
                align="center"
                justify="space-between"
                py="3.5"
                borderBottom="1px solid"
                borderColor="#EFE9E0"
                _hover={{ bg: "#f0f0f0" }}
                cursor={hasChildren ? "pointer" : "default"}
                onClick={() => {
                  if (hasChildren) {
                    setSelectedLevel2(item);
                    setStep("level3");
                  }
                }}
              >
                {!hasChildren ? (
                  <Link
                    to={subcategoryUrl}
                    onClick={onClose}
                    style={{ width: "100%" }}
                  >
                    <Text fontSize="13px">{text}</Text>
                  </Link>
                ) : (
                  <>
                    <Text fontSize="13px">{text}</Text>
                    <Box as="span">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        style={{ transform: "rotate(180deg)" }}
                      >
                        <path
                          d="M15 19L8 12L15 5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </Box>
                  </>
                )}
              </Flex>
            );
          })}
        </VStack>
      ) : (
        <Box px="4" py="8" textAlign="center">
          <Text fontSize="sm" color="gray.500">
            No subcategories available
          </Text>
        </Box>
      )}
    </MobileWrapper>
  );
}

/* ---------------------------
   DESKTOP/TABLET (UNCHANGED)
   --------------------------- */
const Menubar = ({
  onBack = () => {},
  onClose = () => {},
  selectedKey: externalSelectedKey = null,
  onSelectKey = null,
  hideLevel1 = false,
}) => {
  const isMobile = useBreakpointValue({ base: true, xl: false });
  const imageCardW = useBreakpointValue({ base: "70vw", md: "18vw", lg: "17vw" });

  const [mobileView, setMobileView] = useState("root");
  const [selectedKey, setSelectedKey] = useState(null);
  const effectiveSelectedKey = externalSelectedKey ?? selectedKey;

  const [currentSidebarLink, setCurrentSidebarLink] = useState("new in");
  const [categoriesData, setCategoriesData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [hoveredSubcategory, setHoveredSubcategory] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const apiData = await fetchMenuData();
        const transformed = transformMenuData(apiData);
        setCategoriesData(transformed);
        setError(null);
      } catch (e) {
        setCategoriesData({});
        setError(e?.message || "Failed to load menu data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const sideBarlinks = Object.keys(categoriesData);

  const currentKey = isMobile
    ? (effectiveSelectedKey || currentSidebarLink)
    : (hideLevel1 ? (effectiveSelectedKey || currentSidebarLink) : currentSidebarLink);

  const currentCategory = categoriesData[currentKey] || {
    sideLinks: true,
    images: [defaultImage],
    subcategories: [],
    name: currentKey,
    id: currentKey.replace(/\s+/g, "_").toLowerCase(),
  };

  const displayImages =
    currentCategory.images?.length > 0 ? currentCategory.images : [defaultImage];

  useEffect(() => {
    const first = currentCategory?.subcategories?.[0] || null;
    setHoveredSubcategory(first);
  }, [currentKey, currentCategory?.subcategories]);

  const level3List = useMemo(() => {
    const h = hoveredSubcategory;
    if (!h) return [];
    return h?.categories || h?.subcategories || h?.children || [];
  }, [hoveredSubcategory]);

  if (isMobile) {
    if (loading) {
      if (mobileView === "root") return <MobileRootMenuShimmer />;
      return <MobileCategoryPanelShimmer />;
    }

    if (mobileView === "root") {
      return (
        <MobileRootMenu
          items={sideBarlinks.map((name) => ({
            name,
            id: categoriesData[name]?.id || name.replace(/\s+/g, "_").toLowerCase(),
          }))}
          categoriesData={categoriesData}
          onSelect={(key) => {
            setSelectedKey(key);
            setCurrentSidebarLink(key);
            onSelectKey?.(key);
            setMobileView("category");
          }}
          onClose={onClose}
        />
      );
    }

    return (
      <MobileCategoryPanel
        title={(currentCategory.name || currentKey).toUpperCase()}
        images={displayImages}
        subcategories={currentCategory.subcategories || []}
        onBack={() => {
          setMobileView("root");
          setSelectedKey(null);
        }}
        onClose={onClose}
      />
    );
  }

  return (
    <Flex w="full" align="stretch">
      {!hideLevel1 && (
        <Box w="22%" bg="#f7f7f7" py="2vw" px="3vw">
          {loading ? (
            <SidebarShimmer />
          ) : (
            <UnorderedList listStyleType="none" m={0} p={0}>
              <VStack align="flex-start" spacing="1vw">
                {sideBarlinks.map((val) => {
                  const categoryId =
                    categoriesData[val]?.id || val.replace(/\s+/g, "_").toLowerCase();
                  const categoryUrl = getCategoryUrl(categoryId);

                  return (
                    <ListItem key={val}>
                      <Link to={categoryUrl} onClick={onClose}>
                        <Text
                          color="#747474"
                          textTransform="uppercase"
                          fontSize="13px"
                          fontWeight={700}
                          cursor="pointer"
                          w="fit-content"
                          textUnderlineOffset="6px"
                          _hover={{ textDecoration: "underline", color: "#4e4c4c" }}
                          onMouseEnter={() => setCurrentSidebarLink(val)}
                        >
                          {val}
                        </Text>
                      </Link>
                    </ListItem>
                  );
                })}
              </VStack>
            </UnorderedList>
          )}
        </Box>
      )}

      {loading ? (
        <ContentShimmer />
      ) : error ? (
        <Flex w={hideLevel1 ? "100%" : "78%"} bg="#eae9e3" p="2vw" align="center" justify="center">
          <Text color="red.500" fontSize="1.2vw">
            Failed to load menu: {error}
          </Text>
        </Flex>
      ) : sideBarlinks.length === 0 ? (
        <Flex w={hideLevel1 ? "100%" : "78%"} bg="#eae9e3" p="2vw" align="center" justify="center">
          <Text color="gray.500" fontSize="1.2vw">
            No menu categories available
          </Text>
        </Flex>
      ) : (
        <Flex w={hideLevel1 ? "100%" : "78%"} bg="#eae9e3" p="2vw" gap="1.5vw" overflow="hidden">
          {currentCategory.sideLinks && currentCategory.subcategories?.length > 0 && (
            <Box flex="1">
              <Box borderBottom="1px solid" borderColor="black" mb="1.3vw" w="80%" pb="0.5vw">
                <Text color="#33302f" textTransform="uppercase" fontSize="13px" fontWeight={700} w="full">
                  {currentCategory.name || currentKey}
                </Text>
              </Box>

              <VStack align="flex-start" spacing="1vw">
                {currentCategory.subcategories.map((subcategory) => {
                  const subcategoryName = subcategory?.name || "";
                  const subcategoryId =
                    subcategory?.id || subcategoryName.replace(/\s+/g, "_").toLowerCase();
                  const subcategoryUrl = getCategoryUrl(subcategoryId);

                  return (
                    <Flex key={subcategoryId} onMouseEnter={() => setHoveredSubcategory(subcategory)} w="full">
                      <Link to={subcategoryUrl} onClick={onClose}>
                        <Text
                          color="#33302f"
                          textTransform="uppercase"
                          fontWeight="light"
                          fontSize="13px"
                          cursor="pointer"
                          w="fit-content"
                          textUnderlineOffset="6px"
                          _hover={{ textDecoration: "underline", color: "#4e4c4c" }}
                        >
                          {subcategoryName}
                        </Text>
                      </Link>
                    </Flex>
                  );
                })}
              </VStack>
            </Box>
          )}

          {level3List?.length > 0 && (
            <Box flex="1">
              <Box borderBottom="1px solid" borderColor="black" mb="1.3vw" w="80%" pb="0.5vw">
                <Text color="#33302f" textTransform="uppercase" fontSize="13px" fontWeight={700} w="full">
                  {hoveredSubcategory?.name || ""}
                </Text>
              </Box>

              <VStack align="flex-start" spacing="1vw">
                {level3List.map((lvl3) => {
                  const lvl3Name = lvl3?.name || "";
                  const lvl3Id = lvl3?.id || lvl3Name.replace(/\s+/g, "_").toLowerCase();
                  const lvl3Url = getCategoryUrl(lvl3Id);

                  return (
                    <Link key={lvl3Id} to={lvl3Url} onClick={onClose}>
                      <Text
                        color="#33302f"
                        textTransform="uppercase"
                        fontWeight="light"
                        fontSize="13px"
                        cursor="pointer"
                        w="fit-content"
                        textUnderlineOffset="6px"
                        _hover={{ textDecoration: "underline", color: "#4e4c4c" }}
                      >
                        {lvl3Name}
                      </Text>
                    </Link>
                  );
                })}
              </VStack>
            </Box>
          )}

          <Box flex="3" overflowX="auto" overflowY="hidden" className="scrollbar-hide">
            <Flex gap="1.5vw">
              <AnimatePresence mode="popLayout">
                {displayImages.map((src, i) => {
                  const subcategory = currentCategory.subcategories?.[i];
                  const imageLabel = subcategory?.name || currentCategory.name || "Category";

                  return (
                    <Box
                      as={motion.div}
                      key={`${currentKey}-${src}-${i}`}
                      flex={`0 0 ${imageCardW}`}
                      minW={imageCardW}
                      layout
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                      <Text fontSize="1vw" mb="10px">
                        {imageLabel}
                      </Text>

                      <Link
                        to={getCategoryUrl(
                          subcategory?.id ||
                            currentCategory.id ||
                            currentKey.replace(/\s+/g, "_").toLowerCase()
                        )}
                        onClick={onClose}
                      >
                        <ChakraImage
                          src={src || defaultImage}
                          alt={imageLabel}
                          w="100%"
                          h="22vw"
                          objectFit="cover"
                          objectPosition="top"
                          cursor="pointer"
                          transition="all 0.1s linear"
                          _hover={{ border: "1px solid", borderColor: "black" }}
                        />
                      </Link>
                    </Box>
                  );
                })}
              </AnimatePresence>
            </Flex>
          </Box>
        </Flex>
      )}
    </Flex>
  );
};

export default Menubar;
