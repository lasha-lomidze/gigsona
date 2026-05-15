'use client'

import React from 'react';

interface FormProps {
    title?: string;
    children: React.ReactNode;
    action?: (formData: FormData) => void;
    className?: string;
}

export const Form = ({ title, children, action, className = "" }: FormProps) => {
    return (
        <form action={action} className={`group/form w-full ${className}`}>
            {title && (
                <div className="relative mb-2 w-fit">
                    <h2 className="text-[11px] font-black text-gray-600 uppercase tracking-[0.6em] transition-all duration-500 group-focus-within/form:text-white group-focus-within/form:tracking-[0.7em]">
                        {title}
                    </h2>

                    <div className="absolute -bottom-2 left-0 h-0.5 w-0 bg-lime-400 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-focus-within/form:w-full shadow-[0_0_15px_rgba(163,230,53,0.8)]" />

                    <div className="absolute -bottom-2 left-0 h-0.5 w-full bg-lime-500/20 blur-sm opacity-0 group-focus-within/form:opacity-100 transition-opacity duration-1000" />
                </div>
            )}
            <div className="">
                {children}
            </div>
        </form>
    );
};