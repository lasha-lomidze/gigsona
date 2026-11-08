import { PageTitle } from "@/components/ui/PageTitle";
import { SearchClientView, type PeopleRoleFilter, type SearchGroupItem, type SearchPersonItem } from "@/components/SearchClient";
import type { MessageKey } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import { groupMembers, groups, profiles } from "@/lib/schema";
import { and, asc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import type { Role } from "@/types/types";

type SearchPageProps = {
    searchParams: Promise<{
        q?: string | string[];
        role?: string | string[];
        page?: string | string[];
        groupPage?: string | string[];
    }>;
};

const PEOPLE_ROLES = ["student", "mentor", "assistant"] as const;

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

const PAGE_SIZE = 10;
const GROUP_PAGE_SIZE = 10;
const escapeLikeTerm = (term: string) => term.replace(/[\\%_]/g, "\\$&");

function getPage(value: string | string[] | undefined, pageSize: number) {
    const parsed = typeof value === "string" ? Number(value) : 1;
    return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= Math.floor(Number.MAX_SAFE_INTEGER / pageSize)
        ? parsed
        : 1;
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

    const peopleResults: SearchPersonItem[] = profileResults.map((profile) => ({
        id: profile.id,
        name: profile.name || [profile.firstName, profile.lastName].filter(Boolean).join(" ") || t("search.profile.unnamed"),
        role: profile.role,
        avatarId: profile.avatarId,
        bio: profile.bio,
    }));

    const visiblePeople = peopleResults.slice(0, PAGE_SIZE);
    const hasMorePeople = peopleResults.length > PAGE_SIZE;
    const visibleGroups: SearchGroupItem[] = groupResults.slice(0, GROUP_PAGE_SIZE);
    const hasMoreGroups = groupResults.length > GROUP_PAGE_SIZE;

    const groupCountLabel = `${visibleGroups.length}${hasMoreGroups ? "+" : ""} ${t(countLabelKey("group", visibleGroups.length, hasMoreGroups))}`;
    const peopleCountLabel = `${visiblePeople.length}${hasMorePeople ? "+" : ""} ${t(countLabelKey("person", visiblePeople.length, hasMorePeople))}`;

    const roleFilterOptions = ROLE_FILTERS.map((f) => ({
        value: f.value,
        label: t(f.labelKey),
    }));

    const roleLabels: Record<Role, string> = {
        anonymous: t(ROLE_LABEL_KEYS.anonymous),
        student: t(ROLE_LABEL_KEYS.student),
        mentor: t(ROLE_LABEL_KEYS.mentor),
        assistant: t(ROLE_LABEL_KEYS.assistant),
    };

    const emptyPeopleMessage = query
        ? t(PEOPLE_EMPTY_QUERY_KEYS[roleFilter], { query })
        : t(PEOPLE_EMPTY_NONE_KEYS[roleFilter]);

    return (
        <>
            <PageTitle title={t("search.meta.title")} description={t("search.meta.description")} />
            <SearchClientView
                query={query}
                roleFilter={roleFilter}
                page={page}
                groupPage={groupPage}
                pageSize={PAGE_SIZE}
                groupPageSize={GROUP_PAGE_SIZE}
                queryIsTooLong={queryIsTooLong}
                visibleGroups={visibleGroups}
                hasMoreGroups={hasMoreGroups}
                groupCountLabel={groupCountLabel}
                visiblePeople={visiblePeople}
                hasMorePeople={hasMorePeople}
                peopleCountLabel={peopleCountLabel}
                roleFilterOptions={roleFilterOptions}
                roleLabels={roleLabels}
                translations={{
                    inputPlaceholder: t("search.input.placeholder"),
                    inputAriaLabel: t("search.input.ariaLabel"),
                    inputSubmit: t("search.input.submit"),
                    clearAriaLabel: t("search.clear.ariaLabel"),
                    queryTooLong: t("search.validation.queryTooLong"),
                    emptyAllTitle: t("search.empty.all.title", { query }),
                    emptyAllDescription: t("search.empty.all.description"),
                    groupsTitle: t("search.sections.groups"),
                    peopleTitle: t("search.sections.people"),
                    groupOpenInOverview: t("search.group.openInOverview", { name: "{name}" }),
                    groupNoMentorAssigned: t("search.group.noMentorAssigned"),
                    groupOpen: t("search.group.open"),
                    groupEmptyWithQuery: t("search.group.empty.withQuery", { query }),
                    groupEmptyWithoutQuery: t("search.group.empty.withoutQuery"),
                    groupPaginationAria: t("search.pagination.groupsAria"),
                    peoplePaginationAria: t("search.pagination.peopleAria"),
                    previous: t("search.pagination.previous"),
                    next: t("search.pagination.next"),
                    pageLabel: t("search.pagination.page", { page: "{page}" }),
                    peopleFilterAria: t("search.people.filterAria"),
                    peopleEmpty: emptyPeopleMessage,
                    hintReady: t("search.hint.ready"),
                    hintStart: t("search.hint.start"),
                    hintReadyDescription: t("search.hint.readyDescription"),
                    hintStartDescription: t("search.hint.startDescription"),
                }}
            />
        </>
    );
}
