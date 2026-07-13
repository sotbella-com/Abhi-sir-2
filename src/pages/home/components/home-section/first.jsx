// import { getImageUrl, handleNavigate } from "@/utils/url";
// import { useRef, useEffect } from "react";
// import Slider from "react-slick";
// import PropTypes from "prop-types";

// const SlickCarouselFirst = ({ medias, isMobile = false }) => {
//   const sliderRef = useRef();

//   const firstMedias = (medias?.FIRST && medias?.FIRST[0]?.media) || [];
//   const slides = [];
//   let i = 0;
//   let toggleHalf = false;

//   const renderMedia = (item, extraClasses = "") => {
//     return item.type === "IMAGE" ? (
//       <img
//         src={getImageUrl(item.mediaUrl)}
//         alt={item.title || "Slide image"}
//         className={`w-full min-h-[50vh] max-h-[110vh] h-[110vh] object-cover ${extraClasses}`}
//       />
//     ) : (
//       <video
//         autoPlay
//         muted
//         loop
//         playsInline
//         className={`w-full min-h-[50vh] max-h-[110vh] h-[110vh] object-cover ${extraClasses}`}
//         aria-label={item.title || "Slide video"}
//       >
//         <source src={getImageUrl(item.mediaUrl)} type="video/mp4" />
//       </video>
//     );
//   };

//   while (i < firstMedias.length) {
//     if (toggleHalf && i + 1 < firstMedias.length) {
//       const media1 = firstMedias[i];
//       const media2 = firstMedias[i + 1];

//       slides.push(
//         <div key={`half-${i}`} className="relative">
//           <div className="flex flex-col sm:flex-row w-full min-h-[50vh] max-h-[110vh] h-[110vh]">
//             {[media1, media2].map((item, idx) => (
//               <div
//                 key={idx}
//                 className="w-full sm:w-1/2 relative min-h-[50vh] max-h-[110vh] h-[110vh] cursor-pointer"
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   handleNavigate(item.link);
//                 }}
//               >
//                 {renderMedia(
//                   item,
//                   "min-h-[50vh] max-h-[110vh] h-[110vh]"
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>
//       );
//       i += 2;
//     } else {
//       const item = firstMedias[i];
//       slides.push(
//         <div key={`full-${i}`} className="relative">
//           <div
//             className="relative cursor-pointer"
//             onClick={(e) => {
//               e.stopPropagation();
//               handleNavigate(item.link);
//             }}
//           >
//             {renderMedia(
//               item,
//               isMobile
//                 ? "min-h-screen max-h-screen h-screen"
//                 : "min-h-[50vh] max-h-[110vh] h-[110vh]"
//             )}
//           </div>
//         </div>
//       );
//       i += 1;
//     }
//     toggleHalf = !toggleHalf;
//   }

//   const settings = {
//     dots: false,
//     infinite: true,
//     speed: 700,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     fade: true,
//     arrows: false,
//     responsive: [
//       {
//         breakpoint: 768,
//         settings: {
//           adaptiveHeight: true,
//         },
//       },
//     ],
//   };

//   useEffect(() => {
//     const handleKeyDown = (e) => {
//       if (e.key === "ArrowRight") {
//         sliderRef.current?.slickNext();
//       } else if (e.key === "ArrowLeft") {
//         sliderRef.current?.slickPrev();
//       }
//     };
//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//   }, []);

//   return (
//     <div className="overflow-hidden relative"
//       style={{ marginBottom: "-6px" }}>
//       <Slider ref={sliderRef} {...settings}>
//         {slides}
//       </Slider>

//       {/* Show navigation buttons only if more than one slide */}
//       {slides.length > 1 && (
//         <>
//           {/* Navigation Buttons */}
//           <button
//             onClick={() => sliderRef.current.slickPrev()}
//             className="hidden md:block absolute top-1/2 left-5 -translate-y-1/2 z-50 text-white text-5xl bg-transparent cursor-pointer"
//             aria-label="Previous slide"
//           >
//             ‹
//           </button>

//           <button
//             onClick={() => sliderRef.current.slickNext()}
//             className="hidden md:block absolute top-1/2 right-5 -translate-y-1/2 z-50 text-white text-5xl bg-transparent cursor-pointer p-3 rounded-full"
//             aria-label="Next slide"
//           >
//             ›
//           </button>
//         </>
//       )}
//     </div>
//   );
// };

// SlickCarouselFirst.propTypes = {
//   medias: PropTypes.object,
// };

// export default SlickCarouselFirst;


import { useRef, useEffect } from "react";
import PropTypes from "prop-types";
import Slider from "react-slick";
import { getImageUrl, handleNavigate } from "@/utils/url";

const SlickCarouselFirst = ({
  medias,
  isMobile = false,
  // CTA props
  showCta = true,
  ctaText = "NEW IN",
  ctaHref = item.mediaUrl,
}) => {
  const sliderRef = useRef(null);

  // Build slides (alternate full-width and half-split)
  const firstMedias = (medias?.FIRST && medias?.FIRST[0]?.media) || [];
  const slides = [];
  let i = 0;
  let toggleHalf = false;

  const renderMedia = (item, extraClasses = "") => {
    if (item?.type === "IMAGE") {
      return (
        <img
          src={getImageUrl(item.mediaUrl)}
          alt={item.title || "Slide image"}
          className={`w-full min-h-[50vh] max-h-[100vh] h-[100vh] object-cover ${extraClasses}`}
        />
      );
    }

    // VIDEO
    return (
      <video
        autoPlay
        muted
        loop
        playsInline
        className={`w-full min-h-[50vh] max-h-[100vh] h-[100vh] object-cover ${extraClasses}`}
        aria-label={item.title || "Slide video"}
      >
        <source src={getImageUrl(item.mediaUrl)} type="video/mp4" />
      </video>
    );
  };

  const renderMediaWithButton = (item, extraClasses = "") => {
    return (
      <div className="relative w-full h-full">
        {renderMedia(item, extraClasses)}
        
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

  while (i < firstMedias.length) {
    if (toggleHalf && i + 1 < firstMedias.length) {
      const media1 = firstMedias[i];
      const media2 = firstMedias[i + 1];

      slides.push(
        <div key={`half-${i}`} className="relative">
          <div className="flex flex-col sm:flex-row w-full min-h-[50vh] max-h-[100vh] h-[100vh]">
            {[media1, media2].map((item, idx) => (
              <div
                key={idx}
                className="w-full sm:w-1/2 relative min-h-[50vh] max-h-[100vh] h-[100vh]"
              >
                {renderMediaWithButton(item, "min-h-[50vh] max-h-[100vh] h-[100vh]")}
              </div>
            ))}
          </div>
        </div>
      );
      i += 2;
    } else {
      const item = firstMedias[i];
      slides.push(
        <div key={`full-${i}`} className="relative">
          <div className="relative">
            {renderMediaWithButton(
              item,
              isMobile
                ? "min-h-screen max-h-screen h-screen"
                : "min-h-[50vh] max-h-[100vh] h-[100vh]"
            )}
          </div>
        </div>
      );
      i += 1;
    }
    toggleHalf = !toggleHalf;
  }

  const settings = {
    dots: false,
    infinite: true,
    speed: 700,
    slidesToShow: 1,
    slidesToScroll: 1,
    fade: true,
    arrows: false,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          adaptiveHeight: true,
        },
      },
    ],
  };

  // Keyboard nav
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") sliderRef.current?.slickNext();
      if (e.key === "ArrowLeft") sliderRef.current?.slickPrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!slides.length) return null;

  return (
    <div className="overflow-hidden relative" style={{ marginBottom: "-6px" }}>
      <Slider ref={sliderRef} {...settings}>
        {slides}
      </Slider>

      {/* CTA: NEW IN */}
      {showCta && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleNavigate(ctaHref);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleNavigate(ctaHref);
            }
          }}
          aria-label={`${ctaText} – navigate`}
          className="
            absolute z-[60]
            right-10 bottom-10 md:right-20 md:bottom-20
            bg-white text-black
            px-8 md:px-14 py-2 md:py-2.5
            text-base md:text-xl uppercase tracking-wider
            border-2 border-transparent hover:border-2 hover:border-black
            transition
            cursor-pointer
          "
        >
          {ctaText}
        </button>
      )}

      {/* Prev / Next buttons (only if more than one slide) */}
      {slides.length > 1 && (
        <>
          <button
            onClick={() => sliderRef.current?.slickPrev()}
            className="hidden md:block absolute top-1/2 left-5 -translate-y-1/2 z-50 text-white text-5xl bg-transparent cursor-pointer"
            aria-label="Previous slide"
          >
            ‹
          </button>

          <button
            onClick={() => sliderRef.current?.slickNext()}
            className="hidden md:block absolute top-1/2 right-5 -translate-y-1/2 z-50 text-white text-5xl bg-transparent cursor-pointer p-3 rounded-full"
            aria-label="Next slide"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
};

SlickCarouselFirst.propTypes = {
  medias: PropTypes.object,
  isMobile: PropTypes.bool,
  showCta: PropTypes.bool,
  ctaText: PropTypes.string,
  ctaHref: PropTypes.string,
};

export default SlickCarouselFirst;
