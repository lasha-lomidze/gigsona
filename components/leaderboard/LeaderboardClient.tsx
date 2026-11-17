"use client";

import { useId, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { getAvatarById } from "@/lib/avatars";
import { useT } from "@/lib/i18n/use-t";
import type { LeaderboardData } from "@/lib/leaderboard-shared";
import { LeaderboardHero } from "./LeaderboardHero";
import { LeaderboardPodium } from "./LeaderboardPodium";
import {
    FiCalendar,
    FiChevronLeft,
    FiChevronRight,
    FiFilter,
    FiSearch,
    FiTarget,
    FiTrendingUp,
    FiX,
} from "react-icons/fi";
import { PiSparkle } from "react-icons/pi";

interface LeaderboardClientProps {
    initialData: LeaderboardData;
    defaultTab: string;
    currentProfile: {
        id: number;
        displayName?: string | null;
        role: string;
        studentGroupId: number | null;
    } | null;
}

const initialsFor = (name: string) =>
    name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";

const PAGE_SIZE = 20;

type ScorePeriod = "all-time" | "month";

export function LeaderboardClient({ initialData, defaultTab, currentProfile }: LeaderboardClientProps) {
    const t = useT();
    const searchInputId = useId();

    const [activeTab, setActiveTab] = useState<string>(defaultTab);
    const [scorePeriod, setScorePeriod] = useState<ScorePeriod>("all-time");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [highlightedProfileId, setHighlightedProfileId] = useState<number | null>(null);

    const isGlobal = activeTab === "global";
    const selectedGroupId = isGlobal ? null : Number(activeTab);
    const isCurrentMonth = scorePeriod === "month";

    const periodStudents = useMemo(() => {
        if (!isCurrentMonth) return initialData.students;

        const monthStudents = initialData.students
            .map((student) => ({
                ...student,
                totalAura: student.monthAura,
                activeDays: student.monthActiveDays,
            }))
            .sort((a, b) =>
                b.totalAura - a.totalAura
                || b.activeDays - a.activeDays
                || a.studentId - b.studentId,
            );
        const groupRanks = new Map<number, number>();

        return monthStudents.map((student, index) => {
            let groupRank = 1;
            if (student.groupId !== null) {
                groupRank = (groupRanks.get(student.groupId) ?? 0) + 1;
                groupRanks.set(student.groupId, groupRank);
            }
            return { ...student, globalRank: index + 1, groupRank };
        });
    }, [initialData.students, isCurrentMonth]);

    // Filter students by selected tab (Global vs specific Group)
    const scopeStudents = useMemo(() => {
        if (isGlobal) {
            return periodStudents;
        }
        return periodStudents
            .filter((s) => s.groupId === selectedGroupId)
            .map((s, index) => ({
                ...s,
                groupRank: index + 1,
            }));
    }, [periodStudents, isGlobal, selectedGroupId]);

    // Apply search query filter
    const filteredStudents = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return scopeStudents;
        return scopeStudents.filter((s) => {
            const name = s.displayName.toLowerCase();
            const group = s.groupName?.toLowerCase() ?? "";
            return name.includes(query) || group.includes(query);
        });
    }, [scopeStudents, searchQuery]);

    // Top 3 champions for the active scope
    const topThree = scopeStudents.slice(0, 3);
    const periodTopAura = periodStudents[0]?.totalAura ?? 0;

    const returnToUrl = isGlobal ? "/leaderboard" : `/leaderboard?tab=${activeTab}`;

    // Pagination calculation
    const totalCount = filteredStudents.length;
    const isPaginated = totalCount > PAGE_SIZE;
    const totalPages = isPaginated ? Math.ceil(totalCount / PAGE_SIZE) : 1;
    const safePage = Math.min(Math.max(1, currentPage), totalPages);

    const paginatedStudents = useMemo(() => {
        const startIndex = (safePage - 1) * PAGE_SIZE;
        return filteredStudents.slice(startIndex, startIndex + PAGE_SIZE);
    }, [filteredStudents, safePage]);

    // Current user's standing in current scope
    const currentUserStanding = useMemo(() => {
        if (!currentProfile) return null;
        const index = scopeStudents.findIndex((s) => s.profileId === currentProfile.id);
        if (index === -1) return null;
        const student = scopeStudents[index];
        const rank = isGlobal ? student.globalRank : student.groupRank;
        const targetPage = Math.ceil((index + 1) / PAGE_SIZE);
        return {
            student,
            rank,
            index,
            targetPage,
        };
    }, [currentProfile, scopeStudents, isGlobal]);

    // Switch tab handler
    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId);
        setCurrentPage(1);
        setSearchQuery("");
    };

    // Jump to current user's row
    const handleJumpToMyRank = () => {
        if (!currentUserStanding) return;
        if (currentUserStanding.targetPage !== safePage) {
            setCurrentPage(currentUserStanding.targetPage);
        }
        setHighlightedProfileId(currentUserStanding.student.profileId);

        setTimeout(() => {
            const el = document.getElementById(`student-row-${currentUserStanding.student.profileId}`);
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }, 80);

        setTimeout(() => {
            setHighlightedProfileId(null);
        }, 3500);
    };

    const startItem = totalCount === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
    const endItem = Math.min(safePage * PAGE_SIZE, totalCount);

    return (
        <div className="flex flex-col gap-8 pb-16">
            {/* 404 & Rulebook inspired Hero banner */}
            <LeaderboardHero
                totalStudents={initialData.totalStudents}
                totalGroups={initialData.totalGroups}
                topAura={periodTopAura}
            />

            {/* Leaderboard Switches (Global and per Group) */}
            <div className="flex flex-col gap-3">
                <div
                    role="tablist"
                    aria-label="Leaderboard scope"
                    className="flex w-full min-w-0 flex-nowrap items-center gap-2 overflow-x-auto scrollbar-none pb-1"
                >
                    {/* Global Switch */}
                    <button
                        type="button"
                        role="tab"
                        aria-selected={isGlobal}
                        onClick={() => handleTabChange("global")}
                        className={`relative inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition-all select-none ${isGlobal
                            ? "font-semibold text-lime-900 dark:text-lime-200"
                            : "text-muted hover:text-ink"
                            }`}
                    >
                        {isGlobal ? (
                            <motion.span
                                layoutId="leaderboard-active-tab-indicator"
                                className="absolute inset-0 rounded-xl border border-accent/70 bg-accent/15 dark:border-accent/60 dark:bg-accent/15 pointer-events-none shadow-[0_0_16px_rgba(163,230,53,0.15)]"
                                transition={{
                                    type: "spring",
                                    stiffness: 450,
                                    damping: 32,
                                }}
                            />
                        ) : (
                            <span className="absolute inset-0 rounded-xl border border-line transition-colors hover:border-neutral-500 pointer-events-none" />
                        )}
                        <span className="relative z-10 flex items-center gap-1.5">
                            <FiTrendingUp className={`size-3.5 ${isGlobal ? "text-accent" : "text-faint"}`} />
                            {t("leaderboard.tab.global")}
                        </span>
                        <span
                            className={`relative z-10 rounded-full px-2 py-0.5 font-mono text-[10px] ${isGlobal
                                ? "bg-accent/30 text-lime-100"
                                : "bg-surface-2 text-faint"
                                }`}
                        >
                            {initialData.totalStudents}
                        </span>
                    </button>

                    {/* Per-Group Switches */}
                    {initialData.groups.map((group) => {
                        const groupIdStr = String(group.id);
                        const isSelected = activeTab === groupIdStr;
                        const isStudentCohort = currentProfile?.studentGroupId === group.id;

                        return (
                            <button
                                key={group.id}
                                type="button"
                                role="tab"
                                aria-selected={isSelected}
                                onClick={() => handleTabChange(groupIdStr)}
                                className={`relative inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition-all select-none ${isSelected
                                    ? "font-semibold text-lime-900 dark:text-lime-200"
                                    : "text-muted hover:text-ink"
                                    }`}
                            >
                                {isSelected ? (
                                    <motion.span
                                        layoutId="leaderboard-active-tab-indicator"
                                        className="absolute inset-0 rounded-xl border border-accent/70 bg-accent/15 dark:border-accent/60 dark:bg-accent/15 pointer-events-none shadow-[0_0_16px_rgba(163,230,53,0.15)]"
                                        transition={{
                                            type: "spring",
                                            stiffness: 450,
                                            damping: 32,
                                        }}
                                    />
                                ) : (
                                    <span className="absolute inset-0 rounded-xl border border-line transition-colors hover:border-neutral-500 pointer-events-none" />
                                )}
                                <span className="relative z-10 flex items-center gap-1.5">
                                    {group.name}
                                    {isStudentCohort && (
                                        <span
                                            title={t("leaderboard.tab.yourGroup")}
                                            className="grid size-4 place-items-center rounded-full bg-accent/25 text-[9px] font-bold text-accent"
                                        >
                                            ★
                                        </span>
                                    )}
                                </span>
                                <span
                                    className={`relative z-10 rounded-full px-2 py-0.5 font-mono text-[10px] ${isSelected
                                        ? "bg-accent/30 text-lime-100"
                                        : "bg-surface-2 text-faint"
                                        }`}
                                >
                                    {group.studentCount}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Top 3 Podium Cards */}
            {scopeStudents.length > 0 && (
                <div className="pt-2">
                    <LeaderboardPodium
                        students={topThree}
                        currentProfileId={currentProfile?.id}
                        isGlobal={isGlobal}
                        isCurrentMonth={isCurrentMonth}
                        returnToUrl={returnToUrl}
                    />
                </div>
            )}

            {/* Rankings Panel with Search & Toolbar */}
            <div className="panel overflow-hidden border border-line bg-surface/40 p-4 shadow-xl sm:p-6 backdrop-blur-xs">
                {/* Toolbar */}
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-60 max-w-md">
                        <label htmlFor={searchInputId} className="sr-only">
                            {t("leaderboard.search.placeholder")}
                        </label>
                        <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint size-4" />
                        <input
                            id={searchInputId}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder={t("leaderboard.search.placeholder")}
                            className="input h-10 w-full pl-9 pr-9 text-xs sm:text-sm bg-canvas/70 focus:bg-canvas"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                aria-label={t("leaderboard.search.clear")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-ink"
                            >
                                <FiX className="size-4" />
                            </button>
                        )}
                    </div>

                    {/* Actions and Jump to My Rank */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5">
                            <FiFilter aria-hidden="true" className="size-3.5 text-faint" />
                            <div
                                role="group"
                                aria-label={t("leaderboard.period.label")}
                                className="inline-flex items-center gap-0.5 rounded-xl border border-line bg-canvas/50 p-1"
                            >
                                <button
                                    type="button"
                                    aria-pressed={!isCurrentMonth}
                                    onClick={() => {
                                        setScorePeriod("all-time");
                                        setCurrentPage(1);
                                    }}
                                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                                        !isCurrentMonth
                                            ? "border border-accent/50 bg-accent/15 text-lime-200 shadow-[0_0_12px_rgba(163,230,53,0.12)]"
                                            : "border border-transparent text-faint hover:text-ink"
                                    }`}
                                >
                                    <FiTrendingUp aria-hidden="true" className="size-3.5" />
                                    {t("leaderboard.period.allTime")}
                                </button>
                                <button
                                    type="button"
                                    aria-pressed={isCurrentMonth}
                                    onClick={() => {
                                        setScorePeriod("month");
                                        setCurrentPage(1);
                                    }}
                                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                                        isCurrentMonth
                                            ? "border border-accent/50 bg-accent/15 text-lime-200 shadow-[0_0_12px_rgba(163,230,53,0.12)]"
                                            : "border border-transparent text-faint hover:text-ink"
                                    }`}
                                >
                                    <FiCalendar aria-hidden="true" className="size-3.5" />
                                    {t("leaderboard.period.thisMonth")}
                                </button>
                            </div>
                        </div>

                        {currentUserStanding && (
                            <button
                                type="button"
                                onClick={handleJumpToMyRank}
                                className="inline-flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-3.5 py-2 text-xs font-medium text-lime-200 transition hover:bg-accent/20 hover:border-accent/60 shadow-xs"
                            >
                                <FiTarget className="size-3.5 text-accent animate-spin-slow" />
                                {t("leaderboard.jumpToMyRank", { rank: currentUserStanding.rank })}
                            </button>
                        )}

                    </div>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-[3rem_minmax(0,1fr)_minmax(4rem,6rem)] lg:grid-cols-[4rem_minmax(0,1fr)_minmax(6rem,8rem)_minmax(5rem,7rem)_minmax(5rem,7rem)] items-center gap-3 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-faint border-b border-line/60">
                    <span className="text-center">{t("leaderboard.table.rank")}</span>
                    <span>{t("leaderboard.table.student")}</span>
                    <span className="hidden lg:inline">{t("leaderboard.table.cohort")}</span>
                    <span className="hidden lg:inline text-right">{t(isCurrentMonth ? "leaderboard.table.monthActiveDays" : "leaderboard.table.activeDays")}</span>
                    <span className="text-right">{t(isCurrentMonth ? "leaderboard.table.monthAura" : "leaderboard.table.totalAura")}</span>
                </div>

                {/* Rows List */}
                {paginatedStudents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="grid size-12 place-items-center rounded-2xl border border-line bg-canvas text-faint mb-3">
                            <FiSearch className="size-5" />
                        </div>
                        <p className="text-sm font-semibold text-ink">
                            {searchQuery
                                ? t("leaderboard.search.noResults", { query: searchQuery })
                                : t("leaderboard.empty.title")}
                        </p>
                        <p className="mt-1 text-xs text-faint max-w-sm">
                            {t("leaderboard.empty.description")}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-line/40">
                        {paginatedStudents.map((student) => {
                            const avatar = getAvatarById(student.avatarId);
                            const isYou = currentProfile !== null && currentProfile.id === student.profileId;
                            const isHighlighted = highlightedProfileId === student.profileId;
                            const currentRank = isGlobal ? student.globalRank : student.groupRank;

                            // Badge styling based on rank
                            let rankBadgeStyle = "border-line bg-surface-2 text-faint";
                            if (currentRank === 1) {
                                rankBadgeStyle = "border-accent/70 bg-accent/20 text-lime-200 font-bold shadow-[0_0_12px_rgba(163,230,53,0.3)]";
                            } else if (currentRank === 2) {
                                rankBadgeStyle = "border-sky-300/60 bg-sky-300/20 text-sky-200 font-bold shadow-[0_0_10px_rgba(56,189,248,0.2)]";
                            } else if (currentRank === 3) {
                                rankBadgeStyle = "border-amber-300/60 bg-amber-300/20 text-amber-200 font-bold shadow-[0_0_10px_rgba(251,191,36,0.2)]";
                            } else if (currentRank <= 10) {
                                rankBadgeStyle = "border-violet-300/40 bg-violet-300/10 text-violet-200 font-medium";
                            }

                            return (
                                <div
                                    id={`student-row-${student.profileId}`}
                                    key={student.studentId}
                                    className={`group grid grid-cols-[3rem_minmax(0,1fr)_minmax(4rem,6rem)] lg:grid-cols-[4rem_minmax(0,1fr)_minmax(6rem,8rem)_minmax(5rem,7rem)_minmax(5rem,7rem)] items-center gap-3 px-3 py-3 transition-colors duration-150 ${isYou
                                        ? "bg-accent/8 border-l-2 border-accent"
                                        : "hover:bg-white/2"
                                        } ${isHighlighted
                                            ? "ring-2 ring-accent shadow-[0_0_24px_rgba(163,230,53,0.25)] rounded-xl"
                                            : ""
                                        }`}
                                >
                                    {/* Rank */}
                                    <div className="flex justify-center">
                                        <span
                                            className={`grid size-7 sm:size-8 place-items-center rounded-lg border font-mono text-xs sm:text-sm ${rankBadgeStyle}`}
                                        >
                                            #{currentRank}
                                        </span>
                                    </div>

                                    {/* Student Info */}
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        {/* Avatar */}
                                        <div className="relative shrink-0">
                                            {avatar ? (
                                                <div className="size-9 sm:size-10 overflow-hidden rounded-full border border-line bg-surface">
                                                    <Image
                                                        src={avatar.src}
                                                        alt={avatar.label}
                                                        width={40}
                                                        height={40}
                                                        className="size-full object-cover"
                                                        unoptimized
                                                    />
                                                </div>
                                            ) : (
                                                <div className="grid size-9 sm:size-10 place-items-center rounded-full border border-line bg-surface-2 font-mono text-xs font-semibold text-ink">
                                                    {initialsFor(student.displayName)}
                                                </div>
                                            )}
                                        </div>

                                        {/* Name & Mobile Cohort */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/profile/${student.profileId}?returnTo=${encodeURIComponent(returnToUrl)}`}
                                                    className="truncate text-xs sm:text-sm font-medium text-ink transition hover:text-accent focus-visible:outline-hidden"
                                                >
                                                    {student.displayName}
                                                </Link>
                                                {isYou && (
                                                    <span className="shrink-0 rounded border border-accent/40 bg-accent/20 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-lime-200">
                                                        {t("leaderboard.table.you")}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5 lg:hidden">
                                                <span className="truncate text-[10px] text-faint">
                                                    {student.groupName ?? "—"}
                                                </span>
                                                <span className="text-[10px] text-faint">·</span>
                                                <span className="text-[10px] text-faint">
                                                    {t("leaderboard.daysCount", { count: student.activeDays })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cohort (desktop) */}
                                    <div className="hidden lg:block min-w-0">
                                        {student.groupName ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (student.groupId) handleTabChange(String(student.groupId));
                                                }}
                                                className="inline-flex max-w-full items-center truncate rounded-md border border-line bg-canvas/40 px-2 py-0.5 text-[11px] text-muted transition hover:border-neutral-500 hover:text-ink"
                                            >
                                                {student.groupName}
                                            </button>
                                        ) : (
                                            <span className="text-xs text-faint">—</span>
                                        )}
                                    </div>

                                    {/* Active Days (desktop) */}
                                    <div className="hidden lg:flex items-center justify-end gap-1.5 text-xs font-mono text-muted">
                                        <FiCalendar className="size-3 text-faint" />
                                        <span>{student.activeDays}</span>
                                    </div>

                                    {/* Total Aura */}
                                    <div className="flex items-center justify-end gap-1.5">
                                        <PiSparkle className={`size-3.5 shrink-0 ${currentRank <= 3 ? "text-accent" : "text-faint"
                                            }`} />
                                        <span className="font-mono text-sm sm:text-base font-semibold text-ink">
                                            {student.totalAura}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination Controls */}
                {isPaginated && totalPages > 1 && (
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-4">
                        <p className="text-xs text-faint">
                            {t("leaderboard.pagination.showing", {
                                start: startItem,
                                end: endItem,
                                total: totalCount,
                            })}
                        </p>

                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                disabled={safePage <= 1}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                aria-label={t("leaderboard.pagination.prev")}
                                className="grid size-8 place-items-center rounded-lg border border-line bg-canvas text-muted transition hover:border-neutral-500 hover:text-ink disabled:opacity-30 disabled:pointer-events-none"
                            >
                                <FiChevronLeft className="size-4" />
                            </button>

                            <div className="flex items-center gap-1 px-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                                    const isActive = pageNum === safePage;
                                    return (
                                        <button
                                            key={pageNum}
                                            type="button"
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`grid size-8 place-items-center rounded-lg border font-mono text-xs transition ${isActive
                                                ? "border-accent bg-accent/15 font-semibold text-lime-200"
                                                : "border-line bg-canvas text-muted hover:border-neutral-500 hover:text-ink"
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                type="button"
                                disabled={safePage >= totalPages}
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                aria-label={t("leaderboard.pagination.next")}
                                className="grid size-8 place-items-center rounded-lg border border-line bg-canvas text-muted transition hover:border-neutral-500 hover:text-ink disabled:opacity-30 disabled:pointer-events-none"
                            >
                                <FiChevronRight className="size-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
