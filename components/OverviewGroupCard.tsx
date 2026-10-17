"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { IoIosArrowDown as OpenIcon } from "react-icons/io";
import { historyCategories } from "@/lib/aura-history-shared";
import { categoryLabelKey } from "@/lib/aura-stats-shared";
import type { OverviewGroup } from "@/lib/overview-shared";
import { useT } from "@/lib/i18n/use-t";

interface OverviewGroupCardProps {
  group: OverviewGroup;
  initiallyOpen: boolean;
  myProfileId: number | null;
}

const auraDisplay = (value: number | undefined) => (value === undefined || value === 0 ? "_" : `${value}`);
const signed = (value: number) => (value === 0 ? "_" : value > 0 ? `+${value}` : `${value}`);
const rankStyle = (rank: number) =>
  rank === 1
    ? "bg-accent text-black"
    : rank <= 3
      ? "bg-accent/20 text-lime-200"
      : "bg-line text-muted";

export function OverviewGroupCard({ group, initiallyOpen, myProfileId }: OverviewGroupCardProps) {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const t = useT();
  const top = group.rows[0];

  return (
    <motion.div
      id={`group-${group.id}`}
      layout
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`panel relative overflow-hidden transition-colors ${
        isOpen ? "border-accent/40 shadow-[0_0_24px_rgba(163,230,53,0.06)]" : "hover:border-accent/30"
      }`}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="flex w-full cursor-pointer list-none items-center justify-between gap-4 rounded-2xl p-5 text-left outline-none transition-colors hover:bg-surface/40 focus-visible:ring-2 focus-visible:ring-accent/50 sm:px-6 select-none"
      >
        <div className="min-w-0">
          <h3 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{group.name}</h3>
          {group.mentorName && <p className="text-sm text-faint">{group.mentorName}</p>}
          {top && (
            <p className="mt-2 text-sm text-muted">
              {t("overview.group.topStudent")}: {top.name} <span className="text-accent">({auraDisplay(top.total)})</span>
            </p>
          )}
          <p className="text-sm text-muted">
            {t("overview.group.auraGiven")}: <span className="text-accent">{signed(group.totalGiven)}</span>
            <span className="text-faint">
              {" "}·{" "}
              {group.rows.length === 1
                ? t("overview.group.studentCount.one", { count: group.rows.length })
                : t("overview.group.studentCount.other", { count: group.rows.length })}
            </span>
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-2 text-muted">
          {!isOpen && <span className="hidden text-sm sm:inline">{t("overview.group.resultsHint")}</span>}
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={isOpen ? "text-accent" : ""}
          >
            <OpenIcon size={24} />
          </motion.span>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="overflow-x-auto px-3 pb-5 sm:px-6 border-t border-line/50 pt-2">
              <table className="w-full min-w-80 text-left">
                <thead>
                  <tr className="border-b border-line text-sm text-faint">
                    <th className="w-14 py-2 pl-2 font-medium">{t("overview.table.rank")}</th>
                    <th className="py-2 font-medium">{t("overview.table.student")}</th>
                    {historyCategories.map((category) => (
                      <th key={category} className="hidden px-2 py-2 text-right font-medium lg:table-cell">
                        {t(categoryLabelKey(category))}
                      </th>
                    ))}
                    <th className="py-2 pr-2 text-right font-medium">{t("overview.table.total")}</th>
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((row, rowIdx) => {
                    const isMe = myProfileId != null && row.profileId === myProfileId;
                    const name = row.profileId ? (
                      <Link href={`/profile/${row.profileId}`} className="font-medium text-ink transition hover:text-lime-200">
                        {row.name}
                      </Link>
                    ) : (
                      <span className="font-medium text-ink">{row.name}</span>
                    );
                    return (
                      <motion.tr
                        key={row.studentId}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: Math.min(rowIdx * 0.02, 0.25) }}
                        className={`border-b border-line last:border-0 transition-colors hover:bg-surface/50 ${
                          isMe ? "bg-accent/8" : ""
                        }`}
                      >
                        <td className="py-3 pl-2">
                          <span
                            className={`grid size-8 place-items-center rounded-full text-sm font-semibold ${rankStyle(
                              row.rank,
                            )}`}
                          >
                            {row.rank}
                          </span>
                        </td>
                        <td className="py-3 pr-2 text-base">
                          {name}
                          {isMe && <span className="chip chip-active ml-2 py-0.5 text-xs">{t("overview.table.you")}</span>}
                          <p className="mt-0.5 text-xs text-faint lg:hidden">
                            {historyCategories
                              .map(
                                (category) =>
                                  `${t(categoryLabelKey(category))} ${auraDisplay(row.categories[category])}`,
                              )
                              .join(" · ")}
                          </p>
                        </td>
                        {historyCategories.map((category) => (
                          <td
                            key={category}
                            className="hidden px-2 py-3 text-right tabular-nums text-muted lg:table-cell"
                          >
                            {auraDisplay(row.categories[category])}
                          </td>
                        ))}
                        <td className="py-3 pr-2 text-right text-lg font-semibold tabular-nums text-accent">
                          {auraDisplay(row.total)}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
