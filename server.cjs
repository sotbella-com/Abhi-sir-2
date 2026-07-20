/**
 * Production server for the storefront-demo (staging).
 *
 * `vite preview` serves the SPA statically but does NOT apply vite.config's
 * `server.proxy`, so the app's same-origin API calls (/sfcc → SFCC SCAPI,
 * /tailoredd + /api → cdn.tailoredd.com) 404 / hit CORS. This server replicates
 * those exact dev proxies in production and serves the built SPA, so the app
 * works the same way it does in `vite dev`. VITE_SFCC_BASE_URL must be "/sfcc".
 */
const express = require("express");
const path = require("path");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = process.env.PORT || 3000;

const SFCC = "https://dyp4l3dm.api.commercecloud.salesforce.com";
const TAILOREDD = "https://cdn.tailoredd.com";
const spoofOrigin = (proxyReq) => proxyReq.setHeader("Origin", "https://sotbella.com/");

// /sfcc/* -> SFCC SCAPI (strip /sfcc). Same-origin from the browser => no CORS.
app.use(
  "/sfcc",
  createProxyMiddleware({
    target: SFCC,
    changeOrigin: true,
    secure: true,
    pathRewrite: { "^/sfcc": "" },
  })
);

// /tailoredd/* -> cdn.tailoredd.com/api/* (strip /tailoredd), Origin spoofed.
app.use(
  "/tailoredd",
  createProxyMiddleware({
    target: TAILOREDD + "/api",
    changeOrigin: true,
    secure: true,
    pathRewrite: { "^/tailoredd": "" },
    onProxyReq: spoofOrigin,
  })
);

// /api/* -> cdn.tailoredd.com/api/* (keep /api), Origin spoofed.
app.use(
  "/api",
  createProxyMiddleware({
    target: TAILOREDD,
    changeOrigin: true,
    secure: true,
    onProxyReq: spoofOrigin,
  })
);

// Static SPA + client-side routing fallback.
const dist = path.join(__dirname, "dist");
app.use(express.static(dist));
app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));

app.listen(PORT, () => console.log(`storefront-demo (SPA + /sfcc proxy) on :${PORT}`));
