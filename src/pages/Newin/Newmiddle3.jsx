import { Fragment, useEffect } from "react";
import { Link } from "react-router-dom";
import { CURRENCY_SYMBOL } from "@/constants/constants";

const Newmiddle3 = () => {
  useEffect(() => {
    const icons = document.querySelectorAll(".icon");
    const contents = document.querySelectorAll(".collections");

    const handleClick = (icon) => {
      const targetId = icon.getAttribute("data-target");
      icons.forEach((i) => i.classList.remove("active"));
      contents.forEach((content) => content.classList.remove("active"));
      icon.classList.add("active");
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.classList.add("active");
      }
    };

    icons.forEach((icon) => {
      icon.addEventListener("click", () => handleClick(icon));
    });

    const defaultIcon = document.querySelector(
      '.icon[data-target="collection1"]'
    );
    const defaultContent = document.getElementById("collection1");
    if (defaultIcon && defaultContent) {
      icons.forEach((i) => i.classList.remove("active"));
      contents.forEach((content) => content.classList.remove("active"));
      defaultIcon.classList.add("active");
      defaultContent.classList.add("active");
    }

    return () => {
      icons.forEach((icon) => {
        icon.removeEventListener("click", () => handleClick(icon));
      });
    };
  }, []);
  return (
    <Fragment>
      <div id="collection1" className="collections">
        <div className="container-fluid row p-0 g-0">
          <div className="col-md-6 p-0 image2last15222 section3text">
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

          <div className="col-md-6 p-0 image111 section3text">
            <Link to="/product" style={{ display: "block", height: "100%" }}>
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

        <div className="container-fluid row p-0 g-0">
          <div className="col-md-6 p-0 blackshortt section3text">
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
          <div className="col-md-6 p-0 skybluegirll section3text">
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
          <div className="col-md-6 p-0 image2last155 section3text">
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
          <div className="col-md-6 p-0 image2last166 section3text">
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
          <div className="col-md-6 p-0 image2last111 section3text">
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
          <div className="col-md-6 p-0 image2last122 section3text">
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
    </Fragment>
  );
};

export default Newmiddle3;
