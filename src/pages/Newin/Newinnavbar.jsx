import React, { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import img1 from "@/assets/images/toggleblack.svg";

const Newinnavbar = () => {
  const textArray = [
    {
      text: "Co-Ords",
      color: "#d9d9d9",
      fontWeight: "300",
      fontFamily: "Lato",
    },
    {
      text: "Latest Fashion",
      color: "#d9d9d9",
      fontWeight: "300",
      fontFamily: "Lato",
    },
    { text: "Shirt", color: "#d9d9d9", fontWeight: "300", fontFamily: "Lato" },
    { text: "Pant", color: "#d9d9d9", fontWeight: "300", fontFamily: "Lato" },
  ];

  const [index, setIndex] = useState(0);
  const [intervalId, setIntervalId] = useState(null);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    const id = setInterval(updateText, 2000);
    setIntervalId(id);
    return () => clearInterval(id);
  }, []);

  const updateText = () => {
    setIndex((prevIndex) => (prevIndex + 1) % textArray.length);
  };

  const disablePlaceholder = () => {
    clearInterval(intervalId);
  };

  const enablePlaceholder = () => {
    if (searchValue.trim() === "") {
      const id = setInterval(updateText, 2000);
      setIntervalId(id);
    }
  };

  const handleInputChange = (e) => {
    setSearchValue(e.target.value);
  };

  const currentItem = textArray[index];

  return (
    <Fragment>
      <div className="col-12 col-sm-6 xs-2">
        <div className="header">
          <div className="container stick-fixed">
            <div className="row align-items-center headertop w-100">
              <div className="col-md-7 d-flex align-items-center">
                <img src={img1} alt="Toggle" className="toggle-icon" />
                <Link to="/" alt="Homepage" className="text-decoration-none">
                  <p className="SÖTBELLAA sotbella-coustem-css">SÖTBELLA</p>
                </Link>
              </div>
              <div className="col-md-5 d-flex justify-content-end align-items-center align-self-stretch gap-2 p-0">
                <form className="d-flex searchbar " style={{ padding: "0" }}>
                  <input
                    id="search"
                    className="form-control"
                    type="text"
                    placeholder="Search For"
                    aria-label="Search"
                    onFocus={disablePlaceholder}
                    onBlur={enablePlaceholder}
                    value={searchValue}
                    onChange={handleInputChange}
                  />
                  <div
                    className="placeholder"
                    id="placeholder"
                    style={{
                      display: searchValue.trim() === "" ? "block" : "none",
                      color: "transparent",
                    }}
                  >
                    Search For
                    <span
                      id="dynamicText"
                      style={{
                        fontFamily: currentItem.fontFamily,
                        color: currentItem.color,
                        fontWeight: currentItem.fontWeight,
                      }}
                    >
                      {currentItem.text}
                    </span>
                  </div>
                </form>
                <Link to="/account" className="text-reset accountproduct mt-1">
                  MY ACCOUNT
                </Link>
                <Link to="/cart" className="text-reset bagproduct mt-1">
                  SHOPPING BAG
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default Newinnavbar;
