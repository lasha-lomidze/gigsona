'use client'

import React from 'react';
import { useT } from "@/lib/i18n/use-t";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}


export const Input = ({ label, className, type, ...props }: InputProps) => {
    const t = useT();

    const config = {
        email: {
            autoComplete: 'email',
            placeholder: t("shell.input.emailPlaceholder"),
        },
        password: {
            autoComplete: 'current-password',
            placeholder: t("shell.input.passwordPlaceholder"),
        },
    }

    const typeProps = config[type as keyof typeof config] || {};
    const isControlled = Object.prototype.hasOwnProperty.call(props, 'value');

    return (
        <div className="w-full max-w-md group">
            {label && (
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-[0.3em] mb-0.5 ml-0.5 transition-[color,transform] duration-200 group-focus-within:text-ink group-focus-within:translate-x-1">
                    {label}
                </label>
            )}

            <div className="relative">
                <input
                    type={type}
                    {...props}
                    {...typeProps}
                    {...(isControlled ? { value: props.value ?? '' } : {})}

                    className={`
                        w-full text-ink text-lg px-0 py-2
                        border-b border-gray-800 outline-none
                        transition-[border-color,color] duration-200
                        placeholder:text-gray-700
                        caret-lime-600
                        peer
                        ${className || ''}
                    `}
                />

                {/* Design strictly preserved */}
                <div className="absolute bottom-0 left-0 h-0.5 w-full bg-lime-600 scale-x-0 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] origin-left peer-focus:scale-x-100" />
            </div>
        </div>
    );
};