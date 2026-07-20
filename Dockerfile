# Storefront-demo (staging) — build the Vite SPA and serve it via the Node
# proxy server (server.cjs) so /sfcc, /tailoredd, /api are reverse-proxied
# same-origin (Railpack+Caddy static hosting can't do that). VITE_* build args
# are injected by Railway from the service variables.
FROM node:20-bookworm-slim
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps --no-audit --no-fund

COPY . .

# Vite bakes these at build time.
ARG VITE_AYRA_ENABLED
ARG VITE_AYRA_SANDBOX
ARG VITE_AYRA_SESSION_URL
ARG VITE_SFCC_BASE_URL
ARG VITE_SFCC_CLIENT_ID
ARG VITE_SFCC_CLIENT_SECRET
ARG VITE_SFCC_LOCALE
ARG VITE_SFCC_ORG_ID
ARG VITE_SFCC_SHORTCODE
ARG VITE_SFCC_SHORT_CODE
ARG VITE_SFCC_SITE_ID
ENV VITE_AYRA_ENABLED=$VITE_AYRA_ENABLED \
    VITE_AYRA_SANDBOX=$VITE_AYRA_SANDBOX \
    VITE_AYRA_SESSION_URL=$VITE_AYRA_SESSION_URL \
    VITE_SFCC_BASE_URL=$VITE_SFCC_BASE_URL \
    VITE_SFCC_CLIENT_ID=$VITE_SFCC_CLIENT_ID \
    VITE_SFCC_CLIENT_SECRET=$VITE_SFCC_CLIENT_SECRET \
    VITE_SFCC_LOCALE=$VITE_SFCC_LOCALE \
    VITE_SFCC_ORG_ID=$VITE_SFCC_ORG_ID \
    VITE_SFCC_SHORTCODE=$VITE_SFCC_SHORTCODE \
    VITE_SFCC_SHORT_CODE=$VITE_SFCC_SHORT_CODE \
    VITE_SFCC_SITE_ID=$VITE_SFCC_SITE_ID

RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.cjs"]
