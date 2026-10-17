"use client";

import { useActionState, useState } from "react";
import { FiActivity, FiLayers, FiLock, FiPlus, FiSearch, FiTrendingUp, FiUnlock, FiUserCheck, FiUsers, FiX } from "react-icons/fi";
import { assignRoleAction } from "@/app/admin/role-actions";
import { createGroupAction } from "@/app/admin/group-actions";
import { useT } from "@/lib/i18n/use-t";
import {
    initialState,
    filterGroups,
    roleConfig,
    rosterConfig,
    tabIds,
    tabConfig,
    type Account,
    type ActionState,
    type DirectoryView,
    type Group,
    type Person,
    type RoleTab,
    type ScoringDay,
} from "./admin/config";
import { GroupOwnerEditor } from "./admin/GroupOwnerEditor";
import { PersonActions } from "./admin/PersonActions";
import { Feedback, Field, fieldClass, selectClass } from "./admin/shared";

export function AdminWorkspace({
    accounts,
    mentors,
    assistants,
    students,
    groups,
    scoringTrend,
    canManageMentorsAndGroups,
}: {
    accounts: Account[];
    mentors: Person[];
    assistants: Person[];
    students: Person[];
    groups: Group[];
    scoringTrend: ScoringDay[];
    canManageMentorsAndGroups: boolean;
}) {
    const [activeTab, setActiveTab] = useState<RoleTab>("students");
    const [mode, setMode] = useState<"existing" | "reserve">("existing");
    const [directoryView, setDirectoryView] = useState<DirectoryView>("roster");
    const [rosterStatus, setRosterStatus] = useState<"active" | "inactive">("active");
    const [search, setSearch] = useState("");
    const [accountSearch, setAccountSearch] = useState("");
    const [assistantGroupSearch, setAssistantGroupSearch] = useState("");
    const [selectedUserId, setSelectedUserId] = useState("");
    const assignRoleAndClearSelection = async (previousState: ActionState, formData: FormData) => {
        const result = await assignRoleAction(previousState, formData);
        if (result.status === "success") {
            setSelectedUserId("");
            setAccountSearch("");
        }
        return result;
    };
    const [roleState, roleAction, rolePending] = useActionState(assignRoleAndClearSelection, initialState);
    const [groupState, groupAction, groupPending] = useActionState(createGroupAction, initialState);

    const currentRole = tabConfig[activeTab].role;
    const personRole = currentRole ?? "student";
    const people = activeTab === "students" ? students : activeTab === "assistants" ? assistants : mentors;
    const normalizedSearch = search.trim().toLowerCase();
    const filteredPeople = people.filter((person) =>
        person.status === rosterStatus && [person.name, person.email, person.groupName, ...(person.groupNames ?? [])]
            .some((value) => value?.toLowerCase().includes(normalizedSearch)),
    );
    const activePeopleCount = people.filter((person) => person.status === "active").length;
    const inactivePeopleCount = people.filter((person) => person.status === "inactive").length;
    const activeMentors = mentors.filter((mentor) => mentor.status === "active");
    const activeStudents = students.filter((student) => student.status === "active");
    const activeAssistants = assistants.filter((assistant) => assistant.status === "active");
    const groupComposition = groups.map((group) => ({
        ...group,
        studentCount: activeStudents.filter((student) => student.groupId === group.id).length,
        assistantCount: activeAssistants.filter((assistant) => assistant.groupIds?.includes(group.id)).length,
    }));
    const maxGroupSize = Math.max(1, ...groupComposition.map((group) => group.studentCount + group.assistantCount));
    const groupsWithMembersCount = groupComposition.filter((group) => group.studentCount + group.assistantCount > 0).length;
    const emptyGroupCount = groupComposition.length - groupsWithMembersCount;
    const maxAuraTotal = Math.max(1, ...scoringTrend.map((day) => Math.abs(day.total)));
    const hasRecentScores = scoringTrend.some((day) => day.total !== 0);
    const t = useT();
    const highestScoringDay = scoringTrend
        .filter((day) => day.total !== 0)
        .reduce<ScoringDay | null>((highest, day) => !highest || day.total > highest.total ? day : highest, null);
    const filteredGroups = groups.filter((group) =>
        [group.name, group.mentorName].some((value) => value?.toLowerCase().includes(normalizedSearch)),
    );
    const normalizedAccountSearch = accountSearch.trim().toLowerCase();
    const filteredAccounts = accounts.filter((account) =>
        [account.name, account.email].some((value) => value.toLowerCase().includes(normalizedAccountSearch)),
    ).sort((first, second) => {
        if (!normalizedAccountSearch) return 0;
        const score = (account: Account) => {
            const values = [account.name, account.email].map((value) => value.toLowerCase());
            return values.some((value) => value === normalizedAccountSearch) ? 0
                : values.some((value) => value.startsWith(normalizedAccountSearch)) ? 1
                    : 2;
        };
        return score(first) - score(second);
    });
    const matchingAssistantGroups = filterGroups(groups, assistantGroupSearch);
    const matchingAssistantGroupIds = new Set(matchingAssistantGroups.map((group) => group.id));
    const filteredDirectoryAccounts = accounts.filter((account) =>
        [account.name, account.email].some((value) => value.toLowerCase().includes(normalizedSearch)),
    );
    const selectedAccount = accounts.find((account) => account.id === selectedUserId);
    const directoryRecordCount = directoryView === "accounts"
        ? filteredDirectoryAccounts.length
        : activeTab === "groups"
            ? filteredGroups.length
            : filteredPeople.length;
    const directoryTotalCount = directoryView === "accounts"
        ? accounts.length
        : activeTab === "groups"
            ? groups.length
            : people.filter((person) => person.status === rosterStatus).length;

    return (
        <div className="space-y-7 pb-12">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                    { label: t("admin.stats.activeStudents"), value: activeStudents.length, detail: t("admin.stats.inactiveCount", { count: students.length - activeStudents.length }), icon: FiUsers },
                    { label: t("admin.stats.activeAssistants"), value: activeAssistants.length, detail: t("admin.stats.inactiveCount", { count: assistants.length - activeAssistants.length }), icon: FiUserCheck },
                    { label: t("admin.stats.activeMentors"), value: activeMentors.length, detail: t("admin.stats.inactiveCount", { count: mentors.length - activeMentors.length }), icon: FiActivity },
                    { label: t(tabConfig.groups.labelKey), value: groups.length, detail: t("admin.stats.withActiveMembers", { count: groupsWithMembersCount }), icon: FiLayers },
                ].map((stat) => (
                    <div key={stat.label} className="group relative overflow-hidden rounded-2xl border border-line bg-linear-to-br from-surface to-canvas p-4 transition-colors hover:border-accent/25 sm:p-5">
                        <div aria-hidden="true" className="pointer-events-none absolute -right-6 -top-7 size-20 rounded-full bg-accent/5 blur-2xl transition-colors group-hover:bg-accent/10" />
                        <div className="relative flex items-center justify-between gap-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">{stat.label}</p>
                            <span className="grid size-8 shrink-0 place-items-center rounded-xl border border-accent/15 bg-accent/5 text-accent">
                                <stat.icon aria-hidden="true" className="size-4" />
                            </span>
                        </div>
                        <p className="relative mt-3 text-3xl font-semibold tabular-nums tracking-tight text-ink">{stat.value}</p>
                        <p className="relative mt-1 truncate text-[11px] text-faint">{stat.detail}</p>
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line">
                <div className="flex max-w-full gap-1 overflow-x-auto" role="tablist" aria-label={t("admin.tabs.ariaLabel")}>
                    {tabIds.filter((tab) => canManageMentorsAndGroups || (tab !== "mentors" && tab !== "groups")).map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            role="tab"
                            aria-selected={activeTab === tab}
                            onClick={() => {
                                if (tab !== activeTab) {
                                    setSelectedUserId("");
                                    setAccountSearch("");
                                }
                                setActiveTab(tab);
                                setSearch("");
                                setAssistantGroupSearch("");
                            }}
                            className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm transition ${activeTab === tab ? "border-lime-400 text-accent" : "border-transparent text-faint hover:text-ink"}`}
                        >
                            {t(tabConfig[tab].labelKey)}
                        </button>
                    ))}
                </div>
                <div className="relative mb-2 flex w-full items-center sm:w-64">
                    <FiSearch aria-hidden="true" className="pointer-events-none absolute left-3 text-faint" />
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder={directoryView === "accounts" ? t("admin.search.accountsPlaceholder") : t(tabConfig[activeTab].searchPlaceholderKey)}
                        aria-label={directoryView === "accounts" ? t("admin.search.accountsAria") : t(tabConfig[activeTab].searchAriaKey)}
                        className={`${fieldClass} pl-9 ${search ? "pr-9" : ""}`}
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch("")}
                            aria-label={t("admin.search.clear")}
                            className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-faint transition hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                        >
                            <FiX aria-hidden="true" className="size-4" />
                        </button>
                    )}
                </div>
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(270px,0.78fr)_minmax(0,1.35fr)]">
                <section className="rounded-lg border border-line bg-canvas/65 p-4 sm:p-5">
                    {currentRole ? (
                        <>
                            <div className="mb-5 flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-base font-semibold text-ink">{t(roleConfig[currentRole].headingKey)}</h2>
                                    <p className="mt-1 text-xs leading-5 text-faint">{t("admin.assign.description")}</p>
                                </div>
                                <FiUsers aria-hidden="true" className="mt-0.5 shrink-0 text-accent" />
                            </div>

                            <div className="mb-5 grid grid-cols-2 rounded-md border border-line p-1" aria-label={t("admin.assign.method")}>
                                <button type="button" onClick={() => setMode("existing")} className={`rounded px-2 py-2 text-xs font-medium transition ${mode === "existing" ? "bg-line text-ink" : "text-faint hover:text-ink"}`}>
                                    {t("admin.assign.linkAccount")}
                                </button>
                                <button type="button" onClick={() => setMode("reserve")} className={`rounded px-2 py-2 text-xs font-medium transition ${mode === "reserve" ? "bg-line text-ink" : "text-faint hover:text-ink"}`}>
                                    {t("admin.assign.reserveProfile")}
                                </button>
                            </div>

                            <form action={roleAction} className="space-y-4">
                                <input type="hidden" name="role" value={currentRole} />
                                <input type="hidden" name="mode" value={mode} />
                                {mode === "existing" ? (
                                    <div key="existing-account-fields">
                                        <Field label={t("admin.assign.findAnonymousAccount")}>
                                            <span className="relative block">
                                            <input
                                                type="search"
                                                value={accountSearch}
                                                onChange={(event) => setAccountSearch(event.target.value)}
                                                placeholder={t("admin.assign.nameOrEmail")}
                                                className={`${fieldClass} ${accountSearch ? "pr-10" : ""}`}
                                            />
                                                {accountSearch && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setAccountSearch("")}
                                                        aria-label={t("admin.search.clear")}
                                                        className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-faint transition hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                                                    >
                                                        <FiX aria-hidden="true" className="size-4" />
                                                    </button>
                                                )}
                                            </span>
                                        </Field>
                                        <input type="hidden" name="userId" value={selectedUserId} />
                                        {selectedAccount ? (
                                            <div className="flex items-center justify-between gap-3 rounded-md border border-accent/30 bg-accent/5 px-3 py-2.5">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium text-ink">{selectedAccount.name}</p>
                                                    <p className="truncate text-xs text-faint">{selectedAccount.email}</p>
                                                </div>
                                                <button type="button" onClick={() => setSelectedUserId("")} className="shrink-0 text-xs text-muted transition hover:text-ink">{t("admin.common.change")}</button>
                                            </div>
                                        ) : (
                                            <div className="max-h-52 space-y-1 overflow-y-auto">
                                                {filteredAccounts.slice(0, 6).map((account) => (
                                                    <button key={account.id} type="button" onClick={() => setSelectedUserId(account.id)} className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70">
                                                        <span className="min-w-0">
                                                            <span className="block truncate text-sm text-ink">{account.name}</span>
                                                            <span className="block truncate text-xs text-faint">{account.email}</span>
                                                        </span>
                                                        <span className="shrink-0 text-xs font-medium text-accent">{t("admin.common.select")}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {filteredAccounts.length === 0 && (
                                            <p className="text-xs text-faint">{t("admin.assign.noAnonymousAccounts")}</p>
                                        )}
                                        {filteredAccounts.length > 0 && !selectedAccount && (
                                            <p aria-live="polite" className="mt-1 text-xs text-faint">
                                                {t("admin.assign.matchCount", { count: filteredAccounts.length })}
                                            </p>
                                        )}
                                        {filteredAccounts.length > 6 && !selectedAccount && (
                                            <p className="text-xs text-faint">{t("admin.assign.showingMatches")}</p>
                                        )}
                                    </div>
                                ) : (
                                    <div key="reserved-profile-fields">
                                        <Field label={t("admin.assign.fullName")}>
                                            <input name="name" required minLength={2} autoComplete="name" placeholder={t("admin.assign.fullNamePlaceholder")} className={fieldClass} />
                                        </Field>
                                        <Field label={t("admin.assign.emailForSignupMatching")}>
                                            <input name="email" type="email" required autoComplete="email" placeholder={t("admin.assign.emailPlaceholder")} className={fieldClass} />
                                        </Field>
                                    </div>
                                )}

                                {currentRole === "student" && (
                                    <Field label={t("admin.assign.groupOptional")}>
                                        <select name="groupId" defaultValue="" className={selectClass}>
                                            <option value="">{t("admin.assign.noGroupYet")}</option>
                                            {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
                                        </select>
                                    </Field>
                                )}
                                {canManageMentorsAndGroups && currentRole === "assistant" && (
                                    <>
                                        <fieldset>
                                            <legend className="text-xs font-medium text-muted">{t("admin.assign.groupsOptional")}</legend>
                                            <input type="hidden" name="groupIds" value="" />
                                            {(groups.length > 6 || assistantGroupSearch) && (
                                                <input
                                                    type="search"
                                                    value={assistantGroupSearch}
                                                    onChange={(event) => setAssistantGroupSearch(event.target.value)}
                                                    placeholder={t("admin.common.searchGroupsPlaceholder")}
                                                    aria-label={t("admin.assign.searchAssistantGroupsAria")}
                                                    className={fieldClass}
                                                />
                                            )}
                                            <div className="mt-1.5 max-h-32 space-y-1 overflow-y-auto rounded-md border border-line bg-canvas p-2">
                                                {groups.map((group) => (
                                                    <label key={group.id} hidden={!matchingAssistantGroupIds.has(group.id)} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs text-muted hover:bg-surface">
                                                        <input type="checkbox" name="groupIds" value={group.id} className="accent-lime-300" />
                                                        {group.name}
                                                    </label>
                                                ))}
                                                {groups.length === 0 && <p className="px-2 py-1 text-xs text-faint">{t("admin.common.createGroupFirst")}</p>}
                                                {groups.length > 0 && matchingAssistantGroups.length === 0 && <p className="px-2 py-1 text-xs text-faint">{t("admin.common.noGroupsMatch")}</p>}
                                            </div>
                                        </fieldset>
                                    </>
                                )}

                                <button type="submit" disabled={rolePending || (mode === "existing" && (!selectedUserId || !selectedAccount))} className="btn btn-primary h-11 w-full">
                                    {rolePending ? t("admin.common.saving") : <><FiPlus aria-hidden="true" /> {mode === "existing" ? t("admin.assign.assignRole") : t("admin.assign.reserveProfile")}</>}
                                </button>
                                <Feedback state={roleState} />
                            </form>
                        </>
                    ) : (
                        <>
                            <div className="mb-5 flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-base font-semibold text-ink">{t("admin.common.createGroup")}</h2>
                                    <p className="mt-1 text-xs leading-5 text-faint">{t("admin.groupCreate.description")}</p>
                                </div>
                                <FiLayers aria-hidden="true" className="mt-0.5 shrink-0 text-accent" />
                            </div>
                            <form action={groupAction} className="space-y-4">
                                <Field label={t("admin.common.groupName")}>
                                    <input name="name" required minLength={2} placeholder={t("admin.groupCreate.groupNamePlaceholder")} className={fieldClass} />
                                </Field>
                                <Field label={t("admin.groupCreate.initialOwner")}>
                                    <select name="mentorId" required defaultValue="" className={selectClass}>
                                        <option value="" disabled>{t("admin.groupCreate.selectMentor")}</option>
                                        {activeMentors.map((mentor) => <option key={mentor.id} value={mentor.id}>{mentor.name || t("admin.common.unnamedMentor")}</option>)}
                                    </select>
                                </Field>
                                <fieldset className="min-w-0">
                                    <legend className="text-xs font-medium text-muted">{t("admin.groupCreate.access")}</legend>
                                    <div className="mt-1.5 grid grid-cols-2 gap-2" role="radiogroup" aria-label={t("admin.groupCreate.access")}>
                                        <label className="group/access relative flex min-h-14 cursor-pointer items-center gap-3 rounded-md border border-line bg-canvas px-3 transition duration-200 hover:border-accent/40 has-checked:border-accent/70 has-checked:bg-accent/7 has-checked:text-lime-200">
                                            <input className="peer sr-only" type="radio" name="accessMode" value="free" defaultChecked />
                                            <FiUnlock aria-hidden="true" className="shrink-0 text-lg text-faint transition-transform duration-300 group-hover/access:-rotate-12 peer-checked:scale-110 peer-checked:text-accent" />
                                            <span className="min-w-0">
                                                <span className="block text-sm font-medium text-ink">{t("admin.common.free")}</span>
                                                <span className="block text-[11px] text-faint">{t("admin.groupCreate.openAccess")}</span>
                                            </span>
                                            <span className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-transparent transition peer-focus-visible:ring-accent/70" />
                                        </label>
                                        <label className="group/access relative flex min-h-14 cursor-pointer items-center gap-3 rounded-md border border-line bg-canvas px-3 transition duration-200 hover:border-danger/40 has-checked:border-danger/70 has-checked:bg-danger/7">
                                            <input className="peer sr-only" type="radio" name="accessMode" value="locked" />
                                            <FiLock aria-hidden="true" className="shrink-0 text-lg text-faint transition-transform duration-300 group-hover/access:-rotate-12 peer-checked:scale-110 peer-checked:text-danger" />
                                            <span className="min-w-0">
                                                <span className="block text-sm font-medium text-ink">{t("admin.common.locked")}</span>
                                                <span className="block text-[11px] text-faint">{t("admin.groupCreate.restrictedAccess")}</span>
                                            </span>
                                            <span className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-transparent transition peer-focus-visible:ring-danger/70" />
                                        </label>
                                    </div>
                                </fieldset>
                                <button type="submit" disabled={groupPending || activeMentors.length === 0} className="btn btn-primary h-11 w-full">
                                    {groupPending ? t("admin.common.creating") : <><FiPlus aria-hidden="true" /> {t("admin.common.createGroup")}</>}
                                </button>
                                {activeMentors.length === 0 && <p className="text-xs text-faint">{t("admin.groupCreate.noMentors")}</p>}
                                <Feedback state={groupState} />
                            </form>
                        </>
                    )}
                </section>

                <section aria-live="polite" className="min-w-0">
                    <div className="mb-3 flex items-baseline justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                            <h2 className="truncate text-sm font-semibold text-ink">{directoryView === "roster" ? t(tabConfig[activeTab].labelKey) : t("admin.directory.unassignedAccounts")}</h2>
                            <div className="flex shrink-0 items-center rounded border border-line p-0.5">
                                <button type="button" onClick={() => { setDirectoryView("roster"); setRosterStatus("active"); setSearch(""); }} aria-pressed={directoryView === "roster"} className={`rounded px-2 py-1 text-[11px] transition ${directoryView === "roster" ? "bg-line text-ink" : "text-faint hover:text-ink"}`}>{t("admin.directory.roster")}</button>
                                <button type="button" onClick={() => { setDirectoryView("accounts"); setSearch(""); }} aria-pressed={directoryView === "accounts"} className={`rounded px-2 py-1 text-[11px] transition ${directoryView === "accounts" ? "bg-line text-ink" : "text-faint hover:text-ink"}`}>{t("admin.directory.unassigned")}</button>
                            </div>
                        </div>
                        <span className="text-xs tabular-nums text-faint">
                            {normalizedSearch
                                ? t("admin.directory.filteredRecords", { count: directoryRecordCount, total: directoryTotalCount })
                                : t("admin.directory.records", { count: directoryRecordCount })}
                        </span>
                    </div>

                    {directoryView === "accounts" ? (
                        <div
                            role="region"
                            aria-label={t("admin.directory.unassignedAccounts")}
                            tabIndex={0}
                            className="max-h-[min(60vh,32rem)] divide-y divide-line overflow-y-auto overscroll-contain border-y border-line pr-1 focus-visible:ring-2 focus-visible:ring-accent/70"
                        >
                            {currentRole && (
                                <p className="border-b border-line bg-canvas/50 px-3 py-2 text-xs text-faint">
                                    {t(roleConfig[currentRole].instructionsKey)}
                                </p>
                            )}
                            {!currentRole && <p className="border-b border-line bg-canvas/50 px-3 py-2 text-xs text-faint">{t("admin.assign.roleFirst")}</p>}
                            {filteredDirectoryAccounts.map((account) => (
                                <article key={account.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full border border-amber-300/20 bg-amber-300/5 text-[11px] font-semibold uppercase text-amber-200">
                                            {account.name.slice(0, 1)}
                                        </span>
                                        <div className="min-w-0">
                                            <h3 className="truncate text-sm font-medium text-ink">{account.name}</h3>
                                            <p className="truncate text-xs text-faint">{account.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="rounded-sm bg-amber-300/10 px-2 py-1 text-[10px] font-medium text-amber-200">{t("admin.assign.notLinked")}</span>
                                        {currentRole && <button type="button" onClick={() => { setMode("existing"); setSelectedUserId(account.id); setAccountSearch(account.email); }} className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition ${selectedUserId === account.id ? "border-accent/40 bg-accent/10 text-lime-200" : "border-line text-muted hover:border-accent/50 hover:text-lime-200"}`}>{selectedUserId === account.id ? t("admin.common.selected") : t(roleConfig[currentRole].useAsRoleKey)}</button>}
                                    </div>
                                </article>
                            ))}
                            {filteredDirectoryAccounts.length === 0 && <p className="py-8 text-sm text-faint">{t("admin.assign.noUnassignedAccounts")}</p>}
                        </div>
                    ) : activeTab === "groups" ? (
                        <div
                            role="region"
                            aria-label={t(tabConfig.groups.labelKey)}
                            tabIndex={0}
                            className="max-h-[min(60vh,32rem)] divide-y divide-line overflow-y-auto overscroll-contain border-y border-line pr-1 focus-visible:ring-2 focus-visible:ring-accent/70"
                        >
                            {filteredGroups.map((group) => {
                                const studentCount = students.filter((student) => student.status === "active" && student.groupId === group.id).length;
                                const assistantCount = assistants.filter((assistant) => assistant.status === "active" && assistant.groupIds?.includes(group.id)).length;
                                return <GroupOwnerEditor key={group.id} group={group} mentors={mentors} studentCount={studentCount} assistantCount={assistantCount} />;
                            })}
                            {filteredGroups.length === 0 && <p className="py-8 text-sm text-faint">{t(normalizedSearch ? "admin.directory.noGroupsMatchSearch" : "admin.directory.noGroupsFound")}</p>}
                        </div>
                    ) : (
                        <>
                            <div className="mb-2 flex gap-1" role="group" aria-label={t("admin.directory.profileStatusFilter")}>
                                <button type="button" onClick={() => setRosterStatus("active")} aria-pressed={rosterStatus === "active"} className={`rounded px-2.5 py-1.5 text-xs transition ${rosterStatus === "active" ? "bg-line text-ink" : "text-faint hover:text-ink"}`}>{t("labels.status.active")} {activePeopleCount}</button>
                                <button type="button" onClick={() => setRosterStatus("inactive")} aria-pressed={rosterStatus === "inactive"} className={`rounded px-2.5 py-1.5 text-xs transition ${rosterStatus === "inactive" ? "bg-line text-ink" : "text-faint hover:text-ink"}`}>{t("labels.status.inactive")} {inactivePeopleCount}</button>
                            </div>
                            <div
                                role="region"
                                aria-label={t(rosterConfig[rosterStatus][activeTab].regionKey)}
                                tabIndex={0}
                                className="max-h-[min(60vh,32rem)] divide-y divide-line overflow-y-auto overscroll-contain border-y border-line pr-1 focus-visible:ring-2 focus-visible:ring-accent/70"
                            >
                                {filteredPeople.map((person) => (
                                    <PersonActions
                                        key={`${person.id}-${person.status}-${person.groupId ?? "none"}-${personRole}`}
                                        person={person}
                                        role={personRole}
                                        groups={groups}
                                        canManageMentorsAndGroups={canManageMentorsAndGroups}
                                    />
                                ))}
                                {filteredPeople.length === 0 && <p className="py-8 text-sm text-faint">{t(normalizedSearch ? "admin.directory.noPeopleMatchSearch" : rosterConfig[rosterStatus][activeTab].emptyKey)}</p>}
                            </div>
                        </>
                    )}
                </section>
            </div>

            <section aria-labelledby="academy-insights-title" className="relative overflow-hidden rounded-3xl border border-line bg-linear-to-br from-surface/90 via-canvas to-surface/40 p-4 sm:p-6">
                <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-32 size-80 rounded-full bg-accent/5 blur-3xl" />
                <div className="relative mb-5 flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">{t("admin.insights.eyebrow")}</p>
                        <h2 id="academy-insights-title" className="mt-1 text-lg font-semibold tracking-tight text-ink">{t("admin.insights.title")}</h2>
                    </div>
                    <p className="text-xs text-faint">{t("admin.insights.subtitle")}</p>
                </div>

                <div className="relative grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                    <figure className="min-w-0 rounded-2xl border border-line/80 bg-canvas/60 p-4 sm:p-5">
                        <figcaption className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <span className="text-sm font-semibold text-ink">{t("admin.insights.peopleByGroup")}</span>
                                <p className="mt-1 text-[11px] text-faint">{t("admin.insights.peopleByGroupDescription")}</p>
                            </div>
                            <span className="rounded-full border border-line bg-surface px-2.5 py-1 text-[10px] tabular-nums text-muted">
                                {t("admin.insights.activeMembersSummary", { active: groupsWithMembersCount, total: groups.length })}
                            </span>
                        </figcaption>
                        {groupComposition.length > 0 ? (
                            <div className="mt-5 space-y-4">
                                {groupComposition.map((group) => {
                                    const total = group.studentCount + group.assistantCount;
                                    return (
                                        <div key={group.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2">
                                            <span className="truncate text-xs font-medium text-muted" title={group.name}>{group.name}</span>
                                            <span className="text-right text-xs font-semibold tabular-nums text-ink">{total}</span>
                                            <span
                                                role="img"
                                                aria-label={t("admin.insights.groupBarAria", { name: group.name, students: group.studentCount, assistants: group.assistantCount })}
                                                title={t("admin.insights.groupBarTitle", { students: group.studentCount, assistants: group.assistantCount })}
                                                className="col-span-2 flex h-2 overflow-hidden rounded-full bg-surface-2"
                                            >
                                                <span className="h-full rounded-full bg-linear-to-r from-lime-300 to-accent transition-[width] duration-500" style={{ width: `${group.studentCount / maxGroupSize * 100}%` }} />
                                                <span className="h-full bg-cyan-300 transition-[width] duration-500" style={{ width: `${group.assistantCount / maxGroupSize * 100}%` }} />
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : <p className="mt-6 rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-faint">{t("admin.insights.groupMembershipEmpty")}</p>}
                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                            <div className="flex gap-4 text-[10px] text-faint">
                                <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-sm bg-accent" /> {t(tabConfig.students.labelKey)}</span>
                                <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-sm bg-cyan-300" /> {t(tabConfig.assistants.labelKey)}</span>
                            </div>
                            {groups.length > 0 && (
                                <p className={`text-[10px] ${emptyGroupCount > 0 ? "text-amber-200" : "text-ok"}`}>
                                    {emptyGroupCount > 0
                                        ? t(emptyGroupCount === 1 ? "admin.insights.emptyGroupsOne" : "admin.insights.emptyGroupsOther", { count: emptyGroupCount })
                                        : t("admin.insights.everyGroupActive")}
                                </p>
                            )}
                        </div>
                    </figure>

                    <figure className="min-w-0 rounded-2xl border border-line/80 bg-canvas/60 p-4 sm:p-5">
                        <figcaption className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <span className="text-sm font-semibold text-ink">{t("admin.insights.dailySavedAura")}</span>
                                <p className="mt-1 text-[11px] text-faint">{t("admin.insights.dailySavedAuraDescription")}</p>
                            </div>
                            {highestScoringDay && (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/15 bg-accent/5 px-2.5 py-1 text-[10px] text-lime-100">
                                    <FiTrendingUp aria-hidden="true" className="size-3" />
                                    {t("admin.insights.highest")} · {highestScoringDay.label} · {highestScoringDay.total}
                                </span>
                            )}
                        </figcaption>
                        {hasRecentScores ? (
                            <div
                                role="img"
                                aria-label={t("admin.insights.trendAria", { summary: scoringTrend.map((day) => `${day.label}, ${day.total}`).join("; ") })}
                                className="mt-5"
                            >
                                <div className="relative h-36 rounded-xl border border-line/70 bg-linear-to-b from-surface/70 to-canvas/40 px-1">
                                    <div className="absolute inset-x-2 top-1/2 border-t border-dashed border-neutral-700" />
                                    <div className="absolute inset-0 grid grid-cols-7 gap-1 px-1">
                                        {scoringTrend.map((day) => {
                                            const magnitude = day.total === 0 ? 0 : Math.max(3, Math.abs(day.total) / maxAuraTotal * 38);
                                            return (
                                                <span key={day.date} title={t("admin.insights.trendBarTitle", { date: day.label, total: day.total })} className="relative flex min-w-0 justify-center">
                                                    {magnitude > 0 && (
                                                        <>
                                                            <span
                                                                aria-hidden="true"
                                                                className={`absolute w-[52%] min-w-2 max-w-6 transition-[height,background-color] duration-300 ${day.total > 0 ? "rounded-t-md bg-linear-to-t from-accent/55 to-lime-200" : "rounded-b-md bg-linear-to-b from-rose-300/75 to-rose-400/35"}`}
                                                                style={{ height: `${magnitude}%`, top: day.total > 0 ? `${50 - magnitude}%` : "50%" }}
                                                            />
                                                            <span
                                                                className={`absolute z-10 text-[9px] font-semibold tabular-nums ${day.total > 0 ? "text-lime-100" : "text-rose-200"}`}
                                                                style={{ top: day.total > 0 ? `${Math.max(1, 50 - magnitude - 15)}%` : `${Math.min(89, 50 + magnitude + 2)}%` }}
                                                            >
                                                                {day.total}
                                                            </span>
                                                        </>
                                                    )}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="mt-2 grid grid-cols-7 gap-1 text-[9px] tabular-nums text-faint sm:text-[10px]">
                                    {scoringTrend.map((day) => <span key={day.date} className="truncate text-center">{day.label}</span>)}
                                </div>
                                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3 text-[10px] text-faint">
                                    <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-sm bg-accent" /> {t("admin.insights.positiveScore")}</span>
                                    <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-sm bg-rose-300" /> {t("admin.insights.negativeScore")}</span>
                                    <span className="ml-auto">{t("admin.insights.zeroDaysNoBar")}</span>
                                </div>
                            </div>
                        ) : <p className="mt-5 flex h-36 items-center justify-center rounded-xl border border-dashed border-line px-4 text-center text-sm text-faint">{t("admin.insights.noRecentScores")}</p>}
                    </figure>
                </div>
            </section>
        </div>
    );
}