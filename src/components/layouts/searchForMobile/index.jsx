import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import searchImg from "../../../mainAssets/search-normal.svg";

const SearchBarForMobile = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const handleSearchProduct = (event) => {
    event.preventDefault();
    if (search) {
      navigate(`/search?search=${search}`);
    }
  };

  return (
    <div className="w-full md:w-1/3">
      <div className="content right_menuListing">
        <div
          className="offcanvas offcanvas-start headeraccordian"
          tabIndex="-1"
          id="offcanvasWithBackdropSearch"
          style={{ height: "100%" }}
          aria-labelledby="offcanvasWithBackdropLabelSearch"
        >
          <div
            className="offcanvas-header"
            style={{ backgroundColor: "#f2f2f2" }}
          >
            <h5
              className="offcanvas-title"
              id="offcanvasWithBackdropLabelSearch"
              style={{ fontWeight: 400, fontSize: "16px" }}
            >
              Search
            </h5>
            <button
              type="button"
              className="btn-close text-reset"
              data-bs-dismiss="offcanvas"
              aria-label="Close"
            ></button>
          </div>
          <div className="offcanvas-body">
            <form className="mr-5 inline" onSubmit={handleSearchProduct}>
              <div className="input-group mb-3 border">
                <input
                  type="text"
                  className="form-control bg-transparent border-none"
                  placeholder="Search products..."
                  aria-label="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault(); // Prevent page reload
                      handleSearchProduct(e);
                    }
                  }}
                />

                <button className="btn border-none uppercase" type="submit">
                  <img src={searchImg} alt="Search" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchBarForMobile;
