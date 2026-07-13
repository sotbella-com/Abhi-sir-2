import { useEffect, useMemo, useState } from "react";
import { getImageUrl } from "@/utils/url";
import cartIcon from "@/public/cart.png";
import { useMobile } from "@/components/molecules";

export const ProductImage = ({ item, children, addProductToCart }) => {
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Track loading for each src to avoid flicker on hover
  const [loadedBase, setLoadedBase] = useState(false);
  const [loadedHover, setLoadedHover] = useState(false);

  const isMobile = useMobile();

  const mainImage  = item?.productImages?.[0];
  const hoverImage = item?.productImages?.[1]; // optional
  if (!Array.isArray(item?.productImages) || !mainImage) return null;

  const baseSrc  = useMemo(() => getImageUrl(mainImage?.image), [mainImage?.image]);
  const hoverSrc = useMemo(() => hoverImage ? getImageUrl(hoverImage?.image) : null, [hoverImage?.image]);

  // Reset when item changes
  useEffect(() => {
    setLoadedBase(false);
    setLoadedHover(false);
  }, [baseSrc, hoverSrc]);

  // Preload base
  useEffect(() => {
    if (!baseSrc) return;
    const img = new Image();
    const done = () => setLoadedBase(true);
    img.onload = done;
    img.onerror = done;
    img.src = baseSrc;
    return () => { img.onload = null; img.onerror = null; };
  }, [baseSrc]);

  // Preload hover (if present)
  useEffect(() => {
    if (!hoverSrc) return;
    const img = new Image();
    const done = () => setLoadedHover(true);
    img.onload = done;
    img.onerror = done;
    img.src = hoverSrc;
    return () => { img.onload = null; img.onerror = null; };
  }, [hoverSrc]);

  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };

  // show shimmer while base image not loaded
  const showShimmer = !loadedBase;

  return (
    <div
      key={mainImage?.id}
      className="relative overflow-hidden h-[40vh] sm:h-auto"
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
    >
      {/* IMAGE AREA */}
      <div className="relative w-full group/image">
        {/* Aspect holder to prevent layout shift (tweak heights as needed) */}
        <div className="w-full h-[320px] md:h-[420px] relative">
          {/* Base image */}
          <img
            src={baseSrc}
            alt="Product"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out
              ${loadedBase ? (isHovered && hoverSrc ? "opacity-0 group-hover/image:opacity-0" : "opacity-100") : "opacity-0"}`}
            draggable={false}
          />

          {/* Hover image */}
          {hoverSrc && (
            <img
              src={hoverSrc}
              alt=""
              aria-hidden="true"
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-in-out
                ${loadedHover ? (isHovered ? "opacity-100 scale-100" : "opacity-0 scale-110") : "opacity-0"}
              `}
              style={{ willChange: "transform, opacity" }}
              draggable={false}
            />
          )}

          {/* SHIMMER overlay */}
          {showShimmer && (
            <div className="absolute inset-0">
              <div className="absolute inset-0 shimmer rounded-none" />
            </div>
          )}
        </div>
      </div>

      {/* Wishlist Icon (unchanged) */}
      <div className="absolute top-2 right-2 z-10 cursor-pointer">{children}</div>

      {/* MOBILE backdrop (tap outside to close) */}
      {isMobile && isOpenMobile && (
        <button
          aria-label="Close add-to-cart"
          className="absolute inset-0 z-10 cursor-pointer"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Cart Icon + Panel */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div className="relative inline-block pointer-events-auto group">
          {/* Cart Icon */}
          <button
            type="button"
            aria-label="Open sizes"
            onClick={(e) => {
              stop(e);
              if (isMobile) setIsOpenMobile((v) => !v);
            }}
            onMouseDown={stop}
            onTouchStart={stop}
            className="inline-flex"
          >
            <img
              src={cartIcon}
              alt="Cart Icon"
              className={`w-8 h-8 cursor-pointer transition-transform duration-500 ease-in-out
                ${isMobile
                  ? isOpenMobile
                    ? "opacity-0 scale-95"
                    : "opacity-100"
                  : "group-hover:scale-95 group-hover:opacity-0"}`}
            />
          </button>

          {/* Sliding Cart Content */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 -bottom-2
              w-42 sm:w-52 md:w-42 xl:w-62 bg-black/10 backdrop-blur-sm px-1 py-2 md:p-3 shadow-xl z-20
              transition-transform duration-500 ease-in-out
              ${isMobile
                ? isOpenMobile
                  ? "translate-y-0 scale-100 opacity-100"
                  : "translate-y-full scale-90 opacity-0"
                : "translate-y-full scale-90 opacity-0 group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100"}`}
            onClick={stop}
            onMouseDown={stop}
            onTouchStart={stop}
          >
            {/* Header with optional close on mobile */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs md:text-sm font-medium text-white mx-auto">Add to Cart</h3>
              {isMobile && (
                <button
                  aria-label="Close"
                  className="absolute right-2 top-2 text-white/80 text-xs"
                  onClick={(e) => { stop(e); setIsOpenMobile(false); }}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1 sm:gap-2 justify-center">
              {/* Parent Size */}
              <button
                type="button"
                onClick={(e) => {
                  stop(e);
                  addProductToCart(item.id);
                  if (isMobile) setIsOpenMobile(false);
                }}
                className={`text-[10px] md:text-xs px-1 py-0.5 sm:px-2 sm:py-1 ${
                  item?.stock < 1 ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-white text-black"
                }`}
                disabled={item?.stock < 1}
              >
                {item?.size?.name}
              </button>

              {/* Child Sizes */}
              {(item?.childProducts || []).map((size) => {
                const disabled = !size?.id || size?.stock < 1;
                return (
                  <button
                    key={size.id}
                    type="button"
                    onClick={(e) => {
                      stop(e);
                      if (disabled) return;
                      addProductToCart(size.id, item.productImages);
                      if (isMobile) setIsOpenMobile(false);
                    }}
                    className={`text-[10px] md:text-xs px-1 py-0.5 sm:px-2 sm:py-1 ${
                      disabled ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-white text-black"
                    }`}
                    disabled={disabled}
                  >
                    {size?.size?.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
