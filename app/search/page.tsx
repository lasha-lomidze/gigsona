import { PageTitle } from "@/components/ui/PageTitle";
import { AnimatedTabs } from "@/components/ui/AnimatedTabs";
import { SearchDisclosure } from "@/components/SearchDisclosure";
import Image from "next/image";
import Link from "next/link";
import type { MessageKey } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import { groupMembers, groups, profiles } from "@/lib/schema";
import { and, asc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { getAvatarById } from "@/lib/avatars";
import { roleChip } from "@/lib/ui";
import type { Role } from "@/types/types";
import { FiChevronLeft, FiChevronRight, FiLayers, FiSearch, FiX } from "react-icons/fi";

type SearchPageProps = {
    searchParams: Promise<{
        q?: string | string[];
        role?: string | string[];
        page?: string | string[];
        groupPage?: string | string[];
    }>;
};

const PEOPLE_ROLES = ["student", "mentor", "assistant"] as const;
type PeopleRoleFilter = (typeof PEOPLE_ROLES)[number] | "all";

const ROLE_FILTERS: { value: PeopleRoleFilter; labelKey: MessageKey }[] = [
    { value: "all", labelKey: "search.filter.all" },
    { value: "student", labelKey: "search.filter.student" },
    { value: "mentor", labelKey: "search.filter.mentor" },
    { value: "assistant", labelKey: "search.filter.assistant" },
];

const ROLE_LABEL_KEYS = {
    anonymous: "labels.role.anonymous",
    student: "labels.role.student",
    mentor: "labels.role.mentor",
    assistant: "labels.role.assistant",
} as const satisfies Record<Role, MessageKey>;

const PEOPLE_EMPTY_QUERY_KEYS = {
    all: "search.people.empty.query.all",
    student: "search.people.empty.query.student",
    mentor: "search.people.empty.query.mentor",
    assistant: "search.people.empty.query.assistant",
} as const satisfies Record<PeopleRoleFilter, MessageKey>;

const PEOPLE_EMPTY_NONE_KEYS = {
    all: "search.people.empty.none.all",
    student: "search.people.empty.none.student",
    mentor: "search.people.empty.none.mentor",
    assistant: "search.people.empty.none.assistant",
} as const satisfies Record<PeopleRoleFilter, MessageKey>;

const PAGE_SIZE = 8;
const GROUP_PAGE_SIZE = 8;
const BIO_PREVIEW_LENGTH = 80;
const escapeLikeTerm = (term: string) => term.replace(/[\\%_]/g, "\\$&");

function searchHref(query: string, role: PeopleRoleFilter, page = 1, groupPage = 1) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (role !== "all") params.set("role", role);
    if (page > 1) params.set("page", String(page));
    if (groupPage > 1) params.set("groupPage", String(groupPage));
    const search = params.toString();
    return search ? `/search?${search}` : "/search";
}

function getPage(value: string | string[] | undefined, pageSize: number) {
    const parsed = typeof value === "string" ? Number(value) : 1;
    return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= Math.floor(Number.MAX_SAFE_INTEGER / pageSize)
        ? parsed
        : 1;
}

function initialsFor(name: string) {
    return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";
}

function previewBio(bio: string) {
    return bio.length > BIO_PREVIEW_LENGTH
        ? `${bio.slice(0, BIO_PREVIEW_LENGTH - 1).trimEnd()}…`
        : bio;
}

function countLabelKey(kind: "group" | "person", count: number, hasMore = false): MessageKey {
    const singular = count === 1 && !hasMore;
    if (kind === "group") return singular ? "search.count.group.one" : "search.count.group.other";
    return singular ? "search.count.person.one" : "search.count.person.other";
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const t = await getT();
    const params = await searchParams;
    const rawQuery = params.q;
    const query = typeof rawQuery === "string" ? rawQuery.trim() : "";
    const queryIsTooLong = query.length > 100;
    const rawRole = params.role;
    const roleFilter = typeof rawRole === "string"
        ? ROLE_FILTERS.find((filter) => filter.value === rawRole)?.value ?? "all"
        : "all";
    const page = getPage(params.page, PAGE_SIZE);
    const groupPage = getPage(params.groupPage, GROUP_PAGE_SIZE);

    const pattern = query && !queryIsTooLong ? `%${escapeLikeTerm(query)}%` : null;
    const peopleRoleCondition = roleFilter === "all"
        ? inArray(profiles.role, PEOPLE_ROLES)
        : eq(profiles.role, roleFilter);
    const nameCondition = pattern
        ? or(
            ilike(profiles.displayName, pattern),
            ilike(profiles.firstName, pattern),
            ilike(profiles.lastName, pattern),
        )
        : undefined;
    const [groupResults, profileResults] = await Promise.all([
        !queryIsTooLong
            ? db.select({
                id: groups.id,
                name: groups.name,
                mentorName: sql<string | null>`string_agg(coalesce(nullif(${profiles.displayName}, ''), concat_ws(' ', ${profiles.firstName}, ${profiles.lastName})), ', ' order by ${profiles.displayName})`,
            })
                .from(groups)
                .leftJoin(groupMembers, and(eq(groupMembers.groupId, groups.id), eq(groupMembers.role, "owner")))
                .leftJoin(profiles, eq(groupMembers.profileId, profiles.id))
                .where(pattern ? ilike(groups.name, pattern) : undefined)
                .groupBy(groups.id)
                .orderBy(asc(groups.name))
                .limit(GROUP_PAGE_SIZE + 1)
                .offset((groupPage - 1) * GROUP_PAGE_SIZE)
            : Promise.resolve([]),
        !queryIsTooLong
            ? db.select({
                id: profiles.id,
                name: profiles.displayName,
                firstName: profiles.firstName,
                lastName: profiles.lastName,
                role: profiles.role,
                avatarId: profiles.avatarId,
                bio: profiles.bio,
            })
                .from(profiles)
                .where(and(
                    eq(profiles.status, "active"),
                    peopleRoleCondition,
                    ...(nameCondition ? [nameCondition] : []),
                ))
                .orderBy(
                    asc(sql`coalesce(nullif(${profiles.displayName}, ''), nullif(concat_ws(' ', ${profiles.firstName}, ${profiles.lastName}), ''))`),
                    asc(profiles.id),
                )
                .limit(PAGE_SIZE + 1)
                .offset((page - 1) * PAGE_SIZE)
            : Promise.resolve([]),
    ]);
    const peopleResults = profileResults.map((profile) => ({
        id: profile.id,
        name: profile.name || [profile.firstName, profile.lastName].filter(Boolean).join(" ") || t("search.profile.unnamed"),
        role: profile.role,
        avatarId: profile.avatarId,
        bio: profile.bio,
    }));
    const visiblePeople = peopleResults.slice(0, PAGE_SIZE);
    const hasMorePeople = peopleResults.length > PAGE_SIZE;
    const visibleGroups = groupResults.slice(0, GROUP_PAGE_SIZE);
    const hasMoreGroups = groupResults.length > GROUP_PAGE_SIZE;

    return (
        <>
            <PageTitle title={t("search.meta.title")} description={t("search.meta.description")} />
            <section className="mx-auto flex min-h-[calc(100dvh-18rem)] max-w-4xl flex-col justify-center pb-8 md:min-h-[calc(100dvh-14rem)] md:pb-0">
                <form action="/search" className="relative mb-5" role="search">
                    <div className="relative">
                        <FiSearch
                            aria-hidden="true"
                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint"
                        />
                        <input
                            type="search"
                            name="q"
                            defaultValue={query}
                            maxLength={100}
                            placeholder={t("search.input.placeholder")}
                            aria-label={t("search.input.ariaLabel")}
                            className="field h-12 pl-11 pr-24"
                        />
                        {roleFilter !== "all" && <input type="hidden" name="role" value={roleFilter} />}
                        {query && (
                            <Link
                                href={searchHref("", roleFilter)}
                                aria-label={t("search.clear.ariaLabel")}
                                className="absolute right-14 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-faint transition hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                            >
                                <FiX aria-hidden="true" />
                            </Link>
                        )}
                        <button
                            type="submit"
                            className="btn btn-primary absolute right-1 top-1/2 h-10 -translate-y-1/2 px-3"
                        >
                            <FiSearch aria-hidden="true" />
                            <span className="hidden sm:inline">{t("search.input.submit")}</span>
                        </button>
                    </div>
                </form>

                {queryIsTooLong ? (
                    <p role="alert" className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
                        {t("search.validation.queryTooLong")}
                    </p>
                ) : query && groupResults.length === 0 && visiblePeople.length === 0 && page === 1 && groupPage === 1 ? (
                    <div className="rounded-xl border border-line px-5 py-10 text-center">
                        <FiSearch aria-hidden="true" className="mx-auto size-5 text-faint" />
                        <p className="mt-3 text-sm font-medium text-ink">{t("search.empty.all.title", { query })}</p>
                        <p className="mt-1 text-sm text-muted">{t("search.empty.all.description")}</p>
                    </div>
                ) : (
                    <div className="search-directory">
                        <div className="overflow-hidden rounded-xl border border-line divide-y divide-line bg-surface/20">
                            <SearchDisclosure
                                section="groups"
                                title={t("search.sections.groups")}
                                count={`${visibleGroups.length}${hasMoreGroups ? "+" : ""} ${t(countLabelKey("group", visibleGroups.length, hasMoreGroups))}`}
                                initiallyOpen={Boolean(query)}
                            >
                                <div className="border-t border-line p-3">
                                    {visibleGroups.length > 0 ? (
                                        <ul className="panel divide-y divide-line overflow-hidden">
                                            {visibleGroups.map((group) => (
                                                <li key={group.id}>
                                                    <Link
                                                        href={`/?group=${group.id}#group-${group.id}`}
                                                        aria-label={t("search.group.openInOverview", { name: group.name })}
                                                        className="flex items-center justify-between gap-3 px-4 py-3 outline-none transition-colors hover:bg-surface/70 focus-visible:bg-surface/70 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/60"
                                                    >
                                                        <span className="flex min-w-0 items-center gap-3">
                                                            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
                                                                <FiLayers aria-hidden="true" className="size-4" />
                                                            </span>
                                                            <span className="min-w-0">
                                                                <span className="block truncate text-sm font-medium text-ink">{group.name}</span>
                                                                <span className="block truncate text-xs text-faint">{group.mentorName || t("search.group.noMentorAssigned")}</span>
                                                            </span>
                                                        </span>
                                                        <span className="shrink-0 text-xs text-accent">{t("search.group.open")}</span>
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="rounded-lg border border-line px-4 py-7 text-center text-sm text-muted">
                                            {query ? t("search.group.empty.withQuery", { query }) : t("search.group.empty.withoutQuery")}
                                        </p>
                                    )}
                                    {(groupPage > 1 || hasMoreGroups) && (
                                        <nav aria-label={t("search.pagination.groupsAria")} className="mt-4 flex items-center justify-center gap-4">
                                            {groupPage > 1 ? (
                                                <Link
                                                    href={searchHref(query, roleFilter, page, groupPage - 1)}
                                                    className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                                                >
                                                    <FiChevronLeft aria-hidden="true" />
                                                    {t("search.pagination.previous")}
                                                </Link>
                                            ) : <span />}
                                            <span className="text-xs text-faint">{t("search.pagination.page", { page: groupPage })}</span>
                                            {hasMoreGroups ? (
                                                <Link
                                                    href={searchHref(query, roleFilter, page, groupPage + 1)}
                                                    className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                                                >
                                                    {t("search.pagination.next")}
                                                    <FiChevronRight aria-hidden="true" />
                                                </Link>
                                            ) : <span />}
                                        </nav>
                                    )}
                                </div>
                            </SearchDisclosure>

                            <SearchDisclosure
                                section="people"
                                title={t("search.sections.people")}
                                count={`${visiblePeople.length}${hasMorePeople ? "+" : ""} ${t(countLabelKey("person", visiblePeople.length, hasMorePeople))}`}
                                initiallyOpen={Boolean(query) || roleFilter !== "all"}
                            >
                                <div className="border-t border-line p-3">
                                    <AnimatedTabs
                                        layoutId="search-role-tabs"
                                        ariaLabel={t("search.people.filterAria")}
                                        className="mb-3 overflow-x-auto pb-1"
                                        pill
                                        items={ROLE_FILTERS.map((filter) => ({
                                            id: filter.value,
                                            label: t(filter.labelKey),
                                            href: searchHref(query, filter.value),
                                            active: roleFilter === filter.value,
                                        }))}
                                    />
                                    {visiblePeople.length > 0 ? (
                                        <ul className="grid gap-2 sm:grid-cols-2">
                                            {visiblePeople.map((person) => {
                                                const avatar = getAvatarById(person.avatarId);
                                                return (
                                                    <li key={person.id}>
                                                        <Link
                                                            href={`/profile/${person.id}`}
                                                            className="group flex min-h-20 items-center gap-3 rounded-xl border border-line bg-surface/30 p-3 transition hover:border-neutral-600 hover:bg-surface/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                                                        >
                                                            <span className={`grid size-11 shrink-0 place-items-center overflow-hidden rounded-full border text-xs font-semibold ${roleChip[person.role]}`}>
                                                                {avatar ? (
                                                                    <Image src={avatar.src} alt="" width={44} height={44} className="size-full object-cover" unoptimized />
                                                                ) : (
                                                                    initialsFor(person.name)
                                                                )}
                                                            </span>
                                                            <span className="min-w-0 flex-1">
                                                                <span className="block truncate text-sm font-medium text-ink">{person.name}</span>
                                                                <span className={`mt-1 inline-block rounded-md border px-1.5 py-0.5 text-[10px] font-semibold capitalize ${roleChip[person.role]}`}>
                                                                    {t(ROLE_LABEL_KEYS[person.role])}
                                                                </span>
                                                                {person.bio && (
                                                                    <span className="mt-1 block truncate text-xs text-muted">{previewBio(person.bio)}</span>
                                                                )}
                                                            </span>
                                                        </Link>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <p className="rounded-xl border border-line px-4 py-8 text-center text-sm text-muted">
                                            {query
                                                ? t(PEOPLE_EMPTY_QUERY_KEYS[roleFilter], { query })
                                                : t(PEOPLE_EMPTY_NONE_KEYS[roleFilter])}
                                        </p>
                                    )}

                                    {(page > 1 || hasMorePeople) && (
                                        <nav aria-label={t("search.pagination.peopleAria")} className="mt-5 flex items-center justify-center gap-4">
                                            {page > 1 ? (
                                                <Link
                                                    href={searchHref(query, roleFilter, page - 1)}
                                                    className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                                                >
                                                    <FiChevronLeft aria-hidden="true" />
                                                    {t("search.pagination.previous")}
                                                </Link>
                                            ) : <span />}
                                            <span aria-current="page" className="text-xs text-faint">{t("search.pagination.page", { page })}</span>
                                            {hasMorePeople ? (
                                                <Link
                                                    href={searchHref(query, roleFilter, page + 1)}
                                                    className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                                                >
                                                    {t("search.pagination.next")}
                                                    <FiChevronRight aria-hidden="true" />
                                                </Link>
                                            ) : <span />}
                                        </nav>
                                    )}
                                </div>
                            </SearchDisclosure>
                        </div>
                        <div className="search-directory-hint mt-4 flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-line/80 bg-surface/10 px-6 py-8 text-center">
                            <span className="grid size-11 place-items-center rounded-full border border-line bg-surface text-muted">
                                <FiSearch aria-hidden="true" />
                            </span>
                            <p className="mt-3 text-sm font-medium text-ink">
                                {query ? t("search.hint.ready") : t("search.hint.start")}
                            </p>
                            <p className="mt-1 max-w-sm text-xs leading-5 text-faint">
                                {query
                                    ? t("search.hint.readyDescription")
                                    : t("search.hint.startDescription")}
                            </p>
                        </div>
                    </div>
                )}
            </section>
        </>
    );
}
