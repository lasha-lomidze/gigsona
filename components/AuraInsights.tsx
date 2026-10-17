'use client';

import { useMemo } from "react";
import { motion } from "motion/react";
import type { ProfileAuraStats } from "@/lib/aura-stats-shared";
import { categoryLabelKey } from "@/lib/aura-stats-shared";
import { useRegion } from "@/components/RegionSetting";
import { useT } from "@/lib/i18n/use-t";
import {
    FiActivity,
    FiCalendar,
    FiCheckCircle,
    FiTrendingUp,
    FiUsers,
    FiVideo,
    FiZap,
    FiLayers,
} from "react-icons/fi";

function pct(part: number, total: number): string {
    if (total === 0) return "—";
    return `${Math.round((part / total) * 100)}%`;
}

interface Tile {
    icon: typeof FiActivity;
    label: string;
    value: string;
    sub: string;
}

function formatShortDate(iso: string, locale: string): string {
    const date = new Date(`${iso}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) return iso;
    return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" }).format(date);
}

function tilesFor(stats: ProfileAuraStats, t: ReturnType<typeof useT>, locale: string): Tile[] {
    if (stats.kind === "student") {
        return [
            {
                icon: FiTrendingUp,
                label: t("profile.insights.topCategory"),
                value: stats.topCategory ? t(categoryLabelKey(stats.topCategory.category)) : "—",
                sub: stats.topCategory ? t("profile.insights.auraSuffix", { count: stats.topCategory.total }) : t("profile.insights.noAuraYet"),
            },
            {
                icon: FiCheckCircle,
                label: t("profile.insights.attendance"),
                value: pct(stats.attendance.attended, stats.attendance.total),
                sub: t("profile.insights.daysFraction", { count: stats.attendance.attended, total: stats.attendance.total }),
            },
            {
                icon: FiVideo,
                label: t("profile.insights.cameraOn"),
                value: pct(stats.camera.on, stats.camera.total),
                sub: t("profile.insights.daysFraction", { count: stats.camera.on, total: stats.camera.total }),
            },
            {
                icon: FiCalendar,
                label: t("profile.insights.daysActive"),
                value: String(stats.daysActive),
                sub: stats.bestDay ? t("profile.insights.bestDay", { date: formatShortDate(stats.bestDay.day, locale) }) : "—",
            },
        ];
    }

    return [
        {
            icon: FiLayers,
            label: t("profile.insights.groups"),
            value: String(stats.groupCount),
            sub: stats.groupCount === 1 ? t("profile.insights.singleGroup") : t("profile.insights.multiGroups", { count: stats.groupCount }),
        },
        {
            icon: FiUsers,
            label: t("profile.insights.students"),
            value: String(stats.studentCount),
            sub: t("profile.insights.activeThisWeek", { count: stats.activeStudents }),
        },
        {
            icon: FiZap,
            label: t("profile.insights.auraGivenWeek"),
            value: String(stats.auraGivenWeek),
            sub: t("profile.insights.acrossGroups"),
        },
        {
            icon: FiActivity,
            label: t("profile.insights.totalAura"),
            value: String(stats.totalAura),
            sub: t("profile.insights.allTimeInGroups"),
        },
    ];
}

export function AuraInsights({ stats }: { stats: ProfileAuraStats }) {
    const t = useT();
    const { locale } = useRegion();
    const items = useMemo(() => tilesFor(stats, t, locale), [locale, stats, t]);

    return (
        <div className="grid grid-cols-2 gap-3">
            {items.map((item, idx) => (
                <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -2, transition: { duration: 0.15 } }}
                    className="panel min-w-0 rounded-xl px-3.5 py-3.5 transition-colors hover:border-accent/30 sm:px-4"
                >
                    <div className="flex min-w-0 items-start gap-2 text-muted">
                        <item.icon className="mt-0.5 size-4 shrink-0 text-accent/80" aria-hidden="true" />
                        <p className="min-w-0 text-[11px] font-semibold uppercase leading-4 tracking-[0.1em]">{item.label}</p>
                    </div>
                    <p className="mt-2 wrap-break-word text-lg font-semibold leading-tight tabular-nums text-ink">{item.value}</p>
                    <p className="mt-1 wrap-anywhere text-xs leading-4 text-faint">{item.sub}</p>
                </motion.div>
            ))}
        </div>
    );
}

export function TotalAuraBadge({ total, label }: { total: number; label?: string }) {
    const t = useT();
    const resolvedLabel = label === "Group aura"
        ? t("profile.insights.groupAura")
        : label === undefined || label === "Total aura"
            ? t("profile.insights.totalAura")
            : label;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-2 rounded-lg border border-accent/25 bg-accent/5 px-3 py-2"
        >
            <FiActivity className="size-4 text-accent" aria-hidden="true" />
            <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-lime-200/80">{resolvedLabel}</p>
                <p className="text-lg font-bold leading-none text-lime-200">{total}</p>
            </div>
        </motion.div>
    );
}
