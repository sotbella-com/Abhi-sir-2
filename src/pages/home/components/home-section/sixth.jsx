import { getImageUrl, getRemainingPath, handleNavigate } from "@/utils/url";
import { Link } from "react-router-dom";

const SlickCarouselSixth = ({ medias = [] }) => {
  const sixthMedias = (medias?.SIXTH && medias?.SIXTH[0]?.media) || [];

  const mainItem = sixthMedias[0];
  const topRightItem = sixthMedias[1];
  const bottomRightItem = sixthMedias[2];

  const renderMedia = (item, extraClasses = "") => {
    if (!item) return null;

    return item.type === "IMAGE" ? (
      <img
        src={getImageUrl(item.mediaUrl)}
        alt={item.title || "Image"}
        className={`w-full h-full object-cover ${extraClasses}`}
      />
    ) : (
      <video
        autoPlay
        muted
        loop
        playsInline
        className={`w-full h-full object-cover ${extraClasses}`}
        aria-label={item.title || "Video"}
      >
        <source src={getImageUrl(item.mediaUrl)} type="video/mp4" />
      </video>
    );
  };

  const renderMediaWithButton = (item, extraClasses = "") => {
    if (!item) return null;

    return (
      <div className={`relative w-full h-full ${extraClasses}`}>
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
                px-6 md:px-8 py-2 md:py-3
                text-sm md:text-base uppercase tracking-wider
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

  return (
    <section className="relative w-full">
      <div className="w-full">
        {/* Desktop Layout */}
        <div className="hidden md:flex w-full h-full">
          <div className="w-2/3">
            <div className="relative w-full h-[100vh]">
              {renderMediaWithButton(mainItem)}
            </div>
          </div>

          <div className="w-1/3 flex flex-col">
            {[topRightItem, bottomRightItem].map((item, i) => (
              <div key={i} className="relative w-full h-[50vh]">
                {renderMediaWithButton(item)}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="block md:hidden">
          {[mainItem, topRightItem, bottomRightItem].map((item, i) => (
            <div key={i} className="relative w-full h-[80vh]">
              {renderMediaWithButton(item)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SlickCarouselSixth;
