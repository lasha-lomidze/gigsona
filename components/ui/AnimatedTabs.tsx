"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";

export interface AnimatedTabItem {
    id: string | number;
    label: string;
    href: string;
    active: boolean;
}

interface AnimatedTabsProps {
    items: AnimatedTabItem[];
    layoutId: string;
    ariaLabel?: string;
    className?: string;
    itemClassName?: string;
    pill?: boolean;
}

export function AnimatedTabs({
    items,
    layoutId,
    ariaLabel,
    className,
    itemClassName,
    pill = false,
}: AnimatedTabsProps) {
    return (
        <div
            role="tablist"
            aria-label={ariaLabel}
            className={cn("flex flex-wrap items-center gap-2", className)}
        >
            {items.map((item) => (
                <Link
                    key={item.id}
                    href={item.href}
                    aria-current={item.active ? "page" : undefined}
                    className={cn(
                        "relative inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-medium transition-colors duration-200 select-none",
                        pill ? "rounded-full" : "rounded-lg",
                        item.active
                            ? "font-semibold text-lime-800 dark:text-lime-200"
                            : "text-muted hover:text-ink",
                        itemClassName,
                    )}
                >
                    {item.active ? (
                        <motion.span
                            layoutId={layoutId}
                            className={cn(
                                "absolute inset-0 border border-accent/70 bg-accent/15 dark:border-accent/60 dark:bg-accent/15 pointer-events-none",
                                pill ? "rounded-full" : "rounded-lg",
                            )}
                            transition={{
                                type: "spring",
                                stiffness: 450,
                                damping: 32,
                            }}
                        />
                    ) : (
                        <span className={cn(
                            "absolute inset-0 border border-line transition-colors duration-150 hover:border-neutral-500 pointer-events-none",
                            pill ? "rounded-full" : "rounded-lg",
                        )} />
                    )}
                    <span className="relative z-10">{item.label}</span>
                </Link>
            ))}
        </div>
    );
}
