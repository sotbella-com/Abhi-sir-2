import React, { useEffect, useMemo, useRef, useState } from "react";
import Slider from "react-slick";
// import { motion } from "framer-motion";
import { motion } from "motion/react";

import { Box, Flex, Image, useBreakpointValue } from "@chakra-ui/react";
import { useScrollScale } from "../../hooks/useScrollScale";
import AbsLink from "../absLink/AbsLink";
import { processImageUrl } from "../../../utils/imageUtils";
import { useNavigate } from "react-router-dom";
import {
  MdOutlineKeyboardArrowLeft,
  MdOutlineKeyboardArrowRight,
} from "react-icons/md";

// Helpers
const isVideoByMime = (t) => String(t || "").toLowerCase().includes("video");
const isVideoByExt = (u) => /\.(mp4|webm|ogg)(\?|#|$)/i.test(String(u || ""));
const toSrc = (it) => it?.src ?? it?.link ?? "";

// Motion + Chakra wrapper
const MotionBox = motion.create(Box);
const MotionImage = motion.create(Image);

// Shimmer
const Section5Shimmer = ({ isMobile }) => (
  <Box overflow="hidden" pos="relative">
    <Flex w={isMobile ? "100%" : "max-content"}>
      {(isMobile ? [1] : [1, 2, 3, 4, 5, 6]).map((i) => (
        <Box
          key={i}
          flexShrink={0}
          w={isMobile ? "100vw" : "calc(100vw / 3)"}
          h="100vh"
          className="shimmer"
        />
      ))}
    </Flex>
  </Box>
);

export default function Section5({
  items = [],
  loading = false,
  scaleMode = "symmetric",
}) {
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const tileW = isMobile ? "100vw" : "calc(100vw / 3)";
  const navigate = useNavigate();

  const { ref: sectionRef, scale } = useScrollScale({ mode: scaleMode });

  // ✅ marquee container ref + hover state
  const marqueeRef = useRef(null);
  const mobileSliderRef = useRef(null);
  const wheelLockRef = useRef(false);
  const wheelUnlockTimerRef = useRef(null);
  const [isHover, setIsHover] = useState(false);

  // ✅ cleanup timers
  useEffect(() => {
    return () => {
      if (wheelUnlockTimerRef.current) clearTimeout(wheelUnlockTimerRef.current);
    };
  }, []);

  const sliderSettings = {
    dots: false,
    infinite: true,
    speed: 280,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    afterChange: (index) => setCurrentIndex(index),
    swipe: true,
    touchMove: true,
    draggable: true,
    swipeToSlide: true,
    touchThreshold: 8,
    accessibility: true,
  };

  // ✅ mobile: active index for dots
  const [currentIndex, setCurrentIndex] = useState(0);

  // ✅ tile width in px (for scrollBy / scrollTo)
  const [tilePx, setTilePx] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 0
  );

  // IntersectionObserver state (desktop only)
  const [inView, setInView] = useState(true);

  // Normalize incoming items
  const media = useMemo(
    () =>
      items
        .map((it) => {
          const src = toSrc(it);
          const mobileSrc = it?.src_mobile || it?.mobile || it?.link_mobile || "";
          if (!src && !mobileSrc) return null;
          const video = isVideoByMime(it?.type) || isVideoByExt(src || mobileSrc);
          return {
            src,
            video,
            src_mobile: mobileSrc,
            type_mobile: it?.type_mobile || "",
            title: it?.title || "",
            href: it?.href || "",
          };
        })
        .filter(Boolean),
    [items]
  );

  // ✅ visible items: ALL items (mobile needs dots for all)
  const visible = useMemo(() => media, [media]);

  // ✅ desktop loop only
  const looped = useMemo(() => {
    if (isMobile) return visible; // no duplication on mobile
    return [...visible, ...visible]; // duplicate for seamless loop
  }, [isMobile, visible]);

  // IntersectionObserver (desktop)
  useEffect(() => {
    if (isMobile) {
      setInView(true);
      return;
    }
    if (!sectionRef?.current) return;

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => setInView(e.isIntersecting)),
      { threshold: 0.1 }
    );

    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [isMobile, sectionRef]);

  // ✅ update tilePx on resize
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setTilePx(isMobile ? w : w / 3);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [isMobile]);

  // ✅ desktop: auto marquee via scrollLeft (paused on hover / out of view)
  useEffect(() => {
    if (isMobile) return;
    if (!inView) return;
    if (isHover) return;

    const el = marqueeRef.current;
    if (!el) return;

    let rafId;
    const speed = 3; // adjust speed here

    const tick = () => {
      el.scrollLeft += speed;

      const half = el.scrollWidth / 2;
      if (el.scrollLeft >= half) {
        el.scrollLeft = 0;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isMobile, inView, isHover, looped.length]);



  if (loading) return <Section5Shimmer isMobile={!!isMobile} />;
  if (!visible.length) return null;

  const handleClick = (href) => {
    if (!href) return;
    if (href.startsWith("/")) navigate(href);
    else window.location.href = href;
  };

  // ✅ desktop arrows
  const scrollPrev = () => {
    const el = marqueeRef.current;
    if (!el) return;
    el.scrollBy({ left: -tilePx, behavior: "smooth" });
  };

  const scrollNext = () => {
    const el = marqueeRef.current;
    if (!el) return;
    el.scrollBy({ left: tilePx, behavior: "smooth" });
  };

  // ✅ mobile dot click scroll
  const goToIndexMobile = (idx) => {
    const el = marqueeRef.current;
    if (!el) return;
    setCurrentIndex(idx);
    el.scrollTo({ left: idx * tilePx, behavior: "smooth" });
  };

  // ✅ ONLY horizontal wheel -> slide (no up/down)
  const handleWheel = (e) => {
    if (!mobileSliderRef.current) return;

    const dx = e.deltaX || 0;
    const dy = e.deltaY || 0;

    // ignore mostly-vertical scroll gestures
    if (Math.abs(dx) <= Math.abs(dy)) return;

    if (Math.abs(dx) < 30) return;
    if (wheelLockRef.current) return;

    wheelLockRef.current = true;

    if (dx > 0) mobileSliderRef.current.slickNext();
    else mobileSliderRef.current.slickPrev();

    clearTimeout(wheelUnlockTimerRef.current);
    wheelUnlockTimerRef.current = setTimeout(() => {
      wheelLockRef.current = false;
    }, 500);
  };

  return (
    <Box ref={sectionRef} overflow="hidden" pos="relative">
      {/* ✅ OUTER WRAPPER (relative) — arrows anchor here, not on specific image */}
      <Box
        pos="relative"
        onMouseEnter={() => !isMobile && setIsHover(true)}
        onMouseLeave={() => !isMobile && setIsHover(false)}
      >
        {/* ✅ SCROLL AREA */}
        {isMobile ? (
          <Box overflow="visible" w="100vw" h="100vh" onWheel={handleWheel}>
            <Slider ref={mobileSliderRef} {...sliderSettings}>
              {visible.map((item, i) => {
                const itemKey = `${item.href || item.src}-${i}`;
                const finalSrc = item.src_mobile || item.src;
                const isMobileVideo = (item.type_mobile && item.type_mobile.toLowerCase().includes("video"))
                  || (item.src_mobile && isVideoByExt(item.src_mobile))
                  || (!item.src_mobile && item.video);

                return (
                  <MotionBox
                    key={itemKey}
                    // style={{ scale: 1 }} // mobile always 1
                    flexShrink={0}
                    w="100vw"
                    h="100vh"
                    position="relative"
                    cursor={item.href ? "pointer" : "default"}
                    display="block"
                    onClick={item.href ? () => handleClick(item.href) : undefined}
                  >
                    {isMobileVideo ? (
                      <MotionBox
                        as="video"
                        src={processImageUrl(finalSrc)}
                        muted
                        autoPlay
                        loop
                        playsInline
                        w="100%"
                        h="100%"
                        objectFit="cover"
                        style={{ scale }}
                        onError={(e) => (e.target.style.display = "none")}
                      />
                    ) : (
                      <MotionImage
                        src={processImageUrl(finalSrc)}
                        alt={item.title || "Style by Color"}
                        w="100%"
                        h="100%"
                        objectFit="cover"
                        style={{ scale }}
                        onError={(e) => (e.target.style.backgroundColor = "#f0f0f0")}
                      />
                    )}

                    {item.title && item.href && (
                      <Box className="globalArrowWrapper">
                        <AbsLink href={item.href}>{item.title}</AbsLink>
                      </Box>
                    )}
                  </MotionBox>
                );
              })}
            </Slider>
          </Box>
        ) : (
          <Box
            ref={marqueeRef}
            overflowX="hidden"
            overflowY="hidden"
            pos="relative"
            sx={{
              "&::-webkit-scrollbar": { display: "none" },
              scrollbarWidth: "none",
              scrollBehavior: "smooth",
            }}
          >
            <Flex w="max-content">
              {looped.map((item, i) => {
                const itemKey = `${item.href || item.src}-${i}`;

                return (
                  <MotionBox
                    key={itemKey}
                    style={{ scale }}
                    flexShrink={0}
                    w={tileW}
                    position="relative"
                    cursor={item.href ? "pointer" : "default"}
                    display="block"
                    onClick={item.href ? () => handleClick(item.href) : undefined}
                  >
                    {item.video ? (
                      <Box
                        as="video"
                        src={processImageUrl(item.src)}
                        muted
                        autoPlay
                        loop
                        playsInline
                        w="100%"
                        h="100vh"
                        objectFit="cover"
                        onError={(e) => (e.target.style.display = "none")}
                      />
                    ) : (
                      <Image
                        src={processImageUrl(item.src)}
                        alt={item.title || "Style by Color"}
                        w="100%"
                        h="100vh"
                        objectFit="cover"
                        onError={(e) =>
                          (e.target.style.backgroundColor = "#f0f0f0")
                        }
                      />
                    )}

                    {item.title && item.href && (
                      <Box className="globalArrowWrapper">
                        <AbsLink href={item.href}>{item.title}</AbsLink>
                      </Box>
                    )}
                  </MotionBox>
                );
              })}
            </Flex>
          </Box>
        )}

        {/* ✅ DESKTOP ARROWS (ONLY ON HOVER) */}
        {!isMobile && isHover && (
          <>
            <Box pos="absolute" top="45%" left="2vw" zIndex={50} onClick={scrollPrev}>
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

            <Box pos="absolute" top="45%" right="2vw" zIndex={50} onClick={scrollNext}>
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
          </>
        )}

        {/* ✅ MOBILE ARROWS (ONLY on mobile) */}
        {isMobile && visible.length > 1 && (
          <>
            {/* Left Arrow (hidden on desktop) */}
            <Box
              pos="absolute"
              top="45%"
              left="-6vw"
              zIndex={20}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                mobileSliderRef.current?.slickPrev();
              }}
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
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                mobileSliderRef.current?.slickNext();
              }}
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
        )}

        {/* ✅✅✅ MOBILE DOTS (UPDATED STYLE like DynamicSection) */}
        {isMobile && visible.length > 1 && (
          <Flex
            pos="absolute"
            // bottom="18px"
            bottom={{ base: "12%", lg: "10%" }}
            left="50%"
            transform="translateX(-50%)"
            zIndex={60}
            gap="10px"
            align="center"
            justify="center"
          >
            {visible.map((_, i) => {
              const isActive = i === currentIndex;

              return (
                <Box
                  key={i}
                  // ✅ active wider pill, inactive small pill (same as DynamicSection)
                  w={isActive ? { base: "12px", lg: "18px" } : { base: "6px", lg: "8px" }}
                  h={{ base: "6px", lg: "8px" }}
                  borderRadius="999px"
                  bg={isActive ? "white" : "whiteAlpha.600"}
                  cursor="pointer"
                  transition="all 0.25s ease"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (mobileSliderRef.current) {
                      mobileSliderRef.current.slickGoTo(i);
                    }
                  }}
                />
              );
            })}
          </Flex>
        )}
      </Box>
    </Box>
  );
}
