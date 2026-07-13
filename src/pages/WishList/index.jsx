import React, { Fragment } from "react";
import Footer from "@/NewHomePage/components/footer/Footer";
import WishList4by4Comp from "./WishList4by4Comp";
import LogoNavbar from "@/components/layouts/LogoNavbar";
import CartQuickView from "../ProductDetails/components/cartQuickView";
import YouMayLike from "../Cart/YouMayLike";

const MyWishList = () => {
  
  const onSeeMoreClick = () => {
  };

  const handleSeeMore = () => {
  };

  return (
    <Fragment>
      <div style={{ overflow: "none" }}>
        <LogoNavbar />  
        <CartQuickView/>
        <div style={{ position: "relative" }}>
          <WishList4by4Comp />
        </div>
        <YouMayLike
          onSeeMoreClick={onSeeMoreClick}
          handleSeeMore={handleSeeMore}
        />
        <Footer />
      </div>
    </Fragment>
  );
};

export default MyWishList;
