# LocalDrop

**Local network file sharing** — transfer files instantly between devices on the same WiFi. No cloud, no accounts, no internet required.

## Quick Start

```bash
npm install
npm run dev
```

Then open the URL shown in the terminal (e.g. `http://192.168.1.7:3000`) on any device on the same network.

## Features

- **Device Discovery** — devices appear automatically when connected
- **File Transfer** — drag & drop, multi-file, chunked streaming (up to 2GB)
- **QR Code** — scan to connect from mobile devices
- **Text Sharing** — send clipboard/text between devices
- **Dark Mode UI** — glassmorphism design with animations
- **Local Only** — all traffic stays on your network

## How It Works

1. Run the server on one device (PC/laptop)
2. Other devices open the URL or scan the QR code
3. Enter a device name → device appears in the list
4. Click a device → drag files → send

## Production

```bash
npm run build
npm start
```

## Tech Stack

- **Backend**: Node.js, Express, Socket.io
- **Frontend**: React, Vite, TailwindCSS
- **Libraries**: qrcode, react-dropzone
