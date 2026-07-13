import React, { Fragment } from "react";
import img from "@/assets/images/footer-icons.png";
import {
  amazonPayIcon,
  googlePayIcon,
  masterCardIcon,
  paypalIcon,
  paytmIcon,
} from "@/assets/images/payment-icon";
import stripeicon from "@/assets/images/payment-icon/stripe.webp"

const Loginmiddle2 = () => {
  const paymentIcons = [
    {
      icon: stripeicon,
      name: "Stripe",
    },
    // {
    //   icon: masterCardIcon,
    //   name: "Master Card",
    // },
    // {
    //   icon: googlePayIcon,
    //   name: "Google Pay",
    // },
    // {
    //   icon: paytmIcon,
    //   name: "Paytm",
    // },
    // {
    //   icon: paypalIcon,
    //   name: "Paypal",
    // },
    // {
    //   icon: amazonPayIcon,
    //   name: "Amazon Pay",
    // },
  ];
  return (
    <Fragment>
      <div className=" checkout-footer cart-login-footer">
        <div className="container-fluid" style={{ display: "block" }}>
          <div className="row">
            <div className="col-sm-12 text-center">
              <p style={{ color: "#000", fontSize: "16px" }} className="mb-0">
                <div className="d-flex justify-content-center align-items-center">
                  Secure Pay using
                  {paymentIcons.map((item, index) => (
                    <Fragment key={index}>
                      <img
                        src={item.icon}
                        className="ms-3 "
                        height={30}
                        width={30}
                      />
                    </Fragment>
                  ))}
                </div>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default Loginmiddle2;
