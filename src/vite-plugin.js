import { relative, resolve } from "node:path";
import fs from "node:fs";
import lodash from "lodash";
import TwigRenderer from "./twig-renderer.js";
import {
  merge,
  pluginBundle,
  pluginMiddleware,
  pluginReload,
  pluginTransform,
  processData,
} from "vituum/utils/common.js";
import { renameBuildEnd, renameBuildStart } from "vituum/utils/build.js";

const name = "vite-twig";
let twigRenderer = null;

const defaultOptions = {
  reload: true,
  root: null,
  filters: {},
  functions: {},
  extensions: [],
  namespaces: {},
  alterTwigEnv: [],
  globals: {
    format: "twig",
  },
  data: ["src/data/**/*.json"],
  formats: ["twig", "json.twig", "json"],
  ignoredPaths: [],
  options: {
    compileOptions: {},
    renderOptions: {},
  },
};

const renderTemplate = async (
  { filename, resolvedConfig },
  content,
  options,
) => {
  const initialFilename = filename.replace(".html", "");
  const output = {};
  const context = options.data
    ? processData(
        {
          paths: options.data,
          root: resolvedConfig.root,
        },
        options.globals,
      )
    : options.globals;

  let templatePath = null;

  if (initialFilename.endsWith(".json")) {
    lodash.merge(context, JSON.parse(content));

    if (!options.formats.includes(context.format)) {
      return new Promise((resolve) => {
        output.content = content;
        resolve(output);
      });
    }

    if (typeof context.template === "undefined") {
      const error = `${name}: template must be defined for file ${initialFilename}`;

      return new Promise((resolve) => {
        output.error = error;
        resolve(output);
      });
    }

    // Resolve template path for JSON files
    const resolvedTemplate = relative(
      resolvedConfig.root,
      context.template,
    ).startsWith(relative(resolvedConfig.root, options.root))
      ? resolve(resolvedConfig.root, context.template)
      : resolve(options.root, context.template);
    templatePath = relative(options.root, resolvedTemplate);
  } else if (fs.existsSync(initialFilename + ".json")) {
    lodash.merge(
      context,
      JSON.parse(fs.readFileSync(`${initialFilename}.json`).toString()),
    );
    // For regular twig files, use the relative path from root
    templatePath = relative(options.root, filename.replace(".html", ""));
  } else {
    // For regular twig files without JSON data
    templatePath = relative(options.root, filename.replace(".html", ""));
  }

  // Initialize TwigRenderer if not already done
  if (!twigRenderer) {
    const namespaceConfig = [];

    // Convert namespaces object to the format expected by TwigRenderer
    if (options.namespaces) {
      Object.keys(options.namespaces).forEach((id) => {
        const paths = Array.isArray(options.namespaces[id])
          ? options.namespaces[id]
          : [options.namespaces[id]];

        namespaceConfig.push({
          id,
          paths: paths.map((p) =>
            relative(resolvedConfig.root, resolve(options.root, p)),
          ),
        });
      });
    }

    // Process alterTwigEnv configuration
    let alterTwigEnvConfig = [];
    if (options.alterTwigEnv && options.alterTwigEnv.length > 0) {
      alterTwigEnvConfig = options.alterTwigEnv.map((config) => {
        // TwigRenderer will resolve relative paths from relativeFrom directory
        // So we just pass the path as configured (relative to project root)
        const filePath = config.file;

        // Check if the file exists (only in verbose mode)
        if (options.verbose) {
          const absolutePath = resolve(resolvedConfig.root, filePath);
          if (!fs.existsSync(absolutePath)) {
            console.error(`alterTwigEnv file not found: ${absolutePath}`);
          } else {
            console.log(`alterTwigEnv file found: ${absolutePath}`);
          }
        }

        return {
          file: filePath, // Pass relative path, TwigRenderer will resolve it
          functions: config.functions || [],
        };
      });
    }

    const config = {
      src: {
        roots: [relative(resolvedConfig.root, options.root)],
        namespaces: namespaceConfig.length > 0 ? namespaceConfig : undefined,
      },
      relativeFrom: resolvedConfig.root,
      debug: options.debug !== undefined ? options.debug : true,
      autoescape: options.autoescape !== undefined ? options.autoescape : false,
      keepAlive: false, // Ensure server restarts for each batch
      verbose: options.verbose !== undefined ? options.verbose : false,
    };

    // Add alterTwigEnv if configured
    if (alterTwigEnvConfig.length > 0) {
      config.alterTwigEnv = alterTwigEnvConfig;
      if (options.verbose) {
        console.log("alterTwigEnv config:", alterTwigEnvConfig);
      }
    }

    try {
      if (options.verbose) {
        console.log("TwigRenderer config:", JSON.stringify(config, null, 2));
      }
      twigRenderer = new TwigRenderer(config);
      await twigRenderer.init();
    } catch (error) {
      console.error("Failed to initialize TwigRenderer:", error);
      throw error;
    }
  }

  return new Promise(async (resolve) => {
    try {
      let results;

      if (initialFilename.endsWith(".json") && context.template) {
        // For JSON files, render the specified template
        if (options.verbose) {
          console.log("Rendering template:", templatePath);
        }
        results = await twigRenderer.render(templatePath, context);
      } else {
        // For regular twig files, render as string with the content
        if (options.verbose) {
          console.log("Rendering string template");
        }
        results = await twigRenderer.renderString(content, context);
      }

      if (options.verbose) {
        console.log("Render results:", {
          ok: results?.ok,
          hasHtml: !!results?.html,
          message: results?.message,
        });
      }

      if (results && results.ok) {
        output.content = results.html || "";
      } else if (results) {
        output.error = results.message || "Unknown error during rendering";
        if (options.verbose) {
          console.error("Render error:", output.error);
        }
      } else {
        output.error = "No response from TwigRenderer";
        if (options.verbose) {
          console.error("No response from TwigRenderer");
        }
      }
    } catch (error) {
      output.error = error.message || error.toString();
      if (options.verbose) {
        console.error("Caught error during rendering:", error);
      }
    }

    resolve(output);
  });
};

/**
 * @param {import('@vituum/vite-plugin-twig/types').PluginUserConfig} options
 * @returns [import('vite').Plugin]
 */
const plugin = (options = {}) => {
  let resolvedConfig;
  let userEnv;

  options = merge(defaultOptions, options);

  return [
    {
      name,
      config(_, env) {
        userEnv = env;
      },
      configResolved(config) {
        resolvedConfig = config;

        if (!options.root) {
          options.root = config.root;
        }
      },
      closeBundle: async () => {
        // Clean up TwigRenderer server when build is complete
        if (twigRenderer) {
          twigRenderer.stop();
          twigRenderer = null;
        }
      },
      buildStart: async () => {
        if (
          userEnv.command !== "build" ||
          !resolvedConfig.build.rollupOptions.input
        ) {
          return;
        }

        await renameBuildStart(
          resolvedConfig.build.rollupOptions.input,
          options.formats,
        );
      },
      buildEnd: async () => {
        if (
          userEnv.command !== "build" ||
          !resolvedConfig.build.rollupOptions.input
        ) {
          return;
        }

        await renameBuildEnd(
          resolvedConfig.build.rollupOptions.input,
          options.formats,
        );
      },
      transformIndexHtml: {
        order: "pre",
        async handler(content, { path, filename, server }) {
          return pluginTransform(
            content,
            { path, filename, server },
            { name, options, resolvedConfig, renderTemplate },
          );
        },
      },
      handleHotUpdate: ({ file, server }) =>
        pluginReload({ file, server }, options),
    },
    pluginBundle(options.formats),
    pluginMiddleware(name, options.formats),
  ];
};

export default plugin;
