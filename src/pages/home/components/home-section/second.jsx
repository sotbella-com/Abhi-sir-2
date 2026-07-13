import { getImageUrl, handleNavigate } from "@/utils/url";
import { useRef } from "react";
import Slider from "react-slick";

const SlickCarouselSecond = ({ medias }) => {
  const sliderRef = useRef();

  const secondMedias = (medias?.SECOND && medias?.SECOND[0]?.media) || [];

  const renderMediaWithButton = (item, index) => {
    return (
      <div key={`full-${index}`} className="relative w-full h-full">
        {item.type === "IMAGE" ? (
          <img
            src={getImageUrl(item.mediaUrl)}
            alt={item.title || "Image"}
            className="w-full object-cover h-[100vh]"
          />
        ) : (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full object-cover h-[100vh]"
            aria-label={item.title || "Video"}
          >
            <source src={getImageUrl(item.mediaUrl)} type="video/mp4" />
          </video>
        )}
        
        {/* Button overlay - only show if title exists */}
        {item.title && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (item.link) {
                  handleNavigate(item.link);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (item.link) {
                    handleNavigate(item.link);
                  }
                }
              }}
              aria-label={`${item.title} – navigate`}
              className="
                bg-white text-black
                px-8 md:px-14 py-2 md:py-2.5
                text-base md:text-xl uppercase tracking-wider
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

  const slides = secondMedias.map((item, index) => renderMediaWithButton(item, index));

  const settings = {
    dots: false,
    infinite: true,
    speed: 700,
    slidesToShow: 1,
    slidesToScroll: 1,
    fade: true,
    arrows: false,
  };

  return (
    <div className="relative w-full hidden md:block">
      <Slider ref={sliderRef} {...settings}>
        {slides}
      </Slider>

      {/* Prev/Next Buttons */}
      {secondMedias?.length > 1 && (
        <>
          <button
            onClick={() => sliderRef.current.slickPrev()}
            className="absolute top-1/2 left-5 -translate-y-1/2 z-50 text-white text-5xl bg-transparent cursor-pointer"
          >
            ‹
          </button>

          <button
            onClick={() => sliderRef.current.slickNext()}
            className="absolute top-1/2 right-5 -translate-y-1/2 z-50 text-white text-5xl bg-transparent cursor-pointer p-3 rounded-full"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
};

export default SlickCarouselSecond;
