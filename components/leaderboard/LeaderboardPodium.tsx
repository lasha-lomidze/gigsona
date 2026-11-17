"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { getAvatarById } from "@/lib/avatars";
import { useT } from "@/lib/i18n/use-t";
import type { LeaderboardStudent } from "@/lib/leaderboard-shared";
import { FiCalendar, FiExternalLink, FiUsers } from "react-icons/fi";
import { PiCrown, PiMedal, PiTrophy } from "react-icons/pi";

interface LeaderboardPodiumProps {
    students: LeaderboardStudent[];
    currentProfileId?: number | null;
    isGlobal: boolean;
    isCurrentMonth: boolean;
    returnToUrl: string;
}

const initialsFor = (name: string) =>
    name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";

export function LeaderboardPodium({ students, currentProfileId, isGlobal, isCurrentMonth, returnToUrl }: LeaderboardPodiumProps) {
    const t = useT();
    const prefersReducedMotion = useReducedMotion();

    if (students.length === 0) return null;

    const first = students[0];
    const second = students[1];
    const third = students[2];

    const podiumConfigs = [
        {
            student: second,
            place: 2,
            titleKey: "leaderboard.podium.runnerUp" as const,
            Icon: PiMedal,
            order: "order-1",
            size: "min-h-[228px] sm:min-h-[248px] xl:min-h-[270px]",
            cardStyle: "border-sky-300/40 bg-linear-to-b from-sky-300/20 via-surface/95 to-surface/70 shadow-[0_18px_48px_rgba(56,189,248,0.12)]",
            badgeStyle: "border-sky-300/50 bg-sky-300/20 text-sky-200",
            iconColor: "text-sky-300",
            auraStyle: "text-sky-200",
            haloStyle: "bg-sky-300/20",
            edgeStyle: "bg-linear-to-r from-transparent via-sky-200/70 to-transparent",
            avatarSize: "size-12 sm:size-14 xl:size-16",
            delay: 0.12,
        },
        {
            student: first,
            place: 1,
            titleKey: "leaderboard.podium.champion" as const,
            Icon: PiCrown,
            order: "order-2 -translate-y-3 sm:-translate-y-5",
            size: "min-h-[252px] sm:min-h-[274px] xl:min-h-[300px]",
            cardStyle: "border-accent/70 bg-linear-to-b from-accent/25 via-surface/95 to-surface/70 shadow-[0_24px_64px_rgba(163,230,53,0.2)] ring-1 ring-accent/30",
            badgeStyle: "border-accent/60 bg-accent/25 text-lime-100 shadow-[0_0_16px_rgba(163,230,53,0.28)]",
            iconColor: "text-accent",
            auraStyle: "text-lime-200",
            haloStyle: "bg-accent/30",
            edgeStyle: "bg-linear-to-r from-transparent via-accent to-transparent",
            avatarSize: "size-14 sm:size-16 xl:size-20",
            delay: 0,
        },
        {
            student: third,
            place: 3,
            titleKey: "leaderboard.podium.bronze" as const,
            Icon: PiTrophy,
            order: "order-3",
            size: "min-h-[228px] sm:min-h-[248px] xl:min-h-[270px]",
            cardStyle: "border-amber-300/40 bg-linear-to-b from-amber-300/20 via-surface/95 to-surface/70 shadow-[0_18px_48px_rgba(251,191,36,0.12)]",
            badgeStyle: "border-amber-300/50 bg-amber-300/20 text-amber-200",
            iconColor: "text-amber-300",
            auraStyle: "text-amber-200",
            haloStyle: "bg-amber-300/20",
            edgeStyle: "bg-linear-to-r from-transparent via-amber-200/70 to-transparent",
            avatarSize: "size-12 sm:size-14 xl:size-16",
            delay: 0.24,
        },
    ];

    return (
        <div className="relative isolate pt-3 sm:pt-5">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-[12%] bottom-0 h-20 rounded-full bg-accent/10 blur-3xl"
            />
            <div className="relative grid grid-cols-3 items-end gap-2 sm:gap-4 xl:gap-5">
                {podiumConfigs.map((config) => {
                    if (!config.student) return null;
                    const student = config.student;
                    const avatar = getAvatarById(student.avatarId);
                    const isYou = currentProfileId !== undefined && currentProfileId === student.profileId;
                    const rankToDisplay = isGlobal ? student.globalRank : student.groupRank;
                    const IconComponent = config.Icon;

                    return (
                        <motion.div
                            key={`podium-slot-${config.place}`}
                            initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.48,
                                ease: [0.22, 1, 0.36, 1],
                                delay: config.delay,
                            }}
                            whileHover={prefersReducedMotion ? undefined : { y: -3, scale: 1.012 }}
                            className={`group relative z-10 flex min-w-0 flex-col items-center overflow-hidden rounded-2xl border p-2 text-center backdrop-blur-sm transition-shadow duration-300 sm:rounded-3xl sm:p-3 lg:p-4 ${config.order} ${config.size} ${config.cardStyle}`}
                        >
                            <div
                                aria-hidden="true"
                                className={`pointer-events-none absolute -top-12 left-1/2 size-36 -translate-x-1/2 rounded-full blur-3xl ${config.haloStyle}`}
                            />
                            <div
                                aria-hidden="true"
                                className={`pointer-events-none absolute inset-x-5 top-0 h-px ${config.edgeStyle}`}
                            />
                            <span
                                aria-hidden="true"
                                className="pointer-events-none absolute right-2 top-8 font-mono text-5xl font-black leading-none tracking-tighter text-white/4.5 sm:right-3 sm:top-10 sm:text-6xl"
                            >
                                0{config.place}
                            </span>

                            <div className="relative z-10 flex w-full min-w-0 flex-1 flex-col items-center">
                                <span className={`inline-flex max-w-full items-center justify-center gap-1 rounded-full border px-1.5 py-1 text-[9px] font-semibold leading-tight sm:gap-1.5 sm:px-2.5 sm:text-[10px] ${config.badgeStyle}`}>
                                    <IconComponent aria-hidden="true" className={`size-3.5 shrink-0 sm:size-4 ${config.iconColor}`} />
                                    <span className="min-w-0 wrap-break-word">{t(config.titleKey)}</span>
                                </span>

                                <div className="relative mt-3 sm:mt-4">
                                    {config.place === 1 && (
                                        <motion.span
                                            aria-hidden="true"
                                            initial={false}
                                            animate={prefersReducedMotion ? undefined : { rotate: 360 }}
                                            transition={{ duration: 18, ease: "linear", repeat: Infinity }}
                                            className="absolute -inset-2 rounded-full border border-dashed border-accent/45"
                                        />
                                    )}
                                    <div className={`relative overflow-hidden rounded-full border-2 border-white/10 bg-surface shadow-[0_8px_24px_rgba(0,0,0,0.3)] ${config.avatarSize}`}>
                                        {avatar ? (
                                            <Image
                                                src={avatar.src}
                                                alt={avatar.label}
                                                width={80}
                                                height={80}
                                                className="size-full object-cover"
                                                unoptimized
                                                priority
                                            />
                                        ) : (
                                            <div className="grid size-full place-items-center bg-surface-2 text-base font-bold tracking-wider text-ink sm:text-lg">
                                                {initialsFor(student.displayName)}
                                            </div>
                                        )}
                                    </div>
                                    <span className={`absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full border-2 border-canvas bg-surface font-mono text-[10px] font-bold ${config.iconColor}`}>
                                        #{rankToDisplay}
                                    </span>
                                </div>

                                <Link
                                    href={`/profile/${student.profileId}?returnTo=${encodeURIComponent(returnToUrl)}`}
                                    className="mt-2 inline-flex max-w-full flex-wrap items-center justify-center gap-1 wrap-break-word text-xs font-bold leading-tight text-ink transition-colors hover:text-accent sm:mt-3 sm:text-sm xl:text-base"
                                >
                                    <span>{student.displayName}</span>
                                    <FiExternalLink aria-hidden="true" className="size-3 shrink-0 text-faint" />
                                </Link>

                                {isYou && (
                                    <span className="mt-1 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-lime-200">
                                        {t("leaderboard.table.you")}
                                    </span>
                                )}

                                <div className="mt-2 flex w-full min-w-0 flex-col items-center gap-1 text-[9px] leading-tight text-faint sm:mt-3 sm:text-[10px]">
                                    {student.groupName && (
                                        <span className="inline-flex max-w-full flex-wrap items-center justify-center gap-1 wrap-break-word">
                                            <FiUsers aria-hidden="true" className="size-3 shrink-0 text-muted" />
                                            <span>{student.groupName}</span>
                                        </span>
                                    )}
                                    <span className="inline-flex max-w-full flex-wrap items-center justify-center gap-1">
                                        <FiCalendar aria-hidden="true" className="size-3 shrink-0 text-muted" />
                                        <span>{t("leaderboard.daysCount", { count: student.activeDays })}</span>
                                    </span>
                                </div>

                                <div className="mt-auto w-full border-t border-line/60 pt-2 sm:pt-3">
                                    <span className="block text-[9px] font-medium uppercase tracking-wider text-faint sm:text-[10px]">
                                        {t(isCurrentMonth ? "leaderboard.table.monthAura" : "leaderboard.table.totalAura")}
                                    </span>
                                    <span className={`mt-0.5 inline-flex items-baseline gap-1 font-mono text-xl font-bold tracking-tight tabular-nums sm:text-2xl xl:text-3xl ${config.auraStyle}`}>
                                        {student.totalAura}
                                        <span className="text-[9px] font-medium uppercase tracking-normal text-faint sm:text-[10px]">pts</span>
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
