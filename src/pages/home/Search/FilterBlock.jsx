import React, { Fragment, useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const FilterBlock = ({
  filterList,
  selectedCategories,
  setSelectedCategories,
  setSelectedColor,
  setSelectedMaterial,
  selectedColor,
  selectedMaterial,
  selectedSize,
  setSelectedSize,
  setPriceChange,
  setClickedCategories,
  setSelectedSort,
}) => {
  // Dropdown
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  //const dropdownRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);

    // Initial check
    handleResize();

    // Cleanup on unmount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };
  const selectOption = (event) => {
    const selectedValue = event.target.getAttribute("data-value");
    setSelectedSort(selectedValue);
    document.getElementById("dropdown-selected").textContent = selectedValue;
    setShowDropdown(false);
  };
  // Offcanvassss
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const [range, setRange] = useState([
    filterList?.price?.min,
    filterList?.price?.max,
  ]);

  useEffect(() => {
    setRange([filterList?.price?.min, filterList?.price?.max]); // Update when min/max props change
  }, [filterList?.price?.min, filterList?.price?.max]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setRange((prevRange) => {
      let newRange = [...prevRange];

      if (name === "min") {
        newRange[0] = Math.min(Number(value), newRange[1] - 1); // Prevent overlap
      } else {
        newRange[1] = Math.max(Number(value), newRange[0] + 1); // Prevent overlap
      }

      setPriceChange(newRange); // Send updated range to parent
      return newRange;
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const handleCheckboxChangeCategories = (name) => {
    setSelectedCategories(
      (prevSelected) =>
        prevSelected.includes(name)
          ? prevSelected.filter((prevName) => prevName !== name) // Remove if already selected
          : [...prevSelected, name] // Add if not selected
    );
  };

  const handleClickCategories = (name) => {
    setClickedCategories(name);
  };

  const handleCheckboxChangeColor = (name) => {
    setSelectedColor(
      (prevSelected) =>
        prevSelected.includes(name)
          ? prevSelected.filter((prevName) => prevName !== name) // Remove if already selected
          : [...prevSelected, name] // Add if not selected
    );
  };

  const handleCheckboxChangeMaterial = (name) => {
    setSelectedMaterial(
      (prevSelected) =>
        prevSelected.includes(name)
          ? prevSelected.filter((prevName) => prevName !== name) // Remove if already selected
          : [...prevSelected, name] // Add if not selected
    );
  };

  const handleCheckboxChangeSize = (name) => {
    setSelectedSize(
      (prevSelected) =>
        prevSelected.includes(name)
          ? prevSelected.filter((prevName) => prevName !== name) // Remove if already selected
          : [...prevSelected, name] // Add if not selected
    );
  };

  return (
    <Fragment>
      <div
        className="col-md-12 text-start cat-filterwrapper"
        style={{
          position: "sticky",
          top: "84px",
          background: "white",
          // zIndex: "10",
        }}
      >
        <div className="container">
          <div className=" row ">
            <div className="row col-md-9  col-5">
              <div
                className="d-flex align-items-center aa second1"
                style={{ gap: "25px" }}
              >
                <button
                  type="button"
                  className="filter"
                  data-bs-toggle="offcanvas1"
                  data-bs-target="#offcanvasWithBackdrop1"
                  aria-controls="offcanvasWithBackdrop1"
                  style={{
                    marginRight: " 35px",
                    background: "none",
                    marginBottom: "4px",
                  }}
                  onClick={handleShow}
                >
                  {/* <img src={filterImg} /> */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M8.85746 12.5061C6.36901 10.6456 4.59564 8.59915 3.62734 7.44867C3.3276 7.09253 3.22938 6.8319 3.17033 6.3728C2.96811 4.8008 2.86701 4.0148 3.32795 3.5074C3.7889 3 4.60404 3 6.23433 3H17.7657C19.396 3 20.2111 3 20.672 3.5074C21.133 4.0148 21.0319 4.8008 20.8297 6.37281C20.7706 6.83191 20.6724 7.09254 20.3726 7.44867C19.403 8.60062 17.6261 10.6507 15.1326 12.5135C14.907 12.6821 14.7583 12.9567 14.7307 13.2614C14.4837 15.992 14.2559 17.4876 14.1141 18.2442C13.8853 19.4657 12.1532 20.2006 11.226 20.8563C10.6741 21.2466 10.0043 20.782 9.93278 20.1778C9.79643 19.0261 9.53961 16.6864 9.25927 13.2614C9.23409 12.9539 9.08486 12.6761 8.85746 12.5061Z"
                      stroke="black"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>

                {filterList?.categories?.map((item) => (
                  <Link
                    to="#"
                    className="mobile-hide"
                    key={item.id}
                    onClick={() => handleClickCategories(item.name)}
                  >
                    <p style={{ width: "100%" }}>{item.name}</p>
                  </Link>
                ))}
              </div>
              {/* ------------------------------------------------------Filter---------------------------------*/}

              <Offcanvas
                show={show}
                onHide={handleClose}
                className="offcanvas-startg "
                style={{ padding: "0 10px 0 10px" }}
              >
                <Offcanvas.Header closeButton className="offcanvas-header">
                  <Offcanvas.Title
                    className="offcanvas-title"
                    style={{ fontFamily: "Lato", fontSize: "15px" }}
                  >
                    Filter
                  </Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body
                  className="offcanvas-body"
                  style={{ background: "white", paddingTop: "16px" }}
                >
                  <p className="font_monte" style={{ fontWeight: 500 }}></p>
                  <div className="accordion" id="accordionExample1">
                    <div className="accordion-item">
                      <h2 className="accordion-header" id="headingOne1">
                        <button
                        className="accordion-button box-shadow-none no-outline"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#collapseOne1"
                          aria-expanded="false"
                          aria-controls="collapseOne1"
                        >
                          <p className="font_monte mb-0"> PRICE</p>
                        </button>
                      </h2>

                      <div
                        id="collapseOne1"
                        className="accordion-collapse"
                        aria-labelledby="headingOne1"
                        data-bs-parent="#accordionExample1"
                      >
                        <div
                          className="accordion-bodyy accordion-body"
                          style={{
                            paddingTop: "23px",
                            width: "100%",
                            height: "100%",
                          }}
                        >
                          <div className="d-flex">
                            <div className="wrapper">
                              <div className="slider">
                                <div
                                  className="progress"
                                  style={{
                                    left: `${
                                      ((range[0] - filterList?.price?.min) /
                                        (filterList?.price?.max -
                                          filterList?.price?.min)) *
                                      100
                                    }%`,
                                    right: `${
                                      100 -
                                      ((range[1] - filterList?.price?.min) /
                                        (filterList?.price?.max -
                                          filterList?.price?.min)) *
                                        100
                                    }%`,
                                  }}
                                ></div>
                              </div>
                              <div className="range-input">
                                <input
                                  type="range"
                                  name="min"
                                  className="range-min"
                                  min={filterList?.price?.min}
                                  max={filterList?.price?.max}
                                  // value={minPrice}
                                  value={range[0]}
                                  step="100"
                                  //onChange={handleMinChange}
                                  onChange={handleChange}
                                />
                                <input
                                  name="max"
                                  type="range"
                                  className="range-max"
                                  min={filterList?.price?.min}
                                  max={filterList?.price?.max}
                                  value={range[1]}
                                  // value={maxPrice}
                                  step="100"
                                  onChange={handleChange}
                                  //onChange={handleMaxChange}
                                />
                              </div>
                              <div className="price-input">
                                <div className="field">
                                  <span>Min</span>
                                  <input
                                    type="number"
                                    className="input-min"
                                    value={range[0]}
                                    //onChange={handleMinChange}
                                  />
                                </div>
                                <div className="separator">-</div>
                                <div className="field">
                                  <span>Max</span>
                                  <input
                                    type="number"
                                    className="input-max"
                                    value={range[1]}
                                    // onChange={handleMaxChange}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* -------------------------------------------------------- */}
                    </div>
                    <div className="accordion-item">
                      <h2 className="accordion-header" id="headingTwo1">
                        <button
                          className="accordion-button collapsed box-shadow-none no-outline"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#collapseTwo1"
                          aria-expanded="false"
                          aria-controls="collapseTwo1"
                        >
                          <p className="font_monte mb-0">PRODUCT TYPE</p>
                        </button>
                      </h2>
                      <div
                        id="collapseTwo1"
                        className="accordion-collapse collapse"
                        aria-labelledby="headingTwo1"
                        data-bs-parent="#accordionExample1"
                      >
                        <div
                          className="accordion-bodyy accordion-body"
                          style={{
                            paddingTop: "23px",
                            width: "100%",
                            height: "100%",
                          }}
                        >
                          <div className="checkbox-container">
                            {filterList?.categories?.map((item) => (
                              <div className="checkbox-item" key={item.id}>
                                <input
                                  type="checkbox"
                                  id={`checkbox-${item.id}`} // Unique ID for each checkbox
                                  style={{ marginTop: "17px" }}
                                  checked={selectedCategories.includes(
                                    item.name
                                  )}
                                  onChange={() =>
                                    handleCheckboxChangeCategories(item.name)
                                  }
                                />
                                <label
                                  htmlFor={`checkbox-${item.id}`}
                                  className="font_monte"
                                >
                                  {item.name.toUpperCase()}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="accordion-item">
                      <h2 className="accordion-header" id="headingThree1">
                        <button
                          className="accordion-button collapsed box-shadow-none no-outline"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#collapseThree1"
                          aria-expanded="false"
                          aria-controls="collapseThree1"
                        >
                          <p className="font_monte mb-0">COLOR</p>
                        </button>
                      </h2>
                      <div
                        id="collapseThree1"
                        className="accordion-collapse collapse"
                        aria-labelledby="headingThree1"
                        data-bs-parent="#accordionExample1"
                      >
                        <div
                          className="accordion-bodyy accordion-body"
                          style={{
                            paddingTop: "23px",
                            width: "100%",
                            height: "100%",
                          }}
                        >
                          <div className="checkbox-container">
                            {filterList?.colors?.map((item) => (
                              <div className="checkbox-item" key={item.id}>
                                <input
                                  type="checkbox"
                                  id={`checkbox-${item.id}`} // Unique ID for each checkbox
                                  style={{ marginTop: "17px" }}
                                  checked={selectedColor?.includes(item.name)}
                                  onChange={() =>
                                    handleCheckboxChangeColor(item.name)
                                  }
                                />
                                <label
                                  htmlFor={`checkbox-${item.id}`}
                                  className="font_monte"
                                >
                                  {item.name.toUpperCase()}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="accordion-item">
                      <h2 className="accordion-header" id="headingFour1">
                        <button
                          className="accordion-button collapsed box-shadow-none no-outline"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#collapseFour1"
                          aria-expanded="false"
                          aria-controls="collapseFour1"
                        >
                          <p className="font_monte mb-0">MATERIAL</p>
                        </button>
                      </h2>
                      <div
                        id="collapseFour1"
                        className="accordion-collapse collapse"
                        aria-labelledby="headingFour1"
                        data-bs-parent="#accordionExample1"
                      >
                        <div
                          className="accordion-bodyy accordion-body"
                          style={{
                            paddingTop: "23px",
                            width: "100%",
                            height: "100%",
                          }}
                        >
                          <div className="checkbox-container">
                            {filterList?.materials?.map((item) => (
                              <div className="checkbox-item" key={item.id}>
                                <input
                                  type="checkbox"
                                  id={`checkbox-${item.id}`} // Unique ID for each checkbox
                                  style={{ marginTop: "17px" }}
                                  checked={selectedMaterial.includes(item.name)}
                                  onChange={() =>
                                    handleCheckboxChangeMaterial(item.name)
                                  }
                                />
                                <label
                                  htmlFor="checkbox1"
                                  className="font_monte"
                                >
                                  {item.name.toUpperCase()}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="accordion-item">
                      <h2 className="accordion-header" id="headingFive1">
                        <button
                          className="accordion-button collapsed box-shadow-none no-outline"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target="#collapseFive1"
                          aria-expanded="false"
                          aria-controls="collapseFive1"
                        >
                          <p className="font_monte mb-0">SIZE</p>
                        </button>
                      </h2>
                      <div
                        id="collapseFive1"
                        className="accordion-collapse collapse"
                        aria-labelledby="headingFive1"
                        data-bs-parent="#accordionExample1"
                      >
                        <div
                          className="accordion-bodyy accordion-body"
                          style={{
                            paddingTop: "23px",
                            width: "100%",
                            height: "160px",
                          }}
                        >
                          <div className="size-options">
                            {filterList?.sizes?.map((item) => (
                              <label className="checkbox-label" key={item.id}>
                                <input
                                  type="checkbox"
                                  id={`checkbox-${item.id}`} // Unique ID for each checkbox
                                  style={{ marginTop: "17px" }}
                                  checked={selectedSize.includes(item.name)}
                                  onChange={() =>
                                    handleCheckboxChangeSize(item.name)
                                  }
                                />
                                <span>{item.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Offcanvas.Body>
              </Offcanvas>

              {/* ----------------------------------------------------end------ */}
              <div className="modal-backdrop fade filter__modal-backdrop"></div>
            </div>

            <div className="row col-md-2 col-4">
              <p
                className="filter1"
                style={isMobile ? { marginTop: "1px" } : {}}
              >
                {" "}
              </p>
              <div
                className="custom-dropdown"
                ref={dropdownRef}
                style={{ marginLeft: "-10px" }}
              >
                <button
                  id="dropdown-button"
                  className="btn btn--link size--small search-bar-margin"
                  onClick={toggleDropdown}
                  style={
                    isMobile
                      ? { marginTop: "17px", width: "160px" }
                      : {
                          marginTop: "8px",
                          width: "160px",
                          marginLeft: "100px",
                        }
                  }
                >
                  <span
                    id="dropdown-selected"
                    className="sortyfilter mx-1"
                    style={{
                      fontSize: "14px",
                      // position: "relative",
                      // left: "51px",
                    }}
                  >
                    {isMobile ? (
                      <span
                        style={{
                          position: "absolute",
                          right: "-60px",
                          top: "24px",
                        }}
                      >
                        {" "}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <path
                            d="M2.66722 9.33398H5.61461C6.23468 9.33398 6.54471 9.33398 6.6273 9.52072C6.70989 9.70752 6.49892 9.93152 6.07699 10.3796L3.65183 12.9551C3.2299 13.4031 3.01893 13.6271 3.10152 13.8139C3.18411 14.0007 3.49414 14.0007 4.11421 14.0007H6.66722"
                            stroke="black"
                            stroke-width="0.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            d="M2.66722 6L4.07093 2.87018C4.33112 2.29006 4.46121 2 4.66722 2C4.87323 2 5.00332 2.29006 5.26351 2.87018L6.66722 6"
                            stroke="black"
                            stroke-width="0.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            d="M11.6672 13.3327V2.66602M11.6672 13.3327C11.2004 13.3327 10.3282 12.0031 10.0005 11.666M11.6672 13.3327C12.134 13.3327 13.0062 12.0031 13.3339 11.666"
                            stroke="black"
                            stroke-width="0.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </span>
                    ) : (
                      "SORT BY"
                    )}
                  </span>
                  {isMobile ? (
                    ""
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="7"
                      height="4"
                      viewBox="0 0 7 4"
                      fill="none"
                    >
                      <path
                        d="M3.50211 4C3.43046 3.99993 3.36176 3.96984 3.31113 3.91634L0.086018 0.493866C0.0594651 0.467756 0.0381678 0.436269 0.0233965 0.401284C0.0086251 0.366299 0.00068232 0.328532 4.20602e-05 0.290237C-0.0005982 0.251943 0.00607711 0.213904 0.0196698 0.178391C0.0332625 0.142878 0.053494 0.110618 0.0791575 0.083535C0.104821 0.0564523 0.135391 0.035102 0.169043 0.0207576C0.202695 0.00641326 0.23874 -0.000631281 0.275028 4.43856e-05C0.311316 0.000720052 0.347104 0.00910207 0.380256 0.0246903C0.413407 0.0402785 0.443244 0.0627536 0.467986 0.0907748L3.52013 3.3079L6.59029 0.0679583C6.64295 0.0344872 6.70484 0.0209593 6.76577 0.0296068C6.82669 0.0382544 6.883 0.0685605 6.9254 0.115525C6.96781 0.162489 6.99377 0.223306 6.99901 0.287939C7.00426 0.352573 6.98847 0.417162 6.95424 0.47105L3.6931 3.91254C3.66832 3.93972 3.63869 3.96144 3.60591 3.97645C3.57312 3.99147 3.53785 3.99947 3.50211 4Z"
                        fill="#000"
                      ></path>
                    </svg>
                  )}
                </button>

                <div
                  id="dropdown-menu"
                  className={`dropdown-menu sort-by-css  ${
                    showDropdown ? "show" : ""
                  }`}
                  style={isMobile ? { left: "10px" } : { left: "110px" }}
                >
                  <Link
                    className="dropdown-item"
                    to="#"
                    data-value="Oldest"
                    onClick={selectOption}
                  >
                    Oldest
                  </Link>
                  <Link
                    className="dropdown-item"
                    to="#"
                    data-value="Newest"
                    onClick={selectOption}
                  >
                    Newest
                  </Link>
                  <Link
                    className="dropdown-item"
                    to="#"
                    data-value="Lowest price"
                    onClick={selectOption}
                  >
                    Lowest price
                  </Link>
                  <Link
                    className="dropdown-item"
                    to="#"
                    data-value="Highest price"
                    onClick={selectOption}
                  >
                    Highest price
                  </Link>
                  <Link
                    className="dropdown-item"
                    to="#"
                    data-value="Product title Z-A"
                    onClick={selectOption}
                  >
                    Product title Z-A
                  </Link>
                  <Link
                    className="dropdown-item"
                    to="#"
                    data-value="Product title A-Z"
                    onClick={selectOption}
                  >
                    Product title A-Z
                  </Link>
                </div>
              </div>

              <p></p>
            </div>

            <div className="col-md-1 d-flex threesvgall col-3">
              <span
                className="icon firsticon mobile-hide"
                data-target="collection1"
                style={{ marginTop: "10px" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="18"
                  viewBox="0 0 12 16"
                  fill="none"
                >
                  <rect
                    x="1.04834"
                    y="0.75"
                    width="4.5"
                    height="14.5"
                    stroke="black"
                    strokeWidth="0.5"
                  />
                  <rect
                    x="7.04834"
                    y="0.75"
                    width="4.5"
                    height="14.5"
                    stroke="black"
                    strokeWidth="0.5"
                  />
                </svg>
              </span>
              <span
                className="icon firsticon desktop-hide active"
                data-target="collection1"
                style={{ marginTop: "10px" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="18"
                  viewBox="0 0 12 16"
                  fill="none"
                >
                  <rect
                    x="1.04834"
                    y="0.75"
                    width="10"
                    height="14.5"
                    stroke="black"
                    strokeWidth="0.5"
                  />
                </svg>
              </span>
              <span
                className="icon firsticon desktop-hide"
                data-target="collection3"
                style={{ marginTop: "10px" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="18"
                  viewBox="0 0 12 16"
                  fill="none"
                >
                  <rect
                    x="1.04834"
                    y="0.75"
                    width="4.5"
                    height="14.5"
                    stroke="black"
                    strokeWidth="0.5"
                  />
                  <rect
                    x="7.04834"
                    y="0.75"
                    width="4.5"
                    height="14.5"
                    stroke="black"
                    strokeWidth="0.5"
                  />
                </svg>
              </span>
              <span
                className="icon firsticon collection2-firsticon"
                data-target="collection2"
                style={{ marginTop: "10px" }}
              >
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

              <span
                className="icon mobile-hide"
                data-target="collection3"
                style={{ marginTop: "10px" }}
              >
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
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default FilterBlock;
