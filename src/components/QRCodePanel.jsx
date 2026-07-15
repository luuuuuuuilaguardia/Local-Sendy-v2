import { useState, useEffect } from 'react';

function QRCodePanel() {
    const [info, setInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showHelp, setShowHelp] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetch('/api/info')
            .then((res) => res.json())
            .then((data) => {
                setInfo(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const copyUrl = () => {
        if (!info) return;
        navigator.clipboard.writeText(info.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="glass rounded-2xl p-5 animate-slide-up" style={{ animationDelay: '150ms' }}>
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-brand-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
                </svg>
                Connect Device
            </h2>

            <div className="text-center">
                {loading ? (
                    <div className="py-10">
                        <div className="w-6 h-6 mx-auto border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                        <p className="text-gray-500 text-xs mt-3">Loading connection info...</p>
                    </div>
                ) : info ? (
                    <>
                        {/* QR Code Container */}
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 mb-4 inline-block">
                            <img
                                src={info.qrCode}
                                alt="QR Code to connect"
                                className="w-40 h-40 mx-auto"
                                style={{ imageRendering: 'pixelated' }}
                            />
                        </div>

                        {/* Separate IP and Port chips */}
                        <div className="flex justify-center gap-2 text-xs mb-4">
                            <div className="bg-white/[0.03] border border-white/[0.05] px-2 py-0.5 rounded-md flex items-center gap-1.5">
                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">IP</span>
                                <span className="font-mono text-gray-300">{info.ip}</span>
                            </div>
                            <div className="bg-white/[0.03] border border-white/[0.05] px-2 py-0.5 rounded-md flex items-center gap-1.5">
                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Port</span>
                                <span className="font-mono text-gray-300">{info.port}</span>
                            </div>
                        </div>

                        {/* Connection Link */}
                        <p className="text-gray-500 text-xs mb-2">Scan QR or navigate to:</p>
                        <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-2.5 flex items-center justify-between w-full">
                            <span className="text-brand-400 font-mono text-xs truncate select-all">{info.url}</span>
                            <button
                                onClick={copyUrl}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                    copied
                                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                        : 'bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-gray-400 hover:text-white'
                                }`}
                                title="Copy connection URL"
                            >
                                {copied ? (
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                    </svg>
                                ) : (
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                                    </svg>
                                )}
                            </button>
                        </div>

                        {/* Troubleshooting Accordion */}
                        <div className="mt-4 pt-4 border-t border-white/[0.05] text-left">
                            <button
                                onClick={() => setShowHelp(!showHelp)}
                                className="w-full flex items-center justify-between text-xs text-gray-500 hover:text-gray-300 transition-colors font-medium"
                            >
                                <span>Connection helper</span>
                                <svg
                                    className={`w-3.5 h-3.5 transform transition-transform duration-200 ${showHelp ? 'rotate-180' : ''}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                </svg>
                            </button>

                            {showHelp && (
                                <div className="mt-3 space-y-3 text-[11px] text-gray-400 bg-white/[0.01] border border-white/[0.03] p-3.5 rounded-xl">
                                    <div>
                                        <p className="font-semibold text-gray-300">1. Check network subnet</p>
                                        <p className="text-gray-500 mt-0.5 leading-relaxed">Both devices must be on the exact same Wi-Fi router. Disable cellular data on your phone.</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-300">2. VPN software check</p>
                                        <p className="text-gray-500 mt-0.5 leading-relaxed">Turn off NordVPN, Tailscale, or work VPNs on both computer and phone, as they isolate local traffic.</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-300">3. AP/Client Isolation</p>
                                        <p className="text-gray-500 mt-0.5 leading-relaxed">Hotel, school, and guest Wi-Fi networks block local devices from connecting. Use your private home network.</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-300">4. Run directly in Production Mode</p>
                                        <p className="text-gray-500 mt-0.5 leading-relaxed">
                                            If the Vite server port is blocked by your router/firewall, build and run directly on port 3000:
                                            <code className="block bg-black/40 px-2 py-1 mt-1 rounded font-mono text-[10px] text-brand-400 leading-tight">npm run build && npm start</code>
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <p className="text-gray-500 text-xs py-10">Could not fetch server information.</p>
                )}
            </div>
        </div>
    );
}

export default QRCodePanel;
