import "./App.css";
import { useEffect, useState } from "react";
import CartQuickView from "./pages/ProductDetails/components/cartQuickView";
import NewHome from "./NewHome";
import { getCountryFromIP } from "./utils/getCountryFromIP";
import GeoModal from "./utils/GeoModal";

function App() {
  const [geo, setGeo] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    async function detectLocation() {
      try {
        const data = await getCountryFromIP();
        setGeo(data);

        if (data?.countryCode && data.countryCode !== "IN") {
          setShowPopup(true);
        }
      } catch (err) {
        console.error(err);
      }
    }

    detectLocation();
  }, []);

  // ✅ Prevent back navigation
  useEffect(() => {
    if (window.location.pathname !== "/") return;

    const blockBack = () => {
      window.history.pushState(null, "", window.location.href);
    };

    // Push multiple states to strengthen loop
    for (let i = 0; i < 5; i++) {
      window.history.pushState(null, "", window.location.href);
    }

    window.addEventListener("popstate", blockBack);

    return () => {
      window.removeEventListener("popstate", blockBack);
    };
  }, []);

  return (
    <div className="overflow-x-hidden relative">
      <NewHome />
      <CartQuickView />

      {showPopup && (
        <GeoModal geo={geo} onClose={() => setShowPopup(false)} />
      )}
    </div>
  );
}

export default App;