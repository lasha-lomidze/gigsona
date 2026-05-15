import React from 'react'

export const BottomUpNeonButton = ({ text }: { text: string }) => {
    return (
        <button
            className="
        group relative w-full py-4 r overflow-hidden
        border-b border-lime-500  
        transition-all duration-500 ease-out text-sm
        hover:border-lime-400 hover:shadow-[0_0_20px_rgba(163,230,53,0.3)]"
        >
            <span className="relative z-10 text-lime-500  uppercase tracking-[0.2em] transition-colors duration-500 font-light group-hover:text-black">
                {text}
            </span>

            <div className="absolute inset-0 bg-lime-500 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]" />
        </button>
    )
}
