import React, { Fragment } from "react";
import LogoNavbar from "@/components/layouts/LogoNavbar";
import Footer from "@/NewHomePage/components/footer/Footer";
import AccountDetailsForm from "./components/AccountDetailsForm";
import CartQuickView from "../ProductDetails/components/cartQuickView";



const ProfilePage = () => {
  return (
    <Fragment>
      <LogoNavbar />
      <CartQuickView/>
      <AccountDetailsForm />
      <Footer />
    </Fragment>
  );
};

export default ProfilePage;
