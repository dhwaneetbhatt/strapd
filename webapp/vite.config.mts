import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";

export default defineConfig({
  base: process.env.NODE_ENV === "production" ? "/strapd/" : "/",
  plugins: [react(), wasm(), topLevelAwait()],
});
