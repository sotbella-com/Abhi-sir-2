import React, { useRef } from "react";
import { handleNavigate } from "@/utils/url";
import Slider from "react-slick";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

const MobileMediaRenderer = ({
  media = [],
  isSlider = false,
  carouselId = "mediaCarousel",
}) => {
  const sliderRef = useRef();

  if (!media.length) return null;

  const handleClick = (link) => {
    if (link) handleNavigate(link);
  };

  const renderMediaItem = (item, index) => {
    return (
      <div
        key={index}
        className="relative w-full h-screen overflow-hidden m-0 p-0"
      >
        {item.type === "IMAGE" ? (
          <img
            src={item.mediaUrl}
            className="w-full h-full object-cover m-0 p-0"
            alt={item.alt || `media-${index}`}
            loading="lazy"
          />
        ) : (
          <video
            src={item.mediaUrl}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover m-0 p-0"
            aria-label={`video-${index}`}
          />
        )}
        
        {/* Button overlay - only show if title exists */}
        {item?.title && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (item.link) {
                  handleClick(item.link);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (item.link) {
                    handleClick(item.link);
                  }
                }
              }}
              aria-label={`${item.title} – navigate`}
              className="
                bg-white text-black
                px-4 py-2
                text-sm uppercase tracking-wider
                border-2 border-transparent hover:border-2 hover:border-black
                transition-all duration-300
                cursor-pointer
                shadow-lg hover:shadow-xl
                transform hover:scale-105
              "
            >
              {item.title}
            </button>
          </div>
        )}
      </div>
    );
  };

  if (isSlider) {
    const settings = {
      dots: false,
      infinite: true,
      speed: 700,
      slidesToShow: 1,
      slidesToScroll: 1,
      fade: true,
      arrows: false,
      autoplay: true,
      autoplaySpeed: 5000,
    };

    return (
      <div className="relative">
        <Slider ref={sliderRef} {...settings} className="!m-0 !p-0">
          {media?.map((item, index) => renderMediaItem(item, index))}
        </Slider>

        {media?.length > 1 && (
          <>
            {/* Previous Button */}
            <button
              onClick={() => sliderRef.current?.slickPrev()}
              className="absolute top-1/2 left-0 -translate-y-1/2 z-20 bg-transparent p-2 cursor-pointer"
            >
              <IoIosArrowBack size={25} color="white" />
            </button>

            {/* Next Button */}
            <button
              onClick={() => sliderRef.current?.slickNext()}
              className="absolute top-1/2 right-0 -translate-y-1/2 z-20 bg-transparent p-2 cursor-pointer"
            >
              <IoIosArrowForward size={25} color="white" />
            </button>
          </>
        )}
      </div>
    );
  }

  return <>{media.map((item, index) => renderMediaItem(item, index))}</>;
};

export default MobileMediaRenderer;
