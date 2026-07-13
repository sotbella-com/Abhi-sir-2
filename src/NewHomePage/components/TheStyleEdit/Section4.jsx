import { useRef, useState } from "react";
import Slider from "react-slick";
import { useScrollScale } from "../../hooks/useScrollScale";
import { motion } from "motion/react";
import AbsLink from "../absLink/AbsLink";
import { MdOutlineKeyboardArrowLeft, MdOutlineKeyboardArrowRight } from "react-icons/md";
import { Box, Flex, IconButton, useBreakpointValue } from "@chakra-ui/react";
import { processImageUrl } from "../../../utils/imageUtils";
import { Link } from "react-router-dom";

const MotionImg = motion.create(Box);
const MotionVideo = motion.create(Box);

// Shimmer component for Section4
const Section4Shimmer = () => (
  <Box pos="relative" overflow="hidden" h="50vw">
    <Flex gap="0" w="200%">
      {[1, 2, 3, 4].map((i) => (
        <Box key={i} w="50vw" h="50vw" className="shimmer" />
      ))}
    </Flex>
    <Box
      pos="absolute"
      bottom="10%"
      left="50%"
      transform="translateX(-50%)"
      w="200px"
      h="50px"
      className="shimmer"
      borderRadius="25px"
    />
  </Box>
);

const Section4 = ({ sliderData = [], loading = false, scaleMode = "symmetric" }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { ref, scale } = useScrollScale({ mode: scaleMode });
  const sliderRef = useRef(null);
  const isMobile = useBreakpointValue({ base: true, md: false });

  if (loading) return <Section4Shimmer />;
  if (!sliderData.length) return null;

  // 1 slide on mobile, 2 on md+
  const slidesToShow = isMobile ? 1 : 2;

  const settings = {
    dots: false,
    infinite: false,
    speed: 600,
    slidesToShow,
    slidesToScroll: 1,
    arrows: false, // we use custom arrows below
    beforeChange: (_current, next) => setCurrentSlide(next),
  };

  const atStart = currentSlide === 0;
  const atEnd = currentSlide >= Math.max(0, sliderData.length - slidesToShow);

  return (
    <Box ref={ref} pos="relative" overflow="hidden" h="100vh">
      <Box w="100%" h="100%">
        <Slider {...settings} ref={sliderRef}>
          {sliderData.map((val, i) => (
            <Link to={val.href}>
            <Box key={i} pos="relative" w={{ base: "100vw", md: "50vw" }}>
              {val.type === "image" ? (
                <MotionImg
                  as="img"
                  src={processImageUrl(val.src)}
                  alt=""
                  w="100%"
                  h="100vh"
                  objectFit="cover"
                  objectPosition="top"
                  style={{ scale }}
                  onError={(e) => {
                    e.target.style.backgroundColor = '#f0f0f0';
                    e.target.style.display = 'flex';
                    e.target.style.alignItems = 'center';
                    e.target.style.justifyContent = 'center';
                    e.target.innerHTML = 'Image failed to load';
                  }}
                />
              ) : (
                <MotionVideo
                  as="video"
                  src={processImageUrl(val.src)}
                  muted
                  autoPlay
                  loop
                  playsInline
                  w="100%"
                  h="100vh"
                  objectFit="cover"
                  objectPosition="top"
                  style={{ scale }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}

              {val.abs && val.abs.trim() !== "" && (
                <Box className="globalArrowWrapper">
                  <AbsLink href={val.href}>{val.abs}</AbsLink>
                </Box>
              )}
            </Box>
            </Link>
          ))}
        </Slider>
      </Box>

      {/* Left arrow (hidden on mobile) */}
      <Box
        pos="absolute"
        top="45%"
        left="2vw"
        zIndex={10}
        opacity={atStart ? 0 : 1}
        pointerEvents={atStart ? "none" : "auto"}
        onClick={() => !atStart && sliderRef.current?.slickPrev()}
        display={{ base: "none", md: "block" }}
        transition="opacity 0.3s ease"
      >
        <Flex
          w="35px"
          h="35px"
          rounded="full"
          bg="rgba(93,92,92,0.408)"
          color="white"
          align="center"
          justify="center"
          fontSize={{ base: "24px", md: "2.1vw" }}
          cursor="pointer"
          _hover={{ bg: "rgba(93,92,92,0.6)" }}
          transition="background-color 0.3s ease"
        >
          <MdOutlineKeyboardArrowLeft />
        </Flex>
      </Box>

      {/* Right arrow (hidden on mobile) */}
      <Box
        pos="absolute"
        top="45%"
        right="2vw"
        zIndex={10}
        opacity={atEnd ? 0 : 1}
        pointerEvents={atEnd ? "none" : "auto"}
        onClick={() => !atEnd && sliderRef.current?.slickNext()}
        display={{ base: "none", md: "block" }}
        transition="opacity 0.3s ease"
      >
        <Flex
          w="35px"
          h="35px"
          rounded="full"
          bg="rgba(93,92,92,0.408)"
          color="white"
          align="center"
          justify="center"
          fontSize={{ base: "24px", md: "2.1vw" }}
          cursor="pointer"
          _hover={{ bg: "rgba(93,92,92,0.6)" }}
          transition="background-color 0.3s ease"
        >
          <MdOutlineKeyboardArrowRight />
        </Flex>
      </Box>
    </Box>
  );
};

export default Section4;
