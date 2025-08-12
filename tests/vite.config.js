import { defineConfig } from "vite";
import pages from "vituum/plugins/pages.js";
import twig from "../src/vite-plugin.js";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: resolve(__dirname, "src"),
  plugins: [
    pages({
      dir: "./pages",
      root: resolve(__dirname, "src"),
    }),
    twig({
      root: resolve(__dirname, "src"),
    }),
  ],
});
