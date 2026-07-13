import React, { useEffect, useRef, useState, useMemo } from "react";
import Slider from "react-slick";
import AbsLink from "../absLink/AbsLink";
import {
  MdOutlineKeyboardArrowLeft,
  MdOutlineKeyboardArrowRight,
} from "react-icons/md";
import { Box, Flex, useBreakpointValue } from "@chakra-ui/react";
import { processImageUrl } from "../../../utils/imageUtils";
import { Link, useNavigate } from "react-router-dom";

// Shimmer component for Hero
const HeroShimmer = () => (
  <Box w="100%" h="100vh" pos="relative" className="shimmer">
    <Box
      pos="absolute"
      bottom={{ base: "12%", lg: "10%" }}
      left="50%"
      transform="translateX(-50%)"
      w="200px"
      h="50px"
      className="shimmer"
      borderRadius="25px"
    />
  </Box>
);

const HeroVideo = ({ src, isActive, isInView, fetchPriority, shouldPreload, poster, ...props }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current) return;

    if (isActive && isInView) {
      videoRef.current.muted = true; // Ensure muted for autoplay
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // console.warn("Hero video autoplay prevented:", error);
        });
      }
    } else {
      videoRef.current.pause();
    }
  }, [isActive, isInView]);

  return (
    <Box
      as="video"
      ref={videoRef}
      src={processImageUrl(src)}
      muted
      loop
      playsInline
      preload={shouldPreload ? "auto" : "none"} // ✅ Optimized: Preload current + next
      poster={poster}
      {...props}
    />
  );
};

const Hero = ({ heroData = [], loading = false, showDots = true }) => {
  const heroItems = Array.isArray(heroData) ? heroData : [];

  const sliderRef = useRef(null);

  // for trackpad wheel throttling
  const wheelLockRef = useRef(false);
  const wheelUnlockTimerRef = useRef(null);

  const [currentSlide, setCurrentSlide] = useState(0);

  const [isHeroActive, setIsHeroActive] = useState(false);
  const [isInView, setIsInView] = useState(true); // Default true to not block initial LCP
  const sectionRef = useRef(null);

  const navigate = useNavigate();

  const sliderSpeed = useBreakpointValue({
    base: 280,
    md: 800,
  });

  // ✅ Check if desktop or mobile to conditionally render heavy media
  // Use matchMedia with lazy initializer to ensure correct initial value and prevent double-loading
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(min-width: 768px)").matches;
    }
    return false;
  });

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const listener = (e) => setIsDesktop(e.matches);
    // Modern browsers support addEventListener on MediaQueryList, older ones use addListener
    if (media.addEventListener) {
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    } else {
      media.addListener(listener);
      return () => media.removeListener(listener);
    }
  }, []);

  // ✅ Pause heavy media when out of viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.1 } // Pause when < 10% visible
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleGoTo = (href) => {
    if (!href) return;

    if (href.startsWith("http")) {
      window.location.href = href;
      return;
    }

    const path = href.startsWith("/") ? href : `/${href}`;
    navigate(path);
  };
  const getItemKey = useMemo(() => {
    return (item, idx) =>
      item?.id || item?.href || item?.video || item?.link || `hero-${idx}`;
  }, []);

  // ✅ Global arrow keys (no focus needed, no page jump)
  useEffect(() => {
    if (!isHeroActive) return;

    const onKeyDown = (e) => {
      // don't hijack typing
      const tag = (e.target?.tagName || "").toLowerCase();
      const isTyping =
        tag === "input" || tag === "textarea" || e.target?.isContentEditable;

      if (isTyping) return;

      if (e.key === "ArrowLeft") {
        sliderRef.current?.slickPrev();
      } else if (e.key === "ArrowRight") {
        sliderRef.current?.slickNext();
      }
    };

    window.addEventListener("keydown", onKeyDown, { passive: true });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isHeroActive]);

  if (loading) return <HeroShimmer />;
  if (heroItems.length === 0) return null;

  const settings = {
    dots: false,
    infinite: true,
    speed: sliderSpeed ?? 800,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    afterChange: (index) => setCurrentSlide(index),

    // ✅ Swipe/drag support
    swipe: true,
    touchMove: true,
    draggable: true,
    swipeToSlide: true,
    touchThreshold: 8,
    accessibility: true,
    lazyLoad: "ondemand",
  };

  // ✅ Trackpad horizontal swipe ONLY (no up/down)
  const handleWheel = (e) => {
    if (!sliderRef.current) return;

    const dx = e.deltaX || 0;
    const dy = e.deltaY || 0;

    // ✅ Ignore vertical scroll (or mostly-vertical gestures)
    if (Math.abs(dx) <= Math.abs(dy)) return;

    // ✅ Small movements shouldn't trigger slides
    if (Math.abs(dx) < 30) return;

    // ✅ Throttle
    if (wheelLockRef.current) return;
    wheelLockRef.current = true;

    if (dx > 0) sliderRef.current.slickNext();
    else sliderRef.current.slickPrev();

    clearTimeout(wheelUnlockTimerRef.current);
    wheelUnlockTimerRef.current = setTimeout(() => {
      wheelLockRef.current = false;
    }, 500);
  };


  return (
    <Box
      ref={sectionRef}
      as="main"
      w="100%"
      overflow="hidden"
      maxH="100vh"
      pos="relative"
      onWheel={handleWheel}
      // ✅ enable arrows only while user is interacting with hero
      onMouseEnter={() => setIsHeroActive(true)}
      onMouseLeave={() => setIsHeroActive(false)}
      onMouseDown={() => setIsHeroActive(true)}
      onTouchStart={() => setIsHeroActive(true)}
      // ✅ allow vertical page scroll; don't let browser "snap focus"
      sx={{ touchAction: "pan-y" }}
    >
      {/* Slider */}
      <Box w="100%" h="100%">
        <Slider {...settings} ref={sliderRef}>
          {heroItems.map((item, i) => {
            const isSlideActive = i === currentSlide;

            // ✅ Optimization: Preload current AND next slide for smoother transitions
            const nextSlideIndex = (currentSlide + 1) % heroItems.length;
            const shouldPreload = isSlideActive || i === nextSlideIndex;

            return (
              <Box key={getItemKey(item, i)} w="100%" h="100vh" overflow="hidden" pos="relative">
                <Link to={item.href || "#"}>
                  {/* Desktop View */}
                  {isDesktop && (
                    <Box display={{ base: "none", md: "block" }} w="100%" h="100%">
                      {item.type && item.type.toLowerCase().includes("video") ? (
                        <HeroVideo
                          src={item.src}
                          isActive={isSlideActive}
                          shouldPreload={shouldPreload} // ✅ pass preload hint
                          isInView={isInView}
                          fetchPriority={i === 0 ? "high" : "auto"}
                          w="100%"
                          h="100%"
                          objectFit="cover"
                          poster={processImageUrl(item.thumbnail_desktop)}
                        />
                      ) : (
                        <Box
                          as="img"
                          src={processImageUrl(item.src)}
                          w="100%"
                          h="100%"
                          objectFit="cover"
                          loading={i === 0 ? "eager" : "lazy"}
                          fetchPriority={i === 0 ? "high" : "auto"}
                          decoding="async"
                        />
                      )}
                    </Box>
                  )}

                  {/* Mobile View */}
                  {!isDesktop && (
                    <Box display={{ base: "block", md: "none" }} w="100%" h="100%">
                      {(item.type_mobile || item.type || "").toLowerCase().includes("video") ? (
                        <HeroVideo
                          src={item.src_mobile || item.src}
                          isActive={isSlideActive}
                          shouldPreload={shouldPreload} // ✅ pass preload hint
                          isInView={isInView}
                          fetchPriority={i === 0 ? "high" : "auto"}
                          w="100%"
                          h="100%"
                          objectFit="cover"
                          poster={processImageUrl(item.thumbnail_mobile)}
                        />
                      ) : (
                        <Box
                          as="img"
                          src={processImageUrl(item.src_mobile || item.src)}
                          w="100%"
                          h="100%"
                          objectFit="cover"
                          loading={i === 0 ? "eager" : "lazy"}
                          fetchPriority={i === 0 ? "high" : "auto"}
                          decoding="async"
                        />
                      )}
                    </Box>
                  )}
                </Link>
              </Box>
            );
          })}
        </Slider>
      </Box>

      {/* CTA */}
      {heroItems[currentSlide]?.linkname?.trim() && (
        <Box
          className="globalArrowWrapper"
          onClick={(e) => {
            e.preventDefault();
            handleGoTo(heroItems[currentSlide].href);
          }}
        >
          <AbsLink
            href={heroItems[currentSlide].href || "#"}
          >{heroItems[currentSlide].linkname}</AbsLink>
        </Box>
      )}

      {/* Left Arrow (hidden on mobile) */}
      <Box
        pos="absolute"
        top="45%"
        left="2vw"
        zIndex={20}
        onClick={() => sliderRef.current?.slickPrev()}
        display={{ base: "none", md: "block" }}
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

      {/* Right Arrow (hidden on mobile) */}
      <Box
        pos="absolute"
        top="45%"
        right="2vw"
        zIndex={20}
        onClick={() => sliderRef.current?.slickNext()}
        display={{ base: "none", md: "block" }}
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
        onClick={() => sliderRef.current?.slickPrev()}
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
        onClick={() => sliderRef.current?.slickNext()}
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

      {/* Bottom Dots */}
      {showDots && heroItems.length > 1 && (
        <Flex
          pos="absolute"
          // bottom="22px"
          bottom={{ base: "12%", lg: "10%" }}
          left="50%"
          transform="translateX(-50%)"
          // zIndex={30}
          gap="10px"
          align="center"
          justify="center"
        >
          {heroItems.map((_, i) => {
            const isActive = i === currentSlide;

            return (
              <Box
                key={`dot-${i}`}
                w={isActive ? { base: "12px", lg: "18px" } : { base: "6px", lg: "8px" }}
                h={{ base: "6px", lg: "8px" }}
                borderRadius="999px"
                bg={isActive ? "white" : "whiteAlpha.600"}
                cursor="pointer"
                transition="all 0.25s ease"
                onClick={(e) => {
                  e.stopPropagation();
                  sliderRef.current?.slickGoTo(i);
                }}
              />
            );
          })}
        </Flex>
      )}
    </Box>
  );
};

export default Hero;
