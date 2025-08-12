module.exports = {
  singleQuote: false,
  twigSingleQuote: false,
  twigOutputEndblockName: true,
  twigAlwaysBreakObjects: false,
  plugins: [
    "@prettier/plugin-php",
    "@zackad/prettier-plugin-twig",
  ],
  overrides: [
    {
      files: ["*.php"],
      options: {
        parser: "php",
      },
    },
  ],
};
