import { Fragment, useState, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Loader from "../../../Loader";
// import productsService from "@/api/services/products";
import { useQuery } from "@tanstack/react-query";

const ProductImageGallery = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const imageRefs = useRef([]);

  const { data: productData, isLoading } = useQuery({
    queryKey: ["product", { id }],
    queryFn: productsService.productById,
    enabled: !!id,
  });
  const data = productData?.data ?? {};

  const handleClick = () => {
    setIsOpen(false); // Close the popup
    navigate(`/product/slug/${id}`);
  };

  const handleThumbnailClick = (index) => {
    setSelectedImageIndex(index);
    if (imageRefs.current[index]) {
      imageRefs.current[index].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  const handleScroll = (e) => {
    const scrollPosition = e.target.scrollTop;
    const imageHeight =
      e.target.scrollHeight / data.product.productImages.length;
    const index = Math.round(scrollPosition / imageHeight);
    setSelectedImageIndex(index);
  };

  return (
    <Fragment>
      <div>
        {isLoading ? (
          <Loader />
        ) : (
          <div
            id="popup"
            className="fixed inset-0 bg-white flex items-center justify-center z-[9999]"
          >
            {data?.product?.productImages?.length > 0 && (
              <div
                id="new-pop-up-container"
                className="w-full h-screen py-5 px-4 flex flex-col"
              >
                <div className="flex flex-1">
                  {/* Left spacer for desktop */}
                  <div className="hidden md:block w-[8.333%]"></div>

                  {/* Left Thumbnails */}
                  <div className="w-3/12 md:w-2/12 h-screen overflow-y-auto space-y-4 scrollbar-hide mr-5">
                    {data.product.productImages.map(
                      (image, idx) =>
                        image.type === "product" && (
                          <div
                            key={idx}
                            onClick={() => handleThumbnailClick(idx)}
                            className="cursor-pointer"
                          >
                            <Link to="#thumb">
                              <img
                                src={image.image}
                                alt={`Thumbnail ${idx + 1}`}
                                className={`w-full max-h-[250px] object-contain border ${
                                  selectedImageIndex === idx
                                    ? "border-black"
                                    : "border-transparent"
                                }`}
                              />
                            </Link>
                          </div>
                        )
                    )}
                  </div>

                  {/* Right Large Image Display */}
                  <div className="w-9/12 md:w-8/12 relative flex justify-center">
                    <div
                      className="overflow-y-auto h-screen snap-y snap-mandatory scrollbar-hide"
                      onScroll={handleScroll}
                    >
                      {data.product.productImages.map(
                        (image, idx) =>
                          image.type === "product" && (
                            <img
                              ref={(el) => (imageRefs.current[idx] = el)}
                              src={image.image}
                              alt={`Main Product ${idx + 1}`}
                              key={idx}
                              className="w-full object-contain snap-start transition-opacity duration-300 opacity-100"
                            />
                          )
                      )}
                    </div>

                    {/* Close Button */}
                    <button
                      onClick={handleClick}
                      className="absolute top-5 right-5 w-10 h-10 bg-white/40 rounded-full flex items-center justify-center hover:bg-white transition"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M15 1L1 15M1 1L15 15"
                          stroke="black"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Fragment>
  );
};

export default ProductImageGallery;
