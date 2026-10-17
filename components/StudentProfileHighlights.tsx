'use client';

import Link from "next/link";
import { motion } from "motion/react";
import { FiArrowUpRight, FiAward, FiGlobe, FiUsers, FiZap } from "react-icons/fi";
import type { StudentLeaderboardRanks } from "@/lib/aura-stats-shared";
import { useT } from "@/lib/i18n/use-t";

type StudentGroup = { id: number; name: string };

export function StudentProfileHighlights({
    group,
    ranks,
}: {
    group: StudentGroup | null;
    ranks: StudentLeaderboardRanks | null;
}) {
    const t = useT();

    return (
        <div className="mt-4 space-y-3">
            {group ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -2, transition: { duration: 0.15 } }}
                >
                    <Link
                        href={`/?group=${group.id}#group-${group.id}`}
                        aria-label={t("profile.highlights.groupAria", { name: group.name })}
                        className="group relative block overflow-hidden rounded-xl border border-accent/25 bg-linear-to-br from-accent/10 via-surface/40 to-canvas p-4 transition-[border-color] duration-200 hover:border-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                    >
                        <span aria-hidden="true" className="pointer-events-none absolute -right-4 -top-7 text-accent/[0.07] transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                            <FiUsers className="size-28" />
                        </span>
                        <span className="relative flex items-center justify-between gap-3">
                            <span className="flex min-w-0 items-center gap-2.5">
                                <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-accent/20 bg-accent/10 text-accent">
                                    <FiUsers aria-hidden="true" className="size-4" />
                                </span>
                                <span>
                                    <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">{t("profile.highlights.groupLabel")}</span>
                                    <span className="mt-0.5 flex items-center gap-1 text-[10px] text-muted">
                                        <FiZap aria-hidden="true" className="size-3 text-accent" />
                                        {t("profile.highlights.groupKicker")}
                                    </span>
                                </span>
                            </span>
                            <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line bg-canvas/70 text-muted transition group-hover:border-accent/40 group-hover:bg-accent/10 group-hover:text-accent">
                                <FiArrowUpRight aria-hidden="true" className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                            </span>
                        </span>
                        <span className="relative mt-4 block truncate text-xl font-semibold tracking-tight text-ink transition group-hover:text-lime-200">{group.name}</span>
                        <span className="relative mt-1 flex items-center gap-1.5 text-xs text-muted">
                            <span>{t("profile.highlights.groupCta")}</span>
                            <FiArrowUpRight aria-hidden="true" className="size-3 text-accent/70" />
                        </span>
                    </Link>
                </motion.div>
            ) : (
                <div className="rounded-xl border border-line bg-surface/20 p-4">
                    <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                        <FiUsers aria-hidden="true" />
                        {t("profile.highlights.groupLabel")}
                    </span>
                    <p className="mt-3 text-sm text-muted">{t("profile.highlights.noGroup")}</p>
                </div>
            )}

            {ranks && (
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                    aria-label={t("profile.highlights.leaderboardAria")}
                    className="rounded-xl border border-line bg-linear-to-br from-surface/60 to-canvas/40 p-4"
                >
                    <div className="flex items-center gap-2.5">
                        <span className="grid size-8 place-items-center rounded-lg border border-accent/20 bg-accent/10 text-accent">
                            <FiAward aria-hidden="true" className="size-4" />
                        </span>
                        <span>
                            <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-ink">{t("profile.highlights.leaderboardTitle")}</span>
                            <span className="mt-0.5 block text-[10px] text-faint">{t("profile.highlights.leaderboardDescription")}</span>
                        </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2.5">
                        <motion.div
                            whileHover={{ y: -2, transition: { duration: 0.15 } }}
                            className="rounded-lg border border-line bg-canvas/70 p-3 transition hover:border-accent/25"
                        >
                            <p className="flex items-center gap-1.5 text-[10px] font-medium text-muted">
                                <FiGlobe aria-hidden="true" className="size-3 text-accent/80" />
                                {t("profile.highlights.globalStudents")}
                            </p>
                            <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-accent">#{ranks.globalRank}</p>
                            <p className="mt-0.5 text-[10px] text-faint">{t("profile.highlights.acrossAcademy")}</p>
                        </motion.div>
                        <motion.div
                            whileHover={{ y: -2, transition: { duration: 0.15 } }}
                            className="rounded-lg border border-line bg-canvas/70 p-3 transition hover:border-accent/25"
                        >
                            <p className="flex items-center gap-1.5 text-[10px] font-medium text-muted">
                                <FiUsers aria-hidden="true" className="size-3 text-accent/80" />
                                {t("profile.highlights.inGroup")}
                            </p>
                            <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-accent">
                                {ranks.groupRank === null ? "—" : `#${ranks.groupRank}`}
                            </p>
                            <p className="mt-0.5 text-[10px] text-faint">{t("profile.highlights.amongClassmates")}</p>
                        </motion.div>
                    </div>
                </motion.section>
            )}
        </div>
    );
}
