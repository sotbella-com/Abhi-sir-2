import React, { useEffect, useRef, useState } from "react";
import { Modal, Input, List, Spin, Empty } from "antd";
import { searchKeywords } from "@/constants/searchKeywords";
import { useNavigate } from "react-router-dom";
import { LOCAL_KEYS } from "@/constants/localStorageKeys";
const MAX_RECENT_SEARCHES = 3; // Maximum number of recent searches to store

const SearchModal = ({
  setSearch,
  setShowSuggestions,
  recentSearches,
  setRecentSearches,
  showSuggestions,
  topPosition = "70px",
}) => {
  const navigate = useNavigate();

  // Load recent searches from localStorage on component mount
  useEffect(() => {
    const savedSearches = localStorage.getItem(LOCAL_KEYS.RECENT_SEARCHES);
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
  }, []);

  const addToRecentSearches = (term) => {
    const updatedSearches = [
      term,
      ...recentSearches.filter((item) => item !== term),
    ].slice(0, MAX_RECENT_SEARCHES);
    setRecentSearches(updatedSearches);
    localStorage.setItem(
      LOCAL_KEYS.RECENT_SEARCHES,
      JSON.stringify(updatedSearches)
    );
  };

  // Update handleSearchProduct to include saving to recent searches
  const handleSearchProduct = (event) => {
    event.preventDefault();
    if (search) {
      addToRecentSearches(search);
      navigate(`/search?search=${search}`);
      setShowSuggestions(false);
    }
  };

  // Update handleSearchItemClick to include saving to recent searches
  const handleSearchItemClick = (term) => {
    addToRecentSearches(term);
    setSearch(term);
    setShowSuggestions(false);
    navigate(`/search?search=${term}`);
  };

  // Function to clear all recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(LOCAL_KEYS.RECENT_SEARCHES);
  };

  // Function to remove a single search term
  const removeSearchTerm = (termToRemove) => {
    const updatedSearches = recentSearches.filter(
      (term) => term !== termToRemove
    );
    setRecentSearches(updatedSearches);
    localStorage.setItem(
      LOCAL_KEYS.RECENT_SEARCHES,
      JSON.stringify(updatedSearches)
    );
  };

  return (
    // <>
    //   {/* Dark Overlay */}
    //   {showSuggestions && (
    //     <div
    //       style={{
    //         top: 0,
    //         left: 0,
    //         zIndex: -10,
    //         width: "100%",
    //         height: "100vh",
    //         position: "absolute",
    //         backgroundColor: "#00000025",
    //         // pointerEvents: "none",
    //       }}
    //     />
    //   )}
    //   {showSuggestions && (
    //     <div
    //       className="search-suggestions position-absolute  shadow rounded-bottom p-3 border"
    //       style={{
    //         top: topPosition,
    //         width: 360,
    //         zIndex: 1000,
    //         backgroundColor: "#ffffff99",
    //       }}
    //     >
    //       {/* Recent Searches */}
    //       <div className="recent-searches mb-2">
    //         <div className="d-flex justify-content-between align-items-center">
    //           <h6 style={{ fontSize: 12 }} className="text-black fw-semibold">
    //             <i className="fas fa-clock me-2"></i>Recent Searches
    //           </h6>

    //           <div className="d-flex justify-content-between align-items-center">
    //             {/* {recentSearches.length > 0 && (
    //               <button
    //                 className="btn btn-link text-black-50 p-0 me-3"
    //                 onClick={clearRecentSearches}
    //                 style={{ fontSize: "0.8rem", textDecoration: "none" }}
    //               >
    //                 Clear all
    //               </button>
    //             )} */}
    //             <button
    //               className="btn p-0"
    //               onClick={() => setShowSuggestions(false)}
    //               aria-label="Close search suggestions"
    //               style={{ fontSize: 12 }}
    //             >
    //               Close
    //               {/* <i className="fas fa-times"></i> */}
    //             </button>
    //           </div>
    //         </div>

    //         {recentSearches.length > 0 ? (
    //           recentSearches.map((item, index) => (
    //             <div
    //               key={index}
    //               className="suggestion-item d-flex align-items-center justify-content-between mb-2 px-2 py-1 rounded hover-bg-dark"
    //             >
    //               <div
    //                 className="d-flex align-items-center flex-grow-1"
    //                 onClick={() => handleSearchItemClick(item)}
    //                 style={{ cursor: "pointer", fontSize: 12 }}
    //               >
    //                 {/* <i className="fas fa-history me-1 text-black-50"></i> */}
    //                 <span className="text-black">{item}</span>
    //               </div>
    //               {/* <button
    //                 className="btn p-0 ms-2"
    //                 onClick={(e) => {
    //                   e.stopPropagation();
    //                   removeSearchTerm(item);
    //                 }}
    //                 style={{ fontSize: "0.8rem" }}
    //               >
    //                 <i className="fas fa-times text-black-50"></i>
    //               </button> */}
    //             </div>
    //           ))
    //         ) : (
    //           <p className="text-muted small ms-1">No recent searches</p>
    //         )}
    //       </div>

    //       {/* Trending Categories */}
    //       <div className="trending">
    //         <h6
    //           className="text-black fw-semibold mb-3 border-bottom pb-2"
    //           style={{ fontSize: 12 }}
    //         >
    //           <i className="fas fa-fire me-2"></i> Most Searched Categories
    //         </h6>
    //         <div className="row">
    //           {searchKeywords?.map((category, index) => (
    //             <div
    //               key={index}
    //               className="col-6 mb-1 cursor-pointer hover-bg-dark rounded d-flex align-items-center"
    //               onClick={() => handleSearchItemClick(category)}
    //               style={{
    //                 cursor: "pointer",
    //                 padding: "5px",
    //                 fontSize: 12,
    //               }}
    //             >
    //               <span className="text-black ">{category} </span>
    //             </div>
    //           ))}
    //         </div>
    //       </div>
    //     </div>
    //   )}
    // </>
    <>
  {/* Dark Overlay */}
  {showSuggestions && (
    <div
      className="fixed top-0 left-0 w-full h-screen bg-black/20 z-40"
      onClick={() => setShowSuggestions(false)} // Close on click outside
    />
  )}

  {showSuggestions && (
    <div
      className="absolute shadow-lg rounded-b p-3 border bg-white/90 z-50"
      style={{ top: topPosition, width: 360 }}
    >
      {/* Recent Searches */}
      <div className="mb-2">
        <div className="flex justify-between items-center">
          <h6 className="text-black font-semibold text-xs flex items-center gap-2">
            <i className="fas fa-clock"></i> Recent Searches
          </h6>

          <div className="flex items-center space-x-3">
            {/* Uncomment if "Clear All" is needed */}
            {/* {recentSearches.length > 0 && (
              <button
                className="text-gray-500 text-xs hover:text-gray-700"
                onClick={clearRecentSearches}
              >
                Clear all
              </button>
            )} */}
            <button
              className="text-gray-800 text-xs hover:text-black"
              onClick={() => setShowSuggestions(false)}
            >
              Close
            </button>
          </div>
        </div>

        {recentSearches.length > 0 ? (
          recentSearches.map((item, index) => (
            <div
              key={index}
              className="flex justify-between items-center mb-2 px-2 py-1 rounded hover:bg-gray-100 transition cursor-pointer"
              onClick={() => handleSearchItemClick(item)}
            >
              <span className="text-black text-xs">{item}</span>
              {/* Uncomment if "Remove Item" button is needed */}
              {/* <button
                className="text-gray-400 hover:text-gray-600 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  removeSearchTerm(item);
                }}
              >
                <i className="fas fa-times"></i>
              </button> */}
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-xs mt-1">No recent searches</p>
        )}
      </div>

      {/* Trending Categories */}
      <div>
        <h6 className="text-black font-semibold text-xs mb-3 border-b pb-2 flex items-center gap-2">
          <i className="fas fa-fire"></i> Most Searched Categories
        </h6>
        <div className="grid grid-cols-2 gap-1">
          {searchKeywords?.map((category, index) => (
            <div
              key={index}
              className="flex items-center p-1 rounded hover:bg-gray-100 text-xs text-black cursor-pointer transition"
              onClick={() => handleSearchItemClick(category)}
            >
              {category}
            </div>
          ))}
        </div>
      </div>
    </div>
  )}
</>

  );
};

export default SearchModal;
