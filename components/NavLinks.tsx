"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
    PiClock,
    PiDiamondsFour,
    PiDotsThreeOutline,
    PiGear,
    PiLock,
    PiMagnifyingGlass,
    PiTable,
    PiTrophy,
    PiUser,
    PiX,
} from "react-icons/pi";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";
import type { MessageKey } from "@/lib/i18n";
import { useT } from "@/lib/i18n/use-t";
import { AuthDock } from "./AuthDock";
import { transitions } from "./ui/motion";

type NavIconKey = "overview" | "leaderboard" | "history" | "search" | "manage" | "profile" | "admin" | "settings";

export type NavItem = {
    href: string;
    label: MessageKey;
    icon: NavIconKey;
    description?: MessageKey;
};

const navIcons = {
    overview: PiDiamondsFour,
    leaderboard: PiTrophy,
    history: PiClock,
    search: PiMagnifyingGlass,
    manage: PiTable,
    profile: PiUser,
    admin: PiLock,
    settings: PiGear,
};

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

function isLinkActive(href: string, pathname: string) {
    return href === "/"
        ? pathname === "/"
        : pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({ links, variant }: { links: NavItem[]; variant: "rail" | "dock" }) {
    const pathname = usePathname();
    const t = useT();
    const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    const [moreOpen, setMoreOpen] = useState(false);

    const shouldFold = variant === "dock" && links.length > 5;
    const primaryLinks = shouldFold ? links.slice(0, 4) : links;
    const moreLinks = shouldFold ? links.slice(4) : [];
    const isMoreActive = shouldFold && moreLinks.some((l) => isLinkActive(l.href, pathname));

    const [prevPathname, setPrevPathname] = useState(pathname);
    if (prevPathname !== pathname) {
        setPrevPathname(pathname);
        if (moreOpen) {
            setMoreOpen(false);
        }
    }

    useEffect(() => {
        if (!moreOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setMoreOpen(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [moreOpen]);

    useEffect(() => {
        if (!moreOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [moreOpen]);

    return (
        <>
            <ul className={cn(
                variant === "rail" ? "flex w-full flex-col gap-1" : "flex h-16 w-full items-stretch px-1",
            )}>
                {primaryLinks.map((link, index) => {
                    const Icon = navIcons[link.icon];
                    const active = isLinkActive(link.href, pathname);

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
                                            "flex h-full min-w-0 flex-col items-center justify-center gap-1 px-0.5 text-center text-[10px] capitalize leading-3 tracking-wide",
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
                                <Icon size={20} className="relative z-10 transition-transform duration-150" />
                                <span className={cn("relative z-10", variant === "dock" ? "truncate max-w-full leading-3" : undefined)}>
                                    {t(link.label)}
                                </span>
                            </Link>
                        </motion.li>
                    );
                })}

                {shouldFold && (
                    <motion.li
                        key="nav-more"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...transitions.smooth, duration: 0.5, delay: 0.15 + primaryLinks.length * 0.07 }}
                        className="relative min-w-0 flex-1"
                    >
                        <button
                            type="button"
                            onClick={() => setMoreOpen((open) => !open)}
                            aria-expanded={moreOpen}
                            aria-haspopup="dialog"
                            aria-controls="mobile-nav-sheet"
                            className={cn(
                                "relative flex h-full w-full min-w-0 flex-col items-center justify-center gap-1 px-0.5 text-center text-[10px] capitalize leading-3 tracking-wide transition-colors duration-200",
                                isMoreActive || moreOpen ? "font-semibold text-lime-200" : "text-muted hover:text-ink",
                            )}
                        >
                            {(isMoreActive || moreOpen) && (
                                <motion.span
                                    layoutId={`nav-active-${variant}`}
                                    className="pointer-events-none absolute inset-0 rounded-lg border-b-2 border-accent bg-accent/5"
                                    transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 32,
                                    }}
                                />
                            )}
                            <div className="relative z-10 flex items-center justify-center">
                                <PiDotsThreeOutline size={20} className="transition-transform duration-150" />
                                {isMoreActive && (
                                    <span className="absolute -top-0.5 -right-1 h-1.5 w-1.5 rounded-full bg-accent ring-2 ring-canvas" />
                                )}
                            </div>
                            <span className="relative z-10 truncate max-w-full leading-3">
                                {t("shell.nav.more")}
                            </span>
                        </button>
                    </motion.li>
                )}
            </ul>

            {mounted && createPortal(
                <AnimatePresence>
                    {moreOpen && (
                        <>
                            <motion.div
                                key="mobile-nav-backdrop"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                onClick={() => setMoreOpen(false)}
                                className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm md:hidden"
                                aria-hidden="true"
                            />
                            <motion.div
                                key="mobile-nav-sheet"
                                role="dialog"
                                id="mobile-nav-sheet"
                                aria-modal="true"
                                aria-label={t("shell.nav.moreAriaLabel")}
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{ type: "spring", damping: 30, stiffness: 350 }}
                                className="fixed inset-x-0 bottom-0 z-100 flex max-h-[85vh] flex-col rounded-t-3xl border-t border-line bg-canvas px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl md:hidden"
                            >
                                <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-line" />
                                <div className="flex items-center justify-between pb-3 border-b border-line">
                                    <span className="text-base font-semibold text-ink">{t("shell.nav.moreTitle")}</span>
                                    <button
                                        type="button"
                                        onClick={() => setMoreOpen(false)}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted hover:text-ink active:scale-95 transition-transform"
                                        aria-label={t("shell.nav.close")}
                                    >
                                        <PiX size={18} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto py-3 space-y-2">
                                    {moreLinks.map((link) => {
                                        const Icon = navIcons[link.icon];
                                        const active = isLinkActive(link.href, pathname);

                                        return (
                                            <Link
                                                key={link.href}
                                                href={link.href}
                                                onClick={() => setMoreOpen(false)}
                                                aria-current={active ? "page" : undefined}
                                                className={cn(
                                                    "flex items-center gap-3.5 rounded-2xl border p-3 transition-colors",
                                                    active
                                                        ? "border-accent/40 bg-accent/10 text-accent font-semibold shadow-[0_0_16px_rgba(163,230,53,0.08)]"
                                                        : "border-line/60 bg-canvas-subtle/50 text-ink hover:border-line hover:bg-canvas-subtle",
                                                )}
                                            >
                                                <div className={cn(
                                                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors",
                                                    active ? "bg-accent text-canvas" : "border border-line bg-canvas text-muted",
                                                )}>
                                                    <Icon size={20} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm capitalize font-medium">
                                                        {t(link.label)}
                                                    </div>
                                                    {link.description && (
                                                        <p className="truncate text-xs text-muted font-normal">
                                                            {t(link.description)}
                                                        </p>
                                                    )}
                                                </div>
                                                {active && (
                                                    <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>

                                <div
                                    className="pt-3 border-t border-line"
                                    onClick={(e) => {
                                        const target = e.target as HTMLElement;
                                        if (target.closest("button")) {
                                            setMoreOpen(false);
                                        }
                                    }}
                                >
                                    <AuthDock />
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
