import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "FocusFlow",
        short_name: "FocusFlow",
        description: "AI Destekli Görev ve Odaklanma Asistanı",
        theme_color: "#0b111e",
        background_color: "#0b111e",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }
        ]
      }
    })
  ]
});
