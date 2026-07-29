# QR Architect AI — Web Application Studio

This package contains the source code for the **QR Architect AI** studio web application.

## Available Scripts

In the `qr-code-app` directory, you can run:

### `npm run dev`
Runs the app in the development mode.\
Open [http://localhost:5173](http://localhost:5173) to view it in your browser.

### `npm run test`
Launches the Vitest test runner for security, payload formatting, and privacy unit tests.

### `npm run build`
Builds the app for production to the `dist` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

### `npm run preview`
Locally previews the production build.

## Features & Architecture

- **`useAutoScale` Hook**: ResizeObserver-based auto-scaling preview container with `transform: scale()`.
- **`useScanTest` Hook**: Real-time scannability indicator combining native `BarcodeDetector` with `jsQR` CPU fallback.
- **Smart Logo Compressor**: Transparency-preserving logo optimizer limiting dimensions to max 1024px and files to $\le 500\text{KB}$.
- **Privacy Engine**: Redacts Wi-Fi passwords from disk persistence and history snapshots.

