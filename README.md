# QR Architect AI — Ultra HD Vector QR Code Studio

[![Build & Deploy](https://github.com/rockkamal253-NS/qr-architect-ai/actions/workflows/deploy.yml/badge.svg)](https://github.com/rockkamal253-NS/qr-architect-ai/actions)
[![Node.js](https://img.shields.io/badge/Node.js-24-emerald.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A high-precision, production-grade web application for creating, customizing, verifying, and exporting **2K/4K Ultra HD raster (PNG/JPEG/WebP)** and **pure vector SVG** QR codes.

---

## ✨ Key Features

- **2× Ultra HD Canvas Engine**: High-density buffer rendering up to **2400 × 2400 px** with `.qr-canvas` pixelated crisp-edges to eliminate bilinear blur.
- **Un-cropped Pure Vector SVG Export**: Dedicated vector rendering pipeline producing clean `<svg width="size" height="size" viewBox="0 0 size size">` files independent of raster buffer scaling.
- **Live Scannability Verification Badge**: Real-time 500ms debounced decoder using native hardware `BarcodeDetector` (Chrome/Edge/Android) with `jsQR` CPU fallback (Safari/Firefox/iOS).
- **Privacy & Security Protection**:
  - Reserved character escaping for Wi-Fi payloads per MECARD/WIFI specification.
  - Wi-Fi passwords redacted from `localStorage` persistence and history snapshots (`P:********`).
  - XSS defense via DOMPurify sanitization.
- **512px High-DPI Avatar Engine**: Smart alpha-aware logo compressor (max 1024px, $\le 500\text{KB}$) and avatar crop quality loop for Social Bio pages.
- **SHA-256 Content Fingerprinting**: Debounced NFC string hashing, `qr-HASH8.png` filenames, SVG `<!-- hash: FULL_HEX -->` injection, and interactive 64-character verification modal.

---

## 🛠️ Tech Stack

- **Core**: React 18, Vite 8, Zustand state management
- **Styling**: TailwindCSS v4 with custom dark mode glassmorphism
- **QR Engine**: `qr-code-styling`, `jsqr`, native `BarcodeDetector`
- **Security & Utilities**: `dompurify`, `lucide-react`, Vitest

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/rockkamal253-NS/qr-architect-ai.git

# Change into app directory
cd qr-code-app

# Install dependencies
npm install

# Start local dev server
npm run dev

# Run unit tests
npm run test

# Build production bundle
npm run build
```

---

## 🌐 Live Deployment

View the live application on GitHub Pages: [QR Architect AI Live App](https://rockkamal253-ns.github.io/qr-architect-ai/)

