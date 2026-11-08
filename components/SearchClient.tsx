"use client";

import { useState, useTransition, useEffect, useRef, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { SearchDisclosure } from "@/components/SearchDisclosure";
import { AnimatedTabs } from "@/components/ui/AnimatedTabs";
import { getAvatarById } from "@/lib/avatars";
import { roleChip } from "@/lib/ui";
import { motionDuration, motionEase, transitions } from "@/components/ui/motion";
import type { Role } from "@/types/types";
import { FiChevronLeft, FiChevronRight, FiLayers, FiLoader, FiSearch, FiX } from "react-icons/fi";

export type PeopleRoleFilter = "all" | "student" | "mentor" | "assistant";

export type SearchGroupItem = {
    id: number;
    name: string;
    mentorName: string | null;
};

export type SearchPersonItem = {
    id: number;
    name: string;
    role: Role;
    avatarId: string | null;
    bio: string | null;
};

type RoleFilterOption = {
    value: PeopleRoleFilter;
    label: string;
};

type SearchClientViewProps = {
    query: string;
    roleFilter: PeopleRoleFilter;
    page: number;
    groupPage: number;
    pageSize: number;
    groupPageSize: number;
    queryIsTooLong: boolean;
    visibleGroups: SearchGroupItem[];
    hasMoreGroups: boolean;
    groupCountLabel: string;
    visiblePeople: SearchPersonItem[];
    hasMorePeople: boolean;
    peopleCountLabel: string;
    roleFilterOptions: RoleFilterOption[];
    roleLabels: Record<Role, string>;
    translations: {
        inputPlaceholder: string;
        inputAriaLabel: string;
        inputSubmit: string;
        clearAriaLabel: string;
        queryTooLong: string;
        emptyAllTitle: string;
        emptyAllDescription: string;
        groupsTitle: string;
        peopleTitle: string;
        groupOpenInOverview: string;
        groupNoMentorAssigned: string;
        groupOpen: string;
        groupEmptyWithQuery: string;
        groupEmptyWithoutQuery: string;
        groupPaginationAria: string;
        peoplePaginationAria: string;
        previous: string;
        next: string;
        pageLabel: string;
        peopleFilterAria: string;
        peopleEmpty: string;
        hintReady: string;
        hintStart: string;
        hintReadyDescription: string;
        hintStartDescription: string;
    };
};

function buildSearchUrl(query: string, role: PeopleRoleFilter, page = 1, groupPage = 1) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (role !== "all") params.set("role", role);
    if (page > 1) params.set("page", String(page));
    if (groupPage > 1) params.set("groupPage", String(groupPage));
    const search = params.toString();
    return search ? `/search?${search}` : "/search";
}

function initialsFor(name: string) {
    return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";
}

function previewBio(bio: string, maxLength = 80) {
    return bio.length > maxLength ? `${bio.slice(0, maxLength - 1).trimEnd()}…` : bio;
}

export function SearchClientView({
    query,
    roleFilter,
    page,
    groupPage,
    pageSize,
    groupPageSize,
    queryIsTooLong,
    visibleGroups,
    hasMoreGroups,
    groupCountLabel,
    visiblePeople,
    hasMorePeople,
    peopleCountLabel,
    roleFilterOptions,
    roleLabels,
    translations: t,
}: SearchClientViewProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // Section open states (groups, people)
    // Default open if query is present, or if role filter is set
    const [groupsOpen, setGroupsOpen] = useState(() => Boolean(query));
    const [peopleOpen, setPeopleOpen] = useState(() => Boolean(query) || roleFilter !== "all");

    // Search input state for instant debounced typing
    const [inputValue, setInputValue] = useState(query);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Sync input with external query if changed from navigation
    useEffect(() => {
        setInputValue(query);
    }, [query]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        };
    }, []);

    const navigateToSearch = (newQuery: string, newRole = roleFilter, newPage = 1, newGroupPage = 1) => {
        const nextUrl = buildSearchUrl(newQuery, newRole, newPage, newGroupPage);
        startTransition(() => {
            router.push(nextUrl, { scroll: false });
        });
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const nextVal = e.target.value;
        setInputValue(nextVal);

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            const trimmed = nextVal.trim();
            // Automatically expand both sections when starting a search
            if (trimmed && !groupsOpen && !peopleOpen) {
                setGroupsOpen(true);
                setPeopleOpen(true);
            }
            navigateToSearch(trimmed, roleFilter, 1, 1);
        }, 300);
    };

    const handleClear = () => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        setInputValue("");
        navigateToSearch("", roleFilter, 1, 1);
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        const trimmed = inputValue.trim();
        if (trimmed && !groupsOpen && !peopleOpen) {
            setGroupsOpen(true);
            setPeopleOpen(true);
        }
        navigateToSearch(trimmed, roleFilter, 1, 1);
    };

    const handleRoleTabClick = (role: PeopleRoleFilter) => {
        setPeopleOpen(true);
        navigateToSearch(inputValue.trim(), role, 1, groupPage);
    };

    const handlePagination = (type: "people" | "groups", targetPage: number) => {
        const q = inputValue.trim();
        if (type === "people") {
            setPeopleOpen(true);
            navigateToSearch(q, roleFilter, targetPage, groupPage);
        } else {
            setGroupsOpen(true);
            navigateToSearch(q, roleFilter, page, targetPage);
        }
    };

    const currentSearchUrl = buildSearchUrl(query, roleFilter, page, groupPage);
    const eitherSectionOpen = groupsOpen || peopleOpen;

    return (
        <section className="mx-auto flex min-h-[calc(100dvh-18rem)] max-w-4xl flex-col justify-center pb-8 md:min-h-[calc(100dvh-14rem)] md:pb-0">
            {/* Search Input Form */}
            <form onSubmit={handleSubmit} className="relative mb-5" role="search">
                <div className="relative">
                    <FiSearch
                        aria-hidden="true"
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint"
                    />
                    <input
                        type="search"
                        name="q"
                        value={inputValue}
                        onChange={handleInputChange}
                        maxLength={100}
                        placeholder={t.inputPlaceholder}
                        aria-label={t.inputAriaLabel}
                        className="field h-12 pl-11 pr-24"
                        autoComplete="off"
                    />
                    {isPending && (
                        <div className="absolute right-24 top-1/2 -translate-y-1/2 pointer-events-none">
                            <FiLoader aria-hidden="true" className="size-4 animate-spin text-accent" />
                        </div>
                    )}
                    {inputValue && (
                        <button
                            type="button"
                            onClick={handleClear}
                            aria-label={t.clearAriaLabel}
                            className="absolute right-14 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-faint transition hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                        >
                            <FiX aria-hidden="true" />
                        </button>
                    )}
                    <button
                        type="submit"
                        className="btn btn-primary absolute right-1 top-1/2 h-10 -translate-y-1/2 px-3"
                    >
                        <FiSearch aria-hidden="true" />
                        <span className="hidden sm:inline">{t.inputSubmit}</span>
                    </button>
                </div>
            </form>

            {/* Error or Empty State */}
            {queryIsTooLong ? (
                <p role="alert" className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
                    {t.queryTooLong}
                </p>
            ) : query && visibleGroups.length === 0 && visiblePeople.length === 0 && page === 1 && groupPage === 1 ? (
                <div className="rounded-xl border border-line px-5 py-10 text-center">
                    <FiSearch aria-hidden="true" className="mx-auto size-5 text-faint" />
                    <p className="mt-3 text-sm font-medium text-ink">{t.emptyAllTitle}</p>
                    <p className="mt-1 text-sm text-muted">{t.emptyAllDescription}</p>
                </div>
            ) : (
                <div className="search-directory flex flex-col gap-4">
                    {/* Disclosures Box */}
                    <div className="overflow-hidden rounded-xl border border-line divide-y divide-line bg-surface/20 transition-colors">
                        {/* GROUPS DISCLOSURE */}
                        <SearchDisclosure
                            section="groups"
                            title={t.groupsTitle}
                            count={groupCountLabel}
                            isOpen={groupsOpen}
                            onToggle={() => setGroupsOpen((prev) => !prev)}
                        >
                            <div className="border-t border-line p-3">
                                {visibleGroups.length > 0 ? (
                                    <ul className={`panel divide-y divide-line overflow-hidden transition-opacity duration-200 ${isPending ? "opacity-60" : "opacity-100"}`}>
                                        {visibleGroups.map((group) => (
                                            <li key={group.id}>
                                                <Link
                                                    href={`/?group=${group.id}#group-${group.id}`}
                                                    aria-label={t.groupOpenInOverview.replace("{name}", group.name)}
                                                    className="flex items-center justify-between gap-3 px-4 py-3 outline-none transition-colors hover:bg-surface/70 focus-visible:bg-surface/70 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/60"
                                                >
                                                    <span className="flex min-w-0 items-center gap-3">
                                                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
                                                            <FiLayers aria-hidden="true" className="size-4" />
                                                        </span>
                                                        <span className="min-w-0">
                                                            <span className="block truncate text-sm font-medium text-ink">{group.name}</span>
                                                            <span className="block truncate text-xs text-faint">{group.mentorName || t.groupNoMentorAssigned}</span>
                                                        </span>
                                                    </span>
                                                    <span className="shrink-0 text-xs text-accent">{t.groupOpen}</span>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="rounded-lg border border-line px-4 py-7 text-center text-sm text-muted">
                                        {query ? t.groupEmptyWithQuery : t.groupEmptyWithoutQuery}
                                    </p>
                                )}

                                {/* Groups Pagination */}
                                {(groupPage > 1 || hasMoreGroups) && (
                                    <nav aria-label={t.groupPaginationAria} className="mt-4 flex items-center justify-center gap-4">
                                        {groupPage > 1 ? (
                                            <button
                                                type="button"
                                                onClick={() => handlePagination("groups", groupPage - 1)}
                                                className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                                            >
                                                <FiChevronLeft aria-hidden="true" />
                                                {t.previous}
                                            </button>
                                        ) : <span />}
                                        <span className="text-xs text-faint">{t.pageLabel.replace("{page}", String(groupPage))}</span>
                                        {hasMoreGroups ? (
                                            <button
                                                type="button"
                                                onClick={() => handlePagination("groups", groupPage + 1)}
                                                className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                                            >
                                                {t.next}
                                                <FiChevronRight aria-hidden="true" />
                                            </button>
                                        ) : <span />}
                                    </nav>
                                )}
                            </div>
                        </SearchDisclosure>

                        {/* PEOPLE DISCLOSURE */}
                        <SearchDisclosure
                            section="people"
                            title={t.peopleTitle}
                            count={peopleCountLabel}
                            isOpen={peopleOpen}
                            onToggle={() => setPeopleOpen((prev) => !prev)}
                        >
                            <div className="border-t border-line p-3">
                                {/* Role Filter Tabs */}
                                <div className="mb-3 overflow-x-auto pb-1">
                                    <AnimatedTabs
                                        layoutId="search-role-tabs"
                                        ariaLabel={t.peopleFilterAria}
                                        pill
                                        items={roleFilterOptions.map((filter) => ({
                                            id: filter.value,
                                            label: filter.label,
                                            href: buildSearchUrl(query, filter.value, 1, groupPage),
                                            active: roleFilter === filter.value,
                                        }))}
                                    />
                                </div>

                                {visiblePeople.length > 0 ? (
                                    <ul className={`grid gap-2 sm:grid-cols-2 transition-opacity duration-200 ${isPending ? "opacity-60" : "opacity-100"}`}>
                                        {visiblePeople.map((person) => {
                                            const avatar = getAvatarById(person.avatarId);
                                            const profileUrl = `/profile/${person.id}?returnTo=${encodeURIComponent(currentSearchUrl)}`;
                                            return (
                                                <li key={person.id}>
                                                    <Link
                                                        href={profileUrl}
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
                                                                {roleLabels[person.role]}
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
                                        {t.peopleEmpty}
                                    </p>
                                )}

                                {/* People Pagination */}
                                {(page > 1 || hasMorePeople) && (
                                    <nav aria-label={t.peoplePaginationAria} className="mt-5 flex items-center justify-center gap-4">
                                        {page > 1 ? (
                                            <button
                                                type="button"
                                                onClick={() => handlePagination("people", page - 1)}
                                                className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                                            >
                                                <FiChevronLeft aria-hidden="true" />
                                                {t.previous}
                                            </button>
                                        ) : <span />}
                                        <span aria-current="page" className="text-xs text-faint">{t.pageLabel.replace("{page}", String(page))}</span>
                                        {hasMorePeople ? (
                                            <button
                                                type="button"
                                                onClick={() => handlePagination("people", page + 1)}
                                                className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                                            >
                                                {t.next}
                                                <FiChevronRight aria-hidden="true" />
                                            </button>
                                        ) : <span />}
                                    </nav>
                                )}
                            </div>
                        </SearchDisclosure>
                    </div>

                    {/* Smooth fading / collapsible "Start exploring" hint */}
                    <AnimatePresence initial={false}>
                        {!eitherSectionOpen && (
                            <motion.div
                                key="start-exploring-hint"
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{
                                    opacity: 1,
                                    height: "auto",
                                    marginTop: 8,
                                    transition: { duration: motionDuration.standard, ease: motionEase },
                                }}
                                exit={{
                                    opacity: 0,
                                    height: 0,
                                    marginTop: 0,
                                    transition: { duration: motionDuration.micro, ease: motionEase },
                                }}
                                className="overflow-hidden"
                            >
                                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line/80 bg-surface/10 px-6 py-6 text-center">
                                    <span className="grid size-9 place-items-center rounded-full border border-line bg-surface text-muted">
                                        <FiSearch aria-hidden="true" className="size-4" />
                                    </span>
                                    <p className="mt-2 text-sm font-medium text-ink">
                                        {query ? t.hintReady : t.hintStart}
                                    </p>
                                    <p className="mt-0.5 max-w-sm text-xs leading-relaxed text-faint">
                                        {query ? t.hintReadyDescription : t.hintStartDescription}
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </section>
    );
}
