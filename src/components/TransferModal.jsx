function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function TransferModal({ type, offer, transfer, onAccept, onReject }) {
    if (type === 'incoming' && offer) {
        const totalSize = offer.files.reduce((acc, f) => acc + f.size, 0);

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm animate-fade-in px-4">
                <div className="glass rounded-2xl p-6 max-w-sm w-full glow animate-bounce-in">
                    <div className="text-center mb-5">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                            <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                        </div>
                        <h3 className="text-base font-bold text-white leading-tight">Incoming Files</h3>
                        <p className="text-xs text-gray-500 mt-1">
                            from <span className="text-brand-400 font-semibold">{offer.senderName}</span>
                        </p>
                    </div>

                    {/* File list with total count */}
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-1.5 px-1">
                            <span className="section-label">{offer.files.length} file{offer.files.length !== 1 ? 's' : ''}</span>
                            <span className="text-[11px] text-gray-500">{formatFileSize(totalSize)}</span>
                        </div>
                        <div className="space-y-1 max-h-36 overflow-y-auto bg-black/25 border border-white/[0.04] p-1.5 rounded-lg">
                            {offer.files.map((file, i) => (
                                <div key={i} className="flex items-center justify-between p-2 rounded bg-white/[0.01] border border-white/[0.03]">
                                    <span className="text-xs text-gray-300 truncate flex-1 mr-3 font-mono">{file.name}</span>
                                    <span className="text-[10px] text-gray-500 whitespace-nowrap">{formatFileSize(file.size)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={onReject} className="flex-1 btn-danger py-2 text-xs">
                            Decline
                        </button>
                        <button onClick={onAccept} className="flex-1 btn-primary py-2 text-xs">
                            Accept
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (type === 'progress' && transfer) {
        const statusConfig = {
            waiting: { label: 'Connecting...', color: 'text-amber-400', bg: 'bg-amber-500' },
            transferring: { label: 'Transferring...', color: 'text-brand-400', bg: 'bg-brand-500' },
            complete: { label: 'Finished', color: 'text-emerald-400', bg: 'bg-emerald-500' },
            rejected: { label: 'Declined', color: 'text-red-400', bg: 'bg-red-500' },
        };

        const config = statusConfig[transfer.status] || statusConfig.waiting;

        return (
            <div className="glass rounded-xl p-4 animate-slide-up border border-white/[0.08] shadow-lg">
                <div className="flex items-center justify-between gap-3 mb-2">
                    {/* State info */}
                    <div className="min-w-0">
                        <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
                        {transfer.fileName && (
                            <p className="text-[11px] text-gray-400 truncate mt-0.5 max-w-[160px] font-mono leading-tight">
                                {transfer.fileName}
                            </p>
                        )}
                    </div>

                    {/* Labeled direction badge */}
                    {transfer.direction === 'sending' ? (
                        <div className="flex items-center gap-1 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded text-[10px] text-brand-300 font-semibold shrink-0">
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
                            </svg>
                            <span>Sending</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded text-[10px] text-purple-300 font-semibold shrink-0">
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
                            </svg>
                            <span>Receiving</span>
                        </div>
                    )}
                </div>

                {/* Progress track */}
                <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                        className={`h-full rounded-full ${config.bg} progress-bar`}
                        style={{ width: `${transfer.progress || 0}%` }}
                    />
                </div>

                {/* Value representation */}
                <div className="flex justify-between mt-1 text-[10px] font-mono text-gray-500">
                    <span>{transfer.progress || 0}%</span>
                    {transfer.senderName && (
                        <span>From: {transfer.senderName}</span>
                    )}
                </div>
            </div>
        );
    }

    return null;
}

export default TransferModal;
