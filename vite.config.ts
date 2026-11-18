import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { VitePWA } from "vite-plugin-pwa";

// `npm run build:single` bundles everything into one index.html (handy for sharing as a single file).
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    ...(mode === "single"
      ? [viteSingleFile()]
      : [
          VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["favicon.svg", "apple-touch-icon.png"],
            manifest: {
              name: "DeepOS",
              short_name: "DeepOS",
              description: "Do one thing at a time. Park every buzzing thought and sort it later.",
              theme_color: "#2f7d6d",
              background_color: "#eef2f0",
              display: "standalone",
              start_url: "/",
              scope: "/",
              icons: [
                { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
                { src: "pwa-512.png", sizes: "512x512", type: "image/png" },
                { src: "maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
              ],
            },
            workbox: {
              globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
              runtimeCaching: [
                {
                  urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
                  handler: "CacheFirst",
                  options: {
                    cacheName: "google-fonts",
                    expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
                    cacheableResponse: { statuses: [0, 200] },
                  },
                },
              ],
            },
          }),
        ]),
  ],
  test: { environment: "jsdom", globals: true },
}));
