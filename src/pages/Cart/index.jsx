import React, { Fragment, useEffect, useRef, useState } from "react";
import Footer from "@/NewHomePage/components/footer/Footer";
import CartProducts from "./CartProducts";
import { Box } from "@chakra-ui/react";
import CartQuickView from "../ProductDetails/components/cartQuickView";
import YouMayLike from "./YouMayLike";
import { useUnifiedCartStore } from "@/context/unifiedCartStore";
import InsideNavbar from "@/components/layouts/InsideNavbar";
import SimilarProductsCrosssale from "../ProductDetails/components/SimilarProductsCrosssale";
import FeaturedProducts from "../ProductDetails/components/FeaturedProducts";
import { useEinsteinPageTracking } from "@/Hooks/useEinsteinPageTracking";

const CartPage = () => {
  const bottomRef = useRef(null);
  
  // Track page view for Einstein Commerce Cloud
  useEinsteinPageTracking();

  // store actions/state
  const refreshCartFromAPI = useUnifiedCartStore((s) => s.refreshCartFromAPI);
  const basketId = useUnifiedCartStore((s) => s.basketId);
  const isLoading = useUnifiedCartStore((s) => s.isLoading);

  const [remountKey, setRemountKey] = useState(0);

  // 1) On first mount: always pull fresh basket
  useEffect(() => {
    refreshCartFromAPI();
  }, [refreshCartFromAPI]);

  // 2) Listen to store events and refresh when cart changes anywhere
  useEffect(() => {
    const onCartUpdated = () => {
      refreshCartFromAPI();
    };
    const onMaybeRemount = () => setRemountKey((k) => k + 1);

    // window.addEventListener("cartUpdated", onCartUpdated);
    window.addEventListener("cart:refresh", onCartUpdated);
    window.addEventListener("cart:maybeRemount", onMaybeRemount);

    return () => {
      window.removeEventListener("cartUpdated", onCartUpdated);
      window.removeEventListener("cart:refresh", onCartUpdated);
      window.removeEventListener("cart:maybeRemount", onMaybeRemount);
    };
  }, [refreshCartFromAPI]);

  const onSeeMoreClick = () => { };
  const handleSeeMore = () => { };

  return (
    <Fragment>
      <InsideNavbar />
      <CartQuickView />

      <Box key={remountKey} position="relative" mt={{ base: "12%", md: "10%" }}>
        <CartProducts bottomRef={bottomRef} />
        <SimilarProductsCrosssale />
        <YouMayLike onSeeMoreClick={onSeeMoreClick} handleSeeMore={handleSeeMore} />
        <FeaturedProducts />
        <Box ref={bottomRef} />
      </Box>

      <Box mt="50px">

        <Footer />
      </Box>
    </Fragment>
  );
};

export default CartPage;
