import React, { Fragment } from "react";
import { Link } from "react-router-dom";
import img1 from "@/assets/images/collectionbannersection2fullimage.png";
import img2 from "@/assets/images/collection3.jfif";
import { CURRENCY_SYMBOL } from "@/constants/constants";

const Newmiddle5 = () => {
  return (
    <Fragment>
      <div id="collection2" className="collections active">
        <div className="container-fluid row p-0 g-0 section1text">
          <div className="container-fluid row p-0 g-0 section2text">
            <Link to="/product" style={{ width: "670.5px" }}>
              <div
                className="col-md-6 p-0 image222"
                onClick={() => (window.location.href = "/product")}
              >
                <div className="overlaytext">
                  <div className="middle">
                    <div className="bottom-right">
                      BASIC WHITE TOP AND SKIRT <br /> CO-ORD SET
                      <p> {CURRENCY_SYMBOL} 3299.00</p>
                      <Link to="/cart">
                        <button className="addtocart">ADD TO CART</button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
            <div
              className="col-md-6 p-0 image111"
              onClick={() => (window.location.href = "/product")}
            >
              <Link to="/product">
                <div className="overlaytext">
                  <div className="middle">
                    <div className="bottom-right">
                      BASIC WHITE TOP AND SKIRT <br /> CO-ORD SET
                      <p> {CURRENCY_SYMBOL} 3299.00</p>
                      <Link to="/cart">
                        <button className="addtocart">ADD TO CART</button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
          <div
            className="col-md-12 position-relative imageeffect"
            style={{ position: "relative", zIndex: 1 }}
          >
            <img
              src={img1}
              alt="First Image"
              className="image-hover-first w-100"
              style={{ height: "1828px", objectFit: "cover" }}
            />

            <img
              src={img2}
              alt="Second Image"
              className="image-hover-second w-100"
              style={{
                height: "1828px",
                objectFit: "cover",
                position: "absolute",
                top: 0,
                left: 0,
              }}
            />

            {/* <div className="overlay-text" style={{ position: "absolute", top: "85%", left: "85%" }}>
              <div className="bottom-right">
                BASIC WHITE TOP AND SKIRT <br /> CO-ORD SET
                <p> {CURRENCY_SYMBOL} 3299.00</p>
                <Link to="/cart">
                  <button className="addtocart">ADD TO CART</button>
                </Link>
              </div>
            </div> */}
          </div>
          <div className="container-fluid row p-0 g-0 section2text">
            <div
              className="container-fluid col-md-6 p-0 imagecollectionbanner"
              style={{ margin: "0" }}
            >
              <div className="overlaytext">
                <div className="middle">
                  <div className="bottom-right">
                    BASIC WHITE TOP AND SKIRT <br /> CO-ORD SET
                    <p> {CURRENCY_SYMBOL} 3299.00</p>
                    <Link to="/cart">
                      <button className="addtocart">ADD TO CART</button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6 p-0 imagecollection">
              <div className="overlaytext">
                <div className="middle">
                  <div className="bottom-right">
                    BASIC WHITE TOP AND SKIRT <br /> CO-ORD SET
                    <p> {CURRENCY_SYMBOL} 3299.00</p>
                    <Link to="/cart">
                      <button className="addtocart">ADD TO CART</button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="container-fluid row p-0 g-0">
            <div className="col-md-6 p-0 image2last11 section3text">
              <div className="overlaytext">
                <div className="middle">
                  <div className="bottom-right">
                    BASIC WHITE TOP AND SKIRT <br /> CO-ORD SET
                    <p> {CURRENCY_SYMBOL} 3299.00</p>
                    <Link to="/cart">
                      <button className="addtocart">ADD TO CART</button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6 p-0 image2last198 section3text">
              <div className="overlaytext">
                <div className="middle">
                  <div className="bottom-right">
                    BASIC WHITE TOP AND SKIRT <br /> CO-ORD SET
                    <p> {CURRENCY_SYMBOL} 3299.00</p>
                    <Link to="/cart">
                      <button className="addtocart">ADD TO CART</button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default Newmiddle5;
