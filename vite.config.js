import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: './', // ✅ Use relative path instead of absolute
  plugins: [react()],
  build: {
    manifest: true, // ✅ This creates the manifest.json
    outDir: "dist", // Default output directory
    assetsDir: "assets", // Folder for assets (CSS, JS)
    emptyOutDir: true,
  },
});
