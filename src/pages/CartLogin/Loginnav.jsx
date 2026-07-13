import React, { Fragment } from "react";
import { Link } from "react-router-dom";
import img from "@/assets/images/toggle.svg";

const Loginnav = () => {
  return (
    <Fragment>
      <header>
        <nav className="navbar navbar-expand-sm bg-white fixed-top ps-5 pe-5 flex-column">
          <div className="container p-0" style={{ justifyContent: "left" }}>
            <div className="left-side-headercart d-flex align-items-center">
              <button
                className="btn d-flex align-items-center"
                type="button"
                data-bs-toggle="offcanvas"
                data-bs-target="#offcanvasWithBackdrop"
                aria-controls="offcanvasWithBackdrop"
              >
                <img
                  src={img}
                  className="lens"
                  alt="Toggle"
                  style={{
                    width: "20px",
                    height: "20px",
                    marginTop: "16px",
                    filter: "invert(1)",
                  }}
                />
              </button>
              <Link className="navbar-brand" to="/" alt="Homepage">
                <p className="SÖTBELLAA mt-3 mb-0 ps-3">SÖTBELLA</p>
              </Link>
            </div>
            <div className="d-flex center-side-header___">
              <div className="d-flex justify-content-center indicator-containerr">
                <div>
                  <div className="d-flex" style={{ alignItems: "center" }}>
                    <span className="bg-black rounded-circle w-20 h-20"></span>
                    <div className="center-step-text">Cart</div>
                    <span
                      className=""
                      style={{
                        borderBottom: "2px dashed #1d1d1d69",
                        width: "70px",
                        margin: "0 10px",
                      }}
                    ></span>
                  </div>
                </div>
                <div>
                  <div className="d-flex" style={{ alignItems: "center" }}>
                    <span className="bg-black rounded-circle w-20 h-20"></span>
                    <div className="center-step-text">Address</div>
                    <span
                      className=""
                      style={{
                        borderBottom: "2px dashed #1d1d1d69",
                        width: "70px",
                        margin: "0 10px",
                      }}
                    ></span>
                  </div>
                </div>
                <div>
                  <div className="d-flex" style={{ alignItems: "center" }}>
                    <span
                      className={`${
                        window.location.pathname === "/login"
                          ? "bg-completed"
                          : "bg-black"
                      } rounded-circle w-20 h-20`}
                    ></span>
                    <div className="center-step-text">Payment</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>
    </Fragment>
  );
};

export default Loginnav;
