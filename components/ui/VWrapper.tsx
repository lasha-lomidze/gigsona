"use client";

import React, { ElementType, ComponentPropsWithoutRef, useState } from 'react';

type VWrapperProps<T extends ElementType> = {
    as?: T;
    variant?: 'regular' | 'dark';
    isSelected?: boolean;
    disableScaleAnimation?: boolean;
    disableStyleTransition?: boolean;
    enableDefaultAnimations?: boolean;
    className?: string;
    children?: React.ReactNode;
} & ComponentPropsWithoutRef<T>;

export const VWrapper = <T extends ElementType = 'button'>({
    as,
    variant = 'regular',
    isSelected = false,
    disableScaleAnimation = false,
    disableStyleTransition = false,
    enableDefaultAnimations = false,
    className = '',
    children,
    onMouseEnter,
    onMouseLeave,
    onMouseDown,
    onMouseUp,
    ...props
}: VWrapperProps<T>) => {
    const Component = as || 'div';

    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);

    const shouldScale = !disableScaleAnimation && enableDefaultAnimations;
    const shouldTransition = !disableStyleTransition && enableDefaultAnimations;

    // Core element resets
    const baseClasses = "font-inherit appearance-none text-center inline-flex items-center justify-center m-0 outline-none bg-transparent border font-normal tracking-[0.03em] backdrop-blur-[12px]";

    // Dynamic state conditional styles partitioned by variant
    const getDynamicClasses = () => {
        if (variant === 'dark') {
            if (isSelected) {
                return "bg-[linear-gradient(135deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.02)_100%)] border-[rgba(255,255,255,0.30)] text-[rgba(255,255,255,0.90)] shadow-[inset_0_1px_2px_rgba(255,255,255,0.15),0_8px_30px_rgba(0,0,0,0.7)]";
            }
            if (isHovered && enableDefaultAnimations) {
                return "bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_100%)] border-[rgba(255,255,255,0.2)] text-[rgba(255,255,255,0.85)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_8px_25px_rgba(0,0,0,0.6)]";
            }
            const idleBg = isHovered
                ? "bg-[linear-gradient(135deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.005)_100%)]"
                : "bg-[linear-gradient(135deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.015)_50%,rgba(255,255,255,0.005)_100%)]";
            return `${idleBg} border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.45)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_4px_15px_rgba(0,0,0,0.5)]`;
        }

        // Default 'regular' variant mapping
        if (isSelected) {
            return "bg-[linear-gradient(135deg,rgba(255,255,255,0.20)_0%,rgba(255,255,255,0.10)_50%,rgba(255,255,255,0.05)_100%)] border-[rgba(255,255,255,0.50)] text-white shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),0_8px_30px_rgba(0,0,0,0.6)]";
        }
        if (isHovered && enableDefaultAnimations) {
            return "bg-[linear-gradient(135deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.05)_100%)] border-[rgba(255,255,255,0.3)] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_8px_25px_rgba(0,0,0,0.5)]";
        }
        const idleBg = isHovered
            ? "bg-[linear-gradient(135deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0.01)_100%)]"
            : "bg-[linear-gradient(135deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0.03)_50%,rgba(255,255,255,0.01)_100%)]";
        return `${idleBg} border-[rgba(255,255,255,0.15)] text-[rgba(255,255,255,0.65)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_4px_15px_rgba(0,0,0,0.4)]`;
    };

    const transitionClass = shouldTransition ? "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]" : "transition-none";
    const scaleClass = (isPressed && shouldScale) ? "scale-[0.96]" : "scale-100";

    // Auto-strip logic so your className inputs don't build duplicate classes
    const hasCustomPadding = /\b(p|px|py|pt|pb|pl|pr)-\d+/.test(className);
    const hasCustomRadius = /\brounded\b|\brounded-\w+/.test(className);
    const hasCustomTextSize = /\btext-(xs|sm|base|lg|xl|\d+xl)/.test(className);
    const hasCustomCursor = /\bcursor-\w+/.test(className);

    const defaultPadding = hasCustomPadding ? "" : "py-2 px-5";
    const defaultRadius = hasCustomRadius ? "" : "rounded-[10px]";
    const defaultTextSize = hasCustomTextSize ? "" : "text-[13.5px]";
    const defaultCursor = hasCustomCursor ? "" : "";

    const layoutDefaults = `${defaultPadding} ${defaultRadius} ${defaultTextSize} ${defaultCursor}`.trim();
    const combinedClasses = `${baseClasses} ${layoutDefaults} ${getDynamicClasses()} ${transitionClass} ${scaleClass} ${className}`.trim();

    return (
        <Component
            className={combinedClasses}
            onMouseEnter={(e) => { setIsHovered(true); onMouseEnter?.(e); }}
            onMouseLeave={(e) => { setIsHovered(false); setIsPressed(false); onMouseLeave?.(e); }}
            onMouseDown={(e) => { if (shouldScale) setIsPressed(true); onMouseDown?.(e); }}
            onMouseUp={(e) => { setIsPressed(false); onMouseUp?.(e); }}
            {...props}
        >
            {children}
        </Component>
    );
};
