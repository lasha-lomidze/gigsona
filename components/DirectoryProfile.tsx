"use client";

import Image from "next/image";
import Link from "next/link";
import { AuraInsights, TotalAuraBadge } from "@/components/AuraInsights";
import { CategoryRadar, TrendBars } from "@/components/AuraCharts";
import type { MessageKey } from "@/lib/i18n";
import { useT } from "@/lib/i18n/use-t";
import { categoryLabelKey, type ProfileAuraStats, type StudentLeaderboardRanks } from "@/lib/aura-stats-shared";
import { getAvatarById } from "@/lib/avatars";
import { roleChip, statusChip } from "@/lib/ui";
import { StudentProfileHighlights } from "@/components/StudentProfileHighlights";
import type { ProfileStatus, Role } from "@/types/types";
import { FiArrowLeft, FiArrowUpRight, FiLayers, FiUsers } from "react-icons/fi";

const initialsFor = (name: string) =>
    name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";

const ROLE_LABEL_KEYS = {
    anonymous: "labels.role.anonymous",
    student: "labels.role.student",
    mentor: "labels.role.mentor",
    assistant: "labels.role.assistant",
} as const satisfies Record<Role, MessageKey>;

const STATUS_LABEL_KEYS = {
    active: "labels.status.active",
    inactive: "labels.status.inactive",
} as const satisfies Record<Exclude<ProfileStatus, "unassigned">, MessageKey>;

export function DirectoryProfile({
    name,
    avatarId,
    bio,
    role,
    status,
    groups,
    studentGroup,
    studentRanks,
    auraStats,
}: {
    name: string;
    avatarId: string | null;
    bio: string | null;
    role: Role;
    status: ProfileStatus | "unassigned";
    groups: { id: number; name: string }[];
    studentGroup: { id: number; name: string } | null;
    studentRanks: StudentLeaderboardRanks | null;
    auraStats: ProfileAuraStats | null;
}) {
    const t = useT();
    const avatar = getAvatarById(avatarId);

    return (
        <div className="pb-10">
            <Link href="/search" className="mb-4 inline-flex items-center gap-2 rounded-md text-sm text-muted transition hover:text-lime-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60">
                <FiArrowLeft aria-hidden="true" />
                {t("search.profile.back")}
            </Link>

            <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-linear-to-br from-surface/70 via-surface/35 to-canvas p-4 sm:gap-5 sm:p-5">
                {avatar ? (
                    <span className={`grid size-16 shrink-0 place-items-center overflow-hidden rounded-full border sm:size-20 ${roleChip[role]}`}>
                        <Image src={avatar.src} alt={avatar.label} width={80} height={80} className="size-full object-cover" unoptimized priority />
                    </span>
                ) : (
                    <span aria-label={t("search.profile.initialsAria", { name })} className={`grid size-16 shrink-0 place-items-center rounded-full border text-xl font-semibold tracking-wide sm:size-20 sm:text-2xl ${roleChip[role]}`}>
                        {initialsFor(name)}
                    </span>
                )}
                <div className="min-w-0 flex-1">
                    <p className="eyebrow">{t("search.profile.identity")}</p>
                    <h2 className="mt-1 wrap-break-word text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl">{name}</h2>
                    {bio ? <p className="mt-1 wrap-anywhere text-sm leading-5 text-muted">{bio}</p> : null}
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${roleChip[role]}`}>{t(ROLE_LABEL_KEYS[role])}</span>
                        <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${statusChip[status]}`}>
                            {status === "unassigned" ? t("search.profile.noProfile") : t(STATUS_LABEL_KEYS[status])}
                        </span>
                    </div>
                </div>
                {auraStats && <TotalAuraBadge total={auraStats.totalAura} label={auraStats.kind === "student" ? t("search.profile.totalAura") : t("search.profile.groupAura")} />}
            </section>

            <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <section className="min-w-0">
                    <h3 className="text-sm font-semibold text-ink">{t("search.profile.details")}</h3>
                    {role === "student" ? (
                        <StudentProfileHighlights group={studentGroup} ranks={studentRanks} />
                    ) : (
                        <section className="relative mt-4 overflow-hidden rounded-xl border border-accent/20 bg-linear-to-br from-accent/8 via-surface/40 to-canvas p-4">
                            <span aria-hidden="true" className="pointer-events-none absolute -right-5 -top-7 text-accent/6">
                                <FiLayers className="size-28" />
                            </span>
                            <div className="relative flex items-start justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-2.5">
                                    <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-accent/20 bg-accent/10 text-accent">
                                        <FiLayers aria-hidden="true" className="size-4" />
                                    </span>
                                    <div className="min-w-0">
                                        <h4 className="text-xs font-semibold text-ink">{role === "mentor" ? t("search.profile.groupsYouMentor") : t("search.profile.groupsYouSupport")}</h4>
                                        <p className="mt-0.5 text-[10px] text-muted">{t("search.profile.community")}</p>
                                    </div>
                                </div>
                                <span className="shrink-0 rounded-full border border-accent/20 bg-accent/10 px-2 py-1 text-[10px] font-semibold tabular-nums text-accent">
                                    {groups.length} {t(groups.length === 1 ? "search.count.group.one" : "search.count.group.other")}
                                </span>
                            </div>
                            {groups.length ? (
                                <ul className="relative mt-4 grid gap-2 sm:grid-cols-2">
                                    {groups.map((group) => (
                                        <li key={group.id}>
                                                <Link
                                                    href={`/?group=${group.id}#group-${group.id}`}
                                                    aria-label={t("search.group.openInOverview", { name: group.name })}
                                                    className="group/card flex min-w-0 items-center gap-2.5 rounded-lg border border-line bg-canvas/70 px-3 py-2.5 transition hover:border-accent/40 hover:bg-accent/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                                                >
                                                <span className="grid size-7 shrink-0 place-items-center rounded-md border border-accent/15 bg-accent/5 text-accent/80">
                                                    <FiUsers aria-hidden="true" className="size-3.5" />
                                                </span>
                                                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink transition group-hover/card:text-lime-200">{group.name}</span>
                                                    <FiArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-faint transition group-hover/card:-translate-y-0.5 group-hover/card:translate-x-0.5 group-hover/card:text-accent" />
                                                </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="relative mt-4 rounded-lg border border-dashed border-line bg-canvas/40 px-3 py-4 text-sm text-faint">
                                    {status === "unassigned" ? t("search.profile.accountNoProfile") : t("search.profile.noGroupAffiliations")}
                                </p>
                            )}
                        </section>
                    )}
                    {auraStats && (auraStats.kind !== "student" || auraStats.categoryTotals.length > 0) && (
                        <section className="mt-6">
                            <h3 className="kicker mb-2">{auraStats.kind === "student" ? t("search.profile.auraByCategory") : t("search.profile.groupAuraByCategory")}</h3>
                            {auraStats.categoryTotals.length > 0 ? (
                                <ul className="grid gap-2 sm:grid-cols-2">
                                    {auraStats.categoryTotals.map((category) => (
                                        <li key={category.category} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-line bg-surface/40 px-3 py-2.5">
                                            <span className="min-w-0 truncate text-sm text-muted">{t(categoryLabelKey(category.category))}</span>
                                            <span className="shrink-0 text-right text-sm font-semibold tabular-nums text-ink">
                                                {category.total}
                                                <span className="ml-1 text-[10px] font-medium text-faint">{t("search.profile.auraUnit")}</span>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="rounded-lg border border-dashed border-line px-3 py-4 text-sm text-faint">{t("search.profile.noGroupAuraRecorded")}</p>
                            )}
                        </section>
                    )}
                </section>

                <div className="min-w-0 xl:border-l xl:border-line xl:pl-8">
                    {auraStats ? (
                        <div className="space-y-4">
                            <div className="flex items-baseline justify-between gap-3">
                                <h3 className="text-sm font-semibold text-ink">
                                    {auraStats.kind === "student" ? t("search.profile.auraActivity") : t("search.profile.groupAuraActivity")}
                                </h3>
                                {auraStats.kind !== "student" && groups.length > 0 && (
                                    <p className="truncate text-[10px] uppercase tracking-wider text-faint">{groups.map((group) => group.name).join(", ")}</p>
                                )}
                            </div>
                            <AuraInsights stats={auraStats} />
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="min-w-0 rounded-xl border border-line bg-canvas p-3 sm:p-4">
                                    <p className="kicker mb-2">{t("search.profile.byCategory")}</p>
                                    {auraStats.categoryTotals.length ? <CategoryRadar data={auraStats.categoryTotals} /> : <p className="py-10 text-center text-xs text-faint">{t("search.profile.noAuraYet")}</p>}
                                </div>
                                <div className="min-w-0 rounded-xl border border-line bg-canvas p-3 sm:p-4">
                                    <p className="kicker mb-2">{t("search.profile.last7Days")}</p>
                                    <TrendBars data={auraStats.trend} />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-ink">{t("search.profile.statistics")}</h3>
                            <p className="text-sm text-faint">{t("search.profile.noAuraStatistics")}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
