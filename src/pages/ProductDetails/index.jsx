import React, { Fragment, useEffect, useState, Suspense } from "react";
import { useLocation, useParams } from "react-router-dom";
import ChakraProductDetails from "./ChakraProductDetails";
import { useUnifiedCartStore } from "@/context/unifiedCartStore";
import { useAuth } from "@/context/AuthContext";
import LogoNavbar from "@/components/layouts/LogoNavbar";
import CartQuickView from "./components/cartQuickView";
import Footer from "@/NewHomePage/components/footer/Footer";
import { Center, Spinner } from "@chakra-ui/react";
import ShimmerGridProducts from "@/components/layouts/Simmers/ShimmerGridProducts";
import { Flex } from "antd";
import { Image as ChakraImage } from "@chakra-ui/react";

// ✅ Performance Optimization: Code splitting - Lazy load similar product components
const SimilarProducts = React.lazy(
  () => import("./components/similarProducts"),
);
const TrendingProducts = React.lazy(
  () => import("./components/TrendingProducts"),
);
const RecentlyViewedProducts = React.lazy(
  () => import("./components/RecentlyViewedProducts"),
);
const SimilarProductsCrosssale = React.lazy(
  () => import("./components/SimilarProductsCrosssale"),
);

// Loading fallback
const ComponentLoader = () => (
  <Center py={8}>
    {/* <Spinner size="lg" /> */}
    <ShimmerGridProducts />
  </Center>
);

const ProductDetails = () => {
  const { id } = useParams();
  const { handleClose } = useUnifiedCartStore();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const isExchange =
    queryParams.get("isExchange") === "true" || location.state?.isExchange;

  // ✅ You'll get this when navigating from a category/listing
  const fromCollection = location.state?.fromCollection || null;

  // Track page view for Einstein Commerce Cloud (disabled since viewProduct is tracked separately)
  // useEinsteinPageTracking(false);

  useEffect(() => {
    handleClose();
  }, [handleClose]);
  const isHidden = location.state?.isHidden;

  console.log(location.state, "Location State in Product Details");
  console.log(isHidden, "isHidden in Product Details");
  return (
    <Fragment>
      {isHidden ? (
        <Flex
          justify="center"
          align="center"
          w="100%"
          sx={{ backgroundColor: "#000 !important" }}
        >
          <ChakraImage
            src="https://stgsfcc.sotbella.com/on/demandware.static/-/Sites-sotbella_uae-Library/default/sotbella-logo.png"
            alt="Sotbella Logo"
            w={{ base: "180px", xl: ["15vw", null, null, null, "11vw"] }}
            mt={4}
            loading="lazy"
          />
        </Flex>
      ) : (
        <LogoNavbar />
      )}
      <CartQuickView />
      {isHidden ? null : <div style={{ marginTop: 70 }} />}
      <ChakraProductDetails
        fromCollection={fromCollection}
        currentProductId={id}
        isHidden={isHidden}
      />

      {/* ✅ Performance Optimization: Lazy load similar product components */}
      {!isHidden && (
        <>
          <Suspense fallback={<ComponentLoader />}>
            <SimilarProductsCrosssale />
          </Suspense>

          {/* <Suspense fallback={<ComponentLoader />}>
      <SimilarProducts
        fromCollection={fromCollection}
        currentProductId={id}
      />
    </Suspense> */}

          <Suspense fallback={<ComponentLoader />}>
            <TrendingProducts />
          </Suspense>

          <Suspense fallback={<ComponentLoader />}>
            <RecentlyViewedProducts />
          </Suspense>
        </>
      )}

      {isHidden ? null : <Footer />}
    </Fragment>
  );
};

export default ProductDetails;
