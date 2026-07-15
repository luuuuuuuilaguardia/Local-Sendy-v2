import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import DeviceList from './components/DeviceList';
import FileDrop from './components/FileDrop';
import TransferModal from './components/TransferModal';
import QRCodePanel from './components/QRCodePanel';
import ClipboardShare from './components/ClipboardShare';

const CHUNK_SIZE = 1024 * 1024;

function App() {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const [myDevice, setMyDevice] = useState(null);
    const [devices, setDevices] = useState([]);
    const [deviceName, setDeviceName] = useState('');
    const [showNamePrompt, setShowNamePrompt] = useState(true);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [showFileDrop, setShowFileDrop] = useState(false);
    const [incomingOffer, setIncomingOffer] = useState(null);
    const [transfers, setTransfers] = useState({});
    const [clipboardMessages, setClipboardMessages] = useState([]);
    const [toasts, setToasts] = useState([]);
    const socketRef = useRef(null);

    const detectDeviceType = () => {
        const ua = navigator.userAgent;
        if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
        if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'phone';
        return 'desktop';
    };

    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts((prev) => {
            // Keep max 3 toasts visible
            const next = [...prev, { id, message, type }];
            return next.slice(-3);
        });
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    useEffect(() => {
        const newSocket = io(window.location.origin, {
            transports: ['websocket', 'polling'],
        });

        newSocket.on('connect', () => {
            setConnected(true);
        });

        newSocket.on('disconnect', () => {
            setConnected(false);
            addToast('Disconnected from server', 'error');
        });

        newSocket.on('registered', (device) => {
            setMyDevice(device);
        });

        newSocket.on('device-list', (list) => {
            setDevices(list);
        });

        newSocket.on('file-offer', (offer) => {
            setIncomingOffer(offer);
        });

        newSocket.on('file-offer-sent', ({ transferId }) => {
            setTransfers((prev) => ({
                ...prev,
                [transferId]: { status: 'waiting', progress: 0, direction: 'sending' },
            }));
        });

        newSocket.on('file-accepted', ({ transferId }) => {
            setTransfers((prev) => ({
                ...prev,
                [transferId]: { ...prev[transferId], status: 'transferring' },
            }));
            addToast('Accepted — sending files...', 'success');
        });

        newSocket.on('file-rejected', ({ transferId }) => {
            setTransfers((prev) => ({
                ...prev,
                [transferId]: { ...prev[transferId], status: 'rejected' },
            }));
            addToast('Transfer was declined', 'error');
            setTimeout(() => {
                setTransfers((prev) => {
                    const copy = { ...prev };
                    delete copy[transferId];
                    return copy;
                });
            }, 3000);
        });

        newSocket.on('transfer-progress', ({ transferId, fileName, progress }) => {
            setTransfers((prev) => ({
                ...prev,
                [transferId]: { ...prev[transferId], progress, fileName, status: 'transferring' },
            }));
        });

        newSocket.on('file-received', ({ transferId, fileIndex, fileName, fileType, data }) => {
            const blob = new Blob([data], { type: fileType || 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            addToast(`Saved: ${fileName}`, 'success');
        });

        newSocket.on('transfer-complete', ({ transferId }) => {
            setTransfers((prev) => ({
                ...prev,
                [transferId]: { ...prev[transferId], status: 'complete', progress: 100 },
            }));
            addToast('Transfer complete', 'success');
            setTimeout(() => {
                setTransfers((prev) => {
                    const copy = { ...prev };
                    delete copy[transferId];
                    return copy;
                });
            }, 3000);
        });

        newSocket.on('transfer-error', ({ message }) => {
            addToast(message, 'error');
        });

        newSocket.on('clipboard-receive', ({ senderName, text, timestamp }) => {
            setClipboardMessages((prev) => [
                { senderName, text, timestamp, id: Date.now() },
                ...prev.slice(0, 49),
            ]);
            addToast(`Text from ${senderName}`, 'info');
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [addToast]);

    useEffect(() => {
        const saved = localStorage.getItem('localsendy-device-name');
        if (saved) {
            setDeviceName(saved);
            setShowNamePrompt(false);
            if (socketRef.current?.connected) {
                socketRef.current.emit('register-device', {
                    name: saved,
                    type: detectDeviceType(),
                });
            }
        }
    }, [connected]);

    const registerDevice = () => {
        const name = deviceName.trim();
        if (!name || !socket) return;
        localStorage.setItem('localsendy-device-name', name);
        socket.emit('register-device', {
            name,
            type: detectDeviceType(),
        });
        setShowNamePrompt(false);
    };

    const sendFiles = useCallback(
        async (files, targetId) => {
            if (!socket) return;

            const fileMetas = Array.from(files).map((f) => ({
                name: f.name,
                size: f.size,
                type: f.type,
            }));

            socket.emit('file-offer', { targetId, files: fileMetas });

            const handler = ({ transferId }) => {
                socket.off('file-accepted', handler);

                Array.from(files).forEach((file, fileIndex) => {
                    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
                    let chunkIndex = 0;

                    const sendNextChunk = () => {
                        if (chunkIndex >= totalChunks) return;

                        const start = chunkIndex * CHUNK_SIZE;
                        const end = Math.min(start + CHUNK_SIZE, file.size);
                        const slice = file.slice(start, end);

                        const reader = new FileReader();
                        reader.onload = () => {
                            socket.emit('file-chunk', {
                                transferId,
                                fileIndex,
                                chunk: reader.result,
                                chunkIndex,
                                totalChunks,
                                fileName: file.name,
                                fileSize: file.size,
                                fileType: file.type,
                            });

                            chunkIndex++;
                            setTimeout(sendNextChunk, 10);
                        };
                        reader.readAsArrayBuffer(slice);
                    };

                    sendNextChunk();
                });
            };

            socket.on('file-accepted', handler);
        },
        [socket]
    );

    const acceptOffer = () => {
        if (!socket || !incomingOffer) return;
        socket.emit('file-accept', { transferId: incomingOffer.transferId });
        setTransfers((prev) => ({
            ...prev,
            [incomingOffer.transferId]: {
                status: 'transferring',
                progress: 0,
                direction: 'receiving',
                senderName: incomingOffer.senderName,
                files: incomingOffer.files,
            },
        }));
        setIncomingOffer(null);
    };

    const rejectOffer = () => {
        if (!socket || !incomingOffer) return;
        socket.emit('file-reject', { transferId: incomingOffer.transferId });
        setIncomingOffer(null);
    };

    const sendClipboard = (targetId, text) => {
        if (!socket) return;
        socket.emit('clipboard-send', { targetId, text });
        addToast('Text sent', 'success');
    };

    const handleDeviceClick = (device) => {
        if (device.id === myDevice?.id) return;
        setSelectedDevice(device);
        setShowFileDrop(true);
    };

    const otherDevices = devices.filter((d) => d.id !== myDevice?.id);

    const detectedType = detectDeviceType();
    const namePlaceholders = {
        phone: 'e.g. iPhone 15, Pixel 8',
        tablet: 'e.g. iPad Pro, Tab S9',
        desktop: 'e.g. Macbook, Work PC',
    };

    return (
        <div className="min-h-screen bg-gray-950 relative overflow-x-hidden">
            {/* Subtle ambient blobs — kept very faint */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-[-15%] w-[450px] h-[450px] bg-brand-600/[0.06] rounded-full blur-[130px]" />
                <div className="absolute bottom-0 right-[-15%] w-[500px] h-[500px] bg-purple-600/[0.04] rounded-full blur-[130px]" />
            </div>

            {/* Toast notifications — bottom-center on mobile, top-right on desktop */}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 md:bottom-auto md:top-4 md:right-4 md:left-auto md:translate-x-0 z-50 flex flex-col gap-2 items-center md:items-end w-max max-w-[calc(100vw-2rem)]">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`animate-slide-down px-4 py-2.5 rounded-lg shadow-xl backdrop-blur-xl border text-sm font-medium whitespace-nowrap ${
                            toast.type === 'success'
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                                : toast.type === 'error'
                                ? 'bg-red-500/10 border-red-500/20 text-red-300'
                                : 'bg-brand-500/10 border-brand-500/20 text-brand-300'
                        }`}
                    >
                        {toast.message}
                    </div>
                ))}
            </div>

            {/* Device Name Prompt */}
            {showNamePrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in px-4">
                    <div className="glass rounded-2xl p-7 max-w-sm w-full glow animate-bounce-in">
                        {/* Logo mark */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-white leading-tight">LocalSendy</h1>
                                <p className="text-xs text-gray-500">No cloud. No accounts.</p>
                            </div>
                        </div>

                        <label className="block text-sm text-gray-400 mb-2 font-medium">
                            Name this device
                        </label>
                        <p className="text-xs text-gray-600 mb-3">
                            Other devices on your network will see this name.
                        </p>
                        <input
                            type="text"
                            placeholder={namePlaceholders[detectedType]}
                            value={deviceName}
                            onChange={(e) => setDeviceName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && registerDevice()}
                            className="input-field mb-4"
                            autoFocus
                            maxLength={32}
                        />
                        <button
                            onClick={registerDevice}
                            disabled={!deviceName.trim() || !connected}
                            className="w-full btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {connected ? 'Join Network' : 'Connecting...'}
                        </button>
                        {!connected && (
                            <p className="text-center text-gray-600 text-xs mt-3 flex items-center justify-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                                Connecting to server...
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Main App */}
            {!showNamePrompt && (
                <div className="relative z-10 max-w-6xl mx-auto px-4 pb-10">

                    {/* Compact header */}
                    <header className="flex items-center justify-between py-4 mb-6 border-b border-white/[0.06] animate-fade-in">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shrink-0">
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                                </svg>
                            </div>
                            <span className="text-base font-bold text-gradient">LocalSendy</span>
                        </div>

                        {/* Connection status + device badge */}
                        {myDevice && (
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                <span className="text-sm text-gray-400 hidden sm:inline">Connected as</span>
                                <span className="text-sm font-medium text-gray-200 max-w-[120px] sm:max-w-[180px] truncate">{myDevice.name}</span>
                            </div>
                        )}
                    </header>

                    {/* Layout: 2-col on desktop, stacked on mobile */}
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">

                        {/* Left column */}
                        <div className="space-y-5 min-w-0">
                            <DeviceList
                                devices={otherDevices}
                                myDevice={myDevice}
                                onDeviceClick={handleDeviceClick}
                            />
                            <ClipboardShare
                                devices={otherDevices}
                                messages={clipboardMessages}
                                onSend={sendClipboard}
                            />
                        </div>

                        {/* Right column — QR panel, stacks below on mobile */}
                        <div className="lg:sticky lg:top-4 lg:self-start">
                            <QRCodePanel />
                        </div>
                    </div>

                    <footer className="mt-10 pt-5 border-t border-white/[0.05] flex items-center justify-between flex-wrap gap-2">
                        <p className="text-gray-600 text-xs">LocalSendy — local network only, no internet</p>
                        <p className="text-gray-600 text-xs">Luis Laguardia · Bejay Calbayog · Ian Betorio</p>
                    </footer>
                </div>
            )}

            {/* File drop modal */}
            {showFileDrop && selectedDevice && (
                <FileDrop
                    targetDevice={selectedDevice}
                    onSend={(files) => {
                        sendFiles(files, selectedDevice.id);
                        setShowFileDrop(false);
                        setSelectedDevice(null);
                    }}
                    onClose={() => {
                        setShowFileDrop(false);
                        setSelectedDevice(null);
                    }}
                />
            )}

            {/* Incoming file offer */}
            {incomingOffer && (
                <TransferModal
                    type="incoming"
                    offer={incomingOffer}
                    onAccept={acceptOffer}
                    onReject={rejectOffer}
                />
            )}

            {/* Transfer progress — bottom center on mobile, bottom-right on desktop */}
            {Object.keys(transfers).length > 0 && (
                <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-40 space-y-2">
                    {Object.entries(transfers).map(([id, transfer]) => (
                        <TransferModal key={id} type="progress" transfer={transfer} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default App;
