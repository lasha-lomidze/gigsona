import Link from "next/link";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { PageTitle } from "@/components/ui/PageTitle";
import { OverviewDatePicker } from "@/components/OverviewDatePicker";
import { OverviewGroupCard } from "@/components/OverviewGroupCard";
import { getT } from "@/lib/i18n/server";
import { getSessionProfile } from "@/lib/session-profile";
import { getRegionLocale } from "@/lib/region-server";
import { getTbilisiDate } from "@/lib/time";
import { isValidIsoDate } from "@/lib/aura-history";
import { formatLongDate } from "@/lib/aura-history-shared";
import { latestOverviewDateForGroup, listOverviewDates, loadOverviewDay } from "@/lib/overview";

type SearchParams = Promise<{ date?: string | string[]; group?: string | string[] }>;

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const [locale, t] = await Promise.all([getRegionLocale(), getT()]);
  const today = getTbilisiDate();
  // With no explicit date, show today, or the latest lesson day if today has no scores yet.
  const rawDate = typeof params.date === "string" ? params.date : undefined;
  const requested = isValidIsoDate(rawDate) ? (rawDate > today ? today : rawDate) : null;
  const rawGroupId = typeof params.group === "string" && /^[1-9]\d*$/.test(params.group)
    ? Number(params.group)
    : null;
  const selectedGroupId = rawGroupId !== null && Number.isSafeInteger(rawGroupId) ? rawGroupId : null;
  const [activeDates, { profile }, groupLatestDate] = await Promise.all([
    listOverviewDates(),
    getSessionProfile(),
    selectedGroupId !== null && !requested ? latestOverviewDateForGroup(selectedGroupId) : Promise.resolve(null),
  ]);

  const lessonDate = requested ?? groupLatestDate ?? (activeDates.includes(today) ? today : activeDates[0] ?? today);
  const showingLatestFallback = !requested && !groupLatestDate && lessonDate !== today;

  const groups = await loadOverviewDay(lessonDate, t("overview.fallback.student"));
  const selectedGroupNotShown = selectedGroupId !== null && !groups.some((group) => group.id === selectedGroupId);
  const earlier = activeDates.find((date) => date < lessonDate);
  const later = activeDates.filter((date) => date > lessonDate && date <= today).at(-1);
  const latest = activeDates[0];
  const href = (date: string) => `/?date=${date}`;
  return (
    <>
      <PageTitle title={t("overview.page.title")} description={t("overview.page.description")} />

      <div className="flex flex-col gap-3">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">
          {lessonDate === today && <span className="chip chip-active mr-2 align-middle text-xs">{t("overview.common.today")}</span>}
          {formatLongDate(lessonDate, locale)}
        </h2>
        {showingLatestFallback && (
          <p className="text-sm text-muted">{t("overview.date.fallbackLatest")}</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {earlier
            ? <Link href={href(earlier)} className="btn btn-secondary"><FiChevronLeft /> {t("overview.nav.earlierLesson")}</Link>
            : <span className="btn btn-secondary opacity-35"><FiChevronLeft /> {t("overview.nav.earlierLesson")}</span>}
          {later
            ? <Link href={href(later)} className="btn btn-secondary">{t("overview.nav.laterLesson")} <FiChevronRight /></Link>
            : <span className="btn btn-secondary opacity-35">{t("overview.nav.laterLesson")} <FiChevronRight /></span>}
          <div className="ml-auto flex items-center gap-2">
            {lessonDate !== today && <Link href="/" className="btn btn-secondary text-lime-200">{t("overview.common.today")}</Link>}
            <OverviewDatePicker value={lessonDate} max={today} />
          </div>
        </div>
      </div>

      {selectedGroupNotShown ? (
        <div className="empty">
          <p className="text-lg text-ink">{t("overview.empty.groupLatest.title")}</p>
          <p className="mt-2 text-sm text-faint">{t("overview.empty.groupLatest.description")}</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="empty">
          <p className="text-lg text-ink">{t("overview.empty.noLessons.title")}</p>
          <p className="mt-2 text-sm text-faint">{t("overview.empty.noLessons.description")}</p>
          {latest && latest !== lessonDate && (
            <Link href={href(latest)} className="btn btn-secondary mt-5 text-lime-200">
              {t("overview.empty.showLatestLesson")}
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <OverviewGroupCard
              key={group.id}
              group={group}
              initiallyOpen={groups.length === 1 || selectedGroupId === group.id}
              myProfileId={profile?.profileId ?? null}
            />
          ))}
        </div>
      )}
    </>
  );
}
