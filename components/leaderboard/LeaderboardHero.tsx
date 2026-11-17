"use client";

import { motion } from "motion/react";
import { useT } from "@/lib/i18n/use-t";
import { FiAward, FiCompass, FiTrendingUp } from "react-icons/fi";

interface LeaderboardHeroProps {
    totalStudents: number;
    totalGroups: number;
    topAura: number;
}

export function LeaderboardHero({ totalStudents, totalGroups, topAura }: LeaderboardHeroProps) {
    const t = useT();

    return (
        <section className="relative isolate overflow-hidden rounded-3xl border border-line bg-surface/80 shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
            {/* Ambient background glow inspired by 404 page */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-20 -top-24 -z-10 size-80 rounded-full bg-accent/12 blur-3xl"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-20 -bottom-24 -z-10 size-72 rounded-full bg-teal-400/10 blur-3xl"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,rgba(163,230,53,0.08),transparent_60%)]"
            />

            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]">
                {/* Content side */}
                <div className="flex flex-col justify-center p-6 sm:p-8 md:p-10">
                    <p className="eyebrow flex items-center gap-2">
                        <span className="size-2 rounded-full bg-accent animate-pulse shadow-[0_0_10px_rgba(163,230,53,0.8)]" />
                        {t("leaderboard.hero.eyebrow")}
                    </p>

                    <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
                        {t("leaderboard.hero.title")}{" "}
                        <span className="text-accent underline decoration-accent/30 underline-offset-8">
                            {t("leaderboard.hero.titleAccent")}
                        </span>
                    </h1>

                    <p className="mt-3 max-w-lg text-sm leading-6 text-muted sm:text-base">
                        {t("leaderboard.hero.description")}
                    </p>

                    {/* Metric chips */}
                    <div className="mt-6 flex flex-wrap items-center gap-2.5 sm:gap-3">
                        <div className="flex items-center gap-2 rounded-xl border border-line bg-canvas/60 px-3.5 py-2 backdrop-blur-xs">
                            <span className="grid size-7 place-items-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
                                <FiTrendingUp className="size-3.5" />
                            </span>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-faint">
                                    {t("leaderboard.stat.topAura")}
                                </p>
                                <p className="font-mono text-sm font-semibold text-lime-200">
                                    {topAura} <span className="text-[10px] text-faint uppercase font-sans">pts</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 rounded-xl border border-line bg-canvas/60 px-3.5 py-2 backdrop-blur-xs">
                            <span className="grid size-7 place-items-center rounded-lg border border-sky-400/30 bg-sky-400/10 text-sky-300">
                                <FiAward className="size-3.5" />
                            </span>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-faint">
                                    {t("leaderboard.stat.students")}
                                </p>
                                <p className="font-mono text-sm font-semibold text-ink">
                                    {totalStudents}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 rounded-xl border border-line bg-canvas/60 px-3.5 py-2 backdrop-blur-xs">
                            <span className="grid size-7 place-items-center rounded-lg border border-violet-400/30 bg-violet-400/10 text-violet-300">
                                <FiCompass className="size-3.5" />
                            </span>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-faint">
                                    {t("leaderboard.stat.cohorts")}
                                </p>
                                <p className="font-mono text-sm font-semibold text-ink">
                                    {totalGroups}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Illustration side (inspired by 404 mascot & rulebook) */}
                <div
                    aria-hidden="true"
                    className="relative flex min-h-60 items-center justify-center overflow-hidden border-t border-line bg-canvas/40 px-6 py-8 lg:min-h-full lg:border-t-0 lg:border-l"
                >
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(163,230,53,0.1),transparent_70%)]" />

                    {/* Corner decorative lights */}
                    <span className="absolute top-4 right-5 font-mono text-[10px] tracking-[0.28em] uppercase text-faint/60">
                        {t("leaderboard.hero.badge")}
                    </span>
                    <span className="absolute bottom-5 left-6 size-2 rounded-full bg-accent/80 shadow-[0_0_8px_rgba(163,230,53,0.8)]" />
                    <span className="absolute top-8 left-10 size-1.5 rounded-full bg-teal-300/70" />
                    <span className="absolute bottom-8 right-8 size-1.5 rounded-full bg-violet-400/60" />

                    <div className="relative flex flex-col items-center">
                        {/* 404-style speech callout bubble */}
                        <motion.div
                            initial={{ opacity: 0, y: -8, rotate: -4 }}
                            animate={{ opacity: 1, y: 0, rotate: -6 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="absolute -top-3 -right-6 z-10 rounded-2xl border border-accent/30 bg-surface px-3 py-1.5 text-[11px] font-medium text-lime-200 shadow-[0_8px_20px_rgba(0,0,0,0.4)]"
                        >
                            {t("leaderboard.hero.bubble")}
                            <span className="absolute -bottom-1.5 left-4 size-3 rotate-45 border-b border-r border-accent/30 bg-surface" />
                        </motion.div>

                        {/* Geometric Aura Crest / Trophy vector artwork in 404 style */}
                        <svg
                            viewBox="0 0 160 160"
                            fill="none"
                            className="size-36 sm:size-44 drop-shadow-[0_0_24px_rgba(163,230,53,0.25)]"
                        >
                            {/* Outer orbital halo */}
                            <ellipse
                                cx="80"
                                cy="80"
                                rx="68"
                                ry="28"
                                stroke="#A3E635"
                                strokeOpacity="0.25"
                                strokeWidth="1.5"
                                strokeDasharray="4 4"
                                transform="rotate(-15 80 80)"
                            />

                            {/* Base pedestal */}
                            <path
                                d="M48 128 L112 128 L104 140 L56 140 Z"
                                fill="#172414"
                                stroke="#A3E635"
                                strokeWidth="2"
                            />
                            <line x1="56" y1="134" x2="104" y2="134" stroke="#D9F99D" strokeWidth="1.5" strokeOpacity="0.6" />

                            {/* Trophy stem */}
                            <path
                                d="M74 104 L86 104 L84 128 L76 128 Z"
                                fill="#172414"
                                stroke="#A3E635"
                                strokeWidth="2"
                            />

                            {/* Main Trophy Chalice / Crystal body */}
                            <path
                                d="M44 48 L116 48 L102 104 L58 104 Z"
                                fill="#172414"
                                stroke="#A3E635"
                                strokeWidth="2.5"
                            />

                            {/* Inner glowing faceted gem */}
                            <polygon
                                points="80,56 98,78 80,98 62,78"
                                fill="#D9F99D"
                                fillOpacity="0.18"
                                stroke="#A3E635"
                                strokeWidth="1.5"
                            />
                            <circle cx="80" cy="78" r="5" fill="#D9F99D" />

                            {/* Chalice handles */}
                            <path
                                d="M44 54 C30 54 26 76 46 82"
                                stroke="#5EEAD4"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                            />
                            <path
                                d="M116 54 C130 54 134 76 114 82"
                                stroke="#5EEAD4"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                            />

                            {/* Crown crest top */}
                            <path
                                d="M52 48 L62 26 L80 38 L98 26 L108 48 Z"
                                fill="#172414"
                                stroke="#A3E635"
                                strokeWidth="2"
                                strokeLinejoin="round"
                            />
                            <circle cx="62" cy="24" r="3" fill="#D9F99D" />
                            <circle cx="80" cy="36" r="3" fill="#A3E635" />
                            <circle cx="98" cy="24" r="3" fill="#D9F99D" />

                            {/* Sparkles */}
                            <path d="M30 38 L32 30 L40 28 L32 26 L30 18 L28 26 L20 28 L28 30 Z" fill="#5EEAD4" />
                            <path d="M132 108 L134 102 L140 100 L134 98 L132 92 L130 98 L124 100 L130 102 Z" fill="#D9F99D" />
                        </svg>

                        <span className="mt-3 font-mono text-[9px] uppercase tracking-[0.28em] text-faint">
                            Gigsona · Apex
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
