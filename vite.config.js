import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import process from "node:process";

// Writes dist/i18n/strings.json (the translation manifest WordPress reads)
// after every production build. A failure fails the build: the plugin would
// reject an invalid manifest and the frontend would lose its translations.
const translationManifest = () => ({
  name: "flexibooking-translation-manifest",
  apply: "build",
  closeBundle() {
    execFileSync(
      process.execPath,
      [fileURLToPath(new URL("./scripts/extract-i18n.mjs", import.meta.url))],
      { stdio: "inherit" },
    );
  },
});

export default defineConfig({
  base: './', // ✅ Use relative path instead of absolute
  plugins: [react(), translationManifest()],
  build: {
    manifest: true, // ✅ This creates the manifest.json
    outDir: "dist", // Default output directory
    assetsDir: "assets", // Folder for assets (CSS, JS)
    emptyOutDir: true,
  },
});
