"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/cn";
import { transitions } from "@/components/ui/motion";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "icon";

type ButtonProps = HTMLMotionProps<"button"> & {
    variant?: Variant;
    size?: Size;
};

export function Button({
    variant = "secondary",
    size = "md",
    className,
    type = "button",
    disabled,
    ...props
}: ButtonProps) {
    return (
        <motion.button
            type={type}
            disabled={disabled}
            whileTap={disabled ? undefined : { scale: 0.98 }}
            transition={transitions.microTap}
            className={cn(
                "btn select-none",
                variant === "primary" && "btn-primary",
                variant === "secondary" && "btn-secondary",
                variant === "ghost" && "btn-ghost",
                variant === "danger" && "btn-danger",
                size === "sm" && "btn-sm",
                size === "icon" && "btn-icon",
                className,
            )}
            {...props}
        />
    );
}
