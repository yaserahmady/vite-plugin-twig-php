import { viteStaticCopy } from "vite-plugin-static-copy";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: "src/php/*.php",
          dest: "php",
        },
        {
          src: "config.schema.json",
          dest: ".",
        },
      ],
    }),
  ],
  build: {
    outDir: "dist",
    lib: {
      entry: {
        "vite-plugin": resolve(__dirname, "src/vite-plugin.js"),
        "twig-renderer": resolve(__dirname, "src/twig-renderer.js"),
        "utils": resolve(__dirname, "src/utils.js"),
      },
      formats: ["es", "cjs"],
      fileName: (format, entryName) => {
        const ext = format === "es" ? "mjs" : "cjs";
        return `${entryName}.${ext}`;
      },
    },
    rollupOptions: {
      external: [
        // Vite and Vituum
        "vite",
        "vituum",
        /^vituum\/.*/,
        
        // Node.js built-in modules
        "path",
        "url", 
        "fs",
        "os",
        "util",
        "stream",
        "events",
        "querystring",
        "child_process",
        "crypto",
        "http",
        "https",
        "net",
        "tls",
        "assert",
        "buffer",
        
        // Node.js built-in modules with node: prefix
        /^node:.*/,
        
        // Dependencies
        "fs-extra",
        "node-fetch",
        "sleep-promise",
        "execa",
        "get-port",
        "ajv",
        "lodash",
        "fast-glob",
        "merge2",
        "glob-parent",
        "micromatch",
        "@nodelib/fs.walk",
        "fill-range",
      ],
      output: {
        preserveModules: false,
        exports: "named",
        interop: "auto",
      },
    },
    minify: false,
    sourcemap: true,
  },
});
