import { Fragment, useEffect, useState, useMemo } from "react";
import heartImg from "@/assets/images/blackheart1.png";
import redHeart from "@/assets/images/black-heart-icon.png";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useWishlistStore } from "@/context/wishlistStore";
import { useAuth } from "@/context/AuthContext";
import { useUnifiedCartStore } from "@/context/unifiedCartStore";
// ❌ removed CURRENCY_SYMBOL import
import { sortProducts } from "@/utils/sortProducts";
import { trackClickSearch } from "@/api/services/einsteinTracking";

const SearchProduct = ({ searchProduct, observerRef, loading, sortBy }) => {
  const { addToBasket } = useUnifiedCartStore();
  const addToWishlist = useWishlistStore((state) => state.addToWishlist);
  const removeFromWishlist = useWishlistStore((state) => state.removeFromWishlist);
  const wishListProduct = useWishlistStore((state) => state.wishListProduct);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  /* ---------- currency helpers ---------- */
  const getItemCurrency = (item = {}) =>
    item.currency ||
    item.displayCurrency ||
    item.priceCurrency ||
    (Array.isArray(item.childProducts) && item.childProducts[0]?.currency) ||
    "";

  const formatItemPrice = (item = {}, field = "price") => {
    const currency = getItemCurrency(item);
    const raw = item?.[field];
    const num = Number(raw ?? 0);
    if (!currency && !num) return "0";
    if (!currency) return num.toFixed(2);
    return `${currency} ${num.toFixed(2)}`;
  };
  /* -------------------------------------- */

  // Sort products based on the sortBy parameter
  const sortedProducts = useMemo(() => {
    return sortProducts(searchProduct, sortBy);
  }, [searchProduct, sortBy]);

  const fetchWishlist = useWishlistStore((state) => state.fetchWishlist);
  const isInWishlistStore = useWishlistStore((state) => state.isInWishlist);

  // Fetch wishlist on mount if authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchWishlist({ customerId: user.id });
    }
  }, [isAuthenticated, user?.id, fetchWishlist]);

  // Use store's isInWishlist function for consistency
  const inWishlist = (productId) => {
    if (!productId) return false;
    return isInWishlistStore(productId);
  };

  const handleAddToWishlist = async (item) => {
    if (!item?.id) return;

    if (inWishlist(item.id)) {
      await removeFromWishlist({
        productId: item.id,
        navigate,
        customerId: user?.id,
      });
    } else {
      await addToWishlist({ item, isAuthenticated, navigate, customerId: user?.id });
    }
  };

  const handleDetailPage = (item) => {
    // Track clickSearch for Einstein Commerce Cloud
    if (searchText) {
      trackClickSearch(searchText, item, searchProduct.map(p => ({ id: p.id || p.productId })));
    }
    navigate(`/product/${item.id}`);
  };

  const addProductToCart = (id) => {
    if (!id) return;

    // Find the main product by ID
    const mainProduct = searchProduct.find((item) => item.id === id);
    if (mainProduct) {
      addToBasket(mainProduct.id, 1);
      return;
    }

    // Find a matching child product
    const childProduct = searchProduct
      .flatMap((item) => item.childProducts || [])
      .find((childItem) => childItem.id === id);

    if (childProduct) {
      addToBasket(childProduct.id, 1);
    }
  };

  // Fetch wishlist on mount and when products change
  useEffect(() => {
    const fetchWishlist = async () => {
      if (isAuthenticated && user?.id) {
        const { fetchWishlist } = useWishlistStore.getState();
        await fetchWishlist({ customerId: user.id });
      }
    };
    fetchWishlist();
  }, [isAuthenticated, user?.id, sortedProducts.length]);

  return (
    <Fragment>
      <div>
        <div id="collection3" className="collections active">
          <div className="container-fluid row p-0 g-0">
            {Array.isArray(sortedProducts) &&
              sortedProducts.length > 0 &&
              sortedProducts.map((item, index) => (
                <div
                  key={item.id || index}
                  className="col-md-3 p-0 four-image2last12shs5 section3text col-6"
                  style={{
                    cursor: "pointer",
                    position: "relative",
                  }}
                >
                  <div
                    className="image2last12ssA5"
                    onClick={() => handleDetailPage(item)}
                  >
                    <div className="image-slider">
                      {Array.isArray(item.productImages) &&
                        item.productImages.length > 0 &&
                        item.productImages.map((image) => (
                          <div className="image shimmer" key={image.id}>
                            <img src={image.image} alt="Image" />
                          </div>
                        ))}
                    </div>
                  </div>
                  <div className="wishlist">
                    <img
                      src={inWishlist(item.id) ? redHeart : heartImg}
                      style={{ width: "20px", cursor: "pointer" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToWishlist(item);
                      }}
                      alt="Wishlist Icon"
                    />
                  </div>

                  <div className="product-c3">
                    <h6 style={{ fontWeight: 400, position: "relative" }}>
                      {item.title}
                    </h6>
                    <p style={{ color: "#000", position: "relative" }}>
                      {formatItemPrice(item, "price")}
                      {item?.displayPrice !== item?.price && item?.displayPrice && (
                        <span
                          style={{
                            color: "#1D1D1D80",
                            marginLeft: "4px",
                            fontSize: "14px",
                          }}
                        >
                          <del>{formatItemPrice(item, "displayPrice")}</del>
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Desktop add-to-cart hover */}
                  <div className="add-to-cart-btn  mobile-hide">
                    <div
                      className="add-cart-icon-pro"
                      style={{ background: "#1d1d1d57", top: "83%" }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="cart-iconn"
                      >
                        <path
                          d="M14.6002 7.99981L1.40082 7.99982M8.00049 1.40015L8.00048 14.5995"
                          stroke="white"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div
                      className="Add-cart-multiple-bttn"
                      style={{ top: "80%" }}
                    >
                      <h3>Add to Cart</h3>
                      <div className="multiple-size-bttn">
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => addProductToCart(item.id)}
                          className={`${
                            item?.stock < 1 ? "out-of-stock-on-collection" : ""
                          }`}
                        >
                          {item.size?.name}
                        </button>{" "}
                        {Array.isArray(item.childProducts) &&
                          item.childProducts.map((size) => (
                            <button
                              type="button"
                              className={`${
                                size?.stock < 1
                                  ? "out-of-stock-on-collection"
                                  : ""
                              }`}
                              key={size.id}
                              onClick={() => addProductToCart(size.id)}
                            >
                              {size.size?.name}
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>

                  {/* Mobile add-to-cart hover */}
                  <div id="collection_small">
                    <div className="add-to-cart-btn desktop-hide">
                      <div
                        className="add-cart-icon-pro"
                        style={{ background: "#1d1d1d57" }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="cart-iconn"
                        >
                          <path
                            d="M14.6002 7.99981L1.40082 7.99982M8.00049 1.40015L8.00048 14.5995"
                            stroke="white"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <div className="Add-cart-multiple-bttn">
                        <h3>Add to Cart</h3>
                        <div className="multiple-size-bttn">
                          <button
                            type="button"
                            key={item.id}
                            onClick={() => addProductToCart(item.id)}
                            className={`${
                              item?.stock < 1
                                ? "out-of-stock-on-collection"
                                : ""
                            }`}
                          >
                            {item.size?.name}
                          </button>{" "}
                          {Array.isArray(item.childProducts) &&
                            item.childProducts.map((size) => (
                              <button
                                type="button"
                                className={`${
                                  size?.stock < 1
                                    ? "out-of-stock-on-collection"
                                    : ""
                                }`}
                                key={size.id}
                                onClick={() => addProductToCart(size.id)}
                              >
                                {size.size?.name}
                              </button>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}{" "}
          </div>
        </div>
      </div>
      <div
        ref={observerRef}
        style={{ height: 10, background: "transparent" }}
      ></div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        {loading ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid"
            width="92"
            height="92"
            style={{
              shapeRendering: "auto",
              display: "block",
              background: "transparent",
            }}
          >
            <g>
              <g transform="rotate(0 50 50)">
                <rect
                  fill="#0c0607"
                  height="12"
                  width="6"
                  ry="6"
                  rx="3"
                  y="25"
                  x="47"
                >
                  <animate
                    repeatCount="indefinite"
                    begin="-0.9166666666666666s"
                    dur="1s"
                    keyTimes="0;1"
                    values="1;0"
                    attributeName="opacity"
                  />
                </rect>
              </g>
              <g transform="rotate(30 50 50)">
                <rect
                  fill="#0c0607"
                  height="12"
                  width="6"
                  ry="6"
                  rx="3"
                  y="25"
                  x="47"
                >
                  <animate
                    repeatCount="indefinite"
                    begin="-0.8333333333333334s"
                    dur="1s"
                    keyTimes="0;1"
                    values="1;0"
                    attributeName="opacity"
                  />
                </rect>
              </g>
              <g transform="rotate(60 50 50)">
                <rect
                  fill="#0c0607"
                  height="12"
                  width="6"
                  ry="6"
                  rx="3"
                  y="25"
                  x="47"
                >
                  <animate
                    repeatCount="indefinite"
                    begin="-0.75s"
                    dur="1s"
                    keyTimes="0;1"
                    values="1;0"
                    attributeName="opacity"
                  />
                </rect>
              </g>
              <g transform="rotate(90 50 50)">
                <rect
                  fill="#0c0607"
                  height="12"
                  width="6"
                  ry="6"
                  rx="3"
                  y="25"
                  x="47"
                >
                  <animate
                    repeatCount="indefinite"
                    begin="-0.6666666666666666s"
                    dur="1s"
                    keyTimes="0;1"
                    values="1;0"
                    attributeName="opacity"
                  />
                </rect>
              </g>
              <g transform="rotate(120 50 50)">
                <rect
                  fill="#0c0607"
                  height="12"
                  width="6"
                  ry="6"
                  rx="3"
                  y="25"
                  x="47"
                >
                  <animate
                    repeatCount="indefinite"
                    begin="-0.5833333333333334s"
                    dur="1s"
                    keyTimes="0;1"
                    values="1;0"
                    attributeName="opacity"
                  />
                </rect>
              </g>
              <g transform="rotate(150 50 50)">
                <rect
                  fill="#0c0607"
                  height="12"
                  width="6"
                  ry="6"
                  rx="3"
                  y="25"
                  x="47"
                >
                  <animate
                    repeatCount="indefinite"
                    begin="-0.5s"
                    dur="1s"
                    keyTimes="0;1"
                    values="1;0"
                    attributeName="opacity"
                  />
                </rect>
              </g>
              <g transform="rotate(180 50 50)">
                <rect
                  fill="#0c0607"
                  height="12"
                  width="6"
                  ry="6"
                  rx="3"
                  y="25"
                  x="47"
                >
                  <animate
                    repeatCount="indefinite"
                    begin="-0.4166666666666667s"
                    dur="1s"
                    keyTimes="0;1"
                    values="1;0"
                    attributeName="opacity"
                  />
                </rect>
              </g>
              <g transform="rotate(210 50 50)">
                <rect
                  fill="#0c0607"
                  height="12"
                  width="6"
                  ry="6"
                  rx="3"
                  y="25"
                  x="47"
                >
                  <animate
                    repeatCount="indefinite"
                    begin="-0.3333333333333333s"
                    dur="1s"
                    keyTimes="0;1"
                    values="1;0"
                    attributeName="opacity"
                  />
                </rect>
              </g>
              <g transform="rotate(240 50 50)">
                <rect
                  fill="#0c0607"
                  height="12"
                  width="6"
                  ry="6"
                  rx="3"
                  y="25"
                  x="47"
                >
                  <animate
                    repeatCount="indefinite"
                    begin="-0.25s"
                    dur="1s"
                    keyTimes="0;1"
                    values="1;0"
                    attributeName="opacity"
                  />
                </rect>
              </g>
              <g transform="rotate(270 50 50)">
                <rect
                  fill="#0c0607"
                  height="12"
                  width="6"
                  ry="6"
                  rx="3"
                  y="25"
                  x="47"
                >
                  <animate
                    repeatCount="indefinite"
                    begin="-0.16666666666666666s"
                    dur="1s"
                    keyTimes="0;1"
                    values="1;0"
                    attributeName="opacity"
                  />
                </rect>
              </g>
              <g transform="rotate(300 50 50)">
                <rect
                  fill="#0c0607"
                  height="12"
                  width="6"
                  ry="6"
                  rx="3"
                  y="25"
                  x="47"
                >
                  <animate
                    repeatCount="indefinite"
                    begin="-0.08333333333333333s"
                    dur="1s"
                    keyTimes="0;1"
                    values="1;0"
                    attributeName="opacity"
                  />
                </rect>
              </g>
              <g transform="rotate(330 50 50)">
                <rect
                  fill="#0c0607"
                  height="12"
                  width="6"
                  ry="6"
                  rx="3"
                  y="25"
                  x="47"
                >
                  <animate
                    repeatCount="indefinite"
                    begin="0s"
                    dur="1s"
                    keyTimes="0;1"
                    values="1;0"
                    attributeName="opacity"
                  />
                </rect>
              </g>
              <g />
            </g>
          </svg>
        ) : (
          ""
        )}
      </div>
    </Fragment>
  );
};

export default SearchProduct;
