import "./NewHomePage/app.css";
import React, { useEffect, useMemo, useCallback, Suspense, useState } from "react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useQuery } from "@tanstack/react-query";

import Navbar from "./NewHomePage/components/navbar/Navbar";
import Footer from "./NewHomePage/components/footer/Footer";

import {
  Box,
  Container,
  Button,
  Text,
  HStack,
  Center,
} from "@chakra-ui/react";

import { fetchHomePageContent } from "./api/services/homeapi";
import { useLogo } from "./Hooks/useLogo";
import { useUnifiedCartStore } from "./context/unifiedCartStore";
import { getAuthToken } from "./utils/tokenUtils";
import HomepageShimmer from "./components/layouts/Simmers/HomepageShimmer";
import { useEinsteinPageTracking } from "./Hooks/useEinsteinPageTracking";

// Sections
import Section5 from "./NewHomePage/components/StyleByColor/Section5";
import { useNavigate } from "react-router-dom";
import { subscribeToNewsletter } from "./api/services/newsletter";
import AppOpenBanner from "./components/AppOpenBanner";

// ✅ Performance Optimization: Code splitting - Lazy load heavy components
const Hero = React.lazy(() => import("./NewHomePage/components/hero/Hero"));
const DynamicSection = React.lazy(() => import("./NewHomePage/components/common/DynamicSection"));

// Loading fallback component
const ComponentLoader = () => (
  <Center py={8}>
    <HomepageShimmer />
  </Center>
);

// Helper to convert array data to slider items
const toSliderItems = (arr) => {
  if (!arr) return [];
  return arr.map((it) => ({
    src: it.link,
    src_mobile: it.link_mobile,
    type: it.type,
    type_mobile: it.type_mobile,
    abs: it.title,
    href: it.href,
    thumbnail_desktop: it.thumbnail_desktop,
    thumbnail_mobile: it.thumbnail_mobile,
  }));
};

function NewHome() {
  // useBreezeSDK(); // Moved to App.jsx to handle race conditions
  const ANNOUNCEMENT_HEIGHT = 40; // px (adjust if needed)
  const BANNER_HEIGHT = 45;

  const navigate = useNavigate();

  const isValidEmail = (email) => {
    const re = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return re.test(email);
  };

  // Track page view for Einstein Commerce Cloud
  useEinsteinPageTracking();

  const { initializeCart } = useUnifiedCartStore();

  const [showBanner, setShowBanner] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // ✅ Performance Optimization: Use React Query with caching for homepage
  const { data: apiData, isLoading: apiLoading } = useQuery({
    queryKey: ['homepage-content'],
    queryFn: async () => {
      const token = await getAuthToken();
      if (!token) throw new Error("No valid token");
      return await fetchHomePageContent(null);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - homepage content rarely changes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // ✅ Performance Optimization: useCallback for initializeCart
  useEffect(() => {
    initializeCart();
  }, [initializeCart]);

    useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth <= 768);
  };
  checkMobile();
  window.addEventListener("resize", checkMobile);
  return () => window.removeEventListener("resize", checkMobile);
}, []);

  useEffect(() => {
    const handleDocumentClick = async (e) => {
      const button = e.target.closest('.evg-email-btn');
      if (!button) return;

      const container = button.closest('.evg-email-field');
      if (!container) return;

      const input = container.querySelector('.evg-email-input');
      if (!input) return;

      const emailValue = input.value.trim();

      // console.log('Captured email:', emailValue);  // Log the captured email

      // Optional validation
      if (!emailValue) {
        // console.warn('Email is empty');
        return;
      }

      // Validate the email format
      if (!isValidEmail(emailValue)) {
        // console.warn('Invalid email format');
        return;
      }

      // console.log('Valid email format:', emailValue);  // Log valid email format

      // Make the API call to subscribe the user to the newsletter
      try {
        // console.log('Calling subscribeToNewsletter with:', emailValue);  // Log API call initiation
        const result = await subscribeToNewsletter(emailValue);

        // Check if the result has the expected structure and success flag
        if (result && result.success) {
          // console.log('Subscription successful:', result.message);  // Log success message
        } else {
          // console.error('Subscription failed:', result ? result.message : 'No response message');
        }
      } catch (error) {
        // console.error('Error subscribing:', error);  // Log any errors from the API call
      }
    };

    // Attach the click event listener
    document.addEventListener('click', handleDocumentClick);

    // Cleanup on unmount
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);


  const logoObj = apiData?.header?.Logo?.[0];
  const logoData = useLogo(logoObj);
  const logoBlackObj = apiData?.header?.Logo?.[1];
  const logoBlackData = useLogo(logoBlackObj);

  const heroData = useMemo(() => {
    const arr = apiData?.homePage?.["NEW-IN"];
    if (!arr) return [];
    return arr.map((item) => ({
      src: item.link,
      src_mobile: item.link_mobile,
      type: item.type,
      type_mobile: item.type_mobile,
      linkname: item.title,
      href: item.href,
      thumbnail_desktop: item.thumbnail_desktop,
      thumbnail_mobile: item.thumbnail_mobile,
    }));
  }, [apiData]);

  const bestSellerList = useMemo(
    () => toSliderItems(apiData?.homePage?.["Best-Seller"]),
    [apiData]
  );
  const exploreAllStylesList = useMemo(
    () => toSliderItems(apiData?.homePage?.["Explore-All-Styles"]),
    [apiData]
  );
  const yourStyleYourStoryList = useMemo(
    () => toSliderItems(apiData?.homePage?.["Your-Style-Your-Story"]),
    [apiData]
  );
  const shopByCategoryList = useMemo(
    () => toSliderItems(apiData?.homePage?.["Shop-by-Category"]),
    [apiData]
  );

  const theStyleEditList = useMemo(
    () => toSliderItems(apiData?.homePage?.["The-Style-Edit"]),
    [apiData]
  );
  const navbarTextColor = apiData?.homePage?.["HEADER COLOR"] || "#000000";
  const styleByColorItems = apiData?.homePage?.["Style-by-Color"] || [];

  const message = apiData?.homePage?.Announcement?.[0]?.title || "JUST DROPPED - RESORT 25 COLLECTION";
  const ctaLabel = "Shop Now";
  const href = apiData?.homePage?.Announcement?.[0]?.href || '#';

  if (apiLoading && !apiData) {
    return <HomepageShimmer />;
  }


  return (
    <>

     {/* {isMobile && <AppOpenBanner onVisibilityChange={setShowBanner} isMobile={isMobile} setIsMobile={setIsMobile} />} */}

      {/* Announcement Bar */}
      <Box
        bg="black"
        color="white"
        position="fixed"
        top="0px"
        left="0"
        w="100%"
        zIndex={40}
      >
        <Container maxW="container.xl" >
          <HStack justify="center" spacing={3} wrap="wrap">
            <Text
              textAlign="center"
              fontWeight="semibold"
              letterSpacing="wide"
              textTransform="uppercase"
              fontSize={{ base: "9px", sm: "10px" }}
            >
              {message}
            </Text>

            <Button
              variant="unstyled"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(href);
              }}
              fontSize={{ base: "9px", sm: "10px" }}
              fontWeight="800"
              textTransform="uppercase"
              color="white"
              letterSpacing="0.15em"
              _hover={{ textDecoration: "underline", opacity: 0.9, color: "white" }}
              _focus={{ boxShadow: "none" }}
            >
              {ctaLabel}
            </Button>
          </HStack>
        </Container>
      </Box>



<Box w="100%" minH="100vh" overflowX="hidden"
      pt={ isMobile ? `${ANNOUNCEMENT_HEIGHT}px` : `${ANNOUNCEMENT_HEIGHT}px`}>
        <Navbar
           topOffset= {isMobile ? `${ANNOUNCEMENT_HEIGHT}px` : `${ANNOUNCEMENT_HEIGHT}px`}
          logoSrc={logoData?.url}
          logoBlackSrc={logoBlackData?.url}
          logoAlt={logoData?.alt}
          loading={apiLoading}
          navbarTextColor={navbarTextColor?.[0]?.color}
        />

        {/* ✅ Performance Optimization: Lazy load Hero with Suspense */}
        <Suspense fallback={<ComponentLoader />}>
          <Hero heroData={heroData} loading={apiLoading} />
        </Suspense>
        {/* ✅ Performance Optimization: Lazy load DynamicSection components */}
        <Suspense fallback={<ComponentLoader />}>
          <DynamicSection sliderData={bestSellerList} loading={apiLoading} mobileLayout="bestSellerMosaic" />
        </Suspense>
        <Suspense fallback={<ComponentLoader />}>
          <DynamicSection sliderData={shopByCategoryList} loading={apiLoading} mobileLayout="shopCategoryMosaic" />
        </Suspense>

        <Section5 items={styleByColorItems} loading={apiLoading} />

        <Suspense fallback={<ComponentLoader />}>
          <DynamicSection sliderData={exploreAllStylesList} loading={apiLoading} />
        </Suspense>
        <Suspense fallback={<ComponentLoader />}>
          <DynamicSection sliderData={theStyleEditList} loading={apiLoading} />
        </Suspense>
        <Suspense fallback={<ComponentLoader />}>
          <DynamicSection
            sliderData={yourStyleYourStoryList}
            loading={apiLoading}
          />
        </Suspense>

        <Footer />
      </Box>
    </>
  );
}

export default NewHome;


