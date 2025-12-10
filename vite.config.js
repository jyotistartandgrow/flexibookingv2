import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  //base: "/wordpress/wp-content/plugins/sg-woocommerce-booking/react-frontend-v2/",
  plugins: [react()],
  build: {
    manifest: true, // ✅ This creates the manifest.json
    outDir: "dist", // Default output directory
    assetsDir: "assets", // Folder for assets (CSS, JS)
    emptyOutDir: true,
  },
});
