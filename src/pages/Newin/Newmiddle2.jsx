import React, { Fragment, useState } from "react";
import { Link } from "react-router-dom";

const Newmiddle2 = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const selectOption = (event) => {
    const selectedValue = event.target.getAttribute("data-value");
    document.getElementById("dropdown-selected").textContent = selectedValue;
    setShowDropdown(false);
  };
  return (
    <Fragment>
      <div
        style={{
          position: "sticky",
          top: "103px",
          background: "white",
          zIndex: "10",
        }}
      >
        <div className="container col-md-12 text-start">
          <div className="row">
            <div className="row col-md-9">
              <p
                className="filter"
                data-bs-toggle="offcanvas"
                data-bs-target="#offcanvasWithBackdrop"
                aria-controls="offcanvasWithBackdrop"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="14"
                  viewBox="0 0 15 14"
                  fill="none"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M0.320033 4.09298e-05H14.6793C14.8031 4.09298e-05 14.9159 0.0747751 14.9691 0.192603C15.0224 0.310428 15.0057 0.449129 14.9274 0.550115L9.23072 7.86066V12.1831C9.23072 12.3104 9.16211 12.4269 9.05375 12.4841L6.23288 13.9647C6.13349 14.0165 6.01551 14.0111 5.92125 13.9498C5.82698 13.8886 5.76927 13.7802 5.76927 13.6637V7.86062L0.072552 0.550075C-0.00567841 0.449755 -0.0223501 0.310389 0.030871 0.192562C0.0840938 0.0747377 0.196948 0 0.320706 0L0.320033 4.09298e-05ZM0.996538 0.673319L6.33737 7.52745C6.38418 7.58737 6.40983 7.66278 6.40983 7.74088V13.1191L8.58933 11.9752V7.74093C8.58933 7.66351 8.61498 7.5881 8.66179 7.5275L14.0026 0.673371L0.996538 0.673319Z"
                    fill="black"
                  />
                </svg>
                &nbsp; Filter
              </p>





              
              <div
                className="offcanvas offcanvas-startt headeraccordian"
                tabIndex="-1"
                id="offcanvasWithBackdrop"
                aria-labelledby="offcanvasWithBackdropLabel"
              >
                <div
                  className="offcanvas-header"
                  style={{ backgroundColor: "white" }}
                >
                  <h5
                    className="offcanvas-title"
                    id="offcanvasWithBackdropLabel"
                    style={{ opacity: "0" }}
                  >
                    Offcanvas with backdrop
                  </h5>
                  <button
                    type="button"
                    className="btn-close text-resett"
                    data-bs-dismiss="offcanvas"
                    aria-label="Close"
                  ></button>
                </div>
                <div className="offcanvas-bodyy">
                  <p className="font_montee" style={{ fontWeight: "500" }}>
                    FILTER
                  </p>
                  <div className="accordionn" id="accordionnExample">
                    <div className="accordionn-item">
                      <h2 className="accordionn-header" id="headingOne">
                        <button
                          className="accordionn-button"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#collapseOne"
                          aria-expanded="false"
                          aria-controls="collapseOne"
                        >
                          <p className="font_montee">PRICE</p>
                        </button>
                      </h2>
                      <div
                        id="collapseOne"
                        className="accordionn-collapse collapse"
                        aria-labelledby="headingOne"
                        data-bs-parent="#accordionnExample"
                      >
                        <div className="accordionn-body">
                          <div className="d-flex">
                            <div className="wrapper">
                              <div className="slider">
                                <div className="progress"></div>
                              </div>
                              <div className="range-input">
                                <input
                                  type="range"
                                  className="range-min"
                                  min="0"
                                  max="10000"
                                  value="2500"
                                  step="100"
                                />
                                <input
                                  type="range"
                                  className="range-max"
                                  min="0"
                                  max="10000"
                                  value="7500"
                                  step="100"
                                />
                              </div>
                              <div className="price-input">
                                <div className="field">
                                  <span>Min</span>
                                  <input
                                    type="number"
                                    className="input-min"
                                    value="2500"
                                  />
                                </div>
                                <div className="separator">-</div>
                                <div className="field">
                                  <span>Max</span>
                                  <input
                                    type="number"
                                    className="input-max"
                                    value="7500"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="accordionn-item">
                      <h2 className="accordionn-header" id="headingTwo">
                        <button
                          className="accordionn-button collapsed"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#collapseTwo"
                          aria-expanded="false"
                          aria-controls="collapseTwo"
                        >
                          <p className="font_montee">PRODUCT TYPE</p>
                        </button>
                      </h2>
                      <div
                        id="collapseTwo"
                        className="accordionn-collapse collapse"
                        aria-labelledby="headingTwo"
                        data-bs-parent="#accordionnExample"
                      >
                        <div className="accordionn-body">
                          <div className="checkbox-container">
                            <div className="checkbox-item">
                              <input type="checkbox" id="checkbox1" />
                              <label htmlFor="checkbox1" className="font_montee">
                                CO-ORD SET
                              </label>
                            </div>
                            <div className="checkbox-item">
                              <input type="checkbox" id="checkbox2" />
                              <label htmlFor="checkbox2" className="font_montee">
                                DRESS
                              </label>
                            </div>
                            <div className="checkbox-item">
                              <input type="checkbox" id="checkbox3" />
                              <label htmlFor="checkbox3" className="font_montee">
                                JUMPSUIT
                              </label>
                            </div>
                            <div className="checkbox-item">
                              <input type="checkbox" id="blue" />
                              <label htmlFor="blue" className="font_montee">
                                SHIRT
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="accordionn-item">
                      <h2 className="accordionn-header" id="headingThree">
                        <button
                          className="accordionn-button collapsed"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#collapseThree"
                          aria-expanded="false"
                          aria-controls="collapseThree"
                        >
                          <p className="font_montee">COLOR</p>
                        </button>
                      </h2>
                      <div
                        id="collapseThree"
                        className="accordionn-collapse collapse"
                        aria-labelledby="headingThree"
                        data-bs-parent="#accordionnExample"
                      >
                        <div className="accordionn-body">
                          <div className="checkbox-container">
                            <div className="checkbox-item">
                              <input type="checkbox" id="blue" />
                              <label htmlFor="blue" className="font_montee">
                                BLUE
                              </label>
                            </div>
                            <div className="checkbox-item">
                              <input type="checkbox" id="black" />
                              <label htmlFor="black" className="font_montee">
                                BLACK
                              </label>
                            </div>
                            <div className="checkbox-item">
                              <input type="checkbox" id="white" />
                              <label htmlFor="white" className="font_montee">
                                WHITE
                              </label>
                            </div>
                            <div className="checkbox-item">
                              <input type="checkbox" id="green" />
                              <label htmlFor="green" className="font_montee">
                                GREEN
                              </label>
                            </div>
                            <div className="checkbox-item">
                              <input type="checkbox" id="multi" />
                              <label htmlFor="multi" className="font_montee">
                                MULTI
                              </label>
                            </div>
                            <div className="checkbox-item">
                              <input type="checkbox" id="pink" />
                              <label htmlFor="pink" className="font_montee">
                                PINK
                              </label>
                            </div>
                            <div className="checkbox-item">
                              <input type="checkbox" id="orange" />
                              <label htmlFor="orange" className="font_montee">
                                ORANGE
                              </label>
                            </div>
                            <div className="checkbox-item">
                              <input type="checkbox" id="beige" />
                              <label htmlFor="beige" className="font_montee">
                                BEIGE
                              </label>
                            </div>
                            <div className="checkbox-item">
                              <input type="checkbox" id="red" />
                              <label htmlFor="red" className="font_montee">
                                RED
                              </label>
                            </div>
                            <div className="checkbox-item">
                              <input type="checkbox" id="grey" />
                              <label htmlFor="grey" className="font_montee">
                                GREY
                              </label>
                            </div>
                            <div className="checkbox-item">
                              <input type="checkbox" id="silver" />
                              <label htmlFor="silver" className="font_montee">
                                SILVER
                              </label>
                            </div>
                            <div className="checkbox-item">
                              <input type="checkbox" id="yellow" />
                              <label htmlFor="yellow" className="font_montee">
                                YELLOW
                              </label>
                            </div>
                            <div className="checkbox-item">
                              <input type="checkbox" id="aqua" />
                              <label htmlFor="aqua" className="font_montee">
                                AQUA
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="accordionn-item">
                      <h2 className="accordionn-header" id="headingThree">
                        <button
                          className="accordionn-button collapsed"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#collapseThree"
                          aria-expanded="false"
                          aria-controls="collapseThree"
                        >
                          <p className="font_montee">MATERIAL</p>
                        </button>
                      </h2>
                      <div
                        id="collapseThree"
                        className="accordionn-collapse collapse"
                        aria-labelledby="headingThree"
                        data-bs-parent="#accordionnExample"
                      >
                        <div className="accordionn-body">
                          <div className="checkbox-container">
                            <div className="checkbox-item">
                              <input type="checkbox" id="chiffon" />
                              <label htmlFor="chiffon" className="font_montee">
                                CHIFFON
                              </label>
                            </div>
                            <div className="checkbox-item">
                              <input type="checkbox" id="cotton" />
                              <label htmlFor="cotton" className="font_montee">
                                COTTON
                              </label>
                            </div>
                            <div className="checkbox-item">
                              <input type="checkbox" id="crepe" />
                              <label htmlFor="crepe" className="font_montee">
                                CREPE
                              </label>
                            </div>
                            <div className="checkbox-item">
                              <input type="checkbox" id="denim" />
                              <label htmlFor="denim" className="font_montee">
                                DENIM
                              </label>
                            </div>
                            <div className="checkbox-item">
                              <input type="checkbox" id="fleece" />
                              <label htmlFor="fleece" className="font_montee">
                                FLEECE
                              </label>
                            </div>
                            <div className="checkbox-item">
                              <input type="checkbox" id="gauze" />
                              <label htmlFor="gauze" className="font_montee">
                                GAUZE
                              </label>
                            </div>
                            <div className="checkbox-item">
                              <input type="checkbox" id="georgette" />
                              <label htmlFor="georgette" className="font_montee">
                                GEORGETTE
                              </label>
                            </div>
                            <div className="checkbox-item">
                              <input type="checkbox" id="knits" />
                              <label htmlFor="knits" className="font_montee">
                                KNITS
                              </label>
                            </div>
                            <div className="checkbox-item">
                              <input type="checkbox" id="leather" />
                              <label htmlFor="leather" className="font_montee">
                                LEATHER
                              </label>
                            </div>
                            <div className="checkbox-item">
                              <input type="checkbox" id="linen" />
                              <label htmlFor="linen" className="font_montee">
                                LINEN
                              </label>
                            </div>
                            <div className="checkbox-item">
                              <input type="checkbox" id="lurex" />
                              <label htmlFor="lurex" className="font_montee">
                                LUREX
                              </label>
                            </div>
                            <div className="checkbox-item">
                              <input type="checkbox" id="lycra" />
                              <label htmlFor="lycra" className="font_montee">
                                LYCRA
                              </label>
                            </div>
                            <div className="checkbox-item">
                              <input type="checkbox" id="organza" />
                              <label htmlFor="organza" className="font_montee">
                                ORGANZA
                              </label>
                            </div>
                            <div className="checkbox-item">
                              <input type="checkbox" id="polyester" />
                              <label htmlFor="polyester" className="font_montee">
                                POLYESTER
                              </label>
                            </div>
                            <div className="checkbox-item">
                              <input type="checkbox" id="poplin" />
                              <label htmlFor="poplin" className="font_montee">
                                POPLIN
                              </label>
                            </div>
                            <div className="checkbox-item">
                              <input type="checkbox" id="rayon" />
                              <label htmlFor="rayon" className="font_montee">
                                RAYON
                              </label>
                            </div>
                            <div className="checkbox-item">
                              <input type="checkbox" id="satin" />
                              <label htmlFor="satin" className="font_montee">
                                SATIN
                              </label>
                            </div>
                            <div className="checkbox-item">
                              <input type="checkbox" id="schiffli" />
                              <label htmlFor="schiffli" className="font_montee">
                                SCHIFFLI
                              </label>
                            </div>
                            <div className="checkbox-item">
                              <input type="checkbox" id="scuba" />
                              <label htmlFor="scuba" className="font_montee">
                                SCUBA
                              </label>
                            </div>
                            <div className="checkbox-item">
                              <input type="checkbox" id="sequin" />
                              <label htmlFor="sequin" className="font_montee">
                                SEQUIN
                              </label>
                            </div>
                            <div className="checkbox-item">
                              <input type="checkbox" id="tencil" />
                              <label htmlFor="tencil" className="font_montee">
                                TENCIL
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="accordionn-item">
                      <h2 className="accordionn-header" id="headingFour">
                        <button
                          className="accordionn-button collapsed"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#collapseFour"
                          aria-expanded="false"
                          aria-controls="collapseFour"
                        >
                          <p className="font_montee">SIZE</p>
                        </button>
                      </h2>
                      <div
                        id="collapseFour"
                        className="accordionn-collapse collapse"
                        aria-labelledby="headingFour"
                        data-bs-parent="#accordionnExample"
                      >
                        <div className="accordionn-body">
                          <ul className="filter-options-list">
                            <li>
                              <label className="checkbox-label">
                                <input
                                  type="checkbox"
                                  name="filter.v.option.size"
                                  value="XS"
                                />
                                <span>XS</span>
                              </label>
                            </li>
                            <li>
                              <label className="checkbox-label">
                                <input
                                  type="checkbox"
                                  name="filter.v.option.size"
                                  value="S"
                                />
                                <span>S</span>
                              </label>
                            </li>
                            <li>
                              <label className="checkbox-label">
                                <input
                                  type="checkbox"
                                  name="filter.v.option.size"
                                  value="M"
                                />
                                <span>M</span>
                              </label>
                            </li>
                          </ul>
                        </div>
                        <div className="accordionn-body">
                          <ul className="filter-options-list">
                            <li>
                              <label className="checkbox-label">
                                <input
                                  type="checkbox"
                                  name="filter.v.option.size"
                                  value="L"
                                />
                                <span>L</span>
                              </label>
                            </li>
                            <li>
                              <label className="checkbox-label">
                                <input
                                  type="checkbox"
                                  name="filter.v.option.size"
                                  value="XL"
                                />
                                <span>XL</span>
                              </label>
                            </li>
                            <li>
                              <label className="checkbox-label">
                                <input
                                  type="checkbox"
                                  name="filter.v.option.size"
                                  value="XXL"
                                />
                                <span>XXL</span>
                              </label>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div
                      className="bothbuttonsidebar"
                      style={{ position: "sticky", top: "0px", bottom: "0px" }}
                    >
                      <button className="filterpaneapply">APPLY</button>
                      <button className="filterpaneapply">CLEAR ALL</button>
                    </div>
                  </div>
                </div>
              </div>







            </div>
            <div className="row col-md-2">
              <p className="filter1">
                <div className="custom-dropdown">
                  <button
                    id="dropdown-button"
                    className="btn btn--link size--small dropdown-toggle"
                    onClick={toggleDropdown}
                    style={{ marginTop: "10px" }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                    >
                      <g clipPath="url(#clip0_1453_8445)">
                        <rect
                          x="1.04822"
                          y="0.75"
                          width="15.5"
                          height="3.5"
                          stroke="black"
                          strokeWidth="0.5"
                        />
                        <rect
                          x="1.04822"
                          y="6.75"
                          width="11.5"
                          height="3.5"
                          stroke="black"
                          strokeWidth="0.5"
                        />
                        <rect
                          x="1.04822"
                          y="12.75"
                          width="7.5"
                          height="3.5"
                          stroke="black"
                          strokeWidth="0.5"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_1453_8445">
                          <rect
                            width="17"
                            height="17"
                            fill="white"
                            transform="translate(0.798218 0.5)"
                          />
                        </clipPath>
                      </defs>
                    </svg>
                    <span id="dropdown-selected" className="sortyfilter">
                      Sort By
                    </span>
                  </button>
                  <div
                    id="dropdown-menu"
                    className={`dropdown-menu ${showDropdown ? "show" : ""}`}
                  >
                    <Link
                      className="dropdown-item"
                      to="#"
                      data-value="Best selling"
                      onClick={selectOption}
                    >
                      Best selling
                    </Link>
                    <Link
                      className="dropdown-item"
                      to="#"
                      data-value="Price, low to high"
                      onClick={selectOption}
                    >
                      Price, low to high
                    </Link>
                    <Link
                      className="dropdown-item"
                      to="#"
                      data-value="Price, high to low"
                      onClick={selectOption}
                    >
                      Price, high to low
                    </Link>
                    <Link
                      className="dropdown-item"
                      to="#"
                      data-value="Date, old to new"
                      onClick={selectOption}
                    >
                      Date, old to new
                    </Link>
                    <Link
                      className="dropdown-item"
                      to="#"
                      data-value="Date, new to old"
                      onClick={selectOption}
                    >
                      Date, new to old
                    </Link>
                  </div>
                </div>
              </p>
            </div>
            <div className="col-md-1 d-flex threesvg">
              <span className="icon" data-target="collection1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="16"
                  viewBox="0 0 12 16"
                  fill="none"
                >
                  <rect
                    x="1.04822"
                    y="0.75"
                    width="4.5"
                    height="14.5"
                    stroke="black"
                    strokeWidth="0.5"
                  />
                  <rect
                    x="7.04822"
                    y="0.75"
                    width="4.5"
                    height="14.5"
                    stroke="black"
                    strokeWidth="0.5"
                  />
                </svg>
              </span>
              &nbsp;
              <span className="icon" data-target="collection2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <rect
                    x="1.04834"
                    y="0.75"
                    width="6.1"
                    height="6.1"
                    stroke="black"
                    strokeWidth="0.5"
                  />
                  <rect
                    x="1.04834"
                    y="9.1499"
                    width="6.1"
                    height="6.1"
                    stroke="black"
                    strokeWidth="0.5"
                  />
                  <rect
                    x="9.44849"
                    y="0.75"
                    width="6.1"
                    height="6.1"
                    stroke="black"
                    strokeWidth="0.5"
                  />
                  <rect
                    x="9.44849"
                    y="9.1499"
                    width="6.1"
                    height="6.1"
                    stroke="black"
                    strokeWidth="0.5"
                  />
                </svg>
              </span>
              &nbsp;
              <span className="icon" data-target="collection3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <rect
                    x="1.04822"
                    y="0.75"
                    width="6.1"
                    height="6.1"
                    stroke="black"
                    strokeWidth="0.5"
                  />
                  <rect
                    x="1.04822"
                    y="8.75"
                    width="14.5"
                    height="6.5"
                    stroke="black"
                    strokeWidth="0.5"
                  />
                  <rect
                    x="9.44666"
                    y="0.75"
                    width="6.1"
                    height="6.1"
                    stroke="black"
                    strokeWidth="0.5"
                  />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>

    </Fragment>
  );
};

export default Newmiddle2;
