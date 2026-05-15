"use client"

export const Loading = () => {
    return (
        <div className="flex flex-col items-center gap-4">
            {/* The Track */}
            <div className="relative w-64 h-0.5 bg-white/5 overflow-hidden rounded-full">
                {/* The Laser */}
                <div
                    className="absolute top-0 h-full w-24 bg-linear-to-r from-transparent via-lime-400 to-transparent animate-laser-scan"
                    style={{
                        boxShadow: '0 0 15px rgba(163, 230, 53, 0.8)',
                    }}
                />
            </div>

            {/* Micro-copy for the "Pro" feel */}
            <span className="text-[10px] uppercase tracking-[0.4em] text-white/30 animate-pulse font-light">
                Initializing System...
            </span>

            <style jsx>{`
                @keyframes laser-scan {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(250%); }
                }
                .animate-laser-scan {
                    animation: laser-scan 1.5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
                }
            `}</style>
        </div>
    )
}