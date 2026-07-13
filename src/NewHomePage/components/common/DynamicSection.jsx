import React, { useRef, useState, useMemo, useEffect } from "react";
import { motion } from "motion/react";
import { Box, Flex, useBreakpointValue } from "@chakra-ui/react";
import Slider from "react-slick";
import AbsLink from "../absLink/AbsLink";
import { useScrollScale } from "../../hooks/useScrollScale";
import NavigationArrows from "./NavigationArrows";
import { processImageUrl } from "../../../utils/imageUtils";
import { useNavigate } from "react-router-dom";

const MotionImg = motion.create(Box);
const MotionVideo = motion.create(Box);

// Shimmer component
const DynamicSectionShimmer = () => (
  <Box pos="relative" w="100%" h="100vh" className="shimmer">
    <Box
      pos="absolute"
      bottom={{ base: "12%", lg: "10%" }}
      left="50%"
      transform="translateX(-50%)"
      w="200px"
      h="50px"
      borderRadius="25px"
      className="shimmer"
    />
  </Box>
);

const DynamicVideo = ({ src, isActive, isInView, scale, poster, ...props }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current) return;

    if (isActive && isInView) {
      videoRef.current.muted = true;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // console.warn("DynamicSection video autoplay prevented:", error);
        });
      }
    } else {
      videoRef.current.pause();
    }
  }, [isActive, isInView]);

  return (
    <MotionVideo
      as="video"
      ref={videoRef}
      src={processImageUrl(src)}
      muted
      loop
      playsInline
      preload={isActive && isInView ? "auto" : "none"}
      style={{ scale }}
      poster={poster}
      {...props}
    />
  );
};

// --- Helper Functions (Pure) ---
const pickSrc = (item, isDesktop) => {
  if (!item) return "";
  // ✅ mobile → src_mobile (link_mobile), desktop → src (link)
  return isDesktop
    ? item.src || item.src_mobile || ""
    : item.src_mobile || item.src || "";
};

const pickPoster = (item, isDesktop) => {
  if (!item) return "";
  return isDesktop ? item.thumbnail_desktop : item.thumbnail_mobile;
};

const pickType = (item, isDesktop) => {
  if (!item) return "";
  return isDesktop
    ? item.type || item.type_mobile || ""
    : item.type_mobile || item.type || "";
};

const isVideoItem = (item, isDesktop) =>
  (pickType(item, isDesktop) || "").toLowerCase().includes("video");

// --- Extracted Components ---

const MediaItem = React.memo(({ item, active, isDesktop, isInView, scale }) => {
  const isVideo = isVideoItem(item, isDesktop);
  const src = pickSrc(item, isDesktop);

  if (isVideo) {
    return (
      <DynamicVideo
        src={src}
        isActive={active}
        isInView={isInView}
        scale={scale}
        w="100%"
        objectFit="cover"
        poster={processImageUrl(pickPoster(item, isDesktop))}
      />
    );
  }

  return (
    <MotionImg
      as="img"
      src={processImageUrl(src)}
      w="100%"
      display="block"
      objectFit="cover"
      objectPosition="center"
      style={{ scale }}
    />
  );
});

const miniSettings = {
  dots: false,
  infinite: true,
  speed: 300,
  slidesToShow: 1,
  slidesToScroll: 1,
  arrows: false,
  swipe: true,
  draggable: true,
  touchMove: true,
  swipeToSlide: true,
  touchThreshold: 8,
};

const DOTS_BOTTOM = "20px";
const LINK_BOTTOM = "15%";

const TileSlider = ({ slides, getItemKey, go, isDesktop, isInView, scale }) => {
  const tileRef = useRef(null);
  const [tileIndex, setTileIndex] = useState(0);

  if (!slides?.length) return null;

  const activeSlide = slides[tileIndex] || slides[0];

  return (
    <Box
      position="relative"
      w="100%"
      h="100%"
      overflow="hidden" // ✅ no blink
      sx={{
        ".slick-slider, .slick-list, .slick-track": { height: "100%" },
        ".slick-slide": { height: "100%" },
        ".slick-slide > div": { height: "100%" },
      }}
    >
      <Slider
        {...miniSettings}
        ref={tileRef}
        afterChange={(i) => setTileIndex(i)}
      >
        {slides.map((s, i) => (
          <Box
            key={getItemKey(s, i)}
            w="100%"
            h="100%"
            position="relative"
            cursor={s?.href ? "pointer" : "default"}
            onClick={() => go(s)}
          >
            <MediaItem
              item={s}
              active={i === tileIndex}
              isDesktop={isDesktop}
              isInView={isInView}
              scale={scale}
            />

            {/* ✅ gradient so text always readable */}
            <Box
              position="absolute"
              left="0"
              right="0"
              bottom="0"
              h="55%"
              zIndex={10}
              pointerEvents="none"
              bgGradient="linear(to-t, rgba(0,0,0,0.55), rgba(0,0,0,0))"
            />
          </Box>
        ))}
      </Slider>

      {/* ✅ ABS LINK (use same wrapper class for consistent styling) */}
      {activeSlide?.abs && (
        <Box
          className="globalArrowWrapper"
          position="absolute"
          left="50%"
          transform="translateX(-50%)"
          fontSize="sm"
          bottom={LINK_BOTTOM}
          zIndex={10}
          pointerEvents="auto"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            go(activeSlide);
          }}
          sx={{
            // ✅ make sure overlay never blocks clicks
            "&, *": { pointerEvents: "auto", fontSize: "sm" },
          }}
        >
          <AbsLink href={activeSlide?.href || "#"} showArrow={false}>
            {activeSlide.abs}
          </AbsLink>
        </Box>
      )}

      {/* ✅ Dots bottom-most */}
      {slides.length > 1 && (
        <Flex
          position="absolute"
          bottom={DOTS_BOTTOM}
          left="50%"
          transform="translateX(-50%)"
          gap="6px"
          align="center"
          zIndex={10}
        >
          {slides.map((_, i) => (
            <Box
              key={`mini-dot-${i}`}
              w={i === tileIndex ? "10px" : "4px"}
              h="4px"
              borderRadius="999px"
              bg="white"
              opacity={i === tileIndex ? 1 : 0.6}
              transition="all 0.25s ease"
              onClick={(e) => {
                e.stopPropagation();
                tileRef.current?.slickGoTo(i);
              }}
            />
          ))}
        </Flex>
      )}
    </Box>
  );
};

const DynamicSection = ({
  sliderData = [],
  loading = false,
  height = "100vh",
  showNavigation = true,
  showDots = true,
  scaleMode = "symmetric",
  mobileLayout = "default",
}) => {
  const sliderRef = useRef(null);

  const wheelLockRef = useRef(false);
  const wheelUnlockTimerRef = useRef(null);

  const [isActive, setIsActive] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const { ref, scale } = useScrollScale({ mode: scaleMode });
  const navigate = useNavigate();

  const sliderSpeed = useBreakpointValue({
    base: 280,
    md: 800,
  });

  // ✅ Desktop / Mobile
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(min-width: 768px)").matches;
    }
    return false;
  });

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const listener = (e) => setIsDesktop(e.matches);
    if (media.addEventListener) {
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    } else {
      media.addListener(listener);
      return () => media.removeListener(listener);
    }
  }, []);

  const [isInView, setIsInView] = useState(false);

  // ✅ Pause off-screen videos
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);

  const data = Array.isArray(sliderData) ? sliderData : [];

  const resolveHref = (href) => {
    if (!href) return null;
    return href.startsWith("/") ? href : `/${href}`;
  };

  const handleGoTo = (href) => {
    if (!href) return;
    if (href.startsWith("http")) window.location.href = href;
    else navigate(resolveHref(href));
  };

  const go = (item) => item?.href && handleGoTo(item.href);

  const getItemKey = useMemo(() => {
    return (item, idx) =>
      item?.id || item?.src || item?.href || `${item?.type || "item"}-${idx}`;
  }, []);

  useEffect(() => {
    return () => {
      if (wheelUnlockTimerRef.current)
        clearTimeout(wheelUnlockTimerRef.current);
    };
  }, []);

  // ✅ global arrow keys
  useEffect(() => {
    if (!isActive) return;

    const onKeyDown = (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      const isTyping =
        tag === "input" || tag === "textarea" || e.target?.isContentEditable;
      if (isTyping) return;

      if (!sliderRef.current) return;

      if (e.key === "ArrowLeft") sliderRef.current.slickPrev();
      else if (e.key === "ArrowRight") sliderRef.current.slickNext();
    };

    window.addEventListener("keydown", onKeyDown, { passive: true });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isActive]);

  if (loading) return <DynamicSectionShimmer />;
  if (data.length === 0) return null;

  // ✅ MOBILE-ONLY Mosaic Layout (Top = 1 big, Bottom = 2 mini sliders)
  const isMosaicLayout =
    mobileLayout === "bestSellerMosaic" || mobileLayout === "shopCategoryMosaic";

  if (!isDesktop && isMosaicLayout && data.length >= 3) {
    const top = data[0];

    const leftSlides = data.slice(1).filter((_, idx) => idx % 2 === 0);
    const rightSlides = data.slice(1).filter((_, idx) => idx % 2 === 1);

    return (
      <Box ref={ref} w="100%" overflow="hidden">
        {/* ✅ TOP BIG */}
        <Box
          w="100%"
          aspectRatio="3/4"
          overflow="hidden"
          cursor={top?.href ? "pointer" : "default"}
          onClick={() => go(top)}
          position="relative"
        >
          <MediaItem
            item={top}
            active={true}
            isDesktop={isDesktop}
            isInView={isInView}
            scale={scale}
          />

          {/* ✅ TOP abs link */}
          {top?.abs && (
            <Box
              className="globalArrowWrapper"
              position="absolute"
              left="50%"
              transform="translateX(-50%)"
              // bottom="22px"
              bottom={{ base: "12%", lg: "10%" }}
              zIndex={10}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                go(top);
              }}
            >
              <AbsLink href={top?.href || "#"}>{top.abs}</AbsLink>
            </Box>
          )}
        </Box>

        <Box h="1px" bg="white" />

        {/* ✅ BOTTOM TWO */}
        <Flex w="100%" gap="1px">
          <Box flex="1" aspectRatio="3/4" overflow="hidden">
            <TileSlider
              slides={leftSlides}
              getItemKey={getItemKey}
              go={go}
              isDesktop={isDesktop}
              isInView={isInView}
              scale={scale}
            />
          </Box>
          <Box flex="1" aspectRatio="3/4" overflow="hidden">
            <TileSlider
              slides={rightSlides}
              getItemKey={getItemKey}
              go={go}
              isDesktop={isDesktop}
              isInView={isInView}
              scale={scale}
            />
          </Box>
        </Flex>
      </Box>
    );
  }

  // ✅ SINGLE ITEM
  if (data.length === 1) {
    const item = data[0];

    return (
      <Box
        ref={ref}
        pos="relative"
        overflow="hidden"
        h={height}
        cursor={item?.href ? "pointer" : "default"}
        onClick={() => item?.href && handleGoTo(item.href)}
        sx={{ touchAction: "pan-y" }}
      >
        {isVideoItem(item, isDesktop) ? (
          <DynamicVideo
            src={pickSrc(item, isDesktop)}
            isActive={true}
            isInView={isInView}
            scale={scale}
            w="100%"
            h={height}
            objectFit="cover"
            poster={processImageUrl(pickPoster(item, isDesktop))}
          />
        ) : (
          <MotionImg
            as="img"
            src={processImageUrl(pickSrc(item, isDesktop))}
            w="100%"
            h={height}
            objectFit="cover"
            style={{ scale }}
          />
        )}

        {item?.abs && (
          <Box
            className="globalArrowWrapper"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              item?.href && handleGoTo(item.href);
            }}
          >
            <AbsLink href={item?.href || "#"}>{item.abs}</AbsLink>
          </Box>
        )}
      </Box>
    );
  }

  const settings = {
    dots: false,
    infinite: true,
    speed: sliderSpeed ?? 800,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    afterChange: (index) => setCurrentSlide(index),

    swipe: true,
    touchMove: true,
    draggable: true,
    swipeToSlide: true,
    touchThreshold: 8,
    accessibility: true,
    lazyLoad: "ondemand",
  };

  const handleWheel = (e) => {
    if (!sliderRef.current) return;

    const dx = e.deltaX || 0;
    const dy = e.deltaY || 0;

    if (Math.abs(dx) <= Math.abs(dy)) return;
    if (Math.abs(dx) < 30) return;
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
      ref={ref}
      pos="relative"
      overflow="hidden"
      h={height}
      onWheel={handleWheel}
      sx={{ touchAction: "pan-y" }}
      onMouseEnter={() => setIsActive(true)}
      onMouseLeave={() => setIsActive(false)}
      onMouseDown={() => setIsActive(true)}
      onTouchStart={() => setIsActive(true)}
    >
      <Slider {...settings} ref={sliderRef}>
        {data.map((item, i) => (
          <Box
            key={`slide-${i}-${getItemKey(item, i)}`}
            pos="relative"
            w="100%"
            cursor={item?.href ? "pointer" : "default"}
            onClick={() => item?.href && handleGoTo(item.href)}
          >
            {isVideoItem(item, isDesktop) ? (
              <DynamicVideo
                src={pickSrc(item, isDesktop)}
                isActive={i === currentSlide}
                isInView={isInView}
                scale={scale}
                w="100%"
                h={height}
                objectFit="cover"
                poster={processImageUrl(pickPoster(item, isDesktop))}
              />
            ) : (
              <MotionImg
                as="img"
                src={processImageUrl(pickSrc(item, isDesktop))}
                w="100%"
                h={height}
                objectFit="cover"
                style={{ scale }}
              />
            )}

            {item?.abs && (
              <Box
                className="globalArrowWrapper"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  item?.href && handleGoTo(item.href);
                }}
              >
                <AbsLink href={item?.href || "#"}>{item.abs}</AbsLink>
              </Box>
            )}
          </Box>
        ))}
      </Slider>

      {showNavigation && data.length > 1 ? (
        <NavigationArrows
          currentSlide={currentSlide}
          totalSlides={data.length}
          onPrev={() => sliderRef.current?.slickPrev()}
          onNext={() => sliderRef.current?.slickNext()}
        />
      ) : null}

      {showDots && data.length > 1 ? (
        <Flex
          pos="absolute"
          // bottom="22px"
          bottom={{ base: "12%", lg: "10%" }}
          left="50%"
          transform="translateX(-50%)"
          gap="10px"
          align="center"
          justify="center"
        >
          {data.map((item, i) => {
            const isActiveDot = i === currentSlide;
            return (
              <Box
                key={`dot-${i}-${getItemKey(item, i)}`}
                w={
                  isActiveDot
                    ? { base: "12px", lg: "18px" }
                    : { base: "6px", lg: "8px" }
                }
                h={{ base: "6px", lg: "8px" }}
                borderRadius="999px"
                bg={isActiveDot ? "white" : "whiteAlpha.600"}
                cursor="pointer"
                transition="all 0.25s ease"
                onClick={(e) => {
                  e.stopPropagation();
                  sliderRef.current?.slickGoTo(i);
                  setIsActive(true);
                }}
              />
            );
          })}
        </Flex>
      ) : null}
    </Box>
  );
};

export default DynamicSection;
