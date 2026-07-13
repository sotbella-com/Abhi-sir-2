import { Fragment, useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { getRequest } from "@/utils/apiService";
import ReactStars from "react-rating-stars-component";
import { useNavigate } from "react-router-dom";
import RatingReviewModal from "./RatingReviewModal";
import { useAuth } from "@/context/AuthContext";
import { useMobile } from "@/components/molecules";
const ProductReviews = ({ data }) => {
  const isMobile = useMobile();
  const [open, setOpen] = useState(false);
  const [reviewList, setReviewList] = useState([]);
  const [handleRefresh, setHandleRefresh] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState({});

  //const [isExpanded, setIsExpanded] = useState(false);
  const [viewMore, setViewMore] = useState(4);
  const [toggleView, setToggleView] = useState(false);
  const { id } = useParams();

  const { user } = useAuth();
  const location = useLocation();

  const navigate = useNavigate();

  const maxLength = 100;

  const handleNavigate = () => {
    if (!user?.id) {
      navigate("/main-login");
      localStorage.setItem("reviewRedirect", location.pathname);
    } else {
      setOpen(true);
    }
  };

  const handleViewMore = () => {
    setViewMore(reviewList.length);
    setToggleView(!toggleView);
  };

  const handleDetailPage = (item) => {
    navigate(`/product/${item.id}`);
    // naviagte("/customer-address");
  };

  const getReviewList = async () => {
    try {
      const response = await getRequest(`v1/customer/rating/${id}`);
      setReviewList(response.data.ratings);
    } catch (error) {
      (error.message);
    }
  };

  const getDisplayText = (text, index) => {
    return expandedReviews[index] ? text : `${text.slice(0, maxLength)}...`;
  };

  const toggleExpand = (index) => {
    setExpandedReviews((prev) => ({
      ...prev,
      [index]: !prev[index], // Toggle the specific review's expanded state
    }));
  };

  // const loading = false;

  useEffect(() => {
    if (id) {
      getReviewList();
    }
    // setHandleRefresh(!handleRefresh);
  }, [id, handleRefresh]);

  return (
    <Fragment>
      <div style={{ paddingInline: isMobile ? "12px" : "75px" }}>
        <div className="w-full px-4 mb-2 text-left pt-[21px]">
          <p className="uppercase text-black text-xs md:text-[18px] font-normal leading-[36px] mb-[36px sm:leading-normal">
            Have a question about this?
          </p>
        </div>

        <div className="w-full md:w-[40%] px-4">
          <div className="border border-black/50 p-5">
            <p className="uppercase text-sm font-medium mb-3 flex items-center justify-between">
              <span>Ratings & reviews</span>
              <span className="flex gap-1 text-gray-400 text-sm">
                <i className="fa fa-star-o" />
                <i className="fa fa-star-o" />
                <i className="fa fa-star-o" />
                <i className="fa fa-star-o" />
                <i className="fa fa-star-o" />
              </span>
            </p>
            <p
              className="text-xs font-normal mt-2 cursor-pointer"
              onClick={handleNavigate}
            >
              Write a review...
            </p>
          </div>
        </div>
      </div>
      <RatingReviewModal
        open={open}
        handleClose={() => setOpen(false)}
        data={data}
        setHandleRefresh={setHandleRefresh}
        handleRefresh={handleRefresh}
      />
      <div style={{ paddingInline: isMobile ? "12px" : "75px" }}>
        <div className="w-full px-4 mb-2 text-left pt-[21px]">
          <p className="uppercase text-black text-xs md:text-[18px] font-normal leading-[36px] mb-[36px] sm:leading-normal">
            {reviewList?.length > 0
              ? "What do customers say"
              : "No review on that product"}
          </p>
        </div>

        <div className="flex flex-wrap">
          {reviewList.length > 0 &&
            reviewList
              .slice(0, toggleView ? viewMore : 4)
              .map((item, index) => (
                <div key={index} className="w-full sm:w-1/2 lg:w-1/4 mt-4">
                  <div className="border border-black p-3">
                    {item?.media ? (
                      <div className="h-[150px] flex flex-col justify-between items-center overflow-hidden">
                        {item?.media.match(/\.(mp4|webm|ogg)$/) ? (
                          <video
                            src={item.media}
                            controls
                            className="max-w-full max-h-[150px] object-cover"
                          />
                        ) : (
                          <img
                            src={item.media}
                            alt=""
                            className="max-w-full max-h-[130px] object-cover"
                          />
                        )}
                      </div>
                    ) : null}

                    <div className="flex justify-between items-center mt-3">
                      <div>
                        <h3 className="text-sm font-semibold uppercase">
                          {item?.customer?.firstName} {item?.customer?.lastName}
                        </h3>
                        <p className="text-xs text-black/50">
                          {new Date(item.createdAt).toLocaleDateString(
                            "en-GB",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </div>
                      <div>
                        <ReactStars
                          value={item?.rating}
                          count={5}
                          size={22}
                          activeColor="#f5970a"
                          edit={false}
                        />
                      </div>
                    </div>

                    <div className="mt-2 text-sm">
                      <p>
                        {getDisplayText(item?.message, index)}{" "}
                        {item?.message.length > maxLength && (
                          <button
                            onClick={() => toggleExpand(index)}
                            className="text-blue-600 mt-2 hover:underline"
                          >
                            {expandedReviews[index] ? "See Less" : "See More"}
                          </button>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex w-full border-l border-r border-b border-black p-2 gap-2">
                    <div>
                      <img
                        className="max-w-full h-[60px]"
                        src={
                          Array.isArray(data?.product?.productImages) &&
                          data?.product?.productImages?.length &&
                          data?.product?.productImages[0].image
                        }
                        alt=""
                      />
                    </div>
                    <div className="flex flex-col justify-between">
                      <h3 className="text-[10px] font-semibold">
                        {data?.product?.title}
                      </h3>
                      <div>
                        <button
                          type="button"
                          onClick={() => handleDetailPage(data.product)}
                          className="text-xs mt-1 flex items-center gap-1 bg-black/5 px-2 py-1"
                        >
                          View Product
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 13 13"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M10.6672 6.33887L2.79297 6.33887"
                              stroke="black"
                              strokeWidth="0.738198"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M8.20708 8.80029C8.20708 8.80029 10.6677 6.98804 10.6677 6.3396C10.6677 5.69116 8.20703 3.87891 8.20703 3.87891"
                              stroke="black"
                              strokeWidth="0.738198"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

          {reviewList?.length !== 0 && (
            <div className="w-full mt-4">
              <p
                onClick={handleViewMore}
                className="text-[12px] uppercase text-[#1d1d1d] cursor-pointer"
              >
                {!toggleView ? "View More" : "View Less"}
              </p>
            </div>
          )}
        </div>
      </div>
    </Fragment>
  );
};

export default ProductReviews;
