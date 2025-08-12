# Vite Plugin Twig PHP - Test Suite

This directory contains test examples demonstrating the features of the Vite Plugin for Twig PHP.

## Running the Tests

### Development Mode
```bash
npm run test:dev
```
This starts the Vite dev server with HMR support. Open http://localhost:5173 to view the test pages.

### Build Mode
```bash
npm run test:build
```
This builds the test files for production into the `dist-test` directory.

### Preview Mode
```bash
npm run test:preview
```
This serves the built files from `dist-test` for testing the production build.

## Test Structure

### Files Overview

- `vite.config.js` - Vite configuration with the Twig plugin setup
- `index.html.twig` - Main page demonstrating various Twig features
- `about.html.twig` - About page with advanced Twig examples
- `page.json.twig` - JSON-driven page configuration
- `data/site.json` - Global data available to all templates
- `templates/layouts/base.twig` - Base layout template
- `templates/components/product-card.twig` - Reusable component
- `templates/page.twig` - Template for JSON-driven pages

### Features Demonstrated

1. **Template Inheritance** - Base layout extended by pages
2. **Namespaces** - `@layouts` and `@components` namespaces
3. **Components** - Reusable product card component
4. **Data Files** - JSON data automatically loaded
5. **Filters** - Various Twig filters (upper, date, number_format)
6. **Functions** - Date functions and custom functions
7. **Loops** - Iterating over arrays with loop variables
8. **Conditionals** - If/else statements
9. **Macros** - Reusable template functions
10. **JSON-driven Pages** - Pages configured via JSON files

## Plugin Configuration

The plugin is configured in `vite.config.js` with:

- Template root directory
- Namespace definitions
- Global variables
- Data file patterns
- Supported formats

## Template Variables

All templates have access to:

- `siteTitle` - Global site title
- `currentYear` - Current year
- `features` - Array of feature objects (from data/site.json)
- `products` - Array of product objects (from data/site.json)
- `stats` - Statistics object (from data/site.json)

## Customization

You can modify the test suite to experiment with different Twig features:

1. Add new templates in the `templates` directory
2. Create new data files in the `data` directory
3. Modify the Vite config to test different plugin options
4. Add new namespaces or change existing ones
5. Test custom filters and functions via the plugin configuration