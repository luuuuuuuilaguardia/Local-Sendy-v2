import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
import { initializeSocket } from './socket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

const LOCAL_IP = getLocalIP();
const SERVER_URL = `http://${LOCAL_IP}:${PORT}`;

function isPrivateIP(ip) {
    if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') return true;
    const cleanIP = ip.replace(/^::ffff:/, '');
    const parts = cleanIP.split('.').map(Number);
    if (parts.length !== 4) return true; // Allow IPv6 local
    // 10.0.0.0/8
    if (parts[0] === 10) return true;
    // 172.16.0.0/12
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16
    if (parts[0] === 192 && parts[1] === 168) return true;
    return false;
}

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
    maxHttpBufferSize: 2e8,
    pingTimeout: 60000,
    pingInterval: 25000,
});

io.use((socket, next) => {
    const clientIP = socket.handshake.address;
    if (isPrivateIP(clientIP)) {
        next();
    } else {
        next(new Error('Connection rejected: not on local network'));
    }
});

initializeSocket(io);

app.get('/api/info', async (req, res) => {
    try {
        const qrDataUrl = await QRCode.toDataURL(SERVER_URL, {
            width: 256,
            margin: 2,
            color: {
                dark: '#6366f1',
                light: '#00000000',
            },
        });
        res.json({
            ip: LOCAL_IP,
            port: PORT,
            url: SERVER_URL,
            qrCode: qrDataUrl,
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to generate QR code' });
    }
});

const distPath = path.join(__dirname, '..', 'dist');
const isDev = !fs.existsSync(path.join(distPath, 'index.html'));
const VITE_PORT = 5173;
const VITE_URL = `http://${LOCAL_IP}:${VITE_PORT}`;

if (!isDev) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
} else {
    app.get('*', (req, res) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) return;
        res.redirect(VITE_URL);
    });
}

server.listen(PORT, '0.0.0.0', () => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  LocalSendy Server Running');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Local:   http://localhost:${PORT}`);
    console.log(`  Network: ${SERVER_URL}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Share the URL above or scan the QR code');
    console.log('  in the web interface to connect devices.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});
