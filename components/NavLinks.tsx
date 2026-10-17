"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    PiClock,
    PiDiamondsFour,
    PiGear,
    PiLock,
    PiMagnifyingGlass,
    PiTable,
    PiUser,
} from "react-icons/pi";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import type { MessageKey } from "@/lib/i18n";
import { useT } from "@/lib/i18n/use-t";
import { transitions } from "./ui/motion";

type NavIconKey = "overview" | "history" | "search" | "manage" | "profile" | "admin" | "settings";

export type NavItem = {
    href: string;
    label: MessageKey;
    icon: NavIconKey;
};

const navIcons = {
    overview: PiDiamondsFour,
    history: PiClock,
    search: PiMagnifyingGlass,
    manage: PiTable,
    profile: PiUser,
    admin: PiLock,
    settings: PiGear,
};

export function NavLinks({ links, variant }: { links: NavItem[]; variant: "rail" | "dock" }) {
    const pathname = usePathname();
    const t = useT();

    return (
        <ul className={cn(
            variant === "rail" ? "flex w-full flex-col gap-1" : "flex h-16 w-full items-stretch px-1",
        )}>
            {links.map((link, index) => {
                const Icon = navIcons[link.icon];
                const active = link.href === "/"
                    ? pathname === "/"
                    : pathname === link.href || pathname.startsWith(`${link.href}/`);

                return (
                    <motion.li
                        key={link.href}
                        initial={{ opacity: 0, x: variant === "rail" ? -14 : 0, y: variant === "dock" ? 14 : 0 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        transition={{ ...transitions.smooth, duration: 0.5, delay: 0.15 + index * 0.07 }}
                        className={cn("relative", variant === "dock" ? "min-w-0 flex-1" : undefined)}
                    >
                        <Link
                            href={link.href}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                                "relative transition-colors duration-200",
                                variant === "rail"
                                    ? cn("nav-link", active ? "font-semibold text-accent" : "hover:text-ink")
                                    : cn(
                                        "flex h-full min-w-0 flex-col items-center justify-center gap-1 px-0.5 text-center text-[9px] capitalize leading-3 tracking-wide",
                                        active ? "font-semibold text-lime-200" : "text-muted hover:text-ink",
                                    ),
                            )}
                        >
                            {active && (
                                <motion.span
                                    layoutId={`nav-active-${variant}`}
                                    className={cn(
                                        "absolute inset-0 pointer-events-none",
                                        variant === "rail"
                                            ? "rounded-xl border border-accent/25 bg-accent/10 shadow-[0_0_16px_rgba(163,230,53,0.12)]"
                                            : "rounded-lg border-b-2 border-accent bg-accent/5",
                                    )}
                                    transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 32,
                                    }}
                                />
                            )}
                            <Icon size={variant === "rail" ? 20 : 18} className="relative z-10 transition-transform duration-150" />
                            <span className={cn("relative z-10", variant === "dock" ? "line-clamp-2 max-w-full break-words leading-3" : undefined)}>{t(link.label)}</span>
                        </Link>
                    </motion.li>
                );
            })}
        </ul>
    );
}
