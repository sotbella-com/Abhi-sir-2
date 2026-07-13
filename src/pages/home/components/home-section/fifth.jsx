import { getImageUrl, handleNavigate } from "@/utils/url";
import { Link } from "react-router-dom";

const SlickCarouselFifth = ({ medias = [] }) => {
  const mediaItem = medias?.FIFTH?.[0]?.media?.[0];

  if (!mediaItem) return null;

  return (
    <section className="relative w-full h-full">
      <div className="w-full h-full relative">
        {mediaItem.type === "IMAGE" ? (
          <img
            src={getImageUrl(mediaItem.mediaUrl)}
            alt={mediaItem.title || "Image"}
            className="w-full h-full object-cover"
          />
        ) : (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            aria-label={mediaItem.title || "Video"}
          >
            <source src={getImageUrl(mediaItem.mediaUrl)} type="video/mp4" />
          </video>
        )}

        {/* Button overlay - only show if title exists */}
        {mediaItem.title && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (mediaItem.link) {
                  handleNavigate(mediaItem.link);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (mediaItem.link) {
                    handleNavigate(mediaItem.link);
                  }
                }
              }}
              aria-label={`${mediaItem.title} – navigate`}
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
              {mediaItem.title}
            </button>
          </div>
        )}

        {/* Bottom overlay with "See all" link if no title button */}
        {!mediaItem.title && mediaItem.link && (
          <div className="flex justify-between items-center absolute top-0 left-0 p-5 text-black w-full">
            <Link
              to={mediaItem.link}
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
    </section>
  );
};

export default SlickCarouselFifth;
