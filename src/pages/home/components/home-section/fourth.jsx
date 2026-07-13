import { getImageUrl, getRemainingPath, handleNavigate } from "@/utils/url";
import { useRef } from "react";
import { Link } from "react-router-dom";

const SlickCarouselFourth = ({ medias = [] }) => {
  const containerRef = useRef();

  const fourthMedias = (medias?.FOURTH && medias?.FOURTH[0]?.media) || [];

  // Group into pairs [0,1], [2,3], ...
  const groupedSlides = [];
  for (let i = 0; i < fourthMedias.length; i += 2) {
    groupedSlides.push(fourthMedias.slice(i, i + 2));
  }

  // Duplicate for continuous scroll effect
  const fullSlides = [...groupedSlides, ...groupedSlides];

  return (
    <section className="hidden md:block relative overflow-x-hidden whitespace-nowrap w-full">
      <div
        ref={containerRef}
        className="flex w-full overflow-x-hidden scroll-smooth"
      >
        {fullSlides.map((group, index) => (
          <div key={index} className="flex min-w-full">
            {group.map((subItem, subIndex) => (
              <div key={subIndex} className="w-1/2 h-full">
                <div className="relative w-full h-full overflow-hidden">
                  {subItem.type === "IMAGE" ? (
                    <img
                      src={getImageUrl(subItem.mediaUrl)}
                      alt={subItem.title || "Image"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                      aria-label={subItem.title || "Video"}
                    >
                      <source
                        src={getImageUrl(subItem.mediaUrl)}
                        type="video/mp4"
                      />
                    </video>
                  )}

                  {/* Button overlay - only show if title exists */}
                  {subItem.title && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (subItem.link) {
                            handleNavigate(subItem.link);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            if (subItem.link) {
                              handleNavigate(subItem.link);
                            }
                          }
                        }}
                        aria-label={`${subItem.title} – navigate`}
                        className="
                          bg-white text-black
                          px-6 md:px-8 py-2 md:py-3
                          text-sm md:text-base uppercase tracking-wider
                          border-2 border-transparent hover:border-2 hover:border-black
                          transition-all duration-300
                          cursor-pointer
                          shadow-lg hover:shadow-xl
                          transform hover:scale-105
                        "
                      >
                        {subItem.title}
                      </button>
                    </div>
                  )}

                  {/* Bottom overlay with "See all" link if no title button */}
                  {!subItem.title && subItem.link && (
                    <div className="flex justify-between items-center absolute bottom-5 text-black p-5 w-full">
                      <Link
                        to={getRemainingPath(subItem.link)}
                        className="
                          relative uppercase tracking-wide text-sm mt-2 inline-block
                          after:content-[''] after:absolute after:left-1/2 after:bottom-0
                          after:h-[1px] after:w-full after:bg-current after:scale-x-0
                          after:origin-center after:-translate-x-1/2 after:transition-transform
                          after:duration-300 hover:after:scale-x-100
                        "
                      >
                        See all
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
};

export default SlickCarouselFourth;
