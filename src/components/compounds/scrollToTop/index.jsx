import React, { useEffect, useState } from "react";
import { FaArrowUp } from "react-icons/fa";

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  const handleScroll = () => {
    setIsVisible(window.scrollY > 500);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    isVisible && (
      <div
        style={{
          position: "fixed",
          bottom: "30px",
          right: "30px",
          zIndex: 1000,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.4s ease, transform 0.4s ease",
          pointerEvents: isVisible ? "auto" : "none", // Prevent interaction when hidden
        }}
      >
        <button
          onClick={scrollToTop}
          style={{
            position: "fixed",
            bottom: "30px",
            right: "30px",
            zIndex: 1000,
            backgroundColor: "#000", // Pure black
            color: "#fff",
            border: "2px solid #444", // Subtle border
            borderRadius: "50%",
            cursor: "pointer",
            boxShadow: "0 8px 16px rgba(0, 0, 0, 0.6)", // Deeper shadow
            transition: "all 0.3s ease-in-out",
            height: 40,
            width: 40,

            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
            e.currentTarget.style.boxShadow = "0 10px 20px rgba(0, 0, 0, 0.8)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.6)";
          }}
          aria-label="Scroll to top"
        >
          <FaArrowUp size={18} />
        </button>
      </div>
    )
  );
};

export default ScrollToTop;
