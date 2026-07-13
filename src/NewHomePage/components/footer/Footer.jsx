import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Container,
  SimpleGrid,
  GridItem,
  Heading,
  Text,
  Stack,
  Link as CLink,
  InputGroup,
  Input,
  InputRightElement,
  IconButton,
  HStack,
  Image,
  Divider,
  Flex,
  Collapse,
  Button,
  useBreakpointValue,
  Spinner,
} from "@chakra-ui/react";

import InstaIcon from "../../../assets/images/socialicons/instagram.png";
import FbIcon from "../../../assets/images/socialicons/facebook.png";
import PinterestIcon from "../../../assets/images/socialicons/pinterest.png";
import YtIcon from "../../../assets/images/socialicons/youtube.png";
import { HiOutlineArrowRight } from "react-icons/hi2";
import { Link as RouterLink, useLocation } from "react-router-dom";

import Apay from "../../../assets/images/payment-icon/Apay.avif";
import Gpay from "../../../assets/images/payment-icon/Gpay.avif";
import Master from "../../../assets/images/payment-icon/Master.avif";
import Visa from "../../../assets/images/payment-icon/Visa.avif";

import { subscribeToNewsletter } from "../../../api/services/newsletter";
import { fetchHomePageContent } from "@/api/services/homeapi";
import { LOCAL_KEYS } from "@/constants/localStorageKeys";
import FeatureIn from "../FeatureIn/FeatureIn";
import Usp from "../usp/Usp";

const SOCIAL_ICON_MAP = {
  facebook: FbIcon,
  instagram: InstaIcon,
  pintrest: PinterestIcon,
  pinterest: PinterestIcon,
  youtube: YtIcon,
};

const SUBSCRIBE_SESSION_KEY = "SB_NEWSLETTER_SUBSCRIBED";
const SUBSCRIBE_SESSION_MSG_KEY = "SB_NEWSLETTER_SUBSCRIBE_MSG";
const SUBSCRIBE_SESSION_STATUS_KEY = "SB_NEWSLETTER_SUBSCRIBE_STATUS";


/* ---------- Helpers to support BOTH formats ----------
   Old format:
     footerData["SHOP"] = [{label, href}, ...]
   New format:
     footerData["SHOP"] = { heading: "SHOP", option: [{label, href}, ...] }
------------------------------------------------------ */
const getFooterSection = (footerData, key) => {
  const section = footerData?.[key];
  if (!section) return { heading: "", items: [] };

  // New format: object with "heading" + "option"
  if (typeof section === "object" && !Array.isArray(section)) {
    return {
      heading: section.heading || key,
      items: Array.isArray(section.option) ? section.option : [],
    };
  }

  // Old format: array directly
  if (Array.isArray(section)) {
    return { heading: key, items: section };
  }

  return { heading: key, items: [] };
};

const getAllFooterColumns = (footerData) => {
  const keys = ["SHOP", "COMPANY", "LEGAL", "CUSTOMER CARE"];
  return keys
    .map((key) => ({ key, ...getFooterSection(footerData, key) }))
    .filter((x) => x.items.length > 0);
};

// helper to check absolute URLs
const isAbsoluteUrl = (u) => typeof u === "string" && /^https?:\/\//i.test(u);

const isValidEmail = (value = "") => {
  const email = String(value).trim();
  if (!email) return false;
  if (email.includes(" ")) return false;
  if (email.length > 254) return false;

  const parts = email.split("@");
  if (parts.length !== 2) return false;

  const [local, domain] = parts;
  if (!local || local.length > 64) return false;
  if (!domain || domain.length > 190) return false;
  if (!domain.includes(".")) return false;
  if (email.includes("..")) return false;

  const labels = domain.split(".");
  if (labels.some((l) => !l || l.length > 63)) return false;

  const re = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return re.test(email);
};

/* ---------- Shimmer ---------- */
const FooterShimmer = () => (
  <Box as="footer" bg="#fafafa" borderTop="1px solid" borderColor="#d9d9d9">
    <Container maxW="100%" px={{ base: 6, lg: 10 }} py={{ base: 8 }}>
      <SimpleGrid columns={{ base: 1, lg: 6 }} spacingX={{ base: 2 }}>
        {[1, 2, 3, 4].map((i) => (
          <Box key={i}>
            <Box w="80px" h="20px" className="shimmer" mb={4} />
            <Stack spacing={3}>
              {[1, 2, 3, 4].map((j) => (
                <Box key={j} w="120px" h="16px" className="shimmer" />
              ))}
            </Stack>
          </Box>
        ))}
        <GridItem colSpan={{ base: 1, lg: 2 }}>
          <Stack spacing={4} mt={{ base: 4, lg: 2 }}>
            <Box w="150px" h="20px" className="shimmer" />
            <Box w="200px" h="16px" className="shimmer" />
            <Box w="100%" h="40px" className="shimmer" borderRadius="md" />
          </Stack>
        </GridItem>
      </SimpleGrid>

      <Stack spacing={3} mt={{ base: 10, lg: 12 }}>
        <Box w="120px" h="16px" className="shimmer" />
        <HStack spacing={4}>
          <Box w="120px" h="40px" className="shimmer" />
          <Box w="120px" h="40px" className="shimmer" />
        </HStack>
      </Stack>

      <Divider mt={{ base: 8, lg: 10 }} mb={4} borderColor="#d9d9d9" />

      <Flex
        direction={{ base: "column", lg: "row" }}
        align={{ base: "center", lg: "center" }}
        justify={{ base: "center", lg: "space-between" }}
        gap={4}
      >
        <Box w="200px" h="16px" className="shimmer" />
        <HStack spacing={6}>
          {[1, 2, 3, 4].map((i) => (
            <Box key={i} w="22px" h="22px" className="shimmer" />
          ))}
        </HStack>
        <HStack spacing={4}>
          {[1, 2, 3, 4].map((i) => (
            <Box key={i} w="40px" h="24px" className="shimmer" />
          ))}
        </HStack>
      </Flex>
    </Container>
  </Box>
);

/* ---------- Mobile collapsible column ---------- */
function SectionCol({ title, items, isMobile, isOpen, onToggle }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <Box
      borderBottom={{ base: "1px solid", lg: "0" }}
      borderColor={{ base: "#d9d9d9", lg: "transparent" }}
      py={{ base: 3, lg: 0 }}
      px={{ base: 4, lg: 0 }}
    >
      <Button
        w="full"
        justifyContent="space-between"
        alignItems="center"
        variant="ghost"
        px={0}
        fontWeight="semibold"
        fontSize="sm"
        _hover={{ bg: "transparent" }}
        onClick={() => isMobile && onToggle()}
        rightIcon={
          isMobile ? (
            isOpen ? (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M14.625 6.1875L9 11.8125L3.375 6.1875"
                  stroke="#000"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M6.1875 3.375L11.8125 9L6.1875 14.625"
                  stroke="#000"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )
          ) : undefined
        }
      >
        {title}
      </Button>

      <Collapse in={!isMobile || isOpen} animateOpacity>
        <Stack spacing={3} fontSize="13px">
          {items.map((item, idx) => {
            const label = item?.label ?? "";
            const href = item?.href ?? "";
            if (!label) return null;

            return href ? (
              <RouterLink
                key={`${title}-${idx}`}
                to={href}
                style={{ textDecoration: "none" }}
              >
                <Text
                  _hover={{ textDecoration: "underline" }}
                  cursor="pointer"
                  fontSize="11px"
                >
                  {label}
                </Text>
              </RouterLink>
            ) : (
              <Text key={`${title}-${idx}`}>{label}</Text>
            );
          })}
        </Stack>
      </Collapse>
    </Box>
  );
}

export default function Footer() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const subscribeTimerRef = useRef(null);
  const [footerData, setFooterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useBreakpointValue({ base: true, lg: false });

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeMessage, setSubscribeMessage] = useState(
    () => sessionStorage.getItem(SUBSCRIBE_SESSION_MSG_KEY) || ""
  );
  const [subscribeStatus, setSubscribeStatus] = useState(
    () => sessionStorage.getItem(SUBSCRIBE_SESSION_STATUS_KEY) || ""
  );
  const [isSubscribedThisSession, setIsSubscribedThisSession] = useState(
    () => sessionStorage.getItem(SUBSCRIBE_SESSION_KEY) === "1"
  );

  // collapsibles
  const [openShop, setOpenShop] = useState(false);
  const [openCompany, setOpenCompany] = useState(false);
  const [openLegal, setOpenLegal] = useState(false);
  const [openCare, setOpenCare] = useState(false);

  const [userDetails, setUserDetails] = useState(null);


  // Fetch footer data (API only)
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchHomePageContent(null); 
        if (!cancel) setFooterData(data?.footer || {});
      } catch (e) {
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  // Fetch user data from localStorage (if logged in)
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem(LOCAL_KEYS.LOGIN_DATA));
    if (userData) setUserDetails(userData);
  }, []);

  // Loading state
  if (loading) return <FooterShimmer />;

  // No data guard
  if (!footerData || Object.keys(footerData).length === 0) return null;

  // Columns (SHOP/COMPANY/LEGAL/CUSTOMER CARE)
  const footerColumns = getAllFooterColumns(footerData);

  // Newsletter
  const newsletterSection = getFooterSection(footerData, "NEWSLETTER SIGNUP");
  const newsletterHeading = newsletterSection.heading || "NEWSLETTER SIGNUP";
  const newsletterItems = newsletterSection.items || [];

  const nlLine1 = newsletterItems?.[0]?.label || "";
  const nlLine2 = newsletterItems?.[1]?.label || "";
  const collaborateItem = newsletterItems?.[2] || {};
  const collaborateText = collaborateItem.label || "";
  const collaborateHref = collaborateItem.href || collaborateItem.link || "";
  const showNewsletter =
    newsletterItems.length > 0 && (nlLine1 || nlLine2 || collaborateText);

  // Download Our App
  const appSection = getFooterSection(footerData, "Download Our App");
  const appHeading = appSection.heading || "Download Our App";
  const appItems = appSection.items || [];
  const appBadges = appItems
    .filter((i) => i && i.link)
    .map((i) => ({
      label: i.label || "",
      href: i.href || "",
      imgSrc: i.link,
    }));

  // Social media (still array)
  const socialLinksRaw = Array.isArray(footerData?.["SOCIAL MEDIA"])
    ? footerData["SOCIAL MEDIA"]
    : [];
  const socialLinks = socialLinksRaw
    .map((item) => {
      const label = item?.label?.toLowerCase()?.trim();
      const href = item?.href?.trim();

      if (!label || !href) return null;

      return {
        label: item.label,
        href,
        icon: SOCIAL_ICON_MAP[label],
      };
    })
    .filter((item) => item && item.icon);

  // Subscribe
  const handleSubscribe = async () => {
    const trimmed = email.trim();

    if (!trimmed) {
      setEmailError("Email is required");
      return;
    }

    if (!isValidEmail(trimmed)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setEmailError("");
    setIsSubscribing(true);

    try {
      const result = await subscribeToNewsletter(trimmed);

      if (result?.success) {
        const msg = "✔ Thanks for subscribing";

        setSubscribeMessage(msg);
        setSubscribeStatus("success");
        setIsSubscribedThisSession(true);
        setEmail("");

        // ✅ persist for this tab session
        sessionStorage.setItem(SUBSCRIBE_SESSION_KEY, "1");
        sessionStorage.setItem(SUBSCRIBE_SESSION_MSG_KEY, msg);
        sessionStorage.setItem(SUBSCRIBE_SESSION_STATUS_KEY, "success");
      } else {
        const msg = result?.message || "Something went wrong. Please try again.";

        setSubscribeMessage(msg);
        setSubscribeStatus("error");

        sessionStorage.setItem(SUBSCRIBE_SESSION_MSG_KEY, msg);
        sessionStorage.setItem(SUBSCRIBE_SESSION_STATUS_KEY, "error");
      }
    } catch (error) {
      const msg = "Unable to subscribe right now. Please try later.";

      setSubscribeMessage(msg);
      setSubscribeStatus("error");

      sessionStorage.setItem(SUBSCRIBE_SESSION_MSG_KEY, msg);
      sessionStorage.setItem(SUBSCRIBE_SESSION_STATUS_KEY, "error");
    } finally {
      setIsSubscribing(false);
    }
  };

  const isProductDetailsPage = pathname.includes("/product/");

  return (
    <>
      {!isProductDetailsPage && <FeatureIn />}
      {isHome ? <Usp /> : null}

      <Box
        as="footer"
        bg="#fafafa"
        borderTop="1px solid"
        borderColor="#d9d9d9"
        mt={isHome ? 0 : 6}
        pb={!isProductDetailsPage ? 0 : 28}
      >
        <Container maxW="100%" px={{ base: 0, lg: 10 }} py={{ base: 0, lg: 4 }} pb={4}>
          <SimpleGrid columns={{ base: 1, lg: 6 }} spacingX={{ base: 2 }}>
            {footerColumns.map((col) => (
              <SectionCol
                key={col.key}
                title={col.heading} // ✅ backend heading
                items={col.items}   // ✅ backend options
                isMobile={isMobile}
                isOpen={
                  col.key === "SHOP"
                    ? openShop
                    : col.key === "COMPANY"
                      ? openCompany
                      : col.key === "LEGAL"
                        ? openLegal
                        : col.key === "CUSTOMER CARE"
                          ? openCare
                          : false
                }
                onToggle={() => {
                  if (col.key === "SHOP") setOpenShop((p) => !p);
                  if (col.key === "COMPANY") setOpenCompany((p) => !p);
                  if (col.key === "LEGAL") setOpenLegal((p) => !p);
                  if (col.key === "CUSTOMER CARE") setOpenCare((p) => !p);
                }}
              />
            ))}

            {/* Newsletter (API-provided, new format supported) */}
            {showNewsletter && (
              <GridItem colSpan={{ base: 1, lg: 2 }} px={{ base: 4, lg: 0 }}>
                <Stack spacing={4} mt={{ base: 4, lg: 2 }}>
                  <Heading as="h3" size="xs" letterSpacing="wide" textTransform="uppercase">
                    {newsletterHeading}
                  </Heading>

                  {(nlLine1 || nlLine2) && (
                    <Text fontSize="11px" fontWeight={{ base: "semibold", lg: "normal" }}>
                      {nlLine1 && (
                        <>
                          {nlLine1}
                          <br />
                        </>
                      )}
                      {nlLine2}
                    </Text>
                  )}

                  <Stack spacing={1}>
                    {isSubscribedThisSession ? (
                      <Box
                        w="100%"
                        bg="white"
                        border="1px solid"
                        borderColor="#d9d9d9"
                        borderRadius="md"
                        px={4}
                        py={3}
                        textAlign="center"
                      >
                        {subscribeMessage && (
                          <Text
                            mt={1}
                            fontSize={{ base: "xs", lg: "sm" }}
                            textTransform="uppercase"
                            fontWeight="semibold"
                            color={subscribeStatus === "success" ? "black" : "red.500"}
                          >
                            {subscribeMessage}
                          </Text>
                        )}
                      </Box>
                    ) : (
                      <InputGroup size="lg" w="100%">
                        <Input
                          placeholder="Enter Your Email"
                          maxLength={50}
                          borderColor={emailError ? "red.400" : "#d9d9d9"}
                          _placeholder={{ color: "gray.800" }}
                          _focus={{ boxShadow: "none", borderColor: "#d9d9d9", outline: "none" }}
                          isInvalid={!!emailError}
                          borderRadius="md"
                          fontSize="sm"
                          bg="white"
                          value={email}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEmail(val);
                            if (!val.trim()) {
                              setEmailError("");
                              return;
                            }
                            setEmailError(isValidEmail(val) ? "" : "Please enter a valid email address");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !isSubscribing) handleSubscribe();
                          }}
                          disabled={isSubscribing}
                        />

                        <InputRightElement width="3rem">
                          <IconButton
                            aria-label="Subscribe"
                            icon={
                              isSubscribing ? (
                                <Spinner size="sm" color="white" />
                              ) : (
                                <HiOutlineArrowRight width="20px" />
                              )
                            }
                            size="md"
                            fontSize="20px"
                            bg="black"
                            color="white"
                            _hover={{ bg: "black" }}
                            _active={{ bg: "black" }}
                            _disabled={{ bg: "black", cursor: "not-allowed" }}
                            onClick={handleSubscribe}
                            disabled={isSubscribing || !email.trim()}
                            isLoading={isSubscribing}
                          />
                        </InputRightElement>
                      </InputGroup>
                    )}
                  </Stack>

                  {collaborateText && (
                    collaborateHref ? (
                      <CLink
                        href={collaborateHref}
                        isExternal
                        fontSize="13px"
                        fontWeight="semibold"
                        letterSpacing="wide"
                        textDecoration={{ base: "underline" }}
                        textUnderlineOffset="4px"
                      >
                        {collaborateText}
                      </CLink>
                    ) : (
                      <Text
                        fontSize="13px"
                        letterSpacing="wide"
                        textDecoration={{ base: "underline" }}
                        textUnderlineOffset="4px"
                      >
                        {collaborateText}
                      </Text>
                    )
                  )}
                </Stack>
              </GridItem>
            )}
          </SimpleGrid>

          {/* Download Our App — heading comes from backend now */}
          {appBadges.length > 0 && (
            <Stack
              spacing={3}
              mt={{ base: 8, md: 10 }}
              align={{ base: "center", md: "flex-start" }}
              textAlign={{ base: "center", md: "left" }}
              px={{ base: 4, lg: 0 }}
            >
              <Text fontSize="sm" fontWeight="semibold">
                {appHeading}
              </Text>

              <HStack
                spacing={4}
                flexWrap="wrap"
                justify={{ base: "center", md: "flex-start" }}
                w="100%"
              >
                {appBadges.map((b, idx) => {
                  const img = (
                    <Image
                      key={`badge-img-${idx}`}
                      src={b.imgSrc}
                      alt={b.label || "App badge"}
                      h="10"
                      loading="lazy"
                      cursor={b.href ? "pointer" : "default"}
                    />
                  );

                  // ✅ if no href -> just show image
                  if (!b.href) return <Box key={`badge-${idx}`}>{img}</Box>;

                  // ✅ external link
                  if (isAbsoluteUrl(b.href)) {
                    return (
                      <CLink
                        key={`badge-${idx}`}
                        href={b.href}
                        isExternal
                        rel="noopener noreferrer"
                      >
                        {img}
                      </CLink>
                    );
                  }

                  // ✅ internal link
                  return (
                    <RouterLink
                      key={`badge-${idx}`}
                      to={b.href}
                      style={{ display: "inline-block" }}
                    >
                      {img}
                    </RouterLink>
                  );
                })}
              </HStack>
            </Stack>
          )}

          <Divider mt={{ base: 5 }} mb={4} borderColor="#d9d9d9" />

          {/* Bottom bar */}
          <Flex
            direction={{ base: "column", md: "row" }}
            align={{ base: "center", md: "center" }}
            justify={{ base: "center", md: "space-between" }}
            gap={4}
            textAlign={{ base: "center", md: "left" }}
            px={{ base: 4, lg: 0 }}
            fontSize={{ base: "10px", md: "xs", xl: "sm" }}
          >
            <HStack
              spacing={6}
              w={{ base: "100%", md: "auto" }}
              justify={{ base: "center", md: "flex-start" }}
            >
              {socialLinks.map((item, idx) => (
                <CLink key={idx} href={item.href} isExternal aria-label={item.label}>
                  <Image
                    src={item.icon}
                    alt={item.label}
                    h={{ base: "20px", md: "24px" }}
                    w={{ base: "20px", md: "24px" }}
                  />
                </CLink>
              ))}
            </HStack>

            <Text display={{ base: "none", md: "block" }}>
              © 2026 Sotbella. All rights reserved
            </Text>

            <HStack
              spacing={4}
              w={{ base: "100%", md: "auto" }}
              justify={{ base: "center", md: "flex-end" }}
              align="center"
            >
              <Image src={Visa} alt="Visa" h={{ base: 4, md: 6 }} bg="white" />
              <Image src={Master} alt="Mastercard" h={{ base: 3, md: 5 }} bg="white" />
              <Image src={Apay} alt="Apay" h={{ base: 3, md: 5 }} bg="white" />
              <Image src={Gpay} alt="Gpay" h={{ base: 3, md: 5 }} bg="white" />

            </HStack>

            <Text display={{ base: "block", md: "none" }} fontSize="xs" color="#1A1D21">
              © 2026 Sotbella. All rights reserved
            </Text>
          </Flex>
        </Container>
      </Box>
    </>
  );
}

