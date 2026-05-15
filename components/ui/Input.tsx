'use client'

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}


export const Input = ({ label, className, type, ...props }: InputProps) => {

    const config = {
        email: {
            autoComplete: 'email',
            placeholder: 'Gigson@gmail.com...',
        },
        password: {
            autoComplete: 'current-password',
            placeholder: 'password123...',
        },
    }

    const typeProps = config[type as keyof typeof config] || {};

    return (
        <div className="w-full max-w-md group">
            {label && (
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-[0.3em] mb-0.5 ml-0.5 transition-all duration-500 group-focus-within:text-white group-focus-within:translate-x-1">
                    {label}
                </label>
            )}

            <div className="relative">
                <input
                    type={type}
                    {...props}
                    {...typeProps}

                    className={`
                        w-full text-white text-lg px-0 py-2
                        border-b border-gray-800 outline-none
                        transition-all duration-500
                        placeholder:text-gray-700
                        caret-lime-600
                        peer
                        ${className || ''}
                    `}
                />

                {/* Design strictly preserved */}
                <div className="absolute bottom-0 left-0 h-0.5 w-full bg-lime-700 scale-x-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] origin-left peer-focus:scale-x-100 shadow-[0_1px_15px_rgba(163,230,53,0.5)]" />
            </div>
        </div>
    );
};