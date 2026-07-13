import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    base: "/",
    preview: {
      port: 3000,
      strictPort: true,
      host: true,
      allowedHosts: [
        "localhost",
        "www.sotbella.com",
        "sotbella.com"
      ],
    },
    build: {
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: false,
      minify: "terser",
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
          }
        }
      }
    },
    server: {
      host: true,
      port: 3005,
      strictPort: true,
      proxy: {
        "/sfcc": {
          target: "https://dyp4l3dm.api.commercecloud.salesforce.com",
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/sfcc/, ""),
        },
        "/tailoredd": {
          target: "https://cdn.tailoredd.com/api",
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/tailoredd/, ""),
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              proxyReq.setHeader('Origin', 'https://sotbella.com/');
            });
          }
        },
        "/api": {
          target: "https://cdn.tailoredd.com", // API Target URL
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api/, "/api"),
          configure: (proxy) => {
            // Modify the request headers for the specific proxy
            proxy.on('proxyReq', (proxyReq) => {
              // Set the custom Origin header here
              proxyReq.setHeader('Origin', 'https://sotbella.com/');
            });
          }
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    envPrefix: 'VITE_' // Only expose variables prefixed with 'VITE_'
  };
});