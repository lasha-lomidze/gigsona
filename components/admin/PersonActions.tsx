"use client";

import { useActionState, useState } from "react";
import { FiEdit2, FiUserCheck, FiUserX, FiX } from "react-icons/fi";
import { changeProfileRoleAction, setProfileStatusAction } from "@/app/admin/role-actions";
import { useT } from "@/lib/i18n/use-t";
import {
    filterGroups,
    initialState,
    roleLabelKeys,
    statusLabelKeys,
    type AdminRole,
    type Group,
    type Person,
} from "./config";
import { Feedback, Field, fieldClass, selectClass } from "./shared";

interface PersonActionsProps {
    person: Person;
    role: AdminRole;
    groups: Group[];
    canManageMentorsAndGroups: boolean;
}

export function PersonActions({
    person,
    role,
    groups,
    canManageMentorsAndGroups,
}: PersonActionsProps) {
    const [open, setOpen] = useState(false);
    const [confirmDeactivate, setConfirmDeactivate] = useState(false);
    const [nextRole, setNextRole] = useState<AdminRole>(role);
    const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>(
        person.groupIds ?? (person.groupId ? [person.groupId] : []),
    );
    const [groupSearch, setGroupSearch] = useState("");
    const [roleState, roleAction, rolePending] = useActionState(changeProfileRoleAction, initialState);
    const [statusState, statusAction, statusPending] = useActionState(setProfileStatusAction, initialState);
    const matchingGroups = filterGroups(groups, groupSearch);
    const matchingGroupIds = new Set(matchingGroups.map((group) => group.id));
    const t = useT();

    return (
        <article className={`rounded-md border px-4 py-3 transition-colors ${person.status === "inactive" ? "border-danger/15 bg-danger/3" : "border-line bg-canvas/45 hover:border-line"}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <span aria-hidden="true" className={`grid size-9 shrink-0 place-items-center rounded-full border text-xs font-semibold uppercase ${person.status === "inactive" ? "border-danger/20 bg-danger/5 text-danger" : "border-accent/20 bg-accent/5 text-lime-200"}`}>
                        {(person.name || "?").slice(0, 1)}
                    </span>
                    <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-ink">{person.name || t("admin.person.unnamedProfile")}</h3>
                        <p className="mt-0.5 truncate text-xs text-faint">{person.email || t("admin.person.noEmail")}</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                    {person.groupName && <span className="hidden rounded-sm border border-line px-2 py-1 text-[11px] text-muted sm:inline-flex">{person.groupName}</span>}
                    <span className={`rounded-sm px-2 py-1 text-[11px] font-medium ${person.status === "inactive" ? "bg-danger/10 text-danger" : "bg-ok/10 text-ok"}`}>
                        {t(statusLabelKeys[person.status])}
                    </span>
                    <span className={`hidden rounded-sm px-2 py-1 text-[11px] sm:inline-flex ${person.userId ? "bg-line text-muted" : "bg-amber-300/10 text-amber-200"}`}>
                        {person.userId ? t("admin.person.accountLinked") : t("admin.person.awaitingSignup")}
                    </span>
                    <button
                        type="button"
                        aria-expanded={open}
                        onClick={() => { setOpen(!open); setConfirmDeactivate(false); }}
                        className={`inline-flex h-8 items-center gap-2 rounded-md border px-2.5 text-xs font-medium transition ${open ? "border-accent/40 bg-accent/8 text-lime-200" : "border-line text-muted hover:border-neutral-500 hover:text-ink"}`}
                    >
                        {open ? <FiX aria-hidden="true" /> : <FiEdit2 aria-hidden="true" />}
                        {open ? t("admin.common.close") : t("admin.common.manageAccess")}
                    </button>
                </div>
            </div>

            {open && (
                <div className="mt-4 border-t border-line pt-4">
                    <form action={roleAction} className="grid gap-3 sm:grid-cols-[minmax(130px,0.8fr)_minmax(160px,1fr)_auto] sm:items-end">
                        <input type="hidden" name="profileId" value={person.profileId} />
                        {nextRole === "assistant" && canManageMentorsAndGroups && <input type="hidden" name="groupIds" value="" />}
                        <Field label={t("admin.person.role")}>
                            <select name="role" value={nextRole} onChange={(event) => setNextRole(event.target.value as AdminRole)} className={selectClass}>
                                <option value="student">{t(roleLabelKeys.student)}</option>
                                <option value="assistant">{t(roleLabelKeys.assistant)}</option>
                                {canManageMentorsAndGroups && <option value="mentor">{t(roleLabelKeys.mentor)}</option>}
                            </select>
                        </Field>
                        {nextRole === "mentor" ? (
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-muted">{role === "mentor" ? t("admin.person.ownedGroups") : t("admin.person.currentGroups")}</p>
                                <div className="mt-1.5 flex min-h-11 flex-wrap items-center gap-1.5 rounded-md border border-line bg-canvas px-3 py-2">
                                    {person.groupNames?.length ? person.groupNames.map((groupName) => (
                                        <span key={groupName} className="rounded-sm border border-line px-2 py-1 text-[11px] text-muted">{groupName}</span>
                                    )) : <span className="text-xs text-faint">{t("admin.person.noGroupsOwned")}</span>}
                                </div>
                            </div>
                        ) : nextRole === "assistant" && canManageMentorsAndGroups ? (
                            <fieldset className="min-w-0">
                                <legend className="text-xs font-medium text-muted">{t("admin.person.assignedGroupsOptional")}</legend>
                                {(groups.length > 6 || groupSearch) && (
                                    <input
                                        type="search"
                                        value={groupSearch}
                                        onChange={(event) => setGroupSearch(event.target.value)}
                                        placeholder={t("admin.common.searchGroupsPlaceholder")}
                                        aria-label={t("admin.person.searchAssignedGroupsAria")}
                                        className={fieldClass}
                                    />
                                )}
                                <div className="mt-1.5 max-h-32 space-y-1 overflow-y-auto rounded-md border border-line bg-canvas p-2">
                                    {groups.map((group) => (
                                        <label key={group.id} hidden={!matchingGroupIds.has(group.id)} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs text-muted hover:bg-surface">
                                            <input
                                                type="checkbox"
                                                name="groupIds"
                                                value={group.id}
                                                checked={selectedGroupIds.includes(group.id)}
                                                onChange={(event) => setSelectedGroupIds((current) => event.target.checked
                                                    ? [...current, group.id]
                                                    : current.filter((id) => id !== group.id))}
                                                className="accent-lime-300"
                                            />
                                            {group.name}
                                        </label>
                                    ))}
                                    {groups.length === 0 && <p className="px-2 py-1 text-xs text-faint">{t("admin.common.createGroupFirst")}</p>}
                                    {groups.length > 0 && matchingGroups.length === 0 && <p className="px-2 py-1 text-xs text-faint">{t("admin.common.noGroupsMatch")}</p>}
                                </div>
                            </fieldset>
                        ) : nextRole === "assistant" ? (
                            <p className="self-center text-xs leading-5 text-faint">{t("admin.person.groupAssignmentsManagedByMentors")}</p>
                        ) : (
                            <Field label={t("admin.person.groupAssignment")}>
                                <select name="groupId" defaultValue={(person.groupId ?? selectedGroupIds[0])?.toString() ?? ""} className={selectClass}>
                                    <option value="">{t("admin.common.noGroup")}</option>
                                    {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
                                </select>
                            </Field>
                        )}
                        <button type="submit" disabled={rolePending} className="btn btn-primary h-11">
                            {rolePending ? t("admin.common.saving") : t("admin.common.saveChanges")}
                        </button>
                        <div className="sm:col-span-3"><Feedback state={roleState} /></div>
                    </form>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line/80 pt-3">
                        <p className="max-w-xl text-xs leading-5 text-faint">
                            {person.status === "active"
                                ? t("admin.person.deactivateDescription")
                                : t("admin.person.reactivateDescription")}
                        </p>
                        {person.status === "active" ? (
                            confirmDeactivate ? (
                                <div className="flex items-center gap-2">
                                    <button type="button" onClick={() => setConfirmDeactivate(false)} className="h-9 rounded-md px-3 text-xs text-muted transition hover:text-ink">{t("admin.common.cancel")}</button>
                                    <form action={statusAction}>
                                        <input type="hidden" name="profileId" value={person.profileId} />
                                        <input type="hidden" name="status" value="inactive" />
                                        <button type="submit" disabled={statusPending} className="inline-flex h-9 items-center gap-2 rounded-md bg-danger/15 px-3 text-xs font-semibold text-danger transition hover:bg-danger/25 disabled:opacity-50">
                                            <FiUserX aria-hidden="true" /> {statusPending ? t("admin.common.deactivating") : t("admin.person.deactivateWithName", { name: person.name?.split(" ")[0] || t("admin.person.profileFallback") })}
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <button type="button" onClick={() => setConfirmDeactivate(true)} className="inline-flex h-9 items-center gap-2 rounded-md border border-danger/20 px-3 text-xs font-medium text-danger transition hover:border-danger/50 hover:bg-danger/5">
                                    <FiUserX aria-hidden="true" /> {t("admin.common.deactivate")}
                                </button>
                            )
                        ) : (
                            <form action={statusAction}>
                                <input type="hidden" name="profileId" value={person.profileId} />
                                <input type="hidden" name="status" value="active" />
                                <button type="submit" disabled={statusPending} className="inline-flex h-9 items-center gap-2 rounded-md border border-ok/20 px-3 text-xs font-medium text-ok transition hover:border-ok/50 hover:bg-ok/5 disabled:opacity-50">
                                    <FiUserCheck aria-hidden="true" /> {statusPending ? t("admin.common.reactivating") : t("admin.common.reactivate")}
                                </button>
                            </form>
                        )}
                    </div>
                    <div className="mt-2"><Feedback state={statusState} /></div>
                </div>
            )}
        </article>
    );
}
