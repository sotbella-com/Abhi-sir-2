import React from "react";
import dinoImg from "../assets/images/socialicons/no_internet.png";

const NoInternetPage = () => {
  return (
    <div
      style={{
        backgroundColor: "#fff",
        color: "#000",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Roboto, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div style={{ maxWidth: 600, padding: "40px 24px" }}>
        {/* Dino */}
        <img
          src={dinoImg}
          alt="No internet dinosaur"
          style={{ width: 80, marginBottom: 24 }}
        />

        {/* Title */}
        <h1 style={{ fontSize: 28, margin: 0, marginBottom: 16 }}>No Internet</h1>

        {/* Text */}
        <p style={{ margin: 0, marginBottom: 12, fontSize: 14 }}>
          Try:
        </p>
        <ul style={{ marginTop: 0, fontSize: 14, lineHeight: 1.7 }}>
          <li>Checking the network cables, modem, and router</li>
          <li>Reconnecting to Wi-Fi</li>
          <li>Running Windows Network Diagnostics</li>
        </ul>

        <p
          style={{
            marginTop: 24,
            fontSize: 12,
            color: "#919395ff",
            letterSpacing: 0.2,
          }}
        >
          ERR_INTERNET_DISCONNECTED
        </p>
      </div>
    </div>
  );
};

export default NoInternetPage;
