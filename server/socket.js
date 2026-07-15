import { TransferManager } from './transfer.js';

export function initializeSocket(io) {
    const devices = new Map();
    const transferManager = new TransferManager(io);

    function broadcastDeviceList() {
        const deviceList = Array.from(devices.values());
        io.emit('device-list', deviceList);
    }

    io.on('connection', (socket) => {
        const clientIP = socket.handshake.address.replace(/^::ffff:/, '');

        socket.on('register-device', (data) => {
            const device = {
                id: socket.id,
                name: data.name || 'Unknown Device',
                type: data.type || 'desktop',
                ip: clientIP,
                connectedAt: Date.now(),
            };
            devices.set(socket.id, device);
            socket.emit('registered', device);
            broadcastDeviceList();
        });

        socket.on('file-offer', (data) => {
            const sender = devices.get(socket.id);
            if (!sender) return;

            const { targetId, files } = data;
            const targetSocket = io.sockets.sockets.get(targetId);
            if (!targetSocket) {
                socket.emit('transfer-error', { message: 'Target device not found' });
                return;
            }

            const transferId = transferManager.createTransfer(socket.id, targetId, files);

            targetSocket.emit('file-offer', {
                transferId,
                senderId: socket.id,
                senderName: sender.name,
                files: files.map((f) => ({
                    name: f.name,
                    size: f.size,
                    type: f.type,
                })),
            });

            socket.emit('file-offer-sent', { transferId, targetId });
        });

        socket.on('file-accept', (data) => {
            const { transferId } = data;
            const transfer = transferManager.getTransfer(transferId);
            if (!transfer) return;

            const senderSocket = io.sockets.sockets.get(transfer.senderId);
            if (senderSocket) {
                senderSocket.emit('file-accepted', { transferId });
            }
            transferManager.setStatus(transferId, 'accepted');
        });

        socket.on('file-reject', (data) => {
            const { transferId } = data;
            const transfer = transferManager.getTransfer(transferId);
            if (!transfer) return;

            const senderSocket = io.sockets.sockets.get(transfer.senderId);
            if (senderSocket) {
                senderSocket.emit('file-rejected', { transferId });
            }
            transferManager.removeTransfer(transferId);
        });

        socket.on('file-chunk', (data) => {
            const { transferId, fileIndex, chunk, chunkIndex, totalChunks, fileName, fileSize, fileType } = data;
            const transfer = transferManager.getTransfer(transferId);
            if (!transfer) return;

            transferManager.addChunk(transferId, fileIndex, chunkIndex, chunk);

            const progress = transferManager.getProgress(transferId, fileIndex, totalChunks);

            const senderSocket = io.sockets.sockets.get(transfer.senderId);
            const receiverSocket = io.sockets.sockets.get(transfer.receiverId);

            const progressData = {
                transferId,
                fileIndex,
                fileName,
                chunkIndex,
                totalChunks,
                progress,
            };

            if (senderSocket) senderSocket.emit('transfer-progress', progressData);
            if (receiverSocket) receiverSocket.emit('transfer-progress', progressData);

            if (chunkIndex === totalChunks - 1) {
                const fileBuffer = transferManager.assembleFile(transferId, fileIndex);
                if (fileBuffer && receiverSocket) {
                    receiverSocket.emit('file-received', {
                        transferId,
                        fileIndex,
                        fileName,
                        fileSize,
                        fileType,
                        data: fileBuffer,
                    });
                }

                if (transferManager.isTransferComplete(transferId)) {
                    if (senderSocket) senderSocket.emit('transfer-complete', { transferId });
                    if (receiverSocket) receiverSocket.emit('transfer-complete', { transferId });
                    transferManager.removeTransfer(transferId);
                }
            }
        });

        socket.on('clipboard-send', (data) => {
            const sender = devices.get(socket.id);
            if (!sender) return;

            const { targetId, text } = data;
            const targetSocket = io.sockets.sockets.get(targetId);
            if (targetSocket) {
                targetSocket.emit('clipboard-receive', {
                    senderId: socket.id,
                    senderName: sender.name,
                    text,
                    timestamp: Date.now(),
                });
            }
        });

        socket.on('disconnect', () => {
            const device = devices.get(socket.id);
            if (device) {
                devices.delete(socket.id);
                transferManager.cleanupDevice(socket.id);
                broadcastDeviceList();
            }
        });
    });
}
