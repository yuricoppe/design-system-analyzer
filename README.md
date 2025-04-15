# Design System Analyzer

A Figma plugin that helps you analyze your design system usage and identify inconsistencies.

## Features

- Analyze components usage
- Identify color styles
- List text styles
- Detect effects
- Find inconsistencies in your design

## Installation

1. Download or clone this repository
2. Open Figma
3. Go to Plugins > Development > Import plugin from manifest
4. Select the `manifest.json` file from this repository

## Development

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run watch
```

3. Open Figma > Plugins > Development > Design System Analyzer

## Building

To build the plugin:

```bash
npm run build
```

## Usage

1. Select the elements you want to analyze in Figma
2. Open the plugin
3. Click "Analyze Selection"
4. View the analysis results:
   - Components found
   - Color styles used
   - Text styles applied
   - Effects detected
   - Any inconsistencies found

## License

MIT

## Development guide

*This plugin is built with [Create Figma Plugin](https://yuanqing.github.io/create-figma-plugin/).*

### Pre-requisites

- [Node.js](https://nodejs.org) – v22
- [Figma desktop app](https://figma.com/downloads/)

### Debugging

Use `console.log` statements to inspect values in your code.

To open the developer console, search for and run `Show/Hide Console` via the Quick Actions search bar.

## See also

- [Create Figma Plugin docs](https://yuanqing.github.io/create-figma-plugin/)
- [`yuanqing/figma-plugins`](https://github.com/yuanqing/figma-plugins#readme)

Official docs and code samples from Figma:

- [Plugin API docs](https://figma.com/plugin-docs/)
- [`figma/plugin-samples`](https://github.com/figma/plugin-samples#readme)
