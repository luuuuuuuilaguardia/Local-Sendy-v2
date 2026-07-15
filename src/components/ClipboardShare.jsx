import { useState } from 'react';

function ClipboardShare({ devices, messages, onSend }) {
    const [text, setText] = useState('');
    const [targetId, setTargetId] = useState('');
    const [copiedId, setCopiedId] = useState(null);

    const handleSend = () => {
        if (!text.trim() || !targetId) return;
        onSend(targetId, text.trim());
        setText('');
    };

    const copyToClipboard = (content, id) => {
        navigator.clipboard.writeText(content);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const maxLength = 1000;

    return (
        <div className="glass rounded-2xl p-5 animate-slide-up" style={{ animationDelay: '100ms' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-brand-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                    </svg>
                    <h2 className="text-sm font-semibold text-white">Share Clipboard</h2>
                </div>
            </div>

            {/* Input Form — Stacks on mobile, inline on tablets/desktops */}
            <div className="space-y-2 mb-4">
                <div className="flex flex-col sm:flex-row gap-2">
                    <select
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                        className="input-field py-2.5 text-xs bg-gray-900 text-white w-full sm:w-44 shrink-0"
                        style={{ colorScheme: 'dark' }}
                    >
                        <option value="" className="bg-gray-900 text-gray-400">Select recipient</option>
                        {devices.map((d) => (
                            <option key={d.id} value={d.id} className="bg-gray-900 text-white">
                                {d.name}
                            </option>
                        ))}
                    </select>

                    <div className="relative flex-1 flex gap-2">
                        <input
                            type="text"
                            placeholder="Type text or paste URL..."
                            value={text}
                            onChange={(e) => setText(e.target.value.slice(0, maxLength))}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            className="input-field py-2.5 text-xs pr-16"
                            maxLength={maxLength}
                        />

                        {/* Character count helper in the input */}
                        {text.length > 0 && (
                            <span className="absolute right-14 top-1/2 -translate-y-1/2 text-[10px] font-mono text-gray-600">
                                {text.length}/{maxLength}
                            </span>
                        )}

                        <button
                            onClick={handleSend}
                            disabled={!text.trim() || !targetId}
                            className="btn-primary py-2.5 px-4 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center justify-center"
                            title="Send clipboard text"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Inline Helper Guidance */}
                {!targetId && text.trim() && (
                    <p className="text-[11px] text-brand-400/80 animate-fade-in">
                        Please select a recipient device above to send this text.
                    </p>
                )}
            </div>

            {/* Message log */}
            {messages.length > 0 ? (
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    <p className="section-label mb-2">Received Clipboard Text</p>
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all group"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-semibold text-brand-400">{msg.senderName}</span>
                                    <span className="text-[10px] text-gray-600">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-300 break-all select-all font-mono leading-relaxed bg-black/20 p-2 rounded-lg border border-white/[0.03]">
                                    {msg.text}
                                </p>
                            </div>
                            <button
                                onClick={() => copyToClipboard(msg.text, msg.id)}
                                className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.1] hover:border-white/[0.15] flex items-center justify-center text-gray-500 hover:text-white transition-all shrink-0 mt-5 relative"
                                title="Copy to clipboard"
                            >
                                {copiedId === msg.id ? (
                                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                    </svg>
                                ) : (
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 font-medium">Text Share Helper</p>
                    <p className="text-gray-700 text-[11px] mt-1 leading-relaxed">
                        Instantly send copied URLs, paragraphs, or commands between devices. Text is displayed directly for easy 1-click copying.
                    </p>
                </div>
            )}
        </div>
    );
}

export default ClipboardShare;
