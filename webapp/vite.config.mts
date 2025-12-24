import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";
import packageJson from "./package.json";

export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/strapd/" : "/",
  plugins: [react(), wasm(), topLevelAwait()],
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(packageJson.version),
  },
}));
