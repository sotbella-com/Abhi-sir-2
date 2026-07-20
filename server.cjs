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

const SFCC = process.env.SFCC_HOST || "https://dyp4l3dm.api.commercecloud.salesforce.com";
const TAILOREDD = "https://cdn.tailoredd.com";
const spoofOrigin = (proxyReq) => proxyReq.setHeader("Origin", "https://sotbella.com/");

// ── SFCC SLAS token mint, SERVER-SIDE (keeps the client secret OUT of the browser
// bundle for production). The browser POSTs grant_type/channel_id/refresh_token to
// /sfcc-token; the server injects Basic auth from SFCC_CLIENT_ID + SFCC_CLIENT_SECRET
// (server env only). If those aren't set (e.g. staging using the old in-bundle path),
// it falls back to whatever Authorization header the browser sent — fully backward-compatible.
app.post("/sfcc-token", express.urlencoded({ extended: false }), async (req, res) => {
  try {
    const org = req.body.org || process.env.SFCC_ORG_ID;
    if (!org) return res.status(400).json({ error: "missing org" });
    const params = new URLSearchParams();
    for (const k of ["grant_type", "channel_id", "refresh_token", "code", "code_verifier",
                     "redirect_uri", "usid", "hint", "client_id"]) {
      if (req.body[k]) params.set(k, req.body[k]);
    }
    const headers = { "Content-Type": "application/x-www-form-urlencoded" };
    const cid = process.env.SFCC_CLIENT_ID, csec = process.env.SFCC_CLIENT_SECRET;
    if (cid && csec) headers.Authorization = "Basic " + Buffer.from(`${cid}:${csec}`).toString("base64");
    else if (req.headers.authorization) headers.Authorization = req.headers.authorization; // staging fallback
    const r = await fetch(`${SFCC}/shopper/auth/v1/organizations/${org}/oauth2/token`, {
      method: "POST", headers, body: params,
    });
    const text = await r.text();
    res.status(r.status).type("application/json").send(text);
  } catch (e) {
    res.status(502).json({ error: "sfcc-token proxy failed", detail: String(e).slice(0, 200) });
  }
});

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
