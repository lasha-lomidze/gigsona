import Link from "next/link";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { PageTitle } from "@/components/ui/PageTitle";
import { AnimatedTabs } from "@/components/ui/AnimatedTabs";
import { AuraHistory } from "@/components/AuraHistory";
import { HistoryBackToTop } from "@/components/HistoryBackToTop";
import { HistoryDatePicker } from "@/components/HistoryDatePicker";
import { getT } from "@/lib/i18n/server";
import { getSessionProfile } from "@/lib/session-profile";
import { getRegionLocale } from "@/lib/region-server";
import { getTbilisiDate } from "@/lib/time";
import { isValidIsoDate, listActiveDates, listHistoryGroups, loadGroupDay } from "@/lib/aura-history";
import { formatLongDate, formatShortDate, shiftDate } from "@/lib/aura-history-shared";
import { db } from "@/lib/db";
import { groupMembers, groups } from "@/lib/schema";
import { and, eq } from "drizzle-orm";

type SearchParams = Promise<{ group?: string; date?: string }>;

export default async function HistoryPage({ searchParams }: { searchParams: SearchParams }) {
    const params = await searchParams;
    const [locale, t] = await Promise.all([getRegionLocale(), getT()]);
    const today = getTbilisiDate();
    const [allGroups, { profile }] = await Promise.all([listHistoryGroups(), getSessionProfile()]);

    const requestedGroup = Number(params.group);
    const group = allGroups.find((item) => item.id === requestedGroup) ?? allGroups[0];
    const requestedDate = isValidIsoDate(params.date) ? params.date : today;
    const lessonDate = requestedDate > today ? today : requestedDate;

    if (!group) {
        return (
            <>
                <PageTitle title={t("history.page.title")} description={t("history.page.emptyDescription")} />
                <p className="text-faint">{t("history.page.noGroups")}</p>
            </>
        );
    }

    const [day, activeDates, canEdit] = await Promise.all([
        loadGroupDay(group.id, lessonDate),
        listActiveDates(group.id),
        canEditGroup(profile, group.id),
    ]);

    const href = (groupId: number, date: string) => `/history?group=${groupId}&date=${date}`;
    const next = shiftDate(lessonDate, 1);

    return (
        <>
            <PageTitle title={t("history.page.title")} description={t("history.page.description")} />

            <AnimatedTabs
                layoutId="history-group-tabs"
                ariaLabel={t("history.page.groupsAriaLabel")}
                items={allGroups.map((item) => ({
                    id: item.id,
                    label: item.name,
                    href: href(item.id, lessonDate),
                    active: item.id === group.id,
                }))}
            />

            <div className="flex flex-wrap items-center gap-3">
                <Link href={href(group.id, shiftDate(lessonDate, -1))} aria-label={t("history.page.previousDay")} className="btn btn-secondary btn-icon"><FiChevronLeft /></Link>
                <h2 className="text-xl font-semibold tracking-tight text-ink">{formatLongDate(lessonDate, locale)}</h2>
                {next <= today ? (
                    <Link href={href(group.id, next)} aria-label={t("history.page.nextDay")} className="btn btn-secondary btn-icon"><FiChevronRight /></Link>
                ) : (
                    <span aria-hidden="true" className="btn btn-secondary btn-icon opacity-35"><FiChevronRight /></span>
                )}
                <div className="ml-auto flex items-center gap-2">
                    {lessonDate !== today && <Link href={href(group.id, today)} className="btn btn-secondary btn-sm text-lime-200">{t("history.page.today")}</Link>}
                    <HistoryDatePicker groupId={group.id} value={lessonDate} max={today} />
                </div>
            </div>

            {activeDates.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1" aria-label={t("history.page.daysWithScoresAriaLabel")}>
                    {activeDates.map((date) => (
                        <Link
                            key={date}
                            href={href(group.id, date)}
                            className={`chip shrink-0 text-xs ${date === lessonDate ? "chip-active" : ""}`}
                        >
                            {formatShortDate(date, locale)}
                        </Link>
                    ))}
                </div>
            )}

            <AuraHistory
                key={`${group.id}:${lessonDate}`}
                groupId={group.id}
                lessonDate={lessonDate}
                students={day.students}
                entries={day.entries}
                canEdit={canEdit}
            />
            <HistoryBackToTop />
        </>
    );
}

// Mirrors requireGroupScoringAccess in actions/manage-aura.ts; the action still enforces it on save.
async function canEditGroup(profile: Awaited<ReturnType<typeof getSessionProfile>>["profile"], groupId: number) {
    if (!profile || profile.status !== "active") return false;
    if (profile.role === "mentor") return true;
    if (profile.role !== "assistant" || profile.profileId === null) return false;
    const [[group], [membership]] = await Promise.all([
        db.select({ accessMode: groups.accessMode }).from(groups).where(eq(groups.id, groupId)),
        db.select({ groupId: groupMembers.groupId }).from(groupMembers).where(and(
            eq(groupMembers.profileId, profile.profileId),
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.role, "assistant"),
        )),
    ]);
    return group?.accessMode === "free" || !!membership;
}
