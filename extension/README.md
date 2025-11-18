# Unblank Chrome Extension

Chrome extension for the Unblank application built with Vite, React, and TypeScript.

## Tech Stack

- **Vite** - Build tool and dev server
- **React 19** - UI framework
- **TypeScript** - Type safety
- **TailwindCSS v4** - Styling (same configuration as main Next.js app)
- **CRXJS** - Vite plugin for Chrome extension development
- **Manifest V3** - Latest Chrome extension manifest

## Project Structure

```
extension/
├── public/
│   ├── icons/          # Extension icons
│   └── manifest.json   # Chrome extension manifest V3
├── src/
│   ├── background/     # Background service worker
│   │   └── index.ts
│   ├── content/        # Content scripts
│   │   └── index.ts
│   ├── popup/          # Extension popup
│   │   ├── index.html
│   │   ├── index.tsx
│   │   └── App.tsx
│   ├── options/        # Options page
│   │   ├── index.html
│   │   ├── index.tsx
│   │   └── App.tsx
│   ├── components/     # Shared React components
│   ├── utils/          # Utility functions
│   │   ├── storage.ts  # Chrome storage helpers
│   │   └── messaging.ts # Message passing helpers
│   ├── types/          # TypeScript type definitions
│   └── styles/         # Global styles
│       └── globals.css
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
├── postcss.config.mjs  # PostCSS configuration
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Chrome browser

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration

### Development

Start the development server:
```bash
npm run dev
```

This will:
- Start the Vite dev server with HMR
- Watch for file changes
- Build the extension in development mode

### Loading the Extension in Chrome

1. Build the extension:
```bash
npm run build
```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" (toggle in top-right)

4. Click "Load unpacked"

5. Select the `dist` folder from this project

### Production Build

Build for production:
```bash
npm run build
```

The optimized extension will be in the `dist` folder.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint

## Extension Architecture

### Popup
The extension popup appears when clicking the extension icon in the toolbar. Built with React.

### Options Page
Full-page settings interface accessible from the extension management page.

### Background Service Worker
Runs in the background, handles events, and manages communication between components.

### Content Scripts
Injected into web pages to interact with the DOM and page content.

## Communication

The extension uses Chrome's message passing API. Helper functions are available in `src/utils/messaging.ts`:

- `sendToBackground()` - Send message to background script
- `sendToTab()` - Send message to specific tab
- `sendToActiveTab()` - Send message to active tab

## Storage

Chrome storage API helpers are in `src/utils/storage.ts`:

- `getStorageData()` - Get data from storage
- `setStorageData()` - Save data to storage
- `removeStorageData()` - Remove data from storage
- `clearStorage()` - Clear all storage

## TailwindCSS

The extension uses the same TailwindCSS configuration as the main Next.js application, including:
- Same CSS variables
- Same color scheme
- Dark mode support

## Development Tips

- Use the Chrome DevTools for debugging:
  - Popup: Right-click extension icon → "Inspect popup"
  - Background: `chrome://extensions/` → "Inspect views: background page"
  - Content scripts: Regular page DevTools

- Hot Module Replacement (HMR) works for popup and options pages
- After manifest changes, reload the extension in `chrome://extensions/`

## License

ISC
