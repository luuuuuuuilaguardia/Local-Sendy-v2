// Device type SVG icons
const DeviceIcons = {
    desktop: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25Z" />
        </svg>
    ),
    phone: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
        </svg>
    ),
    tablet: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5h3m-6.75 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25V4.5a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 4.5v15a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
    ),
};

const DeviceTypeLabel = {
    desktop: 'Desktop',
    phone: 'Mobile',
    tablet: 'Tablet',
};

function DeviceList({ devices, myDevice, onDeviceClick }) {
    return (
        <div className="glass rounded-2xl p-5 animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-brand-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" />
                    </svg>
                    <h2 className="text-sm font-semibold text-white">Nearby Devices</h2>
                </div>
                <div className="flex items-center gap-1.5">
                    {devices.length > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                    <span className="text-xs text-gray-500 bg-white/[0.04] px-2.5 py-0.5 rounded-full border border-white/[0.06]">
                        {devices.length} online
                    </span>
                </div>
            </div>

            {/* Empty state */}
            {devices.length === 0 ? (
                <div className="py-8 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" />
                        </svg>
                    </div>
                    <p className="text-gray-500 text-sm font-medium mb-1">No devices nearby</p>
                    <p className="text-gray-700 text-xs mb-5">Open LocalSendy on another device connected to the same Wi-Fi.</p>

                    {/* Step guide */}
                    <div className="text-left space-y-2 bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
                        <p className="section-label mb-3">How to connect</p>
                        {[
                            { step: '1', text: 'Make sure both devices are on the same Wi-Fi' },
                            { step: '2', text: 'Scan the QR code or open the URL shown on the right' },
                            { step: '3', text: 'Enter a name and join — this device will appear here' },
                        ].map(({ step, text }) => (
                            <div key={step} className="flex items-start gap-3">
                                <span className="w-5 h-5 rounded-full bg-brand-500/15 border border-brand-500/20 flex items-center justify-center text-[10px] font-bold text-brand-400 shrink-0 mt-0.5">
                                    {step}
                                </span>
                                <p className="text-xs text-gray-500 leading-relaxed">{text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    {/* Hint — shown when there are devices */}
                    <p className="text-xs text-gray-700 mb-3">Tap a device to send files</p>

                    {devices.map((device, i) => (
                        <button
                            key={device.id}
                            onClick={() => onDeviceClick(device)}
                            className="device-card w-full text-left group"
                            style={{ animationDelay: `${i * 60}ms` }}
                        >
                            {/* Icon */}
                            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/15 flex items-center justify-center text-brand-400 group-hover:bg-brand-500/15 transition-colors shrink-0">
                                {DeviceIcons[device.type] || DeviceIcons.desktop}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-white text-sm truncate group-hover:text-brand-300 transition-colors">
                                    {device.name}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                                    <span className="text-xs text-gray-600 truncate">
                                        {DeviceTypeLabel[device.type] || 'Device'} · {device.ip}
                                    </span>
                                </div>
                            </div>

                            {/* Send hint */}
                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <span className="text-xs text-brand-400 hidden sm:block">Send</span>
                                <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                                </svg>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default DeviceList;
