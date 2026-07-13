import React, { useEffect, useState } from "react";
import NoInternetPage from "./NoInternetPage";

function NetworkWrapper({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine);

    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  if (!isOnline) {
    return <NoInternetPage />;
  }

  return children;
}

export default NetworkWrapper;
