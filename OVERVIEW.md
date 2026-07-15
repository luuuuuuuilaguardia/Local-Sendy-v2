# LocalSendy — Project Overview

## What It Is

**LocalSendy** is a **local network file and text sharing web application**. It lets devices on the same WiFi/LAN transfer files and clipboard text to each other — with **no cloud, no accounts, and no internet required**. Think of it as a self-hosted AirDrop alternative that works across all platforms (any device with a browser).

---

## Architecture

The project follows a **client-server model** with real-time communication via WebSockets:

```
┌──────────────┐        WebSocket (Socket.io)        ┌──────────────┐
│   Browser A  │ ◄──────────────────────────────────► │              │
│  (React SPA) │                                      │  Node.js     │
└──────────────┘                                      │  Express     │
                                                      │  Server      │
┌──────────────┐        WebSocket (Socket.io)        │  (port 3000) │
│   Browser B  │ ◄──────────────────────────────────► │              │
│  (React SPA) │                                      └──────────────┘
└──────────────┘
```

- **Backend**: Node.js + Express + Socket.io — handles device registry, file relay, and text sharing
- **Frontend**: React + Vite + TailwindCSS — provides the UI with glassmorphism dark theme
- **Dev mode**: Vite dev server (port 5173) proxies `/api` and `/socket.io` to the Express server (port 3000) via `vite.config.js`

---

## Server Side

### `server/server.js`

The entry point. It:

1. Creates an Express + HTTP server with Socket.io
2. Detects the machine's **local IP** address (e.g. `192.168.1.5`) using `os.networkInterfaces()`
3. Exposes **`/api/info`** — returns the server URL and a **QR code** (generated with the `qrcode` library) so mobile devices can easily connect
4. Enforces a **private IP guard** via `isPrivateIP()` in a Socket.io middleware — only devices on the local network (10.x.x.x, 172.16-31.x.x, 192.168.x.x, loopback) can connect
5. In production, serves the built static files from `dist/`. In dev, redirects to the Vite dev server
6. Sets `maxHttpBufferSize` to **200MB** to allow large file chunk transfers over the socket

### `server/socket.js`

The core **real-time event handler**. It manages:

- **Device Registry** — a `Map<socketId, deviceInfo>` that tracks all connected devices. On `register-device`, it stores the device and broadcasts the updated device list to everyone via `broadcastDeviceList()`
- **File Transfer Flow** (detailed below)
- **Clipboard/Text Sharing** — on `clipboard-send`, it relays the text to the target device via `clipboard-receive`
- **Disconnect cleanup** — removes the device from the registry and cleans up any in-progress transfers

### `server/transfer.js`

The `TransferManager` class manages file transfer state:

- **`createTransfer()`** — generates a unique `transferId`, stores sender/receiver IDs, file metadata, and initializes chunk storage. Auto-cleans after 30 minutes.
- **`addChunk()`** — stores incoming binary chunks indexed by `[fileIndex][chunkIndex]`
- **`assembleFile()`** — concatenates all chunks for a file into a single `Buffer`, then frees the chunk memory
- **`isTransferComplete()`** — checks if all files in a multi-file transfer have been delivered
- **`cleanupDevice()`** — when a device disconnects, notifies the other party and removes related transfers

---

## File Transfer Flow (The Core Feature)

This is the most complex part. Here's the step-by-step:

### 1. Sender initiates (client → server)

In `App.jsx`, `sendFiles()` emits `file-offer` with the target device ID and file metadata (name, size, type).

### 2. Server creates transfer & notifies receiver

In `socket.js`, the server calls `transferManager.createTransfer()`, then emits `file-offer` to the receiver and `file-offer-sent` back to the sender.

### 3. Receiver sees the offer

The `TransferModal` component renders the **incoming offer dialog** showing the sender name, file list, and sizes. The receiver can **Accept** or **Reject**.

### 4. If accepted

Receiver emits `file-accept` → server relays `file-accepted` to the sender.

### 5. Chunked upload begins

Back in `sendFiles()` in `App.jsx`, the sender reads each file in **1MB chunks** (`CHUNK_SIZE = 1024 * 1024`):

```
File → slice(0, 1MB) → FileReader.readAsArrayBuffer → socket.emit('file-chunk') → next chunk...
```

A small 10ms `setTimeout` between chunks prevents overwhelming the socket.

### 6. Server reassembles & delivers

In `socket.js`, each `file-chunk` event:

- Stores the chunk via `transferManager.addChunk()`
- Calculates and broadcasts progress to both sender and receiver
- When the **last chunk** arrives (`chunkIndex === totalChunks - 1`), it calls `transferManager.assembleFile()` to concatenate all chunks into a single buffer, then emits `file-received` with the full binary data to the receiver

### 7. Receiver downloads the file

In `App.jsx`, the `file-received` handler creates a `Blob` from the data, generates an object URL, creates a temporary `<a>` element, and triggers a download.

### 8. Completion

When all files are delivered, the server emits `transfer-complete` to both parties, and the transfer is cleaned up.

---

## Frontend Components

### `src/App.jsx`

The root component. It:

- Manages **all application state**: socket connection, device list, transfers, clipboard messages, toasts
- Shows a **name prompt** on first visit (saved to `localStorage`)
- Detects **device type** (desktop/phone/tablet) from the user agent
- Orchestrates the entire transfer lifecycle
- Renders the layout: header, device list, clipboard share, QR panel, modals

### `src/components/DeviceList.jsx`

Displays all **other** connected devices in a card grid. Each device shows:

- An icon based on type (desktop/phone/tablet) from the `DeviceIcons` map
- Device name, online status, and IP address
- Clicking a device opens the file drop modal

### `src/components/FileDrop.jsx`

A modal with a **drag-and-drop zone** (using `react-dropzone`). Features:

- Multi-file support with file list display
- File type icons via `getFileIcon()`
- File size formatting via `formatFileSize()`
- Remove individual files before sending

### `src/components/TransferModal.jsx`

A dual-purpose component:

1. **`type="incoming"`** — Shows the incoming file offer dialog with Accept/Reject buttons, sender name, and file list
2. **`type="progress"`** — Shows a transfer progress bar card with status (waiting → transferring → complete/rejected) and direction (sending/receiving)

### `src/components/QRCodePanel.jsx`

Fetches `/api/info` on mount and displays:

- A **QR code** image (generated server-side) that encodes the server URL
- The server URL with a **copy button**
- This lets mobile devices easily join by scanning

### `src/components/ClipboardShare.jsx`

A text messaging panel:

- Select a target device from a dropdown
- Type or paste text and send
- Received messages appear in a scrollable list with **copy-to-clipboard** buttons
- Messages are stored in state (up to 50, managed in `App.jsx`)

---

## Styling

- **`tailwind.config.js`** — Defines a custom `brand` color palette (indigo-based), custom animations (`fade-in`, `slide-up`, `slide-down`, `bounce-in`), and Inter font family
- **`src/index.css`** — Defines reusable component classes:
  - `.glass` — glassmorphism effect (semi-transparent background + backdrop blur + subtle border)
  - `.glow` / `.glow-sm` — colored box shadows
  - `.text-gradient` — gradient text effect
  - `.btn-primary`, `.btn-ghost`, `.btn-danger` — button variants
  - `.input-field` — styled input fields
  - Custom scrollbar styling

---

## Development & Build

| Command           | What it does                                                    |
| ----------------- | --------------------------------------------------------------- |
| `npm run dev`     | Runs both the Express server and Vite dev server concurrently   |
| `npm run build`   | Builds the React frontend to `dist/`                            |
| `npm start`       | Runs only the Express server (serves `dist/` in production)     |
| `npm run preview` | Builds then starts the production server                        |

---

## Security Model

- **Network-level**: The Socket.io middleware in `server.js` rejects connections from non-private IPs
- **No authentication**: Anyone on the local network can connect — by design, since it's meant for trusted LANs
- **Transfer consent**: File transfers require the receiver to explicitly **accept** before any data is sent
- **Auto-cleanup**: Transfers are automatically removed after 30 minutes via `setTimeout` in `TransferManager.createTransfer()`

---

## Key Limitations

1. **Files are relayed through the server** — they're not sent peer-to-peer (no WebRTC), so the server's memory is used for chunk assembly
2. **Max file size** is effectively limited by the 200MB socket buffer (`maxHttpBufferSize`) and server RAM
3. **No encryption** — traffic is plain HTTP on the local network (no TLS)
4. **No persistence** — everything is in-memory; restarting the server clears all state
