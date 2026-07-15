import crypto from 'crypto';

export class TransferManager {
    constructor(io) {
        this.io = io;
        this.transfers = new Map();
    }

    createTransfer(senderId, receiverId, files) {
        const transferId = crypto.randomUUID();
        this.transfers.set(transferId, {
            id: transferId,
            senderId,
            receiverId,
            files: files.map((f) => ({ name: f.name, size: f.size, type: f.type })),
            status: 'pending',
            chunks: new Map(),
            completedFiles: new Set(),
            createdAt: Date.now(),
        });

        setTimeout(() => {
            this.removeTransfer(transferId);
        }, 30 * 60 * 1000);

        return transferId;
    }

    getTransfer(transferId) {
        return this.transfers.get(transferId);
    }

    setStatus(transferId, status) {
        const transfer = this.transfers.get(transferId);
        if (transfer) {
            transfer.status = status;
        }
    }

    addChunk(transferId, fileIndex, chunkIndex, chunk) {
        const transfer = this.transfers.get(transferId);
        if (!transfer) return;

        if (!transfer.chunks.has(fileIndex)) {
            transfer.chunks.set(fileIndex, []);
        }
        const fileChunks = transfer.chunks.get(fileIndex);
        fileChunks[chunkIndex] = Buffer.from(chunk);
    }

    getProgress(transferId, fileIndex, totalChunks) {
        const transfer = this.transfers.get(transferId);
        if (!transfer) return 0;

        const fileChunks = transfer.chunks.get(fileIndex);
        if (!fileChunks) return 0;

        const receivedChunks = fileChunks.filter(Boolean).length;
        return Math.round((receivedChunks / totalChunks) * 100);
    }

    assembleFile(transferId, fileIndex) {
        const transfer = this.transfers.get(transferId);
        if (!transfer) return null;

        const fileChunks = transfer.chunks.get(fileIndex);
        if (!fileChunks) return null;

        const buffer = Buffer.concat(fileChunks.filter(Boolean));

        transfer.completedFiles.add(fileIndex);
        transfer.chunks.delete(fileIndex);

        return buffer;
    }

    isTransferComplete(transferId) {
        const transfer = this.transfers.get(transferId);
        if (!transfer) return false;
        return transfer.completedFiles.size === transfer.files.length;
    }

    removeTransfer(transferId) {
        const transfer = this.transfers.get(transferId);
        if (transfer) {
            transfer.chunks.clear();
            transfer.completedFiles.clear();
            this.transfers.delete(transferId);
        }
    }

    cleanupDevice(socketId) {
        for (const [transferId, transfer] of this.transfers) {
            if (transfer.senderId === socketId || transfer.receiverId === socketId) {
                const otherId = transfer.senderId === socketId ? transfer.receiverId : transfer.senderId;
                const otherSocket = this.io.sockets.sockets.get(otherId);
                if (otherSocket) {
                    otherSocket.emit('transfer-error', {
                        transferId,
                        message: 'Other device disconnected',
                    });
                }
                this.removeTransfer(transferId);
            }
        }
    }
}
